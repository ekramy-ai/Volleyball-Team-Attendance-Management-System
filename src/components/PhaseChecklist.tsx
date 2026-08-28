import React from 'react';
import { CheckCircle2, ShieldCheck, Database, Layers, ArrowRight } from 'lucide-react';

export const PhaseChecklist: React.FC = () => {
  const requirements = [
    {
      title: 'Google Sheets 8-Table Database Structure',
      detail: 'PLAYERS, TEAMS, COACHES, COACH_TEAMS, TRAINING_SESSIONS, ATTENDANCE, SYSTEM_USERS, AUDIT_LOG fully mapped.',
      completed: true
    },
    {
      title: 'Automatic Sheet Creation & Schema Generator',
      detail: 'Automated Apps Script (Code.gs) builder with table styling, frozen headers, and column definitions.',
      completed: true
    },
    {
      title: 'Column Headers & Type Specifications',
      detail: 'Strict field typing, primary keys, foreign key relations, and required-field constraints.',
      completed: true
    },
    {
      title: 'Data Validation & Dropdown Rules Engine',
      detail: 'ValidationService enforcing PlayerStatus, CoachRole, AttendanceStatus, and ExcuseType enums.',
      completed: true
    },
    {
      title: 'Unique ID Generation Sequences',
      detail: 'Formatters for PLR-0001, T001, COACH-0001, ASSIGN-0001, SESSION-2026-0001, ATT-00001, LOG-00001.',
      completed: true
    },
    {
      title: 'DatabaseService Architecture & Audit Trail',
      detail: 'Full CRUD operations, relational verification, duplicate protection, and automated tamper-evident audit logging.',
      completed: true
    },
    {
      title: 'Initial Realistic Test Dataset',
      detail: 'Girls 2015, Boys 2015, Girls 2014, Coaches A/B/C/D, Admin Director, active assignments, and 20+ players.',
      completed: true
    },
    {
      title: 'Future Phase Compatibility Guaranteed',
      detail: 'Prepared hooks for Phase 2 Auth/RBAC, Phase 3 Coach Fast Attendance, and Phase 4 Admin Management.',
      completed: true
    }
  ];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
              PHASE 1 COMPLETE
            </span>
            <h3 className="font-bold text-base text-slate-100">
              Database Foundation & Architecture Verification
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            All core database schemas, validation engines, ID sequencing, and seed data structures are verified.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-slate-800 rounded-lg text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 8/8 Deliverables Complete
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 flex items-start gap-3"
          >
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-200">{req.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-normal">{req.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Up Next Preview */}
      <div className="mt-5 p-4 bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-slate-900 rounded-xl border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            Up Next: Phase 2
          </div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">
            Authentication, Role Verification & Security Engine
          </div>
          <div className="text-xs text-slate-400">
            Google account identity resolver, strict TeamID authorization gateway, and permission middlewares.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            Awaiting Approval
          </span>
        </div>
      </div>
    </div>
  );
};
