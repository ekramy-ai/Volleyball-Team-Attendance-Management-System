import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  X, 
  Check, 
  AlertCircle, 
  ShieldAlert, 
  Lock, 
  UserCheck, 
  Filter
} from 'lucide-react';
import { CoachTeamRecord, CoachRecord } from '../../types/database';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';

export const TeamAssignmentsView: React.FC = () => {
  const { t, language, isRtl, currentUser } = useApp();
  const [assignments, setAssignments] = useState<CoachTeamRecord[]>([]);
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [coachFilter, setCoachFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<CoachTeamRecord | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<CoachTeamRecord | null>(null);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    CoachID: string;
    TeamName: string;
    PermissionLevel: 'FULL_MANAGE' | 'RECORD_ONLY';
    Active: boolean;
  }>({
    CoachID: '',
    TeamName: '',
    PermissionLevel: 'FULL_MANAGE',
    Active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setActionError('');

      // 1. Fetch Assignments
      const res = await fetch('/api/admin/coach-teams');
      const data = await res.json();
      if (data.success && data.assignments) {
        setAssignments(data.assignments);
      }

      // 2. Fetch Coaches
      const coachRes = await fetch('/api/admin/coaches');
      const coachData = await coachRes.json();
      if (coachData.success && coachData.coaches) {
        setCoaches(coachData.coaches);
      }

      // 3. Fetch Master Teams
      const teamRes = await fetch('/api/database/overview');
      const teamData = await teamRes.json();
      if (teamData.success && teamData.distinctTeams) {
        setTeams(teamData.distinctTeams);
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to fetch team assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    const defaultCoach = coaches.find(c => c.AccountStatus === 'Active')?.CoachID || (coaches[0]?.CoachID || '');
    const defaultTeam = teams[0] || '';
    setFormData({
      CoachID: defaultCoach,
      TeamName: defaultTeam,
      PermissionLevel: 'FULL_MANAGE',
      Active: true
    });
    setActionError('');
    setActionSuccess('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (assignment: CoachTeamRecord) => {
    setEditingAssignment(assignment);
    setFormData({
      CoachID: assignment.CoachID,
      TeamName: assignment.TeamName,
      PermissionLevel: assignment.PermissionLevel,
      Active: assignment.Active
    });
    setActionError('');
    setActionSuccess('');
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.CoachID || !formData.TeamName) {
      setActionError(language === 'ar' ? 'الرجاء اختيار المدرب والفريق.' : 'Coach and team selection are required.');
      return;
    }

    setIsSubmitting(true);
    setActionError('');
    try {
      const res = await fetch('/api/admin/coach-teams', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(language === 'ar' ? 'تم تعيين المدرب على الفريق بنجاح وتحديث مصفوفة الصلاحيات.' : 'Assignment created successfully and audit logged.');
        setIsAddModalOpen(false);
        fetchData();
      } else {
        setActionError(data.error || 'Failed to create assignment');
      }
    } catch (err: any) {
      setActionError(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    setIsSubmitting(true);
    setActionError('');
    try {
      const res = await fetch(`/api/admin/coach-teams/${editingAssignment.AssignmentID}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(language === 'ar' ? 'تم تحديث بيانات التعيين ومستوى الصلاحية.' : 'Assignment updated successfully.');
        setEditingAssignment(null);
        fetchData();
      } else {
        setActionError(data.error || 'Failed to update assignment');
      }
    } catch (err: any) {
      setActionError(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (assignment: CoachTeamRecord) => {
    const nextActive = !assignment.Active;
    try {
      const res = await fetch(`/api/admin/coach-teams/${assignment.AssignmentID}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({ Active: nextActive })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to toggle assignment status');
      }
    } catch (err: any) {
      alert(err.message || 'Server error occurred');
    }
  };

  const handleDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/coach-teams/${deletingAssignment.AssignmentID}`, {
        method: 'DELETE',
        headers: { 
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        }
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(language === 'ar' ? 'تم حذف التعيين وتوثيق العملية في سجل التدقيق.' : 'Assignment removed successfully.');
        setDeletingAssignment(null);
        fetchData();
      } else {
        setActionError(data.error || 'Failed to delete assignment');
      }
    } catch (err: any) {
      setActionError(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (coachFilter !== 'ALL' && a.CoachID !== coachFilter) return false;
      if (teamFilter !== 'ALL' && a.TeamName !== teamFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCoach = (a.CoachName || '').toLowerCase().includes(q);
        const matchTeam = a.TeamName.toLowerCase().includes(q);
        const matchId = a.AssignmentID.toLowerCase().includes(q);
        const matchEmail = (a.CoachEmail || '').toLowerCase().includes(q);
        if (!matchCoach && !matchTeam && !matchId && !matchEmail) return false;
      }
      return true;
    });
  }, [assignments, coachFilter, teamFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl shrink-0 border border-amber-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-black bg-amber-600 text-white rounded-md tracking-wider">
                COACH_TEAMS TABLE
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'إدارة تعيينات المدربين على الفرق' : 'Team Assignments & Access Matrix'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar' 
                ? 'تخصيص صلاحيات المدربين على الفرق الرسمية (إدارة كاملة / تسجيل فقط) مع التوثيق المباشر.' 
                : 'Assign coaches to squads, configure permissions (FULL_MANAGE / RECORD_ONLY), and audit logs.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تعيين مدرب جديد' : 'Assign Coach'}</span>
          </button>
        </div>
      </div>

      {/* Success / Error Feedback Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="p-1 hover:bg-emerald-500/20 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث بالمدرب، الفريق، أو المعرف...' : 'Search by coach, team, ID...'}
            className={`w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition ${
              isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        {/* Coach Filter */}
        <div>
          <select
            value={coachFilter}
            onChange={e => setCoachFilter(e.target.value)}
            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
          >
            <option value="ALL">👤 {language === 'ar' ? 'جميع المدربين' : 'All Coaches'}</option>
            {coaches.map(c => (
              <option key={c.CoachID} value={c.CoachID}>
                {c.FullName} ({c.CoachID})
              </option>
            ))}
          </select>
        </div>

        {/* Team Filter */}
        <div>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
          >
            <option value="ALL">🏟️ {language === 'ar' ? 'جميع الفرق' : 'All Teams'}</option>
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Assignments */}
      {loading ? (
        <LoadingState type="skeleton" rows={5} />
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {language === 'ar' ? 'لم يتم العثور على تعيينات مطابقة' : 'No team assignments found'}
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'ar' ? 'انقر على "تعيين مدرب جديد" لإضافة تعيين جديد إلى جدول COACH_TEAMS.' : 'Click "Assign Coach" to add a new assignment.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3.5 px-4 text-start font-mono text-[11px]">Assignment ID</th>
                  <th className="py-3.5 px-4 text-start">{language === 'ar' ? 'المدرب' : 'Coach'}</th>
                  <th className="py-3.5 px-4 text-start">{t.colTeam}</th>
                  <th className="py-3.5 px-4 text-start">{language === 'ar' ? 'مستوى الصلاحية' : 'Permission Level'}</th>
                  <th className="py-3.5 px-4 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-center">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredAssignments.map(row => (
                  <tr key={row.AssignmentID} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {row.AssignmentID}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {row.CoachName || row.CoachID}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 dir-ltr text-start block">
                        {row.CoachEmail || row.CoachID}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                        🏐 {row.TeamName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        row.PermissionLevel === 'FULL_MANAGE'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                      }`}>
                        <Lock className="w-3 h-3" />
                        <span>{row.PermissionLevel}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(row)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          row.Active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-600'
                        }`}
                        title={language === 'ar' ? 'انقر لتبديل الحالة' : 'Click to toggle status'}
                      >
                        {row.Active ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>{language === 'ar' ? 'نشط' : 'Active'}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            <span>{language === 'ar' ? 'غير نشط' : 'Inactive'}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(row)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                          title={language === 'ar' ? 'تعديل' : 'Edit'}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button
                          onClick={() => setDeletingAssignment(row)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 transition"
                          title={language === 'ar' ? 'حذف التعيين' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Assignment Modal */}
      {(isAddModalOpen || editingAssignment) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {editingAssignment 
                      ? (language === 'ar' ? `تعديل التعيين: ${editingAssignment.AssignmentID}` : `Edit Assignment: ${editingAssignment.AssignmentID}`)
                      : (language === 'ar' ? 'تعيين مدرب جديد على فريق' : 'New Coach-Team Assignment')}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'جدول COACH_TEAMS في Google Apps Script' : 'COACH_TEAMS Security Layer'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingAssignment(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment} className="space-y-4 text-xs">
              {/* Select Coach */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'اختر المدرب (Coach)' : 'Select Coach'} *
                </label>
                <select
                  disabled={Boolean(editingAssignment)}
                  value={formData.CoachID}
                  onChange={e => setFormData({ ...formData, CoachID: e.target.value })}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden disabled:opacity-60"
                >
                  <option value="">-- {language === 'ar' ? 'اختر مدرباً مسجلاً' : 'Select Coach'} --</option>
                  {coaches.map(c => (
                    <option key={c.CoachID} value={c.CoachID}>
                      {c.FullName} ({c.Role}) - {c.AccountStatus}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Team */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'اختر الفريق (Team)' : 'Select Team'} *
                </label>
                <select
                  value={formData.TeamName}
                  onChange={e => setFormData({ ...formData, TeamName: e.target.value })}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                >
                  <option value="">-- {language === 'ar' ? 'اختر فريقاً معتمداً' : 'Select Team'} --</option>
                  {teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Permission Level */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'مستوى الصلاحية (Permission Level)' : 'Permission Level'}
                </label>
                <select
                  value={formData.PermissionLevel}
                  onChange={e => setFormData({ ...formData, PermissionLevel: e.target.value as any })}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                >
                  <option value="FULL_MANAGE">FULL_MANAGE ({language === 'ar' ? 'إدارة كاملة: حضور + جلسات + إحصائيات' : 'Full Management'})</option>
                  <option value="RECORD_ONLY">RECORD_ONLY ({language === 'ar' ? 'تسجيل حضور فقط' : 'Record Only'})</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeAssignmentCheck"
                  checked={formData.Active}
                  onChange={e => setFormData({ ...formData, Active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="activeAssignmentCheck" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {language === 'ar' ? 'تعيين نشط ومفعل فوراً' : 'Active Assignment'}
                </label>
              </div>

              {/* Audit notice */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'ar'
                    ? 'سيتم تحديث بوابات الحماية Backend Security Guards وتوثيق الإجراء في AUDIT_LOG.'
                    : 'Backend security guards will immediately reflect this assignment and log to AUDIT_LOG.'}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingAssignment(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-md shadow-amber-600/20"
                >
                  {isSubmitting 
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : editingAssignment 
                    ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                    : (language === 'ar' ? 'حفظ التعيين' : 'Save Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'تأكيد إزالة تعيين المدرب' : 'Confirm Assignment Removal'}
              </h3>
              <p className="text-slate-500">
                {language === 'ar' 
                  ? `هل أنت متأكد من إزالة تعيين الكابتن "${deletingAssignment.CoachName}" عن فريق "${deletingAssignment.TeamName}"؟`
                  : `Are you sure you want to remove assignment for ${deletingAssignment.CoachName}?`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingAssignment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteAssignment}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition"
              >
                {isSubmitting ? (language === 'ar' ? 'جاري الإزالة...' : 'Removing...') : (language === 'ar' ? 'نعم، إزالة التعيين' : 'Yes, Remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
