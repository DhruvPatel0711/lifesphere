"""
LifeSphere Backend — Medical Records Router
CRUD + file upload + AI summary.
"""

import os
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.exceptions import NotFoundException
from app.models.medical_record import MedicalRecord
from app.models.family import FamilyMember
from app.schemas.medical_record import RecordCreate, RecordResponse, RecordUpdate, RecordCompareRequest
from app.services import file_service, ai_service
from app.services.ai_service import generate_vision_json_response

router = APIRouter(prefix="/records", tags=["Medical Records"])


@router.get("", response_model=list[RecordResponse])
async def list_records(
    user_id: CurrentUserId,
    category: str | None = None,
    search: str | None = None,
    family_member_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List medical records with optional filtering."""
    query = select(MedicalRecord).where(MedicalRecord.user_id == user_id, MedicalRecord.is_deleted == False)
    if category and category != "all":
        query = query.where(MedicalRecord.category == category)
        
    if family_member_id and family_member_id != "all" and family_member_id != "self":
        # Validate that family_member_id belongs to current_user
        member_check = await db.execute(
            select(FamilyMember.id).where(FamilyMember.id == family_member_id, FamilyMember.user_id == user_id)
        )
        if not member_check.scalar_one_or_none():
            return []  # Unowned family member ID -> return empty records list safely
        query = query.where(MedicalRecord.family_member_id == family_member_id)
    elif family_member_id == "all":
        pass  # All records for this user (both self and family)
    else:
        # Default or "self": return primary user records
        query = query.where(MedicalRecord.family_member_id.is_(None))

    query = query.order_by(MedicalRecord.created_at.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    if search:
        q = search.lower()
        records = [r for r in records if q in (r.title or "").lower() or q in (r.doctor or "").lower() or q in (r.hospital or "").lower()]

    return records


@router.get("/{record_id}", response_model=RecordResponse)
async def get_record(record_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get a single medical record."""
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id, MedicalRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("Medical record", record_id)
    return record


@router.post("", response_model=RecordResponse, status_code=201)
async def create_record(
    user_id: CurrentUserId,
    title: str = Form(...),
    category: str = Form(...),
    doctor: str = Form(""),
    hospital: str = Form(""),
    date: str = Form(None),
    findings: str = Form(None),
    notes: str = Form(None),
    family_member_id: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Create a medical record with optional file upload."""
    file_path = None
    if file and file.filename:
        file_path = await file_service.save_upload_file(file, user_id)

    parsed_date = None
    if date:
        from datetime import datetime
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            parsed_date = None
    if family_member_id:
        member_check = await db.execute(
            select(FamilyMember.id).where(FamilyMember.id == family_member_id, FamilyMember.user_id == user_id)
        )
        if not member_check.scalar_one_or_none():
            raise NotFoundException("Family member", family_member_id)

    record = MedicalRecord(
        user_id=user_id,
        title=title,
        category=category,
        doctor=doctor,
        hospital=hospital,
        date=parsed_date,
        findings=findings,
        notes=notes,
        file_path=file_path,
        family_member_id=family_member_id,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    await db.commit()
    return record


@router.put("/{record_id}", response_model=RecordResponse)
async def update_record(
    record_id: str, data: RecordUpdate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    """Update a medical record."""
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id, MedicalRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("Medical record", record_id)

    update_data = data.model_dump(exclude_unset=True)
    if "date" in update_data and isinstance(update_data["date"], str):
        from datetime import datetime
        try:
            update_data["date"] = datetime.strptime(update_data["date"], "%Y-%m-%d").date()
        except ValueError:
            pass # fallback to whatever string it is, or let it fail naturally

    for key, value in update_data.items():
        setattr(record, key, value)
    await db.flush()
    await db.commit()
    return record


@router.delete("/{record_id}")
async def delete_record(record_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Delete a medical record."""
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id, MedicalRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("Medical record", record_id)

    if record.file_path:
        file_service.delete_file(record.file_path)

    await db.delete(record)
    await db.flush()
    await db.commit()
    return {"success": True, "message": "Record deleted"}


@router.post("/{record_id}/ai-summary")
async def ai_record_summary(record_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Generate an AI summary of a medical record."""
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id, MedicalRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("Medical record", record_id)

    extracted_text = ""
    if record.file_path:
        try:
            import fitz
            full_path = file_service.get_file_path(record.file_path)
            if full_path:
                doc = fitz.open(str(full_path))
                for page in doc:
                    extracted_text += page.get_text()
                doc.close()
        except Exception:
            pass

    FORMATTING_PROMPT = """
Format your response following these rules:
1. Never return plain text paragraphs. Always use Markdown (headings, bold, lists, tables).
2. Structure the report professionally with sections like Patient Information, Test Results (in a table with Normal Ranges and Status), Key Findings, Recommendations, and Conclusion.
3. Highlight abnormal values using 🔴 (Low/High/High Risk), 🟠 (Moderate), 🟡 (Slightly Abnormal), and ✅ (Normal).
4. Do not output raw JSON. Use clean GitHub-flavored Markdown.
"""

    prompt = f"Summarize this medical record:\nTitle: {record.title}\nCategory: {record.category}\nDoctor: {record.doctor}\nHospital: {record.hospital}\nFindings: {record.findings or 'None'}\nNotes: {record.notes or 'None'}"
    if extracted_text.strip():
        prompt += f"\n\nDocument Text:\n{extracted_text[:6000]}"
    
    prompt += "\n\n" + FORMATTING_PROMPT
        
    summary = await ai_service.generate_ai_response("assistant", prompt)

    return {
        "record_id": record.id,
        "summary": summary,
        "disclaimer": "This is an AI-generated summary. Always consult your doctor for medical advice.",
    }


@router.post("/compare")
async def compare_records(data: RecordCompareRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Compare two medical records using AI."""
    r1 = await db.execute(select(MedicalRecord).where(MedicalRecord.id == data.record_id_1, MedicalRecord.user_id == user_id))
    r2 = await db.execute(select(MedicalRecord).where(MedicalRecord.id == data.record_id_2, MedicalRecord.user_id == user_id))
    record1 = r1.scalar_one_or_none()
    record2 = r2.scalar_one_or_none()

    if not record1 or not record2:
        raise NotFoundException("One or both records not found")

    def extract_text(r):
        text = ""
        if r.file_path:
            try:
                import pymupdf as fitz
                full_path = file_service.get_file_path(r.file_path)
                if full_path:
                    doc = fitz.open(str(full_path))
                    for page in doc:
                        text += page.get_text()
                    doc.close()
            except Exception:
                pass
        return text

    t1 = extract_text(record1)
    t2 = extract_text(record2)

    FORMATTING_PROMPT = """
Format your response following these rules:
1. Never return plain text paragraphs. Always use Markdown (headings, bold, lists, tables).
2. Structure the comparison professionally, using tables to compare values between the two records.
3. Highlight abnormal values or significant changes using 🔴 (High Risk/Worse), 🟠 (Moderate), 🟡 (Slightly Abnormal), and ✅ (Normal/Improved).
4. Do not output raw JSON. Use clean GitHub-flavored Markdown.
"""

    prompt = f"Compare these two medical records:\n\nRecord 1: {record1.title} ({record1.date}) - {record1.findings}\n"
    if t1.strip():
        prompt += f"Document Text 1:\n{t1[:3000]}\n"
        
    prompt += f"\nRecord 2: {record2.title} ({record2.date}) - {record2.findings}\n"
    if t2.strip():
        prompt += f"Document Text 2:\n{t2[:3000]}\n"
        
    prompt += "\nProvide a comparison and highlight any significant changes.\n\n" + FORMATTING_PROMPT
    
    comparison = await ai_service.generate_ai_response("assistant", prompt)

    return {
        "record_1": {"id": record1.id, "title": record1.title, "date": str(record1.date), "findings": record1.findings},
        "record_2": {"id": record2.id, "title": record2.title, "date": str(record2.date), "findings": record2.findings},
        "comparison": comparison,
    }


# ─── Metric-to-category mapping ─────────────────────────────────────

METRIC_CATEGORY_MAP = {
    "blood sugar": "blood_sugar",
    "glucose": "blood_sugar",
    "fasting glucose": "blood_sugar",
    "random glucose": "blood_sugar",
    "hba1c": "blood_sugar",
    "cholesterol": "cholesterol",
    "total cholesterol": "cholesterol",
    "hdl": "cholesterol",
    "ldl": "cholesterol",
    "triglycerides": "cholesterol",
    "weight": "weight",
    "heart rate": "heart_rate",
    "pulse": "heart_rate",
    "systolic": "blood_pressure",
    "diastolic": "blood_pressure",
    "blood pressure": "blood_pressure",
}


@router.post("/upload-ai")
async def upload_and_parse_report(
    user_id: CurrentUserId,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a medical report (PDF, PNG, JPG, JPEG, WEBP, TXT).
    Extracts text / renders scanned images, sends to AI for metric & metadata extraction without hardcoded fallbacks,
    then auto-creates MedicalRecord and HealthEntry items, updating user context memory & telemetry.
    """
    import logging
    from datetime import datetime, timezone, date as date_type
    from app.services import doc_processing_service

    logger = logging.getLogger("lifesphere.report_parser")

    if not file.filename:
        return {"success": False, "error": "No file provided."}

    try:
        # --- 1. Save the uploaded file ---
        file_path = await file_service.save_upload_file(file, user_id)
        full_path = file_service.get_file_path(file_path)
        if not full_path or not os.path.exists(full_path):
            return {"success": False, "error": "Saved file not found on disk."}

        # --- 2. Extract content via Document Processing Service ---
        doc_res = await doc_processing_service.extract_file_content(str(full_path), file.filename)
        if not doc_res.get("success"):
            return {"success": False, "error": doc_res.get("error", "Failed to extract file content.")}

        extracted_text = doc_res.get("text", "")
        images = doc_res.get("images", [])

        # --- 3. Prompt AI for Dynamic Extraction (NO Hardcoded Fallbacks) ---
        prompt = (
            "Analyze the following medical report content extracted from a user file.\n"
            "Return ONLY a JSON object with the following exact keys:\n"
            "- \"title\": Clean, specific diagnostic title based on document heading (e.g. \"Complete Blood Count\", \"Lipid Profile Test\", \"Lumbar Spine MRI\", \"Prescription Note\")\n"
            "- \"category\": One of [\"Blood Test\", \"Imaging\", \"Prescription\", \"Pathology\", \"Cardiology\", \"Surgery\", \"Vaccination\", \"Other\"]\n"
            "- \"doctor\": Exact Doctor or Physician name if mentioned in text/image (e.g. \"Dr. Sarah Jenkins\"). If NOT explicitly present, return null or empty string \"\". Do NOT invent or hardcode placeholder names.\n"
            "- \"hospital\": Exact Hospital, Clinic, or Laboratory name if mentioned in text/image (e.g. \"Apollo Diagnostics\"). If NOT explicitly present, return null or empty string \"\". Do NOT invent or hardcode placeholder names.\n"
            "- \"date\": The exact date of the document/report (e.g. collection date, test date, issue date) formatted as YYYY-MM-DD. If NO explicit date exists, return null. Do NOT invent a date.\n"
            "- \"findings\": Concise 1-2 sentence clinical summary of findings and diagnostic results.\n"
            "- \"metrics\": Dictionary of numeric health metrics found (e.g. {\"hemoglobin\": 14.2, \"blood_sugar\": 105, \"cholesterol\": 190, \"systolic\": 120, \"diastolic\": 80}). Extract numbers only.\n"
            "- \"secret_context\": A concise 1-sentence clinical takeaway to save into the patient's long-term medical history (e.g. \"Uploaded CBC report: Hemoglobin 14.2 g/dL (normal).\").\n"
            "- \"memory_classification\": Assign exactly one of: DOCUMENT_FACT, USER_REPORTED, AI_OBSERVATION, or SPECULATION.\n\n"
        )

        if extracted_text and len(extracted_text) > 40:
            prompt += f"Report Document Text:\n{extracted_text[:6000]}\n"
            parsed_res = await ai_service.generate_json_response("report_parser", prompt, user_id=user_id)
        elif images:
            prompt += f"Report Document Image: Scanned report image uploaded ({file.filename}). Extract available headers and findings.\n"
            parsed_res = await ai_service.generate_vision_json_response("report_parser", prompt, base64_images=images[:2], user_id=user_id)
        else:
            # Fallback if somehow both are missing
            parsed_res = await ai_service.generate_json_response("report_parser", prompt, user_id=user_id)
            
        parsed_res = parsed_res or {}

        # Safely read extracted fields (Defaulting doctor & hospital to None if missing/null)
        extracted_title = parsed_res.get("title") or f"Medical Report - {os.path.splitext(file.filename)[0]}"
        extracted_category = parsed_res.get("category") or "Other"
        extracted_doctor = parsed_res.get("doctor") if (parsed_res.get("doctor") and parsed_res.get("doctor") not in ("Attending Physician", "Doctor")) else None
        extracted_hospital = parsed_res.get("hospital") if (parsed_res.get("hospital") and parsed_res.get("hospital") not in ("Diagnostic Lab", "Hospital")) else None
        extracted_findings = parsed_res.get("findings") or (extracted_text[:300].replace("\n", " ").strip() if extracted_text else "Medical document uploaded and scanned.")
        
        extracted_date = date_type.today()
        if parsed_res.get("date"):
            try:
                extracted_date = datetime.strptime(parsed_res.get("date"), "%Y-%m-%d").date()
            except Exception:
                pass
        metrics = parsed_res.get("metrics") if isinstance(parsed_res.get("metrics"), dict) else {}

        if not metrics and isinstance(parsed_res, dict):
            metrics = {k: v for k, v in parsed_res.items() if k not in ("title", "category", "doctor", "hospital", "findings", "secret_context") and isinstance(v, (int, float))}

        # --- 4. Create MedicalRecord DB Entity ---
        record = MedicalRecord(
            user_id=user_id,
            title=extracted_title,
            category=extracted_category,
            doctor=extracted_doctor or "",
            hospital=extracted_hospital or "",
            date=extracted_date,
            findings=extracted_findings,
            notes=f"Auto-parsed document ({file.filename}). {len(metrics)} metrics extracted.",
            file_path=file_path,
        )
        db.add(record)
        await db.flush()

        # --- 5. Create HealthEntry Items for Numeric Metrics ---
        from app.models.health_tracker import HealthEntry
        now = datetime.now(timezone.utc)
        today_label = now.strftime("%b")
        entries_created = 0

        systolic = None
        diastolic = None

        for metric_name, value in metrics.items():
            if not isinstance(value, (int, float)):
                try:
                    value = float(value)
                except (ValueError, TypeError):
                    continue

            key = metric_name.lower().strip()
            if key in ("systolic", "systolic bp", "systolic blood pressure"):
                systolic = value
                continue
            if key in ("diastolic", "diastolic bp", "diastolic blood pressure"):
                diastolic = value
                continue

            category = None
            for pattern, cat in METRIC_CATEGORY_MAP.items():
                if pattern in key:
                    category = cat
                    break

            if category and category != "blood_pressure":
                # Check for duplicates on the same day
                existing = await db.execute(select(HealthEntry).where(
                    HealthEntry.user_id == user_id,
                    HealthEntry.category == category,
                    HealthEntry.value == value
                ))
                is_dup = any(e.recorded_at and e.recorded_at.date() == now.date() for e in existing.scalars().all())
                
                if not is_dup:
                    entry = HealthEntry(
                        user_id=user_id,
                        category=category,
                        value=value,
                        label=today_label,
                        recorded_at=now,
                    )
                    db.add(entry)
                    entries_created += 1

        if systolic is not None and diastolic is not None:
            existing_bp = await db.execute(select(HealthEntry).where(
                HealthEntry.user_id == user_id,
                HealthEntry.category == "blood_pressure",
                HealthEntry.value == systolic,
                HealthEntry.secondary_value == diastolic
            ))
            is_bp_dup = any(e.recorded_at and e.recorded_at.date() == now.date() for e in existing_bp.scalars().all())
            
            if not is_bp_dup:
                bp_entry = HealthEntry(
                    user_id=user_id,
                    category="blood_pressure",
                    value=systolic,
                    secondary_value=diastolic,
                    label=today_label,
                    recorded_at=now,
                )
                db.add(bp_entry)
                entries_created += 1

        await db.flush()
        await db.commit()

        # Sync master user context file
        try:
            from app.services.context_service import generate_user_context_txt
            await generate_user_context_txt(user_id, db)
        except Exception as e:
            logger.error("Failed to auto-sync user context txt: %s", e)

        return {
            "success": True,
            "record_id": record.id,
            "title": record.title,
            "category": record.category,
            "doctor": record.doctor if record.doctor else None,
            "hospital": record.hospital if record.hospital else None,
            "findings": record.findings,
            "metrics_extracted": len(metrics),
            "metrics": metrics,
            "health_entries_created": entries_created,
            "message": f"Successfully parsed '{record.title}'!",
        }

    except Exception as e:
        logger.exception("upload-ai endpoint failed unexpectedly")
        return {"success": False, "error": f"Server error: {str(e)}"}



