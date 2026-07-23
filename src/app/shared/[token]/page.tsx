"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Pill, FileText, Lock } from "lucide-react";

interface RecordItem {
  title: string;
  category: string;
  doctor?: string;
  hospital?: string;
  date?: string;
  findings?: string;
}

interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  type: string;
  isActive: boolean;
}

interface SharedData {
  user: { name: string; email: string; image: string | null };
  records: RecordItem[];
  medicines: MedicineItem[];
  vitals: unknown[];
  expiresAt: string;
}

export default function SharedProfilePage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSharedProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/share/${params.token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Invalid or expired share link.");
      } else {
        setData(json);
      }
    } catch {
      setError("Failed to load shared health profile.");
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  useEffect(() => {
    fetchSharedProfile();
  }, [fetchSharedProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-sm font-medium text-slate-500">Loading shared medical record...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 text-center space-y-3 shadow-sm">
          <Lock className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">{error || "This shared link is invalid or has expired."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full w-fit">
              <ShieldCheck className="w-4 h-4" /> Secure Shared Profile • LifeOS
            </div>
            <h1 className="text-2xl font-bold mt-2">{data.user.name || "Patient Profile"}</h1>
            <p className="text-xs text-blue-100 mt-0.5">Read-Only Medical Access • Link expires on {data.expiresAt}</p>
          </div>
        </div>

        {/* Medical Records */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Medical Records ({data.records.length})
          </h2>
          {data.records.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No medical records shared.</p>
          ) : (
            <div className="space-y-3">
              {data.records.map((r, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-900">{r.title}</h3>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{r.category}</span>
                  </div>
                  <p className="text-xs text-slate-500">{r.doctor} • {r.hospital} • {r.date}</p>
                  {r.findings && <p className="text-xs text-slate-700 pt-1 font-mono">{r.findings}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Medicines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-600" /> Active Medicines ({data.medicines.length})
          </h2>
          {data.medicines.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No active prescriptions listed.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.medicines.map((m, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-emerald-50/30 text-xs space-y-0.5">
                  <h3 className="font-semibold text-slate-900">{m.name}</h3>
                  <p className="text-slate-600">{m.dosage} • {m.frequency}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
