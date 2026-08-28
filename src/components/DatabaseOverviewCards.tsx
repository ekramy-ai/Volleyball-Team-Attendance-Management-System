import React from 'react';
import { Users, UserCheck, Shield, CalendarDays, ClipboardCheck, History, Database, UserCog } from 'lucide-react';

interface StatsProps {
  stats: {
    playersCount: number;
    activePlayersCount: number;
    teamsCount: number;
    coachesCount: number;
    sessionsCount: number;
    attendanceRecordsCount: number;
    usersCount: number;
    auditLogsCount: number;
  };
  activeTable: string;
  onSelectTable: (tableName: string) => void;
}

export const DatabaseOverviewCards: React.FC<StatsProps> = ({ stats, activeTable, onSelectTable }) => {
  const cards = [
    {
      id: 'PLAYERS',
      title: 'PLAYERS',
      count: stats.playersCount,
      subtext: `${stats.activePlayersCount} Active Roster`,
      icon: Users,
      color: 'from-blue-600 to-indigo-700',
      tag: 'Sheet 1',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
    },
    {
      id: 'TEAMS',
      title: 'TEAMS',
      count: stats.teamsCount,
      subtext: 'Divisions & Rosters',
      icon: Database,
      color: 'from-emerald-600 to-teal-700',
      tag: 'Sheet 2',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
    },
    {
      id: 'COACHES',
      title: 'COACHES',
      count: stats.coachesCount,
      subtext: 'Head & Assistant Staff',
      icon: UserCheck,
      color: 'from-amber-600 to-orange-700',
      tag: 'Sheet 3',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
    },
    {
      id: 'COACH_TEAMS',
      title: 'COACH_TEAMS',
      count: 4,
      subtext: 'Security Team Maps',
      icon: Shield,
      color: 'from-purple-600 to-violet-700',
      tag: 'Sheet 4',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
    },
    {
      id: 'TRAINING_SESSIONS',
      title: 'TRAINING_SESSIONS',
      count: stats.sessionsCount,
      subtext: 'Practice Schedules',
      icon: CalendarDays,
      color: 'from-sky-600 to-cyan-700',
      tag: 'Sheet 5',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
    },
    {
      id: 'ATTENDANCE',
      title: 'ATTENDANCE',
      count: stats.attendanceRecordsCount,
      subtext: 'Log & Late Minutes',
      icon: ClipboardCheck,
      color: 'from-rose-600 to-pink-700',
      tag: 'Sheet 6',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
    },
    {
      id: 'SYSTEM_USERS',
      title: 'SYSTEM_USERS',
      count: stats.usersCount,
      subtext: 'Google Auth Identifiers',
      icon: UserCog,
      color: 'from-slate-700 to-slate-900',
      tag: 'Sheet 7',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    },
    {
      id: 'AUDIT_LOG',
      title: 'AUDIT_LOG',
      count: stats.auditLogsCount,
      subtext: 'Audit Trail Records',
      icon: History,
      color: 'from-zinc-700 to-neutral-900',
      tag: 'Sheet 8',
      badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map(c => {
        const Icon = c.icon;
        const isSelected = activeTable === c.id;

        return (
          <button
            key={c.id}
            onClick={() => onSelectTable(c.id)}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
              isSelected
                ? 'bg-white dark:bg-slate-800 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${c.badgeColor}`}>
                {c.tag}
              </span>
              <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`} />
            </div>

            <div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {c.count}
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                {c.title}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {c.subtext}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
