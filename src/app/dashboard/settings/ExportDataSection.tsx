"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

export default function ExportDataSection() {
  const [downloading, setDownloading] = useState(false);

  async function handleExportCSV() {
    setDownloading(true);
    try {
      const res = await fetch("/api/records");
      const records = await res.json();
      
      let csvContent = "data:text/csv;charset=utf-8,Title,Category,Doctor,Hospital,Date,Findings\n";
      if (Array.isArray(records)) {
        records.forEach((r) => {
          csvContent += `"${r.title || ""}","${r.category || ""}","${r.doctor || ""}","${r.hospital || ""}","${r.date || ""}","${(r.findings || "").replace(/"/g, '""')}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `lifesphere_medical_records_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  function handlePrintSummary() {
    window.print();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Download className="w-5 h-5 text-blue-600" />
        Data Export & Health Summary
      </h2>
      <p className="text-xs text-slate-500">
        Export your complete health profile, prescription histories, vitals trends, and medical records.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleExportCSV}
          disabled={downloading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {downloading ? "Generating CSV..." : "Export Records (CSV)"}
        </button>

        <button
          onClick={handlePrintSummary}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-2xs"
        >
          <Printer className="w-4 h-4" />
          Print Health Summary (PDF)
        </button>
      </div>
    </div>
  );
}
