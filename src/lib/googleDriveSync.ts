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

  public setRootFolderName(name: string | null): void {
    this.rootFolderName = name;
  }

  public setRootDirHandle(handle: FileSystemDirectoryHandle | null): void {
    this.rootDirHandle = handle;
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
      const structure = await ensureLunoFolderStructure(tokenInfo.access_token, this.rootFolderName || "My Luno Project");
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

      const driveFiles = await listDriveNoteFiles(tokenInfo.access_token, structure.projectId);
      const localByDriveId = new Map<string, Note>();
      const localByFileName = new Map<string, Note>();

      existingLocalNotes.forEach((n) => {
        if (n.driveFileId) localByDriveId.set(n.driveFileId, n);
        if (n.fileName) localByFileName.set(n.fileName.toLowerCase(), n);
      });

      const newOrUpdatedNotes: Note[] = [...existingLocalNotes];
      let hasChanges = false;

      for (const file of driveFiles) {
        const matchingByDriveId = localByDriveId.get(file.id);
        const matchingByName = localByFileName.get(file.name.toLowerCase());
        const matchingNote = matchingByDriveId || matchingByName;

        const remoteTime = new Date(file.modifiedTime).getTime();

        if (!matchingNote) {
          // Download new remote file
          const content = await fetchDriveFileContent(tokenInfo.access_token, file.id);
          const baseName = file.name.replace(/\.(md|txt|html)$/i, "");
          const format = file.name.endsWith(".html") ? "html" : file.name.endsWith(".txt") ? "plain" : "markdown";

          newOrUpdatedNotes.push({
            id: crypto.randomUUID(),
            title: baseName,
            content,
            fileName: file.name,
            createdAt: remoteTime,
            updatedAt: remoteTime,
            driveFileId: file.id,
            driveSyncedAt: remoteTime,
            contentFormat: format,
            folderPath: file.folderPath,
          });
          hasChanges = true;
        } else if (!matchingNote.driveFileId) {
          // Link local note with Drive file ID
          matchingNote.driveFileId = file.id;
          matchingNote.driveSyncedAt = remoteTime;
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

  // Sync a note edit to Google Drive (with optimal 800ms debounce)
  public queueNoteSync(
    note: Note,
    onNoteUpdated: (updatedNote: Note) => void,
    delayMs = 800
  ): void {
    if (!isGoogleDriveConnected() || !navigator.onLine) {
      this.updateState({ status: "offline" });
      return;
    }

    this.updateState({ status: "saving" });

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(async () => {
      await this.executeNoteSync(note, onNoteUpdated);
    }, delayMs);
  }

  // Execute sync immediately for a note
  public async executeNoteSync(
    note: Note,
    onNoteUpdated: (updatedNote: Note) => void
  ): Promise<void> {
    const tokenInfo = getStoredTokenInfo();
    if (!tokenInfo || !navigator.onLine) {
      this.updateState({ status: "offline" });
      return;
    }

    this.isSyncing = true;
    this.updateState({ status: "syncing" });

    try {
      let structure = this.state.folderStructure;
      if (!structure) {
        structure = await ensureLunoFolderStructure(tokenInfo.access_token, this.rootFolderName || "My Luno Project");
        this.updateState({ folderStructure: structure });
      }

      const fileName = note.fileName || `${note.title.trim() || "Untitled"}.md`;
      const targetFolderPath = getFullDriveFolderPath(note);

      const uploaded = await uploadDriveNoteFile(
        tokenInfo.access_token,
        structure.projectId,
        fileName,
        note.content,
        note.driveFileId,
        targetFolderPath
      );

      const remoteTime = new Date(uploaded.modifiedTime).getTime();
      const updatedNote: Note = {
        ...note,
        fileName: uploaded.name,
        driveFileId: uploaded.id,
        driveSyncedAt: remoteTime,
      };

      onNoteUpdated(updatedNote);

      this.updateState({
        status: "synced",
        lastSyncedAt: Date.now(),
        conflict: null,
      });
    } catch (err: any) {
      this.updateState({
        status: "error",
        errorMessage: err.message || "Failed to sync note to Google Drive",
      });
    } finally {
      this.isSyncing = false;
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
        structure = await ensureLunoFolderStructure(tokenInfo.access_token, this.rootFolderName || "My Luno Project");
        this.updateState({ folderStructure: structure });
      }

      await cleanDriveDuplicates(tokenInfo.access_token, structure.projectId, structure.rootId);

      if (this.rootDirHandle) {
        void syncLocalAttachmentsToDrive(tokenInfo.access_token, structure.attachmentsId, this.rootDirHandle);
      }

      const updatedNotesMap = new Map<string, Note>();
      notes.forEach((n) => updatedNotesMap.set(n.id, { ...n }));

      const validNotes = notes.filter((n) => {
        if (n.id === "settings" || n.id === "luno-ai" || n.fileType === "settings" || n.fileType === "luno-ai") return false;
        const fp = (n.folderPath || "").toLowerCase();
        if (fp === "attachments" || fp.startsWith("attachments/") || fp === ".luno" || fp.startsWith(".luno/")) return false;
        return true;
      });

      // Process parallel chunks of 5 notes for ultra-fast sync speed
      const CHUNK_SIZE = 5;
      for (let i = 0; i < validNotes.length; i += CHUNK_SIZE) {
        const chunk = validNotes.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (note) => {
            try {
              const fileName = note.fileName || `${note.title.trim() || "Untitled"}.md`;
              const targetFolderPath = getFullDriveFolderPath(note);

              const uploaded = await uploadDriveNoteFile(
                tokenInfo.access_token,
                structure.projectId,
                fileName,
                note.content,
                note.driveFileId,
                targetFolderPath
              );

              const remoteTime = new Date(uploaded.modifiedTime).getTime();
              const updated = updatedNotesMap.get(note.id);
              if (updated) {
                updated.fileName = uploaded.name;
                updated.driveFileId = uploaded.id;
                updated.driveSyncedAt = remoteTime;
              }
            } catch (err) {
              console.warn(`Failed to sync note ${note.id}:`, err);
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
