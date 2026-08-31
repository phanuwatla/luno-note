import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import lunoLogo from "@/assets/luno-logo.png";
import WindowControls from "@/components/WindowControls";
import Sidebar from "@/components/Sidebar";
import Editor, { clearNoteEditorHistory } from "@/components/Editor";
import SplitResizer from "@/components/SplitResizer";
import TabBar from "@/components/TabBar";
import Breadcrumb from "@/components/Breadcrumb";
import SettingsTabView, { type SettingsCategory } from "@/components/SettingsTabView";
import LunoAiView from "@/components/LunoAiView";
import WebViewerView from "@/components/WebViewerView";
import HomeView from "@/components/HomeView";
import TrashView from "@/components/TrashView";
import TemplatesView from "@/components/TemplatesView";
import FavoritesTabView from "@/components/FavoritesTabView";
import TagsTabView from "@/components/TagsTabView";
import { WorkspaceLauncher } from "@/components/WorkspaceLauncher";
import type { Note } from "@/hooks/useNotes";
import { useNotes, extractBaseTitleFromFileName, isSystemGeneratedUntitledName } from "@/hooks/useNotes";
import { useAppSettings, saveWorkspaceSettings, loadWorkspaceSettings, type AppSettings } from "@/hooks/useAppSettings";
import { useTrash, type TrashedNote } from "@/hooks/useTrash";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTabs } from "@/hooks/useTabs";
import type { CreateNoteOptions } from "@/lib/fileHandles";
import { clearAllStoredFileHandles, getStoredFileHandle, setStoredFileHandle, getStoredDirectoryHandle, setStoredDirectoryHandle, removeStoredDirectoryHandle, requestPermissionIfAvailable, unmarkNoteAsDeleted, trackDeletedRelativePath, clearDeletedRelativePath, isRelativePathDeleted, globalDeletedRelativePaths } from "@/lib/fileHandles";
import { updateFrontmatterIcon, updateFrontmatterTags, updateFrontmatterFavorite, isMarkdownNote, isMarkdownFileName, isTiptapJson, parseFrontmatterAndTags } from "@/lib/frontmatter";
import { saveWorkspaceFavorites, loadWorkspaceFavorites } from "@/lib/workspaceFavorites";
import { marked } from "marked";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoogleDriveSync } from "@/hooks/useGoogleDriveSync";
import { isGoogleDriveConnected, requestGoogleDriveAuth, getStoredTokenInfo } from "@/lib/googleDriveAuth";
import { createCloudWorkspace } from "@/lib/googleDriveApi";
import { PinLockModal, type PinLockModalMode } from "@/components/PinLockModal";
import { encryptNoteContent, decryptNoteContent, isEncryptedNote } from "@/lib/noteCrypto";
import { getNoteTemplateContent, getNoteTemplateMetadata, getTemplateIcon, getDefaultTemplateForExtension, type NoteTemplateType } from "@/lib/templates";
import { formatDateForFileName } from "@/lib/dateTimeFormatter";
import { clearNoteEditorState } from "@/components/Editor";
import { getAutoFolderIconAndColor } from "@/lib/iconPacks";

