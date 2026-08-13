import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Heart,
  Pill,
  ShieldCheck,
  Calendar,
  FolderIcon,
  X,
  Edit2,
  Trash2,
  Activity,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
  UserCheck
} from 'lucide-react';

const AVATAR_OPTIONS = ['👤', '👨', '👩', '👴', '👵', '👦', '👧', '👶', '🦸‍♂️', '👩‍⚕️'];
const RELATION_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other', label: 'Other' }
];

const Family = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    relation: 'father',
    age: '',
    blood_type: 'O+',
    avatar: '👤',
    conditionsStr: '',
    medicationsStr: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Vaccination Modal
  const [showVaxModal, setShowVaxModal] = useState(false);
  const [editingVax, setEditingVax] = useState(null);
  const [vaxForm, setVaxForm] = useState({
    name: '',
    person: 'Self',
    family_member_id: '',
    date: new Date().toISOString().split('T')[0],
    next_due: '',
    status: 'completed'
  });

  // Health Summary Modal
  const [summaryMember, setSummaryMember] = useState(null);
  const [summaryRecords, setSummaryRecords] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Filters
  const [vaxFilterPerson, setVaxFilterPerson] = useState('all');
  const [vaxFilterStatus, setVaxFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersData, vaxData] = await Promise.all([
        API.get('/family/members'),
        API.get('/family/vaccinations')
      ]);
      setMembers(membersData || []);
      setVaccinations(vaxData || []);
    } catch (err) {
      toast.error('Failed to load family health data');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const totalMembers = members.length;
  const totalConditions = members.reduce((acc, m) => acc + (m.conditions?.length || 0), 0);
  const totalMedications = members.reduce((acc, m) => acc + (m.medications?.length || 0), 0);
  const pendingVaccinations = vaccinations.filter(v => v.status === 'pending').length;

  // --- Member Handlers ---
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      relation: 'father',
      age: 30,
      blood_type: 'O+',
      avatar: '👤',
      conditionsStr: '',
      medicationsStr: ''
    });
    setShowMemberModal(true);
  };

  const handleOpenEditMember = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      relation: member.relation,
      age: member.age,
      blood_type: member.blood_type || 'O+',
      avatar: member.avatar || '👤',
      conditionsStr: (member.conditions || []).join(', '),
      medicationsStr: (member.medications || []).join(', ')
    });
    setShowMemberModal(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    const payload = {
      name: memberForm.name.trim(),
      relation: memberForm.relation,
      age: parseInt(memberForm.age) || 0,
      blood_type: memberForm.blood_type,
      avatar: memberForm.avatar,
      conditions: memberForm.conditionsStr ? memberForm.conditionsStr.split(',').map(s => s.trim()).filter(Boolean) : [],
      medications: memberForm.medicationsStr ? memberForm.medicationsStr.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    try {
      if (editingMember) {
        await API.put(`/family/members/${editingMember.id}`, payload);
        toast.success('Family member updated');
      } else {
        await API.post('/family/members', payload);
        toast.success('Family member added');
      }
      setShowMemberModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save family member');
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      await API.delete(`/family/members/${memberToDelete.id}`);
      toast.success('Family member removed');
      setShowDeleteModal(false);
      setMemberToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  // --- Health Summary Modal Handler ---
  const handleOpenHealthSummary = async (member) => {
    setSummaryMember(member);
    setLoadingSummary(true);
    try {
      const records = await API.get(`/records?family_member_id=${member.id}`);
      setSummaryRecords(records || []);
    } catch (err) {
      setSummaryRecords([]);
    } finally {
      setLoadingSummary(false);
    }
  };

  // --- Vaccination Handlers ---
  const handleOpenAddVax = () => {
    setEditingVax(null);
    setVaxForm({
      name: '',
      person: 'Self',
      family_member_id: '',
      date: new Date().toISOString().split('T')[0],
      next_due: '',
      status: 'completed'
    });
    setShowVaxModal(true);
  };

  const handleOpenEditVax = (vax) => {
    setEditingVax(vax);
    setVaxForm({
      name: vax.name,
      person: vax.person || 'Self',
      family_member_id: vax.family_member_id || '',
      date: vax.date ? String(vax.date).slice(0, 10) : '',
      next_due: vax.next_due ? String(vax.next_due).slice(0, 10) : '',
      status: vax.status || 'completed'
    });
    setShowVaxModal(true);
  };

  const handleSaveVax = async (e) => {
    e.preventDefault();
    if (!vaxForm.name.trim()) {
      toast.error('Please enter vaccine name');
      return;
    }

    let personName = 'Self';
    let memberId = null;
    if (vaxForm.family_member_id) {
      const m = members.find(mem => mem.id === vaxForm.family_member_id);
      if (m) {
        personName = m.name;
        memberId = m.id;
      }
    }

    const payload = {
      name: vaxForm.name.trim(),
      person: personName,
      family_member_id: memberId,
      date: vaxForm.date,
      next_due: vaxForm.next_due || null,
      status: vaxForm.status
    };

    try {
      if (editingVax) {
        await API.put(`/family/vaccinations/${editingVax.id}`, payload);
        toast.success('Vaccination record updated');
      } else {
        await API.post('/family/vaccinations', payload);
        toast.success('Vaccination record added');
      }
      setShowVaxModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save vaccination');
    }
  };

  const handleDeleteVax = async (vaxId) => {
    if (!window.confirm('Delete this vaccination log?')) return;
    try {
      await API.delete(`/family/vaccinations/${vaxId}`);
      toast.success('Vaccination record deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete vaccination');
    }
  };

  // Filtered vaccinations list
  const filteredVaccinations = vaccinations.filter(v => {
    if (vaxFilterPerson !== 'all') {
      if (vaxFilterPerson === 'self' && v.family_member_id) return false;
      if (vaxFilterPerson !== 'self' && v.family_member_id !== vaxFilterPerson) return false;
    }
    if (vaxFilterStatus !== 'all' && v.status !== vaxFilterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Title & Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Users className="w-8 h-8" />
            </div>
            Family Health Hub
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage your family's health profiles, active conditions, medications, and vaccination records securely.
          </p>
        </div>

        <button
          onClick={handleOpenAddMember}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Dashboard Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Family Members</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalMembers}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Conditions</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalConditions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Medicines</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalMedications}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Vaccine Pending</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{pendingVaccinations}</p>
          </div>
        </div>
      </div>

      {/* Family Members Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-500" />
            Family Member Profiles
          </h2>
          <span className="text-xs font-medium text-gray-400">
            {members.length} {members.length === 1 ? 'member' : 'members'} registered
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              👨‍👩‍👧‍👦
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Family Members Added Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 mb-6">
              Add your parents, spouse, or children to manage their health records, medications, and vaccination schedules.
            </p>
            <button
              onClick={handleOpenAddMember}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Member</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => (
              <div
                key={member.id}
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner">
                        {member.avatar || '👤'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                          {member.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full capitalize">
                            {member.relation}
                          </span>
                          <span className="text-xs text-gray-400">• {member.age} yrs</span>
                          <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                            {member.blood_type || 'O+'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditMember(member)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        title="Edit Member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setMemberToDelete(member); setShowDeleteModal(true); }}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                        title="Delete Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conditions & Medications tags */}
                  <div className="space-y-3 my-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-amber-500" /> Conditions
                      </p>
                      {member.conditions && member.conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {member.conditions.map((cond, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-lg">
                              {cond}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None reported</span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-emerald-500" /> Medications
                      </p>
                      {member.medications && member.medications.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {member.medications.map((med, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg">
                              {med}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None active</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <button
                    onClick={() => handleOpenHealthSummary(member)}
                    className="w-full py-2.5 px-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Summary</span>
                  </button>

                  <button
                    onClick={() => navigate(`/app/records?family_member_id=${member.id}`)}
                    className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FolderIcon className="w-4 h-4" />
                    <span>Records</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vaccination Tracker Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Vaccination Tracker
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Keep track of mandatory and booster vaccines for yourself and family members.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by Person */}
            <select
              value={vaxFilterPerson}
              onChange={(e) => setVaxFilterPerson(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">All Persons</option>
              <option value="self">Self Only</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={vaxFilterStatus}
              onChange={(e) => setVaxFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending / Booster Due</option>
            </select>

            <button
              onClick={handleOpenAddVax}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Vaccine</span>
            </button>
          </div>
        </div>

        {/* Vaccination Table */}
        {filteredVaccinations.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            No vaccination logs match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Vaccine Name</th>
                  <th className="py-3 px-4">Person</th>
                  <th className="py-3 px-4">Date Given</th>
                  <th className="py-3 px-4">Next Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredVaccinations.map(vax => (
                  <tr key={vax.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      {vax.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg">
                        {vax.person || 'Self'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {vax.date ? String(vax.date).slice(0, 10) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {vax.next_due ? (
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {String(vax.next_due).slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {vax.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full">
                          <AlertCircle className="w-3.5 h-3.5" /> Pending / Due
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditVax(vax)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVax(vax.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: Add/Edit Family Member --- */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 relative">
            <button
              onClick={() => setShowMemberModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingMember ? 'Edit Family Member' : 'Add Family Member'}
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Avatar Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setMemberForm({ ...memberForm, avatar: emoji })}
                      className={`w-10 h-10 text-xl rounded-xl border flex items-center justify-center transition-transform ${memberForm.avatar === emoji ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 scale-110' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. Robert Smith"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Relation & Age & Blood Type */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Relation</label>
                  <select
                    value={memberForm.relation}
                    onChange={(e) => setMemberForm({ ...memberForm, relation: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                  >
                    {RELATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Age</label>
                  <input
                    type="number"
                    value={memberForm.age}
                    onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                    placeholder="60"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Blood Type</label>
                  <select
                    value={memberForm.blood_type}
                    onChange={(e) => setMemberForm({ ...memberForm, blood_type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Conditions (comma separated)</label>
                <input
                  type="text"
                  value={memberForm.conditionsStr}
                  onChange={(e) => setMemberForm({ ...memberForm, conditionsStr: e.target.value })}
                  placeholder="e.g. Hypertension, Diabetes Type 2"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Medications */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Medications (comma separated)</label>
                <input
                  type="text"
                  value={memberForm.medicationsStr}
                  onChange={(e) => setMemberForm({ ...memberForm, medicationsStr: e.target.value })}
                  placeholder="e.g. Lisinopril 10mg, Metformin 500mg"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md"
                >
                  {editingMember ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Delete Confirmation --- */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete {memberToDelete.name}?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">
              This will remove their profile from your Family Hub. Attached medical records will remain safely in your vault.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Health Summary Modal --- */}
      {summaryMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSummaryMember(null)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center text-4xl shrink-0">
                {summaryMember.avatar || '👤'}
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {summaryMember.name} — Health Summary
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full capitalize">
                    {summaryMember.relation}
                  </span>
                  <span className="text-xs text-gray-400">• {summaryMember.age} years old</span>
                  <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                    Blood Group: {summaryMember.blood_type || 'O+'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6 py-6">
              {/* Conditions & Medicines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <Heart className="w-4 h-4" /> Active Conditions
                  </h4>
                  {summaryMember.conditions?.length > 0 ? (
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {summaryMember.conditions.map((c, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No reported conditions.</p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Pill className="w-4 h-4" /> Current Medications
                  </h4>
                  {summaryMember.medications?.length > 0 ? (
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {summaryMember.medications.map((m, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No active medications.</p>
                  )}
                </div>
              </div>

              {/* Medical Records Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FolderIcon className="w-4 h-4 text-blue-500" />
                  Attached Medical Records ({summaryRecords.length})
                </h4>

                {loadingSummary ? (
                  <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
                ) : summaryRecords.length === 0 ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-center text-xs text-gray-400">
                    No medical records uploaded for {summaryMember.name} yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summaryRecords.map(rec => (
                      <div key={rec.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{rec.title}</p>
                            <p className="text-[11px] text-gray-400">{rec.category} • {rec.doctor || rec.hospital || 'General'}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">{rec.date ? String(rec.date).slice(0, 10) : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vaccinations Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  Vaccinations Logged
                </h4>

                {vaccinations.filter(v => v.family_member_id === summaryMember.id).length === 0 ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-center text-xs text-gray-400">
                    No vaccinations logged for {summaryMember.name}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vaccinations.filter(v => v.family_member_id === summaryMember.id).map(v => (
                      <div key={v.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{v.name}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${v.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSummaryMember(null)}
                className="px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Log Vaccination --- */}
      {showVaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 relative">
            <button
              onClick={() => setShowVaxModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingVax ? 'Edit Vaccination Entry' : 'Log Vaccination Entry'}
            </h3>

            <form onSubmit={handleSaveVax} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vaccine Name *</label>
                <input
                  type="text"
                  value={vaxForm.name}
                  onChange={(e) => setVaxForm({ ...vaxForm, name: e.target.value })}
                  placeholder="e.g. COVID-19 Booster, Influenza"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Administered To</label>
                <select
                  value={vaxForm.family_member_id}
                  onChange={(e) => setVaxForm({ ...vaxForm, family_member_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="">Self (Primary Account)</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date Given</label>
                  <input
                    type="date"
                    value={vaxForm.date}
                    onChange={(e) => setVaxForm({ ...vaxForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next Due Date</label>
                  <input
                    type="date"
                    value={vaxForm.next_due}
                    onChange={(e) => setVaxForm({ ...vaxForm, next_due: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={vaxForm.status}
                  onChange={(e) => setVaxForm({ ...vaxForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending / Booster Scheduled</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowVaxModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Family;
