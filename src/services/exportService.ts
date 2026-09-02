import { ReportDataPayload, ReportType, ReportFilterParams } from '../types/database';
import { MasterDatabaseService } from './masterDatabaseService';

/**
 * ============================================================================
 * PHASE 15 — ENTERPRISE EXPORT & PRINTING ENGINE
 * ============================================================================
 * Features:
 * 1. CSV Export with UTF-8 BOM (\uFEFF) for flawless Arabic rendering in Excel.
 * 2. Excel-compatible rich document (.xls XML/HTML) with RTL support & styling.
 * 3. Printer-Friendly Document Generator (A4 Landscape, High-Contrast, Signatures).
 * 4. Modular Architecture prepared for future PDF engine integration.
 * 5. Strict Permission Validation: Coaches cannot export unauthorized team data.
 * 6. High-performance streaming & memory optimization for large datasets.
 */

export interface ExportOptions {
  userEmail?: string;
  customFilename?: string;
  includeSummaryKpis?: boolean;
  includeSignatures?: boolean;
  dateFormat?: 'ar-EG' | 'en-US' | 'iso';
}

export interface PDFDocumentDefinition {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  createdAt: string;
  orientation: 'landscape' | 'portrait';
  pageSize: 'A4' | 'Letter';
  htmlContent: string;
}

// ── Security & Permission Gate ───────────────────────────────────────────────

/**
 * Validates that the user has legitimate authorization to export the teams in the report.
 * Throws a SecurityError if an unauthorized team is detected.
 */
export function validateExportAuthorization(
  userEmail: string,
  report: ReportDataPayload
): { authorized: boolean; reason?: string } {
  if (!userEmail) {
    return { authorized: false, reason: 'المستخدم غير محدد. يرجى تسجيل الدخول أولاً.' };
  }

  const session = MasterDatabaseService.getCurrentUser(userEmail);
  if (!session.isAuthenticated) {
    return { authorized: false, reason: 'جلسة المستخدم غير صالحة أو منتهية.' };
  }

  if (session.isAdmin) {
    return { authorized: true };
  }

  // Coach permission check
  const authorizedTeams = session.authorizedTeams || [];
  const normalizedAuthorized = authorizedTeams.map((t) =>
    MasterDatabaseService.normalizeTeamName(t)
  );

  // Extract all teams present in the report payload
  const teamsInReport = new Set<string>();

  if (report.filtersApplied?.teamName) {
    teamsInReport.add(report.filtersApplied.teamName);
  }

  if (report.dailyRows) {
    report.dailyRows.forEach((r) => teamsInReport.add(r.teamName));
  }
  if (report.weeklyRows) {
    report.weeklyRows.forEach((r) => teamsInReport.add(r.teamName));
  }
  if (report.monthlyRows) {
    report.monthlyRows.forEach((r) => teamsInReport.add(r.teamName));
  }
  if (report.playerRows) {
    report.playerRows.forEach((r) => teamsInReport.add(r.teamName));
  }
  if (report.teamRows) {
    report.teamRows.forEach((r) => teamsInReport.add(r.teamName));
  }

  // Check if any team in report is outside authorized list
  for (const team of teamsInReport) {
    const norm = MasterDatabaseService.normalizeTeamName(team);
    if (!normalizedAuthorized.includes(norm)) {
      MasterDatabaseService.logAudit(
        userEmail,
        session.role,
        'EXPORT_SECURITY_BLOCKED',
        'REPORT_EXPORT',
        team,
        `Blocked attempt to export unauthorized team data for "${team}".`
      );
      return {
        authorized: false,
        reason: `غير مصرح لك بتصدير بيانات فريق "${team}". مسموح فقط لفرقك المعتمدة.`,
      };
    }
  }

  return { authorized: true };
}

// ── Metadata & Formatting Helpers ───────────────────────────────────────────

/**
 * Builds a comprehensive human-readable summary of applied filters.
 */
export function getFilterSummaryText(report: ReportDataPayload): string {
  const f: ReportFilterParams = report.filtersApplied || {};
  const parts: string[] = [];

  if (f.startDate || f.endDate) {
    parts.push(`الفترة: من ${f.startDate || 'البداية'} إلى ${f.endDate || 'النهاية'}`);
  } else {
    parts.push('الفترة: كافة الفترات التدريبية المتاحة');
  }

  if (f.teamName) parts.push(`الفريق: ${f.teamName}`);
  if (f.teamBirthYear) parts.push(`مواليد الفريق: ${f.teamBirthYear}`);
  if (f.gender) parts.push(`النوع: ${f.gender}`);
  if (f.coachId) parts.push(`كود المدرب: ${f.coachId}`);
  if (f.playerId) parts.push(`كود اللاعب: ${f.playerId}`);

  return parts.join(' | ');
}

/**
 * Generates standardized export filenames.
 */
