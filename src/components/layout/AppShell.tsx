import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { UserProfileModal } from './UserProfileModal';
import { LoadingState } from '../common/LoadingState';
import { LoginView } from '../views/LoginView';

// Admin Views
import { AdminDashboardView } from '../views/AdminDashboardView';
import { SmartAlertsView } from '../views/SmartAlertsView';
import { PlayersView } from '../views/PlayersView';
import { CoachesView } from '../views/CoachesView';
import { TeamAssignmentsView } from '../views/TeamAssignmentsView';
import { AttendanceView } from '../views/AttendanceView';
import { ReportsView } from '../views/ReportsView';
import { AuditLogView } from '../views/AuditLogView';
import { SettingsView } from '../views/SettingsView';
import { DatabaseSettingsView } from '../views/DatabaseSettingsView';

// Phase 5 Training Sessions View
import { TrainingSessionsView } from '../views/TrainingSessionsView';

// Coach Views
import { CoachDashboardView } from '../views/CoachDashboardView';
import { CoachMyTeamsView } from '../views/CoachMyTeamsView';
import { CoachAttendanceView } from '../views/CoachAttendanceView';
import { CoachAttendanceHistoryView } from '../views/CoachAttendanceHistoryView';
import { CoachPlayerStatsView } from '../views/CoachPlayerStatsView';

// Developer & Architecture Tools (Phases 1 & 2)
import { MasterPlayerDatabaseViewer } from '../MasterPlayerDatabaseViewer';
import { SecurityAuthorizationTester } from '../SecurityAuthorizationTester';
import { AuxiliarySheetsViewer } from '../AuxiliarySheetsViewer';
import { AppsScriptCodeHub } from '../AppsScriptCodeHub';
import { DiagnosticSuiteViewer } from '../DiagnosticSuiteViewer';
import { IntegrationGuideSection } from '../IntegrationGuideSection';

import { Database, Shield, FileCode, Activity, BookOpen, Layers, Lock, Sparkles, Terminal } from 'lucide-react';

export const AppShell: React.FC = () => {
  const { 
    currentUser, 
    currentView, 
    appMode, 
    setAppMode,
    isSessionLoading,
    t, 
    language, 
    isRtl 
  } = useApp();

  // Dev mode active tab
  const [devActiveTab, setDevActiveTab] = React.useState<'master' | 'security' | 'auxiliary' | 'gas' | 'diagnostics' | 'guide'>('master');

  if (isSessionLoading) {
    return <LoadingState type="fullscreen" message={t.loadingData} />;
  }

  // If user is logged out, show LoginView
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <LoginView />
        </main>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-row font-sans selection:bg-orange-500 selection:text-white transition-colors">
      {/* 1. Desktop Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Header */}
        <Header />

        {/* Dynamic Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {appMode === 'DEV_TOOLS' ? (
            /* Developer & Architecture Tools Console */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Dev Header Card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-purple-200 dark:border-purple-900/60 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded-md uppercase tracking-wider">
                      Architecture & Code Console
                    </span>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                      {t.phase1HeaderTitle}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed max-w-4xl">
                    {t.phase1HeaderDesc}
                  </p>
                </div>

                {/* Dev Tab Switcher */}
                <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto self-start md:self-auto max-w-full shrink-0">
                  <button
                    onClick={() => setDevActiveTab('master')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                      devActiveTab === 'master'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{t.tabMaster}</span>
                  </button>

                  <button
                    onClick={() => setDevActiveTab('security')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                      devActiveTab === 'security'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>{t.tabSecurity}</span>
                  </button>

                  <button
                    onClick={() => setDevActiveTab('auxiliary')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                      devActiveTab === 'auxiliary'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>{t.tabAuxiliary}</span>
                  </button>

                  <button
                    onClick={() => setDevActiveTab('gas')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                      devActiveTab === 'gas'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{t.tabGas}</span>
                  </button>

                  <button
                    onClick={() => setDevActiveTab('diagnostics')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                      devActiveTab === 'diagnostics'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{t.tabDiagnostics}</span>
                  </button>

                  <button
                    onClick={() => setDevActiveTab('guide')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                      devActiveTab === 'guide'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>{t.tabGuide}</span>
                  </button>
                </div>
              </div>

              {/* Dev Active Sub-View */}
              {devActiveTab === 'master' && <MasterPlayerDatabaseViewer />}
              {devActiveTab === 'security' && <SecurityAuthorizationTester />}
              {devActiveTab === 'auxiliary' && <AuxiliarySheetsViewer />}
              {devActiveTab === 'gas' && <AppsScriptCodeHub />}
              {devActiveTab === 'diagnostics' && <DiagnosticSuiteViewer />}
              {devActiveTab === 'guide' && <IntegrationGuideSection />}
            </div>
          ) : (
            /* Field Application Views */
            <div className="space-y-6">
              {/* ADMIN VIEWS */}
              {isAdmin && currentView === 'admin-dashboard' && <AdminDashboardView />}
              {isAdmin && currentView === 'admin-alerts' && <SmartAlertsView />}
              {isAdmin && currentView === 'admin-sessions' && <TrainingSessionsView />}
              {isAdmin && currentView === 'admin-players' && <PlayersView />}
              {isAdmin && currentView === 'admin-coaches' && <CoachesView />}
              {isAdmin && currentView === 'admin-team-assignments' && <TeamAssignmentsView />}
              {isAdmin && currentView === 'admin-attendance' && <AttendanceView />}
              {isAdmin && currentView === 'admin-reports' && <ReportsView />}
              {isAdmin && currentView === 'admin-audit-log' && <AuditLogView />}
              {isAdmin && currentView === 'admin-database-settings' && <DatabaseSettingsView />}
              {isAdmin && currentView === 'admin-settings' && <SettingsView />}

              {/* COACH VIEWS */}
              {!isAdmin && currentView === 'coach-dashboard' && <CoachDashboardView />}
              {!isAdmin && currentView === 'coach-sessions' && <TrainingSessionsView />}
              {!isAdmin && currentView === 'coach-teams' && <CoachMyTeamsView />}
              {!isAdmin && currentView === 'coach-attendance' && <CoachAttendanceView />}
              {!isAdmin && currentView === 'coach-history' && <CoachAttendanceHistoryView />}
              {!isAdmin && currentView === 'coach-stats' && <CoachPlayerStatsView />}
              {!isAdmin && currentView === 'coach-reports' && <ReportsView />}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
          {t.footerText}
        </footer>
      </div>

      {/* 3. Mobile Navigation Bottom Bar & Drawer */}
      <MobileNav />

      {/* 4. User Profile Dialog */}
      <UserProfileModal />
    </div>
  );
};
