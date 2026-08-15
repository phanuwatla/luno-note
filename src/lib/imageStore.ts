/**
 * IndexedDB storage for note images and attachments.
 * Prevents LocalStorage 5MB quota overflow and persists image blobs reliably.
 */

const DB_NAME = "notes-plus-image-store";
const STORE_NAME = "images";
const DB_VERSION = 1;

function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

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

export async function saveImageToIndexedDb(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openImageDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("Failed to save image to IndexedDB"));
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn("Failed to save image blob to IndexedDB:", err);
  }
}

export async function getImageFromIndexedDb(id: string): Promise<Blob | null> {
  try {
    const db = await openImageDb();
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => reject(req.error ?? new Error("Failed to fetch image from IndexedDB"));
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function deleteImageFromIndexedDb(id: string): Promise<void> {
  try {
    const db = await openImageDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    /* ignore delete errors */
  }
}
