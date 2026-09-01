import { Note } from "@/hooks/useNotes";
import { getAllKnownLocalManifests } from "./workspaceIdentity";

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webContentLink?: string;
  webViewLink?: string;
}

export interface LunoFolderStructure {
  rootId: string;
  workspacesId?: string;
  projectId: string;
  notesId?: string;
  attachmentsId: string;
  lunoMetaId: string;
}

const BASE_URL = "https://www.googleapis.com/drive/v3";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";

export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 4): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, options);
      // Google Drive returns 403 for userRateLimitExceeded / rateLimitExceeded and 429 for rate limit
      if (res.status === 429 || res.status === 403 || res.status === 500 || res.status === 502 || res.status === 503) {
        if (attempt < maxRetries) {
          attempt++;
          const delay = Math.min(800 * Math.pow(2, attempt) + Math.random() * 200, 8000);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
      return res;
    } catch (err) {
      if (attempt < maxRetries) {
        attempt++;
        const delay = Math.min(800 * Math.pow(2, attempt) + Math.random() * 200, 8000);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

const getFolderStructureCacheKey = (projectName?: string) => {
  const clean = (projectName || "Workspace").trim().toLowerCase();
  return `luno_gdrive_folder_ids_${clean}`;
};

const inMemoryFolderStructureCache = new Map<string, string>();

export function getCachedFolderStructure(projectName?: string): LunoFolderStructure | null {
  try {
    const key = getFolderStructureCacheKey(projectName);
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : inMemoryFolderStructureCache.get(key);
    return raw ? (JSON.parse(raw) as LunoFolderStructure) : null;
  } catch {
    return null;
  }
}

export function cacheFolderStructure(structure: LunoFolderStructure, projectName?: string): void {
  try {
    const key = getFolderStructureCacheKey(projectName);
    const str = JSON.stringify(structure);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, str);
    }
    inMemoryFolderStructureCache.set(key, str);
  } catch {
    // ignore
  }
}

// Helper to move all items from a duplicate folder into primary folder, then trash the duplicate
async function mergeAndTrashDuplicateFolder(
  token: string,
  targetFolderId: string,
  duplicateFolderId: string
): Promise<void> {
  if (!targetFolderId || !duplicateFolderId || targetFolderId === duplicateFolderId) return;
  try {
    const q = `'${duplicateFolderId}' in parents and trashed = false`;
    const res = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const files = (data.files || []) as DriveFileItem[];
      for (const file of files) {
        try {
          await fetch(
            `${BASE_URL}/files/${file.id}?addParents=${targetFolderId}&removeParents=${duplicateFolderId}&fields=id`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch {
          // ignore individual item move errors
        }
      }
    }
    await trashDriveFile(token, duplicateFolderId);
  } catch (err) {
    console.warn(`Failed to merge duplicate folder ${duplicateFolderId}:`, err);
  }
}

// Find a folder by name inside a parent folder (deduplicates if multiple found)
async function findFolder(token: string, folderName: string, parentId?: string): Promise<string | null> {
  const escapedName = folderName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  let q = `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }
  const url = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=10`;

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    const data = await res.json();
    const files: DriveFileItem[] = data.files || [];
    if (files.length > 0) {
      const primaryId = files[0].id;
      if (files.length > 1) {
        for (let i = 1; i < files.length; i++) {
          void mergeAndTrashDuplicateFolder(token, primaryId, files[i].id);
        }
      }
      return primaryId;
    }
  }

  // Case-insensitive search fallback if exact match query found 0 items
  if (parentId) {
    try {
      const qAll = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const resAll = await fetchWithRetry(`${BASE_URL}/files?q=${encodeURIComponent(qAll)}&fields=files(id,name,modifiedTime)&pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resAll.ok) {
        const dataAll = await resAll.json();
        const filesAll: DriveFileItem[] = dataAll.files || [];
        const matches = filesAll.filter((f) => f.name.toLowerCase() === folderName.toLowerCase());
        if (matches.length > 0) {
          const primaryId = matches[0].id;
          if (matches.length > 1) {
            for (let i = 1; i < matches.length; i++) {
              void mergeAndTrashDuplicateFolder(token, primaryId, matches[i].id);
            }
          }
          return primaryId;
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

// Create a folder on Google Drive
async function createFolder(token: string, folderName: string, parentId?: string): Promise<string> {
  const metadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetchWithRetry(`${BASE_URL}/files?fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    throw new Error(`Failed to create folder ${folderName} (${res.status})`);
  }

  const data = await res.json();
  return data.id as string;
}

const lunoFolderCreationPromises = new Map<string, Promise<LunoFolderStructure>>();

// Get or create Luno folder hierarchy: Luno/Workspaces/[Workspace]/ (notes directly inside Workspace/, attachments/, .luno/)
export async function ensureLunoFolderStructure(token: string, projectName: string = "Workspace"): Promise<LunoFolderStructure> {
  const cleanProjectName = projectName.trim() || "Workspace";
  const lockKey = `${token.slice(-10)}:${cleanProjectName.toLowerCase()}`;
  if (lunoFolderCreationPromises.has(lockKey)) {
    return await lunoFolderCreationPromises.get(lockKey)!;
  }

  const promise = (async () => {
    const cached = getCachedFolderStructure(cleanProjectName);
    if (cached && cached.projectId) {
      // Verify cached root still exists AND folder name matches cleanProjectName
      try {
        const res = await fetch(`${BASE_URL}/files/${cached.projectId}?fields=id,name,trashed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const file = await res.json();
          if (!file.trashed && file.name.toLowerCase() === cleanProjectName.toLowerCase()) {
            return cached;
          }
        }
      } catch {
        // cache invalid, re-fetch
      }
    }

    // 1. Root Luno/ folder
    let rootId = await findFolder(token, "Luno");
    if (!rootId) {
      rootId = await createFolder(token, "Luno");
    }

    // 2. Intermediate Workspaces/ folder inside Luno/ (Luno/Workspaces/)
    let workspacesId = await findFolder(token, "Workspaces", rootId);
    if (!workspacesId) {
      workspacesId = await createFolder(token, "Workspaces", rootId);
    }

    // 3. Auto-migrate any legacy workspace folders sitting directly in Luno/ into Luno/Workspaces/
    try {
      const qDirectFolders = `'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const resDirect = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(qDirectFolders)}&fields=files(id,name)&pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resDirect.ok) {
        const dataDirect = await resDirect.json();
        const directFolders = (dataDirect.files || []) as DriveFileItem[];
        for (const df of directFolders) {
          if (df.id !== workspacesId && df.name.toLowerCase() !== "workspaces") {
            const existingInWorkspaces = await findFolder(token, df.name, workspacesId);
            if (existingInWorkspaces && existingInWorkspaces !== df.id) {
              await mergeAndTrashDuplicateFolder(token, existingInWorkspaces, df.id);
            } else {
              await fetch(`${BASE_URL}/files/${df.id}?addParents=${workspacesId}&removeParents=${rootId}&fields=id,parents`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
              });
            }
          }
        }
      }
    } catch (migErr) {
      console.warn("Workspace folder migration error:", migErr);
    }

    // 4. Project Workspace folder inside Luno/Workspaces/ (e.g. Luno/Workspaces/NOTES+/)
    let projectId = await findFolder(token, cleanProjectName, workspacesId);
    if (!projectId) {
      projectId = await createFolder(token, cleanProjectName, workspacesId);
    }

    // 5. System Subfolders inside Luno/Workspaces/[Workspace]/
    let attachmentsId = await findFolder(token, "attachments", projectId);
    if (!attachmentsId) {
      attachmentsId = await findFolder(token, "Attachments", projectId);
    }
    if (!attachmentsId) {
      attachmentsId = await createFolder(token, "attachments", projectId);
    }

    let lunoMetaId = await findFolder(token, ".luno", projectId);
    if (!lunoMetaId) {
      lunoMetaId = await createFolder(token, ".luno", projectId);
    }

    const structure: LunoFolderStructure = {
      rootId,
      workspacesId,
      projectId,
      attachmentsId,
      lunoMetaId,
    };
    cacheFolderStructure(structure, cleanProjectName);

    // Automatically trash/clean any legacy "My Luno Project" folder inside Luno/, Workspaces/, or in Drive root
    try {
      const legacyId = await findFolder(token, "My Luno Project", workspacesId);
      if (legacyId && legacyId !== projectId) {
        void mergeAndTrashDuplicateFolder(token, projectId, legacyId);
      }
      const legacyInRootId = await findFolder(token, "My Luno Project", rootId);
      if (legacyInRootId && legacyInRootId !== projectId) {
        void mergeAndTrashDuplicateFolder(token, projectId, legacyInRootId);
      }
      const rootLegacyId = await findFolder(token, "My Luno Project");
      if (rootLegacyId && rootLegacyId !== projectId && rootLegacyId !== rootId && rootLegacyId !== workspacesId) {
        void mergeAndTrashDuplicateFolder(token, projectId, rootLegacyId);
      }
    } catch {
      // ignore legacy cleanup error
    }

    return structure;
  })();

  lunoFolderCreationPromises.set(lockKey, promise);
  try {
    return await promise;
  } finally {
    lunoFolderCreationPromises.delete(lockKey);
  }
}

// Cache folder paths to avoid redundant Drive queries
const folderPathCache = new Map<string, string>();
const singleFolderPromises = new Map<string, Promise<string>>();

export function clearFolderPathCache(): void {
  folderPathCache.clear();
  singleFolderPromises.clear();
}

// Atomically ensure a single folder segment exists under parentId without race conditions
export async function ensureSingleFolder(
  token: string,
  parentId: string,
  folderName: string
): Promise<string> {
  const cleanName = folderName.trim();
  const lockKey = `${parentId}:${cleanName.toLowerCase()}`;

  if (folderPathCache.has(lockKey)) {
    return folderPathCache.get(lockKey)!;
  }
  if (singleFolderPromises.has(lockKey)) {
    return await singleFolderPromises.get(lockKey)!;
  }

  const promise = (async () => {
    // 1. Search if folder already exists on Google Drive
    const cleanSegment = cleanName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const q = `'${parentId}' in parents and name = '${cleanSegment}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=10`;

    try {
      const res = await fetchWithRetry(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const files: DriveFileItem[] = data.files || [];
        if (files.length > 0) {
          files.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
          const primaryId = files[0].id;
          if (files.length > 1) {
            for (let i = 1; i < files.length; i++) {
              void mergeAndTrashDuplicateFolder(token, primaryId, files[i].id);
            }
          }
          folderPathCache.set(lockKey, primaryId);
          return primaryId;
        }
      }
    } catch {
      // ignore search error
    }

    // Case-insensitive search fallback
    try {
      const qAll = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const resAll = await fetchWithRetry(`${BASE_URL}/files?q=${encodeURIComponent(qAll)}&fields=files(id,name,modifiedTime)&pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resAll.ok) {
        const dataAll = await resAll.json();
        const filesAll: DriveFileItem[] = dataAll.files || [];
        const matches = filesAll.filter((f) => f.name.toLowerCase() === cleanName.toLowerCase());
        if (matches.length > 0) {
          matches.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
          const primaryId = matches[0].id;
          if (matches.length > 1) {
            for (let i = 1; i < matches.length; i++) {
              void mergeAndTrashDuplicateFolder(token, primaryId, matches[i].id);
            }
          }
          folderPathCache.set(lockKey, primaryId);
          return primaryId;
        }
      }
    } catch {
      // ignore
    }

    // 2. Folder does not exist, create it
    const createdId = await createFolder(token, cleanName, parentId);
    folderPathCache.set(lockKey, createdId);
    return createdId;
  })();

  singleFolderPromises.set(lockKey, promise);
  try {
    return await promise;
  } finally {
    singleFolderPromises.delete(lockKey);
  }
}

// Ensure nested subfolder path exists on Google Drive (e.g. "Projects/Luno")
export async function ensureDriveFolderPath(
  token: string,
  baseFolderId: string,
  folderPath: string
): Promise<string> {
  const normalized = folderPath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").trim();
  if (!normalized) return baseFolderId;

  const fullCacheKey = `${baseFolderId}:${normalized.toLowerCase()}`;
  if (folderPathCache.has(fullCacheKey)) {
    return folderPathCache.get(fullCacheKey)!;
  }

  const segments = normalized.split("/").filter(Boolean);
  let currentParentId = baseFolderId;

  for (const segment of segments) {
    currentParentId = await ensureSingleFolder(token, currentParentId, segment);
  }

  folderPathCache.set(fullCacheKey, currentParentId);
  return currentParentId;
}

// List all files in Luno/Notes/ folder recursively including subfolders
export async function listDriveNoteFiles(
  token: string,
  notesFolderId: string
): Promise<(DriveFileItem & { folderPath?: string })[]> {
  const allNoteFiles: (DriveFileItem & { folderPath?: string })[] = [];

  async function scanFolder(folderId: string, currentPath: string) {
    const q = `'${folderId}' in parents and trashed = false`;
    const url = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,size,webContentLink,webViewLink)&pageSize=1000`;

    const res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const data = await res.json();
    const items: DriveFileItem[] = data.files || [];

    for (const item of items) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        const lname = item.name.toLowerCase();
        if (lname === "attachments" || lname === ".luno") continue;
        const subPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        await scanFolder(item.id, subPath);
      } else {
        allNoteFiles.push({
          ...item,
          folderPath: currentPath || undefined,
        });
      }
    }
  }

  await scanFolder(notesFolderId, "");
  return allNoteFiles;
}

// Read raw file content from Google Drive
export async function fetchDriveFileContent(token: string, driveFileId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/files/${driveFileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download file content (${res.status})`);
  }

  return await res.text();
}

const BINARY_IMAGE_EXT_SET = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico", ".tiff", ".avif",
  ".mp4", ".webm", ".mp3", ".wav", ".pdf", ".zip", ".tar", ".gz", ".docx", ".xlsx", ".pptx",
]);

const singleNoteUploadPromises = new Map<string, Promise<DriveFileItem>>();

// Create or update a .md note file on Google Drive in appropriate subfolder
export async function uploadDriveNoteFile(
  token: string,
  notesFolderId: string,
  fileName: string,
  content: string,
  driveFileId?: string,
  folderPath?: string
): Promise<DriveFileItem> {
  const dotIndex = fileName.lastIndexOf(".");
  const ext = dotIndex > 0 ? fileName.slice(dotIndex).toLowerCase() : "";

  if (BINARY_IMAGE_EXT_SET.has(ext)) {
    throw new Error(`Cannot upload binary/image file ${fileName} via text note uploader`);
  }

  const cleanName = ext === ".md" || ext === ".txt" || ext === ".html" || ext === ".htm" ? fileName : (ext ? fileName : `${fileName}.md`);
  const mimeType = cleanName.endsWith(".html") || cleanName.endsWith(".htm") ? "text/html" : cleanName.endsWith(".txt") ? "text/plain" : "text/markdown";

  let targetFolderId = notesFolderId;
  if (folderPath && folderPath.trim()) {
    targetFolderId = await ensureDriveFolderPath(token, notesFolderId, folderPath);
  }

  const lockKey = `${targetFolderId}:${cleanName.toLowerCase()}`;
  if (singleNoteUploadPromises.has(lockKey)) {
    return await singleNoteUploadPromises.get(lockKey)!;
  }

  const uploadPromise = (async () => {
    let targetDriveId = driveFileId;

    // Verify targetDriveId is still alive, not in trash, and resides in targetFolderId
    if (targetDriveId) {
      try {
        const resCheck = await fetchWithRetry(`${BASE_URL}/files/${targetDriveId}?fields=id,trashed,parents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resCheck.ok) {
          const fileCheck = await resCheck.json();
          if (fileCheck.trashed || !fileCheck.parents || !fileCheck.parents.includes(targetFolderId)) {
            targetDriveId = undefined;
          }
        } else {
          targetDriveId = undefined;
        }
      } catch {
        targetDriveId = undefined;
      }
    }

    // If no valid driveFileId is provided, check if a file with cleanName already exists on Drive in targetFolderId
    if (!targetDriveId) {
      try {
        const q = `'${targetFolderId}' in parents and name = '${cleanName.replace(/'/g, "\\'")}' and trashed = false`;
        const searchUrl = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=10`;
        const res = await fetchWithRetry(searchUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const files: DriveFileItem[] = data.files || [];
          if (files.length > 0) {
            files.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
            targetDriveId = files[0].id;
            if (files.length > 1) {
              for (let i = 1; i < files.length; i++) {
                void trashDriveFile(token, files[i].id);
              }
            }
          }
        }

        if (!targetDriveId) {
          const qAll = `'${targetFolderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
          const searchUrlAll = `${BASE_URL}/files?q=${encodeURIComponent(qAll)}&fields=files(id,name,modifiedTime)&pageSize=100`;
          const resAll = await fetchWithRetry(searchUrlAll, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resAll.ok) {
            const dataAll = await resAll.json();
            const filesAll: DriveFileItem[] = dataAll.files || [];
            const matches = filesAll.filter((f) => f.name.toLowerCase() === cleanName.toLowerCase());
            if (matches.length > 0) {
              matches.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
              targetDriveId = matches[0].id;
              if (matches.length > 1) {
                for (let i = 1; i < matches.length; i++) {
                  void trashDriveFile(token, matches[i].id);
                }
              }
            }
          }
        }
      } catch {
        // Ignore search errors, will fallback to creation
      }
    }

    const metadata: any = {
      name: cleanName,
      mimeType,
    };

    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    let url: string;
    let method: string;

    if (targetDriveId) {
      // Update existing file via PATCH (Creates new revision on Google Drive, NO DUPLICATES)
      url = `${UPLOAD_URL}/files/${targetDriveId}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`;
      method = "PATCH";
    } else {
      // Create new file via POST
      metadata.parents = [targetFolderId];
      url = `${UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`;
      method = "POST";
    }

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter;

    let res = await fetchWithRetry(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    // If PATCH failed because file was deleted or trashed on Drive, fallback to creating fresh with POST
    if (!res.ok && targetDriveId && (res.status === 404 || res.status === 400 || res.status === 410)) {
      metadata.parents = [targetFolderId];
      const postRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
        content +
        closeDelimiter;

      res = await fetchWithRetry(`${UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: postRequestBody,
      });
    }

    if (!res.ok) {
      throw new Error(`Failed to upload note to Drive (${res.status})`);
    }

    const uploaded = (await res.json()) as DriveFileItem;

    // Proactively clean any duplicate copies with the same name in targetFolderId
    try {
      const qDupes = `'${targetFolderId}' in parents and name = '${cleanName.replace(/'/g, "\\'")}' and trashed = false`;
      const resDupes = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(qDupes)}&fields=files(id,name,modifiedTime)&pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resDupes.ok) {
        const dData = await resDupes.json();
        const dFiles: DriveFileItem[] = dData.files || [];
        if (dFiles.length > 1) {
          for (const df of dFiles) {
            if (df.id !== uploaded.id) {
              void trashDriveFile(token, df.id);
            }
          }
        }
      }
    } catch {
      // Ignore background cleanup errors
    }

    return uploaded;
  })();

  singleNoteUploadPromises.set(lockKey, uploadPromise);
  try {
    return await uploadPromise;
  } finally {
    singleNoteUploadPromises.delete(lockKey);
  }
}

function getMimeTypeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

// Upload attachment file (Image, PDF, etc.) to Luno/Attachments/ or target folder
export async function uploadDriveAttachmentFile(
  token: string,
  targetFolderId: string,
  file: File | Blob | ArrayBuffer | Uint8Array | string,
  fileName: string,
  driveFileId?: string
): Promise<DriveFileItem> {
  let fileBytes: Uint8Array;
  let detectedType = getMimeTypeFromFileName(fileName);

  if (file instanceof Uint8Array) {
    fileBytes = file;
  } else if (file instanceof ArrayBuffer) {
    fileBytes = new Uint8Array(file);
  } else if (typeof (file as any)?.arrayBuffer === "function") {
    const ab = await (file as Blob).arrayBuffer();
    fileBytes = new Uint8Array(ab);
    if ((file as Blob).type) detectedType = (file as Blob).type;
  } else if (typeof file === "string") {
    // If base64 or data URL
    if (file.startsWith("data:")) {
      const commaIdx = file.indexOf(",");
      const b64 = commaIdx > 0 ? file.slice(commaIdx + 1) : file;
      try {
        const cleanB64 = b64.replace(/[\r\n\s]/g, "");
        const bin = atob(cleanB64);
        const len = bin.length;
        fileBytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) fileBytes[i] = bin.charCodeAt(i);
      } catch {
        fileBytes = new TextEncoder().encode(file);
      }
    } else {
      // Raw base64 string from Electron readFileBase64 or plain string
      try {
        const cleanB64 = file.replace(/[\r\n\s]/g, "");
        const bin = atob(cleanB64);
        const len = bin.length;
        fileBytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) fileBytes[i] = bin.charCodeAt(i);
      } catch {
        fileBytes = new TextEncoder().encode(file);
      }
    }
  } else {
    fileBytes = new Uint8Array(0);
  }

  let targetDriveId = driveFileId;

  // Verify targetDriveId is still alive, not in trash, and resides in targetFolderId
  if (targetDriveId) {
    try {
      const resCheck = await fetchWithRetry(`${BASE_URL}/files/${targetDriveId}?fields=id,trashed,parents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resCheck.ok) {
        const fileCheck = await resCheck.json();
        if (fileCheck.trashed || !fileCheck.parents || !fileCheck.parents.includes(targetFolderId)) {
          targetDriveId = undefined;
        }
      } else {
        targetDriveId = undefined;
      }
    } catch {
      targetDriveId = undefined;
    }
  }

  // If no valid driveFileId, search if a file with fileName already exists in targetFolderId
  if (!targetDriveId) {
    try {
      const escapedName = fileName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const q = `'${targetFolderId}' in parents and name = '${escapedName}' and trashed = false`;
      const searchUrl = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=10`;
      const resSearch = await fetchWithRetry(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resSearch.ok) {
        const data = await resSearch.json();
        const files: DriveFileItem[] = data.files || [];
        if (files.length > 0) {
          files.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
          targetDriveId = files[0].id;
          if (files.length > 1) {
            for (let i = 1; i < files.length; i++) {
              void trashDriveFile(token, files[i].id);
            }
          }
        }
      }
    } catch {
      // ignore search error
    }
  }

  const metadata: any = {
    name: fileName,
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let url: string;
  let method: string;

  if (targetDriveId) {
    url = `${UPLOAD_URL}/files/${targetDriveId}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webContentLink,webViewLink`;
    method = "PATCH";
  } else {
    metadata.parents = [targetFolderId];
    url = `${UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webContentLink,webViewLink`;
    method = "POST";
  }

  const metaPart =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${detectedType}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metaBytes = encoder.encode(metaPart);
  const closeBytes = encoder.encode(closeDelimiter);

  const fullBody = new Uint8Array(metaBytes.length + fileBytes.length + closeBytes.length);
  fullBody.set(metaBytes, 0);
  fullBody.set(fileBytes, metaBytes.length);
  fullBody.set(closeBytes, metaBytes.length + fileBytes.length);

  let res = await fetchWithRetry(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: fullBody,
  });

  // If PATCH failed because attachment file or parent folder was deleted on Drive, fallback to POST
  if (!res.ok && targetDriveId && (res.status === 404 || res.status === 400 || res.status === 410)) {
    metadata.parents = [targetFolderId];
    const newMetaPart =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${detectedType}\r\n\r\n`;
    const newMetaBytes = encoder.encode(newMetaPart);
    const newFullBody = new Uint8Array(newMetaBytes.length + fileBytes.length + closeBytes.length);
    newFullBody.set(newMetaBytes, 0);
    newFullBody.set(fileBytes, newMetaBytes.length);
    newFullBody.set(closeBytes, newMetaBytes.length + fileBytes.length);

    res = await fetchWithRetry(
      `${UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webContentLink,webViewLink`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: newFullBody,
      }
    );
  }

  if (!res.ok) {
    throw new Error(`Failed to upload attachment to Drive (${res.status})`);
  }

  const uploadedFile = (await res.json()) as DriveFileItem;

  // Make attachment readable via link for embedding in markdown
  try {
    await fetch(`${BASE_URL}/files/${uploadedFile.id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    });
  } catch {
    // ignore permission warning
  }

  return uploadedFile;
}

