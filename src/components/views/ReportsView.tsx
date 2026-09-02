import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Users,
  User,
  TrendingUp,
  Award,
  Filter,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  UserX,
  Shield,
  RotateCcw,
  Activity,
  Zap,
  AlertCircle,
  X,
  Sparkles,
  BarChart3,
  Layers,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  CheckCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ReportType,
  ReportFilterParams,
  ReportFilterOptions,
  ReportDataPayload,
  DailyAttendanceReportRow,
  WeeklyTeamReportRow,
  MonthlyTeamReportRow,
  PlayerAttendanceReportRow,
  TeamAttendanceReportRow,
  CoachActivityReportRow
} from '../../types/database';
import { getReportFilterOptions, generateReport } from '../../services/reportingService';
import {
  exportToCSV,
  exportToExcel,
  printReport,
  exportToPDF
} from '../../services/exportService';

// ── Color and Formatting Helpers ──────────────────────────────────────────────
const rateColor = (r: number) =>
  r >= 85 ? '#22c55e' : r >= 70 ? '#f59e0b' : r >= 50 ? '#f97316' : '#ef4444';

const rateBg = (r: number) =>
  r >= 85
    ? 'rgba(34,197,94,0.15)'
    : r >= 70
    ? 'rgba(245,158,11,0.15)'
    : r >= 50
    ? 'rgba(249,115,22,0.15)'
    : 'rgba(239,68,68,0.15)';

const discColor = (s: number) =>
  s >= 90 ? '#22c55e' : s >= 75 ? '#3b82f6' : s >= 50 ? '#f59e0b' : '#ef4444';

const discLabel = (s: number, ar: boolean) => {
  if (s >= 90) return ar ? 'ممتاز' : 'Excellent';
  if (s >= 75) return ar ? 'جيد' : 'Good';
  if (s >= 50) return ar ? 'تنبيه' : 'Warning';
  return ar ? 'حرج' : 'Critical';
};

const statusIcon = (s: string) => {
  switch (s) {
    case 'PRESENT':
      return <CheckCircle2 size={14} className="text-emerald-400" />;
    case 'LATE':
      return <Clock size={14} className="text-amber-400" />;
    case 'ABSENT':
      return <UserX size={14} className="text-red-400" />;
    case 'EXCUSED':
      return <Shield size={14} className="text-blue-400" />;
    default:
      return null;
  }
};

const statusLabel = (s: string, ar: boolean) => {
  const m: Record<string, [string, string]> = {
    PRESENT: ['حاضر', 'Present'],
    LATE: ['متأخر', 'Late'],
    ABSENT: ['غائب', 'Absent'],
    EXCUSED: ['بإذن', 'Excused'],
  };
  return ar ? m[s]?.[0] || s : m[s]?.[1] || s;
};

// ── Visual Indicator Components ───────────────────────────────────────────────
const MiniBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden min-w-[48px]">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: color }}
      />
    </div>
    <span className="text-xs font-semibold" style={{ color }}>
      {value}%
    </span>
  </div>
);

const RateBadge: React.FC<{ rate: number }> = ({ rate }) => (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
    style={{ color: rateColor(rate), background: rateBg(rate) }}
  >
    {rate}%
  </span>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <div
    className="relative overflow-hidden rounded-2xl p-4 border bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/80 transition-all duration-300 group"
    style={{ borderColor: `${color}22` }}
  >
    <div
      className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
      style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}
    />
    <div className="flex items-start justify-between relative z-10">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/50 font-medium truncate">{label}</p>
        <p className="mt-1 text-2xl font-black tracking-tight" style={{ color }}>
          {value}
        </p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
      <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
  </div>
);

// ── Report Type Configurations ────────────────────────────────────────────────
const REPORT_TYPES: Array<{
  id: ReportType;
  icon: React.ReactNode;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  color: string;
  adminOnly?: boolean;
}> = [
  {
    id: 'DAILY_ATTENDANCE',
    icon: <Calendar size={20} />,
    labelAr: 'الحضور اليومي',
    labelEn: 'Daily Attendance',
    descAr: 'تقرير تفصيلي للحصص التدريبية اليومية وسجل كل لاعب',
    descEn: 'Detailed session logs and player attendance for specific days',
    color: '#6366f1',
  },
  {
    id: 'WEEKLY_TEAM',
    icon: <CalendarDays size={20} />,
    labelAr: 'تقرير أسبوعي للفرق',
    labelEn: 'Weekly Team Report',
    descAr: 'ملخص أداء الفرق مقسم بالأسابيع مع معدلات الحضور والانضباط',
    descEn: 'Weekly aggregated statistics and discipline metrics per team',
    color: '#8b5cf6',
  },
  {
    id: 'MONTHLY_TEAM',
    icon: <CalendarRange size={20} />,
    labelAr: 'تقرير شهري للفرق',
    labelEn: 'Monthly Team Report',
    descAr: 'تحليل أداء الفرق على مدار الشهور مع مقارنة إجمالي الحضور',
    descEn: 'Monthly trends, active players count and attendance rates',
    color: '#a855f7',
  },
  {
    id: 'PLAYER_ATTENDANCE',
    icon: <User size={20} />,
    labelAr: 'حضور اللاعبين الفردي',
    labelEn: 'Player Attendance',
    descAr: 'سجل حضور وانضباط كل لاعب بالتفصيل وتاريخ المشاركات',
    descEn: 'Individual player rates, discipline scores and session history',
    color: '#10b981',
  },
  {
    id: 'TEAM_ATTENDANCE',
    icon: <Users size={20} />,
    labelAr: 'حضور الفرق الشامل',
    labelEn: 'Team Attendance',
    descAr: 'مقارنة شاملة لجميع الفرق مع نسب الحضور والغياب والانضباط',
    descEn: 'Comprehensive comparison of all teams and coaching staff',
    color: '#3b82f6',
  },
  {
    id: 'COACH_ATTENDANCE_ACTIVITY',
    icon: <Award size={20} />,
    labelAr: 'نشاط المدربين',
    labelEn: 'Coach Activity',
    descAr: 'تقرير إنتاجية المدربين والحصص المنفذة وسجلات الحضور المعتمدة',
    descEn: 'Coach session completion and logged attendance activity (Admin only)',
    color: '#f59e0b',
    adminOnly: true,
  },
];

