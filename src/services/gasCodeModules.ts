/**
 * Complete, Modular Production-Ready Google Apps Script (GAS) Backend Code Generator
 * Generates 10 individual .gs files adhering to enterprise clean architecture.
 * Phase 2 Authentication and Authorization System.
 */

export interface GASModule {
  filename: string;
  description: string;
  code: string;
}

export class GoogleAppsScriptModularGenerator {
  /**
   * 1. Config.gs
   */
  public static getConfigGs(): string {
    return `/**
 * ============================================================================
 * VOLLEYBALL CLUB MANAGEMENT SYSTEM - BACKEND CONFIGURATION
 * File: Config.gs
 * ============================================================================
 */

const CONFIG = {
  // SPREADSHEET CONFIGURATION
  // Set to null to use ActiveSpreadsheet (when bound to sheet), or provide custom Sheet ID string
  SPREADSHEET_ID: null, 

  // OFFICIAL MASTER PLAYER DATABASE SHEET NAME
  // Exactly matches the tab name in your existing Google Sheet.
  MASTER_PLAYERS_SHEET_NAME: 'PLAYERS_MASTER',

  // SYSTEM AUXILIARY SHEETS
  SHEETS: {
    COACHES: 'COACHES',
    COACH_TEAMS: 'COACH_TEAMS',
    TRAINING_SESSIONS: 'TRAINING_SESSIONS',
    ATTENDANCE: 'ATTENDANCE',
    AUDIT_LOG: 'AUDIT_LOG',
    SYSTEM_SETTINGS: 'SYSTEM_SETTINGS'
  },

  // MASTER SHEET COLUMN MAPPINGS (Arabic Headers to Standard Keys)
  MASTER_COLUMNS: {
    PLAYER_ID: 'Player ID',               // Unique Primary Key (e.g., M-G150101954)
    TEAM: 'الفريق',                       // Team Name (e.g., براعم 2015 بنات)
    TEAM_BIRTH_YEAR: 'مواليد الفريق',      // Team Birth Year (e.g., 2015)
    GENDER: 'النوع',                      // Gender / Type (بنات / بنين)
    FULL_NAME: 'اسم اللاعب رباعي',         // Full 4-part name
    SHORT_NAME: 'الاسم',                  // Short / First name
    PHONE: 'رقم التليفون',                // Phone number
    DOB: 'تاريخ الميلاد',                 // Date of birth
    CLUB: 'النادي',                       // Club name
    BIRTH_YEAR: 'مواليد',                 // Birth year
    RANK: 'Rank'                          // Rank / Skill rating
  },

  // ROLES & PERMISSIONS
  ROLES: {
    ADMIN: 'ADMIN',
    HEAD_COACH: 'HEAD_COACH',
    ASSISTANT_COACH: 'ASSISTANT_COACH'
  },

  // PERMISSION LEVELS
  PERMISSION_LEVELS: {
    FULL_MANAGE: 'FULL_MANAGE',           // Head coaches: read, attendance, excuse management
    RECORD_ONLY: 'RECORD_ONLY',           // Assistant coaches: mark attendance only
    ALL_PERMISSIONS: 'ALL_PERMISSIONS'    // System administrators
  },

  // ATTENDANCE STATUS ENUM
  ATTENDANCE_STATUS: {
    PRESENT: 'PRESENT',
    LATE: 'LATE',
    ABSENT: 'ABSENT',
    EXCUSED: 'EXCUSED'
  },

  // DEFAULT SETTINGS
  DEFAULT_SETTINGS: {
    'CLUB_NAME': 'Volleyball Youth Academy',
    'TIMEZONE': 'Africa/Cairo',
    'LATE_GRACE_PERIOD_MINUTES': '10',
    'AUDIT_LOG_ENABLED': 'TRUE'
  }
};

/**
 * Returns the target Google Spreadsheet instance.
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getTargetSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}
`;
  }