// Upload all local files in attachments/ directory to Google Drive attachments/ folder
/**
 * Syncs all files inside local .luno/ folder (workspace.json, settings.json, etc.) to Google Drive's .luno folder.
 */
export async function syncLocalLunoMetaToDrive(
  token: string,
  lunoMetaFolderId: string,
  targetElectronPath?: string | null,
  rootDirHandle?: FileSystemDirectoryHandle | null
): Promise<void> {
  try {
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

    // 1. Electron Desktop
    if (electronAPI?.readDirectoryFiles && electronAPI?.readFileContent && targetElectronPath) {
      const metaDir = `${targetElectronPath}/.luno`;
      const files: Array<{ name: string; fullPath: string; isDirectory: boolean }> =
        await electronAPI.readDirectoryFiles(metaDir);

      for (const f of files) {
        if (!f.isDirectory) {
          try {
            const content = await electronAPI.readFileContent(f.fullPath);
            if (content !== null && content !== undefined) {
              await uploadDriveNoteFile(token, lunoMetaFolderId, f.name, content);
            }
          } catch (err) {
            console.warn(`Failed syncing .luno/${f.name} to Drive:`, err);
          }
        }
      }
      return;
    }

    // 2. Web File System Access API
    if (rootDirHandle) {
      try {
        const metaDir = await rootDirHandle.getDirectoryHandle(".luno", { create: true });
        const iterator =
          typeof (metaDir as any).entries === "function"
            ? (metaDir as any).entries()
            : (metaDir as unknown as AsyncIterable<[string, FileSystemHandle]>);

        for await (const [name, handle] of iterator) {
          if (handle.kind === "file") {
            try {
              const fileHandle = handle as FileSystemFileHandle;
              const file = await fileHandle.getFile();
              const text = await file.text();
              await uploadDriveNoteFile(token, lunoMetaFolderId, name, text);
            } catch (err) {
              console.warn(`Failed syncing Web FS .luno/${name} to Drive:`, err);
            }
          }
        }
      } catch (err) {
        console.warn("Could not read Web FS .luno folder:", err);
      }
      return;
    }

    // 3. Fallback: upload workspace.json from local manifest
    const manifest = await getLocalWorkspaceManifest();
    if (manifest) {
      await uploadDriveNoteFile(token, lunoMetaFolderId, "workspace.json", JSON.stringify(manifest, null, 2));
    }
  } catch (err) {
    console.warn("Error in syncLocalLunoMetaToDrive:", err);
  }
}

