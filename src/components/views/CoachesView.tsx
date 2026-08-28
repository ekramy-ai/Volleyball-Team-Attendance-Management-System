import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, 
  Mail, 
  Phone, 
  Shield, 
  RefreshCw, 
  Plus, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  X, 
  Check, 
  AlertCircle, 
  ShieldAlert, 
  UserPlus, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { CoachRecord, UserRole } from '../../types/database';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';

export const CoachesView: React.FC = () => {
  const { t, language, isRtl, currentUser } = useApp();
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCoach, setEditingCoach] = useState<CoachRecord | null>(null);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    FullName: string;
    Email: string;
    Phone: string;
    Role: UserRole;
    AccountStatus: 'Active' | 'Inactive';
  }>({
    FullName: '',
    Email: '',
    Phone: '',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active'
  });

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      setActionError('');
      const res = await fetch('/api/admin/coaches');
      const data = await res.json();
      if (data.success && data.coaches) {
        setCoaches(data.coaches);
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const openAddModal = () => {
    setFormData({
      FullName: '',
      Email: '',
      Phone: '',
      Role: 'HEAD_COACH',
      AccountStatus: 'Active'
    });
    setActionError('');
    setActionSuccess('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (coach: CoachRecord) => {
    setEditingCoach(coach);
    setFormData({
      FullName: coach.FullName || '',
      Email: coach.Email || '',
      Phone: coach.Phone || '',
      Role: coach.Role || 'HEAD_COACH',
      AccountStatus: coach.AccountStatus || 'Active'
    });
    setActionError('');
    setActionSuccess('');
  };

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.FullName.trim() || !formData.Email.trim()) {
      setActionError(language === 'ar' ? 'الرجاء إدخال الاسم والبريد الإلكتروني.' : 'Full name and email are required.');
      return;
    }

    setIsSubmitting(true);
    setActionError('');
    try {
      const res = await fetch('/api/admin/coaches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(language === 'ar' ? 'تم إضافة المدرب بنجاح وتوثيق العملية في سجل التدقيق.' : 'Coach added successfully and audit logged.');
        setIsAddModalOpen(false);
        fetchCoaches();
      } else {
        setActionError(data.error || 'Failed to add coach');
      }
    } catch (err: any) {
      setActionError(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoach) return;
    if (!formData.FullName.trim() || !formData.Email.trim()) {
      setActionError(language === 'ar' ? 'الرجاء إدخال الاسم والبريد الإلكتروني.' : 'Full name and email are required.');
      return;
    }

    setIsSubmitting(true);
    setActionError('');
    try {
      const res = await fetch(`/api/admin/coaches/${editingCoach.CoachID}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(language === 'ar' ? 'تم تحديث بيانات المدرب بنجاح.' : 'Coach updated successfully.');
        setEditingCoach(null);
        fetchCoaches();
      } else {
        setActionError(data.error || 'Failed to update coach');
      }
    } catch (err: any) {
      setActionError(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (coach: CoachRecord) => {
    const nextStatus = coach.AccountStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/admin/coaches/${coach.CoachID}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({ AccountStatus: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchCoaches();
      } else {
        alert(data.error || 'Status update failed');
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // Filter coaches
  const filteredCoaches = useMemo(() => {
    return coaches.filter(c => {
      if (roleFilter !== 'ALL' && c.Role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && c.AccountStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.FullName.toLowerCase().includes(q);
        const matchEmail = c.Email.toLowerCase().includes(q);
        const matchPhone = c.Phone.includes(q);
        const matchId = c.CoachID.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
      }
      return true;
    });
  }, [coaches, roleFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl shrink-0 border border-blue-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-black bg-blue-600 text-white rounded-md tracking-wider">
                COACHES TABLE
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'إدارة المدربين والجهاز الفني' : 'Coach & Staff Management'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar' 
                ? 'إضافة، تعديل، وتفعيل/إيقاف حسابات المدربين وتعيين الأدوار والصلاحيات مع التوثيق التلقائي.' 
                : 'Add, edit, activate/deactivate coach accounts, assign roles, and audit trail changes.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            onClick={fetchCoaches}
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
            <UserPlus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'إضافة مدرب جديد' : 'Add New Coach'}</span>
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
            placeholder={language === 'ar' ? 'بحث بالاسم، البريد أو الهاتف...' : 'Search by name, email, phone...'}
            className={`w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition ${
              isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
          >
            <option value="ALL">🛡️ {language === 'ar' ? 'جميع الأدوار الوظيفية' : 'All Roles'}</option>
            <option value="ADMIN">ADMIN (مشرف عام)</option>
            <option value="HEAD_COACH">HEAD_COACH (مدير فني / مدرب أول)</option>
            <option value="ASSISTANT_COACH">ASSISTANT_COACH (مدرب مساعد)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
          >
            <option value="ALL">⚡ {language === 'ar' ? 'جميع الحالات (نشط / موقف)' : 'All Statuses'}</option>
            <option value="Active">Active ({language === 'ar' ? 'نشط' : 'Active'})</option>
            <option value="Inactive">Inactive ({language === 'ar' ? 'موقف' : 'Inactive'})</option>
          </select>
        </div>
      </div>

      {/* Coaches Grid */}
      {loading ? (
        <LoadingState type="skeleton" rows={4} />
      ) : filteredCoaches.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {language === 'ar' ? 'لم يتم العثور على مدربين' : 'No coaches found'}
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'ar' ? 'قم بإضافة مدرب جديد أو تعديل الفلاتر.' : 'Add a new coach or adjust your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoaches.map(coach => (
            <div
              key={coach.CoachID}
              className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-2xs space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700 ${
                coach.AccountStatus === 'Active' 
                  ? 'border-slate-200 dark:border-slate-800' 
                  : 'border-rose-300/80 dark:border-rose-900/40 bg-rose-50/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl font-bold flex items-center justify-center text-sm ${
                    coach.Role === 'ADMIN' 
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                      : coach.Role === 'HEAD_COACH'
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {coach.FullName?.charAt(0) || '👤'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {coach.FullName}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 block">
                      {coach.CoachID}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      coach.AccountStatus === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                    }`}
                  >
                    {coach.AccountStatus === 'Active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'موقف' : 'Inactive')}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate dir-ltr text-start">{coach.Email}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] dir-ltr text-start">{coach.Phone || '-'}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px]">
                    {coach.Role}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => handleToggleStatus(coach)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    coach.AccountStatus === 'Active'
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20'
                  }`}
                >
                  {coach.AccountStatus === 'Active' ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>{language === 'ar' ? 'إيقاف الحساب' : 'Deactivate'}</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>{language === 'ar' ? 'تفعيل الحساب' : 'Activate'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => openEditModal(coach)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                  <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Coach Modal */}
      {(isAddModalOpen || editingCoach) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {editingCoach 
                      ? (language === 'ar' ? `تعديل بيانات: ${editingCoach.FullName}` : `Edit Coach: ${editingCoach.CoachID}`)
                      : (language === 'ar' ? 'إضافة مدرب جديد' : 'Add New Coach')}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'جدول COACHES في Google Apps Script' : 'COACHES Table Record'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCoach(null);
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

            <form onSubmit={editingCoach ? handleUpdateCoach : handleCreateCoach} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'الاسم رباعي / اللقب' : 'Full Name (FullName)'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.FullName}
                  onChange={e => setFormData({ ...formData, FullName: e.target.value })}
                  placeholder={language === 'ar' ? 'الكابتن / أحمد فتحي' : 'Coach Ahmed Fathy'}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني الرسمي (Google Email)' : 'Google Workspace Email'} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.Email}
                  onChange={e => setFormData({ ...formData, Email: e.target.value })}
                  placeholder="coach@volleyball.club"
                  className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-hidden dir-ltr text-start"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'رقم الهاتف / الواتساب (Phone)' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={formData.Phone}
                  onChange={e => setFormData({ ...formData, Phone: e.target.value })}
                  placeholder="+20 100 000 0000"
                  className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-hidden dir-ltr text-start"
                />
              </div>

              {/* Role & Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'الدور الوظيفي (Role)' : 'Role'}
                  </label>
                  <select
                    value={formData.Role}
                    onChange={e => setFormData({ ...formData, Role: e.target.value as UserRole })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:outline-hidden"
                  >
                    <option value="HEAD_COACH">HEAD_COACH (مدير فني)</option>
                    <option value="ASSISTANT_COACH">ASSISTANT_COACH (مساعد)</option>
                    <option value="ADMIN">ADMIN (مشرف)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'حالة الحساب (AccountStatus)' : 'Account Status'}
                  </label>
                  <select
                    value={formData.AccountStatus}
                    onChange={e => setFormData({ ...formData, AccountStatus: e.target.value as any })}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:outline-hidden"
                  >
                    <option value="Active">Active ({language === 'ar' ? 'نشط' : 'Active'})</option>
                    <option value="Inactive">Inactive ({language === 'ar' ? 'موقف' : 'Inactive'})</option>
                  </select>
                </div>
              </div>

              {/* Audit notice */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'ar'
                    ? 'سيتم تسجيل هذا الإجراء تلقائياً في جدول AUDIT_LOG مع بيانات المشرف وتوقيت العملية.'
                    : 'This action will be automatically recorded in the AUDIT_LOG table with timestamp.'}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCoach(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition shadow-md shadow-orange-500/20"
                >
                  {isSubmitting 
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : editingCoach 
                    ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                    : (language === 'ar' ? 'إضافة المدرب' : 'Add Coach')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
