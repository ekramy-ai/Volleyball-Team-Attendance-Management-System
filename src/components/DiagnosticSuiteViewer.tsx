import React, { useState } from 'react';
import { Activity, Play, CheckCircle2, XCircle, ShieldCheck, Database, RefreshCw, AlertCircle, Layers, ShieldAlert, Users, Search, Terminal } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DiagnosticTestItem {
  ruleNumber?: number;
  testName: string;
  category: string;
  passed: boolean;
  errorCode?: string;
  details: string;
}

interface DiagnosticReport {
  phase?: number;
  title?: string;
  passed: number;
  failed: number;
  total: number;
  status: string;
  tests: DiagnosticTestItem[];
  timestamp: string;
}

export const DiagnosticSuiteViewer: React.FC = () => {
  const { t, isRtl } = useApp();
  const [activeTab, setActiveTab] = useState<'phase11_6' | 'phase1_2'>('phase11_6');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [report11_6, setReport11_6] = useState<DiagnosticReport | null>(null);
  const [report1_2, setReport1_2] = useState<DiagnosticReport | null>(null);
  const [debugData, setDebugData] = useState<any | null>(null);
  const [isDebugLoading, setIsDebugLoading] = useState<boolean>(false);

  const runPhase11_6Suite = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/diagnostics/phase11-6');
      const data = await res.json();
      if (data && data.tests) {
        setReport11_6(data);
      }
    } catch (err) {
      console.error('Failed to run Phase 11.6 diagnostics:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const runPhase1_2Suite = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/diagnostics/run');
      const data = await res.json();
      if (data.success && data.report) {
        setReport1_2(data.report);
      }
    } catch (err) {
      console.error('Failed to run Phase 1 & 2 diagnostics:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const fetchDebugInfo = async () => {
    setIsDebugLoading(true);
    try {
      const res = await fetch('/api/master/debug', {
        headers: { 'x-admin-email': 'admin@volleyball.club' }
      });
      const data = await res.json();
      if (data.success && data.debugInfo) {
        setDebugData(data.debugInfo);
      }
    } catch (err) {
      console.error('Failed to fetch master player debug info:', err);
    } finally {
      setIsDebugLoading(false);
    }
  };

  const activeReport = activeTab === 'phase11_6' ? report11_6 : report1_2;
  const allPassed = activeReport ? activeReport.failed === 0 && activeReport.passed > 0 : false;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'SPREADSHEET_CONNECTION':
      case 'DATABASE':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'STRUCTURE':
      case 'HEADER_DETECTION':
      case 'COLUMN_MAPPING':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'PRIMARY_KEY_LOOKUP':
      case 'DATA_LOADING':
      case 'INTEGRITY_CHECK':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'TEAM_FILTERING':
      case 'COACH_AUTHORIZATION':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'SECURITY_ISOLATION':
      case 'AUTH_ISOLATION':
      case 'AUTH_PENETRATION':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'MODULE_INTEGRATION':
      case 'ATTENDANCE_INTEGRITY':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-md uppercase tracking-wider">
                Phase 11.6 Suite
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md uppercase tracking-wider">
                Master Database Active
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {isRtl ? 'منظومة الفحص والتشخيص الأوتوماتيكي' : 'Automated Diagnostic & Verification Suite'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {isRtl
                ? 'فحص شامل لجميع قواعد التكامل، قراءة السجلات الحقيقية، مطابقة الأعمدة، حماية الفرق، ومفاتيح الحضور.'
                : 'Full verification of real Master Player records, dynamic column mapping, team isolation, and Attendance foreign keys.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchDebugInfo}
            disabled={isDebugLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition disabled:opacity-50"
          >
            {isDebugLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5 text-blue-500" />}
            <span>{isRtl ? 'فحص السجلات (Debug)' : 'Master DB Debugger'}</span>
          </button>

          <button
            onClick={activeTab === 'phase11_6' ? runPhase11_6Suite : runPhase1_2Suite}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? t.diagRunning : (isRtl ? 'تشغيل الفحص' : 'Run Diagnostics')}</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('phase11_6')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'phase11_6'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{isRtl ? 'فحص المرحلة 11.6 (قاعدة اللاعبين)' : 'Phase 11.6 (Master Player DB)'}</span>
          {report11_6 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-white">
              {report11_6.passed}/{report11_6.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('phase1_2')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'phase1_2'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isRtl ? 'فحص المراحل 1 & 2 (الحماية والأمان)' : 'Phase 1 & 2 (Security & Auth)'}</span>
          {report1_2 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-white">
              {report1_2.passed}/{report1_2.total}
            </span>
          )}
        </button>
      </div>

      {/* Admin Master Player Debug Panel */}
      {debugData && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-emerald-400">Master Player Database Debug Inspector (Admin-Only)</span>
            </div>
            <button
              onClick={() => setDebugData(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-md"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] block">Active Database Profile</span>
              <span className="font-bold text-white text-sm">{debugData.activeDatabaseName}</span>
              <span className="text-slate-500 text-[10px] block truncate">{debugData.activeSpreadsheetId}</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] block">Configured Sheet Name</span>
              <span className="font-bold text-emerald-400 text-sm">{debugData.configuredPlayerSheetName}</span>
              <span className="text-slate-400 text-[10px] block">Total Valid Players: {debugData.totalValidPlayers}</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] block">Teams Distribution</span>
              <div className="space-y-1 mt-1">
                {Object.entries(debugData.playersPerTeam || {}).map(([team, count]: any) => (
                  <div key={team} className="flex justify-between text-[11px]">
                    <span className="text-slate-300 truncate max-w-[150px]">{team}:</span>
                    <span className="text-blue-400 font-bold">{count} players</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
            <span className="text-slate-400 text-[10px] block mb-2 font-bold text-slate-300">Detected Column Headers:</span>
            <div className="flex flex-wrap gap-1.5">
              {(debugData.detectedHeaders || []).map((h: string, idx: number) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-200">
                  {idx + 1}. {h}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block mb-2 font-bold text-slate-300">First 5 Standardized Player Records:</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {(debugData.first5Players || []).map((p: any, idx: number) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">{p.PlayerID}</span>
                    <span className="text-white font-bold">{p.FullPlayerName}</span>
                    <span className="text-slate-400">({p.TeamName})</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    DOB: {p.DateOfBirth || p.BirthYear} | Phone: {p.PhoneNumber || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Diagnostics Results List */}
      {activeReport ? (
        <div className="space-y-4">
          {/* Status Overview Card */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
              allPassed
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {allPassed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {allPassed ? (isRtl ? 'جميع الاختبارات اجتازت بنجاح 100%' : 'All Verification Tests Passed') : (isRtl ? 'توجد بعض الملاحظات أو الاختبارات غير المكتملة' : 'Some Tests Failed')}
                </h4>
                <p className="text-xs opacity-90 mt-0.5">
                  {activeReport.passed} / {activeReport.total} {t.diagStatus} ({Math.round((activeReport.passed / activeReport.total) * 100)}% Pass Rate)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {new Date(activeReport.timestamp).toLocaleTimeString()}
              </span>
              <button
                onClick={activeTab === 'phase11_6' ? runPhase11_6Suite : runPhase1_2Suite}
                className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 rounded-xl border border-current shadow-2xs transition hover:opacity-80"
              >
                {isRtl ? 'إعادة الفحص' : 'Re-Run'}
              </button>
            </div>
          </div>

          {/* Test Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeReport.tests.map((test, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-start gap-3 transition-colors"
              >
                {test.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {test.testName}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        test.passed
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {test.passed ? t.diagPassBadge : t.diagFailBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {test.details}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 mt-2 flex items-center justify-between">
                    <span className={`px-1.5 py-0.5 rounded border ${getCategoryBadge(test.category)}`}>
                      {test.category}
                    </span>
                    <span>Test #{test.ruleNumber || index + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3 transition-colors">
          <Activity className="w-12 h-12 mx-auto text-blue-500/40" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {isRtl ? 'منظومة التشخيص جاهزة للتشغيل' : 'Diagnostic Suite Ready to Run'}
          </h4>
          <p className="text-xs max-w-md mx-auto text-slate-500 dark:text-slate-400">
            {isRtl
              ? 'اضغط على زر تشغيل الفحص للتحقق من جميع نقاط التكامل الـ 12 لقاعدة بيانات اللاعبين الرئيسية ومطابقة الأعمدة والحضور.'
              : 'Click the button below to run the 12 automated verification tests for Master Player Database & Record Integration.'}
          </p>
          <button
            onClick={activeTab === 'phase11_6' ? runPhase11_6Suite : runPhase1_2Suite}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition"
          >
            <Play className="w-4 h-4" />
            <span>{isRtl ? 'بدء تشغيل الفحص الآن' : 'Run Diagnostics Now'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

