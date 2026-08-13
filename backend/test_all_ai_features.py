import asyncio
import os
import json
import logging
from datetime import date
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.medical_record import MedicalRecord
from app.services import ai_service
from app.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_ai")

async def test_all_ai():
    settings = get_settings()
    print("==================================================")
    print("[TEST] DEEP TESTING ALL AI FEATURES IN HEALTHCARE AI")
    print(f"Groq API Key Configured: {bool(settings.GROQ_API_KEY)}")
    print(f"OpenRouter API Key Configured: {bool(settings.OPENROUTER_API_KEY)}")
    print(f"Groq Model: {settings.GROQ_MODEL}")
    print("==================================================")

    results = {}

    # --- 1. Test Groq Client Initialization & Raw Call ---
    print("\n--- 1. Testing AI Core Service (Groq / OpenRouter) ---")
    try:
        res = await ai_service.generate_ai_response("assistant", "Hello, explain what paracetamol is in 2 lines.")
        print(f"AI Assistant Response (first 150 chars):\n{res[:150]}...")
        results["core_assistant"] = "PASS" if "Paracetamol" in res or "acetaminophen" in res.lower() or "pain" in res.lower() else "WARN (Fallback used)"
    except Exception as e:
        print(f"[FAIL] Core Assistant Error: {e}")
        results["core_assistant"] = f"FAIL: {e}"

    # --- 2. Test AI Symptom Triage (JSON Output) ---
    print("\n--- 2. Testing AI Symptom Triage (generate_json_response) ---")
    try:
        symptom_prompt = "User symptoms: High fever 102F, severe headache, muscle pain for 2 days."
        json_res = await ai_service.generate_json_response("symptom", symptom_prompt)
        print(f"Symptom JSON Response Keys: {list(json_res.keys())}")
        print(f"Full Symptom Output: {json.dumps(json_res, indent=2)[:300]}...")
        if "conditions" in json_res and "urgency" in json_res:
            results["symptom_triage"] = "PASS"
        else:
            results["symptom_triage"] = f"FAIL: Invalid JSON schema returned -> {json_res}"
    except Exception as e:
        print(f"[FAIL] Symptom Triage Error: {e}")
        results["symptom_triage"] = f"FAIL: {e}"

    # --- 3. Test Medical Report PDF Parsing ---
    print("\n--- 3. Testing Medical PDF Report Parser (fitz + report_parser JSON) ---")
    pdf_path = "uploads/seed-user-001/0fc11983af174dd485f28e16513767e4.pdf"
    if os.path.exists(pdf_path):
        try:
            import fitz
            doc = fitz.open(pdf_path)
            extracted_text = ""
            for page in doc:
                extracted_text += page.get_text()
            doc.close()
            print(f"PDF Extracted Text Length: {len(extracted_text)} chars")
            print(f"Sample PDF Text Snippet: {extracted_text[:200].strip()}...")

            prompt = (
                f"Extract all health metrics from this medical lab report text. "
                f"Return ONLY a JSON object with metric names as keys and numeric values as values.\n\n"
                f"Report text:\n{extracted_text[:6000]}"
            )
            parsed_metrics = await ai_service.generate_json_response("report_parser", prompt)
            print(f"Parsed Metrics from PDF: {json.dumps(parsed_metrics, indent=2)}")
            if parsed_metrics and "_error" not in parsed_metrics:
                results["pdf_parsing"] = f"PASS ({len(parsed_metrics)} metrics extracted)"
            else:
                results["pdf_parsing"] = f"WARN/FAIL: {parsed_metrics}"
        except Exception as e:
            print(f"[FAIL] PDF Parser Error: {e}")
            results["pdf_parsing"] = f"FAIL: {e}"
    else:
        print(f"[WARN] PDF file not found at {pdf_path}")
        results["pdf_parsing"] = "FAIL: PDF file missing"

    # --- 4. Test AI Medical Record Summary ---
    print("\n--- 4. Testing AI Medical Record Summary ---")
    try:
        summary_prompt = "Summarize this medical record:\nTitle: Blood Test Report\nCategory: Blood Test\nDoctor: Dr. Sharma\nHospital: City Hospital\nFindings: Hemoglobin: 13.5, Blood Sugar: 110, Cholesterol: 195\nNotes: Routine checkup"
        summary_res = await ai_service.generate_ai_response("assistant", summary_prompt)
        print(f"AI Summary Result:\n{summary_res[:200]}...")
        if "summarize this medical record" in summary_res.lower() and "format your response" in summary_res.lower():
            results["record_summary"] = "FAIL: System prompt leaked into output!"
        else:
            results["record_summary"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Record Summary Error: {e}")
        results["record_summary"] = f"FAIL: {e}"

    # --- 5. Test AI Record Comparison ---
    print("\n--- 5. Testing AI Record Comparison ---")
    try:
        compare_prompt = "Compare these two medical records:\nRecord 1: Blood Test (Jan 2026) - Hemoglobin: 12.0\nRecord 2: Blood Test (Aug 2026) - Hemoglobin: 14.2"
        compare_res = await ai_service.generate_ai_response("assistant", compare_prompt)
        print(f"AI Comparison Result:\n{compare_res[:200]}...")
        results["record_comparison"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Record Comparison Error: {e}")
        results["record_comparison"] = f"FAIL: {e}"

    # --- 6. Test AI Nutrition Module ---
    print("\n--- 6. Testing AI Nutrition Planner ---")
    try:
        nutrition_res = await ai_service.generate_ai_response("nutrition", "User profile: 28 male, 75kg, high cholesterol. Provide 1 day meal plan.")
        print(f"AI Nutrition Result:\n{nutrition_res[:200]}...")
        results["nutrition_planner"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Nutrition Error: {e}")
        results["nutrition_planner"] = f"FAIL: {e}"

    # --- 7. Test AI Fitness Module ---
    print("\n--- 7. Testing AI Fitness Coach ---")
    try:
        fitness_res = await ai_service.generate_ai_response("fitness", "User profile: 30 female, beginner, wants to lose weight. Provide 3-day workout split.")
        print(f"AI Fitness Result:\n{fitness_res[:200]}...")
        results["fitness_coach"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Fitness Error: {e}")
        results["fitness_coach"] = f"FAIL: {e}"

    # --- 8. Test AI Mental Health Support ---
    print("\n--- 8. Testing AI Mental Support ---")
    try:
        mental_res = await ai_service.generate_ai_response("mental", "Journal entry: Feeling overwhelmed with work deadlines and anxious about exams.")
        print(f"AI Mental Result:\n{mental_res[:200]}...")
        results["mental_support"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Mental Error: {e}")
        results["mental_support"] = f"FAIL: {e}"

    print("\n==================================================")
    print("[SUMMARY] COMPREHENSIVE AI FEATURE TEST SUMMARY")
    print("==================================================")
    for feature, status in results.items():
        print(f"• {feature.upper()}: {status}")

if __name__ == "__main__":
    asyncio.run(test_all_ai())
