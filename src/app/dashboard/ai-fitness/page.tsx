"use client";

import React, { useState } from "react";
import { Dumbbell, Sparkles } from "lucide-react";
import FormattedMarkdown from "@/components/FormattedMarkdown";
import AIExportToolbar from "@/components/AIExportToolbar";

export default function AIFitnessPage() {
  const [fitnessGoal, setFitnessGoal] = useState("Muscle Building");
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [equipment, setEquipment] = useState("Dumbbells & Resistance Bands");
  const [loading, setLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<string | null>(null);

  async function handleGenerateWorkout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setWorkoutPlan(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a comprehensive weekly workout plan for goal: "${fitnessGoal}", training frequency: "${daysPerWeek} days/week", and equipment: "${equipment}". Format the workout schedule into a clean Markdown table with Columns: Day, Target Focus, Specific Exercises, Sets & Reps.`,
        }),
      });

      const data = await res.json();
      setWorkoutPlan(data.answer);
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
          <Dumbbell className="w-7 h-7 text-indigo-600" /> AI Fitness & Workout Planner
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate structured weekly training regimens, exercise volume progression, and mobility protocols.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <form onSubmit={handleGenerateWorkout} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Fitness Goal</label>
              <select
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Muscle Building">Hypertrophy / Muscle Building</option>
                <option value="Fat Loss">Fat Loss & Conditioning</option>
                <option value="Endurance">Cardiovascular Endurance</option>
                <option value="Strength">Maximal Strength</option>
                <option value="General Health">General Longevity & Mobility</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Training Days per Week</label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="3">3 Days (Full Body)</option>
                <option value="4">4 Days (Upper / Lower)</option>
                <option value="5">5 Days (Push / Pull / Legs)</option>
                <option value="6">6 Days (Advanced Split)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Available Equipment</label>
            <input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Commercial Gym, Dumbbells only, Bodyweight..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Building Workout..." : "Generate Workout Plan"}
            </button>
          </div>
        </form>

        {workoutPlan && (
          <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
            <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-indigo-600" /> Customized AI Weekly Workout Strategy
            </h3>
            <FormattedMarkdown content={workoutPlan} />
            <AIExportToolbar title="AI Workout Strategy Report" content={workoutPlan} />
          </div>
        )}
      </div>
    </div>
  );
}
