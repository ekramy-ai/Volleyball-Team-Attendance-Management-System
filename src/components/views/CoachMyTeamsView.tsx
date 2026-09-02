import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CalendarDays,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Settings2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { TrainingSessionsView } from './TrainingSessionsView';
import { TeamWeeklyScheduleSlot, MonthlyTeamTrackingSummary, MonthlyTrainingUnit } from '../../types/database';

const OFFICIAL_VENUES = [
  'ملعب التنس الرئيسي',
  'ملعب التنس الفرعي',
  'الملعب الجديد',
  'الصالة المغطاة'
];

const WEEK_DAYS = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة'
];

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const CoachMyTeamsView: React.FC = () => {
  const { currentUser, t, language, selectedTeam, setSelectedTeam, setCurrentView } = useApp();
  const [players, setPlayers] = useState<any[]>([]);
  const [scheduleSessions, setScheduleSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'monthly' | 'roster' | 'schedule' | 'sessions'>('monthly');

  // Month Tracking State
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [monthlySummary, setMonthlySummary] = useState<MonthlyTeamTrackingSummary | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [editingSlots, setEditingSlots] = useState<TeamWeeklyScheduleSlot[]>([]);
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const assignedTeams = Array.from(new Set(currentUser?.authorizedTeams || []));
  const activeTeam = selectedTeam || assignedTeams[0] || '';

  // Fetch Team Data, Slots, and Monthly Summary
  const fetchAllData = async (team: string, month: number, year: number) => {
    if (!team) return;
    try {
      setLoading(true);
      const userEmail = currentUser?.userEmail || '';
      
      const [rosterRes, schedRes, customSchedRes, monthRes] = await Promise.all([
        fetch(`/api/master/players/by-team?teamName=${encodeURIComponent(team)}`, {
          headers: { 'x-user-email': userEmail }
        }),
        fetch(`/api/coaches/schedules?teamName=${encodeURIComponent(team)}`),
        fetch(`/api/coaches/team-schedule?teamName=${encodeURIComponent(team)}`, {
          headers: { 'x-user-email': userEmail }
        }),
        fetch(`/api/coaches/monthly-tracking?teamName=${encodeURIComponent(team)}&month=${month}&year=${year}`, {
          headers: { 'x-user-email': userEmail }
        })
      ]);

      const rosterData = await rosterRes.json();
      if (rosterData.success) {
        setPlayers(rosterData.players || []);
      }

      const schedData = await schedRes.json();
      if (schedData.success) {
        setScheduleSessions(schedData.sessions || []);
      }

      const customSchedData = await customSchedRes.json();
      if (customSchedData.success && customSchedData.slots && customSchedData.slots.length > 0) {
        setEditingSlots(customSchedData.slots);
      } else {
        setEditingSlots([
          {
            id: 'SLOT-1',
            day: 'السبت',
            startTime: '18:00',
            endTime: '19:30',
            location: OFFICIAL_VENUES[0],
            court: OFFICIAL_VENUES[0]
          },
          {
            id: 'SLOT-2',
            day: 'الثلاثاء',
            startTime: '18:00',
            endTime: '19:30',
            location: OFFICIAL_VENUES[1],
            court: OFFICIAL_VENUES[1]
          }
        ]);
      }

      const monthData = await monthRes.json();
      if (monthData.success) {
        setMonthlySummary(monthData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummaryOnly = async (team: string, month: number, year: number) => {
    if (!team) return;
    try {
      setLoadingMonthly(true);
      const userEmail = currentUser?.userEmail || '';
      const res = await fetch(`/api/coaches/monthly-tracking?teamName=${encodeURIComponent(team)}&month=${month}&year=${year}`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      if (data.success) {
        setMonthlySummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (activeTeam) {
      fetchAllData(activeTeam, selectedMonth, selectedYear);
    }
  }, [activeTeam]);

  useEffect(() => {
    if (activeTeam) {
      fetchMonthlySummaryOnly(activeTeam, selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  // Navigate Month
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = () => {
    setFeedback(null);
    if (editingSlots.length === 0) {
      setEditingSlots([
        {
          id: 'SLOT-1',
          day: 'السبت',
          startTime: '18:00',
          endTime: '19:30',
          location: OFFICIAL_VENUES[0],
          court: OFFICIAL_VENUES[0]
        },
        {
          id: 'SLOT-2',
          day: 'الثلاثاء',
          startTime: '18:00',
          endTime: '19:30',
          location: OFFICIAL_VENUES[1],
          court: OFFICIAL_VENUES[1]
        }
      ]);
    }
    setIsScheduleModalOpen(true);
  };

  // Add New Slot Row
  const handleAddSlot = () => {
    const nextSlotNum = editingSlots.length + 1;
    setEditingSlots([
      ...editingSlots,
      {
        id: `SLOT-${nextSlotNum}-${Date.now().toString().slice(-4)}`,
        day: WEEK_DAYS[(editingSlots.length * 2) % WEEK_DAYS.length],
        startTime: '18:00',
        endTime: '19:30',
        location: OFFICIAL_VENUES[0],
        court: OFFICIAL_VENUES[0]
      }
    ]);
  };

  // Remove Slot Row
  const handleRemoveSlot = (index: number) => {
    if (editingSlots.length <= 1) {
      setFeedback({
        type: 'error',
        message: language === 'ar' ? 'يجب الإبقاء على موعد تدريب واحد على الأقل للفرقة.' : 'At least one training slot is required.'
      });
      return;
    }
    const updated = editingSlots.filter((_, idx) => idx !== index);
    setEditingSlots(updated);
  };

  // Update Slot Field
  const handleSlotChange = (index: number, field: keyof TeamWeeklyScheduleSlot, value: string) => {
    const updated = [...editingSlots];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    if (field === 'location') {
      updated[index].court = value;
    }
    setEditingSlots(updated);
  };

  // Calculate live preview count of dates in the selected month for current slots
  const calculatePreviewDatesCount = () => {
    const daysMap: Record<string, number> = {
      'الأحد': 0, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6
    };
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    let count = 0;
    const dates: string[] = [];

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(selectedYear, selectedMonth - 1, dayNum);
      const dow = d.getDay();
      for (const slot of editingSlots) {
        if (daysMap[slot.day.trim()] === dow) {
          count++;
          dates.push(`${slot.day} ${dayNum}`);
        }
      }
    }
    return { count, dates };
  };

  const preview = calculatePreviewDatesCount();

  // Save Schedule & Automatically Generate Monthly Units
  const handleGenerateAndSaveMonthlySchedule = async () => {
    setFeedback(null);
    for (let i = 0; i < editingSlots.length; i++) {
      const slot = editingSlots[i];
      if (!slot.startTime || !slot.endTime) {
        setFeedback({
          type: 'error',
          message: language === 'ar' ? `الحصة رقم (${i + 1}): يرجى تحديد وقت البدء ووقت الانتهاء.` : `Slot (${i + 1}): Please specify start and end times.`
        });
        return;
      }
      if (slot.startTime >= slot.endTime) {
        setFeedback({
          type: 'error',
          message: language === 'ar' ? `الحصة رقم (${i + 1}): وقت بداية التدريب يجب أن يكون قبل وقت الانتهاء.` : `Slot (${i + 1}): Start time must be before end time.`
        });
        return;
      }
    }

    try {
      setSavingSchedule(true);
      const userEmail = currentUser?.userEmail || '';
      
      const response = await fetch('/api/coaches/generate-monthly-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({
          teamName: activeTeam,
          month: selectedMonth,
          year: selectedYear,
          slots: editingSlots
        })
      });

      const result = await response.json();
      if (result.success) {
        setFeedback({
          type: 'success',
          message: language === 'ar'
            ? `تم توليد ووضع (${result.generatedCount}) وحدة تدريبية لشهر [${result.monthLabel}] بالكامل تلقائياً بدون أي إدخال يدوي للتواريخ!`
            : `Successfully generated ${result.generatedCount} monthly units for [${result.monthLabel}] automatically!`
        });

        await fetchAllData(activeTeam, selectedMonth, selectedYear);
        setTimeout(() => {
          setIsScheduleModalOpen(false);
        }, 1200);
      } else {
        setFeedback({
          type: 'error',
          message: result.error || (language === 'ar' ? 'فشل توليد جدول وحدات الشهر.' : 'Failed to generate monthly schedule.')
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error communicating with server'
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  const currentMonthLabel = `${ARABIC_MONTHS[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Team Selector */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {t.navMyTeams}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar'
                ? 'إدارة الفرق وجدول الوحدات التدريبية الشهرية والمتابعة التلقائية لنسب الحضور'
                : 'Manage authorized squads, auto-generated monthly training units & attendance tracking'}
            </p>
          </div>
        </div>

        {/* Team Selector Pills (Strictly Deduplicated) */}
        <div className="flex items-center gap-2 flex-wrap">
          {assignedTeams.map(tm => (
            <button
              key={tm}
              onClick={() => setSelectedTeam(tm)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTeam === tm
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>🏐</span>
              <span>{tm}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'monthly'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{language === 'ar' ? `المتابعة وجدول الوحدات الشهرية (${monthlySummary?.totalUnitsInMonth || 0})` : `Monthly Units & Tracking (${monthlySummary?.totalUnitsInMonth || 0})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'ar' ? `قائمة اللاعبين (${players.length})` : `Team Roster (${players.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>{language === 'ar' ? 'المواعيد الأسبوعية والملاعب' : 'Weekly Schedule Slots'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>{language === 'ar' ? 'سجل الحصص المنفذة' : 'All Historical Sessions'}</span>
        </button>
      </div>

      {/* ── TAB 1: MONTHLY UNITS & AUTOMATIC TRACKING ── */}
      {activeTab === 'monthly' ? (
        <div className="space-y-6">
          {/* Month Selector Bar & Auto-Generate Action */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition"
                title={language === 'ar' ? 'الشهر السابق' : 'Previous Month'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="px-5 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{currentMonthLabel}</span>
              </div>

              <button
                onClick={handleNextMonth}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition"
                title={language === 'ar' ? 'الشهر القادم' : 'Next Month'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Smart Auto-Generate Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenScheduleModal}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-orange-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === 'ar' ? `توليد وضبط وحدات شهر [${currentMonthLabel}] تلقائياً` : `Auto-Generate Units for ${currentMonthLabel}`}</span>
              </button>
            </div>
          </div>

          {/* Monthly KPI Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">{language === 'ar' ? 'إجمالي وحدات الشهر' : 'Total Month Units'}</span>
                <Calendar className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {monthlySummary?.totalUnitsInMonth || 0} <span className="text-xs font-normal text-slate-400">{language === 'ar' ? 'وحدة تدريبية' : 'units'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? `موضوعة تلقائياً لشهر ${currentMonthLabel}` : `Automated for ${currentMonthLabel}`}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">{language === 'ar' ? 'الوحدات المنفذة' : 'Completed Units'}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {monthlySummary?.completedUnitsCount || 0} <span className="text-xs font-normal text-slate-400">{language === 'ar' ? 'وحدة مكتملة' : 'completed'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'تم تسجيل حضور اللاعبين بها' : 'Attendance recorded'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">{language === 'ar' ? 'الوحدات القادمة' : 'Upcoming Units'}</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {monthlySummary?.upcomingUnitsCount || 0} <span className="text-xs font-normal text-slate-400">{language === 'ar' ? 'وحدة متبقية' : 'upcoming'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'مجدولة في انتظار التنفيذ' : 'Scheduled in month'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">{language === 'ar' ? 'متوسط نسبة الحضور' : 'Monthly Attendance'}</span>
                <TrendingUp className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {monthlySummary?.monthlyAverageAttendanceRate || 0}%
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'معدل التزام اللاعبين الشهري' : 'Roster commitment rate'}
              </p>
            </div>
          </div>

          {/* Monthly Units List / Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>{language === 'ar' ? `جدول الوحدات التدريبية لشهر [${currentMonthLabel}] - ${activeTeam}` : `Training Units for [${currentMonthLabel}] - ${activeTeam}`}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'ar'
                    ? 'يتم وضع التواريخ تلقائياً بناءً على الشهر، ويمكنك تسجيل الحضور المباشر لكل وحدة بضغطة واحدة'
                    : 'Dates placed automatically for the month. Record attendance for any unit with 1-click.'}
                </p>
              </div>
            </div>

            {loadingMonthly ? (
              <LoadingState type="skeleton" rows={4} />
            ) : !monthlySummary || monthlySummary.units.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 mx-auto flex items-center justify-center font-bold text-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {language === 'ar' ? `لا توجد وحدات تدريبية مجدولة لشهر [${currentMonthLabel}]` : `No units generated for [${currentMonthLabel}] yet`}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {language === 'ar'
                    ? 'حدد الأيام والتوقيت والملعب، وسيقوم النظام فوراً بوضع جميع التواريخ والوحدات للشهر تلقائياً دون أي عناء.'
                    : 'Pick your weekly days, timing, and court. The system will automatically place all training dates for the entire month!'}
                </p>
                <button
                  onClick={handleOpenScheduleModal}
                  className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition inline-flex items-center gap-2 shadow-md shadow-orange-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'ar' ? `توليد وحدات شهر [${currentMonthLabel}] الآن` : `Generate ${currentMonthLabel} Units Now`}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlySummary.units.map(unit => (
                  <div
                    key={unit.session.SessionID}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                      unit.isCompleted
                        ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-orange-500/50'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Unit Header Badge & Status */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-orange-500 text-white font-black text-xs shadow-xs">
                          {language === 'ar' ? `الوحدة (${unit.unitNumber})` : `Unit #${unit.unitNumber}`}
                        </span>

                        {unit.isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{language === 'ar' ? 'منفذة (تم الحضور)' : 'Completed'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {language === 'ar' ? 'قادمة ومجدولة' : 'Upcoming'}
                          </span>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="space-y-1.5">
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                          <span>{unit.dayName} {unit.dateStr}</span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{unit.timeRange}</span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="font-medium">{unit.location}</span>
                        </div>
                      </div>

                      {/* Attendance Stats Progress if completed */}
                      {unit.isCompleted && (
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{language === 'ar' ? 'نسبة الحضور:' : 'Attendance Rate:'}</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">{unit.attendanceRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, unit.attendanceRate)}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold pt-1">
                            <span className="text-emerald-600">✓ {unit.presentCount} حضور</span>
                            <span className="text-amber-600">⏱ {unit.lateCount} تأخير</span>
                            <span className="text-rose-600">✗ {unit.absentCount} غياب</span>
                            <span className="text-blue-600">ℹ {unit.excusedCount} إذن</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Direct Action Button: Record Attendance */}
                    <button
                      onClick={() => setCurrentView('coach-attendance')}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        unit.isCompleted
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{unit.isCompleted ? (language === 'ar' ? 'عرض وتعديل كشف الحضور' : 'Review Attendance') : (language === 'ar' ? 'تسجيل حضور هذه الوحدة ⇽' : 'Record Attendance ⇽')}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'roster' ? (
        /* Team Players Roster */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {language === 'ar' ? `كشف لاعبي ${activeTeam} (${players.length} لاعب)` : `${activeTeam} Roster (${players.length} Players)`}
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {t.statPrimaryKey}
            </span>
          </div>

          {loading ? (
            <LoadingState type="skeleton" rows={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 text-start">{t.colPlayerId}</th>
                    <th className="py-3 px-4 text-start">{t.colFullName}</th>
                    <th className="py-3 px-4 text-start">{t.colGender}</th>
                    <th className="py-3 px-4 text-start">{t.colPhone}</th>
                    <th className="py-3 px-4 text-start">{t.colClub}</th>
                    <th className="py-3 px-4 text-start">{t.colBirthYear}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {players.map(p => (
                    <tr key={p.playerId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">{p.playerId}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{p.fullName}</td>
                      <td className="py-3.5 px-4">{p.gender}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{p.phone}</td>
                      <td className="py-3.5 px-4">{p.club}</td>
                      <td className="py-3.5 px-4 font-mono">{p.birthYear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'schedule' ? (
        /* Weekly Schedule Configuration View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span>{language === 'ar' ? `المواعيد الأسبوعية والملاعب المعتمدة لفريق [${activeTeam}]` : `Weekly Timetable for [${activeTeam}]`}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar'
                  ? 'الأيام والتوقيتات والملاعب الأسبوعية التي يتم على أساسها توليد تواريخ الشهر تلقائياً'
                  : 'Weekly days, times and venues used to auto-populate the monthly training dates'}
              </p>
            </div>

            <button
              onClick={handleOpenScheduleModal}
              className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-orange-500/20"
            >
              <Settings2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'تعديل الأيام والمواعيد والملاعب' : 'Configure Schedule Slots'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {editingSlots.map((slot, idx) => (
              <div key={slot.id || idx} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                    {language === 'ar' ? `موعد تدريب دوري (${idx + 1})` : `Weekly Slot #${idx + 1}`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    {slot.day}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.startTime} → {slot.endTime}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span>{slot.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Team Sessions Tab */
        <TrainingSessionsView initialTeamFilter={activeTeam} />
      )}

      {/* ── COACH MODAL: AUTO-GENERATE MONTHLY TRAINING UNITS BY DAYS, TIME & COURT ── */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    {language === 'ar' ? `توليد وضبط وحدات شهر [${currentMonthLabel}]` : `Auto-Generate Units for [${currentMonthLabel}]`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ar'
                      ? `فريق: [${activeTeam}] — حدد الأيام والتوقيت والملعب وسيتم وضع تواريخ الشهر تلقائياً`
                      : `Team: [${activeTeam}] — Select days, timings & court. All monthly dates will be generated automatically`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Banner */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Smart Calculation Preview Banner */}
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-900 dark:text-orange-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-xs text-orange-600 dark:text-orange-400">
                <Sparkles className="w-4 h-4" />
                <span>{language === 'ar' ? 'معاينة التوليد التلقائي لتواريخ الشهر:' : 'Live Auto-Generation Preview:'}</span>
              </div>
              <p className="text-xs">
                {language === 'ar'
                  ? `بناءً على الأيام المختارة، سيتم وضع وتوليد (${preview.count}) وحدة تدريبية لشهر [${currentMonthLabel}] بدون إدخال أي تواريخ يدوياً!`
                  : `Based on selected days, (${preview.count}) training unit dates will be automatically generated for [${currentMonthLabel}]!`}
              </p>
            </div>

            {/* Schedule Slot Rows */}
            <div className="space-y-4 max-h-[45vh] overflow-y-auto px-1">
              {editingSlots.map((slot, idx) => (
                <div
                  key={slot.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                      <span>🏐</span>
                      <span>{language === 'ar' ? `موعد التدريب الدوري (${idx + 1})` : `Training Slot #${idx + 1}`}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(idx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition text-xs font-bold flex items-center gap-1"
                      title={language === 'ar' ? 'حذف هذا الموعد' : 'Remove slot'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'حذف' : 'Remove'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Day Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'ar' ? 'يوم التدريب في الأسبوع' : 'Day of Week'}
                      </label>
                      <select
                        value={slot.day}
                        onChange={e => handleSlotChange(idx, 'day', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                      >
                        {WEEK_DAYS.map(d => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Time Window: Start & End */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'ar' ? 'التوقيت (البدء والانتهاء)' : 'Time (Start - End)'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={e => handleSlotChange(idx, 'startTime', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-slate-400 font-bold text-xs">→</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={e => handleSlotChange(idx, 'endTime', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Court / Venue Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'ar' ? 'الملعب / الصالة المحددة' : 'Court / Venue'}
                      </label>
                      <select
                        value={slot.location}
                        onChange={e => handleSlotChange(idx, 'location', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                      >
                        {OFFICIAL_VENUES.map(v => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Slot Button */}
            <div>
              <button
                type="button"
                onClick={handleAddSlot}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-orange-500/40 hover:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500/5 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? '+ إضافة يوم وتوقيت تدريب آخر في الأسبوع' : '+ Add Another Weekly Training Day'}</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleGenerateAndSaveMonthlySchedule}
                disabled={savingSchedule}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-orange-500/25"
              >
                {savingSchedule ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{language === 'ar' ? `توليد وتطبيق (${preview.count}) وحدة تدريبية لشهر ${currentMonthLabel}` : `Generate (${preview.count}) Units for ${currentMonthLabel}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
