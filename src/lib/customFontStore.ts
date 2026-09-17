/**
 * Custom Font Storage & FontFace Management
 *
 * Supports:
 * 1. Electron workspace (.luno/fonts/ and .luno/fonts.json)
 * 2. Web File System Access API (.luno/fonts/)
 * 3. IndexedDB fallback (luno-note-font-store)
 * 4. Automatic @font-face and document.fonts FontFace registration
 */

export interface CustomFont {
  id: string; // Unique ID, e.g. "custom-kanit-light-xyz"
  name: string; // User-facing display name, e.g. "Kanit Light"
  fileName: string; // File name on disk, e.g. "Kanit-Light.ttf"
  format: "truetype" | "opentype" | "woff" | "woff2";
  dataUrl?: string; // base64 data URL for CSS font-face
  css: string; // CSS font-family string, e.g. "'Kanit Light', sans-serif"
  createdAt: number;
}

const DB_NAME = "luno-note-font-store";
const STORE_NAME = "custom_fonts";
const DB_VERSION = 1;

let currentWorkspaceHandle: FileSystemDirectoryHandle | null = null;

export function setCustomFontWorkspaceHandle(handle: FileSystemDirectoryHandle | null) {
  currentWorkspaceHandle = handle;
}

/**
 * Open IndexedDB for custom font fallback storage.
 */
function openFontDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

/**
 * Detects font format based on file extension.
 */
export function detectFontFormat(fileName: string): "truetype" | "opentype" | "woff" | "woff2" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".woff2")) return "woff2";
  if (lower.endsWith(".woff")) return "woff";
  if (lower.endsWith(".otf")) return "opentype";
  return "truetype";
}

/**
 * Returns MIME type for font format.
 */
export function getFontMimeType(format: string): string {
  switch (format) {
    case "woff2":
      return "font/woff2";
    case "woff":
      return "font/woff";
    case "opentype":
      return "font/otf";
    default:
      return "font/ttf";
  }
}

/**
 * Registers @font-face CSS and adds to document.fonts.
 */
export function registerFontFace(font: CustomFont, dataUrl: string): void {
  if (typeof document === "undefined" || !dataUrl) return;

  try {
    // 1. Using Browser FontFace API if supported
    if (typeof FontFace !== "undefined" && document.fonts) {
      const fontFace = new FontFace(font.name, `url("${dataUrl}")`, {
        style: "normal",
        weight: "normal",
      });
      fontFace
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
        })
        .catch((err) => {
          console.warn(`[CustomFont] Failed to load FontFace ${font.name}:`, err);
        });
    }

    // 2. Inject or update in <style id="luno-custom-fonts">
    let styleEl = document.getElementById("luno-custom-fonts") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "luno-custom-fonts";
      document.head.appendChild(styleEl);
    }

    const cssRules = `
/* Custom Font: ${font.name} */
@font-face {
  font-family: '${font.name}';
  src: url('${dataUrl}') format('${font.format}');
  font-display: swap;
}
:root[data-app-font='${font.id}'] {
  --app-font-family: '${font.name}', sans-serif;
  font-family: '${font.name}', sans-serif;
}
:root[data-editor-font='${font.id}'] {
  --editor-font-family: '${font.name}', sans-serif;
}
`;

    // Only append if not already present
    if (!styleEl.textContent?.includes(`data-app-font='${font.id}'`)) {
      styleEl.textContent += `\n${cssRules}`;
    }
  } catch (err) {
    console.warn(`[CustomFont] Error injecting font-face for ${font.name}:`, err);
  }
}

/**
 * Re-injects all CSS rules for active custom fonts.
 */
export function refreshCustomFontStyles(fonts: CustomFont[]): void {
  if (typeof document === "undefined") return;

  let styleEl = document.getElementById("luno-custom-fonts") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "luno-custom-fonts";
    document.head.appendChild(styleEl);
  }

  let content = "";
  for (const font of fonts) {
    if (font.dataUrl) {
      content += `
@font-face {
  font-family: '${font.name}';
  src: url('${font.dataUrl}') format('${font.format}');
  font-display: swap;
}
:root[data-app-font='${font.id}'] {
  --app-font-family: '${font.name}', sans-serif;
  font-family: '${font.name}', sans-serif;
}
:root[data-editor-font='${font.id}'] {
  --editor-font-family: '${font.name}', sans-serif;
}
`;
    }
  }
  styleEl.textContent = content;
}

/**
 * Load all custom fonts from Workspace (.luno/fonts/) and/or IndexedDB fallback.
 */
