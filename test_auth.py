import requests
import sqlite3
import time

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    print("--- Security Verification Phase ---")
    
    # 1. Register testuserC
    email_a = "testuserC@example.com"
    pwd_a = "TestPassword123!"
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email_a,
        "password": pwd_a,
        "name": "Test User A"
    })
    print("Register User A:", resp.status_code, resp.json())
    
    # 2. Try to verify with 123456
    resp = requests.post(f"{BASE_URL}/auth/verify-email", json={
        "email": email_a,
        "code": "123456"
    })
    print("Verify with 123456 (Should be 401):", resp.status_code)
    assert resp.status_code == 401, "Security test failed: 123456 still works!"

    # 3. Try to verify with 000000
    resp = requests.post(f"{BASE_URL}/auth/verify-email", json={
        "email": email_a,
        "code": "000000"
    })
    print("Verify with 000000 (Should be 401):", resp.status_code)
    assert resp.status_code == 401, "Security test failed: 000000 still works!"

    # 4. Fetch real token from DB
    conn = sqlite3.connect('backend/lifesphere_local.db')
    cursor = conn.cursor()
    cursor.execute("SELECT verification_code FROM email_verification_tokens WHERE email=?", (email_a,))
    real_code = cursor.fetchone()[0]
    conn.close()
    
    # 5. Legitimate email verification
    resp = requests.post(f"{BASE_URL}/auth/verify-email", json={
        "email": email_a,
        "code": real_code
    })
    print("Verify with real code (Should be 200):", resp.status_code)
    assert resp.status_code == 200, "Real code failed"
    
    print("\n--- Original Verification Phase ---")
    
    # Login User A
    resp_login_a = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email_a,
        "password": pwd_a
    })
    print("Login User A:", resp_login_a.status_code)
    cookies_a = resp_login_a.cookies
    
    # Register User D
    email_b = "testuserD@example.com"
    pwd_b = "TestPassword123!"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email_b,
        "password": pwd_b,
        "name": "Test User B"
    })
    
    # Verify User B
    conn = sqlite3.connect('backend/lifesphere_local.db')
    cursor = conn.cursor()
    cursor.execute("SELECT verification_code FROM email_verification_tokens WHERE email=?", (email_b,))
    real_code_b = cursor.fetchone()[0]
    conn.close()
    requests.post(f"{BASE_URL}/auth/verify-email", json={
        "email": email_b,
        "code": real_code_b
    })
    
    # Login User B
    resp_login_b = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email_b,
        "password": pwd_b
    })
    print("Login User B:", resp_login_b.status_code)
    cookies_b = resp_login_b.cookies
    
    # Test User Isolation: User A fetching profile should succeed
    resp = requests.get(f"{BASE_URL}/auth/me", cookies=cookies_a)
    print("User A /me:", resp.status_code)
    uid_a = resp.json()['id']
    uid_b = requests.get(f"{BASE_URL}/auth/me", cookies=cookies_b).json()['id']
    
    # Test Isolation on Medical Records (Upload for A, Try to read from B)
    # Upload record for User A
    import io
    dummy_pdf = io.BytesIO(b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n")
    dummy_pdf.name = "test.pdf"
    files = {"file": ("test.pdf", dummy_pdf, "application/pdf")}
    resp = requests.post(f"{BASE_URL}/records/upload-ai", cookies=cookies_a, files=files, data={"record_type": "Lab Report", "description": "Test"})
    print("Upload Record for User A:", resp.status_code)
    if resp.status_code == 200:
        record_id = resp.json().get('id')
        print(f"Record created: {record_id}")
        
        # User B trying to fetch User A's record
        resp_fetch_b = requests.get(f"{BASE_URL}/records/{record_id}", cookies=cookies_b)
        print("User B fetching User A's record:", resp_fetch_b.status_code)
        
        # File isolation: Try to download from User B
        # The file url typically might be /uploads/... or /records/.../file
        # We need to know how it's served. Let's see if there is an endpoint.
    else:
        print("Upload Record output:", resp.json())

if __name__ == '__main__':
    run_tests()