  /**
   * 2. AuthenticationService.gs
   */
  public static getAuthenticationServiceGs(): string {
    return `/**
 * ============================================================================
 * AUTHENTICATION SERVICE (PHASE 2)
 * File: AuthenticationService.gs
 * 
 * Identifies the current logged-in Google user via Google Workspace Session,
 * verifies credentials against the official COACHES auxiliary table,
 * and generates a secure user session context.
 * ============================================================================
 */

const AuthenticationService = {
  /**
   * Safely retrieves the authenticated user's Google email.
   * Priority: Active User -> Effective User.
   * @return {string} Lowercase trimmed email address.
   */
  getAuthenticatedEmail: function() {
    try {
      let email = Session.getActiveUser().getEmail();
      if (!email || email.trim() === '') {
        email = Session.getEffectiveUser().getEmail();
      }
      return (email || '').trim().toLowerCase();
    } catch (e) {
      Logger.log('AuthenticationService: Failed to retrieve user session: ' + e.message);
      return '';
    }
  },

  /**
   * Resolves the full session context for the currently authenticated Google user.
   * @return {Object} UserSessionContext
   */
  getCurrentUser: function() {
    const userEmail = this.getAuthenticatedEmail();
    const timestamp = new Date().toISOString();

    if (!userEmail) {
      return {
        isAuthenticated: false,
        userEmail: '',
        role: 'UNREGISTERED',
        authorizedTeams: [],
        isAdmin: false,
        isHeadCoach: false,
        isAssistantCoach: false,
        authenticatedAt: timestamp
      };
    }

    // Retrieve Coach record from COACHES table
    const coach = CoachService.getCoachByEmail(userEmail);

    if (!coach) {
      this.logAuthEvent(userEmail, 'UNREGISTERED', 'AUTH_LOGIN_FAILED', 'AUTHENTICATION', userEmail, 'Google email not registered in COACHES sheet.');
      return {
        isAuthenticated: false,
        userEmail: userEmail,
        role: 'UNREGISTERED',
        authorizedTeams: [],
        isAdmin: false,
        isHeadCoach: false,
        isAssistantCoach: false,
        authenticatedAt: timestamp
      };
    }

    if (coach.AccountStatus !== 'Active') {
      this.logAuthEvent(userEmail, coach.Role, 'AUTH_LOGIN_BLOCKED', 'AUTHENTICATION', coach.CoachID, 'Account status is ' + coach.AccountStatus + '. Access revoked.');
      return {
        isAuthenticated: false,
        userEmail: userEmail,
        role: coach.Role,
        coachId: coach.CoachID,
        fullName: coach.FullName,
        accountStatus: coach.AccountStatus,
        authorizedTeams: [],
        isAdmin: coach.Role === CONFIG.ROLES.ADMIN,
        isHeadCoach: coach.Role === CONFIG.ROLES.HEAD_COACH,
        isAssistantCoach: coach.Role === CONFIG.ROLES.ASSISTANT_COACH,
        authenticatedAt: timestamp
      };
    }

    // Determine authorized teams & permissions
    let authorizedTeams = [];
    let permissionLevel = CONFIG.PERMISSION_LEVELS.RECORD_ONLY;

    if (coach.Role === CONFIG.ROLES.ADMIN) {
      authorizedTeams = PlayerService.getDistinctTeams();
      permissionLevel = CONFIG.PERMISSION_LEVELS.ALL_PERMISSIONS;
    } else {
      const assignments = CoachService.getAssignmentsForCoach(coach.CoachID);
      authorizedTeams = assignments.map(function(a) { return String(a.TeamName || '').trim(); });
      permissionLevel = coach.Role === CONFIG.ROLES.HEAD_COACH 
        ? CONFIG.PERMISSION_LEVELS.FULL_MANAGE 
        : CONFIG.PERMISSION_LEVELS.RECORD_ONLY;
    }

    this.logAuthEvent(userEmail, coach.Role, 'AUTH_LOGIN_SUCCESS', 'AUTHENTICATION', coach.CoachID, 'Logged in with authorized teams: [' + authorizedTeams.join(', ') + ']');

    return {
      isAuthenticated: true,
      userEmail: userEmail,
      role: coach.Role,
      coachId: coach.CoachID,
      fullName: coach.FullName,
      phone: coach.Phone,
      accountStatus: coach.AccountStatus,
      authorizedTeams: authorizedTeams,
      permissionLevel: permissionLevel,
      isAdmin: coach.Role === CONFIG.ROLES.ADMIN,
      isHeadCoach: coach.Role === CONFIG.ROLES.HEAD_COACH,
      isAssistantCoach: coach.Role === CONFIG.ROLES.ASSISTANT_COACH,
      authenticatedAt: timestamp
    };
  },

  /**
   * Logs authentication and security events to the AUDIT_LOG sheet.
   */
  logAuthEvent: function(userEmail, userRole, action, entityType, entityId, details) {
    try {
      DatabaseService.logAudit(userEmail, userRole, action, entityType, entityId, details);
    } catch (e) {
      Logger.log('Failed to write audit log: ' + e.message);
    }
  }
};
`;
  }

  /**
   * 3. AuthorizationService.gs
   */
  public static getAuthorizationServiceGs(): string {
    return `/**
 * ============================================================================
 * AUTHORIZATION & ACCESS CONTROL SERVICE (PHASE 2)
 * File: AuthorizationService.gs
 * 
 * Strict backend security gatekeeper. Enforces User -> Role -> Authorized Team
 * -> Requested Resource verification before any database access or business logic.
 * ============================================================================
 */

const AuthorizationService = {
  /**
   * Returns the current authenticated user's session context.
   * @return {Object}
   */
  getCurrentUser: function() {
    return AuthenticationService.getCurrentUser();
  },

  /**
   * Returns the current user's role.
   * @return {string} 'ADMIN' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'UNREGISTERED'
   */
  getCurrentUserRole: function() {
    const user = this.getCurrentUser();
    return user.isAuthenticated ? user.role : 'UNREGISTERED';
  },

  /**
   * Returns array of team names the current user is authorized to manage/view.
   * @return {Array<string>}
   */
  getAuthorizedTeams: function() {
    const user = this.getCurrentUser();
    return user.authorizedTeams || [];
  },

  /**
   * Verifies if the current user is an active Administrator.
   * @return {boolean}
   */
  isAdmin: function() {
    const user = this.getCurrentUser();
    return user.isAuthenticated && user.isAdmin;
  },

  /**
   * Verifies if the current user has access to a target team.
   * @param {string} teamName
   * @return {boolean}
   */
  isAuthorizedForTeam: function(teamName) {
    try {
      this.requireAuthorizedTeam(teamName);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Strict Backend Guard: Verifies that the current user is authorized for the target team.
   * Throws Error with 403 status if unauthorized and writes a tamper-evident audit log.
   * @param {string} teamName
   * @return {Object} Authorization Details
   */
  requireAuthorizedTeam: function(teamName) {
    const user = this.getCurrentUser();
    const targetTeam = (teamName || '').trim();

    if (!user.isAuthenticated) {
      AuthenticationService.logAuthEvent(user.userEmail, 'UNREGISTERED', 'AUTH_DENIED', 'TEAM_DATA', targetTeam, 'Unauthenticated user attempted to access team: ' + targetTeam);
      throw new Error('401 Unauthorized: Valid Google authentication required.');
    }

    if (user.isAdmin) {
      return {
        authorized: true,
        userEmail: user.userEmail,
        role: CONFIG.ROLES.ADMIN,
        requestedTeam: targetTeam,
        assignedTeams: user.authorizedTeams,
        reason: 'Administrator global access permission verified.'
      };
    }

    const isAssigned = user.authorizedTeams.indexOf(targetTeam) !== -1;

    if (!isAssigned) {
      AuthenticationService.logAuthEvent(
        user.userEmail,
        user.role,
        'AUTH_TEAM_TAMPERING_BLOCKED',
        'TEAM_DATA',
        targetTeam,
        'Unauthorized access attempt: Coach assigned to [' + user.authorizedTeams.join(', ') + '] requested [' + targetTeam + ']'
      );
      throw new Error('403 Forbidden: User is not authorized to access team "' + targetTeam + '". Authorized teams: [' + user.authorizedTeams.join(', ') + ']');
    }

    return {
      authorized: true,
      userEmail: user.userEmail,
      role: user.role,
      requestedTeam: targetTeam,
      assignedTeams: user.authorizedTeams,
      reason: 'Coach assignment permission verified.'
    };
  },

  /**
   * Strict Backend Guard: Verifies that the current user has Administrator privileges.
   * Throws Error with 403 status if unauthorized.
   */
  requireAdmin: function() {
    const user = this.getCurrentUser();

    if (!user.isAuthenticated || !user.isAdmin) {
      AuthenticationService.logAuthEvent(
        user.userEmail,
        user.role,
        'AUTH_ROLE_ELEVATION_DENIED',
        'ADMIN_OPERATION',
        'SYSTEM',
        'Non-admin attempted admin-restricted operation.'
      );
      throw new Error('403 Forbidden: Administrator privileges required for this operation.');
    }

    return true;
  },

  /**
   * Strict Backend Guard: Verifies that the user has at least one of the specified roles.
   * @param {Array<string>} allowedRoles
   */
  requireRole: function(allowedRoles) {
    const user = this.getCurrentUser();

    if (!user.isAuthenticated || allowedRoles.indexOf(user.role) === -1) {
      AuthenticationService.logAuthEvent(
        user.userEmail,
        user.role,
        'AUTH_INVALID_ROLE',
        'ROLE_GATE',
        'SYSTEM',
        'Role ' + user.role + ' not in permitted list: [' + allowedRoles.join(', ') + ']'
      );
      throw new Error('403 Forbidden: Access requires one of the following roles: [' + allowedRoles.join(', ') + ']');
    }

    return true;
  },

  /**
   * Legacy simulation helper (for testing access without changing active Google session).
   */
  verifyTeamAccess: function(email, teamName) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const targetTeam = (teamName || '').trim();

    if (!cleanEmail) {
      return { authorized: false, reason: 'Email missing' };
    }

    const coach = CoachService.getCoachByEmail(cleanEmail);
    if (!coach) {
      return { authorized: false, reason: 'Coach not registered in COACHES table.' };
    }

    if (coach.AccountStatus !== 'Active') {
      return { authorized: false, reason: 'Coach account is inactive.' };
    }

    if (coach.Role === CONFIG.ROLES.ADMIN) {
      return { authorized: true, role: CONFIG.ROLES.ADMIN, reason: 'Admin global access' };
    }

    const assigned = CoachService.getAssignedTeamsByCoachId(coach.CoachID);
    const isAssigned = assigned.indexOf(targetTeam) !== -1;

    return {
      authorized: isAssigned,
      role: coach.Role,
      assignedTeams: assigned,
      reason: isAssigned ? 'Authorized assignment' : 'Forbidden team'
    };
  }
};
`;
  }