const DATE_PRESETS = [
  { id: 'ALL', ar: 'كل الأوقات', en: 'All Time' },
  { id: 'TODAY', ar: 'اليوم', en: 'Today' },
  { id: 'THIS_WEEK', ar: 'هذا الأسبوع', en: 'This Week' },
  { id: 'LAST_WEEK', ar: 'الأسبوع الماضي', en: 'Last Week' },
  { id: 'THIS_MONTH', ar: 'هذا الشهر', en: 'This Month' },
  { id: 'LAST_MONTH', ar: 'الشهر الماضي', en: 'Last Month' },
  { id: 'LAST_3_MONTHS', ar: 'آخر 3 أشهر', en: 'Last 3 Months' },
  { id: 'CUSTOM', ar: 'تاريخ مخصص', en: 'Custom Date' },
];

function applyPreset(preset: string): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const today = fmt(now);

  switch (preset) {
    case 'TODAY':
      return { start: today, end: today };
    case 'THIS_WEEK': {
      const m = new Date(now);
      const day = m.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      m.setDate(m.getDate() + diff);
      return { start: fmt(m), end: today };
    }
    case 'LAST_WEEK': {
      const m = new Date(now);
      const day = m.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      m.setDate(m.getDate() + diff - 7);
      const s = new Date(m);
      s.setDate(s.getDate() + 6);
      return { start: fmt(m), end: fmt(s) };
    }
    case 'THIS_MONTH':
      return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: today };
    case 'LAST_MONTH': {
      const l = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const le = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: fmt(l), end: fmt(le) };
    }
    case 'LAST_3_MONTHS': {
      const s = new Date(now);
      s.setMonth(s.getMonth() - 3);
      return { start: fmt(s), end: today };
    }
    default:
      return { start: '', end: '' };
  }
}

// ── Table Container & Cell Components ─────────────────────────────────────────
const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <th
    className={`px-4 py-3.5 text-start text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap bg-slate-800/60 border-b border-slate-700/50 ${className}`}
  >
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <td className={`px-4 py-3.5 text-sm text-slate-300 border-b border-slate-800/40 ${className}`}>
    {children}
  </td>
);

