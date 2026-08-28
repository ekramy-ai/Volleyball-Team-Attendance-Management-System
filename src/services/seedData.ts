/**
 * Initial Test Data for Volleyball Club Attendance System (Phase 1)
 * Contains structured seed data for all 8 Sheets.
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
  SheetDefinition
} from '../types/database';

export const SHEET_DEFINITIONS: SheetDefinition[] = [
  {
    name: 'PLAYERS',
    description: 'Master roster of all club volleyball players with parental contacts and statuses.',
    primaryKey: 'PlayerID',
    columns: [
      'PlayerID',
      'FullName',
      'Gender',
      'DateOfBirth',
      'BirthYear',
      'TeamID',
      'TeamName',
      'ParentName',
      'ParentPhone',
      'PlayerStatus',
      'RegistrationDate',
      'Notes'
    ],
    requiredFields: ['PlayerID', 'FullName', 'Gender', 'DateOfBirth', 'BirthYear', 'TeamID', 'ParentName', 'ParentPhone', 'PlayerStatus']
  },
  {
    name: 'TEAMS',
    description: 'Active volleyball age divisions, seasons, and assigned coaching staff.',
    primaryKey: 'TeamID',
    columns: [
      'TeamID',
      'TeamName',
      'BirthYear',
      'Gender',
      'Category',
      'Season',
      'HeadCoachID',
      'AssistantCoachID',
      'TeamStatus'
    ],
    requiredFields: ['TeamID', 'TeamName', 'BirthYear', 'Gender', 'Category', 'Season', 'TeamStatus']
  },
  {
    name: 'COACHES',
    description: 'Coaching staff directory and Google authentication accounts.',
    primaryKey: 'CoachID',
    columns: [
      'CoachID',
      'FullName',
      'Email',
      'Phone',
      'Role',
      'AccountStatus'
    ],
    requiredFields: ['CoachID', 'FullName', 'Email', 'Role', 'AccountStatus']
  },
  {
    name: 'COACH_TEAMS',
    description: 'Security & authorization mapping linking coaches to authorized team data.',
    primaryKey: 'AssignmentID',
    columns: [
      'AssignmentID',
      'CoachID',
      'TeamID',
      'PermissionLevel',
      'Active'
    ],
    requiredFields: ['AssignmentID', 'CoachID', 'TeamID', 'PermissionLevel', 'Active']
  },
  {
    name: 'TRAINING_SESSIONS',
    description: 'Recorded club practice sessions, dates, time windows, and facilities.',
    primaryKey: 'SessionID',
    columns: [
      'SessionID',
      'TeamID',
      'TeamName',
      'TrainingDate',
      'StartTime',
      'EndTime',
      'Location',
      'CoachID',
      'CoachName',
      'CreatedAt'
    ],
    requiredFields: ['SessionID', 'TeamID', 'TrainingDate', 'StartTime', 'EndTime', 'Location', 'CoachID']
  },
  {
    name: 'ATTENDANCE',
    description: 'Granular player attendance, lateness minute counters, excuse types, and timestamps.',
    primaryKey: 'AttendanceID',
    columns: [
      'AttendanceID',
      'SessionID',
      'PlayerID',
      'PlayerName',
      'TeamID',
      'TeamName',
      'TrainingDate',
      'Status',
      'ArrivalTime',
      'LateMinutes',
      'ExcuseType',
      'CoachID',
      'CoachName',
      'Notes',
      'Timestamp'
    ],
    requiredFields: ['AttendanceID', 'SessionID', 'PlayerID', 'TeamID', 'TrainingDate', 'Status']
  },
  {
    name: 'SYSTEM_USERS',
    description: 'Active authenticated application accounts, role levels, and login activity.',
    primaryKey: 'UserID',
    columns: [
      'UserID',
      'Email',
      'FullName',
      'Role',
      'Status',
      'LastLogin'
    ],
    requiredFields: ['UserID', 'Email', 'FullName', 'Role', 'Status']
  },
  {
    name: 'AUDIT_LOG',
    description: 'Tamper-evident audit trail capturing modifications, transfers, and attendance records.',
    primaryKey: 'LogID',
    columns: [
      'LogID',
      'UserEmail',
      'UserRole',
      'Action',
      'EntityType',
      'EntityID',
      'Details',
      'Timestamp'
    ],
    requiredFields: ['LogID', 'UserEmail', 'UserRole', 'Action', 'EntityType', 'Timestamp']
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    BirthYear: 2015,
    Gender: 'Female',
    Category: 'U11',
    Season: '2025-2026',
    HeadCoachID: 'COACH-0001',
    AssistantCoachID: 'COACH-0004',
    TeamStatus: 'Active'
  },
  {
    TeamID: 'T002',
    TeamName: 'Boys 2015',
    BirthYear: 2015,
    Gender: 'Male',
    Category: 'U11',
    Season: '2025-2026',
    HeadCoachID: 'COACH-0003',
    TeamStatus: 'Active'
  },
  {
    TeamID: 'T003',
    TeamName: 'Girls 2014',
    BirthYear: 2014,
    Gender: 'Female',
    Category: 'U12',
    Season: '2025-2026',
    HeadCoachID: 'COACH-0002',
    TeamStatus: 'Active'
  }
];

export const INITIAL_COACHES: Coach[] = [
  {
    CoachID: 'COACH-0000',
    FullName: 'Admin Director',
    Email: 'admin@volleyball.club',
    Phone: '+1 (555) 010-0001',
    Role: 'ADMIN',
    AccountStatus: 'Active'
  },
  {
    CoachID: 'COACH-0001',
    FullName: 'Elena Rostova (Coach A)',
    Email: 'coach.a@volleyball.club',
    Phone: '+1 (555) 010-1001',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active'
  },
  {
    CoachID: 'COACH-0002',
    FullName: 'Marco Rossi (Coach B)',
    Email: 'coach.b@volleyball.club',
    Phone: '+1 (555) 010-2002',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active'
  },
  {
    CoachID: 'COACH-0003',
    FullName: 'David Miller (Coach C)',
    Email: 'coach.c@volleyball.club',
    Phone: '+1 (555) 010-3003',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active'
  },
  {
    CoachID: 'COACH-0004',
    FullName: 'Sarah Chen (Coach D)',
    Email: 'coach.d@volleyball.club',
    Phone: '+1 (555) 010-4004',
    Role: 'ASSISTANT_COACH',
    AccountStatus: 'Active'
  },
  {
    CoachID: 'COACH-0005',
    FullName: 'System SuperAdmin',
    Email: 'ekra88@gmail.com',
    Phone: '+1 (555) 010-9999',
    Role: 'ADMIN',
    AccountStatus: 'Active'
  }
];

export const INITIAL_COACH_TEAMS: CoachTeam[] = [
  {
    AssignmentID: 'ASSIGN-0001',
    CoachID: 'COACH-0001', // Elena Rostova
    TeamID: 'T001',        // Girls 2015
    PermissionLevel: 'FULL_MANAGE',
    Active: true
  },
  {
    AssignmentID: 'ASSIGN-0002',
    CoachID: 'COACH-0002', // Marco Rossi
    TeamID: 'T003',        // Girls 2014
    PermissionLevel: 'FULL_MANAGE',
    Active: true
  },
  {
    AssignmentID: 'ASSIGN-0003',
    CoachID: 'COACH-0003', // David Miller
    TeamID: 'T002',        // Boys 2015
    PermissionLevel: 'FULL_MANAGE',
    Active: true
  },
  {
    AssignmentID: 'ASSIGN-0004',
    CoachID: 'COACH-0004', // Sarah Chen
    TeamID: 'T001',        // Girls 2015 (Assistant)
    PermissionLevel: 'RECORD_ONLY',
    Active: true
  }
];

export const INITIAL_PLAYERS: Player[] = [
  // Girls 2015 (T001)
  {
    PlayerID: 'PLR-0001',
    FullName: 'Sophia Martinez',
    Gender: 'Female',
    DateOfBirth: '2015-03-12',
    BirthYear: 2015,
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    ParentName: 'Carlos Martinez',
    ParentPhone: '+1 (555) 234-1101',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-01',
    Notes: 'Setter candidate. Very fast footwork.'
  },
  {
    PlayerID: 'PLR-0002',
    FullName: 'Emma Johnson',
    Gender: 'Female',
    DateOfBirth: '2015-05-20',
    BirthYear: 2015,
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    ParentName: 'Laura Johnson',
    ParentPhone: '+1 (555) 234-1102',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-01',
    Notes: 'Strong overhead serve.'
  },
  {
    PlayerID: 'PLR-0003',
    FullName: 'Olivia Davis',
    Gender: 'Female',
    DateOfBirth: '2015-01-15',
    BirthYear: 2015,
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    ParentName: 'Mark Davis',
    ParentPhone: '+1 (555) 234-1103',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-02',
    Notes: 'Great defensive positioning.'
  },
  {
    PlayerID: 'PLR-0004',
    FullName: 'Ava Wilson',
    Gender: 'Female',
    DateOfBirth: '2015-08-09',
    BirthYear: 2015,
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    ParentName: 'Patricia Wilson',
    ParentPhone: '+1 (555) 234-1104',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-03',
    Notes: 'Team captain candidate.'
  },
  {
    PlayerID: 'PLR-0005',
    FullName: 'Isabella Taylor',
    Gender: 'Female',
    DateOfBirth: '2015-11-22',
    BirthYear: 2015,
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    ParentName: 'David Taylor',
    ParentPhone: '+1 (555) 234-1105',
    PlayerStatus: 'Injured',
    RegistrationDate: '2025-09-05',
    Notes: 'Mild ankle sprain in recovery.'
  },
  {
    PlayerID: 'PLR-0006',
    FullName: 'Mia Anderson',
    Gender: 'Female',
    DateOfBirth: '2015-04-18',
    BirthYear: 2015,
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    ParentName: 'Sarah Anderson',
    ParentPhone: '+1 (555) 234-1106',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-05',
    Notes: 'Excellent passing mechanics.'
  },
  {
    PlayerID: 'PLR-0007',
    FullName: 'Harper Thomas',
    Gender: 'Female',
    DateOfBirth: '2015-06-30',
    BirthYear: 2015,
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    ParentName: 'James Thomas',
    ParentPhone: '+1 (555) 234-1107',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-10'
  },
  {
    PlayerID: 'PLR-0008',
    FullName: 'Evelyn White',
    Gender: 'Female',
    DateOfBirth: '2015-09-14',
    BirthYear: 2015,
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    ParentName: 'Karen White',
    ParentPhone: '+1 (555) 234-1108',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-12'
  },

  // Boys 2015 (T002)
  {
    PlayerID: 'PLR-0009',
    FullName: 'Liam Smith',
    Gender: 'Male',
    DateOfBirth: '2015-02-14',
    BirthYear: 2015,
    TeamID: 'T002',
    TeamName: 'Boys 2015',
    ParentName: 'Robert Smith',
    ParentPhone: '+1 (555) 345-2201',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-01',
    Notes: 'High jump vertical.'
  },
  {
    PlayerID: 'PLR-0010',
    FullName: 'Noah Garcia',
    Gender: 'Male',
    DateOfBirth: '2015-07-11',
    BirthYear: 2015,
    TeamID: 'T002',
    TeamName: 'Boys 2015',
    ParentName: 'Elena Garcia',
    ParentPhone: '+1 (555) 345-2202',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-01',
    Notes: 'Powerful spike approach.'
  },
  {
    PlayerID: 'PLR-0011',
    FullName: 'Ethan Brown',
    Gender: 'Male',
    DateOfBirth: '2015-04-03',
    BirthYear: 2015,
    TeamID: 'T002',
    TeamName: 'Boys 2015',
    ParentName: 'Daniel Brown',
    ParentPhone: '+1 (555) 345-2203',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-03'
  },
  {
    PlayerID: 'PLR-0012',
    FullName: 'Lucas Jones',
    Gender: 'Male',
    DateOfBirth: '2015-10-19',
    BirthYear: 2015,
    TeamID: 'T002',
    TeamName: 'Boys 2015',
    ParentName: 'Lisa Jones',
    ParentPhone: '+1 (555) 345-2204',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-04'
  },
  {
    PlayerID: 'PLR-0013',
    FullName: 'Mason Miller',
    Gender: 'Male',
    DateOfBirth: '2015-06-25',
    BirthYear: 2015,
    TeamID: 'T002',
    TeamName: 'Boys 2015',
    ParentName: 'Brian Miller',
    ParentPhone: '+1 (555) 345-2205',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-08'
  },
  {
    PlayerID: 'PLR-0014',
    FullName: 'Oliver Wilson',
    Gender: 'Male',
    DateOfBirth: '2015-12-05',
    BirthYear: 2015,
    TeamID: 'T002',
    TeamName: 'Boys 2015',
    ParentName: 'Rebecca Wilson',
    ParentPhone: '+1 (555) 345-2206',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-10'
  },

  // Girls 2014 (T003)
  {
    PlayerID: 'PLR-0015',
    FullName: 'Chloe Martin',
    Gender: 'Female',
    DateOfBirth: '2014-01-29',
    BirthYear: 2014,
    TeamID: 'T003',
    TeamName: 'Girls 2014',
    ParentName: 'Antoine Martin',
    ParentPhone: '+1 (555) 456-3301',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-08-25',
    Notes: 'Team captain.'
  },
  {
    PlayerID: 'PLR-0016',
    FullName: 'Abigail Lee',
    Gender: 'Female',
    DateOfBirth: '2014-04-16',
    BirthYear: 2014,
    TeamID: 'T003',
    TeamName: 'Girls 2014',
    ParentName: 'Min-Jun Lee',
    ParentPhone: '+1 (555) 456-3302',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-08-25'
  },
  {
    PlayerID: 'PLR-0017',
    FullName: 'Emily Clark',
    Gender: 'Female',
    DateOfBirth: '2014-09-08',
    BirthYear: 2014,
    TeamID: 'T003',
    TeamName: 'Girls 2014',
    ParentName: 'Hannah Clark',
    ParentPhone: '+1 (555) 456-3303',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-08-28'
  },
  {
    PlayerID: 'PLR-0018',
    FullName: 'Ella Rodriguez',
    Gender: 'Female',
    DateOfBirth: '2014-11-03',
    BirthYear: 2014,
    TeamID: 'T003',
    TeamName: 'Girls 2014',
    ParentName: 'Manuel Rodriguez',
    ParentPhone: '+1 (555) 456-3304',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-01'
  },
  {
    PlayerID: 'PLR-0019',
    FullName: 'Grace Walker',
    Gender: 'Female',
    DateOfBirth: '2014-07-21',
    BirthYear: 2014,
    TeamID: 'T003',
    TeamName: 'Girls 2014',
    ParentName: 'Jessica Walker',
    ParentPhone: '+1 (555) 456-3305',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-02'
  },
  {
    PlayerID: 'PLR-0020',
    FullName: 'Zoe Hall',
    Gender: 'Female',
    DateOfBirth: '2014-05-12',
    BirthYear: 2014,
    TeamID: 'T003',
    TeamName: 'Girls 2014',
    ParentName: 'Steven Hall',
    ParentPhone: '+1 (555) 456-3306',
    PlayerStatus: 'Active',
    RegistrationDate: '2025-09-05'
  }
];

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    UserID: 'USR-0001',
    Email: 'admin@volleyball.club',
    FullName: 'Admin Director',
    Role: 'ADMIN',
    Status: 'Active',
    LastLogin: new Date().toISOString()
  },
  {
    UserID: 'USR-0002',
    Email: 'coach.a@volleyball.club',
    FullName: 'Elena Rostova (Coach A)',
    Role: 'HEAD_COACH',
    Status: 'Active',
    LastLogin: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    UserID: 'USR-0003',
    Email: 'coach.b@volleyball.club',
    FullName: 'Marco Rossi (Coach B)',
    Role: 'HEAD_COACH',
    Status: 'Active',
    LastLogin: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    UserID: 'USR-0004',
    Email: 'coach.c@volleyball.club',
    FullName: 'David Miller (Coach C)',
    Role: 'HEAD_COACH',
    Status: 'Active',
    LastLogin: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    UserID: 'USR-0005',
    Email: 'coach.d@volleyball.club',
    FullName: 'Sarah Chen (Coach D)',
    Role: 'ASSISTANT_COACH',
    Status: 'Active',
    LastLogin: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    UserID: 'USR-0006',
    Email: 'ekra88@gmail.com',
    FullName: 'System SuperAdmin',
    Role: 'ADMIN',
    Status: 'Active',
    LastLogin: new Date().toISOString()
  }
];

export const INITIAL_TRAINING_SESSIONS: TrainingSession[] = [
  {
    SessionID: 'SESSION-2026-0001',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    StartTime: '18:00',
    EndTime: '19:30',
    Location: 'Main Court A',
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    CreatedAt: '2026-08-25T17:55:00.000Z'
  },
  {
    SessionID: 'SESSION-2026-0002',
    TeamID: 'T003',
    TeamName: 'Girls 2014',
    TrainingDate: '2026-08-26',
    StartTime: '17:30',
    EndTime: '19:00',
    Location: 'Court B',
    CoachID: 'COACH-0002',
    CoachName: 'Marco Rossi',
    CreatedAt: '2026-08-26T17:25:00.000Z'
  }
];

export const INITIAL_ATTENDANCE_RECORDS: Attendance[] = [
  // Session 1: Girls 2015
  {
    AttendanceID: 'ATT-00001',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0001',
    PlayerName: 'Sophia Martinez',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    Status: 'PRESENT',
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    Timestamp: '2026-08-25T18:05:00.000Z'
  },
  {
    AttendanceID: 'ATT-00002',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0002',
    PlayerName: 'Emma Johnson',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    Status: 'LATE',
    ArrivalTime: '18:17',
    LateMinutes: 17,
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    Notes: 'Traffic delay on 5th Ave',
    Timestamp: '2026-08-25T18:18:00.000Z'
  },
  {
    AttendanceID: 'ATT-00003',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0003',
    PlayerName: 'Olivia Davis',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    Status: 'PRESENT',
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    Timestamp: '2026-08-25T18:05:00.000Z'
  },
  {
    AttendanceID: 'ATT-00004',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0004',
    PlayerName: 'Ava Wilson',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    Status: 'EXCUSED',
    ExcuseType: 'School',
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    Notes: 'School science fair presentation',
    Timestamp: '2026-08-25T18:05:00.000Z'
  },
  {
    AttendanceID: 'ATT-00005',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0005',
    PlayerName: 'Isabella Taylor',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    Status: 'EXCUSED',
    ExcuseType: 'Injury',
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    Notes: 'Doctor rest order for ankle',
    Timestamp: '2026-08-25T18:05:00.000Z'
  },
  {
    AttendanceID: 'ATT-00006',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0006',
    PlayerName: 'Mia Anderson',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    Status: 'ABSENT',
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    Notes: 'No prior notification provided',
    Timestamp: '2026-08-25T18:05:00.000Z'
  },
  {
    AttendanceID: 'ATT-00007',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0007',
    PlayerName: 'Harper Thomas',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    Status: 'PRESENT',
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    Timestamp: '2026-08-25T18:05:00.000Z'
  },
  {
    AttendanceID: 'ATT-00008',
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0008',
    PlayerName: 'Evelyn White',
    TeamID: 'T001',
    TeamName: 'Girls 2015',
    TrainingDate: '2026-08-25',
    Status: 'PRESENT',
    CoachID: 'COACH-0001',
    CoachName: 'Elena Rostova',
    Timestamp: '2026-08-25T18:05:00.000Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    LogID: 'LOG-00001',
    UserEmail: 'admin@volleyball.club',
    UserRole: 'ADMIN',
    Action: 'SYSTEM_INIT',
    EntityType: 'SYSTEM',
    EntityID: 'DB_INIT',
    Details: JSON.stringify({ message: 'Database initialized with 8 sheets, validation schema, and seed records.' }),
    Timestamp: new Date().toISOString()
  }
];
