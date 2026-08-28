import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  RefreshCw, 
  Eye, 
  X, 
  Download, 
  Calendar, 
  Phone, 
  Award, 
  Building2, 
  User,
  SlidersHorizontal,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { NormalizedPlayer } from '../../types/database';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';
import { PlayerAttendanceProfileModal } from '../players/PlayerAttendanceProfileModal';

export const PlayersView: React.FC = () => {
  const { t, language, isRtl, currentUser } = useApp();
  const [players, setPlayers] = useState<NormalizedPlayer[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedBirthYear, setSelectedBirthYear] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inspectingPlayer, setInspectingPlayer] = useState<NormalizedPlayer | null>(null);
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null);

  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Players
      const res = await fetch('/api/master/players');
      const data = await res.json();
      if (data.success && data.players) {
        setPlayers(data.players);
      }

      // 2. Fetch Overview Teams
      const overRes = await fetch('/api/database/overview');
      const overData = await overRes.json();
      if (overData.success && overData.distinctTeams) {
        setTeams(overData.distinctTeams);
      }
    } catch (err) {
      console.error('Failed to load master players in Admin View:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Compute distinct birth years from players
  const availableBirthYears = useMemo(() => {
    const years = new Set<string>();
    players.forEach(p => {
      if (p.teamBirthYear) years.add(String(p.teamBirthYear).trim());
      if (p.birthYear) years.add(String(p.birthYear).trim());
    });
    return Array.from(years).filter(Boolean).sort();
  }, [players]);

  // Compute distinct genders from players
  const availableGenders = useMemo(() => {
    const genders = new Set<string>();
    players.forEach(p => {
      if (p.gender) genders.add(p.gender.trim());
    });
    return Array.from(genders).filter(Boolean).sort();
  }, [players]);

  // Multi-criteria Filtering
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      // 0. Club Filter (المؤسسة vs راية)
      if (selectedClub !== 'ALL') {
        const normClub = selectedClub.replace(/\u0640/g, '').trim();
        const playerClub = (p.club || '').replace(/\u0640/g, '').trim();
        if (!playerClub.includes(normClub)) return false;
      }

      // 1. Team Filter
      if (selectedTeam !== 'ALL' && p.teamName !== selectedTeam) {
        return false;
      }

      // 2. Birth Year Filter
      if (selectedBirthYear !== 'ALL') {
        const matchesTeamBirth = String(p.teamBirthYear).trim() === selectedBirthYear;
        const matchesBirth = String(p.birthYear).trim() === selectedBirthYear;
        if (!matchesTeamBirth && !matchesBirth) return false;
      }

      // 3. Gender Filter
      if (selectedGender !== 'ALL') {
        if (p.gender.trim() !== selectedGender.trim()) return false;
      }

      // 4. Search Query (Player ID, Full Name, Short Name, Phone, Club)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = p.playerId.toLowerCase().includes(q);
        const nameMatch = p.fullName.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q);
        const phoneMatch = p.phone.includes(q);
        const clubMatch = p.club.toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !phoneMatch && !clubMatch) {
          return false;
        }
      }

      return true;
    });
  }, [players, selectedClub, selectedTeam, selectedBirthYear, selectedGender, searchQuery]);

  // Export filtered list to CSV
  const handleExportCSV = () => {
    if (filteredPlayers.length === 0) return;
    const headers = ['Player ID', 'الفريق', 'مواليد الفريق', 'النوع', 'اسم اللاعب رباعي', 'الاسم', 'رقم التليفون', 'تاريخ الميلاد', 'النادي', 'مواليد', 'Rank'];
    const rows = filteredPlayers.map(p => [
      p.playerId,
      p.teamName,
      p.teamBirthYear,
      p.gender,
      p.fullName,
      p.shortName,
      p.phone,
      p.dateOfBirth,
      p.club,
      p.birthYear,
      p.rank
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Players_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner with Master Authority Seal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0 border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 rounded-md tracking-wider">
                {language === 'ar' ? 'قاعدة البيانات الرئيسية' : 'MASTER DATABASE'}
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'سجل اللاعبين المعتمد (إدارة المشرف العام)' : 'Official Master Player Registry (Admin View)'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar' 
                ? 'استعراض وبحث وفلترة قاعدة البيانات الرسمية مع الحفاظ التام على أصول البيانات والهيدرات العربية.'
                : 'Direct query & multi-parameter filtering of official master records with intact Arabic headers.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filteredPlayers.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={fetchMasterData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{language === 'ar' ? 'تحديث السجل' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
          <span>{language === 'ar' ? 'أدوات البحث والفلترة المتقدمة' : 'Advanced Search & Multi-Filter'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'ابحث بالكود أو الاسم...' : 'Search by ID or Name...'}
              className={`w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition ${
                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          {/* Club Filter */}
          <div>
            <select
              value={selectedClub}
              onChange={e => setSelectedClub(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">🏛️ {language === 'ar' ? 'جميع الأندية' : 'All Clubs'}</option>
              <option value="المؤسسة">🏢 {language === 'ar' ? 'نادى المؤسسة' : 'Al-Moassasa Club'}</option>
              <option value="راية">⚡ {language === 'ar' ? 'نادى راية' : 'Raya Club'}</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">🏐 {language === 'ar' ? 'جميع الفرق' : 'All Teams'}</option>
              {teams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Birth Year Filter */}
          <div>
            <select
              value={selectedBirthYear}
              onChange={e => setSelectedBirthYear(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">📅 {language === 'ar' ? 'جميع المواليد' : 'All Birth Years'} ({availableBirthYears.length})</option>
              {availableBirthYears.map(yr => (
                <option key={yr} value={yr}>
                  {language === 'ar' ? `مواليد ${yr}` : `Year ${yr}`}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={selectedGender}
              onChange={e => setSelectedGender(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">👥 {language === 'ar' ? 'جميع الأنواع' : 'All Genders'}</option>
              {availableGenders.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">{filteredPlayers.length}</span>
            <span>{language === 'ar' ? 'لاعب مطابق لشروط البحث' : 'matching players found'}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{language === 'ar' ? `إجمالي السجل: ${players.length}` : `Total Master: ${players.length}`}</span>
          </div>

          {(selectedClub !== 'ALL' || selectedTeam !== 'ALL' || selectedBirthYear !== 'ALL' || selectedGender !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedClub('ALL');
                setSelectedTeam('ALL');
                setSelectedBirthYear('ALL');
                setSelectedGender('ALL');
                setSearchQuery('');
              }}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
            </button>
          )}
        </div>
      </div>

      {/* Players Data Table */}
      {isLoading ? (
        <LoadingState type="skeleton" rows={6} />
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {language === 'ar' ? 'لم يتم العثور على لاعبين مطابقين' : 'No matching players found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'ar' ? 'جرب تعديل كلمات البحث أو تصفير اختيارات الفلاتر.' : 'Try adjusting your search query or reset filter options.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <th className="px-4 py-3.5 font-mono text-[11px] whitespace-nowrap text-start">{t.colPlayerId}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-start">{t.colFullName}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-start">{t.colTeam}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-start">{t.colGender}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-start">{t.colBirthYear}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-start">{t.colPhone}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-start">{t.colClub}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-start">{t.colRank}</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredPlayers.map(player => (
                  <tr key={player.playerId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {player.playerId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {player.fullName}
                      </div>
                      {player.shortName && player.shortName !== player.fullName && (
                        <span className="text-[11px] text-slate-400">
                          {player.shortName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                        {player.teamName}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        player.gender === 'بنات' || player.gender === 'Female'
                          ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {player.gender}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {player.teamBirthYear || player.birthYear || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap dir-ltr text-start">
                      {player.phone || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {player.club ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          player.club.includes('المؤسسة')
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                          {player.club.includes('المؤسسة') ? '🏢 المؤسسة' : '⚡ راية'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {player.rank ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                          {player.rank}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setProfilePlayerId(player.playerId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 font-bold text-xs transition border border-orange-200/60 dark:border-orange-800/40"
                          title="ملف الحضور الشامل"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'ملف الحضور' : 'Attendance'}</span>
                        </button>
                        <button
                          onClick={() => setInspectingPlayer(player)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{language === 'ar' ? 'الهوية' : 'Identity'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Player Attendance Profile Modal */}
      {profilePlayerId && (
        <PlayerAttendanceProfileModal
          playerId={profilePlayerId}
          onClose={() => setProfilePlayerId(null)}
        />
      )}

      {/* Inspect Player Modal */}
      {inspectingPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-500/20">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    {inspectingPlayer.fullName}
                  </h3>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {inspectingPlayer.playerId}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectingPlayer(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detailed Properties Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">الفريق (Team)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{inspectingPlayer.teamName}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">النوع (Gender)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{inspectingPlayer.gender}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">تاريخ الميلاد (DOB)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{inspectingPlayer.dateOfBirth || '-'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">مواليد الفريق (Birth Year)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{inspectingPlayer.teamBirthYear || inspectingPlayer.birthYear || '-'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">رقم الهاتف (Phone)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 dir-ltr text-start block">{inspectingPlayer.phone || '-'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">التقييم / الرانك (Rank)</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{inspectingPlayer.rank || '-'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 col-span-2">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">النادي (Club)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{inspectingPlayer.club || '-'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === 'ar' 
                  ? 'سجل معتمد وموثق بقاعدة البيانات الرئيسية (Google Sheets Master Database).' 
                  : 'Verified official record in Google Sheets Master Database.'}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingPlayer(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
