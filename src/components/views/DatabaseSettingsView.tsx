import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Link as LinkIcon, 
  Table, 
  Columns, 
  Layers, 
  ShieldCheck, 
  Activity, 
  ArrowRightLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Lock,
  Search,
  Sparkles,
  Info,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  DatabaseProfile, 
  ColumnMapping, 
  DatabaseValidationReport, 
  SpreadsheetConnectionTestResult 
} from '../../types/database';

export const DatabaseSettingsView: React.FC = () => {
  const { currentUser, language, isRtl, t } = useApp();
  const isAdmin = currentUser?.role === 'ADMIN';

  // State
  const [profiles, setProfiles] = useState<DatabaseProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [activeProfile, setActiveProfile] = useState<DatabaseProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // New / Edit Profile Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [formDatabaseName, setFormDatabaseName] = useState<string>('');
  const [formSpreadsheetInput, setFormSpreadsheetInput] = useState<string>('');
  const [extractedId, setExtractedId] = useState<string>('');
  const [formPlayersSheet, setFormPlayersSheet] = useState<string>('Volleyball Player Database');
  const [formCoachesSheet, setFormCoachesSheet] = useState<string>('Coaches');
  const [formCoachTeamsSheet, setFormCoachTeamsSheet] = useState<string>('CoachTeams');
  const [formSessionsSheet, setFormSessionsSheet] = useState<string>('TrainingSessions');
  const [formAttendanceSheet, setFormAttendanceSheet] = useState<string>('Attendance');
  const [formAuditLogSheet, setFormAuditLogSheet] = useState<string>('AuditLog');
  const [formSettingsSheet, setFormSettingsSheet] = useState<string>('SystemSettings');

  // Column Mappings State
  const [formMapping, setFormMapping] = useState<ColumnMapping>({
    PlayerID: 'Player ID',
    PlayerName: 'الاسم',
    FullPlayerName: 'اسم اللاعب رباعي',
    TeamName: 'الفريق',
    TeamBirthYear: 'مواليد الفريق',
    Gender: 'النوع',
    BirthYear: 'مواليد',
    DateOfBirth: 'تاريخ الميلاد'
  });

  // Connection Test & Validation State
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestResult, setConnectionTestResult] = useState<SpreadsheetConnectionTestResult | null>(null);
  const [validationReport, setValidationReport] = useState<DatabaseValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Safety Confirmation Modal for Switching Database
  const [switchModalProfile, setSwitchModalProfile] = useState<DatabaseProfile | null>(null);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Diagnostic Test Suite
  const [diagnosticReport, setDiagnosticReport] = useState<any | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);

  // Load profiles from backend
  const fetchProfiles = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/database/profiles', {
        headers: {
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        }
      });
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles || []);
        setActiveProfileId(data.activeProfileId);
        setActiveProfile(data.activeProfile || null);
      } else {
        setErrorMessage(data.error || 'فشل تحميل ملفات قاعدة البيانات');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [currentUser]);

  // Handle URL / ID Input extraction
  const handleSpreadsheetInputChange = (val: string) => {
    setFormSpreadsheetInput(val);
    const trimmed = val.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
    if (match && match[1]) {
      setExtractedId(match[1]);
    } else if (!trimmed.includes('/') && trimmed.length > 5) {
      setExtractedId(trimmed);
    } else {
      setExtractedId(trimmed);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    if (!formSpreadsheetInput.trim()) {
      setErrorMessage('يرجى إدخال رابط جدول البيانات أو معرّف ID أولاً.');
      return;
    }

    setIsTestingConnection(true);
    setErrorMessage('');
    setConnectionTestResult(null);

    try {
      const res = await fetch('/api/database/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({ urlOrId: formSpreadsheetInput })
      });
      const data = await res.json();
      setConnectionTestResult(data);
      if (data.success) {
        if (!formDatabaseName && data.spreadsheetTitle) {
          setFormDatabaseName(data.spreadsheetTitle);
        }
        setSuccessMessage('تم الاتصال بجدول البيانات واكتشاف أوراق العمل بنجاح!');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data.error || 'تعذر الاتصال بجدول البيانات');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Run Profile Validation
  const handleValidateForm = async () => {
    setIsValidating(true);
    setErrorMessage('');
    setValidationReport(null);

    const profileToValidate: Partial<DatabaseProfile> = {
      databaseName: formDatabaseName || 'قاعدة بيانات جديدة',
      spreadsheetId: extractedId || formSpreadsheetInput,
      spreadsheetUrl: formSpreadsheetInput.startsWith('http') ? formSpreadsheetInput : `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
      playersSheetName: formPlayersSheet,
      coachesSheetName: formCoachesSheet,
      coachTeamsSheetName: formCoachTeamsSheet,
      trainingSessionsSheetName: formSessionsSheet,
      attendanceSheetName: formAttendanceSheet,
      auditLogSheetName: formAuditLogSheet,
      systemSettingsSheetName: formSettingsSheet,
      columnMapping: formMapping
    };

    try {
      const res = await fetch('/api/database/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({ profile: profileToValidate })
      });
      const data = await res.json();
      if (data.validationReport) {
        setValidationReport(data.validationReport);
        if (data.validationReport.isValid) {
          setSuccessMessage('اجتازت قاعدة البيانات كافة فحوصات الأمان والهيكلة بنجاح!');
          setTimeout(() => setSuccessMessage(''), 4000);
        } else {
          setErrorMessage('لم تجتز قاعدة البيانات بعض فحوصات التحقق. راجع التقرير أدناه.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطأ أثناء التحقق');
    } finally {
      setIsValidating(false);
    }
  };

  // Save / Update Profile
  const handleSaveProfile = async () => {
    if (!formDatabaseName.trim()) {
      setErrorMessage('يرجى كتابة اسم تعريفي لقاعدة البيانات.');
      return;
    }
    if (!extractedId && !formSpreadsheetInput) {
      setErrorMessage('معرّف جدول البيانات مطلوب.');
      return;
    }

    setErrorMessage('');
    const profilePayload: Partial<DatabaseProfile> = {
      databaseName: formDatabaseName,
      spreadsheetId: extractedId || formSpreadsheetInput,
      spreadsheetUrl: formSpreadsheetInput.startsWith('http') ? formSpreadsheetInput : `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
      playersSheetName: formPlayersSheet,
      coachesSheetName: formCoachesSheet,
      coachTeamsSheetName: formCoachTeamsSheet,
      trainingSessionsSheetName: formSessionsSheet,
      attendanceSheetName: formAttendanceSheet,
      auditLogSheetName: formAuditLogSheet,
      systemSettingsSheetName: formSettingsSheet,
      columnMapping: formMapping
    };

    try {
      const url = editingProfileId ? `/api/database/profiles/${editingProfileId}` : '/api/database/profiles';
      const method = editingProfileId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        },
        body: JSON.stringify({ profile: profilePayload })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(editingProfileId ? 'تم تحديث ملف قاعدة البيانات بنجاح!' : 'تم إضافة ملف قاعدة بيانات جديد بنجاح!');
        setIsFormOpen(false);
        setEditingProfileId(null);
        fetchProfiles();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data.error || 'فشل حفظ ملف قاعدة البيانات');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  // Open Edit Form for an existing profile
  const handleOpenEdit = (prof: DatabaseProfile) => {
    setEditingProfileId(prof.id);
    setFormDatabaseName(prof.databaseName || '');
    setFormSpreadsheetInput(prof.spreadsheetUrl || prof.spreadsheetId || '');
    setExtractedId(prof.spreadsheetId || '');
    setFormPlayersSheet(prof.playersSheetName || 'Volleyball Player Database');
    setFormCoachesSheet(prof.coachesSheetName || 'Coaches');
    setFormCoachTeamsSheet(prof.coachTeamsSheetName || 'CoachTeams');
    setFormSessionsSheet(prof.trainingSessionsSheetName || 'TrainingSessions');
    setFormAttendanceSheet(prof.attendanceSheetName || 'Attendance');
    setFormAuditLogSheet(prof.auditLogSheetName || 'AuditLog');
    setFormSettingsSheet(prof.systemSettingsSheetName || 'SystemSettings');
    setFormMapping({
      PlayerID: prof.columnMapping?.PlayerID || 'Player ID',
      PlayerName: prof.columnMapping?.PlayerName || 'الاسم',
      FullPlayerName: prof.columnMapping?.FullPlayerName || 'اسم اللاعب رباعي',
      TeamName: prof.columnMapping?.TeamName || 'الفريق',
      TeamBirthYear: prof.columnMapping?.TeamBirthYear || 'مواليد الفريق',
      Gender: prof.columnMapping?.Gender || 'النوع',
      BirthYear: prof.columnMapping?.BirthYear || 'مواليد',
      DateOfBirth: prof.columnMapping?.DateOfBirth || 'تاريخ الميلاد'
    });
    setConnectionTestResult(null);
    setValidationReport(prof.validationSummary || null);
    setIsFormOpen(true);
  };

  // Open Create New Profile Form
  const handleOpenCreate = () => {
    setEditingProfileId(null);
    setFormDatabaseName('');
    setFormSpreadsheetInput('');
    setExtractedId('');
    setFormPlayersSheet('Volleyball Player Database');
    setFormCoachesSheet('Coaches');
    setFormCoachTeamsSheet('CoachTeams');
    setFormSessionsSheet('TrainingSessions');
    setFormAttendanceSheet('Attendance');
    setFormAuditLogSheet('AuditLog');
    setFormSettingsSheet('SystemSettings');
    setFormMapping({
      PlayerID: 'Player ID',
      PlayerName: 'الاسم',
      FullPlayerName: 'اسم اللاعب رباعي',
      TeamName: 'الفريق',
      TeamBirthYear: 'مواليد الفريق',
      Gender: 'النوع',
      BirthYear: 'مواليد',
      DateOfBirth: 'تاريخ الميلاد'
    });
    setConnectionTestResult(null);
    setValidationReport(null);
    setIsFormOpen(true);
  };

  // Switch Active Database Profile
  const handleConfirmSwitch = async () => {
    if (!switchModalProfile) return;
    setIsSwitching(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/database/profiles/${switchModalProfile.id}/activate`, {
        method: 'POST',
        headers: {
          'x-admin-email': currentUser?.userEmail || 'admin@volleyball.club'
        }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`تم تفعيل قاعدة البيانات [${switchModalProfile.databaseName}] بنجاح، وتم تسجيل التبديل في سجل التدقيق.`);
        setSwitchModalProfile(null);
        fetchProfiles();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.error || 'تعذر تفعيل قاعدة البيانات');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطأ أثناء تفعيل قاعدة البيانات');
    } finally {
      setIsSwitching(false);
    }
  };

  // Run Phase 11.5 Diagnostic Suite
  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const res = await fetch('/api/diagnostics/phase11-5');
      const data = await res.json();
      setDiagnosticReport(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تشغيل الفحص التشخيصي للمرحلة 11.5');
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl p-8 text-center max-w-2xl mx-auto my-12">
        <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-red-800 dark:text-red-300 mb-2">
          {language === 'ar' ? 'وصول مقيّد - خاص بإدارة النظام فقط' : 'Access Restricted - Admin Only'}
        </h2>
        <p className="text-sm text-red-600 dark:text-red-400">
          {language === 'ar'
            ? 'صفحة إعدادات واختيار قاعدة بيانات Google Sheets متاحة حصرياً لمديري النظام ذوي صلاحية ADMIN.'
            : 'Google Sheets Database Configuration is strictly restricted to System Administrators.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-700/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-emerald-100">
            <Database className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'المرحلة 11.5: اختيار وتهيئة قاعدة البيانات' : 'Phase 11.5: Database Selection & Configuration'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {language === 'ar' ? 'إعدادات واختيار قاعدة بيانات Google Sheets' : 'Google Sheets Database Settings & Profiles'}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
            {language === 'ar'
              ? 'إدارة واختيار جدول Google Spreadsheet النشط ديناميكياً، مع دعم خرائط الأعمدة المخصصة وفحص الاتصال والتبديل الآمن بين المواسم.'
              : 'Dynamically configure and switch active Google Spreadsheets with custom column mappings and automated validation.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-emerald-800 font-black text-xs hover:bg-emerald-50 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة ملف قاعدة بيانات جديد' : 'New Database Profile'}</span>
          </button>
          <button
            onClick={handleRunDiagnostics}
            disabled={isRunningDiagnostics}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-900 text-white font-bold text-xs border border-emerald-500/40 transition"
          >
            <Activity className={`w-4 h-4 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
            <span>{language === 'ar' ? 'فحص تشخيصي للمرحلة 11.5' : 'Run Phase 11.5 Diagnostics'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ACTIVE DATABASE HERO CARD */}
      {activeProfile && (
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black tracking-wide shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'قاعدة البيانات النشطة حالياً' : 'ACTIVE DATABASE'}
                </span>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  {activeProfile.id}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {activeProfile.databaseName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate max-w-md">ID: {activeProfile.spreadsheetId}</span>
              </div>
            </div>

            {/* Quick Actions for Active Database */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={activeProfile.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${activeProfile.spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'فتح في Google Sheets' : 'Open in Sheets'}</span>
              </a>
              <button
                onClick={() => handleOpenEdit(activeProfile)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition border border-emerald-200 dark:border-emerald-800/60"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تعديل التهيئة وربط الأعمدة' : 'Configure & Map'}</span>
              </button>
            </div>
          </div>

          {/* Active Profile Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">
                {language === 'ar' ? 'ورقة اللاعبين الرئيسية' : 'Master Player Sheet'}
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 block truncate">
                {activeProfile.playersSheetName}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">
                {language === 'ar' ? 'حالة التحقق الشامل' : 'Validation Status'}
              </span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {activeProfile.lastValidationStatus || 'VALID'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">
                {language === 'ar' ? 'عمود المفتاح الأساسي' : 'Primary Key Mapping'}
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 block truncate">
                {activeProfile.columnMapping?.PlayerID || 'Player ID'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">
                {language === 'ar' ? 'أوراق العمل المساعدة' : 'Auxiliary Sheets'}
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 block">
                6 {language === 'ar' ? 'جداول مساعدة' : 'Sheets Configured'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROFILE FORM MODAL OR DRAWER */}
      {isFormOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {editingProfileId 
                  ? (language === 'ar' ? `تعديل تهيئة قاعدة البيانات: ${formDatabaseName}` : `Edit Database Profile: ${formDatabaseName}`)
                  : (language === 'ar' ? 'إضافة وتهيئة قاعدة بيانات جديدة' : 'Configure New Google Spreadsheet Database')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar'
                  ? 'أدخل رابط Google Spreadsheet، واختبر الاتصال، ثم حدد ورقة اللاعبين وخرائط الأعمدة.'
                  : 'Enter Spreadsheet URL, discover sheets, and map columns to application fields.'}
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'اسم قاعدة البيانات (الاسم التعريفي للموسم)' : 'Database Profile Name'}
              </label>
              <input
                type="text"
                value={formDatabaseName || ''}
                onChange={(e) => setFormDatabaseName(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: قاعدة بيانات الكرة الطائرة - موسم 2025/2026' : 'e.g. Volleyball Season 2025/2026'}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Google Spreadsheet URL or ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'رابط جدول Google Spreadsheet أو معرّف ID' : 'Google Spreadsheet URL or ID'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formSpreadsheetInput || ''}
                  onChange={(e) => handleSpreadsheetInputChange(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{language === 'ar' ? 'فحص الاتصال' : 'Test'}</span>
                </button>
              </div>
              {extractedId && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'ar' ? 'معرّف ID المستخرج:' : 'Extracted ID:'} {extractedId}</span>
                </div>
              )}
            </div>
          </div>

          {/* DISCOVERED SHEETS PREVIEW */}
          {connectionTestResult && connectionTestResult.success && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {language === 'ar' ? 'تم العثور على أوراق العمل التالية داخل الملف:' : 'Discovered Sheets in Workbook:'}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  {connectionTestResult.availableSheets?.length} {language === 'ar' ? 'ورقة عمل' : 'Sheets'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {connectionTestResult.availableSheets?.map(s => (
                  <span 
                    key={s} 
                    onClick={() => setFormPlayersSheet(s)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                      formPlayersSheet === s 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    {s} {formPlayersSheet === s && '✓'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SHEET SELECTION SECTION */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-orange-500" />
              <span>{language === 'ar' ? 'تحديد أوراق العمل الأساسية والمساعدة' : 'Sheet Names Configuration'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl">
                <label className="block text-[11px] font-black text-orange-900 dark:text-orange-300 mb-1">
                  {language === 'ar' ? 'ورقة اللاعبين (MASTER PLAYER DATABASE)*' : 'Master Player Database Sheet*'}
                </label>
                <input
                  type="text"
                  value={formPlayersSheet || ''}
                  onChange={(e) => setFormPlayersSheet(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? 'ورقة المدربين (COACHES)' : 'Coaches Sheet'}
                </label>
                <input
                  type="text"
                  value={formCoachesSheet || ''}
                  onChange={(e) => setFormCoachesSheet(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? 'ورقة تكليف الفرق (COACH_TEAMS)' : 'Coach Teams Sheet'}
                </label>
                <input
                  type="text"
                  value={formCoachTeamsSheet || ''}
                  onChange={(e) => setFormCoachTeamsSheet(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? 'ورقة التدريبات (TRAINING_SESSIONS)' : 'Training Sessions Sheet'}
                </label>
                <input
                  type="text"
                  value={formSessionsSheet || ''}
                  onChange={(e) => setFormSessionsSheet(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? 'ورقة الحضور (ATTENDANCE)' : 'Attendance Sheet'}
                </label>
                <input
                  type="text"
                  value={formAttendanceSheet || ''}
                  onChange={(e) => setFormAttendanceSheet(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? 'ورقة سجل التدقيق (AUDIT_LOG)' : 'Audit Log Sheet'}
                </label>
                <input
                  type="text"
                  value={formAuditLogSheet || ''}
                  onChange={(e) => setFormAuditLogSheet(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* COLUMN MAPPING SYSTEM */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Columns className="w-4 h-4 text-emerald-500" />
                <span>{language === 'ar' ? 'خريطة مطابقة أعمدة اللاعبين (Column Mapping)' : 'Player Database Column Mapping'}</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-bold">
                Application Field → Google Sheet Header
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 block mb-1 uppercase">
                  PlayerID (Primary Key)*
                </span>
                <input
                  type="text"
                  value={formMapping.PlayerID || ''}
                  onChange={(e) => setFormMapping({ ...formMapping, PlayerID: e.target.value })}
                  placeholder="Player ID"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 uppercase">
                  TeamName (الفريق)*
                </span>
                <input
                  type="text"
                  value={formMapping.TeamName || ''}
                  onChange={(e) => setFormMapping({ ...formMapping, TeamName: e.target.value })}
                  placeholder="الفريق"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 uppercase">
                  FullPlayerName (الاسم رباعي)
                </span>
                <input
                  type="text"
                  value={formMapping.FullPlayerName || ''}
                  onChange={(e) => setFormMapping({ ...formMapping, FullPlayerName: e.target.value })}
                  placeholder="اسم اللاعب رباعي"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 uppercase">
                  PlayerName (الاسم المختصر)
                </span>
                <input
                  type="text"
                  value={formMapping.PlayerName || ''}
                  onChange={(e) => setFormMapping({ ...formMapping, PlayerName: e.target.value })}
                  placeholder="الاسم"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 uppercase">
                  TeamBirthYear (مواليد الفريق)
                </span>
                <input
                  type="text"
                  value={formMapping.TeamBirthYear || ''}
                  onChange={(e) => setFormMapping({ ...formMapping, TeamBirthYear: e.target.value })}
                  placeholder="مواليد الفريق"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 uppercase">
                  Gender (النوع / الجنس)
                </span>
                <input
                  type="text"
                  value={formMapping.Gender || ''}
                  onChange={(e) => setFormMapping({ ...formMapping, Gender: e.target.value })}
                  placeholder="النوع"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 uppercase">
                  BirthYear (سنة الميلاد)
                </span>
                <input
                  type="text"
                  value={formMapping.BirthYear || ''}
                  onChange={(e) => setFormMapping({ ...formMapping, BirthYear: e.target.value })}
                  placeholder="مواليد"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 uppercase">
                  DateOfBirth (تاريخ الميلاد)
                </span>
                <input
                  type="text"
                  value={formMapping.DateOfBirth || ''}
                  onChange={(e) => setFormMapping({ ...formMapping, DateOfBirth: e.target.value })}
                  placeholder="تاريخ الميلاد"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* VALIDATION REPORT CARD */}
          {validationReport && (
            <div className={`p-5 rounded-2xl border ${
              validationReport.isValid 
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-black flex items-center gap-1.5 ${
                  validationReport.isValid ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                }`}>
                  {validationReport.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  {language === 'ar' ? 'تقرير التحقق الشامل من قاعدة البيانات' : 'Database Validation Report'}
                </span>
                <span className="text-[11px] font-bold">
                  {validationReport.passedChecks} / {validationReport.totalChecks} {language === 'ar' ? 'فحوصات ناجحة' : 'Passed'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {validationReport.checks.map(chk => (
                  <div key={chk.id} className="flex items-start gap-2 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{chk.title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">{chk.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleValidateForm}
              disabled={isValidating}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ShieldCheck className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'تشغيل فحص التحقق' : 'Run Validation'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveProfile}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition"
            >
              {language === 'ar' ? 'حفظ إعدادات الملف' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* PROFILES LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'ملفات قواعد البيانات المحفوظة (Database Profiles)' : 'Saved Database Profiles'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {profiles.length} {language === 'ar' ? 'ملفات مسجلة' : 'Profiles'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {profiles.map(prof => {
            const isActive = prof.databaseStatus === 'ACTIVE';
            return (
              <div
                key={prof.id}
                className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border transition ${
                  isActive 
                    ? 'border-emerald-500/60 shadow-sm bg-gradient-to-r from-emerald-50/20 to-transparent dark:from-emerald-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                        isActive 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <span className="text-xs font-mono text-slate-400 font-bold">{prof.id}</span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                        {prof.databaseName}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>SpreadsheetID: {prof.spreadsheetId}</span>
                      <span>•</span>
                      <span>PlayerSheet: {prof.playersSheetName}</span>
                      <span>•</span>
                      <span>Updated: {new Date(prof.updatedAt || prof.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Profile Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => setSwitchModalProfile(prof)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black hover:opacity-90 transition shadow-sm"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'تفعيل كقاعدة بيانات نشطة' : 'Activate Database'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(prof)}
                      className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={language === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SWITCH CONFIRMATION SAFETY MODAL */}
      {switchModalProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {language === 'ar' ? 'تأكيد تفعيل قاعدة بيانات جديدة' : 'Confirm Active Database Switch'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? `أنت على وشك تحويل النظام لاستخدام قاعدة البيانات [${switchModalProfile.databaseName}]. سيتم فحص الاتصال والتأكد من مطابقة هيكل البيانات، وتسجيل العملية في سجل التدقيق.`
                  : `You are about to switch the entire application to use [${switchModalProfile.databaseName}]. Validation checks will be executed and recorded in the audit log.`}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
              <div><strong>Target:</strong> {switchModalProfile.databaseName}</div>
              <div><strong>SpreadsheetID:</strong> {switchModalProfile.spreadsheetId}</div>
              <div><strong>Player Sheet:</strong> {switchModalProfile.playersSheetName}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSwitchModalProfile(null)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                disabled={isSwitching}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition flex items-center gap-1.5"
              >
                {isSwitching && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'ar' ? 'تأكيد وتفعيل الآن' : 'Confirm & Activate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 11.5 DIAGNOSTIC REPORT DRAWER / MODAL */}
      {diagnosticReport && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {diagnosticReport.title}
                </h3>
                <span className="text-[11px] text-slate-400">{diagnosticReport.timestamp}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${
              diagnosticReport.status === 'ALL_TESTS_PASSED'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}>
              {diagnosticReport.passed} / {diagnosticReport.total} {language === 'ar' ? 'ناجح' : 'Passed'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {diagnosticReport.tests?.map((t: any) => (
              <div
                key={t.ruleNumber}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3"
              >
                {t.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Rule {t.ruleNumber}: {t.testName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
