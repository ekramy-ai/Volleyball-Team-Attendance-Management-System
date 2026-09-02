/**
 * Phase 14 - Reporting Service
 * Client-side report generation engine.
 * Operates entirely on the in-memory MasterDatabaseService data stores.
 * Enforces role-based access control: coaches see only their authorized teams.
 */

import {
  ReportFilterParams,
  ReportSummaryMetrics,
  DailyAttendanceReportRow,
  WeeklyTeamReportRow,
  MonthlyTeamReportRow,
  PlayerAttendanceReportRow,
  TeamAttendanceReportRow,
  CoachActivityReportRow,
  ReportDataPayload,
  ReportFilterOptions,
  AttendanceRecord,
  TrainingSessionRecord,
} from '../types/database';
import { MasterDatabaseService } from './masterDatabaseService';

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const dayNum = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((dayNum + jan1.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getWeekLabel(weekKey: string): string {
  const [year, wStr] = weekKey.split('-W');
  const week = parseInt(wStr, 10);
  const jan1 = new Date(Date.UTC(parseInt(year, 10), 0, 1));
  const offset = (jan1.getUTCDay() === 0 ? 6 : jan1.getUTCDay() - 1);
  const monday = new Date(jan1.getTime() + (week - 1) * 7 * 86400000 - offset * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const fmt = (d: Date) => d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${monday.getUTCDate()} - ${fmt(sunday)}`;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const d = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1));
  return d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}

function calcDisciplineScore(records: AttendanceRecord[]): number {
  const settings = MasterDatabaseService.getDisciplineSettings();
  let deductions = 0;
  for (const r of records) {
    if (r.AttendanceStatus === 'ABSENT') deductions += settings.unexcusedAbsencePenalty;
    else if (r.AttendanceStatus === 'EXCUSED') deductions += settings.excusedAbsencePenalty;
    else if (r.AttendanceStatus === 'LATE') deductions += settings.latePenalty;
  }
  return Math.max(0, Math.round(settings.startingPoints - deductions));
}

function buildSummary(
  records: AttendanceRecord[],
  sessions: TrainingSessionRecord[]
): ReportSummaryMetrics {
  const total = records.length;
  const present = records.filter(r => r.AttendanceStatus === 'PRESENT').length;
  const late = records.filter(r => r.AttendanceStatus === 'LATE').length;
  const absent = records.filter(r => r.AttendanceStatus === 'ABSENT').length;
  const excused = records.filter(r => r.AttendanceStatus === 'EXCUSED').length;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const playerIds = [...new Set(records.map(r => r.PlayerID))];
  let totalDiscipline = 0;
  for (const pId of playerIds) {
    const pRecs = records.filter(r => r.PlayerID === pId);
    totalDiscipline += calcDisciplineScore(pRecs);
  }
  const avgDiscipline = playerIds.length > 0 ? Math.round(totalDiscipline / playerIds.length) : 100;

  return {
    totalRecords: total,
    totalSessions: new Set(records.map(r => r.SessionID)).size || sessions.length,
    presentCount: present,
    lateCount: late,
    absentCount: absent,
    excusedCount: excused,
    attendanceRate: pct(present + late),
    absenceRate: pct(absent),
    lateRate: pct(late),
    averageDisciplineScore: avgDiscipline
  };
}

function inDateRange(dateStr: string, start?: string, end?: string): boolean {
  if (!start && !end) return true;
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

function getAuthorizedTeams(userEmail: string): string[] | null {
  const session = MasterDatabaseService.getCurrentUser(userEmail);
  if (!session.isAuthenticated) return [];
  if (session.isAdmin) return null;
  return session.authorizedTeams || [];
}

export function getReportFilterOptions(userEmail: string): ReportFilterOptions {
  const authorizedTeams = getAuthorizedTeams(userEmail);
  const allPlayers = MasterDatabaseService.getAllMasterPlayers();
  const allCoaches = MasterDatabaseService.getAllCoaches();

  const availableTeams = authorizedTeams === null
    ? MasterDatabaseService.getAvailableTeamsFromPlayers()
    : authorizedTeams;

  const filteredPlayers = authorizedTeams === null
    ? allPlayers
    : allPlayers.filter(p => authorizedTeams.includes(p.teamName));

  const availableBirthYears = [...new Set(
    filteredPlayers.map(p => String(p.teamBirthYear || p.birthYear || '')).filter(Boolean)
  )].sort();

  const availableGenders = [...new Set(
    filteredPlayers.map(p => p.gender).filter(Boolean)
  )].sort();

  return {
    availableReportTypes: [
      { id: 'DAILY_ATTENDANCE', label: 'تقرير الحضور اليومي', labelEn: 'Daily Attendance' },
      { id: 'WEEKLY_TEAM', label: 'التقرير الاسبوعي للفرق', labelEn: 'Weekly Team' },
      { id: 'MONTHLY_TEAM', label: 'التقرير الشهري للفرق', labelEn: 'Monthly Team' },
      { id: 'PLAYER_ATTENDANCE', label: 'تقرير اللاعبين الفردي', labelEn: 'Player Attendance' },
      { id: 'TEAM_ATTENDANCE', label: 'تقرير الحضور الشامل للفرق', labelEn: 'Team Attendance' },
      { id: 'COACH_ATTENDANCE_ACTIVITY', label: 'تقرير نشاط المدربين', labelEn: 'Coach Activity' }
    ],
    availableTeams,
    availablePlayers: filteredPlayers.map(p => ({ id: p.playerId, name: p.fullName, team: p.teamName })),
    availableCoaches: allCoaches.map(c => ({ id: c.CoachID, name: c.FullName, email: c.Email })),
    availableBirthYears,
    availableGenders
  };
}

export function generateReport(
  userEmail: string,
  params: ReportFilterParams
): { success: boolean; data?: ReportDataPayload; error?: string } {
  const authorizedTeams = getAuthorizedTeams(userEmail);
  const session = MasterDatabaseService.getCurrentUser(userEmail);
  if (!session.isAuthenticated) {
    return { success: false, error: 'User not authenticated' };
  }

  let allAttendance = MasterDatabaseService.getAllAttendanceRecords();
  let allSessions = MasterDatabaseService.getAllTrainingSessions();

  const { startDate, endDate, teamName, playerId, coachId, teamBirthYear, gender } = params;

  // Security Gate: Ensure Coach cannot request an unauthorized team
  if (teamName && authorizedTeams !== null) {
    const normTeam = MasterDatabaseService.normalizeTeamName(teamName);
    const isAllowed = authorizedTeams.some(t => MasterDatabaseService.normalizeTeamName(t) === normTeam);
    if (!isAllowed) {
      MasterDatabaseService.logAudit(
        userEmail,
        session.role,
        'AUTH_UNAUTHORIZED_REPORT_QUERY',
        'REPORT',
        params.reportType,
        `Coach attempted unauthorized report generation for team "${teamName}".`
      );
      return {
        success: false,
        error: `Unauthorized: Coach is not assigned to team "${teamName}".`
      };
    }
  }

  if (authorizedTeams !== null) {
    const normalizedAuth = authorizedTeams.map(t => MasterDatabaseService.normalizeTeamName(t));
    allAttendance = allAttendance.filter(r =>
      normalizedAuth.includes(MasterDatabaseService.normalizeTeamName(r.TeamName))
    );
    allSessions = allSessions.filter(s =>
      normalizedAuth.includes(MasterDatabaseService.normalizeTeamName(s.TeamName))
    );
  }

  if (startDate || endDate) {
    allAttendance = allAttendance.filter(r => inDateRange(r.TrainingDate, startDate, endDate));
    allSessions = allSessions.filter(s => inDateRange(s.TrainingDate, startDate, endDate));
  }
  if (teamName) {
    const normTeam = MasterDatabaseService.normalizeTeamName(teamName);
    allAttendance = allAttendance.filter(r => MasterDatabaseService.normalizeTeamName(r.TeamName) === normTeam);
    allSessions = allSessions.filter(s => MasterDatabaseService.normalizeTeamName(s.TeamName) === normTeam);
  }
  if (playerId) {
    allAttendance = allAttendance.filter(r => r.PlayerID === playerId);
  }
  if (coachId && session.isAdmin) {
    allAttendance = allAttendance.filter(r => r.CoachID === coachId);
    allSessions = allSessions.filter(s => s.CoachID === coachId);
  }
  if (teamBirthYear) {
    const yr = String(teamBirthYear);
    const allPlayers = MasterDatabaseService.getAllMasterPlayers();
    const matchingIds = new Set(allPlayers.filter(p => String(p.teamBirthYear || p.birthYear || '') === yr).map(p => p.playerId));
    allAttendance = allAttendance.filter(r => matchingIds.has(r.PlayerID));
    allSessions = allSessions.filter(s => s.TeamBirthYear && String(s.TeamBirthYear) === yr);
  }
  if (gender) {
    const allPlayers = MasterDatabaseService.getAllMasterPlayers();
    const genderIds = new Set(allPlayers.filter(p => p.gender === gender || p.gender.includes(gender)).map(p => p.playerId));
    allAttendance = allAttendance.filter(r => genderIds.has(r.PlayerID));
  }

  const summary = buildSummary(allAttendance, allSessions);
  const generatedAt = new Date().toISOString();
  const generatedByUser = session.fullName || userEmail;

  switch (params.reportType) {
    case 'DAILY_ATTENDANCE':
      return buildDailyReport(params, allAttendance, allSessions, summary, generatedAt, generatedByUser);
    case 'WEEKLY_TEAM':
      return buildWeeklyReport(params, allAttendance, summary, generatedAt, generatedByUser);
    case 'MONTHLY_TEAM':
      return buildMonthlyReport(params, allAttendance, summary, generatedAt, generatedByUser);
    case 'PLAYER_ATTENDANCE':
      return buildPlayerReport(params, allAttendance, allSessions, summary, generatedAt, generatedByUser);
    case 'TEAM_ATTENDANCE':
      return buildTeamReport(params, allAttendance, allSessions, summary, generatedAt, generatedByUser, authorizedTeams);
    case 'COACH_ATTENDANCE_ACTIVITY':
      if (!session.isAdmin) return { success: false, error: 'Coach Activity Report is restricted to Administrators.' };
      return buildCoachReport(params, allAttendance, allSessions, summary, generatedAt, generatedByUser);
    default:
      return buildTeamReport(params, allAttendance, allSessions, summary, generatedAt, generatedByUser, authorizedTeams);
  }
}

function buildDailyReport(
  params: ReportFilterParams,
  attendance: AttendanceRecord[],
  sessions: TrainingSessionRecord[],
  summary: ReportSummaryMetrics,
  generatedAt: string,
  generatedByUser: string
): { success: boolean; data?: ReportDataPayload } {
  const sessionMap = new Map<string, TrainingSessionRecord>();
  for (const s of MasterDatabaseService.getAllTrainingSessions()) sessionMap.set(s.SessionID, s);
  for (const s of sessions) sessionMap.set(s.SessionID, s);

  const bySession = new Map<string, AttendanceRecord[]>();
  for (const rec of attendance) {
    if (!bySession.has(rec.SessionID)) bySession.set(rec.SessionID, []);
    bySession.get(rec.SessionID)!.push(rec);
  }

  const dailyRows: DailyAttendanceReportRow[] = [];
  for (const [sid, records] of bySession.entries()) {
    const sess = sessionMap.get(sid);
    const date = sess?.TrainingDate || records[0]?.TrainingDate || '';
    const teamName = sess?.TeamName || records[0]?.TeamName || '';
    const coachName = sess?.CoachName || records[0]?.CoachName || '';
    const location = sess?.Location || '-';
    const timeRange = sess ? `${sess.StartTime} - ${sess.EndTime}` : '-';
    const present = records.filter(r => r.AttendanceStatus === 'PRESENT').length;
    const late = records.filter(r => r.AttendanceStatus === 'LATE').length;
    const absent = records.filter(r => r.AttendanceStatus === 'ABSENT').length;
    const excused = records.filter(r => r.AttendanceStatus === 'EXCUSED').length;
    const total = records.length;
    dailyRows.push({
      date, sessionId: sid, teamName, coachName, location, timeRange,
      totalPlayers: total,
      presentCount: present, lateCount: late, absentCount: absent, excusedCount: excused,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      absenceRate: total > 0 ? Math.round((absent / total) * 100) : 0,
      lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
      records: records.map(r => ({
        playerId: r.PlayerID, playerName: r.PlayerName, status: r.AttendanceStatus,
        arrivalTime: r.ArrivalTime, lateMinutes: r.LateMinutes, excuseType: r.ExcuseType, notes: r.Notes
      }))
    });
  }
  dailyRows.sort((a, b) => b.date.localeCompare(a.date) || a.teamName.localeCompare(b.teamName));
  return { success: true, data: { reportType: 'DAILY_ATTENDANCE', title: 'تقرير الحضور اليومي', generatedAt, generatedByUser, filtersApplied: params, summary, dailyRows } };
}

function buildWeeklyReport(
  params: ReportFilterParams,
  attendance: AttendanceRecord[],
  summary: ReportSummaryMetrics,
  generatedAt: string,
  generatedByUser: string
): { success: boolean; data?: ReportDataPayload } {
  const map = new Map<string, AttendanceRecord[]>();
  for (const r of attendance) {
    const key = `${getWeekKey(r.TrainingDate)}__${r.TeamName}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const weeklyRows: WeeklyTeamReportRow[] = [];
  for (const [key, records] of map.entries()) {
    const sepIdx = key.indexOf('__');
    const weekKey = key.substring(0, sepIdx);
    const teamName = key.substring(sepIdx + 2);
    const present = records.filter(r => r.AttendanceStatus === 'PRESENT').length;
    const late = records.filter(r => r.AttendanceStatus === 'LATE').length;
    const absent = records.filter(r => r.AttendanceStatus === 'ABSENT').length;
    const excused = records.filter(r => r.AttendanceStatus === 'EXCUSED').length;
    const total = records.length;
    weeklyRows.push({
      weekKey, weekLabel: getWeekLabel(weekKey), teamName,
      sessionCount: new Set(records.map(r => r.SessionID)).size,
      totalAttendances: total, presentCount: present, lateCount: late, absentCount: absent, excusedCount: excused,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      absenceRate: total > 0 ? Math.round((absent / total) * 100) : 0,
      lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
      disciplineScore: calcDisciplineScore(records)
    });
  }
  weeklyRows.sort((a, b) => b.weekKey.localeCompare(a.weekKey) || a.teamName.localeCompare(b.teamName));
  return { success: true, data: { reportType: 'WEEKLY_TEAM', title: 'التقرير الاسبوعي للفرق', generatedAt, generatedByUser, filtersApplied: params, summary, weeklyRows } };
}

function buildMonthlyReport(
  params: ReportFilterParams,
  attendance: AttendanceRecord[],
  summary: ReportSummaryMetrics,
  generatedAt: string,
  generatedByUser: string
): { success: boolean; data?: ReportDataPayload } {
  const map = new Map<string, AttendanceRecord[]>();
  for (const r of attendance) {
    const key = `${getMonthKey(r.TrainingDate)}__${r.TeamName}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const monthlyRows: MonthlyTeamReportRow[] = [];
  for (const [key, records] of map.entries()) {
    const sepIdx = key.indexOf('__');
    const monthKey = key.substring(0, sepIdx);
    const teamName = key.substring(sepIdx + 2);
    const present = records.filter(r => r.AttendanceStatus === 'PRESENT').length;
    const late = records.filter(r => r.AttendanceStatus === 'LATE').length;
    const absent = records.filter(r => r.AttendanceStatus === 'ABSENT').length;
    const excused = records.filter(r => r.AttendanceStatus === 'EXCUSED').length;
    const total = records.length;
    monthlyRows.push({
      monthKey, monthLabel: getMonthLabel(monthKey), teamName,
      sessionCount: new Set(records.map(r => r.SessionID)).size,
      uniquePlayersCount: new Set(records.map(r => r.PlayerID)).size,
      totalAttendances: total, presentCount: present, lateCount: late, absentCount: absent, excusedCount: excused,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      absenceRate: total > 0 ? Math.round((absent / total) * 100) : 0,
      lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
      disciplineScore: calcDisciplineScore(records)
    });
  }
  monthlyRows.sort((a, b) => b.monthKey.localeCompare(a.monthKey) || a.teamName.localeCompare(b.teamName));
  return { success: true, data: { reportType: 'MONTHLY_TEAM', title: 'التقرير الشهري للفرق', generatedAt, generatedByUser, filtersApplied: params, summary, monthlyRows } };
}

function buildPlayerReport(
  params: ReportFilterParams,
  attendance: AttendanceRecord[],
  sessions: TrainingSessionRecord[],
  summary: ReportSummaryMetrics,
  generatedAt: string,
  generatedByUser: string
): { success: boolean; data?: ReportDataPayload } {
  const allPlayers = MasterDatabaseService.getAllMasterPlayers();
  const byPlayer = new Map<string, AttendanceRecord[]>();
  for (const r of attendance) {
    if (!byPlayer.has(r.PlayerID)) byPlayer.set(r.PlayerID, []);
    byPlayer.get(r.PlayerID)!.push(r);
  }
  const playerRows: PlayerAttendanceReportRow[] = [];
  for (const [playerId, records] of byPlayer.entries()) {
    const player = allPlayers.find(p => p.playerId === playerId);
    const fullName = player?.fullName || records[0]?.PlayerName || playerId;
    const present = records.filter(r => r.AttendanceStatus === 'PRESENT').length;
    const late = records.filter(r => r.AttendanceStatus === 'LATE').length;
    const absent = records.filter(r => r.AttendanceStatus === 'ABSENT').length;
    const excused = records.filter(r => r.AttendanceStatus === 'EXCUSED').length;
    const total = records.length;
    playerRows.push({
      playerId, fullName,
      shortName: player?.shortName || fullName.split(' ')[0],
      teamName: player?.teamName || records[0]?.TeamName || '-',
      gender: player?.gender || '',
      birthYear: player?.teamBirthYear || player?.birthYear || '',
      totalSessions: total, presentCount: present, lateCount: late, absentCount: absent, excusedCount: excused,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      absenceRate: total > 0 ? Math.round((absent / total) * 100) : 0,
      lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
      disciplineScore: calcDisciplineScore(records),
      history: records.sort((a, b) => b.TrainingDate.localeCompare(a.TrainingDate)).map(r => ({
        date: r.TrainingDate, sessionId: r.SessionID, status: r.AttendanceStatus, lateMinutes: r.LateMinutes, notes: r.Notes
      }))
    });
  }
  playerRows.sort((a, b) => b.attendanceRate - a.attendanceRate || a.fullName.localeCompare(b.fullName, 'ar'));
  return { success: true, data: { reportType: 'PLAYER_ATTENDANCE', title: 'تقرير اللاعبين الفردي', generatedAt, generatedByUser, filtersApplied: params, summary, playerRows } };
}

function buildTeamReport(
  params: ReportFilterParams,
  attendance: AttendanceRecord[],
  sessions: TrainingSessionRecord[],
  summary: ReportSummaryMetrics,
  generatedAt: string,
  generatedByUser: string,
  authorizedTeams: string[] | null
): { success: boolean; data?: ReportDataPayload } {
  const allPlayers = MasterDatabaseService.getAllMasterPlayers();
  const allCoaches = MasterDatabaseService.getAllCoaches();
  const allAssignments = MasterDatabaseService.getAllCoachTeamAssignments();
  const allOfficialTeams = MasterDatabaseService.getOfficial20Teams();
  const distinctTeams = [...new Set(attendance.map(r => r.TeamName))];
  const teamRows: TeamAttendanceReportRow[] = [];
  for (const team of distinctTeams) {
    const teamRecords = attendance.filter(r => r.TeamName === team);
    const teamSessions = sessions.filter(s => s.TeamName === team);
    const teamPlayers = allPlayers.filter(p => MasterDatabaseService.normalizeTeamName(p.teamName) === MasterDatabaseService.normalizeTeamName(team));
    const officialTeam = allOfficialTeams.find(t => MasterDatabaseService.normalizeTeamName(t.teamName) === MasterDatabaseService.normalizeTeamName(team));
    const assignment = allAssignments.find(a => MasterDatabaseService.normalizeTeamName(a.TeamName) === MasterDatabaseService.normalizeTeamName(team));
    const headCoach = assignment ? allCoaches.find(c => c.CoachID === assignment.CoachID) : null;
    const present = teamRecords.filter(r => r.AttendanceStatus === 'PRESENT').length;
    const late = teamRecords.filter(r => r.AttendanceStatus === 'LATE').length;
    const absent = teamRecords.filter(r => r.AttendanceStatus === 'ABSENT').length;
    const excused = teamRecords.filter(r => r.AttendanceStatus === 'EXCUSED').length;
    const total = teamRecords.length;
    teamRows.push({
      teamName: team,
      club: officialTeam?.club || '',
      teamBirthYear: officialTeam?.birthYear || '',
      gender: officialTeam?.gender || '',
      headCoachName: headCoach?.FullName || assignment?.CoachName || '-',
      playerCount: teamPlayers.length,
      sessionCount: new Set(teamRecords.map(r => r.SessionID)).size || teamSessions.length,
      totalAttendances: total, presentCount: present, lateCount: late, absentCount: absent, excusedCount: excused,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      absenceRate: total > 0 ? Math.round((absent / total) * 100) : 0,
      lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
      disciplineScore: calcDisciplineScore(teamRecords)
    });
  }
  teamRows.sort((a, b) => b.attendanceRate - a.attendanceRate);
  return { success: true, data: { reportType: 'TEAM_ATTENDANCE', title: 'تقرير الحضور الشامل للفرق', generatedAt, generatedByUser, filtersApplied: params, summary, teamRows } };
}

function buildCoachReport(
  params: ReportFilterParams,
  attendance: AttendanceRecord[],
  sessions: TrainingSessionRecord[],
  summary: ReportSummaryMetrics,
  generatedAt: string,
  generatedByUser: string
): { success: boolean; data?: ReportDataPayload } {
  const allCoaches = MasterDatabaseService.getAllCoaches();
  const allAssignments = MasterDatabaseService.getAllCoachTeamAssignments();
  const allSessions = MasterDatabaseService.getAllTrainingSessions();
  const coachRows: CoachActivityReportRow[] = [];
  for (const coach of allCoaches) {
    const coachAssignments = allAssignments.filter(a => a.CoachID === coach.CoachID);
    const assignedTeams = coachAssignments.map(a => a.TeamName);
    const coachSessions = allSessions.filter(s => s.CoachID === coach.CoachID);
    const conductedSessions = coachSessions.filter(s => s.Status === 'Completed');
    const coachAttendance = attendance.filter(r => r.CoachID === coach.CoachID);
    let totalRate = 0; let teamCount = 0;
    for (const team of assignedTeams) {
      const teamRecs = coachAttendance.filter(r => r.TeamName === team);
      if (teamRecs.length > 0) {
        const pres = teamRecs.filter(r => r.AttendanceStatus === 'PRESENT' || r.AttendanceStatus === 'LATE').length;
        totalRate += Math.round((pres / teamRecs.length) * 100);
        teamCount++;
      }
    }
    const dates = coachAttendance.map(r => r.TrainingDate).filter(Boolean).sort();
    coachRows.push({
      coachId: coach.CoachID, coachName: coach.FullName, coachEmail: coach.Email, role: coach.Role,
      assignedTeams, scheduledSessionsCount: coachSessions.length,
      conductedSessionsCount: conductedSessions.length,
      totalAttendanceRecordsLogged: coachAttendance.length,
      avgTeamAttendanceRate: teamCount > 0 ? Math.round(totalRate / teamCount) : 0,
      lastActiveDate: dates.length > 0 ? dates[dates.length - 1] : undefined
    });
  }
  coachRows.sort((a, b) => b.totalAttendanceRecordsLogged - a.totalAttendanceRecordsLogged);
  return { success: true, data: { reportType: 'COACH_ATTENDANCE_ACTIVITY', title: 'تقرير نشاط المدربين', generatedAt, generatedByUser, filtersApplied: params, summary, coachRows } };
}
