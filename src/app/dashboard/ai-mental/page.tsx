"use client";

import React, { useState } from "react";
import { Brain, Heart, Sparkles, PhoneCall } from "lucide-react";

export default function AIMentalPage() {
  const [mood, setMood] = useState("Calm");
  const [journal, setJournal] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  async function handleAnalyzeMood(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `The user feels "${mood}" today. Journal entry: "${journal}". Provide compassionate AI mental health coping guidance, mindfulness strategies, and supportive advice. Keep it empathetic.`,
        }),
      });

      const data = await res.json();
      setResponse(data.answer);
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
          <Brain className="w-7 h-7 text-purple-600" /> AI Mental Health & Journal
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track your daily mood, express your feelings in a private journal, and receive therapeutic coping strategies.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Helpline Banner */}
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-purple-600" />
            <span>Need immediate support? Contact Mental Health Helpline: <strong>9152987821 (iCall)</strong></span>
          </div>
        </div>

        <form onSubmit={handleAnalyzeMood} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">How are you feeling today?</label>
            <div className="flex items-center gap-3">
              {["Happy", "Calm", "Anxious", "Stressed", "Sad"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                    mood === m
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Mental Health Journal</label>
            <textarea
              rows={4}
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Reflect on your thoughts, emotions, or challenges today..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !journal.trim()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Analyzing..." : "Get Mental Coping Support"}
            </button>
          </div>
        </form>

        {response && (
          <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
            <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-purple-600" /> AI Support & Coping Guidance
            </h3>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
