import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Terminal, ExternalLink, ShieldAlert, Sparkles, BookOpen, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GoogleAppsScriptModularGenerator, GASModule } from '../services/gasCodeModules';

export const AppsScriptCodeHub: React.FC = () => {
  const { t, isRtl, language } = useApp();
  const [modules, setModules] = useState<GASModule[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>('Config.gs');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  useEffect(() => {
    // Load modules from generator
    const all = GoogleAppsScriptModularGenerator.getAllModules();
    setModules(all);
    if (all.length > 0) {
      setSelectedFileName(all[0].filename);
    }
  }, []);

  const selectedModule = modules.find(m => m.filename === selectedFileName) || modules[0];

  const handleCopyFile = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(name);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleCopyAll = () => {
    const combined = modules.map(m => `// ============================================================================\n// FILE: ${m.filename}\n// ${m.description}\n// ============================================================================\n\n${m.code}`).join('\n\n\n');
    navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleDownloadZipOrTxt = () => {
    const combined = modules.map(m => `// ============================================================================\n// FILE: ${m.filename}\n// ${m.description}\n// ============================================================================\n\n${m.code}`).join('\n\n\n');
    const blob = new Blob([combined], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Volleyball_Attendance_AppsScript_Phase2.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded-md uppercase tracking-wider">
                Phase 1 & Phase 2 Modules ({modules.length} Files)
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'أكواد Google Apps Script المعيارية للإنتاج' : 'Production Google Apps Script Modular Code'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {language === 'ar'
                ? 'أكواد برمجية جاهزة للتثبيت في مشروع Google Sheet الحالي. تتضمن طبقة الأمان وعزل الصلاحيات واستعلامات قاعدة البيانات.'
                : 'Modular enterprise-grade Apps Script backend. Enforces backend authentication, coach permissions, and master player preservation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadZipOrTxt}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'ar' ? 'تحميل كملف كامل' : 'Download All (.js)'}</span>
          </button>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-purple-500/20 transition"
          >
            {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? (language === 'ar' ? 'تم نسخ جميع الملفات!' : 'All Files Copied!') : (language === 'ar' ? 'نسخ جميع الملفات الـ 10' : 'Copy All 10 Files')}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File Navigator */}
        <div className="lg:col-span-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1 mb-2">
            {language === 'ar' ? 'ملفات المشروع الخلفية (10 ملفات):' : 'Project Backend Modules (10 Files):'}
          </h4>
          <div className="space-y-1.5">
            {modules.map((m, idx) => {
              const isSelected = m.filename === selectedFileName;
              return (
                <button
                  key={m.filename}
                  onClick={() => setSelectedFileName(m.filename)}
                  className={`w-full text-start p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-500/10 border-purple-500 text-purple-900 dark:text-purple-200 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{m.filename}</span>
                      {m.filename.includes('Auth') && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold bg-orange-500 text-white rounded">
                          Phase 2
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {m.description}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Display & Copy Container */}
        <div className="lg:col-span-8 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 p-5 shadow-xs flex flex-col min-h-[500px]">
          {selectedModule ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span className="font-mono text-xs font-bold text-purple-300">
                    {selectedModule.filename}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    — {selectedModule.description}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyFile(selectedModule.code, selectedModule.filename)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                >
                  {copiedFile === selectedModule.filename ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{language === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'نسخ هذا الملف' : 'Copy File'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 mt-3 overflow-x-auto">
                <pre className="font-mono text-xs text-slate-300 leading-relaxed font-normal">
                  <code>{selectedModule.code}</code>
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Select a module to preview code
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
