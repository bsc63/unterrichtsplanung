import React, { useRef, useEffect, useState } from 'react';
import { 
  ChevronUp, 
  Maximize2, 
  Minimize2, 
  Expand, 
  GripHorizontal,
  X
} from 'lucide-react';
import { STORAGE_HEIGHT_KEY } from '../utils/storage';
import { indentListItem, outdentListItem, handleListEnter } from '../utils/editorUtils';

interface NotesEditorProps {
  value: string;
  onChange: (val: string) => void;
  classNameTitle: string;
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  value,
  onChange,
  classNameTitle,
  showNotes,
  setShowNotes,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastEmittedHtmlRef = useRef<string>(value || '');

  // Height state: persisted in localStorage
  const [editorHeight, setEditorHeight] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_HEIGHT_KEY);
    return saved ? Math.max(100, parseInt(saved, 10)) : 140;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullAuto, setIsFullAuto] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Sync DOM with external value ONLY if the value did not originate from this editor
  useEffect(() => {
    if (!editorRef.current) return;
    if (value === lastEmittedHtmlRef.current) {
      return; // Change originated locally; do NOT touch DOM or caret!
    }
    editorRef.current.innerHTML = value || '';
    lastEmittedHtmlRef.current = value || '';
  }, [value]);

  // When active class tab changes, ALWAYS load the new class notes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
      lastEmittedHtmlRef.current = value || '';
    }
  }, [classNameTitle]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newHtml = (e.currentTarget as HTMLElement).innerHTML;
    lastEmittedHtmlRef.current = newHtml;
    onChange(newHtml);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const success = e.shiftKey 
        ? outdentListItem(editorRef.current) 
        : indentListItem(editorRef.current);
      
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        lastEmittedHtmlRef.current = newHtml;
        onChange(newHtml);
      }
      return;
    }

    if (e.key === 'Enter') {
      const handled = handleListEnter(editorRef.current);
      if (handled) {
        e.preventDefault();
        if (editorRef.current) {
          const newHtml = editorRef.current.innerHTML;
          lastEmittedHtmlRef.current = newHtml;
          onChange(newHtml);
        }
      }
    }
  };

  // Drag-to-resize handler
  const startResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setIsFullAuto(false);
    setIsFullscreen(false);

    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startH = editorRef.current ? editorRef.current.clientHeight : editorHeight;

    const onMove = (moveEvt: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const delta = currentY - startY;
      const newHeight = Math.min(800, Math.max(80, startH + delta));
      setEditorHeight(newHeight);
      localStorage.setItem(STORAGE_HEIGHT_KEY, newHeight.toString());
    };

    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  const toggleFullAuto = () => {
    if (isFullAuto) {
      setIsFullAuto(false);
    } else {
      setIsFullAuto(true);
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      className={`bg-white border-b border-slate-200 print:hidden transition-all shadow-xs ${
        showNotes ? 'block animate-fadeIn' : 'hidden'
      }`} 
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        {/* Notes Title Header & Quick Sizing Controls */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <span className="text-sm">📝</span>
            <span className="font-bold truncate">
              Notizen &amp; Allgemeine Planung – {classNameTitle}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto Height / Show All Button */}
            <button
              type="button"
              onClick={toggleFullAuto}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                isFullAuto
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Alle Notizen vollständig sichtbar machen"
            >
              <Expand className="w-3 h-3" />
              <span className="hidden sm:inline">{isFullAuto ? 'Standardhöhe' : 'Alle Notizen sichtbar'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setIsFullAuto(false);
              }}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 border border-slate-200"
              title={isFullscreen ? 'Fenster verkleinern' : 'Vollbild'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Ausblenden Button */}
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-600 hover:text-indigo-800 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
              title="Notizen ausblenden"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Ausblenden</span>
            </button>
          </div>
        </div>

        {/* Contenteditable Notes Area */}
        <div
          id="notes-editor-content"
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          onKeyDown={handleKeyDown}
          style={{
            height: isFullscreen
              ? '75vh'
              : isFullAuto
              ? 'auto'
              : `${editorHeight}px`,
            minHeight: '80px',
            resize: 'vertical',
          }}
          className={`w-full bg-slate-50/60 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed overflow-y-auto ${
            isFullAuto ? 'max-h-[85vh]' : ''
          }`}
          data-placeholder="Hier können allgemeine Notizen, Stoffverteilung, Klausurtermine oder Erinnerungen für diese Klasse eingetragen werden..."
        />

        {/* Bottom Sizing Bar & Actions */}
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 select-none">
          <span className="hidden sm:inline">
            Unten rechts an der Ecke oder am Balken ziehen zum Vergrößern
          </span>

          {/* Drag Handle */}
          <div
            onMouseDown={startResize}
            onTouchStart={startResize}
            className="cursor-ns-resize flex items-center gap-1 px-3 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors touch-none select-none mx-auto sm:mx-0"
            title="Ziehen, um Notizenhöhe anzupassen"
          >
            <GripHorizontal className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Höhe anpassen</span>
          </div>

          <button
            type="button"
            onClick={() => setShowNotes(false)}
            className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
          >
            Fertig / Notizen minimieren
          </button>
        </div>
      </div>
    </div>
  );
};
