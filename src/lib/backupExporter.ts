import JSZip from "jszip";
import type { Note } from "@/hooks/useNotes";
import { APP_VERSION } from "@/lib/appVersion";

export interface BackupExportOptions {
  notes: Note[];
  workspaceName?: string | null;
  folderPaths?: string[];
}

export interface BackupExportResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  count: number;
  error?: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
}

function formatBackupDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d}_${h}${min}${s}`;
}

export async function exportWorkspaceBackupZip(
  options: BackupExportOptions
): Promise<BackupExportResult> {
  const { notes, workspaceName } = options;
  if (!notes || notes.length === 0) {
    return { success: false, count: 0, error: "No notes found to export" };
  }

  const zip = new JSZip();
  let exportedCount = 0;

  // 1. Process and add each note
  for (const note of notes) {
    // Skip internal virtual notes if any
    if (note.fileType === "luno-ai" || note.fileType === "web-viewer") {
      continue;
    }

    let fileName = note.fileName ? sanitizeFileName(note.fileName) : "";
    if (!fileName) {
      const ext = note.contentFormat === "html" ? ".html" : note.contentFormat === "plain" ? ".txt" : ".md";
      fileName = sanitizeFileName(note.title || "Untitled") + ext;
    }

    // Determine target relative path in ZIP
    const folder = note.folderPath ? note.folderPath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "") : "";
    const zipEntryPath = folder ? `${folder}/${fileName}` : fileName;

    const fileDate = new Date(note.updatedAt || note.createdAt || Date.now());

    // Handle binary / media files if running in Electron and content is not plain text
    const isBinary = note.fileType === "binary" || note.fileType === "image";
    let fileAdded = false;

    if (isBinary && typeof window !== "undefined" && (window as any).electronAPI?.readFileBase64) {
      try {
        const fullPath = (note as any).fullPath || (note as any).path;
        if (fullPath) {
          const b64 = await (window as any).electronAPI.readFileBase64(fullPath);
          if (b64) {
            zip.file(zipEntryPath, b64, { base64: true, date: fileDate });
            fileAdded = true;
          }
        }
      } catch {
        // Fallback to text content if reading disk fails
      }
    }

    if (!fileAdded) {
      const content = (note.isLocked && note.encryptedContent)
        ? note.encryptedContent
        : (note.content || "");
      zip.file(zipEntryPath, content, { date: fileDate });
    }

    exportedCount++;
  }

  // 2. Add backup metadata JSON
  const metadata = {
    appName: "Luno Note",
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    workspaceName: workspaceName || "Luno Workspace",
    totalNotes: exportedCount,
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      fileName: n.fileName,
      folderPath: n.folderPath,
      contentFormat: n.contentFormat,
      tags: n.tags,
      isFavorite: n.isFavorite,
      isLocked: n.isLocked,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
  };
  zip.file(".luno/backup-metadata.json", JSON.stringify(metadata, null, 2), { date: new Date() });

  // 3. Generate ZIP output
  const timestamp = formatBackupDate(new Date());
  const cleanWorkspace = workspaceName ? sanitizeFileName(workspaceName) : "Luno";
  const defaultZipFileName = `${cleanWorkspace}-Backup-${timestamp}.zip`;

  const isElectron = typeof window !== "undefined" && Boolean((window as any).electronAPI);

  // Desktop (Electron) flow: Show Native Save Dialog
  if (isElectron && (window as any).electronAPI?.showSaveDialog && (window as any).electronAPI?.writeFileBase64) {
    try {
      const dialogRes = await (window as any).electronAPI.showSaveDialog({
        title: "Save Luno Backup",
        defaultPath: defaultZipFileName,
        filters: [
          { name: "ZIP Archives (*.zip)", extensions: ["zip"] },
          { name: "All Files (*.*)", extensions: ["*"] },
        ],
      });

      // Handle both string path return or object { canceled, filePath }
      const chosenPath = typeof dialogRes === "string" ? dialogRes : dialogRes?.filePath;
      if (!chosenPath || (typeof dialogRes === "object" && dialogRes?.canceled)) {
        return { success: false, canceled: true, count: exportedCount };
      }

      const zipBase64 = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const writeOk = await (window as any).electronAPI.writeFileBase64({
        fullPath: chosenPath,
        base64: zipBase64,
        contentBase64: zipBase64,
      });

      if (!writeOk) {
        throw new Error("Electron failed to write ZIP file to disk");
      }

      return {
        success: true,
        filePath: chosenPath,
        count: exportedCount,
      };
    } catch (err: any) {
      console.error("Electron save backup failed:", err);
      // Fallback to browser blob download below if electron save dialog errors
    }
  }

  // Browser / Fallback flow: Trigger blob download
  try {
    const zipBlob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/zip",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const blobUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = defaultZipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

    return {
      success: true,
      filePath: defaultZipFileName,
      count: exportedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      count: exportedCount,
      error: err?.message || String(err),
    };
  }
}
