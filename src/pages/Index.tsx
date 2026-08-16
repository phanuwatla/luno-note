import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import SplitResizer from "@/components/SplitResizer";
import TabBar from "@/components/TabBar";
import Breadcrumb from "@/components/Breadcrumb";
import SettingsTabView, { type SettingsCategory } from "@/components/SettingsTabView";
import LunoAiView from "@/components/LunoAiView";
import type { Note } from "@/hooks/useNotes";
import { useNotes, extractBaseTitleFromFileName, isSystemGeneratedUntitledName } from "@/hooks/useNotes";
import { useAppSettings, saveWorkspaceSettings, loadWorkspaceSettings, type AppSettings } from "@/hooks/useAppSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTabs } from "@/hooks/useTabs";
import type { CreateNoteOptions } from "@/lib/fileHandles";
import { clearAllStoredFileHandles, getStoredFileHandle, setStoredFileHandle, getStoredDirectoryHandle, setStoredDirectoryHandle, removeStoredDirectoryHandle, requestPermissionIfAvailable, unmarkNoteAsDeleted, trackDeletedRelativePath, clearDeletedRelativePath, isRelativePathDeleted, globalDeletedRelativePaths } from "@/lib/fileHandles";
import { marked } from "marked";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoogleDriveSync } from "@/hooks/useGoogleDriveSync";
import { isGoogleDriveConnected } from "@/lib/googleDriveAuth";
import { getNoteTemplateContent } from "@/lib/templates";

