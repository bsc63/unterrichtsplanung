import React from 'react';
import { 
  FolderSync, 
  Printer, 
  Copy, 
  CalendarDays, 
  FileDown, 
  FileUp, 
  LayoutList, 
  Table as TableIcon,
  StickyNote,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PlannerData } from '../types';

interface HeaderProps {
  data: PlannerData;
  activeTab: number;
  viewMode: 'table' | 'cards';
  setViewMode: (mode: 'table' | 'cards') => void;
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
  isDirty: boolean;
  syncConnected: boolean;
  folderName?: string;
  onOpenSync: () => void;
  onOpenAutoDate: () => void;
  onOpenCopyCol: () => void;
  onOpenTabManager: () => void;
  onPrint: () => void;
  onExport: () => void;
  onImportClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  activeTab,
  viewMode,
  setViewMode,
  showNotes,
  setShowNotes,
  isDirty,
  syncConnected,
  folderName = '',
  onOpenSync,
  onOpenAutoDate,
  onOpenCopyCol,
  onOpenTabManager,
  onPrint,
  onExport,
  onImportClick,
}) => {
  const activeEntries = data.rows[activeTab]?.entries || [];
  const completedCount = activeEntries.filter(e => e.done).length;
  const currentClassName = data.tabs[activeTab] || 'Klasse';
  const hasNotes = Boolean(data.rows[activeTab]?.text?.trim());

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top Row: App Title + Quick Stats + Primary Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs flex items-center justify-center flex-shrink-0">
              <img src="/apple-touch-icon.png" alt="Icon" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
                  Unterrichtsplaner
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-150">
                  {currentClassName}
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                <span>{activeEntries.length} Einheiten</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium">{completedCount} erledigt</span>
              </div>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* View Mode Switcher: Cards vs Table */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tabellen-Ansicht"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabelle</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Karten-Ansicht (Mobil optimiert)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Karten</span>
              </button>
            </div>

            {/* Notes Toggle Button */}
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showNotes
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={showNotes ? 'Notizen ausblenden' : 'Notizen einblenden'}
            >
              <StickyNote className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Notizen</span>
              {hasNotes && !showNotes && (
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              )}
            </button>

            {/* Sync Button (Works on iPad & Desktop!) */}
            <button
              type="button"
              onClick={onOpenSync}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs ${
                syncConnected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : isDirty
                  ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
              title="Synchronisation & Backup öffnen (iPad, Desktop & Cloud)"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span className="font-semibold">
                {syncConnected
                  ? folderName
                    ? `Sync: ${folderName.length > 14 ? folderName.slice(0, 12) + '…' : folderName}`
                    : 'Sync aktiv'
                  : 'Sync'}
              </span>
              {isDirty && !syncConnected && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              )}
            </button>

            {/* Print / PDF */}
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 transition-colors shadow-xs"
              title="Drucken / Als PDF speichern (Vollständige Klasse mit allen Notizen und Tabelle)"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>PDF / Drucken</span>
            </button>
          </div>
        </div>

        {/* Secondary Utility Row (Compact toolbar for tools) */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              type="button"
              onClick={onOpenAutoDate}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 transition-colors whitespace-nowrap"
            >
              <CalendarDays className="w-3 h-3 text-indigo-600" />
              <span>Daten eintragen</span>
            </button>

            <button
              type="button"
              onClick={onOpenCopyCol}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 transition-colors whitespace-nowrap"
            >
              <Copy className="w-3 h-3 text-emerald-600" />
              <span>Spalte kopieren</span>
            </button>

            <button
              type="button"
              onClick={onOpenTabManager}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 transition-colors whitespace-nowrap"
            >
              <Layers className="w-3 h-3 text-blue-600" />
              <span>Reiter verwalten</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors whitespace-nowrap"
              title="Backup JSON herunterladen"
            >
              <FileDown className="w-3 h-3 text-purple-600" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={onImportClick}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors whitespace-nowrap"
              title="Backup JSON importieren"
            >
              <FileUp className="w-3 h-3 text-amber-600" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
