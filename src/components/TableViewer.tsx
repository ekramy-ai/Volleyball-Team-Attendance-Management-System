import React, { useState, useMemo } from 'react';
import { Search, Key, Download, CheckCircle, AlertCircle, Clock, Eye, Sparkles } from 'lucide-react';
import { SheetDefinition } from '../types/database';

interface TableViewerProps {
  tableName: string;
  records: any[];
  sheetDefinition?: SheetDefinition;
  onRefresh: () => void;
}

export const TableViewer: React.FC<TableViewerProps> = ({
  tableName,
  records,
  sheetDefinition
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter(row =>
      Object.values(row).some(
        val => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [records, searchTerm]);

  const columns = sheetDefinition?.columns || (records.length > 0 ? Object.keys(records[0]) : []);
  const primaryKey = sheetDefinition?.primaryKey;

  const downloadTableCsv = () => {
    if (records.length === 0) return;
    const headers = columns;
    const rows = filteredRecords.map(row =>
      headers.map(h => `"${(row[h] !== undefined ? String(row[h]) : '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tableName}_sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-900 text-amber-400 rounded-md">
              SHEET
            </span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {tableName}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({filteredRecords.length} records)
            </span>
          </div>
          {sheetDefinition?.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {sheetDefinition.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${tableName}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <button
            onClick={downloadTableCsv}
            disabled={records.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Download table as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Schema / Columns badge preview */}
      <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Schema Columns:</span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {columns.map(col => {
            const isPk = col === primaryKey;
            const isReq = sheetDefinition?.requiredFields.includes(col);

            return (
              <span
                key={col}
                className={`px-2 py-0.5 rounded font-mono text-[10px] shrink-0 flex items-center gap-1 border ${
                  isPk
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold'
                    : isReq
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isPk && <Key className="w-2.5 h-2.5 text-amber-600" />}
                {col}
                {isReq && !isPk && <span className="text-red-500 font-bold">*</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900 text-slate-200 uppercase font-semibold text-[10px] tracking-wider sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3 border-b border-slate-800 w-10 text-center">#</th>
              {columns.map(col => (
                <th key={col} className="py-2.5 px-3 border-b border-slate-800 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {col === primaryKey && <Key className="w-3 h-3 text-amber-400" />}
                    <span>{col}</span>
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3 border-b border-slate-800 w-16 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  No records match your query in <span className="font-semibold">{tableName}</span>
                </td>
              </tr>
            ) : (
              filteredRecords.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedRecord(row)}
                >
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">
                    {idx + 1}
                  </td>
                  {columns.map(col => {
                    const val = row[col];
                    return (
                      <td key={col} className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-200">
                        {renderCellValue(col, val)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedRecord(row);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Inspect record JSON"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Record Details — {tableName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 text-xs">
              {Object.entries(selectedRecord).map(([key, val]) => (
                <div key={key} className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    {key}:
                  </span>
                  <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200 break-words">
                    {val === null || val === undefined ? (
                      <span className="italic text-slate-400">null</span>
                    ) : typeof val === 'boolean' ? (
                      val ? 'TRUE' : 'FALSE'
                    ) : (
                      String(val)
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 rounded-lg transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function renderCellValue(colName: string, val: any) {
  if (val === null || val === undefined || val === '') {
    return <span className="text-slate-400 italic text-[11px]">—</span>;
  }

  // Status pills
  if (colName === 'PlayerStatus') {
    const colorMap: Record<string, string> = {
      Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      Injured: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      Suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      Inactive: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      Transferred: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorMap[val] || 'bg-slate-100 text-slate-700'}`}>
        {val}
      </span>
    );
  }

  if (colName === 'Status') {
    const colorMap: Record<string, string> = {
      PRESENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      LATE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      ABSENT: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      EXCUSED: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorMap[val] || 'bg-slate-100 text-slate-700'}`}>
        {val}
      </span>
    );
  }

  if (colName === 'Role') {
    const colorMap: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      HEAD_COACH: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      ASSISTANT_COACH: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorMap[val] || 'bg-slate-100 text-slate-700'}`}>
        {val}
      </span>
    );
  }

  if (colName === 'PermissionLevel') {
    return (
      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        {val}
      </span>
    );
  }

  if (colName === 'LateMinutes' && Number(val) > 0) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
        <Clock className="w-3 h-3" />
        {val} min
      </span>
    );
  }

  if (typeof val === 'boolean') {
    return (
      <span className={`font-mono font-bold text-[10px] ${val ? 'text-emerald-600' : 'text-slate-400'}`}>
        {val ? 'TRUE' : 'FALSE'}
      </span>
    );
  }

  // Key IDs
  if (typeof val === 'string' && (val.startsWith('PLR-') || val.startsWith('T00') || val.startsWith('COACH-') || val.startsWith('SESSION-') || val.startsWith('ATT-') || val.startsWith('ASSIGN-') || val.startsWith('LOG-'))) {
    return <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{val}</span>;
  }

  return <span>{String(val)}</span>;
}