const TableWrap: React.FC<{
  children: React.ReactNode;
  count: number;
  label: string;
  badge?: string;
}> = ({ children, count, label, badge }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-xl">
    <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-800/30 flex-wrap gap-2">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-sm font-bold text-white">{label}</span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50 font-medium">
        {count} {count === 1 ? 'عنصر' : 'عناصر'}
      </span>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

// ── Main Reports View Component ───────────────────────────────────────────────
export const ReportsView: React.FC = () => {
  const { language, currentUser } = useApp();
  const ar = language === 'ar';
  const isAdmin = currentUser?.role === 'ADMIN';
  const userEmail = currentUser?.userEmail || '';

  const [selectedType, setSelectedType] = useState<ReportType>('TEAM_ATTENDANCE');
  const [filterOptions, setFilterOptions] = useState<ReportFilterOptions | null>(null);
  const [reportData, setReportData] = useState<ReportDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Filters State
  const [datePreset, setDatePreset] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');
  const [coachFilter, setCoachFilter] = useState('');
  const [birthYearFilter, setBirthYearFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Export Menu & Status Feedback
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    if (!reportData) return;
    const res = exportToCSV(reportData, { userEmail });
    if (res.success) {
      setExportStatus({
        type: 'success',
        message: ar
          ? 'تم تصدير ملف CSV بنجاح مع دعم كامل للغة العربية (ترميز UTF-8 BOM).'
          : 'CSV file exported successfully with UTF-8 Arabic support.',
      });
    } else {
      setExportStatus({
        type: 'error',
        message: res.error || (ar ? 'فشل تصدير ملف CSV' : 'Failed to export CSV'),
      });
    }
    setShowExportMenu(false);
    setTimeout(() => setExportStatus(null), 5000);
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    const res = exportToExcel(reportData, { userEmail });
    if (res.success) {
      setExportStatus({
        type: 'success',
        message: ar
          ? 'تم تصدير جدول Excel (.xls) المنسق والشامل بنجاح.'
          : 'Excel spreadsheet (.xls) exported successfully.',
      });
    } else {
      setExportStatus({
        type: 'error',
        message: res.error || (ar ? 'فشل تصدير ملف Excel' : 'Failed to export Excel'),
      });
    }
    setShowExportMenu(false);
    setTimeout(() => setExportStatus(null), 5000);
  };

  const handlePrintReport = () => {
    if (!reportData) return;
    const res = printReport(reportData, ar, { userEmail });
    if (res.success) {
      setExportStatus({
        type: 'success',
        message: ar
          ? 'تم تجهيز وفتح نافذة الطباعة الرسمية وحفظ المستند.'
          : 'Print & PDF preview dialog opened successfully.',
      });
    } else {
      setExportStatus({
        type: 'error',
        message: res.error || (ar ? 'فشل فتح شاشة الطباعة' : 'Failed to open print dialog'),
      });
    }
    setShowExportMenu(false);
    setTimeout(() => setExportStatus(null), 5000);
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    const res = exportToPDF(reportData, ar, { userEmail });
    if (res.success) {
      setExportStatus({
        type: 'success',
        message: ar
          ? 'تم إعداد وثيقة التقرير للطباعة والحفظ بصيغة PDF.'
          : 'PDF document generated and prepared for print/save.',
      });
    } else {
      setExportStatus({
        type: 'error',
        message: res.error || (ar ? 'فشل إعداد ملف PDF' : 'Failed to prepare PDF'),
      });
    }
    setShowExportMenu(false);
    setTimeout(() => setExportStatus(null), 5000);
  };

  // Load available filter options based on logged-in user permissions
  useEffect(() => {
    if (userEmail) {
      try {
        const opts = getReportFilterOptions(userEmail);
        setFilterOptions(opts);
      } catch (e) {
        console.error('Error fetching report filters:', e);
      }
    }
  }, [userEmail]);

  const handlePreset = (p: string) => {
    setDatePreset(p);
    if (p !== 'CUSTOM') {
      const { start, end } = applyPreset(p);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleGenerate = useCallback(() => {
    if (!userEmail) return;
    setIsLoading(true);
    setError(null);
    setExpandedRow(null);

    try {
      const params: ReportFilterParams = {
        reportType: selectedType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        teamName: teamFilter || undefined,
        playerId: playerFilter || undefined,
        coachId: coachFilter || undefined,
        teamBirthYear: birthYearFilter || undefined,
        gender: genderFilter || undefined,
      };

      const result = generateReport(userEmail, params);

      if (!result.success || !result.data) {
        setError(result.error || (ar ? 'فشل إنشاء التقرير' : 'Failed to generate report'));
        setReportData(null);
      } else {
        setReportData(result.data);
        setShowFilters(false);
      }
    } catch (err: any) {
      setError(err.message || (ar ? 'حدث خطأ غير متوقع' : 'Unexpected error'));
    } finally {
      setIsLoading(false);
    }
  }, [
    userEmail,
    selectedType,
    startDate,
    endDate,
    teamFilter,
    playerFilter,
    coachFilter,
    birthYearFilter,
    genderFilter,
    ar,
  ]);

  // Generate on initial load
  useEffect(() => {
    if (userEmail && !reportData && !isLoading) {
      handleGenerate();
    }
  }, [userEmail]);

  const handleReset = () => {
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setTeamFilter('');
    setPlayerFilter('');
    setCoachFilter('');
    setBirthYearFilter('');
    setGenderFilter('');
    setSearch('');
    setReportData(null);
    setError(null);
    setShowFilters(true);
    setExpandedRow(null);
  };

  const activeType = REPORT_TYPES.find((r) => r.id === selectedType)!;
  const summary = reportData?.summary;

  return (
    <div
      className="min-h-screen pb-12"
      dir={ar ? 'rtl' : 'ltr'}
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0f172a 50%, #090d16 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className="p-2.5 rounded-2xl border"
                style={{
                  background: `${activeType.color}15`,
                  borderColor: `${activeType.color}30`,
                }}
              >
                <span style={{ color: activeType.color }}>{activeType.icon}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full border shadow-sm"
                  style={{
                    color: activeType.color,
                    borderColor: `${activeType.color}40`,
                    background: `${activeType.color}12`,
                  }}
                >
                  {ar ? 'المرحلة 14 — نظام التقارير' : 'Phase 14 — Reporting Engine'}
                </span>
                {!isAdmin && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {ar ? 'فرقك المصرح بها فقط' : 'Authorized Teams Only'}
                  </span>
                )}
              </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {ar ? 'نظام التقارير والإحصائيات المتقدم' : 'Advanced Analytics & Reports'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {ar
                ? 'لوحة تحليلية متكاملة لتقييم حضور الفرق، نسب الغياب، التأخير، ودرجات الانضباط الرياضي المعتمدة.'
                : 'Comprehensive analytics engine for tracking attendance rates, absences, lateness, and player discipline scores.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {reportData && (
              <button
                onClick={() => setShowFilters((p) => !p)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all shadow-md"
              >
                <Filter size={14} className={showFilters ? 'text-indigo-400' : ''} />
                {ar
                  ? showFilters
                    ? 'إخفاء الفلاتر'
                    : 'تعديل الفلاتر'
                  : showFilters
                  ? 'Hide Filters'
                  : 'Edit Filters'}
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 hover:text-white transition-all"
            >
              <RotateCcw size={14} />
              {ar ? 'إعادة ضبط' : 'Reset'}
            </button>
          </div>
        </div>

        {/* ── Report Type Switcher Grid ───────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {ar ? 'اختر نوع التقرير المطلوب' : 'Select Report Type'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {REPORT_TYPES.map((rt) => {
              if (rt.adminOnly && !isAdmin) return null;
              const active = selectedType === rt.id;

              return (
                <button
                  key={rt.id}
                  onClick={() => {
                    setSelectedType(rt.id);
                    setReportData(null);
                    setError(null);
                    setShowFilters(true);
                  }}
                  className={`relative group p-4 rounded-2xl border text-start transition-all duration-300 flex flex-col justify-between ${
                    active
                      ? 'scale-[1.02] shadow-xl bg-slate-800/90'
                      : 'bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                  style={{
                    borderColor: active ? rt.color : 'rgba(255,255,255,0.08)',
                    boxShadow: active ? `0 0 25px ${rt.color}25` : 'none',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: active ? `${rt.color}25` : 'rgba(255,255,255,0.05)' }}
                      >
                        <span style={{ color: active ? rt.color : 'rgba(255,255,255,0.5)' }}>
                          {rt.icon}
                        </span>
                      </div>
                      {rt.adminOnly && (
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 rounded border"
                          style={{
                            background: `${rt.color}20`,
                            color: rt.color,
                            borderColor: `${rt.color}40`,
                          }}
                        >
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{ color: active ? rt.color : 'rgba(255,255,255,0.9)' }}
                    >
                      {ar ? rt.labelAr : rt.labelEn}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                      {ar ? rt.descAr : rt.descEn}
                    </p>
                  </div>

                  {active && (
                    <div
                      className="w-full h-1 rounded-full mt-3"
                      style={{ background: rt.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Filter Parameters Card ──────────────────────────────────── */}
        {showFilters && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Filter size={18} className="text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {ar ? 'تخصيص الفلاتر ومعايير البحث' : 'Customize Report Criteria'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ar
                      ? 'حدد المعايير لتضييق نطاق البيانات وتوليد إحصائيات دقيقة'
                      : 'Apply specific filters to refine dataset results'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                {ar ? 'النطاق الزمني السريع' : 'Date Range Preset'}
              </label>
              <div className="flex flex-wrap gap-2">
                {DATE_PRESETS.map((dp) => (
                  <button
                    key={dp.id}
                    onClick={() => handlePreset(dp.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      datePreset === dp.id
                        ? 'text-white shadow-lg'
                        : 'text-slate-400 hover:text-white bg-slate-800/40 border border-slate-800 hover:border-slate-700'
                    }`}
                    style={{
                      background: datePreset === dp.id ? activeType.color : undefined,
                    }}
                  >
                    {ar ? dp.ar : dp.en}
                  </button>
                ))}
              </div>

              {(datePreset === 'CUSTOM' || startDate || endDate) && (
                <div className="flex gap-3 flex-wrap items-center mt-3 p-3 rounded-2xl bg-slate-800/30 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{ar ? 'من:' : 'From:'}</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset('CUSTOM');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{ar ? 'إلى:' : 'To:'}</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset('CUSTOM');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dimensional Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Team Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {ar ? 'الفريق' : 'Team'}
                </label>
                <select
                  value={teamFilter}
                  onChange={(e) => {
                    setTeamFilter(e.target.value);
                    setPlayerFilter('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400 appearance-none font-medium"
                >
                  <option value="">{ar ? 'جميع الفرق المتاحة' : 'All Available Teams'}</option>
                  {filterOptions?.availableTeams.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Player Dropdown */}
              {(selectedType === 'PLAYER_ATTENDANCE' || selectedType === 'DAILY_ATTENDANCE') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {ar ? 'اللاعب' : 'Player'}
                  </label>
                  <select
                    value={playerFilter}
                    onChange={(e) => setPlayerFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400 appearance-none font-medium"
                  >
                    <option value="">{ar ? 'جميع اللاعبين' : 'All Players'}</option>
                    {filterOptions?.availablePlayers
                      .filter((p) => !teamFilter || p.team === teamFilter)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.team})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Coach Dropdown (Admin only) */}
              {isAdmin && selectedType === 'COACH_ATTENDANCE_ACTIVITY' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {ar ? 'المدرب' : 'Coach'}
                  </label>
                  <select
                    value={coachFilter}
                    onChange={(e) => setCoachFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400 appearance-none font-medium"
                  >
                    <option value="">{ar ? 'جميع المدربين' : 'All Coaches'}</option>
                    {filterOptions?.availableCoaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Birth Year Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {ar ? 'مواليد الفريق' : 'Team Birth Year'}
                </label>
                <select
                  value={birthYearFilter}
                  onChange={(e) => setBirthYearFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400 appearance-none font-medium"
                >
                  <option value="">{ar ? 'جميع السنوات' : 'All Birth Years'}</option>
                  {filterOptions?.availableBirthYears.map((y) => (
                    <option key={y} value={y}>
                      مواليد {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {ar ? 'النوع / الفئة' : 'Gender'}
                </label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400 appearance-none font-medium"
                >
                  <option value="">{ar ? 'الكل (بنات وبنين)' : 'All Genders'}</option>
                  {filterOptions?.availableGenders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
              <span className="text-xs text-slate-400">
                {ar
                  ? 'يتم حساب الإحصائيات مباشرة من قاعدة البيانات المحدثة'
                  : 'Computed live from active master database memory'}
              </span>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center gap-2.5 px-7 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${activeType.color}, ${activeType.color}cc)`,
                  boxShadow: `0 8px 25px ${activeType.color}40`,
                }}
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                {ar
                  ? isLoading
                    ? 'جاري المعالجة...'
                    : 'تطبيق الفلاتر وعرض التقرير'
                  : isLoading
                  ? 'Generating...'
                  : 'Generate Report'}
              </button>
            </div>
          </div>
        )}

        {/* ── Error Banner ────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-md">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300 font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ms-auto text-red-400 hover:text-red-200"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* ── Generated Report View ───────────────────────────────────── */}
        {reportData && !isLoading && (
          <div className="space-y-6 animate-fadeIn">
            {/* Report Header Metadata Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 p-5 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3.5">
                <div
                  className="p-3 rounded-2xl"
                  style={{ background: `${activeType.color}20` }}
                >
                  <span style={{ color: activeType.color }}>{activeType.icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{reportData.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ar ? 'أنشئ بواسطة:' : 'Generated by:'}{' '}
                    <span className="text-slate-300 font-semibold">{reportData.generatedByUser}</span>
                    {' · '}
                    {new Date(reportData.generatedAt).toLocaleString(ar ? 'ar-EG' : 'en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Export & Print Dropdown */}
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu((p) => !p)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                  >
                    <Download size={14} />
                    <span>{ar ? 'تصدير وطباعة' : 'Export & Print'}</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${
                        showExportMenu ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showExportMenu && (
                    <div className="absolute end-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-2 z-50 animate-fadeIn space-y-1">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {ar ? 'خيارات التصدير والطباعة' : 'Export & Print Options'}
                        </p>
                      </div>

                      {/* 1. CSV */}
                      <button
                        onClick={handleExportCSV}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-start group"
                      >
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                          <FileSpreadsheet size={15} />
                        </div>
                        <div>
                          <p className="font-bold">{ar ? 'تصدير ملف CSV' : 'Export CSV'}</p>
                          <p className="text-[10px] text-slate-400">
                            {ar ? 'متوافق مع Excel وبترميز UTF-8' : 'UTF-8 BOM Arabic Format'}
                          </p>
                        </div>
                      </button>

                      {/* 2. Excel */}
                      <button
                        onClick={handleExportExcel}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-start group"
                      >
                        <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20">
                          <Download size={15} />
                        </div>
                        <div>
                          <p className="font-bold">{ar ? 'تصدير جدول Excel (.xls)' : 'Export Excel (.xls)'}</p>
                          <p className="text-[10px] text-slate-400">
                            {ar ? 'تنسيق متكامل وبطاقات المؤشرات' : 'Styled XML/HTML with KPIs'}
                          </p>
                        </div>
                      </button>

                      {/* 3. Print */}
                      <button
                        onClick={handlePrintReport}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-start group"
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                          <Printer size={15} />
                        </div>
                        <div>
                          <p className="font-bold">{ar ? 'طباعة التقرير (A4)' : 'Print Report (A4)'}</p>
                          <p className="text-[10px] text-slate-400">
                            {ar ? 'مستند رسمي للطباعة والتوقيع' : 'Printable document format'}
                          </p>
                        </div>
                      </button>

                      {/* 4. PDF */}
                      <button
                        onClick={handleExportPDF}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-start group"
                      >
                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20">
                          <FileText size={15} />
                        </div>
                        <div>
                          <p className="font-bold">{ar ? 'حفظ بصيغة PDF' : 'Save as PDF'}</p>
                          <p className="text-[10px] text-slate-400">
                            {ar ? 'تجهيز وثيقة PDF للتحميل' : 'Ready for PDF generation'}
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters((p) => !p)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:text-white transition-all shadow-md"
                >
                  <Filter size={13} />
                  {ar ? 'تغيير الفلاتر' : 'Change Filters'}
                </button>
              </div>
            </div>

            {/* Export Feedback Toast / Banner */}
            {exportStatus && (
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md animate-fadeIn ${
                  exportStatus.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {exportStatus.type === 'success' ? (
                  <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                )}
                <p className="text-xs font-semibold flex-1">{exportStatus.message}</p>
                <button
                  onClick={() => setExportStatus(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Summary Metrics Cards Grid */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3.5">
                <StatCard
                  icon={<Activity size={18} />}
                  label={ar ? 'إجمالي السجلات' : 'Total Records'}
                  value={summary.totalRecords.toLocaleString()}
                  color="#6366f1"
                />
                <StatCard
                  icon={<Calendar size={18} />}
                  label={ar ? 'الحصص التدريبية' : 'Sessions'}
                  value={summary.totalSessions}
                  color="#8b5cf6"
                />
                <StatCard
                  icon={<CheckCircle2 size={18} />}
                  label={ar ? 'حاضر' : 'Present'}
                  value={summary.presentCount}
                  sub={`${summary.attendanceRate}%`}
                  color="#22c55e"
                />
                <StatCard
                  icon={<Clock size={18} />}
                  label={ar ? 'متأخر' : 'Late'}
                  value={summary.lateCount}
                  sub={`${summary.lateRate}%`}
                  color="#f59e0b"
                />
                <StatCard
                  icon={<UserX size={18} />}
                  label={ar ? 'غائب' : 'Absent'}
                  value={summary.absentCount}
                  sub={`${summary.absenceRate}%`}
                  color="#ef4444"
                />
                <StatCard
                  icon={<Shield size={18} />}
                  label={ar ? 'بإذن رسمي' : 'Excused'}
                  value={summary.excusedCount}
                  color="#3b82f6"
                />
                <StatCard
                  icon={<TrendingUp size={18} />}
                  label={ar ? 'نسبة الحضور' : 'Att. Rate'}
                  value={`${summary.attendanceRate}%`}
                  color={rateColor(summary.attendanceRate)}
                />
                {summary.averageDisciplineScore !== undefined && (
                  <StatCard
                    icon={<Award size={18} />}
                    label={ar ? 'نقاط الانضباط' : 'Discipline'}
                    value={`${summary.averageDisciplineScore}/100`}
                    sub={discLabel(summary.averageDisciplineScore, ar)}
                    color={discColor(summary.averageDisciplineScore)}
                  />
                )}
              </div>
            )}

            {/* Instant Filter Search Bar */}
            <div className="relative">
              <Search
                size={16}
                className="absolute top-1/2 -translate-y-1/2 start-4 text-slate-400 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  ar
                    ? 'بحث فوري في نتائج التقرير (اسم الفريق، اللاعب، المدرب...)'
                    : 'Search within table results...'
                }
                className="w-full ps-11 pe-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 -translate-y-1/2 end-4 text-slate-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* ── Sub-Report Content Tables ────────────────────────────── */}
            {reportData.reportType === 'DAILY_ATTENDANCE' && reportData.dailyRows && (
              <DailyTable
                rows={reportData.dailyRows}
                ar={ar}
                search={search}
                expanded={expandedRow}
                setExpanded={setExpandedRow}
              />
            )}
            {reportData.reportType === 'WEEKLY_TEAM' && reportData.weeklyRows && (
              <WeeklyTable rows={reportData.weeklyRows} ar={ar} search={search} />
            )}
            {reportData.reportType === 'MONTHLY_TEAM' && reportData.monthlyRows && (
              <MonthlyTable rows={reportData.monthlyRows} ar={ar} search={search} />
            )}
            {reportData.reportType === 'PLAYER_ATTENDANCE' && reportData.playerRows && (
              <PlayerTable
                rows={reportData.playerRows}
                ar={ar}
                search={search}
                expanded={expandedRow}
                setExpanded={setExpandedRow}
              />
            )}
            {reportData.reportType === 'TEAM_ATTENDANCE' && reportData.teamRows && (
              <TeamTable rows={reportData.teamRows} ar={ar} search={search} />
            )}
            {reportData.reportType === 'COACH_ATTENDANCE_ACTIVITY' && reportData.coachRows && (
              <CoachTable rows={reportData.coachRows} ar={ar} search={search} />
            )}
          </div>
        )}

        {/* ── Empty State ─────────────────────────────────────────────── */}
        {!reportData && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
            <div
              className="p-6 rounded-3xl border shadow-xl"
              style={{
                background: `${activeType.color}10`,
                borderColor: `${activeType.color}30`,
              }}
            >
              <span style={{ color: activeType.color, opacity: 0.8 }}>
                {React.cloneElement(activeType.icon as React.ReactElement, { size: 48 } as any)}
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {ar ? 'التقرير جاهز للتوليد' : 'Report Ready to Generate'}
              </p>
              <p className="text-sm text-slate-400 mt-1 max-w-md">
                {ar
                  ? `اضغط على الزر أدناه لتطبيق الفلاتر وعرض ${activeType.labelAr}`
                  : `Click the button below to generate ${activeType.labelEn}`}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white hover:scale-105 active:scale-95 transition-all shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${activeType.color}, ${activeType.color}bb)`,
              }}
            >
              <Zap size={16} />
              {ar ? 'توليد التقرير الآن' : 'Generate Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Specialized Sub-tables Components
// ══════════════════════════════════════════════════════════════════════════════

// 1. Daily Attendance Table
const DailyTable: React.FC<{
  rows: DailyAttendanceReportRow[];
  ar: boolean;
  search: string;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}> = ({ rows, ar, search, expanded, setExpanded }) => {
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.teamName.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.coachName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <TableWrap count={filtered.length} label={ar ? 'سجل الحصص التدريبية اليومية' : 'Daily Sessions Log'}>
      <table className="w-full">
        <thead>
          <tr>
            <Th>{ar ? 'التاريخ' : 'Date'}</Th>
            <Th>{ar ? 'الفريق' : 'Team'}</Th>
            <Th>{ar ? 'المدرب المسؤول' : 'Coach'}</Th>
            <Th>{ar ? 'المكان والتوقيت' : 'Time & Venue'}</Th>
            <Th>{ar ? 'تفاصيل الحضور' : 'Attendance Summary'}</Th>
            <Th>{ar ? 'نسبة الحضور' : 'Att. Rate'}</Th>
            <Th className="text-center">{ar ? 'سجل اللاعبين' : 'Details'}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {filtered.map((row) => {
            const exp = expanded === row.sessionId;
            return (
              <React.Fragment key={row.sessionId}>
                <tr
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setExpanded(exp ? null : row.sessionId)}
                >
                  <Td>
                    <span className="font-mono text-xs bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
                      {row.date}
                    </span>
                  </Td>
                  <Td className="font-bold text-white">{row.teamName}</Td>
                  <Td className="text-slate-300 font-medium">{row.coachName}</Td>
                  <Td className="text-slate-400 text-xs">
                    <div>{row.timeRange}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{row.location}</div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2.5 text-xs font-semibold">
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {row.presentCount} {ar ? 'حاضر' : 'pres'}
                      </span>
                      {row.lateCount > 0 && (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {row.lateCount} {ar ? 'متأخر' : 'late'}
                        </span>
                      )}
                      {row.absentCount > 0 && (
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                          {row.absentCount} {ar ? 'غائب' : 'abs'}
                        </span>
                      )}
                      {row.excusedCount > 0 && (
                        <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                          {row.excusedCount} {ar ? 'بإذن' : 'exc'}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <RateBadge rate={row.attendanceRate} />
                  </Td>
                  <Td className="text-center">
                    <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                      {exp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </Td>
                </tr>

                {exp && (
                  <tr>
                    <td colSpan={7} className="px-6 py-5 bg-slate-950/60 border-y border-slate-800">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {ar ? 'سجل حضور اللاعبين بالحصة:' : 'Session Players Attendance:'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {row.records.length} {ar ? 'لاعب مسجل' : 'players logged'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {row.records.map((rec, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors"
                            >
                              <div className="flex-shrink-0">{statusIcon(rec.status)}</div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">
                                  {rec.playerName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {statusLabel(rec.status, ar)}
                                  </span>
                                  {rec.lateMinutes && (
                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1 rounded">
                                      +{rec.lateMinutes} {ar ? 'د' : 'm'}
                                    </span>
                                  )}
                                  {rec.excuseType && (
                                    <span className="text-[10px] text-blue-400 truncate">
                                      ({rec.excuseType})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center text-slate-500 text-sm">
                {ar ? 'لا توجد حصص تدريبية تطابق معايير الفلترة' : 'No training sessions found'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
};

// 2. Weekly Team Table
const WeeklyTable: React.FC<{
  rows: WeeklyTeamReportRow[];
  ar: boolean;
  search: string;
}> = ({ rows, ar, search }) => {
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.teamName.toLowerCase().includes(q) || r.weekLabel.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <TableWrap count={filtered.length} label={ar ? 'التقرير الأسبوعي للفرق' : 'Weekly Team Summary'}>
      <table className="w-full">
        <thead>
          <tr>
            <Th>{ar ? 'الأسبوع' : 'Week'}</Th>
            <Th>{ar ? 'الفريق' : 'Team'}</Th>
            <Th>{ar ? 'عدد الحصص' : 'Sessions'}</Th>
            <Th>{ar ? 'حاضر' : 'Present'}</Th>
            <Th>{ar ? 'متأخر' : 'Late'}</Th>
            <Th>{ar ? 'غائب' : 'Absent'}</Th>
            <Th>{ar ? 'بإذن' : 'Excused'}</Th>
            <Th>{ar ? 'معدل الحضور' : 'Att. Rate'}</Th>
            <Th>{ar ? 'نقاط الانضباط' : 'Discipline'}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {filtered.map((row, i) => (
            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
              <Td>
                <div>
                  <p className="text-xs font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded inline-block">
                    {row.weekKey}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{row.weekLabel}</p>
                </div>
              </Td>
              <Td className="font-bold text-white">{row.teamName}</Td>
              <Td className="text-slate-300 font-semibold">{row.sessionCount}</Td>
              <Td>
                <span className="text-emerald-400 font-bold">{row.presentCount}</span>
              </Td>
              <Td>
                <span className="text-amber-400 font-bold">{row.lateCount}</span>
              </Td>
              <Td>
                <span className="text-red-400 font-bold">{row.absentCount}</span>
              </Td>
              <Td>
                <span className="text-blue-400 font-bold">{row.excusedCount}</span>
              </Td>
              <Td>
                <div className="space-y-1.5 min-w-[100px]">
                  <RateBadge rate={row.attendanceRate} />
                  <MiniBar value={row.attendanceRate} color={rateColor(row.attendanceRate)} />
                </div>
              </Td>
              <Td>
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-lg border"
                  style={{
                    color: discColor(row.disciplineScore),
                    borderColor: `${discColor(row.disciplineScore)}30`,
                    background: `${discColor(row.disciplineScore)}10`,
                  }}
                >
                  {row.disciplineScore}/100
                </span>
              </Td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center text-slate-500 text-sm">
                {ar ? 'لا توجد بيانات أسبوعية' : 'No weekly data found'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
};

// 3. Monthly Team Table
const MonthlyTable: React.FC<{
  rows: MonthlyTeamReportRow[];
  ar: boolean;
  search: string;
}> = ({ rows, ar, search }) => {
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.teamName.toLowerCase().includes(q) || r.monthLabel.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <TableWrap count={filtered.length} label={ar ? 'التقرير الشهري للفرق' : 'Monthly Team Summary'}>
      <table className="w-full">
        <thead>
          <tr>
            <Th>{ar ? 'الشهر' : 'Month'}</Th>
            <Th>{ar ? 'الفريق' : 'Team'}</Th>
            <Th>{ar ? 'الحصص' : 'Sessions'}</Th>
            <Th>{ar ? 'اللاعبين النشطين' : 'Active Players'}</Th>
            <Th>{ar ? 'إجمالي السجلات' : 'Total Logs'}</Th>
            <Th>{ar ? 'حاضر' : 'Present'}</Th>
            <Th>{ar ? 'غائب' : 'Absent'}</Th>
            <Th>{ar ? 'معدل الحضور' : 'Att. Rate'}</Th>
            <Th>{ar ? 'الانضباط' : 'Discipline'}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {filtered.map((row, i) => (
            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
              <Td>
                <div>
                  <p className="text-xs font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded inline-block">
                    {row.monthKey}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{row.monthLabel}</p>
                </div>
              </Td>
              <Td className="font-bold text-white">{row.teamName}</Td>
              <Td className="text-slate-300 font-semibold">{row.sessionCount}</Td>
              <Td className="text-slate-400">{row.uniquePlayersCount}</Td>
              <Td className="text-slate-400">{row.totalAttendances}</Td>
              <Td>
                <span className="text-emerald-400 font-bold">{row.presentCount}</span>
              </Td>
              <Td>
                <span className="text-red-400 font-bold">{row.absentCount}</span>
              </Td>
              <Td>
                <div className="space-y-1.5 min-w-[100px]">
                  <RateBadge rate={row.attendanceRate} />
                  <MiniBar value={row.attendanceRate} color={rateColor(row.attendanceRate)} />
                </div>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-lg border"
                    style={{
                      color: discColor(row.disciplineScore),
                      borderColor: `${discColor(row.disciplineScore)}30`,
                      background: `${discColor(row.disciplineScore)}10`,
                    }}
                  >
                    {row.disciplineScore}/100
                  </span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: discColor(row.disciplineScore) }}
                  >
                    {discLabel(row.disciplineScore, ar)}
                  </span>
                </div>
              </Td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center text-slate-500 text-sm">
                {ar ? 'لا توجد بيانات شهرية' : 'No monthly data found'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
};

// 4. Player Attendance Table
const PlayerTable: React.FC<{
  rows: PlayerAttendanceReportRow[];
  ar: boolean;
  search: string;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}> = ({ rows, ar, search, expanded, setExpanded }) => {
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.teamName.toLowerCase().includes(q) ||
        r.playerId.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <TableWrap count={filtered.length} label={ar ? 'سجل حضور اللاعبين الفردي' : 'Individual Players Attendance'}>
      <table className="w-full">
        <thead>
          <tr>
            <Th>#</Th>
            <Th>{ar ? 'اللاعب' : 'Player'}</Th>
            <Th>{ar ? 'الفريق' : 'Team'}</Th>
            <Th>{ar ? 'النوع' : 'Gender'}</Th>
            <Th>{ar ? 'حاضر' : 'Present'}</Th>
            <Th>{ar ? 'متأخر' : 'Late'}</Th>
            <Th>{ar ? 'غائب' : 'Absent'}</Th>
            <Th>{ar ? 'بإذن' : 'Excused'}</Th>
            <Th>{ar ? 'معدل الحضور' : 'Att. Rate'}</Th>
            <Th>{ar ? 'الانضباط' : 'Discipline'}</Th>
            <Th className="text-center">{ar ? 'السجل' : 'History'}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {filtered.map((row, i) => {
            const exp = expanded === row.playerId;
            return (
              <React.Fragment key={row.playerId}>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <Td className="text-slate-500 font-mono text-xs">{i + 1}</Td>
                  <Td>
                    <div>
                      <p className="font-bold text-white">{row.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{row.playerId}</p>
                    </div>
                  </Td>
                  <Td className="text-slate-300 text-xs font-medium">{row.teamName}</Td>
                  <Td className="text-slate-400 text-xs">{row.gender}</Td>
                  <Td>
                    <span className="text-emerald-400 font-bold">{row.presentCount}</span>
                  </Td>
                  <Td>
                    <span className="text-amber-400 font-bold">{row.lateCount}</span>
                  </Td>
                  <Td>
                    <span className="text-red-400 font-bold">{row.absentCount}</span>
                  </Td>
                  <Td>
                    <span className="text-blue-400 font-bold">{row.excusedCount}</span>
                  </Td>
                  <Td>
                    <div className="space-y-1.5 min-w-[90px]">
                      <RateBadge rate={row.attendanceRate} />
                      <MiniBar value={row.attendanceRate} color={rateColor(row.attendanceRate)} />
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-xs font-black"
                        style={{ color: discColor(row.disciplineScore) }}
                      >
                        {row.disciplineScore}/100
                      </span>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: discColor(row.disciplineScore) }}
                      >
                        {discLabel(row.disciplineScore, ar)}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-center">
                    <button
                      onClick={() => setExpanded(exp ? null : row.playerId)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      {exp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </Td>
                </tr>

                {exp && row.history.length > 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-4 bg-slate-950/60 border-y border-slate-800">
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {ar ? 'السجل التاريخي للحضور بالتاريخ:' : 'Attendance Session History:'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {row.history.slice(0, 40).map((h, j) => (
                            <div
                              key={j}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border border-slate-800 bg-slate-900"
                            >
                              {statusIcon(h.status)}
                              <span className="text-slate-300 font-mono text-[11px]">{h.date}</span>
                              {h.lateMinutes && (
                                <span className="text-amber-400 font-bold text-[10px]">
                                  +{h.lateMinutes}د
                                </span>
                              )}
                            </div>
                          ))}
                          {row.history.length > 40 && (
                            <span className="text-xs text-slate-500 self-center">
                              +{row.history.length - 40} {ar ? 'سجل إضافي' : 'more'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={11} className="px-4 py-16 text-center text-slate-500 text-sm">
                {ar ? 'لا يوجد لاعبون يطابقون البحث' : 'No players found'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
};

// 5. Team Attendance Comparison Table
const TeamTable: React.FC<{
  rows: TeamAttendanceReportRow[];
  ar: boolean;
  search: string;
}> = ({ rows, ar, search }) => {
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.teamName.toLowerCase().includes(q) ||
        (r.headCoachName || '').toLowerCase().includes(q) ||
        (r.club || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <TableWrap count={filtered.length} label={ar ? 'تقرير الحضور الشامل لفرق النادي' : 'Team Attendance Overview'}>
      <table className="w-full">
        <thead>
          <tr>
            <Th>#</Th>
            <Th>{ar ? 'الفريق' : 'Team'}</Th>
            <Th>{ar ? 'النادي' : 'Club'}</Th>
            <Th>{ar ? 'المدرب الفني' : 'Head Coach'}</Th>
            <Th>{ar ? 'اللاعبون' : 'Players'}</Th>
            <Th>{ar ? 'الحصص' : 'Sessions'}</Th>
            <Th>{ar ? 'حاضر' : 'Present'}</Th>
            <Th>{ar ? 'غائب' : 'Absent'}</Th>
            <Th>{ar ? 'معدل الحضور' : 'Att. Rate'}</Th>
            <Th>{ar ? 'درجة الانضباط' : 'Discipline Score'}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {filtered.map((row, i) => (
            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
              <Td className="text-slate-500 font-mono text-xs">{i + 1}</Td>
              <Td>
                <div>
                  <p className="font-bold text-white">{row.teamName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {row.gender} {row.teamBirthYear && `· مواليد ${row.teamBirthYear}`}
                  </p>
                </div>
              </Td>
              <Td>
                {row.club && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 text-amber-400 bg-amber-500/10 font-bold">
                    {row.club}
                  </span>
                )}
              </Td>
              <Td className="text-slate-300 font-medium text-xs">{row.headCoachName}</Td>
              <Td className="text-slate-400 font-semibold">{row.playerCount}</Td>
              <Td className="text-slate-400 font-semibold">{row.sessionCount}</Td>
              <Td>
                <span className="text-emerald-400 font-bold">{row.presentCount}</span>
              </Td>
              <Td>
                <span className="text-red-400 font-bold">{row.absentCount}</span>
              </Td>
              <Td>
                <div className="space-y-1.5 min-w-[90px]">
                  <RateBadge rate={row.attendanceRate} />
                  <MiniBar value={row.attendanceRate} color={rateColor(row.attendanceRate)} />
                </div>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-lg border"
                    style={{
                      color: discColor(row.disciplineScore),
                      borderColor: `${discColor(row.disciplineScore)}30`,
                      background: `${discColor(row.disciplineScore)}10`,
                    }}
                  >
                    {row.disciplineScore}/100
                  </span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: discColor(row.disciplineScore) }}
                  >
                    {discLabel(row.disciplineScore, ar)}
                  </span>
                </div>
              </Td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-16 text-center text-slate-500 text-sm">
                {ar ? 'لا توجد فرق تطابق المعايير' : 'No teams found'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
};

// 6. Coach Attendance Activity Table (Admin only)
const CoachTable: React.FC<{
  rows: CoachActivityReportRow[];
  ar: boolean;
  search: string;
}> = ({ rows, ar, search }) => {
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.coachName.toLowerCase().includes(q) ||
        r.coachEmail.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <TableWrap
      count={filtered.length}
      label={ar ? 'تقرير نشاط وإنتاجية المدربين' : 'Coach Activity & Productivity'}
      badge={ar ? 'إدارة النادي' : 'Admin'}
    >
      <table className="w-full">
        <thead>
          <tr>
            <Th>#</Th>
            <Th>{ar ? 'المدرب' : 'Coach'}</Th>
            <Th>{ar ? 'الدور الوظيفي' : 'Role'}</Th>
            <Th>{ar ? 'الفرق المسندة' : 'Assigned Teams'}</Th>
            <Th>{ar ? 'الحصص المجدولة' : 'Scheduled'}</Th>
            <Th>{ar ? 'الحصص المنفذة' : 'Conducted'}</Th>
            <Th>{ar ? 'سجلات الحضور المعتمدة' : 'Attendance Logs'}</Th>
            <Th>{ar ? 'متوسط حضور الفرق' : 'Avg Team Rate'}</Th>
            <Th>{ar ? 'آخر نشاط' : 'Last Active'}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {filtered.map((row, i) => (
            <tr key={row.coachId} className="hover:bg-slate-800/30 transition-colors">
              <Td className="text-slate-500 font-mono text-xs">{i + 1}</Td>
              <Td>
                <div>
                  <p className="font-bold text-white">{row.coachName}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{row.coachEmail}</p>
                </div>
              </Td>
              <Td>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-bold border"
                  style={{
                    background:
                      row.role === 'ADMIN'
                        ? '#f59e0b20'
                        : row.role === 'HEAD_COACH'
                        ? '#3b82f620'
                        : '#6366f120',
                    color:
                      row.role === 'ADMIN'
                        ? '#f59e0b'
                        : row.role === 'HEAD_COACH'
                        ? '#3b82f6'
                        : '#6366f1',
                    borderColor:
                      row.role === 'ADMIN'
                        ? '#f59e0b40'
                        : row.role === 'HEAD_COACH'
                        ? '#3b82f640'
                        : '#6366f140',
                  }}
                >
                  {row.role}
                </span>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {row.assignedTeams.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[120px]"
                    >
                      {t}
                    </span>
                  ))}
                  {row.assignedTeams.length > 2 && (
                    <span className="text-[11px] text-slate-500 self-center">
                      +{row.assignedTeams.length - 2}
                    </span>
                  )}
                </div>
              </Td>
              <Td className="text-slate-400 font-semibold">{row.scheduledSessionsCount}</Td>
              <Td>
                <span className="text-emerald-400 font-bold">{row.conductedSessionsCount}</span>
              </Td>
              <Td>
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {row.totalAttendanceRecordsLogged}
                </span>
              </Td>
              <Td>
                <div className="space-y-1.5 min-w-[90px]">
                  <RateBadge rate={row.avgTeamAttendanceRate} />
                  <MiniBar
                    value={row.avgTeamAttendanceRate}
                    color={rateColor(row.avgTeamAttendanceRate)}
                  />
                </div>
              </Td>
              <Td className="text-slate-400 text-xs font-mono">{row.lastActiveDate || '—'}</Td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center text-slate-500 text-sm">
                {ar ? 'لا يوجد مدربون مسجلون' : 'No coaches found'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
};