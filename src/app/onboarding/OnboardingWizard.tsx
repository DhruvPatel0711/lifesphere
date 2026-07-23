"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

interface UserSession {
  id: string;
  name?: string | null;
  email?: string | null;
}

export default function OnboardingWizard({ user }: { user: UserSession }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("General Health & Vital Tracking");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    setSaving(true);
    try {
      if (contactName && contactPhone) {
        await fetch("/api/emergency/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: contactName,
            phone: contactPhone,
            relationship: "Primary Emergency Contact",
            isPrimary: true,
          }),
        });
      }
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-3xl p-8 shadow-2xl border border-slate-800">
      {/* Header Progress */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
            L
          </div>
          <span className="font-extrabold text-xl text-slate-900 dark:text-white">LifeOS</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-2 rounded-full transition-colors ${
                s === step ? "bg-blue-600" : s < step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Welcome & Goal */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Step 1 of 3</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Welcome, {user.name || user.email?.split("@")[0]}! 👋</h2>
            <p className="text-slate-500 text-sm mt-1">Let&apos;s personalize your LifeOS AI health workspace in seconds.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">What is your primary health focus?</label>
            {[
              "General Health & Vital Tracking",
              "Managing Chronic Conditions & Medicines",
              "Fitness & Nutrition Optimization",
              "Mental Wellness & Stress Reduction",
            ].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`w-full p-4 rounded-xl text-left border font-medium text-sm transition-all flex items-center justify-between ${
                  goal === g
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <span>{g}</span>
                {goal === g && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Emergency Contact */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Step 2 of 3</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Emergency SOS Contact 🚨</h2>
            <p className="text-slate-500 text-sm mt-1">Add a trusted contact who will receive live GPS SMS alerts in emergencies.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Full Name</label>
              <input
                type="text"
                placeholder="e.g. Sarah Connor"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (with Country Code)</label>
              <input
                type="tel"
                placeholder="e.g. +14155552671"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="w-1/3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: All Set */}
      {step === 3 && (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You&apos;re All Set!</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
              Your personalized LifeOS health dashboard, Groq AI coaches, and medical records vault are ready.
            </p>
          </div>

          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-md flex items-center justify-center gap-2"
          >
            {saving ? "Launching Dashboard..." : "Go to My Dashboard"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
