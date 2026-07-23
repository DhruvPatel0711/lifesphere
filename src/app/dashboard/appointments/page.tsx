"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Plus, Trash2, Sparkles, Building2, User } from "lucide-react";

interface Appointment {
  id: string;
  doctor: string;
  specialty: string | null;
  hospital: string | null;
  date: string;
  time: string;
  notes: string | null;
  status: string | null;
  aiPrepNotes: string | null;
}

export default function AppointmentsPage() {
  const [list, setList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePrepModal, setActivePrepModal] = useState<Appointment | null>(null);
  const [generatingPrep, setGeneratingPrep] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setList(data.appointments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePrep(apt: Appointment) {
    setActivePrepModal(apt);
    if (!apt.aiPrepNotes) {
      setGeneratingPrep(true);
      try {
        const { generateAIPrep } = await import("./actions");
        const prep = await generateAIPrep(apt.id);
        setActivePrepModal({ ...apt, aiPrepNotes: prep });
        fetchAppointments();
      } catch (e) {
        console.error("AI Prep generation failed", e);
      } finally {
        setGeneratingPrep(false);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    const { deleteAppointment } = await import("./actions");
    await deleteAppointment(id);
    fetchAppointments();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-blue-600" />
            Appointments & Consultations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule doctor visits and generate AI preparation checklists before your appointment.
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-slate-500 py-4">Loading appointments...</p>
      ) : list.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">No Upcoming Appointments</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Stay on top of your health by scheduling regular checkups with your primary physician.
          </p>
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline pt-2"
          >
            Schedule your first visit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" /> {apt.doctor}
                    </h3>
                    <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">
                      {apt.specialty || "General Physician"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(apt.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                    title="Cancel Appointment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.date}</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 ml-2" />
                    <span>{apt.time}</span>
                  </div>
                  {apt.hospital && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.hospital}</span>
                    </div>
                  )}
                </div>

                {apt.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    &quot;{apt.notes}&quot;
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleGeneratePrep(apt)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  {apt.aiPrepNotes ? "View AI Prep Notes" : "Generate AI Prep Checklist"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Prep Modal */}
      {activePrepModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI Visit Prep Checklist
              </h3>
              <button
                onClick={() => setActivePrepModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="text-sm text-slate-700 space-y-2">
              <p className="text-xs text-slate-500">
                <strong>Doctor:</strong> {activePrepModal.doctor} ({activePrepModal.specialty})
              </p>

              {generatingPrep ? (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-xs font-medium">Analyzing medical history & generating doctor prep checklist...</p>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {activePrepModal.aiPrepNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