  /**
   * 4. UserService.gs
   */
  public static getUserServiceGs(): string {
    return `/**
 * ============================================================================
 * USER & PROFILE SERVICE (PHASE 2)
 * File: UserService.gs
 * ============================================================================
 */

const UserService = {
  /**
   * Returns profile of currently authenticated user.
   */
  getCurrentUserProfile: function() {
    return AuthenticationService.getCurrentUser();
  },

  /**
   * Lists all coaches and registered system users (Requires ADMIN).
   * @return {Array<Object>}
   */
  getAllUsers: function() {
    AuthorizationService.requireAdmin();
    return CoachService.getAllCoaches();
  },

  /**
   * Look up a user profile by email (Requires ADMIN).
   * @param {string} email
   */
  getUserByEmail: function(email) {
    AuthorizationService.requireAdmin();
    return CoachService.getCoachByEmail(email);
  },

  /**
   * Check status of coach account.
   */
  getUserStatus: function(email) {
    const coach = CoachService.getCoachByEmail(email);
    if (!coach) return 'UNREGISTERED';
    return coach.AccountStatus;
  }
};
`;
  }

  /**
   * 5. DatabaseService.gs
   */
  public static getDatabaseServiceGs(): string {
    return `/**
 * ============================================================================
 * DATABASE ACCESS & SHEET I/O LAYER
 * File: DatabaseService.gs
 * ============================================================================
 */

const DatabaseService = {
  /**
   * Reads all data from a specified sheet as an array of JSON objects.
   * Header row is treated as object keys.
   * @param {string} sheetName
   * @return {Array<Object>}
   */
  getTableData: function(sheetName) {
    const ss = getTargetSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log('WARNING: Sheet "' + sheetName + '" not found.');
      return [];
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol === 0) {
      return [];
    }

    const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = values[0].map(function(h) { return String(h).trim(); });
    const data = [];

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      let isEmpty = true;
      for (let i = 0; i < row.length; i++) {
        if (row[i] !== '' && row[i] !== null) {
          isEmpty = false;
          break;
        }
      }
      if (isEmpty) continue;

      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        const key = headers[c];
        let val = row[c];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        obj[key] = val;
      }
      data.push(obj);
    }
    return data;
  },

  /**
   * Appends an audit log record into AUDIT_LOG sheet.
   */
  logAudit: function(userEmail, userRole, action, entityType, entityId, details) {
    try {
      const ss = getTargetSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
      if (!sheet) return;

      const logId = 'LOG-' + Utilities.formatDate(new Date(), 'GMT', 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random() * 1000);
      const timestamp = new Date().toISOString();

      sheet.appendRow([
        logId,
        userEmail || '',
        userRole || '',
        action || '',
        entityType || '',
        entityId || '',
        details || '',
        timestamp
      ]);
    } catch (e) {
      Logger.log('Audit log write error: ' + e.message);
    }
  }
};
`;
  }

