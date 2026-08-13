import requests
import sqlite3
import time
import os

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "testuser_ai@example.com"
PASSWORD = "TestPassword123!"

def run_pipeline_test():
    print("=== End-to-End AI Medical Report Pipeline Test ===")
    
    # 1. Register & Verify User
    print("1. Registering user...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": EMAIL,
        "password": PASSWORD,
        "name": "AI Pipeline Tester"
    })
    
    conn = sqlite3.connect('backend/lifesphere_local.db')
    cursor = conn.cursor()
    cursor.execute("SELECT verification_code FROM email_verification_tokens WHERE email=?", (EMAIL,))
    code = cursor.fetchone()
    if code:
        requests.post(f"{BASE_URL}/auth/verify-email", json={"email": EMAIL, "code": code[0]})
    
    # Login
    print("2. Logging in...")
    resp_login = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    cookies = resp_login.cookies
    user_id = resp_login.json().get('data', {}).get('id', None)
    if not user_id:
        # User id isn't in login payload usually, fetch /me
        resp_me = requests.get(f"{BASE_URL}/auth/me", cookies=cookies)
        user_id = resp_me.json().get('id')
    print(f"   User ID: {user_id}")

    # 3. Create synthetic medical report
    print("3. Creating synthetic medical report...")
    report_content = """
    CENTRAL CITY CLINIC
    Patient: AI Pipeline Tester
    Date: 2026-08-11
    
    LABORATORY TEST RESULTS
    -----------------------------------
    Heart Rate: 72 bpm
    Blood Pressure: 120/80 mmHg
    Hemoglobin: 14.2 g/dL
    Fasting Blood Sugar: 95 mg/dL
    Total Cholesterol: 180 mg/dL
    
    Notes: All values are within normal ranges.
    """
    with open("synthetic_report.txt", "w") as f:
        f.write(report_content)
        
    # 4. Upload to upload-ai
    print("4. Uploading to upload-ai endpoint...")
    with open("synthetic_report.txt", "rb") as f:
        files = {"file": ("synthetic_report.txt", f, "text/plain")}
        resp_upload = requests.post(f"{BASE_URL}/records/upload-ai", cookies=cookies, files=files)
        
    print(f"   Status: {resp_upload.status_code}")
    result = resp_upload.json()
    print("   Response JSON structure:", list(result.keys()))
    
    if not result.get('success'):
        print("   Upload Failed:", result)
        return

    # Verify structured JSON & Metrics
    print("\n--- Document Extraction -> Groq -> Structured JSON ---")
    metrics = result.get('metrics', {})
    print("Extracted Metrics:")
    for k, v in metrics.items():
        print(f" - {k}: {v}")
    
    # Verify MedicalRecord
    print("\n--- MedicalRecord Verification ---")
    resp_records = requests.get(f"{BASE_URL}/records", cookies=cookies)
    records = resp_records.json()
    print(f"Found {len(records)} records for user.")
    for r in records:
        print(f" - Title: {r['title']} | Category: {r['category']} | Date: {r['date']}")
        
    # Verify HealthEntry
    print("\n--- HealthEntry Verification ---")
    cursor.execute("SELECT metric_name, metric_value, unit FROM health_entries WHERE user_id=?", (user_id,))
    entries = cursor.fetchall()
    print(f"Found {len(entries)} health entries in DB.")
    for e in entries:
        print(f" - {e[0]}: {e[1]} {e[2]}")
        
    # Verify user_contexts/{user_id}.txt
    print("\n--- Master User Context Verification ---")
    context_path = f"backend/user_contexts/{user_id}.txt"
    if os.path.exists(context_path):
        print(f"Context file exists: {context_path}")
        with open(context_path, "r") as f:
            print(f"Context Content:\n{f.read()}")
    else:
        print(f"Context file NOT FOUND at {context_path}")

    conn.close()
    print("\nPipeline Verification Complete.")

if __name__ == "__main__":
    run_pipeline_test()
