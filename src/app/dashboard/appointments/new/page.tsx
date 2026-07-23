import React from "react";
import { createAppointment } from "../actions";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAppointmentPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Appointments
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" /> Book New Doctor Appointment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fill in the details for your upcoming consultation or checkup.
          </p>
        </div>

        <form action={createAppointment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor Name *</label>
              <input
                name="doctor"
                required
                placeholder="Dr. Robert Chen"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Specialty</label>
              <input
                name="specialty"
                placeholder="Cardiologist / General Physician"
                defaultValue="General Physician"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hospital / Clinic</label>
            <input
              name="hospital"
              placeholder="City General Hospital, Suite 402"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
              <input
                name="date"
                type="date"
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Time *</label>
              <input
                name="time"
                type="time"
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Visit / Symptoms</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Annual routine physical exam and blood pressure checkup..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/appointments"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm"
            >
              Schedule Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
