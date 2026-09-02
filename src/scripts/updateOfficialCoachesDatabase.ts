import fs from 'fs';
import path from 'path';

const coachesDataPath = path.resolve(process.cwd(), 'src/data/officialCoachesAndSchedules.json');
const currentData = JSON.parse(fs.readFileSync(coachesDataPath, 'utf8'));

// 1. New Official Coaches List
const officialCoaches = [
  {
    CoachID: 'COACH-0001',
    FullName: 'الكابتن / إكرامي حسن (رئيس الجهاز)',
    Email: 'admin@volleyball.club',
    Phone: '+20 100 000 0001',
    Role: 'ADMIN',
    AccountStatus: 'Active',
    Club: 'المؤسسة & راية',
    CreatedAt: '2026-01-01T08:00:00.000Z'
  },
  {
    CoachID: 'COACH-0002',
    FullName: 'الكابتن / أحمد سالم',
    Email: 'coach.ahmed@volleyball.club',
    Phone: '+20 100 000 0002',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'رايـــــة',
    CreatedAt: '2026-01-05T09:00:00.000Z'
  },
  {
    CoachID: 'COACH-0003',
    FullName: 'الكابتن / محمد مصطفى',
    Email: 'coach.mohamed.mostafa@volleyball.club',
    Phone: '+20 100 000 0003',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'المؤسسة & راية',
    CreatedAt: '2026-01-05T09:30:00.000Z'
  },
  {
    CoachID: 'COACH-0004',
    FullName: 'الكابتن / مصطفى رمضان',
    Email: 'coach.mostafa.ramadan@volleyball.club',
    Phone: '+20 100 000 0004',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'المؤسسة',
    CreatedAt: '2026-01-05T10:00:00.000Z'
  },
  {
    CoachID: 'COACH-0005',
    FullName: 'الكابتن / عمر الجيزاوى',
    Email: 'coach.omar.elgizawy@volleyball.club',
    Phone: '+20 100 000 0005',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'المؤسسة',
    CreatedAt: '2026-01-06T10:00:00.000Z'
  },
  {
    CoachID: 'COACH-0006',
    FullName: 'الكابتن / أسامة كمال',
    Email: 'coach.osama.kamal@volleyball.club',
    Phone: '+20 100 000 0006',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'المؤسسة',
    CreatedAt: '2026-01-06T10:30:00.000Z'
  },
  {
    CoachID: 'COACH-0007',
    FullName: 'الكابتن / سامح مصطفى',
    Email: 'coach.sameh.mostafa@volleyball.club',
    Phone: '+20 100 000 0007',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'المؤسسة & راية',
    CreatedAt: '2026-01-07T11:00:00.000Z'
  },
  {
    CoachID: 'COACH-0008',
    FullName: 'الكابتن / عمرو الهلباوي',
    Email: 'coach.amr.helbawy@volleyball.club',
    Phone: '+20 100 000 0008',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'المؤسسة',
    CreatedAt: '2026-01-07T11:30:00.000Z'
  },
  {
    CoachID: 'COACH-0009',
    FullName: 'الكابتن / هايدى فؤاد',
    Email: 'coach.haidy.fouad@volleyball.club',
    Phone: '+20 100 000 0009',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'رايـــــة',
    CreatedAt: '2026-01-08T12:00:00.000Z'
  },
  {
    CoachID: 'COACH-0010',
    FullName: 'الكابتن / مى سمير',
    Email: 'coach.mai.samir@volleyball.club',
    Phone: '+20 100 000 0010',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'رايـــــة',
    CreatedAt: '2026-01-08T12:30:00.000Z'
  },
  {
    CoachID: 'COACH-0011',
    FullName: 'الكابتن / عنان عاطف',
    Email: 'coach.enan@volleyball.club',
    Phone: '+20 100 000 0011',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'رايـــــة',
    CreatedAt: '2026-01-09T09:00:00.000Z'
  },
  {
    CoachID: 'COACH-0012',
    FullName: 'الكابتن / أحمد هشام',
    Email: 'coach.ahmed.hesham@volleyball.club',
    Phone: '+20 100 000 0012',
    Role: 'HEAD_COACH',
    AccountStatus: 'Active',
    Club: 'رايـــــة',
    CreatedAt: '2026-01-09T09:30:00.000Z'
  },
  {
    CoachID: 'COACH-0013',
    FullName: 'الكابتن / أية الكريوني',
    Email: 'coach.aya@volleyball.club',
    Phone: '+20 100 000 0013',
    Role: 'ASSISTANT_COACH',
    AccountStatus: 'Active',
    Club: 'رايـــــة',
    CreatedAt: '2026-01-10T10:00:00.000Z'
  }
];