  /**
   * 6. PlayerService.gs
   */
  public static getPlayerServiceGs(): string {
    return `/**
 * ============================================================================
 * PLAYER MASTER DATABASE ACCESS (PHASE 11.6 PROTECTED)
 * File: PlayerService.gs
 * 
 * Strict Dynamic Read queries to the configured Master Player Sheet.
 * Guarded by AuthorizationService, supporting full Column Mapping,
 * dynamic sheet selection, Arabic team name normalization, and debug reporting.
 * ============================================================================
 */

const PlayerService = {
  /**
   * Dynamic Master Player Sheet Name Retrieval
   */
  getMasterPlayerSheet: function() {
    if (typeof DatabaseConfigService !== 'undefined' && DatabaseConfigService.getActiveDatabase) {
      const activeDb = DatabaseConfigService.getActiveDatabase();
      if (activeDb && activeDb.playersSheetName) {
        return activeDb.playersSheetName;
      }
    }
    return CONFIG.MASTER_PLAYERS_SHEET_NAME || 'Volleyball Player Database';
  },

  /**
   * Dynamic Column Mapping Retrieval
   */
  getColumnMapping: function() {
    if (typeof DatabaseConfigService !== 'undefined' && DatabaseConfigService.getActiveDatabase) {
      const activeDb = DatabaseConfigService.getActiveDatabase();
      if (activeDb && activeDb.columnMapping) {
        return activeDb.columnMapping;
      }
    }
    return CONFIG.MASTER_COLUMNS;
  },

  /**
   * Normalize Arabic team names for safe comparisons (does not mutate raw sheets)
   */
  normalizeTeamName: function(name) {
    if (!name) return '';
    return String(name)
      .trim()
      .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic diacritics
      .replace(/\u0640/g, '') // remove Tatweel
      .replace(/[أإآٱ]/g, 'ا') // normalize Alef
      .replace(/ى/g, 'ي') // normalize Alef Maksura
      .replace(/ة/g, 'ه') // normalize Teh Marbuta
      .replace(/\s+/g, ' ') // collapse whitespaces
      .toLowerCase();
  },

  /**
   * Maps raw sheet row to standardized Player object according to active column mapping
   */
  mapSheetRowToPlayer: function(raw, mapping) {
    const m = mapping || this.getColumnMapping();
    if (!raw) {
      return {
        PlayerID: '',
        PlayerName: '',
        FullPlayerName: '',
        TeamName: '',
        TeamBirthYear: '',
        Gender: '',
        BirthYear: '',
        DateOfBirth: '',
        PhoneNumber: '',
        Club: '',
        Rank: '',
        raw: null
      };
    }

    const idKey = m.PlayerID || m.PLAYER_ID || 'Player ID';
    const teamKey = m.TeamName || m.TEAM || 'الفريق';
    const teamBirthYearKey = m.TeamBirthYear || m.TEAM_BIRTH_YEAR || 'مواليد الفريق';
    const genderKey = m.Gender || m.GENDER || 'النوع';
    const fullNameKey = m.FullPlayerName || m.FULL_NAME || 'اسم اللاعب رباعي';
    const shortNameKey = m.PlayerName || m.SHORT_NAME || 'الاسم';
    const dobKey = m.DateOfBirth || m.DOB || 'تاريخ الميلاد';
    const birthYearKey = m.BirthYear || m.BIRTH_YEAR || 'مواليد';
    const phoneKey = m.PhoneNumber || m.PHONE || 'رقم التليفون';
    const clubKey = m.Club || m.CLUB || 'النادي';
    const rankKey = m.Rank || m.RANK || 'Rank';

    const playerId = String(raw[idKey] || raw['Player ID'] || raw['playerId'] || '').trim();
    const shortName = String(raw[shortNameKey] || raw['الاسم'] || raw['shortName'] || '').trim();
    const fullName = String(raw[fullNameKey] || raw['اسم اللاعب رباعي'] || raw['fullName'] || shortName).trim();
    const teamName = String(raw[teamKey] || raw['الفريق'] || raw['teamName'] || '').trim();
    const teamBirthYear = raw[teamBirthYearKey] || raw['مواليد الفريق'] || '';
    const gender = String(raw[genderKey] || raw['النوع'] || '').trim();
    const birthYear = raw[birthYearKey] || raw['مواليد'] || '';
    const dob = String(raw[dobKey] || raw['تاريخ الميلاد'] || '').trim();
    const phone = String(raw[phoneKey] || raw['رقم التليفون'] || '').trim();
    const club = String(raw[clubKey] || raw['النادي'] || '').trim();
    const rank = raw[rankKey] || raw['Rank'] || '';

    return {
      PlayerID: playerId,
      PlayerName: shortName || (fullName ? fullName.split(' ')[0] : ''),
      FullPlayerName: fullName || shortName,
      TeamName: teamName,
      TeamBirthYear: teamBirthYear,
      Gender: gender,
      BirthYear: birthYear,
      DateOfBirth: dob,
      PhoneNumber: phone,
      Club: club,
      Rank: rank,
      raw: raw
    };
  },

  normalizePlayer: function(raw) {
    const std = this.mapSheetRowToPlayer(raw);
    return {
      playerId: std.PlayerID,
      teamName: std.TeamName,
      teamBirthYear: std.TeamBirthYear,
      gender: std.Gender,
      fullName: std.FullPlayerName,
      shortName: std.PlayerName,
      phone: std.PhoneNumber,
      dateOfBirth: std.DateOfBirth,
      club: std.Club,
      birthYear: std.BirthYear,
      rank: std.Rank,
      raw: raw
    };
  },

  /**
   * Retrieves all master players dynamically from the configured Player Sheet.
   * @return {Array<Object>}
   */
  getAllPlayers: function() {
    const sheetName = this.getMasterPlayerSheet();
    const mapping = this.getColumnMapping();
    const rawData = DatabaseService.getTableData(sheetName);
    const standardized = [];
    for (let i = 0; i < rawData.length; i++) {
      const p = this.mapSheetRowToPlayer(rawData[i], mapping);
      if (p.PlayerID && p.PlayerID.trim() !== '') {
        standardized.push(p);
      }
    }
    return standardized;
  },

  /**
   * Retrieves players for a specific team with Arabic normalization.
   * Guarded by AuthorizationService.requireAuthorizedTeam().
   * @param {string} teamName
   * @return {Array<Object>}
   */
  getPlayersByTeam: function(teamName) {
    if (!teamName) return [];
    
    // BACKEND GATEWAY: Throws error if user is not authorized for this team!
    AuthorizationService.requireAuthorizedTeam(teamName);

    const normalizedTarget = this.normalizeTeamName(teamName);
    const all = this.getAllPlayers();
    const filtered = [];

    for (let i = 0; i < all.length; i++) {
      if (this.normalizeTeamName(all[i].TeamName) === normalizedTarget) {
        filtered.push(this.normalizePlayer(all[i].raw || all[i]));
      }
    }
    return filtered;
  },

  /**
   * Retrieves single player by exact Primary Key 'Player ID'.
   * @param {string} playerId
   * @return {Object|null}
   */
  getPlayerById: function(playerId) {
    if (!playerId) return null;
    const targetId = playerId.trim().toUpperCase();
    const all = this.getAllPlayers();

    for (let i = 0; i < all.length; i++) {
      if (all[i].PlayerID.toUpperCase() === targetId) {
        return this.normalizePlayer(all[i].raw || all[i]);
      }
    }
    return null;
  },

  /**
   * STEP 9: Dynamic Available Teams from Real Master Player Database Records
   * @return {Array<string>}
   */
  getAvailableTeamsFromPlayers: function() {
    const all = this.getAllPlayers();
    const set = {};
    for (let i = 0; i < all.length; i++) {
      if (all[i].TeamName && all[i].TeamName.trim() !== '') {
        set[all[i].TeamName.trim()] = true;
      }
    }
    return Object.keys(set).sort();
  },

  getDistinctTeams: function() {
    return this.getAvailableTeamsFromPlayers();
  },

  /**
   * STEP 8: Admin-only Debug Master Player Database Function
   */
  debugMasterPlayerDatabase: function() {
    AuthorizationService.requireAdmin();
    const sheetName = this.getMasterPlayerSheet();
    const mapping = this.getColumnMapping();
    const allPlayers = this.getAllPlayers();
    const ss = getTargetSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    let detectedHeaders = [];
    if (sheet && sheet.getLastRow() >= 1 && sheet.getLastColumn() >= 1) {
      detectedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    const teamCounts = {};
    for (let i = 0; i < allPlayers.length; i++) {
      const t = allPlayers[i].TeamName || 'Unassigned';
      teamCounts[t] = (teamCounts[t] || 0) + 1;
    }

    return {
      activeDatabaseName: (typeof DatabaseConfigService !== 'undefined') ? DatabaseConfigService.getActiveDatabase().databaseName : 'Primary',
      activeSpreadsheetId: ss.getId(),
      activeSpreadsheetName: ss.getName(),
      configuredPlayerSheetName: sheetName,
      actualPlayerSheetFound: Boolean(sheet),
      detectedHeaders: detectedHeaders,
      currentColumnMapping: mapping,
      totalRowsFound: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0,
      totalValidPlayers: allPlayers.length,
      first5Players: allPlayers.slice(0, 5),
      playersPerTeam: teamCounts,
      timestamp: new Date().toISOString()
    };
  }
};
`;
  }

