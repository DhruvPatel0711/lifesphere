import requests
import sqlite3

BASE_URL = "http://localhost:8000"

def run_test():
    # Fetch file path
    conn = sqlite3.connect('backend/lifesphere_local.db')
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM medical_records WHERE file_path IS NOT NULL LIMIT 1")
    path_a = cursor.fetchone()[0]
    
    file_url = f"{BASE_URL}/uploads/{path_a}"
    
    # 1. Unauthenticated request
    r_unauth = requests.get(file_url)
    print("Unauthenticated Status:", r_unauth.status_code)
    
    # 2. Authenticate as User A (creator) - wait, this was seed-user-001. We can't auth easily.
    # Let's use testuser_ai@example.com from previous test which might have uploaded a file, or upload one now.
    
    email_a = "testuser_a_file@example.com"
    pwd = "TestPassword123!"
    requests.post(f"{BASE_URL}/api/v1/auth/register", json={"email": email_a, "password": pwd, "name": "A"})
    code = conn.execute("SELECT verification_code FROM email_verification_tokens WHERE email=?", (email_a,)).fetchone()
    if code: requests.post(f"{BASE_URL}/api/v1/auth/verify-email", json={"email": email_a, "code": code[0]})
    resp_login_a = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": email_a, "password": pwd})
    cookies_a = resp_login_a.cookies
    
    email_b = "testuser_b_file@example.com"
    requests.post(f"{BASE_URL}/api/v1/auth/register", json={"email": email_b, "password": pwd, "name": "B"})
    code_b = conn.execute("SELECT verification_code FROM email_verification_tokens WHERE email=?", (email_b,)).fetchone()
    if code_b: requests.post(f"{BASE_URL}/api/v1/auth/verify-email", json={"email": email_b, "code": code_b[0]})
    resp_login_b = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": email_b, "password": pwd})
    cookies_b = resp_login_b.cookies
    
    # Upload as User A
    import io
    dummy_pdf = io.BytesIO(b"%PDF-dummy")
    dummy_pdf.name = "test.pdf"
    resp_upload = requests.post(f"{BASE_URL}/api/v1/records/upload-ai", cookies=cookies_a, files={"file": ("test.pdf", dummy_pdf, "application/pdf")})
    path_uploaded = ""
    if resp_upload.status_code == 200:
        record_id = resp_upload.json().get('record_id')
        cursor.execute("SELECT file_path FROM medical_records WHERE id=?", (record_id,))
        path_uploaded = cursor.fetchone()[0]
    
    if path_uploaded:
        url_uploaded = f"{BASE_URL}/uploads/{path_uploaded}"
        r_auth_a = requests.get(url_uploaded, cookies=cookies_a)
        print("User A -> Own File Status:", r_auth_a.status_code)
        
        r_auth_b = requests.get(url_uploaded, cookies=cookies_b)
        print("User B -> User A's File Status:", r_auth_b.status_code)
        
        r_path_trav = requests.get(f"{BASE_URL}/uploads/../../main.py", cookies=cookies_a)
        print("Path Traversal via endpoint Status:", r_path_trav.status_code)
    else:
        print("Failed to upload.")

if __name__ == '__main__':
    run_test()
