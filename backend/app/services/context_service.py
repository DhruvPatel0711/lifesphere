import os
import json
import logging
import asyncio
import aiofiles
from datetime import datetime, timezone
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models import (
    User, UserProfile, HealthEntry, SleepEntry, WaterLog,
    MedicalRecord, Medicine, FamilyMember, MoodEntry, JournalEntry
)

logger = logging.getLogger("lifesphere.context")
CONTEXT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "user_contexts")
MAX_RECENT_AI_INSIGHTS = 10  # Bounded memory window (FIFO)

_USER_LOCKS: Dict[str, asyncio.Lock] = {}

def _get_user_lock(user_id: str) -> asyncio.Lock:
    """Returns an async Lock for a specific user to prevent file write collisions."""
    if user_id not in _USER_LOCKS:
        _USER_LOCKS[user_id] = asyncio.Lock()
    return _USER_LOCKS[user_id]


async def generate_user_context_txt(user_id: str, db: AsyncSession) -> str:
    """
    Generates an ultra-compact plain text medical context file for a user.
    Preserves any existing AI Clinical Insights & Memory section.
    Saves to backend/user_contexts/{user_id}.txt and returns the formatted text string.
    """
    os.makedirs(CONTEXT_DIR, exist_ok=True)

    if not user_id:
        return ""

    lock = _get_user_lock(user_id)
    async with lock:
        # Preserve existing AI insights if present
        existing_insights = []
        file_path = os.path.join(CONTEXT_DIR, f"{user_id}.txt")
        if os.path.exists(file_path):
            try:
                async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                    content = await f.read()
                    if "=== AI CLINICAL INSIGHTS & MEMORY ===" in content:
                        parts = content.split("=== AI CLINICAL INSIGHTS & MEMORY ===")
                        if len(parts) > 1:
                            insight_lines = [l.strip() for l in parts[1].strip().split("\n") if l.strip()]
                            existing_insights = insight_lines[-MAX_RECENT_AI_INSIGHTS:]
            except Exception as e:
                logger.warning("Could not preserve existing AI insights for %s: %s", user_id, e)

        # 1. Fetch User & Profile
        try:
            user_res = await db.execute(select(User).where(User.id == user_id))
            user = user_res.scalar_one_or_none()
            if not user:
                return ""

            profile_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
            profile = profile_res.scalar_one_or_none()

            lines = []
            
            # Header line
            name = (profile.name if profile and profile.name else None) or getattr(user, 'full_name', None) or user.email or "Patient"
            age = f"{profile.age}y" if profile and profile.age else "Age N/A"
            gender = profile.gender if profile and profile.gender else "Gender N/A"
            blood = f"Blood: {profile.blood_type}" if profile and profile.blood_type else ""
            lines.append(f"=== PATIENT PROFILE: {name} ({gender}, {age}, {blood}) ===")

            conds = []
            if profile:
                for c in [profile.allergies, profile.conditions, profile.chronic_conditions]:
                    if c:
                        if isinstance(c, list):
                            conds.extend([str(item) for item in c if item])
                        else:
                            conds.append(str(c))
            if conds:
                lines.append(f"Medical Conditions & Allergies: {', '.join(conds)}")

            # Vitals Baseline & Trackers
            vitals = []
            # Latest BP
            bp_res = await db.execute(
                select(HealthEntry)
                .where(HealthEntry.user_id == user_id, HealthEntry.category == "blood_pressure")
                .order_by(desc(HealthEntry.recorded_at))
                .limit(1)
            )
            bp = bp_res.scalar_one_or_none()
            if bp:
                bp_val = f"{bp.value}/{bp.secondary_value}" if bp.secondary_value else f"{bp.value}"
                vitals.append(f"BP: {bp_val} mmHg")

            # Latest Sugar
            sugar_res = await db.execute(
                select(HealthEntry)
                .where(HealthEntry.user_id == user_id, HealthEntry.category == "blood_sugar")
                .order_by(desc(HealthEntry.recorded_at))
                .limit(1)
            )
            sugar = sugar_res.scalar_one_or_none()
            if sugar:
                vitals.append(f"Blood Sugar: {sugar.value} mg/dL")

            # Latest Weight
            weight_res = await db.execute(
                select(HealthEntry)
                .where(HealthEntry.user_id == user_id, HealthEntry.category == "weight")
                .order_by(desc(HealthEntry.recorded_at))
                .limit(1)
            )
            wt = weight_res.scalar_one_or_none()
            if wt:
                vitals.append(f"Weight: {wt.value} kg")

            # Latest Sleep
            sleep_res = await db.execute(
                select(SleepEntry)
                .where(SleepEntry.user_id == user_id)
                .order_by(desc(SleepEntry.date))
                .limit(1)
            )
            sl = sleep_res.scalar_one_or_none()
            if sl:
                vitals.append(f"Sleep: {sl.hours}h ({sl.quality or 'Normal'})")

            if vitals:
                lines.append(f"Vitals Baseline: {' | '.join(vitals)}")

            # Active Medications
            meds_res = await db.execute(select(Medicine).where(Medicine.user_id == user_id, Medicine.is_active == True))
            meds = meds_res.scalars().all()
            if meds:
                med_strs = [f"{m.name} ({m.dosage or ''}, {m.frequency or 'daily'})".strip() for m in meds]
                lines.append(f"Active Medications: {', '.join(med_strs)}")

            # Medical Records Summary
            recs_res = await db.execute(select(MedicalRecord).where(MedicalRecord.user_id == user_id).order_by(desc(MedicalRecord.created_at)).limit(3))
            recs = recs_res.scalars().all()
            if recs:
                rec_strs = []
                for r in recs:
                    summary_snippet = (getattr(r, 'findings', None) or r.notes or r.title or "Record").replace("\n", " ").strip()
                    if len(summary_snippet) > 75:
                        summary_snippet = summary_snippet[:75] + "..."
                    rec_strs.append(f"{r.title or 'Record'}: {summary_snippet}")
                lines.append(f"Recent Lab Reports: {' | '.join(rec_strs)}")

            # Family History
            fam_res = await db.execute(select(FamilyMember).where(FamilyMember.user_id == user_id))
            fam = fam_res.scalars().all()
            if fam:
                fam_strs = [f"{f.name} ({f.relation}, {f.conditions or 'Healthy'})" for f in fam]
                lines.append(f"Family History: {' | '.join(fam_strs)}")

            # Recent Mood / Journal
            mood_res = await db.execute(select(MoodEntry).where(MoodEntry.user_id == user_id).order_by(desc(MoodEntry.created_at)).limit(1))
            m_entry = mood_res.scalar_one_or_none()
            if m_entry:
                score_val = getattr(m_entry, 'mood_score', None) or getattr(m_entry, 'score', 5)
                lines.append(f"Current Mood: {m_entry.mood} ({score_val}/10)")

            # Append Preserved AI Insights
            if existing_insights:
                lines.append("\n=== AI CLINICAL INSIGHTS & MEMORY ===")
                lines.extend(existing_insights)

            context_txt = "\n".join(lines).strip()

            # Save to disk using aiofiles
            async with aiofiles.open(file_path, "w", encoding="utf-8") as f:
                await f.write(context_txt)

            return context_txt
        except Exception as e:
            logger.error("Error generating user context txt for %s: %s", user_id, e)
            return ""


