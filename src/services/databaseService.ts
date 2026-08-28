/**
 * Volleyball Database Service Architecture (Phase 1)
 * Core database management service for all 8 sheets.
 * Provides data integrity, unique ID sequencing, validation, transactional audit logs, and export engines.
 */

import {
  Player,
  Team,
  Coach,
  CoachTeam,
  TrainingSession,
  Attendance,
  SystemUser,
  AuditLog,
  AuditAction,
  CoachRole,
  ValidationResult
} from '../types/database';
import { IdGenerator } from './idGenerator';
import { ValidationService } from './validationService';
import {
  INITIAL_PLAYERS,
  INITIAL_TEAMS,
  INITIAL_COACHES,
  INITIAL_COACH_TEAMS,
  INITIAL_TRAINING_SESSIONS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_SYSTEM_USERS,
  INITIAL_AUDIT_LOGS,
  SHEET_DEFINITIONS
} from './seedData';

export class DatabaseService {
  private static players: Player[] = [...INITIAL_PLAYERS];
  private static teams: Team[] = [...INITIAL_TEAMS];
  private static coaches: Coach[] = [...INITIAL_COACHES];
  private static coachTeams: CoachTeam[] = [...INITIAL_COACH_TEAMS];
  private static sessions: TrainingSession[] = [...INITIAL_TRAINING_SESSIONS];
  private static attendance: Attendance[] = [...INITIAL_ATTENDANCE_RECORDS];
  private static users: SystemUser[] = [...INITIAL_SYSTEM_USERS];
  private static auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