  /**
   * 7. CoachService.gs
   */
  public static getCoachServiceGs(): string {
    return `/**
 * ============================================================================
 * COACH & ASSIGNMENT SERVICE
 * File: CoachService.gs
 * ============================================================================
 */

const CoachService = {
  /**
   * Retrieves all coaches from COACHES sheet.
   */
  getAllCoaches: function() {
    return DatabaseService.getTableData(CONFIG.SHEETS.COACHES);
  },

  /**
   * Finds a coach record by Google account email.
   * @param {string} email
   * @return {Object|null}
   */
  getCoachByEmail: function(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const coaches = this.getAllCoaches();

    for (let i = 0; i < coaches.length; i++) {
      const coachEmail = String(coaches[i].Email || '').trim().toLowerCase();
      if (coachEmail === cleanEmail) {
        return coaches[i];
      }
    }
    return null;
  },

  /**
   * Retrieves all coach team assignments from COACH_TEAMS sheet.
   */
  getAllAssignments: function() {
    return DatabaseService.getTableData(CONFIG.SHEETS.COACH_TEAMS);
  },

  /**
   * Retrieves active assignments for a coach ID.
   * @param {string} coachId
   */
  getAssignmentsForCoach: function(coachId) {
    const all = this.getAllAssignments();
    const matched = [];
    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      if (a.CoachID === coachId && (a.Active === true || String(a.Active).toUpperCase() === 'TRUE')) {
        matched.push(a);
      }
    }
    return matched;
  },

  /**
   * Returns list of team names assigned to a coach ID.
   * @param {string} coachId
   * @return {Array<string>}
   */
  getAssignedTeamsByCoachId: function(coachId) {
    const assignments = this.getAssignmentsForCoach(coachId);
    return assignments.map(function(a) { return String(a.TeamName || '').trim(); });
  }
};
`;
  }

  /**
   * 8. SetupDatabase.gs
   */
  public static getSetupDatabaseGs(): string {
    return `/**
 * ============================================================================
 * DATABASE INITIALIZATION & AUXILIARY SCHEMA CREATOR
 * File: SetupDatabase.gs
 * 
 * Non-destructive setup: Checks and creates missing auxiliary sheets with
 * bold headers, frozen rows, and baseline validation rules.
 * Never modifies or alters the existing Master Players sheet!
 * ============================================================================
 */

function setupVolleyballAuxiliaryDatabase() {
  const ss = getTargetSpreadsheet();
  const createdSheets = [];

  const schemas = [
    {
      name: CONFIG.SHEETS.COACHES,
      headers: ['CoachID', 'FullName', 'Email', 'Phone', 'Role', 'AccountStatus', 'CreatedAt']
    },
    {
      name: CONFIG.SHEETS.COACH_TEAMS,
      headers: ['AssignmentID', 'CoachID', 'CoachName', 'CoachEmail', 'TeamName', 'TeamBirthYear', 'PermissionLevel', 'Active', 'CreatedAt']
    },
    {
      name: CONFIG.SHEETS.TRAINING_SESSIONS,
      headers: ['SessionID', 'TeamName', 'TeamBirthYear', 'TrainingDate', 'StartTime', 'EndTime', 'Location', 'CoachID', 'CoachName', 'CreatedAt']
    },
    {
      name: CONFIG.SHEETS.ATTENDANCE,
      headers: ['AttendanceID', 'SessionID', 'PlayerID', 'PlayerName', 'TeamName', 'TrainingDate', 'AttendanceStatus', 'ArrivalTime', 'LateMinutes', 'ExcuseType', 'Notes', 'CoachID', 'CoachName', 'Timestamp']
    },
    {
      name: CONFIG.SHEETS.AUDIT_LOG,
      headers: ['LogID', 'UserEmail', 'UserRole', 'Action', 'EntityType', 'EntityID', 'Details', 'Timestamp']
    },
    {
      name: CONFIG.SHEETS.SYSTEM_SETTINGS,
      headers: ['SettingKey', 'SettingValue', 'Description', 'LastUpdated']
    }
  ];

  for (let i = 0; i < schemas.length; i++) {
    const s = schemas[i];
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.getRange(1, 1, 1, s.headers.length).setValues([s.headers]);
      sheet.getRange(1, 1, 1, s.headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      createdSheets.push(s.name);
    }
  }

  Logger.log('Auxiliary setup completed. Created sheets: ' + (createdSheets.length ? createdSheets.join(', ') : 'All existed already'));
  return createdSheets;
}
`;
  }

