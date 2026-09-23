import React, { useState } from 'react';
import { X, Copy, Check, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { PlannerData } from '../types';

interface QrSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PlannerData;
  onImportData: (data: PlannerData) => void;
}

export const QrSyncModal: React.FC<QrSyncModalProps> = ({
  isOpen,
  onClose,
  data,
  onImportData,
}) => {
  const [copied, setCopied] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyPasted = () => {
    setErrorMsg('');
    try {
      const parsed = JSON.parse(pasteInput.trim());
      if (parsed && Array.isArray(parsed.tabs) && parsed.rows) {
        onImportData(parsed);
        onClose();
      } else {
        setErrorMsg('Ungültiges Datenformat. Bitte prüfe den kopierten Code.');
      }
    } catch (e: any) {
      setErrorMsg('Fehler beim Lesen des Codes: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-300" />
            <h3 className="font-bold text-base">iPad ↔ PC Direktübertragung</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Export direction */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
              <span>1. Von diesem Gerät senden</span>
            </div>
            <p className="text-xs text-slate-500">
              Kopiere den Daten-Code dieses Geräts und füge ihn auf dem anderen Gerät (z.B. iPad oder Laptop) ein:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={jsonString.slice(0, 100) + '... (' + jsonString.length + ' Zeichen)'}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0 shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopiert!' : 'Code kopieren'}</span>
              </button>
            </div>
          </div>

          <div className="w-full border-t border-slate-200 my-2"></div>

          {/* Import direction */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ArrowDownCircle className="w-4 h-4 text-blue-600" />
              <span>2. Auf diesem Gerät empfangen</span>
            </div>
            <p className="text-xs text-slate-500">
              Füge den vom anderen Gerät kopierten Code hier ein:
            </p>
            <textarea
              rows={4}
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="Hier den Code einfügen (Strg+V bzw. Tippen & Einsetzen)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errorMsg && (
              <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>
            )}
            <button
              type="button"
              disabled={!pasteInput.trim()}
              onClick={handleApplyPasted}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
            >
              Übertragen & Unterrichtsplan aktualisieren
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
