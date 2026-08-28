import React, { useState } from 'react';
import { ShieldCheck, Cpu, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { IdGenerator } from '../services/idGenerator';
import { ValidationService } from '../services/validationService';

interface ValidationTesterProps {
  existingPlayerIds: string[];
  existingTeamIds: string[];
  existingCoachEmails: string[];
}

export const ValidationTester: React.FC<ValidationTesterProps> = ({
  existingPlayerIds,
  existingTeamIds,
  existingCoachEmails
}) => {
  // ID Generator State
  const [selectedEntity, setSelectedEntity] = useState<string>('PLAYER');
  const [generatedId, setGeneratedId] = useState<string>('');

  // Validation Test State
  const [testType, setTestType] = useState<'PLAYER' | 'COACH' | 'ATTENDANCE'>('PLAYER');
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] } | null>(null);

  // Sample Forms for testing
  const [playerForm, setPlayerForm] = useState({
    FullName: 'Jessica Alba',
    Gender: 'Female',
    DateOfBirth: '2015-06-15',
    BirthYear: 2015,
    TeamID: 'T001',
    ParentName: 'Carlos Alba',
    ParentPhone: '+1 (555) 909-1234',
    PlayerStatus: 'Active'
  });

  const [coachForm, setCoachForm] = useState({
    FullName: 'Robert Vance',
    Email: 'robert.vance@volleyball.club',
    Phone: '+1 (555) 444-2222',
    Role: 'HEAD_COACH'
  });

  const [attendanceForm, setAttendanceForm] = useState({
    SessionID: 'SESSION-2026-0001',
    PlayerID: 'PLR-0001',
    TeamID: 'T001',
    Status: 'LATE',
    ArrivalTime: '18:22',
    StartTime: '18:00',
    ExcuseType: ''
  });

  const handleGenerateId = () => {
    let id = '';
    switch (selectedEntity) {
      case 'PLAYER':
        id = IdGenerator.nextPlayerId(existingPlayerIds);
        break;
      case 'TEAM':
        id = IdGenerator.nextTeamId(existingTeamIds);
        break;
      case 'COACH':
        id = IdGenerator.nextCoachId(['COACH-0001', 'COACH-0002']);
        break;
      case 'SESSION':
        id = IdGenerator.nextSessionId(['SESSION-2026-0001', 'SESSION-2026-0002']);
        break;
      case 'ATTENDANCE':
        id = IdGenerator.nextAttendanceId(['ATT-00001', 'ATT-00008']);
        break;
      case 'ASSIGNMENT':
        id = IdGenerator.nextAssignmentId(['ASSIGN-0001', 'ASSIGN-0004']);
        break;
      case 'LOG':
        id = IdGenerator.nextLogId(['LOG-00001']);
        break;
    }
    setGeneratedId(id);
  };

  const handleRunValidation = () => {
    if (testType === 'PLAYER') {
      const res = ValidationService.validatePlayer(playerForm as any, existingPlayerIds);
      setValidationResult(res);
    } else if (testType === 'COACH') {
      const res = ValidationService.validateCoach(coachForm as any, existingCoachEmails);
      setValidationResult(res);
    } else if (testType === 'ATTENDANCE') {
      const res = ValidationService.validateAttendanceRecord(attendanceForm as any, attendanceForm.StartTime);
      setValidationResult(res);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Unique ID Generator Playground */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Unique ID Generator Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic, zero-collision ID sequences adhering to specs.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Entity Type:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {['PLAYER', 'TEAM', 'COACH', 'SESSION', 'ATTENDANCE', 'ASSIGNMENT', 'LOG'].map(e => (
                <button
                  key={e}
                  onClick={() => {
                    setSelectedEntity(e);
                    setGeneratedId('');
                  }}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition ${
                    selectedEntity === e
                      ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleGenerateId}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-lg shadow-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate Next ID
            </button>

            {generatedId && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg">
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Output:</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-amber-200">
                  {generatedId}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Format Standards:</div>
            <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
              <div>• Player: <span className="text-blue-600 dark:text-blue-400">PLR-0001</span></div>
              <div>• Team: <span className="text-emerald-600 dark:text-emerald-400">T001</span></div>
              <div>• Coach: <span className="text-amber-600 dark:text-amber-400">COACH-0001</span></div>
              <div>• Session: <span className="text-sky-600 dark:text-sky-400">SESSION-2026-0001</span></div>
              <div>• Attendance: <span className="text-rose-600 dark:text-rose-400">ATT-00001</span></div>
              <div>• Audit Log: <span className="text-purple-600 dark:text-purple-400">LOG-00001</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Data Validation Rule Tester */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Live Validation Engine Tester
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify strict business rules and input schemas before database write.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            {(['PLAYER', 'COACH', 'ATTENDANCE'] as const).map(t => (
              <button
                key={t}
                onClick={() => {
                  setTestType(t);
                  setValidationResult(null);
                }}
                className={`py-1 px-3 text-xs font-semibold rounded-lg border transition ${
                  testType === t
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {t} Schema
              </button>
            ))}
          </div>

          {testType === 'PLAYER' && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={playerForm.FullName}
                    onChange={e => setPlayerForm({ ...playerForm, FullName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Player Status</label>
                  <select
                    value={playerForm.PlayerStatus}
                    onChange={e => setPlayerForm({ ...playerForm, PlayerStatus: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Injured">Injured</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Transferred">Transferred</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {testType === 'COACH' && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Coach Email</label>
                  <input
                    type="text"
                    value={coachForm.Email}
                    onChange={e => setCoachForm({ ...coachForm, Email: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Role</label>
                  <select
                    value={coachForm.Role}
                    onChange={e => setCoachForm({ ...coachForm, Role: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="HEAD_COACH">HEAD_COACH</option>
                    <option value="ASSISTANT_COACH">ASSISTANT_COACH</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {testType === 'ATTENDANCE' && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Status</label>
                  <select
                    value={attendanceForm.Status}
                    onChange={e => setAttendanceForm({ ...attendanceForm, Status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="EXCUSED">EXCUSED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Start Time</label>
                  <input
                    type="text"
                    value={attendanceForm.StartTime}
                    onChange={e => setAttendanceForm({ ...attendanceForm, StartTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Arrival Time</label>
                  <input
                    type="text"
                    value={attendanceForm.ArrivalTime}
                    onChange={e => setAttendanceForm({ ...attendanceForm, ArrivalTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <button
              onClick={handleRunValidation}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition"
            >
              Test Validation Rules
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {validationResult && (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {validationResult.isValid ? (
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" /> PASSED — Valid Schema
                  </span>
                ) : (
                  <span className="flex items-center text-rose-600 dark:text-rose-400 gap-1 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-800">
                    <XCircle className="w-4 h-4" /> FAILED ({validationResult.errors.length} errors)
                  </span>
                )}
              </div>
            )}
          </div>

          {validationResult && !validationResult.isValid && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 space-y-1">
              {validationResult.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="font-bold">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
