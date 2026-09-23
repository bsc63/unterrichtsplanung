import { PlannerData, Snapshot } from '../types';

export const STORAGE_KEY = 'unterrichtsplanung_v2';
export const STORAGE_HEIGHT_KEY = 'unterrichtsplanung_editor_height';
export const SYNC_FILENAME = 'unterrichtsplanung_backup.json';
export const SNAPSHOTS_KEY = 'unterrichtsplanung_snapshots';
export const SYNC_ACTIVE_FILENAME_KEY = 'unterrichtsplanung_sync_active_filename';
export const SYNC_FOLDER_NAME_KEY = 'unterrichtsplanung_sync_folder_name';

export const isFsaSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

/**
 * Checks if the native File System Access showDirectoryPicker is both supported AND callable
 * (i.e. not running inside a restricted iframe where showDirectoryPicker throws SecurityError).
 */
export function isFsaApiAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('showDirectoryPicker' in window)) return false;
  try {
    if (window.self !== window.top) {
      // In cross-origin / sandboxed iframes, showDirectoryPicker is blocked
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

export const isIosOrIpad = typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

export function createDefaultPlannerData(): PlannerData {
  return {
    tabs: ['Klasse 1', 'Klasse 2', 'Klasse 3'],
    rows: {
      0: { text: '', entries: [
        { date: '01.10.2026', plan: 'Einführung & Themenübersicht', done: false, grade: '', note: 'Material kopieren' },
        { date: '08.10.2026', plan: 'Stationenarbeit Gruppe A & B', done: false, grade: '', note: '' }
      ] },
      1: { text: '', entries: [] },
      2: { text: '', entries: [] },
    }
  };
}

export function loadPlannerData(): PlannerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultPlannerData();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tabs) || parsed.tabs.length === 0) {
      return createDefaultPlannerData();
    }
    const cleanRows: Record<number, { text: string; entries: any[] }> = {};
    parsed.tabs.forEach((_: string, idx: number) => {
      cleanRows[idx] = parsed.rows?.[idx] || { text: '', entries: [] };
    });
    return {
      tabs: parsed.tabs,
      rows: cleanRows,
    };
  } catch (e) {
    console.error('Error loading data from localStorage', e);
    return createDefaultPlannerData();
  }
}

export function savePlannerData(data: PlannerData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data to localStorage', e);
  }
}

// --- Automated Snapshot / Version History (Safety net for iPad & mobile) ---
export function saveSnapshot(data: PlannerData, label: string = 'Automatisches Backup'): void {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    let list: Snapshot[] = raw ? JSON.parse(raw) : [];
    // Keep max 15 snapshots
    list.unshift({
      timestamp: Date.now(),
      label,
      data: JSON.parse(JSON.stringify(data)),
    });
    if (list.length > 15) {
      list = list.slice(0, 15);
    }
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save snapshot', e);
  }
}

export function getSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// --- IndexedDB for Directory Handle (Chrome/Edge/Desktop) ---
function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('unterrichtsplanung_sync', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSetHandle(key: string, value: any): Promise<void> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetHandle(key: string): Promise<any> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readonly');
    const req = tx.objectStore('handles').get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbRemoveHandle(key: string): Promise<void> {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Scans a DirectoryHandle for all *.json files and returns their handles and last modified times.
 */
export async function listJsonFilesInFolder(handle: FileSystemDirectoryHandle): Promise<{ name: string; fileHandle: FileSystemFileHandle; lastModified: number }[]> {
  const results: { name: string; fileHandle: FileSystemFileHandle; lastModified: number }[] = [];
  try {
    // iterate through directory entries
    for await (const [name, entry] of (handle as any).entries()) {
      if (entry.kind === 'file' && name.toLowerCase().endsWith('.json')) {
        try {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          results.push({
            name,
            fileHandle,
            lastModified: file.lastModified,
          });
        } catch (e) {
          // ignore unreadable single file
        }
      }
    }
  } catch (err) {
    console.warn('Error reading directory entries', err);
  }

  // Sort by last modified descending (newest first)
  results.sort((a, b) => b.lastModified - a.lastModified);
  return results;
}

/**
 * Prompts user to pick a folder for FreeFileSync / local synchronization.
 * Inspects all .json files in the chosen folder:
 * - If .json files exist, loads the most recently modified one containing valid planner data.
 * - If no .json files exist, creates SYNC_FILENAME with the current data.
 * Returns the handle, the chosen file name, and any loaded data.
 */
export async function connectFolderAndPickFile(currentData?: PlannerData): Promise<{
  dirHandle: FileSystemDirectoryHandle;
  fileName: string;
  loadedData: PlannerData | null;
  folderName: string;
} | null> {
  if (!('showDirectoryPicker' in window)) return null;

  const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
  const perm = await dirHandle.requestPermission({ mode: 'readwrite' });
  if (perm !== 'granted') throw new Error('Berechtigung für den gewählten Ordner verweigert.');

  // Save dir handle persistently
  await idbSetHandle('syncDir', dirHandle);

  // Scan folder for JSON files
  const jsonFiles = await listJsonFilesInFolder(dirHandle);

  let targetFileName = SYNC_FILENAME;
  let targetData: PlannerData | null = null;

  if (jsonFiles.length > 0) {
    // Try to find the newest valid planner file
    for (const item of jsonFiles) {
      try {
        const file = await item.fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.tabs) && parsed.rows) {
          targetFileName = item.name;
          targetData = parsed;
          break;
        }
      } catch (e) {
        // continue search
      }
    }

    // If none of the JSON files had valid tabs/rows, use the newest file's name or fallback
    if (!targetData) {
      targetFileName = jsonFiles[0].name;
    }
  } else if (currentData) {
    // No JSON files exist in the chosen folder: write currentData into SYNC_FILENAME
    targetFileName = SYNC_FILENAME;
    await saveToFolderHandle(dirHandle, currentData, targetFileName);
  }

  localStorage.setItem(SYNC_ACTIVE_FILENAME_KEY, targetFileName);
  localStorage.setItem(SYNC_FOLDER_NAME_KEY, dirHandle.name || 'Sync-Ordner');

  return {
    dirHandle,
    fileName: targetFileName,
    loadedData: targetData,
    folderName: dirHandle.name || 'Ausgewählter Ordner',
  };
}

