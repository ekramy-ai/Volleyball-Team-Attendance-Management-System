import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, UserSessionContext } from '../types/database';
import { AppViewId, AdminViewId, CoachViewId, DevViewId } from '../types/navigation';

export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export interface PresetAccount {
  email: string;
  name: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  teams: string[];
  permissionLevel: 'FULL_MANAGE' | 'RECORD_ONLY' | 'ALL_PERMISSIONS';
}

export const PRESET_ACCOUNTS: PresetAccount[] = [
  {
    email: 'admin@volleyball.club',
    name: 'الكابتن / إكرامي حسن (رئيس الجهاز - المدير الفني)',
    role: 'ADMIN',
    status: 'Active',
    teams: ['جميع الفرق الـ 20 الرسمية'],
    permissionLevel: 'ALL_PERMISSIONS'
  },
  {
    email: 'coach.ahmed@volleyball.club',
    name: 'الكابتن / أحمد سالم',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['راية براعم 2017 - بنات - أ', 'راية براعم 2015 - بنات - أ'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.mohamed.mostafa@volleyball.club',
    name: 'الكابتن / محمد مصطفى',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['راية براعم 2016 - بنات - أ', 'المؤسسة براعم 2015 - بنات', 'راية براعم 2015&2016 - بنات - ب'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.mostafa.ramadan@volleyball.club',
    name: 'الكابتن / مصطفى رمضان',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['المؤسسة براعم 2015 - بنين', 'المؤسسة تحت 17 سنة - بنات - أ'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.osama.kamal@volleyball.club',
    name: 'الكابتن / أسامة كمال',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['المؤسسة تحت 13 سنة - بنين - أ', 'المؤسسة تحت 13 سنة - بنات - ب'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.amr.helbawy@volleyball.club',
    name: 'الكابتن / عمرو الهلباوي',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['المؤسسة تحت 13 سنة - بنات - أ', 'المؤسسة تحت 15 سنة - بنات - أ'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.sameh.mostafa@volleyball.club',
    name: 'الكابتن / سامح مصطفى',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['راية تحت 13 سنة - بنات - أ', 'المؤسسة تحت 15 سنة - بنات - ج'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.omar.elgizawy@volleyball.club',
    name: 'الكابتن / عمر الجيزاوى',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['المؤسسة تحت 15 سنة - بنين - أ', 'المؤسسة تحت 15 سنة - بنات - ب', 'المؤسسة تحت 17 سنة - بنات - ب'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.haidy.fouad@volleyball.club',
    name: 'الكابتن / هايدى فؤاد',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['راية براعم 2018+ - بنات - أ'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.mai.samir@volleyball.club',
    name: 'الكابتن / مى سمير',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['راية براعم 2018+ - بنات - ب'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.enan@volleyball.club',
    name: 'الكابتن / عنان عاطف',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['راية براعم 2017 - بنات - ب'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.ahmed.hesham@volleyball.club',
    name: 'الكابتن / أحمد هشام',
    role: 'HEAD_COACH',
    status: 'Active',
    teams: ['راية تحت 19 سنة - بنات - أ'],
    permissionLevel: 'FULL_MANAGE'
  },
  {
    email: 'coach.aya@volleyball.club',
    name: 'الكابتن / أية الكريوني',
    role: 'ASSISTANT_COACH',
    status: 'Active',
    teams: ['راية براعم 2017 - بنات - أ'],
    permissionLevel: 'RECORD_ONLY'
  }
];

export interface Translations {
  // Common & Navigation
  appTitle: string;
  appSubtitle: string;
  phaseBadge: string;
  dbReadyBadge: string;
  resetSeed: string;
  resetting: string;
  backupJson: string;
  themeToggle: string;
  langToggle: string;
  phase1HeaderTitle: string;
  phase1HeaderDesc: string;

  // Phase 3 App Navigation (Admin)
  navDashboard: string;
  navAlerts: string;
  navSessions: string;
  navPlayers: string;
  navCoaches: string;
  navTeamAssignments: string;
  navAttendance: string;
  navReports: string;
  navSettings: string;
  navDatabaseSettings: string;

  // Phase 3 App Navigation (Coach)
  navCoachDashboard: string;
  navCoachSessions: string;
  navMyTeams: string;
  navCoachAttendance: string;
  navAttendanceHistory: string;
  navPlayerStats: string;

  // Common UI & Shell
  adminBadge: string;
  headCoachBadge: string;
  assistantCoachBadge: string;
  unregisteredBadge: string;
  devConsole: string;
  mainApp: string;
  switchRole: string;
  profile: string;
  logout: string;
  login: string;
  loginWithGoogle: string;
  activeTeam: string;
  allTeams: string;
  loadingData: string;
  errorTitle: string;
  retry: string;
  quickActions: string;
  sportsManagement: string;
  phase3Badge: string;
  selectRoleToSimulate: string;
  loggedOutMessage: string;
  accessDenied: string;
  accessDeniedDesc: string;
  mobileMenu: string;
  close: string;

  // Tabs (Dev Console)
  tabMaster: string;
  tabSecurity: string;
  tabAuxiliary: string;
  tabGas: string;
  tabDiagnostics: string;
  tabGuide: string;

  // Stats Pills
  statMasterPlayers: string;
  statPrimaryKey: string;
  statTeams: string;
  statDynamicMatch: string;
  statCoaches: string;
  statCoachesSub: string;
  statCoachTeams: string;
  statSecurityMappings: string;
  statSessions: string;
  statSessionSchedules: string;
  statAuditLogs: string;
  statTamperEvident: string;

  // Master Player Viewer
  masterBannerTitle: string;
  masterBannerBadge: string;
  masterBannerDesc: string;
  reloadMaster: string;
  filterAllTeams: string;
  searchPlaceholder: string;
  searchResultCount: string;
  colPlayerId: string;
  colFullName: string;
  colTeam: string;
  colGender: string;
  colPhone: string;
  colClub: string;
  colBirthYear: string;
  colRank: string;
  colActions: string;
  viewDetails: string;
  noPlayersFound: string;
  playerModalTitle: string;
  rawJsonData: string;
  arabicHeadersPreserved: string;
  dob: string;
  shortName: string;

  // Security Authorization Tester
  secHeaderBadge: string;
  secHeaderTitle: string;
  secHeaderDesc: string;
  secSelectCoach: string;
  secTargetTeam: string;
  secRunAuthTest: string;
  secTesting: string;
  secStatusAuthorized: string;
  secStatusBlocked: string;
  secAccessGranted: string;
  secAccessBlocked: string;
  secReason: string;
  secUser: string;
  secAuthorizedRoster: string;
  secIsolationAlertTitle: string;
  secIsolationAlertDesc: string;
  secAuditLogged: string;
  secAssigned: string;

  // Auxiliary Sheets
  auxSelectSheet: string;
  auxSheetRecords: string;
  auxRefresh: string;
  auxNoRecords: string;
  auxTrue: string;
  auxFalse: string;
  coachesDesc: string;
  coachTeamsDesc: string;
  sessionsDesc: string;
  attendanceDesc: string;
  auditLogDesc: string;
  settingsDesc: string;

  // Apps Script Hub
  gasHeaderBadge: string;
  gasHeaderTitle: string;
  gasHeaderDesc: string;
  gasCopyAll: string;
  gasCopiedAll: string;
  gasCopyFile: string;
  gasCopied: string;
  gasGuideTitle: string;
  gasStep1Title: string;
  gasStep1Desc: string;
  gasStep2Title: string;
  gasStep2Desc: string;
  gasStep3Title: string;
  gasStep3Desc: string;

  // Diagnostics Suite
  diagHeaderBadge: string;
  diagHeaderTitle: string;
  diagHeaderDesc: string;
  diagRunButton: string;
  diagRunning: string;
  diagPassedTitle: string;
  diagFailedTitle: string;
  diagStatus: string;
  diagPassBadge: string;
  diagFailBadge: string;
  diagReadyTitle: string;
  diagReadyDesc: string;

  // Integration Guide
  guideHeaderBadge: string;
  guideHeaderTitle: string;
  guideHeaderDesc: string;
  guideSafetyTitle: string;
  guideSafetyDesc: string;
  guideStep1Title: string;
  guideStep1Desc: string;
  guideStep2Title: string;
  guideStep2Desc: string;
  guideStep3Title: string;
  guideStep3Desc: string;
  guideStep4Title: string;
  guideStep4Desc: string;
  guideStep5Title: string;
  guideStep5Desc: string;
  guideStep6Title: string;
  guideStep6Desc: string;

  // Footer
  footerText: string;
}

const translations: Record<Language, Translations> = {
  ar: {
    // Navigation & Common
    appTitle: 'نظام إدارة حضور فرق الكرة الطائرة',
    appSubtitle: 'منظومة إدارة حضور وغياب وانضباط لاعبي فرق الكرة الطائرة',
    phaseBadge: 'المرحلة 3: واجهة التطبيق',
    dbReadyBadge: 'جاهزية الأمان والصلاحيات RBAC',
    resetSeed: 'إعادة ضبط البيانات الأولية',
    resetting: 'جاري الضبط...',
    backupJson: 'نسخ احتياطي JSON',
    themeToggle: 'تبديل المظهر (فاتح / داكن)',
    langToggle: 'English',
    phase1HeaderTitle: 'منظومة الكرة الطائرة المتكاملة',
    phase1HeaderDesc: 'واجهة عصرية متجاوبة للهواتف والأجهزة اللوحية والمكتب، تدعم الصلاحيات الأمنية للمديرين والمدربين.',

    // Phase 3 App Navigation (Admin)
    navDashboard: 'لوحة التحكم',
    navAlerts: 'التنبيهات الذكية',
    navSessions: 'الحصص التدريبية',
    navPlayers: 'اللاعبون',
    navCoaches: 'المدربون',
    navTeamAssignments: 'تعيينات الفرق',
    navAttendance: 'تسجيل الحضور',
    navReports: 'التقارير والانضباط',
    navSettings: 'إعدادات النظام',
    navDatabaseSettings: 'إعدادات قاعدة البيانات',

    // Phase 3 App Navigation (Coach)
    navCoachDashboard: 'لوحة المدرب',
    navCoachSessions: 'جدول التدريبات',
    navMyTeams: 'فرقي المعتمدة',
    navCoachAttendance: 'تسجيل الحضور',
    navAttendanceHistory: 'سجل الحضور',
    navPlayerStats: 'إحصائيات اللاعبين',

    // Common UI & Shell
    adminBadge: 'إدارة النادي',
    headCoachBadge: 'مدير فني',
    assistantCoachBadge: 'مدرب مساعد',
    unregisteredBadge: 'غير مسجل',
    devConsole: 'وحدة البنية التحتية والأكواد',
    mainApp: 'التطبيق الميداني',
    switchRole: 'تبديل الحساب للتجربة',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    loginWithGoogle: 'تسجيل الدخول باستخدام Google Workspace',
    activeTeam: 'الفريق الحالي',
    allTeams: 'كافة الفرق',
    loadingData: 'جاري تحميل البيانات...',
    errorTitle: 'حدث خطأ أثناء تحميل البيانات',
    retry: 'إعادة المحاولة',
    quickActions: 'إجراءات سريعة',
    sportsManagement: 'إدارة تدريبات وبطولات الكرة الطائرة',
    phase3Badge: 'Phase 3: Mobile UI & Navigation',
    selectRoleToSimulate: 'اختر الحساب النشط لاختبار صلاحيات وتجربة المستخدم:',
    loggedOutMessage: 'تم تسجيل الخروج بنجاح. يرجى تسجيل الدخول للوصول لمنظومة التدريب.',
    accessDenied: 'غير مصرح بالوصول لهذا القسم',
    accessDeniedDesc: 'يتطلب هذا القسم صلاحيات أعلى غير متوفرة في حسابك الحالي.',
    mobileMenu: 'القائمة الرئيسية',
    close: 'إغلاق',

    // Tabs (Dev Console)
    tabMaster: 'اللاعبون الأساسيون',
    tabSecurity: 'أمان وصلاحيات المدربين',
    tabAuxiliary: 'الجداول المساعدة الـ 6',
    tabGas: 'أكواد Apps Script (10 ملفات)',
    tabDiagnostics: 'الفحص التشخيصي الشامل',
    tabGuide: 'دليل الربط والتشغيل',

    // Stats Pills
    statMasterPlayers: 'اللاعبون بالجدول الرئيسي',
    statPrimaryKey: 'مفهرس بالمفتاح الأساسي',
    statTeams: 'الفرق المكتشفة',
    statDynamicMatch: 'مطابقة ديناميكية',
    statCoaches: 'سجل المدربين',
    statCoachesSub: 'إدارة ومدربون معتمدون',
    statCoachTeams: 'جدول COACH_TEAMS',
    statSecurityMappings: 'مصفوفة الصلاحيات',
    statSessions: 'الحصص التدريبية',
    statSessionSchedules: 'مواعيد التدريبات',
    statAuditLogs: 'سجلات الأمان',
    statTamperEvident: 'غير قابلة للتلاعب',

    // Master Player Viewer
    masterBannerTitle: 'قاعدة بيانات اللاعبين الرسمية الحالية (Google Sheets)',
    masterBannerBadge: 'المصدر الأساسي المعتمد',
    masterBannerDesc: 'المفتاح الأساسي: Player ID (مثل M-G150101954). يعتمد نظام الحضور والغياب على هذا المعرف الحصري لمنع تكرار الأسماء أو تضارب البيانات.',
    reloadMaster: 'تحديث بيانات الجدول الرئيسي',
    filterAllTeams: 'جميع الفرق المتاحة',
    searchPlaceholder: 'بحث برقم اللاعب (Player ID)، الاسم، الهاتف، أو النادي...',
    searchResultCount: 'لاعب معروض',
    colPlayerId: 'رقم اللاعب (Player ID)',
    colFullName: 'اسم اللاعب رباعي',
    colTeam: 'الفريق',
    colGender: 'النوع',
    colPhone: 'رقم التليفون',
    colClub: 'النادي',
    colBirthYear: 'مواليد',
    colRank: 'التقييم (Rank)',
    colActions: 'إجراءات',
    viewDetails: 'عرض الملف الكامل',
    noPlayersFound: 'لم يتم العثور على لاعبين يطابقون معايير البحث.',
    playerModalTitle: 'بيانات اللاعب الرسمية من الجدول الأساسي',
    rawJsonData: 'بيانات السطر الأصلي من Google Sheets:',
    arabicHeadersPreserved: 'العناوين العربية محفوظة 100% بدون أي تعديل',
    dob: 'تاريخ الميلاد',
    shortName: 'الاسم الأول',

    // Security Authorization Tester
    secHeaderBadge: 'بوابة الأمان الخلفية',
    secHeaderTitle: 'محرك عزل الصلاحيات وحماية الفرق (Google Apps Script)',
    secHeaderDesc: 'يتم تطبيق التحقق في الخلفية (AuthorizationService.gs) ولا يعتمد أبداً على إخفاء أزرار الواجهة فقط.',
    secSelectCoach: '1. اختر هوية المدرب للاختبار (جلسة محاكاة):',
    secTargetTeam: '2. الفريق المطلوب الوصول لبيانات لاعبيه:',
    secRunAuthTest: 'تنفيذ فحص الأمان بالخلفية',
    secTesting: 'جاري التحقق من الصلاحيات...',
    secStatusAuthorized: '200 OK - مصرح بالوصول',
    secStatusBlocked: '403 FORBIDDEN - محظور أمنياً',
    secAccessGranted: 'تم منح الإذن بنجاح',
    secAccessBlocked: 'تم رفض الوصول وتدوين الواقعة في AUDIT_LOG',
    secReason: 'سبب القرار الأمني:',
    secUser: 'المستخدم:',
    secAuthorizedRoster: 'كشف اللاعبين المسترجع للفريق المصرح به',
    secIsolationAlertTitle: 'تم عزل البيانات وحظر التسريب بنجاح:',
    secIsolationAlertDesc: 'فحص الخادم جدول COACH_TEAMS وتأكد من اقتصار المدرب على فرقه فقط.',
    secAuditLogged: 'تم إرسال حدث حظر الوصول إلى جدول AUDIT_LOG لتوثيق المحاولة.',
    secAssigned: 'الفرق المعتمدة للمدرب:',

    // Auxiliary Sheets
    auxSelectSheet: 'الجدول المساعد:',
    auxSheetRecords: 'سجل',
    auxRefresh: 'تحديث السجلات',
    auxNoRecords: 'لا توجد سجلات مسجلة في هذا الجدول.',
    auxTrue: 'نعم (TRUE)',
    auxFalse: 'لا (FALSE)',
    coachesDesc: 'بيانات المدربين وعناوين البريد الإلكتروني في Google Auth',
    coachTeamsDesc: 'مصفوفة ربط المدربين بالفرق وصلاحيات الوصول',
    sessionsDesc: 'سجل الحصص التدريبية والمواعيد',
    attendanceDesc: 'بيانات تسجيل الحضور والغياب المرتبطة بـ Player ID',
    auditLogDesc: 'سجل العمليات والأمان غير القابل للتلاعب',
    settingsDesc: 'إعدادات النادي والمنطقة الزمنية',

    // Apps Script Hub
    gasHeaderBadge: 'الحزمة البرمجية الكاملة (10 ملفات)',
    gasHeaderTitle: 'أكواد Google Apps Script المعيارية (.gs)',
    gasHeaderDesc: 'أكواد برمجية جاهزة للتثبيت في مشروع Google Sheet الحالي مع فرض الأمان الخلفي.',
    gasCopyAll: 'نسخ جميع الملفات الـ 10',
    gasCopiedAll: 'تم نسخ جميع الأكواد الـ 10 بنجاح!',
    gasCopyFile: 'نسخ محتوى الملف',
    gasCopied: 'تم النسخ!',
    gasGuideTitle: 'طريقة التثبيت في شيت Google الحالي:',
    gasStep1Title: '1. فتح محرر Apps Script',
    gasStep1Desc: 'افتح شيت Google الحالي، ثم اضغط على Extensions ← Apps Script.',
    gasStep2Title: '2. إنشاء الملفات العشرة',
    gasStep2Desc: 'أنشئ ملفات .gs بأسماء مطابقة للتبويبات أدناه والصق الكود الخاص بكل ملف.',
    gasStep3Title: '3. التشغيل الأولي الآمن',
    gasStep3Desc: 'اختر دالة setupVolleyballDatabase من ملف SetupDatabase.gs واضغط Run.',

    // Diagnostics Suite
    diagHeaderBadge: 'محرك الاختبارات الآلي',
    diagHeaderTitle: 'حزمة الفحص التشخيصي الشامل (Phase 1 & 2)',
    diagHeaderDesc: 'تجري فحوصات دقيقة لعمليات قراءة الجدول الرئيسي، مطابقة المفاتيح، وعزل الصلاحيات.',
    diagRunButton: 'تشغيل الفحص التشخيصي الشامل',
    diagRunning: 'جاري تشغيل الفحوصات...',
    diagPassedTitle: 'اجتازت جميع الفحوصات بنجاح 100%',
    diagFailedTitle: 'هناك بعض الفحوصات لم تجتز',
    diagStatus: 'الحالة:',
    diagPassBadge: 'ناجح',
    diagFailBadge: 'فشل',
    diagReadyTitle: 'محرك الفحص التشخيصي جاهز للتشغيل',
    diagReadyDesc: 'اضغط على زر الفحص لتنفيذ اختبارات تكامل استعلامات قاعدة البيانات وقواعد الأمان.',

    // Integration Guide
    guideHeaderBadge: 'دليل التشغيل',
    guideHeaderTitle: 'دليل ربط وتشغيل Google Sheet خطوة بخطوة',
    guideHeaderDesc: 'إرشادات عملية لتثبيت الأكواد وتشغيل النظام على جدول اللاعبين الفعلي.',
    guideSafetyTitle: 'ضمان سلامة الجدول الرئيسي:',
    guideSafetyDesc: 'نظامنا يحافظ تماماً على هيكل بيانات اللاعبين الحالية، لا يغير أسماء الأعمدة، ولا يحذف أي سجل.',
    guideStep1Title: 'ربط شيت Google الحالي',
    guideStep1Desc: 'افتح الشيت الحالي الذي يحتوي على بيانات اللاعبين، ثم افتح Apps Script.',
    guideStep2Title: 'ضبط معرف الشيت (اختياري)',
    guideStep2Desc: 'في ملف Config.gs، اترك SPREADSHEET_ID فارغاً إذا كان السكريبت مرتبطاً بالشيت مباشرة.',
    guideStep3Title: 'تأكيد اسم شيت اللاعبين',
    guideStep3Desc: 'في ملف Config.gs، تأكد من مطابقة MASTER_PLAYERS_SHEET_NAME لاسم تبويب اللاعبين.',
    guideStep4Title: 'تشغيل التهيئة الآمنة',
    guideStep4Desc: 'شغّل دالة setupVolleyballDatabase() لإنشاء الجداول المساعدة الـ 6 فقط.',
    guideStep5Title: 'فحص جلب اللاعبين بالفرق',
    guideStep5Desc: 'استدعِ دالة PlayerService.getPlayersByTeam("براعم 2015 بنات") للتأكد من الفلترة الدقيقة.',
    guideStep6Title: 'فحص عزل المدربين',
    guideStep6Desc: 'تأكد من أن المدرب لا يستطيع طلب فرق غير مخصصة له في جدول COACH_TEAMS.',

    // Footer
    footerText: 'منظومة إدارة حضور فرق الكرة الطائرة • الإصدار الميداني المتجاوب'
  },
  en: {
    // Navigation & Common
    appTitle: 'Volleyball Team Attendance System',
    appSubtitle: 'Volleyball Team Attendance & Discipline Management Platform',
    phaseBadge: 'Phase 3: Main UI & Navigation',
    dbReadyBadge: 'RBAC Security & Role Gating Ready',
    resetSeed: 'Reset Initial Seed Data',
    resetting: 'Resetting Data...',
    backupJson: 'Export Backup JSON',
    themeToggle: 'Toggle Theme (Light / Dark)',
    langToggle: 'العربية',
    phase1HeaderTitle: 'Volleyball Sports Management System',
    phase1HeaderDesc: 'Modern responsive interface for mobile, tablet, and desktop with role-based navigation for Directors and Coaches.',

    // Phase 3 App Navigation (Admin)
    navDashboard: 'Dashboard',
    navAlerts: 'Smart Alerts',
    navSessions: 'Training Sessions',
    navPlayers: 'Players',
    navCoaches: 'Coaches',
    navTeamAssignments: 'Team Assignments',
    navAttendance: 'Attendance',
    navReports: 'Reports & Discipline',
    navSettings: 'System Settings',
    navDatabaseSettings: 'Database Settings',

    // Phase 3 App Navigation (Coach)
    navCoachDashboard: 'Coach Dashboard',
    navCoachSessions: 'Training Schedule',
    navMyTeams: 'My Teams',
    navCoachAttendance: 'Take Attendance',
    navAttendanceHistory: 'Attendance History',
    navPlayerStats: 'Player Statistics',

    // Common UI & Shell
    adminBadge: 'Club Administration',
    headCoachBadge: 'Head Coach',
    assistantCoachBadge: 'Assistant Coach',
    unregisteredBadge: 'Unregistered',
    devConsole: 'Architecture & Code Hub',
    mainApp: 'Sports Field App',
    switchRole: 'Switch Test Identity',
    profile: 'User Profile',
    logout: 'Sign Out',
    login: 'Sign In',
    loginWithGoogle: 'Sign In with Google Workspace',
    activeTeam: 'Active Team',
    allTeams: 'All Teams',
    loadingData: 'Loading data...',
    errorTitle: 'Failed to load data',
    retry: 'Retry',
    quickActions: 'Quick Actions',
    sportsManagement: 'Volleyball Practice & Match Management',
    phase3Badge: 'Phase 3: Mobile UI & Navigation',
    selectRoleToSimulate: 'Select active Google account to test role permissions and UI experience:',
    loggedOutMessage: 'Signed out successfully. Please sign in to access team management.',
    accessDenied: 'Access Denied',
    accessDeniedDesc: 'This section requires higher administrative privileges.',
    mobileMenu: 'Menu',
    close: 'Close',

    // Tabs (Dev Console)
    tabMaster: 'Master Players',
    tabSecurity: 'Coach Security & Auth',
    tabAuxiliary: '6 System Auxiliary Sheets',
    tabGas: 'Apps Script (10 Files)',
    tabDiagnostics: 'Diagnostic Suite',
    tabGuide: 'Integration Guide',

    // Stats Pills
    statMasterPlayers: 'Master Players',
    statPrimaryKey: 'Indexed by Player ID',
    statTeams: 'Discovered Teams',
    statDynamicMatch: 'Dynamic Filter Matching',
    statCoaches: 'Coach Directory',
    statCoachesSub: 'Admin & Certified Staff',
    statCoachTeams: 'COACH_TEAMS Matrix',
    statSecurityMappings: 'Team Access Permissions',
    statSessions: 'Practice Sessions',
    statSessionSchedules: 'Session Timetables',
    statAuditLogs: 'Audit Log Entries',
    statTamperEvident: 'Tamper-Evident Records',

    // Master Player Viewer
    masterBannerTitle: 'Official Master Player Database (Google Sheets)',
    masterBannerBadge: 'Primary Single Source of Truth',
    masterBannerDesc: 'Primary Key: Player ID (e.g. M-G150101954). Attendance and excuse records strictly reference this immutable identifier.',
    reloadMaster: 'Reload Master Database',
    filterAllTeams: 'All Available Teams',
    searchPlaceholder: 'Search by Player ID, Full Name, Phone, or Club...',
    searchResultCount: 'Players displayed',
    colPlayerId: 'Player ID',
    colFullName: 'Full Player Name',
    colTeam: 'Team',
    colGender: 'Gender',
    colPhone: 'Phone',
    colClub: 'Club',
    colBirthYear: 'Birth Year',
    colRank: 'Rank',
    colActions: 'Actions',
    viewDetails: 'View Details',
    noPlayersFound: 'No master players found matching your criteria.',
    playerModalTitle: 'Official Master Player Profile',
    rawJsonData: 'Raw Google Sheet Master Row Data:',
    arabicHeadersPreserved: 'Arabic column headers preserved 100%',
    dob: 'Date of Birth',
    shortName: 'Short Name',

    // Security Authorization Tester
    secHeaderBadge: 'Backend Security Gateway',
    secHeaderTitle: 'Coach Team Authorization & Isolation Engine',
    secHeaderDesc: 'Enforced exclusively on the Google Apps Script backend (AuthorizationService.gs). Never relies on frontend hiding.',
    secSelectCoach: '1. Select Test Coach / Identity (Simulated Session):',
    secTargetTeam: '2. Target Team Roster Requested:',
    secRunAuthTest: 'Execute Backend Authorization Verification',
    secTesting: 'Verifying Access...',
    secStatusAuthorized: 'HTTP 200 OK - AUTHORIZED',
    secStatusBlocked: 'HTTP 403 FORBIDDEN - BLOCKED',
    secAccessGranted: 'Access Granted Successfully',
    secAccessBlocked: 'Access Strictly Denied & Logged to AUDIT_LOG',
    secReason: 'Security Decision Reason:',
    secUser: 'User:',
    secAuthorizedRoster: 'Authorized Master Players for Requested Team',
    secIsolationAlertTitle: 'Backend Security Isolation Verified:',
    secIsolationAlertDesc: 'The backend checked COACH_TEAMS for this user. The coach is restricted to assigned teams, preventing data leaks.',
    secAuditLogged: 'An unauthorized access attempt event was dispatched to AUDIT_LOG.',
    secAssigned: 'Assigned Teams:',

    // Auxiliary Sheets
    auxSelectSheet: 'Auxiliary Sheet:',
    auxSheetRecords: 'records',
    auxRefresh: 'Refresh',
    auxNoRecords: 'No records found in this sheet.',
    auxTrue: 'TRUE',
    auxFalse: 'FALSE',
    coachesDesc: 'Coach profiles & Google Auth email identities',
    coachTeamsDesc: 'Coach-to-Team authorization & access matrix',
    sessionsDesc: 'Scheduled practice sessions & timestamps',
    attendanceDesc: 'Player attendance logs referencing Player ID',
    auditLogDesc: 'Tamper-evident security & activity audit trail',
    settingsDesc: 'Club configuration parameters & timezone',

    // Apps Script Hub
    gasHeaderBadge: 'Production Suite (10 Modules)',
    gasHeaderTitle: 'Google Apps Script Architecture (.gs)',
    gasHeaderDesc: 'Modular Google Apps Script backend code designed for existing player databases with strict backend security.',
    gasCopyAll: 'Copy All 10 Modules',
    gasCopiedAll: 'Copied All 10 Files!',
    gasCopyFile: 'Copy File Content',
    gasCopied: 'Copied!',
    gasGuideTitle: 'How to Install into your Existing Google Sheet:',
    gasStep1Title: '1. Open Apps Script',
    gasStep1Desc: 'Open your existing Google Sheet, click Extensions → Apps Script.',
    gasStep2Title: '2. Create the 10 .gs Files',
    gasStep2Desc: 'Create each script file matching the tab names below and paste the respective code.',
    gasStep3Title: '3. Initialize Safely',
    gasStep3Desc: 'Select setupVolleyballDatabase in SetupDatabase.gs and click Run.',

    // Diagnostics Suite
    diagHeaderBadge: 'Automated Test Engine',
    diagHeaderTitle: 'Phase 1 & 2 Database & Security Diagnostic Suite',
    diagHeaderDesc: 'Executes end-to-end verification of master sheet queries, Player ID indexing, and coach access control.',
    diagRunButton: 'Run Diagnostic Suite',
    diagRunning: 'Running Diagnostics...',
    diagPassedTitle: 'All Diagnostics Passed (100%)',
    diagFailedTitle: 'Diagnostics Encountered Failures',
    diagStatus: 'STATUS:',
    diagPassBadge: 'PASS',
    diagFailBadge: 'FAIL',
    diagReadyTitle: 'Diagnostic Test Suite is Ready',
    diagReadyDesc: 'Click "Run Diagnostic Suite" to execute simulated unit and integration tests against master database queries and authorization rules.',

    // Integration Guide
    guideHeaderBadge: 'Integration Manual',
    guideHeaderTitle: 'Step-by-Step Existing Google Sheet Integration Guide',
    guideHeaderDesc: 'Complete deployment and testing manual for integrating your existing master player spreadsheet.',
    guideSafetyTitle: 'Master Database Immutability Guarantee:',
    guideSafetyDesc: 'The script strictly adheres to the Master Database Principle. No player columns are renamed, no records are deleted, no new IDs are generated, and master data remains pristine.',
    guideStep1Title: 'Connect the Existing Google Sheet',
    guideStep1Desc: 'Open your existing Google Sheet containing all official player records. Open Extensions → Apps Script to access the code editor.',
    guideStep2Title: 'Configure Spreadsheet ID (Optional for Bound Scripts)',
    guideStep2Desc: 'In Config.gs, leave SPREADSHEET_ID: null if the script is bound to your sheet, or supply the sheet ID string if using an external project.',
    guideStep3Title: 'Configure Name of Existing Player Sheet',
    guideStep3Desc: 'In Config.gs, set MASTER_PLAYERS_SHEET_NAME to match your exact master tab name (e.g. "PLAYERS_MASTER" or "اللاعبين").',
    guideStep4Title: 'Run Setup Safely (Non-Destructive)',
    guideStep4Desc: 'In SetupDatabase.gs, run setupVolleyballDatabase(). It creates only the 6 auxiliary sheets without altering the master database.',
    guideStep5Title: 'Test Retrieving Players by Team',
    guideStep5Desc: 'Call PlayerService.getPlayersByTeam("براعم 2015 بنات") to verify that players are filtered dynamically by exact Arabic team name.',
    guideStep6Title: 'Test Coach Authorization Security',
    guideStep6Desc: 'Run AuthorizationService.verifyTeamAccess(coachEmail, teamName) to confirm backend access isolation before Phase 2.',

    // Footer
    footerText: 'Volleyball Team Attendance Management System • Mobile-First Responsive App'
  }
};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: Translations;
  isRtl: boolean;

  // Phase 3 Session & Role Navigation
  currentUser: UserSessionContext | null;
  setCurrentUser: (user: UserSessionContext | null) => void;
  currentView: AppViewId;
  setCurrentView: (view: AppViewId) => void;
  appMode: 'APP' | 'DEV_TOOLS';
  setAppMode: (mode: 'APP' | 'DEV_TOOLS') => void;
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  availableTeams: string[];
  
  // Mobile and Profile Drawers
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  // User Actions
  switchUser: (email: string) => Promise<void>;
  logout: () => void;
  login: (email: string) => Promise<void>;
  isSessionLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Language State - default to Arabic ('ar') as preferred
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('vb_attendance_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  // Theme State - default to 'dark' or 'light'
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('vb_attendance_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // default to modern athletic dark theme
  });

  // Current View
  const [currentView, setCurrentViewState] = useState<AppViewId>('admin-dashboard');
  const [appMode, setAppMode] = useState<'APP' | 'DEV_TOOLS'>('APP');

  // User Session State
  const [currentUser, setCurrentUser] = useState<UserSessionContext | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('براعم 2015 بنات');
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);

  // Modals & Drawers
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vb_attendance_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('vb_attendance_theme', t);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setCurrentView = (view: AppViewId) => {
    setCurrentViewState(view);
    setIsMobileDrawerOpen(false);
  };

  // Fetch session data from backend for given email
  const fetchSession = async (email: string) => {
    setIsSessionLoading(true);
    try {
      const res = await fetch(`/api/auth/me?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.session) {
        const session: UserSessionContext = data.session;
        setCurrentUser(session);
        if (session.authorizedTeams && session.authorizedTeams.length > 0) {
          setSelectedTeam(session.authorizedTeams[0]);
        }
        
        // Update default view based on role
        if (session.role === 'ADMIN') {
          setCurrentViewState(prev => prev.startsWith('admin-') ? prev : 'admin-dashboard');
        } else {
          setCurrentViewState(prev => prev.startsWith('coach-') ? prev : 'coach-dashboard');
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsSessionLoading(false);
    }
  };

  // Load available teams from backend
  const loadTeams = async () => {
    try {
      const res = await fetch('/api/database/overview');
      const data = await res.json();
      if (data.success && data.distinctTeams) {
        setAvailableTeams(data.distinctTeams);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  // Initialize with default admin session or stored session
  useEffect(() => {
    const savedEmail = localStorage.getItem('vb_active_email') || 'admin@volleyball.club';
    fetchSession(savedEmail);
    loadTeams();
  }, []);

  const switchUser = async (email: string) => {
    localStorage.setItem('vb_active_email', email);
    await fetchSession(email);
    setIsProfileModalOpen(false);
  };

  const login = async (email: string) => {
    localStorage.setItem('vb_active_email', email);
    await fetchSession(email);
  };

  const logout = () => {
    localStorage.removeItem('vb_active_email');
    setCurrentUser(null);
    setIsProfileModalOpen(false);
  };

  // Sync HTML attributes whenever language or theme changes
  useEffect(() => {
    const isArabic = language === 'ar';
    document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
    
    if (isArabic) {
      document.documentElement.classList.add('font-arabic');
    } else {
      document.documentElement.classList.remove('font-arabic');
    }
  }, [language]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const value: AppContextType = {
    language,
    setLanguage,
    toggleLanguage,
    theme,
    setTheme,
    toggleTheme,
    t: translations[language],
    isRtl: language === 'ar',

    currentUser,
    setCurrentUser,
    currentView,
    setCurrentView,
    appMode,
    setAppMode,
    selectedTeam,
    setSelectedTeam,
    availableTeams,

    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,

    switchUser,
    logout,
    login,
    isSessionLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
