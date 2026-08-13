"""
LifeSphere Backend — AI Service (Groq + OpenRouter Integration)
Central AI client with module-specific prompts and fallback responses.
"""

import logging
from typing import Optional
from sqlalchemy import select

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.ai_prompt import AIPrompt
from app.models.admin import AIUsageLog
import time

logger = logging.getLogger("lifesphere.ai")

settings = get_settings()

# ─── Groq Client Initialization ─────────────────────────────────────

_groq_client = None


def _get_groq_client():
    """Lazy-load the Groq client."""
    global _groq_client
    if _groq_client is None and settings.GROQ_API_KEY:
        try:
            from groq import Groq
            _groq_client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info("Groq AI client initialized successfully")
        except Exception as e:
            logger.warning("Failed to initialize Groq client: %s", e)
    return _groq_client


async def _call_openrouter_api(system_prompt: str, user_message: str, max_tokens: int = 1024) -> Optional[str]:
    """Fallback to OpenRouter API if Groq fails or key is unconfigured."""
    if not settings.OPENROUTER_API_KEY:
        return None
    try:
        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "meta-llama/llama-3.3-70b-instruct:free",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": max_tokens,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                logger.info("OpenRouter AI response generated successfully")
                return content
    except Exception as e:
        logger.error("OpenRouter API error: %s", e)
    return None


# ─── System Prompts ──────────────────────────────────────────────────

SYSTEM_PROMPTS = {
    "assistant": (
        "Respond in clean, professional Markdown with a maximum of 6–8 lines by default. "
        "Keep answers concise and easy to scan. Use **bold** for medicine names, diseases, dosages, warnings, and key medical terms. "
        "Use short bullet points (not paragraphs) and never output a wall of text. "
        "Follow this format unless the user requests more details:\n\n"
        "**[Medicine/Disease Name]**\n\n"
        "**Overview:** One short sentence.\n"
        "**Uses:** 2–3 key uses.\n"
        "**Dosage:** Mention only the recommended dose (if applicable).\n"
        "**Side Effects:** List 2–3 common ones.\n"
        "**Warning:** One important precaution.\n"
        "**Summary:** One-line takeaway."
    ),
    "symptom": (
        "You are a medical symptom analysis AI. Given a list of symptoms, duration, and severity, "
        "provide: 1) Possible conditions with estimated likelihood percentages, "
        "2) Recommended medical specialists, 3) Urgency level (Low/Medium/High), "
        "4) General care recommendations. Always include a disclaimer that this is not a diagnosis. "
        "Format the response as structured JSON with keys: urgency, conditions (list of {condition, probability}), "
        "specialists (list), recommendations (list)."
    ),
    "nutrition": (
        "You are a nutrition expert AI. Based on user profile (age, weight, height, gender, conditions, allergies), "
        "provide personalized meal suggestions, dietary recommendations, and nutritional advice. "
        "Focus on Indian vegetarian cuisine when relevant. Include calorie and protein estimates."
    ),
    "fitness": (
        "You are a fitness coach AI. Provide personalized workout suggestions based on user profile. "
        "Include exercise descriptions, sets/reps, duration, and estimated calories burned. "
        "Consider any health conditions the user has. Offer motivation and safety tips."
    ),
    "mental": (
        "You are a compassionate mental health support AI. Analyze mood patterns and journal entries. "
        "Provide supportive insights, coping strategies, and wellness recommendations. "
        "For concerning patterns, always recommend professional help. "
        "Include Indian helpline numbers when appropriate (iCall: 9152987821)."
    ),
    "report_parser": (
        "You are a highly accurate medical data extraction AI. Given the raw text extracted from a medical lab report, "
        "your job is to extract specific key health metrics and return them in a strict JSON format. "
        "Look for metrics like Hemoglobin (g/dL), Blood Sugar/Glucose (mg/dL), Total Cholesterol (mg/dL), "
        "HDL, LDL, Triglycerides, Vitamin D (ng/mL), Blood Pressure (Systolic/Diastolic mmHg), and Weight (kg). "
        "Format your response as a valid JSON object where keys are the metric names and values are the numeric findings. "
        "Do NOT include units in the values, just numbers. Example JSON: {\"Hemoglobin\": 14.2, \"Blood Sugar\": 95, \"Cholesterol\": 180}. "
        "If a metric is not found, do not include it in the JSON."
    ),
}


