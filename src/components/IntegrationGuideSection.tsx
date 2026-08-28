import React from 'react';
import { BookOpen, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Database, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const IntegrationGuideSection: React.FC = () => {
  const { t, isRtl } = useApp();

  const steps = [
    {
      num: '01',
      title: t.guideStep1Title,
      desc: t.guideStep1Desc,
      tag: 'Google Sheet Setup'
    },
    {
      num: '02',
      title: t.guideStep2Title,
      desc: t.guideStep2Desc,
      tag: 'Config.gs'
    },
    {
      num: '03',
      title: t.guideStep3Title,
      desc: t.guideStep3Desc,
      tag: 'Exact Sheet Tab'
    },
    {
      num: '04',
      title: t.guideStep4Title,
      desc: t.guideStep4Desc,
      tag: 'Non-Destructive'
    },
    {
      num: '05',
      title: t.guideStep5Title,
      desc: t.guideStep5Desc,
      tag: 'Player Queries'
    },
    {
      num: '06',
      title: t.guideStep6Title,
      desc: t.guideStep6Desc,
      tag: 'Security Verified'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-500 text-white rounded-md uppercase tracking-wider">
                {t.guideHeaderBadge}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {t.guideHeaderTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {t.guideHeaderDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Safety Pledge Alert */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl p-4 flex items-start gap-3.5 transition-colors">
        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-xs text-emerald-950 dark:text-emerald-300">
            {t.guideSafetyTitle}
          </h4>
          <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-1 leading-relaxed">
            {t.guideSafetyDesc}
          </p>
        </div>
      </div>

      {/* 6 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map(step => (
          <div
            key={step.num}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-mono text-base font-black text-orange-600 dark:text-orange-400">
                  {step.num}
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                  {step.tag}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2">
                {step.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
