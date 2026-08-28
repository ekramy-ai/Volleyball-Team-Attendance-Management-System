import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Check,
  X,
  Clock,
  AlertCircle,
  AlertTriangle,
  Save,
  CheckCircle2,
  Users,
  Calendar,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Eye,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { AttendanceRecord, AttendanceStatus, ExcuseType, TrainingSessionRecord } from '../../types/database';

interface PlayerAttendanceState {
  playerId: string;
  fullName: string;
  jerseyNumber?: string | number;
  phone?: string;
  status: AttendanceStatus;
  arrivalTime: string; // HH:mm
  lateMinutes: number;
  excuseType: ExcuseType;
  notes: string;
}

const EXCUSE_OPTIONS: { value: ExcuseType; labelAr: string; labelEn: string; icon: string }[] = [
  { value: 'Injury', labelAr: 'إصابة رياضية', labelEn: 'Sports Injury', icon: '🩹' },
  { value: 'Illness', labelAr: 'مرض / عذر صحي', labelEn: 'Illness / Sick', icon: '🩺' },
  { value: 'School', labelAr: 'ظروف دراسية', labelEn: 'School Commitment', icon: '📚' },
  { value: 'Exams', labelAr: 'امتحانات فصلية', labelEn: 'Academic Exams', icon: '📝' },
  { value: 'Travel', labelAr: 'سفر خارج المدينة', labelEn: 'Travel / Out of Town', icon: '✈️' },
  { value: 'Family Emergency', labelAr: 'ظرف عائلي طارئ', labelEn: 'Family Emergency', icon: '🏠' },
  { value: 'Previous Permission', labelAr: 'إذن مسبق معتمد', labelEn: 'Pre-Approved Permission', icon: '📋' },
  { value: 'Other', labelAr: 'أسباب أخرى', labelEn: 'Other Reasons', icon: '💬' },
];

