import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  Award,
  AlertTriangle,
  FileText,
  Phone,
  Hash,
  Sparkles,
  ChevronRight,
  BarChart3,
  Flame,
  Info,
  Medal,
  Sliders
} from 'lucide-react';
import { PlayerAttendanceProfile } from '../../types/database';
import { useApp } from '../../context/AppContext';
import { LoadingState } from '../common/LoadingState';

interface PlayerAttendanceProfileModalProps {
  playerId: string | null;
  onClose: () => void;
}

export const PlayerAttendanceProfileModal: React.FC<PlayerAttendanceProfileModalProps> = ({
  playerId,
  onClose
}) => {
  const { currentUser, language, isRtl } = useApp();
  const [profile, setProfile] = useState<PlayerAttendanceProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'discipline' | 'history' | 'trend' | 'absence_late'>('overview');

  useEffect(() => {
    if (!playerId) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userEmail = currentUser?.userEmail || 'admin@volleyball.club';
        const res = await fetch(`/api/players/profile/${encodeURIComponent(playerId)}`, {
          headers: {
            'x-user-email': userEmail
          }
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'فشل في استرجاع ملف حضور اللاعب');
        } else {
          setProfile(data.profile);
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ في الاتصال بالخادم');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [playerId, currentUser]);

  if (!playerId) return null;

  const getDisciplineTierColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400';
    if (score >= 75) return 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-400';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400';
    return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400';
  };

  const getDisciplineTierProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-sky-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div
      id="player-attendance-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-orange-50/50 via-transparent to-purple-50/30 dark:from-orange-950/20 dark:to-purple-950/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-orange-500/20">
              {profile?.playerName?.charAt(0) || <User className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {profile ? profile.playerName : 'ملف حضور اللاعب'}
                </h2>
                {profile && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {profile.playerId}
                  </span>
                )}
                {profile?.disciplineDetails && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${getDisciplineTierColor(profile.disciplineDetails.finalScore)}`}>
                    <Award className="w-3.5 h-3.5" />
                    <span>الانضباط: {profile.disciplineDetails.finalScore} / 100</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-medium">
                {profile && (
                  <>
                    <span className="flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400">
                      🏐 {profile.currentTeam}
                    </span>
                    <span>•</span>
                    <span>مواليد: {profile.teamBirthYear}</span>
                    {profile.jerseyNumber && (
                      <>
                        <span>•</span>
                        <span>رقم الفانلة: #{profile.jerseyNumber}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            id="close-player-profile-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16">
              <LoadingState message="جاري احتساب وتوليد ملف حضور اللاعب..." />
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">خطأ في استعراض ملف اللاعب</h4>
                <p className="text-xs mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          ) : profile ? (
            <>
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>نظرة عامة وإحصائيات</span>
                </button>
                <button
                  onClick={() => setActiveTab('discipline')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                    activeTab === 'discipline'
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>درجة الانضباط ({profile.disciplineDetails?.finalScore ?? 100} نقطة)</span>
                </button>
                <button
                  onClick={() => setActiveTab('trend')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                    activeTab === 'trend'
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>مسار الالتزام ({profile.attendanceTrend.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('absence_late')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                    activeTab === 'absence_late'
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>سجل الغياب والتأخير</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                    activeTab === 'history'
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>السجل الزمني الكامل ({profile.recentHistory.length})</span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW & RATES */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Rates Triad + Discipline Score Hero Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Discipline Score Hero */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800/40 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                          درجة الانضباط
                        </span>
                        <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="text-3xl font-black text-indigo-950 dark:text-indigo-100 mt-2 flex items-baseline gap-1.5">
                        <span>{profile.disciplineDetails?.finalScore ?? 100}</span>
                        <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400">/ 100 نقطة</span>
                      </div>
                      <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-1 font-semibold truncate">
                        {profile.disciplineDetails?.tierLabelAr || 'ممتاز - التزام عالي'}
                      </p>
                      <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/40 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getDisciplineTierProgressColor(profile.disciplineDetails?.finalScore ?? 100)}`}
                          style={{ width: `${Math.min(profile.disciplineDetails?.finalScore ?? 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Attendance Rate */}
                    <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          نسبة الحضور المعتمدة
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-2">
                        {profile.attendanceRate}
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                        (حاضر {profile.presentCount} + متأخر {profile.lateCount}) من {profile.totalSessions} حصة
                      </p>
                      <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/40 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(profile.attendanceRateValue, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* 3. Absence Rate */}
                    <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                          نسبة الغياب
                        </span>
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="text-3xl font-black text-rose-900 dark:text-rose-100 mt-2">
                        {profile.absenceRate}
                      </div>
                      <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1">
                        (غائب {profile.absentCount} بدون إذن)
                      </p>
                      <div className="w-full bg-rose-200/60 dark:bg-rose-900/40 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(profile.absenceRateValue, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* 4. Late Rate */}
                    <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          نسبة التأخير
                        </span>
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-2">
                        {profile.lateRate}
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                        ({profile.lateCount} حصة متأخرة) • {profile.totalLateMinutes} د
                      </p>
                      <div className="w-full bg-amber-200/60 dark:bg-amber-900/40 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(profile.lateRateValue, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Statistics Breakdown Grid */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                      📊 الحصيلة الرقمية التفصيلية للحصص التدريبية
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                        <div className="text-xs text-slate-500">إجمالي الحصص</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                          {profile.totalSessions}
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 shadow-2xs">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">حاضر في الموعد</div>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                          {profile.presentCount}
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/60 dark:border-amber-900/30 shadow-2xs">
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">متأخر</div>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                          {profile.lateCount}
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/60 dark:border-rose-900/30 shadow-2xs">
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-bold">غائب بدون إذن</div>
                        <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                          {profile.absentCount}
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-sky-200/60 dark:border-sky-900/30 shadow-2xs">
                        <div className="text-xs text-sky-600 dark:text-sky-400 font-bold">إذن مسبق</div>
                        <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">
                          {profile.excusedCount}
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200/60 dark:border-purple-900/30 shadow-2xs">
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-bold">دقائق التأخير</div>
                        <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                          {profile.totalLateMinutes} د
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Player Identity Information */}
                  <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                      🪪 بيانات هوية اللاعب (قاعدة بيانات النادي الرئيسية)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">الاسم الرباعي المعتمد:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{profile.playerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">الرقم الكودي (PlayerID):</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{profile.playerId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">الفريق المسجل به:</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{profile.currentTeam}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">مواليد الفريق:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{profile.teamBirthYear}</span>
                      </div>
                      {profile.birthDate && (
                        <div>
                          <span className="text-slate-400 block mb-0.5">تاريخ الميلاد:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{profile.birthDate}</span>
                        </div>
                      )}
                      {profile.parentPhone && (
                        <div>
                          <span className="text-slate-400 block mb-0.5">تليفون ولي الأمر:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 dir-ltr">{profile.parentPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DISCIPLINE SCORE BREAKDOWN (PHASE 11) */}
              {activeTab === 'discipline' && profile.disciplineDetails && (
                <div className="space-y-6">
                  {/* Discipline Score Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                      <div className="space-y-2 text-center md:text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/20">
                          <Award className="w-3.5 h-3.5 text-amber-300" />
                          <span>نظام تقييم الانضباط الرياضي (100 نقطة أساس)</span>
                        </span>
                        <h3 className="text-2xl font-black text-white">
                          درجة انضباط اللاعب: {profile.playerName}
                        </h3>
                        <p className="text-xs text-indigo-200 max-w-xl">
                          يتم احتساب درجة الانضباط آلياً بالخصم من رصيد الـ 100 نقطة الأساسي بناءً على سجل الغياب والتأخير المسجل في النظام وإعدادات الخصم المعتمدة من الإدارة.
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 min-w-[170px] text-center shadow-lg">
                        <span className="text-xs font-bold text-indigo-200">الدرجة النهائية</span>
                        <div className="text-5xl font-black text-amber-300 my-1">
                          {profile.disciplineDetails.finalScore}
                        </div>
                        <span className="text-xs font-bold text-white/90 px-2.5 py-0.5 rounded-full bg-white/20 mt-1">
                          {profile.disciplineDetails.tierLabelAr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Breakdown Table */}
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-orange-500" />
                        <span>تفاصيل الخصومات المطبقة على اللاعب</span>
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        الرصيد الأساسي: 100 نقطة
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                            <th className="p-3 font-bold">بند المخالفة</th>
                            <th className="p-3 font-bold text-center">العدد المسجل</th>
                            <th className="p-3 font-bold text-center">معدل الخصم للحالة</th>
                            <th className="p-3 font-bold text-center">إجمالي الخصم</th>
                            <th className="p-3 font-bold text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          <tr>
                            <td className="p-3 font-bold flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                              <span>غياب بدون إذن (Absent)</span>
                            </td>
                            <td className="p-3 text-center font-bold text-rose-600 dark:text-rose-400">
                              {profile.disciplineDetails.penaltiesApplied.unexcusedAbsences} مرات
                            </td>
                            <td className="p-3 text-center font-mono">
                              -{profile.disciplineDetails.penaltiesApplied.unexcusedPenaltyRate} نقطة
                            </td>
                            <td className="p-3 text-center font-black text-rose-600 dark:text-rose-400">
                              -{profile.disciplineDetails.unexcusedDeduction} نقطة
                            </td>
                            <td className="p-3 text-center">
                              {profile.disciplineDetails.unexcusedDeduction > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                                  مخصوم
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                              <span>غياب بإذن مسبق (Excused)</span>
                            </td>
                            <td className="p-3 text-center font-bold text-sky-600 dark:text-sky-400">
                              {profile.disciplineDetails.penaltiesApplied.excusedAbsences} مرات
                            </td>
                            <td className="p-3 text-center font-mono">
                              -{profile.disciplineDetails.penaltiesApplied.excusedPenaltyRate} نقطة
                            </td>
                            <td className="p-3 text-center font-black text-sky-600 dark:text-sky-400">
                              -{profile.disciplineDetails.excusedDeduction} نقطة
                            </td>
                            <td className="p-3 text-center">
                              {profile.disciplineDetails.excusedDeduction > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300">
                                  مخصوم
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              <span>حضور متأخر عن الموعد (Late)</span>
                            </td>
                            <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                              {profile.disciplineDetails.penaltiesApplied.lateSessions} مرات
                            </td>
                            <td className="p-3 text-center font-mono">
                              -{profile.disciplineDetails.penaltiesApplied.latePenaltyRate} نقطة
                            </td>
                            <td className="p-3 text-center font-black text-amber-600 dark:text-amber-400">
                              -{profile.disciplineDetails.lateDeduction} نقطة
                            </td>
                            <td className="p-3 text-center">
                              {profile.disciplineDetails.lateDeduction > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                                  مخصوم
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                            <td className="p-3" colSpan={3}>إجمالي الخصومات المطبقة</td>
                            <td className="p-3 text-center text-sm font-black text-rose-600 dark:text-rose-400">
                              -{profile.disciplineDetails.totalDeductions} نقطة
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                الصافي: {profile.disciplineDetails.finalScore}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        معادلة الحساب: <strong>درجة الانضباط = max(0, 100 - إجمالي الخصومات)</strong>. الدرجة لا تنخفض أبداً تحت الصفر. يتم تحديث الخصومات فورياً عند تسجيل أي غياب أو تأخير.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE TREND */}
              {activeTab === 'trend' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span>مسار التزام اللاعب عبر الحصص التدريبية المتعاقبة</span>
                    </h3>
                    <span className="text-xs text-slate-500">{profile.attendanceTrend.length} حصة مسجلة</span>
                  </div>

                  {profile.attendanceTrend.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      لا توجد حصص مسجلة لهذا اللاعب حتى الآن.
                    </div>
                  ) : (
                    <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-4 my-2">
                      {profile.attendanceTrend.map((pt, idx) => {
                        const isPresent = pt.status === 'PRESENT';
                        const isLate = pt.status === 'LATE';
                        const isAbsent = pt.status === 'ABSENT';
                        const isExcused = pt.status === 'EXCUSED';

                        return (
                          <div key={idx} className="relative flex items-start gap-4">
                            {/* Dot indicator */}
                            <div
                              className={`absolute -left-[31px] sm:-left-[39px] w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-bold ${
                                isPresent
                                  ? 'bg-emerald-500'
                                  : isLate
                                  ? 'bg-amber-500'
                                  : isAbsent
                                  ? 'bg-rose-500'
                                  : 'bg-sky-500'
                              }`}
                            >
                              {idx + 1}
                            </div>

                            <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                    {pt.date}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {pt.sessionId}
                                  </span>
                                </div>
                                {pt.notes && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                    "{pt.notes}"
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                {isLate && (
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                    تأخير {pt.lateMinutes} د
                                  </span>
                                )}
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                                    isPresent
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                      : isLate
                                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                      : isAbsent
                                      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                                      : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                                  }`}
                                >
                                  {isPresent
                                    ? 'حاضر في الموعد'
                                    : isLate
                                    ? 'متأخر'
                                    : isAbsent
                                    ? 'غائب بدون إذن'
                                    : 'إذن مسبق'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ABSENCE & LATENESS SUMMARIES */}
              {activeTab === 'absence_late' && (
                <div className="space-y-6">
                  {/* Absence Summary Card */}
                  <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>ملخص الغياب وحالات الأعذار</span>
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                        إجمالي الغياب: {profile.absenceSummary.totalAbsences}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/30">
                        <div className="text-slate-500">غياب بدون عذر</div>
                        <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                          {profile.absenceSummary.unexcusedAbsences}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-sky-100 dark:border-sky-900/30">
                        <div className="text-slate-500">غياب بإذن مسبق</div>
                        <div className="text-lg font-black text-sky-600 dark:text-sky-400 mt-0.5">
                          {profile.absenceSummary.excusedAbsences}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                        <div className="text-slate-500">آخر تاريخ غياب</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {profile.absenceSummary.latestAbsenceDate || 'لا يوجد'}
                        </div>
                      </div>
                    </div>

                    {profile.absenceSummary.excuseBreakdown.length > 0 && (
                      <div className="pt-2">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                          تصنيف الأسباب والملاحظات المسجلة:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.absenceSummary.excuseBreakdown.map((ex, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                            >
                              <span>{ex.reason}</span>
                              <span className="px-1.5 py-0.2 bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-md font-bold text-[10px]">
                                {ex.count}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lateness Summary Card */}
                  <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>ملخص حالات التأخير ودقائق التأخير</span>
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                        {profile.latenessSummary.totalLateSessions} حصص متأخرة
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <div className="text-slate-500">إجمالي دقائق التأخير</div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          {profile.latenessSummary.totalLateMinutes} دقيقة
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <div className="text-slate-500">متوسط التأخير</div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          {profile.latenessSummary.averageLateMinutes} دقيقة
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <div className="text-slate-500">أقصى تأخير في حصة</div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          {profile.latenessSummary.maxLateMinutes} دقيقة
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-slate-500">آخر تاريخ تأخير</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {profile.latenessSummary.latestLateDate || 'لا يوجد'}
                        </div>
                      </div>
                    </div>

                    {profile.latenessSummary.latenessList.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          قائمة الحصص المتأخرة المسجلة:
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/60 dark:border-amber-900/30 overflow-hidden">
                          {profile.latenessSummary.latenessList.map((lt, i) => (
                            <div key={i} className="p-3 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{lt.date}</span>
                                {lt.arrivalTime && (
                                  <span className="text-slate-500 mr-2">وقت الوصول: {lt.arrivalTime}</span>
                                )}
                                {lt.notes && (
                                  <span className="text-slate-400 italic block sm:inline sm:mr-2">({lt.notes})</span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold">
                                {lt.lateMinutes} د
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: RECENT ATTENDANCE HISTORY TABLE */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      السجل الكامل لحضور اللاعب ({profile.recentHistory.length} سجل)
                    </h3>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3">تاريخ الحصة</th>
                          <th className="p-3">رقم الحصة</th>
                          <th className="p-3">الحالة</th>
                          <th className="p-3">وقت الوصول</th>
                          <th className="p-3">دقائق التأخير</th>
                          <th className="p-3">الملاحظات</th>
                          <th className="p-3">المدرب المسجل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {profile.recentHistory.map((rec, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{rec.TrainingDate}</td>
                            <td className="p-3 font-mono text-slate-500">{rec.SessionID}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                  rec.AttendanceStatus === 'PRESENT'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                    : rec.AttendanceStatus === 'LATE'
                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                    : rec.AttendanceStatus === 'ABSENT'
                                    ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                                    : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                                }`}
                              >
                                {rec.AttendanceStatus === 'PRESENT'
                                  ? 'حاضر'
                                  : rec.AttendanceStatus === 'LATE'
                                  ? 'متأخر'
                                  : rec.AttendanceStatus === 'ABSENT'
                                  ? 'غائب'
                                  : 'إذن'}
                              </span>
                            </td>
                            <td className="p-3 font-mono">{rec.ArrivalTime || '—'}</td>
                            <td className="p-3">{rec.LateMinutes ? `${rec.LateMinutes} د` : '—'}</td>
                            <td className="p-3 text-slate-500 max-w-[200px] truncate">{rec.Notes || rec.ExcuseType || '—'}</td>
                            <td className="p-3 text-slate-500">{rec.CoachName || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <span>مصدر الهوية: قاعدة بيانات اللاعبين الرئيسية (MASTER PLAYER DATABASE)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
