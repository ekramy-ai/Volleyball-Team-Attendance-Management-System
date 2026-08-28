/**
 * Volleyball Master Database & System Sheets Schema (Phase 1 Integration)
 * Maps the official existing master player sheet columns (Arabic headers)
 * and the 6 auxiliary system sheets.
 */

// Existing Master Player Sheet Data Interface (Arabic Column Mappings)
export interface MasterPlayerRow {
  'Player ID': string;                 // e.g. "M-G150101954" (Unique Primary Key)
  'الفريق': string;                    // Team (e.g. "براعم 2015 بنات", "براعم 2014 بنات", "براعم 2015 بنين")
  'مواليد الفريق'?: string | number;   // Team Birth Year (e.g. 2015, 2014)
  'النوع'?: string;                    // Gender/Type (e.g. "بنات", "بنين", "Female", "Male")
  'اسم اللاعب رباعي': string;          // Full Player Name (4 parts)
  'الاسم': string;                     // Short / First Name
  'رقم التليفون'?: string;             // Phone Number
  'تاريخ الميلاد'?: string;            // Date of Birth (YYYY-MM-DD)
  'النادي'?: string;                   // Club Name (e.g. "النادي الأهلي", "نادي الزهور", "نادي الصيد")
  'مواليد'?: string | number;          // Birth Year (e.g. 2015)
  'Rank'?: string | number;            // Rank / Rating in team
  [key: string]: any;                  // Future-proof dynamic additional columns
}

// Normalized Player Object for App Engine
export interface NormalizedPlayer {
  playerId: string;
  teamName: string;
  teamBirthYear: string;
  gender: string;
  fullName: string;
  shortName: string;
  phone: string;
  dateOfBirth: string;
  club: string;
  birthYear: string;
  rank: string;
  raw: MasterPlayerRow;
}

// 1. COACHES SHEET
export interface CoachRecord {
  CoachID: string;                     // COACH-0001
  FullName: string;
  Email: string;                       // Primary Google Auth login identifier
  Phone: string;
  Role: 'ADMIN' | 'HEAD_COACH' | 'ASSISTANT_COACH';
  AccountStatus: 'Active' | 'Inactive';
  CreatedAt: string;                   // ISO Date
}

// 2. COACH_TEAMS SHEET (Main Authorization Layer)
export interface CoachTeamRecord {
  AssignmentID: string;                // ASSIGN-0001
  CoachID: string;                     // Reference to COACHES.CoachID
  CoachName?: string;                  // Helpful display reference
  CoachEmail?: string;                 // Fast lookup cache
  TeamName: string;                    // Exactly matches Master Sheet 'الفريق' (e.g. "براعم 2015 بنات")
  TeamBirthYear?: string | number;
  PermissionLevel: 'FULL_MANAGE' | 'RECORD_ONLY';
  Active: boolean;
  CreatedAt: string;
}

// 3. TRAINING_SESSIONS SHEET
export interface TrainingSessionRecord {
  SessionID: string;                   // SESSION-2026-0001
  TeamName: string;                    // Matches 'الفريق'
  TeamBirthYear: string | number;
  TrainingDate: string;                // YYYY-MM-DD
  StartTime: string;                   // HH:mm (e.g. "18:00")
  EndTime: string;                     // HH:mm (e.g. "19:30")
  Location: string;                    // Court A / Hall 1
  CoachID: string;
  CoachName: string;
  CreatedAt: string;
  Status?: 'Scheduled' | 'Completed' | 'Cancelled';
  Notes?: string;
}

