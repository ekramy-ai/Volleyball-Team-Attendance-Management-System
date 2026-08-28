import React from 'react';
import { Database, ShieldCheck, RefreshCw, Download, Moon, Sun, Globe, Languages } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onReset: () => void;
  onExport: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset, onExport, isResetting }) => {
  const { theme, toggleTheme, language, toggleLanguage, t } = useApp();

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-xl select-none shrink-0">
            🏐
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-base sm:text-lg">
                {t.appTitle}
              </h1>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                {t.phaseBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Actions & Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-2xs"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
          >
            <Languages className="w-4 h-4 text-orange-500" />
            <span className="font-semibold">{t.langToggle}</span>
          </button>

          {/* Theme Switcher (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-2xs"
            title={t.themeToggle}
            aria-label={t.themeToggle}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Reset Seed Button */}
          <button
            onClick={onReset}
            disabled={isResetting}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
            title="Reset to clean initial seed data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? t.resetting : t.resetSeed}</span>
          </button>

          {/* Backup JSON Button */}
          <button
            onClick={onExport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition"
            title="Export full database JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span>{t.backupJson}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
