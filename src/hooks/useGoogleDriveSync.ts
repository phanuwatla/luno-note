import { useState, useEffect, useCallback } from "react";
import {
  syncEngine,
  GoogleDriveSyncState,
  CloudSyncStatus,
  SyncConflictInfo,
} from "@/lib/googleDriveSync";
import { Note } from "@/hooks/useNotes";

export function useGoogleDriveSync() {
  const [syncState, setSyncState] = useState<GoogleDriveSyncState>(syncEngine.getState());

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setSyncState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const queueSync = useCallback((note: Note, onUpdated: (n: Note) => void, delayMs?: number) => {
    syncEngine.queueNoteSync(note, onUpdated, delayMs);
  }, []);

  const syncNow = useCallback((note: Note, onUpdated: (n: Note) => void) => {
    syncEngine.executeNoteSync(note, onUpdated);
  }, []);

  const importDriveNotes = useCallback((localNotes: Note[], onComplete: (notes: Note[]) => void) => {
    syncEngine.importDriveNotes(localNotes, onComplete);
  }, []);

  const renameDriveNote = useCallback((note: Note, newFileName: string) => {
    syncEngine.renameNoteOnDrive(note, newFileName);
  }, []);

  const trashDriveNote = useCallback((driveFileId: string) => {
    syncEngine.trashNoteOnDrive(driveFileId);
  }, []);

  const resolveConflict = useCallback((choice: "local" | "remote", onResolve: (content: string) => void) => {
    syncEngine.resolveConflict(choice, onResolve);
  }, []);

  const setRootFolderName = useCallback((name: string | null) => {
    syncEngine.setRootFolderName(name);
  }, []);

  const triggerSync = useCallback((notes?: Note[], onNotesUpdated?: (notes: Note[]) => void) => {
    syncEngine.triggerFullSync(notes, onNotesUpdated);
  }, []);

  const setRootDirHandle = useCallback((handle: FileSystemDirectoryHandle | null) => {
    syncEngine.setRootDirHandle(handle);
  }, []);

  const setElectronWorkspacePath = useCallback((path: string | null) => {
    syncEngine.setElectronWorkspacePath(path);
  }, []);

  return {
    status: syncState.status,
    lastSyncedAt: syncState.lastSyncedAt,
    conflict: syncState.conflict,
    folderStructure: syncState.folderStructure,
    userProfile: syncState.userProfile,
    errorMessage: syncState.errorMessage,
    queueSync,
    syncNow,
    importDriveNotes,
    renameDriveNote,
    trashDriveNote,
    resolveConflict,
    triggerSync,
    setRootFolderName,
    setRootDirHandle,
    setElectronWorkspacePath,
  };
}