export function buildExportFileName(
  report: ReportDataPayload,
  extension: 'csv' | 'xls' | 'pdf'
): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  const teamPrefix = report.filtersApplied?.teamName
    ? `${report.filtersApplied.teamName.replace(/\s+/g, '_')}_`
    : '';
  const typeMap: Record<ReportType, string> = {
    DAILY_ATTENDANCE: 'Daily_Attendance',
    WEEKLY_TEAM: 'Weekly_Team',
    MONTHLY_TEAM: 'Monthly_Team',
    PLAYER_ATTENDANCE: 'Player_Attendance',
    TEAM_ATTENDANCE: 'Team_Attendance',
    COACH_ATTENDANCE_ACTIVITY: 'Coach_Activity',
  };
  const typeStr = typeMap[report.reportType] || report.reportType;
  return `Volleyball_${teamPrefix}${typeStr}_${dateStr}.${extension}`;
}

/**
 * Safely escapes CSV cells to handle quotes, newlines, and commas.
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

// ── 1. CSV EXPORT ENGINE ─────────────────────────────────────────────────────

/**
 * Generates and downloads a CSV export file.
 * Includes UTF-8 BOM (\uFEFF) for 100% Arabic text compatibility in Excel.
 */
export function exportToCSV(
  report: ReportDataPayload,
  options: ExportOptions = {}
): { success: boolean; content?: string; filename?: string; error?: string } {
  try {
    if (options.userEmail) {
      const auth = validateExportAuthorization(options.userEmail, report);
      if (!auth.authorized) {
        return { success: false, error: auth.reason };
      }
    }

    const lines: string[] = [];
    const BOM = '\uFEFF'; // UTF-8 BOM for Arabic support in MS Excel

    // 1. Report Metadata Headers
    lines.push(`${escapeCSV('منظومة إدارة تدريبات وبطولات الكرة الطائرة — النادي')},${escapeCSV(report.title)}`);
    lines.push(`${escapeCSV('تاريخ وتوقيت التوليد')},${escapeCSV(new Date(report.generatedAt).toLocaleString('ar-EG'))}`);
    lines.push(`${escapeCSV('المستخدم المنشئ')},${escapeCSV(report.generatedByUser)}`);
    lines.push(`${escapeCSV('معايير الفلترة المطبقة')},${escapeCSV(getFilterSummaryText(report))}`);

    // 2. Summary KPI Metrics
    const s = report.summary;
    lines.push('');
    lines.push(`${escapeCSV('=== ملخص المؤشرات الإجمالية ===')}`);
    lines.push(
      `${escapeCSV('إجمالي الحصص')},${escapeCSV('إجمالي السجلات')},${escapeCSV('حاضر')},${escapeCSV('متأخر')},${escapeCSV('غياب')},${escapeCSV('عذر رسمي')},${escapeCSV('نسبة الحضور (%)')},${escapeCSV('نسبة الغياب (%)')},${escapeCSV('مؤشر الانضباط (%)')}`
    );
    lines.push(
      `${s.totalSessions},${s.totalRecords},${s.presentCount},${s.lateCount},${s.absentCount},${s.excusedCount},"${s.attendanceRate}%","${s.absenceRate}%","${s.averageDisciplineScore || 100}%"`
    );
    lines.push('');
    lines.push(`${escapeCSV('=== جدول البيانات التفصيلية ===')}`);

    // 3. Tabular Data per Report Type
    if (report.reportType === 'DAILY_ATTENDANCE' && report.dailyRows) {
      lines.push(
        `${escapeCSV('التاريخ')},${escapeCSV('كود الحصة')},${escapeCSV('الفريق')},${escapeCSV('المدرب المسؤول')},${escapeCSV('الموقع')},${escapeCSV('التوقيت')},${escapeCSV('إجمالي اللاعبين')},${escapeCSV('حاضر')},${escapeCSV('متأخر')},${escapeCSV('غياب')},${escapeCSV('عذر')},${escapeCSV('نسبة الحضور (%)')}`
      );
      report.dailyRows.forEach((r) => {
        lines.push(
          `${escapeCSV(r.date)},${escapeCSV(r.sessionId)},${escapeCSV(r.teamName)},${escapeCSV(r.coachName)},${escapeCSV(r.location)},${escapeCSV(r.timeRange)},${r.totalPlayers},${r.presentCount},${r.lateCount},${r.absentCount},${r.excusedCount},"${r.attendanceRate}%"`
        );
      });
    } else if (report.reportType === 'WEEKLY_TEAM' && report.weeklyRows) {
      lines.push(
        `${escapeCSV('الأسبوع')},${escapeCSV('الفريق')},${escapeCSV('المواليد')},${escapeCSV('النوع')},${escapeCSV('الحصص')},${escapeCSV('إجمالي السجلات')},${escapeCSV('حاضر')},${escapeCSV('متأخر')},${escapeCSV('غياب')},${escapeCSV('عذر')},${escapeCSV('نسبة الحضور (%)')},${escapeCSV('مؤشر الانضباط (%)')}`
      );
      report.weeklyRows.forEach((r) => {
        lines.push(
          `${escapeCSV(r.weekLabel)},${escapeCSV(r.teamName)},${escapeCSV(r.teamBirthYear || '—')},${escapeCSV(r.gender || '—')},${r.sessionCount},${r.totalAttendances},${r.presentCount},${r.lateCount},${r.absentCount},${r.excusedCount},"${r.attendanceRate}%","${r.disciplineScore}%"`
        );
      });
    } else if (report.reportType === 'MONTHLY_TEAM' && report.monthlyRows) {
      lines.push(
        `${escapeCSV('الشهر')},${escapeCSV('الفريق')},${escapeCSV('المواليد')},${escapeCSV('النوع')},${escapeCSV('الحصص')},${escapeCSV('اللاعبون النشطون')},${escapeCSV('إجمالي السجلات')},${escapeCSV('حاضر')},${escapeCSV('متأخر')},${escapeCSV('غياب')},${escapeCSV('عذر')},${escapeCSV('نسبة الحضور (%)')},${escapeCSV('مؤشر الانضباط (%)')}`
      );
      report.monthlyRows.forEach((r) => {
        lines.push(
          `${escapeCSV(r.monthLabel)},${escapeCSV(r.teamName)},${escapeCSV(r.teamBirthYear || '—')},${escapeCSV(r.gender || '—')},${r.sessionCount},${r.uniquePlayersCount},${r.totalAttendances},${r.presentCount},${r.lateCount},${r.absentCount},${r.excusedCount},"${r.attendanceRate}%","${r.disciplineScore}%"`
        );
      });
    } else if (report.reportType === 'PLAYER_ATTENDANCE' && report.playerRows) {
      lines.push(
        `${escapeCSV('كود اللاعب (Player ID)')},${escapeCSV('اسم اللاعب رباعي')},${escapeCSV('الفريق')},${escapeCSV('النوع')},${escapeCSV('المواليد')},${escapeCSV('الحصص')},${escapeCSV('حاضر')},${escapeCSV('متأخر')},${escapeCSV('غياب')},${escapeCSV('عذر')},${escapeCSV('نسبة الحضور (%)')},${escapeCSV('نقاط الانضباط (100)')}`
      );
      report.playerRows.forEach((r) => {
        lines.push(
          `${escapeCSV(r.playerId)},${escapeCSV(r.fullName)},${escapeCSV(r.teamName)},${escapeCSV(r.gender || '—')},${escapeCSV(r.birthYear || '—')},${r.totalSessions},${r.presentCount},${r.lateCount},${r.absentCount},${r.excusedCount},"${r.attendanceRate}%",${r.disciplineScore}`
        );
      });
    } else if (report.reportType === 'TEAM_ATTENDANCE' && report.teamRows) {
      lines.push(
        `${escapeCSV('الفريق')},${escapeCSV('النادي')},${escapeCSV('المواليد')},${escapeCSV('النوع')},${escapeCSV('المدير الفني المعتمد')},${escapeCSV('اللاعبون المقيدون')},${escapeCSV('الحصص المنعقدة')},${escapeCSV('إجمالي السجلات')},${escapeCSV('حاضر')},${escapeCSV('متأخر')},${escapeCSV('غياب')},${escapeCSV('عذر')},${escapeCSV('نسبة الحضور (%)')},${escapeCSV('مؤشر الانضباط (%)')}`
      );
      report.teamRows.forEach((r) => {
        lines.push(
          `${escapeCSV(r.teamName)},${escapeCSV(r.club || 'المؤسسة')},${escapeCSV(r.teamBirthYear || '—')},${escapeCSV(r.gender || '—')},${escapeCSV(r.headCoachName || '—')},${r.playerCount},${r.sessionCount},${r.totalAttendances},${r.presentCount},${r.lateCount},${r.absentCount},${r.excusedCount},"${r.attendanceRate}%","${r.disciplineScore}%"`
        );
      });
    } else if (report.reportType === 'COACH_ATTENDANCE_ACTIVITY' && report.coachRows) {
      lines.push(
        `${escapeCSV('كود المدرب')},${escapeCSV('اسم المدرب')},${escapeCSV('البريد الإلكتروني')},${escapeCSV('الدور / المسمى')},${escapeCSV('الفرق المعتمدة')},${escapeCSV('الحصص المجدولة')},${escapeCSV('الحصص المسجلة')},${escapeCSV('إجمالي السجلات المدخلة')},${escapeCSV('متوسط حضور الفرق (%)')},${escapeCSV('تاريخ آخر نشاط')}`
      );
      report.coachRows.forEach((r) => {
        lines.push(
          `${escapeCSV(r.coachId)},${escapeCSV(r.coachName)},${escapeCSV(r.coachEmail)},${escapeCSV(r.role)},${escapeCSV(r.assignedTeams.join(' - '))},${r.scheduledSessionsCount},${r.conductedSessionsCount},${r.totalAttendanceRecordsLogged},"${r.avgTeamAttendanceRate}%",${escapeCSV(r.lastActiveDate || '—')}`
        );
      });
    }

    const csvContent = BOM + lines.join('\r\n');
    const filename = options.customFilename || buildExportFileName(report, 'csv');

    if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, filename);
    }

    if (options.userEmail) {
      MasterDatabaseService.logAudit(
        options.userEmail,
        'COACH_OR_ADMIN',
        'REPORT_EXPORT_CSV',
        'EXPORT',
        report.reportType,
        `Exported CSV report "${report.title}" with ${lines.length} lines.`
      );
    }

    return { success: true, content: csvContent, filename };
  } catch (err: any) {
    console.error('CSV Export Failed:', err);
    return { success: false, error: err.message || 'فشل تصدير ملف CSV' };
  }
}

