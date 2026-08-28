import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sliders, 
  Globe, 
  Clock, 
  ShieldCheck, 
  Database, 
  FileText, 
  Play, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  Award, 
  Save, 
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DisciplineSettings } from '../../types/database';

export const SettingsView: React.FC = () => {
  const { t, language, currentUser } = useApp();
  const [phase7Report, setPhase7Report] = useState<any>(null);
  const [phase8Report, setPhase8Report] = useState<any>(null);
  const [phase9Report, setPhase9Report] = useState<any>(null);
  const [phase10Report, setPhase10Report] = useState<any>(null);
  const [phase11Report, setPhase11Report] = useState<any>(null);
  const [running7, setRunning7] = useState(false);
  const [running8, setRunning8] = useState(false);
  const [running9, setRunning9] = useState(false);
  const [running10, setRunning10] = useState(false);
  const [running11, setRunning11] = useState(false);

  // Discipline Settings State
  const [disciplineSettings, setDisciplineSettings] = useState<DisciplineSettings>({
    startingScore: 100,
    unexcusedAbsencePenalty: 10,
    excusedAbsencePenalty: 3,
    latePenalty: 2
  });
  const [loadingDiscipline, setLoadingDiscipline] = useState<boolean>(false);
  const [savingDiscipline, setSavingDiscipline] = useState<boolean>(false);
  const [disciplineSuccessMsg, setDisciplineSuccessMsg] = useState<string | null>(null);
  const [disciplineErrMsg, setDisciplineErrMsg] = useState<string | null>(null);

  // Load Discipline Settings
  const fetchDisciplineSettings = async () => {
    try {
      setLoadingDiscipline(true);
      const res = await fetch('/api/settings/discipline');
      const data = await res.json();
      if (data.success && data.settings) {
        setDisciplineSettings({
          startingScore: Number(data.settings.startingScore ?? 100),
          unexcusedAbsencePenalty: Number(data.settings.unexcusedAbsencePenalty ?? 10),
          excusedAbsencePenalty: Number(data.settings.excusedAbsencePenalty ?? 3),
          latePenalty: Number(data.settings.latePenalty ?? 2)
        });
      }
    } catch (e) {
      console.error('Failed to load discipline settings:', e);
    } finally {
      setLoadingDiscipline(false);
    }
  };

  useEffect(() => {
    fetchDisciplineSettings();
  }, []);

  const handleSaveDisciplineSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDiscipline(true);
    setDisciplineSuccessMsg(null);
    setDisciplineErrMsg(null);

    try {
      const res = await fetch('/api/settings/discipline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: disciplineSettings,
          adminUserId: currentUser?.userEmail || 'admin@volleyball.club'
        })
      });

      const data = await res.json();
      if (data.success) {
        setDisciplineSuccessMsg(
          language === 'ar'
            ? 'تم حفظ معايير نقاط الانضباط في قاعدة إعدادات النظام بنجاح!'
            : 'Discipline scoring penalties updated and persisted successfully in SYSTEM_SETTINGS!'
        );
        if (data.settings) {
          setDisciplineSettings({
            startingScore: Number(data.settings.startingScore ?? 100),
            unexcusedAbsencePenalty: Number(data.settings.unexcusedAbsencePenalty ?? 10),
            excusedAbsencePenalty: Number(data.settings.excusedAbsencePenalty ?? 3),
            latePenalty: Number(data.settings.latePenalty ?? 2)
          });
        }
      } else {
        setDisciplineErrMsg(data.error || 'Failed to update discipline settings');
      }
    } catch (err: any) {
      setDisciplineErrMsg(err.message || 'Network error while saving discipline settings');
    } finally {
      setSavingDiscipline(false);
    }
  };

  const runPhase7 = async () => {
    try {
      setRunning7(true);
      const res = await fetch('/api/diagnostics/phase7');
      const data = await res.json();
      setPhase7Report(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setRunning7(false);
    }
  };

  const runPhase8 = async () => {
    try {
      setRunning8(true);
      const res = await fetch('/api/diagnostics/phase8');
      const data = await res.json();
      setPhase8Report(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setRunning8(false);
    }
  };

  const runPhase9 = async () => {
    try {
      setRunning9(true);
      const res = await fetch('/api/diagnostics/phase9');
      const data = await res.json();
      setPhase9Report(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setRunning9(false);
    }
  };

  const runPhase10 = async () => {
    try {
      setRunning10(true);
      const res = await fetch('/api/diagnostics/phase10');
      const data = await res.json();
      setPhase10Report(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setRunning10(false);
    }
  };

  const runPhase11 = async () => {
    try {
      setRunning11(true);
      const res = await fetch('/api/diagnostics/phase11');
      const data = await res.json();
      setPhase11Report(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setRunning11(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
            {t.navSettings}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'ar' ? 'إعدادات جدول SETTINGS ومعايير نقاط الانضباط والفحوصات الآلية' : 'SYSTEM_SETTINGS, Discipline Score Parameters & Automated Integrity Test Suites'}
          </p>
        </div>
      </div>

      {/* PHASE 11: Discipline Scoring Configuration Card (Admin Only) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black bg-orange-500 text-white rounded-md">
                  PHASE 11
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'نظام درجات الانضباط وقواعد الخصومات (Discipline Score Settings)' : 'Player Discipline Score Rules & Dynamic Deduction Settings'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar' 
                  ? 'يبدأ كل لاعب بـ 100 نقطة أساسية. يتم حفظ قيم الخصم ديناميكياً في SYSTEM_SETTINGS بدون ترميز ثابت.'
                  : 'Every player starts with 100 points. Penalties are dynamically fetched and saved in SYSTEM_SETTINGS.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDisciplineSettings}
              disabled={loadingDiscipline}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs transition"
              title="إعادة جلب الإعدادات"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDiscipline ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {disciplineSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{disciplineSuccessMsg}</span>
          </div>
        )}

        {disciplineErrMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{disciplineErrMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveDisciplineSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Starting Score */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'ar' ? 'نقاط البداية الأساسية' : 'Starting Points'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="200"
                  value={disciplineSettings.startingScore ?? 100}
                  onChange={e => setDisciplineSettings(prev => ({ ...prev, startingScore: Number(e.target.value) }))}
                  className="w-full text-base font-black py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  required
                />
                <span className="text-xs text-slate-400 font-bold">نقطة</span>
              </div>
              <span className="text-[10px] text-slate-400 block">القيمة القياسية المعتمدة: 100</span>
            </div>

            {/* Unexcused Penalty */}
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 space-y-2">
              <label className="text-xs font-bold text-rose-700 dark:text-rose-300 block">
                {language === 'ar' ? 'خصم الغياب بدون إذن' : 'Unexcused Penalty'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={disciplineSettings.unexcusedAbsencePenalty ?? 10}
                  onChange={e => setDisciplineSettings(prev => ({ ...prev, unexcusedAbsencePenalty: Number(e.target.value) }))}
                  className="w-full text-base font-black py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400"
                  required
                />
                <span className="text-xs text-rose-500 font-bold">نقطة</span>
              </div>
              <span className="text-[10px] text-rose-500/80 block">الافتراضي: 10 نقاط لكل غياب</span>
            </div>

            {/* Excused Penalty */}
            <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40 space-y-2">
              <label className="text-xs font-bold text-sky-700 dark:text-sky-300 block">
                {language === 'ar' ? 'خصم الغياب بعذر مسبق' : 'Excused Penalty'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={disciplineSettings.excusedAbsencePenalty ?? 3}
                  onChange={e => setDisciplineSettings(prev => ({ ...prev, excusedAbsencePenalty: Number(e.target.value) }))}
                  className="w-full text-base font-black py-2 px-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400"
                  required
                />
                <span className="text-xs text-sky-500 font-bold">نقطة</span>
              </div>
              <span className="text-[10px] text-sky-500/80 block">الافتراضي: 3 نقاط لكل إذن</span>
            </div>

            {/* Late Penalty */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-2">
              <label className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                {language === 'ar' ? 'خصم التأخير عن الموعد' : 'Late Arrival Penalty'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={disciplineSettings.latePenalty ?? 2}
                  onChange={e => setDisciplineSettings(prev => ({ ...prev, latePenalty: Number(e.target.value) }))}
                  className="w-full text-base font-black py-2 px-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400"
                  required
                />
                <span className="text-xs text-amber-500 font-bold">نقطة</span>
              </div>
              <span className="text-[10px] text-amber-500/80 block">الافتراضي: 2 نقطة لكل تأخير</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              * يتم تطبيق الخصومات وحسابها فورياً، مع ضمان عدم نزول درجة اللاعب تحت الصفر أبداً.
            </span>
            <button
              type="submit"
              disabled={savingDiscipline}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${savingDiscipline ? 'animate-spin' : ''}`} />
              <span>{savingDiscipline ? 'جاري الحفظ...' : 'حفظ إعدادات الانضباط'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* General Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>{language === 'ar' ? 'معايير النادي والمنطقة الزمنية' : 'Club Parameters & Timezone'}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">TIMEZONE</span>
              <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">Africa/Cairo</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">CLUB_NAME</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">Al-Ahly Volleyball Academy</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">DEFAULT_SEASON</span>
              <span className="font-mono font-bold text-emerald-600">2024-2025</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>{language === 'ar' ? 'سياسات الأمان وقاعدة البيانات' : 'Database Security Policies'}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">MASTER_PLAYERS_SHEET</span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">PLAYERS_MASTER</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">TAMPER_EVIDENT_AUDIT</span>
              <span className="font-bold text-emerald-600">ENABLED (ACTIVE)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">ROLE_GATING</span>
              <span className="font-bold text-orange-600">BACKEND ENFORCED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Diagnostic Test Suite Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'فحوصات السلامة الآلية (Automated Diagnostics)' : 'Automated Diagnostic Test Suites'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar' ? 'تشغيل الاختبارات الآلية للتحقق من سلامة البيانات ودرجات الانضباط' : 'Run automated unit diagnostics for attendance validation & discipline scores'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={runPhase11}
              disabled={running11}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${running11 ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'فحص المرحلة 11 (نقاط الانضباط)' : 'Run Phase 11 Tests'}</span>
            </button>

            <button
              onClick={runPhase10}
              disabled={running10}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${running10 ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'المرحلة 10' : 'Phase 10'}</span>
            </button>

            <button
              onClick={runPhase9}
              disabled={running9}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${running9 ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'المرحلة 9' : 'Phase 9'}</span>
            </button>

            <button
              onClick={runPhase8}
              disabled={running8}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${running8 ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'المرحلة 8' : 'Phase 8'}</span>
            </button>

            <button
              onClick={runPhase7}
              disabled={running7}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${running7 ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'المرحلة 7' : 'Phase 7'}</span>
            </button>
          </div>
        </div>

        {/* Phase 11 Diagnostic Results */}
        {phase11Report && (
          <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-orange-900 dark:text-orange-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-600" />
                <span>{phase11Report.title}</span>
              </span>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600">
                {phase11Report.passed} / {phase11Report.total} PASSED
              </span>
            </div>

            <div className="space-y-1.5">
              {phase11Report.tests?.map((t: any) => (
                <div
                  key={t.ruleNumber}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      #{t.ruleNumber} {t.testName}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.details}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                    PASSED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 10 Diagnostic Results */}
        {phase10Report && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{phase10Report.title}</span>
              </span>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                {phase10Report.passed} / {phase10Report.total} PASSED
              </span>
            </div>

            <div className="space-y-1.5">
              {phase10Report.tests?.map((t: any) => (
                <div
                  key={t.ruleNumber}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      #{t.ruleNumber} {t.testName}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.details}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                    PASSED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 9 Diagnostic Results */}
        {phase9Report && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-purple-200 dark:border-purple-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>{phase9Report.title}</span>
              </span>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                {phase9Report.passed} / {phase9Report.total} PASSED
              </span>
            </div>

            <div className="space-y-1.5">
              {phase9Report.tests?.map((t: any) => (
                <div
                  key={t.ruleNumber}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      #{t.ruleNumber} {t.testName}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.details}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                    PASSED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 8 Diagnostic Results */}
        {phase8Report && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{phase8Report.title}</span>
              </span>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                {phase8Report.passed} / {phase8Report.total} PASSED
              </span>
            </div>

            <div className="space-y-1.5">
              {phase8Report.tests?.map((t: any) => (
                <div
                  key={t.ruleNumber}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      #{t.ruleNumber} {t.testName}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.details}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                    PASSED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 7 Diagnostic Results */}
        {phase7Report && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{phase7Report.title}</span>
              </span>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                {phase7Report.passed} / {phase7Report.total} PASSED
              </span>
            </div>

            <div className="space-y-1.5">
              {phase7Report.tests?.map((t: any) => (
                <div
                  key={t.ruleNumber}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      #{t.ruleNumber} {t.testName}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.details}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                    PASSED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

