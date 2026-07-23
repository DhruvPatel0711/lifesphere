"use client";

import React, { useState } from "react";
import { Dumbbell, Sparkles, Trophy } from "lucide-react";

export default function AIFitnessPage() {
  const [goal, setGoal] = useState("Weight Loss");
  const [fitnessLevel, setFitnessLevel] = useState("Intermediate");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  async function handleGeneratePlan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPlan(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a personalized weekly fitness workout plan and daily calorie burn target for a user with goal: "${goal}" and fitness level: "${fitnessLevel}". Include daily exercises, sets, reps, and warmups/cooldowns.`,
        }),
      });

      const data = await res.json();
      setPlan(data.answer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Dumbbell className="w-7 h-7 text-orange-500" /> AI Fitness Coach
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Receive tailored weekly workout routines, exercise breakdowns, and calorie targets driven by AI.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Fitness Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Weight Loss">Weight Loss & Fat Burn</option>
              <option value="Muscle Building">Muscle Building & Hypertrophy</option>
              <option value="Cardio Endurance">Cardio & Stamina</option>
              <option value="Flexibility">Flexibility & Core Strength</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fitness Level</label>
            <select
              value={fitnessLevel}
              onChange={(e) => setFitnessLevel(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Generating..." : "Generate Workout Plan"}
          </button>
        </form>

        {plan && (
          <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
            <h3 className="font-bold text-sm text-orange-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-600" /> Tailored Workout Routine
            </h3>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
              {plan}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