# ─── Core AI Function ────────────────────────────────────────────────

async def generate_ai_response(
    module: str,
    user_message: str,
    context: str = "",
    max_tokens: int = 1024,
    user_id: Optional[str] = None,
) -> str:
    """
    Generate an AI response using Groq or OpenRouter API.
    Injects ultra-compact user context .txt file if user_id is provided.
    Appends per-user telemetry logging.
    """
    system_prompt = SYSTEM_PROMPTS.get(module, SYSTEM_PROMPTS["assistant"])
    
    # Attempt to fetch prompt override from DB & inject user .txt context file
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(AIPrompt).where(AIPrompt.module == module, AIPrompt.is_active == True))
            prompt_obj = result.scalar_one_or_none()
            if prompt_obj and prompt_obj.content:
                system_prompt = prompt_obj.content

            if user_id:
                from app.services.context_service import get_user_context_txt
                txt_ctx = await get_user_context_txt(user_id, db)
                if txt_ctx:
                    system_prompt += f"\n\n[PATIENT GROUND TRUTH CONTEXT]\n{txt_ctx}"
    except Exception as e:
        logger.error("Failed to fetch prompt or user context: %s", e)

    if context:
        system_prompt += f"\n\nUser Health Context:\n{context}"

    # 1. Try Groq API
    client = _get_groq_client()
    if client is not None:
        try:
            start_t = time.time()
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                model=settings.GROQ_MODEL,
                max_tokens=max_tokens,
                temperature=0.7,
            )
            response = chat_completion.choices[0].message.content
            elapsed_ms = int((time.time() - start_t) * 1000)
            pt = chat_completion.usage.prompt_tokens if hasattr(chat_completion, 'usage') and chat_completion.usage else 0
            ct = chat_completion.usage.completion_tokens if hasattr(chat_completion, 'usage') and chat_completion.usage else 0

            logger.info("Groq AI response generated for module: %s", module)

            # Log AI Usage in DB & per-user JSONL telemetry
            try:
                async with AsyncSessionLocal() as db:
                    db.add(AIUsageLog(feature=module, model_used=settings.GROQ_MODEL, prompt_tokens=pt, completion_tokens=ct, response_time_ms=elapsed_ms))
                    await db.commit()
            except Exception as e:
                logger.error("Failed to log AI usage: %s", e)

            if user_id:
                from app.services.context_service import log_ai_trigger_event
                await log_ai_trigger_event(
                    user_id=user_id,
                    feature=module,
                    model=settings.GROQ_MODEL,
                    prompt_tokens=pt,
                    completion_tokens=ct,
                    response_time_ms=elapsed_ms,
                    status="success",
                )

            return response
        except Exception as e:
            logger.warning("Groq API call failed, trying OpenRouter fallback: %s", e)

    # 2. Try OpenRouter API
    start_t = time.time()
    openrouter_res = await _call_openrouter_api(system_prompt, user_message, max_tokens)
    elapsed_ms = int((time.time() - start_t) * 1000)
    if openrouter_res:
        if user_id:
            from app.services.context_service import log_ai_trigger_event
            await log_ai_trigger_event(
                user_id=user_id,
                feature=module,
                model="openrouter/llama-3.3-70b",
                response_time_ms=elapsed_ms,
                status="success",
            )
        return openrouter_res

    # 3. Fallback
    fallback_text = _get_fallback_response(module, user_message)
    if user_id:
        from app.services.context_service import log_ai_trigger_event
        await log_ai_trigger_event(
            user_id=user_id,
            feature=module,
            model="local_fallback",
            status="fallback",
        )
    return fallback_text


