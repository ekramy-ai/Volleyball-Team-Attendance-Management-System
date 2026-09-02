import fs from 'fs';
import path from 'path';

const playersFilePath = path.resolve(process.cwd(), 'src/data/officialMasterPlayers.json');
const schedulesFilePath = path.resolve(process.cwd(), 'src/data/officialCoachesAndSchedules.json');

// 1. Clean Players JSON
let playersContent = fs.readFileSync(playersFilePath, 'utf8');

const replacements = [
  ['تال\uFFFD\uFFFDا محمد عبد النبى', 'تاليا محمد عبد النبى'],
  ['ادم احمد محمد د\uFFFD\uFFFDمه', 'ادم احمد محمد دغمه'],
  ['\uFFFD\uFFFDنين', 'بنين'],
  ['علي \uFFFD\uFFFDبدالله غالي', 'علي عبدالله غالي'],
  ['\uFFFD\uFFFDرمه عبدالرحمن محمد نصر', 'كرمه عبدالرحمن محمد نصر'],
  ['مريم ح\uFFFD\uFFFDتم حامد قطب', 'مريم حاتم حامد قطب'],
  ['"الفريق": "تح\uFFFD\uFFFD 17"', '"الفريق": "تحت 17"'],
  ['"الفريق": "ت\uFFFD\uFFFDت 15"', '"الفريق": "تحت 15"'],
  ['ملك عصام عبدال\uFFFD\uFFFD حسن', 'ملك عصام عبدالله حسن'],
  ['نا\uFFFD\uFFFDئات', 'ناشئات'],
  ['"تصنيف": "\uFFFD\uFFFD"', '"تصنيف": "ب"'],
  ['ناشئي\uFFFD\uFFFD', 'ناشئين'],
  ['اياد محمد يسري ا\uFFFD\uFFFDراهيم', 'اياد محمد يسري ابراهيم'],
  ['حمزة عمرو أحمد محمد ج\uFFFD\uFFFDال', 'حمزة عمرو أحمد محمد جمال'],
  ['عبد الرحمن علاء محمد إبراهي\uFFFD\uFFFD', 'عبد الرحمن علاء محمد إبراهيم']
];

for (const [from, to] of replacements) {
  playersContent = playersContent.split(from).join(to);
}

fs.writeFileSync(playersFilePath, playersContent, 'utf8');
console.log('✅ Cleaned officialMasterPlayers.json');

// 2. Standardize Sessions in officialCoachesAndSchedules.json to avoid duplicates
let schedulesContent = JSON.parse(fs.readFileSync(schedulesFilePath, 'utf8'));

if (schedulesContent.weeklySessions && Array.isArray(schedulesContent.weeklySessions)) {
  schedulesContent.weeklySessions = schedulesContent.weeklySessions.map((session: any) => {
    let t = session.TeamName ? session.TeamName.trim() : '';
    if (t === 'براعم 2015') {
      t = 'المؤسسة براعم 2015 - بنات';
    } else if (t === 'تحت 13') {
      t = 'المؤسسة تحت 13 سنة - بنات - أ';
    } else if (t === 'المؤسسة & راية ( تجهيزي )') {
      t = 'المؤسسة براعم 2015 - بنات';
    }
    return {
      ...session,
      TeamName: t
    };
  });
}

fs.writeFileSync(schedulesFilePath, JSON.stringify(schedulesContent, null, 2), 'utf8');
console.log('✅ Standardized officialCoachesAndSchedules.json weekly sessions');
