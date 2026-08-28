import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  Users, 
  CheckCircle2, 
  LogOut, 
  ArrowRightLeft,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp, PRESET_ACCOUNTS } from '../../context/AppContext';

export const UserProfileModal: React.FC = () => {
  const { 
    currentUser, 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    switchUser, 
    logout, 
    t, 
    isRtl, 
    language 
  } = useApp();

  if (!isProfileModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-500/30">
              {currentUser?.fullName?.charAt(0) || '👤'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {currentUser?.fullName || currentUser?.userEmail || t.profile}
              </h3>
              <p className="text-[11px] text-slate-300 font-mono">
                {currentUser?.userEmail}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Current Role & Scope Badge */}
          {currentUser && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {language === 'ar' ? 'الصلاحيات والفرق المصرح بها' : 'Permissions & Authorized Scope'}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300'
                      : currentUser.role === 'HEAD_COACH'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                      : currentUser.role === 'ASSISTANT_COACH'
                      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                  }`}
                >
                  {currentUser.role === 'ADMIN' && t.adminBadge}
                  {currentUser.role === 'HEAD_COACH' && t.headCoachBadge}
                  {currentUser.role === 'ASSISTANT_COACH' && t.assistantCoachBadge}
                  {currentUser.role === 'UNREGISTERED' && t.unregisteredBadge}
                </span>
              </div>

              {/* Authorized Teams Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">
                  {t.secAssigned}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.authorizedTeams && currentUser.authorizedTeams.length > 0 ? (
                    currentUser.authorizedTeams.map(team => (
                      <span
                        key={team}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                      >
                        🏐 {team}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      {language === 'ar' ? 'لا توجد فرق مرتبطة' : 'No assigned teams'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Role & Identity Switcher */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <ArrowRightLeft className="w-4 h-4 text-orange-500" />
              <span>{t.selectRoleToSimulate}</span>
            </div>

            <div className="space-y-2">
              {PRESET_ACCOUNTS.map(acc => {
                const isCurrent = currentUser?.userEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    onClick={() => switchUser(acc.email)}
                    className={`w-full text-start p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-orange-500/10 border-orange-500 text-slate-900 dark:text-slate-100 shadow-xs ring-1 ring-orange-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">
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

                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800 shrink-0">
                        {language === 'ar' ? 'النشط حالياً' : 'Active'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                        {language === 'ar' ? 'تبديل ⇽' : 'Switch ⇽'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
