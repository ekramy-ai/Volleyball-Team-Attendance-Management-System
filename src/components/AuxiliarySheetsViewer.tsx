import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, FileText, CheckCircle2, Shield, Calendar, Clock, Settings, AlertOctagon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuxiliarySheetsViewer: React.FC = () => {
  const { t } = useApp();
  const [selectedSheet, setSelectedSheet] = useState<string>('COACHES');
  const [sheetsData, setSheetsData] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const auxiliarySheetsList = [
    { key: 'COACHES', name: 'COACHES', desc: t.coachesDesc, icon: Shield, color: 'text-teal-500' },
    { key: 'COACH_TEAMS', name: 'COACH_TEAMS', desc: t.coachTeamsDesc, icon: Layers, color: 'text-sky-500' },
    { key: 'TRAINING_SESSIONS', name: 'TRAINING_SESSIONS', desc: t.sessionsDesc, icon: Calendar, color: 'text-purple-500' },
    { key: 'ATTENDANCE', name: 'ATTENDANCE', desc: t.attendanceDesc, icon: Clock, color: 'text-emerald-500' },
    { key: 'AUDIT_LOG', name: 'AUDIT_LOG', desc: t.auditLogDesc, icon: AlertOctagon, color: 'text-orange-500' },
    { key: 'SYSTEM_SETTINGS', name: 'SYSTEM_SETTINGS', desc: t.settingsDesc, icon: Settings, color: 'text-slate-500' }
  ];

  const fetchAuxiliarySheets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auxiliary/all');
      const data = await res.json();
      if (data.success && data.sheets) {
        setSheetsData(data.sheets);
      }
    } catch (err) {
      console.error('Failed to load auxiliary sheets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuxiliarySheets();
  }, []);

  const currentRecords = sheetsData[selectedSheet] || [];
  const currentHeaders = currentRecords.length > 0 ? Object.keys(currentRecords[0]) : [];

  return (
    <div className="space-y-4">
      {/* 6 Auxiliary Sheets Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {auxiliarySheetsList.map(sheet => {
          const isSelected = selectedSheet === sheet.key;
          const count = sheetsData[sheet.key]?.length || 0;
          const IconComp = sheet.icon;

          return (
            <button
              key={sheet.key}
              onClick={() => setSelectedSheet(sheet.key)}
              className={`p-3.5 rounded-2xl border text-start transition-all ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                  : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <IconComp className={`w-4 h-4 ${sheet.color}`} />
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                  {count}
                </span>
              </div>
              <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 mt-2 truncate">
                {sheet.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {sheet.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sheet Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
              {selectedSheet}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({currentRecords.length} {t.auxSheetRecords})
            </span>
          </div>
          <button
            onClick={fetchAuxiliarySheets}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.auxRefresh}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]">
              <tr>
                {currentHeaders.map(h => (
                  <th key={h} className="px-4 py-2.5 font-bold whitespace-nowrap text-start">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={currentHeaders.length || 1} className="text-center py-10 text-slate-400 text-xs">
                    {t.auxNoRecords}
                  </td>
                </tr>
              ) : (
                currentRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    {currentHeaders.map(col => {
                      const val = row[col];
                      const isBoolean = typeof val === 'boolean';
                      return (
                        <td key={col} className="px-4 py-2.5 whitespace-nowrap text-slate-800 dark:text-slate-200">
                          {isBoolean ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                val
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {val ? t.auxTrue : t.auxFalse}
                            </span>
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
