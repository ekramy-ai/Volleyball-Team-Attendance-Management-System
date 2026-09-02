import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'src/data');

const attendancePath = path.join(dataDir, 'attendanceRecords.json');
const auditLogsPath = path.join(dataDir, 'auditLogs.json');
const systemSettingsPath = path.join(dataDir, 'systemSettings.json');

// 1. Initial Attendance Records (Real structure)
const initialAttendance = [
  {
    AttendanceID: 'ATT-00001',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'M-G1501019954',
    PlayerName: 'امنيه ابراهيم سعيد ابراهيم',
    TeamName: 'راية براعم 2017 - بنات - أ',
    TrainingDate: '2026-09-01',
    AttendanceStatus: 'PRESENT',
    ArrivalTime: '17:55',
    LateMinutes: 0,
    Notes: 'حضور منتظم ومستوى تدريبي ممتاز',
    CoachID: 'COACH-0002',
    CoachName: 'الكابتن / أحمد سالم',
    Timestamp: '2026-09-01T18:02:00.000Z'
  },
  {
    AttendanceID: 'ATT-00002',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'M-G1501154414',
    PlayerName: 'تاليا سليمان محمود',
    TeamName: 'راية براعم 2017 - بنات - أ',
    TrainingDate: '2026-09-01',
    AttendanceStatus: 'LATE',
    ArrivalTime: '18:15',
    LateMinutes: 15,
    ExcuseType: 'Travel',
    Notes: 'ازدحام مروري',
    CoachID: 'COACH-0002',
    CoachName: 'الكابتن / أحمد سالم',
    Timestamp: '2026-09-01T18:15:00.000Z'
  }
];

if (!fs.existsSync(attendancePath)) {
  fs.writeFileSync(attendancePath, JSON.stringify(initialAttendance, null, 2), 'utf8');
  console.log('✅ Created src/data/attendanceRecords.json');
}

// 2. Initial Audit Logs
const initialAuditLogs = [
  {
    LogID: 'LOG-00001',
    UserEmail: 'admin@volleyball.club',
    UserRole: 'ADMIN',
    Action: 'SYSTEM_INITIALIZATION',
    EntityType: 'SYSTEM',
    EntityID: 'MAIN',
    Details: 'تهيئة النظام بالكامل وتثبيت قاعدة البيانات الرسمية للجهاز الفني واللاعبين',
    Timestamp: '2026-09-01T08:00:00.000Z'
  }
];

if (!fs.existsSync(auditLogsPath)) {
  fs.writeFileSync(auditLogsPath, JSON.stringify(initialAuditLogs, null, 2), 'utf8');
  console.log('✅ Created src/data/auditLogs.json');
}

// 3. Initial System Settings
const initialSettings = [
  {
    SettingKey: 'ALLOW_FUTURE_ATTENDANCE',
    SettingValue: 'false',
    Description: 'منع تسجيل الحضور للتواريخ المستقبلية',
    LastUpdated: '2026-09-01T08:00:00.000Z'
  },
  {
    SettingKey: 'DEFAULT_LATE_THRESHOLD_MINUTES',
    SettingValue: '10',
    Description: 'الحد الأدنى لاحتساب دقائق التأخير',
    LastUpdated: '2026-09-01T08:00:00.000Z'
  }
];

if (!fs.existsSync(systemSettingsPath)) {
  fs.writeFileSync(systemSettingsPath, JSON.stringify(initialSettings, null, 2), 'utf8');
  console.log('✅ Created src/data/systemSettings.json');
}

console.log('🎉 Enterprise persistent storage layer initialized successfully.');