export default function Index() {
  const { t } = useTranslation();
  // ความกว้างฝั่งซ้าย (px) ถ้า split, ค่า default 50%
  const [splitLeftWidth, setSplitLeftWidth] = useState<number | null>(null);
  const { notes, createNote, replaceNotes, updateNote, deleteNote, renameTagGlobally, deleteTagGlobally } = useNotes();
  const { openTabIds, activeTabId, openTab, closeTab, removeTabsForDeletedNotes, reorderTabs, setActiveTabId } = useTabs();

  const SETTINGS_NOTE: Note = useMemo(
    () => ({
      id: "settings",
      title: t("settings.title") || "Settings",
      content: "",
      createdAt: 0,
      updatedAt: 0,
      fileName: t("settings.title") || "Settings",
      fileType: "settings",
    }),
    [t]
  );

  const LUNO_AI_NOTE: Note = useMemo(
    () => ({
      id: "luno-ai",
      title: "Luno AI",
      content: "",
      createdAt: 0,
      updatedAt: 0,
      fileName: "Luno AI",
      fileType: "luno-ai",
    }),
    []
  );

  const activeTabNote = activeTabId === "settings" ? SETTINGS_NOTE : activeTabId === "luno-ai" ? LUNO_AI_NOTE : (notes.find((n) => n.id === activeTabId) ?? null);
  const { settings } = useAppSettings();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openedFolderName, setOpenedFolderName] = useState<string | null>(null);
  const [openedRootDirHandle, setOpenedRootDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [pendingReconnectDirHandle, setPendingReconnectDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [openedFolderPaths, setOpenedFolderPaths] = useState<string[]>([]);
  const [clipboardItem, setClipboardItem] = useState<{ kind: "file" | "file-batch" | "folder"; noteId?: string; noteIds?: string[]; folderPath: string; fileName?: string } | null>(null);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("general");
  const notesRef = useRef(notes);

  const { queueSync, trashDriveNote, importDriveNotes, setRootFolderName, setRootDirHandle } = useGoogleDriveSync();

  useEffect(() => {
    const folderName = openedFolderName || "My Luno Project";
    setRootFolderName(folderName);
    setRootDirHandle(openedRootDirHandle);
  }, [openedFolderName, openedRootDirHandle, setRootFolderName, setRootDirHandle]);

  const handleOpenSettings = useCallback((category: SettingsCategory = "general") => {
    setSettingsCategory(category);
    openTab("settings");
  }, [openTab]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Google Drive cloud sync triggers
  useEffect(() => {
    if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
      importDriveNotes(notesRef.current, (imported) => {
        replaceNotes(imported);
      });
    }
  }, [settings.storageMode, importDriveNotes, replaceNotes]);

  const handleUpdateNote = useCallback(
    (id: string, patch: Partial<Note>) => {
      updateNote(id, patch);
      const latestNotes = notesRef.current;
      const updated = latestNotes.find((n) => n.id === id);
      if (updated && settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
        queueSync(updated, (syncedNote) => {
          updateNote(syncedNote.id, syncedNote);
        });
      }
    },
    [updateNote, settings.storageMode, queueSync]
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-app-font", settings.fontFamily);
  }, [settings.fontFamily]);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-theme", settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(activeTabNote === null);
    }
  }, [activeTabNote, isMobile]);

  useEffect(() => {
    if (activeTabNote) {
      const rawName = activeTabNote.fileName || activeTabNote.title || "";
      const baseName = extractBaseTitleFromFileName(rawName) || rawName || "Untitled";
      document.title = baseName;
    } else {
      document.title = "Luno Note";
    }
  }, [activeTabNote?.fileName, activeTabNote?.title, activeTabNote?.id]);

  const normalizeNewFileOptions = (options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" }) => {
    const raw = (options?.fileName ?? "").trim();
    const safe = raw.replace(/[\\/:*?"<>|]/g, "_");

    const defaultExt = settings.defaultExtension || "md";
    const defaultFormat = defaultExt === "html" ? ("html" as const) : defaultExt === "txt" ? ("plain" as const) : ("markdown" as const);

    if (!safe) {
      const dateStr = new Date().toISOString().slice(0, 10);
      let baseName = "Untitled";
      if (settings.newFilePattern === "date") {
        baseName = `Note_${dateStr}`;
      } else if (settings.newFilePattern === "daily") {
        baseName = `Daily-${dateStr}`;
      }
      return { fileName: `${baseName}.${defaultExt}`, contentFormat: defaultFormat };
    }

    const dotIndex = safe.lastIndexOf(".");
    const base = dotIndex > 0 ? safe.slice(0, dotIndex) : safe;
    const extFromName = dotIndex > 0 ? safe.slice(dotIndex + 1).toLowerCase() : "";
    const desiredFormat = options?.contentFormat ?? defaultFormat;

    if (extFromName === "md" || extFromName === "markdown") {
      return { fileName: `${base}.md`, contentFormat: "markdown" as const };
    }
    if (extFromName === "txt") {
      return { fileName: `${base}.txt`, contentFormat: "plain" as const };
    }
    if (extFromName === "html" || extFromName === "htm") {
      return { fileName: `${base}.${extFromName}`, contentFormat: "html" as const };
    }

    if (desiredFormat === "markdown") {
      return { fileName: `${base}.md`, contentFormat: "markdown" as const };
    }
    if (desiredFormat === "html") {
      return { fileName: `${base}.html`, contentFormat: "html" as const };
    }
    return { fileName: `${base}.${defaultExt}`, contentFormat: defaultFormat };
  };

  const resolveUniqueFileName = async (targetDir: FileSystemDirectoryHandle, desiredFileName: string) => {
    const dotIndex = desiredFileName.lastIndexOf(".");
    const base = dotIndex > 0 ? desiredFileName.slice(0, dotIndex) : desiredFileName;
    const ext = dotIndex > 0 ? desiredFileName.slice(dotIndex) : ".txt";

    let index = 0;
    while (true) {
      const candidate = index === 0 ? `${base}${ext}` : `${base}-${index}${ext}`;
      try {
        await targetDir.getFileHandle(candidate, { create: false });
        index += 1;
      } catch (error) {
        if ((error as DOMException)?.name !== "NotFoundError") throw error;
        return candidate;
      }
    }
  };

  const resolveUniqueFolderName = async (targetDir: FileSystemDirectoryHandle, desiredFolderName: string) => {
    let index = 0;
    while (true) {
      const candidate = index === 0 ? desiredFolderName : `${desiredFolderName}-${index}`;
      try {
        await targetDir.getDirectoryHandle(candidate, { create: false });
        index += 1;
      } catch (error) {
        if ((error as DOMException)?.name !== "NotFoundError") throw error;
        return candidate;
      }
    }
  };

  const getDirectoryHandleByPath = async (folderPath: string) => {
    if (!openedRootDirHandle) return null;
    let dir = openedRootDirHandle;
    const segments = folderPath.split("/").filter(Boolean);
    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment);
    }
    return dir;
  };

  const copyFileHandleToDirectory = async (sourceFileHandle: FileSystemFileHandle, targetDir: FileSystemDirectoryHandle, targetName: string) => {
    const file = await sourceFileHandle.getFile();
    const writableTarget = await targetDir.getFileHandle(targetName, { create: true });
    const writable = await (writableTarget as unknown as { createWritable: () => Promise<WritableStreamDefaultWriter | { write: (data: unknown) => Promise<void>; close: () => Promise<void> }> }).createWritable();
    await writable.write(file);
    await writable.close();
    return writableTarget;
  };

  const copyDirectoryRecursive = async (sourceDirHandle: FileSystemDirectoryHandle, targetParentDir: FileSystemDirectoryHandle, desiredFolderName: string) => {
    const finalFolderName = await resolveUniqueFolderName(targetParentDir, desiredFolderName);
    const newDir = await targetParentDir.getDirectoryHandle(finalFolderName, { create: true });

    for await (const [entryName, entryHandle] of (sourceDirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
      if (entryHandle.kind === "directory") {
        await copyDirectoryRecursive(entryHandle as FileSystemDirectoryHandle, newDir, entryName);
      } else if (entryHandle.kind === "file") {
        await copyFileHandleToDirectory(entryHandle as FileSystemFileHandle, newDir, entryName);
      }
    }

    return finalFolderName;
  };

  const getRelativePath = (folderPath: string, fileName: string) => (folderPath ? `${folderPath}/${fileName}` : fileName);

  const scanFolderEntries = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico", ".tiff", ".avif"]);
    const TEXT_EXTS = new Set([
      ".txt", ".md", ".markdown",
      ".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs",
      ".py", ".rb", ".go", ".rs", ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".swift", ".kt",
      ".html", ".htm", ".css", ".scss", ".less",
      ".json", ".yaml", ".yml", ".toml", ".xml", ".csv", ".ini", ".cfg", ".conf", ".env",
      ".sh", ".bash", ".zsh", ".fish",
      ".sql", ".r", ".scala", ".lua", ".vim",
    ]);

    const entries: Array<{
      fileName: string;
      contentFormat: "plain" | "markdown" | "html";
      fileType?: "image" | "binary";
      handle: FileSystemFileHandle;
      folderPath: string;
      relativePath: string;
    }> = [];
    const folderPaths = new Set<string>();

    const MAX_FILES = 2500;
    const IGNORED_FOLDERS = new Set([
      "attachments",
      "Attachments",
      ".luno",
      "node_modules",
      ".git",
      ".next",
      "dist",
      "build",
      ".output",
      ".cache",
      "vendor",
      "target",
      ".vscode",
      ".idea",
      "coverage",
      ".turbo",
      ".svelte-kit",
      ".nuxt",
      "__pycache__",
      "venv",
      ".venv",
      "bin",
      "obj",
    ]);

    async function readDir(handle: FileSystemDirectoryHandle, path: string) {
      if (entries.length >= MAX_FILES) return;
      try {
        const iterator =
          typeof (handle as any).entries === "function"
            ? (handle as any).entries()
            : (handle as unknown as AsyncIterable<[string, FileSystemHandle]>);

        for await (const [name, childHandle] of iterator) {
          if (entries.length >= MAX_FILES) break;
          const lname = name.toLowerCase();

          if (childHandle.kind === "directory") {
            if (IGNORED_FOLDERS.has(lname) || lname.startsWith(".")) continue;
            const subPath = path ? `${path}/${name}` : name;
            folderPaths.add(subPath);
            await readDir(childHandle as FileSystemDirectoryHandle, subPath);
          } else if (childHandle.kind === "file") {
            if (lname.endsWith(".crswap") || lname.includes(".crswap") || lname.endsWith(".tmp") || lname.endsWith(".swp")) {
              try {
                await handle.removeEntry(name);
              } catch {
                /* ignore swap cleanup errors */
              }
              continue;
            }
            if (lname.startsWith(".")) continue;

            const dotIdx = lname.lastIndexOf(".");
            const ext = dotIdx >= 0 ? lname.slice(dotIdx) : "";

            let fileType: "image" | "binary" | undefined;
            let contentFormat: "plain" | "markdown" | "html" = "plain";

            if (IMAGE_EXTS.has(ext)) {
              fileType = "image";
            } else if (TEXT_EXTS.has(ext)) {
              contentFormat = ext === ".md" || ext === ".markdown" ? "markdown" : ext === ".html" || ext === ".htm" ? "html" : "plain";
            } else {
              fileType = "binary";
            }

            entries.push({
              fileName: name,
              contentFormat,
              fileType,
              handle: childHandle as FileSystemFileHandle,
              folderPath: path,
              relativePath: getRelativePath(path, name),
            });
          }
        }
      } catch (err) {
        console.warn("Failed reading directory", path, err);
      }
    }

    await readDir(dirHandle, "");

    entries.sort((a, b) => {
      const pathCompare = a.folderPath.localeCompare(b.folderPath);
      if (pathCompare !== 0) return pathCompare;
      return a.fileName.localeCompare(b.fileName);
    });

    return { entries, folderPaths: Array.from(folderPaths).sort((a, b) => a.localeCompare(b)) };
  }, []);

  const syncFolderFromDisk = useCallback(async (dirHandle: FileSystemDirectoryHandle, excludeRelativePaths?: Set<string>, selectRelativePath?: string) => {
    const isExcluded = (relPath: string) =>
      isRelativePathDeleted(relPath) || Boolean(excludeRelativePaths && excludeRelativePaths.has(relPath));

    const { entries, folderPaths } = await scanFolderEntries(dirHandle);
    const filteredEntries = entries.filter((e) => !isExcluded(e.relativePath));

    setOpenedFolderPaths(folderPaths);
    const currentNotes = notesRef.current;
    const existingByPath = new Map(
      currentNotes
        .filter((n) => n.fileName && !isExcluded(getRelativePath(n.folderPath || "", n.fileName)))
        .map((n) => [getRelativePath(n.folderPath || "", n.fileName as string), n] as const),
    );

    const activeNoteRef = activeTabId ? currentNotes.find((n) => n.id === activeTabId) : null;
    const activeRelativePath = activeNoteRef?.fileName
      ? getRelativePath(activeNoteRef.folderPath || "", activeNoteRef.fileName)
      : null;

    const nextItems: Array<{ id?: string; content: string; fileName: string; contentFormat: "plain" | "markdown" | "html"; isLinkedFile: true; folderPath: string; fileType?: "image" | "binary" }> = [];

    for (const entry of filteredEntries) {
      let existing = existingByPath.get(entry.relativePath);
      if (!existing && selectRelativePath && entry.relativePath === selectRelativePath) {
        existing = activeNoteRef || currentNotes.find((n) => openTabIds.includes(n.id));
      }

      if (existing) {
        nextItems.push({
          id: existing.id,
          content: existing.content,
          fileName: entry.fileName,
          contentFormat: entry.contentFormat,
          isLinkedFile: true,
          folderPath: entry.folderPath,
          fileType: entry.fileType,
        });
        continue;
      }

      if (entry.fileType === "image" || entry.fileType === "binary") {
        nextItems.push({
          content: "",
          fileName: entry.fileName,
          contentFormat: entry.contentFormat,
          isLinkedFile: true,
          folderPath: entry.folderPath,
          fileType: entry.fileType,
        });
        continue;
      }

      try {
        const file = await entry.handle.getFile();
        const text = await file.text();
        nextItems.push({
          content: text,
          fileName: entry.fileName,
          contentFormat: entry.contentFormat,
          isLinkedFile: true,
          folderPath: entry.folderPath,
        });
      } catch {
        // skip unreadable files
      }
    }

    const handleByRelativePath = new Map(filteredEntries.map((entry) => [entry.relativePath, entry.handle] as const));

    await clearAllStoredFileHandles();
    const nextNotes = replaceNotes(nextItems);
    await Promise.all(
      nextNotes.map((note) => {
        const relPath = note.fileName ? getRelativePath(note.folderPath || "", note.fileName) : "";
        const handle = relPath ? handleByRelativePath.get(relPath) : null;
        return handle ? setStoredFileHandle(note.id, handle) : Promise.resolve();
      }),
    );

    if (nextNotes.length === 0) {
      setActiveTabId(null);
      return nextNotes;
    }

    const targetPathToOpen = selectRelativePath || activeRelativePath;
    if (targetPathToOpen) {
      const nextActive = nextNotes.find((n) => n.fileName && getRelativePath(n.folderPath || "", n.fileName) === targetPathToOpen);
      if (nextActive) {
        openTab(nextActive.id);
        removeTabsForDeletedNotes(new Set(nextNotes.map((n) => n.id)));
        return nextNotes;
      }
    }

    removeTabsForDeletedNotes(new Set(nextNotes.map((n) => n.id)));
    return nextNotes;
  }, [activeTabId, replaceNotes, scanFolderEntries, openTab, setActiveTabId, removeTabsForDeletedNotes]);

  const createNoteInFolder = async (
    folderPath?: string,
    options?: CreateNoteOptions,
  ): Promise<Note> => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const { fileName: desiredFileName, contentFormat } = normalizeNewFileOptions(options);
    const isTxt = desiredFileName.toLowerCase().endsWith(".txt") || contentFormat === "plain";
    const rawTitle = extractBaseTitleFromFileName(desiredFileName);
    const isUntitled = isSystemGeneratedUntitledName(rawTitle);
    const initialTitle = isUntitled || isTxt ? "" : rawTitle;
    const targetExt = desiredFileName.split(".").pop()?.toLowerCase() || settings.defaultExtension;
    const resolvedFormat: "markdown" | "html" | "plain" = (contentFormat || (targetExt === "html" ? "html" : isTxt || targetExt === "txt" ? "plain" : "markdown")) as any;
    const templateContent = getNoteTemplateContent(settings.defaultNoteTemplate, settings.language, resolvedFormat);
    const initialContent = options?.initialContent ?? (templateContent ? templateContent : (isTxt ? "" : (initialTitle ? `<h1>${initialTitle}</h1>` : "<h1></h1>")));

    // If no folder is opened, fallback to normal in-app note creation.
    if (!openedRootDirHandle) {
      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName: desiredFileName,
        title: initialTitle,
        content: initialContent,
        isLinkedFile: false,
        contentFormat,
      });
      openTab(note.id);
      return note;
    }

    try {
      let targetDir = openedRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        targetDir = await targetDir.getDirectoryHandle(segment);
      }

      const fileName = await resolveUniqueFileName(targetDir, desiredFileName);
      const isFileTxt = fileName.toLowerCase().endsWith(".txt") || contentFormat === "plain";
      const rawFileTitle = extractBaseTitleFromFileName(fileName);
      const isFileUntitled = isSystemGeneratedUntitledName(rawFileTitle);
      const fileTitle = isFileUntitled || isFileTxt ? "" : rawFileTitle;
      const isFileHtml = fileName.toLowerCase().endsWith(".html") || contentFormat === "html";
      const fileResolvedFormat: "markdown" | "html" | "plain" = (contentFormat || (isFileHtml ? "html" : isFileTxt || fileName.toLowerCase().endsWith(".txt") ? "plain" : "markdown")) as any;
      const fileTemplateContent = getNoteTemplateContent(settings.defaultNoteTemplate, settings.language, fileResolvedFormat);
      const fileContent = options?.initialContent ?? (fileTemplateContent ? fileTemplateContent : (isFileTxt ? "" : (fileTitle ? `<h1>${fileTitle}</h1>` : "<h1></h1>")));
      const relPath = getRelativePath(normalizedPath, fileName);
      clearDeletedRelativePath(relPath);

      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName,
        title: fileTitle,
        content: fileContent,
        isLinkedFile: true,
        contentFormat,
      });
      openTab(note.id);
      await setStoredFileHandle(note.id, fileHandle);
      return note;
    } catch (error) {
      console.error("Create file in folder failed", error);
      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName: desiredFileName,
        title: initialTitle,
        content: initialContent,
        isLinkedFile: false,
        contentFormat,
      });
      openTab(note.id);
      return note;
    }
  };

  // Global App-level Keyboard Shortcuts (Ctrl+N, Ctrl+K, Ctrl+Shift+C, Ctrl+Shift+T, etc.)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      const key = e.key.toLowerCase();

      // 1. Ctrl + N / Cmd + N (New Note) -> Intercept browser "New Window"
      if (key === "n" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        void createNoteInFolder();
        return;
      }

      // 2. Ctrl + K / Cmd + K (Quick Search) -> Intercept browser search bar focus
      if (key === "k" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        setSidebarOpen(true);
        setTimeout(() => {
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="text"][placeholder*="Search"], input[type="text"][placeholder*="ค้นหา"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 50);
        return;
      }

      // 3. Ctrl + Shift + C (Toggle Floating Calculator) -> Intercept browser Inspect Element
      if (e.shiftKey && key === "c") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("app:toggle-calculator"));
        return;
      }

      // 4. Ctrl + Shift + T (Toggle Floating Clock) -> Intercept browser "Reopen Closed Tab"
      if (e.shiftKey && key === "t") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("app:toggle-clock"));
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [createNoteInFolder]);

  const createFolderInFolder = async (folderPath?: string, folderName?: string) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const safeName = (folderName ?? "").trim().replace(/[\\/:*?"<>|]/g, "_") || "untitled-folder";

    if (!openedRootDirHandle) return;

    try {
      let parentDir = openedRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        parentDir = await parentDir.getDirectoryHandle(segment);
      }

      const targetFolderName = await resolveUniqueFolderName(parentDir, safeName);
      await parentDir.getDirectoryHandle(targetFolderName, { create: true });

      const newFolderPath = normalizedPath ? `${normalizedPath}/${targetFolderName}` : targetFolderName;
      for (const p of Array.from(globalDeletedRelativePaths)) {
        if (p === newFolderPath || p.startsWith(`${newFolderPath}/`)) {
          clearDeletedRelativePath(p);
        }
      }

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Create folder failed", error);
    }
  };

  const activeRenameLocksRef = useRef<Set<string>>(new Set());

  const renameFileInFolder = async (note: Note, nextName: string) => {
    if (!openedRootDirHandle || !note.fileName) return;
    if (activeRenameLocksRef.current.has(note.id)) return;

    const proposed = nextName.trim();
    if (!proposed || proposed === note.fileName) return;

    activeRenameLocksRef.current.add(note.id);
    const oldRelPath = getRelativePath(note.folderPath || "", note.fileName);
    trackDeletedRelativePath(oldRelPath);

    try {
      const sourceDir = await getDirectoryHandleByPath(note.folderPath || "");
      if (!sourceDir) return;

      const safeName = proposed.replace(/[\\/:*?"<>|]/g, "_") || note.fileName;
      const finalName = await resolveUniqueFileName(sourceDir, safeName);
      const newRelPath = getRelativePath(note.folderPath || "", finalName);
      clearDeletedRelativePath(newRelPath);

      const sourceHandle = await sourceDir.getFileHandle(note.fileName);
      let newHandle = sourceHandle;

      if (typeof (sourceHandle as unknown as { move?: (name: string) => Promise<void> }).move === "function") {
        await (sourceHandle as unknown as { move: (name: string) => Promise<void> }).move(finalName);
      } else {
        newHandle = await copyFileHandleToDirectory(sourceHandle, sourceDir, finalName);
        await sourceDir.removeEntry(note.fileName);
      }

      await setStoredFileHandle(note.id, newHandle);
      notesRef.current = notesRef.current.map((n) =>
        n.id === note.id ? { ...n, fileName: finalName, title: extractBaseTitleFromFileName(finalName) } : n
      );
      updateNote(note.id, { fileName: finalName, title: extractBaseTitleFromFileName(finalName) });
      await syncFolderFromDisk(openedRootDirHandle, undefined, newRelPath);
    } catch (error) {
      console.error("Rename file failed", error);
      clearDeletedRelativePath(oldRelPath);
    } finally {
      activeRenameLocksRef.current.delete(note.id);
    }
  };

  const renameFolderInFolder = async (folderPath: string, nextName: string) => {
    if (!openedRootDirHandle || !folderPath) return;

    const segments = folderPath.split("/").filter(Boolean);
    const currentName = segments[segments.length - 1] || "folder";
    const proposed = nextName.trim();
    if (!proposed || proposed === currentName) return;

    const notesInFolder = notes.filter(
      (n) => n.folderPath === folderPath || n.folderPath?.startsWith(`${folderPath}/`)
    );
    notesInFolder.forEach((n) => {
      if (n.fileName) {
        trackDeletedRelativePath(getRelativePath(n.folderPath || "", n.fileName));
      }
    });

    try {
      let parentDir = openedRootDirHandle;
      for (const segment of segments.slice(0, -1)) {
        parentDir = await parentDir.getDirectoryHandle(segment);
      }

      const sourceDir = await parentDir.getDirectoryHandle(currentName);
      const safeName = proposed.replace(/[\\/:*?"<>|]/g, "_") || currentName;
      const newFolderName = await copyDirectoryRecursive(sourceDir, parentDir, safeName);
      await parentDir.removeEntry(currentName, { recursive: true });

      // Keep selection on the renamed folder when possible.
      const parentPath = segments.slice(0, -1).join("/");
      const renamedPath = parentPath ? `${parentPath}/${newFolderName}` : newFolderName;
      notesInFolder.forEach((n) => {
        const suffix = (n.folderPath || "").slice(folderPath.length);
        const updatedPath = `${renamedPath}${suffix}`.replace(/^\/+/, "");
        updateNote(n.id, { folderPath: updatedPath });
      });

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Rename folder failed", error);
    }
  };

  const duplicateFileInFolder = async (note: Note) => {
    if (!openedRootDirHandle || !note.fileName) return;

    try {
      const sourceDir = await getDirectoryHandleByPath(note.folderPath || "");
      if (!sourceDir) return;

      const dotIndex = note.fileName.lastIndexOf(".");
      const base = dotIndex > 0 ? note.fileName.slice(0, dotIndex) : note.fileName;
      const ext = dotIndex > 0 ? note.fileName.slice(dotIndex) : ".txt";
      const duplicateName = await resolveUniqueFileName(sourceDir, `${base}-copy${ext}`);

      const sourceHandle = await sourceDir.getFileHandle(note.fileName);
      await copyFileHandleToDirectory(sourceHandle, sourceDir, duplicateName);
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Duplicate file failed", error);
    }
  };

  const duplicateFilesInFolder = async (targetNotes: Note[]) => {
    if (!openedRootDirHandle || targetNotes.length === 0) return;

    try {
      for (const note of targetNotes) {
        if (!note.fileName) continue;
        const sourceDir = await getDirectoryHandleByPath(note.folderPath || "");
        if (!sourceDir) continue;

        const dotIndex = note.fileName.lastIndexOf(".");
        const base = dotIndex > 0 ? note.fileName.slice(0, dotIndex) : note.fileName;
        const ext = dotIndex > 0 ? note.fileName.slice(dotIndex) : ".txt";
        const duplicateName = await resolveUniqueFileName(sourceDir, `${base}-copy${ext}`);

        const sourceHandle = await sourceDir.getFileHandle(note.fileName);
        await copyFileHandleToDirectory(sourceHandle, sourceDir, duplicateName);
      }

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Duplicate files failed", error);
    }
  };

  const duplicateFolderInFolder = async (folderPath: string) => {
    if (!openedRootDirHandle || !folderPath) return;

    try {
      const segments = folderPath.split("/").filter(Boolean);
      const currentName = segments[segments.length - 1] || "folder";
      let parentDir = openedRootDirHandle;
      for (const segment of segments.slice(0, -1)) {
        parentDir = await parentDir.getDirectoryHandle(segment);
      }
      const sourceDir = await parentDir.getDirectoryHandle(currentName);
      await copyDirectoryRecursive(sourceDir, parentDir, `${currentName}-copy`);
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Duplicate folder failed", error);
    }
  };

  const copyFile = (note: Note) => {
    setClipboardItem({ kind: "file", noteId: note.id, folderPath: note.folderPath || "", fileName: note.fileName });
  };

  const copyFiles = (targetNotes: Note[]) => {
    const noteIds = targetNotes.map((n) => n.id);
    if (noteIds.length === 0) return;
    setClipboardItem({ kind: "file-batch", noteIds, folderPath: "" });
  };

  const copyFolder = (folderPath: string) => {
    setClipboardItem({ kind: "folder", folderPath });
  };

  const pasteIntoFolder = async (targetFolderPath?: string) => {
    if (!openedRootDirHandle || !clipboardItem) return;

    const normalizedTarget = targetFolderPath ?? "";
    try {
      const targetDir = await getDirectoryHandleByPath(normalizedTarget);
      if (!targetDir) return;

      if (clipboardItem.kind === "file" && clipboardItem.noteId) {
        const sourceNote = notes.find((n) => n.id === clipboardItem.noteId);
        if (!sourceNote?.fileName) return;

        const sourceDir = await getDirectoryHandleByPath(sourceNote.folderPath || "");
        if (!sourceDir) return;

        const sourceHandle = await sourceDir.getFileHandle(sourceNote.fileName);
        const targetName = await resolveUniqueFileName(targetDir, sourceNote.fileName);
        await copyFileHandleToDirectory(sourceHandle, targetDir, targetName);
      }

      if (clipboardItem.kind === "file-batch" && clipboardItem.noteIds?.length) {
        const sourceNotes = clipboardItem.noteIds
          .map((id) => notes.find((n) => n.id === id))
          .filter((n): n is Note => Boolean(n && n.fileName));

        for (const sourceNote of sourceNotes) {
          if (!sourceNote.fileName) continue;
          const sourceDir = await getDirectoryHandleByPath(sourceNote.folderPath || "");
          if (!sourceDir) continue;

          const sourceHandle = await sourceDir.getFileHandle(sourceNote.fileName);
          const targetName = await resolveUniqueFileName(targetDir, sourceNote.fileName);
          await copyFileHandleToDirectory(sourceHandle, targetDir, targetName);
        }
      }

      if (clipboardItem.kind === "folder") {
        if (normalizedTarget === clipboardItem.folderPath || normalizedTarget.startsWith(`${clipboardItem.folderPath}/`)) {
          return;
        }

        const segments = clipboardItem.folderPath.split("/").filter(Boolean);
        const sourceName = segments[segments.length - 1];
        if (!sourceName) return;

        const sourceDir = await getDirectoryHandleByPath(clipboardItem.folderPath);
        if (!sourceDir) return;
        await copyDirectoryRecursive(sourceDir, targetDir, sourceName);
      }

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Paste failed", error);
    }
  };

  const moveFileToFolder = async (note: Note, targetFolderPath: string) => {
    if (!openedRootDirHandle || !note.fileName) return;
    const sourcePath = note.folderPath || "";
    if (sourcePath === targetFolderPath) return;

    const oldRelPath = getRelativePath(sourcePath, note.fileName);
    trackDeletedRelativePath(oldRelPath);

    try {
      const sourceDir = await getDirectoryHandleByPath(sourcePath);
      const targetDir = await getDirectoryHandleByPath(targetFolderPath);
      if (!sourceDir || !targetDir) return;

      const sourceHandle = await sourceDir.getFileHandle(note.fileName);
      const targetName = await resolveUniqueFileName(targetDir, note.fileName);
      const newRelPath = getRelativePath(targetFolderPath, targetName);
      clearDeletedRelativePath(newRelPath);

      await copyFileHandleToDirectory(sourceHandle, targetDir, targetName);
      const targetHandle = await targetDir.getFileHandle(targetName);
      await setStoredFileHandle(note.id, targetHandle);
      updateNote(note.id, {
        folderPath: targetFolderPath,
        fileName: targetName,
      });

      await sourceDir.removeEntry(note.fileName);
      await syncFolderFromDisk(openedRootDirHandle, undefined, newRelPath);
    } catch (error) {
      console.error("Move file failed", error);
      clearDeletedRelativePath(oldRelPath);
    }
  };

  const moveFolderToFolder = async (sourceFolderPath: string, targetFolderPath: string) => {
    if (!openedRootDirHandle || !sourceFolderPath) return;
    if (sourceFolderPath === targetFolderPath || targetFolderPath.startsWith(`${sourceFolderPath}/`)) return;

    const notesInFolder = notes.filter(
      (n) => n.folderPath === sourceFolderPath || n.folderPath?.startsWith(`${sourceFolderPath}/`)
    );

    notesInFolder.forEach((n) => {
      if (n.fileName) {
        const oldRelPath = getRelativePath(n.folderPath || "", n.fileName);
        trackDeletedRelativePath(oldRelPath);
      }
    });

    try {
      const sourceSegments = sourceFolderPath.split("/").filter(Boolean);
      const sourceName = sourceSegments[sourceSegments.length - 1];
      if (!sourceName) return;

      let sourceParentDir = openedRootDirHandle;
      for (const segment of sourceSegments.slice(0, -1)) {
        sourceParentDir = await sourceParentDir.getDirectoryHandle(segment);
      }

      const sourceDir = await sourceParentDir.getDirectoryHandle(sourceName);
      const targetDir = await getDirectoryHandleByPath(targetFolderPath);
      if (!targetDir) return;

      await copyDirectoryRecursive(sourceDir, targetDir, sourceName);
      await sourceParentDir.removeEntry(sourceName, { recursive: true });
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Move folder failed", error);
    }
  };

  const deleteFileInFolder = async (note: { id: string; folderPath?: string; fileName?: string; title?: string }) => {
    const deletedFileName = note.fileName || note.title || t("editor.untitled");

    if (note.fileName) {
      const relPath = getRelativePath(note.folderPath || "", note.fileName);
      trackDeletedRelativePath(relPath);
    }

    handleDeleteNote(note.id);

    toast({
      title: t("editor.deleteToastTitle"),
      description: t("editor.deleteToastSuccess", { file: deletedFileName }),
    });
  };

  const deleteFilesInFolder = async (targetNotes: Note[]) => {
    if (targetNotes.length === 0) return;

    const count = targetNotes.length;
    targetNotes.forEach((n) => {
      if (n.fileName) {
        trackDeletedRelativePath(getRelativePath(n.folderPath || "", n.fileName));
      }
      handleDeleteNote(n.id);
    });

    toast({
      title: t("editor.deleteToastTitle"),
      description: t("editor.deleteToastSuccess", { file: `${count} items` }),
    });
  };

  const deleteFolderInFolder = async (folderPath: string) => {
    if (!folderPath) return;

    const folderName = folderPath.split("/").filter(Boolean).pop() || folderPath;
    const notesInFolder = notes.filter(
      (n) => n.folderPath === folderPath || n.folderPath?.startsWith(`${folderPath}/`)
    );

    const relPaths = new Set<string>();
    notesInFolder.forEach((n) => {
      if (n.fileName) {
        const relPath = getRelativePath(n.folderPath || "", n.fileName);
        relPaths.add(relPath);
        trackDeletedRelativePath(relPath);
      }
      handleDeleteNote(n.id);
    });

    if (openedRootDirHandle) {
      try {
        const segments = folderPath.split("/").filter(Boolean);
        if (segments.length > 0) {
          let parentDir = openedRootDirHandle;
          for (const segment of segments.slice(0, -1)) {
            parentDir = await parentDir.getDirectoryHandle(segment, { create: false });
          }

          await requestPermissionIfAvailable(parentDir, "readwrite");
          const targetName = segments[segments.length - 1];
          await parentDir.removeEntry(targetName, { recursive: true });
        }

        await syncFolderFromDisk(openedRootDirHandle, relPaths);
      } catch (error) {
        console.warn("Delete folder from disk warning:", error);
      }
    }

    toast({
      title: t("editor.deleteToastTitle"),
      description: t("editor.deleteToastSuccess", { file: folderName }),
    });
  };

  const createNoteInFolderWithDir = async (
    targetRootDirHandle: FileSystemDirectoryHandle,
    folderPath?: string,
    options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" }
  ) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const { fileName: desiredFileName, contentFormat } = normalizeNewFileOptions(options);

    try {
      let targetDir = targetRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        targetDir = await targetDir.getDirectoryHandle(segment, { create: true });
      }

      const fileName = await resolveUniqueFileName(targetDir, desiredFileName);
      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const isFileTxt = fileName.toLowerCase().endsWith(".txt") || contentFormat === "plain";
      const fileTitle = extractBaseTitleFromFileName(fileName);
      const relPath = getRelativePath(normalizedPath, fileName);
      clearDeletedRelativePath(relPath);

      const isFileHtml = fileName.toLowerCase().endsWith(".html") || contentFormat === "html";
      const fileResolvedFormat: "markdown" | "html" | "plain" = (contentFormat || (isFileHtml ? "html" : isFileTxt ? "plain" : "markdown")) as any;
      const templateContent = getNoteTemplateContent(settings.defaultNoteTemplate, settings.language, fileResolvedFormat);
      const fileContent = isFileTxt ? "" : templateContent;
      const writable = await fileHandle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName,
        title: fileTitle || extractBaseTitleFromFileName(fileName),
        content: fileContent,
        isLinkedFile: true,
        contentFormat,
      });
      openTab(note.id);
      await setStoredFileHandle(note.id, fileHandle);
    } catch (error) {
      console.error("Create file in target folder failed", error);
    }
  };

  const createFolderInFolderWithDir = async (
    targetRootDirHandle: FileSystemDirectoryHandle,
    folderPath?: string,
    folderName?: string
  ) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const safeName = (folderName ?? "").trim().replace(/[\\/:*?"<>|]/g, "_") || "untitled-folder";

    try {
      let parentDir = targetRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        parentDir = await parentDir.getDirectoryHandle(segment, { create: true });
      }

      const targetFolderName = await resolveUniqueFolderName(parentDir, safeName);
      await parentDir.getDirectoryHandle(targetFolderName, { create: true });

      const newFolderPath = normalizedPath ? `${normalizedPath}/${targetFolderName}` : targetFolderName;
      for (const p of Array.from(globalDeletedRelativePaths)) {
        if (p === newFolderPath || p.startsWith(`${newFolderPath}/`)) {
          clearDeletedRelativePath(p);
        }
      }

      await syncFolderFromDisk(targetRootDirHandle);
    } catch (error) {
      console.error("Create folder in target folder failed", error);
    }
  };

  const handleOpenFolder = async (pending?: { kind: "file" | "folder"; fileName?: string; contentFormat?: "plain" | "markdown" | "html"; folderName?: string }) => {
    const w = window as unknown as { showDirectoryPicker?: (options?: unknown) => Promise<FileSystemDirectoryHandle> };
    if (typeof w.showDirectoryPicker !== "function") return;

    try {
      const dirHandle = await w.showDirectoryPicker({ mode: "readwrite" });
      const folderName = dirHandle.name ?? null;
      setOpenedFolderName(folderName);
      setOpenedRootDirHandle(dirHandle);
      setPendingReconnectDirHandle(null);
      setRootFolderName(folderName || "My Luno Project");
      setRootDirHandle(dirHandle);
      await setStoredDirectoryHandle(dirHandle);
      await syncFolderFromDisk(dirHandle);

      if (pending) {
        if (pending.kind === "file") {
          await createNoteInFolderWithDir(dirHandle, undefined, { fileName: pending.fileName, contentFormat: pending.contentFormat });
        } else if (pending.kind === "folder") {
          await createFolderInFolderWithDir(dirHandle, undefined, pending.folderName);
        }
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Open folder failed", error);
      }
    }
  };

  const handleReconnectFolder = async () => {
    const targetDir = pendingReconnectDirHandle || openedRootDirHandle;
    if (!targetDir) {
      void handleOpenFolder();
      return;
    }
    try {
      const perm = await requestPermissionIfAvailable(targetDir, "readwrite");
      if (perm === "granted") {
        const folderName = targetDir.name ?? null;
        setOpenedFolderName(folderName);
        setOpenedRootDirHandle(targetDir);
        setPendingReconnectDirHandle(null);
        setRootFolderName(folderName || "My Luno Project");
        setRootDirHandle(targetDir);
        await setStoredDirectoryHandle(targetDir);
        await syncFolderFromDisk(targetDir);
        toast({
          title: t("sidebar.reconnectSuccess" as any) || "Folder Reconnected",
          description: targetDir.name,
        });
      } else {
        void handleOpenFolder();
      }
    } catch {
      void handleOpenFolder();
    }
  };

  useEffect(() => {
    let active = true;
    async function restoreFolderConnection() {
      try {
        const storedDir = await getStoredDirectoryHandle();
        if (!storedDir || !active) return;

        let permState: PermissionState | "granted" = "prompt";
        if (typeof storedDir.queryPermission === "function") {
          permState = await storedDir.queryPermission({ mode: "readwrite" });
        }

        const folderName = storedDir.name ?? null;
        if (permState === "granted") {
          setOpenedFolderName(folderName);
          setOpenedRootDirHandle(storedDir);
          setPendingReconnectDirHandle(null);
          setRootFolderName(folderName || "My Luno Project");
          setRootDirHandle(storedDir);
          await syncFolderFromDisk(storedDir);
        } else {
          setOpenedFolderName(folderName);
          setRootFolderName(folderName || "My Luno Project");
          setPendingReconnectDirHandle(storedDir);
        }
      } catch (err) {
        console.warn("Could not restore directory handle:", err);
      }
    }
    void restoreFolderConnection();
    return () => {
      active = false;
    };
  }, [syncFolderFromDisk, setRootFolderName, setRootDirHandle]);

  useEffect(() => {
    if (!openedRootDirHandle) return;

    const intervalId = window.setInterval(() => {
      void syncFolderFromDisk(openedRootDirHandle);
    }, 2500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncFolderFromDisk(openedRootDirHandle);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [openedRootDirHandle, syncFolderFromDisk]);

  const { updateSetting } = useAppSettings();

  // Load .luno/settings.json when workspace opens
  useEffect(() => {
    if (!openedRootDirHandle) return;
    let active = true;
    const loadMeta = async () => {
      const workspaceSettings = await loadWorkspaceSettings(openedRootDirHandle);
      if (active && workspaceSettings) {
        Object.entries(workspaceSettings).forEach(([k, v]) => {
          updateSetting(k as keyof AppSettings, v as AppSettings[keyof AppSettings]);
        });
      } else if (active && settings) {
        await saveWorkspaceSettings(openedRootDirHandle, settings);
      }
    };
    void loadMeta();
    return () => {
      active = false;
    };
  }, [openedRootDirHandle]);

  // Save settings to .luno/settings.json whenever settings change
  useEffect(() => {
    if (openedRootDirHandle && settings) {
      void saveWorkspaceSettings(openedRootDirHandle, settings);
    }
  }, [openedRootDirHandle, settings]);

  // Keep open tabs in sync when notes are deleted (non-folder-sync deletions)
  useEffect(() => {
    const existingSet = new Set(notes.map((n) => n.id));
    existingSet.add("settings");
    existingSet.add("luno-ai");
    removeTabsForDeletedNotes(existingSet);
  }, [notes, removeTabsForDeletedNotes]);

  const openTabNotes = useMemo(() => {
    return openTabIds
      .map((id) => {
        if (id === "settings") return SETTINGS_NOTE;
        if (id === "luno-ai") return LUNO_AI_NOTE;
        return notes.find((n) => n.id === id);
      })
      .filter((n): n is Note => Boolean(n));
  }, [openTabIds, notes, SETTINGS_NOTE, LUNO_AI_NOTE]);

  const handleDeleteNote = (id: string): boolean => {
    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return false;

    if (targetNote.driveFileId && settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
      trashDriveNote(targetNote.driveFileId);
    }

    if (targetNote.fileName) {
      const relPath = getRelativePath(targetNote.folderPath || "", targetNote.fileName);
      trackDeletedRelativePath(relPath);
    }
    closeTab(id, notes.map((n) => n.id));
    const result = deleteNote(id);

    if (openedRootDirHandle && targetNote.fileName) {
      const relPath = getRelativePath(targetNote.folderPath || "", targetNote.fileName);
      void (async () => {
        try {
          let targetDir = openedRootDirHandle;
          const segments = (targetNote.folderPath ?? "").split("/").filter(Boolean);
          for (const segment of segments) {
            targetDir = await targetDir.getDirectoryHandle(segment, { create: false });
          }
          await requestPermissionIfAvailable(targetDir, "readwrite");
          const fname = targetNote.fileName as string;
          try {
            await targetDir.removeEntry(fname);
          } catch {
            /* ignore main file remove error */
          }

          try {
            for await (const [childName, childHandle] of (targetDir as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
              if (childHandle.kind === "file" && (childName.endsWith(".crswap") || childName.includes(".crswap"))) {
                if (childName.startsWith(fname) || childName.toLowerCase().includes(fname.toLowerCase())) {
                  try {
                    await targetDir.removeEntry(childName);
                  } catch {
                    /* ignore */
                  }
                }
              }
            }
          } catch {
            /* ignore */
          }
        } catch (e) {
          console.warn("Disk file removal warning:", e);
        } finally {
          await syncFolderFromDisk(openedRootDirHandle, new Set([relPath]));
        }
      })();
    }

    return result;
  };

  const handleCreateNote = (
    folderPath?: string,
    options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" },
  ): Note | void => {
    if (openedRootDirHandle) {
      void createNoteInFolder(folderPath, options);
      return;
    }
    const note = createNote(folderPath);
    if (options) {
      updateNote(note.id, {
        fileName: options.fileName,
        contentFormat: options.contentFormat,
      });
    }
    openTab(note.id);
    return note;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[1px] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar responsive */}
      <div className={isMobile ? (sidebarOpen ? "block" : "hidden") : "block"}>
        <Sidebar
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          notes={notes}
          folderPaths={openedFolderPaths}
          activeNoteId={activeTabId}
          openedFolderName={openedFolderName}
          pendingReconnectFolder={Boolean(pendingReconnectDirHandle)}
          onReconnectFolder={handleReconnectFolder}
          onSelect={openTab}
          onCreate={(fp, opt) => { void createNoteInFolder(fp, opt); }}
          onCreateFolder={createFolderInFolder}
          onDeleteFile={deleteFileInFolder}
          onDeleteFolder={deleteFolderInFolder}
          onCopyFile={copyFile}
          onCopyFiles={copyFiles}
          onCopyFolder={copyFolder}
          onPasteToFolder={pasteIntoFolder}
          onDuplicateFile={duplicateFileInFolder}
          onDuplicateFiles={duplicateFilesInFolder}
          onDuplicateFolder={duplicateFolderInFolder}
          onRenameFile={renameFileInFolder}
          onRenameFolder={renameFolderInFolder}
          onMoveFile={moveFileToFolder}
          onMoveFolder={moveFolderToFolder}
          onDeleteFiles={deleteFilesInFolder}
          canPaste={Boolean(clipboardItem)}
          onOpenFolder={handleOpenFolder}
          sidebarWidth={settings.sidebarWidth}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
          confirmBeforeDelete={settings.confirmBeforeDelete}
          onRenameTagGlobally={renameTagGlobally}
          onDeleteTagGlobally={deleteTagGlobally}
          onOpenSettings={() => handleOpenSettings("general")}
        />
      </div>

      {/* Editor area responsive */}
      <div className="flex-1 flex flex-col min-w-0">
        <TabBar
          tabs={openTabNotes}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={(id) => closeTab(id, notes.map((n) => n.id))}
          onSplitTab={(id) => {
            // ถ้า split อยู่แล้วและกดซ้ำ ให้ toggle ปิด split
            setSplitTabId(prev => prev === id ? null : id);
          }}
          onNewTab={() => void createNoteInFolder()}
          onReorderTabs={reorderTabs}
        />
        {activeTabId !== "settings" && activeTabId !== "luno-ai" && (
          <Breadcrumb
            note={activeTabNote}
            rootFolderName={openedFolderName}
            notes={notes}
            onSelectNote={setActiveTabId}
            onOpenRightPanel={() => setRightPanelOpen((prev) => !prev)}
          />
        )}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {activeTabId === "settings" ? (
            <SettingsTabView
              initialCategory={settingsCategory}
              onClose={() => closeTab("settings", notes.map((n) => n.id))}
              notes={notes}
              onNotesUpdated={replaceNotes}
            />
          ) : activeTabId === "luno-ai" ? (
            <div className="w-full flex-1 flex flex-col min-h-0 min-w-0">
              <LunoAiView
                notes={notes}
                activeNote={notes.find((n) => n.id === openTabIds.find((id) => id !== "luno-ai" && id !== "settings")) ?? notes[0] ?? null}
                onInsertToActiveNote={(text) => {
                  const targetNote = notes.find((n) => n.id === openTabIds.find((id) => id !== "luno-ai" && id !== "settings")) ?? notes[0];
                  if (targetNote) {
                    const existingContent = targetNote.content || "";
                    const updatedContent = existingContent.trim() ? `${existingContent}\n\n${text}` : text;
                    updateNote(targetNote.id, { content: updatedContent });
                    toast({
                      title: t("lunoAi.insertSuccessTitle") || "Content Inserted",
                      description: t("lunoAi.insertToNoteSuccess", { name: targetNote.fileName || targetNote.title || "Note" }) || `Inserted content!`,
                    });
                  }
                }}
                onInsertToSelectedNote={(targetNoteId, text) => {
                  const targetNote = notes.find((n) => n.id === targetNoteId);
                  if (targetNote) {
                    const existingContent = targetNote.content || "";
                    const updatedContent = existingContent.trim() ? `${existingContent}\n\n${text}` : text;
                    updateNote(targetNote.id, { content: updatedContent });
                    toast({
                      title: t("lunoAi.insertSuccessTitle") || "Content Inserted",
                      description: t("lunoAi.insertToNoteSuccess", { name: targetNote.fileName || targetNote.title || "Note" }) || `Inserted content into '${targetNote.fileName}'!`,
                    });
                  }
                }}
                onCreateNewNote={(fileName, content, folderPath) => {
                  let targetName = fileName?.trim();
                  if (!targetName) {
                    targetName = `Luno_Note_${Date.now().toString().slice(-4)}.md`;
                  }
                  if (!/\.[a-zA-Z0-9]+$/.test(targetName)) {
                    targetName += ".md";
                  }

                  void createNoteInFolder(folderPath || "", {
                    fileName: targetName,
                    initialContent: content,
                  });
                  toast({
                    title: t("lunoAi.createSuccessTitle") || "Note Created",
                    description: t("lunoAi.fileCreatedSuccess", { name: targetName }) || `Created '${targetName}' successfully!`,
                  });
                }}
                onOpenSettings={(cat) => handleOpenSettings((cat as SettingsCategory) || "ai")}
              />
            </div>
          ) : splitTabId && splitTabId !== activeTabId ? (
            <div className="flex flex-1 min-h-0 flex-row w-full">
              <div
                className="min-w-0 border-r border-border overflow-auto"
                style={{ width: splitLeftWidth ? splitLeftWidth : "50%", minWidth: 120 }}
              >
                <Editor
                  note={activeTabNote}
                  notes={notes}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  onCreate={handleCreateNote}
                  onCreateFolder={createFolderInFolder}
                  onOpenFolder={handleOpenFolder}
                  onRenameFile={renameFileInFolder}
                  openedFolderName={openedFolderName}
                  onOpenSidebar={() => setSidebarOpen(true)}
                  isSidebarOpen={sidebarOpen}
                  editorFontSize={settings.editorFontSize}
                  isMobile={isMobile}
                  rootDirHandle={openedRootDirHandle}
                  settingsOpen={settingsOpen}
                  onSettingsOpenChange={(open) => {
                    if (open) openTab("settings");
                    else closeTab("settings", notes.map((n) => n.id));
                  }}
                  rightPanelOpen={rightPanelOpen}
                  onCloseRightPanel={() => setRightPanelOpen(false)}
                />
              </div>
              <SplitResizer
                onResize={delta => {
                  setSplitLeftWidth(prev => {
                    // ถ้า prev ยังไม่เคย set ให้ใช้ 50% ของ container
                    const container = document.querySelector(".flex.flex-1.min-h-0.flex-row.w-full");
                    const total = container instanceof HTMLElement ? container.offsetWidth : 0;
                    const base = prev ?? (total ? total / 2 : 400);
                    let next = base + delta;
                    // จำกัดขนาดขั้นต่ำ/สูงสุด
                    if (next < 120) next = 120;
                    if (total && next > total - 120) next = total - 120;
                    return next;
                  });
                }}
              />
              <div className="min-w-0 overflow-auto flex-1">
                <Editor
                  note={notes.find(n => n.id === splitTabId) ?? null}
                  notes={notes}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  onCreate={handleCreateNote}
                  onCreateFolder={createFolderInFolder}
                  onOpenFolder={handleOpenFolder}
                  onRenameFile={renameFileInFolder}
                  openedFolderName={openedFolderName}
                  onOpenSidebar={() => setSidebarOpen(true)}
                  isSidebarOpen={sidebarOpen}
                  editorFontSize={settings.editorFontSize}
                  isMobile={isMobile}
                  rootDirHandle={openedRootDirHandle}
                  onCloseSplit={() => setSplitTabId(null)}
                  settingsOpen={settingsOpen}
                  onSettingsOpenChange={(open) => {
                    if (open) openTab("settings");
                    else closeTab("settings", notes.map((n) => n.id));
                  }}
                />
              </div>
            </div>
          ) : (
            <Editor
              note={activeTabNote}
              notes={notes}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onCreate={handleCreateNote}
              onCreateFolder={createFolderInFolder}
              onOpenFolder={handleOpenFolder}
              onRenameFile={renameFileInFolder}
              openedFolderName={openedFolderName}
              onOpenSidebar={() => setSidebarOpen(true)}
              isSidebarOpen={sidebarOpen}
              editorFontSize={settings.editorFontSize}
              isMobile={isMobile}
              rootDirHandle={openedRootDirHandle}
              settingsOpen={settingsOpen}
              onSettingsOpenChange={(open) => {
                if (open) openTab("settings");
                else closeTab("settings", notes.map((n) => n.id));
              }}
              rightPanelOpen={rightPanelOpen}
              onCloseRightPanel={() => setRightPanelOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
