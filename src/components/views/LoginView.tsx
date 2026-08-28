import React from 'react';
import { LogIn, ShieldCheck, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useApp, PRESET_ACCOUNTS } from '../../context/AppContext';

export const LoginView: React.FC = () => {
  const { login, t, language, isRtl } = useApp();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Brand Logo */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-orange-500/30 mx-auto select-none">
          🏐
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t.appTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {t.appSubtitle}
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-start space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-300">
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'ar' ? 'مصادقة Google Apps Script المعتمدة' : 'Google Apps Script Authentication'}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.selectRoleToSimulate}
          </p>
        </div>

        {/* Quick Sign In with Presets */}
        <div className="space-y-2.5">
          {PRESET_ACCOUNTS.map(acc => (
            <button
              key={acc.email}
              onClick={() => login(acc.email)}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-500/5 hover:border-orange-500/40 text-start transition group shadow-2xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                    {acc.name}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      acc.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : acc.role === 'HEAD_COACH'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                    }`}
                  >
                    {acc.role}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 block truncate mt-0.5">
                  {acc.email}
                </span>
              </div>

              <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-orange-500 group-hover:text-white transition shrink-0">
                <LogIn className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
