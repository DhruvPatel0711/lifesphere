"use client";

import React from "react";
import NotificationBell from "./NotificationBell";
import { Sparkles, ShieldCheck, X } from "lucide-react";

interface ModernRightPanelProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function ModernRightPanel({ mobileOpen, onCloseMobile }: ModernRightPanelProps) {
  const content = (
    <div className="flex flex-col gap-6 h-full p-6 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Activity & Insights</h3>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="xl:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs space-y-2 shadow-sm">
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
          <Sparkles className="w-4 h-4" /> Real-time Health Insights
        </div>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          Track vitals trends, upcoming appointments, and AI coach recommendations in one place.
        </p>
      </div>

      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 text-xs space-y-2 shadow-sm">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
          <ShieldCheck className="w-4 h-4" /> HIPAA Compliant Security
        </div>
        <p className="text-emerald-800/80 dark:text-emerald-300 leading-relaxed">
          Your personal health records are encrypted and protected by WebAuthn biometric security.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Right Panel */}
      <aside className="w-80 flex-shrink-0 h-screen sticky top-0 hidden xl:block">
        {content}
      </aside>

      {/* Mobile / Tablet Drawer (< xl) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex justify-end">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-80 max-w-[85vw] h-full z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
