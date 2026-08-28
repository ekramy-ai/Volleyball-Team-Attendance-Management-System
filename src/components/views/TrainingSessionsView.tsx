import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Edit3, 
  Ban, 
  Trash2, 
  Sparkles, 
  UserCheck, 
  ShieldCheck, 
  Users, 
  ChevronRight, 
  CalendarDays,
  CalendarCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TrainingSessionRecord } from '../../types/database';
import { LoadingState } from '../common/LoadingState';

interface TrainingSessionsViewProps {
  initialTeamFilter?: string;
  onNavigateToAttendance?: (sessionId: string) => void;
}

export const TrainingSessionsView: React.FC<TrainingSessionsViewProps> = ({ initialTeamFilter, onNavigateToAttendance }) => {
  const { currentUser, t, language, isRtl, availableTeams, selectedTeam, setSelectedTeam } = useApp();

  const [sessions, setSessions] = useState<TrainingSessionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Filters
  const [teamFilter, setTeamFilter] = useState<string>(initialTeamFilter || selectedTeam || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSessionRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Form State
  const [formTeamName, setFormTeamName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<string>('17:00');
  const [formEndTime, setFormEndTime] = useState<string>('18:30');
  const [formLocation, setFormLocation] = useState<string>('الصالة المغطاه');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Scheduled' | 'Completed' | 'Cancelled'>('Scheduled');
  
  // Conflict warning
  const [isCheckingConflict, setIsCheckingConflict] = useState<boolean>(false);
  const [conflictWarning, setConflictWarning] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isAdmin = currentUser?.role === 'ADMIN';
  const authorizedTeams = isAdmin ? availableTeams : (currentUser?.authorizedTeams || []);

  const [clubFilter, setClubFilter] = useState<string>('ALL');

  // Official 4 Training Venues / Courts (أماكن التدريب / الصالة)
  const locationPresets = [
    'الصالة المغطاه',
    'الملعب الجديد',
    'ملعب التنس الرئيسي',
    'ملعب التنس الفرعي'
  ];

  // Fetch sessions from API
  const fetchSessions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const params = new URLSearchParams();
      if (teamFilter && teamFilter !== 'ALL') params.append('team', teamFilter);
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`/api/sessions?${params.toString()}`, {
        headers: {
          'x-user-email': currentUser?.userEmail || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
      } else {
        setErrorMessage(data.error || 'Failed to load sessions');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error fetching sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [teamFilter, statusFilter, dateFilter, currentUser]);

  // Set default team in form when modal opens
  const openCreateModal = (prefillTeam?: string) => {
    const defaultTeam = prefillTeam || (teamFilter !== 'ALL' ? teamFilter : authorizedTeams[0] || '');
    setFormTeamName(defaultTeam);

    // Default to tomorrow or today's date formatted YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setFormStartTime('17:00');
    setFormEndTime('18:30');
    setFormLocation('الصالة المغطاه');
    setFormNotes('');
    setFormStatus('Scheduled');
    setConflictWarning('');
    setErrorMessage('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (session: TrainingSessionRecord) => {
    setSelectedSession(session);
    setFormTeamName(session.TeamName || '');
    setFormDate(session.TrainingDate || '');
    setFormStartTime(session.StartTime || '17:00');
    setFormEndTime(session.EndTime || '18:30');
    setFormLocation(session.Location || 'الصالة المغطاه');
    setFormNotes(session.Notes || '');
    setFormStatus(session.Status || 'Scheduled');
    setConflictWarning('');
    setErrorMessage('');
    setIsEditModalOpen(true);
  };

  const openCancelModal = (session: TrainingSessionRecord) => {
    setSelectedSession(session);
    setCancelReason('');
    setErrorMessage('');
    setIsCancelModalOpen(true);
  };

  // Pre-flight conflict check whenever team, date, or time changes
  useEffect(() => {
    if ((isCreateModalOpen || isEditModalOpen) && formTeamName && formDate && formStartTime && formEndTime) {
      const checkConflict = async () => {
        try {
          setIsCheckingConflict(true);
          const res = await fetch('/api/sessions/check-duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamName: formTeamName,
              trainingDate: formDate,
              startTime: formStartTime,
              endTime: formEndTime,
              excludeSessionId: selectedSession?.SessionID
            })
          });
          const data = await res.json();
          if (data.isDuplicate) {
            setConflictWarning(data.reason || 'يوجد تدريب مسجل بالفعل لهذا الفريق في نفس الموعد');
          } else {
            setConflictWarning('');
          }
        } catch {
          // ignore
        } finally {
          setIsCheckingConflict(false);
        }
      };

      const timer = setTimeout(checkConflict, 300);
      return () => clearTimeout(timer);
    }
  }, [formTeamName, formDate, formStartTime, formEndTime, isCreateModalOpen, isEditModalOpen, selectedSession]);

  // Handle Session Creation
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeamName || !formDate || !formStartTime || !formEndTime || !formLocation) {
      setErrorMessage(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.userEmail || ''
        },
        body: JSON.stringify({
          TeamName: formTeamName,
          TrainingDate: formDate,
          StartTime: formStartTime,
          EndTime: formEndTime,
          Location: formLocation,
          Status: formStatus,
          Notes: formNotes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to create training session');
        return;
      }

      setSuccessMessage(
        language === 'ar'
          ? `تم إنشاء الحصة التدريبية بنجاح (${data.session.SessionID}) لفريق ${data.session.TeamName}`
          : `Training session created successfully (${data.session.SessionID})`
      );
      setIsCreateModalOpen(false);
      fetchSessions(true);

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Session Update
  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    try {
      setSubmitting(true);
      setErrorMessage('');

      const res = await fetch(`/api/sessions/${selectedSession.SessionID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.userEmail || ''
        },
        body: JSON.stringify({
          TrainingDate: formDate,
          StartTime: formStartTime,
          EndTime: formEndTime,
          Location: formLocation,
          Status: formStatus,
          Notes: formNotes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to update training session');
        return;
      }

      setSuccessMessage(language === 'ar' ? 'تم تحديث بيانات التدريب بنجاح' : 'Session updated successfully');
      setIsEditModalOpen(false);
      fetchSessions(true);

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating session');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Session Cancellation
  const handleCancelSession = async () => {
    if (!selectedSession) return;

    try {
      setSubmitting(true);
      setErrorMessage('');

      const res = await fetch(`/api/sessions/${selectedSession.SessionID}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.userEmail || ''
        },
        body: JSON.stringify({
          reason: cancelReason || 'إلغاء من قبل المدرب'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to cancel training session');
        return;
      }

      setSuccessMessage(
        language === 'ar' 
          ? `تم إلغاء الحصة التدريبية [${selectedSession.SessionID}] مع الحفاظ التام على سجلات الحضور السابقة.` 
          : `Session cancelled successfully. Historical attendance data preserved.`
      );
      setIsCancelModalOpen(false);
      fetchSessions(true);

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error cancelling session');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered session list
  const filteredSessions = sessions.filter(s => {
    if (clubFilter !== 'ALL') {
      const matchClub = s.TeamName.includes(clubFilter);
      if (!matchClub) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = s.SessionID.toLowerCase().includes(q);
      const matchTeam = s.TeamName.toLowerCase().includes(q);
      const matchLoc = (s.Location || s.Court || '').toLowerCase().includes(q);
      const matchCoach = (s.CoachName || '').toLowerCase().includes(q);
      if (!matchId && !matchTeam && !matchLoc && !matchCoach) return false;
    }
    return true;
  });

  const totalCount = sessions.length;
  const scheduledCount = sessions.filter(s => (s.Status || 'Scheduled') === 'Scheduled').length;
  const completedCount = sessions.filter(s => s.Status === 'Completed').length;
  const cancelledCount = sessions.filter(s => s.Status === 'Cancelled').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'إدارة الحصص التدريبية' : 'Training Sessions Management'}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                Phase 5
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar' 
                ? 'جدولة وإدارة الحصص التدريبية للفرق المصرح بها والتحقق الأمني من الصلاحيات ومنع التكرار' 
                : 'Schedule and manage practice sessions for authorized teams with duplicate prevention'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => fetchSessions(true)}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title={language === 'ar' ? 'تحديث السجلات' : 'Refresh sessions'}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <button
            onClick={() => openCreateModal()}
            disabled={authorizedTeams.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إنشاء تدريب جديد' : 'New Training Session'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ms-auto text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Stats Metrics Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {language === 'ar' ? 'إجمالي الحصص' : 'Total Sessions'}
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {totalCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            {language === 'ar' ? 'مجدولة وقادمة' : 'Scheduled'}
          </span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {scheduledCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            {language === 'ar' ? 'مكتملة ومسجلة' : 'Completed'}
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {completedCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
            {language === 'ar' ? 'ملغاة (محفوظة)' : 'Cancelled'}
          </span>
          <div className="text-xl font-black text-slate-500 dark:text-slate-400 mt-1">
            {cancelledCount}
          </div>
        </div>
      </div>

      {/* 3. Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Club Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              {language === 'ar' ? 'النادي (المؤسسة / راية)' : 'Club (Al-Moassasa / Raya)'}
            </label>
            <select
              value={clubFilter}
              onChange={e => setClubFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">{language === 'ar' ? '🏛️ كلا الناديين (المؤسسة & راية)' : '🏛️ Both Clubs'}</option>
              <option value="المؤسسة">{language === 'ar' ? '🏢 نادى المؤسسة' : 'Al-Moassasa Club'}</option>
              <option value="راية">{language === 'ar' ? '⚡ نادى راية' : 'Raya Club'}</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              {language === 'ar' ? 'تصفية حسب الفريق' : 'Filter by Team'}
            </label>
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">{language === 'ar' ? '🌟 كل الفرق' : '🌟 All Teams'}</option>
              {authorizedTeams.map(t => (
                <option key={t} value={t}>🏐 {t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              {language === 'ar' ? 'حالة الحصة' : 'Session Status'}
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="Scheduled">{language === 'ar' ? 'مجدولة (Scheduled)' : 'Scheduled'}</option>
              <option value="Completed">{language === 'ar' ? 'مكتملة (Completed)' : 'Completed'}</option>
              <option value="Cancelled">{language === 'ar' ? 'ملغاة (Cancelled)' : 'Cancelled'}</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              {language === 'ar' ? 'تاريخ التدريب' : 'Training Date'}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Clear date"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              {language === 'ar' ? 'بحث سريع' : 'Search Sessions'}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute top-3 start-3 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'رقم الحصة، المكان، المدرب...' : 'Session ID, location, coach...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Training Sessions List */}
      {loading ? (
        <LoadingState type="skeleton" rows={4} />
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto text-2xl">
            🏐
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'لا توجد حصص تدريبية مطابقة للتصفية' : 'No training sessions found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {language === 'ar'
                ? 'يمكنك إنشاء حصة تدريبية جديدة لفريقك المصرح بالضغط على زر "إنشاء تدريب جديد".'
                : 'Click "New Training Session" to schedule a practice for your authorized team.'}
            </p>
          </div>
          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إنشاء تدريب جديد الآن' : 'Create Session Now'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map(sess => {
            const isCancelled = sess.Status === 'Cancelled';
            const isCompleted = sess.Status === 'Completed';
            const isScheduled = !sess.Status || sess.Status === 'Scheduled';

            return (
              <div
                key={sess.SessionID}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all p-5 shadow-2xs flex flex-col justify-between space-y-4 ${
                  isCancelled 
                    ? 'border-slate-200 dark:border-slate-800 opacity-75 bg-slate-50/50 dark:bg-slate-900/50' 
                    : isCompleted
                    ? 'border-emerald-500/30 hover:border-emerald-500/60'
                    : 'border-slate-200 dark:border-slate-800 hover:border-orange-500/40 hover:shadow-md'
                }`}
              >
                {/* Card Header: Team & Status */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-extrabold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                          {sess.SessionID}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sess.TeamBirthYear ? `مواليد ${sess.TeamBirthYear}` : ''}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1.5">
                        🏐 {sess.TeamName}
                      </h3>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isCancelled
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 line-through'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {isCompleted
                        ? (language === 'ar' ? 'مكتملة' : 'Completed')
                        : isCancelled
                        ? (language === 'ar' ? 'ملغاة' : 'Cancelled')
                        : (language === 'ar' ? 'مجدولة' : 'Scheduled')}
                    </span>
                  </div>

                  {/* Schedule Details */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>📅 {sess.TrainingDate}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-mono">{sess.StartTime} - {sess.EndTime}</span>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="truncate">{sess.Location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                      <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>{sess.CoachName} ({sess.CoachID})</span>
                    </div>

                    {sess.Notes && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 mt-2 border border-slate-200/60 dark:border-slate-700/50">
                        💬 {sess.Notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Edit Session */}
                    {!isCancelled && (
                      <button
                        onClick={() => openEditModal(sess)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1"
                        title={language === 'ar' ? 'تعديل التدريب' : 'Edit session'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Cancel Session */}
                    {!isCancelled && (
                      <button
                        onClick={() => openCancelModal(sess)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center gap-1"
                        title={language === 'ar' ? 'إلغاء التدريب بأمان' : 'Cancel session safely'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(sess.CreatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE TRAINING SESSION MODAL (Workflow for Coach)                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'ar' ? 'إنشاء حصة تدريبية جديدة' : 'Create New Training Session'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'التحقق الأمني من الفريق المصرح ومنع التكرار' : 'Secured team authorization & duplicate collision checks'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conflict Live Warning */}
            {conflictWarning && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-start gap-2.5 animate-in shake">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block">{language === 'ar' ? 'تنبيه تعارض زمني (Duplicate Warning):' : 'Duplicate Time Conflict Warning:'}</span>
                  <span className="font-normal text-[11px] mt-0.5 block">{conflictWarning}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Step 1: Select Authorized Team */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. {language === 'ar' ? 'اختر الفريق المصرح لك به' : 'Select Authorized Team'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formTeamName}
                  onChange={e => setFormTeamName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">{language === 'ar' ? '-- اختر الفريق --' : '-- Select Team --'}</option>
                  {authorizedTeams.map(t => (
                    <option key={t} value={t}>🏐 {t}</option>
                  ))}
                </select>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'بوابة التحقق الأمني: متاح فقط للفرق المعتمدة لك' : 'Secured Gate: Only authorized teams listed'}</span>
                </div>
              </div>

              {/* Step 2: Training Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. {language === 'ar' ? 'تاريخ الحصة التدريبية' : 'Training Date'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {/* Date Quick Shortcuts */}
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setFormDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  >
                    {language === 'ar' ? 'اليوم' : 'Today'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFormDate(tomorrow.toISOString().split('T')[0]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  >
                    {language === 'ar' ? 'غداً' : 'Tomorrow'}
                  </button>
                </div>
              </div>

              {/* Step 3: Start Time and End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    3. {language === 'ar' ? 'وقت البدء' : 'Start Time'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'وقت الانتهاء' : 'End Time'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Step 4: Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  4. {language === 'ar' ? 'مكان التدريب / الصالة' : 'Location / Court'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  required
                  placeholder={language === 'ar' ? 'مثال: الصالة المغطاة 1 - الملعب الرئيسي' : 'e.g. Main Hall - Court 1'}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {/* Location Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {locationPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormLocation(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                        formLocation === preset
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Practice Focus */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'ملاحظات التدريب / التركيز الفني' : 'Notes / Training Focus (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: التركيز على الإرسال القوي وحائط الصد الثنائي' : 'e.g. Focus on jump serving and block positioning'}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formTeamName || !formDate || Boolean(conflictWarning)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'ar' ? 'تأكيد إنشاء الحصة' : 'Create Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT TRAINING SESSION MODAL                                            */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? `تعديل الحصة التدريبية (${selectedSession.SessionID})` : `Edit Training Session (${selectedSession.SessionID})`}
                </h3>
                <span className="text-xs font-bold text-orange-600">🏐 {selectedSession.TeamName}</span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'تاريخ الحصة' : 'Training Date'}
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'وقت البدء' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'وقت الانتهاء' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'المكان' : 'Location'}
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'حالة الحصة' : 'Status'}
                </label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="Scheduled">{language === 'ar' ? 'مجدولة (Scheduled)' : 'Scheduled'}</option>
                  <option value="Completed">{language === 'ar' ? 'مكتملة (Completed)' : 'Completed'}</option>
                  <option value="Cancelled">{language === 'ar' ? 'ملغاة (Cancelled)' : 'Cancelled'}</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition"
                >
                  {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CANCEL SESSION CONFIRMATION MODAL                                      */}
      {/* ========================================================================= */}
      {isCancelModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'تأكيد إلغاء الحصة التدريبية' : 'Confirm Session Cancellation'}
                </h3>
                <span className="text-xs font-mono text-slate-400">{selectedSession.SessionID}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                🏐 {selectedSession.TeamName} • 📅 {selectedSession.TrainingDate}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'ar' 
                    ? 'سيتم الحفاظ على أي سجلات حضور سابقة دون حذف، مع تسجيل عملية الإلغاء في AUDIT_LOG.' 
                    : 'Historical attendance records are preserved. Change is logged to AUDIT_LOG.'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'سبب الإلغاء (اختياري)' : 'Reason for Cancellation (Optional)'}
              </label>
              <input
                type="text"
                placeholder={language === 'ar' ? 'مثال: سوء الأحوال الجوية، صيانة الصالة...' : 'e.g. Bad weather, hall maintenance'}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                {language === 'ar' ? 'تراجع' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleCancelSession}
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition"
              >
                {language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
