import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "sqlite_v2.db");
const db = new Database(dbPath);

async function runSeed() {
  console.log("🌱 Starting Database Seeding on sqlite_v2.db...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Seed Users
  console.log("Seeding Users...");
  db.prepare("DELETE FROM users WHERE email IN ('patient@lifesphere.com', 'doctor@lifesphere.com', 'admin@lifesphere.com')").run();

  db.prepare(`
    INSERT INTO users (id, name, email, password, role, is_verified, face_login_enabled, login_alerts_enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "user-patient-123",
    "John Patient",
    "patient@lifesphere.com",
    hashedPassword,
    "patient",
    1,
    0,
    1,
    Date.now()
  );

  db.prepare(`
    INSERT INTO users (id, name, email, password, role, is_verified, face_login_enabled, login_alerts_enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "user-doctor-123",
    "Dr. Jane Smith",
    "doctor@lifesphere.com",
    hashedPassword,
    "doctor",
    1,
    0,
    1,
    Date.now()
  );

  db.prepare(`
    INSERT INTO users (id, name, email, password, role, is_verified, face_login_enabled, login_alerts_enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "user-admin-123",
    "Admin User",
    "admin@lifesphere.com",
    hashedPassword,
    "admin",
    1,
    0,
    1,
    Date.now()
  );

  // 2. Seed Medical Records
  console.log("Seeding Medical Records...");
  db.prepare("DELETE FROM medical_records WHERE user_id = 'user-patient-123'").run();

  const record1Id = "rec-lipid-panel-01";
  db.prepare(`
    INSERT INTO medical_records (id, user_id, title, category, record_date, doctor_name, location, summary, raw_text, file_url, parsed_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record1Id,
    "user-patient-123",
    "Annual Lipid & CBC Panel Report",
    "Lab Report",
    "2026-06-15",
    "Dr. Jane Smith",
    "Metropolitan Medical Labs",
    "Comprehensive metabolic panel showing normal glucose (92 mg/dL), Total Cholesterol 185 mg/dL, HDL 55 mg/dL, LDL 110 mg/dL.",
    "Patient: John Patient. Glucose: 92 mg/dL. Total Cholesterol: 185 mg/dL. Triglycerides: 140 mg/dL. Hemoglobin: 14.5 g/dL.",
    "/uploads/lipid_panel_2026.pdf",
    JSON.stringify({
      metrics: [
        { name: "Glucose", value: "92 mg/dL", status: "Normal" },
        { name: "Total Cholesterol", value: "185 mg/dL", status: "Optimal" },
        { name: "HDL", value: "55 mg/dL", status: "Normal" },
        { name: "LDL", value: "110 mg/dL", status: "Normal" }
      ]
    }),
    Date.now()
  );

  const record2Id = "rec-cardio-ecg-02";
  db.prepare(`
    INSERT INTO medical_records (id, user_id, title, category, record_date, doctor_name, location, summary, raw_text, file_url, parsed_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record2Id,
    "user-patient-123",
    "Cardiology Electrocardiogram (ECG)",
    "Cardiology",
    "2026-05-10",
    "Dr. Robert Vance",
    "Heart & Vascular Center",
    "Normal sinus rhythm at 72 bpm. No ST-segment elevation or ischemia detected.",
    "ECG 12-lead interpretation: Normal sinus rhythm. Ventricular rate 72 bpm. PR interval 154 ms. QRS duration 88 ms.",
    "/uploads/ecg_may_2026.pdf",
    JSON.stringify({
      metrics: [
        { name: "Heart Rate", value: "72 bpm", status: "Normal" },
        { name: "PR Interval", value: "154 ms", status: "Normal" }
      ]
    }),
    Date.now()
  );

  // 3. Seed Medicines
  console.log("Seeding Medicines...");
  db.prepare("DELETE FROM medicines WHERE user_id = 'user-patient-123'").run();

  db.prepare(`
    INSERT INTO medicines (id, user_id, name, dosage, frequency, status, prescribing_doctor, start_date, end_date, instructions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "med-lisinopril-01",
    "user-patient-123",
    "Lisinopril",
    "10 mg",
    "Once Daily (Morning)",
    "active",
    "Dr. Jane Smith",
    "2026-01-01",
    "2026-12-31",
    "Take 1 tablet every morning with water before food.",
    Date.now()
  );

  db.prepare(`
    INSERT INTO medicines (id, user_id, name, dosage, frequency, status, prescribing_doctor, start_date, end_date, instructions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "med-multivitamin-02",
    "user-patient-123",
    "Daily Multivitamin Complex",
    "1 Tablet",
    "Once Daily",
    "active",
    "Dr. Jane Smith",
    "2026-02-15",
    "2026-12-31",
    "Take 1 tablet daily with a full meal.",
    Date.now()
  );

  // 4. Seed Health Entries / Vitals Tracker
  console.log("Seeding Health Entries...");
  db.prepare("DELETE FROM health_entries WHERE user_id = 'user-patient-123'").run();

  const weights = [
    { value: 74.2, date: "2026-07-01" },
    { value: 73.8, date: "2026-07-08" },
    { value: 73.5, date: "2026-07-15" },
    { value: 73.1, date: "2026-07-22" }
  ];

  for (const w of weights) {
    db.prepare(`
      INSERT INTO health_entries (id, user_id, category, value, unit, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      "user-patient-123",
      "weight",
      w.value,
      "kg",
      new Date(w.date).getTime()
    );
  }

  // 5. Seed Appointments
  console.log("Seeding Appointments...");
  db.prepare("DELETE FROM appointments WHERE user_id = 'user-patient-123'").run();

  db.prepare(`
    INSERT INTO appointments (id, user_id, doctor_name, specialty, date, time, location, reason, status, ai_prep_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "appt-cardio-01",
    "user-patient-123",
    "Dr. Jane Smith",
    "General Internal Medicine",
    "2026-08-05",
    "10:30 AM",
    "LifeOS Medical Suite 402",
    "Bi-annual Blood Pressure & Routine Checkup",
    "scheduled",
    "AI Checklist: Bring recent Lisinopril medication log, report morning BP readings, and request updated Lipid profile.",
    Date.now()
  );

  // 6. Seed Family Members
  console.log("Seeding Family Profiles...");
  db.prepare("DELETE FROM family_members WHERE user_id = 'user-patient-123'").run();

  db.prepare(`
    INSERT INTO family_members (id, user_id, name, relationship, age, gender, allergies, conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "fam-spouse-01",
    "user-patient-123",
    "Sarah Patient",
    "Spouse",
    32,
    "Female",
    "Penicillin",
    "Mild Seasonal Asthma"
  );

  db.prepare(`
    INSERT INTO family_members (id, user_id, name, relationship, age, gender, allergies, conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "fam-child-02",
    "user-patient-123",
    "Leo Patient",
    "Child",
    6,
    "Male",
    "Peanuts",
    "None"
  );

  // 7. Seed Notifications
  console.log("Seeding In-App Notifications...");
  db.prepare("DELETE FROM notifications WHERE user_id = 'user-patient-123'").run();

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    "notif-welcome-01",
    "user-patient-123",
    "system",
    "Welcome to LifeOS Platform",
    "Your medical records dashboard and biometric passkeys are active.",
    0,
    Date.now()
  );

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    "notif-appt-02",
    "user-patient-123",
    "appointment",
    "Upcoming Appointment Reminder",
    "You have an appointment with Dr. Jane Smith on Aug 5, 2026 at 10:30 AM.",
    0,
    Date.now()
  );

  console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
}

runSeed().catch(console.error);
