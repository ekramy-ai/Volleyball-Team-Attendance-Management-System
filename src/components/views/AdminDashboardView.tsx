import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, UserCheck, Layers, ClipboardCheck, BarChart3, ShieldCheck,
  Activity, AlertCircle, Clock, UserX, Filter, ArrowUpDown, RefreshCw,
  Search, ChevronUp, ChevronDown, AlertTriangle, CheckCircle2,
  BarChart2, Trophy, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { ClubAnalyticsReport, TeamAnalyticsItem, PlayerAnalyticsSummary } from '../../types/database';

/* ── Helpers ──────────────────────────────────────────────── */
function fmtPct(val: number): string { return `${Number(val).toFixed(1)}%`; }

function getDisciplineTier(score: number) {
  if (score >= 85) return { label: 'Excellent', labelAr: 'ممتاز', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', hex: '#10b981' };
  if (score >= 70) return { label: 'Good',      labelAr: 'جيد',    color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    hex: '#3b82f6' };
  if (score >= 50) return { label: 'Warning',   labelAr: 'تحذير',  color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   hex: '#f59e0b' };
  return                  { label: 'Critical',  labelAr: 'حرج',    color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    hex: '#f43f5e' };
}

function MiniBar({ value, color = '#10b981' }: { value: number; color?: string }) {
  return (
    <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} />
    </div>
  );
}

