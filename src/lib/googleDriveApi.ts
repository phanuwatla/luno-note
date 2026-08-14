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
  notesId: string;
  attachmentsId: string;
  lunoMetaId: string;
}

const BASE_URL = "https://www.googleapis.com/drive/v3";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";

const FOLDER_STRUCTURE_CACHE_KEY = "luno_gdrive_folder_ids";

export function getCachedFolderStructure(): LunoFolderStructure | null {
  try {
    const raw = localStorage.getItem(FOLDER_STRUCTURE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as LunoFolderStructure) : null;
  } catch {
    return null;
  }
}

export function cacheFolderStructure(structure: LunoFolderStructure): void {
  try {
    localStorage.setItem(FOLDER_STRUCTURE_CACHE_KEY, JSON.stringify(structure));
  } catch {
    // ignore
  }
}

// Find a folder by name inside a parent folder
async function findFolder(token: string, folderName: string, parentId?: string): Promise<string | null> {
  let q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }
  const url = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Drive API error (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id as string;
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

// Get or create Luno folder hierarchy: Luno/ (Notes/, Attachments/, .luno/)
export async function ensureLunoFolderStructure(token: string): Promise<LunoFolderStructure> {
  const cached = getCachedFolderStructure();
  if (cached) {
    // Verify cached root still exists
    try {
      const res = await fetch(`${BASE_URL}/files/${cached.rootId}?fields=id,trashed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const file = await res.json();
        if (!file.trashed) return cached;
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

  // 2. Subfolders inside Luno/
  let notesId = await findFolder(token, "Notes", rootId);
  if (!notesId) {
    notesId = await createFolder(token, "Notes", rootId);
  }

  let attachmentsId = await findFolder(token, "Attachments", rootId);
  if (!attachmentsId) {
    attachmentsId = await createFolder(token, "Attachments", rootId);
  }

  let lunoMetaId = await findFolder(token, ".luno", rootId);
  if (!lunoMetaId) {
    lunoMetaId = await createFolder(token, ".luno", rootId);
  }

  const structure: LunoFolderStructure = {
    rootId,
    notesId,
    attachmentsId,
    lunoMetaId,
  };
  cacheFolderStructure(structure);
  return structure;
}

// Cache folder paths to avoid redundant Drive queries
const folderPathCache = new Map<string, string>();

// Ensure nested subfolder path exists on Google Drive (e.g. "Projects/Luno")
export async function ensureDriveFolderPath(
  token: string,
  baseFolderId: string,
  folderPath: string
): Promise<string> {
  const normalized = folderPath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").trim();
  if (!normalized) return baseFolderId;

  const cacheKey = `${baseFolderId}:${normalized}`;
  if (folderPathCache.has(cacheKey)) {
    return folderPathCache.get(cacheKey)!;
  }

  const segments = normalized.split("/").filter(Boolean);
  let currentParentId = baseFolderId;

  for (const segment of segments) {
    const cleanSegment = segment.replace(/'/g, "\\'");
    const q = `'${currentParentId}' in parents and name = '${cleanSegment}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`;

    const res = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        currentParentId = data.files[0].id;
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
  }

  folderPathCache.set(cacheKey, currentParentId);
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

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const data = await res.json();
    const items: DriveFileItem[] = data.files || [];

    for (const item of items) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
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
      const searchUrl = `${BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`;
      const res = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          targetDriveId = data.files[0].id;
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

// Clean up duplicate files in Luno/Notes/ (Keep newest, move older duplicates to Drive Trash)
export async function cleanDriveDuplicates(token: string, notesFolderId: string): Promise<number> {
  try {
    const files = await listDriveNoteFiles(token, notesFolderId);
    const filesByName = new Map<string, DriveFileItem[]>();

    for (const f of files) {
      const lowerName = f.name.toLowerCase();
      if (!filesByName.has(lowerName)) {
        filesByName.set(lowerName, []);
      }
      filesByName.get(lowerName)!.push(f);
    }

    let trashedCount = 0;

    for (const [, group] of filesByName) {
      if (group.length > 1) {
        // Sort by modifiedTime descending (newest first)
        group.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
        // Keep group[0] (newest), move group[1..n] to Drive Trash
        for (let i = 1; i < group.length; i++) {
          await trashDriveFile(token, group[i].id);
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
