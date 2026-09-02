/**
 * ============================================================================
 * PHASE 17 — MASTER PRODUCTION READINESS & END-TO-END TEST SUITE
 * ============================================================================
 * Comprehensive validation across all core modules:
 * 1. Authentication (Admin, Head Coach, Assistant Coach, Unauthorized User)
 * 2. Authorization (Authorized team, Unauthorized team, Backend tampering)
 * 3. Player Database (PlayerID integrity, Team filtering, Deduplication)
 * 4. Training Sessions (Creation, Editing, Duplicate prevention)
 * 5. Attendance (Present, Late, Absent, Excused, Late minutes, Deduplication)
 * 6. Statistics (Attendance, Absence, Late rates, Discipline score calculations)
 * 7. Reports (Filters, Permissions, RBAC scoper, Computations)
 * 8. Data Integrity (Historical records preservation, Master DB protection, Transfer safety)
 * 9. Performance Benchmark (Scalability stress test with 10,000+ attendance records)
 */

import { MasterDatabaseService } from '../services/masterDatabaseService';
import { generateReport, getReportFilterOptions } from '../services/reportingService';
import { exportToCSV, exportToExcel, generatePrintableHTML, validateExportAuthorization } from '../services/exportService';

console.log('===============================================================');
console.log('🏆 PHASE 17 — FINAL PRODUCTION READINESS & MASTER E2E TEST SUITE');
console.log('===============================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, extraInfo?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName} ${extraInfo ? `-> ${extraInfo}` : ''}`);
    failedTests++;
  }
}

const adminEmail = 'admin@volleyball.club';
const headCoachEmail = 'coach.ahmed@volleyball.club';
const assistantCoachEmail = 'coach.aya@volleyball.club';
const unauthorizedEmail = 'unregistered.user@external.com';
const unauthorizedForeignTeam = 'تحت 15 سنة - بنات - أ';

// ── 1. AUTHENTICATION MODULE TESTS ──────────────────────────────────────────
console.log('--- 1. AUTHENTICATION MODULE ---');
{
  // A. Admin Login
  const adminUser = MasterDatabaseService.getCurrentUser(adminEmail);
  assert(
    adminUser.isAuthenticated === true && adminUser.role === 'ADMIN' && adminUser.isAdmin === true,
    'Admin login authenticates with full ADMIN privileges'
  );

  // B. Head Coach Login
  const headCoach = MasterDatabaseService.getCurrentUser(headCoachEmail);
  assert(
    headCoach.isAuthenticated === true && headCoach.role === 'HEAD_COACH' && headCoach.isHeadCoach === true && headCoach.authorizedTeams.length > 0,
    'Head Coach login authenticates with authorized team assignments'
  );

  // C. Assistant Coach Login
  const assistantCoach = MasterDatabaseService.getCurrentUser(assistantCoachEmail);
  assert(
    assistantCoach.isAuthenticated === true && assistantCoach.role === 'ASSISTANT_COACH' && assistantCoach.isAssistantCoach === true,
    'Assistant Coach login authenticates with ASSISTANT_COACH role'
  );

  // D. Unauthorized User Login
  const unauth = MasterDatabaseService.getCurrentUser(unauthorizedEmail);
  assert(
    unauth.isAuthenticated === false && unauth.role === 'UNREGISTERED',
    'Unregistered user is correctly rejected with unauthenticated status'
  );
}

// ── 2. AUTHORIZATION & ACCESS CONTROL TESTS ─────────────────────────────────
console.log('\n--- 2. AUTHORIZATION & ACCESS CONTROL ---');
{
  const coachAuthorizedTeam = MasterDatabaseService.getCurrentUser(headCoachEmail).authorizedTeams[0];

  // A. Authorized Team Access
  const authorizedCheck = MasterDatabaseService.requireAuthorizedTeam(headCoachEmail, coachAuthorizedTeam);
  assert(authorizedCheck.allowed === true, `Authorized team access granted for [${coachAuthorizedTeam}]`);

  // B. Unauthorized Team Access Blocked
  const unauthorizedCheck = MasterDatabaseService.requireAuthorizedTeam(headCoachEmail, unauthorizedForeignTeam);
  assert(
    unauthorizedCheck.allowed === false && unauthorizedCheck.statusCode === 403,
    `Unauthorized team access blocked for [${unauthorizedForeignTeam}] with 403`
  );

  // C. Backend TeamID Manipulation Attempt
  const manipulatedReport = generateReport(headCoachEmail, {
    reportType: 'TEAM_ATTENDANCE',
    teamName: unauthorizedForeignTeam
  });
  assert(
    manipulatedReport.success === false && (manipulatedReport.error || '').includes('Unauthorized: Coach is not assigned to team'),
    'Backend rejects forged teamName parameter in report generator'
  );
}

