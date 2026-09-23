import React, { useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Calendar, 
  CheckCircle2, 
  Circle
} from 'lucide-react';
import { LessonEntry } from '../types';
import { getWeekdayDE } from '../utils/dateFormat';
import { indentListItem, outdentListItem, handleListEnter } from '../utils/editorUtils';

interface TableViewProps {
  entries: LessonEntry[];
  onUpdateEntry: (idx: number, field: keyof LessonEntry, value: any) => void;
  onAddRow: () => void;
  onInsertRow: (idx: number) => void;
  onDuplicateRow: (idx: number) => void;
  onDeleteRow: (idx: number) => void;
}

export const TableView: React.FC<TableViewProps> = ({
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
    <div className="flex-1 flex flex-col min-h-0 bg-white shadow-xs rounded-xl border border-slate-200 overflow-hidden">
      {/* Table Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
          <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none shadow-sm">
            <tr>
              <th className="py-2.5 px-3 font-semibold w-12 text-center text-slate-300">#</th>
              <th className="py-2.5 px-3 font-semibold w-32">Datum</th>
              <th className="py-2.5 px-3 font-semibold min-w-[200px]">Planung / Thema</th>
              <th className="py-2.5 px-3 font-semibold w-20 text-center">Erledigt</th>
              <th className="py-2.5 px-3 font-semibold w-28">Bewertung</th>
              <th className="py-2.5 px-3 font-semibold min-w-[180px]">Bemerkungen</th>
              <th className="py-2.5 px-3 font-semibold w-24 text-center print:hidden">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">📝</span>
                    <p className="font-medium text-slate-600">Noch keine Unterrichtseinheiten in diesem Reiter eingetragen</p>
                    <p className="text-xs text-slate-400">Klicke unten auf „+ Zeile hinzufügen“ oder nutze „Daten automatisch eintragen“</p>
                    <button
                      type="button"
                      onClick={onAddRow}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-medium text-xs rounded-lg shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Erste Zeile hinzufügen</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => {
                const weekday = getWeekdayDE(entry.date);
                const isDone = Boolean(entry.done);

                return (
                  <tr
                    key={idx}
                    className={`transition-colors hover:bg-slate-50/80 group ${
                      isDone ? 'bg-emerald-50/20' : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px] align-top pt-3">
                      {idx + 1}
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3 align-top">
                      <div className="flex items-center gap-1">
                        {weekday && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                            {weekday}
                          </span>
                        )}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => onUpdateEntry(idx, 'date', (e.target as HTMLElement).innerText)}
                          className="font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 py-0.5 min-w-[70px]"
                          dangerouslySetInnerHTML={{ __html: entry.date || '' }}
                        />
                      </div>
                    </td>

                    {/* Planning */}
                    <td className="py-2 px-3 align-top">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        data-row-idx={idx}
                        data-field="plan"
                        onKeyDown={(e) => handleListKeyDown(e, idx, 'plan')}
                        onBlur={(e) => onUpdateEntry(idx, 'plan', (e.target as HTMLElement).innerHTML)}
                        className={`text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1 min-h-[28px] leading-relaxed ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                        dangerouslySetInnerHTML={{ __html: entry.plan || '' }}
                      />
                    </td>

                    {/* Done Checkbox */}
                    <td className="py-2 px-3 text-center align-top pt-2.5">
                      <button
                        type="button"
                        onClick={() => onUpdateEntry(idx, 'done', !isDone)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all mx-auto border ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-slate-300 text-transparent hover:border-indigo-400'
                        }`}
                        title={isDone ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    {/* Grade */}
                    <td className="py-2 px-3 align-top">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        data-row-idx={idx}
                        data-field="grade"
                        onBlur={(e) => onUpdateEntry(idx, 'grade', (e.target as HTMLElement).innerText)}
                        className="text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 py-0.5 min-h-[24px]"
                        dangerouslySetInnerHTML={{ __html: entry.grade || '' }}
                      />
                    </td>

                    {/* Notes */}
                    <td className="py-2 px-3 align-top">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        data-row-idx={idx}
                        data-field="note"
                        onKeyDown={(e) => handleListKeyDown(e, idx, 'note')}
                        onBlur={(e) => onUpdateEntry(idx, 'note', (e.target as HTMLElement).innerHTML)}
                        className="text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1 min-h-[28px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: entry.note || '' }}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-2 text-center align-top pt-2 print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onInsertRow(idx)}
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Zeile oberhalb einfügen"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateRow(idx)}
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors hidden sm:inline-flex"
                          title="Zeile duplizieren"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRow(idx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Zeile löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Bar with Quick Add */}
      <div className="p-2 sm:p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs print:hidden">
        <div className="text-slate-500 font-medium">
          {entries.length} Zeilen {entries.length > 0 && `(${entries.filter(e => e.done).length} erledigt)`}
        </div>
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Zeile hinzufügen</span>
        </button>
      </div>
    </div>
  );
};
