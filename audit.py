import os
import re
import json

repo_path = r"d:\SGP\Healthcare-Ai"

patterns = {
    # AUTHENTICATION & IDENTITY
    "1. OAuth (Google, GitHub, Facebook, Apple)": r"oauth|google|github|facebook|apple",
    "2. JWT (Access, Refresh, Blacklist)": r"jwt|refresh_token|blacklist|revoc|access_token",
    "3. Video auth / face verification / liveness": r"face_login|liveness|video auth|face_descriptor|face recognition",
    "4. OTP / SMS verification (Twilio)": r"twilio|sms|otp",
    "5. Email verification flow": r"email verification|send_verification|verify_email",
    "6. Two-factor authentication (2FA/MFA)": r"2fa|mfa|two[-_]factor|pyotp|totp",
    "7. Session management (Redis, Cookies)": r"session|redis|cookie",
    "8. Password reset flow": r"reset[-_]password|forgot|passwordresettoken",
    "9. Role-based access control (RBAC)": r"role|permission|rbac",
    "10. Biometric or WebAuthn/passkey": r"biometric|webauthn|passkey",
    
    # MEDIA & FILE HANDLING
    "11. Video upload/processing": r"ffmpeg|video upload|codec|stream",
    "12. Image upload/processing": r"image upload|resize|compress|pillow|cv2|avatar",
    "13. File storage (S3, local)": r"s3|cloudinary|supabase|boto3|uploadfile|file_service",
    "14. Audio recording/processing": r"audio|speech|microphone|pyaudio",
    "15. Document/PDF generation": r"pdf|document generation|report",
    
    # REAL-TIME & COMMUNICATION
    "16. WebSockets": r"websocket|socket\.io|ws://",
    "17. Push notifications": r"push|fcm|firebase|service worker",
    "18. Email service (SMTP)": r"sendgrid|nodemailer|ses|smtp|email",
    "19. SMS service (Twilio)": r"twilio|sns|sms",
    "20. In-app notification system": r"notification",
    
    # AI / ML FEATURES
    "21. RAG chatbot": r"pinecone|langchain|rag",
    "22. OTHER AI sub-features": r"ai_symptom|ai_fitness|ai_mental|ai_nutrition",
    "23. Computer vision / image classification": r"cv2|opencv|image classification",
    "24. Speech-to-text / text-to-speech": r"stt|tts|speech|whisper",
    "25. Recommendation engine": r"recommend",
    
    # DATA & INTEGRATIONS
    "26. Third-party health APIs": r"fhir|hl7|wearable|apple health|google fit",
    "27. Payment integration": r"stripe|paypal|razorpay|payment",
    "28. Calendar/scheduling integration": r"calendar|scheduling|booking",
    "29. Geolocation / maps integration": r"geolocation|maps|leaflet|google maps",
    "30. Analytics/tracking integration": r"mixpanel|posthog|google analytics|event logging",
    "31. Export functionality": r"export|csv|pdf",
    "32. Family/multi-user account linking": r"family|shared access|dependent",
    
    # INFRASTRUCTURE & PATTERNS
    "33. Middleware stack": r"middleware|cors|rate limit|limiter|corsmiddleware",
    "34. Background jobs / cron": r"celery|apscheduler|cron|job queue|backgroundtask",
    "35. Caching layer": r"cache|redis|memcached",
    "36. Feature flags": r"feature flag|toggle",
    "37. Admin panel/routes": r"admin",
    "38. Webhook endpoints": r"webhook",
    "39. API documentation generation": r"swagger|openapi",
    "40. Internationalization (i18n)": r"i18n|translation|multi-language|locale"
}

results = {k: [] for k in patterns}

for root, dirs, files in os.walk(repo_path):
    if "node_modules" in root or ".git" in root or "venv" in root or "frontend-react" in root:
        continue
    for file in files:
        if file.endswith(('.py', '.js', '.html', '.css', '.json', '.txt', '.env', '.env.example')):
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, repo_path)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    
                    for key, pattern in patterns.items():
                        found_lines = []
                        for i, line in enumerate(lines):
                            if re.search(pattern, line.lower()):
                                found_lines.append(i + 1)
                        
                        if found_lines:
                            results[key].append(f"- **{rel_path}** (Lines: {', '.join(map(str, found_lines[:5]))}{'...' if len(found_lines) > 5 else ''})")
            except Exception as e:
                pass

with open(r"d:\SGP\lifesphere\audit_report.md", 'w', encoding='utf-8') as f:
    f.write("# Legacy Repository Feature Audit\n\n")
    for key, findings in results.items():
        f.write(f"## {key}\n")
        if findings:
            f.write("\n".join(findings))
            f.write("\n\n")
        else:
            f.write("*No references found in the codebase.*\n\n")

print("Audit complete.")