export const CoachAttendanceView: React.FC = () => {
  const { currentUser, t, language, selectedTeam, setSelectedTeam } = useApp();
  const isAr = language === 'ar';

  // 1. Team & Session Selection State
  const authorizedTeams = currentUser?.authorizedTeams || [];
  const activeTeam = selectedTeam || authorizedTeams[0] || '';

  const [sessions, setSessions] = useState<TrainingSessionRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);

  // 2. Player Roster & Attendance State
  const [roster, setRoster] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, PlayerAttendanceState>>({});
  const [rosterLoading, setRosterLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL');

  // 3. Security & Validation State
  const [authError, setAuthError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // 4. Save & Result State
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalStatsModal, setFinalStatsModal] = useState<{
    show: boolean;
    session: TrainingSessionRecord | null;
    stats: {
      present: number;
      late: number;
      absent: number;
      excused: number;
      total: number;
      attendanceRate: string;
    };
  } | null>(null);

  // 5. Quick Create Session Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [quickDate, setQuickDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickStartTime, setQuickStartTime] = useState<string>('18:00');
  const [quickEndTime, setQuickEndTime] = useState<string>('19:30');
  const [quickLocation, setQuickLocation] = useState<string>('الصالة المغطاة 1 - الملعب الرئيسي');
  const [creatingSession, setCreatingSession] = useState<boolean>(false);
  const [createSessionError, setCreateSessionError] = useState<string | null>(null);

  // Find active session object
  const currentSession = useMemo(() => {
    return sessions.find(s => s.SessionID === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  // Fetch sessions for active team
  const fetchTeamSessions = async (team: string) => {
    if (!team) return;
    try {
      setSessionsLoading(true);
      setAuthError(null);

      const res = await fetch(`/api/sessions?teamName=${encodeURIComponent(team)}`, {
        headers: { 'x-user-email': currentUser?.userEmail || '' }
      });
      const data = await res.json();

      if (data.success) {
        const teamSessions: TrainingSessionRecord[] = data.sessions || [];
        setSessions(teamSessions);

        // Auto-select latest or first scheduled session
        if (teamSessions.length > 0) {
          const defaultSession = teamSessions.find(s => s.Status !== 'Cancelled') || teamSessions[0];
          setSelectedSessionId(defaultSession.SessionID);
        } else {
          setSelectedSessionId('');
        }
      } else {
        setAuthError(data.error || 'Failed to fetch sessions');
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Fetch team players from Master Player Database
  const fetchRoster = async (team: string, sessionId: string) => {
    if (!team) return;
    try {
      setRosterLoading(true);
      setAuthError(null);

      // 1. Guard check team authorization
      const authRes = await fetch('/api/auth/require-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.userEmail || '',
          teamName: team
        })
      });
      const authData = await authRes.json();

      if (!authData.success || !authData.guard?.allowed) {
        setAuthError(authData.guard?.reason || 'غير مصرح لك بالوصول لبيانات هذا الفريق');
        setAuthChecked(false);
        setRoster([]);
        setAttendanceData({});
        return;
      }

      setAuthChecked(true);

      // 2. Fetch Master Players for this team
      const rosterRes = await fetch(`/api/master/players/by-team?team=${encodeURIComponent(team)}`);
      const rosterData = await rosterRes.json();

      if (!rosterData.success) {
        setAuthError(rosterData.error || 'فشل في استرداد قائمة اللاعبين من قاعدة البيانات الرئيسية');
        return;
      }

      const players = rosterData.players || [];
      setRoster(players);

      // 3. Fetch existing attendance records if any
      let existingRecords: AttendanceRecord[] = [];
      if (sessionId) {
        try {
          const attRes = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/attendance`);
          const attJson = await attRes.json();
          if (attJson.success && Array.isArray(attJson.records)) {
            existingRecords = attJson.records;
          }
        } catch (e) {
          console.warn('Could not fetch existing attendance:', e);
        }
      }

      const existingMap = new Map(existingRecords.map(r => [r.PlayerID, r]));

      // 4. Initialize attendance state: default every player to PRESENT if not already recorded
      const initialMap: Record<string, PlayerAttendanceState> = {};
      const sessionObj = sessions.find(s => s.SessionID === sessionId);
      const defaultStartTime = sessionObj?.StartTime || '18:00';

      players.forEach((p: any) => {
        const exist = existingMap.get(p.playerId);
        if (exist) {
          initialMap[p.playerId] = {
            playerId: p.playerId,
            fullName: p.fullName,
            jerseyNumber: p.jerseyNumber || '',
            phone: p.phone || '',
            status: exist.AttendanceStatus,
            arrivalTime: exist.ArrivalTime || defaultStartTime,
            lateMinutes: exist.LateMinutes || 0,
            excuseType: (exist.ExcuseType as ExcuseType) || 'Injury',
            notes: exist.Notes || ''
          };
        } else {
          // Standard Default: ALL PLAYERS PRESENT
          initialMap[p.playerId] = {
            playerId: p.playerId,
            fullName: p.fullName,
            jerseyNumber: p.jerseyNumber || '',
            phone: p.phone || '',
            status: 'PRESENT',
            arrivalTime: defaultStartTime,
            lateMinutes: 0,
            excuseType: 'Injury',
            notes: ''
          };
        }
      });

      setAttendanceData(initialMap);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setRosterLoading(false);
    }
  };

  // Trigger loading when active team changes
  useEffect(() => {
    if (activeTeam) {
      fetchTeamSessions(activeTeam);
    }
  }, [activeTeam]);

  // Trigger roster load when selected session or active team changes
  useEffect(() => {
    if (activeTeam) {
      fetchRoster(activeTeam, selectedSessionId);
    }
  }, [activeTeam, selectedSessionId]);

  // Calculate late minutes
  const computeLateMinutes = (startTime: string, arrivalTime: string): number => {
    if (!startTime || !arrivalTime) return 0;
    try {
      const [sH, sM] = startTime.split(':').map(Number);
      const [aH, aM] = arrivalTime.split(':').map(Number);
      if (isNaN(sH) || isNaN(sM) || isNaN(aH) || isNaN(aM)) return 0;
      const startMins = sH * 60 + sM;
      const arrivalMins = aH * 60 + aM;
      const diff = arrivalMins - startMins;
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  };

  // Status Change Handler (Instant 1-tap feedback)
  const handleStatusChange = (playerId: string, newStatus: AttendanceStatus) => {
    setAttendanceData(prev => {
      const current = prev[playerId];
      if (!current) return prev;

      const startTime = currentSession?.StartTime || '18:00';
      let arrivalTime = current.arrivalTime || startTime;
      let lateMinutes = 0;

      if (newStatus === 'LATE') {
        // If current arrival time is <= start time, default to 15 mins late
        if (arrivalTime <= startTime) {
          const [h, m] = startTime.split(':').map(Number);
          const newTotalM = h * 60 + m + 15;
          const newH = Math.floor(newTotalM / 60) % 24;
          const newM = newTotalM % 60;
          arrivalTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
        }
        lateMinutes = computeLateMinutes(startTime, arrivalTime);
      }

      return {
        ...prev,
        [playerId]: {
          ...current,
          status: newStatus,
          arrivalTime,
          lateMinutes
        }
      };
    });
  };

  // Update Arrival Time for Late Players
  const handleArrivalTimeChange = (playerId: string, time: string) => {
    setAttendanceData(prev => {
      const current = prev[playerId];
      if (!current) return prev;
      const startTime = currentSession?.StartTime || '18:00';
      const lateMinutes = computeLateMinutes(startTime, time);
      return {
        ...prev,
        [playerId]: {
          ...current,
          arrivalTime: time,
          lateMinutes
        }
      };
    });
  };

  // Update Excuse Type
  const handleExcuseTypeChange = (playerId: string, excuseType: ExcuseType) => {
    setAttendanceData(prev => {
      const current = prev[playerId];
      if (!current) return prev;
      return {
        ...prev,
        [playerId]: {
          ...current,
          excuseType
        }
      };
    });
  };

  // Update Notes
  const handleNotesChange = (playerId: string, notes: string) => {
    setAttendanceData(prev => {
      const current = prev[playerId];
      if (!current) return prev;
      return {
        ...prev,
        [playerId]: {
          ...current,
          notes
        }
      };
    });
  };

  // Batch Shortcut: Mark All Present
  const handleMarkAllPresent = () => {
    setAttendanceData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(pid => {
        updated[pid] = {
          ...updated[pid],
          status: 'PRESENT',
          lateMinutes: 0
        };
      });
      return updated;
    });
  };

  // Live Calculated Counters
  const liveStats = useMemo(() => {
    const values = Object.values(attendanceData) as PlayerAttendanceState[];
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    values.forEach(v => {
      if (v.status === 'PRESENT') present++;
      else if (v.status === 'LATE') late++;
      else if (v.status === 'ABSENT') absent++;
      else if (v.status === 'EXCUSED') excused++;
    });

    const total = values.length;
    const effectiveAttending = present + late;
    const rate = total > 0 ? Math.round((effectiveAttending / total) * 100) : 0;

    return {
      present,
      late,
      absent,
      excused,
      total,
      rate
    };
  }, [attendanceData]);

  // Filtered Roster for Fast Searching
  const filteredRoster = useMemo(() => {
    return roster.filter(p => {
      const att = attendanceData[p.playerId];
      if (!att) return false;

      // Status Filter
      if (statusFilter !== 'ALL' && att.status !== statusFilter) {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.fullName?.toLowerCase().includes(q);
        const matchId = p.playerId?.toLowerCase().includes(q);
        const matchJersey = String(p.jerseyNumber || '').includes(q);
        return matchName || matchId || matchJersey;
      }

      return true;
    });
  }, [roster, attendanceData, searchQuery, statusFilter]);

  // Quick Session Creation
  const handleQuickCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam) return;

    try {
      setCreatingSession(true);
      setCreateSessionError(null);

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.userEmail || ''
        },
        body: JSON.stringify({
          TeamName: activeTeam,
          TrainingDate: quickDate,
          StartTime: quickStartTime,
          EndTime: quickEndTime,
          Location: quickLocation,
          Notes: 'إنشاء سريع لتسجيل الحضور الميداني'
        })
      });

      const data = await res.json();
      if (!data.success) {
        setCreateSessionError(data.error || 'تعذر إنشاء الحصة التدريبية');
        return;
      }

      // Session created successfully
      setShowCreateModal(false);
      await fetchTeamSessions(activeTeam);
      if (data.session?.SessionID) {
        setSelectedSessionId(data.session.SessionID);
      }
    } catch (err: any) {
      setCreateSessionError(err.message);
    } finally {
      setCreatingSession(false);
    }
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedSessionId) {
      setSaveError(isAr ? 'يرجى اختيار أو إنشاء حصة تدريبية أولاً' : 'Please select or create a training session first');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const items = (Object.values(attendanceData) as PlayerAttendanceState[]).map(item => ({
        playerId: item.playerId,
        status: item.status,
        arrivalTime: item.status === 'LATE' ? item.arrivalTime : undefined,
        excuseType: item.status === 'EXCUSED' ? item.excuseType : undefined,
        notes: item.notes || undefined
      }));

      const res = await fetch(`/api/sessions/${encodeURIComponent(selectedSessionId)}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.userEmail || ''
        },
        body: JSON.stringify({ items })
      });

      const data = await res.json();
      if (!data.success) {
        setSaveError(data.error || 'فشل في حفظ سجل الحضور');
        return;
      }

      // Show Final Statistics Modal
      setFinalStatsModal({
        show: true,
        session: currentSession,
        stats: data.stats
      });

      // Refresh session list to reflect 'Completed' status
      fetchTeamSessions(activeTeam);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {t.navCoachAttendance}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {isAr ? 'نظام التسجيل السريع' : 'Fast-Track Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'تسجيل حضور وغياب الفريق بالكامل في أقل من دقيقتين مع التحقق الأمني الميداني'
                  : 'Register full team attendance in under 2 minutes with verified field security'}
              </p>
            </div>
          </div>

          {/* Action Header Button */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleMarkAllPresent}
              disabled={roster.length === 0 || saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50"
              title={isAr ? 'تحديد جميع اللاعبين حاضرين بنقرة واحدة' : 'Mark all players present'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'الكل حاضر' : 'All Present'}</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={roster.length === 0 || saving || !selectedSessionId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isAr ? 'اعتماد وحفظ الحضور' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>

        {/* 2. Team & Session Selector Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Team Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-orange-500" />
              <span>{isAr ? '1. الفريق المعتمد' : '1. Authorized Team'}</span>
            </label>
            <select
              value={activeTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            >
              {authorizedTeams.map(tName => (
                <option key={tName} value={tName}>
                  {tName}
                </option>
              ))}
            </select>
          </div>

          {/* Session Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? '2. الحصة التدريبية' : '2. Training Session'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>{isAr ? 'إنشاء حصة جديدة' : '+ New Session'}</span>
              </button>
            </label>

            {sessionsLoading ? (
              <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ) : sessions.length === 0 ? (
              <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-bold">
                <span>{isAr ? 'لا توجد حصص مجدولة' : 'No sessions found'}</span>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="underline text-[11px]"
                >
                  {isAr ? 'إنشاء الآن' : 'Create Now'}
                </button>
              </div>
            ) : (
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              >
                {sessions.map(s => (
                  <option key={s.SessionID} value={s.SessionID}>
                    📅 {s.TrainingDate} ({s.StartTime} - {s.EndTime}) • {s.Location} [{s.Status || 'Scheduled'}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Session Quick Details Badge */}
          <div className="sm:col-span-2 lg:col-span-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
            {currentSession ? (
              <div className="text-[11px] space-y-0.5 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {currentSession.SessionID}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      currentSession.Status === 'Completed'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : currentSession.Status === 'Cancelled'
                        ? 'bg-rose-500/15 text-rose-700'
                        : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {currentSession.Status === 'Completed'
                      ? isAr ? 'مكتمل الحضور' : 'Completed'
                      : currentSession.Status === 'Cancelled'
                      ? isAr ? 'ملغى' : 'Cancelled'
                      : isAr ? 'مجدول للتسجيل' : 'Scheduled'}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{currentSession.Location}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? 'اختر حصة تدريبية لبدء الكشف' : 'Select session to begin'}
              </span>
            )}
          </div>
        </div>

        {/* Security Warning / Error Bar */}
        {authError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {saveError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* 3. Sticky Live Statistics Counters Bar */}
      <div className="sticky top-2 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {/* Present 🟢 */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'PRESENT' ? 'ALL' : 'PRESENT')}
            className={`p-2 rounded-xl transition border ${
              statusFilter === 'PRESENT'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <span className="text-[10px] font-bold block">{isAr ? 'حاضر' : 'Present'}</span>
            <span className="text-base font-black">{liveStats.present}</span>
          </button>

          {/* Late 🟡 */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'LATE' ? 'ALL' : 'LATE')}
            className={`p-2 rounded-xl transition border ${
              statusFilter === 'LATE'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <span className="text-[10px] font-bold block">{isAr ? 'متأخر' : 'Late'}</span>
            <span className="text-base font-black">{liveStats.late}</span>
          </button>

          {/* Absent 🔴 */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'ABSENT' ? 'ALL' : 'ABSENT')}
            className={`p-2 rounded-xl transition border ${
              statusFilter === 'ABSENT'
                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            <span className="text-[10px] font-bold block">{isAr ? 'غائب' : 'Absent'}</span>
            <span className="text-base font-black">{liveStats.absent}</span>
          </button>

          {/* Excused 🟣 */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'EXCUSED' ? 'ALL' : 'EXCUSED')}
            className={`p-2 rounded-xl transition border ${
              statusFilter === 'EXCUSED'
                ? 'bg-purple-500 text-white border-purple-600 shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            <span className="text-[10px] font-bold block">{isAr ? 'معتذر' : 'Excused'}</span>
            <span className="text-base font-black">{liveStats.excused}</span>
          </button>

          {/* Total Squad */}
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">{isAr ? 'إجمالي الفريق' : 'Total Squad'}</span>
            <span className="text-base font-black">{liveStats.total}</span>
          </div>

          {/* Attendance Rate */}
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">{isAr ? 'نسبة الحضور' : 'Rate'}</span>
            <span className={`text-base font-black ${liveStats.rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : liveStats.rate >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
              {liveStats.rate}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. Player Roster Controls & List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>
                {isAr
                  ? `كشف الحضور الميداني (${filteredRoster.length} من ${roster.length} لاعبة/لاعب)`
                  : `Field Attendance Roster (${filteredRoster.length} of ${roster.length} players)`}
              </span>
            </h3>

            {statusFilter !== 'ALL' && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                تصفية: {statusFilter}
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="ms-1 font-bold text-rose-500 hover:text-rose-700"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو الرقم الكودي...' : 'Search player or ID...'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl ps-9 pe-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Loading Roster */}
        {rosterLoading ? (
          <LoadingState type="skeleton" rows={5} />
        ) : roster.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'لا يوجد لاعبون مسجلون في هذا الفريق' : 'No players registered in this team'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {isAr
                ? 'تأكد من اختيار فريق معتمد يحتوي على بيانات مقيدة في قاعدة البيانات الرئيسية (MASTER PLAYER DATABASE).'
                : 'Ensure an authorized team is selected with players recorded in the Master Player Database.'}
            </p>
          </div>
        ) : (
          /* High Speed Touch-Friendly Player Cards */
          <div className="space-y-3">
            {filteredRoster.map(player => {
              const att = attendanceData[player.playerId];
              if (!att) return null;

              const isPresent = att.status === 'PRESENT';
              const isLate = att.status === 'LATE';
              const isAbsent = att.status === 'ABSENT';
              const isExcused = att.status === 'EXCUSED';

              return (
                <div
                  key={player.playerId}
                  className={`p-4 rounded-2xl border transition-all duration-150 ${
                    isPresent
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-750'
                      : isLate
                      ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
                      : isAbsent
                      ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30'
                      : 'bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/30'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Player Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isPresent
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : isLate
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : isAbsent
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                            : 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                        }`}
                      >
                        {player.jerseyNumber ? `#${player.jerseyNumber}` : player.fullName?.charAt(0) || '🏐'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {player.fullName}
                          </h4>
                          {player.position && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {player.position}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{player.playerId}</span>
                          {player.phone && (
                            <>
                              <span>•</span>
                              <span>📞 {player.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4-Way Quick Touch Controls */}
                    <div className="grid grid-cols-4 sm:flex items-center gap-1.5 self-stretch lg:self-auto">
                      {/* PRESENT Button 🟢 */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(player.playerId, 'PRESENT')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAr ? 'حاضر' : 'Present'}</span>
                      </button>

                      {/* LATE Button 🟡 */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(player.playerId, 'LATE')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                          isLate
                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isAr ? 'متأخر' : 'Late'}</span>
                      </button>

                      {/* ABSENT Button 🔴 */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(player.playerId, 'ABSENT')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                          isAbsent
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isAr ? 'غائب' : 'Absent'}</span>
                      </button>

                      {/* EXCUSED Button 🟣 */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(player.playerId, 'EXCUSED')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                          isExcused
                            ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إذن' : 'Excused'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Sub-Controls for LATE & EXCUSED */}
                  {isLate && (
                    <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/40 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{isAr ? 'وقت الوصول الفعلي (Arrival Time)' : 'Arrival Time'}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={att.arrivalTime || ''}
                            onChange={e => handleArrivalTimeChange(player.playerId, e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold w-36 focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-xl">
                            {isAr ? `تأخير: ${att.lateMinutes} دقيقة` : `Late: ${att.lateMinutes} mins`}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">
                          {isAr ? 'سبب التأخير (ملاحظات اختيارية)' : 'Late Reason / Notes'}
                        </label>
                        <input
                          type="text"
                          value={att.notes || ''}
                          onChange={e => handleNotesChange(player.playerId, e.target.value)}
                          placeholder={isAr ? 'مثال: زحام مروري، دراسة...' : 'e.g. Traffic, school commute...'}
                          className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {isExcused && (
                    <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-800/40 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-bold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-purple-600" />
                          <span>{isAr ? 'نوع الإذن المعتمد (Excuse Type) *' : 'Excuse Type *'}</span>
                        </label>
                        <select
                          value={att.excuseType || 'Injury'}
                          onChange={e => handleExcuseTypeChange(player.playerId, e.target.value as ExcuseType)}
                          className="w-full bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-purple-500"
                        >
                          {EXCUSE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.icon} {isAr ? opt.labelAr : opt.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-purple-800 dark:text-purple-300 mb-1">
                          {isAr ? 'تفاصيل الإذن والملاحظات' : 'Excuse Details / Notes'}
                        </label>
                        <input
                          type="text"
                          value={att.notes || ''}
                          onChange={e => handleNotesChange(player.playerId, e.target.value)}
                          placeholder={isAr ? 'مثال: تقرير طبي، إذن مسبق من ولي الأمر...' : 'e.g. Medical excuse, parental note...'}
                          className="w-full bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {isAbsent && (
                    <div className="mt-3 pt-3 border-t border-rose-200/50 dark:border-rose-800/40 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={att.notes || ''}
                        onChange={e => handleNotesChange(player.playerId, e.target.value)}
                        placeholder={isAr ? 'ملاحظة غياب بدون إذن (اختياري)...' : 'Unexcused absence notes (optional)...'}
                        className="w-full bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Bottom Save Action for Mobile */}
        {roster.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? `الحاضرون: ${liveStats.present + liveStats.late} من ${liveStats.total} (${liveStats.rate}%)`
                : `Attending: ${liveStats.present + liveStats.late} of ${liveStats.total} (${liveStats.rate}%)`}
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={roster.length === 0 || saving || !selectedSessionId}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isAr ? 'تأكيد وحفظ سجل الحصة' : 'Confirm & Save Attendance'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. SUCCESS MODAL WITH FINAL STATISTICS */}
      {finalStatsModal?.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'تم حفظ سجل الحضور بنجاح' : 'Attendance Successfully Saved'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr
                  ? `تم توثيق حضور تدريب فريق [${finalStatsModal.session?.TeamName}] بتاريخ [${finalStatsModal.session?.TrainingDate}] في جدول ATTENDANCE و AUDIT_LOG`
                  : `Logged for [${finalStatsModal.session?.TeamName}] on [${finalStatsModal.session?.TrainingDate}] to ATTENDANCE & AUDIT_LOG tables`}
              </p>
            </div>

            {/* Statistics Breakdown Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {isAr ? 'نسبة الحضور الإجمالية' : 'Total Attendance Rate'}
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {finalStatsModal.stats.attendanceRate}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <span className="block text-[10px] font-bold">{isAr ? 'حاضر' : 'Present'}</span>
                  <span className="text-base font-black">{finalStatsModal.stats.present}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <span className="block text-[10px] font-bold">{isAr ? 'متأخر' : 'Late'}</span>
                  <span className="text-base font-black">{finalStatsModal.stats.late}</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300">
                  <span className="block text-[10px] font-bold">{isAr ? 'غائب' : 'Absent'}</span>
                  <span className="text-base font-black">{finalStatsModal.stats.absent}</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300">
                  <span className="block text-[10px] font-bold">{isAr ? 'معتذر' : 'Excused'}</span>
                  <span className="text-base font-black">{finalStatsModal.stats.excused}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setFinalStatsModal(null)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition"
            >
              {isAr ? 'إغلاق ومتابعة' : 'Close & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* 6. QUICK CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {isAr ? `إنشاء حصة تدريبية • ${activeTeam}` : `Create Training Session • ${activeTeam}`}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {createSessionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs font-bold">
                {createSessionError}
              </div>
            )}

            <form onSubmit={handleQuickCreateSession} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'تاريخ التدريب' : 'Training Date'}
                </label>
                <input
                  type="date"
                  required
                  value={quickDate}
                  onChange={e => setQuickDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'وقت البداية' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    required
                    value={quickStartTime}
                    onChange={e => setQuickStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'وقت الانتهاء' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    required
                    value={quickEndTime}
                    onChange={e => setQuickEndTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'موقع الملعب / الصالة' : 'Court Location'}
                </label>
                <input
                  type="text"
                  required
                  value={quickLocation}
                  onChange={e => setQuickLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={creatingSession}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {creatingSession ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'إنشاء الحصة والبدء' : 'Create & Start')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

