"use client";

import React, { useState, useEffect } from "react";
import { Heart, Sparkles, Trash2 } from "lucide-react";
import FormattedMarkdown from "@/components/FormattedMarkdown";
import AIExportToolbar from "@/components/AIExportToolbar";

const STORAGE_KEY = "lifesphere_ai_mental_plan";

export default function AIMentalPage() {
  const [concern, setConcern] = useState("Workplace Stress & Sleep Optimization");
  const [loading, setLoading] = useState(false);
  const [mentalPlan, setMentalPlan] = useState<string | null>(null);

  // Load state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMentalPlan(saved);
      }
    } catch (e) {
      console.error("Failed to load saved mental health plan:", e);
    }
  }, []);

  // Save state on updates
  useEffect(() => {
    try {
      if (mentalPlan) {
        localStorage.setItem(STORAGE_KEY, mentalPlan);
      }
    } catch (e) {
      console.error("Failed to save mental health plan:", e);
    }
  }, [mentalPlan]);

  const handleClear = () => {
    setMentalPlan(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  async function handleGenerateMental(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMentalPlan(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a holistic mental health protocol for concern: "${concern}". Include a Markdown table detailing mindfulness techniques, circadian sleep hygiene rules, and stress reduction strategies with expected clinical benefits.`,
        }),
      });

      const data = await res.json();
      setMentalPlan(data.answer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-600" /> AI Mental Health & Stress Coach
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Receive evidence-based mindfulness protocols, circadian sleep optimization, and cognitive coping strategies.
          </p>
        </div>

        {mentalPlan && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition-colors bg-white"
            title="Clear Plan"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Output
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <form onSubmit={handleGenerateMental} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">What area would you like to focus on?</label>
            <input
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="e.g. Work stress, sleep insomnia, general anxiety, focus enhancement..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Building Plan..." : "Generate Mental Health Protocol"}
            </button>
          </div>
        </form>

        {mentalPlan && (
          <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
            <h3 className="font-bold text-sm text-rose-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-600" /> Mindful Health & Stress Protocol
            </h3>
            <FormattedMarkdown content={mentalPlan} />
            <AIExportToolbar title="AI Mental Health & Stress Report" content={mentalPlan} />
          </div>
        )}
      </div>
    </div>
  );
}
