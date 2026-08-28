import React, { useState, useEffect } from 'react';
import {
  Activity,
  Award,
  TrendingUp,
  Users,
  ShieldCheck,
  Clock,
  UserX,
  UserCheck,
  Search,
  ChevronRight,
  ExternalLink,
  Flame,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { PlayerAttendanceProfileModal } from '../players/PlayerAttendanceProfileModal';
import { PlayerProfileListItem } from '../../types/database';

export const CoachPlayerStatsView: React.FC = () => {
  const { currentUser, t, language, selectedTeam, setSelectedTeam } = useApp();
  const [playerProfiles, setPlayerProfiles] = useState<PlayerProfileListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const assignedTeams = currentUser?.authorizedTeams || [];
  const activeTeam = selectedTeam || assignedTeams[0] || '';

  const fetchData = async (team: string, search?: string) => {
    if (!currentUser?.userEmail) return;
    try {
      setLoading(true);
      setError(null);
      const userEmail = currentUser.userEmail;
      let url = `/api/players/profiles?userEmail=${encodeURIComponent(userEmail)}`;
      if (team) url += `&team=${encodeURIComponent(team)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: {
          'x-user-email': userEmail
        }
      });

      const data = await res.json();
      if (data.success && data.players) {
        setPlayerProfiles(data.players);
      } else {
        setError(data.error || 'فشل في تحميل ملفات حضور اللاعبين');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTeam) {
      fetchData(activeTeam, searchQuery);
    }
  }, [activeTeam, searchQuery, currentUser]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {t.navPlayerStats} • {activeTeam || 'كل الفرق المصرح بها'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar'
                ? 'ملفات حضور اللاعبين المعتمدة مع الحساب الدقيق لنسب الحضور، الغياب، التأخير ومسار الالتزام'
                : 'Player Attendance Profiles with calculated Attendance, Absence, and Lateness rates'}
            </p>
          </div>
        </div>

        {/* Team Selector & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {assignedTeams.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{language === 'ar' ? 'الفريق:' : 'Team:'}</span>
              <select
                value={activeTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {assignedTeams.map(tm => (
                  <option key={tm} value={tm}>
                    🏐 {tm}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الكود..."
              className="text-xs py-2 pr-8 pl-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingState type="skeleton" rows={4} />
      ) : playerProfiles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 text-xs">
          لا يوجد لاعبين مسجلين في هذا الفريق أو مطابقين للبحث.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playerProfiles.map(p => {
            const isHighRate = p.attendanceRateValue >= 85;
            const isMedRate = p.attendanceRateValue >= 60 && p.attendanceRateValue < 85;

            return (
              <div
                key={p.playerId}
                onClick={() => setSelectedPlayerId(p.playerId)}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/40 transition-all cursor-pointer space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                      {p.playerName}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 mt-0.5">
                      <span>{p.playerId}</span>
                      <span>•</span>
                      <span>مواليد {p.teamBirthYear}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.disciplineScore !== undefined && (
                      <div
                        className={`px-2.5 py-1 rounded-xl flex items-center gap-1 font-black text-xs border ${
                          p.disciplineScore >= 90
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                            : p.disciplineScore >= 75
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/40'
                            : p.disciplineScore >= 50
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                        }`}
                        title="درجة الانضباط (100 نقطة أساس)"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{p.disciplineScore}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attendance Rate Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">
                      {language === 'ar' ? 'نسبة الحضور المعتمدة' : 'Attendance Rate'}
                    </span>
                    <span
                      className={
                        isHighRate
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isMedRate
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {p.attendanceRate}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isHighRate
                          ? 'bg-emerald-500'
                          : isMedRate
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(p.attendanceRateValue, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Session Counters */}
                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 block text-[10px]">
                      {language === 'ar' ? 'حاضر' : 'Present'}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {p.presentCount}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 block text-[10px]">
                      {language === 'ar' ? 'متأخر' : 'Late'}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {p.lateCount}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 block text-[10px]">
                      {language === 'ar' ? 'غياب' : 'Absent'}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {p.absentCount}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 block text-[10px]">
                      {language === 'ar' ? 'إجمالي' : 'Total'}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {p.totalSessions}
                    </span>
                  </div>
                </div>

                {/* View Details Action Banner */}
                <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-[-2px] transition-transform">
                  <span>استعراض ملف الحضور الشامل</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Player Attendance Profile Modal */}
      {selectedPlayerId && (
        <PlayerAttendanceProfileModal
          playerId={selectedPlayerId}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </div>
  );
};