export async function syncLocalAttachmentsToDrive(
  token: string,
  attachmentsFolderId: string,
  rootDirHandle?: FileSystemDirectoryHandle | null,
  targetElectronPath?: string | null
): Promise<void> {
  try {
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

    const q = `'${attachmentsFolderId}' in parents and trashed = false`;
    const res = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const existingNames = new Set<string>((data.files || []).map((f: any) => (f.name as string).toLowerCase()));

    // 1. Electron Desktop
    if (electronAPI?.readDirectoryFiles && electronAPI?.readFileBase64 && targetElectronPath) {
      const attachDir = `${targetElectronPath}/attachments`;
      const files: Array<{ name: string; fullPath: string; isDirectory: boolean }> =
        await electronAPI.readDirectoryFiles(attachDir);

      for (const f of files) {
        if (!f.isDirectory && !existingNames.has(f.name.toLowerCase())) {
          try {
            const base64 = await electronAPI.readFileBase64(f.fullPath);
            if (base64) {
              const byteCharacters = atob(base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray]);
              await uploadDriveAttachmentFile(token, attachmentsFolderId, blob, f.name);
            }
          } catch (err) {
            console.warn(`Failed to sync Electron attachment ${f.name} to Drive:`, err);
          }
        }
      }
      return;
    }

    // 2. Web File System Access API
    if (rootDirHandle) {
      const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: false });
      const iterator =
        typeof (attachmentsDir as any).entries === "function"
          ? (attachmentsDir as any).entries()
          : (attachmentsDir as unknown as AsyncIterable<[string, FileSystemHandle]>);

      for await (const [name, handle] of iterator) {
        if (handle.kind === "file" && !existingNames.has(name.toLowerCase())) {
          try {
            const fileHandle = handle as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            await uploadDriveAttachmentFile(token, attachmentsFolderId, file, name);
          } catch (err) {
            console.warn(`Failed to sync attachment ${name} to Drive:`, err);
          }
        }
      }
    }
  } catch {
    // attachments folder unreadable or does not exist locally
  }
}