// 4. ATTENDANCE SHEET
export interface AttendanceRecord {
  AttendanceID: string;                // ATT-00001
  SessionID: string;                   // Foreign Key -> TRAINING_SESSIONS.SessionID
  PlayerID: string;                    // Foreign Key -> Master Sheet 'Player ID' (e.g. "M-G150101954")
  PlayerName: string;                  // Preserved at time of recording
  TeamName: string;                    // Preserved historical team
  TrainingDate: string;                // YYYY-MM-DD
  AttendanceStatus: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  ArrivalTime?: string;                // HH:mm
  LateMinutes?: number;                // Calculated: Arrival - StartTime
  ExcuseType?: 'Injury' | 'Illness' | 'School' | 'Exams' | 'Travel' | 'Family Emergency' | 'Previous Permission' | 'Other' | string;
  Notes?: string;
  CoachID: string;
  CoachName: string;
  Timestamp: string;                   // ISO Date
}

// 5. AUDIT_LOG SHEET
export interface AuditLogRecord {
  LogID: string;                       // LOG-00001
  UserEmail: string;
  UserRole: string;
  Action: string;                      // CREATE, UPDATE, TRANSFER, ATTENDANCE_SUBMIT, AUTH_DENIED
  EntityType: string;                  // PLAYER, TEAM, SESSION, ATTENDANCE, COACH
  EntityID: string;
  Details: string;
  Timestamp: string;
}

// 6. SYSTEM_SETTINGS SHEET
export interface SystemSettingRecord {
  SettingKey: string;
  SettingValue: string;
  Description: string;
  LastUpdated: string;
}

// Authorization Test Result
export interface AuthCheckResult {
  authorized: boolean;
  userEmail: string;
  role: 'ADMIN' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'UNREGISTERED';
  requestedTeam: string;
  assignedTeams: string[];
  reason: string;
  timestamp: string;
}

// Compatibility Types for Legacy Validation & Utilities
export type PlayerStatus = 'Active' | 'Injured' | 'Suspended' | 'Inactive' | 'Transferred';
export type CoachRole = 'ADMIN' | 'HEAD_COACH' | 'ASSISTANT_COACH';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
export type ExcuseType = 'Injury' | 'Illness' | 'School' | 'Exams' | 'Travel' | 'Family Emergency' | 'Previous Permission' | 'Other';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSFER' | 'ATTENDANCE_RECORD' | 'STATUS_CHANGE' | 'SYSTEM_RESET' | 'SYSTEM_INIT' | string;

export interface Player {
  PlayerID: string;
  FullName?: string;
  Gender?: 'Male' | 'Female';
  DateOfBirth?: string;
  BirthYear?: number;
  TeamID?: string;
  TeamName?: string;
  ParentName?: string;
  ParentPhone?: string;
  SecondaryPhone?: string;
  MedicalNotes?: string;
  PlayerStatus?: PlayerStatus;
  JerseyNumber?: number;
  RegistrationDate?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  [key: string]: any;
}

export interface Team {
  TeamID: string;
  TeamName?: string;
  Gender?: 'Male' | 'Female' | 'Coed';
  BirthYear?: number;
  AgeCategory?: string;
  Category?: string;
  HeadCoachID?: string;
  AssistantCoachID?: string;
  TeamStatus?: string;
  Season?: string;
  CreatedAt?: string;
  [key: string]: any;
}

export interface Coach {
  CoachID: string;
  FullName?: string;
  Email?: string;
  Phone?: string;
  Role?: CoachRole;
  AccountStatus?: 'Active' | 'Inactive';
  CreatedAt?: string;
  [key: string]: any;
}

export interface CoachTeam {
  AssignmentID: string;
  CoachID?: string;
  TeamID?: string;
  RoleInTeam?: 'HEAD' | 'ASSISTANT';
  PermissionLevel?: 'FULL_MANAGE' | 'RECORD_ONLY' | string;
  Active?: boolean;
  AssignedAt?: string;
  [key: string]: any;
}

export interface TrainingSession {
  SessionID: string;
  TeamID?: string;
  TeamName?: string;
  TrainingDate?: string;
  StartTime?: string;
  EndTime?: string;
  Location?: string;
  CoachID?: string;
  CoachName?: string;
  Notes?: string;
  CreatedAt?: string;
  [key: string]: any;
}

