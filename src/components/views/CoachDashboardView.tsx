import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarCheck, 
  History, 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  UserX,
  UserCheck,
  AlertTriangle,
  Flame,
  Award,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { CoachDashboardData } from '../../types/database';

export const CoachDashboardView: React.FC = () => {
  const { currentUser, t, language, isRtl, setCurrentView, selectedTeam, setSelectedTeam } = useApp();
  const [dashboardData, setDashboardData] = useState<CoachDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [insightTab, setInsightTab] = useState<'consistent' | 'absent' | 'late'>('consistent');

  const isHeadCoach = currentUser?.role === 'HEAD_COACH';
  const assignedTeams = currentUser?.authorizedTeams || [];
  const activeTeam = selectedTeam || assignedTeams[0] || '';

  const fetchDashboard = async (team?: string) => {
    if (!currentUser?.userEmail) return;
    try {
      setError(null);
      const queryParams = new URLSearchParams();
      if (team) queryParams.set('team', team);

      const res = await fetch(`/api/coach/dashboard?${queryParams.toString()}`, {
        headers: {
          'x-user-email': currentUser.userEmail
        }
      });
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error || 'فشل تحميل لوحة المدرب');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboard(activeTeam);
  }, [currentUser?.userEmail, activeTeam]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard(activeTeam);
  };

  const today = dashboardData?.todaySummary;
  const weekly = dashboardData?.weeklySummary;
  const insights = dashboardData?.playerInsights;
  const myTeams = dashboardData?.myTeams || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Coach Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-9xl">
          🏐
        </div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>{isHeadCoach ? t.headCoachBadge : t.assistantCoachBadge}</span>
              <span className="opacity-75">• {currentUser?.coachId || 'COACH-001'}</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition flex items-center gap-1.5 text-xs font-medium"
              title={language === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>

          <div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
              {language === 'ar' ? `مرحباً كابتن، ${currentUser?.fullName}` : `Welcome Coach, ${currentUser?.fullName}`}
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-medium mt-1">
              {language === 'ar'
                ? 'إحصائيات الانضباط ومؤشرات الحضور لفرقك المعتمدة فقط وفق صلاحيات COACH_TEAMS.'
                : 'Attendance metrics and squad discipline indicators exclusively scoped to your authorized teams.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              onClick={() => setCurrentView('coach-attendance')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-orange-600 hover:bg-amber-50 text-xs font-bold shadow-lg shadow-black/10 transition"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t.navCoachAttendance}</span>
            </button>
            <button
              onClick={() => setCurrentView('coach-teams')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-orange-700/80 hover:bg-orange-800 text-white text-xs font-bold border border-orange-400/30 transition"
            >
              <Users className="w-4 h-4" />
              <span>{t.navMyTeams} ({assignedTeams.length})</span>
            </button>
            <button
              onClick={() => setCurrentView('coach-history')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-orange-700/50 hover:bg-orange-800 text-white text-xs font-bold border border-orange-400/20 transition"
            >
              <History className="w-4 h-4" />
              <span>{t.navAttendanceHistory}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Authorized Squad Switcher (if more than 1 team assigned) */}
      {assignedTeams.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'الفريق النشط للتحليل والإحصائيات:' : 'Active Squad for Dashboard Analytics:'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {assignedTeams.map(tm => (
              <button
                key={tm}
                onClick={() => setSelectedTeam(tm)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTeam === tm
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>🏐</span>
                <span>{tm}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingState type="skeleton" rows={6} />
      ) : (
        <>
          {/* ============================================================ */}
          {/* 1. TODAY'S SUMMARY SECTION */}
          {/* ============================================================ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {language === 'ar' ? `ملخص الحصة (${today?.teamName || activeTeam})` : `Today's Summary (${today?.teamName || activeTeam})`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                  📅 {today?.date || '2026-03-01'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  {today?.isToday ? (language === 'ar' ? 'اليوم' : 'Today') : (language === 'ar' ? 'آخر حصة' : 'Latest Session')}
                </span>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Players */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'إجمالي اللاعبين' : 'Total Players'}</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {today?.totalPlayers || 0}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  {language === 'ar' ? 'بقائمة الفريق' : 'In team roster'}
                </span>
              </div>

              {/* Present */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{language === 'ar' ? 'حاضر' : 'Present'}</span>
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {today?.present || 0}
                </div>
                <span className="text-[10px] text-emerald-600/80 font-semibold block mt-1">
                  {language === 'ar' ? 'في الموعد' : 'On-time'}
                </span>
              </div>

              {/* Late */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{language === 'ar' ? 'متأخر' : 'Late'}</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {today?.late || 0}
                </div>
                <span className="text-[10px] text-amber-600/80 font-semibold block mt-1">
                  {language === 'ar' ? 'دقائق تأخير' : 'Logged late'}
                </span>
              </div>

              {/* Absent */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400">{language === 'ar' ? 'غائب' : 'Absent'}</span>
                  <UserX className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                  {today?.absent || 0}
                </div>
                <span className="text-[10px] text-red-500/80 font-semibold block mt-1">
                  {language === 'ar' ? 'بدون إذن' : 'Unexcused'}
                </span>
              </div>

              {/* Excused */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{language === 'ar' ? 'إذن' : 'Excused'}</span>
                  <AlertTriangle className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {today?.excused || 0}
                </div>
                <span className="text-[10px] text-blue-500/80 font-semibold block mt-1">
                  {language === 'ar' ? 'معتمد رسمياً' : 'Formal excuse'}
                </span>
              </div>

              {/* Attendance Percentage */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
                <div className="flex items-center justify-between text-slate-300 mb-2">
                  <span className="text-[11px] font-bold text-amber-300">{language === 'ar' ? 'نسبة الحضور' : 'Attendance %'}</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {today?.attendancePercentage || '0%'}
                </div>
                <span className="text-[10px] text-amber-200/80 font-semibold block mt-1">
                  {language === 'ar' ? 'حضور + تأخير' : 'Present + Late'}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. WEEKLY SUMMARY & MY TEAMS SECTION */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* WEEKLY SUMMARY (Left / Top on mobile) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>{language === 'ar' ? 'الملخص الأسبوعي' : 'Weekly Summary'}</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {weekly?.startDate ? `${weekly.startDate} ~ ${weekly.endDate}` : ''}
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {language === 'ar' ? 'إجمالي الحصص' : 'Total Sessions'}
                    </span>
                    <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
                      {weekly?.totalSessions || 0}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {language === 'ar' ? 'خلال الأسبوع' : 'This week'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {language === 'ar' ? 'متوسط الحضور' : 'Avg Attendance'}
                    </span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {weekly?.averageAttendance || '0%'}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                      {language === 'ar' ? 'معدل الالتزام' : 'Compliance rate'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {language === 'ar' ? 'إجمالي الغياب' : 'Total Absences'}
                    </span>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                      {weekly?.totalAbsences || 0}
                    </div>
                    <span className="text-[10px] text-red-500/80 font-medium block mt-0.5">
                      {language === 'ar' ? 'حالة غياب' : 'Absence events'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {language === 'ar' ? 'إجمالي التأخيرات' : 'Total Late Arrivals'}
                    </span>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {weekly?.totalLateArrivals || 0}
                    </div>
                    <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
                      {language === 'ar' ? 'حالة تأخير' : 'Late events'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'ar' ? 'الحسابات مقتصرة على فرقك' : 'Restricted to your squads'}</span>
                  </span>
                  <button
                    onClick={() => setCurrentView('coach-history')}
                    className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <span>{language === 'ar' ? 'سجل الحصص' : 'Session History'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* MY TEAMS (Right on desktop) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span>{t.navMyTeams} ({myTeams.length})</span>
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {language === 'ar' ? 'مصرح بها فقط' : 'Authorized Squads Only'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myTeams.map(tm => (
                  <div
                    key={tm.teamName}
                    className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-2xs space-y-3 ${
                      activeTeam === tm.teamName
                        ? 'border-orange-500 ring-2 ring-orange-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                          🏐 {language === 'ar' ? 'فريق معتمد' : 'Authorized Team'}
                        </span>
                        <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 mt-1">
                          {tm.teamName}
                        </h4>
                      </div>

                      <div className="text-end">
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'نسبة الحضور' : 'Rate'}</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {tm.currentAttendanceRate}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{language === 'ar' ? 'عدد اللاعبين:' : 'Players Count:'}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{tm.playerCount} {language === 'ar' ? 'لاعب' : 'players'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{language === 'ar' ? 'الحصص المسجلة:' : 'Logged Sessions:'}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{tm.totalSessionsRecorded}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl mt-1">
                        <span className="font-bold block text-slate-700 dark:text-slate-300 mb-0.5">{language === 'ar' ? 'آخر حضور:' : 'Latest Attendance:'}</span>
                        <span>{tm.latestAttendanceSummary}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedTeam(tm.teamName);
                          setCurrentView('coach-attendance');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition text-center shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'تسجيل حضور' : 'Take Attendance'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTeam(tm.teamName);
                          setCurrentView('coach-teams');
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                        title={language === 'ar' ? 'عرض القائمة' : 'View Roster'}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. PLAYER INSIGHTS SECTION */}
          {/* ============================================================ */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{language === 'ar' ? `رؤى وانضباط اللاعبين (${activeTeam})` : `Player Insights & Discipline (${activeTeam})`}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'ar'
                    ? 'تحليل دقيق لأداء اللاعبين الأكثر التزاماً والأكثر غياباً وتأخراً لتحسين انضباط الفريق'
                    : 'Analytical ranking of most consistent, most absent, and most late players to boost squad discipline'}
                </p>
              </div>

              {/* Insight Category Toggle Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setInsightTab('consistent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    insightTab === 'consistent'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'ar' ? 'الأكثر التزاماً' : 'Most Consistent'}</span>
                </button>

                <button
                  onClick={() => setInsightTab('absent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    insightTab === 'absent'
                      ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5 text-red-500" />
                  <span>{language === 'ar' ? 'الأكثر غياباً' : 'Most Absent'}</span>
                </button>

                <button
                  onClick={() => setInsightTab('late')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    insightTab === 'late'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'ar' ? 'الأكثر تأخراً' : 'Most Late'}</span>
                </button>
              </div>
            </div>

            {/* Insights Display Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {insightTab === 'consistent' && (
                insights?.mostConsistent && insights.mostConsistent.length > 0 ? (
                  insights.mostConsistent.map((p, idx) => (
                    <div
                      key={p.playerId}
                      className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {p.fullName}
                          </h4>
                          <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                            {p.playerId}
                          </span>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                          {p.attendanceRate}
                        </span>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {p.presentCount} {language === 'ar' ? 'حضور' : 'present'}
                          </span>
                          {p.disciplineScore !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                              🏆 {p.disciplineScore}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-xs text-slate-400">
                    {language === 'ar' ? 'لا توجد بيانات حضور كافية بعد' : 'No attendance data recorded yet'}
                  </div>
                )
              )}

              {insightTab === 'absent' && (
                insights?.mostAbsent && insights.mostAbsent.length > 0 ? (
                  insights.mostAbsent.map((p, idx) => (
                    <div
                      key={p.playerId}
                      className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 font-black text-sm flex items-center justify-center">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {p.fullName}
                          </h4>
                          <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                            {p.playerId}
                          </span>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="text-sm font-black text-red-600 dark:text-red-400 block">
                          {p.absentCount} {language === 'ar' ? 'غياب' : 'absences'}
                        </span>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {language === 'ar' ? 'نسبة الحضور:' : 'Rate:'} {p.attendanceRate}
                          </span>
                          {p.disciplineScore !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                              الانضباط: {p.disciplineScore}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-xs text-slate-400">
                    {language === 'ar' ? 'لا توجد حالات غياب مسجلة' : 'No absence records found'}
                  </div>
                )
              )}

              {insightTab === 'late' && (
                insights?.mostLate && insights.mostLate.length > 0 ? (
                  insights.mostLate.map((p, idx) => (
                    <div
                      key={p.playerId}
                      className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {p.fullName}
                          </h4>
                          <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                            {p.playerId}
                          </span>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400 block">
                          {p.lateCount} {language === 'ar' ? 'تأخير' : 'times'}
                        </span>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {p.totalLateMinutes} {language === 'ar' ? 'دقيقة إجمالية' : 'total mins'}
                          </span>
                          {p.disciplineScore !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                              الانضباط: {p.disciplineScore}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-xs text-slate-400">
                    {language === 'ar' ? 'لا توجد حالات تأخير مسجلة' : 'No late arrivals recorded'}
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
