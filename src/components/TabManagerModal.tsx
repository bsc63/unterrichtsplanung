import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Edit3, 
  Check, 
  Layers, 
  Copy 
} from 'lucide-react';
import { PlannerData } from '../types';

interface TabManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PlannerData;
  activeTab: number;
  onSelectTab: (idx: number) => void;
  onAddTab: () => void;
  onDeleteTab: (idx: number) => void;
  onRenameTab: (idx: number, name: string) => void;
  onMoveTab: (fromIdx: number, toIdx: number) => void;
}

export const TabManagerModal: React.FC<TabManagerModalProps> = ({
  isOpen,
  onClose,
  data,
  activeTab,
  onSelectTab,
  onAddTab,
  onDeleteTab,
  onRenameTab,
  onMoveTab,
}) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditName(data.tabs[idx] || '');
  };

  const saveEdit = (idx: number) => {
    const clean = editName.trim();
    if (clean) {
      onRenameTab(idx, clean);
    }
    setEditingIdx(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-300" />
            <h3 className="font-bold text-base">Reiter & Klassen verwalten</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab list */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs sm:text-sm">
          <p className="text-xs text-slate-500 mb-3">
            Reiter umbenennen, mit Pfeilen nach oben/unten sortieren oder neue Klassen anlegen:
          </p>

          <div className="space-y-1.5">
            {data.tabs.map((name, idx) => {
              const isCurrent = idx === activeTab;
              const count = data.rows[idx]?.entries?.length || 0;
              const isEditing = editingIdx === idx;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    isCurrent
                      ? 'border-indigo-300 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-mono text-slate-400 w-5 font-bold">
                      {idx + 1}.
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(idx);
                            if (e.key === 'Escape') setEditingIdx(null);
                          }}
                          autoFocus
                          className="px-2 py-1 text-xs border border-indigo-500 rounded-md bg-white text-slate-900 focus:outline-none flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab(idx);
                          onClose();
                        }}
                        className="text-left font-semibold text-slate-800 hover:text-indigo-700 truncate flex-1 flex items-center gap-1.5"
                      >
                        <span className="truncate">{name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({count} {count === 1 ? 'Einheit' : 'Einheiten'})
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                            Aktiv
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Actions: Reorder, Rename, Delete */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveTab(idx, idx - 1)}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="Nach oben"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === data.tabs.length - 1}
                        onClick={() => onMoveTab(idx, idx + 1)}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
                        title="Nach unten"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(idx)}
                        className="p-1 text-slate-500 hover:text-indigo-700 rounded hover:bg-slate-100"
                        title="Umbenennen"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {data.tabs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteTab(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onAddTab}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Neuen Reiter anlegen</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
