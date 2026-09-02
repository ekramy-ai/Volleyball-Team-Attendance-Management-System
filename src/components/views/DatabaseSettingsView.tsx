import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Upload, 
  Download, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  FileSpreadsheet, 
  FileJson, 
  FileText, 
  Layers, 
  Lock, 
  Check, 
  Info,
  Calendar,
  Phone,
  Shield,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MasterPlayerRow, CoachRecord, CoachTeamRecord, UserRole } from '../../types/database';

export const DatabaseSettingsView: React.FC = () => {
  const { currentUser, language, isRtl, t, switchUser } = useApp();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Active Hub Tab
  const [activeTab, setActiveTab] = useState<'PLAYERS' | 'COACHES' | 'USERS' | 'BACKUP'>('PLAYERS');

  // Loading & Alerts
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Players Hub State
  const [players, setPlayers] = useState<MasterPlayerRow[]>([]);
  const [playersSearch, setPlayersSearch] = useState<string>('');
  const [playersTeamFilter, setPlayersTeamFilter] = useState<string>('ALL');
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState({
    fullName: '',
    teamName: 'راية براعم 2018+ - بنات - أ',
    gender: 'بنات',
    phone: '',
    dob: '',
    club: 'المؤسسة',
    rating: 'أ'
  });

  // Import Players File State
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Coaches Hub State
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [coachTeams, setCoachTeams] = useState<CoachTeamRecord[]>([]);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(false);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [coachForm, setCoachForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'HEAD_COACH' as UserRole,
    accountStatus: 'Active' as 'Active' | 'Inactive'
  });

  // Assign Team Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assignCoachId, setAssignCoachId] = useState<string>('');
  const [assignTeamName, setAssignTeamName] = useState<string>('راية براعم 2018+ - بنات - أ');
  const [assignPermission, setAssignPermission] = useState<'FULL_MANAGE' | 'RECORD_ONLY'>('FULL_MANAGE');

  // 3. Backup Hub State
  const [backupFile, setBackupFile] = useState<any | null>(null);
  const [backupPreviewSummary, setBackupPreviewSummary] = useState<any | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Available official 20 teams
  const officialTeams = [
    'راية براعم 2018+ - بنات - أ',
    'راية براعم 2018+ - بنات - ب',
    'راية براعم 2017 - بنات - أ',
    'راية براعم 2017 - بنات - ب',
    'راية براعم 2016 - بنات - أ',
    'المؤسسة براعم 2015 - بنين',
    'المؤسسة براعم 2015 - بنات',
    'راية براعم 2015 - بنات - أ',
    'راية براعم 2015&2016 - بنات - ب',
    'المؤسسة تحت 13 سنة - بنين - أ',
    'المؤسسة تحت 13 سنة - بنات - أ',
    'المؤسسة تحت 13 سنة - بنات - ب',
    'راية تحت 13 سنة - بنات - أ',
    'المؤسسة تحت 15 سنة - بنين - أ',
    'المؤسسة تحت 15 سنة - بنات - أ',
    'المؤسسة تحت 15 سنة - بنات - ب',
    'المؤسسة تحت 15 سنة - بنات - ج',
    'المؤسسة تحت 17 سنة - بنات - أ',
    'المؤسسة تحت 17 سنة - بنات - ب',
    'راية تحت 19 سنة - بنات - أ'
  ];

  // Fetch all database records
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [playersRes, coachesRes, assignmentsRes] = await Promise.all([
        fetch('/api/master/players'),
        fetch('/api/admin/coaches', { headers: { 'x-admin-email': currentUser?.userEmail || '' } }),
        fetch('/api/admin/coach-teams', { headers: { 'x-admin-email': currentUser?.userEmail || '' } })
      ]);

      const playersData = await playersRes.json();
      if (playersData.success) {
        setPlayers(playersData.rawPlayers || (playersData.players ? playersData.players.map((p: any) => p.raw || p) : []));
      }

      const coachesData = await coachesRes.json();
      if (coachesData.success && coachesData.coaches) {
        setCoaches(coachesData.coaches);
      }

      const assignmentsData = await assignmentsRes.json();
      if (assignmentsData.success && assignmentsData.assignments) {
        setCoachTeams(assignmentsData.assignments);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تحميل بيانات المنظومة');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // -------------------------------------------------------------
  // PLAYERS IMPORT HANDLERS
  // -------------------------------------------------------------
  const handlePlayerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setParsedPreview(parsed);
          } else {
            throw new Error('ملف JSON يجب أن يحتوي على مصفوفة لاعبين [].');
          }
        } else {
          // Parse CSV
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length < 2) throw new Error('الملف فارغ أو لا يحتوي على بيانات كافية.');

          const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
          const headers = lines[0].split(delimiter).map(h => h.replace(/^"|"$/g, '').trim());

          const records = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());
            const rowObj: any = {};
            headers.forEach((h, hIdx) => {
              rowObj[h] = cols[hIdx] || '';
            });
            records.push(rowObj);
          }
          setParsedPreview(records);
        }
      } catch (err: any) {
        setErrorMessage(`خطأ في قراءة الملف: ${err.message}`);
        setParsedPreview(null);
      }
    };

    reader.readAsText(file);
  };

  const confirmPlayerImport = async () => {
    if (!parsedPreview || parsedPreview.length === 0) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/database/import-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({
          players: parsedPreview,
          mode: importMode
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل استيراد قاعدة بيانات اللاعبين.');
      }

      setSuccessMessage(`✅ تم بنجاح استيراد وتحديث (${data.importedCount}) سجل لاعب! إجمالي اللاعبين الحالي: ${data.totalPlayers}`);
      setParsedPreview(null);
      setImportFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ بيانات اللاعبين.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SINGLE PLAYER CRUD HANDLERS
  // -------------------------------------------------------------
  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.fullName.trim()) {
      setErrorMessage('يرجى إدخال اسم اللاعب بالكامل.');
      return;
    }

    setIsLoading(true);
    try {
      if (editingPlayerId) {
        // Update
        const res = await fetch(`/api/database/players/${encodeURIComponent(editingPlayerId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
          },
          body: JSON.stringify(playerForm)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setSuccessMessage(`✅ تم تحديث بيانات اللاعب [${playerForm.fullName}] بنجاح.`);
      } else {
        // Add
        const res = await fetch('/api/database/players', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
          },
          body: JSON.stringify(playerForm)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setSuccessMessage(`✅ تمت إضافة اللاعب [${playerForm.fullName}] بنجاح.`);
      }

      setIsPlayerModalOpen(false);
      setEditingPlayerId(null);
      setPlayerForm({
        fullName: '',
        teamName: 'راية براعم 2018+ - بنات - أ',
        gender: 'بنات',
        phone: '',
        dob: '',
        club: 'المؤسسة',
        rating: 'أ'
      });
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل حفظ بيانات اللاعب.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`هل أنت متأكد من حذف اللاعب [${playerName}] من قاعدة البيانات؟`)) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/database/players/${encodeURIComponent(playerId)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccessMessage(`✅ تم حذف اللاعب [${playerName}] بنجاح.`);
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل حذف اللاعب.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // COACH CRUD HANDLERS
  // -------------------------------------------------------------
  const handleSaveCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachForm.fullName.trim() || !coachForm.email.trim()) {
      setErrorMessage('الاسم بالكامل والبريد الإلكتروني مطلوبان.');
      return;
    }

    setIsLoading(true);
    try {
      if (editingCoachId) {
        const res = await fetch(`/api/admin/coaches/${encodeURIComponent(editingCoachId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
          },
          body: JSON.stringify(coachForm)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setSuccessMessage(`✅ تم تحديث بيانات المدرب [${coachForm.fullName}] بنجاح.`);
      } else {
        const res = await fetch('/api/admin/coaches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
          },
          body: JSON.stringify(coachForm)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setSuccessMessage(`✅ تمت إضافة المدرب [${coachForm.fullName}] بنجاح.`);
      }

      setIsCoachModalOpen(false);
      setEditingCoachId(null);
      setCoachForm({
        fullName: '',
        email: '',
        phone: '',
        role: 'HEAD_COACH',
        accountStatus: 'Active'
      });
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل حفظ بيانات المدرب.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCoachStatus = async (coachId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/coaches/${encodeURIComponent(coachId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({ AccountStatus: nextStatus })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccessMessage(`✅ تم تغيير حالة الحساب إلى [${nextStatus === 'Active' ? 'نشط' : 'معطل'}].`);
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تحديث حالة الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TEAM ASSIGNMENT HANDLERS
  // -------------------------------------------------------------
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCoachId || !assignTeamName) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coach-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({
          CoachID: assignCoachId,
          TeamName: assignTeamName,
          PermissionLevel: assignPermission,
          Active: true
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccessMessage(`✅ تم تعيين الفريق [${assignTeamName}] للمدرب بنجاح.`);
      setIsAssignModalOpen(false);
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تعيين الفريق.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, teamName: string) => {
    if (!confirm(`هل أنت متأكد من إلغاء تعيين فريق [${teamName}]؟`)) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/coach-teams/${encodeURIComponent(assignmentId)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccessMessage(`✅ تم إلغاء تعيين الفريق [${teamName}] بنجاح.`);
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إلغاء التعيين.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // BACKUP & RESTORE HANDLERS
  // -------------------------------------------------------------
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/database/export-backup', {
        headers: { 'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club' }
      });
      const data = await res.json();
      if (!data.success || !data.backup) throw new Error(data.error || 'فشل تصدير النسخة الاحتياطية.');

      const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Volleyball_Club_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage('✅ تم تنزيل النسخة الاحتياطية الشاملة للمنظومة بنجاح!');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تحميل النسخة الاحتياطية.');
    }
  };

  const handleBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') throw new Error('ملف النسخة الاحتياطية غير صالح.');
        setBackupFile(parsed);
        setBackupPreviewSummary({
          playersCount: Array.isArray(parsed.masterPlayers) ? parsed.masterPlayers.length : 0,
          coachesCount: Array.isArray(parsed.coaches) ? parsed.coaches.length : 0,
          sessionsCount: Array.isArray(parsed.trainingSessions) ? parsed.trainingSessions.length : 0,
          attendanceCount: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords.length : 0,
          exportDate: parsed.exportTimestamp || 'غير معروف'
        });
      } catch (err: any) {
        setErrorMessage(`الملف غير صالح: ${err.message}`);
        setBackupFile(null);
        setBackupPreviewSummary(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!backupFile) return;
    if (!confirm('⚠️ تحذير: استعادة النسخة الاحتياطية ستقوم باستبدال البيانات الحالية بالبيانات الموجودة في الملف. هل ترغب في المتابعة؟')) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/database/restore-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({ backup: backupFile })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccessMessage('🎉 تمت استعادة المنظومة وقواعد البيانات بالكامل بنجاح وحفظها على القرص!');
      setBackupFile(null);
      setBackupPreviewSummary(null);
      if (backupInputRef.current) backupInputRef.current.value = '';
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل استعادة النسخة الاحتياطية.');
    } finally {
      setIsLoading(false);
    }
  };

  // Export Players List as CSV
  const handleExportPlayersCSV = () => {
    if (players.length === 0) return;
    const headers = ['Player ID', 'اسم اللاعب رباعي', 'الفريق', 'النوع', 'رقم التليفون', 'تاريخ الميلاد', 'النادى', 'تصنيف'];
    const rows = players.map(p => [
      p['Player ID'] || '',
      `"${p['اسم اللاعب رباعي'] || p['الأسم'] || ''}"`,
      `"${p['الفريق'] || ''}"`,
      p['النوع'] || '',
      p['رقم التليفون'] || '',
      p['تاريخ الميلاد'] || '',
      `"${p['النادى'] || ''}"`,
      p['تصنيف'] || ''
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Master_Players_List_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered Players List
  const filteredPlayers = players.filter(p => {
    const name = (p['اسم اللاعب رباعي'] || p['الأسم'] || '').toLowerCase();
    const id = (p['Player ID'] || '').toLowerCase();
    const team = p['الفريق'] || '';
    const matchesSearch = !playersSearch || name.includes(playersSearch.toLowerCase()) || id.includes(playersSearch.toLowerCase());
    const matchesTeam = playersTeamFilter === 'ALL' || team === playersTeamFilter;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & KPI Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>منظومة قواعد البيانات الذاتية المستقلة (100% Manual & Local Storage)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              مركز إدارة واستيراد قواعد البيانات
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              التحكم اليدوي الكامل والمستقل في رفع وتحديث قواعد بيانات اللاعبين، المدربين، والصلاحيات مع دعم ملفات Excel و CSV و JSON والتخزين الدائم على القرص.
            </p>
          </div>

          {/* Quick Database Stats */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="block text-[11px] text-slate-400 font-bold mb-1">اللاعبين</span>
              <span className="text-xl font-black text-amber-400">{players.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="block text-[11px] text-slate-400 font-bold mb-1">المدربين</span>
              <span className="text-xl font-black text-cyan-400">{coaches.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="block text-[11px] text-slate-400 font-bold mb-1">الفرق المعتمدة</span>
              <span className="text-xl font-black text-emerald-400">20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('PLAYERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'PLAYERS'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>قاعدة بيانات اللاعبين واللاعبات ({players.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('COACHES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'COACHES'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>المدربين وتعيينات الفرق ({coaches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'USERS'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>المستخدمون والصلاحيات</span>
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'BACKUP'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>النسخ الاحتياطي والاستعادة</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: PLAYERS HUB */}
      {/* ============================================================= */}
      {activeTab === 'PLAYERS' && (
        <div className="space-y-6">
          {/* File Upload Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-orange-500" />
                  <span>رفع واستيراد كشوف اللاعبين (Excel / CSV / JSON)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ارفع ملف كشف اللاعبين لتحديث قاعدة البيانات تلقائياً مع الكشف الذكي للأعمدة.
                </p>
              </div>

              {/* Import Mode Switcher */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setImportMode('MERGE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    importMode === 'MERGE'
                      ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔄 دمج وتحديث (Merge)
                </button>
                <button
                  onClick={() => setImportMode('REPLACE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    importMode === 'REPLACE'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚠️ استبدال شامل (Replace)
                </button>
              </div>
            </div>

            {/* Drop / Select Area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl p-6 text-center transition bg-slate-50/50 dark:bg-slate-800/30">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .json, .txt, .tsv"
                onChange={handlePlayerFileUpload}
                className="hidden"
                id="player-file-input"
              />
              <label htmlFor="player-file-input" className="cursor-pointer block space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    {importFileName ? `الملف المختار: ${importFileName}` : 'اضغط هنا لاختيار ملف CSV أو JSON لكشف اللاعبين'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    يدعم ملفات إكسل المصدرة بصيغة CSV أو مصفوفات JSON بترميز UTF-8
                  </span>
                </div>
              </label>
            </div>

            {/* Preview Section if File Selected */}
            {parsedPreview && parsedPreview.length > 0 && (
              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      تم استخراج ({parsedPreview.length}) سجل بنجاح! جاهز للتأكيد والحفظ.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setParsedPreview(null); setImportFileName(''); }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={confirmPlayerImport}
                      disabled={isLoading}
                      className="px-4 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{importMode === 'REPLACE' ? 'تأكيد الاستبدال الشامل' : 'تأكيد الدمج والتحديث'}</span>
                    </button>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto max-h-48 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-[11px] text-start">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">كود اللاعب</th>
                        <th className="p-2">اسم اللاعب</th>
                        <th className="p-2">الفريق</th>
                        <th className="p-2">الهاتف</th>
                        <th className="p-2">تاريخ الميلاد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {parsedPreview.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-mono">{idx + 1}</td>
                          <td className="p-2 font-mono text-orange-600 dark:text-orange-400">
                            {row['Player ID'] || row.PlayerID || 'توليد تلقائي'}
                          </td>
                          <td className="p-2 font-bold">{row['اسم اللاعب رباعي'] || row['الأسم'] || row.fullName || '—'}</td>
                          <td className="p-2">{row['الفريق'] || row.teamName || '—'}</td>
                          <td className="p-2 font-mono">{row['رقم التليفون'] || row.phone || '—'}</td>
                          <td className="p-2 font-mono">{row['تاريخ الميلاد'] || row.dob || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Master Players Live Table & Actions */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  قائمة اللاعبين واللاعبات الحالية ({filteredPlayers.length} من {players.length})
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Export CSV Button */}
                <button
                  onClick={handleExportPlayersCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير CSV</span>
                </button>

                {/* Add Player Manual Button */}
                <button
                  onClick={() => {
                    setEditingPlayerId(null);
                    setPlayerForm({
                      fullName: '',
                      teamName: 'راية براعم 2018+ - بنات - أ',
                      gender: 'بنات',
                      phone: '',
                      dob: '',
                      club: 'المؤسسة',
                      rating: 'أ'
                    });
                    setIsPlayerModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة لاعب جديد</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={playersSearch}
                  onChange={e => setPlayersSearch(e.target.value)}
                  placeholder="بحث باسم اللاعب، كود اللاعب، أو رقم الهاتف..."
                  className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <select
                value={playersTeamFilter}
                onChange={e => setPlayersTeamFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">جميع الفرق ({players.length} لاعب)</option>
                {officialTeams.map(t => (
                  <option key={t} value={t}>
                    🏐 {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Players Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[500px]">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-start">كود اللاعب (Player ID)</th>
                    <th className="p-3 text-start">اسم اللاعب بالكامل</th>
                    <th className="p-3 text-start">الفريق</th>
                    <th className="p-3 text-start">النوع</th>
                    <th className="p-3 text-start">الهاتف</th>
                    <th className="p-3 text-start">تاريخ الميلاد</th>
                    <th className="p-3 text-start">التصنيف</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredPlayers.slice(0, 100).map((p, idx) => {
                    const pId = p['Player ID'] || '';
                    const pName = p['اسم اللاعب رباعي'] || p['الأسم'] || '';
                    return (
                      <tr key={pId || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                          {pId || '—'}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {pName}
                        </td>
                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                          {p['الفريق']}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p['النوع'] === 'بنين'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                          }`}>
                            {p['النوع']}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {p['رقم التليفون'] || '—'}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {p['تاريخ الميلاد'] || '—'}
                        </td>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                          {p['تصنيف'] || 'أ'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPlayerId(pId);
                                setPlayerForm({
                                  fullName: pName,
                                  teamName: p['الفريق'] || 'براعم 2015',
                                  gender: p['النوع'] || 'بنات',
                                  phone: p['رقم التليفون'] || '',
                                  dob: p['تاريخ الميلاد'] || '',
                                  club: p['النادى'] || 'المؤسسة',
                                  rating: p['تصنيف'] || 'أ'
                                });
                                setIsPlayerModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                              title="تعديل بيانات اللاعب"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(pId, pName)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="حذف اللاعب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredPlayers.length > 100 && (
              <p className="text-center text-[11px] text-slate-400 pt-2">
                يتم عرض أول 100 لاعب من أصل ({filteredPlayers.length}). استخدم شريط البحث للتخصيص.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: COACHES & ASSIGNMENTS HUB */}
      {/* ============================================================= */}
      {activeTab === 'COACHES' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-orange-500" />
                  <span>قائمة الجهاز الفني والمدربين المعتمدين ({coaches.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  إدارة بيانات المدربين، الصلاحيات، وتعيينات الفرق الـ 20 المعتمدة.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCoachId(null);
                  setCoachForm({
                    fullName: '',
                    email: '',
                    phone: '',
                    role: 'HEAD_COACH',
                    accountStatus: 'Active'
                  });
                  setIsCoachModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مدرب جديد</span>
              </button>
            </div>

            {/* Coaches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coaches.map(coach => {
                const assignments = coachTeams.filter(a => a.CoachID === coach.CoachID && a.Active);
                return (
                  <div
                    key={coach.CoachID}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {coach.FullName}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            coach.Role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {coach.Role === 'ADMIN' ? 'رئيس الجهاز / أدمن' : 'مدرب عام'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                          {coach.Email} • {coach.Phone || 'بدون هاتف'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCoachId(coach.CoachID);
                            setCoachForm({
                              fullName: coach.FullName,
                              email: coach.Email,
                              phone: coach.Phone || '',
                              role: coach.Role,
                              accountStatus: coach.AccountStatus || 'Active'
                            });
                            setIsCoachModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="تعديل بيانات المدرب"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleCoachStatus(coach.CoachID, coach.AccountStatus || 'Active')}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                            coach.AccountStatus === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {coach.AccountStatus === 'Active' ? 'نشط' : 'معطل'}
                        </button>
                      </div>
                    </div>

                    {/* Assigned Teams Section */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        <span>الفرق المعتمدة تحت إشرافه ({assignments.length})</span>
                        <button
                          onClick={() => {
                            setAssignCoachId(coach.CoachID);
                            setIsAssignModalOpen(true);
                          }}
                          className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>تعيين فرقة</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {assignments.length > 0 ? (
                          assignments.map(a => (
                            <span
                              key={a.AssignmentID}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300 text-[11px] font-bold"
                            >
                              <span>🏐 {a.TeamName}</span>
                              <button
                                onClick={() => handleRemoveAssignment(a.AssignmentID, a.TeamName)}
                                className="hover:text-rose-500"
                                title="إلغاء التعيين"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">لا توجد فرق معينة حالياً</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: USERS & PERMISSIONS HUB */}
      {/* ============================================================= */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
                <span>إدارة حسابات الدخول ومصفوفة الصلاحيات (Roles & Access Matrix)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تحديد الأدوار الرسمية، تفعيل أو تعطيل الحسابات، وتبديل الحساب النشط فوراً.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3 text-start">الاسم</th>
                    <th className="p-3 text-start">البريد الإلكتروني</th>
                    <th className="p-3 text-start">الدور المعتمد</th>
                    <th className="p-3 text-start">الحالة</th>
                    <th className="p-3 text-start">نطاق الفرق</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {coaches.map(coach => {
                    const isCurrent = currentUser?.userEmail === coach.Email;
                    const assignedCount = coachTeams.filter(a => a.CoachID === coach.CoachID && a.Active).length;
                    return (
                      <tr key={coach.CoachID} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {coach.FullName} {isCurrent && <span className="text-[10px] text-orange-500 font-bold">(أنت)</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{coach.Email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            coach.Role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {coach.Role === 'ADMIN' ? 'مدير فني (ADMIN)' : 'مدرب معتمد (HEAD_COACH)'}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleCoachStatus(coach.CoachID, coach.AccountStatus || 'Active')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              coach.AccountStatus === 'Active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {coach.AccountStatus === 'Active' ? 'نشط' : 'معطل'}
                          </button>
                        </td>
                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                          {coach.Role === 'ADMIN' ? 'صلاحية شاملة لكافة الفرق' : `${assignedCount} فرق معتمدة`}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => switchUser(coach.Email)}
                            disabled={isCurrent}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                              isCurrent
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xs'
                            }`}
                          >
                            {isCurrent ? 'الحساب النشط' : 'تسجيل الدخول'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: FULL BACKUP & RESTORE HUB */}
      {/* ============================================================= */}
      {activeTab === 'BACKUP' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  تصدير نسخة احتياطية شاملة (Full Backup Export)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  تنزيل ملف موحد بصيغة JSON يحتوي على كافة قواعد البيانات (اللاعبين، المدربين، تعيينات الفرق، جداول التدريب، سجلات الحضور، وسجلات التدقيق).
                </p>
              </div>

              <button
                onClick={handleDownloadBackup}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>تحميل النسخة الاحتياطية الشاملة الآن</span>
              </button>
            </div>

            {/* Restore Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  استعادة نسخة احتياطية (Restore Backup)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  رفع ملف النسخة الاحتياطية لاستعادة كافة السجلات مع الحفظ الفوري والدائم على القرص.
                </p>
              </div>

              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={handleBackupFileUpload}
                className="hidden"
                id="restore-backup-input"
              />
              <label
                htmlFor="restore-backup-input"
                className="cursor-pointer block text-center p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {backupPreviewSummary ? 'تم اختيار ملف النسخة الاحتياطية' : 'اضغط لاختيار ملف النسخة الاحتياطية (.json)'}
              </label>

              {backupPreviewSummary && (
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    محتويات النسخة الاحتياطية:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <span>👥 اللاعبين: {backupPreviewSummary.playersCount}</span>
                    <span>👨‍🏫 المدربين: {backupPreviewSummary.coachesCount}</span>
                    <span>📅 الحصص: {backupPreviewSummary.sessionsCount}</span>
                    <span>✅ الحضور: {backupPreviewSummary.attendanceCount}</span>
                  </div>
                  <button
                    onClick={handleConfirmRestore}
                    disabled={isLoading}
                    className="w-full mt-2 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 shadow-md shadow-orange-500/20"
                  >
                    تأكيد الاستعادة الفورية
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD / EDIT PLAYER */}
      {/* ============================================================= */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span>{editingPlayerId ? 'تعديل بيانات اللاعب' : 'إضافة لاعب جديد يدوياً'}</span>
            </h3>

            <form onSubmit={handleSavePlayer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم اللاعب بالكامل *
                </label>
                <input
                  type="text"
                  required
                  value={playerForm.fullName}
                  onChange={e => setPlayerForm({ ...playerForm, fullName: e.target.value })}
                  placeholder="مثال: أحمد محمد علي حسن"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الفريق المعتمد *
                </label>
                <select
                  value={playerForm.teamName}
                  onChange={e => setPlayerForm({ ...playerForm, teamName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  {officialTeams.map(t => (
                    <option key={t} value={t}>🏐 {t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    النوع
                  </label>
                  <select
                    value={playerForm.gender}
                    onChange={e => setPlayerForm({ ...playerForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="بنات">بنات</option>
                    <option value="بنين">بنين</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التصنيف
                  </label>
                  <select
                    value={playerForm.rating}
                    onChange={e => setPlayerForm({ ...playerForm, rating: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="أ">أ</option>
                    <option value="ب">ب</option>
                    <option value="ج">ج</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={playerForm.phone}
                    onChange={e => setPlayerForm({ ...playerForm, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الميلاد
                  </label>
                  <input
                    type="text"
                    value={playerForm.dob}
                    onChange={e => setPlayerForm({ ...playerForm, dob: e.target.value })}
                    placeholder="YYYY-MM-DD"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20"
                >
                  {editingPlayerId ? 'حفظ التعديلات' : 'إضافة اللاعب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD / EDIT COACH */}
      {/* ============================================================= */}
      {isCoachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-500" />
              <span>{editingCoachId ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد'}</span>
            </h3>

            <form onSubmit={handleSaveCoach} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  required
                  value={coachForm.fullName}
                  onChange={e => setCoachForm({ ...coachForm, fullName: e.target.value })}
                  placeholder="مثال: ك/ أحمد سالم"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني (لتسجيل الدخول) *
                </label>
                <input
                  type="email"
                  required
                  value={coachForm.email}
                  onChange={e => setCoachForm({ ...coachForm, email: e.target.value })}
                  placeholder="coach@volleyball.club"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={coachForm.phone}
                    onChange={e => setCoachForm({ ...coachForm, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الدور المعتمد
                  </label>
                  <select
                    value={coachForm.role}
                    onChange={e => setCoachForm({ ...coachForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="HEAD_COACH">مدرب عام (HEAD_COACH)</option>
                    <option value="ADMIN">رئيس الجهاز / أدمن (ADMIN)</option>
                    <option value="ASSISTANT_COACH">مدرب مساعد (ASSISTANT)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCoachModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20"
                >
                  {editingCoachId ? 'حفظ التعديلات' : 'إضافة المدرب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ASSIGN TEAM TO COACH */}
      {/* ============================================================= */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              <span>تعيين فرقة جديدة للمدرب</span>
            </h3>

            <form onSubmit={handleAddAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اختر الفرقة من الفرق الـ 20 المعتمدة *
                </label>
                <select
                  value={assignTeamName}
                  onChange={e => setAssignTeamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  {officialTeams.map(t => (
                    <option key={t} value={t}>🏐 {t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مستوى الصلاحية الممنوحة *
                </label>
                <select
                  value={assignPermission}
                  onChange={e => setAssignPermission(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="FULL_MANAGE">تحكم كامل (FULL_MANAGE): جداول + كشوف + حضور</option>
                  <option value="RECORD_ONLY">تسجيل حضور فقط (RECORD_ONLY)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20"
                >
                  تأكيد التعيين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
