"use client";

import React, { useState } from "react";
import { Utensils, Sparkles } from "lucide-react";

export default function AINutritionPage() {
  const [dietType, setDietType] = useState("Balanced");
  const [targetCalories, setTargetCalories] = useState("2000");
  const [preferences, setPreferences] = useState("Indian Vegetarian Cuisine");
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<string | null>(null);

  async function handleGenerateDiet(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMealPlan(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a personalized daily meal plan for diet type: "${dietType}", target calorie count: "${targetCalories} kcal", and preference: "${preferences}". Include Breakfast, Lunch, Evening Snack, and Dinner with macro breakdowns (Protein, Carbs, Fats).`,
        }),
      });

      const data = await res.json();
      setMealPlan(data.answer);
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
          <Utensils className="w-7 h-7 text-emerald-600" /> AI Nutrition & Diet Planner
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Receive customized meal plans, macronutrient ratios, and dietary advice aligned with your health goals.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <form onSubmit={handleGenerateDiet} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diet Preference</label>
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Balanced">Balanced Omnivore</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Keto">Keto / Low Carb</option>
                <option value="High Protein">High Protein</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Calorie Target (kcal)</label>
              <input
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cuisine / Dietary Restrictions</label>
            <input
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. Indian cuisine, lactose-free, gluten-sensitive..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Generating Plan..." : "Generate Meal Plan"}
            </button>
          </div>
        </form>

        {mealPlan && (
          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
            <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-600" /> Customized Daily Meal Plan
            </h3>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
              {mealPlan}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
