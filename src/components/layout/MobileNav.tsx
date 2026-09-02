import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Layers, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  History, 
  Activity, 
  CalendarCheck,
  CalendarDays,
  X,
  Menu,
  Terminal,
  LogOut,
  User,
  Shield,
  ArrowRightLeft,
  Database,
  BellRing,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppViewId, AdminViewId, CoachViewId } from '../../types/navigation';

export const MobileNav: React.FC = () => {
  const { 
    currentUser, 
    currentView, 
    setCurrentView, 
    isMobileDrawerOpen, 
    setIsMobileDrawerOpen, 
    setIsProfileModalOpen,
    t, 
    language,
    isRtl,
    appMode,
    setAppMode,
    selectedTeam,
    setSelectedTeam,
    availableTeams
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN';
  const isHeadCoach = currentUser?.role === 'HEAD_COACH';
  const isAssistantCoach = currentUser?.role === 'ASSISTANT_COACH';

  // Bottom Navigation Bar Items (Thumb-friendly primary items for mobile)
  const adminBottomTabs = [
    { id: 'admin-dashboard' as AppViewId, label: t.navDashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'admin-alerts' as AppViewId, label: t.navAlerts, icon: <BellRing className="w-5 h-5 text-rose-500" /> },
    { id: 'admin-sessions' as AppViewId, label: t.navSessions, icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'admin-attendance' as AppViewId, label: t.navAttendance, icon: <ClipboardCheck className="w-5 h-5" /> },
  ];

  const coachBottomTabs = [
    { id: 'coach-dashboard' as AppViewId, label: t.navCoachDashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'coach-sessions' as AppViewId, label: t.navCoachSessions, icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'coach-attendance' as AppViewId, label: t.navCoachAttendance, icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'coach-teams' as AppViewId, label: t.navMyTeams, icon: <Users className="w-5 h-5" /> },
  ];

  const bottomTabs = isAdmin ? adminBottomTabs : coachBottomTabs;

  // Full Menus for the Drawer
  const adminFullMenu: { id: AdminViewId; label: string; icon: React.ReactNode }[] = [
    { id: 'admin-dashboard', label: t.navDashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'admin-alerts', label: t.navAlerts, icon: <BellRing className="w-4 h-4 text-rose-500" /> },
    { id: 'admin-sessions', label: t.navSessions, icon: <CalendarDays className="w-4 h-4 text-orange-500" /> },
    { id: 'admin-players', label: t.navPlayers, icon: <Users className="w-4 h-4" /> },
    { id: 'admin-coaches', label: t.navCoaches, icon: <UserCheck className="w-4 h-4" /> },
    { id: 'admin-team-assignments', label: t.navTeamAssignments, icon: <Layers className="w-4 h-4" /> },
    { id: 'admin-attendance', label: t.navAttendance, icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'admin-reports', label: t.navReports, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'admin-audit-log', label: language === 'ar' ? 'سجل التدقيق والأمان' : 'Audit & Security Logs', icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> },
    { id: 'admin-database-settings', label: language === 'ar' ? 'إدارة واستيراد قواعد البيانات' : 'Database Management Hub', icon: <Database className="w-4 h-4 text-emerald-500" /> },
    { id: 'admin-settings', label: t.navSettings, icon: <Settings className="w-4 h-4" /> }
  ];

  const coachFullMenu: { id: CoachViewId; label: string; icon: React.ReactNode }[] = [
    { id: 'coach-dashboard', label: t.navCoachDashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'coach-sessions', label: t.navCoachSessions, icon: <CalendarDays className="w-4 h-4 text-orange-500" /> },
    { id: 'coach-teams', label: t.navMyTeams, icon: <Users className="w-4 h-4" /> },
    { id: 'coach-attendance', label: t.navCoachAttendance, icon: <CalendarCheck className="w-4 h-4 text-emerald-500" /> },
    { id: 'coach-history', label: t.navAttendanceHistory, icon: <History className="w-4 h-4" /> },
    { id: 'coach-stats', label: t.navPlayerStats, icon: <Activity className="w-4 h-4" /> },
    { id: 'coach-reports', label: t.navReports, icon: <BarChart3 className="w-4 h-4 text-purple-500" /> }
  ];

  return (
    <>
      {/* 1. Mobile Bottom Bar (Fixed at bottom on screens < lg) */}
      <nav 
        id="mobile-bottom-bar"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe transition-colors"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {bottomTabs.map(tab => {
            const isActive = currentView === tab.id && appMode === 'APP';
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setAppMode('APP');
                  setCurrentView(tab.id);
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive ? 'bg-orange-500/10' : ''}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[68px]">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More / Menu Button for Drawer */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <div className="p-1 rounded-xl">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">
              {t.mobileMenu}
            </span>
          </button>
        </div>
      </nav>

      {/* 2. Slide-over Mobile Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div 
            className={`relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 transition-colors animate-in ${
              isRtl ? 'slide-in-from-right' : 'slide-in-from-left'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-500/20">
                  🏐
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                    {t.appTitle}
                  </h3>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block">
                    {isAdmin ? t.adminBadge : isHeadCoach ? t.headCoachBadge : t.assistantCoachBadge}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Role Navigation Items */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isAdmin ? (language === 'ar' ? 'أقسام الإدارة' : 'Admin Portal') : (language === 'ar' ? 'أقسام المدرب' : 'Coach Menu')}
                </div>

                {isAdmin ? (
                  <div className="space-y-1">
                    {adminFullMenu.map(item => {
                      const isActive = currentView === item.id && appMode === 'APP';
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setAppMode('APP');
                            setCurrentView(item.id);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                            isActive
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className={isActive ? 'text-white' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {coachFullMenu.map(item => {
                      const isActive = currentView === item.id && appMode === 'APP';
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setAppMode('APP');
                            setCurrentView(item.id);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                            isActive
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className={isActive ? 'text-white' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Developer / Architecture Hub in Drawer */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {language === 'ar' ? 'أدوات البنية التحتية' : 'Architecture & Specs'}
                </div>
                <button
                  onClick={() => {
                    setAppMode(appMode === 'DEV_TOOLS' ? 'APP' : 'DEV_TOOLS');
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition border ${
                    appMode === 'DEV_TOOLS'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                      : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 hover:bg-purple-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal className="w-4 h-4" />
                    <span>{t.devConsole}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono">
                    Phase 1-3
                  </span>
                </button>
              </div>
            </div>

            {/* Drawer User Profile Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser?.fullName?.charAt(0) || '👤'}
                  </div>
                  <div className="min-w-0 text-start">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {currentUser?.fullName || currentUser?.userEmail}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {currentUser?.role}
                    </span>
                  </div>
                </div>
                <ArrowRightLeft className="w-4 h-4 text-orange-500 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
