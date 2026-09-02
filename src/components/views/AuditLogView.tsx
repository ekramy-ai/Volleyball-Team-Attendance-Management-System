import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Activity,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  User,
  Users,
  Layers,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  ChevronDown,
  Eye,
  X,
  FileText,
  KeyRound,
  Sliders,
  Database,
  CalendarDays
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { AuditLogRecord } from '../../types/database';

export const AuditLogView: React.FC = () => {
  const { language, isRtl, currentUser } = useApp();
  const ar = language === 'ar';

  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [stats, setStats] = useState<{
    totalEvents: number;
    securityAlertsCount: number;
    attendanceActionsCount: number;
    systemConfigChangesCount: number;
    actionBreakdown: Record<string, number>;
    roleBreakdown: Record<string, number>;
    recentSecurityEvents: AuditLogRecord[];
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedActionCategory, setSelectedActionCategory] = useState<string>('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [quickDatePreset, setQuickDatePreset] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Log for Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Fetch Audit Logs and Stats
  const loadAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const email = currentUser?.userEmail || 'admin@volleyball.club';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedRole !== 'ALL') params.append('role', selectedRole);
      if (selectedEntityType !== 'ALL') params.append('entityType', selectedEntityType);
      if (selectedActionCategory !== 'ALL') params.append('action', selectedActionCategory);
      if (searchQuery) params.append('search', searchQuery);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/audit-logs?${params.toString()}`, {
          headers: { 'x-admin-email': email }
        }),
        fetch('/api/audit-logs/stats', {
          headers: { 'x-admin-email': email }
        })
      ]);

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      if (!logsRes.ok || !logsData.success) {
        throw new Error(logsData.error || 'Failed to load audit logs.');
      }

      setLogs(logsData.logs || []);
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Error loading audit logs.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, startDate, endDate, selectedRole, selectedEntityType, selectedActionCategory, searchQuery]);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  // Quick Date Preset handler
  const handleQuickPreset = (preset: string) => {
    setQuickDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 6 ? 0 : -1);
      const start = new Date(now.setDate(diff));
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'LAST_30') {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    setSelectedActionCategory('ALL');
    setSelectedEntityType('ALL');
    setSelectedRole('ALL');
    setStartDate('');
    setEndDate('');
    setQuickDatePreset('ALL');
    setSearchQuery('');
  };

  // Action badge visual styles
  const getActionBadge = (action: string) => {
    const isDenied = action.includes('DENIED') || action.includes('BLOCKED') || action.includes('FAILED') || action.includes('ATTEMPT') || action.includes('CANCELLED');
    const isCreate = action.includes('CREATE') || action.includes('RECORDED') || action.includes('SYNCED') || action.includes('SUCCESS');
    const isUpdate = action.includes('UPDATE') || action.includes('MODIFIED') || action.includes('STATUS');

    if (isDenied) {
      return {
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        icon: <ShieldAlert className="w-3 h-3 text-rose-500" />
      };
    }
    if (isCreate) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: <ShieldCheck className="w-3 h-3 text-emerald-500" />
      };
    }
    if (isUpdate) {
      return {
        bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        icon: <Sliders className="w-3 h-3 text-purple-500" />
      };
    }
    return {
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: <Activity className="w-3 h-3 text-blue-500" />
    };
  };

  // CSV Export for Audit Logs
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const BOM = '\uFEFF';
    const lines: string[] = [];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    lines.push(`${escapeCSV('منظومة إدارة فرق الكرة الطائرة — سجل التدقيق والأمان')}`);
    lines.push(`${escapeCSV('تاريخ التصدير')},${escapeCSV(new Date().toLocaleString('ar-EG'))}`);
    lines.push(`${escapeCSV('إجمالي السجلات')},${logs.length}`);
    lines.push('');
    lines.push(`${escapeCSV('كود السجل')},${escapeCSV('التاريخ والوقت')},${escapeCSV('البريد الإلكتروني')},${escapeCSV('الدور')},${escapeCSV('نوع الحدث')},${escapeCSV('نطاق الكيان')},${escapeCSV('معرف الكيان')},${escapeCSV('التفاصيل الكاملة')}`);

    logs.forEach(l => {
      lines.push(`${escapeCSV(l.LogID)},${escapeCSV(l.Timestamp)},${escapeCSV(l.UserEmail)},${escapeCSV(l.UserRole)},${escapeCSV(l.Action)},${escapeCSV(l.EntityType)},${escapeCSV(l.EntityID)},${escapeCSV(l.Details)}`);
    });

    const blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    setExportFeedback(ar ? 'تم تصدير سجل التدقيق والأمان بصيغة CSV بنجاح.' : 'Audit logs exported to CSV.');
    setTimeout(() => setExportFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)' }}
                >
                  <Lock className="w-3.5 h-3.5" />
                  {ar ? 'سجل التدقيق والأمان المؤسسي' : 'Enterprise Security Audit Trail'}
                </span>
                <span 
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}
                >
                  <Shield className="w-3 h-3" />
                  {ar ? 'حماية مشددة ومقاومة للتلاعب' : 'Tamper-Evident Security Log'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                {ar ? 'سجل التدقيق والأمان الميداني' : 'Security & Audit Log Trail'}
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ar 
                  ? 'توثيق شامل وفوري لجميع محاولات الدخول، وتسجيل الحضور، وتعديلات الحصص والفرق والمدربين، وتتبع محاولات التلاعب الأمني.'
                  : 'Comprehensive tamper-evident logging of logins, attendance operations, coach/session modifications, and blocked security attempts.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
              <button
                onClick={loadAuditData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? (ar ? 'تحديث...' : 'Loading...') : (ar ? 'تحديث' : 'Refresh')}</span>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={loading || logs.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 active:scale-95 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{ar ? 'تصدير السجل (CSV)' : 'Export CSV'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Feedback notification */}
      {exportFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
          <button onClick={() => setExportFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Security KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Events */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">{ar ? 'إجمالي أحداث التدقيق' : 'Total Audit Events'}</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.totalEvents ?? logs.length}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">{ar ? 'سجل موثق في النظام' : 'Logged system events'}</p>
        </div>

        {/* Security Denials & Alerts */}
        <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{ar ? 'تنبيهات ومحاولات محظورة' : 'Security Denials & Blocks'}</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats?.securityAlertsCount ?? 0}
          </div>
          <p className="text-[10px] text-rose-500/80 font-medium">{ar ? 'تم التصدي لها وحظرها' : 'Blocked & audited attempts'}</p>
        </div>

        {/* Attendance Actions */}
        <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{ar ? 'عمليات تسجيل الحضور' : 'Attendance Operations'}</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats?.attendanceActionsCount ?? 0}
          </div>
          <p className="text-[10px] text-blue-500/80 font-medium">{ar ? 'تسجيلات وتعديلات الكشوف' : 'Attendance roster logs'}</p>
        </div>

        {/* System Settings & Config */}
        <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">{ar ? 'تعديلات النظام والإعدادات' : 'System & Config Changes'}</span>
            <Sliders className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {stats?.systemConfigChangesCount ?? 0}
          </div>
          <p className="text-[10px] text-purple-500/80 font-medium">{ar ? 'إعدادات وقواعد وتعيينات' : 'Config & assignment updates'}</p>
        </div>
      </div>

      {/* Multi-Criteria Filter Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Quick Date Presets */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: ar ? 'كافة الفترات' : 'All Time' },
              { id: 'TODAY', label: ar ? 'اليوم' : 'Today' },
              { id: 'THIS_WEEK', label: ar ? 'هذا الأسبوع' : 'This Week' },
              { id: 'THIS_MONTH', label: ar ? 'هذا الشهر' : 'This Month' },
              { id: 'LAST_30', label: ar ? 'آخر 30 يوم' : 'Last 30 Days' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => handleQuickPreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  quickDatePreset === preset.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            {ar ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
          </button>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Action Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">{ar ? 'نوع الحدث:' : 'Action Category:'}</label>
            <select
              value={selectedActionCategory}
              onChange={e => setSelectedActionCategory(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="ALL">{ar ? 'كافة الأحداث' : 'All Actions'}</option>
              <option value="AUTH_">{ar ? 'الأمان والدخول (AUTH)' : 'Security & Auth (AUTH)'}</option>
              <option value="ATTENDANCE_">{ar ? 'تسجيل وتعديل الحضور' : 'Attendance Operations'}</option>
              <option value="COACH_">{ar ? 'إدارة المدربين (COACH)' : 'Coach Operations'}</option>
              <option value="ASSIGNMENT_">{ar ? 'التعيينات والفرق' : 'Assignments'}</option>
              <option value="SESSION_">{ar ? 'الحصص التدريبية' : 'Training Sessions'}</option>
              <option value="SETTINGS">{ar ? 'إعدادات النظام واللائحة' : 'System Settings'}</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">{ar ? 'نطاق الكيان:' : 'Entity Type:'}</label>
            <select
              value={selectedEntityType}
              onChange={e => setSelectedEntityType(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="ALL">{ar ? 'كافة الكيانات' : 'All Entities'}</option>
              <option value="AUTHENTICATION">{ar ? 'المصادقة والأمان' : 'Authentication'}</option>
              <option value="TRAINING_SESSION">{ar ? 'الحصص التدريبية' : 'Training Session'}</option>
              <option value="ATTENDANCE">{ar ? 'سجلات الحضور' : 'Attendance'}</option>
              <option value="COACH">{ar ? 'المدربون' : 'Coaches'}</option>
              <option value="COACH_TEAM">{ar ? 'تعيينات الفرق' : 'Team Assignments'}</option>
              <option value="SYSTEM_SETTINGS">{ar ? 'إعدادات النظام' : 'System Settings'}</option>
              <option value="DATABASE">{ar ? 'قاعدة البيانات والمزامنة' : 'Database & Sync'}</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">{ar ? 'الدور والصلاحية:' : 'User Role:'}</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="ALL">{ar ? 'كافة الأدوار' : 'All Roles'}</option>
              <option value="ADMIN">ADMIN</option>
              <option value="HEAD_COACH">HEAD_COACH</option>
              <option value="ASSISTANT_COACH">ASSISTANT_COACH</option>
              <option value="UNREGISTERED">UNREGISTERED</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">{ar ? 'بحث فوري:' : 'Search:'}</label>
            <div className="relative">
              <input
                type="text"
                placeholder={ar ? 'بحث برمز السجل أو البريد أو التفاصيل...' : 'Search logs...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs font-bold p-2.5 ps-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingState message={ar ? 'جاري تحميل سجلات التدقيق والأمان...' : 'Loading audit logs...'} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs font-bold space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
            <div>{error}</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold">{ar ? 'لا توجد سجلات تدقيق مطابقة لمعايير البحث الحالية' : 'No audit records match the current filters'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black">
                  <th className="p-3.5 text-start">{ar ? 'رمز السجل' : 'Log ID'}</th>
                  <th className="p-3.5 text-start">{ar ? 'التوقيت' : 'Timestamp'}</th>
                  <th className="p-3.5 text-start">{ar ? 'المستخدم' : 'User Email'}</th>
                  <th className="p-3.5 text-start">{ar ? 'الدور' : 'Role'}</th>
                  <th className="p-3.5 text-start">{ar ? 'نوع الحدث' : 'Action'}</th>
                  <th className="p-3.5 text-start">{ar ? 'الكيان' : 'Entity'}</th>
                  <th className="p-3.5 text-start">{ar ? 'التفاصيل' : 'Details'}</th>
                  <th className="p-3.5 text-center">{ar ? 'الإجراء' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {logs.map((log) => {
                  const badge = getActionBadge(log.Action);
                  return (
                    <tr key={log.LogID} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      {/* Log ID */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-500 font-bold">
                        {log.LogID}
                      </td>

                      {/* Timestamp */}
                      <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.Timestamp).toLocaleString(ar ? 'ar-EG' : 'en-US')}
                      </td>

                      {/* User Email */}
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {log.UserEmail}
                      </td>

                      {/* Role Badge */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {log.UserRole}
                        </span>
                      </td>

                      {/* Action Badge */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${badge.bg}`}>
                          {badge.icon}
                          <span>{log.Action}</span>
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        <span className="font-bold">{log.EntityType}</span>
                        {log.EntityID && log.EntityID !== 'N/A' && (
                          <span className="text-slate-400 text-[10px] block font-mono">[{log.EntityID}]</span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={log.Details}>
                        {log.Details}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950/40 hover:text-purple-600 transition"
                          title={ar ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {ar ? 'تفاصيل سجل الأمان والتدقيق' : 'Audit Event Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{ar ? 'رمز السجل:' : 'Log ID:'}</span>
                  <span className="font-mono font-bold text-purple-600">{selectedLog.LogID}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{ar ? 'التوقيت الدقيق:' : 'Timestamp:'}</span>
                  <span className="font-mono">{new Date(selectedLog.Timestamp).toISOString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{ar ? 'المستخدم:' : 'User Email:'}</span>
                  <span className="font-bold">{selectedLog.UserEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">{ar ? 'الدور:' : 'Role:'}</span>
                  <span className="font-bold">{selectedLog.UserRole}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">{ar ? 'نوع الحدث والإجراء:' : 'Action & Domain:'}</span>
                  <span className="font-bold text-indigo-600">{selectedLog.EntityType}</span>
                </div>
                <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedLog.Action}</div>
                {selectedLog.EntityID && (
                  <div className="text-[11px] text-slate-500 font-mono">{ar ? 'معرف الكيان:' : 'Entity ID:'} {selectedLog.EntityID}</div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">{ar ? 'البيان التفصيلي للحدث:' : 'Detailed Description:'}</span>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                  {selectedLog.Details}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                {ar ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