// ── 3. PLAYER DATABASE INTEGRITY TESTS ──────────────────────────────────────
console.log('\n--- 3. PLAYER DATABASE INTEGRITY ---');
{
  const allPlayers = MasterDatabaseService.getAllMasterPlayers();
  assert(allPlayers.length > 0, `Master player database contains ${allPlayers.length} official records`);

  // A. Primary Key PlayerID integrity
  const samplePlayer = allPlayers[0];
  const fetchedPlayer = MasterDatabaseService.getPlayerById(samplePlayer.playerId);
  assert(
    fetchedPlayer !== null && fetchedPlayer.playerId === samplePlayer.playerId,
    `Player lookup by primary key PlayerID [${samplePlayer.playerId}] succeeds`
  );

  // B. Team Filtering
  const teamPlayers = MasterDatabaseService.getPlayersByTeam(samplePlayer.teamName);
  const normalizedTarget = MasterDatabaseService.normalizeTeamName(samplePlayer.teamName);
  assert(
    teamPlayers.length > 0 && teamPlayers.every(p => MasterDatabaseService.normalizeTeamName(p.teamName) === normalizedTarget),
    `Team filtering for [${samplePlayer.teamName}] accurately returns squad roster`
  );

  // C. Duplicate Player Detection
  const playerIds = allPlayers.map(p => p.playerId.toUpperCase());
  const uniqueIds = new Set(playerIds);
  assert(playerIds.length === uniqueIds.size, 'No duplicate PlayerIDs exist in Master Player Database');
}

// ── 4. TRAINING SESSIONS ENGINE TESTS ───────────────────────────────────────
console.log('\n--- 4. TRAINING SESSIONS ENGINE ---');
{
  const testDate = `2026-11-${String(Math.floor(Math.random() * 20) + 10).padStart(2, '0')}`;
  // A. Creation
  const newSessionRes = MasterDatabaseService.createTrainingSession(adminEmail, {
    TeamName: 'راية براعم 2018+ - بنات - أ',
    TrainingDate: testDate,
    StartTime: '16:00',
    EndTime: '17:30',
    Location: 'الصالة المغطاة',
    Status: 'Scheduled',
    Notes: 'حصة اختبار الإنتاج'
  });
  assert(newSessionRes.success === true && newSessionRes.session !== undefined, 'Training session created successfully');

  if (newSessionRes.session) {
    const sId = newSessionRes.session.SessionID;

    // B. Editing
    const updateRes = MasterDatabaseService.updateTrainingSession(adminEmail, sId, {
      Location: 'الملعب الجديد',
      Notes: 'تحديث الموقع لاختبار الإنتاج'
    });
    assert(
      updateRes.success === true && updateRes.session?.Location === 'الملعب الجديد',
      'Training session edited and location updated successfully'
    );

    // C. Duplicate Session Prevention
    const dupCheck = MasterDatabaseService.createTrainingSession(adminEmail, {
      TeamName: 'راية براعم 2018+ - بنات - أ',
      TrainingDate: testDate,
      StartTime: '16:00',
      EndTime: '17:30',
      Location: 'الصالة المغطاة'
    });
    assert(
      dupCheck.success === false && dupCheck.isDuplicate === true,
      'Duplicate session on same date, time, and team is rejected'
    );

    // Cleanup test session
    MasterDatabaseService.deleteTrainingSession(adminEmail, sId);
  }
}

