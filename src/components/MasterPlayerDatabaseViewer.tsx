import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, ShieldCheck, Key, RefreshCw, UserCheck, AlertCircle, Eye, X } from 'lucide-react';
import { NormalizedPlayer } from '../types/database';
import { useApp } from '../context/AppContext';

interface MasterPlayerDatabaseViewerProps {
  onSelectPlayerId?: (playerId: string) => void;
}

export const MasterPlayerDatabaseViewer: React.FC<MasterPlayerDatabaseViewerProps> = ({ onSelectPlayerId }) => {
  const { t, isRtl } = useApp();
  const [players, setPlayers] = useState<NormalizedPlayer[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<NormalizedPlayer | null>(null);

  const fetchMasterPlayers = async () => {
    setIsLoading(true);
    try {
      let url = '/api/master/players';
      if (selectedTeam !== 'ALL') {
        url = `/api/master/players/by-team?teamName=${encodeURIComponent(selectedTeam)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players);
      }
    } catch (err) {
      console.error('Failed to load master players:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/database/overview');
      const data = await res.json();
      if (data.success && data.distinctTeams) {
        setTeams(data.distinctTeams);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchMasterPlayers();
  }, [selectedTeam]);

  // Filter players by search query (Player ID, Name, Phone, Club)
  const filteredPlayers = players.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.playerId.toLowerCase().includes(q) ||
      p.fullName.toLowerCase().includes(q) ||
      p.shortName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.club.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Master Source Security Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs transition-colors">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 rounded-md uppercase tracking-wider">
                {t.masterBannerBadge}
              </span>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {t.masterBannerTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {t.masterBannerDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={fetchMasterPlayers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.reloadMaster}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between transition-colors">
        {/* Dynamic Team Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-orange-500 shrink-0" />
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:outline-hidden"
          >
            <option value="ALL">✨ {t.filterAllTeams} ({teams.length})</option>
            {teams.map(teamName => (
              <option key={teamName} value={teamName}>
                {teamName}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 py-2 focus:ring-2 focus:ring-orange-500/20 focus:outline-hidden ${
              isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold self-end sm:self-center">
          {filteredPlayers.length} {t.searchResultCount}
        </div>
      </div>

      {/* Players Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-start">{t.colPlayerId}</th>
                <th className="px-4 py-3 whitespace-nowrap text-start">{t.colFullName}</th>
                <th className="px-4 py-3 whitespace-nowrap text-start">{t.colTeam}</th>
                <th className="px-4 py-3 whitespace-nowrap text-start">{t.colGender}</th>
                <th className="px-4 py-3 whitespace-nowrap text-start">{t.colPhone}</th>
                <th className="px-4 py-3 whitespace-nowrap text-start">{t.colClub}</th>
                <th className="px-4 py-3 whitespace-nowrap text-start">{t.colBirthYear}</th>
                <th className="px-4 py-3 whitespace-nowrap text-start">{t.colRank}</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
                    {t.noPlayersFound}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(p => (
                  <tr
                    key={p.playerId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                      {p.playerId}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {p.fullName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                        {p.teamName}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {p.gender || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {p.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {p.club || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {p.birthYear || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {p.rank || '—'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPlayer(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                      >
                        <Eye className="w-3 h-3 text-orange-500" />
                        <span>{t.viewDetails}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Master Player Details Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {t.playerModalTitle}
                  </h4>
                  <div className="font-mono text-xs text-orange-600 dark:text-orange-400 font-bold">
                    {selectedPlayer.playerId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t.colFullName}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">{selectedPlayer.fullName}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t.colTeam}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">{selectedPlayer.teamName}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t.colPhone}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedPlayer.phone || '—'}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t.colClub}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedPlayer.club || '—'}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t.dob}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedPlayer.dateOfBirth || '—'}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t.colRank}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedPlayer.rank || '—'}</span>
              </div>
            </div>

            {/* Raw JSON representation matching Master Sheet */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {t.rawJsonData}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {t.arabicHeadersPreserved}
                </span>
              </div>
              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40 leading-relaxed border border-slate-800">
                <code>{JSON.stringify(selectedPlayer.raw, null, 2)}</code>
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
