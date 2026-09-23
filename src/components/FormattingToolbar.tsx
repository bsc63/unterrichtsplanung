import React, { useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Indent, 
  Outdent, 
  Link as LinkIcon, 
  Unlink, 
  Eraser, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { LessonEntry } from '../types';
import { insertList, indentListItem, outdentListItem } from '../utils/editorUtils';

interface FormattingToolbarProps {
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
  classNameTitle: string;
  notesValue: string;
  onNotesChange: (val: string) => void;
  onUpdateActiveEntry?: (idx: number, field: keyof LessonEntry, val: any) => void;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  showNotes,
  setShowNotes,
  classNameTitle,
  notesValue,
  onNotesChange,
  onUpdateActiveEntry,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  const exec = (cmd: string, val: string | null = null) => {
    // 1. Identify target element
    let activeEl = document.activeElement as HTMLElement | null;
    const notesEl = document.getElementById('notes-editor-content');

    // If current focus is outside editable areas, default focus to notesEl if present
    if (!activeEl || (!activeEl.isContentEditable && !notesEl?.contains(activeEl))) {
      if (notesEl) {
        notesEl.focus();
        activeEl = notesEl;
      }
    }

    restoreSelection();

    const isNotesTarget = activeEl === notesEl || Boolean(notesEl && notesEl.contains(activeEl));

    // Handle Lists with custom reliable logic preventing line jumps above lists
    if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
      const isOrdered = cmd === 'insertOrderedList';
      insertList(isOrdered, activeEl);
      if (isNotesTarget && notesEl) {
        onNotesChange(notesEl.innerHTML);
      }
      return;
    }

    // Handle Hierarchical Indentation with guaranteed cursor placement inside sub-item
    if (cmd === 'indent') {
      indentListItem(activeEl);
      if (isNotesTarget && notesEl) {
        onNotesChange(notesEl.innerHTML);
      }
      return;
    }

    // Handle Outdent (level up)
    if (cmd === 'outdent') {
      outdentListItem(activeEl);
      if (isNotesTarget && notesEl) {
        onNotesChange(notesEl.innerHTML);
      }
      return;
    }

    // Font size & standard formatting
    document.execCommand(cmd, false, val ?? undefined);

    // If target was notes editor, notify notes change
    if (isNotesTarget && notesEl) {
      onNotesChange(notesEl.innerHTML);
    }
  };

  const applyColor = (color: string) => {
    restoreSelection();
    exec('foreColor', color);
  };

  const createLink = () => {
    saveSelection();
    const url = prompt('Web-Adresse (URL) eingeben:', 'https://');
    if (url && url !== 'https://') {
      exec('createLink', url);
    }
  };

  const hasNotesText = Boolean(notesValue && notesValue.replace(/<[^>]+>/g, '').trim().length > 0);

  return (
    <div className="bg-white border-b border-slate-200 px-2 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs select-none shadow-2xs">
      {/* Left / Center: Formatting Commands (Works on Notes, Table & Cards) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0">
        
        {/* 3 Schriftgrößen: Klein, Normal, Groß */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs flex-shrink-0">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => exec('fontSize', '1')}
            className="px-2 py-0.5 text-[11px] font-medium rounded-md text-slate-700 hover:bg-white hover:text-indigo-900 active:scale-95 transition-all"
            title="Schriftgröße: Klein (~12px)"
          >
            Klein
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => exec('fontSize', '3')}
            className="px-2 py-0.5 text-xs font-medium rounded-md text-slate-700 hover:bg-white hover:text-indigo-900 active:scale-95 transition-all"
            title="Schriftgröße: Normal (~14px)"
          >
            Normal
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => exec('fontSize', '5')}
            className="px-2 py-0.5 text-xs font-bold rounded-md text-slate-900 hover:bg-white hover:text-indigo-900 active:scale-95 transition-all"
            title="Schriftgröße: Groß (~18px)"
          >
            Groß
          </button>
        </div>

        <div className="w-[1px] h-4 bg-slate-200 mx-0.5 flex-shrink-0" />

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('bold')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold transition-colors"
          title="Fett (Strg+B) – für Notizen, Tabelle & Karten"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('italic')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-800 italic transition-colors"
          title="Kursiv (Strg+I) – für Notizen, Tabelle & Karten"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('underline')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-800 underline transition-colors"
          title="Unterstrichen (Strg+U) – für Notizen, Tabelle & Karten"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-0.5 flex-shrink-0" />

        {/* Quick Color Dots */}
        <div className="flex items-center gap-1 flex-shrink-0 px-0.5">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => applyColor('#0f172a')}
            className="w-3.5 h-3.5 rounded-full bg-slate-900 hover:scale-125 transition-transform border border-white shadow-2xs"
            title="Schwarz (Standardtext)"
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => applyColor('#dc2626')}
            className="w-3.5 h-3.5 rounded-full bg-red-600 hover:scale-125 transition-transform border border-white shadow-2xs"
            title="Rot (Wichtig / Prüfung / Klassenarbeit)"
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => applyColor('#2563eb')}
            className="w-3.5 h-3.5 rounded-full bg-blue-600 hover:scale-125 transition-transform border border-white shadow-2xs"
            title="Blau (Hausaufgabe / Information)"
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => applyColor('#16a34a')}
            className="w-3.5 h-3.5 rounded-full bg-emerald-600 hover:scale-125 transition-transform border border-white shadow-2xs"
            title="Grün (Erledigt / Positiv)"
          />

          {/* Native Color Picker */}
          <div className="relative inline-flex items-center ml-0.5">
            <input
              ref={colorInputRef}
              type="color"
              defaultValue="#dc2626"
              onMouseDown={saveSelection}
              onChange={(e) => applyColor(e.target.value)}
              className="w-4 h-4 p-0 border border-slate-300 rounded cursor-pointer"
              title="Beliebige Textfarbe auswählen"
            />
          </div>
        </div>

        <div className="w-[1px] h-4 bg-slate-200 mx-0.5 flex-shrink-0" />

        {/* Hierarchical Lists: Unordered & Ordered */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors"
          title="Aufzählung (Bullet Points •, ◦, ▪)"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('insertOrderedList')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors"
          title="Nummerierte Liste (1., a., i.)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        {/* Hierarchy Indent / Outdent Controls (also works with Tab / Shift+Tab) */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('indent')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors"
          title="Unterpunkt erstellen / Einzug vergrößern (Taste: TAB)"
        >
          <Indent className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('outdent')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors"
          title="Übergeordneter Punkt / Einzug verkleinern (Taste: Shift+TAB)"
        >
          <Outdent className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-0.5 flex-shrink-0" />

        {/* Link / Unlink */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={createLink}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors"
          title="Web-Link einfügen"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('unlink')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors"
          title="Link entfernen"
        >
          <Unlink className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-0.5 flex-shrink-0" />

        {/* Remove Format */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => exec('removeFormat')}
          className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors"
          title="Formatierung entfernen (Radiergummi)"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

        <span className="hidden xl:inline text-[11px] text-slate-400 ml-2 font-normal">
          Formatierung für Notizen, Tabelle &amp; Karten
        </span>
      </div>

      {/* Right Side: Toggle Notizen Einblenden / Ausblenden Button */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {showNotes ? (
          <button
            type="button"
            onClick={() => setShowNotes(false)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-all shadow-2xs active:scale-95"
            title="Allgemeine Notizen ausblenden (Formatierungsleiste bleibt aktiv)"
          >
            <span className="text-xs">📝</span>
            <span className="hidden sm:inline">Notizen</span>
            <span className="font-bold text-indigo-700">Ausblenden</span>
            <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all shadow-2xs active:scale-95"
            title="Allgemeine Notizen für diese Klasse einblenden"
          >
            <span className="text-xs">📝</span>
            <span className="hidden sm:inline">Notizen</span>
            <span className="font-bold text-indigo-600">Einblenden</span>
            {hasNotesText && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" title="Notizen vorhanden" />
            )}
            <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        )}
      </div>
    </div>
  );
};
