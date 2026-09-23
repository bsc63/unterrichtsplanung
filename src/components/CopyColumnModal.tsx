import React, { useState } from 'react';
import { X, Copy, Check, ArrowRight } from 'lucide-react';
import { PlannerData, ColumnKey } from '../types';

interface CopyColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PlannerData;
  activeTab: number;
  onPerformCopy: (srcTab: number, srcCol: ColumnKey, dstTab: number, dstCol: ColumnKey) => void;
}

const COLUMN_LABELS: Record<ColumnKey, string> = {
  date: 'Datum',
  plan: 'Planung',
  done: 'Erledigt',
  grade: 'Bewertung',
  note: 'Bemerkungen',
};

export const CopyColumnModal: React.FC<CopyColumnModalProps> = ({
  isOpen,
  onClose,
  data,
  activeTab,
  onPerformCopy,
}) => {
  const [srcTab, setSrcTab] = useState<number>(activeTab);
  const [srcCol, setSrcCol] = useState<ColumnKey>('date');
  const [dstTab, setDstTab] = useState<number>(activeTab);
  const [dstCol, setDstCol] = useState<ColumnKey>('date');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const srcName = data.tabs[srcTab];
    const dstName = data.tabs[dstTab];
    if (
      confirm(
        `Spalte "${COLUMN_LABELS[srcCol]}" aus "${srcName}" in Spalte "${COLUMN_LABELS[dstCol]}" von "${dstName}" übertragen?\n\nVorhandene Werte im Ziel werden überschrieben.`
      )
    ) {
      onPerformCopy(srcTab, srcCol, dstTab, dstCol);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">Spalte kopieren</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <p className="text-xs text-slate-500">
            Kopiert alle Zellwerte einer Spalte zeilenweise in einen anderen Reiter oder eine andere Spalte:
          </p>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {/* Source */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quelle (Von):
              </label>
              <select
                value={srcTab}
                onChange={(e) => setSrcTab(parseInt(e.target.value, 10))}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white mb-2"
              >
                {data.tabs.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>

              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quell-Spalte:
              </label>
              <select
                value={srcCol}
                onChange={(e) => setSrcCol(e.target.value as ColumnKey)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((k) => (
                  <option key={k} value={k}>{COLUMN_LABELS[k]}</option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ziel (Nach):
              </label>
              <select
                value={dstTab}
                onChange={(e) => setDstTab(parseInt(e.target.value, 10))}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white mb-2"
              >
                {data.tabs.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>

              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ziel-Spalte:
              </label>
              <select
                value={dstCol}
                onChange={(e) => setDstCol(e.target.value as ColumnKey)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((k) => (
                  <option key={k} value={k}>{COLUMN_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Fehlende Zeilen im Ziel werden automatisch erzeugt. Vorhandene Einträge werden überschrieben.
          </p>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Spalte jetzt kopieren</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
