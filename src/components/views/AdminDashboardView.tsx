import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  Layers, 
  ClipboardCheck, 
  BarChart3, 
  ShieldCheck, 
  Database,
  ArrowRight,
  Sparkles,
  Calendar,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  UserX,
  Award,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { ClubAnalyticsReport, TeamAnalyticsItem, PlayerAnalyticsSummary } from '../../types/database';

export const AdminDashboardView: React.FC = () => {
  const { t, language, isRtl, setCurrentView, availableTeams, currentUser } = useApp();
  const [report, setReport] = useState<ClubAnalyticsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters State
  const [selectedClub, setSelectedClub] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedBirthYear, setSelectedBirthYear] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');

  // Sorting State for Teams Analytics
  const [sortBy, setSortBy] = useState<'attendance' | 'absence' | 'lateness' | 'discipline'>('attendance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Active Tab within Admin Dashboard
  const [activeSection, setActiveSection] = useState<'overview' | 'teams' | 'players'>('overview');

  const fetchClubAnalytics = async () => {
    try {
      if (!report) setLoading(true);
      else setRefreshing(true);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedTeam && selectedTeam !== 'ALL') params.append('teamName', selectedTeam);
      if (selectedBirthYear && selectedBirthYear !== 'ALL') params.append('birthYear', selectedBirthYear);
      if (selectedGender && selectedGender !== 'ALL') params.append('gender', selectedGender);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const adminEmail = currentUser?.userEmail || 'admin@volleyball.club';
      const res = await fetch(`/api/analytics/admin-dashboard?${params.toString()}`, {
        headers: {
          'x-admin-email': adminEmail,
          'x-user-email': adminEmail
        }
      });
      const result = await res.json();
      if (result.success && result.report) {
        setReport(result.report);
      } else if (result.success && result.data) {
        setReport(result.data);
      }
    } catch (err) {
      console.error('Failed to load club analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClubAnalytics();
  }, [startDate, endDate, selectedTeam, selectedBirthYear, selectedGender, sortBy, sortOrder]);

  const resetFilters = () => {
    setSelectedClub('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedTeam('ALL');
    setSelectedBirthYear('ALL');
    setSelectedGender('ALL');
    setSortBy('attendance');
    setSortOrder('desc');
  };

  if (loading && !report) {
    return <LoadingState type="skeleton" rows={5} />;
  }

  const overview = report?.overview;
  const teams = report?.teams || [];
  const playerAnalytics = report?.playerAnalytics;
  const filterOptions = report?.filterOptions;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-9xl">
          🏐
        </div>

        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'لوحة القيادة الإدارية المركزية وتحليلات النادي' : 'Central Admin Dashboard & Club Analytics'}</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">
              <span>{language === 'ar' ? 'صلاحيات المشرف الكاملة' : 'Admin Only Access'}</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {language === 'ar' ? 'مرحباً بك في المنظومة التحليلية لقطاع الكرة الطائرة' : 'Volleyball Club Analytics & Management Hub'}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'ar' 
              ? 'متابعة حية وشاملة لإحصائيات اليوم، نسب الحضور والغياب، مؤشرات انضباط الفرق، وتحليلات اللاعبين المميزين والحالات التي تتطلب المتابعة.' 
              : 'Live comprehensive oversight of today\'s attendance, squad discipline rates, top performers, and players requiring attention.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={fetchClubAnalytics}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? (language === 'ar' ? 'جارِ التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث البيانات' : 'Refresh Analytics')}</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              {language === 'ar' ? 'آخر تحديث: ' : 'Updated: '} {overview ? new Date().toLocaleTimeString() : ''}
            </span>
          </div>
        </div>
      </div>

      {/* CLUBS & VENUES ARCHITECTURE BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* The 2 Clubs */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'الأندية المعتمدة بالمنظومة (ناديين)' : 'Affiliated Clubs (2 Clubs)'}
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {language === 'ar' ? 'جهاز فني مشترك' : 'Unified Staff'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-300">
                <span>🏢</span>
                <span>نادى المؤسسة</span>
              </div>
              <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 block mt-1">
                11 فريق (براعم 2015، تحت 13، 15، 17)
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-300">
                <span>⚡</span>
                <span>نادى رايـــــة</span>
              </div>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 block mt-1">
                9 فرق (براعم 2018+ إلى تحت 19)
              </span>
            </div>
          </div>
        </div>

        {/* The 4 Training Venues */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'أماكن التدريب المعتمدة (4 ملاعب وصالات)' : 'Training Venues & Courts (4)'}
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
              {language === 'ar' ? 'مقر تدريب موحد' : 'Unified Training Facility'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>الصالة المغطاه</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>الملعب الجديد</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>ملعب التنس الرئيسي</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>ملعب التنس الفرعي</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN OVERVIEW METRICS: Total Stats + Today's Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <span>{language === 'ar' ? 'نظرة عامة على النادي واليوم' : 'Club Overview & Today\'s Pulse'}</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {language === 'ar' ? 'تاريخ اليوم: ' : 'Today: '} {overview?.todayDate}
          </span>
        </div>

        {/* Global Overview Grid (7 Mandated Metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* 1. Total Players */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'إجمالي اللاعبين' : 'Total Players'}</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
              {overview?.totalPlayers || 0}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              {language === 'ar' ? 'مسجلين بالقاعدة' : 'Registered'}
            </span>
          </div>

          {/* 2. Total Teams */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'إجمالي الفرق' : 'Total Teams'}</span>
              <Layers className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
              {overview?.totalTeams || 0}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
              {language === 'ar' ? 'فرق معتمدة' : 'Active Squads'}
            </span>
          </div>

          {/* 3. Total Coaches */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'إجمالي المدربين' : 'Total Coaches'}</span>
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1.5">
              {overview?.totalCoaches || 0}
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
              {language === 'ar' ? 'الجهاز الفني' : 'Staff Members'}
            </span>
          </div>

          {/* 4. Present Today */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{language === 'ar' ? 'حاضر اليوم' : 'Present Today'}</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1.5">
              {overview?.presentToday || 0}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              {language === 'ar' ? 'في الموعد' : 'On Time'}
            </span>
          </div>

          {/* 5. Absent Today */}
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">{language === 'ar' ? 'غائب اليوم' : 'Absent Today'}</span>
              <UserX className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1.5">
              {overview?.absentToday || 0}
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block mt-0.5">
              {language === 'ar' ? 'غير مسجل حضور' : 'No Show'}
            </span>
          </div>

          {/* 6. Late Today */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">{language === 'ar' ? 'تأخير اليوم' : 'Late Today'}</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1.5">
              {overview?.lateToday || 0}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
              {language === 'ar' ? 'حضور متأخر' : 'Late Check-in'}
            </span>
          </div>

          {/* 7. Excused Today */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">{language === 'ar' ? 'إذن اليوم' : 'Excused Today'}</span>
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-400 mt-1.5">
              {overview?.excusedToday || 0}
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
              {language === 'ar' ? 'غياب بإذن مسبق' : 'Official Excuse'}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-500" />
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
              {language === 'ar' ? 'تصفية التحليلات المتقدمة' : 'Advanced Analytics Filters'}
            </h4>
          </div>
          <button
            onClick={resetFilters}
            className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            {language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Club Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {language === 'ar' ? 'النادي' : 'Club'}
            </label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">{language === 'ar' ? 'كلا الناديين' : 'Both Clubs'}</option>
              <option value="المؤسسة">{language === 'ar' ? '🏢 نادى المؤسسة' : 'Al-Moassasa'}</option>
              <option value="راية">{language === 'ar' ? '⚡ نادى راية' : 'Raya'}</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {language === 'ar' ? 'من تاريخ' : 'From Date'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Team Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {language === 'ar' ? 'الفريق' : 'Team'}
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">{language === 'ar' ? 'جميع الفرق' : 'All Teams'}</option>
              {(filterOptions?.availableTeams || availableTeams).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Team Birth Year Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {language === 'ar' ? 'مواليد الفريق' : 'Team Birth Year'}
            </label>
            <select
              value={selectedBirthYear}
              onChange={(e) => setSelectedBirthYear(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">{language === 'ar' ? 'جميع المواليد' : 'All Birth Years'}</option>
              {(filterOptions?.availableBirthYears || []).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {language === 'ar' ? 'النوع' : 'Gender'}
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">{language === 'ar' ? 'الكل (بنين وبنات)' : 'All Genders'}</option>
              {(filterOptions?.availableGenders || ['بنات', 'بنين']).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DASHBOARD SECTION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSection === 'overview'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{language === 'ar' ? 'تحليلات الفرق والانضباط' : 'Team Analytics & Discipline'}</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-white">
            {teams.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('players')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSection === 'players'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'ar' ? 'تحليلات اللاعبين والحالات الخاصة' : 'Player Analytics & Attention'}</span>
          {playerAnalytics?.requiringAttention.length ? (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white">
              {playerAnalytics.requiringAttention.length}
            </span>
          ) : null}
        </button>
      </div>

      {/* SECTION 1: TEAM ANALYTICS */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Sorting Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'ترتيب الفرق حسب:' : 'Sort Teams By:'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setSortBy('attendance'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  sortBy === 'attendance'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'ar' ? 'الأعلى حضوراً' : 'Highest Attendance'} {sortBy === 'attendance' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>

              <button
                onClick={() => { setSortBy('absence'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  sortBy === 'absence'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'ar' ? 'الأعلى غياباً' : 'Highest Absence'} {sortBy === 'absence' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>

              <button
                onClick={() => { setSortBy('lateness'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  sortBy === 'lateness'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'ar' ? 'الأكثر تأخيراً' : 'Most Lateness'} {sortBy === 'lateness' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>

              <button
                onClick={() => { setSortBy('discipline'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  sortBy === 'discipline'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'ar' ? 'درجة الانضباط' : 'Discipline Score'} {sortBy === 'discipline' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>

          {/* Teams Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="py-3.5 px-4 text-start">{language === 'ar' ? 'الفريق' : 'Team'}</th>
                    <th className="py-3.5 px-3 text-center">{language === 'ar' ? 'المواليد / النوع' : 'Birth / Gender'}</th>
                    <th className="py-3.5 px-3 text-center">{language === 'ar' ? 'اللاعبين' : 'Players'}</th>
                    <th className="py-3.5 px-3 text-center">{language === 'ar' ? 'الحصص' : 'Sessions'}</th>
                    <th className="py-3.5 px-3 text-center">{language === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}</th>
                    <th className="py-3.5 px-3 text-center">{language === 'ar' ? 'نسبة الغياب' : 'Absence Rate'}</th>
                    <th className="py-3.5 px-3 text-center">{language === 'ar' ? 'تأخير' : 'Late'}</th>
                    <th className="py-3.5 px-4 text-center">{language === 'ar' ? 'درجة الانضباط' : 'Discipline Score'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {language === 'ar' ? 'لا توجد فرق مطابقة لشروط التصفية الحالية.' : 'No teams match the current filter criteria.'}
                      </td>
                    </tr>
                  ) : (
                    teams.map((t) => (
                      <tr key={t.teamName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-xs">
                              🏐
                            </div>
                            <span>{t.teamName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {t.teamBirthYear} | {t.gender}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {t.playerCount}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                          {t.sessionCount}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{t.attendanceRate}%</span>
                            <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                              <div className="h-full bg-emerald-500" style={{ width: `${t.attendanceRate}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-rose-600 dark:text-rose-400">{t.absenceRate}%</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                            {t.lateCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            t.disciplineScore >= 85
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : t.disciplineScore >= 70
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            {t.disciplineScore} / 100
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PLAYER ANALYTICS & OUTLIERS */}
      {activeSection === 'players' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Players with Highest Attendance */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <Award className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'الأعلى حضوراً وانضباطاً' : 'Highest Attendance'}
                </h4>
              </div>

              <div className="space-y-2">
                {(playerAnalytics?.highestAttendance || []).map((p, idx) => (
                  <div key={p.playerId} className="p-3 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">#{idx + 1}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.fullName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{p.teamName}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{p.attendanceRate}%</span>
                      <span className="text-[10px] text-slate-400 block">{p.presentCount} {language === 'ar' ? 'حضور' : 'pres.'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Players with Highest Absence */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <UserX className="w-4 h-4 text-rose-500" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'الأكثر غياباً' : 'Highest Absence'}
                </h4>
              </div>

              <div className="space-y-2">
                {(playerAnalytics?.highestAbsence || []).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">{language === 'ar' ? 'لا يوجد حالات غياب متكررة' : 'No high absence records'}</div>
                ) : (
                  (playerAnalytics?.highestAbsence || []).map((p, idx) => (
                    <div key={p.playerId} className="p-3 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">#{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.fullName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{p.teamName}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400">{p.absentCount} {language === 'ar' ? 'غياب' : 'absent'}</span>
                        <span className="text-[10px] text-slate-400 block">{p.absenceRate}% {language === 'ar' ? 'نسبة' : 'rate'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Players with Repeated Lateness */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'المتكرر تأخيرهم' : 'Repeated Lateness'}
                </h4>
              </div>

              <div className="space-y-2">
                {(playerAnalytics?.repeatedLateness || []).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">{language === 'ar' ? 'لا يوجد تأخيرات متكررة' : 'No repeated lateness records'}</div>
                ) : (
                  (playerAnalytics?.repeatedLateness || []).map((p, idx) => (
                    <div key={p.playerId} className="p-3 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">#{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.fullName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{p.teamName}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">{p.lateCount} {language === 'ar' ? 'مرات' : 'times'}</span>
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'تأخير مسجل' : 'late log'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4. Players Requiring Attention */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'قائمة اللاعبين الذين يحتاجون متابعة إدارية وتنبيه' : 'Players Requiring Attention'}
                </h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 font-bold">
                {playerAnalytics?.requiringAttention.length || 0} {language === 'ar' ? 'حالات' : 'cases'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="py-3 px-4 text-start">{language === 'ar' ? 'كود اللاعب' : 'Player ID'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ar' ? 'اسم اللاعب' : 'Player Name'}</th>
                    <th className="py-3 px-3 text-start">{language === 'ar' ? 'الفريق' : 'Team'}</th>
                    <th className="py-3 px-3 text-center">{language === 'ar' ? 'مرات الغياب' : 'Absences'}</th>
                    <th className="py-3 px-3 text-center">{language === 'ar' ? 'مرات التأخير' : 'Lateness'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ar' ? 'سبب المتابعة' : 'Attention Reason'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {(playerAnalytics?.requiringAttention || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        {language === 'ar' ? 'ممتاز! لا يوجد أي لاعبين بحاجة لمتابعة خاصة حالياً.' : 'Excellent! No players currently require urgent attention.'}
                      </td>
                    </tr>
                  ) : (
                    (playerAnalytics?.requiringAttention || []).map((p) => (
                      <tr key={p.playerId} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {p.playerId}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {p.fullName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {p.teamName}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          {p.absentCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                          {p.lateCount}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                            {p.attentionReason}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