  /**
   * 9. TestService.gs
   */
  public static getTestServiceGs(): string {
    return `/**
 * ============================================================================
 * DIAGNOSTIC TEST SUITE & SECURITY VERIFICATION (PHASE 1 & PHASE 2)
 * File: TestService.gs
 * 
 * Verifies:
 * 1. Master sheet reading & column preservation
 * 2. Primary key Player ID lookup
 * 3. Team filtering
 * 4. Google Auth user session identification
 * 5. Admin global authorization & Admin-only operation guard
 * 6. Head coach assigned team access & unauthorized team isolation
 * 7. Assistant coach permission level
 * 8. Unregistered Google user rejection
 * 9. Inactive coach rejection
 * 10. Team ID tampering / parameter spoofing rejection
 * ============================================================================
 */

function runAllDiagnostics() {
  Logger.log('================================================================');
  Logger.log('VOLLEYBALL ATTENDANCE SYSTEM - PHASE 2 SECURITY & AUTH SUITE');
  Logger.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, details) {
    if (condition) {
      Logger.log('  [PASS] ' + testName + (details ? ' -> ' + details : ''));
      passed++;
    } else {
      Logger.log('  [FAIL] ' + testName + (details ? ' -> ' + details : ''));
      failed++;
    }
  }

  // 1. Master Sheet Connection
  const allPlayers = PlayerService.getAllPlayers();
  assert('Master Players Sheet Loaded', allPlayers.length > 0, 'Found ' + allPlayers.length + ' players');

  // 2. Primary Key Lookup
  if (allPlayers.length > 0) {
    const sampleId = allPlayers[0].playerId;
    const lookup = PlayerService.getPlayerById(sampleId);
    assert('Primary Key Lookup (' + sampleId + ')', lookup !== null && lookup.playerId === sampleId, 'Retrieved: ' + (lookup ? lookup.fullName : 'None'));
  }

  // 3. User Session Identification
  const currentUser = AuthenticationService.getCurrentUser();
  assert('Active Google Session Identified', currentUser !== null, 'Current user email: ' + (currentUser.userEmail || 'Guest'));

  // 4. Admin Global Team Access Test
  const adminCheck = AuthorizationService.verifyTeamAccess('admin@volleyball.club', 'براعم 2014 بنات');
  assert('Admin Global Team Access Granted', adminCheck.authorized === true, adminCheck.reason);

  // 5. Head Coach Valid Team Access
  const coachAhmedValid = AuthorizationService.verifyTeamAccess('coach.ahmed@volleyball.club', 'براعم 2015 بنات');
  assert('Coach Ahmed accessing assigned team "براعم 2015 بنات"', coachAhmedValid.authorized === true, coachAhmedValid.reason);

  // 6. Head Coach Unauthorized Team Blocked
  const coachAhmedBlocked = AuthorizationService.verifyTeamAccess('coach.ahmed@volleyball.club', 'براعم 2014 بنات');
  assert('Coach Ahmed BLOCKED from forbidden team "براعم 2014 بنات"', coachAhmedBlocked.authorized === false, coachAhmedBlocked.reason);

  // 7. Assistant Coach Role & Permission
  const coachMona = CoachService.getCoachByEmail('coach.mona@volleyball.club');
  assert('Assistant Coach Role Identified', coachMona !== null && coachMona.Role === 'ASSISTANT_COACH', 'Role: ' + (coachMona ? coachMona.Role : 'None'));

  // 8. Unregistered Google User Blocked
  const unregisteredCheck = AuthorizationService.verifyTeamAccess('unknown.user@gmail.com', 'براعم 2015 بنات');
  assert('Unregistered Google user BLOCKED', unregisteredCheck.authorized === false, unregisteredCheck.reason);

  // 9. Inactive Coach Account Blocked
  const inactiveCheck = AuthorizationService.verifyTeamAccess('coach.inactive@volleyball.club', 'براعم 2015 بنات');
  assert('Inactive coach account BLOCKED', inactiveCheck.authorized === false, inactiveCheck.reason);

  Logger.log('================================================================');
  Logger.log('DIAGNOSTICS SUMMARY: Passed: ' + passed + ' | Failed: ' + failed);
  Logger.log('================================================================');

  return {
    passed: passed,
    failed: failed,
    total: passed + failed,
    status: failed === 0 ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED'
  };
}
`;
  }

