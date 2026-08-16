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
  projectId: string;
  notesId?: string;
  attachmentsId: string;
  lunoMetaId: string;
}

const BASE_URL = "https://www.googleapis.com/drive/v3";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";

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
  let q = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }
  const url = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=10`;

  const res = await fetch(url, {
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
      const resAll = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(qAll)}&fields=files(id,name,modifiedTime)&pageSize=100`, {
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

  const res = await fetch(`${BASE_URL}/files?fields=id`, {
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

// Get or create Luno folder hierarchy: Luno/[Workspace]/ (notes directly inside Workspace/, attachments/, .luno/)
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

    // 2. Project Workspace folder inside Luno/ (e.g. Luno/Workspace/)
    let projectId = await findFolder(token, cleanProjectName, rootId);
    if (!projectId) {
      projectId = await createFolder(token, cleanProjectName, rootId);
    }

    // 3. System Subfolders inside Luno/[Workspace]/
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
      projectId,
      attachmentsId,
      lunoMetaId,
    };
    cacheFolderStructure(structure, cleanProjectName);
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
const folderCreationPromises = new Map<string, Promise<string>>();

export function clearFolderPathCache(): void {
  folderPathCache.clear();
  folderCreationPromises.clear();
}

// Ensure nested subfolder path exists on Google Drive (e.g. "Projects/Luno")
export async function ensureDriveFolderPath(
  token: string,
  baseFolderId: string,
  folderPath: string
): Promise<string> {
  const normalized = folderPath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").trim();
  if (!normalized) return baseFolderId;

  const cacheKey = `${baseFolderId}:${normalized.toLowerCase()}`;
  if (folderPathCache.has(cacheKey)) {
    return folderPathCache.get(cacheKey)!;
  }
  if (folderCreationPromises.has(cacheKey)) {
    return await folderCreationPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    const segments = normalized.split("/").filter(Boolean);
    let currentParentId = baseFolderId;

    for (const segment of segments) {
      const segCacheKey = `${currentParentId}:${segment.toLowerCase()}`;
      if (folderPathCache.has(segCacheKey)) {
        currentParentId = folderPathCache.get(segCacheKey)!;
        continue;
      }

      const cleanSegment = segment.replace(/'/g, "\\'");
      const q = `'${currentParentId}' in parents and name = '${cleanSegment}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const searchUrl = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=10`;

      const res = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const files: DriveFileItem[] = data.files || [];
        if (files.length > 0) {
          currentParentId = files[0].id;
          folderPathCache.set(segCacheKey, currentParentId);

          if (files.length > 1) {
            for (let i = 1; i < files.length; i++) {
              void mergeAndTrashDuplicateFolder(token, currentParentId, files[i].id);
            }
          }
          continue;
        }
      }

      // Create subfolder on Drive
      const createRes = await fetch(`${BASE_URL}/files?fields=id,name`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: segment,
          mimeType: "application/vnd.google-apps.folder",
          parents: [currentParentId],
        }),
      });

      if (!createRes.ok) {
        throw new Error(`Failed to create subfolder ${segment} on Drive (${createRes.status})`);
      }

      const created = await createRes.json();
      currentParentId = created.id;
      folderPathCache.set(segCacheKey, currentParentId);
    }

    folderPathCache.set(cacheKey, currentParentId);
    return currentParentId;
  })();

  folderCreationPromises.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    folderCreationPromises.delete(cacheKey);
  }
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

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const data = await res.json();
    const items: DriveFileItem[] = data.files || [];

    for (const item of items) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        const lname = item.name.toLowerCase();
        if (lname === "attachments" || lname === ".luno" || lname === "notes") continue;
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

// Create or update a .md note file on Google Drive in appropriate subfolder
export async function uploadDriveNoteFile(
  token: string,
  notesFolderId: string,
  fileName: string,
  content: string,
  driveFileId?: string,
  folderPath?: string
): Promise<DriveFileItem> {
  const cleanName = fileName.endsWith(".md") || fileName.endsWith(".txt") || fileName.endsWith(".html") ? fileName : `${fileName}.md`;
  const mimeType = cleanName.endsWith(".html") ? "text/html" : cleanName.endsWith(".txt") ? "text/plain" : "text/markdown";

  let targetFolderId = notesFolderId;
  if (folderPath && folderPath.trim()) {
    targetFolderId = await ensureDriveFolderPath(token, notesFolderId, folderPath);
  }

  let targetDriveId = driveFileId;

  // If no driveFileId is provided, check if a file with cleanName already exists on Drive in targetFolderId
  if (!targetDriveId) {
    try {
      const q = `'${targetFolderId}' in parents and name = '${cleanName.replace(/'/g, "\\'")}' and trashed = false`;
      const searchUrl = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&pageSize=10`;
      const res = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const files: DriveFileItem[] = data.files || [];
        if (files.length > 0) {
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
        const resAll = await fetch(searchUrlAll, {
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

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload note to Drive (${res.status})`);
  }

  return (await res.json()) as DriveFileItem;
}

