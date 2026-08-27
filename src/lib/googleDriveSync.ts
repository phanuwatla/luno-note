import { Note } from "@/hooks/useNotes";
import { getStoredTokenInfo, GoogleUserProfile, getStoredUserProfile, isGoogleDriveConnected } from "./googleDriveAuth";
import {
  ensureLunoFolderStructure,
  listDriveNoteFiles,
  fetchDriveFileContent,
  uploadDriveNoteFile,
  renameDriveFile,
  trashDriveFile,
  cleanDriveDuplicates,
  syncLocalAttachmentsToDrive,
  syncDriveAttachmentsToLocal,
  syncLocalLunoMetaToDrive,
  clearFolderPathCache,
  LunoFolderStructure,
  DriveFileItem,
} from "./googleDriveApi";

export type CloudSyncStatus =
  | "idle"
  | "saving"
  | "syncing"
  | "synced"
  | "offline"
  | "error"
  | "conflict";

export function getFullDriveFolderPath(note: Note): string {
  return (note.folderPath || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").trim();
}

export interface SyncConflictInfo {
  noteId: string;
  localNote: Note;
  remoteContent: string;
  remoteModifiedTime: string;
}

export interface GoogleDriveSyncState {
  status: CloudSyncStatus;
  lastSyncedAt: number | null;
  conflict: SyncConflictInfo | null;
  folderStructure: LunoFolderStructure | null;
  userProfile: GoogleUserProfile | null;
  errorMessage?: string;
}

type SyncListener = (state: GoogleDriveSyncState) => void;

class GoogleDriveSyncEngine {
  private state: GoogleDriveSyncState = {
    status: "idle",
    lastSyncedAt: null,
    conflict: null,
    folderStructure: null,
    userProfile: getStoredUserProfile(),
  };

  private listeners: Set<SyncListener> = new Set();
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private rootDirHandle: FileSystemDirectoryHandle | null = null;
  private electronWorkspacePath: string | null = null;
  private rootFolderName: string | null = null;
  private noteIdToDriveFileId = new Map<string, string>();
  private inFlightNoteSyncs = new Map<string, Promise<void>>();

  public setRootFolderName(name: string | null): void {
    const cleanName = (name || "").trim();
    const prevCleanName = (this.rootFolderName || "").trim();
    if (cleanName !== prevCleanName) {
      this.rootFolderName = name;
      clearFolderPathCache();
      this.noteIdToDriveFileId.clear();
      this.latestPendingNoteMap.clear();
      for (const timer of this.noteDebounceTimers.values()) clearTimeout(timer);
      this.noteDebounceTimers.clear();
      this.inFlightNoteSyncs.clear();
      this.updateState({ folderStructure: null });
    }
  }

  public setRootDirHandle(handle: FileSystemDirectoryHandle | null): void {
    this.rootDirHandle = handle;
  }

  public setElectronWorkspacePath(path: string | null): void {
    if (this.electronWorkspacePath !== path) {
      this.electronWorkspacePath = path;
      clearFolderPathCache();
      this.noteIdToDriveFileId.clear();
      this.latestPendingNoteMap.clear();
      for (const timer of this.noteDebounceTimers.values()) clearTimeout(timer);
      this.noteDebounceTimers.clear();
      this.inFlightNoteSyncs.clear();
      this.updateState({ folderStructure: null });
    }
  }

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleNetworkChange);
      window.addEventListener("offline", this.handleNetworkChange);
    }
  }

  private handleNetworkChange = () => {
    if (!navigator.onLine) {
      this.updateState({ status: "offline" });
    } else if (isGoogleDriveConnected()) {
      this.updateState({ status: "idle" });
      this.triggerFullSync();
    }
  };

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): GoogleDriveSyncState {
    return this.state;
  }

  private updateState(partial: Partial<GoogleDriveSyncState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  public async initializeSync(): Promise<LunoFolderStructure | null> {
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo) {
      this.updateState({ status: "offline", folderStructure: null });
      return null;
    }

    if (!navigator.onLine) {
      this.updateState({ status: "offline" });
      return null;
    }

    try {
      this.updateState({ status: "syncing", errorMessage: undefined });
      const structure = await ensureLunoFolderStructure(tokenInfo.access_token, this.rootFolderName || "Luno Notes");
      const profile = getStoredUserProfile();

      this.updateState({
        status: "synced",
        folderStructure: structure,
        userProfile: profile,
        lastSyncedAt: Date.now(),
      });

      this.startPolling();
      return structure;
    } catch (err: any) {
      this.updateState({
        status: "error",
        errorMessage: err.message || "Failed to connect to Google Drive",
      });
      return null;
    }
  }

  private startPolling() {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (navigator.onLine && isGoogleDriveConnected() && !this.isSyncing) {
        // Poll for external changes quietly
        this.checkForExternalChanges();
      }
    }, 30000); // 30 seconds
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Import existing files in Luno/Notes/ on Google Drive into local notes
  public async importDriveNotes(
    existingLocalNotes: Note[],
    onImportComplete: (importedNotes: Note[]) => void
  ): Promise<void> {
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo || !navigator.onLine) return;

    try {
      const structure = await this.initializeSync();
      if (!structure) return;

      // Clean up any pre-existing duplicate files on Google Drive first
      await cleanDriveDuplicates(tokenInfo.access_token, structure.projectId);

      if (this.rootDirHandle) {
        void syncDriveAttachmentsToLocal(tokenInfo.access_token, structure.attachmentsId, this.rootDirHandle);
      }

      const rawDriveFiles = await listDriveNoteFiles(tokenInfo.access_token, structure.projectId);

      // Deduplicate drive files by folderPath and fileName (keep newest, trash older duplicates on Drive)
      const driveFilesByPathName = new Map<string, (DriveFileItem & { folderPath?: string })[]>();
      for (const file of rawDriveFiles) {
        const pathKey = `${(file.folderPath || "").toLowerCase()}/${file.name.toLowerCase()}`;
        if (!driveFilesByPathName.has(pathKey)) {
          driveFilesByPathName.set(pathKey, []);
        }
        driveFilesByPathName.get(pathKey)!.push(file);
      }

      const driveFiles: (DriveFileItem & { folderPath?: string })[] = [];
      for (const [, group] of driveFilesByPathName) {
        if (group.length > 1) {
          group.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
          driveFiles.push(group[0]);
          for (let i = 1; i < group.length; i++) {
            void trashDriveFile(tokenInfo.access_token, group[i].id);
          }
        } else {
          driveFiles.push(group[0]);
        }
      }

      const localByDriveId = new Map<string, Note>();
      const localByFileName = new Map<string, Note>();

      existingLocalNotes.forEach((n) => {
        if (n.driveFileId) {
          localByDriveId.set(n.driveFileId, n);
          this.noteIdToDriveFileId.set(n.id, n.driveFileId);
        }
        if (n.fileName) {
          const key = `${(n.folderPath || "").toLowerCase()}/${n.fileName.toLowerCase()}`;
          localByFileName.set(key, n);
        }
      });

      const newOrUpdatedNotes: Note[] = [...existingLocalNotes];
      let hasChanges = false;

      for (const file of driveFiles) {
        const fileKey = `${(file.folderPath || "").toLowerCase()}/${file.name.toLowerCase()}`;
        const matchingByDriveId = localByDriveId.get(file.id);
        const matchingByName = localByFileName.get(fileKey);
        const matchingNote = matchingByDriveId || matchingByName;

        const remoteTime = new Date(file.modifiedTime).getTime();

        if (!matchingNote) {
          // Download new remote file
          const content = await fetchDriveFileContent(tokenInfo.access_token, file.id);
          const baseName = file.name.replace(/\.(md|txt|html)$/i, "");
          const format = file.name.endsWith(".html") ? "html" : file.name.endsWith(".txt") ? "plain" : "markdown";
          const newId = crypto.randomUUID();
          this.noteIdToDriveFileId.set(newId, file.id);

          const newNote: Note = {
            id: newId,
            title: baseName,
            content,
            fileName: file.name,
            createdAt: remoteTime,
            updatedAt: remoteTime,
            driveFileId: file.id,
            driveSyncedAt: remoteTime,
            contentFormat: format,
            folderPath: file.folderPath,
          };

          newOrUpdatedNotes.push(newNote);
          localByDriveId.set(file.id, newNote);
          localByFileName.set(fileKey, newNote);
          hasChanges = true;
        } else if (!matchingNote.driveFileId || matchingNote.driveFileId !== file.id) {
          // Link local note with Drive file ID
          matchingNote.driveFileId = file.id;
          matchingNote.driveSyncedAt = remoteTime;
          this.noteIdToDriveFileId.set(matchingNote.id, file.id);
          localByDriveId.set(file.id, matchingNote);
          localByFileName.set(fileKey, matchingNote);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        onImportComplete(newOrUpdatedNotes);
        this.updateState({ status: "synced", lastSyncedAt: Date.now() });
      }
    } catch (err: any) {
      console.warn("Drive import warning:", err);
    }
  }

  private noteDebounceTimers = new Map<string, NodeJS.Timeout>();
  private latestPendingNoteMap = new Map<string, { note: Note; onNoteUpdated: (updatedNote: Note) => void }>();

  // Sync a note edit to Google Drive (with optimal 800ms debounce per note)
  public queueNoteSync(
    note: Note,
    onNoteUpdated: (updatedNote: Note) => void,
    delayMs = 800
  ): void {
    if (note.fileType === "image" || note.fileType === "binary" || note.fileType === "settings" || note.fileType === "luno-ai") {
      return;
    }
    if (!isGoogleDriveConnected() || !navigator.onLine) {
      this.updateState({ status: "offline" });
      return;
    }

    this.updateState({ status: "saving" });

    // Store latest state of this note
    this.latestPendingNoteMap.set(note.id, { note, onNoteUpdated });

    const existingTimer = this.noteDebounceTimers.get(note.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      this.noteDebounceTimers.delete(note.id);
      const pending = this.latestPendingNoteMap.get(note.id);
      if (pending) {
        await this.executeNoteSync(pending.note, pending.onNoteUpdated);
      }
    }, delayMs);

    this.noteDebounceTimers.set(note.id, timer);
  }

  // Execute sync immediately for a note
  public async executeNoteSync(
    note: Note,
    onNoteUpdated: (updatedNote: Note) => void
  ): Promise<void> {
    if (note.fileType === "image" || note.fileType === "binary" || note.fileType === "settings" || note.fileType === "luno-ai") {
      return;
    }
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo || !navigator.onLine) {
      this.updateState({ status: "offline" });
      return;
    }

    if (this.inFlightNoteSyncs.has(note.id)) {
      try {
        await this.inFlightNoteSyncs.get(note.id);
      } catch {
        // ignore previous in-flight error
      }
    }

    // Always pick latest content snapshot for this note if newer exists
    const currentPending = this.latestPendingNoteMap.get(note.id);
    const targetNote = currentPending?.note || note;
    const currentContentToUpload = targetNote.content;

    const syncPromise = (async () => {
      this.isSyncing = true;
      this.updateState({ status: "syncing" });

      try {
        let structure = this.state.folderStructure;
        if (!structure) {
          structure = await ensureLunoFolderStructure(tokenInfo.access_token, this.rootFolderName || "Luno Notes");
          this.updateState({ folderStructure: structure });
        }

        const fileName = targetNote.fileName || `${targetNote.title.trim() || "Untitled"}.md`;
        const targetFolderPath = getFullDriveFolderPath(targetNote);
        const targetDriveId = targetNote.driveFileId || this.noteIdToDriveFileId.get(targetNote.id);

        const uploaded = await uploadDriveNoteFile(
          tokenInfo.access_token,
          structure.projectId,
          fileName,
          currentContentToUpload,
          targetDriveId,
          targetFolderPath
        );

        this.noteIdToDriveFileId.set(targetNote.id, uploaded.id);

        const remoteTime = new Date(uploaded.modifiedTime).getTime();
        const updatedNote: Note = {
          ...targetNote,
          fileName: uploaded.name,
          driveFileId: uploaded.id,
          driveSyncedAt: remoteTime,
        };

        onNoteUpdated(updatedNote);

        // If user typed newer content while this sync was uploading in background, schedule follow-up sync!
        const latestAfterUpload = this.latestPendingNoteMap.get(targetNote.id);
        if (latestAfterUpload && latestAfterUpload.note.content !== currentContentToUpload) {
          this.queueNoteSync(latestAfterUpload.note, latestAfterUpload.onNoteUpdated, 400);
        } else {
          this.updateState({
            status: "synced",
            lastSyncedAt: Date.now(),
            conflict: null,
          });
        }
      } catch (err: any) {
        this.updateState({
          status: "error",
          errorMessage: err.message || "Failed to sync note to Google Drive",
        });
      } finally {
        this.isSyncing = false;
      }
    })();

    this.inFlightNoteSyncs.set(note.id, syncPromise);
    try {
      await syncPromise;
    } finally {
      this.inFlightNoteSyncs.delete(note.id);
    }
  }

  // Rename note file on Drive
  public async renameNoteOnDrive(note: Note, newFileName: string): Promise<void> {
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo || !note.driveFileId || !navigator.onLine) return;

    try {
      this.updateState({ status: "syncing" });
      await renameDriveFile(tokenInfo.access_token, note.driveFileId, newFileName);
      this.updateState({ status: "synced", lastSyncedAt: Date.now() });
    } catch (err: any) {
      this.updateState({ status: "error", errorMessage: err.message });
    }
  }

  // Move note to Drive Trash
  public async trashNoteOnDrive(driveFileId: string): Promise<void> {
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo || !driveFileId || !navigator.onLine) return;

    try {
      this.updateState({ status: "syncing" });
      await trashDriveFile(tokenInfo.access_token, driveFileId);
      this.updateState({ status: "synced", lastSyncedAt: Date.now() });
    } catch (err: any) {
      console.warn("Failed to trash Drive file:", err);
    }
  }

  // Check for external changes on Drive
  private async checkForExternalChanges() {
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo || !this.state.folderStructure || !navigator.onLine) return;

    try {
      const driveFiles = await listDriveNoteFiles(
        tokenInfo.access_token,
        this.state.folderStructure.projectId
      );

      this.updateState({ lastSyncedAt: Date.now() });
    } catch {
      // ignore quiet check failures
    }
  }

  // Resolve Conflict: Choose local or remote version
  public resolveConflict(choice: "local" | "remote", onResolve: (content: string) => void): void {
    if (!this.state.conflict) return;

    if (choice === "remote") {
      onResolve(this.state.conflict.remoteContent);
    }
    this.updateState({ conflict: null, status: "synced" });
  }

  // Sync ALL local notes to Google Drive
  public async syncAllNotes(
    notes: Note[],
    onNotesUpdated?: (updatedNotes: Note[]) => void
  ): Promise<void> {
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo || !isGoogleDriveConnected() || !navigator.onLine) {
      this.updateState({ status: "offline" });
      return;
    }

    this.isSyncing = true;
    this.updateState({ status: "syncing" });

    try {
      let structure = this.state.folderStructure;
      if (!structure) {
        structure = await ensureLunoFolderStructure(tokenInfo.access_token, this.rootFolderName || "Luno Notes");
        this.updateState({ folderStructure: structure });
      }

      await cleanDriveDuplicates(tokenInfo.access_token, structure.projectId, structure.workspacesId || structure.rootId);

      // 1. Ensure ALL folder paths exist on Google Drive (even empty subfolders)
      const allFolderPaths = new Set<string>();
      notes.forEach((n) => {
        if (n.folderPath && n.folderPath.trim()) {
          const fp = n.folderPath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").trim();
          if (fp && !fp.startsWith(".luno") && !fp.startsWith("attachments")) {
            const parts = fp.split("/").filter(Boolean);
            let cur = "";
            for (const p of parts) {
              cur = cur ? `${cur}/${p}` : p;
              allFolderPaths.add(cur);
            }
          }
        }
      });

      for (const fp of allFolderPaths) {
        try {
          await ensureDriveFolderPath(tokenInfo.access_token, structure.projectId, fp);
        } catch (err) {
          console.warn(`Failed ensuring Drive folder path ${fp}:`, err);
        }
      }

      // 1. Sync all local files in attachments/ to Google Drive
      if (structure.attachmentsId) {
        void syncLocalAttachmentsToDrive(
          tokenInfo.access_token,
          structure.attachmentsId,
          this.rootDirHandle,
          this.electronWorkspacePath
        );
      }

      // 2. Sync all local metadata files in .luno/ (workspace.json, settings.json, etc.) to Google Drive
      if (structure.lunoMetaId) {
        await syncLocalLunoMetaToDrive(
          tokenInfo.access_token,
          structure.lunoMetaId,
          this.electronWorkspacePath,
          this.rootDirHandle
        );
      }

      const updatedNotesMap = new Map<string, Note>();
      notes.forEach((n) => updatedNotesMap.set(n.id, { ...n }));

      // 2. Separate text notes vs binary/image files
      const textNotes = notes.filter((n) => {
        if (
          n.id === "settings" ||
          n.id === "luno-ai" ||
          n.fileType === "settings" ||
          n.fileType === "luno-ai" ||
          n.fileType === "image" ||
          n.fileType === "binary"
        )
          return false;
        const fp = (n.folderPath || "").toLowerCase();
        if (fp === "attachments" || fp.startsWith("attachments/") || fp === ".luno" || fp.startsWith(".luno/")) return false;
        return true;
      });

      const binaryNotes = notes.filter((n) => {
        if (n.fileType === "image" || n.fileType === "binary") return true;
        const fp = (n.folderPath || "").toLowerCase();
        if (fp === "attachments" || fp.startsWith("attachments/")) return true;
        return false;
      });

      const failedTextNotes: Note[] = [];

      // 3. Process parallel chunks of text notes
      const CHUNK_SIZE = 5;
      for (let i = 0; i < textNotes.length; i += CHUNK_SIZE) {
        const chunk = textNotes.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (note) => {
            try {
              const fileName = note.fileName || `${note.title.trim() || "Untitled"}.md`;
              const targetFolderPath = getFullDriveFolderPath(note);
              const targetDriveId = note.driveFileId || this.noteIdToDriveFileId.get(note.id);

              const uploaded = await uploadDriveNoteFile(
                tokenInfo.access_token,
                structure.projectId,
                fileName,
                note.content,
                targetDriveId,
                targetFolderPath
              );

              this.noteIdToDriveFileId.set(note.id, uploaded.id);

              const remoteTime = new Date(uploaded.modifiedTime).getTime();
              const updated = updatedNotesMap.get(note.id);
              if (updated) {
                updated.fileName = uploaded.name;
                updated.driveFileId = uploaded.id;
                updated.driveSyncedAt = remoteTime;
              }
            } catch (err) {
              console.warn(`Failed to sync note ${note.id}, will retry:`, err);
              failedTextNotes.push(note);
            }
          })
        );
        if (i + CHUNK_SIZE < textNotes.length) {
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      // Retry any failed text notes sequentially
      for (const note of failedTextNotes) {
        try {
          const fileName = note.fileName || `${note.title.trim() || "Untitled"}.md`;
          const targetFolderPath = getFullDriveFolderPath(note);
          const targetDriveId = note.driveFileId || this.noteIdToDriveFileId.get(note.id);

          const uploaded = await uploadDriveNoteFile(
            tokenInfo.access_token,
            structure.projectId,
            fileName,
            note.content,
            targetDriveId,
            targetFolderPath
          );

          this.noteIdToDriveFileId.set(note.id, uploaded.id);
          const remoteTime = new Date(uploaded.modifiedTime).getTime();
          const updated = updatedNotesMap.get(note.id);
          if (updated) {
            updated.fileName = uploaded.name;
            updated.driveFileId = uploaded.id;
            updated.driveSyncedAt = remoteTime;
          }
        } catch (retryErr) {
          console.error(`Persistent failure syncing note ${note.id}:`, retryErr);
        }
      }

      // 4. Process binary and image notes (including nested assets and attachments)
      for (let i = 0; i < binaryNotes.length; i += CHUNK_SIZE) {
        const chunk = binaryNotes.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (note) => {
            try {
              if (!note.fileName || !note.content) return;
              let targetFolderId = structure.projectId;
              const fp = (note.folderPath || "").trim();
              if (fp.toLowerCase().startsWith("attachments")) {
                targetFolderId = structure.attachmentsId;
              } else if (fp) {
                targetFolderId = await ensureDriveFolderPath(tokenInfo.access_token, structure.projectId, fp);
              }

              const uploaded = await uploadDriveAttachmentFile(
                tokenInfo.access_token,
                targetFolderId,
                note.content,
                note.fileName
              );

              this.noteIdToDriveFileId.set(note.id, uploaded.id);
              const remoteTime = new Date(uploaded.modifiedTime).getTime();
              const updated = updatedNotesMap.get(note.id);
              if (updated) {
                updated.driveFileId = uploaded.id;
                updated.driveSyncedAt = remoteTime;
              }
            } catch (err) {
              console.warn(`Failed to sync binary file ${note.fileName}:`, err);
            }
          })
        );
      }

      const updatedList = Array.from(updatedNotesMap.values());
      if (onNotesUpdated) {
        onNotesUpdated(updatedList);
      }

      this.updateState({
        status: "synced",
        lastSyncedAt: Date.now(),
        conflict: null,
      });
    } catch (err: any) {
      this.updateState({
        status: "error",
        errorMessage: err.message || "Failed to sync notes to Google Drive",
      });
    } finally {
      this.isSyncing = false;
    }
  }

  public triggerFullSync(notes?: Note[], onNotesUpdated?: (updatedNotes: Note[]) => void): void {
    if (isGoogleDriveConnected() && navigator.onLine) {
      if (notes && notes.length > 0) {
        this.syncAllNotes(notes, onNotesUpdated);
      } else {
        this.initializeSync();
      }
    }
  }
}

export const syncEngine = new GoogleDriveSyncEngine();
