import { MasterDatabaseService } from '../services/masterDatabaseService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('===============================================================');
console.log('📂 TESTING MANUAL DATABASE MANAGEMENT & IMPORT ENGINE');
console.log('===============================================================');

const adminEmail = 'admin@volleyball.club';

// 1. Single Player Addition
console.log('\n--- 1. MANUAL PLAYER CRUD OPERATIONS ---');
const addResult = MasterDatabaseService.addMasterPlayer(adminEmail, {
  fullName: 'يوسف أحمد علي محمود',
  teamName: 'المؤسسة براعم 2015 - بنين',
  gender: 'بنين',
  phone: '01012345678',
  dob: '2015-05-15',
  club: 'المؤسسة',
  rating: 'أ'
});

assert(addResult.success, 'Successfully added a new player manually');
assert(Boolean(addResult.player && addResult.player['Player ID']), 'Added player has valid Player ID');
const newPlayerId = addResult.player!['Player ID'];

// 2. Player Update
const updateResult = MasterDatabaseService.updateMasterPlayer(adminEmail, newPlayerId, {
  fullName: 'يوسف أحمد علي محمود (محدث)',
  phone: '01099998888'
});
assert(updateResult.success, 'Successfully updated player record');
assert(updateResult.player!['اسم اللاعب رباعي'] === 'يوسف أحمد علي محمود (محدث)', 'Player full name updated');

// 3. Player Bulk Import (MERGE Mode)
console.log('\n--- 2. BULK PLAYER IMPORT (MERGE MODE) ---');
const initialCount = MasterDatabaseService.getAllPlayers().length;
const sampleImport = [
  {
    'اسم اللاعب رباعي': 'فريدة حسن كمال',
    'الفريق': 'راية براعم 2018+ - بنات - أ',
    'النوع': 'بنات',
    'رقم التليفون': '01122334455',
    'تاريخ الميلاد': '2018-03-20',
    'تصنيف': 'أ'
  },
  {
    'اسم اللاعب رباعي': 'جنى سامح مصطفى',
    'الفريق': 'راية براعم 2018+ - بنات - أ',
    'النوع': 'بنات',
    'رقم التليفون': '01233445566',
    'تاريخ الميلاد': '2018-07-10',
    'تصنيف': 'ب'
  }
];

const importResult = MasterDatabaseService.importMasterPlayers(adminEmail, sampleImport, 'MERGE');
assert(importResult.success, 'Bulk merge import succeeded');
assert(importResult.importedCount === 2, 'Imported 2 players in merge mode');
assert(MasterDatabaseService.getAllPlayers().length >= initialCount + 2, 'Database total count increased');

// 4. Player Deletion
console.log('\n--- 3. PLAYER DELETION ---');
const deleteResult = MasterDatabaseService.deleteMasterPlayer(adminEmail, newPlayerId);
assert(deleteResult.success, 'Successfully deleted test player');

// 5. Full Unified Backup & Restore
console.log('\n--- 4. FULL UNIFIED SYSTEM BACKUP & RESTORE ---');
const backup = MasterDatabaseService.exportFullBackup(adminEmail);
assert(Boolean(backup && backup.masterPlayers && backup.coaches), 'Full backup package generated');
assert(backup.counts.players > 0, `Backup contains ${backup.counts.players} players`);
assert(backup.counts.coaches === 13, `Backup contains 13 official coaches`);

const restoreResult = MasterDatabaseService.importFullBackup(adminEmail, backup);
assert(restoreResult.success, 'Full backup restored successfully');
assert(Boolean(restoreResult.counts && restoreResult.counts.players > 0), 'Restored player count confirmed');

console.log('\n===============================================================');
console.log('🎉 ALL MANUAL DATABASE TESTS PASSED SUCCESSFULLY (100%)');
console.log('===============================================================');
