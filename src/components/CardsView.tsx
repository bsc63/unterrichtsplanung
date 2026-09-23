import React from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Calendar, 
  Bookmark, 
  FileText, 
  Star,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { LessonEntry } from '../types';
import { getWeekdayDE } from '../utils/dateFormat';
import { indentListItem, outdentListItem, handleListEnter } from '../utils/editorUtils';

interface CardsViewProps {
  entries: LessonEntry[];
  onUpdateEntry: (idx: number, field: keyof LessonEntry, value: any) => void;
  onAddRow: () => void;
  onInsertRow: (idx: number) => void;
  onDuplicateRow: (idx: number) => void;
  onDeleteRow: (idx: number) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  entries,
  onUpdateEntry,
  onAddRow,
  onInsertRow,
  onDuplicateRow,
  onDeleteRow,
}) => {
  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, idx: number, field: keyof LessonEntry) => {
    if (e.key === 'Tab') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== e.currentTarget) {
          if (node.nodeName === 'LI') {
            e.preventDefault();
            if (e.shiftKey) {
              outdentListItem(e.currentTarget);
            } else {
              indentListItem(e.currentTarget);
            }
            return;
          }
          node = node.parentNode;
        }
      }
      return;
    }

    if (e.key === 'Enter') {
      const handled = handleListEnter(e.currentTarget);
      if (handled) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-3">
      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
          <span className="text-4xl block mb-2">🗂️</span>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">Keine Einträge vorhanden</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Erstelle die erste Unterrichtseinheit für diesen Reiter.
          </p>
          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-medium text-xs rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Einheit anlegen</span>
          </button>
        </div>
      ) : (
        entries.map((entry, idx) => {
          const weekday = getWeekdayDE(entry.date);
          const isDone = Boolean(entry.done);

          return (
            <div
              key={idx}
              className={`bg-white rounded-xl border transition-all shadow-xs overflow-hidden ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header: Index, Date & Done Button */}
              <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-400 w-5">
                    #{idx + 1}
                  </span>
                  {weekday && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                      {weekday}
                    </span>
                  )}
                  <input
                    type="text"
                    value={entry.date || ''}
                    placeholder="Datum (z.B. 12.10.2026)"
                    onChange={(e) => onUpdateEntry(idx, 'date', e.target.value)}
                    className="font-mono text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 w-28 sm:w-36"
                  />
                </div>

                {/* Big Touch-Friendly Done Toggle */}
                <button
                  type="button"
                  onClick={() => onUpdateEntry(idx, 'done', !isDone)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${isDone ? 'stroke-[3]' : 'text-slate-400'}`} />
                  <span>{isDone ? 'Erledigt' : 'Offen'}</span>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-3 space-y-2.5 text-xs sm:text-sm">
                {/* Planning */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-indigo-600" />
                    <span>Planung & Thema</span>
                  </label>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    data-row-idx={idx}
                    data-field="plan"
                    onKeyDown={(e) => handleListKeyDown(e, idx, 'plan')}
                    onBlur={(e) => onUpdateEntry(idx, 'plan', (e.target as HTMLElement).innerHTML)}
                    className={`min-h-[44px] p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed ${
                      isDone ? 'text-slate-500 line-through' : ''
                    }`}
                    data-placeholder="Unterrichtsinhalte, Aufgaben, Buchseiten..."
                    dangerouslySetInnerHTML={{ __html: entry.plan || '' }}
                  />
                </div>

                {/* Grid for Grade and Note */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      <span>Bewertung / Note</span>
                    </label>
                    <input
                      type="text"
                      value={entry.grade || ''}
                      placeholder="z.B. Test 1-2, HA +"
                      onChange={(e) => onUpdateEntry(idx, 'grade', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-emerald-600" />
                      <span>Bemerkungen & Beobachtungen</span>
                    </label>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      data-row-idx={idx}
                      data-field="note"
                      onKeyDown={(e) => handleListKeyDown(e, idx, 'note')}
                      onBlur={(e) => onUpdateEntry(idx, 'note', (e.target as HTMLElement).innerHTML)}
                      className="min-h-[38px] p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                      data-placeholder="z.B. Gruppe 2 noch nicht fertig, nächste Woche weiter..."
                      dangerouslySetInnerHTML={{ __html: entry.note || '' }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onInsertRow(idx)}
                    className="flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors text-[11px]"
                    title="Zeile davor einfügen"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>Davor einfügen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicateRow(idx)}
                    className="flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors text-[11px]"
                    title="Duplizieren"
                  >
                    <Copy className="w-3 h-3 text-blue-600" />
                    <span>Kopieren</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteRow(idx)}
                  className="flex items-center gap-1 px-2 py-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors text-[11px]"
                  title="Löschen"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Löschen</span>
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Floating Add Card at Bottom */}
      <div className="pt-2 pb-6">
        <button
          type="button"
          onClick={onAddRow}
          className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Neue Unterrichtseinheit hinzufügen</span>
        </button>
      </div>
    </div>
  );
};
