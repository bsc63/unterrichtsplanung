import React, { useState } from 'react';
import { X, CalendarDays, Plus, Check } from 'lucide-react';
import { generateDateSeries, formatDateDE } from '../utils/dateFormat';

interface AutoDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassName: string;
  onInsertDates: (dates: string[]) => void;
}

export const AutoDateModal: React.FC<AutoDateModalProps> = ({
  isOpen,
  onClose,
  activeClassName,
  onInsertDates,
}) => {
  const todayISO = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayISO);
  const [count, setCount] = useState(8);
  const [interval, setInterval] = useState(7); // 7 = weekly
  const [skipWeekends, setSkipWeekends] = useState(true);

  if (!isOpen) return null;

  const previewList = generateDateSeries(startDate, count, interval, skipWeekends);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewList.length > 0) {
      onInsertDates(previewList);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-300" />
            <h3 className="font-bold text-base">Unterrichtstermine generieren</h3>
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
            Trägt automatisch eine Terminserie in <strong>{activeClassName}</strong> ein:
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Startdatum:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full p-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Anzahl Einheiten:
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rhythmus:
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value, 10))}
                className="w-full p-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>Täglich (1 Tag)</option>
                <option value={7}>Wöchentlich (7 Tage)</option>
                <option value={14}>14-tägig (2 Wochen)</option>
                <option value={28}>Monatlich (4 Wochen)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="skipWeekends"
              checked={skipWeekends}
              onChange={(e) => setSkipWeekends(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="skipWeekends" className="text-xs text-slate-600 cursor-pointer">
              Wochenenden überspringen (Sa/So)
            </label>
          </div>

          {/* Preview */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Vorschau ({previewList.length} Termine):
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 max-h-28 overflow-y-auto font-mono text-xs flex flex-wrap gap-1.5 text-slate-700">
              {previewList.map((d, i) => (
                <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                  {d}
                </span>
              ))}
            </div>
          </div>

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
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{previewList.length} Termine eintragen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
