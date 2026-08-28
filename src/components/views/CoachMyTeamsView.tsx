import React, { useState, useEffect } from 'react';
import { Users, Calendar, CalendarDays, Plus, ShieldCheck, RefreshCw, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { TrainingSessionsView } from './TrainingSessionsView';

export const CoachMyTeamsView: React.FC = () => {
  const { currentUser, t, language, selectedTeam, setSelectedTeam } = useApp();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'sessions'>('roster');

  const assignedTeams = currentUser?.authorizedTeams || [];
  const activeTeam = selectedTeam || assignedTeams[0] || '';

  const fetchRoster = async (team: string) => {
    if (!team) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/master/players/by-team?team=${encodeURIComponent(team)}`);
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTeam) {
      fetchRoster(activeTeam);
    }
  }, [activeTeam]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {t.navMyTeams}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar' ? 'الفرق المصرح لك بالوصول لبياناتها وجدولة حصصها التدريبية وفق COACH_TEAMS' : 'Teams authorized for your account with roster & training management'}
            </p>
          </div>
        </div>

        {/* Team Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {assignedTeams.map(tm => (
            <button
              key={tm}
              onClick={() => setSelectedTeam(tm)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTeam === tm
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>🏐</span>
              <span>{tm}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Tabs: Roster vs Training Sessions */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'ar' ? `قائمة اللاعبين (${players.length})` : `Team Roster (${players.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>{language === 'ar' ? 'الحصص التدريبية للفريق' : 'Team Training Sessions'}</span>
        </button>
      </div>

      {activeTab === 'sessions' ? (
        /* Team Sessions Tab */
        <TrainingSessionsView initialTeamFilter={activeTeam} />
      ) : (
        /* Team Players Roster */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {language === 'ar' ? `كشف لاعبي ${activeTeam} (${players.length} لاعب)` : `${activeTeam} Roster (${players.length} Players)`}
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {t.statPrimaryKey}
            </span>
          </div>

          {loading ? (
            <LoadingState type="skeleton" rows={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 text-start">{t.colPlayerId}</th>
                    <th className="py-3 px-4 text-start">{t.colFullName}</th>
                    <th className="py-3 px-4 text-start">{t.colGender}</th>
                    <th className="py-3 px-4 text-start">{t.colPhone}</th>
                    <th className="py-3 px-4 text-start">{t.colClub}</th>
                    <th className="py-3 px-4 text-start">{t.colBirthYear}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {players.map(p => (
                    <tr key={p.playerId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">{p.playerId}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{p.fullName}</td>
                      <td className="py-3.5 px-4">{p.gender}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{p.phone}</td>
                      <td className="py-3.5 px-4">{p.club}</td>
                      <td className="py-3.5 px-4 font-mono">{p.birthYear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