export async function loadCustomFonts(): Promise<CustomFont[]> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

  // 1. Try reading from Electron workspace .luno/fonts.json & font files
  if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent && electronAPI?.readFileBase64) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const metadataPath = `${saved.folderPath}/.luno/fonts.json`;
        const metadataStr = await electronAPI.readFileContent(metadataPath);
        if (metadataStr) {
          const fontList: CustomFont[] = JSON.parse(metadataStr);
          const loadedFonts: CustomFont[] = [];

          for (const f of fontList) {
            const fontFilePath = `${saved.folderPath}/.luno/fonts/${f.fileName}`;
            const base64 = await electronAPI.readFileBase64(fontFilePath);
            if (base64) {
              const mime = getFontMimeType(f.format);
              const dataUrl = `data:${mime};base64,${base64}`;
              const fullFont: CustomFont = {
                ...f,
                dataUrl,
                css: `'${f.name}', sans-serif`,
              };
              registerFontFace(fullFont, dataUrl);
              loadedFonts.push(fullFont);
            }
          }

          if (loadedFonts.length > 0) {
            return loadedFonts;
          }
        }
      }
    } catch (err) {
      console.warn("[CustomFont] Failed to read workspace fonts in Electron:", err);
    }
  }

  // 2. Try reading from Web File System Access API (.luno/fonts/)
  if (currentWorkspaceHandle) {
    try {
      const lunoDir = await currentWorkspaceHandle.getDirectoryHandle(".luno", { create: false });
      const fontsMetaFile = await lunoDir.getFileHandle("fonts.json", { create: false });
      const metaFile = await fontsMetaFile.getFile();
      const metaText = await metaFile.text();
      const fontList: CustomFont[] = JSON.parse(metaText);

      const fontsDir = await lunoDir.getDirectoryHandle("fonts", { create: false });
      const loadedFonts: CustomFont[] = [];

      for (const f of fontList) {
        try {
          const fontFileHandle = await fontsDir.getFileHandle(f.fileName, { create: false });
          const fontFile = await fontFileHandle.getFile();
          const buffer = await fontFile.arrayBuffer();
          const base64 = arrayBufferToBase64(buffer);
          const mime = getFontMimeType(f.format);
          const dataUrl = `data:${mime};base64,${base64}`;
          const fullFont: CustomFont = {
            ...f,
            dataUrl,
            css: `'${f.name}', sans-serif`,
          };
          registerFontFace(fullFont, dataUrl);
          loadedFonts.push(fullFont);
        } catch {}
      }

      if (loadedFonts.length > 0) {
        return loadedFonts;
      }
    } catch {}
  }

  // 3. Fallback: Read from IndexedDB
  try {
    const db = await openFontDb();
    const storedFonts: CustomFont[] = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as CustomFont[]) || []);
      req.onerror = () => resolve([]);
      tx.oncomplete = () => db.close();
    });

    for (const f of storedFonts) {
      if (f.dataUrl) {
        registerFontFace(f, f.dataUrl);
      }
    }
    return storedFonts;
  } catch {
    return [];
  }
}

/**
 * Convert ArrayBuffer to Base64.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Save custom font file to Workspace and IndexedDB fallback.
 */
