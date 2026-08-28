/**
 * Unique ID Generator for Volleyball Attendance System
 * Follows exact specification formats:
 * - PLR-0001, PLR-0002 (Players)
 * - T001, T002 (Teams)
 * - COACH-0001 (Coaches)
 * - ASSIGN-0001 (Coach Team Assignments)
 * - SESSION-2026-0001 (Training Sessions)
 * - ATT-0001 (Attendance Records)
 * - USR-0001 (System Users)
 * - LOG-0001 (Audit Logs)
 */

export class IdGenerator {
  /**
   * Generates next Player ID (PLR-XXXX)
   */
  static nextPlayerId(existingIds: string[]): string {
    return this.generateSequentialId('PLR-', existingIds, 4);
  }

  /**
   * Generates next Team ID (T001, T002...)
   */
  static nextTeamId(existingIds: string[]): string {
    return this.generateSequentialId('T', existingIds, 3);
  }

  /**
   * Generates next Coach ID (COACH-XXXX)
   */
  static nextCoachId(existingIds: string[]): string {
    return this.generateSequentialId('COACH-', existingIds, 4);
  }

  /**
   * Generates next Assignment ID (ASSIGN-XXXX)
   */
  static nextAssignmentId(existingIds: string[]): string {
    return this.generateSequentialId('ASSIGN-', existingIds, 4);
  }

  /**
   * Generates next Training Session ID (SESSION-YYYY-XXXX)
   */
  static nextSessionId(existingIds: string[], year: number = new Date().getFullYear()): string {
    const prefix = `SESSION-${year}-`;
    return this.generateSequentialId(prefix, existingIds, 4);
  }

  /**
   * Generates next Attendance ID (ATT-XXXX)
   */
  static nextAttendanceId(existingIds: string[]): string {
    return this.generateSequentialId('ATT-', existingIds, 5);
  }

  /**
   * Generates next User ID (USR-XXXX)
   */
  static nextUserId(existingIds: string[]): string {
    return this.generateSequentialId('USR-', existingIds, 4);
  }

  /**
   * Generates next Audit Log ID (LOG-XXXX)
   */
  static nextLogId(existingIds: string[]): string {
    return this.generateSequentialId('LOG-', existingIds, 5);
  }

  /**
   * Helper to parse existing numbers and generate padded increment
   */
  private static generateSequentialId(prefix: string, existingIds: string[], padLength: number): string {
    let maxNumber = 0;
    
    for (const id of existingIds) {
      if (id && id.startsWith(prefix)) {
        const numPart = id.substring(prefix.length);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxNumber) {
          maxNumber = parsed;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(padLength, '0')}`;
  }
}