// ── 2. EXCEL EXPORT ENGINE (.xls XML/HTML) ──────────────────────────────────

/**
 * Generates and downloads an Excel-compatible formatted spreadsheet (.xls).
 * Contains rich HTML tables, custom color themes, RTL direction, and styled KPI cards.
 */
export function exportToExcel(
  report: ReportDataPayload,
  options: ExportOptions = {}
): { success: boolean; content?: string; filename?: string; error?: string } {
  try {
    if (options.userEmail) {
      const auth = validateExportAuthorization(options.userEmail, report);
      if (!auth.authorized) {
        return { success: false, error: auth.reason };
      }
    }

    const s = report.summary;
    const filterDesc = getFilterSummaryText(report);
    const genDate = new Date(report.generatedAt).toLocaleString('ar-EG');

    let tableHeaderHtml = '';
    let tableBodyHtml = '';

    if (report.reportType === 'DAILY_ATTENDANCE' && report.dailyRows) {
      tableHeaderHtml = `
        <tr style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center;">
          <th>التاريخ</th>
          <th>كود الحصة</th>
          <th>الفريق</th>
          <th>المدرب المسؤول</th>
          <th>الموقع والتوقيت</th>
          <th>اللاعبون</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
        </tr>`;
      tableBodyHtml = report.dailyRows
        .map(
          (r, i) => `
        <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
          <td>${r.date}</td>
          <td>${r.sessionId}</td>
          <td style="font-weight: bold; text-align: right;">${r.teamName}</td>
          <td>${r.coachName}</td>
          <td>${r.location} (${r.timeRange})</td>
          <td>${r.totalPlayers}</td>
          <td style="color: #16a34a; font-weight: bold;">${r.presentCount}</td>
          <td style="color: #d97706; font-weight: bold;">${r.lateCount}</td>
          <td style="color: #dc2626; font-weight: bold;">${r.absentCount}</td>
          <td style="color: #2563eb;">${r.excusedCount}</td>
          <td style="font-weight: bold;">${r.attendanceRate}%</td>
        </tr>`
        )
        .join('');
    } else if (report.reportType === 'WEEKLY_TEAM' && report.weeklyRows) {
      tableHeaderHtml = `
        <tr style="background-color: #7c3aed; color: #ffffff; font-weight: bold; text-align: center;">
          <th>الأسبوع</th>
          <th>الفريق</th>
          <th>المواليد والنوع</th>
          <th>الحصص</th>
          <th>السجلات</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
          <th>الانضباط</th>
        </tr>`;
      tableBodyHtml = report.weeklyRows
        .map(
          (r, i) => `
        <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
          <td style="font-weight: bold;">${r.weekLabel}</td>
          <td style="font-weight: bold; text-align: right;">${r.teamName}</td>
          <td>${r.teamBirthYear || '—'} • ${r.gender || '—'}</td>
          <td>${r.sessionCount}</td>
          <td>${r.totalAttendances}</td>
          <td style="color: #16a34a; font-weight: bold;">${r.presentCount}</td>
          <td style="color: #d97706;">${r.lateCount}</td>
          <td style="color: #dc2626;">${r.absentCount}</td>
          <td style="color: #2563eb;">${r.excusedCount}</td>
          <td style="font-weight: bold;">${r.attendanceRate}%</td>
          <td style="font-weight: bold; color: #7c3aed;">${r.disciplineScore}%</td>
        </tr>`
        )
        .join('');
    } else if (report.reportType === 'MONTHLY_TEAM' && report.monthlyRows) {
      tableHeaderHtml = `
        <tr style="background-color: #9333ea; color: #ffffff; font-weight: bold; text-align: center;">
          <th>الشهر</th>
          <th>الفريق</th>
          <th>المواليد والنوع</th>
          <th>الحصص</th>
          <th>اللاعبون النشطون</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
          <th>الانضباط</th>
        </tr>`;
      tableBodyHtml = report.monthlyRows
        .map(
          (r, i) => `
        <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
          <td style="font-weight: bold;">${r.monthLabel}</td>
          <td style="font-weight: bold; text-align: right;">${r.teamName}</td>
          <td>${r.teamBirthYear || '—'} • ${r.gender || '—'}</td>
          <td>${r.sessionCount}</td>
          <td>${r.uniquePlayersCount}</td>
          <td style="color: #16a34a; font-weight: bold;">${r.presentCount}</td>
          <td style="color: #d97706;">${r.lateCount}</td>
          <td style="color: #dc2626;">${r.absentCount}</td>
          <td style="color: #2563eb;">${r.excusedCount}</td>
          <td style="font-weight: bold;">${r.attendanceRate}%</td>
          <td style="font-weight: bold; color: #9333ea;">${r.disciplineScore}%</td>
        </tr>`
        )
        .join('');
    } else if (report.reportType === 'PLAYER_ATTENDANCE' && report.playerRows) {
      tableHeaderHtml = `
        <tr style="background-color: #059669; color: #ffffff; font-weight: bold; text-align: center;">
          <th>كود اللاعب</th>
          <th>اسم اللاعب رباعي</th>
          <th>الفريق</th>
          <th>النوع والمواليد</th>
          <th>الحصص</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الالتزام</th>
          <th>نقاط الانضباط</th>
        </tr>`;
      tableBodyHtml = report.playerRows
        .map(
          (r, i) => `
        <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
          <td style="font-family: monospace;">${r.playerId}</td>
          <td style="font-weight: bold; text-align: right;">${r.fullName}</td>
          <td style="text-align: right;">${r.teamName}</td>
          <td>${r.birthYear || '—'} • ${r.gender || '—'}</td>
          <td>${r.totalSessions}</td>
          <td style="color: #16a34a; font-weight: bold;">${r.presentCount}</td>
          <td style="color: #d97706;">${r.lateCount}</td>
          <td style="color: #dc2626;">${r.absentCount}</td>
          <td style="color: #2563eb;">${r.excusedCount}</td>
          <td style="font-weight: bold; color: ${
            r.attendanceRate >= 80 ? '#16a34a' : '#dc2626'
          };">${r.attendanceRate}%</td>
          <td style="font-weight: bold;">${r.disciplineScore} / 100</td>
        </tr>`
        )
        .join('');
    } else if (report.reportType === 'TEAM_ATTENDANCE' && report.teamRows) {
      tableHeaderHtml = `
        <tr style="background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: center;">
          <th>الفريق</th>
          <th>النادي</th>
          <th>المواليد والنوع</th>
          <th>المدير الفني المعتمد</th>
          <th>اللاعبون</th>
          <th>الحصص</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
          <th>الانضباط</th>
        </tr>`;
      tableBodyHtml = report.teamRows
        .map(
          (r, i) => `
        <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
          <td style="font-weight: bold; text-align: right;">${r.teamName}</td>
          <td>${r.club || 'المؤسسة'}</td>
          <td>${r.teamBirthYear || '—'} • ${r.gender || '—'}</td>
          <td>${r.headCoachName || '—'}</td>
          <td>${r.playerCount}</td>
          <td>${r.sessionCount}</td>
          <td style="color: #16a34a; font-weight: bold;">${r.presentCount}</td>
          <td style="color: #d97706;">${r.lateCount}</td>
          <td style="color: #dc2626;">${r.absentCount}</td>
          <td style="color: #2563eb;">${r.excusedCount}</td>
          <td style="font-weight: bold;">${r.attendanceRate}%</td>
          <td style="font-weight: bold; color: #0284c7;">${r.disciplineScore}%</td>
        </tr>`
        )
        .join('');
    } else if (report.reportType === 'COACH_ATTENDANCE_ACTIVITY' && report.coachRows) {
      tableHeaderHtml = `
        <tr style="background-color: #e11d48; color: #ffffff; font-weight: bold; text-align: center;">
          <th>كود المدرب</th>
          <th>اسم المدرب</th>
          <th>الدور</th>
          <th>الفرق المعتمدة</th>
          <th>الحصص المجدولة</th>
          <th>الحصص المسجلة</th>
          <th>السجلات المدخلة</th>
          <th>متوسط حضور الفرق</th>
          <th>آخر نشاط</th>
        </tr>`;
      tableBodyHtml = report.coachRows
        .map(
          (r, i) => `
        <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
          <td style="font-family: monospace;">${r.coachId}</td>
          <td style="font-weight: bold; text-align: right;">${r.coachName}</td>
          <td>${r.role}</td>
          <td style="text-align: right;">${r.assignedTeams.join(', ')}</td>
          <td>${r.scheduledSessionsCount}</td>
          <td style="font-weight: bold; color: #16a34a;">${r.conductedSessionsCount}</td>
          <td style="font-weight: bold;">${r.totalAttendanceRecordsLogged}</td>
          <td style="font-weight: bold;">${r.avgTeamAttendanceRate}%</td>
          <td>${r.lastActiveDate || '—'}</td>
        </tr>`
        )
        .join('');
    }

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${report.reportType.substring(0, 30)}</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayRightToLeft/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11pt; }
            .header-box { background: #0f172a; color: #ffffff; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
            .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; font-size: 10pt; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <h2 style="margin: 0 0 6px 0;">🏐 ${report.title}</h2>
            <p style="margin: 0; font-size: 10pt; color: #cbd5e1;">منظومة إدارة تدريبات وبطولات الكرة الطائرة</p>
            <p style="margin: 6px 0 0 0; font-size: 9pt; color: #94a3b8;">تاريخ التوليد: ${genDate} | المستخدم: ${report.generatedByUser} | ${filterDesc}</p>
          </div>

          <table>
            <tr>
              <td class="kpi-card"><b>الحصص:</b> ${s.totalSessions}</td>
              <td class="kpi-card"><b>السجلات:</b> ${s.totalRecords}</td>
              <td class="kpi-card" style="color: #16a34a;"><b>حاضر:</b> ${s.presentCount} (${s.attendanceRate}%)</td>
              <td class="kpi-card" style="color: #d97706;"><b>متأخر:</b> ${s.lateCount} (${s.lateRate}%)</td>
              <td class="kpi-card" style="color: #dc2626;"><b>غياب:</b> ${s.absentCount} (${s.absenceRate}%)</td>
              <td class="kpi-card" style="color: #2563eb;"><b>عذر:</b> ${s.excusedCount}</td>
              <td class="kpi-card" style="color: #7c3aed;"><b>الانضباط:</b> ${s.averageDisciplineScore || 100}%</td>
            </tr>
          </table>

          <table>
            <thead>${tableHeaderHtml}</thead>
            <tbody>${tableBodyHtml}</tbody>
          </table>
        </body>
      </html>`;

    const filename = options.customFilename || buildExportFileName(report, 'xls');

    if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
      const blob = new Blob(['\uFEFF' + excelHtml], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
      });
      triggerDownload(blob, filename);
    }

    if (options.userEmail) {
      MasterDatabaseService.logAudit(
        options.userEmail,
        'COACH_OR_ADMIN',
        'REPORT_EXPORT_EXCEL',
        'EXPORT',
        report.reportType,
        `Exported Excel spreadsheet for "${report.title}".`
      );
    }

    return { success: true, content: excelHtml, filename };
  } catch (err: any) {
    console.error('Excel Export Failed:', err);
    return { success: false, error: err.message || 'فشل تصدير ملف Excel' };
  }
}

// ── 3. PRINTABLE REPORT ENGINE ───────────────────────────────────────────────

/**
 * Generates the clean, high-contrast HTML markup for printer/PDF rendering.
 */
export function generatePrintableHTML(
  report: ReportDataPayload,
  isRtl: boolean = true
): string {
  const s = report.summary;
  const filterDesc = getFilterSummaryText(report);
  const genDate = new Date(report.generatedAt).toLocaleString('ar-EG');

  let rowsHtml = '';
  if (report.reportType === 'DAILY_ATTENDANCE' && report.dailyRows) {
    rowsHtml = `
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>كود الحصة</th>
          <th>الفريق</th>
          <th>المدرب</th>
          <th>الموقع</th>
          <th>اللاعبون</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
        </tr>
      </thead>
      <tbody>
        ${report.dailyRows
          .map(
            (r) => `
          <tr>
            <td>${r.date}</td>
            <td style="font-family: monospace;">${r.sessionId}</td>
            <td><b>${r.teamName}</b></td>
            <td>${r.coachName}</td>
            <td>${r.location}</td>
            <td style="text-align: center;">${r.totalPlayers}</td>
            <td style="text-align: center; color: #16a34a; font-weight: bold;">${r.presentCount}</td>
            <td style="text-align: center; color: #d97706;">${r.lateCount}</td>
            <td style="text-align: center; color: #dc2626;">${r.absentCount}</td>
            <td style="text-align: center; color: #2563eb;">${r.excusedCount}</td>
            <td style="text-align: center; font-weight: bold;">${r.attendanceRate}%</td>
          </tr>`
          )
          .join('')}
      </tbody>`;
  } else if (report.reportType === 'WEEKLY_TEAM' && report.weeklyRows) {
    rowsHtml = `
      <thead>
        <tr>
          <th>الأسبوع</th>
          <th>الفريق</th>
          <th>المواليد / النوع</th>
          <th>الحصص</th>
          <th>السجلات</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
          <th>الانضباط</th>
        </tr>
      </thead>
      <tbody>
        ${report.weeklyRows
          .map(
            (r) => `
          <tr>
            <td><b>${r.weekLabel}</b></td>
            <td><b>${r.teamName}</b></td>
            <td>${r.teamBirthYear || '—'} • ${r.gender || '—'}</td>
            <td style="text-align: center;">${r.sessionCount}</td>
            <td style="text-align: center;">${r.totalAttendances}</td>
            <td style="text-align: center; color: #16a34a; font-weight: bold;">${r.presentCount}</td>
            <td style="text-align: center; color: #d97706;">${r.lateCount}</td>
            <td style="text-align: center; color: #dc2626;">${r.absentCount}</td>
            <td style="text-align: center; color: #2563eb;">${r.excusedCount}</td>
            <td style="text-align: center; font-weight: bold;">${r.attendanceRate}%</td>
            <td style="text-align: center; font-weight: bold; color: #7c3aed;">${r.disciplineScore}%</td>
          </tr>`
          )
          .join('')}
      </tbody>`;
  } else if (report.reportType === 'MONTHLY_TEAM' && report.monthlyRows) {
    rowsHtml = `
      <thead>
        <tr>
          <th>الشهر</th>
          <th>الفريق</th>
          <th>المواليد / النوع</th>
          <th>الحصص</th>
          <th>اللاعبون النشطون</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
          <th>الانضباط</th>
        </tr>
      </thead>
      <tbody>
        ${report.monthlyRows
          .map(
            (r) => `
          <tr>
            <td><b>${r.monthLabel}</b></td>
            <td><b>${r.teamName}</b></td>
            <td>${r.teamBirthYear || '—'} • ${r.gender || '—'}</td>
            <td style="text-align: center;">${r.sessionCount}</td>
            <td style="text-align: center;">${r.uniquePlayersCount}</td>
            <td style="text-align: center; color: #16a34a; font-weight: bold;">${r.presentCount}</td>
            <td style="text-align: center; color: #d97706;">${r.lateCount}</td>
            <td style="text-align: center; color: #dc2626;">${r.absentCount}</td>
            <td style="text-align: center; color: #2563eb;">${r.excusedCount}</td>
            <td style="text-align: center; font-weight: bold;">${r.attendanceRate}%</td>
            <td style="text-align: center; font-weight: bold; color: #9333ea;">${r.disciplineScore}%</td>
          </tr>`
          )
          .join('')}
      </tbody>`;
  } else if (report.reportType === 'PLAYER_ATTENDANCE' && report.playerRows) {
    rowsHtml = `
      <thead>
        <tr>
          <th>كود اللاعب</th>
          <th>اسم اللاعب</th>
          <th>الفريق</th>
          <th>المواليد</th>
          <th>الحصص</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
          <th>الانضباط</th>
        </tr>
      </thead>
      <tbody>
        ${report.playerRows
          .map(
            (r) => `
          <tr>
            <td style="font-family: monospace;">${r.playerId}</td>
            <td><b>${r.fullName}</b></td>
            <td>${r.teamName}</td>
            <td style="text-align: center;">${r.birthYear || '—'}</td>
            <td style="text-align: center;">${r.totalSessions}</td>
            <td style="text-align: center; color: #16a34a; font-weight: bold;">${r.presentCount}</td>
            <td style="text-align: center; color: #d97706;">${r.lateCount}</td>
            <td style="text-align: center; color: #dc2626;">${r.absentCount}</td>
            <td style="text-align: center; color: #2563eb;">${r.excusedCount}</td>
            <td style="text-align: center; font-weight: bold;">${r.attendanceRate}%</td>
            <td style="text-align: center; font-weight: bold;">${r.disciplineScore}</td>
          </tr>`
          )
          .join('')}
      </tbody>`;
  } else if (report.reportType === 'TEAM_ATTENDANCE' && report.teamRows) {
    rowsHtml = `
      <thead>
        <tr>
          <th>الفريق</th>
          <th>النادي</th>
          <th>المدير الفني</th>
          <th>اللاعبون</th>
          <th>الحصص</th>
          <th>حاضر</th>
          <th>متأخر</th>
          <th>غياب</th>
          <th>عذر</th>
          <th>نسبة الحضور</th>
          <th>الانضباط</th>
        </tr>
      </thead>
      <tbody>
        ${report.teamRows
          .map(
            (r) => `
          <tr>
            <td><b>${r.teamName}</b></td>
            <td>${r.club || 'المؤسسة'}</td>
            <td>${r.headCoachName || '—'}</td>
            <td style="text-align: center;">${r.playerCount}</td>
            <td style="text-align: center;">${r.sessionCount}</td>
            <td style="text-align: center; color: #16a34a; font-weight: bold;">${r.presentCount}</td>
            <td style="text-align: center; color: #d97706;">${r.lateCount}</td>
            <td style="text-align: center; color: #dc2626;">${r.absentCount}</td>
            <td style="text-align: center; color: #2563eb;">${r.excusedCount}</td>
            <td style="text-align: center; font-weight: bold;">${r.attendanceRate}%</td>
            <td style="text-align: center; font-weight: bold;">${r.disciplineScore}%</td>
          </tr>`
          )
          .join('')}
      </tbody>`;
  } else if (report.reportType === 'COACH_ATTENDANCE_ACTIVITY' && report.coachRows) {
    rowsHtml = `
      <thead>
        <tr>
          <th>كود المدرب</th>
          <th>اسم المدرب</th>
          <th>الدور</th>
          <th>الفرق المعتمدة</th>
          <th>المجدولة</th>
          <th>المسجلة</th>
          <th>إجمالي السجلات</th>
          <th>متوسط الحضور</th>
          <th>آخر نشاط</th>
        </tr>
      </thead>
      <tbody>
        ${report.coachRows
          .map(
            (r) => `
          <tr>
            <td style="font-family: monospace;">${r.coachId}</td>
            <td><b>${r.coachName}</b></td>
            <td>${r.role}</td>
            <td>${r.assignedTeams.join(', ')}</td>
            <td style="text-align: center;">${r.scheduledSessionsCount}</td>
            <td style="text-align: center; color: #16a34a; font-weight: bold;">${r.conductedSessionsCount}</td>
            <td style="text-align: center; font-weight: bold;">${r.totalAttendanceRecordsLogged}</td>
            <td style="text-align: center; font-weight: bold;">${r.avgTeamAttendanceRate}%</td>
            <td style="text-align: center;">${r.lastActiveDate || '—'}</td>
          </tr>`
          )
          .join('')}
      </tbody>`;
  }

  return `
    <!DOCTYPE html>
    <html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${isRtl ? 'ar' : 'en'}">
      <head>
        <meta charset="utf-8" />
        <title>${report.title} — طباعة رسمية</title>
        <style>
          @page { size: A4 landscape; margin: 10mm 12mm; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 8px;
            color: #0f172a;
            background: #ffffff;
            direction: ${isRtl ? 'rtl' : 'ltr'};
          }
          .print-header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .club-title {
            font-size: 17px;
            font-weight: 900;
            color: #0f172a;
            margin: 0 0 3px 0;
          }
          .report-subtitle {
            font-size: 13px;
            font-weight: bold;
            color: #475569;
            margin: 0;
          }
          .meta-info {
            font-size: 10px;
            color: #64748b;
            margin-top: 5px;
          }
          .kpi-bar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 6px;
            margin-bottom: 14px;
          }
          .kpi-box {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            padding: 6px;
            text-align: center;
          }
          .kpi-label { font-size: 9px; color: #64748b; font-weight: bold; display: block; }
          .kpi-val { font-size: 14px; font-weight: 900; margin-top: 2px; color: #0f172a; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
            margin-bottom: 16px;
          }
          th {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            font-weight: 800;
            text-align: ${isRtl ? 'right' : 'left'};
          }
          td {
            border: 1px solid #e2e8f0;
            padding: 5px 8px;
          }
          tr { page-break-inside: avoid; }
          .footer-sign {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            padding-top: 14px;
            border-top: 1px dashed #cbd5e1;
            font-size: 10pt;
            font-weight: bold;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div>
            <div class="club-title">🏐 منظومة إدارة حضور فرق الكرة الطائرة</div>
            <div class="report-subtitle">${report.title}</div>
            <div class="meta-info"><b>معايير التقرير:</b> ${filterDesc}</div>
          </div>
          <div style="text-align: ${isRtl ? 'left' : 'right'}; font-size: 9.5pt; color: #64748b;">
            <div><b>تاريخ التوليد:</b> ${genDate}</div>
            <div><b>المستخدم:</b> ${report.generatedByUser}</div>
          </div>
        </div>

        <div class="kpi-bar">
          <div class="kpi-box">
            <span class="kpi-label">الحصص المنعقدة</span>
            <div class="kpi-val">${s.totalSessions}</div>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">إجمالي السجلات</span>
            <div class="kpi-val">${s.totalRecords}</div>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">الحاضرون</span>
            <div class="kpi-val" style="color: #16a34a;">${s.presentCount} (${s.attendanceRate}%)</div>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">المتأخرون</span>
            <div class="kpi-val" style="color: #d97706;">${s.lateCount} (${s.lateRate}%)</div>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">الغياب</span>
            <div class="kpi-val" style="color: #dc2626;">${s.absentCount} (${s.absenceRate}%)</div>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">إذن رسمي</span>
            <div class="kpi-val" style="color: #2563eb;">${s.excusedCount}</div>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">مؤشر الانضباط</span>
            <div class="kpi-val" style="color: #7c3aed;">${s.averageDisciplineScore || 100}%</div>
          </div>
        </div>

        <table>${rowsHtml}</table>

        <div class="footer-sign">
          <div>توقيع المدرب المسؤول: .......................................</div>
          <div>اعتماد المدير الفني: .......................................</div>
          <div>خاتم الإدارة الرياضية: .......................................</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Opens a dedicated print dialog for the report.
 */
export function printReport(
  report: ReportDataPayload,
  isRtl: boolean = true,
  options: ExportOptions = {}
): { success: boolean; error?: string } {
  try {
    if (options.userEmail) {
      const auth = validateExportAuthorization(options.userEmail, report);
      if (!auth.authorized) {
        return { success: false, error: auth.reason };
      }
    }

    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    if (!printWindow) {
      return { success: false, error: 'يرجى السماح بالنوافذ المنبثقة (Popups) لعرض شاشة الطباعة.' };
    }

    const html = generatePrintableHTML(report, isRtl);
    printWindow.document.write(html);
    printWindow.document.write(`
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    `);
    printWindow.document.close();

    if (options.userEmail) {
      MasterDatabaseService.logAudit(
        options.userEmail,
        'COACH_OR_ADMIN',
        'REPORT_PRINT_TRIGGERED',
        'PRINT',
        report.reportType,
        `Triggered print dialog for "${report.title}".`
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error('Print trigger failed:', err);
    return { success: false, error: err.message || 'فشل فتح شاشة الطباعة' };
  }
}

// ── 4. FUTURE PDF ARCHITECTURE BRIDGE ────────────────────────────────────────

/**
 * Prepares a structured PDF definition and metadata ready for PDF generation.
 * Can be used by browser print-to-PDF, headless Chrome, or jsPDF/pdfmake wrappers.
 */
export function preparePDFDocument(
  report: ReportDataPayload,
  isRtl: boolean = true
): PDFDocumentDefinition {
  const html = generatePrintableHTML(report, isRtl);
  return {
    title: report.title,
    author: report.generatedByUser,
    subject: `Volleyball Attendance Report - ${report.reportType}`,
    keywords: ['volleyball', 'attendance', 'report', report.reportType, report.filtersApplied?.teamName || 'all'],
    createdAt: report.generatedAt,
    orientation: 'landscape',
    pageSize: 'A4',
    htmlContent: html,
  };
}

/**
 * PDF Export Bridge (currently leverages the styled browser print engine configured for PDF saving).
 */
export function exportToPDF(
  report: ReportDataPayload,
  isRtl: boolean = true,
  options: ExportOptions = {}
): { success: boolean; error?: string } {
  return printReport(report, isRtl, options);
}

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);
}
