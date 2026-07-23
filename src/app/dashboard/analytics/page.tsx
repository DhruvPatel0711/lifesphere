import { db } from "@/lib/db";
import { healthEntries, medicalRecords, medicines, appointments } from "@/drizzle/schema";
import { eq, desc, count, asc, and, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import HealthTrendChart from "@/components/HealthTrendChart";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Fetch counts
  const recordCount = db.select({ count: count() }).from(medicalRecords).where(and(eq(medicalRecords.userId, userId), isNull(medicalRecords.deletedAt))).get();
  const appointmentCount = db.select({ count: count() }).from(appointments).where(eq(appointments.userId, userId)).get();
  const entryCount = db.select({ count: count() }).from(healthEntries).where(eq(healthEntries.userId, userId)).get();

  // Fetch health entries chronologically for charts
  const weightEntries = db.select()
    .from(healthEntries)
    .where(eq(healthEntries.userId, userId))
    .orderBy(asc(healthEntries.recordedAt))
    .all()
    .filter(e => e.category === "weight")
    .map(e => ({
      date: e.recordedAt instanceof Date ? e.recordedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : new Date(e.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: e.value,
    }));

  const stepEntries = db.select()
    .from(healthEntries)
    .where(eq(healthEntries.userId, userId))
    .orderBy(asc(healthEntries.recordedAt))
    .all()
    .filter(e => e.category === "steps")
    .map(e => ({
      date: e.recordedAt instanceof Date ? e.recordedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : new Date(e.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: e.value,
    }));

  // Fetch recent health entries
  const recentEntries = db.select()
    .from(healthEntries)
    .where(eq(healthEntries.userId, userId))
    .orderBy(desc(healthEntries.recordedAt))
    .limit(20)
    .all();

  // Fetch active medicines
  const activeMeds = db.select()
    .from(medicines)
    .where(eq(medicines.userId, userId))
    .all()
    .filter(m => m.isActive);

  // Group health entries by category
  const categoryLatest: Record<string, { value: number; date: string }> = {};
  recentEntries.forEach(e => {
    if (!categoryLatest[e.category]) {
      categoryLatest[e.category] = {
        value: e.value,
        date: e.recordedAt instanceof Date ? e.recordedAt.toLocaleDateString() : new Date(e.recordedAt).toLocaleDateString(),
      };
    }
  });

  const stats = [
    { label: "Medical Records", value: recordCount?.count ?? 0, icon: "📋", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { label: "Active Medicines", value: activeMeds.length, icon: "💊", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
    { label: "Appointments", value: appointmentCount?.count ?? 0, icon: "📅", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
    { label: "Health Entries", value: entryCount?.count ?? 0, icon: "📊", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
  ];

  const categoryLabels: Record<string, string> = {
    weight: "Weight (kg)",
    blood_sugar: "Blood Sugar (mg/dL)",
    blood_pressure_sys: "BP Systolic (mmHg)",
    blood_pressure_dia: "BP Diastolic (mmHg)",
    steps: "Steps",
    calories: "Calories (kcal)",
    heart_rate: "Heart Rate (bpm)",
    sleep: "Sleep (hrs)",
  };

  return (
    <>
      {/* Page Header */}
      <div style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(139,92,246,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            📈
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Health Statistics & Trends</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Track vitals trends, analytics, and summaries across all your health records.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: s.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <HealthTrendChart title="Weight Tracker Trend" unit="kg" color="#2563eb" data={weightEntries} />
        <HealthTrendChart title="Daily Steps Activity" unit="steps" color="#10b981" data={stepEntries} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Latest Metrics by Category */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🎯</span> Latest Health Metrics
          </h3>
          {Object.keys(categoryLatest).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No health metrics recorded yet. Start tracking in the Health Tracker.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(categoryLatest).map(([cat, data]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {categoryLabels[cat] || cat}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{data.date}</div>
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{data.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Medicines Summary */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>💊</span> Active Prescriptions
          </h3>
          {activeMeds.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No active medicines. Add prescriptions from the Medicines section.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeMeds.slice(0, 6).map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.dosage} &middot; {m.frequency}</div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>
                    {m.remaining}/{m.totalPills} left
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>📜</span> Recent Health Entries
        </h3>
        {recentEntries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No health entries recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Label</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', textTransform: 'capitalize' }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{e.value}{e.secondaryValue ? ` / ${e.secondaryValue}` : ''}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{e.label || '-'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {e.recordedAt instanceof Date ? e.recordedAt.toLocaleDateString() : new Date(e.recordedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
