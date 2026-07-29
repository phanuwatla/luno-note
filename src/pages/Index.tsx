import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import SplitResizer from "@/components/SplitResizer";
import TabBar from "@/components/TabBar";
import Breadcrumb from "@/components/Breadcrumb";
import type { Note } from "@/hooks/useNotes";
import { useNotes } from "@/hooks/useNotes";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTabs } from "@/hooks/useTabs";
import { clearAllStoredFileHandles, getStoredFileHandle, setStoredFileHandle } from "@/lib/fileHandles";
import { marked } from "marked";

export default function Index() {
  // ความกว้างฝั่งซ้าย (px) ถ้า split, ค่า default 50%
  const [splitLeftWidth, setSplitLeftWidth] = useState<number | null>(null);
  const { notes, createNote, replaceNotes, updateNote, deleteNote } = useNotes();
  const { openTabIds, activeTabId, openTab, closeTab, removeTabsForDeletedNotes, setActiveTabId } = useTabs();
  const activeTabNote = notes.find((n) => n.id === activeTabId) ?? null;
  const { settings } = useAppSettings();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openedFolderName, setOpenedFolderName] = useState<string | null>(null);
  const [openedRootDirHandle, setOpenedRootDirHandle] = useState<any | null>(null);
  const [openedFolderPaths, setOpenedFolderPaths] = useState<string[]>([]);
  const [clipboardItem, setClipboardItem] = useState<{ kind: "file" | "file-batch" | "folder"; noteId?: string; noteIds?: string[]; folderPath: string; fileName?: string } | null>(null);
  // เพิ่ม state สำหรับ split tab (id ของ note ที่แยก)
  const [splitTabId, setSplitTabId] = useState<string | null>(null);

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

  const normalizeNewFileOptions = (options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" }) => {
    const raw = (options?.fileName ?? "").trim();
    const safe = raw.replace(/[\\/:*?"<>|]/g, "_");

    if (!safe) {
      return { fileName: "untitled.txt", contentFormat: "plain" as const };
    }

    const dotIndex = safe.lastIndexOf(".");
    const base = dotIndex > 0 ? safe.slice(0, dotIndex) : safe;
    const extFromName = dotIndex > 0 ? safe.slice(dotIndex + 1).toLowerCase() : "";
    const desiredFormat = options?.contentFormat ?? "plain";

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

    return { fileName: `${base}.txt`, contentFormat: "plain" as const };
  };

  const resolveUniqueFileName = async (targetDir: any, desiredFileName: string) => {
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

  const resolveUniqueFolderName = async (targetDir: any, desiredFolderName: string) => {
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

  const copyFileHandleToDirectory = async (sourceFileHandle: any, targetDir: any, targetName: string) => {
    const file = await sourceFileHandle.getFile();
    const writableTarget = await targetDir.getFileHandle(targetName, { create: true });
    const writable = await writableTarget.createWritable();
    await writable.write(file);
    await writable.close();
    return writableTarget;
  };

  const copyDirectoryRecursive = async (sourceDirHandle: any, targetParentDir: any, desiredFolderName: string) => {
    const finalFolderName = await resolveUniqueFolderName(targetParentDir, desiredFolderName);
    const newDir = await targetParentDir.getDirectoryHandle(finalFolderName, { create: true });

    for await (const [entryName, entryHandle] of sourceDirHandle.entries()) {
      if (entryHandle.kind === "directory") {
        await copyDirectoryRecursive(entryHandle, newDir, entryName as string);
      } else if (entryHandle.kind === "file") {
        await copyFileHandleToDirectory(entryHandle, newDir, entryName as string);
      }
    }

    return finalFolderName;
  };

  const getRelativePath = (folderPath: string, fileName: string) => (folderPath ? `${folderPath}/${fileName}` : fileName);

  const scanFolderEntries = useCallback(async (dirHandle: any) => {
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
      handle: any;
      folderPath: string;
      relativePath: string;
    }> = [];
    const folderPaths = new Set<string>();

    async function readDir(handle: any, path: string) {
      for await (const [name, childHandle] of handle.entries()) {
        if (childHandle.kind === "directory") {
          const subPath = path ? `${path}/${name}` : name;
          folderPaths.add(subPath);
          await readDir(childHandle, subPath);
        } else if (childHandle.kind === "file") {
          const lname = (name as string).toLowerCase();
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
            fileName: name as string,
            contentFormat,
            fileType,
            handle: childHandle,
            folderPath: path,
            relativePath: getRelativePath(path, name as string),
          });
        }
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

  const syncFolderFromDisk = useCallback(async (dirHandle: any) => {
    const { entries, folderPaths } = await scanFolderEntries(dirHandle);
    setOpenedFolderPaths(folderPaths);
    const existingByPath = new Map(
      notes
        .filter((n) => n.fileName)
        .map((n) => [getRelativePath(n.folderPath || "", n.fileName as string), n] as const),
    );

    const activeNoteRef = activeTabId ? notes.find((n) => n.id === activeTabId) : null;
    const activeRelativePath = activeNoteRef?.fileName
      ? getRelativePath(activeNoteRef.folderPath || "", activeNoteRef.fileName)
      : null;

    const nextItems: Array<{ id?: string; content: string; fileName: string; contentFormat: "plain" | "markdown" | "html"; isLinkedFile: true; folderPath: string; fileType?: "image" | "binary" }> = [];

    for (const entry of entries) {
      const existing = existingByPath.get(entry.relativePath);

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
        const content = entry.contentFormat === "markdown" ? (marked.parse(text, { async: false, gfm: true, breaks: true }) as string) : text;
        nextItems.push({
          content,
          fileName: entry.fileName,
          contentFormat: entry.contentFormat,
          isLinkedFile: true,
          folderPath: entry.folderPath,
        });
      } catch {
        // skip unreadable files
      }
    }

    const handleByRelativePath = new Map(entries.map((entry) => [entry.relativePath, entry.handle] as const));

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
      return;
    }

    if (activeRelativePath) {
      const nextActive = nextNotes.find((n) => n.fileName && getRelativePath(n.folderPath || "", n.fileName) === activeRelativePath);
      if (nextActive) {
        openTab(nextActive.id);
        removeTabsForDeletedNotes(new Set(nextNotes.map((n) => n.id)));
        return;
      }
    }

    removeTabsForDeletedNotes(new Set(nextNotes.map((n) => n.id)));
  }, [activeTabId, notes, replaceNotes, scanFolderEntries, openTab, setActiveTabId, removeTabsForDeletedNotes]);

  const createNoteInFolder = async (folderPath?: string, options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" }) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const { fileName: desiredFileName, contentFormat } = normalizeNewFileOptions(options);

    // If no folder is opened, fallback to normal in-app note creation.
    if (!openedRootDirHandle) {
      const note = createNote(normalizedPath || undefined);
      updateNote(note.id, {
        fileName: desiredFileName,
        isLinkedFile: false,
        contentFormat,
      });
      openTab(note.id);
      return;
    }

    try {
      let targetDir = openedRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        targetDir = await targetDir.getDirectoryHandle(segment);
      }

      const fileName = await resolveUniqueFileName(targetDir, desiredFileName);

      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write("");
      await writable.close();

      const note = createNote(normalizedPath || undefined);
      updateNote(note.id, {
        fileName,
        isLinkedFile: true,
        contentFormat,
      });
      openTab(note.id);
      await setStoredFileHandle(note.id, fileHandle);
    } catch (error) {
      console.error("Create file in folder failed", error);
      const note = createNote(normalizedPath || undefined);
      updateNote(note.id, {
        fileName: desiredFileName,
        isLinkedFile: false,
        contentFormat,
      });
      openTab(note.id);
    }
  };

  const createFolderInFolder = async (folderPath?: string, folderName?: string) => {
    const normalizedPath = folderPath ?? activeTabNote?.folderPath ?? "";
    const safeName = (folderName ?? "").trim().replace(/[\\/:*?"<>|]/g, "_") || "untitled-folder";

    if (!openedRootDirHandle) return;

    try {
      let targetDir = openedRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        targetDir = await targetDir.getDirectoryHandle(segment);
      }

      let index = 0;
      let finalName = safeName;
      while (true) {
        const candidate = index === 0 ? safeName : `${safeName}-${index}`;
        try {
          await targetDir.getDirectoryHandle(candidate, { create: false });
          index += 1;
        } catch (error) {
          if ((error as DOMException)?.name !== "NotFoundError") throw error;
          finalName = candidate;
          break;
        }
      }

      await targetDir.getDirectoryHandle(finalName, { create: true });
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Create folder failed", error);
    }
  };

  const renameFileInFolder = async (note: Note, nextName: string) => {
    if (!openedRootDirHandle || !note.fileName) return;

    const proposed = nextName.trim();
    if (!proposed || proposed === note.fileName) return;

    try {
      const sourceDir = await getDirectoryHandleByPath(note.folderPath || "");
      if (!sourceDir) return;

      const safeName = proposed.replace(/[\\/:*?"<>|]/g, "_") || note.fileName;
      const finalName = await resolveUniqueFileName(sourceDir, safeName);

      const sourceHandle = await sourceDir.getFileHandle(note.fileName);
      const newHandle = await copyFileHandleToDirectory(sourceHandle, sourceDir, finalName);
      await sourceDir.removeEntry(note.fileName);

      await syncFolderFromDisk(openedRootDirHandle);

      const nextNote = notes.find((n) => n.id === note.id);
      if (nextNote) {
        await setStoredFileHandle(note.id, newHandle);
      }
    } catch (error) {
      console.error("Rename file failed", error);
    }
  };

  const renameFolderInFolder = async (folderPath: string, nextName: string) => {
    if (!openedRootDirHandle || !folderPath) return;

    const segments = folderPath.split("/").filter(Boolean);
    const currentName = segments[segments.length - 1] || "folder";
    const proposed = nextName.trim();
    if (!proposed || proposed === currentName) return;

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
      const active = notes.find((n) => n.id === activeTabId);
      if (active && (active.folderPath || "").startsWith(folderPath)) {
        const suffix = (active.folderPath || "").slice(folderPath.length);
        const newPath = `${renamedPath}${suffix}`.replace(/^\/+/, "");
        const noteWithNewPath = notes.find((n) => n.fileName === active.fileName && n.folderPath === newPath);
        if (noteWithNewPath) openTab(noteWithNewPath.id);
      }

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

    try {
      const sourceDir = await getDirectoryHandleByPath(sourcePath);
      const targetDir = await getDirectoryHandleByPath(targetFolderPath);
      if (!sourceDir || !targetDir) return;

      const sourceHandle = await sourceDir.getFileHandle(note.fileName);
      const targetName = await resolveUniqueFileName(targetDir, note.fileName);
      await copyFileHandleToDirectory(sourceHandle, targetDir, targetName);
      await sourceDir.removeEntry(note.fileName);
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Move file failed", error);
    }
  };

  const moveFolderToFolder = async (sourceFolderPath: string, targetFolderPath: string) => {
    if (!openedRootDirHandle || !sourceFolderPath) return;
    if (sourceFolderPath === targetFolderPath || targetFolderPath.startsWith(`${sourceFolderPath}/`)) return;

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

  const deleteFileInFolder = async (note: { id: string; folderPath?: string; fileName?: string }) => {
    if (!openedRootDirHandle || !note.fileName) {
      deleteNote(note.id);
      return;
    }

    try {
      let targetDir = openedRootDirHandle;
      const segments = (note.folderPath ?? "").split("/").filter(Boolean);
      for (const segment of segments) {
        targetDir = await targetDir.getDirectoryHandle(segment);
      }

      await targetDir.removeEntry(note.fileName);
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Delete file failed", error);
    }
  };

  const deleteFilesInFolder = async (targetNotes: Note[]) => {
    if (targetNotes.length === 0) return;

    if (!openedRootDirHandle) {
      targetNotes.forEach((n) => deleteNote(n.id));
      return;
    }

    try {
      for (const note of targetNotes) {
        if (!note.fileName) continue;
        const targetDir = await getDirectoryHandleByPath(note.folderPath || "");
        if (!targetDir) continue;
        try {
          await targetDir.removeEntry(note.fileName);
        } catch {
          // Continue deleting the rest of selected files.
        }
      }

      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Delete files failed", error);
    }
  };

  const deleteFolderInFolder = async (folderPath: string) => {
    if (!openedRootDirHandle || !folderPath) return;

    try {
      const segments = folderPath.split("/").filter(Boolean);
      if (segments.length === 0) return;

      let parentDir = openedRootDirHandle;
      for (const segment of segments.slice(0, -1)) {
        parentDir = await parentDir.getDirectoryHandle(segment);
      }

      const targetName = segments[segments.length - 1];
      await parentDir.removeEntry(targetName, { recursive: true });
      await syncFolderFromDisk(openedRootDirHandle);
    } catch (error) {
      console.error("Delete folder failed", error);
    }
  };

  const handleOpenFolder = async () => {
    const w = window as any;
    if (typeof w.showDirectoryPicker !== "function") return;

    try {
      const dirHandle = await w.showDirectoryPicker({ mode: "readwrite" });
      setOpenedFolderName(dirHandle.name ?? null);
      setOpenedRootDirHandle(dirHandle);
      await syncFolderFromDisk(dirHandle);
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Open folder failed", error);
      }
    }
  };

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

  // Keep open tabs in sync when notes are deleted (non-folder-sync deletions)
  useEffect(() => {
    removeTabsForDeletedNotes(new Set(notes.map((n) => n.id)));
  }, [notes, removeTabsForDeletedNotes]);

  const openTabNotes = openTabIds.map((id) => notes.find((n) => n.id === id)).filter((n): n is Note => Boolean(n));

  const handleDeleteNote = (id: string): boolean => {
    closeTab(id, notes.map((n) => n.id));
    return deleteNote(id);
  };

  const handleCreateNote = (folderPath?: string): Note => {
    const note = createNote(folderPath);
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
      <div className={sidebarOpen ? (isMobile ? "block md:hidden" : "hidden md:block") : "hidden"}>
        <Sidebar
          notes={notes}
          folderPaths={openedFolderPaths}
          activeNoteId={activeTabId}
          openedFolderName={openedFolderName}
          onSelect={openTab}
          onCreate={createNoteInFolder}
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
        />
        <Breadcrumb note={activeTabNote} rootFolderName={openedFolderName} />
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* ถ้า splitTabId มีค่า ให้ render editor 2 pane ซ้าย-ขวา */}
          {splitTabId && splitTabId !== activeTabId ? (
            <div className="flex flex-1 min-h-0 flex-row w-full">
              <div
                className="min-w-0 border-r border-border overflow-auto"
                style={{ width: splitLeftWidth ? splitLeftWidth : "50%", minWidth: 120 }}
              >
                <Editor
                  note={activeTabNote}
                  onUpdate={updateNote}
                  onDelete={handleDeleteNote}
                  onCreate={handleCreateNote}
                  onOpenSidebar={() => setSidebarOpen(true)}
                  isSidebarOpen={sidebarOpen}
                  editorFontSize={settings.editorFontSize}
                  isMobile={isMobile}
                  rootDirHandle={openedRootDirHandle}
                />
              </div>
              <SplitResizer
                onResize={delta => {
                  setSplitLeftWidth(prev => {
                    // ถ้า prev ยังไม่เคย set ให้ใช้ 50% ของ container
                    const container = document.querySelector(".flex.flex-1.min-h-0.flex-row.w-full");
                    const total = container instanceof HTMLElement ? container.offsetWidth : 0;
                    let base = prev ?? (total ? total / 2 : 400);
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
                  onUpdate={updateNote}
                  onDelete={handleDeleteNote}
                  onCreate={handleCreateNote}
                  onOpenSidebar={() => setSidebarOpen(true)}
                  isSidebarOpen={sidebarOpen}
                  editorFontSize={settings.editorFontSize}
                  isMobile={isMobile}
                  rootDirHandle={openedRootDirHandle}
                  onCloseSplit={() => setSplitTabId(null)}
                />
              </div>
            </div>
          ) : (
            <Editor
              note={activeTabNote}
              onUpdate={updateNote}
              onDelete={handleDeleteNote}
              onCreate={handleCreateNote}
              onOpenSidebar={() => setSidebarOpen(true)}
              isSidebarOpen={sidebarOpen}
              editorFontSize={settings.editorFontSize}
              isMobile={isMobile}
              rootDirHandle={openedRootDirHandle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
