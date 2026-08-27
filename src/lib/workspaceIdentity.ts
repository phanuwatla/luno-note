import { getStoredDirectoryHandle } from "./fileHandles";

export interface WorkspaceManifest {
  id: string;
  name: string;
  version?: number;
  createdAt?: number;
  updatedAt?: number;
}

export type WorkspaceStatus = "connected" | "cloud_only" | "differs";

export interface CloudWorkspaceInfo {
  id: string; // Google Drive folder ID
  name: string; // Workspace display name (e.g. "University")
  workspaceId: string; // Unique Workspace ID (e.g. "ws_123456")
  status: WorkspaceStatus;
  modifiedTime?: string;
  fileCount?: number;
  localMatchingPath?: string;
}

const LOCAL_MANIFEST_CACHE_KEY = "luno_local_workspace_manifest";

export function generateWorkspaceId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `ws_${crypto.randomUUID()}`;
  }
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Reads or creates .luno/workspace.json for local workspace (Electron or Web FS Access API)
 */
export async function getLocalWorkspaceManifest(
  targetDirHandle?: FileSystemDirectoryHandle | null,
  targetElectronPath?: string | null,
  fallbackName?: string
): Promise<WorkspaceManifest | null> {
  try {
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

    // 1. Electron Desktop Environment
    if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent && electronAPI?.writeFileContent) {
      let folderPath = targetElectronPath;
      if (!folderPath) {
        const saved = await electronAPI.getSavedWorkspace();
        folderPath = saved?.folderPath ?? null;
      }

      if (folderPath) {
        const manifestPath = `${folderPath}/.luno/workspace.json`;
        try {
          const content = await electronAPI.readFileContent(manifestPath);
          if (content) {
            const parsed = JSON.parse(content);
            if (parsed.id) {
              registerKnownLocalWorkspace(parsed as WorkspaceManifest, folderPath);
              return parsed as WorkspaceManifest;
            }
          }
        } catch {
          // File doesn't exist yet, create it
        }

        // Auto-generate manifest if missing
        const newManifest: WorkspaceManifest = {
          id: generateWorkspaceId(),
          name: fallbackName || folderPath.split(/[\\/]/).pop() || "Workspace",
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        try {
          await electronAPI.writeFileContent({
            fullPath: manifestPath,
            content: JSON.stringify(newManifest, null, 2),
          });
        } catch (err) {
          console.warn("Could not write local workspace.json in Electron:", err);
        }

        registerKnownLocalWorkspace(newManifest, folderPath);
        return newManifest;
      }
    }

    // 2. Web File System Access API
    let dirHandle = targetDirHandle;
    if (!dirHandle) {
      dirHandle = await getStoredDirectoryHandle();
    }

    if (dirHandle) {
      try {
        const metaDir = await dirHandle.getDirectoryHandle(".luno", { create: true });
        try {
          const fileHandle = await metaDir.getFileHandle("workspace.json", { create: false });
          const file = await fileHandle.getFile();
          const text = await file.text();
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.id) {
              registerKnownLocalWorkspace(parsed as WorkspaceManifest, dirHandle.name);
              return parsed as WorkspaceManifest;
            }
          }
        } catch {
          // File does not exist, generate new
        }

        const newManifest: WorkspaceManifest = {
          id: generateWorkspaceId(),
          name: fallbackName || dirHandle.name || "Workspace",
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const fileHandle = await metaDir.getFileHandle("workspace.json", { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(newManifest, null, 2));
        await writable.close();

        registerKnownLocalWorkspace(newManifest, dirHandle.name);
        return newManifest;
      } catch (err) {
        console.warn("Could not access .luno/workspace.json in Web FS:", err);
      }
    }

    // 3. Fallback to LocalStorage cache if available
    try {
      const cached = localStorage.getItem(LOCAL_MANIFEST_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as WorkspaceManifest;
      }
    } catch {
      // ignore
    }

    return null;
  } catch (err) {
    console.warn("Error getting local workspace manifest:", err);
    return null;
  }
}

const REGISTRY_KEY = "luno_known_workspaces_registry";

/**
 * Persists a workspace manifest into local registry cache
 */
export function registerKnownLocalWorkspace(manifest: WorkspaceManifest, pathOrHandle?: string | null) {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    const list: Array<{ id: string; name: string; path?: string; manifest: WorkspaceManifest }> = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((item) => item.id !== manifest.id && item.name.toLowerCase() !== manifest.name.toLowerCase());
    filtered.unshift({ id: manifest.id, name: manifest.name, path: pathOrHandle || undefined, manifest });
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch {
    // ignore
  }
}

