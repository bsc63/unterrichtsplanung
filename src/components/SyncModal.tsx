import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderSync, 
  Share2, 
  FolderOpen, 
  Upload, 
  History, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Apple, 
  Monitor, 
  Smartphone,
  Copy,
  Check,
  QrCode,
  FileText,
  RefreshCw
} from 'lucide-react';
import { PlannerData, Snapshot } from '../types';
import { 
  isFsaSupported, 
  isIosOrIpad, 
  canWebShareFiles, 
  shareOrSaveToFiles, 
  downloadJsonFile, 
  getSnapshots,
  SYNC_FILENAME 
} from '../utils/storage';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PlannerData;
  onRestoreData: (data: PlannerData) => void;
  syncConnected: boolean;
  activeFileName?: string;
  folderName?: string;
  onConnectFolder: () => void;
  onDisconnectFolder: () => void;
  onImportClick: () => void;
  onOpenQrSync: () => void;
  onSaveNow?: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  data,
  onRestoreData,
  syncConnected,
  activeFileName = SYNC_FILENAME,
  folderName = '',
  onConnectFolder,
  onDisconnectFolder,
  onImportClick,
  onOpenQrSync,
  onSaveNow,
}) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getSnapshots());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShareToFiles = async () => {
    const ok = await shareOrSaveToFiles(data);
    if (ok) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FolderSync className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Synchronisation & Backup Hub
              </h2>
              <p className="text-xs text-indigo-200">
                FreeFileSync, lokaler Ordner-Sync, iPad & Smartphone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          
          {/* Section 1: FreeFileSync / Ordner-Sync (Desktop Chrome / Edge / Brave / Opera) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FolderSync className="w-4 h-4 text-purple-600" />
                <span>FreeFileSync & Lokaler Ordner-Sync</span>
              </h3>
              {syncConnected && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aktiv synchronisiert
                </span>
              )}
            </div>

            {/* Main Action: FreeFileSync Datei laden */}
            <div className={`p-4 rounded-xl border transition-all ${
              syncConnected 
                ? 'border-emerald-300 bg-emerald-50/60' 
                : 'border-purple-200 bg-gradient-to-br from-purple-50/80 to-indigo-50/50'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-purple-700" />
                      <span>FreeFileSync Datei laden</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Wählt einen lokalen Ordner (z.&nbsp;B. deinen <strong>FreeFileSync-Ordner</strong>). Die App lädt die aktuelle <code className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded text-[11px] font-mono">*.json</code> automatisch, merkt sich den Ordner dauerhaft und speichert auch automatisch dort in dieser <code className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded text-[11px] font-mono">*.json</code>. Klickt man erneut, kann ein anderer Ordner gewählt werden.
                  </p>
                  
                  {syncConnected && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-2 text-xs text-emerald-900">
                      <span className="font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Gemerkt:
                      </span>
                      <span className="bg-white/80 border border-emerald-200 px-2 py-0.5 rounded font-mono font-medium text-slate-800">
                        {folderName || 'Ausgewählter Ordner'}
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="bg-white/80 border border-emerald-200 px-2 py-0.5 rounded font-mono font-medium text-indigo-700 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        {activeFileName}
                      </span>
                      <span className="text-[11px] text-emerald-700 ml-1">
                        (Automatisches Speichern aktiv)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0 self-start sm:self-center">
                  {syncConnected ? (
                    <>
                      {onSaveNow && (
                        <button
                          type="button"
                          onClick={onSaveNow}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                          title={`Aktuellen Stand jetzt sofort in ${activeFileName} speichern`}
                        >
                          <span>In Datei speichern</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onConnectFolder}
                        className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-white hover:bg-purple-50 border border-purple-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        title="FreeFileSync Datei laden: Anderen Ordner wählen"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Anderen Ordner wählen</span>
                      </button>
                      <button
                        type="button"
                        onClick={onDisconnectFolder}
                        className="px-3 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                        title="Verbindung trennen"
                      >
                        Trennen
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={onConnectFolder}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>FreeFileSync Datei laden</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Banner for iPad */}
          {isIosOrIpad && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
              <Apple className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 text-xs sm:text-sm">
                  Hinweis für iPad &amp; iPhone
                </h4>
                <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                  Apple Safari auf iOS erlaubt Webseiten aus Sicherheitsgründen keinen direkten Ordner-Zugriff im Hintergrund.
                  Nutze auf dem iPad einfach <strong>„In Dateien sichern“</strong> – dort kannst du direkt deinen <strong>FreeFileSync-, iCloud Drive- oder Nextcloud-Ordner</strong> anwählen.
                </p>
              </div>
            </div>
          )}

          {/* Section 2: Direct File Actions for iPad, Mobile & Fallbacks */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>Direkte Datei-Aktionen (iPad / Smartphone / Manueller Import)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Button 1: Save to Files (Share Sheet) */}
              <button
                type="button"
                onClick={handleShareToFiles}
                className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    <span>In „Dateien“ sichern</span>
                  </span>
                  {shareSuccess && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Erfolgreich!
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Öffnet das iPad-Teilen-Menü („In Dateien sichern“ in iCloud Drive, OneDrive oder FreeFileSync-Ordner).
                </p>
              </button>

              {/* Button 2: Manual Backup Import */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onImportClick();
                }}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-600" />
                    <span>Backup importieren</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Wähle manuell eine <code className="text-[11px] font-mono">*.json</code> Datei aus, um alle Klassen und Notizen wiederherzustellen.
                </p>
              </button>

              {/* Button 3: Download Current JSON file directly */}
              <button
                type="button"
                onClick={() => downloadJsonFile(data, activeFileName)}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>JSON direkt herunterladen</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Speichert die aktuelle Planungsdatei als <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">{activeFileName}</code>.
                </p>
              </button>

              {/* Button 4: Device-to-Device / QR Code Transfer */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQrSync();
                }}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>iPad ↔ PC Direktübertragung</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Daten blitzschnell zwischen iPad und Computer übertragen via QR-Code oder Text-Code.
                </p>
              </button>
            </div>
          </div>

          {/* Section 3: Automatic Snapshots / Safety Net */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-600" />
                <span>Automatische Wiederherstellungspunkte ({snapshots.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleCopyJson}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Kopiert!' : 'JSON in Zwischenablage'}</span>
              </button>
            </div>

            {snapshots.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Noch keine Sicherungspunkte vorhanden.</p>
            ) : (
              <div className="divide-y divide-slate-150 border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-slate-50">
                {snapshots.slice(0, 6).map((snap, i) => {
                  const dateStr = new Date(snap.timestamp).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const tabCount = snap.data.tabs.length;
                  let totalEntries = 0;
                  Object.values(snap.data.rows).forEach((r: any) => {
                    totalEntries += (r?.entries || []).length;
                  });

                  return (
                    <div key={snap.timestamp} className="p-2.5 sm:px-3 flex items-center justify-between hover:bg-white transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{dateStr}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {snap.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {tabCount} Klassen • {totalEntries} Einheiten eingetragen
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Möchtest du den Sicherungsstand vom ${dateStr} wirklich wiederherstellen?`)) {
                            onRestoreData(snap.data);
                            onClose();
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Laden</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Alle Daten werden immer auch lokal in deinem Browser gesichert.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