// Upload attachment file (Image, PDF, etc.) to Luno/Attachments/
export async function uploadDriveAttachmentFile(
  token: string,
  attachmentsFolderId: string,
  file: File | Blob,
  fileName: string
): Promise<DriveFileItem> {
  const metadata = {
    name: fileName,
    parents: [attachmentsFolderId],
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  const metaPart =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metaBytes = encoder.encode(metaPart);
  const closeBytes = encoder.encode(closeDelimiter);

  const fullBody = new Uint8Array(metaBytes.length + fileBytes.length + closeBytes.length);
  fullBody.set(metaBytes, 0);
  fullBody.set(fileBytes, metaBytes.length);
  fullBody.set(closeBytes, metaBytes.length + fileBytes.length);

  const res = await fetch(`${UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webContentLink,webViewLink`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: fullBody,
  });

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
export async function syncLocalAttachmentsToDrive(
  token: string,
  attachmentsFolderId: string,
  rootDirHandle: FileSystemDirectoryHandle
): Promise<void> {
  try {
    const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: false });
    const q = `'${attachmentsFolderId}' in parents and trashed = false`;
    const res = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const existingNames = new Set<string>((data.files || []).map((f: any) => (f.name as string).toLowerCase()));

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
  } catch {
    // attachments folder unreadable or does not exist locally
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

// Clean up duplicate files and folders in Luno/Workspace/ (Merge duplicate folders, keep newest files)
export async function cleanDriveDuplicates(token: string, notesFolderId: string, parentFolderId?: string): Promise<number> {
  try {
    let trashedCount = 0;

    // 1. Clean duplicate subfolders inside notesFolderId (Workspace/)
    const qSubfolders = `'${notesFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resSub = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(qSubfolders)}&fields=files(id,name,modifiedTime)&pageSize=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resSub.ok) {
      const dataSub = await resSub.json();
      const subfolders = (dataSub.files || []) as DriveFileItem[];
      const subfoldersByName = new Map<string, DriveFileItem[]>();

      for (const f of subfolders) {
        const lowerName = f.name.toLowerCase();
        if (lowerName === "notes") continue;
        if (!subfoldersByName.has(lowerName)) subfoldersByName.set(lowerName, []);
        subfoldersByName.get(lowerName)!.push(f);
      }

      for (const [, group] of subfoldersByName) {
        if (group.length > 1) {
          group.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
          const primaryFolder = group[0];
          for (let i = 1; i < group.length; i++) {
            await mergeAndTrashDuplicateFolder(token, primaryFolder.id, group[i].id);
            trashedCount++;
          }
        }
      }
    }

    // 2. Clean duplicate files inside notes/ (by relative path and name)
    const files = await listDriveNoteFiles(token, notesFolderId);
    const filesByPathAndName = new Map<string, DriveFileItem[]>();

    for (const f of files) {
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
      const q = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const url = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const folders = (data.files || []) as DriveFileItem[];
        const foldersByName = new Map<string, DriveFileItem[]>();
        for (const f of folders) {
          const lowerName = f.name.toLowerCase();
          if (!foldersByName.has(lowerName)) foldersByName.set(lowerName, []);
          foldersByName.get(lowerName)!.push(f);
        }
        for (const [, group] of foldersByName) {
          if (group.length > 1) {
            group.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
            const primary = group[0];
            for (let i = 1; i < group.length; i++) {
              await mergeAndTrashDuplicateFolder(token, primary.id, group[i].id);
              trashedCount++;
            }
          }
        }
      }
    }

    // 4. Remove legacy notes subfolder if created inside Workspace/
    const qNotes = `'${notesFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const resNotes = await fetch(`${BASE_URL}/files?q=${encodeURIComponent(qNotes)}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resNotes.ok) {
      const dataNotes = await resNotes.json();
      const subfolders = (dataNotes.files || []) as DriveFileItem[];
      for (const sf of subfolders) {
        const lname = sf.name.toLowerCase();
        if (lname === "notes") {
          await trashDriveFile(token, sf.id);
          trashedCount++;
        }
      }
    }

    return trashedCount;
  } catch (err) {
    console.warn("Error cleaning Drive duplicates:", err);
    return 0;
  }
}