async def get_user_context_txt(user_id: str, db: AsyncSession) -> str:
    """
    Reads user_contexts/{user_id}.txt from disk.
    If missing or empty, generates it on the fly.
    """
    if not user_id:
        return ""

    file_path = os.path.join(CONTEXT_DIR, f"{user_id}.txt")
    if os.path.exists(file_path):
        try:
            async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                content = (await f.read()).strip()
                if content:
                    return content
        except Exception:
            pass

    return await generate_user_context_txt(user_id, db)


async def append_ai_insight(user_id: str, feature: str, insight: str, db: AsyncSession, memory_classification: str = None) -> None:
    """
    Appends a verified clinical memory insight to user_contexts/{user_id}.txt.
    Maintains a bounded memory window (max 10 recent insights).
    Thread-safe and non-blocking using per-user asyncio.Lock and aiofiles.
    Applies structured memory classification.
    """
    if not user_id or not insight or len(insight.strip()) < 5:
        return

    # Strip delimiter injections
    clean_insight = insight.replace("===", "").replace("\n", " ").strip()
    
    # 1. Determine classification
    if not memory_classification:
        if feature == "report_parser" or feature == "report_parser_vision":
            memory_classification = "DOCUMENT_FACT"
        else:
            memory_classification = "AI_OBSERVATION"

    # 2. Check for explicit speculation markers
    lowered = clean_insight.lower()
    speculation_markers = ["might", "could be", "possibly", "maybe", "suspect", "i think", "unclear", "no information"]
    if any(marker in lowered for marker in speculation_markers) and memory_classification != "DOCUMENT_FACT":
        memory_classification = "REJECTED:SPECULATION"

    # 3. If rejected, do not persist to memory
    if memory_classification.startswith("REJECTED"):
        return

    # Limit insight string length
    if len(clean_insight) > 200:
        clean_insight = clean_insight[:197] + "..."

    timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    entry_line = f"[{timestamp_str} - {feature.upper()}] [{memory_classification}] {clean_insight}"

    os.makedirs(CONTEXT_DIR, exist_ok=True)
    file_path = os.path.join(CONTEXT_DIR, f"{user_id}.txt")

    lock = _get_user_lock(user_id)
    async with lock:
        try:
            content = ""
            if os.path.exists(file_path):
                async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                    content = await f.read()

            base_content = content
            insights = []

            if "=== AI CLINICAL INSIGHTS & MEMORY ===" in content:
                parts = content.split("=== AI CLINICAL INSIGHTS & MEMORY ===")
                base_content = parts[0].strip()
                if len(parts) > 1:
                    insights = [l.strip() for l in parts[1].strip().split("\n") if l.strip()]

            # Add new insight and enforce bounded limit
            insights.append(entry_line)
            if len(insights) > MAX_RECENT_AI_INSIGHTS:
                insights = insights[-MAX_RECENT_AI_INSIGHTS:]

            updated_lines = [base_content, "\n=== AI CLINICAL INSIGHTS & MEMORY ==="] + insights
            updated_content = "\n".join(updated_lines).strip()

            async with aiofiles.open(file_path, "w", encoding="utf-8") as f:
                await f.write(updated_content)

            logger.info("Appended AI insight for user %s (%s): %s", user_id, feature, clean_insight)
        except Exception as e:
            logger.error("Failed to append AI insight for user %s: %s", user_id, e)


