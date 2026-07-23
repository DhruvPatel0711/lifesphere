"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Pill,
  BarChart3,
  MessageSquare,
  Stethoscope,
  Utensils,
  Dumbbell,
  HeartHandshake,
  Activity,
  Settings,
  ShieldAlert,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  userName?: string;
  userEmail?: string;
}

export default function ModernSidebar({ mobileOpen, onCloseMobile, userName = "User", userEmail }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, category: "General" },
    { label: "Appointments", href: "/dashboard/appointments", icon: Calendar, category: "General" },
    { label: "Medical Records", href: "/dashboard/records", icon: FileText, category: "General" },
    { label: "Family Profiles", href: "/dashboard/family", icon: Users, category: "General" },
    { label: "Medicines", href: "/dashboard/medicine", icon: Pill, category: "General" },
    { label: "Statistics", href: "/dashboard/analytics", icon: BarChart3, category: "General" },

    { label: "AI Chat Assistant", href: "/dashboard/ai-chat", icon: MessageSquare, category: "Tools" },
    { label: "Symptom Checker", href: "/dashboard/ai-symptom", icon: Stethoscope, category: "Tools" },
    { label: "Nutrition Coach", href: "/dashboard/ai-nutrition", icon: Utensils, category: "Tools" },
    { label: "Fitness Coach", href: "/dashboard/ai-fitness", icon: Dumbbell, category: "Tools" },
    { label: "Mental Health", href: "/dashboard/ai-mental", icon: HeartHandshake, category: "Tools" },
    { label: "Vitals Tracker", href: "/tracker", icon: Activity, category: "Tools" },
    { label: "Account Settings", href: "/dashboard/settings", icon: Settings, category: "Tools" },
    { label: "Emergency SOS", href: "/dashboard/emergency", icon: ShieldAlert, category: "Tools", isEmergency: true },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 border-r border-slate-800">
      {/* Brand Logo */}
      <div className="flex items-center justify-between px-3 py-3 mb-4 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-black text-xl text-white tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm">
            L
          </div>
          <span>LifeOS</span>
        </Link>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <div>
          <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            General
          </span>
          <div className="space-y-1">
            {navItems.filter(i => i.category === "General").map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            AI & Health Tools
          </span>
          <div className="space-y-1">
            {navItems.filter(i => i.category === "Tools").map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    item.isEmergency
                      ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                      : active
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${item.isEmergency ? "text-red-400" : ""}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.isEmergency && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                      SOS
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer User Info */}
      <div className="pt-4 mt-auto border-t border-slate-800 flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail || "patient@lifeos.com"}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-slate-400 hover:text-red-400 p-1.5 transition-colors"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[80vw] h-full z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