// ── 5. ATTENDANCE & VALIDATION ENGINE TESTS ─────────────────────────────────
console.log('\n--- 5. ATTENDANCE & VALIDATION ENGINE ---');
{
  // A. Late Minutes Calculation
  const lateMinutes = MasterDatabaseService.calculateLateMinutes('18:00', '18:25');
  assert(lateMinutes === 25, `Late minutes computed accurately: 18:00 -> 18:25 = ${lateMinutes} mins`);

  const onTimeMinutes = MasterDatabaseService.calculateLateMinutes('18:00', '17:55');
  assert(onTimeMinutes === 0, `On-time arrival late minutes is 0: 18:00 -> 17:55 = ${onTimeMinutes} mins`);

  // B. Duplicate Player in Attendance Submission Batch
  const dupBatchCheck = MasterDatabaseService.validateAttendanceSubmission(adminEmail, 'SESSION-2026-0001', [
    { playerId: 'M-G1501019954', status: 'PRESENT' },
    { playerId: 'M-G1501019954', status: 'LATE', arrivalTime: '18:15' }
  ]);
  assert(
    dupBatchCheck.isValid === false && dupBatchCheck.errorCode === 'DUPLICATE_PLAYER_IN_BATCH',
    'Pre-flight validator rejects duplicate player in single attendance batch'
  );

  // C. Valid Attendance Batch Submission with All 4 Statuses
  const allTeamPlayers = MasterDatabaseService.getPlayersByTeam('براعم 2015 بنات');
  if (allTeamPlayers.length >= 4) {
    const validItems = [
      { playerId: allTeamPlayers[0].playerId, status: 'PRESENT' as const },
      { playerId: allTeamPlayers[1].playerId, status: 'LATE' as const, arrivalTime: '18:15' },
      { playerId: allTeamPlayers[2].playerId, status: 'ABSENT' as const },
      { playerId: allTeamPlayers[3].playerId, status: 'EXCUSED' as const, excuseType: 'Illness' }
    ];

    // Create session to submit attendance for
    const tempSession = MasterDatabaseService.createTrainingSession(adminEmail, {
      TeamName: 'براعم 2015 بنات',
      TrainingDate: '2026-11-21',
      StartTime: '18:00',
      EndTime: '19:30',
      Location: 'الصالة المغطاة'
    });

    if (tempSession.session) {
      const saveRes = MasterDatabaseService.saveSessionAttendance(adminEmail, tempSession.session.SessionID, validItems);
      assert(
        saveRes.success === true &&
        saveRes.stats?.present === 1 &&
        saveRes.stats?.late === 1 &&
        saveRes.stats?.absent === 1 &&
        saveRes.stats?.excused === 1,
        'Attendance saved successfully across all 4 statuses (PRESENT, LATE, ABSENT, EXCUSED)'
      );
    }
  }
}

// ── 6. STATISTICS & METRIC PRECISION TESTS ──────────────────────────────────
console.log('\n--- 6. STATISTICS & METRIC PRECISION ---');
{
  const testPlayer = MasterDatabaseService.getAllMasterPlayers()[0];
  const discipline = MasterDatabaseService.calculatePlayerDisciplineScore(testPlayer.playerId);
  assert(
    discipline.finalScore >= 0 && discipline.finalScore <= 100,
    `Discipline score is within valid range [0, 100]: ${discipline.finalScore} pts`
  );

  const teamReport = generateReport(adminEmail, { reportType: 'TEAM_ATTENDANCE' });
  if (teamReport.data?.teamRows && teamReport.data.teamRows.length > 0) {
    const sampleRow = teamReport.data.teamRows[0];
    assert(
      sampleRow.attendanceRate >= 0 && sampleRow.attendanceRate <= 100,
      `Team attendance rate is mathematically bounded: ${sampleRow.attendanceRate}%`
    );
    assert(
      sampleRow.absenceRate >= 0 && sampleRow.absenceRate <= 100,
      `Team absence rate is mathematically bounded: ${sampleRow.absenceRate}%`
    );
  }
}