/**
 * Recursively scans the entire workspace directory on disk (excluding .luno, .git, node_modules, dist, attachments)
 * 1. Ensures every subfolder exists on Google Drive (including empty folders like Chapter 3/Generate Artwork)
 * 2. Uploads all media/binary files directly into their respective Google Drive subfolders
 */
export async function syncWorkspaceMediaAndFoldersToDrive(
  token: string,
  projectId: string,
  targetElectronPath?: string | null,
  rootDirHandle?: FileSystemDirectoryHandle | null
): Promise<void> {
  try {
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

    const BINARY_IMAGE_EXTS = new Set([
      ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico", ".tiff", ".avif",
      ".mp4", ".webm", ".mp3", ".wav", ".pdf", ".zip", ".tar", ".gz", ".docx", ".xlsx", ".pptx",
    ]);

    // 1. Electron Desktop Environment
    if (electronAPI?.readDirectoryFiles && electronAPI?.readFileBase64 && targetElectronPath) {
      const discoveredFolders = new Set<string>();
      const discoveredFiles: Array<{ name: string; fullPath: string; relFolderPath: string }> = [];

      const scanDisk = async (dir: string, rel: string) => {
        try {
          const items: Array<{ name: string; fullPath: string; isDirectory: boolean }> =
            await electronAPI.readDirectoryFiles(dir);
          for (const item of items) {
            const lname = item.name.toLowerCase();
            if (
              lname.startsWith(".") ||
              lname === "node_modules" ||
              lname === "attachments" ||
              lname === "dist" ||
              lname === "build" ||
              lname === ".git"
            ) {
              continue;
            }

            if (item.isDirectory) {
              const subRel = rel ? `${rel}/${item.name}` : item.name;
              discoveredFolders.add(subRel);
              await scanDisk(item.fullPath, subRel);
            } else {
              const dotIdx = lname.lastIndexOf(".");
              const ext = dotIdx >= 0 ? lname.slice(dotIdx) : "";
              if (BINARY_IMAGE_EXTS.has(ext)) {
                discoveredFiles.push({
                  name: item.name,
                  fullPath: item.fullPath,
                  relFolderPath: rel,
                });
              }
            }
          }
        } catch (err) {
          console.warn("[GDrive] Error scanning disk folder:", dir, err);
        }
      };

      await scanDisk(targetElectronPath, "");

      // 1. Ensure all discovered subfolders exist on Google Drive (sorted by depth shallowest-first)
      const sortedFolders = Array.from(discoveredFolders).sort((a, b) => {
        const depthA = a.split("/").length;
        const depthB = b.split("/").length;
        if (depthA !== depthB) return depthA - depthB;
        return a.localeCompare(b);
      });

      const folderIdMap = new Map<string, string>();
      folderIdMap.set("", projectId);

      for (const relFp of sortedFolders) {
        try {
          const folderId = await ensureDriveFolderPath(token, projectId, relFp);
          folderIdMap.set(relFp, folderId);
          await new Promise((r) => setTimeout(r, 60));
        } catch (err) {
          console.warn(`[GDrive] Failed to ensure folder ${relFp}:`, err);
        }
      }

      // 2. Upload all discovered media files into their respective Google Drive folders
      const CHUNK_SIZE = 3;
      for (let i = 0; i < discoveredFiles.length; i += CHUNK_SIZE) {
        const chunk = discoveredFiles.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (fileItem) => {
            try {
              let targetFolderId = folderIdMap.get(fileItem.relFolderPath);
              if (!targetFolderId) {
                targetFolderId = await ensureDriveFolderPath(token, projectId, fileItem.relFolderPath);
                folderIdMap.set(fileItem.relFolderPath, targetFolderId);
              }

              const base64 = await electronAPI.readFileBase64(fileItem.fullPath);
              if (!base64) return;

              const byteCharacters = atob(base64.replace(/[\r\n\s]/g, ""));
              const byteNumbers = new Array(byteCharacters.length);
              for (let k = 0; k < byteCharacters.length; k++) {
                byteNumbers[k] = byteCharacters.charCodeAt(k);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray]);

              await uploadDriveAttachmentFile(token, targetFolderId, blob, fileItem.name);
            } catch (fileErr) {
              console.warn(`[GDrive] Failed uploading media file ${fileItem.name}:`, fileErr);
            }
          })
        );
        if (i + CHUNK_SIZE < discoveredFiles.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      return;
    }

    // 2. Web File System Access API
    if (rootDirHandle) {
      const discoveredFolders = new Set<string>();
      const discoveredFiles: Array<{ name: string; file: File; relFolderPath: string }> = [];

      const scanWebFs = async (dirHandle: FileSystemDirectoryHandle, rel: string) => {
        try {
          const iterator =
            typeof (dirHandle as any).entries === "function"
              ? (dirHandle as any).entries()
              : (dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>);

          for await (const [name, handle] of iterator) {
            const lname = name.toLowerCase();
            if (
              lname.startsWith(".") ||
              lname === "node_modules" ||
              lname === "attachments" ||
              lname === "dist" ||
              lname === "build" ||
              lname === ".git"
            ) {
              continue;
            }

            if (handle.kind === "directory") {
              const subRel = rel ? `${rel}/${name}` : name;
              discoveredFolders.add(subRel);
              await scanWebFs(handle as FileSystemDirectoryHandle, subRel);
            } else if (handle.kind === "file") {
              const dotIdx = lname.lastIndexOf(".");
              const ext = dotIdx >= 0 ? lname.slice(dotIdx) : "";
              if (BINARY_IMAGE_EXTS.has(ext)) {
                const file = await (handle as FileSystemFileHandle).getFile();
                discoveredFiles.push({
                  name,
                  file,
                  relFolderPath: rel,
                });
              }
            }
          }
        } catch (err) {
          console.warn("[GDrive] Error scanning Web FS folder:", rel, err);
        }
      };

      await scanWebFs(rootDirHandle, "");

      const sortedFolders = Array.from(discoveredFolders).sort((a, b) => {
        const depthA = a.split("/").length;
        const depthB = b.split("/").length;
        if (depthA !== depthB) return depthA - depthB;
        return a.localeCompare(b);
      });

      const folderIdMap = new Map<string, string>();
      folderIdMap.set("", projectId);

      for (const relFp of sortedFolders) {
        try {
          const folderId = await ensureDriveFolderPath(token, projectId, relFp);
          folderIdMap.set(relFp, folderId);
          await new Promise((r) => setTimeout(r, 60));
        } catch (err) {
          console.warn(`[GDrive] Failed to ensure Web FS folder ${relFp}:`, err);
        }
      }

      for (const fileItem of discoveredFiles) {
        try {
          let targetFolderId = folderIdMap.get(fileItem.relFolderPath);
          if (!targetFolderId) {
            targetFolderId = await ensureDriveFolderPath(token, projectId, fileItem.relFolderPath);
            folderIdMap.set(fileItem.relFolderPath, targetFolderId);
          }
          await uploadDriveAttachmentFile(token, targetFolderId, fileItem.file, fileItem.name);
        } catch (fileErr) {
          console.warn(`[GDrive] Failed uploading Web FS media file ${fileItem.name}:`, fileErr);
        }
      }
    }
  } catch (err) {
    console.warn("[GDrive] syncWorkspaceMediaAndFoldersToDrive error:", err);
  }
}