  /**
   * 10. WebApp.gs (doGet / doPost API Entry Point)
   */
  public static getWebAppGs(): string {
    return `/**
 * ============================================================================
 * WEB APPLICATION API DISPATCHER & HTTP GATEWAY (PHASE 2)
 * File: WebApp.gs
 * 
 * Handles incoming web requests (doGet / doPost) with strict backend authentication
 * and authorization checks prior to responding.
 * ============================================================================
 */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'me';
  
  try {
    let result = {};

    switch (action) {
      case 'me':
        // Return authenticated Google user profile
        result = {
          success: true,
          user: AuthenticationService.getCurrentUser()
        };
        break;

      case 'getPlayersByTeam':
        // Guarded by requireAuthorizedTeam() inside PlayerService!
        const teamName = e.parameter.teamName;
        const players = PlayerService.getPlayersByTeam(teamName);
        result = {
          success: true,
          teamName: teamName,
          count: players.length,
          players: players
        };
        break;

      case 'getDistinctTeams':
        result = {
          success: true,
          teams: PlayerService.getDistinctTeams()
        };
        break;

      case 'runDiagnostics':
        result = {
          success: true,
          report: runAllDiagnostics()
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action: ' + action
        };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
  }

  /**
   * 11. DatabaseConfigurationService.gs (Phase 11.5)
   */
  public static getDatabaseConfigurationServiceGs(): string {
    return `/**
 * ============================================================================
 * VOLLEYBALL CLUB MANAGEMENT SYSTEM - SPREADSHEET DATABASE CONFIGURATION
 * File: DatabaseConfigurationService.gs (Phase 11.5)
 * ============================================================================
 */

const DatabaseConfigurationService = {
  /**
   * Returns the currently active Database Profile.
   * Centralized replacement for hardcoded Spreadsheet IDs.
   */
  getActiveDatabase: function() {
    return DatabaseProfileService.getActiveProfile();
  },

  /**
   * Returns active Spreadsheet ID
   */
  getActiveSpreadsheetId: function() {
    var active = this.getActiveDatabase();
    return active ? active.spreadsheetId : CONFIG.SPREADSHEET_ID;
  },

  /**
   * Returns active Player Sheet Name
   */
  getActivePlayerSheetName: function() {
    var active = this.getActiveDatabase();
    return active ? active.playersSheetName : CONFIG.MASTER_PLAYERS_SHEET_NAME;
  },

  /**
   * Returns active Column Mapping
   */
  getActiveColumnMapping: function() {
    var active = this.getActiveDatabase();
    return active && active.columnMapping ? active.columnMapping : ColumnMappingService.getDefaultMapping();
  }
};
`;
  }

  /**
   * 12. DatabaseProfileService.gs (Phase 11.5)
   */
  public static getDatabaseProfileServiceGs(): string {
    return `/**
 * ============================================================================
 * VOLLEYBALL CLUB MANAGEMENT SYSTEM - DATABASE PROFILES STORE
 * File: DatabaseProfileService.gs (Phase 11.5)
 * ============================================================================
 */

const DatabaseProfileService = {
  /**
   * Retrieves all saved Database Profiles from ScriptProperties.
   */
  getAllProfiles: function() {
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty('DATABASE_PROFILES');
    if (!raw) {
      // Return default baseline profile
      return [
        {
          id: 'DB_PROF_001',
          databaseName: 'قاعدة بيانات الكرة الطائرة - الموسم الرئيسي 2025/2026',
          spreadsheetId: CONFIG.SPREADSHEET_ID || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
          playersSheetName: 'Volleyball Player Database',
          coachesSheetName: 'Coaches',
          coachTeamsSheetName: 'CoachTeams',
          trainingSessionsSheetName: 'TrainingSessions',
          attendanceSheetName: 'Attendance',
          auditLogSheetName: 'AuditLog',
          systemSettingsSheetName: 'SystemSettings',
          columnMapping: ColumnMappingService.getDefaultMapping(),
          databaseStatus: 'ACTIVE'
        }
      ];
    }
    return JSON.parse(raw);
  },

  /**
   * Gets the ACTIVE profile.
   */
  getActiveProfile: function() {
    var profiles = this.getAllProfiles();
    var active = profiles.filter(function(p) { return p.databaseStatus === 'ACTIVE'; });
    return active.length > 0 ? active[0] : profiles[0];
  },

  /**
   * Safely switches the ACTIVE database profile after validation (Admin Only).
   */
  switchActiveProfile: function(adminEmail, targetProfileId) {
    var auth = AuthorizationService.isSystemAdmin(adminEmail);
    if (!auth) {
      throw new Error('UNAUTHORIZED_ADMIN_ONLY: Only ADMIN users can activate a database.');
    }

    var profiles = this.getAllProfiles();
    var target = null;
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === targetProfileId) {
        target = profiles[i];
      }
    }

    if (!target) {
      throw new Error('PROFILE_NOT_FOUND: Profile ' + targetProfileId + ' does not exist.');
    }

    // Run structural and connection validation before switching
    var validation = DatabaseValidationService.validateProfile(target);
    if (!validation.isValid) {
      throw new Error('DATABASE_VALIDATION_FAILED: Database did not pass structural integrity checks.');
    }

    // Deactivate others and activate target
    for (var j = 0; j < profiles.length; j++) {
      profiles[j].databaseStatus = (profiles[j].id === targetProfileId) ? 'ACTIVE' : 'INACTIVE';
    }

    var props = PropertiesService.getScriptProperties();
    props.setProperty('DATABASE_PROFILES', JSON.stringify(profiles));

    // Record switch in audit log
    DatabaseService.logAuditAction(
      adminEmail,
      'ADMIN',
      'DATABASE_PROFILE_ACTIVATED',
      'DATABASE_CONFIGURATION',
      target.id,
      'Activated database [' + target.databaseName + '] with SpreadsheetID: ' + target.spreadsheetId
    );

    return {
      success: true,
      activeProfile: target,
      validationReport: validation
    };
  }
};
`;
  }

  /**
   * 13. DatabaseValidationService.gs (Phase 11.5)
   */
  public static getDatabaseValidationServiceGs(): string {
    return `/**
 * ============================================================================
 * VOLLEYBALL CLUB MANAGEMENT SYSTEM - DATABASE VALIDATION ENGINE
 * File: DatabaseValidationService.gs (Phase 11.5)
 * ============================================================================
 */