/**
 * Attempts to retrieve previously saved directory handle and reload the active JSON file.
 */
export async function getSavedFolderHandle(): Promise<{
  handle: FileSystemDirectoryHandle;
  activeFileName: string;
  folderName: string;
} | null> {
  try {
    const handle = await idbGetHandle('syncDir');
    if (!handle) return null;
    const perm = await (handle as any).queryPermission({ mode: 'readwrite' });
    const activeFileName = localStorage.getItem(SYNC_ACTIVE_FILENAME_KEY) || SYNC_FILENAME;
    const folderName = localStorage.getItem(SYNC_FOLDER_NAME_KEY) || handle.name || 'Sync-Ordner';
    if (perm === 'granted') {
      return { handle, activeFileName, folderName };
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Saves planner data into the specified (or stored) filename inside the directory handle.
 */
export async function saveToFolderHandle(
  handle: FileSystemDirectoryHandle,
  data: PlannerData,
  fileName?: string
): Promise<boolean> {
  try {
    const targetName = fileName || localStorage.getItem(SYNC_ACTIVE_FILENAME_KEY) || SYNC_FILENAME;
    const perm = await (handle as any).queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return false;
    const fileHandle = await handle.getFileHandle(targetName, { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (e) {
    console.error('Error saving to folder handle', e);
    return false;
  }
}

/**
 * Reads planner data from the specified (or stored) filename inside the directory handle.
 * If file not found or empty, searches for any other valid .json in the directory.
 */
export async function readFromFolderHandle(
  handle: FileSystemDirectoryHandle,
  fileName?: string
): Promise<{ data: PlannerData; fileName: string } | null> {
  try {
    const targetName = fileName || localStorage.getItem(SYNC_ACTIVE_FILENAME_KEY) || SYNC_FILENAME;
    try {
      const fileHandle = await handle.getFileHandle(targetName, { create: false });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.tabs) && parsed.rows) {
        return { data: parsed, fileName: targetName };
      }
    } catch (e) {
      // primary file not found, try to search for any other .json in folder
    }

    const files = await listJsonFilesInFolder(handle);
    for (const f of files) {
      try {
        const file = await f.fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.tabs) && parsed.rows) {
          localStorage.setItem(SYNC_ACTIVE_FILENAME_KEY, f.name);
          return { data: parsed, fileName: f.name };
        }
      } catch (e) {
        // continue
      }
    }
  } catch (e) {
    console.warn('Error reading from folder handle', e);
  }
  return null;
}

/**
 * Disconnects the saved directory handle from storage.
 */
export async function disconnectFolderHandle(): Promise<void> {
  await idbRemoveHandle('syncDir');
  localStorage.removeItem(SYNC_ACTIVE_FILENAME_KEY);
  localStorage.removeItem(SYNC_FOLDER_NAME_KEY);
}

// --- Web Share API / In Dateien sichern (Native for iPad / iOS) ---
export function canWebShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false;
  try {
    const testFile = new File(['{}'], 'test.json', { type: 'application/json' });
    return navigator.canShare({ files: [testFile] });
  } catch (e) {
    return false;
  }
}

export async function shareOrSaveToFiles(data: PlannerData): Promise<boolean> {
  const activeFileName = localStorage.getItem(SYNC_ACTIVE_FILENAME_KEY) || SYNC_FILENAME;
  const jsonStr = JSON.stringify(data, null, 2);
  const file = new File([jsonStr], activeFileName, { type: 'application/json' });
  
  if (canWebShareFiles()) {
    try {
      await navigator.share({
        files: [file],
        title: 'Unterrichtsplanung Backup',
        text: 'Backup für Unterrichtsplaner & FreeFileSync',
      });
      return true;
    } catch (e: any) {
      if (e.name === 'AbortError') return false; // user cancelled share sheet
      console.warn('navigator.share failed, fallback to download', e);
    }
  }

  // Fallback to traditional download
  downloadJsonFile(data, activeFileName);
  return true;
}

// --- Standard JSON Export Download ---
export function downloadJsonFile(data: PlannerData, filename?: string): void {
  const activeFileName = filename || localStorage.getItem(SYNC_ACTIVE_FILENAME_KEY) || SYNC_FILENAME;
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = activeFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
