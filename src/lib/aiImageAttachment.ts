import { escapeHtml } from "@/lib/htmlUtils";
import { imageLocalCache } from "@/components/editor/ImageNodeView";

export interface SaveAiImageOptions {
  dataUrl: string;
  prompt?: string;
  mimeType?: string;
  targetFolderPath?: string;
}

export interface SavedAiImageAttachment {
  markdown: string;
  htmlTag: string;
  src: string;
  alt: string;
  relativeSrc?: string;
  fileName: string;
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  try {
    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(0, commaIdx);
    const base64 = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/^data:([^;]+);base64$/i);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  } catch {
    return null;
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read blob as data URL"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

function getExtensionFromMime(mimeType: string): string {
  const lower = mimeType.toLowerCase();
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("gif")) return "gif";
  return "png";
}

function buildAiImageFileName(prompt: string | undefined, mimeType: string): string {
  const cleanSlug = (prompt || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 28);
  const timeTag = Date.now().toString().slice(-6);
  const ext = getExtensionFromMime(mimeType);
  return cleanSlug ? `luno_ai_${cleanSlug}_${timeTag}.${ext}` : `luno_ai_image_${timeTag}.${ext}`;
}

function getRelativeAttachmentPathForFolder(attachmentFileName: string, folderPath?: string): string {
  const depth = (folderPath ?? "").split("/").filter(Boolean).length;
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  const rawPath = `${prefix}attachments/${attachmentFileName}`;
  try {
    return encodeURI(decodeURI(rawPath));
  } catch {
    return rawPath.replace(/ /g, "%20");
  }
}

function sanitizeMarkdownAlt(alt: string): string {
  return alt.replace(/[\r\n]+/g, " ").replace(/[\[\]]/g, "").trim().slice(0, 120) || "AI Generated Image";
}

interface WebDirectoryHandleLike {
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<WebDirectoryHandleLike>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

/**
 * Persists a generated AI image into the workspace's `attachments/` folder (Electron or Web FS API)
 * and returns ready-to-insert Markdown/HTML and editor attributes.
 * Falls back cleanly to data URL when no disk workspace is connected.
 */
export async function saveAiImageToWorkspaceAttachment(
  options: SaveAiImageOptions
): Promise<SavedAiImageAttachment> {
  const { dataUrl, prompt, targetFolderPath } = options;
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/i);
  const mimeType = options.mimeType || (mimeMatch ? mimeMatch[1] : "image/png");
  const safeAlt = sanitizeMarkdownAlt(prompt || "AI Generated Image");
  const baseFileName = buildAiImageFileName(prompt, mimeType);
  const blob = dataUrlToBlob(dataUrl);
  const rawBase64 = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : "";

  const electronAPI = typeof window !== "undefined" ? window.electronAPI : undefined;

  // 1. Electron desktop workspace
  if (electronAPI?.getSavedWorkspace && (electronAPI.writeFileBuffer || electronAPI.writeFileBase64)) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      const workspacePath = saved?.folderPath || saved?.path;
      if (workspacePath) {
        let uniqueName = baseFileName;
        if (electronAPI.readDirectoryFiles) {
          try {
            const existingFiles = (await electronAPI.readDirectoryFiles(`${workspacePath}/attachments`)) || [];
            const existingNames = new Set(existingFiles.map((f) => f.name));
            const lastDot = baseFileName.lastIndexOf(".");
            const namePart = lastDot > 0 ? baseFileName.slice(0, lastDot) : baseFileName;
            const extPart = lastDot > 0 ? baseFileName.slice(lastDot) : "";
            let counter = 1;
            while (existingNames.has(uniqueName)) {
              uniqueName = `${namePart}_${counter}${extPart}`;
              counter++;
            }
          } catch {
            // attachments folder may not exist yet; writeFile* creates parent directories
          }
        }

        const fullAttachmentPath = `${workspacePath}/attachments/${uniqueName}`.replace(/\\/g, "/");
        let wrote = false;
        if (blob && electronAPI.writeFileBuffer) {
          const buffer = await blob.arrayBuffer();
          wrote = Boolean(await electronAPI.writeFileBuffer({ fullPath: fullAttachmentPath, buffer }));
        }
        if (!wrote && rawBase64 && electronAPI.writeFileBase64) {
          wrote = Boolean(await electronAPI.writeFileBase64({ fullPath: fullAttachmentPath, base64: rawBase64 }));
        }

        if (wrote) {
          const relPath = getRelativeAttachmentPathForFolder(uniqueName, targetFolderPath);
          const cleanRel = `attachments/${uniqueName}`;
          const blobUrl =
            blob && typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
              ? URL.createObjectURL(blob)
              : dataUrl;

          imageLocalCache.set(cleanRel, blobUrl);
          imageLocalCache.set(relPath, blobUrl);
          imageLocalCache.set(fullAttachmentPath, blobUrl);

          return {
            markdown: `![${safeAlt}](${relPath})`,
            htmlTag: `<img src="${escapeHtml(relPath)}" alt="${escapeHtml(safeAlt)}" />`,
            src: blobUrl,
            alt: safeAlt,
            relativeSrc: relPath,
            fileName: uniqueName,
          };
        }
      }
    } catch (err) {
      console.warn("Failed to save AI image attachment in Electron workspace:", err);
    }
  }

  // 2. Web File System Access API workspace
  const globalRootDir =
    typeof window !== "undefined"
      ? ((window as unknown as { __luno_rootDirHandle?: WebDirectoryHandleLike }).__luno_rootDirHandle ?? null)
      : null;

  if (globalRootDir && typeof globalRootDir.getDirectoryHandle === "function" && blob) {
    try {
      const attachmentsDir = await globalRootDir.getDirectoryHandle("attachments", { create: true });
      const fileHandle = await attachmentsDir.getFileHandle(baseFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      const relPath = getRelativeAttachmentPathForFolder(baseFileName, targetFolderPath);
      const cleanRel = `attachments/${baseFileName}`;
      const blobUrl =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(blob)
          : dataUrl;

      imageLocalCache.set(cleanRel, blobUrl);
      imageLocalCache.set(relPath, blobUrl);

      return {
        markdown: `![${safeAlt}](${relPath})`,
        htmlTag: `<img src="${escapeHtml(relPath)}" alt="${escapeHtml(safeAlt)}" />`,
        src: blobUrl,
        alt: safeAlt,
        relativeSrc: relPath,
        fileName: baseFileName,
      };
    } catch (err) {
      console.warn("Failed to save AI image attachment via File System Access API:", err);
    }
  }

  // 3. Fallback (browser-only mode without disk workspace)
  return {
    markdown: `![${safeAlt}](${dataUrl})`,
    htmlTag: `<img src="${escapeHtml(dataUrl)}" alt="${escapeHtml(safeAlt)}" />`,
    src: dataUrl,
    alt: safeAlt,
    fileName: baseFileName,
  };
}
