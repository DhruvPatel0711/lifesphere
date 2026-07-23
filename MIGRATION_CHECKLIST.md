# Migration Checklist — LifeOS / Lifesphere

## Feature Status Checklist

- [x] 1. Google OAuth — NextAuth v5 Google provider setup
- [x] 2. JWT Authentication — NextAuth JWT session strategy
- [x] 3. Face Verification — face-api.js 128-vector Euclidean matching
- [ ] 4. OTP / SMS Verification (Auth) — Explicitly out of scope
- [x] 5. Email Verification Flow — 6-digit code via Nodemailer
- [x] 6. Two-Factor Authentication (2FA/MFA) — TOTP QR code via otpauth
- [x] 7. Session Management — Persistent session table & JWT cookies
- [x] 8. Password Reset Flow — Email code reset flow
- [x] 9. Role-Based Access Control (RBAC) — DONE (requireRoleApi & requireRolePage guards in src/lib/rbac.ts)
- [x] 10. WebAuthn / Passkeys — DONE (WebAuthn credentials table, passkey setup & sign-in routes)
- [ ] 11. Video Upload / Processing — Explicitly out of scope
- [x] 12. Image Upload / Processing — Medical record image disk storage
- [x] 13. File Storage Integration — Disk storage in public/uploads/
- [x] 14. Audio Recording / Voice Input — Web Speech API in AI Chat
- [x] 15. Document / PDF Parsing & Export — DONE (PDF parsing + ExportButtons wired to CSV & PDF print reports in UI)
- [ ] 16. WebSockets / Real-time Messaging — Explicitly out of scope
- [ ] 17. Push Notifications — Explicitly out of scope
- [x] 18. Email Sending Service — Nodemailer SMTP service
- [x] 19. SMS Service (Twilio Emergency SOS) — Twilio API SOS dispatch
- [x] 20. In-App Notification DB Table — DONE (notifications table, NotificationBell UI, SOS & appointment triggers)
- [x] 21. RAG Chatbot Integration — LangChain + Pinecone + Groq LLM
- [x] 22. AI Symptom Checker & Specialized AI Coaches — Dedicated sub-views for 4 coaches
- [ ] 23. Computer Vision / ML — Explicitly out of scope
- [x] 24. Speech-to-Text / Text-to-Speech — Web Speech API STT
- [x] 25. Recommendation Engine / System Prompts — Custom prompts for coaches
- [x] 26. Fitbit Web API Integration — OAuth2 callback & health sync
- [ ] 27. Payment Integration — Explicitly out of scope
- [x] 28. Appointments Scheduling & Doctor Management — CRUD appointments + AI prep
- [x] 29. Geolocation / Emergency Maps & SOS — GPS capture + SOS dispatch

---

## Action Plan (Completed Pass)
- [x] Item 1: Complete RBAC Middleware & Route Guards (#9) — Added `src/lib/rbac.ts` with `requireRoleApi` and `requireRolePage`
- [x] Item 2: Wire PDF & CSV Export Buttons to UI (#15) — Created `ExportButtons.tsx` component and added to Records and Settings pages
- [x] Item 3: Build In-App Notification DB Table & Bell UI (#20) — Created `notifications` table, `NotificationBell.tsx`, and triggers on SOS and appointments
- [x] Item 4: Build WebAuthn / Passkey Authentication Support (#10) — Added `webauthn_credentials` schema, registration/auth API routes, and `PasskeySetupClient.tsx`
- [x] Item 5: Implement Audit Logging for Medical Records — Added `audit_logs` table and `logAudit` calls on CREATE, UPDATE, and SOFT_DELETE actions
- [x] Item 6: Implement Soft-Delete Pattern (`deletedAt`) — Added `deletedAt` timestamp fields to `users` and `medical_records` schema and filtered queries
- [x] Item 7: Implement Guided Onboarding Flow — Created `/onboarding` page and 3-step `OnboardingWizard.tsx` component
- [x] Item 8: Enhance Dashboard Analytics Page with Real Trend Charts — Integrated `HealthTrendChart.tsx` SVG trend charts for weight and step tracking history
