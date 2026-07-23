"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LegacySidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊", iconColor: "rgba(59, 130, 246, 0.15)", section: "General" },
    { label: "Appointments", href: "/dashboard/appointments", icon: "📅", iconColor: "rgba(16, 185, 129, 0.15)", section: "General" },
    { label: "Records", href: "/dashboard/records", icon: "📋", iconColor: "rgba(245, 158, 11, 0.15)", section: "General" },
    { label: "Family Profiles", href: "/dashboard/family", icon: "👨‍👩‍👧", iconColor: "rgba(99, 102, 241, 0.15)", section: "General" },
    { label: "Medicines", href: "/dashboard/medicine", icon: "💊", iconColor: "rgba(239, 68, 68, 0.15)", section: "General" },
    { label: "Statistics", href: "/dashboard/analytics", icon: "📈", iconColor: "rgba(139, 92, 246, 0.15)", section: "General" },
    
    { label: "AI Chat", href: "/dashboard/ai-chat", icon: "💬", iconColor: "rgba(6, 182, 212, 0.15)", section: "Tools" },
    { label: "Symptom Checker", href: "/dashboard/ai-symptom", icon: "🔍", iconColor: "rgba(236, 72, 153, 0.15)", section: "Tools" },
    { label: "Nutrition", href: "/dashboard/ai-nutrition", icon: "🥗", iconColor: "rgba(16, 185, 129, 0.15)", section: "Tools" },
    { label: "Fitness", href: "/dashboard/ai-fitness", icon: "🏋️", iconColor: "rgba(249, 115, 22, 0.15)", section: "Tools" },
    { label: "Mental Health", href: "/dashboard/ai-mental", icon: "🧠", iconColor: "rgba(139, 92, 246, 0.15)", section: "Tools" },
    { label: "Trackers", href: "/tracker", icon: "❤️", iconColor: "rgba(239, 68, 68, 0.15)", section: "Tools" },
    { label: "Settings", href: "/dashboard/settings", icon: "⚙️", iconColor: "rgba(100, 116, 139, 0.15)", section: "Tools" },
    { label: "Emergency", href: "/dashboard/emergency", icon: "🆘", iconColor: "rgba(220, 38, 38, 0.15)", section: "Tools", isEmergency: true },
  ];

  return (
    <aside className="sidebar" id="sidebar">
      <Link href="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <div className="logo-icon">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>favorite</span>
        </div>
        <h2>LifeOS</h2>
      </Link>

      <div className="sidebar-section-label">General</div>
      {navItems.filter(i => i.section === "General").map((item) => (
        <Link 
          key={item.label} 
          href={item.href}
          className={`sidebar-nav-item ${pathname === item.href ? "active" : ""}`}
          style={{ textDecoration: 'none' }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span className="nav-icon" style={{ 
              background: item.iconColor, 
              display: 'inline-flex', 
              width: '32px', 
              height: '32px', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '10px', 
              marginRight: '12px', 
              fontSize: '1.1rem', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)' 
            }}>
              {item.icon}
            </span>
            {item.label}
          </span>
        </Link>
      ))}

      <div className="sidebar-section-label">Tools</div>
      {navItems.filter(i => i.section === "Tools").map((item) => (
        <Link 
          key={item.label} 
          href={item.href}
          className={`sidebar-nav-item ${pathname === item.href ? "active" : ""}`}
          style={{ textDecoration: 'none' }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span className="nav-icon" style={{ 
              background: item.iconColor, 
              display: 'inline-flex', 
              width: '32px', 
              height: '32px', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '10px', 
              marginRight: '12px', 
              fontSize: '1.1rem', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)' 
            }}>
              {item.icon}
            </span>
            {item.label}
          </span>
          {item.isEmergency && (
             <span className="nav-count" style={{ background: 'var(--danger)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', color: 'white' }}>SOS</span>
          )}
        </Link>
      ))}

      {/* Logout */}
      <Link href="/api/auth/signout" className="sidebar-nav-item" style={{ color: 'var(--danger)', marginTop: '10px', textDecoration: 'none' }}>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="nav-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', display: 'inline-flex', width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', marginRight: '12px', fontSize: '1.1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </span>
          Log out
        </span>
      </Link>

      {/* User */}
      <div className="sidebar-user" id="sidebar-user">
        <div className="user-avatar" id="sidebar-avatar">U</div>
        <div className="user-info">
          <div className="user-name" id="sidebar-username">User</div>
          <div className="user-email" id="sidebar-email">user@lifeos.com</div>
        </div>
        <span className="user-chevron">▾</span>
      </div>
    </aside>
  );
}