export async function saveCustomFont(
  file: File,
  customName?: string
): Promise<CustomFont> {
  const fileName = file.name;
  const format = detectFontFormat(fileName);
  const mime = getFontMimeType(format);

  const cleanName =
    customName?.trim() ||
    fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .trim() ||
    "Custom Font";

  const id = `custom-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

  const buffer = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  const dataUrl = `data:${mime};base64,${base64}`;

  const newFont: CustomFont = {
    id,
    name: cleanName,
    fileName,
    format,
    dataUrl,
    css: `'${cleanName}', sans-serif`,
    createdAt: Date.now(),
  };

  // 1. Register immediately in runtime
  registerFontFace(newFont, dataUrl);

  // 2. Persist in IndexedDB
  try {
    const db = await openFontDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(newFont);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn("[CustomFont] Failed to save to IndexedDB:", err);
  }

  // 3. Persist in Electron workspace .luno/fonts/
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileBase64 && electronAPI?.writeFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fontFilePath = `${saved.folderPath}/.luno/fonts/${fileName}`;
        await electronAPI.writeFileBase64({ fullPath: fontFilePath, base64 });

        // Update .luno/fonts.json metadata
        const metadataPath = `${saved.folderPath}/.luno/fonts.json`;
        let existing: CustomFont[] = [];
        try {
          const content = await electronAPI.readFileContent(metadataPath);
          if (content) existing = JSON.parse(content);
        } catch {}

        const updated = existing.filter((f) => f.id !== id);
        // Store metadata without heavy dataUrl in JSON file on disk
        const metaFont = { ...newFont };
        delete metaFont.dataUrl;
        updated.push(metaFont);

        await electronAPI.writeFileContent({
          fullPath: metadataPath,
          content: JSON.stringify(updated, null, 2),
        });
      }
    } catch (err) {
      console.warn("[CustomFont] Failed to save font to Electron workspace:", err);
    }
  }

  // 4. Persist in Web FS workspace
  if (currentWorkspaceHandle) {
    try {
      const lunoDir = await currentWorkspaceHandle.getDirectoryHandle(".luno", { create: true });
      const fontsDir = await lunoDir.getDirectoryHandle("fonts", { create: true });
      const fontFileHandle = await fontsDir.getFileHandle(fileName, { create: true });
      const writable = await fontFileHandle.createWritable();
      await writable.write(buffer);
      await writable.close();

      let existing: CustomFont[] = [];
      try {
        const fontsMetaFile = await lunoDir.getFileHandle("fonts.json", { create: false });
        const metaFile = await fontsMetaFile.getFile();
        const metaText = await metaFile.text();
        existing = JSON.parse(metaText);
      } catch {}

      const updated = existing.filter((f) => f.id !== id);
      const metaFont = { ...newFont };
      delete metaFont.dataUrl;
      updated.push(metaFont);

      const metaHandle = await lunoDir.getFileHandle("fonts.json", { create: true });
      const metaWritable = await metaHandle.createWritable();
      await metaWritable.write(JSON.stringify(updated, null, 2));
      await metaWritable.close();
    } catch (err) {
      console.warn("[CustomFont] Failed to save font to Web FS workspace:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("luno:custom-fonts-changed"));
  }

  return newFont;
}

/**
 * Rename a custom font.
 */
export async function renameCustomFont(id: string, newName: string): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed) return;

  // 1. Update IndexedDB
  try {
    const db = await openFontDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const font = getReq.result as CustomFont | undefined;
        if (font) {
          font.name = trimmed;
          font.css = `'${trimmed}', sans-serif`;
          store.put(font);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn("[CustomFont] Failed to rename in IndexedDB:", err);
  }

  // 2. Update Electron workspace metadata
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent && electronAPI?.writeFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const metadataPath = `${saved.folderPath}/.luno/fonts.json`;
        const content = await electronAPI.readFileContent(metadataPath);
        if (content) {
          const list: CustomFont[] = JSON.parse(content);
          const target = list.find((f) => f.id === id);
          if (target) {
            target.name = trimmed;
            target.css = `'${trimmed}', sans-serif`;
            await electronAPI.writeFileContent({
              fullPath: metadataPath,
              content: JSON.stringify(list, null, 2),
            });
          }
        }
      }
    } catch (err) {
      console.warn("[CustomFont] Failed to rename font in Electron:", err);
    }
  }

  // 3. Update Web FS workspace metadata
  if (currentWorkspaceHandle) {
    try {
      const lunoDir = await currentWorkspaceHandle.getDirectoryHandle(".luno", { create: false });
      const metaHandle = await lunoDir.getFileHandle("fonts.json", { create: false });
      const file = await metaHandle.getFile();
      const text = await file.text();
      const list: CustomFont[] = JSON.parse(text);
      const target = list.find((f) => f.id === id);
      if (target) {
        target.name = trimmed;
        target.css = `'${trimmed}', sans-serif`;
        const writable = await metaHandle.createWritable();
        await writable.write(JSON.stringify(list, null, 2));
        await writable.close();
      }
    } catch (err) {
      console.warn("[CustomFont] Failed to rename font in Web FS:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("luno:custom-fonts-changed"));
  }
}

/**
 * Delete a custom font from Workspace and IndexedDB.
 */
export async function deleteCustomFont(id: string): Promise<void> {
  // 1. Remove from IndexedDB
  try {
    const db = await openFontDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn("[CustomFont] Failed to delete from IndexedDB:", err);
  }

  // 2. Remove from Electron workspace
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
  if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent && electronAPI?.writeFileContent) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const metadataPath = `${saved.folderPath}/.luno/fonts.json`;
        const content = await electronAPI.readFileContent(metadataPath);
        if (content) {
          const list: CustomFont[] = JSON.parse(content);
          const toDelete = list.find((f) => f.id === id);
          const updated = list.filter((f) => f.id !== id);

          await electronAPI.writeFileContent({
            fullPath: metadataPath,
            content: JSON.stringify(updated, null, 2),
          });

          if (toDelete?.fileName && electronAPI.deleteFileOrFolder) {
            const fontFilePath = `${saved.folderPath}/.luno/fonts/${toDelete.fileName}`;
            await electronAPI.deleteFileOrFolder(fontFilePath);
          }
        }
      }
    } catch (err) {
      console.warn("[CustomFont] Failed to delete font from Electron:", err);
    }
  }

  // 3. Remove from Web FS workspace
  if (currentWorkspaceHandle) {
    try {
      const lunoDir = await currentWorkspaceHandle.getDirectoryHandle(".luno", { create: false });
      const metaHandle = await lunoDir.getFileHandle("fonts.json", { create: false });
      const file = await metaHandle.getFile();
      const text = await file.text();
      const list: CustomFont[] = JSON.parse(text);
      const toDelete = list.find((f) => f.id === id);
      const updated = list.filter((f) => f.id !== id);

      const writable = await metaHandle.createWritable();
      await writable.write(JSON.stringify(updated, null, 2));
      await writable.close();

      if (toDelete?.fileName) {
        const fontsDir = await lunoDir.getDirectoryHandle("fonts", { create: false });
        await fontsDir.removeEntry(toDelete.fileName);
      }
    } catch (err) {
      console.warn("[CustomFont] Failed to delete font from Web FS:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("luno:custom-fonts-changed"));
  }
}