export default function Index() {
  const { t } = useTranslation();
  const { settings, updateSetting, updateSettings, setFolderIcon, removeFolderIcon, setFileIcon, removeFileIcon } = useAppSettings();
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  // ความกว้างฝั่งซ้าย (px) ถ้า split, ค่า default 50%
  const [splitLeftWidth, setSplitLeftWidth] = useState<number | null>(null);
  const { notes, createNote, replaceNotes, updateNote, deleteNote, renameTagGlobally, deleteTagGlobally } = useNotes();
  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  const { openTabIds, activeTabId, openTab, closeTab, removeTabsForDeletedNotes, reorderTabs, resetTabs, restoreTabsFromSession, setActiveTabId } = useTabs(notesRef);
  const newlyCreatedNoteIdRef = useRef<string | null>(null);
  const workspaceFavoritesRef = useRef<Set<string>>(new Set());
  const HOME_NOTE: Note = useMemo(
    () => ({
      id: "home",
      title: t("sidebar.home") || "Home",
      content: "",
      createdAt: 0,
      updatedAt: 0,
      fileName: t("sidebar.home") || "Home",
      fileType: "home" as any,
    }),
    [t]
  );

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

  const TRASH_NOTE: Note = useMemo(
    () => ({
      id: "trash",
      title: t("trash.title") || "Trash",
      content: "",
      createdAt: 0,
      updatedAt: 0,
      fileName: t("trash.title") || "Trash",
      fileType: "trash" as any,
    }),
    [t]
  );

  const TEMPLATES_NOTE: Note = useMemo(
    () => ({
      id: "templates",
      title: t("sidebar.templates") || (settings.language === "th" ? "เทมเพลต" : "Templates"),
      content: "",
      createdAt: 0,
      updatedAt: 0,
      fileName: t("sidebar.templates") || (settings.language === "th" ? "เทมเพลต" : "Templates"),
      fileType: "templates" as any,
    }),
    [t, settings.language]
  );

  const FAVORITES_NOTE: Note = useMemo(
    () => ({
      id: "favorites",
      title: t("sidebar.favorites") || (settings.language === "th" ? "ที่ติดดาว" : "Favorites"),
      content: "",
      createdAt: 0,
      updatedAt: 0,
      fileName: t("sidebar.favorites") || (settings.language === "th" ? "ที่ติดดาว" : "Favorites"),
      fileType: "favorites" as any,
    }),
    [t, settings.language]
  );

  const TAGS_NOTE: Note = useMemo(
    () => ({
      id: "tags",
      title: t("sidebar.tags") || (settings.language === "th" ? "แท็ก" : "Tags"),
      content: "",
      createdAt: 0,
      updatedAt: 0,
      fileName: t("sidebar.tags") || (settings.language === "th" ? "แท็ก" : "Tags"),
      fileType: "tags" as any,
    }),
    [t, settings.language]
  );

  const {
    trashedNotes,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
    emptyTrash,
    autoCleanExpired,
  } = useTrash();

  useEffect(() => {
    if (settings.autoEmptyTrash !== false && settings.trashRetentionDays !== undefined) {
      autoCleanExpired(settings.trashRetentionDays);
    }
  }, [autoCleanExpired, settings.autoEmptyTrash, settings.trashRetentionDays]);

  const [webTabs, setWebTabs] = useState<Record<string, { id: string; url: string; title: string }>>(() => {
    try {
      const raw = localStorage.getItem("luno-web-tabs-state");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem("luno-web-tabs-state", JSON.stringify(webTabs));
    } catch {}
  }, [webTabs]);

  const getWebTabNote = useCallback(
    (id: string): Note => {
      const info = webTabs[id];
      const url = info?.url || (id.startsWith("web:http") ? id.replace(/^web:/, "") : "https://www.google.com");
      let displayTitle = info?.title;
      let faviconUrl = info?.faviconUrl;
      try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        if (!displayTitle) {
          displayTitle = u.hostname.replace(/^www\./, "");
        }
        if (!faviconUrl && u.hostname) {
          faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=32`;
        }
      } catch {
        if (!displayTitle) displayTitle = url;
      }
      return {
        id,
        title: displayTitle || t("webViewer.title") || "Web Viewer",
        content: url,
        createdAt: 0,
        updatedAt: 0,
        fileName: displayTitle || t("webViewer.title") || "Web Viewer",
        fileType: "web-viewer",
        url,
        faviconUrl,
      };
    },
    [webTabs, t]
  );

  const activeTabNote =
    activeTabId === "home"
      ? HOME_NOTE
      : activeTabId === "trash"
      ? TRASH_NOTE
      : activeTabId === "settings"
      ? SETTINGS_NOTE
      : activeTabId === "luno-ai"
      ? LUNO_AI_NOTE
      : activeTabId === "templates"
      ? TEMPLATES_NOTE
      : activeTabId === "favorites"
      ? FAVORITES_NOTE
      : activeTabId === "tags"
      ? TAGS_NOTE
      : activeTabId?.startsWith("web:")
      ? getWebTabNote(activeTabId)
      : (notes.find((n) => n.id === activeTabId) ?? null);

  const activeEditorNote =
    activeTabId === "home" || activeTabId === "trash" || activeTabId === "settings" || activeTabId === "luno-ai" || activeTabId === "templates" || activeTabId === "favorites" || activeTabId === "tags" || activeTabId?.startsWith("web:")
      ? (notes.find((n) => n.id === openTabIds.find((id) => id !== "home" && id !== "trash" && id !== "settings" && id !== "luno-ai" && id !== "templates" && id !== "favorites" && id !== "tags" && !id.startsWith("web:"))) ?? notes[0] ?? null)
      : (notes.find((n) => n.id === activeTabId) ?? null);

  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openedFolderName, setOpenedFolderName] = useState<string | null>(null);
  const [openedRootDirHandle, setOpenedRootDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [pendingReconnectDirHandle, setPendingReconnectDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [openedFolderPaths, setOpenedFolderPaths] = useState<string[]>([]);
  const [clipboardItem, setClipboardItem] = useState<{ kind: "file" | "file-batch" | "folder"; noteId?: string; noteIds?: string[]; folderPath: string; fileName?: string } | null>(null);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const splitTabNote =
    splitTabId === "home"
      ? HOME_NOTE
      : splitTabId === "trash"
      ? TRASH_NOTE
      : splitTabId === "settings"
      ? SETTINGS_NOTE
      : splitTabId === "luno-ai"
      ? LUNO_AI_NOTE
      : splitTabId === "templates"
      ? TEMPLATES_NOTE
      : splitTabId === "favorites"
      ? FAVORITES_NOTE
      : splitTabId === "tags"
      ? TAGS_NOTE
      : splitTabId?.startsWith("web:")
      ? getWebTabNote(splitTabId)
      : (notes.find((n) => n.id === splitTabId) ?? null);

  const splitEditorNote =
    splitTabId === "home" || splitTabId === "trash" || splitTabId === "settings" || splitTabId === "luno-ai" || splitTabId === "templates" || splitTabId === "favorites" || splitTabId === "tags" || splitTabId?.startsWith("web:")
      ? (notes.find((n) => n.id === openTabIds.find((id) => id !== "home" && id !== "trash" && id !== "settings" && id !== "luno-ai" && id !== "templates" && id !== "favorites" && id !== "tags" && !id.startsWith("web:") && id !== activeTabId)) ?? notes[0] ?? null)
      : (notes.find((n) => n.id === splitTabId) ?? null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>(() => {
    try {
      const saved = localStorage.getItem("luno_last_settings_category") as SettingsCategory;
      if (saved) return saved;
    } catch {}
    return "general";
  });
  // Tracks the current Electron workspace path (for Electron desktop mode only)
  const electronWorkspacePathRef = useRef<string | null>(null);

  const { queueSync, trashDriveNote, importDriveNotes, setRootFolderName, setRootDirHandle, setElectronWorkspacePath, triggerSync, renameDriveNote, status: syncStatus } = useGoogleDriveSync();

  useEffect(() => {
    const folderName = openedFolderName || "Luno Notes";
    setRootFolderName(folderName);
    setRootDirHandle(openedRootDirHandle);
    setElectronWorkspacePath(electronWorkspacePathRef.current);
  }, [openedFolderName, openedRootDirHandle, setRootFolderName, setRootDirHandle, setElectronWorkspacePath]);

  const handleOpenSettings = useCallback((category?: SettingsCategory) => {
    if (category) {
      setSettingsCategory(category);
      try {
        localStorage.setItem("luno_last_settings_category", category);
      } catch {}
    }
    openTab("settings");
  }, [openTab]);

  const handleOpenWebTab = useCallback(
    (rawUrl: string, initialTitle?: string) => {
      const trimmed = (rawUrl || "").trim();
      if (!trimmed) return;
      const fullUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const tabId = `web:${uniqueSuffix}`;

      let fallbackTitle = initialTitle;
      if (!fallbackTitle) {
        try {
          const u = new URL(fullUrl);
          fallbackTitle = u.hostname.replace(/^www\./, "");
        } catch {
          fallbackTitle = fullUrl;
        }
      }

      setWebTabs((prev) => ({
        ...prev,
        [tabId]: {
          id: tabId,
          url: fullUrl,
          title: fallbackTitle || t("webViewer.title") || "Web Viewer",
        },
      }));

      openTab(tabId);
    },
    [openTab, t]
  );

  const handleWebTabUrlChange = useCallback((tabId: string, newUrl: string) => {
    setWebTabs((prev) => {
      if (!prev[tabId]) {
        return {
          ...prev,
          [tabId]: { id: tabId, url: newUrl, title: newUrl },
        };
      }
      return {
        ...prev,
        [tabId]: { ...prev[tabId], url: newUrl },
      };
    });
  }, []);

  const handleWebTabTitleChange = useCallback((tabId: string, newTitle: string) => {
    if (!newTitle) return;
    setWebTabs((prev) => {
      const existing = prev[tabId];
      return {
        ...prev,
        [tabId]: {
          id: tabId,
          url: existing?.url || (tabId.startsWith("web:http") ? tabId.replace(/^web:/, "") : "https://www.google.com"),
          title: newTitle,
          faviconUrl: existing?.faviconUrl,
        },
      };
    });
  }, []);

  const handleWebTabFaviconChange = useCallback((tabId: string, faviconUrl: string) => {
    if (!faviconUrl) return;
    setWebTabs((prev) => {
      const existing = prev[tabId];
      if (existing?.faviconUrl === faviconUrl) return prev;
      return {
        ...prev,
        [tabId]: {
          id: tabId,
          url: existing?.url || (tabId.startsWith("web:http") ? tabId.replace(/^web:/, "") : "https://www.google.com"),
          title: existing?.title || "Web Viewer",
          faviconUrl,
        },
      };
    });
  }, []);

  const handleInsertLinkToActiveNote = useCallback(
    (url: string, title?: string) => {
      const targetNote =
        notes.find((n) => n.id === openTabIds.find((id) => id !== "luno-ai" && id !== "settings" && !id.startsWith("web:"))) ??
        notes[0];
      if (targetNote) {
        const linkMd = title ? `[${title}](${url})` : url;
        const existing = targetNote.content || "";
        const updated = existing.trim() ? `${existing}\n\n${linkMd}` : linkMd;
        updateNote(targetNote.id, { content: updated });
        toast({
          title: t("webViewer.insertToNote") || "Link Inserted",
          description: t("webViewer.linkInserted") || "Inserted link into note",
        });
      }
    },
    [notes, openTabIds, updateNote, t]
  );

  const handleUpdateNote = useCallback(
    async (id: string, patch: Partial<Note>) => {
      updateNote(id, patch);
      const currentNote = notesRef.current.find((n) => n.id === id);
      if (!currentNote) return;

      // If icon, iconColor, tags, or isFavorite changed, persist to disk
      if ("icon" in patch || "iconColor" in patch || "tags" in patch || "isFavorite" in patch) {
        if ("isFavorite" in patch && patch.isFavorite !== undefined) {
          // Only non-markdown files (images, html, txt, binary, etc.) are stored in .luno/favorites.json
          if (!isMarkdownNote(currentNote) && currentNote.fileName) {
            const relPath = currentNote.folderPath ? `${currentNote.folderPath}/${currentNote.fileName}` : currentNote.fileName;
            if (patch.isFavorite) {
              workspaceFavoritesRef.current.add(relPath);
            } else {
              workspaceFavoritesRef.current.delete(relPath);
            }
            const allFavs = Array.from(workspaceFavoritesRef.current);
            void saveWorkspaceFavorites(openedRootDirHandle, allFavs);
          }
        }

        // For non-markdown files, save custom icon in settings.fileIcons
        if (!isMarkdownNote(currentNote) && currentNote.fileName && ("icon" in patch || "iconColor" in patch)) {
          const relPath = currentNote.folderPath ? `${currentNote.folderPath}/${currentNote.fileName}` : currentNote.fileName;
          const nextIcon = "icon" in patch ? patch.icon : currentNote.icon;
          const nextColor = "iconColor" in patch ? patch.iconColor : currentNote.iconColor;
          if (nextIcon) {
            setFileIcon(relPath, nextIcon, nextColor);
          } else {
            removeFileIcon(relPath);
          }
        }

        // Only update file content and frontmatter if it is a Markdown note!
        // DO NOT overwrite image or binary files!
        if (isMarkdownNote(currentNote) && currentNote.fileType !== "image" && currentNote.fileType !== "binary" && currentNote.fileName) {
          const nextIcon = "icon" in patch ? patch.icon : currentNote.icon;
          const nextIconColor = "iconColor" in patch ? patch.iconColor : currentNote.iconColor;
          const nextTags = "tags" in patch ? patch.tags : currentNote.tags;
          const nextFavorite = "isFavorite" in patch ? patch.isFavorite : currentNote.isFavorite;

          const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
          if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent && electronAPI?.readFileContent) {
            try {
              const saved = await electronAPI.getSavedWorkspace();
              if (saved?.folderPath) {
                const fullPath = currentNote.folderPath
                  ? `${saved.folderPath}/${currentNote.folderPath}/${currentNote.fileName}`
                  : `${saved.folderPath}/${currentNote.fileName}`;

                let diskContent = "";
                try {
                  const readText = await electronAPI.readFileContent(fullPath);
                  if (typeof readText === "string") diskContent = readText;
                } catch {}

                if (!diskContent) {
                  diskContent = currentNote.content || "";
                }

                let newContent = diskContent;
                if ("icon" in patch || "iconColor" in patch || nextIcon !== undefined || nextIconColor !== undefined) {
                  newContent = updateFrontmatterIcon(newContent, nextIcon, nextIconColor);
                }
                if ("tags" in patch || (nextTags && nextTags.length > 0)) {
                  newContent = updateFrontmatterTags(newContent, nextTags || []);
                }
                if ("isFavorite" in patch || nextFavorite !== undefined) {
                  newContent = updateFrontmatterFavorite(newContent, nextFavorite);
                }

                await electronAPI.writeFileContent({ fullPath, content: newContent });
              }
            } catch (err) {
              console.warn("Failed to persist updated note icon to disk:", err);
            }
          } else {
            try {
              const handle = await getStoredFileHandle(id);
              if (handle) {
                let diskContent = "";
                try {
                  const file = await handle.getFile();
                  diskContent = await file.text();
                } catch {}

                if (!diskContent) {
                  diskContent = currentNote.content || "";
                }

                let newContent = diskContent;
                if ("icon" in patch || "iconColor" in patch || nextIcon !== undefined || nextIconColor !== undefined) {
                  newContent = updateFrontmatterIcon(newContent, nextIcon, nextIconColor);
                }
                if ("tags" in patch || (nextTags && nextTags.length > 0)) {
                  newContent = updateFrontmatterTags(newContent, nextTags || []);
                }
                if ("isFavorite" in patch || nextFavorite !== undefined) {
                  newContent = updateFrontmatterFavorite(newContent, nextFavorite);
                }

                if (handle.createWritable) {
                  const writable = await handle.createWritable();
                  await writable.write(newContent);
                  await writable.close();
                }
              }
            } catch (err) {
              console.warn("Failed saving note icon to file handle:", err);
            }
          }
        }
      }

      if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
        const mergedNote: Note = { ...currentNote, ...patch };
        queueSync(mergedNote, (syncedNote) => {
          updateNote(syncedNote.id, {
            driveFileId: syncedNote.driveFileId,
            driveSyncedAt: syncedNote.driveSyncedAt,
          });
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

  // 6-Digit PIN Note Locking State & Handlers
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<PinLockModalMode>("set");
  const [pinModalTargetNote, setPinModalTargetNote] = useState<Note | null>(null);
  const unlockedSessionPinsRef = useRef<Map<string, string>>(new Map());

  const handleOpenPinModal = useCallback((note: Note, mode: PinLockModalMode) => {
    setPinModalTargetNote(note);
    setPinModalMode(mode);
    setPinModalOpen(true);
  }, []);

  const handleConfirmSetPin = useCallback(async (noteId: string, pin: string) => {
    const target = notesRef.current.find((n) => n.id === noteId);
    if (!target) return;

    // Encrypt current content
    const encrypted = await encryptNoteContent(target.content || "", pin);
    unlockedSessionPinsRef.current.delete(noteId);

    // Update in state - set isLocked true and isDecrypted false so it locks immediately!
    updateNote(noteId, {
      content: encrypted,
      isLocked: true,
      isDecrypted: false,
    });

    clearNoteEditorHistory(noteId);
    clearNoteEditorState(noteId);

    // Persist encrypted content to disk immediately
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent && target.fileName) {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = target.folderPath
          ? `${saved.folderPath}/${target.folderPath}/${target.fileName}`
          : `${saved.folderPath}/${target.fileName}`;
        await electronAPI.writeFileContent({ fullPath, content: encrypted });
      }
    } else {
      const handle = await getStoredFileHandle(noteId);
      if (handle?.createWritable) {
        try {
          const writable = await handle.createWritable();
          await writable.write(encrypted);
          await writable.close();
        } catch (err) {
          console.error("Failed saving encrypted note to handle:", err);
        }
      }
    }

    toast({
      title: t("pinLock.lockSuccess") || "Note locked successfully",
      description: target.fileName || target.title || "",
    });
  }, [t, updateNote]);

  const handleConfirmRemovePin = useCallback(async (noteId: string, pin: string) => {
    const target = notesRef.current.find((n) => n.id === noteId);
    if (!target) return;

    let decryptedText = target.content;
    if (isEncryptedNote(target.content)) {
      decryptedText = await decryptNoteContent(target.content, pin);
    }

    unlockedSessionPinsRef.current.delete(noteId);

    // Update in state
    updateNote(noteId, {
      content: decryptedText,
      isLocked: false,
      isDecrypted: true,
    });

    // Persist decrypted content to disk
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent && target.fileName) {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = target.folderPath
          ? `${saved.folderPath}/${target.folderPath}/${target.fileName}`
          : `${saved.folderPath}/${target.fileName}`;
        await electronAPI.writeFileContent({ fullPath, content: decryptedText });
      }
    } else {
      const handle = await getStoredFileHandle(noteId);
      if (handle?.createWritable) {
        try {
          const writable = await handle.createWritable();
          await writable.write(decryptedText);
          await writable.close();
        } catch (err) {
          console.error("Failed saving decrypted note to handle:", err);
        }
      }
    }

    toast({
      title: t("pinLock.removeLockSuccess") || "PIN lock removed",
      description: target.fileName || target.title || "",
    });
  }, [t, updateNote]);

  const handleConfirmChangePin = useCallback(async (noteId: string, currentPin: string, newPin: string) => {
    const target = notesRef.current.find((n) => n.id === noteId);
    if (!target) return;

    let plainText = target.content;
    if (isEncryptedNote(target.content)) {
      plainText = await decryptNoteContent(target.content, currentPin);
    } else {
      const oldEncrypted = await encryptNoteContent(plainText, currentPin);
      await decryptNoteContent(oldEncrypted, currentPin);
    }

    const newEncrypted = await encryptNoteContent(plainText, newPin);
    unlockedSessionPinsRef.current.delete(noteId);

    updateNote(noteId, {
      content: newEncrypted,
      isLocked: true,
      isDecrypted: false,
    });

    clearNoteEditorHistory(noteId);
    clearNoteEditorState(noteId);

    // Write to disk
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent && target.fileName) {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = target.folderPath
          ? `${saved.folderPath}/${target.folderPath}/${target.fileName}`
          : `${saved.folderPath}/${target.fileName}`;
        await electronAPI.writeFileContent({ fullPath, content: newEncrypted });
      }
    } else {
      const handle = await getStoredFileHandle(noteId);
      if (handle?.createWritable) {
        try {
          const writable = await handle.createWritable();
          await writable.write(newEncrypted);
          await writable.close();
        } catch (err) {
          console.error("Failed saving new encrypted note to handle:", err);
        }
      }
    }

    toast({
      title: t("pinLock.changePinSuccess") || "PIN updated successfully",
      description: target.fileName || target.title || "",
    });
  }, [t, updateNote]);

  const handleUnlockNote = useCallback(async (noteId: string, pin: string): Promise<boolean> => {
    const target = notesRef.current.find((n) => n.id === noteId);
    if (!target) return false;

    try {
      let plainText = target.content;
      if (isEncryptedNote(target.content)) {
        plainText = await decryptNoteContent(target.content, pin);
      }
      unlockedSessionPinsRef.current.set(noteId, pin);
      updateNote(noteId, {
        content: plainText,
        isLocked: true,
        isDecrypted: true,
      });
      return true;
    } catch {
      return false;
    }
  }, [updateNote]);

  const handleRelockNote = useCallback(async (noteId: string) => {
    const target = notesRef.current.find((n) => n.id === noteId);
    const pin = unlockedSessionPinsRef.current.get(noteId);
    unlockedSessionPinsRef.current.delete(noteId);

    if (target) {
      let encrypted = target.content;
      if (pin && !isEncryptedNote(target.content)) {
        try {
          encrypted = await encryptNoteContent(target.content, pin);
        } catch {}
      }
      updateNote(noteId, {
        content: encrypted,
        isLocked: true,
        isDecrypted: false,
      });
    }

    clearNoteEditorHistory(noteId);
    clearNoteEditorState(noteId);

    toast({
      title: t("pinLock.noteRelocked") || "Note locked",
      description: target?.fileName || target?.title || "",
    });
  }, [t, updateNote]);

  const handleGetActivePin = useCallback((noteId: string) => {
    return unlockedSessionPinsRef.current.get(noteId);
  }, []);

  const normalizeNewFileOptions = (options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" }) => {
    const raw = (options?.fileName ?? "").trim();
    const safe = raw.replace(/[\\/:*?"<>|]/g, "_");

    const defaultExt = settings.defaultExtension || "md";
    const defaultFormat = defaultExt === "html" ? ("html" as const) : defaultExt === "txt" ? ("plain" as const) : ("markdown" as const);

    if (!safe) {
      const dateStr = formatDateForFileName(new Date(), settings.dateFormat);
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
    const rawBase = dotIndex > 0 ? desiredFileName.slice(0, dotIndex) : desiredFileName;
    const ext = dotIndex > 0 ? desiredFileName.slice(dotIndex) : ".txt";
    const rootBase = rawBase.replace(/-copy(-\d+)?$/, "");

    try {
      await targetDir.getFileHandle(desiredFileName, { create: false });
    } catch {
      return desiredFileName;
    }

    const firstCopy = `${rootBase}-copy${ext}`;
    try {
      await targetDir.getFileHandle(firstCopy, { create: false });
    } catch {
      return firstCopy;
    }

    let index = 2;
    while (true) {
      const candidate = `${rootBase}-copy-${index}${ext}`;
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
    const rootBase = desiredFolderName.replace(/-copy(-\d+)?$/, "");
    try {
      await targetDir.getDirectoryHandle(desiredFolderName, { create: false });
    } catch {
      return desiredFolderName;
    }

    const firstCopy = `${rootBase}-copy`;
    try {
      await targetDir.getDirectoryHandle(firstCopy, { create: false });
    } catch {
      return firstCopy;
    }

    let index = 2;
    while (true) {
      const candidate = `${rootBase}-copy-${index}`;
      try {
        await targetDir.getDirectoryHandle(candidate, { create: false });
        index += 1;
      } catch (error) {
        if ((error as DOMException)?.name !== "NotFoundError") throw error;
        return candidate;
      }
    }
  };

  const getUniqueFileNameInNotes = (targetFolderPath: string, desiredFileName: string, currentNotes: Note[]): string => {
    const existingNames = new Set(
      currentNotes
        .filter((n) => (n.folderPath || "") === targetFolderPath && n.fileName)
        .map((n) => n.fileName!.toLowerCase())
    );

    if (!existingNames.has(desiredFileName.toLowerCase())) {
      return desiredFileName;
    }

    const dotIndex = desiredFileName.lastIndexOf(".");
    const base = dotIndex > 0 ? desiredFileName.slice(0, dotIndex) : desiredFileName;
    const ext = dotIndex > 0 ? desiredFileName.slice(dotIndex) : "";

    let index = 1;
    while (true) {
      const candidate = `${base}-${index}${ext}`;
      if (!existingNames.has(candidate.toLowerCase())) {
        return candidate;
      }
      index += 1;
    }
  };

  const getUniqueFolderNameInPaths = (targetFolderPath: string, desiredFolderName: string, folderPaths: string[]): string => {
    const existingPaths = new Set(folderPaths.map((p) => p.toLowerCase()));
    let candidate = desiredFolderName;
    let index = 1;

    while (true) {
      const fullRelPath = targetFolderPath ? `${targetFolderPath}/${candidate}` : candidate;
      if (!existingPaths.has(fullRelPath.toLowerCase())) {
        return candidate;
      }
      candidate = `${desiredFolderName}-${index}`;
      index += 1;
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

  const mapTreeEntryToItem = (e: any, existing?: Note, overrideId?: string, overrideDriveFileId?: string) => {
    const isEncrypted = isEncryptedNote(e.content);
    const isLocked = isEncrypted || existing?.isLocked || false;
    const isCurrentlyDecrypted = Boolean(
      existing &&
      (unlockedSessionPinsRef.current.has(existing.id) || (existing.isDecrypted && !isEncryptedNote(existing.content)))
    );
    const isDecrypted = isCurrentlyDecrypted;
    const relPath = getRelativePath(e.folderPath || "", e.fileName || "");
    const isFavorite = existing?.isFavorite !== undefined
      ? existing.isFavorite
      : (workspaceFavoritesRef.current.has(relPath) ? true : undefined);

    const isMd = isMarkdownFileName(e.fileName, e.contentFormat, e.fileType);
    let parsedTags: string[] = [];
    if (isMd && typeof e.content === "string" && e.content && !isEncrypted && !isTiptapJson(e.content)) {
      try {
        parsedTags = parseFrontmatterAndTags(e.content).allTags || [];
      } catch {}
    }
    const mergedTags = isMd
      ? (existing?.tags !== undefined && existing.tags.length > 0
          ? Array.from(new Set([...existing.tags, ...parsedTags]))
          : (parsedTags.length > 0 ? parsedTags : (existing?.tags || [])))
      : [];

    return {
      id: overrideId ?? existing?.id,
      content: e.content,
      fileName: e.fileName,
      contentFormat: e.contentFormat,
      isLinkedFile: true as const,
      folderPath: e.folderPath,
      fileType: e.fileType,
      isLocked,
      isDecrypted,
      isFavorite,
      tags: mergedTags,
      createdAt: e.createdAt || existing?.createdAt || Date.now(),
      updatedAt: e.updatedAt || existing?.updatedAt || Date.now(),
      driveFileId: overrideDriveFileId ?? existing?.driveFileId,
      driveSyncedAt: existing?.driveSyncedAt,
    };
  };

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

  const syncFolderFromDisk = useCallback(
    async (dirHandle: FileSystemDirectoryHandle, selectRelativePath?: string, isNewWorkspace?: boolean) => {
      const { entries: scannedEntries, folderPaths: scannedFolderPaths } = await scanFolderEntries(dirHandle);
      setOpenedFolderPaths(Array.from(scannedFolderPaths));

      const filteredEntries = scannedEntries;
      const currentNotes = notesRef.current;
      const activeRelativePath = activeTabNote?.fileName ? getRelativePath(activeTabNote.folderPath || "", activeTabNote.fileName) : "";

      const nextItems: Array<{
        id?: string;
        content: string;
        fileName?: string;
        isLinkedFile?: boolean;
        contentFormat?: "plain" | "markdown" | "html";
        folderPath?: string;
        fileType?: "image" | "binary";
        createdAt?: number;
        updatedAt?: number;
      }> = [];

      for (const entry of filteredEntries) {
        let existing = currentNotes.find(
          (n) => n.fileName && getRelativePath(n.folderPath || "", n.fileName) === entry.relativePath
        );

        let fileModified = 0;
        try {
          const file = await entry.handle.getFile();
          fileModified = file.lastModified || 0;
        } catch {
          // ignore
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
            createdAt: existing.createdAt || fileModified || Date.now(),
            updatedAt: fileModified || existing.updatedAt || Date.now(),
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
            createdAt: fileModified || Date.now(),
            updatedAt: fileModified || Date.now(),
          });
          continue;
        }

        try {
          const file = await entry.handle.getFile();
          const text = await file.text();
          const mtime = file.lastModified || Date.now();
          nextItems.push({
            content: text,
            fileName: entry.fileName,
            contentFormat: entry.contentFormat,
            isLinkedFile: true,
            folderPath: entry.folderPath,
            createdAt: mtime,
            updatedAt: mtime,
          });
        } catch {
          // skip unreadable files
        }
      }

      const handleByRelativePath = new Map(filteredEntries.map((entry) => [entry.relativePath, entry.handle] as const));

      await clearAllStoredFileHandles();
      const nextNotes = replaceNotes(nextItems, isNewWorkspace);
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

      if (isNewWorkspace) {
        resetTabs();
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

      if (openTabIds.length === 0) {
        restoreTabsFromSession(nextNotes, settings.reopenTabs, settings.onStartup);
      } else {
        removeTabsForDeletedNotes(new Set(nextNotes.map((n) => n.id)));
      }
      return nextNotes;
    },
    [activeTabId, replaceNotes, scanFolderEntries, openTab, setActiveTabId, removeTabsForDeletedNotes, openTabIds.length, restoreTabsFromSession, settings.reopenTabs, settings.onStartup, resetTabs]
  );

  const createNoteInFolder = async (
    folderPath?: string,
    options?: CreateNoteOptions,
  ): Promise<Note> => {
    let rawPath = (folderPath !== undefined && folderPath !== null && folderPath !== "")
      ? folderPath
      : (activeTabNote?.folderPath ?? "");
    if (rawPath === "__opened_root__") rawPath = "";
    // If target folder no longer exists (e.g. was deleted), default to root directory
    const normalizedPath = (rawPath && openedFolderPaths.includes(rawPath)) ? rawPath : "";
    const { fileName: rawDesiredFileName, contentFormat } = normalizeNewFileOptions(options);
    const desiredFileName = getUniqueFileNameInNotes(normalizedPath, rawDesiredFileName, notesRef.current);
    const isTxt = desiredFileName.toLowerCase().endsWith(".txt") || contentFormat === "plain";
    const rawTitle = extractBaseTitleFromFileName(desiredFileName);
    const initialTitle = isTxt ? "" : (rawTitle || "Untitled");
    const effectiveTemplate = options?.templateType || getDefaultTemplateForExtension(settings, desiredFileName);
    const templateContent = getNoteTemplateContent(
      effectiveTemplate,
      settings.language,
      contentFormat,
      settings.dateFormat,
      settings.timeFormat,
      settings.iconPack
    );
    const initialContent = options?.initialContent ?? (templateContent ? templateContent : (isTxt ? "" : `<h1>${initialTitle}</h1>`));

    // 1. Electron Desktop Native File Creation
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent && electronAPI?.readWorkspaceTree) {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        const fullPath = normalizedPath
          ? `${saved.folderPath}/${normalizedPath}/${desiredFileName}`
          : `${saved.folderPath}/${desiredFileName}`;

        await electronAPI.writeFileContent({ fullPath, content: initialContent });

        const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
        setOpenedFolderPaths(folderPaths);

        const currentNotes = notesRef.current;
        const existingByPath = new Map(
          currentNotes
            .filter((n) => n.fileName)
            .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
        );

        const createdRelPath = getRelativePath(normalizedPath, desiredFileName);
        const newNoteId = crypto.randomUUID();

        const nextItems = entries.map((e: any) => {
          const relPath = e.relativePath;
          const existing = existingByPath.get(relPath);
          const isNewFile = relPath === createdRelPath;
          return mapTreeEntryToItem(e, existing, isNewFile ? newNoteId : undefined);
        });

        const nextNotes = replaceNotes(nextItems);
        const createdNote = nextNotes.find(
          (n) => n.fileName && getRelativePath(n.folderPath || "", n.fileName) === createdRelPath
        );

        const targetId = createdNote?.id ?? newNoteId;
        if (targetId && (options?.icon || options?.iconColor)) {
          updateNote(targetId, {
            icon: options?.icon,
            iconColor: options?.iconColor,
          });
        }
        newlyCreatedNoteIdRef.current = targetId;
        openTab(targetId);
        setActiveTabId(targetId);
        setTimeout(() => {
          openTab(targetId);
          setActiveTabId(targetId);
          if (newlyCreatedNoteIdRef.current === targetId) {
            newlyCreatedNoteIdRef.current = null;
          }
        }, 150);
        return createdNote ?? ({ id: targetId, fileName: desiredFileName, folderPath: normalizedPath } as any);
      }
    }

    // 2. Fallback if no folder handle opened
    if (!openedRootDirHandle) {
      const note = createNote(normalizedPath || undefined);
      unmarkNoteAsDeleted(note.id);
      updateNote(note.id, {
        fileName: desiredFileName,
        title: initialTitle,
        content: initialContent,
        isLinkedFile: false,
        contentFormat,
        icon: options?.icon,
        iconColor: options?.iconColor,
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
      const fileTitle = isFileTxt ? "" : (rawFileTitle || "Untitled");
      const effectiveTemplate = options?.templateType || getDefaultTemplateForExtension(settings, fileName);
      const fileTemplateContent = getNoteTemplateContent(
        effectiveTemplate,
        settings.language,
        contentFormat,
        settings.dateFormat,
        settings.timeFormat,
        settings.iconPack
      );
      const fileContent = options?.initialContent ?? (fileTemplateContent ? fileTemplateContent : (isFileTxt ? "" : `<h1>${fileTitle}</h1>`));
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
        icon: options?.icon,
        iconColor: options?.iconColor,
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
        icon: options?.icon,
        iconColor: options?.iconColor,
      });
      openTab(note.id);
      return note;
    }
  };



  const createFolderInFolder = async (folderPath?: string, folderName?: string) => {
    let rawPath = folderPath ?? activeTabNote?.folderPath ?? "";
    if (rawPath === "__opened_root__") rawPath = "";
    const normalizedPath = (rawPath && openedFolderPaths.includes(rawPath)) ? rawPath : "";
    const rawFolderName = (folderName ?? "").trim().replace(/[\\/:*?"<>|]/g, "_") || "Untitled";
    const safeName = folderName
      ? rawFolderName
      : getUniqueFolderNameInPaths(normalizedPath, rawFolderName, openedFolderPaths);

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.createWorkspaceFolder && electronAPI?.readWorkspaceTree) {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath) {
        await electronAPI.createWorkspaceFolder({
          workspacePath: saved.folderPath,
          folderPath: normalizedPath,
          folderName: safeName,
        });

        const newFolderPath = normalizedPath ? `${normalizedPath}/${safeName}` : safeName;
        const autoIcon = (settings.autoFolderIcons !== false)
          ? getAutoFolderIconAndColor(safeName, settings.iconPack || "lucide")
          : null;
        if (autoIcon) {
          setFolderIcon(newFolderPath, autoIcon.icon, autoIcon.color);
        }

        const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
        setOpenedFolderPaths(folderPaths);

        const currentNotes = notesRef.current;
        const existingByPath = new Map(
          currentNotes
            .filter((n) => n.fileName)
            .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
        );

        const nextItems = entries.map((e: any) => {
          const relPath = e.relativePath;
          const existing = existingByPath.get(relPath);
          return mapTreeEntryToItem(e, existing);
        });

        replaceNotes(nextItems);
        return;
      }
    }

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
      const autoIcon = (settings.autoFolderIcons !== false)
        ? getAutoFolderIconAndColor(targetFolderName, settings.iconPack || "lucide")
        : null;
      if (autoIcon) {
        setFolderIcon(newFolderPath, autoIcon.icon, autoIcon.color);
      }

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
    if (!note.fileName) return;
    if (activeRenameLocksRef.current.has(note.id)) return;

    const proposed = nextName.trim();
    if (!proposed || proposed === note.fileName) return;

    activeRenameLocksRef.current.add(note.id);
    const oldRelPath = getRelativePath(note.folderPath || "", note.fileName);
    trackDeletedRelativePath(oldRelPath);

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.renameFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const safeName = proposed.replace(/[\\/:*?"<>|]/g, "_") || note.fileName;
          const oldFullPath = note.folderPath
            ? `${saved.folderPath}/${note.folderPath}/${note.fileName}`
            : `${saved.folderPath}/${note.fileName}`;
          const newFullPath = note.folderPath
            ? `${saved.folderPath}/${note.folderPath}/${safeName}`
            : `${saved.folderPath}/${safeName}`;

          const ok = await electronAPI.renameFileOrFolder({ oldFullPath, newFullPath });
          if (ok) {
            const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
            setOpenedFolderPaths(folderPaths);

            const currentNotes = notesRef.current;
            const existingByPath = new Map(
              currentNotes
                .filter((n) => n.fileName)
                .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
            );

            const isGdrive = settings.storageMode === "gdrive" && isGoogleDriveConnected();
            if (isGdrive && note.driveFileId) {
              void renameDriveNote(note, safeName);
            }

            if (settings.fileIcons?.[oldRelPath]) {
              const existingIcon = settings.fileIcons[oldRelPath];
              const newRelPath = getRelativePath(note.folderPath || "", safeName);
              setFileIcon(newRelPath, existingIcon.icon, existingIcon.color);
              removeFileIcon(oldRelPath);
            }

            clearNoteEditorState(note.id);
            updateNote(note.id, { fileName: safeName, title: extractBaseTitleFromFileName(safeName) });

            const nextItems = entries.map((e: any) => {
              const relPath = e.relativePath;
              const existing = existingByPath.get(relPath);
              const isRenamed = relPath === (note.folderPath ? `${note.folderPath}/${safeName}` : safeName);
              return mapTreeEntryToItem(e, existing, isRenamed ? note.id : undefined, isRenamed ? note.driveFileId : undefined);
            });

            replaceNotes(nextItems);
            return;
          }
        }
      } catch (error) {
        console.error("Electron rename file failed", error);
      } finally {
        activeRenameLocksRef.current.delete(note.id);
      }
    }

    if (!openedRootDirHandle) return;

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
      clearNoteEditorState(note.id);
      notesRef.current = notesRef.current.map((n) =>
        n.id === note.id ? { ...n, fileName: finalName, title: extractBaseTitleFromFileName(finalName) } : n
      );
      updateNote(note.id, { fileName: finalName, title: extractBaseTitleFromFileName(finalName) });

      if (settings.storageMode === "gdrive" && isGoogleDriveConnected() && note.driveFileId) {
        void renameDriveNote(note, finalName);
      }

      await syncFolderFromDisk(openedRootDirHandle, undefined, newRelPath);
    } catch (error) {
      console.error("Rename file failed", error);
      clearDeletedRelativePath(oldRelPath);
    } finally {
      activeRenameLocksRef.current.delete(note.id);
    }
  };

  const renameFolderInFolder = async (folderPath: string, nextName: string) => {
    if (!folderPath) return;

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

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.renameFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const parentPath = segments.slice(0, -1).join("/");
          const safeName = proposed.replace(/[\\/:*?"<>|]/g, "_") || currentName;
          const oldFullPath = `${saved.folderPath}/${folderPath}`;
          const newFullPath = parentPath
            ? `${saved.folderPath}/${parentPath}/${safeName}`
            : `${saved.folderPath}/${safeName}`;

          const ok = await electronAPI.renameFileOrFolder({ oldFullPath, newFullPath });
          if (ok) {
            const renamedPath = parentPath ? `${parentPath}/${safeName}` : safeName;
            const autoIcon = (settings.autoFolderIcons !== false)
              ? getAutoFolderIconAndColor(safeName, settings.iconPack || "lucide")
              : null;
            if (autoIcon) {
              if (settings.folderIcons?.[folderPath]) {
                removeFolderIcon(folderPath);
              }
              setFolderIcon(renamedPath, autoIcon.icon, autoIcon.color);
            } else if (settings.folderIcons?.[folderPath]) {
              const existingIcon = settings.folderIcons[folderPath];
              removeFolderIcon(folderPath);
              setFolderIcon(renamedPath, existingIcon.icon, existingIcon.color);
            }

            const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
            setOpenedFolderPaths(folderPaths);

            const currentNotes = notesRef.current;
            const existingByPath = new Map(
              currentNotes
                .filter((n) => n.fileName)
                .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
            );

            const nextItems = entries.map((e: any) => {
              const relPath = e.relativePath;
              const existing = existingByPath.get(relPath);
              return mapTreeEntryToItem(e, existing);
            });

            replaceNotes(nextItems);
            return;
          }
        }
      } catch (error) {
        console.error("Electron rename folder failed", error);
      }
    }

    if (!openedRootDirHandle) return;

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
      const autoIcon = (settings.autoFolderIcons !== false)
        ? getAutoFolderIconAndColor(newFolderName, settings.iconPack || "lucide")
        : null;
      if (autoIcon) {
        if (settings.folderIcons?.[folderPath]) {
          removeFolderIcon(folderPath);
        }
        setFolderIcon(renamedPath, autoIcon.icon, autoIcon.color);
      } else if (settings.folderIcons?.[folderPath]) {
        const existingIcon = settings.folderIcons[folderPath];
        removeFolderIcon(folderPath);
        setFolderIcon(renamedPath, existingIcon.icon, existingIcon.color);
      }

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
    if (!note.fileName) return;

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.copyFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const folderPath = (note.folderPath === "__opened_root__" ? "" : note.folderPath) || "";
          const sourceFullPath = folderPath
            ? `${saved.folderPath}/${folderPath}/${note.fileName}`
            : `${saved.folderPath}/${note.fileName}`;

          const ok = await electronAPI.copyFileOrFolder({ sourceFullPath, targetFullPath: sourceFullPath });
          if (ok) {
            const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
            setOpenedFolderPaths(folderPaths);

            const currentNotes = notesRef.current;
            const existingByPath = new Map(
              currentNotes
                .filter((n) => n.fileName)
                .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
            );

            const nextItems = entries.map((e: any) => {
              const relPath = e.relativePath;
              const existing = existingByPath.get(relPath);
              return mapTreeEntryToItem(e, existing);
            });

            replaceNotes(nextItems);
            return;
          }
        }
      } catch (error) {
        console.error("Electron duplicate file failed", error);
      }
    }

    if (!openedRootDirHandle) return;

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
    if (targetNotes.length === 0) return;

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.copyFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          for (const note of targetNotes) {
            if (!note.fileName) continue;
            const folderPath = (note.folderPath === "__opened_root__" ? "" : note.folderPath) || "";
            const sourceFullPath = folderPath
              ? `${saved.folderPath}/${folderPath}/${note.fileName}`
              : `${saved.folderPath}/${note.fileName}`;

            await electronAPI.copyFileOrFolder({ sourceFullPath, targetFullPath: sourceFullPath });
          }

          const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
          setOpenedFolderPaths(folderPaths);

          const currentNotes = notesRef.current;
          const existingByPath = new Map(
            currentNotes
              .filter((n) => n.fileName)
              .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
          );

          const nextItems = entries.map((e: any) => {
            const relPath = e.relativePath;
            const existing = existingByPath.get(relPath);
            return mapTreeEntryToItem(e, existing);
          });

          replaceNotes(nextItems);
          return;
        }
      } catch (error) {
        console.error("Electron duplicate files failed", error);
      }
    }

    if (!openedRootDirHandle) return;

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

  const duplicateFolderInFolder = async (rawFolderPath: string) => {
    const folderPath = (rawFolderPath === "__opened_root__" ? "" : rawFolderPath) || "";
    if (!folderPath) return;

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.copyFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const sourceFullPath = `${saved.folderPath}/${folderPath}`;
          const ok = await electronAPI.copyFileOrFolder({ sourceFullPath, targetFullPath: sourceFullPath });
          if (ok) {
            const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
            setOpenedFolderPaths(folderPaths);

            const currentNotes = notesRef.current;
            const existingByPath = new Map(
              currentNotes
                .filter((n) => n.fileName)
                .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
            );

            const nextItems = entries.map((e: any) => {
              const relPath = e.relativePath;
              const existing = existingByPath.get(relPath);
              return mapTreeEntryToItem(e, existing);
            });

            replaceNotes(nextItems);
            return;
          }
        }
      } catch (error) {
        console.error("Electron duplicate folder failed", error);
      }
    }

    if (!openedRootDirHandle) return;

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
    toast({
      title: t("sidebar.copyAction") || "Copied",
      description: note.fileName || "File copied to clipboard",
    });
  };

  const copyFiles = (targetNotes: Note[]) => {
    const noteIds = targetNotes.map((n) => n.id);
    if (noteIds.length === 0) return;
    setClipboardItem({ kind: "file-batch", noteIds, folderPath: "" });
    toast({
      title: t("sidebar.copyAction") || "Copied",
      description: `${noteIds.length} files copied to clipboard`,
    });
  };

  const copyFolder = (folderPath: string) => {
    setClipboardItem({ kind: "folder", folderPath });
    const segments = folderPath.split("/").filter(Boolean);
    const folderName = segments[segments.length - 1] || folderPath;
    toast({
      title: t("sidebar.copyAction") || "Copied",
      description: `Folder '${folderName}' copied to clipboard`,
    });
  };

  const pasteIntoFolder = async (rawTargetFolderPath?: string) => {
    if (!clipboardItem) return;

    const targetFolderPath = (rawTargetFolderPath === "__opened_root__" ? "" : rawTargetFolderPath) || "";

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.copyFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          if (clipboardItem.kind === "file" && clipboardItem.noteId) {
            const sourceNote = notes.find((n) => n.id === clipboardItem.noteId);
            if (sourceNote?.fileName) {
              const sourceFolder = (sourceNote.folderPath === "__opened_root__" ? "" : sourceNote.folderPath) || "";
              const sourceFullPath = sourceFolder
                ? `${saved.folderPath}/${sourceFolder}/${sourceNote.fileName}`
                : `${saved.folderPath}/${sourceNote.fileName}`;
              const targetFullPath = targetFolderPath
                ? `${saved.folderPath}/${targetFolderPath}/${sourceNote.fileName}`
                : `${saved.folderPath}/${sourceNote.fileName}`;

              await electronAPI.copyFileOrFolder({ sourceFullPath, targetFullPath });
            }
          }

          if (clipboardItem.kind === "file-batch" && clipboardItem.noteIds?.length) {
            const sourceNotes = clipboardItem.noteIds
              .map((id) => notes.find((n) => n.id === id))
              .filter((n): n is Note => Boolean(n && n.fileName));

            for (const sourceNote of sourceNotes) {
              if (!sourceNote.fileName) continue;
              const sourceFolder = (sourceNote.folderPath === "__opened_root__" ? "" : sourceNote.folderPath) || "";
              const sourceFullPath = sourceFolder
                ? `${saved.folderPath}/${sourceFolder}/${sourceNote.fileName}`
                : `${saved.folderPath}/${sourceNote.fileName}`;
              const targetFullPath = targetFolderPath
                ? `${saved.folderPath}/${targetFolderPath}/${sourceNote.fileName}`
                : `${saved.folderPath}/${sourceNote.fileName}`;

              await electronAPI.copyFileOrFolder({ sourceFullPath, targetFullPath });
            }
          }

          if (clipboardItem.kind === "folder" && clipboardItem.folderPath) {
            const sourceFolder = (clipboardItem.folderPath === "__opened_root__" ? "" : clipboardItem.folderPath) || "";
            const folderName = sourceFolder.split("/").filter(Boolean).pop() || sourceFolder;
            const sourceFullPath = `${saved.folderPath}/${sourceFolder}`;
            const targetFullPath = targetFolderPath
              ? `${saved.folderPath}/${targetFolderPath}/${folderName}`
              : `${saved.folderPath}/${folderName}`;

            await electronAPI.copyFileOrFolder({ sourceFullPath, targetFullPath });
          }

          const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
          setOpenedFolderPaths(folderPaths);

          const currentNotes = notesRef.current;
          const existingByPath = new Map(
            currentNotes
              .filter((n) => n.fileName)
              .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
          );

          const nextItems = entries.map((e: any) => {
            const relPath = e.relativePath;
            const existing = existingByPath.get(relPath);
            return mapTreeEntryToItem(e, existing);
          });

          replaceNotes(nextItems);
          toast({
            title: t("sidebar.pasteAction") || "Pasted",
            description: targetFolderPath ? `Pasted into '${targetFolderPath}'` : "Pasted into workspace",
          });
          return;
        }
      } catch (error) {
        console.error("Electron paste failed", error);
      }
    }

    if (!openedRootDirHandle) return;

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
        const dotIndex = sourceNote.fileName.lastIndexOf(".");
        const base = dotIndex > 0 ? sourceNote.fileName.slice(0, dotIndex) : sourceNote.fileName;
        const ext = dotIndex > 0 ? sourceNote.fileName.slice(dotIndex) : ".txt";

        let desiredName = sourceNote.fileName;
        try {
          await targetDir.getFileHandle(desiredName, { create: false });
          desiredName = `${base}-copy${ext}`;
        } catch {
          // File does not exist yet
        }
        const targetName = await resolveUniqueFileName(targetDir, desiredName);
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
          const dotIndex = sourceNote.fileName.lastIndexOf(".");
          const base = dotIndex > 0 ? sourceNote.fileName.slice(0, dotIndex) : sourceNote.fileName;
          const ext = dotIndex > 0 ? sourceNote.fileName.slice(dotIndex) : ".txt";

          let desiredName = sourceNote.fileName;
          try {
            await targetDir.getFileHandle(desiredName, { create: false });
            desiredName = `${base}-copy${ext}`;
          } catch {
            // File does not exist yet
          }
          const targetName = await resolveUniqueFileName(targetDir, desiredName);
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
    if (!note.fileName) return;
    const sourcePath = note.folderPath || "";
    if (sourcePath === targetFolderPath) return;

    const oldRelPath = getRelativePath(sourcePath, note.fileName);
    trackDeletedRelativePath(oldRelPath);

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.renameFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const oldFullPath = sourcePath
            ? `${saved.folderPath}/${sourcePath}/${note.fileName}`
            : `${saved.folderPath}/${note.fileName}`;
          const newFullPath = targetFolderPath
            ? `${saved.folderPath}/${targetFolderPath}/${note.fileName}`
            : `${saved.folderPath}/${note.fileName}`;

          const ok = await electronAPI.renameFileOrFolder({ oldFullPath, newFullPath });
          if (ok) {
            const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
            setOpenedFolderPaths(folderPaths);

            const currentNotes = notesRef.current;
            const existingByPath = new Map(
              currentNotes
                .filter((n) => n.fileName)
                .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
            );

            const nextItems = entries.map((e: any) => {
              const relPath = e.relativePath;
              const existing = existingByPath.get(relPath);
              const isMoved = relPath === (targetFolderPath ? `${targetFolderPath}/${note.fileName}` : note.fileName);
              return mapTreeEntryToItem(e, existing, isMoved ? note.id : undefined);
            });

            replaceNotes(nextItems);
            return;
          }
        }
      } catch (error) {
        console.error("Electron move file failed", error);
      }
    }

    if (!openedRootDirHandle) return;

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
    if (!sourceFolderPath) return;
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

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.renameFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const folderName = sourceFolderPath.split("/").filter(Boolean).pop() || sourceFolderPath;
          const oldFullPath = `${saved.folderPath}/${sourceFolderPath}`;
          const newFullPath = targetFolderPath
            ? `${saved.folderPath}/${targetFolderPath}/${folderName}`
            : `${saved.folderPath}/${folderName}`;

          const ok = await electronAPI.renameFileOrFolder({ oldFullPath, newFullPath });
          if (ok) {
            const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
            setOpenedFolderPaths(folderPaths);

            const currentNotes = notesRef.current;
            const existingByPath = new Map(
              currentNotes
                .filter((n) => n.fileName)
                .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
            );

            const nextItems = entries.map((e: any) => {
              const relPath = e.relativePath;
              const existing = existingByPath.get(relPath);
              return mapTreeEntryToItem(e, existing);
            });

            replaceNotes(nextItems);
            return;
          }
        }
      } catch (error) {
        console.error("Electron move folder failed", error);
      }
    }

    if (!openedRootDirHandle) return;

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
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.deleteFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath && note.fileName) {
          const fullPath = note.folderPath
            ? `${saved.folderPath}/${note.folderPath}/${note.fileName}`
            : `${saved.folderPath}/${note.fileName}`;

          await electronAPI.deleteFileOrFolder(fullPath);
          const relPath = getRelativePath(note.folderPath || "", note.fileName);
          if (settings.fileIcons?.[relPath]) {
            removeFileIcon(relPath);
          }
          handleDeleteNote(note.id);

          const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
          setOpenedFolderPaths(folderPaths);

          const currentNotes = notesRef.current;
          const existingByPath = new Map(
            currentNotes
              .filter((n) => n.fileName)
              .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
          );

          const nextItems = entries.map((e: any) => {
            const relPath = e.relativePath;
            const existing = existingByPath.get(relPath);
            return mapTreeEntryToItem(e, existing);
          });

          replaceNotes(nextItems);
          removeTabsForDeletedNotes(new Set(nextItems.map((n) => n.id)));
          return;
        }
      } catch (error) {
        console.error("Electron delete file failed", error);
      }
    }

    if (note.fileName) {
      const relPath = getRelativePath(note.folderPath || "", note.fileName);
      trackDeletedRelativePath(relPath);
    }

    handleDeleteNote(note.id);
  };

  const deleteFilesInFolder = async (targetNotes: Note[]) => {
    if (targetNotes.length === 0) return;

    const count = targetNotes.length;
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.deleteFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const notesToTrash: Note[] = [];
          for (const n of targetNotes) {
            if (n.fileName) {
              const fullPath = n.folderPath
                ? `${saved.folderPath}/${n.folderPath}/${n.fileName}`
                : `${saved.folderPath}/${n.fileName}`;

              const isImg =
                n.fileType === "image" ||
                n.fileType === "binary" ||
                /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(n.fileName || "");

              if (isImg && electronAPI.readFileBase64) {
                const b64 = await electronAPI.readFileBase64(fullPath);
                if (b64) {
                  const ext = (n.fileName || "").toLowerCase();
                  const mime = ext.endsWith(".png")
                    ? "image/png"
                    : ext.endsWith(".gif")
                    ? "image/gif"
                    : ext.endsWith(".webp")
                    ? "image/webp"
                    : ext.endsWith(".svg")
                    ? "image/svg+xml"
                    : "image/jpeg";
                  notesToTrash.push({ ...n, content: `data:${mime};base64,${b64}` });
                } else {
                  notesToTrash.push(n);
                }
              } else {
                notesToTrash.push(n);
              }

              await electronAPI.deleteFileOrFolder(fullPath);
            }
            if (splitTabId === n.id) {
              setSplitTabId(null);
            }
            clearNoteEditorHistory(n.id);
            closeTab(n.id, notes.map((item) => item.id));
            deleteNote(n.id);
          }
          moveToTrash(notesToTrash);

          const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
          setOpenedFolderPaths(folderPaths);

          const currentNotes = notesRef.current;
          const existingByPath = new Map(
            currentNotes
              .filter((n) => n.fileName)
              .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
          );

          const nextItems = entries.map((e: any) => {
            const relPath = e.relativePath;
            const existing = existingByPath.get(relPath);
            return mapTreeEntryToItem(e, existing);
          });

          replaceNotes(nextItems);
          removeTabsForDeletedNotes(new Set(nextItems.map((n) => n.id)));
          toast({
            title: t("trash.title"),
            description: t("trash.movedBatchToTrash", { count }),
            action: (
              <ToastAction altText={t("trash.undo")} onClick={() => handleRestoreFromTrash(targetNotes.map((n) => n.id))}>
                {t("trash.undo")}
              </ToastAction>
            ),
          });
          return;
        }
      } catch (error) {
        console.error("Electron delete batch files failed", error);
      }
    }

    targetNotes.forEach((n) => {
      if (n.fileName) {
        trackDeletedRelativePath(getRelativePath(n.folderPath || "", n.fileName));
      }
      if (splitTabId === n.id) {
        setSplitTabId(null);
      }
      clearNoteEditorHistory(n.id);
      closeTab(n.id, notes.map((item) => item.id));
      deleteNote(n.id);
    });

    toast({
      title: t("trash.title"),
      description: t("trash.movedBatchToTrash", { count }),
      action: (
        <ToastAction altText={t("trash.undo")} onClick={() => handleRestoreFromTrash(targetNotes.map((n) => n.id))}>
          {t("trash.undo")}
        </ToastAction>
      ),
    });
  };

  const deleteFolderInFolder = async (folderPath: string) => {
    if (!folderPath) return;

    const folderName = folderPath.split("/").filter(Boolean).pop() || folderPath;
    const notesInFolder = notes.filter(
      (n) => n.folderPath === folderPath || n.folderPath?.startsWith(`${folderPath}/`)
    );

    const relPaths = new Set<string>();
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    const saved = electronAPI?.getSavedWorkspace ? await electronAPI.getSavedWorkspace() : null;

    const notesToTrash: Note[] = [];
    for (const n of notesInFolder) {
      if (n.fileName) {
        const relPath = getRelativePath(n.folderPath || "", n.fileName);
        relPaths.add(relPath);
        trackDeletedRelativePath(relPath);
      }
      if (splitTabId === n.id) {
        setSplitTabId(null);
      }
      clearNoteEditorHistory(n.id);
      closeTab(n.id, notes.map((item) => item.id));

      const isImg =
        n.fileType === "image" ||
        n.fileType === "binary" ||
        /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(n.fileName || "");

      if (isImg && electronAPI?.readFileBase64 && saved?.folderPath && n.fileName) {
        const fullPath = n.folderPath
          ? `${saved.folderPath}/${n.folderPath}/${n.fileName}`
          : `${saved.folderPath}/${n.fileName}`;
        const b64 = await electronAPI.readFileBase64(fullPath);
        if (b64) {
          const ext = (n.fileName || "").toLowerCase();
          const mime = ext.endsWith(".png")
            ? "image/png"
            : ext.endsWith(".gif")
            ? "image/gif"
            : ext.endsWith(".webp")
            ? "image/webp"
            : ext.endsWith(".svg")
            ? "image/svg+xml"
            : "image/jpeg";
          notesToTrash.push({ ...n, content: `data:${mime};base64,${b64}` });
        } else {
          notesToTrash.push(n);
        }
      } else {
        notesToTrash.push(n);
      }
      deleteNote(n.id);
    }

    if (notesToTrash.length > 0) {
      moveToTrash(notesToTrash);
    }

    if (electronAPI?.getSavedWorkspace && electronAPI?.deleteFileOrFolder && electronAPI?.readWorkspaceTree) {
      try {
        if (saved?.folderPath) {
          const fullPath = `${saved.folderPath}/${folderPath}`;
          await electronAPI.deleteFileOrFolder(fullPath);

          const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
          setOpenedFolderPaths(folderPaths);

          const currentNotes = notesRef.current.filter(
            (n) => n.folderPath !== folderPath && !n.folderPath?.startsWith(`${folderPath}/`)
          );
          const existingByPath = new Map(
            currentNotes
              .filter((n) => n.fileName)
              .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
          );

          const nextItems = entries.map((e: any) => {
            const relPath = e.relativePath;
            const existing = existingByPath.get(relPath);
            return mapTreeEntryToItem(e, existing);
          });

          replaceNotes(nextItems);
          removeTabsForDeletedNotes(new Set(nextItems.map((n) => n.id)));
          toast({
            title: t("trash.title"),
            description: notesToTrash.length > 0
              ? t("trash.movedBatchToTrash", { count: notesToTrash.length })
              : (isTh ? `ลบโฟลเดอร์ "${folderName}" เรียบร้อยแล้ว` : `Deleted folder "${folderName}"`),
            action: notesToTrash.length > 0 ? (
              <ToastAction altText={t("trash.undo")} onClick={() => handleRestoreFromTrash(notesToTrash.map((n) => n.id))}>
                {t("trash.undo")}
              </ToastAction>
            ) : undefined,
          });
          return;
        }
      } catch (error) {
        console.error("Electron delete folder failed", error);
      }
    }

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

    setOpenedFolderPaths((prev) =>
      prev.filter((p) => p !== folderPath && !p.startsWith(`${folderPath}/`))
    );

    toast({
      title: t("trash.title"),
      description: notesToTrash.length > 0
        ? t("trash.movedBatchToTrash", { count: notesToTrash.length })
        : (isTh ? `ลบโฟลเดอร์ "${folderName}" เรียบร้อยแล้ว` : `Deleted folder "${folderName}"`),
      action: notesToTrash.length > 0 ? (
        <ToastAction altText={t("trash.undo")} onClick={() => handleRestoreFromTrash(notesToTrash.map((n) => n.id))}>
          {t("trash.undo")}
        </ToastAction>
      ) : undefined,
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

      const effectiveTemplate = options?.templateType || getDefaultTemplateForExtension(settings, fileName);
      const templateContent = getNoteTemplateContent(
        effectiveTemplate,
        settings.language,
        contentFormat,
        settings.dateFormat,
        settings.timeFormat,
        settings.iconPack
      );
      const fileContent = isFileTxt && !templateContent ? "" : templateContent;
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
    const safeName = (folderName ?? "").trim().replace(/[\\/:*?"<>|]/g, "_") || "Untitled";

    try {
      let parentDir = targetRootDirHandle;
      const segments = normalizedPath.split("/").filter(Boolean);
      for (const segment of segments) {
        parentDir = await parentDir.getDirectoryHandle(segment, { create: true });
      }

      const targetFolderName = await resolveUniqueFolderName(parentDir, safeName);
      await parentDir.getDirectoryHandle(targetFolderName, { create: true });

      const newFolderPath = normalizedPath ? `${normalizedPath}/${targetFolderName}` : targetFolderName;
      const autoIcon = (settings.autoFolderIcons !== false)
        ? getAutoFolderIconAndColor(targetFolderName, settings.iconPack || "lucide")
        : null;
      if (autoIcon) {
        setFolderIcon(newFolderPath, autoIcon.icon, autoIcon.color);
      }

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
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

    // 1. Electron Desktop Native Dialog & Tree Read
    if (electronAPI?.selectWorkspaceDialog && electronAPI?.readWorkspaceTree) {
      try {
        const data = await electronAPI.selectWorkspaceDialog();
        if (data?.folderPath) {
          if (data.openedInNewWindow) {
            // New workspace was launched in a new window; keep current window intact!
            return;
          }
          setIsWorkspaceLoading(true);
          setOpenedRootDirHandle(null);
          setPendingReconnectDirHandle(null);
          await setStoredDirectoryHandle(null);
          resetTabs();
          replaceNotes([], true);
          electronWorkspacePathRef.current = data.folderPath;
          const folderName = data.folderName || data.folderPath.split(/[\\/]/).pop() || "My Notes";
          setOpenedFolderName(folderName);
          setRootFolderName(folderName);
          setElectronWorkspacePath(data.folderPath);

          // Register into local workspace registry immediately
          try {
            await getLocalWorkspaceManifest(null, data.folderPath, folderName);
          } catch (manifestErr) {
            console.warn("Could not get local workspace manifest:", manifestErr);
          }

          const { entries, folderPaths } = await electronAPI.readWorkspaceTree(data.folderPath);

          // Guard: ensure user didn't switch workspace again mid-flight
          if (electronWorkspacePathRef.current !== data.folderPath) return;

          setOpenedFolderPaths(folderPaths || []);

          const nextItems = (entries || []).map((e: any) => mapTreeEntryToItem(e));

          const nextNotes = replaceNotes(nextItems, true);
          restoreTabsFromSession(nextNotes, settings.reopenTabs, settings.onStartup);

          if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
            void triggerSync(nextNotes, (updated) => {
              replaceNotes(updated);
            });
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (err) {
        console.error("Electron open folder failed", err);
      } finally {
        setIsWorkspaceLoading(false);
      }
      return;
    }

    // 2. Web Browser Fallback
    const w = window as unknown as { showDirectoryPicker?: (options?: unknown) => Promise<FileSystemDirectoryHandle> };
    if (typeof w.showDirectoryPicker !== "function") return;

    try {
      const dirHandle = await w.showDirectoryPicker({ mode: "readwrite" });
      setIsWorkspaceLoading(true);
      electronWorkspacePathRef.current = null;
      setElectronWorkspacePath(null);
      resetTabs();
      replaceNotes([], true);
      const folderName = dirHandle.name ?? null;
      setOpenedFolderName(folderName);
      setOpenedRootDirHandle(dirHandle);
      setPendingReconnectDirHandle(null);
      setRootFolderName(folderName || "Luno Notes");
      setRootDirHandle(dirHandle);
      await setStoredDirectoryHandle(dirHandle);
      await syncFolderFromDisk(dirHandle, undefined, true);

      if (pending) {
        if (pending.kind === "file") {
          await createNoteInFolderWithDir(dirHandle, undefined, { fileName: pending.fileName, contentFormat: pending.contentFormat });
        } else if (pending.kind === "folder") {
          await createFolderInFolderWithDir(dirHandle, undefined, pending.folderName);
        }
      }

      if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
        void triggerSync(notesRef.current, (updated) => {
          replaceNotes(updated);
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Open folder failed", error);
      }
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const handleCreateWorkspace = useCallback(
    async (parentPath: string, workspaceName: string) => {
      setIsCreatingWorkspace(true);
      try {
        const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
        if (electronAPI?.createNewWorkspace) {
          const data = await electronAPI.createNewWorkspace({ parentPath, workspaceName });
          if (data?.folderPath) {
            if (data.openedInNewWindow) {
              // New workspace was launched in a new window; keep current window intact!
              return;
            }
            setIsWorkspaceLoading(true);
            setOpenedRootDirHandle(null);
            setPendingReconnectDirHandle(null);
            await setStoredDirectoryHandle(null);
            resetTabs();
            replaceNotes([], true);
            electronWorkspacePathRef.current = data.folderPath;
            const folderName = data.folderName || workspaceName;
            setOpenedFolderName(folderName);
            setRootFolderName(folderName);
            setElectronWorkspacePath(data.folderPath);

            // Register into workspace identity registry
            try {
              await getLocalWorkspaceManifest(null, data.folderPath, folderName);
            } catch (manifestErr) {
              console.warn("Could not get local workspace manifest:", manifestErr);
            }

            const tree = await electronAPI.readWorkspaceTree(data.folderPath);
            setOpenedFolderPaths(tree?.folderPaths || []);

            const nextItems = (tree?.entries || []).map((e: any) => mapTreeEntryToItem(e));

            const nextNotes = replaceNotes(nextItems, true);
            restoreTabsFromSession(nextNotes, settings.reopenTabs, settings.onStartup);

            if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
              void triggerSync(nextNotes, (updated) => {
                replaceNotes(updated);
              });
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      } catch (err) {
        console.error("Failed creating workspace:", err);
      } finally {
        setIsCreatingWorkspace(false);
        setIsWorkspaceLoading(false);
      }
    },
    [replaceNotes, resetTabs, restoreTabsFromSession, settings.reopenTabs, settings.onStartup, settings.storageMode, triggerSync]
  );

  const handleCloseWorkspace = useCallback(async () => {
    try {
      const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
      if (electronAPI?.setSavedWorkspace) {
        await electronAPI.setSavedWorkspace(null);
      }
      electronWorkspacePathRef.current = null;
      setElectronWorkspacePath(null);
      await setStoredDirectoryHandle(null);
      setOpenedRootDirHandle(null);
      setPendingReconnectDirHandle(null);
      setOpenedFolderName(null);
      setRootFolderName("Luno Notes");
      setOpenedFolderPaths([]);
      resetTabs();
      replaceNotes([], true);
      setIsWorkspaceLoading(false);
    } catch (err) {
      console.warn("Failed closing workspace:", err);
    }
  }, [replaceNotes, resetTabs]);

  const handleOpenCloudWorkspace = useCallback(
    async (cloudWs: CloudWorkspaceInfo) => {
      setIsWorkspaceLoading(true);
      try {
        updateSetting("storageMode", "gdrive");
        const folderName = cloudWs.name || "Google Drive";
        setOpenedFolderName(folderName);
        setRootFolderName(folderName);
        resetTabs();
        replaceNotes([], true);

        // Clear local handles so no local files on device are touched or modified
        setOpenedRootDirHandle(null);
        setPendingReconnectDirHandle(null);
        electronWorkspacePathRef.current = null;
        setElectronWorkspacePath(null);
        await setStoredDirectoryHandle(null);

        await importDriveNotes([], (imported) => {
          const nextNotes = replaceNotes(imported, true);
          resetTabs();
        });

        toast({
          title: t("settings.gdriveConnectedTitle") || "Google Drive Connected",
          description: `${folderName} loaded from Google Drive`,
        });
      } catch (err: any) {
        toast({
          title: t("settings.gdriveConnectFailed") || "Connection Failed",
          description: err.message || "Failed to open cloud workspace",
          variant: "destructive",
        });
      } finally {
        setIsWorkspaceLoading(false);
      }
    },
    [updateSetting, setRootFolderName, resetTabs, importDriveNotes, replaceNotes, t]
  );

  const handleCreateCloudWorkspace = useCallback(
    async (workspaceName: string) => {
      setIsCreatingWorkspace(true);
      try {
        let tokenInfo = getStoredTokenInfo();
        if (!tokenInfo?.access_token) {
          await requestGoogleDriveAuth();
          tokenInfo = getStoredTokenInfo();
        }
        if (!tokenInfo?.access_token) {
          throw new Error("Not authenticated with Google Drive");
        }

        const created = await createCloudWorkspace(tokenInfo.access_token, workspaceName);
        await handleOpenCloudWorkspace({
          id: created.folderId,
          name: created.name,
          workspaceId: created.workspaceId,
          status: "cloud_only",
        });
      } catch (err: any) {
        toast({
          title: t("settings.gdriveConnectFailed") || "Failed to create workspace",
          description: err.message || "Could not create workspace on Google Drive",
          variant: "destructive",
        });
      } finally {
        setIsCreatingWorkspace(false);
      }
    },
    [handleOpenCloudWorkspace, t]
  );

  const handleConnectGoogleDriveDirect = useCallback(async () => {
    setIsWorkspaceLoading(true);
    try {
      if (!isGoogleDriveConnected()) {
        await requestGoogleDriveAuth();
      }
      updateSetting("storageMode", "gdrive");
      const folderName = "Google Drive";
      setOpenedFolderName(folderName);
      setRootFolderName(folderName);
      resetTabs();
      replaceNotes([], true);

      await importDriveNotes([], (imported) => {
        const nextNotes = replaceNotes(imported, true);
        resetTabs();
      });

      toast({
        title: t("settings.gdriveConnectedTitle") || "Google Drive Connected",
        description: t("settings.gdriveConnectedDesc") || "Luno is now synced with your Google Drive.",
      });
    } catch (err: any) {
      toast({
        title: t("settings.gdriveConnectFailed") || "Connection Failed",
        description: err.message || "Failed to connect to Google Drive",
        variant: "destructive",
      });
    } finally {
      setIsWorkspaceLoading(false);
    }
  }, [
    updateSetting,
    setRootFolderName,
    resetTabs,
    importDriveNotes,
    replaceNotes,
    openTab,
    setActiveTabId,
    t,
  ]);

  const handleReconnectFolder = async () => {
    try {
      const dirHandle = await getStoredDirectoryHandle();
      if (!dirHandle) {
        void handleOpenFolder();
        return;
      }
      const permState = await dirHandle.requestPermission({ mode: "readwrite" });
      if (permState === "granted") {
        setPendingReconnectDirHandle(null);
        await scanAndLoadFolderEntries(dirHandle, {
          onSuccess: (notesLoaded) => {
            const folderName = dirHandle.name || "My Notes";
            setOpenedFolderName(folderName);
            setRootFolderName(folderName);
            restoreTabsFromSession(notesLoaded, settings.reopenTabs, settings.onStartup);
          },
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

    // Absolute fallback: if workspace loading takes > 6 seconds, force dismiss loading screen
    const forceDismissId = window.setTimeout(() => {
      if (active) {
        console.warn("Workspace loading timed out; forcing UI display.");
        setIsWorkspaceLoading(false);
      }
    }, 6000);

    async function restoreFolderConnection() {
      try {
        const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;

        // 1. Electron Desktop Native Saved Workspace Load (Priority 1)
        if (electronAPI?.getSavedWorkspace && electronAPI?.readWorkspaceTree) {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath && active) {
            electronWorkspacePathRef.current = saved.folderPath;
            const folderName = saved.folderName || saved.folderPath.split(/[\\/]/).pop() || "My Notes";
            setOpenedFolderName(folderName);
            setRootFolderName(folderName);
            setElectronWorkspacePath(saved.folderPath);

            // Register into local workspace registry immediately
            try {
              await getLocalWorkspaceManifest(null, saved.folderPath, folderName);
            } catch (manifestErr) {
              console.warn("Could not get local workspace manifest:", manifestErr);
            }

            const tree = await electronAPI.readWorkspaceTree(saved.folderPath);
            if (!active) return;
            const entries = tree?.entries || [];
            const folderPaths = tree?.folderPaths || [];
            setOpenedFolderPaths(folderPaths);

            const nextItems = entries.map((e: any) => mapTreeEntryToItem(e));

            const nextNotes = replaceNotes(nextItems, true);
            restoreTabsFromSession(nextNotes, settings.reopenTabs, settings.onStartup);

            if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
              void triggerSync(nextNotes, (updated) => {
                replaceNotes(updated);
              });
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
            if (active) {
              setIsWorkspaceLoading(false);
            }
            return;
          }
        }

        // 2. Web Browser File System Handle (Priority 2)
        const storedDir = await getStoredDirectoryHandle();
        if (storedDir && active) {
          let permState: PermissionState | "granted" = "prompt";
          if (typeof storedDir.queryPermission === "function") {
            try {
              permState = await storedDir.queryPermission({ mode: "readwrite" });
            } catch {
              // ignore
            }
          }

          if (permState !== "granted" && typeof storedDir.requestPermission === "function") {
            try {
              permState = await storedDir.requestPermission({ mode: "readwrite" });
            } catch {
              // ignore
            }
          }

          const folderName = storedDir.name || "My Notes";
          setOpenedFolderName(folderName);
          setOpenedRootDirHandle(storedDir);
          setRootFolderName(folderName);
          setRootDirHandle(storedDir);

          try {
            await syncFolderFromDisk(storedDir);
            if (!active) return;
            setPendingReconnectDirHandle(null);
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (syncErr) {
            console.warn("Could not sync directory handle:", syncErr);
          }
          if (active) {
            setIsWorkspaceLoading(false);
          }
          return;
        }

        // 3. Fallback: No local workspace found
        if (active) {
          setOpenedFolderName(null);
          resetTabs();
          replaceNotes([], true);
          setIsWorkspaceLoading(false);
        }
        return;
      } catch (err) {
        console.warn("Could not restore directory handle:", err);
      } finally {
        if (active) {
          setIsWorkspaceLoading(false);
        }
      }
    }

    void restoreFolderConnection();
    return () => {
      active = false;
      window.clearTimeout(forceDismissId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Listen for real-time filesystem events from Electron workspace watcher (sub-second reactivity)
  useEffect(() => {
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (!electronAPI?.onWorkspaceChanged) return;

    const unsubscribe = electronAPI.onWorkspaceChanged((data: { folderPath: string; entries: any[]; folderPaths: string[] }) => {
      if (!data || !data.folderPath) return;
      if (electronWorkspacePathRef.current && electronWorkspacePathRef.current !== data.folderPath) return;

      setOpenedFolderPaths(data.folderPaths || []);

      const currentNotes = notesRef.current;
      const existingByPath = new Map(
        currentNotes
          .filter((n) => n.fileName)
          .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
      );

      const nextItems = (data.entries || []).map((e: any) => {
        const existing = existingByPath.get(e.relativePath);
        return mapTreeEntryToItem(e, existing);
      });

      replaceNotes(nextItems);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [replaceNotes]);

  // Ensure default workspace folders (.luno and attachments) exist when workspace opens
  useEffect(() => {
    if (!openedRootDirHandle) return;
    const initDefaultFolders = async () => {
      try {
        await openedRootDirHandle.getDirectoryHandle(".luno", { create: true });
        await openedRootDirHandle.getDirectoryHandle("attachments", { create: true });
      } catch (err) {
        console.warn("Failed creating default workspace folders:", err);
      }
    };
    void initDefaultFolders();
  }, [openedRootDirHandle]);

  // Load .luno/settings.json and .luno/favorites.json when workspace opens
  useEffect(() => {
    let active = true;
    const loadMeta = async () => {
      const [workspaceSettings, favList] = await Promise.all([
        loadWorkspaceSettings(openedRootDirHandle),
        loadWorkspaceFavorites(openedRootDirHandle),
      ]);
      if (active) {
        if (workspaceSettings) {
          updateSettings(workspaceSettings);
        } else if (settings) {
          await saveWorkspaceSettings(openedRootDirHandle, settings);
        }

        if (favList && favList.length > 0) {
          const nonMdFavs = favList.filter((p) => !p.toLowerCase().endsWith(".md") && !p.toLowerCase().endsWith(".markdown"));
          workspaceFavoritesRef.current = new Set(nonMdFavs);
          notesRef.current.forEach((n) => {
            if (!isMarkdownNote(n)) {
              const relPath = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName) : "";
              if (relPath && workspaceFavoritesRef.current.has(relPath) && !n.isFavorite) {
                updateNote(n.id, { isFavorite: true });
              }
            }
          });
          if (nonMdFavs.length !== favList.length) {
            void saveWorkspaceFavorites(openedRootDirHandle, nonMdFavs);
          }
        }
      }
    };
    void loadMeta();
    return () => {
      active = false;
    };
  }, [openedRootDirHandle, openedFolderName]);

  // Save settings to .luno/settings.json whenever settings change
  useEffect(() => {
    if (settings) {
      void saveWorkspaceSettings(openedRootDirHandle, settings);
    }
  }, [openedRootDirHandle, settings]);

  // Keep open tabs in sync when notes are deleted (non-folder-sync deletions)
  useEffect(() => {
    const existingSet = new Set(notes.map((n) => n.id));
    existingSet.add("home");
    existingSet.add("settings");
    existingSet.add("luno-ai");
    existingSet.add("templates");
    existingSet.add("favorites");
    existingSet.add("tags");
    existingSet.add("trash");
    if (newlyCreatedNoteIdRef.current) {
      existingSet.add(newlyCreatedNoteIdRef.current);
    }
    removeTabsForDeletedNotes(existingSet);
  }, [notes, removeTabsForDeletedNotes]);

  const openTabNotes = useMemo(() => {
    return openTabIds
      .map((id) => {
        if (id === "home") return HOME_NOTE;
        if (id === "trash") return TRASH_NOTE;
        if (id === "settings") return SETTINGS_NOTE;
        if (id === "luno-ai") return LUNO_AI_NOTE;
        if (id === "templates") return TEMPLATES_NOTE;
        if (id === "favorites") return FAVORITES_NOTE;
        if (id === "tags") return TAGS_NOTE;
        if (id.startsWith("web:")) return getWebTabNote(id);
        return notes.find((n) => n.id === id);
      })
      .filter((n): n is Note => Boolean(n));
  }, [openTabIds, notes, HOME_NOTE, TRASH_NOTE, SETTINGS_NOTE, LUNO_AI_NOTE, TEMPLATES_NOTE, FAVORITES_NOTE, TAGS_NOTE, getWebTabNote]);

  // Cycle open tabs with Ctrl+Tab / Ctrl+Shift+Tab
  const cycleActiveTab = useCallback((direction: 1 | -1) => {
    if (openTabNotes.length <= 1) return;
    const currentIndex = openTabNotes.findIndex((n) => n.id === activeTabId);
    if (currentIndex === -1) {
      setActiveTabId(openTabNotes[0].id);
      return;
    }
    const nextIndex = (currentIndex + direction + openTabNotes.length) % openTabNotes.length;
    setActiveTabId(openTabNotes[nextIndex].id);
  }, [openTabNotes, activeTabId, setActiveTabId]);

  // Global App-level Keyboard Shortcuts (Ctrl+N, Ctrl+O, Ctrl+W, Ctrl+B, Ctrl+\, Ctrl+K, Ctrl+F, Ctrl+Tab, etc.)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === "Escape") {
        if (isMobile && sidebarOpen) {
          setSidebarOpen(false);
        }
        return;
      }

      if (!isCtrlOrCmd) return;

      const target = e.target as HTMLElement | null;
      const isEditing = Boolean(
        target && (
          target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.closest(".tiptap") ||
          target.closest(".ProseMirror") ||
          target.closest(".monaco-editor")
        )
      );

      const key = e.key ? e.key.toLowerCase() : "";
      const code = e.code || "";

      // 1. Ctrl + N / Cmd + N (New Note)
      if ((key === "n" || code === "KeyN" || key === "ื" || e.keyCode === 78 || e.which === 78) && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        void createNoteInFolder();
        return;
      }

      // 2. Ctrl + O / Cmd + O (Open Workspace Folder)
      if ((key === "o" || code === "KeyO" || key === "น" || e.keyCode === 79 || e.which === 79) && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        void handleOpenFolder();
        return;
      }

      // 3. Ctrl + W / Cmd + W (Close Active Tab)
      if ((key === "w" || code === "KeyW" || key === "ไ" || e.keyCode === 87 || e.which === 87) && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        if (activeTabId) {
          handleCloseTab(activeTabId);
        }
        return;
      }

      // 4. Ctrl + Tab / Ctrl + Shift + Tab (Cycle Open Tabs)
      if (key === "tab" || code === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        cycleActiveTab(e.shiftKey ? -1 : 1);
        return;
      }

      // 5. Ctrl + \ or Ctrl + | (Toggle Sidebar) or Ctrl + B (only when not editing)
      if (((key === "\\" || key === "|" || code === "Backslash") && !e.shiftKey && !e.altKey) || ((key === "b" || code === "KeyB") && !e.shiftKey && !e.altKey && !isEditing)) {
        e.preventDefault();
        e.stopPropagation();
        setSidebarOpen((prev) => !prev);
        return;
      }

      // 6. Ctrl + , (Open Settings)
      if ((key === "," || code === "Comma") && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        openTab("settings");
        return;
      }

      // 7. Ctrl + K / Ctrl + F (Universal Search Focus)
      const isSearchTrigger =
        (key === "k" || code === "KeyK" || key === "า" || e.keyCode === 75) ||
        ((key === "f" || code === "KeyF" || key === "ด" || e.keyCode === 70) && !isEditing);

      if (isSearchTrigger && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();

        if (activeTabId === "home") {
          const homeSearchInput = document.querySelector<HTMLInputElement>(
            'input[data-home-search="true"]'
          );
          if (homeSearchInput) {
            homeSearchInput.focus();
            homeSearchInput.select();
            return;
          }
        }

        if (activeTabId === "trash") {
          const trashSearchInput = document.querySelector<HTMLInputElement>(
            'input[data-trash-search="true"]'
          );
          if (trashSearchInput) {
            trashSearchInput.focus();
            trashSearchInput.select();
            return;
          }
        }

        if (activeTabId === "templates") {
          const templatesSearchInput = document.querySelector<HTMLInputElement>(
            'input[data-templates-search="true"]'
          );
          if (templatesSearchInput) {
            templatesSearchInput.focus();
            templatesSearchInput.select();
            return;
          }
        }

        if (activeTabId === "favorites") {
          const favoritesSearchInput = document.querySelector<HTMLInputElement>(
            'input[data-favorites-search="true"]'
          );
          if (favoritesSearchInput) {
            favoritesSearchInput.focus();
            favoritesSearchInput.select();
            return;
          }
        }

        if (activeTabId === "tags") {
          const tagsSearchInput = document.querySelector<HTMLInputElement>(
            'input[data-tags-search="true"]'
          );
          if (tagsSearchInput) {
            tagsSearchInput.focus();
            tagsSearchInput.select();
            return;
          }
        }

        // On any other page (editor, settings, web tab, etc.), open sidebar and focus sidebar search
        setSidebarOpen(true);
        window.dispatchEvent(new CustomEvent("luno:focus-sidebar-search"));
        const focusSidebarSearch = () => {
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[data-sidebar-search="true"], aside input[type="text"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
            return true;
          }
          return false;
        };

        if (!focusSidebarSearch()) {
          setTimeout(focusSidebarSearch, 30);
          setTimeout(focusSidebarSearch, 80);
          setTimeout(focusSidebarSearch, 200);
          setTimeout(focusSidebarSearch, 400);
        }
        return;
      }

      // 8. Ctrl + Shift + C (Toggle Floating Calculator)
      if (e.shiftKey && (key === "c" || code === "KeyC")) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("app:toggle-calculator"));
        return;
      }

      // 9. Ctrl + Shift + T (Toggle Floating Clock when not in editor)
      if (e.shiftKey && (key === "t" || code === "KeyT") && !isEditing) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("app:toggle-clock"));
        return;
      }

      // 10. Ctrl + Shift + A (Open Luno AI) or Ctrl + Shift + L (when not in editor)
      if ((e.shiftKey && (key === "a" || code === "KeyA")) || (e.shiftKey && (key === "l" || code === "KeyL") && !isEditing)) {
        e.preventDefault();
        e.stopPropagation();
        openTab("luno-ai");
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [createNoteInFolder, handleOpenFolder, activeTabId, closeTab, notes, setSidebarOpen, openTab, isMobile, sidebarOpen, cycleActiveTab]);

  const handleCloseTab = useCallback(
    (id: string) => {
      clearNoteEditorHistory(id);
      closeTab(id, notes.map((n) => n.id));
      if (id.startsWith("web:")) {
        setWebTabs((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [closeTab, notes]
  );

  const handleRestoreFromTrash = useCallback((ids: string[]) => {
    const restored = restoreFromTrash(ids);
    if (restored.length === 0) return;

    const currentNotes = notesRef.current;
    const existingIds = new Set(currentNotes.map((n) => n.id));
    const newNotes = restored.map((n) => {
      const isImg =
        n.fileType === "image" ||
        /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(n.fileName || "");
      const base = existingIds.has(n.id) ? { ...n, id: crypto.randomUUID() } : n;
      return isImg ? { ...base, fileType: "image" as const } : base;
    });

    // Clear deleted path tracking
    for (const n of newNotes) {
      if (n.fileName) {
        const relPath = getRelativePath(n.folderPath || "", n.fileName);
        clearDeletedRelativePath(relPath);
      }
      unmarkNoteAsDeleted(n.id);
    }

    // Write restored files to physical disk (Electron workspace)
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && (electronAPI?.writeFileContent || electronAPI?.writeFileBase64)) {
      void (async () => {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath) {
            for (const n of newNotes) {
              if (n.fileName && typeof n.content === "string") {
                const fullPath = n.folderPath
                  ? `${saved.folderPath}/${n.folderPath}/${n.fileName}`
                  : `${saved.folderPath}/${n.fileName}`;

                const isImageOrBinary =
                  n.fileType === "image" ||
                  n.fileType === "binary" ||
                  /\.(png|jpe?g|gif|webp|svg|bmp|ico|pdf|zip|mp3|mp4|avif)$/i.test(n.fileName || "");

                if (isImageOrBinary && n.content.startsWith("data:") && electronAPI.writeFileBase64) {
                  await electronAPI.writeFileBase64({ fullPath, base64: n.content });
                } else if (electronAPI.writeFileContent && n.content) {
                  await electronAPI.writeFileContent({ fullPath, content: n.content });
                }
              }
            }
          }
        } catch (err) {
          console.warn("Failed to restore file in Electron workspace:", err);
        }
      })();
    }

    if (openedRootDirHandle) {
      void (async () => {
        try {
          for (const n of newNotes) {
            if (n.fileName && typeof n.content === "string") {
              let targetDir = openedRootDirHandle;
              const segments = (n.folderPath ?? "").split("/").filter(Boolean);
              for (const segment of segments) {
                targetDir = await targetDir.getDirectoryHandle(segment, { create: true });
              }
              await requestPermissionIfAvailable(targetDir, "readwrite");
              const fileHandle = await targetDir.getFileHandle(n.fileName, { create: true });
              const writable = await fileHandle.createWritable();
              if (n.content.startsWith("data:")) {
                const res = await fetch(n.content);
                const blob = await res.blob();
                await writable.write(blob);
              } else if (n.content) {
                await writable.write(n.content);
              }
              await writable.close();
              const relPath = getRelativePath(n.folderPath || "", n.fileName);
              await setStoredFileHandle(relPath, fileHandle);
              await setStoredFileHandle(n.id, fileHandle);
            }
          }
        } catch (err) {
          console.warn("Failed to write restored file to File System Access:", err);
        }
      })();
    }

    replaceNotes([...newNotes, ...currentNotes]);

    if (newNotes.length === 1) {
      openTab(newNotes[0].id);
      toast({
        title: t("trash.title"),
        description: t("trash.restoreSuccess", { file: newNotes[0].fileName || newNotes[0].title || "Note" }),
      });
    } else {
      toast({
        title: t("trash.title"),
        description: t("trash.restoreBatchSuccess", { count: newNotes.length }),
      });
    }
  }, [restoreFromTrash, replaceNotes, openTab, openedRootDirHandle, t]);

  const handleDeletePermanently = useCallback((ids: string[]) => {
    deletePermanently(ids);
    toast({
      title: t("trash.title"),
      description: t("trash.deleteSuccess"),
    });
  }, [deletePermanently, t]);

  const handleEmptyTrash = useCallback(() => {
    emptyTrash();
    toast({
      title: t("trash.title"),
      description: t("trash.emptySuccess"),
    });
  }, [emptyTrash, t]);

  const handleDeleteNote = (id: string): boolean => {
    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return false;

    // Move to Trash initially
    moveToTrash(targetNote);

    if (targetNote.driveFileId && settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
      trashDriveNote(targetNote.driveFileId);
    }

    if (targetNote.fileName) {
      const relPath = getRelativePath(targetNote.folderPath || "", targetNote.fileName);
      trackDeletedRelativePath(relPath);
    }
    if (splitTabId === id) {
      setSplitTabId(null);
    }
    clearNoteEditorHistory(id);
    closeTab(id, notes.map((n) => n.id));
    const result = deleteNote(id);

    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.deleteFileOrFolder && targetNote.fileName) {
      void (async () => {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath) {
            const fullPath = targetNote.folderPath
              ? `${saved.folderPath}/${targetNote.folderPath}/${targetNote.fileName}`
              : `${saved.folderPath}/${targetNote.fileName}`;

            const isImg =
              targetNote.fileType === "image" ||
              targetNote.fileType === "binary" ||
              /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(targetNote.fileName || "");

            if (isImg && electronAPI.readFileBase64) {
              const b64 = await electronAPI.readFileBase64(fullPath);
              if (b64) {
                const ext = (targetNote.fileName || "").toLowerCase();
                const mime = ext.endsWith(".png")
                  ? "image/png"
                  : ext.endsWith(".gif")
                  ? "image/gif"
                  : ext.endsWith(".webp")
                  ? "image/webp"
                  : ext.endsWith(".svg")
                  ? "image/svg+xml"
                  : "image/jpeg";
                moveToTrash({ ...targetNote, content: `data:${mime};base64,${b64}` });
              }
            }

            await electronAPI.deleteFileOrFolder(fullPath);
            if (electronAPI.readWorkspaceTree) {
              const { entries, folderPaths } = await electronAPI.readWorkspaceTree(saved.folderPath);
              setOpenedFolderPaths(folderPaths);
              const currentNotes = notesRef.current.filter((n) => n.id !== id);
              const existingByPath = new Map(
                currentNotes
                  .filter((n) => n.fileName)
                  .map((n) => [n.folderPath ? `${n.folderPath}/${n.fileName}` : (n.fileName as string), n] as const)
              );
              const nextItems = entries.map((e: any) => mapTreeEntryToItem(e, existingByPath.get(e.relativePath)));
              replaceNotes(nextItems);
              removeTabsForDeletedNotes(new Set(nextItems.map((n) => n.id)));
            }
          }
        } catch (err) {
          console.warn("Electron deleteFileOrFolder failed in handleDeleteNote:", err);
        }
      })();
    }

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

          const isImg =
            targetNote.fileType === "image" ||
            targetNote.fileType === "binary" ||
            /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(fname);

          if (isImg) {
            try {
              const fileHandle = await targetDir.getFileHandle(fname);
              const file = await fileHandle.getFile();
              const reader = new FileReader();
              const dataUrl = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              });
              if (dataUrl) {
                moveToTrash({ ...targetNote, content: dataUrl });
              }
            } catch {}
          }

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

    const deletedFileName = targetNote.fileName || targetNote.title || t("editor.untitled");
    toast({
      title: t("trash.title"),
      description: t("trash.movedToTrash", { file: deletedFileName }),
      action: (
        <ToastAction altText={t("trash.undo")} onClick={() => handleRestoreFromTrash([targetNote.id])}>
          {t("trash.undo")}
        </ToastAction>
      ),
    });

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

  const handleCreateFromHomeTemplate = async (
    templateType: NoteTemplateType,
    explicitFormat?: "markdown" | "html" | "plain"
  ) => {
    const isTxt = explicitFormat ? explicitFormat === "plain" : settings.defaultExtension === "txt";
    const defaultExt = explicitFormat === "html" ? "html" : explicitFormat === "plain" ? "txt" : explicitFormat === "markdown" ? "md" : settings.defaultExtension || "md";
    const format: "markdown" | "html" | "plain" = explicitFormat || (defaultExt === "html" ? "html" : isTxt ? "plain" : "markdown");
    const meta = getNoteTemplateMetadata(templateType);
    const templateIcon = getTemplateIcon(templateType, settings.iconPack);
    const templateContent = getNoteTemplateContent(
      templateType,
      settings.language,
      format,
      settings.dateFormat,
      settings.timeFormat,
      settings.iconPack
    );
    const dateStr = formatDateForFileName(new Date(), settings.dateFormat);
    const prefix = meta.filePrefix || (templateType === "daily" ? "Daily" : "Note");
    const fileName = `${prefix}-${dateStr}.${defaultExt}`;
    const initialTitle = settings.language === "th" ? meta.defaultTitleTh : meta.defaultTitleEn;

    if (openedRootDirHandle || electronWorkspacePathRef.current) {
      const created = await createNoteInFolder(undefined, {
        fileName,
        contentFormat: format,
        initialContent: templateContent,
        icon: templateIcon,
        iconColor: meta.iconColor,
      });
      if (created?.id && templateIcon) {
        updateNote(created.id, {
          icon: templateIcon,
          iconColor: meta.iconColor,
        });
      }
    } else {
      const note = createNote();
      updateNote(note.id, {
        fileName,
        contentFormat: format,
        content: templateContent,
        title: initialTitle,
        icon: templateIcon || undefined,
        iconColor: meta.iconColor || undefined,
      });
      openTab(note.id);
    }
  };

  const handleCreateBlankFromHome = async () => {
    if (openedRootDirHandle) {
      await createNoteInFolder();
    } else {
      const note = createNote();
      openTab(note.id);
    }
  };

  if (isWorkspaceLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground select-none relative overflow-hidden">
        {/* Top Window Controls Drag Region */}
        <div
          className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-3 z-50 border-b border-border/20 bg-sidebar-accent/50"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 pl-1 select-none">
            <div className="relative flex h-[20px] w-[20px] items-center justify-center shrink-0">
              <img src={lunoLogo} alt="Luno Logo" className="h-[20px] w-auto object-contain shrink-0" />
            </div>
            <span className="font-krona text-[15px] font-normal tracking-tight text-foreground">Luno</span>
          </div>
          <WindowControls />
        </div>

        {/* Center Animated Loader */}
        <div className="flex flex-col items-center gap-4 text-center px-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative flex items-center justify-center py-2">
            <Loader2 className="h-9 w-9 text-primary animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              {(t as any)("sidebar.loadingWorkspaceTitle") || "Opening Workspace..."}
            </h2>
            <p className="text-xs text-muted-foreground max-w-[320px]">
              {(t as any)("sidebar.loadingWorkspaceDesc") || "Reading files and restoring workspace data..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isCloudWorkspace =
    settings.storageMode === "gdrive" &&
    !openedRootDirHandle &&
    !electronWorkspacePathRef.current &&
    Boolean(openedFolderName);

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
          onUpdateNote={handleUpdateNote}
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
          onCloseWorkspace={handleCloseWorkspace}
          sidebarWidth={settings.sidebarWidth}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
          confirmBeforeDelete={settings.confirmBeforeDelete}
          onRenameTagGlobally={renameTagGlobally}
          onDeleteTagGlobally={deleteTagGlobally}
          onToggleFavorite={(id) => {
            const n = notes.find((item) => item.id === id);
            if (n) handleUpdateNote(id, { isFavorite: !n.isFavorite });
          }}
          onOpenPinModal={handleOpenPinModal}
          onOpenSettings={() => handleOpenSettings()}
          isCloudWorkspace={isCloudWorkspace}
          isLoadingWorkspace={isWorkspaceLoading || (settings.storageMode === "gdrive" && syncStatus === "syncing")}
          onOpenWebTab={handleOpenWebTab}
          trashCount={trashedNotes.length}
        />
      </div>

      {/* Editor area responsive */}
      <div className="flex-1 flex flex-col min-w-0">
        {splitTabId && splitTabId !== activeTabId ? (
          <div className="flex flex-1 min-h-0 flex-row w-full">
            {/* Left Pane Group: TabBar + Breadcrumb + Editor */}
            <div
              className="min-w-0 border-r border-border flex flex-col h-full overflow-hidden"
              style={{ width: splitLeftWidth ? splitLeftWidth : "50%", minWidth: 120 }}
            >
              <TabBar
                tabs={openTabNotes}
                activeTabId={activeTabId}
                onSelectTab={setActiveTabId}
                onCloseTab={handleCloseTab}
                onSplitTab={(id) => {
                  setSplitTabId(prev => prev === id ? null : id);
                }}
                onNewTab={() => void createNoteInFolder()}
                onReorderTabs={reorderTabs}
              />
              {openedFolderName && activeTabNote && activeTabId !== "home" && activeTabId !== "trash" && activeTabId !== "settings" && activeTabId !== "luno-ai" && activeTabId !== "templates" && activeTabId !== "favorites" && activeTabId !== "tags" && !activeTabId?.startsWith("web:") && (
                <Breadcrumb
                  note={activeTabNote}
                  rootFolderName={openedFolderName}
                  notes={notes}
                  onSelectNote={setActiveTabId}
                  onOpenRightPanel={() => setRightPanelOpen((prev) => !prev)}
                  paneId="left"
                  isCloudWorkspace={isCloudWorkspace}
                />
              )}
              <div className="flex-1 min-h-0 flex flex-col overflow-auto">
                {!openedFolderName ? (
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                    <WorkspaceLauncher
                      onOpenFolder={handleOpenFolder}
                      onCreateWorkspace={handleCreateWorkspace}
                      onConnectGoogleDrive={handleConnectGoogleDriveDirect}
                      isCreating={isCreatingWorkspace}
                    />
                  </div>
                ) : (
                  <>
                    <div className={activeTabId === "home" ? "flex-1 min-h-0 flex flex-col" : "hidden"}>
                      {openTabIds.includes("home") && (
                        <HomeView
                          notes={notes}
                          onOpenNote={(id) => openTab(id)}
                          onCreateWithTemplate={handleCreateFromHomeTemplate}
                          onCreateBlankNote={handleCreateBlankFromHome}
                          onViewAllTemplates={() => openTab("templates")}
                          onToggleFavorite={(id) => {
                            const found = notes.find((n) => n.id === id);
                            if (found) {
                              handleUpdateNote(id, { isFavorite: !found.isFavorite });
                            }
                          }}
                          onOpenSearch={() => {
                            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
                          }}
                          onViewAllNotes={() => {
                            setSidebarOpen(true);
                            window.dispatchEvent(new CustomEvent("luno:filter-notes", { detail: "all" }));
                          }}
                          onViewAllFavorites={() => openTab("favorites")}
                        />
                      )}
                    </div>
                    <div className={activeTabId === "templates" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                      {openTabIds.includes("templates") && (
                        <TemplatesView
                          onCreateWithTemplate={handleCreateFromHomeTemplate}
                        />
                      )}
                    </div>
                    <div className={activeTabId === "favorites" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                      {openTabIds.includes("favorites") && (
                        <FavoritesTabView
                          notes={notes}
                          onOpenNote={(id) => openTab(id)}
                          onToggleFavorite={(id) => {
                            const found = notes.find((n) => n.id === id);
                            if (found) {
                              handleUpdateNote(id, { isFavorite: !found.isFavorite });
                            }
                          }}
                          onCreateBlankNote={handleCreateBlankFromHome}
                        />
                      )}
                    </div>
                    <div className={activeTabId === "tags" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                      {openTabIds.includes("tags") && (
                        <TagsTabView
                          notes={notes}
                          onOpenNote={(id) => openTab(id)}
                          onToggleFavorite={(id) => {
                            const found = notes.find((n) => n.id === id);
                            if (found) {
                              handleUpdateNote(id, { isFavorite: !found.isFavorite });
                            }
                          }}
                          onRenameTagGlobally={renameTagGlobally}
                          onDeleteTagGlobally={deleteTagGlobally}
                          onCreateBlankNote={handleCreateBlankFromHome}
                        />
                      )}
                    </div>
                    <div className={activeTabId === "trash" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                      {openTabIds.includes("trash") && (
                        <TrashView
                          trashedNotes={trashedNotes}
                          onRestore={handleRestoreFromTrash}
                          onDeletePermanently={handleDeletePermanently}
                          onEmptyTrash={handleEmptyTrash}
                          onOpenSettings={() => handleOpenSettings("files")}
                        />
                      )}
                    </div>
                    <div className={activeTabId === "settings" ? "flex-1 min-h-0 flex flex-col" : "hidden"}>
                      {openTabIds.includes("settings") && (
                        <SettingsTabView
                          initialCategory={settingsCategory}
                          onCategoryChange={setSettingsCategory}
                          onClose={() => closeTab("settings", notes.map((n) => n.id))}
                          notes={notes}
                          onNotesUpdated={replaceNotes}
                          openedFolderName={openedFolderName}
                          onCloseWorkspace={handleCloseWorkspace}
                          onOpenWebTab={handleOpenWebTab}
                        />
                      )}
                    </div>
                    <div className={activeTabId === "luno-ai" ? "w-full flex-1 flex flex-col min-h-0 min-w-0" : "hidden"}>
                      {openTabIds.includes("luno-ai") && (
                        <LunoAiView
                          notes={notes}
                          activeNote={splitTabNote ?? (notes.find((n) => n.id === openTabIds.find((id) => id !== "luno-ai" && id !== "settings" && !id.startsWith("web:"))) ?? notes[0] ?? null)}
                          onInsertToActiveNote={(text) => {
                            const targetNote = notes.find((n) => n.id === openTabIds.find((id) => id !== "luno-ai" && id !== "settings" && !id.startsWith("web:"))) ?? notes[0];
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
                            let targetName = fileName?.trim() || `Luno_Note_${Date.now().toString().slice(-4)}.md`;
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
                          onOpenWebTab={handleOpenWebTab}
                        />
                      )}
                    </div>
                    {openTabIds.filter((id) => id.startsWith("web:") || (id === activeTabId && activeTabNote?.fileType === "web-viewer")).map((webId) => (
                      <div
                        key={webId}
                        className={activeTabId === webId ? "w-full flex-1 flex flex-col min-h-0 min-w-0" : "hidden"}
                      >
                        <WebViewerView
                          initialUrl={webTabs[webId]?.url || (webId.startsWith("web:http") ? webId.replace(/^web:/, "") : "https://www.google.com")}
                          onUrlChange={(newUrl) => handleWebTabUrlChange(webId, newUrl)}
                          onTitleChange={(newTitle) => handleWebTabTitleChange(webId, newTitle)}
                          onFaviconChange={(icon) => handleWebTabFaviconChange(webId, icon)}
                          onInsertToActiveNote={handleInsertLinkToActiveNote}
                          onClose={() => handleCloseTab(webId)}
                          onSplit={() => setSplitTabId((prev) => (prev === webId ? null : webId))}
                          isSplit={splitTabId === webId}
                        />
                      </div>
                    ))}
                    <div className={(activeTabId === "home" || activeTabId === "trash" || activeTabId === "settings" || activeTabId === "luno-ai" || activeTabId === "templates" || activeTabId === "favorites" || activeTabId === "tags" || activeTabId?.startsWith("web:") || activeTabNote?.fileType === "web-viewer") ? "hidden" : "flex-1 min-h-0 flex flex-col"}>
                      <Editor
                        key="editor-pane-left"
                        note={activeEditorNote}
                        notes={notes}
                        onUpdate={handleUpdateNote}
                        onDelete={handleDeleteNote}
                        onDeleteFile={deleteFileInFolder}
                        onCreate={handleCreateNote}
                        onCreateFolder={createFolderInFolder}
                        onOpenFolder={handleOpenFolder}
                        onRenameFile={renameFileInFolder}
                        onDuplicateFile={duplicateFileInFolder}
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
                        onSelectNote={setActiveTabId}
                        onOpenWebTab={handleOpenWebTab}
                        onUnlockNote={handleUnlockNote}
                        onRelockNote={handleRelockNote}
                        onGetActivePin={handleGetActivePin}
                        paneId="left"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <SplitResizer
              onResize={delta => {
                setSplitLeftWidth(prev => {
                  const container = document.querySelector(".flex.flex-1.min-h-0.flex-row.w-full");
                  const total = container instanceof HTMLElement ? container.offsetWidth : 0;
                  const base = prev ?? (total ? total / 2 : 400);
                  let next = base + delta;
                  if (next < 120) next = 120;
                  if (total && next > total - 120) next = total - 120;
                  return next;
                });
              }}
            />

            {/* Right Pane Group: TabBar + Breadcrumb + Editor */}
            <div className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
              <TabBar
                tabs={openTabNotes.filter(n => n.id === splitTabId)}
                activeTabId={splitTabId}
                onSelectTab={(id) => setSplitTabId(id)}
                onCloseTab={(id) => {
                  if (id === splitTabId) {
                    clearNoteEditorHistory(id);
                    setSplitTabId(null);
                  } else {
                    handleCloseTab(id);
                  }
                }}
                onSplitTab={(id) => setSplitTabId(null)}
                onReorderTabs={reorderTabs}
              />
              {splitTabNote && splitTabNote.id !== "home" && splitTabNote.id !== "trash" && splitTabNote.id !== "settings" && splitTabNote.id !== "luno-ai" && splitTabNote.id !== "templates" && splitTabNote.id !== "favorites" && splitTabNote.id !== "tags" && !splitTabId?.startsWith("web:") && (
                <Breadcrumb
                  note={splitTabNote}
                  rootFolderName={openedFolderName}
                  notes={notes}
                  onSelectNote={(id) => setSplitTabId(id)}
                  onOpenRightPanel={() => setRightPanelOpen((prev) => !prev)}
                  paneId="right"
                  isCloudWorkspace={isCloudWorkspace}
                />
              )}
              <div className="flex-1 min-h-0 flex flex-col overflow-auto">
                <div className={splitTabId === "templates" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                  {splitTabId === "templates" && (
                    <TemplatesView
                      onCreateWithTemplate={handleCreateFromHomeTemplate}
                    />
                  )}
                </div>
                <div className={splitTabId === "favorites" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                  {splitTabId === "favorites" && (
                    <FavoritesTabView
                      notes={notes}
                      onOpenNote={(id) => setSplitTabId(id)}
                      onToggleFavorite={(id) => {
                        const found = notes.find((n) => n.id === id);
                        if (found) {
                          handleUpdateNote(id, { isFavorite: !found.isFavorite });
                        }
                      }}
                      onCreateBlankNote={handleCreateBlankFromHome}
                    />
                  )}
                </div>
                <div className={splitTabId === "tags" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                  {splitTabId === "tags" && (
                    <TagsTabView
                      notes={notes}
                      onOpenNote={(id) => setSplitTabId(id)}
                      onToggleFavorite={(id) => {
                        const found = notes.find((n) => n.id === id);
                        if (found) {
                          handleUpdateNote(id, { isFavorite: !found.isFavorite });
                        }
                      }}
                      onRenameTagGlobally={renameTagGlobally}
                      onDeleteTagGlobally={deleteTagGlobally}
                      onCreateBlankNote={handleCreateBlankFromHome}
                    />
                  )}
                </div>
                <div className={splitTabId === "trash" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                  {splitTabId === "trash" && (
                    <TrashView
                      trashedNotes={trashedNotes}
                      onRestore={handleRestoreFromTrash}
                      onDeletePermanently={handleDeletePermanently}
                      onEmptyTrash={handleEmptyTrash}
                      onOpenSettings={() => handleOpenSettings("files")}
                    />
                  )}
                </div>
                <div className={splitTabId === "settings" ? "flex-1 min-h-0 flex flex-col" : "hidden"}>
                  {splitTabId === "settings" && (
                    <SettingsTabView
                      initialCategory={settingsCategory}
                      onCategoryChange={setSettingsCategory}
                      onClose={() => setSplitTabId(null)}
                      notes={notes}
                      onNotesUpdated={replaceNotes}
                      openedFolderName={openedFolderName}
                      onCloseWorkspace={handleCloseWorkspace}
                      onOpenWebTab={handleOpenWebTab}
                    />
                  )}
                </div>
                <div className={splitTabId === "luno-ai" ? "w-full flex-1 flex flex-col min-h-0 min-w-0" : "hidden"}>
                  {splitTabId === "luno-ai" && (
                    <LunoAiView
                      notes={notes}
                      activeNote={splitTabNote}
                      onInsertToActiveNote={(text) => {
                        if (splitTabNote) {
                          const existingContent = splitTabNote.content || "";
                          const updatedContent = existingContent.trim() ? `${existingContent}\n\n${text}` : text;
                          updateNote(splitTabNote.id, { content: updatedContent });
                        }
                      }}
                      onInsertToSelectedNote={(targetNoteId, text) => {
                        const targetNote = notes.find((n) => n.id === targetNoteId);
                        if (targetNote) {
                          const existingContent = targetNote.content || "";
                          const updatedContent = existingContent.trim() ? `${existingContent}\n\n${text}` : text;
                          updateNote(targetNote.id, { content: updatedContent });
                        }
                      }}
                      onCreateNewNote={(fileName, content, folderPath) => {
                        let targetName = fileName?.trim() || `Luno_Note_${Date.now().toString().slice(-4)}.md`;
                        void createNoteInFolder(folderPath || "", { fileName: targetName, initialContent: content });
                      }}
                      onOpenSettings={(cat) => handleOpenSettings((cat as SettingsCategory) || "ai")}
                      onOpenWebTab={handleOpenWebTab}
                    />
                  )}
                </div>
                {splitTabId?.startsWith("web:") && (
                  <div className="w-full flex-1 flex flex-col min-h-0 min-w-0">
                    <WebViewerView
                      initialUrl={splitTabId ? (webTabs[splitTabId]?.url || (splitTabId.startsWith("web:http") ? splitTabId.replace(/^web:/, "") : "https://www.google.com")) : "https://www.google.com"}
                      onUrlChange={(newUrl) => handleWebTabUrlChange(splitTabId, newUrl)}
                      onTitleChange={(newTitle) => handleWebTabTitleChange(splitTabId, newTitle)}
                      onFaviconChange={(icon) => handleWebTabFaviconChange(splitTabId, icon)}
                      onInsertToActiveNote={handleInsertLinkToActiveNote}
                      onClose={() => setSplitTabId(null)}
                      onSplit={() => setSplitTabId(null)}
                      isSplit={true}
                    />
                  </div>
                )}
                <div className={(splitTabId === "home" || splitTabId === "trash" || splitTabId === "settings" || splitTabId === "luno-ai" || splitTabId === "templates" || splitTabId === "favorites" || splitTabId === "tags" || splitTabId?.startsWith("web:")) ? "hidden" : "flex-1 min-h-0 flex flex-col"}>
                  <Editor
                    key="editor-pane-right"
                    note={splitEditorNote}
                    notes={notes}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                    onDeleteFile={deleteFileInFolder}
                    onCreate={handleCreateNote}
                    onCreateFolder={createFolderInFolder}
                    onOpenFolder={handleOpenFolder}
                    onRenameFile={renameFileInFolder}
                    onDuplicateFile={duplicateFileInFolder}
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
                    onSelectNote={setSplitTabId}
                    onOpenWebTab={handleOpenWebTab}
                    onUnlockNote={handleUnlockNote}
                    onRelockNote={handleRelockNote}
                    onGetActivePin={handleGetActivePin}
                    paneId="right"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Single Pane Mode */
          <div className="flex-1 min-h-0 flex flex-col">
            <TabBar
              tabs={openTabNotes}
              activeTabId={activeTabId}
              onSelectTab={(id) => openTab(id)}
              onCloseTab={handleCloseTab}
              onSplitTab={(id) => setSplitTabId(id)}
              onNewTab={() => handleCreateBlankFromHome()}
              onReorderTabs={reorderTabs}
            />
            {activeTabNote && activeTabNote.id !== "home" && activeTabNote.id !== "trash" && activeTabNote.id !== "settings" && activeTabNote.id !== "luno-ai" && activeTabNote.id !== "templates" && activeTabNote.id !== "favorites" && activeTabNote.id !== "tags" && !activeTabId?.startsWith("web:") && (
              <Breadcrumb
                note={activeTabNote}
                rootFolderName={openedFolderName}
                notes={notes}
                onSelectNote={(id) => openTab(id)}
                onOpenRightPanel={() => setRightPanelOpen((prev) => !prev)}
                isCloudWorkspace={isCloudWorkspace}
              />
            )}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {!openedFolderName ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                  <WorkspaceLauncher
                    onOpenFolder={handleOpenFolder}
                    onCreateWorkspace={handleCreateWorkspace}
                    onConnectGoogleDrive={handleConnectGoogleDriveDirect}
                    onOpenCloudWorkspace={handleOpenCloudWorkspace}
                    onCreateCloudWorkspace={handleCreateCloudWorkspace}
                    isCreating={isCreatingWorkspace}
                  />
                </div>
              ) : (
                <>
                  <div className={activeTabId === "home" ? "flex-1 min-h-0 flex flex-col" : "hidden"}>
                    {openTabIds.includes("home") && (
                      <HomeView
                        notes={notes}
                        onOpenNote={(id) => openTab(id)}
                        onCreateWithTemplate={handleCreateFromHomeTemplate}
                        onCreateBlankNote={handleCreateBlankFromHome}
                        onViewAllTemplates={() => openTab("templates")}
                        onToggleFavorite={(id) => {
                          const found = notes.find((n) => n.id === id);
                          if (found) {
                            handleUpdateNote(id, { isFavorite: !found.isFavorite });
                          }
                        }}
                        onOpenSearch={() => {
                          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
                        }}
                        onViewAllNotes={() => {
                          setSidebarOpen(true);
                          window.dispatchEvent(new CustomEvent("luno:filter-notes", { detail: "all" }));
                        }}
                        onViewAllFavorites={() => openTab("favorites")}
                      />
                    )}
                  </div>
                  <div className={activeTabId === "templates" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                    {openTabIds.includes("templates") && (
                      <TemplatesView
                        onCreateWithTemplate={handleCreateFromHomeTemplate}
                      />
                    )}
                  </div>
                  <div className={activeTabId === "favorites" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                    {openTabIds.includes("favorites") && (
                      <FavoritesTabView
                        notes={notes}
                        onOpenNote={(id) => openTab(id)}
                        onToggleFavorite={(id) => {
                          const found = notes.find((n) => n.id === id);
                          if (found) {
                            handleUpdateNote(id, { isFavorite: !found.isFavorite });
                          }
                        }}
                        onCreateBlankNote={handleCreateBlankFromHome}
                      />
                    )}
                  </div>
                  <div className={activeTabId === "tags" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                    {openTabIds.includes("tags") && (
                      <TagsTabView
                        notes={notes}
                        onOpenNote={(id) => openTab(id)}
                        onToggleFavorite={(id) => {
                          const found = notes.find((n) => n.id === id);
                          if (found) {
                            handleUpdateNote(id, { isFavorite: !found.isFavorite });
                          }
                        }}
                        onRenameTagGlobally={renameTagGlobally}
                        onDeleteTagGlobally={deleteTagGlobally}
                        onCreateBlankNote={handleCreateBlankFromHome}
                      />
                    )}
                  </div>
                  <div className={activeTabId === "trash" ? "flex-1 min-h-0 min-w-0 w-full flex flex-col overflow-hidden" : "hidden"}>
                    {openTabIds.includes("trash") && (
                      <TrashView
                        trashedNotes={trashedNotes}
                        onRestore={handleRestoreFromTrash}
                        onDeletePermanently={handleDeletePermanently}
                        onEmptyTrash={handleEmptyTrash}
                        onOpenSettings={() => handleOpenSettings("files")}
                      />
                    )}
                  </div>
                  <div className={activeTabId === "settings" ? "flex-1 min-h-0 flex flex-col" : "hidden"}>
                    {openTabIds.includes("settings") && (
                      <SettingsTabView
                        initialCategory={settingsCategory}
                        onCategoryChange={setSettingsCategory}
                        onClose={() => closeTab("settings", notes.map((n) => n.id))}
                        notes={notes}
                        onNotesUpdated={replaceNotes}
                        openedFolderName={openedFolderName}
                        onCloseWorkspace={handleCloseWorkspace}
                        onOpenWebTab={handleOpenWebTab}
                      />
                    )}
                  </div>
                  <div className={activeTabId === "luno-ai" ? "w-full flex-1 flex flex-col min-h-0 min-w-0" : "hidden"}>
                    {openTabIds.includes("luno-ai") && (
                      <LunoAiView
                        notes={notes}
                        activeNote={notes.find((n) => n.id === openTabIds.find((id) => id !== "luno-ai" && id !== "settings" && !id.startsWith("web:"))) ?? notes[0] ?? null}
                        onInsertToActiveNote={(text) => {
                          const targetNote = notes.find((n) => n.id === openTabIds.find((id) => id !== "luno-ai" && id !== "settings" && !id.startsWith("web:"))) ?? notes[0];
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
                        onOpenWebTab={handleOpenWebTab}
                      />
                    )}
                  </div>
                  {openTabIds.filter((id) => id.startsWith("web:") || (id === activeTabId && activeTabNote?.fileType === "web-viewer")).map((webId) => (
                    <div
                      key={webId}
                      className={activeTabId === webId ? "w-full flex-1 flex flex-col min-h-0 min-w-0" : "hidden"}
                    >
                      <WebViewerView
                        initialUrl={webTabs[webId]?.url || (webId.startsWith("web:http") ? webId.replace(/^web:/, "") : "https://www.google.com")}
                        onUrlChange={(newUrl) => handleWebTabUrlChange(webId, newUrl)}
                        onTitleChange={(newTitle) => handleWebTabTitleChange(webId, newTitle)}
                        onFaviconChange={(icon) => handleWebTabFaviconChange(webId, icon)}
                        onInsertToActiveNote={handleInsertLinkToActiveNote}
                        onClose={() => handleCloseTab(webId)}
                        onSplit={() => setSplitTabId((prev) => (prev === webId ? null : webId))}
                        isSplit={splitTabId === webId}
                      />
                    </div>
                  ))}
                  <div className={(activeTabId === "home" || activeTabId === "trash" || activeTabId === "settings" || activeTabId === "luno-ai" || activeTabId === "templates" || activeTabId === "favorites" || activeTabId === "tags" || activeTabId?.startsWith("web:") || activeTabNote?.fileType === "web-viewer") ? "hidden" : "flex-1 min-h-0 flex flex-col"}>
                    <Editor
                      key="editor-pane-main"
                      note={activeEditorNote}
                      notes={notes}
                      onUpdate={handleUpdateNote}
                      onDelete={handleDeleteNote}
                      onDeleteFile={deleteFileInFolder}
                      onCreate={handleCreateNote}
                      onCreateFolder={createFolderInFolder}
                      onOpenFolder={handleOpenFolder}
                      onRenameFile={renameFileInFolder}
                      onDuplicateFile={duplicateFileInFolder}
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
                      onSelectNote={setActiveTabId}
                      onOpenWebTab={handleOpenWebTab}
                      onUnlockNote={handleUnlockNote}
                      onRelockNote={handleRelockNote}
                      onGetActivePin={handleGetActivePin}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6-Digit PIN Set / Remove / Change Modal */}
      <PinLockModal
        open={pinModalOpen}
        onOpenChange={setPinModalOpen}
        note={pinModalTargetNote}
        mode={pinModalMode}
        onConfirmSetPin={handleConfirmSetPin}
        onConfirmRemovePin={handleConfirmRemovePin}
        onConfirmChangePin={handleConfirmChangePin}
      />
    </div>
  );
}
