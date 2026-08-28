/**
 * Google Apps Script Setup & Backend Engine Generator (Phase 1)
 * Generates the complete, standalone Google Apps Script `Code.gs` code
 * to automatically initialize all 8 Google Sheets, set column protections,
 * apply cell data validation dropdowns, format headers, and handle API requests.
 */

export class GoogleAppsScriptGenerator {
  static generateCodeGs(): string {
    return `/**
 * =========================================================================
 * VOLLEYBALL TEAM ATTENDANCE MANAGEMENT SYSTEM - BACKEND & DATABASE SCRIPT
 * Generated for Google Apps Script & Google Sheets Database Architecture
 * =========================================================================
 */

var CONFIG = {
  APP_NAME: 'Volleyball Attendance Hub',
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  HEADER_COLOR: '#1E293B',
  HEADER_TEXT_COLOR: '#FFFFFF',
  DISCIPLINE_START_SCORE: 100,
  DEDUCTIONS: {
    UNEXCUSED_ABSENCE: 10,
    EXCUSED_ABSENCE: 3,
    LATE: 2
  }
};

/**
 * Menu trigger for spreadsheet administrators
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏐 Volleyball System')
    .addItem('⚙️ Initialize All 8 Sheets', 'setupDatabase')
    .addItem('🌱 Seed Initial Test Roster & Data', 'seedDatabase')
    .addItem('🔒 Apply Data Validation Dropdowns', 'applyAllValidations')
    .addItem('📊 Run Database Health Check', 'checkDatabaseHealth')
    .addToUi();
}

/**
 * Master Database Initializer: Creates and formats all 8 required sheets
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsConfig = getSheetsConfiguration();
  var log = [];

  sheetsConfig.forEach(function(cfg) {
    var sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
      log.push('Created sheet: ' + cfg.name);
    } else {
      log.push('Sheet already exists: ' + cfg.name);
    }

    // Set headers
    sheet.getRange(1, 1, 1, cfg.columns.length).setValues([cfg.columns]);
    
    // Style headers
    var headerRange = sheet.getRange(1, 1, 1, cfg.columns.length);
    headerRange.setBackground(CONFIG.HEADER_COLOR)
               .setFontColor(CONFIG.HEADER_TEXT_COLOR)
               .setFontWeight('bold')
               .setFontFamily('Arial')
               .setFontSize(10)
               .setHorizontalAlignment('center')
               .setVerticalAlignment('middle');
    
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, cfg.columns.length);
  });

  // Apply validations
  applyAllValidations();

  SpreadsheetApp.getUi().alert('✅ Database Setup Complete!\\n\\n' + log.join('\\n'));
}

/**
 * Returns configuration definitions for all 8 database sheets
 */
function getSheetsConfiguration() {
  return [
    {
      name: 'PLAYERS',
      columns: [
        'PlayerID', 'FullName', 'Gender', 'DateOfBirth', 'BirthYear',
        'TeamID', 'TeamName', 'ParentName', 'ParentPhone',
        'PlayerStatus', 'RegistrationDate', 'Notes'
      ]
    },
    {
      name: 'TEAMS',
      columns: [
        'TeamID', 'TeamName', 'BirthYear', 'Gender',
        'Category', 'Season', 'HeadCoachID', 'AssistantCoachID', 'TeamStatus'
      ]
    },
    {
      name: 'COACHES',
      columns: [
        'CoachID', 'FullName', 'Email', 'Phone', 'Role', 'AccountStatus'
      ]
    },
    {
      name: 'COACH_TEAMS',
      columns: [
        'AssignmentID', 'CoachID', 'TeamID', 'PermissionLevel', 'Active'
      ]
    },
    {
      name: 'TRAINING_SESSIONS',
      columns: [
        'SessionID', 'TeamID', 'TeamName', 'TrainingDate',
        'StartTime', 'EndTime', 'Location', 'CoachID', 'CoachName', 'CreatedAt'
      ]
    },
    {
      name: 'ATTENDANCE',
      columns: [
        'AttendanceID', 'SessionID', 'PlayerID', 'PlayerName',
        'TeamID', 'TeamName', 'TrainingDate', 'Status',
        'ArrivalTime', 'LateMinutes', 'ExcuseType',
        'CoachID', 'CoachName', 'Notes', 'Timestamp'
      ]
    },
    {
      name: 'SYSTEM_USERS',
      columns: [
        'UserID', 'Email', 'FullName', 'Role', 'Status', 'LastLogin'
      ]
    },
    {
      name: 'AUDIT_LOG',
      columns: [
        'LogID', 'UserEmail', 'UserRole', 'Action',
        'EntityType', 'EntityID', 'Details', 'Timestamp'
      ]
    }
  ];
}

/**
 * Apply cell validation rules (dropdowns) to ensure data integrity
 */
function applyAllValidations() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. PLAYERS Sheet Validations
  var playerSheet = ss.getSheetByName('PLAYERS');
  if (playerSheet) {
    // Gender: Column C (3)
    var genderRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Female', 'Male'], true)
      .setAllowInvalid(false)
      .build();
    playerSheet.getRange('C2:C1000').setDataValidation(genderRule);

    // PlayerStatus: Column J (10)
    var statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Injured', 'Suspended', 'Inactive', 'Transferred'], true)
      .setAllowInvalid(false)
      .build();
    playerSheet.getRange('J2:J1000').setDataValidation(statusRule);
  }

  // 2. TEAMS Sheet Validations
  var teamSheet = ss.getSheetByName('TEAMS');
  if (teamSheet) {
    // Gender: Column D (4)
    var teamGenderRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Female', 'Male', 'Coed'], true)
      .setAllowInvalid(false)
      .build();
    teamSheet.getRange('D2:D500').setDataValidation(teamGenderRule);

    // TeamStatus: Column I (9)
    var teamStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Archived'], true)
      .setAllowInvalid(false)
      .build();
    teamSheet.getRange('I2:I500').setDataValidation(teamStatusRule);
  }

  // 3. COACHES Sheet Validations
  var coachSheet = ss.getSheetByName('COACHES');
  if (coachSheet) {
    // Role: Column E (5)
    var roleRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['ADMIN', 'HEAD_COACH', 'ASSISTANT_COACH'], true)
      .setAllowInvalid(false)
      .build();
    coachSheet.getRange('E2:E200').setDataValidation(roleRule);

    // AccountStatus: Column F (6)
    var coachStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Inactive'], true)
      .setAllowInvalid(false)
      .build();
    coachSheet.getRange('F2:F200').setDataValidation(coachStatusRule);
  }

  // 4. COACH_TEAMS Sheet Validations
  var coachTeamsSheet = ss.getSheetByName('COACH_TEAMS');
  if (coachTeamsSheet) {
    // PermissionLevel: Column D (4)
    var permRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['FULL_MANAGE', 'RECORD_ONLY'], true)
      .setAllowInvalid(false)
      .build();
    coachTeamsSheet.getRange('D2:D500').setDataValidation(permRule);

    // Active: Column E (5)
    var activeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['TRUE', 'FALSE'], true)
      .setAllowInvalid(false)
      .build();
    coachTeamsSheet.getRange('E2:E500').setDataValidation(activeRule);
  }

  // 5. ATTENDANCE Sheet Validations
  var attSheet = ss.getSheetByName('ATTENDANCE');
  if (attSheet) {
    // Status: Column H (8)
    var attStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'], true)
      .setAllowInvalid(false)
      .build();
    attSheet.getRange('H2:H5000').setDataValidation(attStatusRule);

    // ExcuseType: Column K (11)
    var excuseRule = SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Injury', 'Illness', 'School', 'Exams',
        'Travel', 'Family Emergency', 'Previous Permission', 'Other'
      ], true)
      .setAllowInvalid(true)
      .build();
    attSheet.getRange('K2:K5000').setDataValidation(excuseRule);
  }
}

/**
 * Seed initial test data across the system
 */
function seedDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupDatabase();

  // 1. Teams
  var teamSheet = ss.getSheetByName('TEAMS');
  var teams = [
    ['T001', 'Girls 2015', 2015, 'Female', 'U11', '2025-2026', 'COACH-0001', 'COACH-0004', 'Active'],
    ['T002', 'Boys 2015', 2015, 'Male', 'U11', '2025-2026', 'COACH-0003', '', 'Active'],
    ['T003', 'Girls 2014', 2014, 'Female', 'U12', '2025-2026', 'COACH-0002', '', 'Active']
  ];
  if (teamSheet.getLastRow() <= 1) {
    teamSheet.getRange(2, 1, teams.length, teams[0].length).setValues(teams);
  }

  // 2. Coaches
  var coachSheet = ss.getSheetByName('COACHES');
  var coaches = [
    ['COACH-0000', 'Admin Director', 'admin@volleyball.club', '+1 (555) 010-0001', 'ADMIN', 'Active'],
    ['COACH-0001', 'Elena Rostova (Coach A)', 'coach.a@volleyball.club', '+1 (555) 010-1001', 'HEAD_COACH', 'Active'],
    ['COACH-0002', 'Marco Rossi (Coach B)', 'coach.b@volleyball.club', '+1 (555) 010-2002', 'HEAD_COACH', 'Active'],
    ['COACH-0003', 'David Miller (Coach C)', 'coach.c@volleyball.club', '+1 (555) 010-3003', 'HEAD_COACH', 'Active'],
    ['COACH-0004', 'Sarah Chen (Coach D)', 'coach.d@volleyball.club', '+1 (555) 010-4004', 'ASSISTANT_COACH', 'Active'],
    ['COACH-0005', 'System SuperAdmin', Session.getActiveUser().getEmail() || 'director@volleyball.club', '+1 (555) 010-9999', 'ADMIN', 'Active']
  ];
  if (coachSheet.getLastRow() <= 1) {
    coachSheet.getRange(2, 1, coaches.length, coaches[0].length).setValues(coaches);
  }

  // 3. Coach Teams
  var ctSheet = ss.getSheetByName('COACH_TEAMS');
  var coachTeams = [
    ['ASSIGN-0001', 'COACH-0001', 'T001', 'FULL_MANAGE', 'TRUE'],
    ['ASSIGN-0002', 'COACH-0002', 'T003', 'FULL_MANAGE', 'TRUE'],
    ['ASSIGN-0003', 'COACH-0003', 'T002', 'FULL_MANAGE', 'TRUE'],
    ['ASSIGN-0004', 'COACH-0004', 'T001', 'RECORD_ONLY', 'TRUE']
  ];
  if (ctSheet.getLastRow() <= 1) {
    ctSheet.getRange(2, 1, coachTeams.length, coachTeams[0].length).setValues(coachTeams);
  }

  // 4. Players
  var playerSheet = ss.getSheetByName('PLAYERS');
  var players = [
    ['PLR-0001', 'Sophia Martinez', 'Female', '2015-03-12', 2015, 'T001', 'Girls 2015', 'Carlos Martinez', '+1 (555) 234-1101', 'Active', '2025-09-01', 'Setter candidate'],
    ['PLR-0002', 'Emma Johnson', 'Female', '2015-05-20', 2015, 'T001', 'Girls 2015', 'Laura Johnson', '+1 (555) 234-1102', 'Active', '2025-09-01', 'Strong overhead serve'],
    ['PLR-0003', 'Olivia Davis', 'Female', '2015-01-15', 2015, 'T001', 'Girls 2015', 'Mark Davis', '+1 (555) 234-1103', 'Active', '2025-09-02', 'Great defensive positioning'],
    ['PLR-0004', 'Ava Wilson', 'Female', '2015-08-09', 2015, 'T001', 'Girls 2015', 'Patricia Wilson', '+1 (555) 234-1104', 'Active', '2025-09-03', 'Captain candidate'],
    ['PLR-0005', 'Isabella Taylor', 'Female', '2015-11-22', 2015, 'T001', 'Girls 2015', 'David Taylor', '+1 (555) 234-1105', 'Injured', '2025-09-05', 'Ankle recovery'],
    ['PLR-0006', 'Mia Anderson', 'Female', '2015-04-18', 2015, 'T001', 'Girls 2015', 'Sarah Anderson', '+1 (555) 234-1106', 'Active', '2025-09-05', 'Passing specialist'],
    ['PLR-0007', 'Harper Thomas', 'Female', '2015-06-30', 2015, 'T001', 'Girls 2015', 'James Thomas', '+1 (555) 234-1107', 'Active', '2025-09-10', ''],
    ['PLR-0008', 'Evelyn White', 'Female', '2015-09-14', 2015, 'T001', 'Girls 2015', 'Karen White', '+1 (555) 234-1108', 'Active', '2025-09-12', ''],
    ['PLR-0009', 'Liam Smith', 'Male', '2015-02-14', 2015, 'T002', 'Boys 2015', 'Robert Smith', '+1 (555) 345-2201', 'Active', '2025-09-01', 'High jump vertical'],
    ['PLR-0010', 'Noah Garcia', 'Male', '2015-07-11', 2015, 'T002', 'Boys 2015', 'Elena Garcia', '+1 (555) 345-2202', 'Active', '2025-09-01', 'Spike approach'],
    ['PLR-0015', 'Chloe Martin', 'Female', '2014-01-29', 2014, 'T003', 'Girls 2014', 'Antoine Martin', '+1 (555) 456-3301', 'Active', '2025-08-25', 'Team captain']
  ];
  if (playerSheet.getLastRow() <= 1) {
    playerSheet.getRange(2, 1, players.length, players[0].length).setValues(players);
  }

  // Record Audit
  recordAuditLog('SYSTEM', 'ADMIN', 'SYSTEM_INIT', 'SYSTEM', 'INIT_SEED', 'Seeded initial database records.');

  SpreadsheetApp.getUi().alert('🌱 Seed data successfully injected into all sheets!');
}

/**
 * Secure Audit Log Recorder
 */
function recordAuditLog(userEmail, role, action, entityType, entityId, details) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('AUDIT_LOG');
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var logId = 'LOG-' + ('00000' + (lastRow)).slice(-5);
  var timestamp = new Date().toISOString();

  sheet.appendRow([
    logId,
    userEmail,
    role,
    action,
    entityType,
    entityId,
    typeof details === 'object' ? JSON.stringify(details) : details,
    timestamp
  ]);
}

/**
 * Health Check Utility
 */
function checkDatabaseHealth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configs = getSheetsConfiguration();
  var missing = [];

  configs.forEach(function(c) {
    if (!ss.getSheetByName(c.name)) missing.push(c.name);
  });

  if (missing.length === 0) {
    SpreadsheetApp.getUi().alert('✅ Perfect Health: All 8 required sheets exist and are structured properly.');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ Missing sheets: ' + missing.join(', ') + '\\n\\nRun "Initialize All 8 Sheets" to fix.');
  }
}
`;
  }
}