  // -------------------------------------------------------------
  // AUDIT LOGGING
  // -------------------------------------------------------------
  static recordAudit(
    userEmail: string,
    userRole: CoachRole,
    action: AuditAction,
    entityType: 'PLAYER' | 'TEAM' | 'COACH' | 'COACH_TEAM' | 'SESSION' | 'ATTENDANCE' | 'SYSTEM',
    entityId: string,
    details: any
  ): AuditLog {
    const logId = IdGenerator.nextLogId(this.auditLogs.map(l => l.LogID));
    const newLog: AuditLog = {
      LogID: logId,
      UserEmail: userEmail,
      UserRole: userRole,
      Action: action,
      EntityType: entityType,
      EntityID: entityId,
      Details: typeof details === 'string' ? details : JSON.stringify(details),
      Timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  // -------------------------------------------------------------
  // PLAYERS (Sheet 1)
  // -------------------------------------------------------------
  static getAllPlayers(): Player[] {
    return [...this.players];
  }

  static getPlayersByTeam(teamId: string): Player[] {
    return this.players.filter(p => p.TeamID === teamId);
  }

  static getPlayerById(playerId: string): Player | undefined {
    return this.players.find(p => p.PlayerID === playerId);
  }

  static addPlayer(
    playerData: Omit<Player, 'PlayerID'>,
    userEmail: string = 'system@volleyball.club',
    userRole: CoachRole = 'ADMIN'
  ): { success: boolean; player?: Player; error?: string } {
    const existingIds = this.players.map(p => p.PlayerID);
    const newId = IdGenerator.nextPlayerId(existingIds);

    const fullPlayer: Player = {
      ...playerData,
      PlayerID: newId
    };

    const val = ValidationService.validatePlayer(fullPlayer, existingIds);
    if (!val.isValid) {
      return { success: false, error: val.errors.join(' ') };
    }

    // Verify Team exists
    const team = this.getTeamById(fullPlayer.TeamID);
    if (!team) {
      return { success: false, error: `Invalid TeamID: ${fullPlayer.TeamID}` };
    }
    fullPlayer.TeamName = team.TeamName;

    this.players.push(fullPlayer);
    this.recordAudit(userEmail, userRole, 'CREATE', 'PLAYER', newId, { name: fullPlayer.FullName, teamId: fullPlayer.TeamID });

    return { success: true, player: fullPlayer };
  }

  static updatePlayer(
    playerId: string,
    updates: Partial<Player>,
    userEmail: string = 'system@volleyball.club',
    userRole: CoachRole = 'ADMIN'
  ): { success: boolean; player?: Player; error?: string } {
    const index = this.players.findIndex(p => p.PlayerID === playerId);
    if (index === -1) {
      return { success: false, error: `Player ${playerId} not found.` };
    }

    const current = this.players[index];
    const updated: Player = {
      ...current,
      ...updates,
      PlayerID: current.PlayerID // prevent altering primary key
    };

    if (updates.TeamID && updates.TeamID !== current.TeamID) {
      const team = this.getTeamById(updates.TeamID);
      if (!team) return { success: false, error: `Invalid target TeamID: ${updates.TeamID}` };
      updated.TeamName = team.TeamName;
    }

    const val = ValidationService.validatePlayer(updated);
    if (!val.isValid) {
      return { success: false, error: val.errors.join(' ') };
    }

    this.players[index] = updated;
    this.recordAudit(userEmail, userRole, 'UPDATE', 'PLAYER', playerId, { before: current, after: updated });

    return { success: true, player: updated };
  }

  static transferPlayer(
    playerId: string,
    newTeamId: string,
    userEmail: string = 'system@volleyball.club',
    userRole: CoachRole = 'ADMIN'
  ): { success: boolean; player?: Player; error?: string } {
    const player = this.getPlayerById(playerId);
    if (!player) return { success: false, error: `Player ${playerId} not found.` };

    const newTeam = this.getTeamById(newTeamId);
    if (!newTeam) return { success: false, error: `Target team ${newTeamId} does not exist.` };

    const prevTeamId = player.TeamID;
    const prevTeamName = player.TeamName;

    player.TeamID = newTeamId;
    player.TeamName = newTeam.TeamName;

    this.recordAudit(userEmail, userRole, 'TRANSFER', 'PLAYER', playerId, {
      fromTeam: `${prevTeamName} (${prevTeamId})`,
      toTeam: `${newTeam.TeamName} (${newTeamId})`
    });

    return { success: true, player };
  }

  static setPlayerStatus(
    playerId: string,
    status: Player['PlayerStatus'],
    userEmail: string = 'system@volleyball.club',
    userRole: CoachRole = 'ADMIN'
  ): { success: boolean; player?: Player; error?: string } {
    const player = this.getPlayerById(playerId);
    if (!player) return { success: false, error: `Player ${playerId} not found.` };

    const oldStatus = player.PlayerStatus;
    player.PlayerStatus = status;

    this.recordAudit(userEmail, userRole, 'UPDATE', 'PLAYER', playerId, {
      statusChange: `${oldStatus} -> ${status}`
    });

    return { success: true, player };
  }

  // -------------------------------------------------------------
  // TEAMS (Sheet 2)
  // -------------------------------------------------------------
  static getAllTeams(): Team[] {
    return [...this.teams];
  }

  static getTeamById(teamId: string): Team | undefined {
    return this.teams.find(t => t.TeamID === teamId);
  }

  static addTeam(
    teamData: Omit<Team, 'TeamID'>,
    userEmail: string = 'system@volleyball.club',
    userRole: CoachRole = 'ADMIN'
  ): { success: boolean; team?: Team; error?: string } {
    const existingIds = this.teams.map(t => t.TeamID);
    const newId = IdGenerator.nextTeamId(existingIds);

    const fullTeam: Team = {
      ...teamData,
      TeamID: newId
    };

    const val = ValidationService.validateTeam(fullTeam, existingIds);
    if (!val.isValid) {
      return { success: false, error: val.errors.join(' ') };
    }

    this.teams.push(fullTeam);
    this.recordAudit(userEmail, userRole, 'CREATE', 'TEAM', newId, fullTeam);

    return { success: true, team: fullTeam };
  }

  // -------------------------------------------------------------
  // COACHES (Sheet 3) & ASSIGNMENTS (Sheet 4)
  // -------------------------------------------------------------
  static getAllCoaches(): Coach[] {
    return [...this.coaches];
  }

  static getCoachByEmail(email: string): Coach | undefined {
    return this.coaches.find(c => c.Email.toLowerCase() === email.toLowerCase());
  }

  static getCoachById(coachId: string): Coach | undefined {
    return this.coaches.find(c => c.CoachID === coachId);
  }

  static getAllCoachTeams(): CoachTeam[] {
    return [...this.coachTeams];
  }

  static getTeamsForCoach(coachId: string): Team[] {
    const assignments = this.coachTeams.filter(ct => ct.CoachID === coachId && ct.Active);
    const assignedTeamIds = assignments.map(a => a.TeamID);
    return this.teams.filter(t => assignedTeamIds.includes(t.TeamID));
  }

  // -------------------------------------------------------------
  // TRAINING SESSIONS (Sheet 5)
  // -------------------------------------------------------------
  static getAllSessions(): TrainingSession[] {
    return [...this.sessions];
  }

  static getSessionsByTeam(teamId: string): TrainingSession[] {
    return this.sessions.filter(s => s.TeamID === teamId);
  }

  static getSessionById(sessionId: string): TrainingSession | undefined {
    return this.sessions.find(s => s.SessionID === sessionId);
  }

  static createSession(
    sessionData: Omit<TrainingSession, 'SessionID' | 'CreatedAt'>,
    userEmail: string = 'system@volleyball.club',
    userRole: CoachRole = 'HEAD_COACH'
  ): { success: boolean; session?: TrainingSession; error?: string } {
    const existingIds = this.sessions.map(s => s.SessionID);
    const newId = IdGenerator.nextSessionId(existingIds);

    const newSession: TrainingSession = {
      ...sessionData,
      SessionID: newId,
      CreatedAt: new Date().toISOString()
    };

    const val = ValidationService.validateTrainingSession(newSession);
    if (!val.isValid) {
      return { success: false, error: val.errors.join(' ') };
    }

    this.sessions.unshift(newSession);
    this.recordAudit(userEmail, userRole, 'CREATE', 'SESSION', newId, {
      team: newSession.TeamName,
      date: newSession.TrainingDate
    });

    return { success: true, session: newSession };
  }

  // -------------------------------------------------------------
  // ATTENDANCE (Sheet 6)
  // -------------------------------------------------------------
  static getAllAttendance(): Attendance[] {
    return [...this.attendance];
  }

  static getAttendanceBySession(sessionId: string): Attendance[] {
    return this.attendance.filter(a => a.SessionID === sessionId);
  }

  static getAttendanceByPlayer(playerId: string): Attendance[] {
    return this.attendance.filter(a => a.PlayerID === playerId);
  }

  static saveAttendanceBatch(
    records: Partial<Attendance>[],
    userEmail: string = 'system@volleyball.club',
    userRole: CoachRole = 'HEAD_COACH'
  ): { success: boolean; savedCount: number; errors: string[] } {
    const errors: string[] = [];
    let savedCount = 0;

    for (const rec of records) {
      if (!rec.SessionID || !rec.PlayerID) {
        errors.push(`Missing SessionID or PlayerID in record.`);
        continue;
      }

      // Check existing record for duplicate protection
      const existingIdx = this.attendance.findIndex(
        a => a.SessionID === rec.SessionID && a.PlayerID === rec.PlayerID
      );

      const player = this.getPlayerById(rec.PlayerID);
      const session = this.getSessionById(rec.SessionID);

      const timestamp = new Date().toISOString();

      let lateMins = rec.LateMinutes;
      if (rec.Status === 'LATE' && rec.ArrivalTime && session?.StartTime) {
        lateMins = ValidationService.calculateLateMinutes(session.StartTime, rec.ArrivalTime);
      }

      if (existingIdx !== -1) {
        // Update existing
        this.attendance[existingIdx] = {
          ...this.attendance[existingIdx],
          ...rec,
          LateMinutes: lateMins,
          Timestamp: timestamp
        } as Attendance;
        savedCount++;
      } else {
        // Insert new
        const newId = IdGenerator.nextAttendanceId(this.attendance.map(a => a.AttendanceID));
        const fullAttendance: Attendance = {
          AttendanceID: newId,
          SessionID: rec.SessionID,
          PlayerID: rec.PlayerID,
          PlayerName: rec.PlayerName || player?.FullName || 'Unknown Player',
          TeamID: rec.TeamID || session?.TeamID || 'T001',
          TeamName: rec.TeamName || session?.TeamName || 'Volleyball Team',
          TrainingDate: rec.TrainingDate || session?.TrainingDate || new Date().toISOString().split('T')[0],
          Status: rec.Status || 'PRESENT',
          ArrivalTime: rec.ArrivalTime,
          LateMinutes: lateMins,
          ExcuseType: rec.ExcuseType,
          CoachID: rec.CoachID || session?.CoachID || 'COACH-0001',
          CoachName: rec.CoachName || session?.CoachName || 'Coach',
          Notes: rec.Notes,
          Timestamp: timestamp
        };

        this.attendance.push(fullAttendance);
        savedCount++;
      }
    }

    if (savedCount > 0) {
      this.recordAudit(userEmail, userRole, 'SAVE_ATTENDANCE', 'ATTENDANCE', records[0]?.SessionID || 'BATCH', {
        recordsCount: savedCount
      });
    }

    return {
      success: errors.length === 0,
      savedCount,
      errors
    };
  }

  // -------------------------------------------------------------
  // SYSTEM USERS (Sheet 7) & AUDIT LOGS (Sheet 8)
  // -------------------------------------------------------------
  static getAllUsers(): SystemUser[] {
    return [...this.users];
  }

  static getAllAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  static getSheetDefinitions() {
    return SHEET_DEFINITIONS;
  }

  // -------------------------------------------------------------
  // STATS & UTILITIES
  // -------------------------------------------------------------
  static getDatabaseOverview() {
    return {
      playersCount: this.players.length,
      activePlayersCount: this.players.filter(p => p.PlayerStatus === 'Active').length,
      teamsCount: this.teams.length,
      coachesCount: this.coaches.length,
      sessionsCount: this.sessions.length,
      attendanceRecordsCount: this.attendance.length,
      usersCount: this.users.length,
      auditLogsCount: this.auditLogs.length
    };
  }

  static resetToSeedData() {
    this.players = [...INITIAL_PLAYERS];
    this.teams = [...INITIAL_TEAMS];
    this.coaches = [...INITIAL_COACHES];
    this.coachTeams = [...INITIAL_COACH_TEAMS];
    this.sessions = [...INITIAL_TRAINING_SESSIONS];
    this.attendance = [...INITIAL_ATTENDANCE_RECORDS];
    this.users = [...INITIAL_SYSTEM_USERS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.recordAudit('system@volleyball.club', 'ADMIN', 'SYSTEM_INIT', 'SYSTEM', 'RESET', 'Database reset to initial seed state.');
  }

  static exportAsJson(): string {
    return JSON.stringify(
      {
        PLAYERS: this.players,
        TEAMS: this.teams,
        COACHES: this.coaches,
        COACH_TEAMS: this.coachTeams,
        TRAINING_SESSIONS: this.sessions,
        ATTENDANCE: this.attendance,
        SYSTEM_USERS: this.users,
        AUDIT_LOG: this.auditLogs
      },
      null,
      2
    );
  }

  static exportTableToCsv(tableName: string): string {
    const tableData: any[] = (this as any)[tableName.toLowerCase()] || [];
    if (!tableData || tableData.length === 0) return '';

    const headers = Object.keys(tableData[0]);
    const rows = tableData.map(row =>
      headers.map(h => `"${(row[h] !== undefined ? String(row[h]) : '').replace(/"/g, '""')}"`).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
