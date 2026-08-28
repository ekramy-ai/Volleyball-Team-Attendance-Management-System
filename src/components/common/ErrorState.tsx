import React from 'react';
import { AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isAccessDenied?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  isAccessDenied = false
}) => {
  const { t, language } = useApp();
  const displayTitle = title || (isAccessDenied ? t.accessDenied : t.errorTitle);

  return (
    <div className="p-6 md:p-8 rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-4 max-w-md mx-auto my-6 transition-colors">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
        {isAccessDenied ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-black text-rose-900 dark:text-rose-200">
          {displayTitle}
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t.retry}</span>
        </button>
      )}
    </div>
  );
};
