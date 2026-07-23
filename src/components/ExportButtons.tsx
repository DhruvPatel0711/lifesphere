"use client";

import React from "react";
import { exportToCSV, printHealthReport } from "@/lib/export";
import { Download, Printer } from "lucide-react";

interface ExportButtonsProps {
  user?: { name?: string | null; email?: string | null };
  records?: Array<{ title: string; category: string; doctor?: string | null; hospital?: string | null; date?: string | null }>;
  medicines?: Array<{ name: string; dosage: string; frequency: string; type: string }>;
  variant?: "compact" | "full";
}

export default function ExportButtons({ user, records = [], medicines = [], variant = "full" }: ExportButtonsProps) {
  function handleExportCSV() {
    if (records.length === 0) {
      alert("No medical records available to export.");
      return;
    }

    const rows = records.map(r => ({
      Title: r.title,
      Category: r.category,
      Doctor: r.doctor || "-",
      Hospital: r.hospital || "-",
      Date: r.date || "-",
    }));

    exportToCSV(`LifeOS_Medical_Records_${new Date().toISOString().split("T")[0]}.csv`, rows);
  }

  function handlePrintPDF() {
    printHealthReport(
      { name: user?.name || undefined, email: user?.email || undefined },
      records.map(r => ({
        title: r.title,
        category: r.category,
        doctor: r.doctor || undefined,
        hospital: r.hospital || undefined,
        date: r.date || undefined,
      })),
      medicines
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleExportCSV}
          className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm"
          title="Export records to CSV file"
        >
          <Download size={14} /> Export CSV
        </button>
        <button
          onClick={handlePrintPDF}
          className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-sm"
          title="Print or Save PDF report"
        >
          <Printer size={14} /> Print PDF Report
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleExportCSV}
        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
      >
        <Download size={16} /> Export Records (CSV)
      </button>
      <button
        onClick={handlePrintPDF}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
      >
        <Printer size={16} /> Print Health Summary (PDF)
      </button>
    </div>
  );
}
