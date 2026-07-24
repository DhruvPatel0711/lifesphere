"use client";

import React, { useState, useEffect } from "react";
import { Stethoscope, Send, Activity, AlertTriangle, ShieldAlert, CheckCircle2, Trash2 } from "lucide-react";
import FormattedMarkdown from "@/components/FormattedMarkdown";
import AIExportToolbar from "@/components/AIExportToolbar";

interface AssessmentResult {
  urgency: "Low" | "Medium" | "High" | "Emergency";
  summary: string;
  possibleCauses: string[];
  recommendedSpecialist: string;
  nextSteps: string[];
  disclaimer: string;
}

const STORAGE_KEY = "lifesphere_ai_symptom_assessment";
const INPUT_KEY = "lifesphere_ai_symptom_input";

export default function AISymptomPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);

  // Load state on mount
  useEffect(() => {
    try {
      const savedInput = localStorage.getItem(INPUT_KEY);
      if (savedInput) setInput(savedInput);

      const savedAssessment = localStorage.getItem(STORAGE_KEY);
      if (savedAssessment) setAssessment(JSON.parse(savedAssessment));
    } catch (e) {
      console.error("Failed to load saved symptom assessment:", e);
    }
  }, []);

  // Save state on updates
  useEffect(() => {
    try {
      if (assessment) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(assessment));
        localStorage.setItem(INPUT_KEY, input);
      }
    } catch (e) {
      console.error("Failed to save symptom assessment:", e);
    }
  }, [assessment, input]);

  const handleClear = () => {
    setAssessment(null);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INPUT_KEY);
  };

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setAssessment(null);

    try {
      const res = await fetch("/api/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: input }),
      });

      const data = await res.json();
      if (data.success && data.assessment) {
        setAssessment(data.assessment);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency || urgency.includes("Unknown") || urgency.includes("Incomplete")) {
      return <span className="bg-slate-700 text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">❓ Assessment Incomplete</span>;
    }

    switch (urgency) {
      case "Emergency":
        return <span className="bg-red-600 text-white font-black px-3 py-1 rounded-full text-xs uppercase tracking-wider">🚨 Emergency</span>;
      case "High":
        return <span className="bg-orange-500 text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">⚠️ High Urgency</span>;
      case "Medium":
        return <span className="bg-amber-500 text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">🟡 Moderate</span>;
      default:
        return <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">🟢 Low Risk</span>;
    }
  };

  const exportText = assessment
    ? `SYMPTOM TRIAGE REPORT\nUrgency: ${assessment.urgency}\nSpecialist: ${assessment.recommendedSpecialist}\n\nSummary:\n${assessment.summary}\n\nPotential Causes:\n${assessment.possibleCauses?.join("\n")}\n\nNext Steps:\n${assessment.nextSteps?.join("\n")}\n\n${assessment.disclaimer}`
    : "";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-teal-600" /> AI Symptom Checker & Triage
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Describe your symptoms to receive an instant AI Triage evaluation, urgency breakdown, and specialist guidance.
          </p>
        </div>

        {assessment && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition-colors bg-white"
            title="Clear Assessment"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Output
          </button>
        )}
      </div>

      {/* Prominent Non-Diagnostic Medical Disclaimer */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs font-medium leading-relaxed">
          <span className="font-bold text-amber-950 block mb-0.5">NOT A MEDICAL DIAGNOSIS</span>
          This AI Symptom Assessment tool provides automated triage information only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a licensed doctor for medical concerns. In an emergency, trigger Emergency SOS or call emergency services immediately.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Describe your symptoms in detail:
            </label>
            <textarea
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Sharp pain in lower right abdomen starting 4 hours ago, mild nausea, low-grade fever..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              🔒 Confidential AI Assessment
            </span>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? "Analyzing Symptoms..." : "Analyze Symptoms"}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {assessment && (
          <div className="mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" /> Triage Assessment Result
              </h3>
              {getUrgencyBadge(assessment.urgency)}
            </div>

            <FormattedMarkdown content={assessment.summary} />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Potential Causes</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                  {assessment.possibleCauses?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recommended Specialist</h4>
                <p className="text-sm font-bold text-teal-700">{assessment.recommendedSpecialist}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recommended Next Steps</h4>
              <ul className="text-xs text-slate-700 space-y-1.5">
                {assessment.nextSteps?.map((step, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <AIExportToolbar title="AI Symptom Triage Report" content={exportText} />

            {/* Mandatory Response Disclaimer */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[11px] text-red-800 font-medium flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{assessment.disclaimer}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
