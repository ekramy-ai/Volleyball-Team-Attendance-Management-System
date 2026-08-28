import React, { useState } from 'react';
import { Copy, Check, FileCode, ExternalLink, Sparkles, Terminal } from 'lucide-react';
import { GoogleAppsScriptGenerator } from '../services/googleAppsScriptGenerator';

export const AppsScriptCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const code = GoogleAppsScriptGenerator.generateCodeGs();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Google Apps Script Backend & Database Generator (<code className="font-mono text-amber-600 dark:text-amber-400">Code.gs</code>)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Production script to automatically generate and format all 8 Google Sheets, configure dropdown validations, and setup triggers.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-800" />
              <span>Copied Code.gs!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Code.gs</span>
            </>
          )}
        </button>
      </div>

      {/* 4-Step Setup Guide */}
      <div className="my-5 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Setup Guide for Google Sheets:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">1. Open Sheets</div>
            <div>Open a new or existing Google Sheet for your Volleyball Club.</div>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">2. Open Apps Script</div>
            <div>Click <span className="font-semibold text-slate-700 dark:text-slate-300">Extensions → Apps Script</span> from the top menu.</div>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">3. Paste Code</div>
            <div>Paste the copied code into <span className="font-mono font-semibold">Code.gs</span> and click Save.</div>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">4. Run Setup</div>
            <div>Reload the sheet and use the <span className="font-semibold text-orange-500">🏐 Volleyball System</span> menu to initialize!</div>
          </div>
        </div>
      </div>

      {/* Code Box */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200 text-xs font-mono">
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Code.gs — Google Apps Script</span>
          </div>
          <span>JavaScript (V8 Engine)</span>
        </div>
        <pre className="p-4 overflow-x-auto max-h-[380px] leading-relaxed text-[11px] text-emerald-400">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
