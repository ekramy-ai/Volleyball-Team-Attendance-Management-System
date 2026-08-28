/**
 * Validation Engine for Volleyball Club Management System
 * Enforces business rules, data types, constraints, and relational integrity.
 */

import {
  Player,
  Team,
  Coach,
  CoachTeam,
  TrainingSession,
  Attendance,
  SystemUser,
  ValidationResult,
  PlayerStatus,
  CoachRole,
  AttendanceStatus,
  ExcuseType
} from '../types/database';

export const VALID_PLAYER_STATUSES: PlayerStatus[] = ['Active', 'Injured', 'Suspended', 'Inactive', 'Transferred'];
export const VALID_COACH_ROLES: CoachRole[] = ['ADMIN', 'HEAD_COACH', 'ASSISTANT_COACH'];
export const VALID_ATTENDANCE_STATUSES: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];
export const VALID_EXCUSE_TYPES: ExcuseType[] = [
  'Injury',
  'Illness',
  'School',
  'Exams',
  'Travel',
  'Family Emergency',
  'Previous Permission',
  'Other'
];

export class ValidationService {
  /**
   * Validate Email Format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Date format (YYYY-MM-DD)
   */
  static isValidDate(dateStr: string): boolean {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  }

  /**
   * Validate Time format (HH:mm)
   */
  static isValidTime(timeStr: string): boolean {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return false;
    const [h, m] = timeStr.split(':').map(Number);
    return h >= 0 && h < 24 && m >= 0 && m < 60;
  }

  /**
   * Calculate late minutes between start time and arrival time
   */
  static calculateLateMinutes(startTime: string, arrivalTime: string): number {
    if (!this.isValidTime(startTime) || !this.isValidTime(arrivalTime)) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [arrH, arrM] = arrivalTime.split(':').map(Number);
    
    const startTotal = startH * 60 + startM;
    const arrTotal = arrH * 60 + arrM;
    
    return Math.max(0, arrTotal - startTotal);
  }

  /**
   * Validate Player Data
   */
  static validatePlayer(player: Partial<Player>, existingPlayerIds: string[] = []): ValidationResult {
    const errors: string[] = [];

    if (!player.FullName || player.FullName.trim().length < 2) {
      errors.push('FullName is required (min 2 characters).');
    }

    if (!player.Gender || !['Female', 'Male'].includes(player.Gender)) {
      errors.push('Gender must be "Female" or "Male".');
    }

    if (!player.DateOfBirth || !this.isValidDate(player.DateOfBirth)) {
      errors.push('DateOfBirth is required in YYYY-MM-DD format.');
    }

    if (!player.BirthYear || player.BirthYear < 2000 || player.BirthYear > 2026) {
      errors.push('Valid BirthYear is required.');
    }

    if (!player.TeamID || player.TeamID.trim().length === 0) {
      errors.push('TeamID is required.');
    }

    if (!player.ParentName || player.ParentName.trim().length < 2) {
      errors.push('ParentName is required.');
    }

    if (!player.ParentPhone || player.ParentPhone.trim().length < 5) {
      errors.push('ParentPhone is required.');
    }

    if (!player.PlayerStatus || !VALID_PLAYER_STATUSES.includes(player.PlayerStatus)) {
      errors.push(`PlayerStatus must be one of: ${VALID_PLAYER_STATUSES.join(', ')}`);
    }

    if (player.PlayerID && existingPlayerIds.includes(player.PlayerID)) {
      errors.push(`Duplicate PlayerID detected: ${player.PlayerID}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Team Data
   */
  static validateTeam(team: Partial<Team>, existingTeamIds: string[] = []): ValidationResult {
    const errors: string[] = [];

    if (!team.TeamName || team.TeamName.trim().length < 2) {
      errors.push('TeamName is required.');
    }

    if (!team.BirthYear || team.BirthYear < 2000 || team.BirthYear > 2026) {
      errors.push('Valid BirthYear is required.');
    }

    if (!team.Gender || !['Female', 'Male', 'Coed'].includes(team.Gender)) {
      errors.push('Gender must be "Female", "Male", or "Coed".');
    }

    if (!team.Category || team.Category.trim().length === 0) {
      errors.push('Category is required (e.g. U11, U12).');
    }

    if (!team.Season || team.Season.trim().length === 0) {
      errors.push('Season is required (e.g. 2025-2026).');
    }

    if (team.TeamID && existingTeamIds.includes(team.TeamID)) {
      errors.push(`Duplicate TeamID detected: ${team.TeamID}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Coach Data
   */
  static validateCoach(coach: Partial<Coach>, existingEmails: string[] = []): ValidationResult {
    const errors: string[] = [];

    if (!coach.FullName || coach.FullName.trim().length < 2) {
      errors.push('FullName is required.');
    }

    if (!coach.Email || !this.isValidEmail(coach.Email)) {
      errors.push('Valid Email address is required.');
    } else if (existingEmails.includes(coach.Email.toLowerCase())) {
      errors.push(`Duplicate Coach Email: ${coach.Email}`);
    }

    if (!coach.Phone || coach.Phone.trim().length < 5) {
      errors.push('Valid Phone is required.');
    }

    if (!coach.Role || !VALID_COACH_ROLES.includes(coach.Role)) {
      errors.push(`Role must be one of: ${VALID_COACH_ROLES.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Training Session
   */
  static validateTrainingSession(session: Partial<TrainingSession>): ValidationResult {
    const errors: string[] = [];

    if (!session.TeamID) errors.push('TeamID is required.');
    if (!session.TrainingDate || !this.isValidDate(session.TrainingDate)) {
      errors.push('Valid TrainingDate is required (YYYY-MM-DD).');
    }
    if (!session.StartTime || !this.isValidTime(session.StartTime)) {
      errors.push('Valid StartTime is required (HH:mm).');
    }
    if (!session.EndTime || !this.isValidTime(session.EndTime)) {
      errors.push('Valid EndTime is required (HH:mm).');
    }
    if (!session.Location || session.Location.trim().length === 0) {
      errors.push('Location is required.');
    }
    if (!session.CoachID) errors.push('CoachID is required.');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Attendance Record
   */
  static validateAttendanceRecord(
    record: Partial<Attendance>,
    sessionStartTime?: string
  ): ValidationResult {
    const errors: string[] = [];

    if (!record.SessionID) errors.push('SessionID is required.');
    if (!record.PlayerID) errors.push('PlayerID is required.');
    if (!record.TeamID) errors.push('TeamID is required.');
    if (!record.Status || !VALID_ATTENDANCE_STATUSES.includes(record.Status)) {
      errors.push(`Status must be one of: ${VALID_ATTENDANCE_STATUSES.join(', ')}`);
    }

    if (record.Status === 'LATE') {
      if (!record.ArrivalTime || !this.isValidTime(record.ArrivalTime)) {
        errors.push('ArrivalTime (HH:mm) is required when Status is LATE.');
      }
    }

    if (record.Status === 'EXCUSED') {
      if (!record.ExcuseType || !VALID_EXCUSE_TYPES.includes(record.ExcuseType)) {
        errors.push(`ExcuseType must be one of: ${VALID_EXCUSE_TYPES.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
