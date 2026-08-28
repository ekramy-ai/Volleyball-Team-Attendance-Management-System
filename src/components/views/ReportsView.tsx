import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Download, Award, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ReportsView: React.FC = () => {
  const { t, language } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {t.navReports}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar' ? 'تقارير نسب الالتزام، الإنذارات التأديبية، ومتابعة الغياب المستمر' : 'Attendance Rates, Disciplinary Warnings & Chronic Absence Metrics'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => window.open('/api/master/players', '_blank')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'تصدير التقرير الكامل' : 'Export Full Report'}</span>
        </button>
      </div>

      {/* Reports Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'متوسط نسبة الحضور العام' : 'Average Attendance Rate'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">96.4%</div>
          <span className="text-[10px] text-slate-400 font-semibold block">
            {language === 'ar' ? 'معدل التزام مرتفع لفرق البراعم والناشئين' : 'High commitment across all youth squads'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'الإنذارات التأديبية النشطة' : 'Active Discipline Alerts'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">0</div>
          <span className="text-[10px] text-emerald-600 font-semibold block">
            {language === 'ar' ? 'لا توجد حالات غياب بدون إذن متكرر' : 'No chronic unexcused absences'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'اللاعبون الأكثر التزاماً (100%)' : 'Perfect Attendance (100%)'}
            </span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400">10</div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
            {language === 'ar' ? 'مؤهلون لدرع التميز الرياضي' : 'Eligible for Excellence Badge'}
          </span>
        </div>
      </div>

      {/* Disciplinary Rules Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span>{language === 'ar' ? 'لائحة الانضباط المعتمدة في النظام' : 'Official Attendance & Discipline Policy'}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">1. {language === 'ar' ? 'غياب حصة واحدة' : '1 Absence'}</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              {language === 'ar' ? 'تنبيه شفهي من المدرب المباشر وتسجيل السبب في الملاحظات.' : 'Verbal notification from the coach and note logged.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">2. {language === 'ar' ? 'غياب حصتين متتاليتين' : '2 Consecutive Absences'}</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              {language === 'ar' ? 'إنذار أول وتواصل إداري مع ولي أمر اللاعب للتحقق.' : 'First warning notice & administrative check with guardian.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">3. {language === 'ar' ? '3 غيابات متتالية' : '3 Consecutive Absences'}</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              {language === 'ar' ? 'استبعاد مؤقت من قائمة المباراة الرسمية لحين تقديم عذر معتمد.' : 'Temporary match roster suspension pending official excuse.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
