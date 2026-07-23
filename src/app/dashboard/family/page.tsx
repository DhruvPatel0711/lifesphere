"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, HeartPulse, AlertCircle } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: number | null;
  gender: string | null;
  allergies: string | null;
  conditions: string | null;
}

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch("/api/family");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.familyMembers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { addFamilyMember } = await import("./actions");
    await addFamilyMember(formData);
    setShowAddModal(false);
    fetchMembers();
  }

  async function handleDeleteMember(id: string) {
    if (!confirm("Are you sure you want to remove this family member profile?")) return;
    const { deleteFamilyMember } = await import("./actions");
    await deleteFamilyMember(id);
    fetchMembers();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" /> Family Health Profiles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage health records, allergies, and chronic conditions for your spouse, children, and parents.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Family Profile
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-slate-500 py-4">Loading family profiles...</p>
      ) : members.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">No Family Profiles Created</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Add dependent family member profiles to track their medical records and health stats.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:underline pt-2"
          >
            Add first family profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 relative hover:border-indigo-200 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{m.name}</h3>
                  <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    {m.relationship} {m.age ? `• ${m.age} yrs` : ""} {m.gender ? `• ${m.gender}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMember(m.id)}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                  title="Remove Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                {m.allergies && (
                  <div className="flex items-start gap-1.5 text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Allergies:</strong> {m.allergies}</span>
                  </div>
                )}
                {m.conditions && (
                  <div className="flex items-start gap-1.5 text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <HeartPulse className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span><strong>Conditions:</strong> {m.conditions}</span>
                  </div>
                )}
                {!m.allergies && !m.conditions && (
                  <p className="text-slate-400 italic">No allergies or conditions listed.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Family Profile</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Leo Smith"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Relationship *</label>
                  <select
                    name="relationship"
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
                  <input
                    name="age"
                    type="number"
                    placeholder="8"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Known Allergies</label>
                <input
                  name="allergies"
                  placeholder="Peanuts, Penicillin..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chronic Health Conditions</label>
                <input
                  name="conditions"
                  placeholder="Asthma, Diabetes..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-sm"
                >
                  Save Family Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
