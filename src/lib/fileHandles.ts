const DB_NAME = "simple-note-file-handles";
const STORE_NAME = "handles";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
      }),
  );
}

export function canUseNativeFileSystem() {
  const w = window as Window & {
    showOpenFilePicker?: unknown;
    showSaveFilePicker?: unknown;
  };

  return typeof w.showOpenFilePicker === "function" && typeof w.showSaveFilePicker === "function";
}

export async function getStoredFileHandle(noteId: string): Promise<FileSystemFileHandle | null> {
  if (!canUseNativeFileSystem()) return null;

  try {
    const handle = await withStore<FileSystemFileHandle | undefined>("readonly", (store) => store.get(noteId));
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function setStoredFileHandle(noteId: string, handle: FileSystemFileHandle) {
  if (!canUseNativeFileSystem()) return;
  await withStore("readwrite", (store) => store.put(handle, noteId));
}

export async function removeStoredFileHandle(noteId: string) {
  if (!canUseNativeFileSystem()) return;
  await withStore("readwrite", (store) => store.delete(noteId));
}

export async function clearAllStoredFileHandles() {
  if (!canUseNativeFileSystem()) return;
  // Keep the root directory handle when clearing file handles
  const rootHandle = await getStoredDirectoryHandle();
  await withStore("readwrite", (store) => store.clear());
  if (rootHandle) {
    await setStoredDirectoryHandle(rootHandle);
  }
}

export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!canUseNativeFileSystem()) return null;
  try {
    const handle = await withStore<FileSystemDirectoryHandle | undefined>("readonly", (store) =>
      store.get("__root_dir_handle__")
    );
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function setStoredDirectoryHandle(handle: FileSystemDirectoryHandle) {
  if (!canUseNativeFileSystem()) return;
  await withStore("readwrite", (store) => store.put(handle, "__root_dir_handle__"));
}

export async function removeStoredDirectoryHandle() {
  if (!canUseNativeFileSystem()) return;
  await withStore("readwrite", (store) => store.delete("__root_dir_handle__"));
}

export const globalDeletedNoteIds = new Set<string>();
export const globalDeletedRelativePaths = new Set<string>();

export function markNoteAsDeleted(id: string) {
  if (!id) return;
  globalDeletedNoteIds.add(id);
  void removeStoredFileHandle(id);
}

export function unmarkNoteAsDeleted(id: string) {
  if (!id) return;
  globalDeletedNoteIds.delete(id);
}

export function isNoteDeleted(id?: string | null): boolean {
  if (!id) return false;
  return globalDeletedNoteIds.has(id);
}

export function trackDeletedRelativePath(relPath: string) {
  if (!relPath) return;
  globalDeletedRelativePaths.add(relPath);
  setTimeout(() => {
    globalDeletedRelativePaths.delete(relPath);
  }, 4000);
}

export function clearDeletedRelativePath(relPath: string) {
  if (!relPath) return;
  globalDeletedRelativePaths.delete(relPath);
}

export function isRelativePathDeleted(relPath?: string | null): boolean {
  if (!relPath) return false;
  return globalDeletedRelativePaths.has(relPath);
}

declare global {
  interface FileSystemHandle {
    requestPermission?(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
    queryPermission?(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
    remove?(options?: { recursive?: boolean }): Promise<void>;
  }
}

export type ExtendedFileSystemHandle = FileSystemFileHandle | FileSystemDirectoryHandle;

export type OpenFolderPending = {
  kind: "file" | "folder";
  fileName?: string;
  contentFormat?: "plain" | "markdown" | "html";
  folderName?: string;
};

export type CreateNoteOptions = {
  fileName?: string;
  contentFormat?: "plain" | "markdown" | "html";
  initialContent?: string;
  icon?: string;
  iconColor?: string;
};

export async function requestPermissionIfAvailable(
  handle: FileSystemHandle | null | undefined,
  mode: "read" | "readwrite" = "readwrite",
): Promise<PermissionState | "granted"> {
  if (!handle) return "granted";
  const extHandle = handle as ExtendedFileSystemHandle;
  try {
    if (typeof extHandle.queryPermission === "function") {
      const state = await extHandle.queryPermission({ mode });
      if (state === "granted") return "granted";
    }
    if (typeof extHandle.requestPermission === "function") {
      return await extHandle.requestPermission({ mode });
    }
  } catch {
    /* ignore permission query errors */
  }
  return "granted";
}