// Download missing attachment files from Google Drive attachments/ folder into local attachments/ directory
export async function syncDriveAttachmentsToLocal(
  token: string,
  attachmentsFolderId: string,
  rootDirHandle: FileSystemDirectoryHandle
): Promise<void> {
  try {
    const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: true });
    const q = `'${attachmentsFolderId}' in parents and trashed = false`;
    const res = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const driveFiles = (data.files || []) as DriveFileItem[];

    for (const item of driveFiles) {
      try {
        await attachmentsDir.getFileHandle(item.name, { create: false });
      } catch {
        try {
          const fileRes = await fetch(`${BASE_URL}/files/${item.id}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (fileRes.ok) {
            const blob = await fileRes.blob();
            const localHandle = await attachmentsDir.getFileHandle(item.name, { create: true });
            const writable = await localHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          }
        } catch (err) {
          console.warn(`Failed to download attachment ${item.name} from Drive:`, err);
        }
      }
    }
  } catch {
    // ignore
  }
}

// Rename file on Google Drive without changing ID
export async function renameDriveFile(token: string, driveFileId: string, newFileName: string): Promise<DriveFileItem> {
  const cleanName = newFileName.endsWith(".md") || newFileName.endsWith(".txt") || newFileName.endsWith(".html") ? newFileName : `${newFileName}.md`;

  const res = await fetch(`${BASE_URL}/files/${driveFileId}?fields=id,name,modifiedTime`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: cleanName }),
  });

  if (!res.ok) {
    throw new Error(`Failed to rename Drive file (${res.status})`);
  }

  return (await res.json()) as DriveFileItem;
}

// Move file to Google Drive Trash (soft delete with recovery path)
export async function trashDriveFile(token: string, driveFileId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/files/${driveFileId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ trashed: true }),
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to move Drive file to Trash (${res.status})`);
  }
}

// Helper to clean duplicate folders recursively under parentFolderId
async function cleanDuplicateFoldersRecursively(token: string, parentFolderId: string): Promise<number> {
  let trashed = 0;
  try {
    const q = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const subfolders = (data.files || []) as DriveFileItem[];
      const byName = new Map<string, DriveFileItem[]>();

      for (const f of subfolders) {
        const lower = f.name.toLowerCase();
        if (!byName.has(lower)) byName.set(lower, []);
        byName.get(lower)!.push(f);
      }

      for (const [, group] of byName) {
        let primary = group[0];
        if (group.length > 1) {
          group.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
          primary = group[0];
          for (let i = 1; i < group.length; i++) {
            await mergeAndTrashDuplicateFolder(token, primary.id, group[i].id);
            trashed++;
          }
        }
        // Recursively clean children folders
        trashed += await cleanDuplicateFoldersRecursively(token, primary.id);
      }
    }
  } catch (err) {
    console.warn("Recursive folder clean error:", err);
  }
  return trashed;
}