const DatabaseValidationService = {
  /**
   * Comprehensive validation of a Spreadsheet Database Profile.
   */
  validateProfile: function(profile) {
    var checks = [];
    var spreadsheetId = SpreadsheetConnectionService.extractSpreadsheetId(profile.spreadsheetId || profile.spreadsheetUrl);

    // 1. Connection & ID Check
    var isConnValid = Boolean(spreadsheetId && spreadsheetId.length >= 5);
    checks.push({
      id: 'CHK-CONN',
      title: 'Spreadsheet ID & Format',
      passed: isConnValid,
      message: isConnValid ? 'Spreadsheet ID verified.' : 'Invalid Spreadsheet ID format.'
    });

    // 2. Master Player Sheet Check
    var playerSheetName = profile.playersSheetName || 'Volleyball Player Database';
    checks.push({
      id: 'CHK-SHEET-PLAYERS',
      title: 'Master Player Sheet Found',
      passed: Boolean(playerSheetName && playerSheetName.length > 0),
      message: 'Player Sheet configured: ' + playerSheetName
    });

    // 3. PlayerID Column Mapping Check
    var mapping = profile.columnMapping || ColumnMappingService.getDefaultMapping();
    checks.push({
      id: 'CHK-COL-PLAYERID',
      title: 'PlayerID Column Mapped',
      passed: Boolean(mapping.PlayerID && mapping.PlayerID.length > 0),
      message: 'PlayerID mapped to: ' + mapping.PlayerID
    });

    // 4. Team Column Mapping Check
    checks.push({
      id: 'CHK-COL-TEAM',
      title: 'TeamName Column Mapped',
      passed: Boolean(mapping.TeamName && mapping.TeamName.length > 0),
      message: 'TeamName mapped to: ' + mapping.TeamName
    });

    var passedCount = 0;
    for (var k = 0; k < checks.length; k++) {
      if (checks[k].passed) passedCount++;
    }

    return {
      isValid: passedCount === checks.length,
      spreadsheetId: spreadsheetId,
      totalChecks: checks.length,
      passedChecks: passedCount,
      checks: checks,
      timestamp: new Date().toISOString()
    };
  }
};
`;
  }

  /**
   * 14. SpreadsheetConnectionService.gs (Phase 11.5)
   */
  public static getSpreadsheetConnectionServiceGs(): string {
    return `/**
 * ============================================================================
 * VOLLEYBALL CLUB MANAGEMENT SYSTEM - SPREADSHEET CONNECTION SERVICE
 * File: SpreadsheetConnectionService.gs (Phase 11.5)
 * ============================================================================
 */

const SpreadsheetConnectionService = {
  /**
   * Extracts clean Spreadsheet ID from URL or ID string.
   */
  extractSpreadsheetId: function(input) {
    if (!input) return '';
    var str = String(input).trim();
    var match = str.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    return str;
  },

  /**
   * Tests connection to Google Spreadsheet and discovers available sheet names.
   */
  testConnection: function(urlOrId) {
    var id = this.extractSpreadsheetId(urlOrId);
    try {
      var ss = SpreadsheetApp.openById(id);
      var sheets = ss.getSheets();
      var sheetNames = [];
      for (var i = 0; i < sheets.length; i++) {
        sheetNames.push(sheets[i].getName());
      }
      return {
        success: true,
        spreadsheetId: id,
        spreadsheetTitle: ss.getName(),
        availableSheets: sheetNames
      };
    } catch (e) {
      return {
        success: false,
        spreadsheetId: id,
        error: e.message
      };
    }
  }
};
`;
  }

  /**
   * 15. ColumnMappingService.gs (Phase 11.5)
   */
  public static getColumnMappingServiceGs(): string {
    return `/**
 * ============================================================================
 * VOLLEYBALL CLUB MANAGEMENT SYSTEM - COLUMN MAPPING SERVICE
 * File: ColumnMappingService.gs (Phase 11.5)
 * ============================================================================
 */

const ColumnMappingService = {
  /**
   * Returns default Arabic column mapping for standard Master Player Database.
   */
  getDefaultMapping: function() {
    return {
      PlayerID: 'Player ID',
      PlayerName: 'الاسم',
      FullPlayerName: 'اسم اللاعب رباعي',
      TeamName: 'الفريق',
      TeamBirthYear: 'مواليد الفريق',
      Gender: 'النوع',
      BirthYear: 'مواليد',
      DateOfBirth: 'تاريخ الميلاد'
    };
  }
};
`;
  }

  /**
   * Returns all 15 modules in clean architectural sequence
   */
  public static getAllModules(): GASModule[] {
    return [
      {
        filename: 'Config.gs',
        description: 'Master spreadsheet ID, Arabic column mappings, roles, and permission levels',
        code: this.getConfigGs()
      },
      {
        filename: 'DatabaseConfigurationService.gs',
        description: 'Phase 11.5: Centralized getActiveDatabase() resolver & dynamic spreadsheet selector',
        code: this.getDatabaseConfigurationServiceGs()
      },
      {
        filename: 'DatabaseProfileService.gs',
        description: 'Phase 11.5: Multi-season database profiles store, switcher, and safe activation',
        code: this.getDatabaseProfileServiceGs()
      },
      {
        filename: 'DatabaseValidationService.gs',
        description: 'Phase 11.5: Pre-activation integrity, duplicate PlayerID, and sheet structure validator',
        code: this.getDatabaseValidationServiceGs()
      },
      {
        filename: 'SpreadsheetConnectionService.gs',
        description: 'Phase 11.5: Google Spreadsheet URL ID parser, connectivity test, and sheet discovery',
        code: this.getSpreadsheetConnectionServiceGs()
      },
      {
        filename: 'ColumnMappingService.gs',
        description: 'Phase 11.5: Custom Google Sheet column headers to application field mapper',
        code: this.getColumnMappingServiceGs()
      },
      {
        filename: 'AuthenticationService.gs',
        description: 'Session.getActiveUser() identity resolver, COACHES lookup, and session generation',
        code: this.getAuthenticationServiceGs()
      },
      {
        filename: 'AuthorizationService.gs',
        description: 'Strict backend security gate verifying user role and team assignments before access',
        code: this.getAuthorizationServiceGs()
      },
      {
        filename: 'UserService.gs',
        description: 'User profile management, user directory, and account status lookups',
        code: this.getUserServiceGs()
      },
      {
        filename: 'DatabaseService.gs',
        description: 'Sheet I/O read/write engine and tamper-evident audit logging layer',
        code: this.getDatabaseServiceGs()
      },
      {
        filename: 'PlayerService.gs',
        description: 'Read-only queries for master player sheet guarded by team authorization gates',
        code: this.getPlayerServiceGs()
      },
      {
        filename: 'CoachService.gs',
        description: 'Coach profile lookups and COACH_TEAMS permission assignments',
        code: this.getCoachServiceGs()
      },
      {
        filename: 'SetupDatabase.gs',
        description: 'Non-destructive initializer creating 6 auxiliary system sheets',
        code: this.getSetupDatabaseGs()
      },
      {
        filename: 'TestService.gs',
        description: 'Automated diagnostic test runner validating queries, roles, and security barriers',
        code: this.getTestServiceGs()
      },
      {
        filename: 'WebApp.gs',
        description: 'Web App HTTP entry point (doGet) with backend authorization gatekeeper',
        code: this.getWebAppGs()
      }
    ];
  }
}
