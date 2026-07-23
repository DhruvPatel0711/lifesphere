"use client";

import React from "react";
import NotificationBell from "./NotificationBell";

export default function LegacyRightPanel() {
  return (
    <aside className="right-panel" id="right-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Activity & Alerts</h3>
        <NotificationBell />
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
          <span>💡</span> Quick Tip
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Stay updated on your upcoming medical visits and system alerts right here in real time.
        </p>
      </div>
    </aside>
  );
}
