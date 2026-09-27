import React, { useEffect, useRef } from 'react';
import { RefreshCw, FolderSync, FileText, Check, X, Smartphone, Monitor } from 'lucide-react';

interface SyncReloadPromptModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  folderName: string;
  fileName: string;
  isFsa: boolean;
  isReloading?: boolean;
}

export const SyncReloadPromptModal: React.FC<SyncReloadPromptModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  folderName,
  fileName,
  isFsa,
  isReloading = false,
}) => {
  const okButtonRef = useRef<HTMLButtonElement>(null);

  // Automatically focus the primary OK button on mount / open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        okButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation: Enter triggers OK, Escape triggers Cancel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-reload-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
              <RefreshCw className={`w-5 h-5 text-indigo-300 ${isReloading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="sync-reload-title" className="text-base sm:text-lg font-bold tracking-tight text-white">
                  SYNC neu laden?
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Geräte-Abgleich
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                Aktuelle Daten aus dem Sync-Ordner übernehmen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isReloading}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Schließen (Nein)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700">
          <p className="leading-relaxed">
            Ein Sync-Ordner ist auf diesem Gerät eingerichtet. Möchten Sie die aktuelle Unterrichtsplanungs-Datei jetzt laden?
          </p>

          {/* Sync Folder & File Info Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <FolderSync className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sync-Ordner:</span>
              </span>
              <span className="font-mono font-medium text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {folderName || 'Gemerkt'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Datei:</span>
              </span>
              <span className="font-mono font-medium text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-200">
                {fileName || 'unterrichtsplanung_backup.json'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-1.5">
              {isFsa ? (
                <>
                  <Monitor className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Direkter Zugriff auf den Ordner bereit (1-Klick Aktualisierung).</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <span>In Firefox, Safari & auf Mobilgeräten öffnet OK direkt die Dateiauswahl zur Aktualisierung.</span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <span className="text-base leading-none">💡</span>
            <span>
              <strong>Empfohlen:</strong> Wenn Sie die Datei auf einem anderen PC (Windows, Linux) oder Smartphone/Tablet (Android, iPad) bzw. per <strong>FreeFileSync</strong> aktualisiert haben, werden Ihre neuesten Änderungen geladen.
            </span>
          </div>
        </div>

        {/* Modal Actions (OK vorgewählt, NEIN wählbar) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          {/* NEIN Button (Wählbar / Sekundär) */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isReloading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          >
            <span>Nein (Lokalen Stand behalten)</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
              Esc
            </kbd>
          </button>

          {/* OK Button (Vorgewählt / Primär / Autofocus) */}
          <button
            ref={okButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isReloading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 ring-2 ring-indigo-400 ring-offset-2 disabled:opacity-70 focus:outline-hidden"
          >
            {isReloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Lade Sync-Datei...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-white stroke-[2.5]" />
                <span>OK (SYNC neu laden)</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-indigo-200 bg-indigo-800/60 rounded border border-indigo-400/40">
                  Enter ↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
