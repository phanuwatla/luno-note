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

export async function getStoredFileHandle(noteId: string): Promise<any | null> {
  if (!canUseNativeFileSystem()) return null;

  try {
    const handle = await withStore<any | undefined>("readonly", (store) => store.get(noteId));
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function setStoredFileHandle(noteId: string, handle: any) {
  if (!canUseNativeFileSystem()) return;
  await withStore("readwrite", (store) => store.put(handle, noteId));
}

export async function removeStoredFileHandle(noteId: string) {
  if (!canUseNativeFileSystem()) return;
  await withStore("readwrite", (store) => store.delete(noteId));
}

export async function clearAllStoredFileHandles() {
  if (!canUseNativeFileSystem()) return;
  await withStore("readwrite", (store) => store.clear());
}
