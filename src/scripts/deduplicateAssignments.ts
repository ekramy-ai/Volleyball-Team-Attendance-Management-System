import fs from 'fs';
import path from 'path';

const schedulesFilePath = path.resolve(process.cwd(), 'src/data/officialCoachesAndSchedules.json');
const schedules = JSON.parse(fs.readFileSync(schedulesFilePath, 'utf8'));

// Deduplicate assignments by (CoachID + TeamName)
const uniqueAssignments: any[] = [];
const seenKeys = new Set<string>();

for (const a of schedules.assignments) {
  const normTeam = a.TeamName.trim().replace(/\s+/g, ' ');
  const key = `${a.CoachID} | ${normTeam}`;
  if (!seenKeys.has(key)) {
    seenKeys.add(key);
    uniqueAssignments.push({
      ...a,
      TeamName: normTeam
    });
  }
}

console.log(`Original assignments: ${schedules.assignments.length} -> Unique assignments: ${uniqueAssignments.length}`);
schedules.assignments = uniqueAssignments;

fs.writeFileSync(schedulesFilePath, JSON.stringify(schedules, null, 2), 'utf8');
console.log('✅ Cleaned and deduplicated assignments in officialCoachesAndSchedules.json');