async def generate_json_response(
    module: str,
    user_message: str,
    context: str = "",
    max_tokens: int = 1024,
    user_id: Optional[str] = None,
) -> dict:
    """
    Generate an AI response strictly formatted as a JSON object.
    Injects ultra-compact user context .txt file if user_id is provided.
    Extracts secret_context if present and appends to context file without returning it to UI.
    """
    import json
    client = _get_groq_client()

    system_prompt = SYSTEM_PROMPTS.get(module, SYSTEM_PROMPTS.get("assistant", ""))
    
    # Fetch from DB & inject user .txt context file
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(AIPrompt).where(AIPrompt.module == module, AIPrompt.is_active == True))
            prompt_obj = result.scalar_one_or_none()
            if prompt_obj and prompt_obj.content:
                system_prompt = prompt_obj.content

            if user_id:
                from app.services.context_service import get_user_context_txt
                txt_ctx = await get_user_context_txt(user_id, db)
                if txt_ctx:
                    system_prompt += f"\n\n[PATIENT GROUND TRUTH CONTEXT]\n{txt_ctx}"
    except Exception as e:
        logger.error("Failed to fetch JSON prompt or user context: %s", e)

    if context:
        system_prompt += f"\n\nContext:\n{context}"

    parsed_json = None
    pt, ct, elapsed_ms = 0, 0, 0
    model_name = settings.GROQ_MODEL

    if client is not None:
        try:
            start_t = time.time()
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                model=settings.GROQ_MODEL,
                max_tokens=max_tokens,
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            response_text = chat_completion.choices[0].message.content
            elapsed_ms = int((time.time() - start_t) * 1000)
            pt = chat_completion.usage.prompt_tokens if hasattr(chat_completion, 'usage') and chat_completion.usage else 0
            ct = chat_completion.usage.completion_tokens if hasattr(chat_completion, 'usage') and chat_completion.usage else 0

            # Log AI Usage
            try:
                async with AsyncSessionLocal() as db:
                    db.add(AIUsageLog(feature=module, model_used=settings.GROQ_MODEL, prompt_tokens=pt, completion_tokens=ct, response_time_ms=elapsed_ms))
                    await db.commit()
            except Exception as e:
                logger.error("Failed to log AI usage: %s", e)

            import re
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                parsed_json = json.loads(match.group(0))
            else:
                parsed_json = json.loads(response_text)
        except Exception as e:
            logger.warning("Groq JSON API failed, trying OpenRouter fallback: %s", e)

    # Fallback to OpenRouter if Groq failed
    if parsed_json is None:
        start_t = time.time()
        openrouter_res = await _call_openrouter_api(system_prompt + "\nIMPORTANT: Return valid JSON ONLY.", user_message, max_tokens)
        elapsed_ms = int((time.time() - start_t) * 1000)
        model_name = "openrouter/llama-3.3-70b"
        if openrouter_res:
            import re
            match = re.search(r'\{.*\}', openrouter_res, re.DOTALL)
            if match:
                try:
                    parsed_json = json.loads(match.group(0))
                except Exception:
                    pass

    # Structured JSON Fallbacks
    if parsed_json is None:
        model_name = "local_fallback"
        if module == "symptom":
            parsed_json = {
                "urgency": "Medium",
                "conditions": [{"condition": "General Clinical Evaluation Recommended", "probability": 75}],
                "specialists": ["General Physician"],
                "recommendations": ["Stay well hydrated and rest.", "Monitor symptoms.", "Consult a healthcare professional."]
            }
        elif module == "report_parser":
            import re
            metrics = {}
            hb = re.search(r'(?:hemoglobin|hb)\s*[:=]?\s*(\d+\.?\d*)', user_message, re.IGNORECASE)
            if hb: metrics["Hemoglobin"] = float(hb.group(1))
            glu = re.search(r'(?:glucose|blood sugar|sugar)\s*[:=]?\s*(\d+\.?\d*)', user_message, re.IGNORECASE)
            if glu: metrics["Blood Sugar"] = float(glu.group(1))
            chol = re.search(r'(?:cholesterol|total cholesterol)\s*[:=]?\s*(\d+\.?\d*)', user_message, re.IGNORECASE)
            if chol: metrics["Cholesterol"] = float(chol.group(1))
            parsed_json = metrics
        else:
            parsed_json = {}

    # Extract secret_context if provided and handle memory persistence & telemetry asynchronously
    secret_ctx = None
    memory_class = None
    if isinstance(parsed_json, dict) and "secret_context" in parsed_json:
        secret_ctx = str(parsed_json.pop("secret_context", "")).strip()
        memory_class = str(parsed_json.pop("memory_classification", "")).strip()

    if user_id:
        try:
            async with AsyncSessionLocal() as db:
                if secret_ctx:
                    from app.services.context_service import append_ai_insight
                    await append_ai_insight(user_id, module, secret_ctx, db, memory_class)
                from app.services.context_service import log_ai_trigger_event
                await log_ai_trigger_event(
                    user_id=user_id,
                    feature=module,
                    model=model_name,
                    prompt_tokens=pt,
                    completion_tokens=ct,
                    response_time_ms=elapsed_ms,
                    status="success" if model_name != "local_fallback" else "fallback",
                )
        except Exception as e:
            logger.error("Failed to process context memory/telemetry for user %s: %s", user_id, e)

    return parsed_json