function CircleProgress({ value, size = 36, stroke = 3.5, color = '#10b981' }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="currentColor" className="text-slate-200 dark:text-slate-700" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke={color} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

/* StatCard */
interface SCProps { label: string; labelAr: string; value: number|string; sublabel: string; sublabelAr: string; icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string; language: string; }
function StatCard({ label, labelAr, value, sublabel, sublabelAr, icon, colorClass, bgClass, borderClass, language }: SCProps) {
  return (
    <div className={`p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${bgClass} ${borderClass}`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[11px] font-bold ${colorClass} opacity-75`}>{language === 'ar' ? labelAr : label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgClass} ${colorClass} border ${borderClass}`}>{icon}</div>
      </div>
      <div className={`text-2xl font-black ${colorClass}`}>{value}</div>
      <div className={`text-[10px] font-semibold mt-0.5 ${colorClass} opacity-60`}>{language === 'ar' ? sublabelAr : sublabel}</div>
    </div>
  );
}

/* PlayerInsightCard */
interface PICProps { title: string; subtitle: string; icon: React.ReactNode; iconBg: string; iconColor: string; players: PlayerAnalyticsSummary[]; emptyMsg: string; renderValue: (p: PlayerAnalyticsSummary) => React.ReactNode; rowBg: string; rankColor: string; }
function PlayerInsightCard({ title, subtitle, icon, iconBg, iconColor, players, emptyMsg, renderValue, rowBg, rankColor }: PICProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>{icon}</div>
        <div>
          <h3 className="font-black text-xs text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-[10px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {players.length === 0 ? (
          <div className="py-5 text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span className="text-xs text-slate-400 font-semibold">{emptyMsg}</span>
          </div>
        ) : players.map((p, idx) => (
          <div key={p.playerId} className={`flex items-center gap-3 p-2.5 rounded-2xl transition-colors ${rowBg}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${rankColor}`}>
              {idx < 3 ? ['①', '②', '③'][idx] : idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{p.fullName}</div>
              <div className="text-[10px] text-slate-400 truncate">{p.teamName}</div>
            </div>
            {renderValue(p)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export const AdminDashboardView: React.FC = () => {
  const { language, isRtl, availableTeams, currentUser } = useApp();

  const [report, setReport]           = useState<ClubAnalyticsReport | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [startDate, setStartDate]               = useState('');
  const [endDate, setEndDate]                   = useState('');
  const [selectedTeam, setSelectedTeam]         = useState('ALL');
  const [selectedBirthYear, setSelectedBirthYear] = useState('ALL');
  const [selectedGender, setSelectedGender]     = useState('ALL');

  // Sorting
  const [sortBy, setSortBy]       = useState<'attendance'|'absence'|'lateness'|'discipline'>('attendance');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');

  // UI state
  const [activeSection, setActiveSection] = useState<'overview'|'players'>('overview');
  const [playerSearch, setPlayerSearch]   = useState('');
  const [teamsPage, setTeamsPage]         = useState(0);
  const [expandedTeam, setExpandedTeam]   = useState<string|null>(null);
  const TEAMS_PER_PAGE = 10;

  const fetchAnalytics = useCallback(async () => {
    try {
      if (!report) setLoading(true); else setRefreshing(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate)   params.append('endDate', endDate);
      if (selectedTeam !== 'ALL')       params.append('teamName', selectedTeam);
      if (selectedBirthYear !== 'ALL')  params.append('teamBirthYear', selectedBirthYear);
      if (selectedGender !== 'ALL')     params.append('gender', selectedGender);
      params.append('sortBy', sortBy);
      const email = currentUser?.userEmail || 'admin@volleyball.club';
      const res = await fetch(`/api/analytics/admin-dashboard?${params}`, {
        headers: { 'x-admin-email': email, 'x-user-email': email }
      });
      const json = await res.json();
      const data = json.report || json.data;
      if (json.success && data) { setReport(data); setLastUpdated(new Date()); }
    } catch (e) { console.error('Analytics fetch error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [startDate, endDate, selectedTeam, selectedBirthYear, selectedGender, sortBy, currentUser]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { setTeamsPage(0); }, [sortBy, sortOrder, selectedTeam, selectedBirthYear, selectedGender]);

  const resetFilters = () => {
    setStartDate(''); setEndDate(''); setSelectedTeam('ALL');
    setSelectedBirthYear('ALL'); setSelectedGender('ALL');
    setSortBy('attendance'); setSortOrder('desc');
  };

  const toggleSort = (by: typeof sortBy) => {
    if (sortBy === by) setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
    else { setSortBy(by); setSortOrder('desc'); }
  };

  const overview       = report?.overview;
  const playerAnalytics = report?.playerAnalytics;
  const filterOptions  = report?.filterOptions;

  const teams = useMemo<TeamAnalyticsItem[]>(() => {
    const arr = [...(report?.teams || [])];
    arr.sort((a, b) => {
      const diff =
        sortBy === 'attendance' ? a.attendanceRate - b.attendanceRate :
        sortBy === 'absence'    ? a.absenceRate - b.absenceRate :
        sortBy === 'lateness'   ? a.lateCount - b.lateCount :
                                  a.disciplineScore - b.disciplineScore;
      return sortOrder === 'desc' ? -diff : diff;
    });
    return arr;
  }, [report?.teams, sortBy, sortOrder]);

  const totalPages = Math.ceil(teams.length / TEAMS_PER_PAGE);
  const pagedTeams = teams.slice(teamsPage * TEAMS_PER_PAGE, (teamsPage + 1) * TEAMS_PER_PAGE);

  const filteredAttention = useMemo(() => {
    const list = playerAnalytics?.requiringAttention || [];
    if (!playerSearch.trim()) return list;
    const q = playerSearch.toLowerCase();
    return list.filter(p => p.fullName.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q) || p.playerId.toLowerCase().includes(q));
  }, [playerAnalytics, playerSearch]);

  if (loading && !report) return <LoadingState type="skeleton" rows={5} />;

  const ar = language === 'ar';
  const activeFilters = [startDate, endDate, selectedTeam !== 'ALL', selectedBirthYear !== 'ALL', selectedGender !== 'ALL'].filter(Boolean).length;

  return (
    <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── HERO BANNER ───────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/60"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)' }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)', transform: 'translate(30%, -50%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', transform: 'translate(-30%, 50%)' }} />
        <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none"
          style={{ fontSize: '130px', lineHeight: 1, opacity: 0.04 }}>🏐</div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black"
                style={{ background: 'rgba(249,115,22,0.2)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.35)' }}>
                <ShieldCheck className="w-3 h-3" />
                {ar ? 'لوحة القيادة الإدارية' : 'Central Admin Dashboard'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}>
                {ar ? 'صلاحيات المشرف' : 'Admin Only'}
              </span>
              {activeFilters > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: 'rgba(245,158,11,0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.35)' }}>
                  <Filter className="w-3 h-3" /> {activeFilters} {ar ? 'فلاتر' : 'filters'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                {ar ? 'المنظومة التحليلية – الكرة الطائرة' : 'Volleyball Club Analytics Hub'}
              </h1>
              <p className="text-xs mt-1 leading-relaxed max-w-xl" style={{ color: '#94a3b8' }}>
                {ar ? 'متابعة حية لإحصائيات اليوم ونسب الحضور والغياب ومؤشرات انضباط الفرق وتحليلات اللاعبين.' : "Live oversight of today's attendance, squad discipline, and player analytics across all teams."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button onClick={fetchAnalytics} disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
                style={{ background: '#1e293b', color: '#f8fafc', borderColor: '#334155' }}>
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? (ar ? 'تحديث...' : 'Refreshing...') : (ar ? 'تحديث البيانات' : 'Refresh Analytics')}
              </button>
              {lastUpdated && (
                <span className="text-[11px] font-mono" style={{ color: '#64748b' }}>
                  {ar ? 'آخر تحديث: ' : 'Updated: '}{lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {overview && (
            <div className="grid grid-cols-2 gap-2 md:min-w-[200px]">
              {[
                { label: ar ? 'حاضر' : 'Present',  val: overview.presentToday,  c: '#10b981' },
                { label: ar ? 'غائب' : 'Absent',   val: overview.absentToday,   c: '#f43f5e' },
                { label: ar ? 'تأخير' : 'Late',    val: overview.lateToday,     c: '#f59e0b' },
                { label: ar ? 'إذن' : 'Excused',   val: overview.excusedToday,  c: '#60a5fa' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-2xl text-center"
                  style={{ background: 'rgba(30,41,59,0.85)', border: '1px solid rgba(71,85,105,0.5)' }}>
                  <div className="text-xl font-black" style={{ color: item.c }}>{item.val}</div>
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#94a3b8' }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 7 METRICS ─────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            {ar ? 'نظرة عامة على النادي' : 'Club Overview'}
          </h2>
          <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg">
            {ar ? 'اليوم: ' : 'Today: '}{overview?.todayDate || '—'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total Players"  labelAr="إجمالي اللاعبين"  value={overview?.totalPlayers ?? 0}  sublabel="Registered"    sublabelAr="مسجلين"       icon={<Users className="w-4 h-4"/>}         colorClass="text-emerald-700 dark:text-emerald-300" bgClass="bg-emerald-50 dark:bg-emerald-950/20" borderClass="border-emerald-200 dark:border-emerald-900/40" language={language}/>
          <StatCard label="Total Teams"    labelAr="إجمالي الفرق"     value={overview?.totalTeams ?? 0}    sublabel="Active Squads" sublabelAr="فرق معتمدة"  icon={<Layers className="w-4 h-4"/>}        colorClass="text-amber-700 dark:text-amber-300"   bgClass="bg-amber-50 dark:bg-amber-950/20"   borderClass="border-amber-200 dark:border-amber-900/40"   language={language}/>
          <StatCard label="Total Coaches"  labelAr="إجمالي المدربين"  value={overview?.totalCoaches ?? 0}  sublabel="Staff"         sublabelAr="الجهاز الفني" icon={<UserCheck className="w-4 h-4"/>}     colorClass="text-blue-700 dark:text-blue-300"     bgClass="bg-blue-50 dark:bg-blue-950/20"     borderClass="border-blue-200 dark:border-blue-900/40"     language={language}/>
          <StatCard label="Present Today"  labelAr="حاضر اليوم"       value={overview?.presentToday ?? 0}  sublabel="On Time"       sublabelAr="في الموعد"   icon={<CheckCircle2 className="w-4 h-4"/>}  colorClass="text-emerald-700 dark:text-emerald-300" bgClass="bg-emerald-50 dark:bg-emerald-950/20" borderClass="border-emerald-300 dark:border-emerald-800/60" language={language}/>
          <StatCard label="Absent Today"   labelAr="غائب اليوم"       value={overview?.absentToday ?? 0}   sublabel="No Show"       sublabelAr="غير مسجل"    icon={<UserX className="w-4 h-4"/>}         colorClass="text-rose-700 dark:text-rose-300"     bgClass="bg-rose-50 dark:bg-rose-950/20"     borderClass="border-rose-300 dark:border-rose-800/60"     language={language}/>
          <StatCard label="Late Today"     labelAr="تأخير اليوم"      value={overview?.lateToday ?? 0}     sublabel="Late Check-in" sublabelAr="حضور متأخر"  icon={<Clock className="w-4 h-4"/>}         colorClass="text-amber-700 dark:text-amber-300"   bgClass="bg-amber-50 dark:bg-amber-950/20"   borderClass="border-amber-300 dark:border-amber-800/60"   language={language}/>
          <StatCard label="Excused Today"  labelAr="إذن اليوم"        value={overview?.excusedToday ?? 0}  sublabel="Excused"       sublabelAr="إذن رسمي"    icon={<ClipboardCheck className="w-4 h-4"/>} colorClass="text-blue-700 dark:text-blue-300"     bgClass="bg-blue-50 dark:bg-blue-950/20"     borderClass="border-blue-300 dark:border-blue-800/60"     language={language}/>
        </div>
      </div>

      {/* ── FILTERS ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-500" />
            <h3 className="font-black text-xs text-slate-900 dark:text-slate-100">{ar ? 'تصفية التحليلات' : 'Analytics Filters'}</h3>
            {activeFilters > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">{activeFilters}</span>}
          </div>
          <button onClick={resetFilters} className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors">
            <X className="w-3.5 h-3.5" />{ar ? 'إعادة الضبط' : 'Reset All'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { lbl: ar ? 'من تاريخ' : 'From Date', type: 'date', val: startDate, set: setStartDate },
            { lbl: ar ? 'إلى تاريخ' : 'To Date',  type: 'date', val: endDate,   set: setEndDate   },
          ].map(({ lbl, type, val, set }) => (
            <div key={lbl}>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">{lbl}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition" />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">{ar ? 'الفريق' : 'Team'}</label>
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition">
              <option value="ALL">{ar ? 'جميع الفرق' : 'All Teams'}</option>
              {(filterOptions?.availableTeams || availableTeams).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">{ar ? 'مواليد الفريق' : 'Birth Year'}</label>
            <select value={selectedBirthYear} onChange={e => setSelectedBirthYear(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition">
              <option value="ALL">{ar ? 'جميع المواليد' : 'All Birth Years'}</option>
              {(filterOptions?.availableBirthYears || []).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">{ar ? 'النوع' : 'Gender'}</label>
            <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition">
              <option value="ALL">{ar ? 'الكل' : 'All Genders'}</option>
              {(filterOptions?.availableGenders || ['إناث', 'ذكور', 'بنات', 'بنين']).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        {([
          { id: 'overview' as const, label: ar ? 'تحليلات الفرق' : 'Team Analytics',   icon: <BarChart3 className="w-4 h-4"/>, count: teams.length, cColor: '' },
          { id: 'players'  as const, label: ar ? 'تحليلات اللاعبين' : 'Player Analytics', icon: <Users className="w-4 h-4"/>,    count: playerAnalytics?.requiringAttention?.length, cColor: 'rose' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all rounded-t-xl border-b-2 -mb-px ${
              activeSection === tab.id
                ? 'bg-orange-500/5 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
            }`}>
            {tab.icon}<span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${tab.cColor === 'rose' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ TEAM ANALYTICS ════════════════════════════════════════ */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Sort bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400"/>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ar ? 'ترتيب حسب:' : 'Sort By:'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: 'attendance' as const, label: ar ? 'الأعلى حضوراً' : 'Highest Attendance', hex: '#10b981' },
                { key: 'absence'    as const, label: ar ? 'الأعلى غياباً'  : 'Highest Absence',    hex: '#f43f5e' },
                { key: 'lateness'   as const, label: ar ? 'الأكثر تأخيراً' : 'Most Lateness',       hex: '#f59e0b' },
                { key: 'discipline' as const, label: ar ? 'درجة الانضباط'  : 'Discipline Score',    hex: '#3b82f6' },
              ]).map(({ key, label, hex }) => {
                const active = sortBy === key;
                return (
                  <button key={key} onClick={() => toggleSort(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      active ? 'text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                    style={active ? { backgroundColor: hex, borderColor: hex } : {}}>
                    {label}
                    {active && (sortOrder === 'desc' ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {refreshing && <div className="h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse"/>}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                    <th className="py-3.5 px-4 text-left font-black text-slate-500 dark:text-slate-400">#</th>
                    <th className="py-3.5 px-4 text-left font-black text-slate-500 dark:text-slate-400">{ar ? 'الفريق' : 'Team'}</th>
                    <th className="py-3.5 px-3 text-center font-black text-slate-500 dark:text-slate-400">{ar ? 'المواليد / النوع' : 'Birth / Gender'}</th>
                    <th className="py-3.5 px-3 text-center font-black text-slate-500 dark:text-slate-400">{ar ? 'اللاعبين' : 'Players'}</th>
                    <th className="py-3.5 px-3 text-center font-black text-slate-500 dark:text-slate-400">{ar ? 'الحصص' : 'Sessions'}</th>
                    <th className="py-3.5 px-3 text-center font-black text-slate-500 dark:text-slate-400 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => toggleSort('attendance')}>
                      <div className="flex items-center justify-center gap-1">{ar ? 'نسبة الحضور' : 'Attendance %'}{sortBy==='attendance' && (sortOrder==='desc'?<ChevronDown className="w-3 h-3"/>:<ChevronUp className="w-3 h-3"/>)}</div>
                    </th>
                    <th className="py-3.5 px-3 text-center font-black text-slate-500 dark:text-slate-400 cursor-pointer hover:text-rose-600 transition-colors" onClick={() => toggleSort('absence')}>
                      <div className="flex items-center justify-center gap-1">{ar ? 'نسبة الغياب' : 'Absence %'}{sortBy==='absence' && (sortOrder==='desc'?<ChevronDown className="w-3 h-3"/>:<ChevronUp className="w-3 h-3"/>)}</div>
                    </th>
                    <th className="py-3.5 px-3 text-center font-black text-slate-500 dark:text-slate-400 cursor-pointer hover:text-amber-600 transition-colors" onClick={() => toggleSort('lateness')}>
                      <div className="flex items-center justify-center gap-1">{ar ? 'تأخير' : 'Late'}{sortBy==='lateness' && (sortOrder==='desc'?<ChevronDown className="w-3 h-3"/>:<ChevronUp className="w-3 h-3"/>)}</div>
                    </th>
                    <th className="py-3.5 px-4 text-center font-black text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => toggleSort('discipline')}>
                      <div className="flex items-center justify-center gap-1">{ar ? 'درجة الانضباط' : 'Discipline'}{sortBy==='discipline' && (sortOrder==='desc'?<ChevronDown className="w-3 h-3"/>:<ChevronUp className="w-3 h-3"/>)}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {pagedTeams.length === 0 ? (
                    <tr><td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <BarChart2 className="w-8 h-8 opacity-40"/>
                        <span className="text-xs font-semibold">{ar ? 'لا توجد فرق مطابقة للتصفية.' : 'No teams match current filters.'}</span>
                      </div>
                    </td></tr>
                  ) : pagedTeams.map((team, idx) => {
                    const gIdx = teamsPage * TEAMS_PER_PAGE + idx + 1;
                    const disc = getDisciplineTier(team.disciplineScore);
                    const expanded = expandedTeam === team.teamName;
                    const isFemale = team.gender?.includes('بنات') || team.gender?.includes('إناث') || team.gender?.toLowerCase().includes('female');
                    return (
                      <React.Fragment key={team.teamName}>
                        <tr onClick={() => setExpandedTeam(expanded ? null : team.teamName)}
                          className="hover:bg-orange-50/40 dark:hover:bg-orange-900/5 transition-colors cursor-pointer">
                          <td className="py-3.5 px-4 text-[11px] font-black text-slate-400">{gIdx <= 3 ? ['🥇','🥈','🥉'][gIdx-1] : `#${gIdx}`}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(245,158,11,0.1))', border: '1px solid rgba(249,115,22,0.2)' }}>🏐</div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{team.teamName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{team.totalAttendances} {ar ? 'سجل' : 'records'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              {team.teamBirthYear && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">{team.teamBirthYear}</span>}
                              {team.gender && <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isFemale ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400' : 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400'}`}>{team.gender}</span>}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{team.playerCount}</span>
                              <Users className="w-3 h-3 text-slate-400"/>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400">{team.sessionCount}</td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-black text-emerald-600 dark:text-emerald-400">{fmtPct(team.attendanceRate)}</span>
                              <MiniBar value={team.attendanceRate} color="#10b981"/>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-black text-rose-600 dark:text-rose-400">{fmtPct(team.absenceRate)}</span>
                              <MiniBar value={team.absenceRate} color="#f43f5e"/>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${team.lateCount > 5 ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                              {team.lateCount}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="relative">
                                <CircleProgress value={team.disciplineScore} color={disc.hex}/>
                                <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-black ${disc.color}`} style={{ transform: 'rotate(0)' }}>
                                  {Math.round(team.disciplineScore)}
                                </span>
                              </div>
                              <span className={`hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${disc.bg} ${disc.color} ${disc.border}`}>
                                {ar ? disc.labelAr : disc.label}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-gradient-to-r from-orange-50/30 to-transparent dark:from-orange-900/5 dark:to-transparent">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {[
                                  { label: ar ? 'إجمالي السجلات' : 'Total Records', val: team.totalAttendances, c: '#64748b' },
                                  { label: ar ? 'حاضر' : 'Present',                val: team.presentCount,     c: '#10b981' },
                                  { label: ar ? 'غائب' : 'Absent',                 val: team.absentCount,      c: '#f43f5e' },
                                  { label: ar ? 'متأخر' : 'Late',                  val: team.lateCount,        c: '#f59e0b' },
                                  { label: ar ? 'بإذن' : 'Excused',                val: team.excusedCount,     c: '#3b82f6' },
                                ].map(item => (
                                  <div key={item.label} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                                    <div className="text-lg font-black" style={{ color: item.c }}>{item.val}</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{item.label}</div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {ar ? `عرض ${teamsPage*TEAMS_PER_PAGE+1}–${Math.min((teamsPage+1)*TEAMS_PER_PAGE, teams.length)} من ${teams.length}` : `Showing ${teamsPage*TEAMS_PER_PAGE+1}–${Math.min((teamsPage+1)*TEAMS_PER_PAGE, teams.length)} of ${teams.length} teams`}
                </span>
                <div className="flex items-center gap-2">
                  <button disabled={teamsPage===0} onClick={() => setTeamsPage(p => p-1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    <ChevronLeft className="w-4 h-4"/>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setTeamsPage(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${i===teamsPage ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {i+1}
                    </button>
                  ))}
                  <button disabled={teamsPage===totalPages-1} onClick={() => setTeamsPage(p => p+1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ PLAYER ANALYTICS ══════════════════════════════════════ */}
      {activeSection === 'players' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlayerInsightCard
              title={ar ? 'الأعلى حضوراً' : 'Highest Attendance'}
              subtitle={ar ? 'أفضل المواظبين' : 'Most consistent players'}
              icon={<Trophy className="w-4 h-4"/>} iconBg="bg-emerald-500/10" iconColor="text-emerald-500"
              players={playerAnalytics?.highestAttendance || []}
              emptyMsg={ar ? 'لا توجد بيانات.' : 'No data.'}
              renderValue={p => (
                <div className="text-end">
                  <div className="font-black text-xs text-emerald-600 dark:text-emerald-400">{typeof p.attendanceRate === 'number' ? fmtPct(p.attendanceRate) : `${p.attendanceRate}%`}</div>
                  <div className="text-[10px] text-slate-400">{p.presentCount} {ar ? 'حضور' : 'pres.'}</div>
                </div>
              )}
              rowBg="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10"
              rankColor="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
            />
            <PlayerInsightCard
              title={ar ? 'الأكثر غياباً' : 'Highest Absence'}
              subtitle={ar ? 'أكثر اللاعبين غياباً' : 'Players with most absences'}
              icon={<UserX className="w-4 h-4"/>} iconBg="bg-rose-500/10" iconColor="text-rose-500"
              players={playerAnalytics?.highestAbsence || []}
              emptyMsg={ar ? 'لا توجد حالات غياب.' : 'No high absence records.'}
              renderValue={p => (
                <div className="text-end">
                  <div className="font-black text-xs text-rose-600 dark:text-rose-400">{p.absentCount} {ar ? 'غياب' : 'absent'}</div>
                  <div className="text-[10px] text-slate-400">{typeof p.absenceRate === 'number' ? fmtPct(p.absenceRate) : `${p.absenceRate}%`}</div>
                </div>
              )}
              rowBg="hover:bg-rose-50/40 dark:hover:bg-rose-950/10"
              rankColor="text-rose-600 dark:text-rose-400 bg-rose-500/10"
            />
            <PlayerInsightCard
              title={ar ? 'المتكرر تأخيرهم' : 'Repeated Lateness'}
              subtitle={ar ? 'أكثر اللاعبين تأخراً' : 'Players with repeated lateness'}
              icon={<Clock className="w-4 h-4"/>} iconBg="bg-amber-500/10" iconColor="text-amber-500"
              players={playerAnalytics?.repeatedLateness || []}
              emptyMsg={ar ? 'لا توجد تأخيرات متكررة.' : 'No repeated lateness records.'}
              renderValue={p => (
                <div className="text-end">
                  <div className="font-black text-xs text-amber-600 dark:text-amber-400">{p.lateCount} {ar ? 'مرة' : 'times'}</div>
                  <div className="text-[10px] text-slate-400">{ar ? 'تأخير' : 'late'}</div>
                </div>
              )}
              rowBg="hover:bg-amber-50/40 dark:hover:bg-amber-950/10"
              rankColor="text-amber-600 dark:text-amber-400 bg-amber-500/10"
            />
          </div>

          {/* Attention Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-rose-200 dark:border-rose-900/40">
            <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3"
              style={{ background: 'linear-gradient(to right, rgba(244,63,94,0.05), transparent)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-500"/>
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{ar ? 'اللاعبون يحتاجون متابعة إدارية' : 'Players Requiring Attention'}</h3>
                  <p className="text-[10px] text-slate-500">{ar ? 'غياب متكرر أو تأخير أو ضعف الحضور' : 'High absence, repeated lateness, or low attendance'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
                  <input type="text" value={playerSearch} onChange={e => setPlayerSearch(e.target.value)}
                    placeholder={ar ? 'بحث...' : 'Search player...'}
                    className="pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 w-40 transition"/>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-xs border border-rose-500/20">
                  {filteredAttention.length} {ar ? 'حالة' : 'cases'}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 text-left font-black text-slate-500">{ar ? 'الكود' : 'ID'}</th>
                    <th className="py-3 px-4 text-left font-black text-slate-500">{ar ? 'اسم اللاعب' : 'Player Name'}</th>
                    <th className="py-3 px-3 text-left font-black text-slate-500">{ar ? 'الفريق' : 'Team'}</th>
                    <th className="py-3 px-3 text-center font-black text-slate-500">{ar ? 'الجلسات' : 'Sessions'}</th>
                    <th className="py-3 px-3 text-center font-black text-slate-500">{ar ? 'الحضور %' : 'Attendance %'}</th>
                    <th className="py-3 px-3 text-center font-black text-slate-500">{ar ? 'الغياب' : 'Absences'}</th>
                    <th className="py-3 px-3 text-center font-black text-slate-500">{ar ? 'التأخير' : 'Lateness'}</th>
                    <th className="py-3 px-4 text-left font-black text-slate-500">{ar ? 'سبب المتابعة' : 'Reason'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredAttention.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center">
                      {playerSearch ? (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Search className="w-7 h-7 opacity-40"/>
                          <span className="text-xs font-semibold">{ar ? `لا نتائج لـ: ${playerSearch}` : `No results for: ${playerSearch}`}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500"/>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {ar ? 'ممتاز! لا يوجد لاعبون يحتاجون متابعة.' : 'Excellent! No players currently require attention.'}
                          </span>
                        </div>
                      )}
                    </td></tr>
                  ) : filteredAttention.map((p, i) => {
                    const rate = typeof p.attendanceRate === 'number' ? p.attendanceRate : parseFloat(String(p.attendanceRate));
                    const lowAtt = rate < 60;
                    return (
                      <tr key={p.playerId} className={`hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors ${i%2===1 ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''}`}>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">{p.playerId}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{p.fullName}</div>
                          {p.shortName && p.shortName !== p.fullName && <div className="text-[10px] text-slate-400">{p.shortName}</div>}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">{p.teamName}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{p.totalSessions}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-black text-xs ${lowAtt ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {typeof p.attendanceRate === 'number' ? fmtPct(p.attendanceRate) : `${p.attendanceRate}%`}
                            </span>
                            <MiniBar value={rate} color={lowAtt ? '#f43f5e' : '#94a3b8'}/>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${p.absentCount >= 2 ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {p.absentCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${p.lateCount >= 3 ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {p.lateCount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {p.attentionReason ? (
                            <div className="flex flex-wrap gap-1">
                              {String(p.attentionReason).split(',').map(r => r.trim()).filter(Boolean).map(reason => (
                                <span key={reason} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 text-[10px] font-bold">
                                  <AlertTriangle className="w-2.5 h-2.5"/>{reason}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
