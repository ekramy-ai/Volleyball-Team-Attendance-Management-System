import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BellRing,
  AlertTriangle,
  Clock,
  UserX,
  Users,
  CalendarX,
  ShieldCheck,
  Filter,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Settings,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
  Check,
  X,
  Layers,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { 
  AlertRecord, 
  AlertType, 
  AlertSeverity, 
  AlertStatus, 
  AlertThresholdsConfig, 
  AlertStats 
} from '../../types/database';

export const SmartAlertsView: React.FC = () => {
  const { language, isRtl, currentUser } = useApp();
  const ar = language === 'ar';

  // Data state
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [thresholds, setThresholds] = useState<AlertThresholdsConfig>({
    maxAbsences: 3,
    absenceWindowDays: 30,
    maxLateness: 3,
    latenessWindowDays: 30,
    minTeamAttendancePct: 75
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Filter state
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editable threshold form
  const [editThresholds, setEditThresholds] = useState<AlertThresholdsConfig>(thresholds);

  // Fetch alerts and thresholds
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const email = currentUser?.userEmail || 'admin@volleyball.club';
      const res = await fetch('/api/alerts', {
        headers: { 'x-admin-email': email, 'x-user-email': email }
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
        setStats(data.stats || null);
        if (data.thresholds) {
          setThresholds(data.thresholds);
          setEditThresholds(data.thresholds);
        }
        setLastGenerated(new Date());
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate alerts engine
  const handleGenerateAlerts = async () => {
    try {
      setGenerating(true);
      setFeedbackMessage(null);
      const email = currentUser?.userEmail || 'admin@volleyball.club';
      const res = await fetch('/api/alerts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-user-email': email
        },
        body: JSON.stringify({ userEmail: email })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          text: ar
            ? `تم فحص المنظومة بنجاح: تم إنشاء ${data.newAlerts} تنبيه جديد، وتحديث ${data.updatedAlerts} تنبيه قائم.`
            : `Scan complete: ${data.newAlerts} new alerts, ${data.updatedAlerts} updated, ${data.skippedDuplicates} duplicates filtered.`,
          type: 'success'
        });
        await loadData();
      } else {
        setFeedbackMessage({
          text: data.error || (ar ? 'حدث خطأ أثناء فحص التنبيهات' : 'Failed to generate alerts'),
          type: 'error'
        });
      }
    } catch (err) {
      setFeedbackMessage({
        text: ar ? 'تعذر الاتصال بالخادم' : 'Server connection failed',
        type: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Update thresholds in SYSTEM_SETTINGS
  const handleSaveThresholds = async () => {
    try {
      setSavingThresholds(true);
      setFeedbackMessage(null);
      const email = currentUser?.userEmail || 'admin@volleyball.club';
      const res = await fetch('/api/alerts/thresholds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-user-email': email
        },
        body: JSON.stringify(editThresholds)
      });
      const data = await res.json();
      if (data.success) {
        setThresholds(data.thresholds);
        setFeedbackMessage({
          text: ar
            ? 'تم حفظ حدود التنبيهات في SYSTEM_SETTINGS بنجاح وتوثيق العملية في سجل الأمان.'
            : 'Alert thresholds updated in SYSTEM_SETTINGS and logged to audit trail.',
          type: 'success'
        });
        setShowConfigPanel(false);
        // Automatically re-run evaluation
        handleGenerateAlerts();
      } else {
        setFeedbackMessage({
          text: data.error || (ar ? 'فشل حفظ الإعدادات' : 'Failed to save settings'),
          type: 'error'
        });
      }
    } catch (err) {
      setFeedbackMessage({
        text: ar ? 'تعذر حفظ الإعدادات' : 'Error saving settings',
        type: 'error'
      });
    } finally {
      setSavingThresholds(false);
    }
  };

  // Update single alert status (RESOLVED / DISMISSED)
  const handleUpdateStatus = async (alertId: string, newStatus: 'RESOLVED' | 'DISMISSED') => {
    try {
      const email = currentUser?.userEmail || 'admin@volleyball.club';
      const res = await fetch(`/api/alerts/${encodeURIComponent(alertId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-user-email': email
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(prev => prev.map(a => a.AlertID === alertId ? { ...a, Status: newStatus } : a));
        // Refresh stats
        fetch('/api/alerts/stats')
          .then(r => r.json())
          .then(d => { if (d.success) setStats(d.stats); });
      }
    } catch (err) {
      console.error('Error updating alert status:', err);
    }
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (selectedStatus !== 'ALL' && alert.Status !== selectedStatus) return false;
      if (selectedType !== 'ALL' && alert.AlertType !== selectedType) return false;
      if (selectedSeverity !== 'ALL' && alert.Severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = alert.Title.toLowerCase().includes(q);
        const matchDetails = alert.Details.toLowerCase().includes(q);
        const matchEntity = alert.RelatedEntityName.toLowerCase().includes(q);
        const matchId = alert.RelatedEntityId.toLowerCase().includes(q);
        const matchTeam = alert.TeamContext ? alert.TeamContext.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchDetails && !matchEntity && !matchId && !matchTeam) return false;
      }
      return true;
    });
  }, [alerts, selectedStatus, selectedType, selectedSeverity, searchQuery]);

  // Helpers for alert type styling
  const getTypeMeta = (type: AlertType) => {
    switch (type) {
      case 'PLAYER_ABSENCE':
        return {
          label: ar ? 'غياب متكرر للاعب' : 'Player Absence Alert',
          icon: <UserX className="w-4 h-4 text-rose-500" />,
          bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
          textColor: 'text-rose-600 dark:text-rose-400',
          borderColor: 'border-rose-500/30'
        };
      case 'PLAYER_LATENESS':
        return {
          label: ar ? 'تأخير متكرر للاعب' : 'Player Lateness Alert',
          icon: <Clock className="w-4 h-4 text-amber-500" />,
          bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
          textColor: 'text-amber-600 dark:text-amber-400',
          borderColor: 'border-amber-500/30'
        };
      case 'TEAM_LOW_ATTENDANCE':
        return {
          label: ar ? 'انخفاض حضور الفريق' : 'Team Attendance Alert',
          icon: <TrendingDown className="w-4 h-4 text-orange-500" />,
          bgColor: 'bg-orange-500/10 dark:bg-orange-500/20',
          textColor: 'text-orange-600 dark:text-orange-400',
          borderColor: 'border-orange-500/30'
        };
      case 'MISSING_ATTENDANCE':
        return {
          label: ar ? 'حصة تدريبية غير مسجلة' : 'Missing Session Attendance',
          icon: <CalendarX className="w-4 h-4 text-blue-500" />,
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-500/30'
        };
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            {ar ? 'أولوية قصوى' : 'High Severity'}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            {ar ? 'أولوية متوسطة' : 'Medium Severity'}
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Info className="w-3 h-3" />
            {ar ? 'تنبيه عادي' : 'Low Severity'}
          </span>
        );
    }
  };

  if (loading && alerts.length === 0) {
    return <LoadingState type="skeleton" rows={6} />;
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── HERO BANNER ───────────────────────────────────────────── */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/60"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        <div 
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.25) 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} 
        />
        <div 
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)', transform: 'translate(-30%, 40%)' }} 
        />
        <div 
          className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none"
          style={{ fontSize: '130px', lineHeight: 1, opacity: 0.03 }}
        >
          🚨
        </div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black"
                style={{ background: 'rgba(244,63,94,0.2)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.35)' }}
              >
                <BellRing className="w-3.5 h-3.5" />
                {ar ? 'نظام التنبيهات الذكي' : 'Smart Alert System'}
              </span>
              <span 
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}
              >
                <ShieldCheck className="w-3 h-3" />
                {ar ? 'صلاحيات الإدارة فقط' : 'Admin Controlled'}
              </span>
              {stats && stats.active > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                  {stats.active} {ar ? 'تنبيه نشط يتطلب متابعة' : 'Active Alerts'}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                {ar ? 'منظومة التنبيهات الذكية للحضور والانضباط' : 'Smart Attendance & Discipline Alerts'}
              </h1>
              <p className="text-xs mt-1.5 leading-relaxed text-slate-300">
                {ar 
                  ? 'رصد آلي وفوري لتجاوزات الغياب والتأخير للاعبين، انخفاض نسب الحضور للفرق عن المعدلات المستهدفة، وتحديد الحصص غير المسجلة مع منع التكرار.'
                  : 'Automated monitoring of player absences and lateness, team attendance drops, and missing training sessions with deduplication.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button 
                onClick={handleGenerateAlerts} 
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-md shadow-rose-500/25 active:scale-95 transition-all disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                {generating ? (ar ? 'جاري الفحص والتوليد...' : 'Scanning...') : (ar ? 'فحص وتوليد التنبيهات الآن' : 'Run Alert Evaluation')}
              </button>

              <button 
                onClick={() => setShowConfigPanel(prev => !prev)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>{ar ? 'إعدادات الحدود والتخصيص' : 'Configure Thresholds'}</span>
                {showConfigPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {lastGenerated && (
                <span className="text-[11px] font-mono text-slate-400">
                  {ar ? 'آخر فحص: ' : 'Last evaluated: '}{lastGenerated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Quick Active Badges */}
          {stats && (
            <div className="grid grid-cols-2 gap-2.5 md:min-w-[220px]">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center shadow-sm">
                <div className="text-2xl font-black text-rose-400">{stats.byType.PLAYER_ABSENCE}</div>
                <div className="text-[10px] font-semibold text-slate-300 mt-0.5">{ar ? 'غياب اللاعبين' : 'Player Absences'}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center shadow-sm">
                <div className="text-2xl font-black text-amber-400">{stats.byType.PLAYER_LATENESS}</div>
                <div className="text-[10px] font-semibold text-slate-300 mt-0.5">{ar ? 'تأخير اللاعبين' : 'Player Lateness'}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center shadow-sm">
                <div className="text-2xl font-black text-orange-400">{stats.byType.TEAM_LOW_ATTENDANCE}</div>
                <div className="text-[10px] font-semibold text-slate-300 mt-0.5">{ar ? 'حضور الفرق' : 'Team Drops'}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center shadow-sm">
                <div className="text-2xl font-black text-sky-400">{stats.byType.MISSING_ATTENDANCE}</div>
                <div className="text-[10px] font-semibold text-slate-300 mt-0.5">{ar ? 'حصص فارغة' : 'Missing Sessions'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FEEDBACK NOTIFICATION ──────────────────────────────────── */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── CONFIGURATION PANEL (SYSTEM_SETTINGS) ───────────────────── */}
      {showConfigPanel && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 p-6 shadow-lg space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {ar ? 'تخصيص حدود ومعايير إطلاق التنبيهات (SYSTEM_SETTINGS)' : 'Configurable Alert Thresholds (SYSTEM_SETTINGS)'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {ar 
                    ? 'يتم تخزين هذه الإعدادات رسمياً في جدول SYSTEM_SETTINGS وتطبيقها على محرك الفحص الذكي.'
                    : 'These thresholds are saved into SYSTEM_SETTINGS and govern the rule engine.'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              SYSTEM_SETTINGS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rule 1: Absences */}
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 space-y-3">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                  {ar ? 'معيار غياب اللاعبين' : 'Player Absence Rule'}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {ar ? 'الحد الأقصى للغيابات (مرات)' : 'Max Absences Count'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={editThresholds.maxAbsences}
                    onChange={e => setEditThresholds(prev => ({ ...prev, maxAbsences: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {ar ? 'خلال نافذة زمنية (بالأيام)' : 'Within Window (Days)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={editThresholds.absenceWindowDays}
                    onChange={e => setEditThresholds(prev => ({ ...prev, absenceWindowDays: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {ar ? `الافتراضي: 3 غيابات خلال 30 يوم.` : `Default: 3 absences within 30 days.`}
              </p>
            </div>

            {/* Rule 2: Lateness */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                  {ar ? 'معيار تأخير اللاعبين' : 'Player Lateness Rule'}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {ar ? 'الحد الأقصى لمرات التأخير' : 'Max Late Count'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={editThresholds.maxLateness}
                    onChange={e => setEditThresholds(prev => ({ ...prev, maxLateness: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {ar ? 'خلال نافذة زمنية (بالأيام)' : 'Within Window (Days)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={editThresholds.latenessWindowDays}
                    onChange={e => setEditThresholds(prev => ({ ...prev, latenessWindowDays: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/30 outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {ar ? `الافتراضي: 3 مرات تأخير خلال 30 يوم.` : `Default: 3 late arrivals within 30 days.`}
              </p>
            </div>

            {/* Rule 3: Team Attendance */}
            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/30 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black text-orange-700 dark:text-orange-400">
                  {ar ? 'معيار تراجع حضور الفريق' : 'Team Attendance Rule'}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {ar ? 'الحد الأدنى لنسبة الحضور (%)' : 'Min Team Attendance Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editThresholds.minTeamAttendancePct}
                    onChange={e => setEditThresholds(prev => ({ ...prev, minTeamAttendancePct: parseFloat(e.target.value) || 1 }))}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/30 outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {ar ? `الافتراضي: أقل من 75% يُطلق تنبيهاً فورياً.` : `Default: Drops below 75% triggers alert.`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setEditThresholds(thresholds);
                setShowConfigPanel(false);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition"
            >
              {ar ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSaveThresholds}
              disabled={savingThresholds}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20 active:scale-95 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {savingThresholds ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'حفظ الحدود في SYSTEM_SETTINGS' : 'Save to SYSTEM_SETTINGS')}
            </button>
          </div>
        </div>
      )}

      {/* ── KPI METRICS CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">{ar ? 'إجمالي التنبيهات' : 'Total Alerts'}</span>
            <BellRing className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats?.total ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats?.active ?? 0} {ar ? 'نشطة حالياً' : 'active'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{ar ? 'غياب اللاعبين' : 'Player Absences'}</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats?.byType.PLAYER_ABSENCE ?? 0}</div>
          <div className="text-[10px] text-rose-600/70 font-semibold mt-0.5">{ar ? `≥ ${thresholds.maxAbsences} غيابات` : `≥ ${thresholds.maxAbsences} absences`}</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{ar ? 'تأخير متكرر' : 'Player Lateness'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats?.byType.PLAYER_LATENESS ?? 0}</div>
          <div className="text-[10px] text-amber-600/70 font-semibold mt-0.5">{ar ? `≥ ${thresholds.maxLateness} مرات` : `≥ ${thresholds.maxLateness} times`}</div>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">{ar ? 'حضور الفرق' : 'Team Low Rate'}</span>
            <TrendingDown className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats?.byType.TEAM_LOW_ATTENDANCE ?? 0}</div>
          <div className="text-[10px] text-orange-600/70 font-semibold mt-0.5">{ar ? `< ${thresholds.minTeamAttendancePct}%` : `< ${thresholds.minTeamAttendancePct}%`}</div>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">{ar ? 'حصص غير مسجلة' : 'Missing Sessions'}</span>
            <CalendarX className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">{stats?.byType.MISSING_ATTENDANCE ?? 0}</div>
          <div className="text-[10px] text-sky-600/70 font-semibold mt-0.5">{ar ? 'بدون أي سجلات' : '0 records'}</div>
        </div>
      </div>

      {/* ── FILTERS & SEARCH BAR ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'ACTIVE', label: ar ? 'النشطة' : 'Active', count: stats?.active },
              { id: 'RESOLVED', label: ar ? 'تمت معالجتها' : 'Resolved', count: stats?.resolved },
              { id: 'DISMISSED', label: ar ? 'المستبعدة' : 'Dismissed', count: stats?.dismissed },
              { id: 'ALL', label: ar ? 'الكل' : 'All', count: stats?.total }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  selectedStatus === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    tab.id === 'ACTIVE' && selectedStatus === 'ACTIVE'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={ar ? 'بحث بالاسم، الفريق، أو الكود...' : 'Search alerts...'}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition"
            />
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>{ar ? 'تصفية النوع:' : 'Type:'}</span>
          </div>

          {[
            { id: 'ALL', label: ar ? 'الكل' : 'All' },
            { id: 'PLAYER_ABSENCE', label: ar ? 'غياب اللاعبين' : 'Absences' },
            { id: 'PLAYER_LATENESS', label: ar ? 'تأخير اللاعبين' : 'Lateness' },
            { id: 'TEAM_LOW_ATTENDANCE', label: ar ? 'حضور الفرق' : 'Team Attendance' },
            { id: 'MISSING_ATTENDANCE', label: ar ? 'حصص غير مسجلة' : 'Missing Sessions' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                selectedType === t.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="border-s border-slate-200 dark:border-slate-700 h-4 mx-1" />

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <span>{ar ? 'الأولوية:' : 'Severity:'}</span>
          </div>

          {[
            { id: 'ALL', label: ar ? 'الكل' : 'All' },
            { id: 'HIGH', label: ar ? 'قصوى' : 'High' },
            { id: 'MEDIUM', label: ar ? 'متوسطة' : 'Medium' },
            { id: 'LOW', label: ar ? 'عادية' : 'Low' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSeverity(s.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                selectedSeverity === s.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}

          {(selectedType !== 'ALL' || selectedSeverity !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('ALL');
                setSelectedSeverity('ALL');
                setSearchQuery('');
              }}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline ms-auto flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              {ar ? 'إلغاء الفلاتر' : 'Clear Filters'}
            </button>
          )}
        </div>
      </div>

      {/* ── ALERTS LIST ───────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                {ar ? 'لا توجد تنبيهات تطابق المعايير المحددة' : 'No alerts match the selected criteria'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {ar 
                  ? 'المنظومة في حالة ممتازة، أو يمكنك الضغط على زر "فحص وتوليد التنبيهات" لإعادة تقييم السجلات فورياً.'
                  : 'Everything looks healthy, or click "Run Alert Evaluation" to re-scan live attendance records.'}
              </p>
            </div>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const meta = getTypeMeta(alert.AlertType);
            const isResolved = alert.Status === 'RESOLVED';
            const isDismissed = alert.Status === 'DISMISSED';

            return (
              <div
                key={alert.AlertID}
                className={`p-5 rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                  isResolved
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : isDismissed
                    ? 'bg-slate-50/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  {/* Alert Icon & Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${meta.bgColor} ${meta.borderColor}`}>
                      {meta.icon}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${meta.bgColor} ${meta.textColor} ${meta.borderColor}`}>
                          {meta.label}
                        </span>

                        {getSeverityBadge(alert.Severity)}

                        {alert.TeamContext && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Users className="w-3 h-3 text-slate-400" />
                            {alert.TeamContext}
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-slate-400 ms-auto">
                          {alert.AlertID}
                        </span>
                      </div>

                      {/* Title & Details */}
                      <div>
                        <h4 className={`text-sm font-black text-slate-900 dark:text-slate-100 ${isResolved || isDismissed ? 'line-through opacity-70' : ''}`}>
                          {alert.Title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {alert.Details}
                        </p>
                      </div>

                      {/* Meta pills */}
                      {alert.MetaData && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {alert.MetaData.absenceCount !== undefined && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                              {ar ? `الغيابات: ${alert.MetaData.absenceCount} / الحد: ${alert.MetaData.threshold}` : `Absences: ${alert.MetaData.absenceCount} (Limit: ${alert.MetaData.threshold})`}
                            </span>
                          )}
                          {alert.MetaData.lateCount !== undefined && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              {ar ? `التأخير: ${alert.MetaData.lateCount} / الحد: ${alert.MetaData.threshold}` : `Late: ${alert.MetaData.lateCount} (Limit: ${alert.MetaData.threshold})`}
                            </span>
                          )}
                          {alert.MetaData.attendanceRate !== undefined && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                              {ar ? `نسبة الحضور: ${alert.MetaData.attendanceRate}% / المستهدف: ${alert.MetaData.threshold}%` : `Rate: ${alert.MetaData.attendanceRate}% (Target: ${alert.MetaData.threshold}%)`}
                            </span>
                          )}
                          {alert.MetaData.timeRange && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                              {alert.MetaData.timeRange}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ar ? 'تاريخ التوليد: ' : 'Generated: '}{new Date(alert.DateGenerated).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    {alert.Status === 'ACTIVE' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(alert.AlertID, 'RESOLVED')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95"
                          title={ar ? 'تحديد كـ تمت المعالجة' : 'Mark Resolved'}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{ar ? 'تمت المعالجة' : 'Resolve'}</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(alert.AlertID, 'DISMISSED')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                          title={ar ? 'استبعاد التنبيه' : 'Dismiss Alert'}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{ar ? 'استبعاد' : 'Dismiss'}</span>
                        </button>
                      </>
                    ) : isResolved ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {ar ? 'معالج' : 'Resolved'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <XCircle className="w-3.5 h-3.5" />
                        {ar ? 'مستبعد' : 'Dismissed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
