import React from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LoadingStateProps {
  message?: string;
  type?: 'fullscreen' | 'inline' | 'skeleton';
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message, 
  type = 'inline',
  rows = 5 
}) => {
  const { t } = useApp();
  const displayMsg = message || t.loadingData;

  if (type === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs p-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center max-w-xs text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
            <span className="absolute text-2xl select-none">🏐</span>
          </div>
          <div>
            <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm tracking-tight">
              {t.appTitle}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {displayMsg}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <div className="space-y-3 w-full animate-pulse p-2">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3"></div>
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div 
              key={i} 
              className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 w-full"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-3 border-orange-500/20 border-t-orange-500 animate-spin"></div>
        <span className="absolute text-sm select-none">🏐</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {displayMsg}
      </p>
    </div>
  );
};