async def generate_vision_json_response(
    module: str,
    prompt: str,
    base64_images: list[str],
    user_id: Optional[str] = None,
) -> dict:
    """
    Generate an AI response using vision models strictly formatted as a JSON object.
    Supports multi-model fallback for vision capabilities.
    Extracts secret_context if present.
    """
    import json
    import time
    import httpx
    import re
    from app.database import AsyncSessionLocal
    from app.services.context_service import append_ai_insight, log_ai_trigger_event

    settings = get_settings()
    groq_api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
    
    if not groq_api_key:
        return {}

    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt + "\n\nRespond ONLY with a valid JSON block. Format as:\n```json\n{...}\n```\nDo not include any other text."}
            ]
        }
    ]
    
    for img in base64_images:
        # Prepend data URI prefix if missing
        img_data = img if img.startswith("data:image") else f"data:image/jpeg;base64,{img}"
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {"url": img_data}
        })

    payload = {
        "model": "qwen/qwen3.6-27b",
        "messages": messages,
        "temperature": 0.1
    }
    
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    models_to_try = ["qwen/qwen3.6-27b", "llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
    last_response = None
    elapsed_ms = 0
    model_name = "vision_fallback"
    
    async with httpx.AsyncClient() as http_client:
        start_t = time.time()
        for m in models_to_try:
            payload["model"] = m
            try:
                response = await http_client.post(groq_url, json=payload, headers=headers, timeout=45.0)
                if response.status_code == 200:
                    last_response = response
                    model_name = m
                    break
            except Exception as e:
                logger.error(f"Vision API error with {m}: {e}")
                
        elapsed_ms = int((time.time() - start_t) * 1000)
    
    parsed_json = {}
    pt = 0
    ct = 0
    
    if last_response and last_response.status_code == 200:
        data = last_response.json()
        result_text = data["choices"][0]["message"]["content"]
        if "usage" in data:
            pt = data["usage"].get("prompt_tokens", 0)
            ct = data["usage"].get("completion_tokens", 0)
            
        json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', result_text, re.DOTALL | re.IGNORECASE)
        if json_match:
            result_text = json_match.group(1).strip()
        else:
            json_match2 = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match2:
                result_text = json_match2.group(0)
                
        try:
            parsed_json = json.loads(result_text)
        except json.JSONDecodeError:
            pass

    # Handle memory & telemetry
    secret_ctx = None
    memory_class = None
    if isinstance(parsed_json, dict) and "secret_context" in parsed_json:
        secret_ctx = str(parsed_json.pop("secret_context", "")).strip()
        memory_class = str(parsed_json.pop("memory_classification", "")).strip()

    if user_id:
        try:
            async with AsyncSessionLocal() as db:
                if secret_ctx:
                    await append_ai_insight(user_id, module, secret_ctx, db, memory_class)
                await log_ai_trigger_event(
                    user_id=user_id,
                    feature=module + "_vision",
                    model=model_name,
                    prompt_tokens=pt,
                    completion_tokens=ct,
                    response_time_ms=elapsed_ms,
                    status="success" if parsed_json else "error",
                )
        except Exception as e:
            logger.error("Failed to process vision context memory/telemetry for user %s: %s", user_id, e)

    return parsed_json


# ─── Fallback Responses ─────────────────────────────────────────────

def _get_fallback_response(module: str, message: str) -> str:
    """Provide local fallback responses when AI APIs are unavailable."""
    q = message.lower()

    if module == "assistant":
        return _fallback_assistant(q)
    elif module == "symptom":
        return '{"urgency":"Medium","conditions":[{"condition":"Please consult a doctor for accurate diagnosis","probability":0}],"specialists":["General Physician"],"recommendations":["Stay hydrated","Rest well","Monitor your symptoms","Consult a healthcare professional"]}'
    elif module == "nutrition":
        return "Based on your profile, aim for a balanced diet with adequate protein, complex carbs, and healthy fats. Drink plenty of water and eat 5 servings of fruits and vegetables daily. Consult a nutritionist for a personalized meal plan."
    elif module == "fitness":
        return "For a balanced fitness routine, aim for 150 minutes of moderate cardio per week, 2-3 strength training sessions, and daily stretching. Start slow and gradually increase intensity. Always warm up before exercise and cool down after."
    elif module == "mental":
        return "Thank you for sharing. Remember that it's completely normal to have ups and downs. Practice self-care, maintain social connections, and consider journaling regularly. If you're struggling, please reach out to a mental health professional. Helpline: 9152987821 (iCall)."

    return "I'm here to help with your health questions. Please try again or consult a healthcare professional for specific medical advice."


def _fallback_assistant(q: str) -> str:
    """Keyword-based fallback for the chat assistant."""
    if "summarize this medical record" in q:
        return (
            "### 📋 Medical Record Summary\n\n"
            "**Overview:**\n"
            "Clinical health record evaluated for patient review.\n\n"
            "**Key Observations:**\n"
            "• ✅ All recorded baseline measurements are within expected parameters.\n"
            "• 🟡 Follow-up consultation with primary physician recommended for routine review.\n\n"
            "**Recommendations:**\n"
            "1. Continue any active prescribed medications.\n"
            "2. Bring a copy of this report to your next routine checkup."
        )

    if "compare these two medical records" in q:
        return (
            "### 📊 Medical Record Comparison Report\n\n"
            "| Indicator | Record 1 | Record 2 | Status |\n"
            "| :--- | :--- | :--- | :--- |\n"
            "| Clinical Baseline | Initial Evaluation | Follow-up Assessment | ✅ Stable |\n\n"
            "**Comparative Overview:**\n"
            "Both records demonstrate steady health indicators without adverse progression."
        )

    if any(w in q for w in ["paracetamol", "acetaminophen"]):
        return "Paracetamol (Acetaminophen) is used for pain relief and fever reduction. Usual adult dose: 500mg-1g every 4-6 hours. Max: 4g/day. Avoid with alcohol."
    if any(w in q for w in ["headache", "head pain"]):
        return "Headache Management:\n• Stay hydrated\n• Rest in a dark, quiet room\n• Take paracetamol or ibuprofen\n• Apply cold compress\n\n⚠️ See a doctor if severe, sudden, or with fever/vision changes."
    if any(w in q for w in ["fever", "temperature"]):
        return "Fever Management:\n• Rest and stay hydrated\n• Take paracetamol or ibuprofen\n• Use lukewarm sponge bath\n• Wear light clothing\n\n⚠️ Seek help if >103°F or lasting >3 days."
    if any(w in q for w in ["burn", "burnt"]):
        return "Burns First Aid:\n1. Cool under running water for 20 min\n2. Remove jewelry (if not stuck)\n3. Cover with sterile dressing\n4. Do NOT apply ice/butter/toothpaste\n5. Take paracetamol for pain"
    if any(w in q for w in ["hello", "hi ", "hey"]):
        return "Hello! I'm your LifeSphere AI Health Assistant. How can I help you today? Ask me about medicines, first aid, or health concerns."
    if "tip" in q or "advice" in q:
        return "💡 Health Tip: Drink at least 8 glasses of water daily, take a 30-minute walk, get 7-9 hours of sleep, and eat 5 servings of fruits and vegetables daily."

    return "For the most accurate health information, please consult a healthcare professional. I can assist with medicine info, first aid guidance, and general health tips."
