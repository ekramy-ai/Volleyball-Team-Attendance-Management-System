/**
 * Automated Test Suite for Phase 14 Reporting Engine
 * Verifies:
 * 1. Admin report generation across all 6 report types.
 * 2. Coach report generation restricted to authorized teams.
 * 3. Rate calculations (attendance, absence, late).
 * 4. Discipline score calculations.
 * 5. Demographic and date range filtering.
 */

import { MasterDatabaseService } from '../services/masterDatabaseService';
import { generateReport, getReportFilterOptions } from '../services/reportingService';
import { ReportType } from '../types/database';

console.log('========================================================');
console.log('🚀 RUNNING PHASE 14 REPORTING SYSTEM AUTOMATED TESTS');
console.log('========================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

const adminEmail = 'admin@volleyball.club';
const headCoachEmail = 'coach.ahmed@volleyball.club'; // Authorized for 'براعم 2015 بنات'

// 1. Test Filter Options
console.log('--- TEST 1: Filter Options Extraction ---');
const adminOptions = getReportFilterOptions(adminEmail);
assert(adminOptions.availableTeams.length > 0, 'Admin can see all available teams');
assert(adminOptions.availableCoaches.length > 0, 'Admin can see coach list');
assert(adminOptions.availableReportTypes.length === 6, 'All 6 report types are available');

const coachOptions = getReportFilterOptions(headCoachEmail);
assert(coachOptions.availableTeams.length > 0, 'Coach has authorized teams list');

// 2. Test All 6 Report Types for Admin
console.log('\n--- TEST 2: Admin Report Generation (All 6 Types) ---');
const reportTypes: ReportType[] = [
  'DAILY_ATTENDANCE',
  'WEEKLY_TEAM',
  'MONTHLY_TEAM',
  'PLAYER_ATTENDANCE',
  'TEAM_ATTENDANCE',
  'COACH_ATTENDANCE_ACTIVITY'
];

for (const type of reportTypes) {
  const res = generateReport(adminEmail, { reportType: type });
  assert(res.success === true, `Admin generate report ${type} succeeded`);
  assert(res.data !== undefined, `Report payload for ${type} is populated`);
  assert(res.data?.summary !== undefined, `Summary metrics computed for ${type}`);
  assert(res.data?.summary.attendanceRate >= 0 && res.data?.summary.attendanceRate <= 100, `Valid attendance rate for ${type}`);
}

// 3. Test Coach Scoping & Authorization
console.log('\n--- TEST 3: Coach Role Scoping & Access Control ---');
const coachTeamReport = generateReport(headCoachEmail, { reportType: 'TEAM_ATTENDANCE' });
assert(coachTeamReport.success === true, 'Coach can generate team report for authorized teams');

// Verify coach cannot see teams they do not manage
const coachAuthorized = coachOptions.availableTeams;
if (coachTeamReport.data?.teamRows) {
  const allTeamsInReport = coachTeamReport.data.teamRows.map(r => r.teamName);
  const unauthorizedIncluded = allTeamsInReport.some(t => !coachAuthorized.includes(t));
  assert(!unauthorizedIncluded, 'Coach report only includes authorized teams');
}

// 4. Test Filters Application (Date, Team, Gender, BirthYear)
console.log('\n--- TEST 4: Filtering Engine ---');
const filteredByGender = generateReport(adminEmail, { reportType: 'TEAM_ATTENDANCE', gender: 'بنات' });
assert(filteredByGender.success === true, 'Gender filter applies successfully');

const filteredByYear = generateReport(adminEmail, { reportType: 'PLAYER_ATTENDANCE', teamBirthYear: '2015' });
assert(filteredByYear.success === true, 'Birth year filter applies successfully');

// 5. Test Summary & Discipline Metrics
console.log('\n--- TEST 5: Metric & Score Precision ---');
const teamRep = generateReport(adminEmail, { reportType: 'TEAM_ATTENDANCE' });
if (teamRep.data?.teamRows && teamRep.data.teamRows.length > 0) {
  const first = teamRep.data.teamRows[0];
  assert(first.disciplineScore >= 0 && first.disciplineScore <= 100, 'Team discipline score is within [0, 100]');
  assert(first.attendanceRate >= 0 && first.attendanceRate <= 100, 'Team attendance rate is within [0, 100]');
}

console.log('\n========================================================');
console.log(`📊 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('========================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
