import React, { useMemo } from 'react';
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
  AlertCircle,
  RefreshCw,
  Download
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
  isSaving?: boolean;
  syncConnected: boolean;
  hasSyncConfig?: boolean;
  folderName?: string;
  activeFileName?: string;
  onOpenSync: () => void;
  onReloadSync?: () => void;
  onSaveNow?: () => void;
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
  isSaving = false,
  syncConnected,
  hasSyncConfig = false,
  folderName = '',
  activeFileName = '',
  onOpenSync,
  onReloadSync,
  onSaveNow,
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

  // Dynamische Erkennung des systemspezifischen Icons
  const appIconSrc = useMemo(() => {
    if (typeof window === 'undefined') return '/icon-192.png';
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      return '/apple-touch-icon.png';
    }
    if (/Android/.test(ua)) {
      return '/icon-192.png';
    }
    return '/icon-192.png';
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top Row: App Title + Quick Stats + Primary Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-xs flex items-center justify-center flex-shrink-0 bg-transparent">
              <img
                src={appIconSrc}
                alt="Unterrichtsplaner"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icon-192.png';
                }}
              />
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

            {/* Direct SYNC neu laden Button when Sync is configured */}
            {hasSyncConfig && onReloadSync && (
              <button
                type="button"
                onClick={onReloadSync}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all shadow-xs hover:border-indigo-300"
                title="SYNC neu laden: Aktuelle Datei aus dem Sync-Ordner neu laden (z. B. nach FreeFileSync-Abgleich)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">SYNC neu laden</span>
              </button>
            )}

            {/* Direct 1-Click Save button for Firefox, Linux & non-FSA environments when data changed */}
            {!syncConnected && isDirty && onSaveNow && (
              <button
                type="button"
                onClick={onSaveNow}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white transition-all shadow-xs"
                title={`Änderungen sind im lokalen Browser gesichert. Klicke hier, um die Datei ${activeFileName || 'unterrichtsplanung_backup.json'} für FreeFileSync auf deiner Festplatte zu speichern.`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON speichern</span>
              </button>
            )}

            {/* Sync & Hub Button */}
            <button
              type="button"
              onClick={onOpenSync}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs ${
                syncConnected
                  ? isSaving
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : hasSyncConfig
                  ? 'bg-slate-800 hover:bg-slate-900 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
              title={
                syncConnected
                  ? isSaving
                    ? 'Schreibt Änderungen direkt in die JSON-Datei auf der Festplatte...'
                    : 'Live-Sync verbunden: Änderungen werden automatisch direkt in deiner JSON-Datei auf der Festplatte gespeichert.'
                  : hasSyncConfig
                  ? `Sync-Ordner eingerichtet (${folderName || 'Aktiv'}). Klicke für Details, Datei-Export oder FreeFileSync-Optionen.`
                  : 'Synchronisation & Backup öffnen (FreeFileSync, iPad & PC)'
              }
            >
              {syncConnected ? (
                isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-200" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                )
              ) : hasSyncConfig && !isDirty ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <FolderSync className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <span className="font-semibold">
                {syncConnected
                  ? isSaving
                    ? 'Speichert...'
                    : folderName
                    ? `Sync: ${folderName.length > 14 ? folderName.slice(0, 12) + '…' : folderName}`
                    : 'Sync aktiv'
                  : hasSyncConfig
                  ? folderName
                    ? `Sync: ${folderName.length > 10 ? folderName.slice(0, 8) + '…' : folderName}`
                    : 'Sync-Hub'
                  : 'Sync & Backup'}
              </span>
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