// Clean up duplicate files and folders in Luno/Workspace/ (Merge duplicate folders, keep newest files)
export async function cleanDriveDuplicates(token: string, notesFolderId: string, parentFolderId?: string): Promise<number> {
  try {
    let trashedCount = 0;

    // 1. Clean duplicate subfolders recursively inside notesFolderId (Workspace/)
    trashedCount += await cleanDuplicateFoldersRecursively(token, notesFolderId);

    // 2. Clean duplicate files inside notes/ (by relative path and name) and trash corrupted binary .md files
    const files = await listDriveNoteFiles(token, notesFolderId);
    const filesByPathAndName = new Map<string, DriveFileItem[]>();

    for (const f of files) {
      // Trash any accidental *.jpg.md, *.png.md files created in the past
      if (/\.(png|jpe?g|gif|webp|svg|bmp|ico|pdf|mp4|mp3|zip)\.md$/i.test(f.name)) {
        await trashDriveFile(token, f.id);
        trashedCount++;
        continue;
      }

      const pathKey = `${(f.folderPath || "").toLowerCase()}/${f.name.toLowerCase()}`;
      if (!filesByPathAndName.has(pathKey)) {
        filesByPathAndName.set(pathKey, []);
      }
      filesByPathAndName.get(pathKey)!.push(f);
    }

    for (const [, group] of filesByPathAndName) {
      if (group.length > 1) {
        group.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
        for (let i = 1; i < group.length; i++) {
          await trashDriveFile(token, group[i].id);
          trashedCount++;
        }
      }
    }

    // 3. Clean duplicate folders inside parentFolderId if provided (e.g. Luno/ root)
    if (parentFolderId) {
      trashedCount += await cleanDuplicateFoldersRecursively(token, parentFolderId);

      // If active workspace is different from legacy "My Luno Project", merge & trash legacy folder
      try {
        const qLegacy = `'${parentFolderId}' in parents and name = 'My Luno Project' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const resLegacy = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(qLegacy)}&fields=files(id,name)`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resLegacy.ok) {
          const dataLegacy = await resLegacy.json();
          const legacyFolders = (dataLegacy.files || []) as DriveFileItem[];
          for (const lf of legacyFolders) {
            if (lf.id !== notesFolderId) {
              await mergeAndTrashDuplicateFolder(token, notesFolderId, lf.id);
              trashedCount++;
            }
          }
        }
      } catch (err) {
        console.warn("Legacy folder cleanup error:", err);
      }
    }

    return trashedCount;
  } catch (err) {
    console.warn("Error cleaning Drive duplicates:", err);
    return 0;
  }
}

/**
 * Ensure Luno/ and Luno/Workspaces/ exist without creating any workspace folder.
 * Also cleans any dummy folders named "Default", "Google Drive", or "My Luno Project".
 */