/**
 * Returns all local workspace manifests known on this device
 */
export async function getAllKnownLocalManifests(): Promise<WorkspaceManifest[]> {
  const manifests: WorkspaceManifest[] = [];
  const seenIds = new Set<string>();
  const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

  if (electronAPI?.getSavedWorkspace) {
    try {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const m = await getLocalWorkspaceManifest(null, saved.folderPath, saved.folderName);
        if (m && !seenIds.has(m.id)) {
          manifests.push(m);
          seenIds.add(m.id);
        }
      }
    } catch {
      // ignore
    }
  }

  if (electronAPI?.getRecentWorkspaces) {
    try {
      const recent = await electronAPI.getRecentWorkspaces();
      if (Array.isArray(recent)) {
        for (const item of recent) {
          if (item?.folderPath) {
            const m = await getLocalWorkspaceManifest(null, item.folderPath, item.folderName);
            if (m && !seenIds.has(m.id)) {
              manifests.push(m);
              seenIds.add(m.id);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (electronAPI?.scanLocalWorkspaces) {
    try {
      const scanned = await electronAPI.scanLocalWorkspaces();
      if (Array.isArray(scanned)) {
        for (const item of scanned) {
          if (item?.manifest?.id && !seenIds.has(item.manifest.id)) {
            manifests.push(item.manifest);
            seenIds.add(item.manifest.id);
            registerKnownLocalWorkspace(item.manifest, item.folderPath);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const storedDir = await getStoredDirectoryHandle();
    if (storedDir) {
      const m = await getLocalWorkspaceManifest(storedDir, null, storedDir.name);
      if (m && !seenIds.has(m.id)) {
        manifests.push(m);
        seenIds.add(m.id);
      }
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (raw) {
      const list: Array<{ id: string; name: string; path?: string; manifest: WorkspaceManifest }> = JSON.parse(raw);
      for (const item of list) {
        if (electronAPI?.readFileContent && item.path) {
          try {
            const content = await electronAPI.readFileContent(`${item.path}/.luno/workspace.json`);
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed?.id && !seenIds.has(parsed.id)) {
                manifests.push(parsed);
                seenIds.add(parsed.id);
                continue;
              }
            }
          } catch {
            // ignore
          }
        }
        if (item.manifest && !seenIds.has(item.manifest.id)) {
          manifests.push(item.manifest);
          seenIds.add(item.manifest.id);
        }
      }
    }
  } catch {
    // ignore
  }

  return manifests;
}

/**
 * Determine the 3-tier status for a Cloud Workspace:
 * - "connected": Same Workspace ID exists locally & is in-sync
 * - "differs": Same Workspace Name exists locally but has a different Workspace ID, or local and cloud have divergent edits
 * - "cloud_only": No local workspace has this Workspace ID or Name
 */
export function calculateWorkspaceStatus(
  cloudWorkspace: { id?: string; workspaceId?: string; name?: string } | string,
  localManifests: WorkspaceManifest[] | WorkspaceManifest | null,
  options?: {
    isDiffering?: boolean;
    localMatchingPath?: string;
  }
): WorkspaceStatus {
  if (!localManifests) {
    return "cloud_only";
  }

  const cloudId =
    typeof cloudWorkspace === "string"
      ? cloudWorkspace
      : cloudWorkspace.workspaceId || cloudWorkspace.id || "";
  const cloudName =
    typeof cloudWorkspace === "string" ? "" : (cloudWorkspace.name || "").trim().toLowerCase();

  const manifestList = Array.isArray(localManifests) ? localManifests : [localManifests];

  // 1. Exact ID match exists locally -> Connected
  const exactIdLocal = manifestList.find((m) => m.id && cloudId && m.id === cloudId);
  if (exactIdLocal) {
    return options?.isDiffering ? "differs" : "connected";
  }

  // 2. Same Name exists locally but ID differs -> Differs (e.g. independently created on cloud with same name)
  if (cloudName) {
    const sameNameLocal = manifestList.find(
      (m) => m.name && m.name.trim().toLowerCase() === cloudName
    );
    if (sameNameLocal) {
      return "differs";
    }
  }

  // 3. Neither ID nor Name exists locally -> Cloud only
  return "cloud_only";
}