export interface Attendance {
  AttendanceID: string;
  SessionID?: string;
  PlayerID?: string;
  PlayerName?: string;
  TeamID?: string;
  TeamName?: string;
  TrainingDate?: string;
  Status?: AttendanceStatus;
  AttendanceStatus?: AttendanceStatus;
  ArrivalTime?: string;
  LateMinutes?: number;
  ExcuseType?: ExcuseType;
  Notes?: string;
  RecordedByCoachID?: string;
  CoachID?: string;
  CoachName?: string;
  Timestamp?: string;
  [key: string]: any;
}

export interface SystemUser {
  UserID: string;
  Email?: string;
  FullName?: string;
  Role?: 'ADMIN' | 'COACH' | 'HEAD_COACH' | 'ASSISTANT_COACH' | string;
  CoachID?: string;
  LastLogin?: string;
  Status?: 'Active' | 'Disabled';
  CreatedAt?: string;
  [key: string]: any;
}

export interface AuditLog {
  LogID: string;
  Timestamp?: string;
  ActorEmail?: string;
  UserEmail?: string;
  ActorRole?: string;
  UserRole?: string;
  Action?: AuditAction;
  TargetTable?: string;
  EntityType?: string;
  TargetRecordID?: string;
  EntityID?: string;
  Details?: string;
  PreviousState?: string;
  NewState?: string;
  IPAddress?: string;
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SheetDefinition {
  name: string;
  description: string;
  color?: string;
  primaryKey: string;
  columns: any[];
  requiredFields?: string[];
  [key: string]: any;
}

// ============================================================================
// PHASE 2: AUTHENTICATION & AUTHORIZATION SYSTEM TYPES
// ============================================================================

export type UserRole = 'ADMIN' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'UNREGISTERED';

export interface UserSessionContext {
  isAuthenticated: boolean;
  userEmail: string;
  role: UserRole;
  coachId?: string;
  fullName?: string;
  phone?: string;
  accountStatus?: 'Active' | 'Inactive';
  authorizedTeams: string[];
  permissionLevel?: 'FULL_MANAGE' | 'RECORD_ONLY' | 'ALL_PERMISSIONS';
  isAdmin: boolean;
  isHeadCoach: boolean;
  isAssistantCoach: boolean;
  authenticatedAt: string;
}

export interface AuthorizationGuardResult {
  allowed: boolean;
  statusCode: number; // 200, 401, 403
  errorCode?: 'AUTH_UNAUTHORIZED' | 'ACCOUNT_INACTIVE' | 'TEAM_FORBIDDEN' | 'ADMIN_REQUIRED' | 'INVALID_ROLE';
  userEmail: string;
  role: UserRole;
  requestedTeam?: string;
  assignedTeams: string[];
  reason: string;
  timestamp: string;
  auditLogged: boolean;
}

export interface SecurityTestScenario {
  id: string;
  title: string;
  description: string;
  category: 'ADMIN' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'UNREGISTERED' | 'TAMPERING' | 'INACTIVE';
  simulatedUserEmail: string;
  targetTeam?: string;
  actionRequired: 'READ_ROSTER' | 'SUBMIT_ATTENDANCE' | 'ADMIN_SETTINGS' | 'CREATE_COACH' | 'SWITCH_TEAM';
  expectedAllowed: boolean;
  expectedStatus: number;
  expectedRole: UserRole;
}

// ============================================================================
// PHASE 8: COACH DASHBOARD & TEAM STATISTICS TYPES
// ============================================================================

export interface CoachTodaySummary {
  date: string;
  sessionId?: string;
  teamName: string;
  totalPlayers: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendancePercentage: string;
  isToday: boolean;
}

export interface CoachWeeklySummary {
  startDate: string;
  endDate: string;
  totalSessions: number;
  averageAttendance: string;
  totalAbsences: number;
  totalLateArrivals: number;
}

export interface PlayerInsightItem {
  playerId: string;
  fullName: string;
  teamName: string;
  gender: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  totalLateMinutes: number;
  attendanceRate: string;
  rateValue: number;
  disciplineScore?: number;
  disciplineTier?: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
}

export interface CoachPlayerInsights {
  mostAbsent: PlayerInsightItem[];
  mostLate: PlayerInsightItem[];
  mostConsistent: PlayerInsightItem[];
}

export interface CoachTeamSummaryCard {
  teamName: string;
  playerCount: number;
  latestAttendanceDate?: string;
  latestAttendanceSummary?: string;
  latestSessionId?: string;
  currentAttendanceRate: string;
  totalSessionsRecorded: number;
}

export interface CoachDashboardData {
  coach: {
    coachId?: string;
    fullName: string;
    email: string;
    role: UserRole;
    authorizedTeams: string[];
  };
  selectedTeam: string;
  todaySummary: CoachTodaySummary;
  weeklySummary: CoachWeeklySummary;
  playerInsights: CoachPlayerInsights;
  myTeams: CoachTeamSummaryCard[];
}

// -------------------------------------------------------------
// PHASE 9 — ATTENDANCE HISTORY DATA STRUCTURES
// -------------------------------------------------------------
export type QuickDateFilter = 'today' | 'this_week' | 'this_month' | 'custom' | 'all';

export interface AttendanceHistoryFilters {
  quickDate?: QuickDateFilter;
  startDate?: string;
  endDate?: string;
  team?: string;
  playerId?: string;
  playerName?: string;
  coachId?: string;
  status?: 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AttendanceHistorySummary {
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendancePercentage: string;
  totalLateMinutes: number;
}

export interface AttendanceHistoryQueryResult {
  success: boolean;
  records: AttendanceRecord[];
  summary: AttendanceHistorySummary;
  availableTeams: string[];
  availableCoaches: { coachId: string; fullName: string }[];
  userRole: string;
  isRestrictedToCoachTeams: boolean;
  authorizedTeams: string[];
  errorCode?: string;
  error?: string;
}

export interface AttendanceRecordEditPayload {
  attendanceStatus?: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  arrivalTime?: string;
  lateMinutes?: number;
  excuseType?: string;
  notes?: string;
}

// -------------------------------------------------------------
// PHASE 10 — PLAYER ATTENDANCE PROFILE DATA STRUCTURES
// -------------------------------------------------------------
export interface PlayerAttendanceTrendPoint {
  date: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  lateMinutes: number;
  sessionId: string;
  notes?: string;
}

export interface PlayerAbsenceSummary {
  totalAbsences: number;
  unexcusedAbsences: number;
  excusedAbsences: number;
  excuseBreakdown: { reason: string; count: number }[];
  latestAbsenceDate?: string;
}

export interface PlayerLatenessSummary {
  totalLateSessions: number;
  totalLateMinutes: number;
  averageLateMinutes: number;
  maxLateMinutes: number;
  latestLateDate?: string;
  latenessList: { date: string; arrivalTime: string; lateMinutes: number; notes?: string }[];
}

export interface PlayerAttendanceProfile {
  // Player Identity
  playerId: string;
  playerName: string;
  currentTeam: string;
  teamBirthYear: string;
  nationalId?: string;
  birthDate?: string;
  jerseyNumber?: string;
  parentPhone?: string;
  parentName?: string;
  status?: string;

