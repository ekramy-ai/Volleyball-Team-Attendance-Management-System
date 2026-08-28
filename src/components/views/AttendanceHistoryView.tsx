import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Calendar,
  Filter,
  Search,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
  Award,
  CalendarDays,
  FileSpreadsheet,
  Check,
  Sliders,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { AttendanceRecord, QuickDateFilter, AttendanceHistorySummary } from '../../types/database';
import { PlayerAttendanceProfileModal } from '../players/PlayerAttendanceProfileModal';

interface AttendanceHistoryViewProps {
  title?: string;
  subtitle?: string;
}

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({
  title,
  subtitle
}) => {
  const { currentUser, language, t, selectedTeam, setSelectedTeam } = useApp();
  const isAr = language === 'ar';
  const isAdmin = currentUser?.role === 'ADMIN';

  // Filters State
  const [quickDate, setQuickDate] = useState<QuickDateFilter>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterTeam, setFilterTeam] = useState<string>(isAdmin ? 'ALL' : (selectedTeam || 'ALL'));
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCoach, setFilterCoach] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Player for Attendance Profile Modal
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null);

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceHistorySummary>({
    totalRecords: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
    attendancePercentage: '0%',
    totalLateMinutes: 0
  });
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [availableCoaches, setAvailableCoaches] = useState<{ coachId: string; fullName: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'>('PRESENT');
  const [editArrivalTime, setEditArrivalTime] = useState<string>('18:00');
  const [editExcuseType, setEditExcuseType] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Fetch Attendance History from API
  const fetchHistory = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (quickDate) params.append('quickDate', quickDate);
      if (quickDate === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      if (filterTeam && filterTeam !== 'ALL') params.append('team', filterTeam);
      if (filterStatus && filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterCoach && filterCoach !== 'ALL') params.append('coachId', filterCoach);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/attendance/history?${params.toString()}`, {
        headers: {
          'x-user-email': currentUser.userEmail
        }
      });

      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        if (data.summary) setSummary(data.summary);
        if (data.availableTeams) setAvailableTeams(data.availableTeams);
        if (data.availableCoaches) setAvailableCoaches(data.availableCoaches);
      } else {
        setErrorMsg(data.error || 'Failed to fetch attendance history');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Network error fetching history');
    } finally {
      setLoading(false);
    }
  }, [currentUser, quickDate, startDate, endDate, filterTeam, filterStatus, filterCoach, searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Open Edit Modal
  const openEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditStatus(rec.AttendanceStatus || 'PRESENT');
    setEditArrivalTime(rec.ArrivalTime || '18:00');
    setEditExcuseType(rec.ExcuseType || '');
    setEditNotes(rec.Notes || '');
    setSaveSuccessMsg(null);
  };

  // Submit Record Edit
  const handleSaveEdit = async () => {
    if (!editingRecord || !currentUser) return;
    try {
      setIsSavingEdit(true);
      setErrorMsg(null);

      const res = await fetch(`/api/attendance/record/${editingRecord.AttendanceID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.userEmail
        },
        body: JSON.stringify({
          attendanceStatus: editStatus,
          arrivalTime: editStatus === 'LATE' ? editArrivalTime : undefined,
          excuseType: editStatus === 'EXCUSED' ? editExcuseType : undefined,
          notes: editNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(isAr ? 'تم تحديث السجل وتسجيله في سجل التدقيق بنجاح!' : 'Attendance record updated and logged to audit trail!');
        setTimeout(() => {
          setEditingRecord(null);
          setSaveSuccessMsg(null);
          fetchHistory();
        }, 800);
      } else {
        setErrorMsg(data.error || 'Failed to update record');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating attendance record');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {title || (isAr ? 'سجل الحضور التاريخي والأرشيف' : 'Attendance History & Archive')}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isAdmin
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                }`}>
                  {isAdmin
                    ? (isAr ? 'صلاحية الإدارة العامة' : 'Admin Global Access')
                    : (isAr ? 'صلاحية الفرق المصرحة' : 'Authorized Teams')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle || (isAr
                  ? 'أرشيف كشوفات الحضور التاريخية، استعراض الفترات الزمنية، وتعديل السجلات المعتمدة مع التوثيق الكامل'
                  : 'Historical attendance archive, date range exploration, and audited record modifications')}
              </p>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition self-start md:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث السجلات' : 'Refresh'}</span>
          </button>
        </div>

        {/* Date Filter Tabs (Today, This Week, This Month, Custom Date Range) */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
            <button
              onClick={() => setQuickDate('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                quickDate === 'today'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              📅 {isAr ? 'اليوم' : 'Today'}
            </button>
            <button
              onClick={() => setQuickDate('this_week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                quickDate === 'this_week'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🗓️ {isAr ? 'هذا الأسبوع' : 'This Week'}
            </button>
            <button
              onClick={() => setQuickDate('this_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                quickDate === 'this_month'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              📊 {isAr ? 'هذا الشهر' : 'This Month'}
            </button>
            <button
              onClick={() => setQuickDate('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                quickDate === 'custom'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🎯 {isAr ? 'فترة مخصصة' : 'Custom Range'}
            </button>
          </div>

          {/* Custom Date Pickers */}
          {quickDate === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-slate-400 text-[11px] font-bold">{isAr ? 'من:' : 'From:'}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-slate-400 text-[11px] font-bold">{isAr ? 'إلى:' : 'To:'}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Multi-criteria Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Team Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              🏐 {isAr ? 'الفريق' : 'Team'}
            </label>
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">{isAr ? 'جميع الفرق المصرحة' : 'All Authorized Teams'}</option>
              {availableTeams.map(tm => (
                <option key={tm} value={tm}>{tm}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              🏷️ {isAr ? 'حالة الحضور' : 'Attendance Status'}
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
              <option value="PRESENT">🟢 {isAr ? 'حاضر (Present)' : 'Present'}</option>
              <option value="LATE">🟡 {isAr ? 'متأخر (Late)' : 'Late'}</option>
              <option value="ABSENT">🔴 {isAr ? 'غائب (Absent)' : 'Absent'}</option>
              <option value="EXCUSED">🟣 {isAr ? 'إذن مسبق (Excused)' : 'Excused'}</option>
            </select>
          </div>

          {/* Coach Filter (Admin View) */}
          {isAdmin && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                👤 {isAr ? 'المدرب المسجل' : 'Logging Coach'}
              </label>
              <select
                value={filterCoach}
                onChange={e => setFilterCoach(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">{isAr ? 'كافة المدربين' : 'All Coaches'}</option>
                {availableCoaches.map(c => (
                  <option key={c.coachId} value={c.coachId}>{c.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className={isAdmin ? '' : 'sm:col-span-2'}>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              🔍 {isAr ? 'بحث سريع' : 'Search Query'}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'اسم اللاعب، الكود، الجلسة، الملاحظات...' : 'Player name, ID, Session, Notes...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl ps-9 pe-3 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Records */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block">{isAr ? 'إجمالي السجلات' : 'Total Records'}</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {summary.totalRecords}
          </span>
        </div>

        {/* Present */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-500/20 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'حاضر' : 'Present'}</span>
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {summary.presentCount}
          </span>
        </div>

        {/* Late */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-500/20 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'متأخر' : 'Late'}</span>
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {summary.lateCount}
            </span>
            {summary.totalLateMinutes > 0 && (
              <span className="text-[10px] text-slate-400 font-mono">
                ({summary.totalLateMinutes}m)
              </span>
            )}
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-500/20 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'غائب' : 'Absent'}</span>
          </span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {summary.absentCount}
          </span>
        </div>

        {/* Excused */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-purple-500/20 shadow-2xs">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'إذن' : 'Excused'}</span>
          </span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {summary.excusedCount}
          </span>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-500/20 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? 'نسبة الالتزام' : 'Rate'}</span>
          </span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {summary.attendancePercentage}
          </span>
        </div>
      </div>

      {/* Error Message Display */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attendance Records Table / Cards */}
      {loading ? (
        <LoadingState type="skeleton" rows={5} />
      ) : records.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'لا توجد سجلات حضور تطابق شروط البحث' : 'No attendance records match your filter criteria'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isAr
              ? 'جرّب توسيع نطاق البحث الزمني أو اختيار فريق آخر لعرض سجلات الحضور السابقة.'
              : 'Try selecting a broader date range or a different team to explore past attendance sheets.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3 px-4 text-start">#</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'اللاعب' : 'Player'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الفريق' : 'Team'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'تفاصيل / وقت الوصول' : 'Arrival / Details'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الملاحظات' : 'Notes'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المدرب' : 'Coach'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {records.map((rec, idx) => (
                  <tr
                    key={rec.AttendanceID}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    {/* Index & Record ID */}
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {idx + 1}
                      <span className="block text-[9px] text-slate-400/80">{rec.AttendanceID}</span>
                    </td>

                    {/* Player */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => setProfilePlayerId(rec.PlayerID)}
                        className="text-right group hover:opacity-80 transition cursor-pointer"
                        title="استعراض ملف الحضور الشامل"
                      >
                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 block transition">
                          {rec.PlayerName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 group-hover:text-orange-500 transition">
                          {rec.PlayerID} 🔍
                        </span>
                      </button>
                    </td>

                    {/* Team */}
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                      🏐 {rec.TeamName}
                    </td>

                    {/* Session Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                        {rec.TrainingDate}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {rec.SessionID}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {rec.AttendanceStatus === 'PRESENT' && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>{isAr ? 'حاضر' : 'Present'}</span>
                        </span>
                      )}
                      {rec.AttendanceStatus === 'LATE' && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{isAr ? `متأخر (${rec.LateMinutes} د)` : `Late (${rec.LateMinutes}m)`}</span>
                        </span>
                      )}
                      {rec.AttendanceStatus === 'ABSENT' && (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>{isAr ? 'غائب' : 'Absent'}</span>
                        </span>
                      )}
                      {rec.AttendanceStatus === 'EXCUSED' && (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{isAr ? `إذن: ${rec.ExcuseType || 'مسبق'}` : `Excused: ${rec.ExcuseType || 'Yes'}`}</span>
                        </span>
                      )}
                    </td>

                    {/* Arrival / Details */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {rec.AttendanceStatus === 'LATE' && rec.ArrivalTime && (
                        <span className="font-mono text-xs text-amber-600 dark:text-amber-400">
                          ⏰ {rec.ArrivalTime}
                        </span>
                      )}
                      {rec.AttendanceStatus === 'EXCUSED' && rec.ExcuseType && (
                        <span className="text-[11px] text-purple-600 dark:text-purple-400">
                          📄 {rec.ExcuseType}
                        </span>
                      )}
                      {rec.AttendanceStatus === 'PRESENT' && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          ⏱️ {rec.ArrivalTime || (isAr ? 'في الموعد' : 'On time')}
                        </span>
                      )}
                      {rec.AttendanceStatus === 'ABSENT' && (
                        <span className="text-[11px] text-rose-500">
                          —
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400">
                      {rec.Notes ? (
                        <span title={rec.Notes}>💬 {rec.Notes}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Coach */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {rec.CoachName ? (
                        <span className="text-xs">✍️ {rec.CoachName}</span>
                      ) : (
                        <span className="font-mono text-[10px]">{rec.CoachID}</span>
                      )}
                    </td>

                    {/* Actions: Edit Button */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition"
                        title={isAr ? 'تعديل السجل وتوثيقه' : 'Edit & Audit Record'}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Record Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {isAr ? 'تعديل سجل الحضور المعتمد' : 'Edit Audited Attendance Record'}
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400">
                    {editingRecord.AttendanceID} • {editingRecord.TrainingDate}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Player Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                  {editingRecord.PlayerName}
                </span>
                <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400">
                  {editingRecord.PlayerID} • 🏐 {editingRecord.TeamName}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {editingRecord.SessionID}
              </span>
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'حالة الحضور المحدثة' : 'Updated Attendance Status'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setEditStatus('PRESENT')}
                  className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                    editStatus === 'PRESENT'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'حاضر' : 'Present'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditStatus('LATE')}
                  className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                    editStatus === 'LATE'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'متأخر' : 'Late'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditStatus('ABSENT')}
                  className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                    editStatus === 'ABSENT'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{isAr ? 'غائب' : 'Absent'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditStatus('EXCUSED')}
                  className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                    editStatus === 'EXCUSED'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>{isAr ? 'إذن' : 'Excused'}</span>
                </button>
              </div>
            </div>

            {/* Arrival Time input (If Late) */}
            {editStatus === 'LATE' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'وقت الوصول الفعلي (HH:mm)' : 'Actual Arrival Time'}
                </label>
                <input
                  type="time"
                  value={editArrivalTime}
                  onChange={e => setEditArrivalTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Excuse Type (If Excused) */}
            {editStatus === 'EXCUSED' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'سبب الإذن المسبق' : 'Excuse Reason'}
                </label>
                <select
                  value={editExcuseType}
                  onChange={e => setEditExcuseType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{isAr ? 'اختر سبب الإذن...' : 'Select excuse reason...'}</option>
                  <option value="Illness">{isAr ? 'مرض أو وعكة صحية' : 'Illness'}</option>
                  <option value="Exams">{isAr ? 'امتحانات ودراسة' : 'Exams & Studies'}</option>
                  <option value="Travel">{isAr ? 'سفر' : 'Travel'}</option>
                  <option value="Family Emergency">{isAr ? 'ظرف عائلي طارئ' : 'Family Emergency'}</option>
                  <option value="Previous Permission">{isAr ? 'إذن مسبق من الإدارة' : 'Prior Permission'}</option>
                  <option value="Other">{isAr ? 'أخرى' : 'Other'}</option>
                </select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'ملاحظات التعديل والتدقيق' : 'Audit Modification Notes'}
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder={isAr ? 'سبب التعديل أو توضيحات الحضور...' : 'Reason for modification...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Success Feedback */}
            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingEdit ? (isAr ? 'جاري الحفظ والتوثيق...' : 'Saving...') : (isAr ? 'حفظ التعديل في الأرشيف' : 'Save Audited Edit')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Attendance Profile Modal */}
      {profilePlayerId && (
        <PlayerAttendanceProfileModal
          playerId={profilePlayerId}
          onClose={() => setProfilePlayerId(null)}
        />
      )}
    </div>
  );
};