async def log_ai_trigger_event(
    user_id: str,
    feature: str,
    model: str,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    response_time_ms: int = 0,
    status: str = "success",
    error: str = None
) -> None:
    """
    Logs an AI trigger event to a JSONL telemetry file for the user.
    No PHI (input_summary/output_summary/secret_context) is stored.
    Implements 1MB log rotation.
    """
    if not user_id:
        return

    os.makedirs(TELEMETRY_DIR, exist_ok=True)
    log_file = os.path.join(TELEMETRY_DIR, f"{user_id}_triggers.jsonl")

    # Rotate file if > 1MB
    try:
        if os.path.exists(log_file) and os.path.getsize(log_file) > 1024 * 1024:
            timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            rotated_file = os.path.join(TELEMETRY_DIR, f"{user_id}_triggers_{timestamp_str}.jsonl.old")
            os.rename(log_file, rotated_file)
            
            # Keep max 3 old files
            old_files = sorted([f for f in os.listdir(TELEMETRY_DIR) if f.startswith(f"{user_id}_triggers_") and f.endswith(".jsonl.old")])
            while len(old_files) > 3:
                os.remove(os.path.join(TELEMETRY_DIR, old_files.pop(0)))
    except Exception as e:
        logger.error(f"Failed to rotate telemetry log for {user_id}: {e}")

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "feature": feature,
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "response_time_ms": response_time_ms,
        "status": status,
        "error": error
    }

    lock = _get_user_lock(user_id)
    async with lock:
        try:
            async with aiofiles.open(log_file, "a", encoding="utf-8") as f:
                await f.write(json.dumps(event) + "\n")
        except Exception as e:
            logger.error("Failed to write telemetry trigger for user %s: %s", user_id, e)

