"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Phone, Plus, Trash2, ShieldAlert, MapPin, CheckCircle2 } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relationship: string | null;
}

export default function EmergencyPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosStatus, setSosStatus] = useState<"idle" | "locating" | "sending" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const res = await fetch("/api/emergency/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error("Failed to fetch contacts", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerSOS() {
    setSosStatus("locating");
    setStatusMsg("Capturing your live GPS coordinates...");

    let lat: number | null = null;
    let lng: number | null = null;

    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        console.warn("Geolocation denied or timed out", e);
      }
    }

    setSosStatus("sending");
    setStatusMsg("Broadcasting SOS alert to all emergency contacts...");

    try {
      const res = await fetch("/api/emergency/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSosStatus("error");
        setStatusMsg(data.error || "Failed to dispatch SOS alert.");
      } else {
        setSosStatus("success");
        setStatusMsg(`SOS Alert dispatched successfully! Notified ${data.contactsNotified} contact(s).`);
      }
    } catch {
      setSosStatus("error");
      setStatusMsg("Network error dispatching SOS alert.");
    }
  }

  async function handleAddContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { addEmergencyContact } = await import("./actions");
    await addEmergencyContact(formData);
    setShowAddModal(false);
    fetchContacts();
  }

  async function handleDeleteContact(id: string) {
    if (!confirm("Are you sure you want to remove this contact?")) return;
    const { deleteEmergencyContact } = await import("./actions");
    await deleteEmergencyContact(id);
    fetchContacts();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-600" />
            Emergency SOS Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Broadcast live location and distress messages to designated contacts in urgent situations.
          </p>
        </div>
      </div>

      {/* Big Red SOS Button Card */}
      <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-8 text-white shadow-xl text-center flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none rounded-2xl" />
        
        <h2 className="text-xl font-bold uppercase tracking-wider text-red-100">
          Instant Distress Trigger
        </h2>

        <button
          onClick={handleTriggerSOS}
          disabled={sosStatus === "locating" || sosStatus === "sending"}
          className="w-36 h-36 rounded-full bg-white text-red-600 font-extrabold text-2xl shadow-2xl hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center border-4 border-red-200 disabled:opacity-50"
        >
          <AlertTriangle className="w-10 h-10 mb-1 animate-pulse" />
          SOS
        </button>

        {statusMsg && (
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            {sosStatus === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            {sosStatus === "locating" && <MapPin className="w-4 h-4 text-amber-300 animate-bounce" />}
            {statusMsg}
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            Designated Emergency Contacts ({contacts.length})
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 py-4">Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-sm text-slate-500">No emergency contacts added yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-sm text-blue-600 hover:underline font-medium"
            >
              Add your first emergency contact
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition"
              >
                <div>
                  <h4 className="font-semibold text-slate-900">{c.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{c.relationship || "Emergency Contact"}</p>
                  <p className="text-sm text-slate-700 font-mono mt-1">{c.phone}</p>
                  {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                </div>
                <button
                  onClick={() => handleDeleteContact(c.id)}
                  className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                  title="Remove Contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Emergency Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number (with Country Code)</label>
                <input
                  name="phone"
                  required
                  placeholder="+14155552671"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Relationship</label>
                <input
                  name="relationship"
                  placeholder="Spouse / Parent / Doctor"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address (Optional)</label>
                <input
                  name="email"
                  type="email"
                  placeholder="sarah@example.com"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