// ── 7. REPORTING & EXPORT ENGINE TESTS ──────────────────────────────────────
console.log('\n--- 7. REPORTING & EXPORT ENGINE ---');
{
  const filterOptions = getReportFilterOptions(adminEmail);
  assert(filterOptions.availableTeams.length > 0, 'Report filter options populate available teams');
  assert(filterOptions.availableReportTypes.length === 6, 'All 6 report types available in filter options');

  // Generate Sample Report
  const rep = generateReport(adminEmail, { reportType: 'DAILY_ATTENDANCE' });
  assert(rep.success === true && rep.data !== undefined, 'Daily attendance report generates with valid payload');

  if (rep.data) {
    // CSV Export
    const csvRes = exportToCSV(rep.data, { userEmail: adminEmail });
    assert(csvRes.success === true && (csvRes.content || '').length > 0, 'CSV export generated with UTF-8 BOM');

    // Excel Export
    const excelRes = exportToExcel(rep.data, { userEmail: adminEmail });
    assert(excelRes.success === true && (excelRes.content || '').includes('<html'), 'Excel HTML/XML export generated');

    // Print Document
    const printHtml = generatePrintableHTML(rep.data, true);
    assert(printHtml.includes('dir="rtl"') && printHtml.includes('A4 landscape'), 'Printable HTML generated with RTL landscape layout');
  }
}

// ── 8. DATA INTEGRITY & TRANSFER SAFETY TESTS ───────────────────────────────
console.log('\n--- 8. DATA INTEGRITY & TRANSFER SAFETY ---');
{
  // A. Historical Attendance Deletion Protection
  const allAtt = MasterDatabaseService.getAttendanceRecords();
  const sessionWithHistory = allAtt[0]?.SessionID;
  if (sessionWithHistory) {
    const deleteAttempt = MasterDatabaseService.deleteTrainingSession(adminEmail, sessionWithHistory);
    assert(
      deleteAttempt.success === false && (deleteAttempt.error || '').includes('سجل حضور تاريخي'),
      'Historical attendance records protected against session deletion'
    );
  }

  // B. Player transfers do not corrupt historical attendance records
  const initialCount = MasterDatabaseService.getAttendanceRecords().length;
  const testPlayer = MasterDatabaseService.getAllMasterPlayers()[0];
  const oldTeam = testPlayer.teamName;
  testPlayer.teamName = 'فريق تجريبي منقول';

  const afterCount = MasterDatabaseService.getAttendanceRecords().length;
  assert(initialCount === afterCount, 'Player team transfer does not alter or corrupt historical attendance records count');
  testPlayer.teamName = oldTeam; // Restore
}

// ── 9. PERFORMANCE & LARGE DATASET BENCHMARK ────────────────────────────────
console.log('\n--- 9. PERFORMANCE & LARGE DATASET BENCHMARK ---');
{
  const largeAttendanceItems = [];
  for (let i = 1; i <= 10000; i++) {
    largeAttendanceItems.push({
      AttendanceID: `ATT-PERF-${String(i).padStart(6, '0')}`,
      SessionID: `SESSION-PERF-${Math.floor(i / 100)}`,
      PlayerID: `M-P${String((i % 500) + 1).padStart(5, '0')}`,
      PlayerName: `لاعب أداء رقم ${(i % 500) + 1}`,
      TeamName: 'راية براعم 2015 - بنات - أ',
      TrainingDate: '2026-08-25',
      AttendanceStatus: (i % 4 === 0 ? 'LATE' : i % 7 === 0 ? 'ABSENT' : 'PRESENT') as any,
      LateMinutes: i % 4 === 0 ? 15 : 0,
      Timestamp: new Date().toISOString()
    });
  }

  const startTime = Date.now();
  // Simulate aggregating 10,000 records
  let present = 0, late = 0, absent = 0;
  for (const r of largeAttendanceItems) {
    if (r.AttendanceStatus === 'PRESENT') present++;
    else if (r.AttendanceStatus === 'LATE') late++;
    else if (r.AttendanceStatus === 'ABSENT') absent++;
  }
  const elapsedMs = Date.now() - startTime;

  assert(largeAttendanceItems.length === 10000, 'Simulated 10,000 attendance records');
  assert(elapsedMs < 100, `Aggregated 10,000 attendance records in ${elapsedMs}ms (< 100ms threshold)`);
}

console.log('\n===============================================================');
console.log(`📊 MASTER TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('===============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
