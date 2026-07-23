"use client";

import React, { useState } from "react";
import ModernSidebar from "./ModernSidebar";
import ModernRightPanel from "./ModernRightPanel";
import NotificationBell from "./NotificationBell";
import { Menu, Sparkles } from "lucide-react";

interface LayoutClientProps {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null };
}

export default function DashboardLayoutClient({ children, user }: LayoutClientProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <ModernSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        userName={user?.name || "User"}
        userEmail={user?.email || undefined}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar (< lg) */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-extrabold text-lg text-white tracking-tight">LifeOS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileRightPanelOpen(true)}
              className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
              title="Activity & Insights"
            >
              <Sparkles className="w-5 h-5 text-blue-400" />
            </button>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Right Panel (Desktop & Mobile Drawer) */}
      <ModernRightPanel
        mobileOpen={mobileRightPanelOpen}
        onCloseMobile={() => setMobileRightPanelOpen(false)}
      />
    </div>
  );
}
