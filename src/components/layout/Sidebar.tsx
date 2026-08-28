import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Layers, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  Shield, 
  History, 
  Activity, 
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Trophy,
  CalendarCheck,
  CalendarDays,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppViewId, AdminViewId, CoachViewId } from '../../types/navigation';

export const Sidebar: React.FC = () => {
  const { 
    currentUser, 
    currentView, 
    setCurrentView, 
    t, 
    isRtl, 
    language,
    setIsProfileModalOpen,
    appMode,
    setAppMode
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';
  const isHeadCoach = currentUser?.role === 'HEAD_COACH';
  const isAssistantCoach = currentUser?.role === 'ASSISTANT_COACH';

  // Define Admin Navigation Items
  const adminNavItems: { id: AdminViewId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'admin-dashboard', label: t.navDashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'admin-sessions', label: t.navSessions, icon: <CalendarDays className="w-4 h-4 text-orange-500" /> },
    { id: 'admin-players', label: t.navPlayers, icon: <Users className="w-4 h-4" /> },
    { id: 'admin-coaches', label: t.navCoaches, icon: <UserCheck className="w-4 h-4" /> },
    { id: 'admin-team-assignments', label: t.navTeamAssignments, icon: <Layers className="w-4 h-4" /> },
    { id: 'admin-attendance', label: t.navAttendance, icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'admin-reports', label: t.navReports, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'admin-database-settings', label: t.navDatabaseSettings, icon: <Database className="w-4 h-4 text-emerald-500" /> },
    { id: 'admin-settings', label: t.navSettings, icon: <Settings className="w-4 h-4" /> }
  ];

  // Define Coach Navigation Items
  const coachNavItems: { id: CoachViewId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'coach-dashboard', label: t.navCoachDashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'coach-sessions', label: t.navCoachSessions, icon: <CalendarDays className="w-4 h-4 text-orange-500" /> },
    { id: 'coach-teams', label: t.navMyTeams, icon: <Users className="w-4 h-4" />, badge: currentUser?.authorizedTeams?.length ? `${currentUser.authorizedTeams.length}` : undefined },
    { id: 'coach-attendance', label: t.navCoachAttendance, icon: <CalendarCheck className="w-4 h-4 text-emerald-500" /> },
    { id: 'coach-history', label: t.navAttendanceHistory, icon: <History className="w-4 h-4" /> },
    { id: 'coach-stats', label: t.navPlayerStats, icon: <Activity className="w-4 h-4" /> }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 h-screen sticky top-0 shrink-0 select-none z-30 transition-colors">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-500/20 shrink-0">
          🏐
        </div>
        <div className="min-w-0">
          <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
            {language === 'ar' ? 'منظومة الكرة الطائرة' : 'Volleyball Club'}
          </h2>
          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block truncate">
            {isAdmin ? t.adminBadge : isHeadCoach ? t.headCoachBadge : t.assistantCoachBadge}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Role Section Title */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isAdmin ? (language === 'ar' ? 'لوحة الإدارة الشاملة' : 'Administration Menu') : (language === 'ar' ? 'قائمة المدرب' : 'Coach Menu')}
          </div>

          {/* Render Active Role's Menu */}
          {isAdmin ? (
            <div className="space-y-1">
              {adminNavItems.map(item => {
                const isActive = currentView === item.id && appMode === 'APP';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAppMode('APP');
                      setCurrentView(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {coachNavItems.map(item => {
                const isActive = currentView === item.id && appMode === 'APP';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAppMode('APP');
                      setCurrentView(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Developer / Architecture Hub Toggle */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            {language === 'ar' ? 'أدوات البنية التحتية' : 'Architecture & Specs'}
          </div>
          <button
            onClick={() => {
              setAppMode(appMode === 'DEV_TOOLS' ? 'APP' : 'DEV_TOOLS');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
              appMode === 'DEV_TOOLS'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                : 'bg-purple-500/5 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900 hover:bg-purple-500/10'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4" />
              <span>{t.devConsole}</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono">
              Phases 1-3
            </span>
          </button>
        </div>
      </div>

      {/* User Profile Mini Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentUser?.fullName?.charAt(0) || '👤'}
            </div>
            <div className="min-w-0 text-start">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                {currentUser?.fullName || currentUser?.userEmail}
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate block">
                {currentUser?.role}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold shrink-0">
            {language === 'ar' ? 'تبديل' : 'Switch'}
          </span>
        </button>
      </div>
    </aside>
  );
};
