import React from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Languages, 
  Terminal, 
  Users, 
  ShieldCheck, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    theme, 
    toggleTheme, 
    language, 
    toggleLanguage, 
    t, 
    isRtl,
    selectedTeam,
    setSelectedTeam,
    availableTeams,
    setIsMobileDrawerOpen,
    setIsProfileModalOpen,
    appMode,
    setAppMode
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';
  const isHeadCoach = currentUser?.role === 'HEAD_COACH';
  const isAssistantCoach = currentUser?.role === 'ASSISTANT_COACH';

  const accessibleTeams = isAdmin ? availableTeams : (currentUser?.authorizedTeams || []);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button + Brand on Mobile + Role Info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo (Visible on mobile / small screens) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              🏐
            </div>
            <span className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">
              {language === 'ar' ? 'الكرة الطائرة' : 'Volleyball'}
            </span>
          </div>

          {/* Active Role Tag & Scope */}
          <div className="hidden sm:flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                isAdmin
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                  : isHeadCoach
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : isAssistantCoach
                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
              <span>
                {isAdmin && t.adminBadge}
                {isHeadCoach && t.headCoachBadge}
                {isAssistantCoach && t.assistantCoachBadge}
                {currentUser?.role === 'UNREGISTERED' && t.unregisteredBadge}
              </span>
            </span>

            {/* If Coach or Admin: Team Selector */}
            {accessibleTeams.length > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 hidden md:inline">|</span>
                <select
                  value={selectedTeam}
                  onChange={e => setSelectedTeam(e.target.value)}
                  className="text-xs font-bold py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                >
                  {accessibleTeams.map(tm => (
                    <option key={tm} value={tm}>
                      🏐 {tm}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mode Switch: Field App vs Architecture Dev Console */}
          <button
            onClick={() => setAppMode(appMode === 'DEV_TOOLS' ? 'APP' : 'DEV_TOOLS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
              appMode === 'DEV_TOOLS'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 hover:bg-purple-500/20'
            }`}
            title="Toggle between Field App and Architecture / Code Modules"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {appMode === 'DEV_TOOLS' ? t.mainApp : t.devConsole}
            </span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title={language === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
          >
            <Languages className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">{t.langToggle}</span>
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title={t.themeToggle}
            aria-label={t.themeToggle}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* User Profile Avatar / Switcher Trigger */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            title={t.profile}
          >
            <div className="w-6 h-6 rounded-lg bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center">
              {currentUser?.fullName?.charAt(0) || '👤'}
            </div>
            <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
              {currentUser?.fullName?.split(' ')[0] || currentUser?.userEmail?.split('@')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