// 2. Exact 20 Team Assignments
const officialAssignmentsDef = [
  { team: 'راية براعم 2018+ - بنات - أ', coachName: 'الكابتن / هايدى فؤاد', email: 'coach.haidy.fouad@volleyball.club', club: 'راية' },
  { team: 'راية براعم 2018+ - بنات - ب', coachName: 'الكابتن / مى سمير', email: 'coach.mai.samir@volleyball.club', club: 'راية' },
  { team: 'راية براعم 2017 - بنات - أ', coachName: 'الكابتن / أحمد سالم', email: 'coach.ahmed@volleyball.club', club: 'راية' },
  { team: 'راية براعم 2017 - بنات - ب', coachName: 'الكابتن / عنان عاطف', email: 'coach.enan@volleyball.club', club: 'راية' },
  { team: 'راية براعم 2016 - بنات - أ', coachName: 'الكابتن / محمد مصطفى', email: 'coach.mohamed.mostafa@volleyball.club', club: 'راية' },
  { team: 'المؤسسة براعم 2015 - بنين', coachName: 'الكابتن / مصطفى رمضان', email: 'coach.mostafa.ramadan@volleyball.club', club: 'المؤسسة' },
  { team: 'المؤسسة براعم 2015 - بنات', coachName: 'الكابتن / محمد مصطفى', email: 'coach.mohamed.mostafa@volleyball.club', club: 'المؤسسة' },
  { team: 'راية براعم 2015 - بنات - أ', coachName: 'الكابتن / أحمد سالم', email: 'coach.ahmed@volleyball.club', club: 'راية' },
  { team: 'راية براعم 2015&2016 - بنات - ب', coachName: 'الكابتن / محمد مصطفى', email: 'coach.mohamed.mostafa@volleyball.club', club: 'راية' },
  { team: 'المؤسسة تحت 13 سنة - بنين - أ', coachName: 'الكابتن / أسامة كمال', email: 'coach.osama.kamal@volleyball.club', club: 'المؤسسة' },
  { team: 'المؤسسة تحت 13 سنة - بنات - أ', coachName: 'الكابتن / عمرو الهلباوي', email: 'coach.amr.helbawy@volleyball.club', club: 'المؤسسة' },
  { team: 'المؤسسة تحت 13 سنة - بنات - ب', coachName: 'الكابتن / أسامة كمال', email: 'coach.osama.kamal@volleyball.club', club: 'المؤسسة' },
  { team: 'راية تحت 13 سنة - بنات - أ', coachName: 'الكابتن / سامح مصطفى', email: 'coach.sameh.mostafa@volleyball.club', club: 'راية' },
  { team: 'المؤسسة تحت 15 سنة - بنين - أ', coachName: 'الكابتن / عمر الجيزاوى', email: 'coach.omar.elgizawy@volleyball.club', club: 'المؤسسة' },
  { team: 'المؤسسة تحت 15 سنة - بنات - أ', coachName: 'الكابتن / عمرو الهلباوي', email: 'coach.amr.helbawy@volleyball.club', club: 'المؤسسة' },
  { team: 'المؤسسة تحت 15 سنة - بنات - ب', coachName: 'الكابتن / عمر الجيزاوى', email: 'coach.omar.elgizawy@volleyball.club', club: 'المؤسسة' },
  { team: 'المؤسسة تحت 15 سنة - بنات - ج', coachName: 'الكابتن / سامح مصطفى', email: 'coach.sameh.mostafa@volleyball.club', club: 'المؤسسة' },
  { team: 'المؤسسة تحت 17 سنة - بنات - أ', coachName: 'الكابتن / مصطفى رمضان', email: 'coach.mostafa.ramadan@volleyball.club', club: 'المؤسسة' },
  { team: 'المؤسسة تحت 17 سنة - بنات - ب', coachName: 'الكابتن / عمر الجيزاوى', email: 'coach.omar.elgizawy@volleyball.club', club: 'المؤسسة' },
  { team: 'راية تحت 19 سنة - بنات - أ', coachName: 'الكابتن / أحمد هشام', email: 'coach.ahmed.hesham@volleyball.club', club: 'راية' }
];

const coachMap = new Map(officialCoaches.map(c => [c.Email, c]));

const assignments = officialAssignmentsDef.map((def, idx) => {
  const coach = coachMap.get(def.email)!;
  return {
    AssignmentID: `ASSIGN-${String(idx + 1).padStart(4, '0')}`,
    CoachID: coach.CoachID,
    CoachName: coach.FullName,
    CoachEmail: coach.Email,
    TeamName: def.team,
    Club: def.club,
    PermissionLevel: 'FULL_MANAGE',
    Active: true,
    CreatedAt: '2026-01-15T09:00:00.000Z'
  };
});

// 3. Update Weekly Sessions to match assigned coaches
const teamToCoachMap = new Map(officialAssignmentsDef.map(def => [def.team, def]));

const updatedSessions = (currentData.weeklySessions || []).map((s: any, idx: number) => {
  const assigned = teamToCoachMap.get(s.TeamName);
  if (assigned) {
    const coach = coachMap.get(assigned.email);
    return {
      ...s,
      CoachID: coach ? coach.CoachID : s.CoachID,
      CoachName: coach ? coach.FullName : s.CoachName
    };
  }
  return s;
});

currentData.coaches = officialCoaches;
currentData.assignments = assignments;
currentData.weeklySessions = updatedSessions;

fs.writeFileSync(coachesDataPath, JSON.stringify(currentData, null, 2), 'utf8');
console.log('✅ Updated officialCoachesAndSchedules.json with official coaches and 20 team assignments.');
