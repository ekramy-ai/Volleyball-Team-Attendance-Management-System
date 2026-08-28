import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  KeyRound, 
  Terminal, 
  Flame, 
  RefreshCw,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserSessionContext, AuthorizationGuardResult, NormalizedPlayer, AuditLogRecord } from '../types/database';

export const SecurityAuthorizationTester: React.FC = () => {
  const { t, isRtl, language } = useApp();

  const [activeUserEmail, setActiveUserEmail] = useState<string>('coach.ahmed@volleyball.club');
  const [currentSession, setCurrentSession] = useState<UserSessionContext | null>(null);
  const [targetTeam, setTargetTeam] = useState<string>('براعم 2015 بنات');
  const [allTeams, setAllTeams] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  
  const [guardResult, setGuardResult] = useState<AuthorizationGuardResult | null>(null);
  const [authorizedPlayers, setAuthorizedPlayers] = useState<NormalizedPlayer[] | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'ATTACK_SUITE' | 'AUDIT_TRAIL'>('SIMULATOR');

  const presetIdentities = [
    {
      email: 'admin@volleyball.club',
      name: 'كابتن / مجدي عبد الرازق (Director)',
      role: 'ADMIN',
      status: 'Active',
      badge: 'Full Access (All Teams)',
      color: 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300'
    },
    {
      email: 'coach.ahmed@volleyball.club',
      name: 'كابتن / أحمد كمال (Head Coach)',
      role: 'HEAD_COACH',
      status: 'Active',
      badge: 'براعم 2015 بنات',
      color: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
    },
    {
      email: 'coach.mahmoud@volleyball.club',
      name: 'كابتن / محمود إبراهيم (Head Coach)',
      role: 'HEAD_COACH',
      status: 'Active',
      badge: 'براعم 2014 بنات',
      color: 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
    },
    {
      email: 'coach.mona@volleyball.club',
      name: 'كابتن / منى عبد العزيز (Assistant Coach)',
      role: 'ASSISTANT_COACH',
      status: 'Active',
      badge: 'RECORD_ONLY (براعم 2015 بنات)',
      color: 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
    },
    {
      email: 'coach.inactive@volleyball.club',
      name: 'كابتن / سامي يوسف (Suspended Coach)',
      role: 'HEAD_COACH',
      status: 'Inactive',
      badge: 'Account Inactive / Revoked',
      color: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
    },
    {
      email: 'stranger@gmail.com',
      name: 'حساب غير مسجل (Unregistered Google Account)',
      role: 'UNREGISTERED',
      status: 'None',
      badge: 'Blocked by Google Auth Gate',
      color: 'border-slate-500 bg-slate-500/10 text-slate-700 dark:text-slate-300'
    }
  ];

  // Fetch session & overview metadata
  const fetchSessionData = async (email: string) => {
    try {
      const res = await fetch(`/api/auth/me?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.session) {
        setCurrentSession(data.session);
      }

      const ovRes = await fetch('/api/database/overview');
      const ovData = await ovRes.json();
      if (ovData.success && ovData.distinctTeams) {
        setAllTeams(ovData.distinctTeams);
      }

      refreshAuditLogs();
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const refreshAuditLogs = async () => {
    try {
      const res = await fetch('/api/auth/audit-logs');
      const data = await res.json();
      if (data.success && data.logs) {
        setAuditLogs(data.logs.slice(0, 15));
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    fetchSessionData(activeUserEmail);
  }, [activeUserEmail]);

  // Execute requireAuthorizedTeam gate
  const handleTestTeamAuthorization = async (overrideEmail?: string, overrideTeam?: string) => {
    const emailToUse = overrideEmail || (isCustom ? customEmail : activeUserEmail);
    const teamToUse = overrideTeam || targetTeam;

    setIsVerifying(true);
    setGuardResult(null);
    setAuthorizedPlayers(null);

    try {
      const res = await fetch('/api/auth/authorized-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          teamName: teamToUse
        })
      });
      const data = await res.json();
      if (data.authDetails) {
        setGuardResult(data.authDetails);
      }
      if (data.players) {
        setAuthorizedPlayers(data.players);
      }
      refreshAuditLogs();
    } catch (err) {
      console.error('Error during authorization verification:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Execute requireAdmin gate
  const handleTestAdminGate = async (overrideEmail?: string) => {
    const emailToUse = overrideEmail || (isCustom ? customEmail : activeUserEmail);
    setIsVerifying(true);
    setGuardResult(null);
    setAuthorizedPlayers(null);

    try {
      const res = await fetch('/api/auth/require-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      });
      const data = await res.json();
      if (data.guard) {
        setGuardResult(data.guard);
      }
      refreshAuditLogs();
    } catch (err) {
      console.error('Error testing admin gate:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Pre-configured Attack Scenarios
  const runAttackScenario = (scenarioId: number) => {
    switch (scenarioId) {
      case 1:
        // Parameter Tampering Attack
        setActiveUserEmail('coach.ahmed@volleyball.club');
        setIsCustom(false);
        setTargetTeam('براعم 2014 بنات');
        handleTestTeamAuthorization('coach.ahmed@volleyball.club', 'براعم 2014 بنات');
        break;
      case 2:
        // Privilege Elevation Exploit
        setActiveUserEmail('coach.ahmed@volleyball.club');
        setIsCustom(false);
        handleTestAdminGate('coach.ahmed@volleyball.club');
        break;
      case 3:
        // Unregistered Google Account Attack
        setActiveUserEmail('stranger@gmail.com');
        setIsCustom(false);
        setTargetTeam('براعم 2015 بنات');
        handleTestTeamAuthorization('stranger@gmail.com', 'براعم 2015 بنات');
        break;
      case 4:
        // Inactive Coach Account Bypass
        setActiveUserEmail('coach.inactive@volleyball.club');
        setIsCustom(false);
        setTargetTeam('براعم 2015 بنات');
        handleTestTeamAuthorization('coach.inactive@volleyball.club', 'براعم 2015 بنات');
        break;
      case 5:
        // Admin Legitimate Access
        setActiveUserEmail('admin@volleyball.club');
        setIsCustom(false);
        setTargetTeam('براعم 2014 بنات');
        handleTestTeamAuthorization('admin@volleyball.club', 'براعم 2014 بنات');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-md uppercase tracking-wider">
                  Phase 2 Authentication & RBAC
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded-md uppercase tracking-wider">
                  Backend Security Enforced
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {language === 'ar' 
                    ? 'نظام التوثيق وإدارة الصلاحيات الصارمة (Phase 2 Auth Engine)'
                    : 'Authentication & Strict Authorization Engine (Phase 2)'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'ar'
                  ? 'يتم تطبيق التحقق من هوية مستخدم Google وفحص الصلاحيات من خلال دالات AuthorizationService.gs في الخلفية قبل أي عملية استعلام أو تعديل.'
                  : 'Every backend request strictly verifies: Google User -> Role -> Authorized Team -> Requested Resource before accessing sheets.'}
              </p>
            </div>
          </div>

          {/* Sub-tabs switch */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('SIMULATOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'SIMULATOR'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {language === 'ar' ? 'محاكي تسجيل الدخول والصلاحيات' : 'Interactive Auth Simulator'}
            </button>
            <button
              onClick={() => setActiveTab('ATTACK_SUITE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ATTACK_SUITE'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>{language === 'ar' ? 'اختبارات الاختراق وعزل الفرق' : 'Penetration Attack Suite'}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('AUDIT_TRAIL');
                refreshAuditLogs();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'AUDIT_TRAIL'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {language === 'ar' ? 'سجل الأمان الحي (AUDIT_LOG)' : 'Live Audit Trail'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Google User Selector */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? '1. اختر هوية حساب Google النشط (Session.getActiveUser):' : '1. Select Authenticated Google User Session:'}
                </label>
                <button
                  onClick={() => setIsCustom(!isCustom)}
                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  {isCustom ? (language === 'ar' ? 'القوائم الجاهزة' : 'Use Presets') : (language === 'ar' ? 'بريد مخصص' : 'Custom Email')}
                </button>
              </div>

              {!isCustom ? (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {presetIdentities.map(id => {
                    const isSelected = activeUserEmail === id.email;
                    return (
                      <div
                        key={id.email}
                        onClick={() => {
                          setActiveUserEmail(id.email);
                          setGuardResult(null);
                          setAuthorizedPlayers(null);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500 shadow-xs ring-1 ring-orange-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {id.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              id.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200'
                                : id.role === 'HEAD_COACH'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                                : id.role === 'ASSISTANT_COACH'
                                ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                            }`}
                          >
                            {id.role}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                          {id.email}
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-semibold">
                          <span>{language === 'ar' ? 'الصلاحية / الفرق:' : 'Scope:'}</span>
                          <span className="text-orange-600 dark:text-orange-400">{id.badge}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="text-[11px] text-slate-600 dark:text-slate-400">
                    {language === 'ar' ? 'أدخل أي بريد إلكتروني لاختبار رفضه أو قبوله:' : 'Enter any custom Google email:'}
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    placeholder="e.g. attacker@gmail.com"
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => {
                      if (customEmail) {
                        setActiveUserEmail(customEmail);
                        fetchSessionData(customEmail);
                      }
                    }}
                    className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition"
                  >
                    {language === 'ar' ? 'محاكاة هذا المستخدم' : 'Simulate This User'}
                  </button>
                </div>
              )}
            </div>

            {/* Target Team Selector */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? '2. الفريق المطلوب الوصول لبيانات لاعبيه:' : '2. Target Volleyball Team Resource:'}
              </label>
              <select
                value={targetTeam}
                onChange={e => {
                  setTargetTeam(e.target.value);
                  setGuardResult(null);
                  setAuthorizedPlayers(null);
                }}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:outline-hidden"
              >
                {allTeams.map(tName => (
                  <option key={tName} value={tName}>
                    {tName}
                  </option>
                ))}
              </select>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleTestTeamAuthorization()}
                  disabled={isVerifying}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/20 transition disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isVerifying ? 'جاري الفحص...' : 'requireAuthorizedTeam()'}</span>
                </button>

                <button
                  onClick={() => handleTestAdminGate()}
                  disabled={isVerifying}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/20 transition disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isVerifying ? 'جاري الفحص...' : 'requireAdmin()'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Authorization Decision & Protected Data Output */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'مخرجات قرار حارس الأمان بالخلفية (Security Guard Output)' : 'Backend Security Guard Decision'}
              </h4>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                AuthorizationService.gs
              </span>
            </div>

            {/* Resolved User Profile Card */}
            {currentSession && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {language === 'ar' ? 'هوية المستخدم المستخلصة من الجلسة' : 'Resolved Active Session Context'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {currentSession.fullName || currentSession.userEmail}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    {currentSession.userEmail}
                  </span>
                </div>
                <div className="text-end">
                  <span
                    className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                      currentSession.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200'
                        : currentSession.role === 'HEAD_COACH'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                        : currentSession.role === 'ASSISTANT_COACH'
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                    }`}
                  >
                    Role: {currentSession.role}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Perm: {currentSession.permissionLevel || 'NONE'}
                  </div>
                </div>
              </div>
            )}

            {/* Guard Decision Response */}
            {guardResult ? (
              <div className="space-y-4 mt-4 flex-1">
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-colors ${
                    guardResult.allowed
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {guardResult.allowed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full ${
                          guardResult.allowed
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                            : 'bg-rose-600 text-white dark:bg-rose-500 dark:text-slate-950'
                        }`}
                      >
                        {guardResult.statusCode} {guardResult.allowed ? 'AUTHORIZED' : 'FORBIDDEN'}
                      </span>
                      <span className="font-bold text-xs">
                        {guardResult.allowed ? 'Access Granted' : 'Access Denied & Logged to AUDIT_LOG'}
                      </span>
                    </div>
                    <p className="text-xs mt-2 leading-relaxed font-medium">
                      <span className="font-bold">{language === 'ar' ? 'السبب الأمني:' : 'Security Reason:'} </span>
                      {guardResult.reason}
                    </p>
                    <div className="text-[10px] font-mono opacity-80 mt-2 flex items-center justify-between">
                      <span>Error Code: {guardResult.errorCode || 'NONE'}</span>
                      <span>{new Date(guardResult.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Display Protected Player Roster when authorized */}
                {guardResult.allowed && authorizedPlayers && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>
                        {language === 'ar' ? `كشف اللاعبين المسترجع (${authorizedPlayers.length} لاعب)` : `Authorized Player Roster (${authorizedPlayers.length})`}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        Team: {targetTeam}
                      </span>
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-950/40">
                      {authorizedPlayers.map(p => (
                        <div key={p.playerId} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{p.fullName}</span>
                            <span className="text-slate-400 text-[11px] font-mono block">ID: {p.playerId}</span>
                          </div>
                          <div className="text-end">
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                              {p.teamName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Notice */}
                {!guardResult.allowed && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 rounded-2xl space-y-2 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        {language === 'ar' ? 'تم عزل البيانات وحظر التسريب بنجاح:' : 'Backend Data Isolation Verified:'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                      {language === 'ar'
                        ? 'رفض الخادم تزويد العميل بأي بيانات خاصة بالفريق المطلوب لأن حساب المدرب غير مقترن به في جدول COACH_TEAMS. تم تسجيل المحاولة في جدول AUDIT_LOG.'
                        : 'The backend rejected the request because the coach has no active assignment for this team in COACH_TEAMS. The incident was immediately logged into AUDIT_LOG.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2 mt-4">
                <Lock className="w-10 h-10 text-slate-300 dark:text-slate-700 stroke-1" />
                <p className="text-xs max-w-sm">
                  {language === 'ar'
                    ? 'اختر الهوية والفريق المطلوب ثم اضغط على زر التحقق لمعاينة قرار حارس الأمان الخلفي.'
                    : 'Select a user session and target team, then run a security guard test to inspect the backend response.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attack & Penetration Suite Tab */}
      {activeTab === 'ATTACK_SUITE' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>{language === 'ar' ? 'حزمة سيناريوهات اختراق الأمان وفحص عزل الفرق' : 'Security Penetration & Isolation Test Suite'}</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'اختبر بالضغط سيناريوهات الاختراق وتلاعب المعرفات للتحقق من أن الخادم الخلفي (Google Apps Script) يحبط جميع المحاولات حتى لو تم العبث ببيانات الواجهة الأمامية.'
                : 'Execute common security attack scenarios to verify that the Apps Script backend prevents unauthorized access regardless of client manipulations.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Attack 1 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded">
                  ATTACK-01
                </span>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">TeamID Spoofing</span>
              </div>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'تلاعب المدرب بطلب فريق غير مخصص له' : 'Team ID Parameter Manipulation'}
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'يقوم كابتن أحمد (مخصص لـ براعم 2015 بنات) بإرسال طلب استعلام عن كشف لاعبي (براعم 2014 بنات).'
                  : 'Coach Ahmed requests roster of Coach Mahmoud\'s team ("براعم 2014 بنات").'}
              </p>
              <button
                onClick={() => {
                  runAttackScenario(1);
                  setActiveTab('SIMULATOR');
                }}
                className="w-full py-2 px-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
              >
                {language === 'ar' ? 'تنفيذ الهجوم ⇽' : 'Simulate Attack ⇽'}
              </button>
            </div>

            {/* Attack 2 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded">
                  ATTACK-02
                </span>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Privilege Escalation</span>
              </div>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'محاولة رفع الصلاحيات لدوال المدير' : 'Role Elevation (requireAdmin)'}
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'يقوم مدرب عادي باستدعاء دالة requireAdmin() المخصصة فقط للمدير الإداري للنادي.'
                  : 'Non-admin coach directly calls requireAdmin() to perform administrator operations.'}
              </p>
              <button
                onClick={() => {
                  runAttackScenario(2);
                  setActiveTab('SIMULATOR');
                }}
                className="w-full py-2 px-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
              >
                {language === 'ar' ? 'تنفيذ الهجوم ⇽' : 'Simulate Attack ⇽'}
              </button>
            </div>

            {/* Attack 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded">
                  ATTACK-03
                </span>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Unregistered User</span>
              </div>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'دخول بحساب Google غير مقيد بالسجلات' : 'Unregistered Google Account'}
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'محاولة مستخدم غريب (stranger@gmail.com) استعراض بيانات لاعبي الأكاديمية.'
                  : 'Stranger logged in with arbitrary Google account attempting to query players.'}
              </p>
              <button
                onClick={() => {
                  runAttackScenario(3);
                  setActiveTab('SIMULATOR');
                }}
                className="w-full py-2 px-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
              >
                {language === 'ar' ? 'تنفيذ الهجوم ⇽' : 'Simulate Attack ⇽'}
              </button>
            </div>

            {/* Attack 4 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded">
                  ATTACK-04
                </span>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Inactive Account</span>
              </div>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'محاولة مدرب موقوف الدخول للنظام' : 'Suspended Coach Access Attempt'}
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'محاولة كابتن سامي (حسابه Inactive) الدخول والوصول لكشوفات الفرق.'
                  : 'Suspended coach with Inactive status attempting to access team rosters.'}
              </p>
              <button
                onClick={() => {
                  runAttackScenario(4);
                  setActiveTab('SIMULATOR');
                }}
                className="w-full py-2 px-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
              >
                {language === 'ar' ? 'تنفيذ الهجوم ⇽' : 'Simulate Attack ⇽'}
              </button>
            </div>

            {/* Scenario 5: Legitimate Admin */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded">
                  AUTHORIZED-05
                </span>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">Admin Global Access</span>
              </div>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'وصول المدير الإداري لجميع الفرق' : 'Administrator Global Team Access'}
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'المدير الإداري يمتلك تفويضاً شاملاً للوصول لكافة الفرق وإدارة المستخدمين.'
                  : 'Administrator holds verified global clearance to all teams and system configurations.'}
              </p>
              <button
                onClick={() => {
                  runAttackScenario(5);
                  setActiveTab('SIMULATOR');
                }}
                className="w-full py-2 px-3 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition"
              >
                {language === 'ar' ? 'فحص المدير ⇽' : 'Simulate Admin ⇽'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Audit Trail Tab */}
      {activeTab === 'AUDIT_TRAIL' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'سجل الأمان والعمليات (AUDIT_LOG)' : 'Live Security Audit Trail (AUDIT_LOG Sheet)'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'جميع محاولات تسجيل الدخول وعمليات الحظر وتلاعب الصلاحيات يتم تدوينها بشكل فوري وغير قابل للتعديل.'
                  : 'Tamper-evident logs of authentication, role verification, and access denials.'}
              </p>
            </div>
            <button
              onClick={refreshAuditLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تحديث السجل' : 'Refresh Logs'}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Log ID</th>
                    <th className="p-3">{language === 'ar' ? 'المستخدم' : 'User Email'}</th>
                    <th className="p-3">{language === 'ar' ? 'الدور' : 'Role'}</th>
                    <th className="p-3">{language === 'ar' ? 'الحدث' : 'Action'}</th>
                    <th className="p-3">{language === 'ar' ? 'النوع / الكيان' : 'Entity'}</th>
                    <th className="p-3">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
                    <th className="p-3">{language === 'ar' ? 'الوقت' : 'Timestamp'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {auditLogs.length > 0 ? (
                    auditLogs.map(log => {
                      const isViolation = log.Action.includes('DENIED') || log.Action.includes('BLOCKED') || log.Action.includes('FAILED') || log.Action.includes('UNAUTHORIZED');
                      return (
                        <tr key={log.LogID} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isViolation ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                          <td className="p-3 text-slate-500 font-semibold">{log.LogID}</td>
                          <td className="p-3 text-slate-900 dark:text-slate-100 font-sans font-medium">{log.UserEmail}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.UserRole === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                              log.UserRole === 'HEAD_COACH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {log.UserRole}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isViolation
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {log.Action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 font-sans">{log.EntityType}: {log.EntityID}</td>
                          <td className="p-3 text-slate-800 dark:text-slate-200 font-sans max-w-xs truncate" title={log.Details}>
                            {log.Details}
                          </td>
                          <td className="p-3 text-slate-500">{new Date(log.Timestamp).toLocaleTimeString()}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-sans">
                        {language === 'ar' ? 'لا توجد سجلات أمان مسجلة حالياً.' : 'No audit records found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
