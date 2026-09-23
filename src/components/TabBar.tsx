import React, { useRef, useEffect, useState } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Layers
} from 'lucide-react';
import { PlannerData } from '../types';

interface TabBarProps {
  data: PlannerData;
  activeTab: number;
  onSelectTab: (idx: number) => void;
  onAddTab: () => void;
  onDeleteTab: (idx: number) => void;
  onRenameTab: (idx: number, newName: string) => void;
  onReorderTabs: (fromIdx: number, toIdx: number) => void;
  onOpenTabManager: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  data,
  activeTab,
  onSelectTab,
  onAddTab,
  onDeleteTab,
  onRenameTab,
  onReorderTabs,
  onOpenTabManager,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [data.tabs]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-tab-index="${activeTab}"]`) as HTMLElement;
    if (activeEl) {
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.clientWidth;
      const elLeft = activeEl.offsetLeft;
      const elRight = elLeft + activeEl.clientWidth;

      if (elLeft < containerLeft) {
        container.scrollTo({ left: elLeft - 20, behavior: 'smooth' });
      } else if (elRight > containerRight) {
        container.scrollTo({ left: elRight - container.clientWidth + 20, behavior: 'smooth' });
      }
    }
    checkScroll();
  }, [activeTab]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMobileDropdownOpen(false);
      }
    };
    if (mobileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileDropdownOpen]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const amount = direction === 'left' ? -180 : 180;
      el.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScroll, 250);
    }
  };

  return (
    <div className="bg-slate-200 border-b border-slate-300 print:hidden select-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        {/* MOBILE COMPACT SWITCHER (Visible on small screens: Saves massive vertical space!) */}
        <div className="sm:hidden py-1.5 flex items-center justify-between gap-2" ref={dropdownRef}>
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 shadow-xs"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-indigo-600 font-bold">📚</span>
                <span className="truncate">{data.tabs[activeTab]}</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                  {data.rows[activeTab]?.entries?.length || 0}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1 flex-shrink-0" />
            </button>

            {/* Mobile Dropdown Menu */}
            {mobileDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Reiter wählen ({data.tabs.length})</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileDropdownOpen(false);
                      onOpenTabManager();
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-0.5"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Verwalten</span>
                  </button>
                </div>
                {data.tabs.map((name, idx) => {
                  const count = data.rows[idx]?.entries?.length || 0;
                  const isCurrent = idx === activeTab;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onSelectTab(idx);
                        setMobileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-indigo-50 text-indigo-900 font-bold border-l-3 border-indigo-600'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      <span className="text-[11px] text-slate-400 font-normal ml-2">
                        {count} {count === 1 ? 'Eintrag' : 'Einträge'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onAddTab}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs flex-shrink-0"
            title="Neuen Reiter anlegen"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Neu</span>
          </button>
        </div>

        {/* DESKTOP / TABLET HORIZONTAL SCROLLABLE TAB STRIP (Does NOT wrap! Keeps screen clear) */}
        <div className="hidden sm:flex items-center gap-1 pt-1.5">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-1.5 rounded-md hover:bg-slate-300 text-slate-600 transition-colors flex-shrink-0"
              title="Nach links scrollen"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5"
          >
            {data.tabs.map((name, idx) => {
              const isActive = idx === activeTab;
              const count = data.rows[idx]?.entries?.length || 0;

              return (
                <button
                  key={idx}
                  type="button"
                  data-tab-index={idx}
                  onClick={() => onSelectTab(idx)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-t border-x cursor-pointer transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-white border-slate-300 text-indigo-950 font-bold shadow-xs -mb-[1px] z-10'
                      : 'bg-slate-200/90 hover:bg-slate-100 border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                  title={`${name} (${count} Einträge)`}
                >
                  <span className="truncate max-w-[150px]">{name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Quick Add Tab Button */}
            <button
              type="button"
              onClick={onAddTab}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-indigo-700 hover:text-indigo-900 hover:bg-slate-300/70 rounded-t-lg transition-colors flex-shrink-0 font-semibold"
              title="Neuen Reiter hinzufügen"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neu</span>
            </button>
          </div>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-1.5 rounded-md hover:bg-slate-300 text-slate-600 transition-colors flex-shrink-0"
              title="Nach rechts scrollen"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Manage All Tabs Button */}
          <button
            type="button"
            onClick={onOpenTabManager}
            className="p-1.5 rounded-md hover:bg-slate-300 text-slate-600 hover:text-indigo-700 transition-colors flex-shrink-0"
            title="Alle Reiter verwalten (Umsortieren, Umbenennen, Löschen)"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
