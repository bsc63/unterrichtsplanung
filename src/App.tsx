import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  loadPlannerData, 
  savePlannerData, 
  saveSnapshot, 
  connectFolderAndPickFile, 
  getSavedFolderHandle, 
  getStoredDirectoryHandle,
  verifyFolderPermission,
  saveToFolderHandle, 
  readFromFolderHandle,
  disconnectFolderHandle,
  downloadJsonFile,
  isFsaSupported,
  isFsaApiAvailable,
  isIosOrIpad,
  SYNC_FILENAME,
  SYNC_ACTIVE_FILENAME_KEY,
  SYNC_FOLDER_NAME_KEY
} from './utils/storage';
import { PlannerData, LessonEntry, ColumnKey } from './types';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { FormattingToolbar } from './components/FormattingToolbar';
import { NotesEditor } from './components/NotesEditor';
import { TableView } from './components/TableView';
import { CardsView } from './components/CardsView';
import { SyncModal } from './components/SyncModal';
import { TabManagerModal } from './components/TabManagerModal';
import { AutoDateModal } from './components/AutoDateModal';
import { CopyColumnModal } from './components/CopyColumnModal';
import { QrSyncModal } from './components/QrSyncModal';
import { SyncReloadPromptModal } from './components/SyncReloadPromptModal';
import { openClassPdfInNewTab } from './utils/pdfExport';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<PlannerData>(loadPlannerData);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640 ? 'cards' : 'table';
  });
  const [showNotes, setShowNotes] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  });
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [syncDirHandle, setSyncDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [syncConnected, setSyncConnected] = useState<boolean>(false);
  const [activeSyncFileName, setActiveSyncFileName] = useState<string>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem(SYNC_ACTIVE_FILENAME_KEY) || SYNC_FILENAME
      : SYNC_FILENAME;
  });
  const [syncFolderName, setSyncFolderName] = useState<string>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem(SYNC_FOLDER_NAME_KEY) || ''
      : '';
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [tabManagerOpen, setTabManagerOpen] = useState(false);
  const [autoDateOpen, setAutoDateOpen] = useState(false);
  const [copyColOpen, setCopyColOpen] = useState(false);
  const [qrSyncOpen, setQrSyncOpen] = useState(false);
  const [syncReloadPromptOpen, setSyncReloadPromptOpen] = useState(false);
  const [isReloadingSync, setIsReloadingSync] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const syncTimerRef = useRef<any>(null);
  const snapshotTimerRef = useRef<any>(null);
  const latestDataRef = useRef<PlannerData>(data);
  const syncDirHandleRef = useRef<FileSystemDirectoryHandle | null>(syncDirHandle);
  const activeSyncFileNameRef = useRef<string>(activeSyncFileName);
  const pendingSaveRef = useRef<boolean>(false);

  // Keep refs in sync with state
  latestDataRef.current = data;
  syncDirHandleRef.current = syncDirHandle;
  activeSyncFileNameRef.current = activeSyncFileName;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const hasSyncConfig = Boolean(
    syncFolderName ||
    syncDirHandle ||
    (typeof window !== 'undefined' && (localStorage.getItem(SYNC_FOLDER_NAME_KEY) || localStorage.getItem(SYNC_ACTIVE_FILENAME_KEY)))
  );

  // Check saved folder / sync configuration on startup and prompt user: "SYNC neu laden?"
  useEffect(() => {
    const checkSyncOnMount = async () => {
      const savedFolder = localStorage.getItem(SYNC_FOLDER_NAME_KEY);
      const savedFile = localStorage.getItem(SYNC_ACTIVE_FILENAME_KEY) || SYNC_FILENAME;

      let storedHandle: FileSystemDirectoryHandle | null = null;
      if (isFsaSupported) {
        storedHandle = await getStoredDirectoryHandle();
        if (storedHandle) {
          setSyncDirHandle(storedHandle);
          const fName = storedHandle.name || savedFolder || 'Sync-Ordner';
          setSyncFolderName(fName);
          setActiveSyncFileName(savedFile);
        }
      }

      if (savedFolder && !storedHandle) {
        setSyncFolderName(savedFolder);
        setActiveSyncFileName(savedFile);
      }

      // If a sync configuration was set up previously, display the prompt
      // with preselected "OK (SYNC neu laden)" and selectable "Nein"
      if (storedHandle || savedFolder) {
        setSyncReloadPromptOpen(true);
      }
    };

    checkSyncOnMount();
  }, []);

  // Handler when user confirms: "OK (SYNC neu laden)"
  const handleConfirmSyncReload = async () => {
    setIsReloadingSync(true);
    try {
      let dirHandle = syncDirHandle;
      if (!dirHandle && isFsaSupported) {
        dirHandle = await getStoredDirectoryHandle();
      }

      if (dirHandle) {
        // User clicked OK in prompt => valid user gesture to grant readwrite access
        const granted = await verifyFolderPermission(dirHandle, true);
        if (granted) {
          setSyncDirHandle(dirHandle);
          const result = await readFromFolderHandle(dirHandle, activeSyncFileName);
          if (result && result.data) {
            setData(result.data);
            savePlannerData(result.data);
            saveSnapshot(result.data, `Sync geladen: ${result.fileName}`);
            setSyncConnected(true);
            setActiveSyncFileName(result.fileName);
            const fName = dirHandle.name || syncFolderName || 'Sync-Ordner';
            setSyncFolderName(fName);
            localStorage.setItem(SYNC_FOLDER_NAME_KEY, fName);
            localStorage.setItem(SYNC_ACTIVE_FILENAME_KEY, result.fileName);
            setIsDirty(false);
            setSyncReloadPromptOpen(false);
            showToast(`🔄 Daten aus „${fName}/${result.fileName}“ erfolgreich neu geladen!`);
            return;
          }
        }
      }

      // Fallback for Android, mobile, or without direct FSA folder handle:
      // Open file selector so the user can pick the updated .json in one tap
      setSyncReloadPromptOpen(false);
      showToast('📂 Bitte wähle die aktuelle .json-Datei aus deinem Sync-Ordner aus');
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 120);
    } catch (e: any) {
      console.warn('Error during sync reload', e);
      setSyncReloadPromptOpen(false);
      showToast('⚠️ Ordner-Zugriff fehlgeschlagen. Bitte Datei manuell wählen.');
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 120);
    } finally {
      setIsReloadingSync(false);
    }
  };

  // Handler when user selects: "Nein (Lokalen Stand behalten)"
  const handleCancelSyncReload = () => {
    setSyncReloadPromptOpen(false);
    // Explicitly keep syncConnected as false so the user clearly sees they are on local state
    setSyncConnected(false);
    showToast('Lokaler Stand beibehalten. Mit „SYNC neu laden“ kannst du jederzeit aktualisieren.');
  };

  // Explicit flush function to guarantee writing to disk immediately
  const flushSaveToDisk = useCallback(async () => {
    if (!syncDirHandleRef.current || !pendingSaveRef.current) return;
    clearTimeout(syncTimerRef.current);
    try {
      const ok = await saveToFolderHandle(
        syncDirHandleRef.current,
        latestDataRef.current,
        activeSyncFileNameRef.current
      );
      if (ok) {
        pendingSaveRef.current = false;
        setIsDirty(false);
      }
    } catch (e) {
      console.warn('Flush save to folder failed', e);
    }
  }, []);

  // Save changes to localStorage & trigger folder sync
  const updateData = useCallback((newData: PlannerData, reason?: string) => {
    setData(newData);
    latestDataRef.current = newData;
    savePlannerData(newData);
    setIsDirty(true);

    // Schedule debounced snapshot
    clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = setTimeout(() => {
      saveSnapshot(newData, reason || 'Automatische Sicherung');
    }, 2000);

    // If folder handle connected, save automatically to the active JSON in that folder (400ms debounce)
    if (syncDirHandleRef.current) {
      pendingSaveRef.current = true;
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(async () => {
        await flushSaveToDisk();
      }, 400);
    }
  }, [flushSaveToDisk]);

  // Flush pending disk saves when switching tabs, minimizing window or closing page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSaveToDisk();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSaveRef.current) {
        flushSaveToDisk();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flushSaveToDisk]);

  // Tab Operations
  const handleSelectTab = (idx: number) => {
    if (idx >= 0 && idx < data.tabs.length) {
      setActiveTab(idx);
    }
  };

  const handleAddTab = () => {
    const nextIdx = data.tabs.length;
    const newName = `Klasse ${nextIdx + 1}`;
    const nextRows = { ...data.rows, [nextIdx]: { text: '', entries: [] } };
    const nextData: PlannerData = {
      tabs: [...data.tabs, newName],
      rows: nextRows,
    };
    updateData(nextData, `Neuer Reiter: ${newName}`);
    setActiveTab(nextIdx);
    showToast(`Reiter „${newName}“ hinzugefügt`);
  };

  const handleDeleteTab = (idx: number) => {
    if (data.tabs.length <= 1) {
      alert('Es muss mindestens ein Reiter bestehen bleiben!');
      return;
    }
    const name = data.tabs[idx];
    if (!confirm(`Möchtest du „${name}“ und alle zugehörigen Daten wirklich löschen?`)) {
      return;
    }

    const nextTabs = data.tabs.filter((_, i) => i !== idx);
    const nextRows: Record<number, any> = {};
    let newI = 0;
    data.tabs.forEach((_, i) => {
      if (i !== idx) {
        nextRows[newI] = data.rows[i] || { text: '', entries: [] };
        newI++;
      }
    });

    const nextData: PlannerData = {
      tabs: nextTabs,
      rows: nextRows,
    };
    updateData(nextData, `Reiter gelöscht: ${name}`);
    if (activeTab >= nextTabs.length) {
      setActiveTab(Math.max(0, nextTabs.length - 1));
    }
    showToast(`Reiter „${name}“ gelöscht`);
  };

  const handleRenameTab = (idx: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const oldName = data.tabs[idx];
    if (oldName === trimmed) return;

    const nextTabs = [...data.tabs];
    nextTabs[idx] = trimmed;
    const nextData: PlannerData = {
      ...data,
      tabs: nextTabs,
    };
    updateData(nextData, `Reiter umbenannt: ${oldName} -> ${trimmed}`);
    showToast(`Reiter umbenannt in „${trimmed}“`);
  };

  const handleMoveTab = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= data.tabs.length || toIdx >= data.tabs.length) {
      return;
    }

    const newTabs = [...data.tabs];
    const [movedTab] = newTabs.splice(fromIdx, 1);
    newTabs.splice(toIdx, 0, movedTab);

    // Rearrange rows
    const oldEntriesMap = new Map<string, any>();
    data.tabs.forEach((name, i) => {
      oldEntriesMap.set(name, data.rows[i]);
    });

    const newRows: Record<number, any> = {};
    newTabs.forEach((name, i) => {
      newRows[i] = oldEntriesMap.get(name) || { text: '', entries: [] };
    });

    const nextData: PlannerData = {
      tabs: newTabs,
      rows: newRows,
    };
    updateData(nextData, 'Reiterreihenfolge geändert');
    setActiveTab(toIdx);
  };

  // Notes Operations
  const handleNotesChange = (val: string) => {
    const cur = data.rows[activeTab] || { text: '', entries: [] };
    const nextRows = {
      ...data.rows,
      [activeTab]: { ...cur, text: val },
    };
    updateData({ ...data, rows: nextRows });
  };

  // Entry Operations
  const currentEntries = data.rows[activeTab]?.entries || [];

  const handleUpdateEntry = (rowIdx: number, field: keyof LessonEntry, value: any) => {
    const tabObj = data.rows[activeTab] || { text: '', entries: [] };
    const nextEntries = [...tabObj.entries];
    if (!nextEntries[rowIdx]) return;
    nextEntries[rowIdx] = { ...nextEntries[rowIdx], [field]: value };

    const nextRows = {
      ...data.rows,
      [activeTab]: { ...tabObj, entries: nextEntries },
    };
    updateData({ ...data, rows: nextRows });
  };

  const handleAddRow = () => {
    const tabObj = data.rows[activeTab] || { text: '', entries: [] };
    const newEntry: LessonEntry = {
      date: '',
      plan: '',
      done: false,
      grade: '',
      note: '',
    };
    const nextRows = {
      ...data.rows,
      [activeTab]: { ...tabObj, entries: [...tabObj.entries, newEntry] },
    };
    updateData({ ...data, rows: nextRows }, 'Zeile hinzugefügt');
    showToast('Zeile hinzugefügt');
  };

  const handleInsertRow = (rowIdx: number) => {
    const tabObj = data.rows[activeTab] || { text: '', entries: [] };
    const newEntry: LessonEntry = {
      date: '',
      plan: '',
      done: false,
      grade: '',
      note: '',
    };
    const nextEntries = [...tabObj.entries];
    nextEntries.splice(rowIdx, 0, newEntry);
    const nextRows = {
      ...data.rows,
      [activeTab]: { ...tabObj, entries: nextEntries },
    };
    updateData({ ...data, rows: nextRows }, 'Zeile eingefügt');
    showToast('Zeile eingefügt');
  };

  const handleDuplicateRow = (rowIdx: number) => {
    const tabObj = data.rows[activeTab] || { text: '', entries: [] };
    const target = tabObj.entries[rowIdx];
    if (!target) return;
    const duplicated: LessonEntry = { ...target, done: false };
    const nextEntries = [...tabObj.entries];
    nextEntries.splice(rowIdx + 1, 0, duplicated);
    const nextRows = {
      ...data.rows,
      [activeTab]: { ...tabObj, entries: nextEntries },
    };
    updateData({ ...data, rows: nextRows }, 'Zeile dupliziert');
    showToast('Zeile dupliziert');
  };

  const handleDeleteRow = (rowIdx: number) => {
    const tabObj = data.rows[activeTab] || { text: '', entries: [] };
    const nextEntries = tabObj.entries.filter((_, i) => i !== rowIdx);
    const nextRows = {
      ...data.rows,
      [activeTab]: { ...tabObj, entries: nextEntries },
    };
    updateData({ ...data, rows: nextRows }, 'Zeile gelöscht');
    showToast('Zeile gelöscht');
  };

  // Batch Auto Dates
  const handleApplyAutoDates = (dates: string[]) => {
    const tabObj = data.rows[activeTab] || { text: '', entries: [] };
    const existing = tabObj.entries;
    const nextEntries: LessonEntry[] = [];

    dates.forEach((d, i) => {
      if (existing[i]) {
        nextEntries.push({ ...existing[i], date: d });
      } else {
        nextEntries.push({ date: d, plan: '', done: false, grade: '', note: '' });
      }
    });

    // If existing had more items, append them
    if (existing.length > dates.length) {
      for (let i = dates.length; i < existing.length; i++) {
        nextEntries.push(existing[i]);
      }
    }

    const nextRows = {
      ...data.rows,
      [activeTab]: { ...tabObj, entries: nextEntries },
    };
    updateData({ ...data, rows: nextRows }, 'Termine automatisch generiert');
    showToast(`${dates.length} Termine eingetragen`);
  };

  // Copy Column between tabs
  const handleCopyColumn = (
    srcTab: number,
    srcCol: ColumnKey,
    dstTab: number,
    dstCol: ColumnKey
  ) => {
    const srcEntries = data.rows[srcTab]?.entries || [];
    if (srcEntries.length === 0) {
      alert('Die Quell-Tabelle hat keine Zeilen zum Kopieren.');
      return;
    }

    const dstObj = data.rows[dstTab] || { text: '', entries: [] };
    const dstEntries = [...dstObj.entries];

    srcEntries.forEach((entry, i) => {
      if (!dstEntries[i]) {
        dstEntries[i] = { date: '', plan: '', done: false, grade: '', note: '' };
      }
      if (dstCol === 'done') {
        dstEntries[i].done = srcCol === 'done' ? Boolean(entry.done) : Boolean(entry[srcCol]);
      } else if (srcCol === 'done') {
        dstEntries[i][dstCol] = entry.done ? 'x' : '';
      } else {
        dstEntries[i][dstCol] = entry[srcCol] || '';
      }
    });

    const nextRows = {
      ...data.rows,
      [dstTab]: { ...dstObj, entries: dstEntries },
    };
    updateData({ ...data, rows: nextRows }, 'Spalte kopiert');
    showToast(`${srcEntries.length} Zeilen in „${data.tabs[dstTab]}“ kopiert`);
  };

  // FreeFileSync / Folder Sync: Connect, pick folder, auto-detect JSON, and save
  const handleConnectFolder = async () => {
    // Check if native File System Access API is usable (top-level Chrome/Edge)
    if (isFsaApiAvailable()) {
      try {
        const result = await connectFolderAndPickFile(data);
        if (result) {
          setSyncDirHandle(result.dirHandle);
          setSyncConnected(true);
          setSyncFolderName(result.folderName);
          setActiveSyncFileName(result.fileName);
          localStorage.setItem(SYNC_FOLDER_NAME_KEY, result.folderName);
          localStorage.setItem(SYNC_ACTIVE_FILENAME_KEY, result.fileName);

          if (result.loadedData) {
            setData(result.loadedData);
            savePlannerData(result.loadedData);
            showToast(`📥 Daten aus „${result.folderName}/${result.fileName}“ geladen!`);
          } else {
            showToast(`📤 Neuer Sync-Ordner aktiv: „${result.fileName}“ wird synchronisiert`);
          }
          setIsDirty(false);
          return;
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return;
        }
        console.warn('Native folder picker failed or restricted, falling back to folder input', e);
      }
    }

    // Fallback for iframes, Safari, iPad, or when native picker is unavailable:
    // Synchronously click folder input to trigger OS folder chooser without hesitation
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
      folderInputRef.current.click();
    }
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    // 1. Detect folder name from webkitRelativePath
    let detectedFolder = 'Sync-Ordner';
    for (const f of fileList) {
      if (f.webkitRelativePath) {
        const parts = f.webkitRelativePath.split('/');
        if (parts.length > 1 && parts[0]) {
          detectedFolder = parts[0];
          break;
        }
      }
    }

    // 2. Filter for all .json files in the folder
    const jsonFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.json'));

    if (jsonFiles.length === 0) {
      // Empty folder or folder without json yet: establish binding and export current state
      const targetFile = SYNC_FILENAME;
      setSyncConnected(true);
      setSyncFolderName(detectedFolder);
      setActiveSyncFileName(targetFile);
      localStorage.setItem(SYNC_FOLDER_NAME_KEY, detectedFolder);
      localStorage.setItem(SYNC_ACTIVE_FILENAME_KEY, targetFile);
      downloadJsonFile(data, targetFile);
      setIsDirty(false);
      showToast(`📁 Ordner „${detectedFolder}“ gemerkt – initiale Datei „${targetFile}“ erstellt!`);
      e.target.value = '';
      return;
    }

    // 3. Sort JSON files by last modified descending (newest first)
    jsonFiles.sort((a, b) => b.lastModified - a.lastModified);

    let loadedData: PlannerData | null = null;
    let chosenFileName = jsonFiles[0].name;

    for (const f of jsonFiles) {
      try {
        const text = await f.text();
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.tabs) && parsed.rows) {
          loadedData = parsed;
          chosenFileName = f.name;
          break;
        }
      } catch (err) {
        // continue checking other JSON files
      }
    }

    if (loadedData) {
      setData(loadedData);
      savePlannerData(loadedData);
      saveSnapshot(loadedData, `Ordner-Import: ${chosenFileName}`);
      setSyncConnected(true);
      setSyncFolderName(detectedFolder);
      setActiveSyncFileName(chosenFileName);
      localStorage.setItem(SYNC_FOLDER_NAME_KEY, detectedFolder);
      localStorage.setItem(SYNC_ACTIVE_FILENAME_KEY, chosenFileName);
      setIsDirty(false);
      showToast(`📥 „${chosenFileName}“ aus Ordner „${detectedFolder}“ geladen & Ordner gemerkt!`);
    } else {
      showToast(`⚠️ In „${detectedFolder}“ (${jsonFiles.length} JSON-Dateien) wurde keine gültige Unterrichtsplanungs-Datei gefunden.`);
    }

    e.target.value = '';
  };

  const handleSaveToFolderNow = async () => {
    let savedDirectly = false;
    if (syncDirHandle) {
      savedDirectly = await saveToFolderHandle(syncDirHandle, data, activeSyncFileName);
    }
    if (!savedDirectly) {
      downloadJsonFile(data, activeSyncFileName);
    }
    setIsDirty(false);
    showToast(`💾 Aktueller Stand in „${activeSyncFileName}“ gespeichert`);
  };

  const handleDisconnectFolder = async () => {
    await disconnectFolderHandle();
    setSyncDirHandle(null);
    setSyncConnected(false);
    setSyncFolderName('');
    showToast('Sync-Ordner getrennt');
  };

  // File Import / Export
  const handleExport = () => {
    downloadJsonFile(data, activeSyncFileName);
    setIsDirty(false);
    showToast(`📤 ${activeSyncFileName} exportiert`);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.tabs) && parsed.rows) {
          setData(parsed);
          savePlannerData(parsed);
          saveSnapshot(parsed, `Import: ${file.name}`);
          setIsDirty(false);
          setActiveTab(0);
          setSyncConnected(true);
          setActiveSyncFileName(file.name);
          localStorage.setItem(SYNC_ACTIVE_FILENAME_KEY, file.name);
          showToast(`📥 Backup aus „${file.name}“ erfolgreich geladen`);
        } else {
          alert('Ungültiges Dateiformat. Bitte wähle eine gültige Unterrichtsplaner-JSON-Datei.');
        }
      } catch (err: any) {
        alert('Fehler beim Import: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrint = () => {
    const className = data.tabs[activeTab] || 'Klasse';
    const notes = data.rows[activeTab]?.text || '';
    const entries = currentEntries;

    // Open new tab with the generated PDF document & print preview
    openClassPdfInNewTab(className, notes, entries);
    showToast(`PDF-Vorschau für „${className}“ in neuem Tab geöffnet`);
  };

  const currentClassName = data.tabs[activeTab] || 'Klasse';

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
      {/* Hidden file input for single JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFileChange}
      />

      {/* Hidden input for Native Folder Selection (FreeFileSync / Local directory sync) */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFolderInputChange}
      />

      {/* TOP HEADER */}
      <Header
        data={data}
        activeTab={activeTab}
        isDirty={isDirty}
        syncConnected={syncConnected}
        hasSyncConfig={hasSyncConfig}
        folderName={syncFolderName}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showNotes={showNotes}
        setShowNotes={setShowNotes}
        onOpenSync={() => setSyncModalOpen(true)}
        onReloadSync={handleConfirmSyncReload}
        onOpenTabManager={() => setTabManagerOpen(true)}
        onOpenAutoDate={() => setAutoDateOpen(true)}
        onOpenCopyCol={() => setCopyColOpen(true)}
        onExport={handleExport}
        onImportClick={() => fileInputRef.current?.click()}
        onPrint={handlePrint}
      />

      {/* STICKY BAR: TABS (Klassen) + FORMATIERUNGSBEFEHLE (bleibt oben fest beim Scrollen) */}
      <div className="sticky top-0 z-30 shadow-xs print:hidden">
        {/* ROW 1: TABS (Klassen) */}
        <TabBar
          data={data}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onAddTab={handleAddTab}
          onDeleteTab={handleDeleteTab}
          onRenameTab={handleRenameTab}
          onReorderTabs={handleMoveTab}
          onOpenTabManager={() => setTabManagerOpen(true)}
        />

        {/* ROW 2: FORMATIERUNG (Für Notizen, Tabelle & Karten – immer sichtbar) */}
        <FormattingToolbar
          showNotes={showNotes}
          setShowNotes={setShowNotes}
          classNameTitle={currentClassName}
          notesValue={data.rows[activeTab]?.text || ''}
          onNotesChange={handleNotesChange}
          onUpdateActiveEntry={handleUpdateEntry}
        />
      </div>

      {/* COLLAPSIBLE GENERAL NOTES (Ausgeblendet wenn showNotes=false, Zeile mit Befehlen bleibt) */}
      <NotesEditor
        value={data.rows[activeTab]?.text || ''}
        onChange={handleNotesChange}
        classNameTitle={currentClassName}
        showNotes={showNotes}
        setShowNotes={setShowNotes}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 sm:pb-12">
        {viewMode === 'table' ? (
          <TableView
            entries={currentEntries}
            onUpdateEntry={handleUpdateEntry}
            onAddRow={handleAddRow}
            onInsertRow={handleInsertRow}
            onDuplicateRow={handleDuplicateRow}
            onDeleteRow={handleDeleteRow}
          />
        ) : (
          <CardsView
            entries={currentEntries}
            onUpdateEntry={handleUpdateEntry}
            onAddRow={handleAddRow}
            onInsertRow={handleInsertRow}
            onDuplicateRow={handleDuplicateRow}
            onDeleteRow={handleDeleteRow}
          />
        )}
      </main>

      {/* FLOATING STATUS TOAST */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SYNC & BACKUP MODAL (FreeFileSync, Ordnerauswahl, automatischer JSON-Import & Export) */}
      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        data={data}
        onRestoreData={(restored) => {
          updateData(restored, 'Stand wiederhergestellt');
          showToast('Sicherungsstand erfolgreich wiederhergestellt');
        }}
        syncConnected={syncConnected}
        activeFileName={activeSyncFileName}
        folderName={syncFolderName}
        onConnectFolder={handleConnectFolder}
        onReloadFromFolder={handleConfirmSyncReload}
        onDisconnectFolder={handleDisconnectFolder}
        onImportClick={() => fileInputRef.current?.click()}
        onOpenQrSync={() => setQrSyncOpen(true)}
        onSaveNow={handleSaveToFolderNow}
      />

      {/* TAB MANAGER MODAL */}
      <TabManagerModal
        isOpen={tabManagerOpen}
        onClose={() => setTabManagerOpen(false)}
        data={data}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onAddTab={handleAddTab}
        onDeleteTab={handleDeleteTab}
        onRenameTab={handleRenameTab}
        onMoveTab={handleMoveTab}
      />

      {/* AUTO DATES MODAL */}
      <AutoDateModal
        isOpen={autoDateOpen}
        onClose={() => setAutoDateOpen(false)}
        activeClassName={currentClassName}
        onInsertDates={handleApplyAutoDates}
      />

      {/* COPY COLUMN MODAL */}
      <CopyColumnModal
        isOpen={copyColOpen}
        onClose={() => setCopyColOpen(false)}
        data={data}
        activeTab={activeTab}
        onPerformCopy={handleCopyColumn}
      />

      {/* QR SYNC MODAL */}
      <QrSyncModal
        isOpen={qrSyncOpen}
        onClose={() => setQrSyncOpen(false)}
        data={data}
        onImportData={(newData) => {
          updateData(newData, 'Via QR-Code importiert');
          showToast('📥 Daten erfolgreich vom anderen Gerät empfangen!');
        }}
      />

      {/* SYNC RELOAD POPUP ON APP LAUNCH (Vorgewähltes OK, wählbares NEIN) */}
      <SyncReloadPromptModal
        isOpen={syncReloadPromptOpen}
        onConfirm={handleConfirmSyncReload}
        onCancel={handleCancelSyncReload}
        folderName={syncFolderName}
        fileName={activeSyncFileName}
        isFsa={isFsaSupported && Boolean(syncDirHandle || (typeof window !== 'undefined' && localStorage.getItem(SYNC_FOLDER_NAME_KEY)))}
        isReloading={isReloadingSync}
      />
    </div>
  );
}