  // Attendance Statistics
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  totalLateMinutes: number;

  // Calculated Rates
  // Attendance Rate = (PRESENT + LATE) / Total Sessions × 100
  attendanceRate: string;
  attendanceRateValue: number;

  // Absence Rate = ABSENT / Total Sessions × 100
  absenceRate: string;
  absenceRateValue: number;

  // Late Rate = LATE / Total Sessions × 100
  lateRate: string;
  lateRateValue: number;

  // Displays & Trends
  recentHistory: AttendanceRecord[];
  attendanceTrend: PlayerAttendanceTrendPoint[];
  absenceSummary: PlayerAbsenceSummary;
  latenessSummary: PlayerLatenessSummary;

  // PHASE 11: DISCIPLINE SCORE
  disciplineScore: number;
  disciplineDetails: DisciplineScoreDetails;
}

export interface PlayerProfileQueryResult {
  success: boolean;
  profile?: PlayerAttendanceProfile;
  userRole?: string;
  isAuthorized?: boolean;
  errorCode?: string;
  error?: string;
}

export interface PlayerProfileListItem {
  playerId: string;
  playerName: string;
  currentTeam: string;
  teamBirthYear: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: string;
  attendanceRateValue: number;
  disciplineScore: number;
  disciplineTier: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  lastRecordedDate?: string;
}

export interface PlayerProfilesListResult {
  success: boolean;
  players: PlayerProfileListItem[];
  totalPlayers: number;
  availableTeams: string[];
  authorizedTeams: string[];
  errorCode?: string;
  error?: string;
}

// -------------------------------------------------------------
// PHASE 11 — PLAYER DISCIPLINE SCORE CONFIGURATION & DETAILS
// -------------------------------------------------------------
export interface DisciplineSettings {
  startingPoints: number; // default: 100
  unexcusedAbsencePenalty: number; // default: 10
  excusedAbsencePenalty: number; // default: 3
  latePenalty: number; // default: 2
  updatedAt?: string;
  updatedBy?: string;
}

export interface DisciplineScoreDetails {
  startingPoints: number;
  unexcusedDeduction: number;
  excusedDeduction: number;
  lateDeduction: number;
  totalDeductions: number;
  finalScore: number; // Math.max(0, 100 - totalDeductions)
  tier: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  tierLabelAr: string;
  tierLabelEn: string;
  penaltiesApplied: {
    unexcusedAbsences: number;
    unexcusedPenaltyRate: number;
    excusedAbsences: number;
    excusedPenaltyRate: number;
    lateSessions: number;
    latePenaltyRate: number;
  };
}

export interface DisciplineSettingsResult {
  success: boolean;
  settings: DisciplineSettings;
  errorCode?: string;
  error?: string;
}

// -------------------------------------------------------------
// PHASE 11.5 — GOOGLE SHEETS DATABASE SELECTION & CONFIGURATION
// -------------------------------------------------------------

export interface ColumnMapping {
  PlayerID: string; // e.g. "Player ID" or "كود اللاعب"
  PlayerName: string; // e.g. "الاسم" or "اسم اللاعب"
  FullPlayerName: string; // e.g. "اسم اللاعب رباعي" or "الاسم بالكامل"
  TeamName: string; // e.g. "الفريق"
  TeamBirthYear: string; // e.g. "مواليد الفريق"
  Gender: string; // e.g. "النوع" or "الجنس"
  BirthYear: string; // e.g. "مواليد"
  DateOfBirth: string; // e.g. "تاريخ الميلاد"
}

export interface DatabaseProfile {
  id: string; // e.g. "DB_PROF_001"
  databaseName: string; // e.g. "قاعدة بيانات الكرة الطائرة - موسم 2025/2026"
  spreadsheetId: string;
  spreadsheetUrl: string;
  playersSheetName: string; // e.g. "Volleyball Player Database" or "قاعدة بيانات اللاعبين"
  coachesSheetName: string; // e.g. "Coaches"
  coachTeamsSheetName: string; // e.g. "CoachTeams"
  trainingSessionsSheetName: string; // e.g. "TrainingSessions"
  attendanceSheetName: string; // e.g. "Attendance"
  auditLogSheetName: string; // e.g. "AuditLog"
  systemSettingsSheetName: string; // e.g. "SystemSettings"
  columnMapping: ColumnMapping;
  databaseStatus: 'ACTIVE' | 'INACTIVE';
  lastConnectionTest?: string;
  lastValidationStatus?: 'VALID' | 'INVALID' | 'UNTESTED';
  validationSummary?: DatabaseValidationReport;
  createdAt: string;
  updatedAt: string;
  createdByUser: string;
}

export interface DatabaseValidationCheck {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  category: 'CONNECTION' | 'STRUCTURE' | 'COLUMNS' | 'DATA_INTEGRITY' | 'SAFETY';
}

export interface DatabaseValidationReport {
  isValid: boolean;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  availableSheets?: string[];
  totalChecks: number;
  passedChecks: number;
  checks: DatabaseValidationCheck[];
  timestamp: string;
}

export interface SpreadsheetConnectionTestResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  availableSheets?: string[];
  sampleHeaders?: { [sheetName: string]: string[] };
  error?: string;
  errorCode?: string;
}

export interface DatabaseProfilesListResult {
  success: boolean;
  profiles: DatabaseProfile[];
  activeProfileId: string;
  activeProfile?: DatabaseProfile;
  error?: string;
  errorCode?: string;
}

export interface DatabaseSwitchResult {
  success: boolean;
  previousProfileId?: string;
  activeProfileId: string;
  activeProfile?: DatabaseProfile;
  validationReport: DatabaseValidationReport;
  auditLogId?: string;
  error?: string;
  errorCode?: string;
}

// -------------------------------------------------------------
// PHASE 11.6 — MASTER PLAYER DATABASE & RECORD INTEGRATION
// -------------------------------------------------------------

export interface StandardizedPlayer {
  PlayerID: string;
  PlayerName: string;
  FullPlayerName: string;
  TeamName: string;
  TeamBirthYear: string | number;
  Gender: string;
  BirthYear: string | number;
  DateOfBirth: string;
  PhoneNumber: string;
  Club: string;
  Rank?: string | number;
  raw?: any;
}

export interface MasterPlayerDatabaseDebugInfo {
  activeDatabaseName: string;
  activeSpreadsheetId: string;
  activeSpreadsheetName: string;
  configuredPlayerSheetName: string;
  actualPlayerSheetFound: boolean;
  detectedHeaders: string[];
  currentColumnMapping: ColumnMapping;
  totalRowsFound: number;
  totalValidPlayers: number;
  first5Players: StandardizedPlayer[];
  playersPerTeam: Record<string, number>;
  timestamp: string;
}

export interface Phase11_6DiagnosticTest {
  ruleNumber: number;
  testName: string;
  category: string;
  passed: boolean;
  errorCode?: string;
  details: string;
}

// -------------------------------------------------------------
// PHASE 12 — ADMIN DASHBOARD & CLUB ANALYTICS INTERFACES
// -------------------------------------------------------------

export interface AdminClubOverview {
  totalPlayers: number;
  totalTeams: number;
  totalCoaches: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  excusedToday: number;
  todayDate: string;
}

export interface TeamAnalyticsItem {
  teamName: string;
  teamBirthYear: string | number;
  gender: string;
  playerCount: number;
  sessionCount: number;
  totalAttendances: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number; // 0 - 100
  absenceRate: number;    // 0 - 100
  disciplineScore: number; // 0 - 100 (weighted score: Present = 1.0, Late = 0.6, Excused = 0.5, Absent = 0.0)
}

export interface PlayerAnalyticsSummary {
  playerId: string;
  fullName: string;
  shortName: string;
  teamName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  absenceRate: number;
  requiresAttention: boolean;
  attentionReason?: string;
}

export interface ClubAnalyticsReport {
  overview: AdminClubOverview;
  teams: TeamAnalyticsItem[];
  playerAnalytics: {
    highestAttendance: PlayerAnalyticsSummary[];
    highestAbsence: PlayerAnalyticsSummary[];
    repeatedLateness: PlayerAnalyticsSummary[];
    requiringAttention: PlayerAnalyticsSummary[];
  };
  filterOptions: {
    availableTeams: string[];
    availableBirthYears: string[];
    availableGenders: string[];
  };
  generatedAt: string;
}