export async function ensureWorkspacesRootOnly(token: string): Promise<string> {
  let rootId = await findFolder(token, "Luno");
  if (!rootId) {
    rootId = await createFolder(token, "Luno");
  }

  let workspacesId = await findFolder(token, "Workspaces", rootId);
  if (!workspacesId) {
    workspacesId = await createFolder(token, "Workspaces", rootId);
  }

  // Clean any erroneous/dummy folders named "Default", "Google Drive", or "My Luno Project" inside Workspaces/
  try {
    const qDummy = `'${workspacesId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resDummy = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(qDummy)}&fields=files(id,name)&pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resDummy.ok) {
      const dataDummy = await resDummy.json();
      const dummyFolders = (dataDummy.files || []) as DriveFileItem[];
      for (const df of dummyFolders) {
        const lower = df.name.toLowerCase().trim();
        if (lower === "default" || lower === "google drive" || lower === "my luno project") {
          void trashDriveFile(token, df.id);
        }
      }
    }
  } catch (err) {
    console.warn("Dummy folder clean error:", err);
  }

  return workspacesId;
}

/**
 * List all workspaces inside Luno/Workspaces/ on Google Drive.
 * For each workspace, reads .luno/workspace.json or generates one if not present.
 */
export async function listCloudWorkspaces(token: string): Promise<Array<{
  folderId: string;
  name: string;
  workspaceId: string;
  modifiedTime: string;
}>> {
  // 1. Ensure Luno/Workspaces hierarchy exists without creating any dummy workspace folder
  const workspacesFolderId = await ensureWorkspacesRootOnly(token);

  // 2. Query all folders inside Luno/Workspaces/
  const q = `'${workspacesFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=100`;

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list cloud workspaces (${res.status})`);
  }

  const data = await res.json();
  const folderList: DriveFileItem[] = data.files || [];
  const localManifests = await getAllKnownLocalManifests();

  const results: Array<{
    folderId: string;
    name: string;
    workspaceId: string;
    modifiedTime: string;
  }> = [];

  for (const folder of folderList) {
    const lowerName = folder.name.toLowerCase().trim();
    if (
      folder.name === ".luno" ||
      folder.name === "attachments" ||
      folder.name === "Workspaces" ||
      lowerName === "default" ||
      lowerName === "google drive" ||
      lowerName === "my luno project"
    ) {
      continue;
    }

    let wsId = "";
    try {
      // Find .luno inside this workspace folder
      const lunoMetaId = await findFolder(token, ".luno", folder.id);
      if (lunoMetaId) {
        const qManifest = `'${lunoMetaId}' in parents and name = 'workspace.json' and trashed = false`;
        const resManifest = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(qManifest)}&fields=files(id,name)&pageSize=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resManifest.ok) {
          const dataManifest = await resManifest.json();
          const manifestFile = dataManifest.files?.[0];
          if (manifestFile) {
            const raw = await fetchDriveFileContent(token, manifestFile.id);
            const parsed = JSON.parse(raw);
            if (parsed?.id) {
              wsId = parsed.id;
            }
          }
        }
      }
    } catch {
      // Ignore read error
    }

    if (!wsId) {
      // If workspace.json does not exist yet on Drive, create it
      try {
        let metaId = await findFolder(token, ".luno", folder.id);
        if (!metaId) {
          metaId = await createFolder(token, ".luno", folder.id);
        }
        wsId = `ws_${crypto.randomUUID()}`;
        const manifest = {
          id: wsId,
          name: folder.name,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await uploadDriveNoteFile(token, metaId, "workspace.json", JSON.stringify(manifest, null, 2));
      } catch {
        wsId = `ws_${folder.id.slice(0, 12)}`;
      }
    }

    results.push({
      folderId: folder.id,
      name: folder.name,
      workspaceId: wsId,
      modifiedTime: folder.modifiedTime,
    });
  }

  return results.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
}

/**
 * Create a new workspace inside Luno/Workspaces/[workspaceName]
 */
export async function createCloudWorkspace(
  token: string,
  workspaceName: string
): Promise<{ folderId: string; workspaceId: string; name: string }> {
  const cleanName = workspaceName.trim() || "Workspace";
  const structure = await ensureLunoFolderStructure(token, cleanName);
  const projectId = structure.projectId;
  const lunoMetaId = structure.lunoMetaId;

  // Create .luno/workspace.json
  const workspaceId = `ws_${crypto.randomUUID()}`;
  const manifest = {
    id: workspaceId,
    name: cleanName,
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await uploadDriveNoteFile(token, lunoMetaId, "workspace.json", JSON.stringify(manifest, null, 2));

  // Create welcome.md
  await uploadDriveNoteFile(
    token,
    projectId,
    "welcome.md",
    `# Welcome to ${cleanName}\n\nYour cloud workspace is ready.`
  );

  return {
    folderId: projectId,
    workspaceId,
    name: cleanName,
  };
}

/**
 * Enables public view permission (anyone with link can view) and returns the shareable webViewLink for a Google Drive file.
 */
export async function getDriveFileShareLink(token: string, fileId: string): Promise<string> {
  // 1. Create permission 'anyone with link' has 'reader' role
  try {
    const permUrl = `${BASE_URL}/files/${fileId}/permissions`;
    await fetchWithRetry(permUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
        allowFileDiscovery: false,
      }),
    });
  } catch (err) {
    console.warn("Could not create public reader permission (might already exist):", err);
  }

  // 2. Fetch webViewLink
  try {
    const getUrl = `${BASE_URL}/files/${fileId}?fields=webViewLink,webContentLink,name`;
    const res = await fetchWithRetry(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.webViewLink) {
        return data.webViewLink;
      }
    }
  } catch (err) {
    console.warn("Could not fetch file webViewLink:", err);
  }

  // Default fallback share link
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

/**
 * Checks if a Google Drive file has public view permissions enabled.
 */
export async function checkDriveFileShareStatus(token: string, fileId: string): Promise<{ isShared: boolean; shareLink?: string; permissionId?: string }> {
  try {
    const permUrl = `${BASE_URL}/files/${fileId}/permissions?fields=permissions(id,type,role)`;
    const res = await fetchWithRetry(permUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const anyonePerm = (data.permissions || []).find((p: any) => p.type === "anyone");
      if (anyonePerm) {
        const shareLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
        return { isShared: true, shareLink, permissionId: anyonePerm.id };
      }
    }
  } catch (err) {
    console.warn("Could not check drive file permissions:", err);
  }
  return { isShared: false };
}

/**
 * Revokes public view permission for a Google Drive file, making it private again.
 */
export async function revokeDriveFileShare(token: string, fileId: string): Promise<boolean> {
  try {
    const permUrl = `${BASE_URL}/files/${fileId}/permissions?fields=permissions(id,type,role)`;
    const res = await fetchWithRetry(permUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const anyonePerms = (data.permissions || []).filter((p: any) => p.type === "anyone");
      for (const perm of anyonePerms) {
        await fetchWithRetry(`${BASE_URL}/files/${fileId}/permissions/${perm.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      return true;
    }
  } catch (err) {
    console.warn("Could not revoke drive file permissions:", err);
  }
  return false;
}
