import React, { useState, useMemo, useRef, useCallback, useEffect, memo } from "react";
import { Note } from "@/hooks/useNotes";
import { isEncryptedNote } from "@/lib/noteCrypto";
import {
  Plus,
  Search,
  FileText,
  FileCode,
  FileImage,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  Copy,
  ClipboardList,
  Files,
  Pencil,
  Trash2,
  FolderArchive,
  Settings,
  Home,
  Compass,
  Star,
  Tag,
  HelpCircle,
  Sun,
  Moon,
  ArrowDown,
  X,
  LogOut,
  Cloud,
  Loader2,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Clock,
  Calendar,
  Check,
  ListFilter,
  Globe,
  Lock,
  Unlock,
  Key,
} from "lucide-react";
import { GoogleDriveIcon } from "@/components/icons/GoogleDriveIcon";
import { SparklesIcon as Sparkles } from "@/components/icons/SparklesIcon";
import lunoLogo from "@/assets/luno-logo.png";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelRightCloseIcon } from "@/components/icons/PanelRightCloseIcon";
import { PanelRightOpenIcon } from "@/components/icons/PanelRightOpenIcon";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getTagColorClass } from "@/lib/tagColors";
import { isMarkdownNote } from "@/lib/frontmatter";
import type { CreateNoteOptions, OpenFolderPending } from "@/lib/fileHandles";
import { renderCustomIcon, getToolbarIcon, getAutoFolderIconAndColor } from "@/lib/iconPacks";
import IconPickerDialog from "@/components/IconPickerDialog";

interface SidebarProps {
  notes: Note[];
  folderPaths?: string[];
  activeNoteId: string | null;
  openedFolderName?: string | null;
  pendingReconnectFolder?: boolean;
  onReconnectFolder?: () => void;
  onSelect: (id: string) => void;
  onUpdateNote?: (id: string, patch: Partial<Note>) => void;
  onCreate: (folderPath?: string, options?: CreateNoteOptions) => void | Promise<void>;
  onCreateFolder?: (folderPath?: string, folderName?: string) => void;
  onCopyFile?: (note: Note) => void;
  onCopyFiles?: (notes: Note[]) => void;
  onCopyFolder?: (folderPath: string) => void;
  onPasteToFolder?: (folderPath: string) => void;
  onDuplicateFile?: (note: Note) => void;
  onDuplicateFiles?: (notes: Note[]) => void;
  onDuplicateFolder?: (folderPath: string) => void;
  onRenameFile?: (note: Note, nextName: string) => void;
  onRenameFolder?: (folderPath: string, nextName: string) => void;
  onMoveFile?: (note: Note, targetFolderPath: string) => void;
  onMoveFolder?: (sourceFolderPath: string, targetFolderPath: string) => void;
  canPaste?: boolean;
  onDeleteFile?: (note: Note) => void;
  onDeleteFiles?: (notes: Note[]) => void;
  onDeleteFolder?: (folderPath: string) => void;
  onOpenFolder?: (pending?: OpenFolderPending) => void | Promise<void>;
  onCloseWorkspace?: () => void;
  confirmBeforeDelete?: boolean;
  sidebarWidth?: number;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  onOpenSidebar?: () => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
  onRenameTagGlobally?: (oldTag: string, newTag: string) => void;
  onDeleteTagGlobally?: (tagToDelete: string) => void;
  onToggleFavorite?: (noteId: string) => void;
  onOpenPinModal?: (note: Note, mode: "set" | "remove" | "change") => void;
  isCloudWorkspace?: boolean;
  isLoadingWorkspace?: boolean;
  onOpenWebTab?: (url: string, initialTitle?: string) => void;
  trashCount?: number;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  notes: Note[];
}

const HIDDEN_FOLDERS = new Set(["attachments", ".attachments", "assets", ".luno", "node_modules", "dist", "dist-desktop"]);
const OPEN_FOLDERS_STORAGE_PREFIX = "luno_open_folders_";
const LAST_WORKSPACE_STORAGE_KEY = "luno_last_workspace_name";

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore
  }
  return null;
}

function getInitialOpenFolders(openedFolderName?: string | null): Set<string> {
  if (!openedFolderName) return new Set(["__opened_root__"]);
  try {
    const storage = getLocalStorage();
    if (storage) {
      const raw = storage.getItem(OPEN_FOLDERS_STORAGE_PREFIX + openedFolderName);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          return new Set(arr);
        }
      }
    }
  } catch {}
  return new Set(["__opened_root__"]);
}

function isHiddenFolderPath(folderPath?: string): boolean {
  if (!folderPath) return false;
  const parts = folderPath.toLowerCase().split("/");
  return parts.some((p) => HIDDEN_FOLDERS.has(p) || (p.startsWith(".") && p !== "."));
}

export type WorkspaceSortBy =
  | "name-asc"
  | "name-desc"
  | "modified-desc"
  | "modified-asc"
  | "created-desc"
  | "created-asc";

const WORKSPACE_SORT_STORAGE_KEY = "luno_workspace_sort_by";

function sortNotesList(list: Note[], sortBy: WorkspaceSortBy): Note[] {
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case "name-desc":
        return (b.fileName || b.title || "").localeCompare(
          a.fileName || a.title || "",
          undefined,
          { numeric: true, sensitivity: "base" }
        );
      case "modified-desc":
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      case "modified-asc":
        return (a.updatedAt || 0) - (b.updatedAt || 0);
      case "created-desc":
        return (b.createdAt || 0) - (a.createdAt || 0);
      case "created-asc":
        return (a.createdAt || 0) - (b.createdAt || 0);
      case "name-asc":
      default:
        return (a.fileName || a.title || "").localeCompare(
          b.fileName || b.title || "",
          undefined,
          { numeric: true, sensitivity: "base" }
        );
    }
  });
}

function buildFolderTree(
  notes: Note[],
  folderPaths: string[] = [],
  openedFolderName?: string | null,
  sortBy: WorkspaceSortBy = "name-asc"
): FolderNode {
  const rootPath = openedFolderName ? "__opened_root__" : "";
  const rootName = openedFolderName || "";
  const root: FolderNode = { name: rootName, path: rootPath, children: [], notes: [] };
  const folderMap = new Map<string, FolderNode>();
  folderMap.set("", root);

  const getOrCreateFolder = (path: string): FolderNode => {
    if (!path) return root;
    if (folderMap.has(path)) return folderMap.get(path)!;
    const lastSlash = path.lastIndexOf("/");
    const name = lastSlash === -1 ? path : path.slice(lastSlash + 1);
    const parentPath = lastSlash === -1 ? "" : path.slice(0, lastSlash);
    const parent = getOrCreateFolder(parentPath);
    const node: FolderNode = { name, path, children: [], notes: [] };
    parent.children.push(node);
    folderMap.set(path, node);
    return node;
  };

  for (const note of notes) {
    const path = note.folderPath || "";
    if (isHiddenFolderPath(path)) continue;
    getOrCreateFolder(path).notes.push(note);
  }

  for (const path of folderPaths) {
    if (path && !isHiddenFolderPath(path)) getOrCreateFolder(path);
  }

  const sortNode = (node: FolderNode) => {
    node.children.sort((a, b) => {
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: "base" });
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });
    node.notes = sortNotesList(node.notes, sortBy);
    node.children.forEach(sortNode);
  };

  sortNode(root);

  return root;
}

import { formatDate as formatAppDate, formatTime as formatAppTime, formatDateForFileName } from "@/lib/dateTimeFormatter";

function formatSidebarDate(ts: number, dateFormat?: string, timeFormat?: string, lang?: string) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return formatAppTime(d, timeFormat || "24h", lang || "en");
  }
  return formatAppDate(d, dateFormat || "YYYY-MM-DD", lang || "en");
}

function decodeHtmlEntities(str: string): string {
  if (!str || !str.includes("&")) return str;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = str;
  return textarea.value;
}

function stripMarkdownAndFrontmatter(content: string): string {
  if (!content) return "";

  let text = content;

  // 1. Strip YAML frontmatter at top of file (--- ... ---)
  text = text.replace(/^---[\s\S]*?---\s*/g, "");

  // 2. Strip HTML tags
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<[^>]+>/g, " ");
  }

  // 3. Decode HTML entities (e.g. &#39; -> ', &quot; -> ", &amp; -> &)
  text = decodeHtmlEntities(text);

  // 3. Strip Markdown headings (#, ##, etc.)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // 4. Strip Markdown blockquotes (>)
  text = text.replace(/^\s*>\s*/gm, "");

  // 5. Strip Markdown list markers and checkboxes (- [ ], 1., -, *, +)
  text = text.replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");

  // 6. Strip Markdown code blocks & inline code
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`([^`]+)`/g, "$1");

  // 7. Strip Markdown links and images
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // 8. Strip Markdown formatting (*, **, _, __, ~~)
  text = text.replace(/(\*\*|__|[*_~]{1,2})/g, "");

  // 9. Normalize multiple spaces & linebreaks to single space
  return text.replace(/\s+/g, " ").trim();
}

function getThemeHighlightStyles(theme: string): React.CSSProperties {
  switch (theme) {
    case "rose":
    case "ruby":
      return {
        backgroundColor: "rgba(34, 211, 238, 0.35)", // Sky Cyan
        color: "inherit",
        padding: "0 2px",
        borderRadius: "2px",
        fontWeight: 500,
      };
    case "violet":
    case "fuchsia":
    case "indigo":
      return {
        backgroundColor: "rgba(163, 230, 53, 0.35)", // Lime Green
        color: "inherit",
        padding: "0 2px",
        borderRadius: "2px",
        fontWeight: 500,
      };
    case "orange":
    case "amber":
      return {
        backgroundColor: "rgba(99, 102, 241, 0.30)", // Electric Indigo Blue
        color: "inherit",
        padding: "0 2px",
        borderRadius: "2px",
        fontWeight: 500,
      };
    case "emerald":
    case "lime":
      return {
        backgroundColor: "rgba(251, 191, 36, 0.35)", // Warm Golden Amber
        color: "inherit",
        padding: "0 2px",
        borderRadius: "2px",
        fontWeight: 500,
      };
    case "blue":
    case "cyan":
      return {
        backgroundColor: "rgba(251, 146, 60, 0.35)", // Coral Orange
        color: "inherit",
        padding: "0 2px",
        borderRadius: "2px",
        fontWeight: 500,
      };
    case "slate":
    default:
      return {
        backgroundColor: "rgba(234, 179, 8, 0.35)", // Bright Gold
        color: "inherit",
        padding: "0 2px",
        borderRadius: "2px",
        fontWeight: 500,
      };
  }
}

function highlightMatchText(text: string, searchQuery: string, appTheme: string = "emerald"): React.ReactNode {
  if (!searchQuery.trim() || !text) return text;

  const escapedQuery = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);
  const style = getThemeHighlightStyles(appTheme);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={style}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSearchPreviewSnippet(content: string, title: string, query: string, noContentLabel: string) {
  const cleanText = stripMarkdownAndFrontmatter(content);
  if (!cleanText) return title.trim() || noContentLabel;

  const q = query.trim().toLowerCase();
  if (!q) {
    return cleanText.length > 85 ? cleanText.slice(0, 85) + "…" : cleanText;
  }

  const matchIndex = cleanText.toLowerCase().indexOf(q);
  if (matchIndex === -1) {
    return cleanText.length > 85 ? cleanText.slice(0, 85) + "…" : cleanText;
  }

  const start = Math.max(0, matchIndex - 20);
  const end = Math.min(cleanText.length, matchIndex + q.length + 55);
  let snippet = cleanText.slice(start, end);

  if (start > 0) snippet = "…" + snippet;
  if (end < cleanText.length) snippet = snippet + "…";

  return snippet;
}

function getPreview(content: string, title: string, noContentLabel: string) {
  if (isEncryptedNote(content)) {
    return "••••••";
  }
  const cleanText = stripMarkdownAndFrontmatter(content);
  if (!cleanText) {
    const fallbackTitle = title.trim();
    return fallbackTitle || noContentLabel;
  }
  return cleanText.length > 85 ? cleanText.slice(0, 85) + "…" : cleanText;
}

function getFileType(note: Note): "txt" | "md" | "html" | "css" | "image" | "binary" | "zip" | "unknown" {
  if (note.fileType === "image") return "image";
  if (note.fileType === "binary") return "binary";
  const name = note.fileName?.toLowerCase() || "";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (name.endsWith(".html") || name.endsWith(".htm")) return "html";
  if (name.endsWith(".css") || note.contentFormat === "css") return "css";
  if (name.endsWith(".zip")) return "zip";
  return "unknown";
}

function NoteIcon({ note, active }: { note: Note; active: boolean }) {
  const { settings } = useAppSettings();
  const pack = settings?.iconPack || "lucide";
  const cls = `h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`;
  const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
  const customIcon = note.icon || (relPath && settings?.fileIcons?.[relPath]?.icon);
  const customColor = note.iconColor || (relPath && settings?.fileIcons?.[relPath]?.color);
  if (customIcon) {
    const custom = renderCustomIcon(customIcon, cls, { color: customColor });
    if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
  }
  if (note.isLocked) {
    const LockIcon = getToolbarIcon("lock", pack);
    return <LockIcon className={cls} />;
  }
  const type = getFileType(note);
  const name = note.fileName?.toLowerCase() || "";
  if (name.endsWith(".zip") || type === "zip") {
    const ZipIcon = getToolbarIcon("fileZip", pack);
    return <ZipIcon className={cls} />;
  }
  if (type === "md" || type === "html" || type === "css") {
    const CodeIcon = getToolbarIcon("fileCode", pack);
    return <CodeIcon className={cls} />;
  }
  if (type === "image") {
    const ImgIcon = getToolbarIcon("fileImage", pack);
    return <ImgIcon className={cls} />;
  }
  if (type === "binary") {
    const FileIcon = getToolbarIcon("file", pack);
    return <FileIcon className={cls} />;
  }
  const TextIcon = getToolbarIcon("fileText", pack);
  return <TextIcon className={cls} />;
}

function MarkdownIndicator({ active, className = "" }: { active: boolean; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`flex shrink-0 items-center justify-end gap-[1px] text-[10px] font-bold leading-none select-none cursor-default ${
            active ? "text-primary opacity-90" : "text-muted-foreground/70"
          } ${className}`}
          aria-label="Markdown"
        >
          <span>M</span>
          <ArrowDown className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={4}>
        Markdown
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarComponent({ notes, folderPaths = [], activeNoteId, openedFolderName, pendingReconnectFolder = false, onReconnectFolder, onSelect, onUpdateNote, onCreate, onCreateFolder, onCopyFile, onCopyFiles, onCopyFolder, onPasteToFolder, onDuplicateFile, onDuplicateFiles, onDuplicateFolder, onRenameFile, onRenameFolder, onMoveFile, onMoveFolder, canPaste = false, onDeleteFile, onDeleteFiles, onDeleteFolder, onOpenFolder, onCloseWorkspace, confirmBeforeDelete = false, sidebarWidth = 280, isMobile = false, sidebarOpen = true, onOpenSidebar, onClose, onOpenSettings, onRenameTagGlobally, onDeleteTagGlobally, onToggleFavorite, onOpenPinModal, isCloudWorkspace = false, isLoadingWorkspace = false, onOpenWebTab, trashCount = 0 }: SidebarProps) {
  const { settings, updateSetting, setFolderIcon, removeFolderIcon, moveFolderIcons, setFileIcon, removeFileIcon } = useAppSettings();
  const [iconPickerTarget, setIconPickerTarget] = useState<{ type: "folder"; path: string } | { type: "note"; note: Note } | null>(null);
  const [query, setQuery] = useState("");
  const [navFilter, setNavFilter] = useState<"all" | "explore" | "favorites" | "tags" | "trash">("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleFilterEvent = (e: Event) => {
      const custom = e as CustomEvent<"all" | "explore" | "favorites" | "tags" | "trash">;
      if (custom.detail) {
        setNavFilter(custom.detail);
        setQuery("");
      }
    };
    const handleFocusSearch = () => {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        } else {
          const input = document.querySelector<HTMLInputElement>('input[data-sidebar-search="true"]');
          input?.focus();
          input?.select();
        }
      }, 50);
    };
    window.addEventListener("luno:filter-notes", handleFilterEvent);
    window.addEventListener("luno:focus-sidebar-search", handleFocusSearch);
    return () => {
      window.removeEventListener("luno:filter-notes", handleFilterEvent);
      window.removeEventListener("luno:focus-sidebar-search", handleFocusSearch);
    };
  }, []);

  const [renameTagModalOpen, setRenameTagModalOpen] = useState(false);
  const [renameTagOldName, setRenameTagOldName] = useState("");
  const [renameTagNewName, setRenameTagNewName] = useState("");
  const [deleteTagModalOpen, setDeleteTagModalOpen] = useState(false);
  const [deleteTagTarget, setDeleteTagTarget] = useState("");

  const [openFolders, setOpenFolders] = useState<Set<string>>(() =>
    getInitialOpenFolders(openedFolderName)
  );
  const prevWorkspaceRef = useRef<string | null | undefined>(openedFolderName);


  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");
  const [sortBy, setSortBy] = useState<WorkspaceSortBy>(() => {
    try {
      const storage = getLocalStorage();
      const saved = storage?.getItem(WORKSPACE_SORT_STORAGE_KEY) as WorkspaceSortBy;
      if (
        saved &&
        [
          "name-asc",
          "name-desc",
          "modified-desc",
          "modified-asc",
          "created-desc",
          "created-asc",
        ].includes(saved)
      ) {
        return saved;
      }
    } catch {
      // fallback
    }
    return "name-asc";
  });

  const handleSortChange = (newSort: WorkspaceSortBy) => {
    setSortBy(newSort);
    try {
      const storage = getLocalStorage();
      storage?.setItem(WORKSPACE_SORT_STORAGE_KEY, newSort);
    } catch {
      // ignore
    }
  };
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<null | { kind: "file" | "folder"; fileName?: string; contentFormat?: "plain" | "markdown" | "html" | "css"; folderName?: string }>(null);

  const openFolderBeforeCreation = () => {
    if (!openedFolderName && onOpenFolder) {
      onOpenFolder();
      return true;
    }
    return false;
  };

  const openCreateFileDialog = (targetFolder?: string | React.MouseEvent) => {
    if (typeof targetFolder === "string") {
      setSelectedFolderPath(targetFolder);
    } else {
      setSelectedFolderPath(currentFolderPath);
    }
    setNewFileExt(settings.defaultExtension);
    setCreateFileDialogOpen(true);
  };

  const openCreateFolderDialog = (targetFolder?: string | React.MouseEvent) => {
    if (typeof targetFolder === "string") {
      setSelectedFolderPath(targetFolder);
    } else {
      setSelectedFolderPath(currentFolderPath);
    }
    setCreateFolderDialogOpen(true);
  };
  const [renameFileDialogOpen, setRenameFileDialogOpen] = useState(false);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileExt, setNewFileExt] = useState<"txt" | "md" | "html">(() => settings.defaultExtension);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [lastSelectedNoteId, setLastSelectedNoteId] = useState<string | null>(null);
  const [renameFileName, setRenameFileName] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");
  const [renameTargetNote, setRenameTargetNote] = useState<Note | null>(null);
  const [renameTargetFolderPath, setRenameTargetFolderPath] = useState<string>("");
  const [draggedItem, setDraggedItem] = useState<{ kind: "file" | "folder"; note?: Note; notes?: Note[]; folderPath?: string } | null>(null);
  const [dropTargetFolderPath, setDropTargetFolderPath] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmTargets, setDeleteConfirmTargets] = useState<Note[]>([]);
  // State for folder delete confirmation
  const [deleteFolderConfirmOpen, setDeleteFolderConfirmOpen] = useState(false);
  const [deleteFolderTargetPath, setDeleteFolderTargetPath] = useState<string | null>(null);
    const handleDeleteFolderFromContext = (folderPath: string) => {
      if (confirmBeforeDelete) {
        setDeleteFolderTargetPath(folderPath);
        setDeleteFolderConfirmOpen(true);
      } else {
        onDeleteFolder?.(folderPath);
      }
    };

    const handleDeleteFolderConfirmed = () => {
      if (deleteFolderTargetPath) {
        onDeleteFolder?.(deleteFolderTargetPath);
      }
      setDeleteFolderConfirmOpen(false);
      setDeleteFolderTargetPath(null);
    };
  const dragExpandTimeoutRef = useRef<number | null>(null);
  const { t, language } = useTranslation();
  const isTh = language === "th";

  const handleFocusSearchFromCollapsed = () => {
    onOpenSidebar?.();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("luno:focus-sidebar-search"));
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    }, 50);
  };
  const activeNote = useMemo(() => notes.find((n) => n.id === activeNoteId) ?? null, [notes, activeNoteId]);
  const currentFolderPath = activeNote?.folderPath || "";

  useEffect(() => {
    setSelectedFolderPath(currentFolderPath);
  }, [currentFolderPath]);

  // Complete pending creation when a folder gets opened
  useEffect(() => {
    if (!pendingCreate) return;
    if (!openedFolderName) return;

    if (pendingCreate.kind === "file") {
      const defaultExt = settings.defaultExtension || "md";
      const defaultFormat = defaultExt === "html" ? "html" as const : defaultExt === "txt" ? "plain" as const : "markdown" as const;
      const fileName = pendingCreate.fileName ?? `Untitled.${defaultExt}`;
      const contentFormat = pendingCreate.contentFormat ?? defaultFormat;
      onCreate(selectedFolderPath || currentFolderPath, { fileName, contentFormat });
    } else if (pendingCreate.kind === "folder") {
      if (onCreateFolder) onCreateFolder(selectedFolderPath || currentFolderPath, pendingCreate.folderName ?? "Untitled");
    }

    setPendingCreate(null);
  }, [openedFolderName, pendingCreate, onCreate, onCreateFolder, selectedFolderPath, currentFolderPath]);

  const hasTreeView = useMemo(
    () => Boolean(openedFolderName) || notes.some((n) => n.folderPath !== undefined) || folderPaths.length > 0,
    [openedFolderName, notes, folderPaths]
  );

  const effectiveNotes = useMemo(() => (openedFolderName ? notes : []), [openedFolderName, notes]);

  const vaultTagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of effectiveNotes) {
      if (isMarkdownNote(n) && n.tags) {
        for (const t of n.tags) {
          const norm = t.trim();
          if (norm) {
            const lower = norm.toLowerCase();
            map.set(lower, (map.get(lower) || 0) + 1);
          }
        }
      }
    }
    const result: Array<{ tag: string; lower: string; count: number }> = [];
    const seenLower = new Set<string>();
    for (const n of effectiveNotes) {
      if (isMarkdownNote(n) && n.tags) {
        for (const t of n.tags) {
          const norm = t.trim();
          const lower = norm.toLowerCase();
          if (norm && !seenLower.has(lower)) {
            seenLower.add(lower);
            result.push({ tag: norm, lower, count: map.get(lower) || 0 });
          }
        }
      }
    }
    return result.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [effectiveNotes]);

  const favoriteNotesCount = useMemo(
    () => effectiveNotes.filter((n) => n.isFavorite).length,
    [effectiveNotes]
  );

  const filtered = useMemo(
    () => {
      let list = effectiveNotes;

      if (navFilter === "favorites") {
        list = list.filter((n) => n.isFavorite);
      }

      if (selectedTagFilter) {
        const targetLower = selectedTagFilter.toLowerCase();
        list = list.filter((n) => n.tags?.some((t) => t.toLowerCase() === targetLower));
      }

      if (query) {
        const q = query.trim().toLowerCase();
        if (q.startsWith("#")) {
          const tagQ = q.slice(1);
          list = list.filter((n) => n.tags?.some((t) => t.toLowerCase().includes(tagQ)));
        } else {
          list = list.filter((n) => {
            const titleMatch = n.title?.toLowerCase().includes(q);
            const fileNameMatch = n.fileName?.toLowerCase().includes(q);
            const contentMatch = n.content?.toLowerCase().includes(q);
            const tagMatch = n.tags?.some((t) => t.toLowerCase().includes(q));
            return titleMatch || fileNameMatch || contentMatch || tagMatch;
          });
        }
      }

      return sortNotesList(list, sortBy);
    },
    [effectiveNotes, query, navFilter, selectedTagFilter, sortBy],
  );

  const folderTree = useMemo(
    () => buildFolderTree(effectiveNotes, folderPaths, openedFolderName, sortBy),
    [effectiveNotes, folderPaths, openedFolderName, sortBy]
  );

  useEffect(() => {
    if (!openedFolderName) {
      prevWorkspaceRef.current = null;
      setOpenFolders(new Set(["__opened_root__"]));
      return;
    }

    if (prevWorkspaceRef.current !== openedFolderName) {
      prevWorkspaceRef.current = openedFolderName;
      try {
        const storage = getLocalStorage();
        if (storage) {
          storage.setItem(LAST_WORKSPACE_STORAGE_KEY, openedFolderName);
          const raw = storage.getItem(OPEN_FOLDERS_STORAGE_PREFIX + openedFolderName);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length > 0) {
              setOpenFolders(new Set(arr));
              return;
            }
          }
          const rootOnly = new Set(["__opened_root__"]);
          storage.setItem(OPEN_FOLDERS_STORAGE_PREFIX + openedFolderName, JSON.stringify(Array.from(rootOnly)));
          setOpenFolders(rootOnly);
        } else {
          setOpenFolders(new Set(["__opened_root__"]));
        }
      } catch {
        setOpenFolders(new Set(["__opened_root__"]));
      }
    }
  }, [openedFolderName]);

  // Persist openFolders whenever they change for the current workspace
  useEffect(() => {
    if (!openedFolderName) return;
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(LAST_WORKSPACE_STORAGE_KEY, openedFolderName);
        storage.setItem(
          OPEN_FOLDERS_STORAGE_PREFIX + openedFolderName,
          JSON.stringify(Array.from(openFolders))
        );
      }
    } catch {
      // Ignore storage errors
    }
  }, [openFolders, openedFolderName]);
  const getVisibleNotesInTree = (node: FolderNode, openFolderSet: Set<string>): Note[] => {
    const result: Note[] = [];
    const traverse = (n: FolderNode) => {
      const isRoot = (n.path === "" && !n.name) || n.path === "__opened_root__";
      const isOpen = isRoot || openFolderSet.has(n.path);
      if (!isOpen) return;

      result.push(...n.notes);
      for (const child of n.children) {
        traverse(child);
      }
    };
    traverse(node);
    return result;
  };

  const selectableNotes = useMemo(() => {
    if (hasTreeView && !query && !selectedTagFilter) {
      return getVisibleNotesInTree(folderTree, openFolders);
    }
    return query || selectedTagFilter || !hasTreeView ? filtered : effectiveNotes;
  }, [hasTreeView, query, selectedTagFilter, folderTree, openFolders, filtered, effectiveNotes]);

  const setSingleSelectedNote = (noteId: string) => {
    setSelectedNoteIds(new Set([noteId]));
    setLastSelectedNoteId(noteId);
  };

  const handleNoteSelection = (noteId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    // Right click (button === 2)
    if (event.button === 2) {
      if (selectedNoteIds.has(noteId)) {
        // Right-clicking on an already-selected file preserves the multi-selection for context actions
        return;
      }
      setSingleSelectedNote(noteId);
      return;
    }

    // Ignore non-left click
    if (event.button !== 0) {
      return;
    }

    if (event.shiftKey && lastSelectedNoteId) {
      const ids = selectableNotes.map((n) => n.id);
      const start = ids.indexOf(lastSelectedNoteId);
      const end = ids.indexOf(noteId);
      if (start !== -1 && end !== -1) {
        const [from, to] = start < end ? [start, end] : [end, start];
        setSelectedNoteIds(new Set(ids.slice(from, to + 1)));
      } else {
        setSingleSelectedNote(noteId);
      }
    } else if (event.ctrlKey || event.metaKey) {
      setSelectedNoteIds((prev) => {
        const next = new Set(prev);
        if (next.has(noteId)) next.delete(noteId);
        else next.add(noteId);
        if (next.size === 0) next.add(noteId);
        return next;
      });
      setLastSelectedNoteId(noteId);
    } else {
      setSingleSelectedNote(noteId);
    }
  };

  const getContextTargetNotes = (note: Note) => {
    const activeIds = selectedNoteIds.has(note.id) && selectedNoteIds.size > 0
      ? selectedNoteIds
      : new Set([note.id]);
    return notes.filter((n) => activeIds.has(n.id));
  };

  const handleCopyFromContext = (note: Note) => {
    const targets = getContextTargetNotes(note);
    if (targets.length > 1) onCopyFiles?.(targets);
    else onCopyFile?.(targets[0]);
  };

  const handleDuplicateFromContext = (note: Note) => {
    const targets = getContextTargetNotes(note);
    if (targets.length > 1) onDuplicateFiles?.(targets);
    else onDuplicateFile?.(targets[0]);
  };

  const handleDeleteFromContext = (note: Note) => {
    const targets = getContextTargetNotes(note);
    if (confirmBeforeDelete) {
      setDeleteConfirmTargets(targets);
      setDeleteConfirmOpen(true);
    } else if (targets.length > 1) {
      onDeleteFiles?.(targets);
    } else {
      onDeleteFile?.(targets[0]);
    }
  };

  const handleDeleteConfirmed = () => {
    if (deleteConfirmTargets.length > 1) onDeleteFiles?.(deleteConfirmTargets);
    else if (deleteConfirmTargets.length === 1) onDeleteFile?.(deleteConfirmTargets[0]);
    setDeleteConfirmOpen(false);
    setDeleteConfirmTargets([]);
  };

  const handleDropToFolder = (rawTargetFolderPath: string) => {
    if (!draggedItem) return;

    const targetFolderPath = rawTargetFolderPath === "__opened_root__" ? "" : rawTargetFolderPath;

    if (draggedItem.kind === "file") {
      if (draggedItem.notes && draggedItem.notes.length > 0) {
        for (const n of draggedItem.notes) {
          onMoveFile?.(n, targetFolderPath);
        }
      } else if (draggedItem.note) {
        onMoveFile?.(draggedItem.note, targetFolderPath);
      }
    }

    if (draggedItem.kind === "folder" && draggedItem.folderPath) {
      const folderName = draggedItem.folderPath.split("/").filter(Boolean).pop() || draggedItem.folderPath;
      const newFolderPath = targetFolderPath ? `${targetFolderPath}/${folderName}` : folderName;
      moveFolderIcons(draggedItem.folderPath, newFolderPath);
      onMoveFolder?.(draggedItem.folderPath, targetFolderPath);
    }

    setDraggedItem(null);
    setDropTargetFolderPath(null);
    if (dragExpandTimeoutRef.current) {
      window.clearTimeout(dragExpandTimeoutRef.current);
      dragExpandTimeoutRef.current = null;
    }
  };

  const scheduleFolderExpandOnDrag = (folderPath: string, isOpen: boolean) => {
    if (isOpen) return;
    if (dragExpandTimeoutRef.current) {
      window.clearTimeout(dragExpandTimeoutRef.current);
    }

    dragExpandTimeoutRef.current = window.setTimeout(() => {
      setOpenFolders((prev) => {
        if (prev.has(folderPath)) return prev;
        const next = new Set(prev);
        next.add(folderPath);
        return next;
      });
      dragExpandTimeoutRef.current = null;
    }, 350);
  };

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleCreateFromDialog = async () => {
    const baseName = newFileName.trim();
    const ext = newFileExt || settings.defaultExtension;
    const contentFormat = ext === "md" ? "markdown" : ext === "html" ? "html" : ext === "css" ? "css" : "plain";

    const dateStr = formatDateForFileName(new Date(), settings.dateFormat);
    let defaultBaseName = "Untitled";
    if (settings.newFilePattern === "date") {
      defaultBaseName = `Note_${dateStr}`;
    } else if (settings.newFilePattern === "daily") {
      defaultBaseName = `Daily-${dateStr}`;
    }

    const fileName = baseName ? `${baseName}.${ext}` : `${defaultBaseName}.${ext}`;

    if (!openedFolderName && onOpenFolder) {
      setPendingCreate({ kind: "file", fileName, contentFormat });
      setCreateFileDialogOpen(false);
      setNewFileName("");
      setNewFileExt(settings.defaultExtension);
      onOpenFolder({ kind: "file", fileName, contentFormat });
      return;
    }

    const targetFolder = selectedFolderPath || currentFolderPath;
    if (targetFolder) {
      setOpenFolders((prev) => {
        const next = new Set(prev);
        next.add("__opened_root__");
        const parts = targetFolder.split("/");
        let current = "";
        for (const p of parts) {
          current = current ? `${current}/${p}` : p;
          next.add(current);
        }
        return next;
      });
    }

    const createdNote = await onCreate(targetFolder, { fileName, contentFormat });
    setCreateFileDialogOpen(false);
    setNewFileName("");
    setNewFileExt(settings.defaultExtension);
    if (createdNote?.id) {
      onSelect(createdNote.id);
    }
  };

  const handleCreateFolderFromDialog = () => {
    if (!onCreateFolder) return;
    const safeFolderName = newFolderName.trim().replace(/[\\/:*?"<>|]/g, "_");
    const folderName = safeFolderName || "Untitled";

    if (!openedFolderName && onOpenFolder) {
      setPendingCreate({ kind: "folder", folderName });
      setCreateFolderDialogOpen(false);
      setNewFolderName("");
      onOpenFolder({ kind: "folder", folderName });
      return;
    }

    const targetFolder = selectedFolderPath || currentFolderPath;
    if (targetFolder) {
      setOpenFolders((prev) => {
        const next = new Set(prev);
        next.add("__opened_root__");
        const parts = targetFolder.split("/");
        let current = "";
        for (const p of parts) {
          current = current ? `${current}/${p}` : p;
          next.add(current);
        }
        return next;
      });
    }

    const fullFolderPath = targetFolder ? `${targetFolder}/${folderName}` : folderName;
    const autoIcon = (settings.autoFolderIcons !== false)
      ? getAutoFolderIconAndColor(folderName, settings.iconPack || "lucide")
      : null;
    if (autoIcon) {
      setFolderIcon(fullFolderPath, autoIcon.icon, autoIcon.color);
    }

    onCreateFolder(targetFolder, folderName);
    setCreateFolderDialogOpen(false);
    setNewFolderName("");
  };

  const handleRenameFileFromDialog = () => {
    if (!renameTargetNote || !onRenameFile) return;
    const safeName = renameFileName.trim().replace(/[\\/:*?"<>|]/g, "_");
    if (!safeName) return;
    onRenameFile(renameTargetNote, safeName);
    setRenameFileDialogOpen(false);
    setRenameTargetNote(null);
    setRenameFileName("");
  };

  const handleRenameFolderFromDialog = () => {
    if (!renameTargetFolderPath || !onRenameFolder) return;
    const safeName = renameFolderName.trim().replace(/[\\/:*?"<>|]/g, "_");
    if (!safeName) return;

    const segments = renameTargetFolderPath.split("/").filter(Boolean);
    const parentPath = segments.slice(0, -1).join("/");
    const newFolderPath = parentPath ? `${parentPath}/${safeName}` : safeName;

    if (settings.folderIcons?.[renameTargetFolderPath]) {
      moveFolderIcons(renameTargetFolderPath, newFolderPath);
    } else {
      const autoIcon = (settings.autoFolderIcons !== false)
        ? getAutoFolderIconAndColor(safeName, settings.iconPack || "lucide")
        : null;
      if (autoIcon) {
        setFolderIcon(newFolderPath, autoIcon.icon, autoIcon.color);
      }
    }

    onRenameFolder(renameTargetFolderPath, safeName);
    setRenameFolderDialogOpen(false);
    setRenameTargetFolderPath("");
    setRenameFolderName("");
  };

  const renderNote = (note: Note, depth = 0) => {
    // In directory mode, show actual file name to match folder structure.
    const noteLabel = hasTreeView ? (note.fileName?.trim() || t("editor.untitled")) : (note.title || t("editor.untitled"));
    const isMarkdownNote = Boolean(
      note.fileName?.toLowerCase().endsWith(".md") ||
      note.fileName?.toLowerCase().endsWith(".markdown") ||
      note.contentFormat === "markdown"
    );

    const isMultiSelected = selectedNoteIds.has(note.id) && selectedNoteIds.size > 1;
    const targetNotes = isMultiSelected ? notes.filter((n) => selectedNoteIds.has(n.id)) : [note];
    const targetCount = targetNotes.length;
    const allFavorited = targetNotes.every((n) => n.isFavorite);

    if (hasTreeView && !query) {
      return (
        <ContextMenu key={note.id}>
          <ContextMenuTrigger asChild>
            <button
              onClick={(event) => {
                if (event.shiftKey || event.ctrlKey || event.metaKey) {
                  return;
                }
                onSelect(note.id);
                if (isMobile) onClose?.();
              }}
              draggable
              onDragStart={() => {
                const isMulti = selectedNoteIds.has(note.id) && selectedNoteIds.size > 1;
                const dragNotes = isMulti ? notes.filter((n) => selectedNoteIds.has(n.id)) : [note];
                setDraggedItem({ kind: "file", note, notes: dragNotes });
              }}
              onDragEnd={() => {
                setDraggedItem(null);
                setDropTargetFolderPath(null);
              }}
              onMouseDown={(event) => handleNoteSelection(note.id, event)}
              onContextMenu={() => {
                if (!selectedNoteIds.has(note.id)) setSingleSelectedNote(note.id);
              }}
              className={`flex w-full items-center gap-1.5 px-3 ${settings.sidebarDensity === "compact" ? "py-1 text-[12.5px]" : "py-1.5 text-[13px]"} text-left transition-colors rounded-lg outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 select-none ${
                activeNoteId === note.id || selectedNoteIds.has(note.id)
                  ? "bg-sidebar-accent text-foreground font-semibold"
                  : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
              }`}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
            >
              <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <NoteIcon note={note} active={activeNoteId === note.id} />
              <span className={`truncate ${activeNoteId === note.id ? "font-semibold text-primary" : "font-normal"}`}>{noteLabel}</span>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                {isMarkdownNote && <MarkdownIndicator active={activeNoteId === note.id} />}
                {note.isFavorite && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
              </div>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48 rounded-xl">
            {!isMultiSelected && (
              <>
                <ContextMenuItem onClick={() => setIconPickerTarget({ type: "note", note })} className="gap-2">
                  {note.icon ? (
                    renderCustomIcon(note.icon, "h-4 w-4 shrink-0", { color: note.iconColor })
                  ) : (
                    <NoteIcon note={note} active={false} />
                  )}
                  <span>{t("sidebar.changeIcon") || "Change Icon"}</span>
                </ContextMenuItem>
                {note.icon && (
                  <ContextMenuItem onClick={() => onUpdateNote?.(note.id, { icon: undefined, iconColor: undefined })} className="gap-2 text-muted-foreground hover:text-foreground">
                    <Trash2 className="h-4 w-4" />
                    <span>{t("sidebar.removeIcon") || "Remove Icon"}</span>
                  </ContextMenuItem>
                )}
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem
              onClick={() => {
                if (isMultiSelected) {
                  targetNotes.forEach((n) => {
                    if (allFavorited ? n.isFavorite : !n.isFavorite) {
                      onToggleFavorite?.(n.id);
                    }
                  });
                } else {
                  onToggleFavorite?.(note.id);
                }
              }}
              className="gap-2"
            >
              <Star className={`h-4 w-4 ${allFavorited ? "text-amber-500 fill-amber-500" : ""}`} />
              <span>
                {isMultiSelected
                  ? allFavorited
                    ? `${t("sidebar.unfavorite") || "Remove from Favorites"} (${targetCount})`
                    : `${t("sidebar.favorite") || "Add to Favorites"} (${targetCount})`
                  : note.isFavorite
                    ? (t("sidebar.unfavorite") || "Remove from Favorites")
                    : (t("sidebar.favorite") || "Add to Favorites")}
              </span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCopyFromContext(note)} className="gap-2">
              <Copy className="h-4 w-4" />
              <span>{isMultiSelected ? `${t("sidebar.copyAction")} (${targetCount})` : t("sidebar.copyAction")}</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onPasteToFolder?.(note.folderPath || "")} className="gap-2" disabled={!canPaste}>
              <ClipboardList className="h-4 w-4" />
              <span>{t("sidebar.pasteAction")}</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDuplicateFromContext(note)} className="gap-2">
              <Files className="h-4 w-4" />
              <span>{isMultiSelected ? `${t("sidebar.duplicateAction")} (${targetCount})` : t("sidebar.duplicateAction")}</span>
            </ContextMenuItem>
            {!isMultiSelected && (
              <ContextMenuItem
                onClick={() => {
                  const currentName = note.fileName || "untitled.txt";
                  setRenameTargetNote(note);
                  setRenameFileName(currentName);
                  setRenameFileDialogOpen(true);
                }}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                <span>{t("sidebar.renameAction")}</span>
              </ContextMenuItem>
            )}
            <ContextMenuItem onClick={() => handleDeleteFromContext(note)} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />
              <span>{isMultiSelected ? `${t("sidebar.deleteFileAction")} (${targetCount})` : t("sidebar.deleteFileAction")}</span>
            </ContextMenuItem>
            {!isMultiSelected && (
              <>
                <ContextMenuSeparator />
                {!note.isLocked ? (
                  <ContextMenuItem onClick={() => onOpenPinModal?.(note, "set")} className="gap-2">
                    <Lock className="h-4 w-4" />
                    <span>{t("sidebar.lockNote") || "Lock with PIN"}</span>
                  </ContextMenuItem>
                ) : (
                  <>
                    <ContextMenuItem onClick={() => onOpenPinModal?.(note, "remove")} className="gap-2">
                      <Unlock className="h-4 w-4" />
                      <span>{t("sidebar.unlockNote") || "Remove PIN"}</span>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onOpenPinModal?.(note, "change")} className="gap-2">
                      <Key className="h-4 w-4" />
                      <span>{t("sidebar.changePin") || "Change PIN"}</span>
                    </ContextMenuItem>
                  </>
                )}
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    return (
      <ContextMenu key={note.id}>
        <ContextMenuTrigger asChild>
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            onClick={(event) => {
              if (event.shiftKey || event.ctrlKey || event.metaKey) {
                return;
              }
              onSelect(note.id);
              if (isMobile) onClose?.();
            }}
            draggable
            onDragStart={() => {
              const isMulti = selectedNoteIds.has(note.id) && selectedNoteIds.size > 1;
              const dragNotes = isMulti ? notes.filter((n) => selectedNoteIds.has(n.id)) : [note];
              setDraggedItem({ kind: "file", note, notes: dragNotes });
            }}
            onDragEnd={() => {
              setDraggedItem(null);
              setDropTargetFolderPath(null);
            }}
            onMouseDown={(event) => handleNoteSelection(note.id, event)}
            onContextMenu={() => {
              if (!selectedNoteIds.has(note.id)) setSingleSelectedNote(note.id);
            }}
            className={`w-full flex flex-col gap-1 px-3 ${
              settings.sidebarDensity === "compact" ? "py-1.5 text-[12.5px]" : "py-2 text-[13px]"
            } text-left transition-colors rounded-lg outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 select-none ${
              activeNoteId === note.id || selectedNoteIds.has(note.id)
                ? "bg-sidebar-accent font-semibold text-foreground"
                : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
            }`}
          >
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <NoteIcon note={note} active={activeNoteId === note.id} />
                <span
                  className={`truncate text-xs ${
                    activeNoteId === note.id ? "font-semibold text-primary" : "font-medium text-foreground"
                  }`}
                >
                  {query ? highlightMatchText(noteLabel, query, settings.theme) : noteLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isMarkdownNote && <MarkdownIndicator active={activeNoteId === note.id} />}
                {note.isFavorite && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatSidebarDate(note.updatedAt, settings.dateFormat, settings.timeFormat, settings.language)}
                </span>
              </div>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-foreground/90 pl-5">
              {query
                ? highlightMatchText(getSearchPreviewSnippet(note.content, note.title, query, t("sidebar.noContent")), query, settings.theme)
                : getPreview(note.content, note.title, t("sidebar.noContent"))}
            </p>
          </motion.button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48 rounded-xl">
          {!isMultiSelected && (
            <>
              <ContextMenuItem onClick={() => setIconPickerTarget({ type: "note", note })} className="gap-2">
                {note.icon ? (
                  renderCustomIcon(note.icon, "h-4 w-4 shrink-0", { color: note.iconColor })
                ) : (
                  <NoteIcon note={note} active={false} />
                )}
                <span>{t("sidebar.changeIcon") || "Change Icon"}</span>
              </ContextMenuItem>
              {note.icon && (
                <ContextMenuItem onClick={() => onUpdateNote?.(note.id, { icon: undefined, iconColor: undefined })} className="gap-2 text-muted-foreground hover:text-foreground">
                  <Trash2 className="h-4 w-4" />
                  <span>{t("sidebar.removeIcon") || "Remove Icon"}</span>
                </ContextMenuItem>
              )}
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem
            onClick={() => {
              if (isMultiSelected) {
                targetNotes.forEach((n) => {
                  if (allFavorited ? n.isFavorite : !n.isFavorite) {
                    onToggleFavorite?.(n.id);
                  }
                });
              } else {
                onToggleFavorite?.(note.id);
              }
            }}
            className="gap-2"
          >
            <Star className={`h-4 w-4 ${allFavorited ? "text-amber-500 fill-amber-500" : ""}`} />
            <span>
              {isMultiSelected
                ? allFavorited
                  ? `${t("sidebar.unfavorite") || "Remove from Favorites"} (${targetCount})`
                  : `${t("sidebar.favorite") || "Add to Favorites"} (${targetCount})`
                : note.isFavorite
                  ? (t("sidebar.unfavorite") || "Remove from Favorites")
                  : (t("sidebar.favorite") || "Add to Favorites")}
            </span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCopyFromContext(note)} className="gap-2">
            <Copy className="h-4 w-4" />
            <span>{isMultiSelected ? `${t("sidebar.copyAction")} (${targetCount})` : t("sidebar.copyAction")}</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onPasteToFolder?.(note.folderPath || "")} className="gap-2" disabled={!canPaste}>
            <ClipboardList className="h-4 w-4" />
            <span>{t("sidebar.pasteAction")}</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleDuplicateFromContext(note)} className="gap-2">
            <Files className="h-4 w-4" />
            <span>{isMultiSelected ? `${t("sidebar.duplicateAction")} (${targetCount})` : t("sidebar.duplicateAction")}</span>
          </ContextMenuItem>
          {!isMultiSelected && (
            <ContextMenuItem
              onClick={() => {
                const currentName = note.fileName || "untitled.txt";
                setRenameTargetNote(note);
                setRenameFileName(currentName);
                setRenameFileDialogOpen(true);
              }}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              <span>{t("sidebar.renameAction")}</span>
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => handleDeleteFromContext(note)} className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4" />
            <span>{isMultiSelected ? `${t("sidebar.deleteFileAction")} (${targetCount})` : t("sidebar.deleteFileAction")}</span>
          </ContextMenuItem>
          {!isMultiSelected && (
            <>
              <ContextMenuSeparator />
              {!note.isLocked ? (
                <ContextMenuItem onClick={() => onOpenPinModal?.(note, "set")} className="gap-2">
                  <Lock className="h-4 w-4" />
                  <span>{t("sidebar.lockNote") || "Lock with PIN"}</span>
                </ContextMenuItem>
              ) : (
                <>
                  <ContextMenuItem onClick={() => onOpenPinModal?.(note, "remove")} className="gap-2">
                    <Unlock className="h-4 w-4" />
                    <span>{t("sidebar.unlockNote") || "Remove PIN"}</span>
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onOpenPinModal?.(note, "change")} className="gap-2">
                    <Key className="h-4 w-4" />
                    <span>{t("sidebar.changePin") || "Change PIN"}</span>
                  </ContextMenuItem>
                </>
              )}
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const renderFolderNode = (node: FolderNode, depth = 0): React.ReactNode => {
    if (node.path === "" && !node.name) {
      return (
        <>
          {node.notes.map((note) => renderNote(note, depth))}
          {node.children.map((child) => renderFolderNode(child, depth))}
        </>
      );
    }

    const isOpen = openFolders.has(node.path);
    const hasContent = node.notes.length > 0 || node.children.length > 0;

    return (
      <ContextMenu key={node.path}>
        <ContextMenuTrigger asChild>
          <div className="group/tree-item relative w-full">
            <button
              onClick={() => {
                setSelectedFolderPath(node.path);
                toggleFolder(node.path);
              }}
              draggable
              onDragStart={() => setDraggedItem({ kind: "folder", folderPath: node.path })}
              onDragEnd={() => {
                setDraggedItem(null);
                setDropTargetFolderPath(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTargetFolderPath(node.path);
                scheduleFolderExpandOnDrag(node.path, isOpen);
              }}
              onDragLeave={() => {
                if (dropTargetFolderPath === node.path) {
                  setDropTargetFolderPath(null);
                }
                if (dragExpandTimeoutRef.current) {
                  window.clearTimeout(dragExpandTimeoutRef.current);
                  dragExpandTimeoutRef.current = null;
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDropToFolder(node.path);
              }}
              onContextMenu={() => setSelectedFolderPath(node.path)}
              className={`sticky flex w-full items-center gap-1.5 px-3 bg-sidebar/95 backdrop-blur-[2px] ${settings.sidebarDensity === "compact" ? "py-1 text-[12.5px]" : "py-1.5 text-[13.5px]"} font-medium transition-colors rounded-lg outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 select-none ${
                dropTargetFolderPath === node.path
                  ? "bg-sidebar-accent/50 text-foreground"
                  : "text-foreground font-semibold hover:text-foreground hover:bg-sidebar-accent/40"
              }`}
              style={{
                top: `${depth * (settings.sidebarDensity === "compact" ? 26 : 30)}px`,
                zIndex: 35 - Math.min(depth, 25),
                paddingLeft: `${12 + depth * 14}px`,
              }}
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              {node.path === "__opened_root__" && isCloudWorkspace ? (
                <GoogleDriveIcon className="h-3.5 w-3.5 shrink-0" />
              ) : settings.folderIcons?.[node.path] ? (
                renderCustomIcon(settings.folderIcons[node.path].icon, "h-3.5 w-3.5 shrink-0", { color: settings.folderIcons[node.path].color })
              ) : isOpen ? (
                React.createElement(getToolbarIcon("folderOpen", settings.iconPack), { className: "h-3.5 w-3.5 shrink-0 text-primary" })
              ) : (
                React.createElement(getToolbarIcon("folder", settings.iconPack), { className: "h-3.5 w-3.5 shrink-0 text-primary" })
              )}
              <span className="truncate">{node.name}</span>
              {node.path === "__opened_root__" && isLoadingWorkspace ? (
                <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
              ) : hasContent ? (
                <span className="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground">{node.notes.length + node.children.length}</span>
              ) : null}
            </button>
            {isOpen && (
              <div className="relative w-full">
                {settings.showGuideLines && (
                  <div
                    className="absolute top-0 bottom-0 border-l border-transparent transition-colors duration-150 group-hover/tree-item:border-sidebar-border hover:border-sidebar-foreground/40 pointer-events-none z-10"
                    style={{ left: `${18 + depth * 14}px` }}
                  />
                )}
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropTargetFolderPath(node.path);
                  }}
                  onDragLeave={() => {
                    if (dropTargetFolderPath === node.path) {
                      setDropTargetFolderPath(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDropToFolder(node.path);
                  }}
                  className={`w-full ${dropTargetFolderPath === node.path ? "rounded-md bg-sidebar-accent/30" : ""}`}
                >
                  {node.notes.map((note) => renderNote(note, depth + 1))}
                  {node.children.map((child) => renderFolderNode(child, depth + 1))}
                </div>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48 rounded-xl">
          <ContextMenuItem onClick={() => setIconPickerTarget({ type: "folder", path: node.path })} className="gap-2">
            {settings.folderIcons?.[node.path] ? (
              renderCustomIcon(settings.folderIcons[node.path].icon, "h-4 w-4 shrink-0 text-primary", { color: settings.folderIcons[node.path].color })
            ) : (
              (() => {
                const FolderIconComp = getToolbarIcon("folder", pack);
                return <FolderIconComp className="h-4 w-4 shrink-0 text-primary" />;
              })()
            )}
            <span>{t("sidebar.changeIcon") || "Change Icon"}</span>
          </ContextMenuItem>
          {settings.folderIcons?.[node.path] && (
            <ContextMenuItem onClick={() => removeFolderIcon(node.path)} className="gap-2 text-muted-foreground hover:text-foreground">
              <Trash2 className="h-4 w-4" />
              <span>{t("sidebar.removeIcon") || "Remove Icon"}</span>
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          {node.path !== "__opened_root__" && (
            <ContextMenuItem onClick={() => onCopyFolder?.(node.path)} className="gap-2">
              <Copy className="h-4 w-4" />
              <span>{t("sidebar.copyAction")}</span>
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => onPasteToFolder?.(node.path)} className="gap-2" disabled={!canPaste}>
            <ClipboardList className="h-4 w-4" />
            <span>{t("sidebar.pasteAction")}</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setSelectedFolderPath(node.path);
              setCreateFileDialogOpen(true);
            }}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            <span>{t("sidebar.createFileAction")}</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setSelectedFolderPath(node.path);
              setCreateFolderDialogOpen(true);
            }}
            className="gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>{t("sidebar.createFolderAction")}</span>
          </ContextMenuItem>
          {node.path !== "__opened_root__" && (
            <ContextMenuItem onClick={() => onDuplicateFolder?.(node.path)} className="gap-2">
              <Files className="h-4 w-4" />
              <span>{t("sidebar.duplicateAction")}</span>
            </ContextMenuItem>
          )}
          {node.path !== "__opened_root__" && (
            <ContextMenuItem
              onClick={() => {
                const segments = node.path.split("/").filter(Boolean);
                const currentName = segments[segments.length - 1] || "folder";
                setRenameTargetFolderPath(node.path);
                setRenameFolderName(currentName);
                setRenameFolderDialogOpen(true);
              }}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              <span>{t("sidebar.renameAction")}</span>
            </ContextMenuItem>
          )}
          {node.path !== "__opened_root__" && (
            <ContextMenuItem onClick={() => handleDeleteFolderFromContext(node.path)} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />
              <span>{t("sidebar.deleteFolderAction")}</span>
            </ContextMenuItem>
          )}
          {node.path === "__opened_root__" && onCloseWorkspace && (
            <>
              <div className="h-[1px] bg-sidebar-border/60 my-1 -mx-1" />
              <ContextMenuItem onClick={onCloseWorkspace} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span>{t("sidebar.closeWorkspace") || "Close Workspace"}</span>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const isCollapsed = sidebarOpen === false && !isMobile;
  const currentWidth = isMobile ? undefined : (isCollapsed ? 52 : (sidebarWidth || 280));
  const pack = settings?.iconPack || "lucide";
  const renderIcon = (toolId: string, className = "h-4 w-4") => {
    const IconComp = getToolbarIcon(toolId, pack);
    return <IconComp className={className} />;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={
          `flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full shrink-0 select-none overflow-hidden ` +
          (isMobile ? 'fixed left-0 top-0 z-50 w-[90vw] max-w-[320px] shadow-2xl' : 'relative')
        }
        style={!isMobile ? {
          width: `${currentWidth}px`,
          transition: 'width 240ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'width',
        } : undefined}
      >
        {isCollapsed ? (
          <div key="collapsed" className="flex flex-col items-center h-full w-[52px] min-w-[52px] py-3 justify-between animate-in fade-in duration-150">
            <div className="flex flex-col items-center gap-2.5 w-full px-1.5">
              {/* Top Logo / Open Sidebar Hover Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenSidebar}
                    className="group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  >
                    {/* Normal state: Logo */}
                    <span className="transition-all duration-200 group-hover:scale-0 group-hover:opacity-0 flex items-center justify-center">
                      <img src={lunoLogo} alt="Luno Logo" className="h-5 w-5 object-contain shrink-0 luno-app-logo" />
                    </span>

                    {/* Hover state: Open Sidebar Button */}
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 text-primary">
                      {renderIcon("panelLeftClose", "h-4 w-4")}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.openSidebar") || "Open Sidebar"}
                </TooltipContent>
              </Tooltip>

              {/* Top Divider */}
              <div className="w-5 h-[1px] bg-sidebar-border/60 my-0.5 shrink-0" />

              {/* 1. Search */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleFocusSearchFromCollapsed}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                  >
                    {renderIcon("search", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.searchShortPlaceholder") || (isTh ? "ค้นหา" : "Search")}
                </TooltipContent>
              </Tooltip>

              {/* 2. Home */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect("home");
                      if (isMobile) onClose?.();
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0 ${
                      activeNoteId === "home"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {renderIcon("home", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.home") || "Home"}
                </TooltipContent>
              </Tooltip>

              {/* 3. Templates */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect("templates");
                      if (isMobile) onClose?.();
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0 ${
                      activeNoteId === "templates"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {renderIcon("templates", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.templates") || (isTh ? "เทมเพลต" : "Templates")}
                </TooltipContent>
              </Tooltip>

              {/* 4. Luno AI */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect("luno-ai");
                      if (isMobile) onClose?.();
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0 ${
                      activeNoteId === "luno-ai"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {renderIcon("ai", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.lunoAi") || "Luno AI"}
                </TooltipContent>
              </Tooltip>

              {/* 5. Favorites */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect("favorites");
                      if (isMobile) onClose?.();
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0 ${
                      activeNoteId === "favorites"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {renderIcon("star", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.favorites") || (isTh ? "รายการโปรด" : "Favorites")}
                </TooltipContent>
              </Tooltip>

              {/* 6. Tags */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect("tags");
                      if (isMobile) onClose?.();
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0 ${
                      activeNoteId === "tags"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {renderIcon("tag", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.tags") || (isTh ? "แท็ก" : "Tags")}
                </TooltipContent>
              </Tooltip>

              {/* 7. Trash */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect("trash");
                      if (isMobile) onClose?.();
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0 ${
                      activeNoteId === "trash"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {renderIcon("trash", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.trash") || (isTh ? "ถังขยะ" : "Trash")}
                </TooltipContent>
              </Tooltip>

              {/* Middle Divider */}
              <div className="w-5 h-[1px] bg-sidebar-border/60 my-0.5 shrink-0" />

              {/* 8. Open Workspace / Folder */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void onOpenFolder?.()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                  >
                    {renderIcon("folder", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("sidebar.openFolderAction") || (isTh ? "เปิดโฟลเดอร์" : "Open Folder")}
                </TooltipContent>
              </Tooltip>

              {/* 9. Plus (New Note / Folder / Web Page Dropdown) */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors shrink-0 outline-none"
                      >
                        {renderIcon("plus", "h-4 w-4")}
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {t("sidebar.newNote") || (isTh ? "สร้างโน้ตใหม่" : "New Note")}
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-48 rounded-xl px-0 py-2">
                  <DropdownMenuItem onClick={openCreateFileDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                    {renderIcon("fileText", "h-4 w-4")}
                    <span>{t("sidebar.createFileAction")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openCreateFolderDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                    {renderIcon("folderPlus", "h-4 w-4")}
                    <span>{t("sidebar.createFolderAction")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (onOpenWebTab) {
                        onOpenWebTab("https://www.google.com", "Google");
                      }
                      if (isMobile) onClose?.();
                    }}
                    className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{t("sidebar.newWebPage") || "Web Page"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bottom Nav Item: Settings */}
            <div className="flex flex-col items-center w-full px-1.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {renderIcon("settings", "h-4 w-4")}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {t("settings.title") || "Settings"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div key="expanded" className="flex flex-col h-full w-full min-w-[280px] animate-in fade-in duration-150">
            {/* Brand Header */}
            <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-[22px] w-[22px] items-center justify-center shrink-0">
                  <img src={lunoLogo} alt="Luno Logo" className="h-[22px] w-auto object-contain shrink-0 luno-app-logo" />
                </div>
                <span className="font-krona text-[16px] font-normal tracking-tight text-foreground">Luno</span>
              </div>

              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors" onClick={onClose}>
                {renderIcon("panelLeft", "h-4 w-4")}
                <span className="sr-only">{t("sidebar.hideSidebar")}</span>
              </Button>
            </div>

      {/* Search Input Box */}
      <div className="px-3 py-1">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3 py-2 border border-sidebar-border/40 focus-within:border-primary focus-within:ring-0 shadow-none transition-all">
          {renderIcon("search", "h-3.5 w-3.5 shrink-0 text-muted-foreground")}
          <input
            ref={searchInputRef}
            data-sidebar-search="true"
            type="text"
            placeholder={isMobile ? t("sidebar.searchShortPlaceholder") : t("sidebar.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Quick Navigation Items */}
      <div className="px-3 py-2 space-y-0.5 border-b border-sidebar-border/40">
        <button
          type="button"
          onClick={() => {
            onSelect("home");
            if (isMobile) onClose?.();
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            activeNoteId === "home"
              ? "bg-sidebar-accent text-foreground font-semibold"
              : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          {renderIcon("home", `h-4 w-4 shrink-0 ${activeNoteId === "home" ? "text-primary" : "text-foreground"}`)}
          <span>{t("sidebar.home")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect("templates");
            if (isMobile) onClose?.();
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            activeNoteId === "templates" ? "bg-sidebar-accent text-foreground font-semibold" : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          {renderIcon("templates", `h-4 w-4 shrink-0 ${activeNoteId === "templates" ? "text-primary" : "text-foreground"}`)}
          <span>{t("sidebar.templates") || (isTh ? "เทมเพลต" : "Templates")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect("luno-ai");
            if (isMobile) onClose?.();
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            activeNoteId === "luno-ai"
              ? "bg-sidebar-accent text-foreground font-semibold"
              : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          {renderIcon("ai", `h-4 w-4 shrink-0 ${activeNoteId === "luno-ai" ? "text-primary" : "text-foreground"}`)}
          <span>{t("sidebar.lunoAi")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect("favorites");
            if (isMobile) onClose?.();
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
            activeNoteId === "favorites" ? "bg-sidebar-accent text-foreground font-semibold" : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          {renderIcon("star", `h-4 w-4 shrink-0 ${activeNoteId === "favorites" ? "text-primary" : "text-foreground"}`)}
          <span>{t("sidebar.favorites")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect("tags");
            if (isMobile) onClose?.();
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
            activeNoteId === "tags" ? "bg-sidebar-accent text-foreground font-semibold" : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          {renderIcon("tag", `h-4 w-4 shrink-0 ${activeNoteId === "tags" ? "text-primary" : "text-foreground"}`)}
          <span>{t("sidebar.tags")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect("trash");
            if (isMobile) onClose?.();
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
            activeNoteId === "trash"
              ? "bg-sidebar-accent text-foreground font-semibold"
              : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          {renderIcon("trash", `h-4 w-4 shrink-0 ${activeNoteId === "trash" ? "text-primary" : "text-foreground"}`)}
          <span>{t("sidebar.trash")}</span>
        </button>
      </div>

      {/* WORKSPACE Header */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDropTargetFolderPath("__opened_root__");
        }}
        onDragLeave={() => {
          if (dropTargetFolderPath === "__opened_root__") {
            setDropTargetFolderPath(null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleDropToFolder("__opened_root__");
        }}
        className={`flex items-center justify-between px-3.5 pt-3.5 pb-1.5 rounded-lg transition-colors ${
          dropTargetFolderPath === "__opened_root__" ? "bg-sidebar-accent/50 text-foreground" : ""
        }`}
      >
        <span className="text-[10px] font-semibold tracking-wider text-foreground uppercase">{t("sidebar.workspace")}</span>
        <div className="flex items-center gap-1">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md text-foreground hover:text-foreground hover:bg-sidebar-accent"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("sidebar.sort") || "Sort by"}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56 rounded-xl px-1 py-1.5 shadow-md">
              <DropdownMenuItem
                onClick={() => handleSortChange("name-asc")}
                className={`gap-2 cursor-pointer py-1.5 px-3 rounded-lg text-xs flex items-center justify-between ${
                  sortBy === "name-asc" ? "bg-sidebar-accent text-primary font-semibold" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowDownAZ className="h-3.5 w-3.5" />
                  <span>{t("sidebar.sortNameAsc") || "Name (A to Z)"}</span>
                </div>
                {sortBy === "name-asc" && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleSortChange("name-desc")}
                className={`gap-2 cursor-pointer py-1.5 px-3 rounded-lg text-xs flex items-center justify-between ${
                  sortBy === "name-desc" ? "bg-sidebar-accent text-primary font-semibold" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpAZ className="h-3.5 w-3.5" />
                  <span>{t("sidebar.sortNameDesc") || "Name (Z to A)"}</span>
                </div>
                {sortBy === "name-desc" && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleSortChange("modified-desc")}
                className={`gap-2 cursor-pointer py-1.5 px-3 rounded-lg text-xs flex items-center justify-between ${
                  sortBy === "modified-desc" ? "bg-sidebar-accent text-primary font-semibold" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{t("sidebar.sortModifiedDesc") || "Date modified (Newest)"}</span>
                </div>
                {sortBy === "modified-desc" && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleSortChange("modified-asc")}
                className={`gap-2 cursor-pointer py-1.5 px-3 rounded-lg text-xs flex items-center justify-between ${
                  sortBy === "modified-asc" ? "bg-sidebar-accent text-primary font-semibold" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 opacity-60" />
                  <span>{t("sidebar.sortModifiedAsc") || "Date modified (Oldest)"}</span>
                </div>
                {sortBy === "modified-asc" && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleSortChange("created-desc")}
                className={`gap-2 cursor-pointer py-1.5 px-3 rounded-lg text-xs flex items-center justify-between ${
                  sortBy === "created-desc" ? "bg-sidebar-accent text-primary font-semibold" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{t("sidebar.sortCreatedDesc") || "Date created (Newest)"}</span>
                </div>
                {sortBy === "created-desc" && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleSortChange("created-asc")}
                className={`gap-2 cursor-pointer py-1.5 px-3 rounded-lg text-xs flex items-center justify-between ${
                  sortBy === "created-asc" ? "bg-sidebar-accent text-primary font-semibold" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 opacity-60" />
                  <span>{t("sidebar.sortCreatedAsc") || "Date created (Oldest)"}</span>
                </div>
                {sortBy === "created-asc" && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {onOpenFolder && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md text-foreground hover:text-foreground hover:bg-sidebar-accent"
                  onClick={() => void onOpenFolder()}
                >
                  {renderIcon("folder", "h-4 w-4")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("sidebar.openFolder")}</TooltipContent>
            </Tooltip>
          )}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md text-foreground hover:text-foreground hover:bg-sidebar-accent"
                  >
                    {renderIcon("plus", "h-4 w-4")}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("sidebar.newNote")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48 rounded-xl px-0 py-2">
              <DropdownMenuItem onClick={openCreateFileDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                {renderIcon("fileText", "h-4 w-4")}
                <span>{t("sidebar.createFileAction")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openCreateFolderDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                {renderIcon("folderPlus", "h-4 w-4")}
                <span>{t("sidebar.createFolderAction")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (onOpenWebTab) {
                    onOpenWebTab("https://www.google.com", "Google");
                  }
                  if (isMobile) onClose?.();
                }}
                className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg"
              >
                <Globe className="h-4 w-4" />
                <span>{t("sidebar.newWebPage") || "Web Page"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>


      {/* Tree Content */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-1.5 pb-4">
        <AnimatePresence initial={false}>
          {filtered.length === 0 && (query || !hasTreeView) ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-muted-foreground">
              <FileText size={24} className="mb-3 opacity-40" />
              <p className="text-sm">{query ? t("sidebar.noResults") : t("sidebar.noNotes")}</p>
            </div>
          ) : hasTreeView && !query ? (
            renderFolderNode(folderTree)
          ) : (
            filtered.map((note) => renderNote(note))
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-sidebar-border/60 px-3 py-2 flex items-center justify-between shrink-0 bg-sidebar">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={onOpenSettings}
              >
                {renderIcon("settings", "h-4 w-4")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.settings")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("sidebar.help")}</TooltipContent>
          </Tooltip>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => updateSetting("colorScheme", settings.colorScheme === "dark" ? "light" : "dark")}
            >
              {settings.colorScheme === "dark" ? renderIcon("sun", "h-4 w-4") : renderIcon("moon", "h-4 w-4")}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("sidebar.toggleTheme")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )}

      <Dialog open={createFileDialogOpen} onOpenChange={setCreateFileDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("sidebar.createFileTitle")}</DialogTitle>
            <DialogDescription>{t("sidebar.createFileDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="create-file-name" className="mb-2 block text-sm font-medium text-foreground">
                {t("sidebar.fileNameLabel")}
              </label>
              <input
                id="create-file-name"
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateFromDialog();
                  }
                }}
                placeholder={
                  settings.newFilePattern === "date"
                    ? `Note_${formatDateForFileName(new Date(), settings.dateFormat)}`
                    : settings.newFilePattern === "daily"
                    ? `Daily-${formatDateForFileName(new Date(), settings.dateFormat)}`
                    : "Untitled"
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="new-file-ext" className="mb-2 block text-sm font-medium text-foreground">
                {t("sidebar.fileTypeLabel")}
              </label>
              <Select value={newFileExt} onValueChange={(v) => setNewFileExt(v as "txt" | "md" | "html" | "css")}>
                <SelectTrigger id="new-file-ext" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">{t("sidebar.fileTypeTxt")}</SelectItem>
                  <SelectItem value="md">{t("sidebar.fileTypeMd")}</SelectItem>
                  <SelectItem value="html">{t("sidebar.fileTypeHtml")}</SelectItem>
                  <SelectItem value="css">{t("sidebar.fileTypeCss") || "CSS (.css)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateFileDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={handleCreateFromDialog}>
              {t("sidebar.createFileAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("sidebar.createFolderTitle")}</DialogTitle>
            <DialogDescription>{t("sidebar.createFolderDescription")}</DialogDescription>
          </DialogHeader>

          <div className="py-1">
            <label htmlFor="new-folder-name" className="mb-2 block text-sm font-medium text-foreground">
              {t("sidebar.folderNameLabel")}
            </label>
            <input
              id="new-folder-name"
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateFolderFromDialog();
                }
              }}
              placeholder="Untitled"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={handleCreateFolderFromDialog}>
              {t("sidebar.createFolderAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameFileDialogOpen} onOpenChange={setRenameFileDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("sidebar.renameFileTitle")}</DialogTitle>
            <DialogDescription>{t("sidebar.renameFileDescription")}</DialogDescription>
          </DialogHeader>

          <div className="py-1">
            <label htmlFor="rename-file-name" className="mb-2 block text-sm font-medium text-foreground">
              {t("sidebar.fileNameLabel")}
            </label>
            <input
              id="rename-file-name"
              type="text"
              value={renameFileName}
              onChange={(e) => setRenameFileName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRenameFileFromDialog();
                }
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameFileDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={handleRenameFileFromDialog}>
              {t("sidebar.renameAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameFolderDialogOpen} onOpenChange={setRenameFolderDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("sidebar.renameFolderTitle")}</DialogTitle>
            <DialogDescription>{t("sidebar.renameFolderDescription")}</DialogDescription>
          </DialogHeader>

          <div className="py-1">
            <label htmlFor="rename-folder-name" className="mb-2 block text-sm font-medium text-foreground">
              {t("sidebar.folderNameLabel")}
            </label>
            <input
              id="rename-folder-name"
              type="text"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRenameFolderFromDialog();
                }
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameFolderDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={handleRenameFolderFromDialog}>
              {t("sidebar.renameAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    {/* Note delete confirmation dialog */}
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("sidebar.deleteFileAction")}</AlertDialogTitle>
          <AlertDialogDescription>{t("sidebar.deleteFilesDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            onClick={handleDeleteConfirmed}
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {/* Folder delete confirmation dialog */}
    <AlertDialog open={deleteFolderConfirmOpen} onOpenChange={setDeleteFolderConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("sidebar.deleteFolderAction")}</AlertDialogTitle>
          <AlertDialogDescription>{t("sidebar.deleteFilesDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            onClick={handleDeleteFolderConfirmed}
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Custom Icon Picker Dialog */}
    <IconPickerDialog
      open={Boolean(iconPickerTarget)}
      onOpenChange={(open) => {
        if (!open) setIconPickerTarget(null);
      }}
      title={
        iconPickerTarget?.type === "folder"
          ? (t("sidebar.changeFolderIcon") || "Change Folder Icon")
          : (t("sidebar.changeNoteIcon") || "Change Note Icon")
      }
      initialIcon={
        iconPickerTarget?.type === "folder"
          ? settings.folderIcons?.[iconPickerTarget.path]?.icon
          : iconPickerTarget?.type === "note"
          ? (iconPickerTarget.note.icon || (iconPickerTarget.note.fileName ? settings.fileIcons?.[iconPickerTarget.note.folderPath ? `${iconPickerTarget.note.folderPath}/${iconPickerTarget.note.fileName}` : iconPickerTarget.note.fileName]?.icon : undefined))
          : undefined
      }
      initialColor={
        iconPickerTarget?.type === "folder"
          ? settings.folderIcons?.[iconPickerTarget.path]?.color
          : iconPickerTarget?.type === "note"
          ? (iconPickerTarget.note.iconColor || (iconPickerTarget.note.fileName ? settings.fileIcons?.[iconPickerTarget.note.folderPath ? `${iconPickerTarget.note.folderPath}/${iconPickerTarget.note.fileName}` : iconPickerTarget.note.fileName]?.color : undefined))
          : undefined
      }
      onSelectIcon={(icon, color) => {
        if (!iconPickerTarget) return;
        if (iconPickerTarget.type === "folder") {
          setFolderIcon(iconPickerTarget.path, icon, color);
        } else if (iconPickerTarget.type === "note") {
          const note = iconPickerTarget.note;
          const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
          if (relPath) {
            setFileIcon(relPath, icon, color);
          }
          onUpdateNote?.(note.id, { icon, iconColor: color });
        }
        setIconPickerTarget(null);
      }}
      onRemoveIcon={() => {
        if (!iconPickerTarget) return;
        if (iconPickerTarget.type === "folder") {
          removeFolderIcon(iconPickerTarget.path);
        } else if (iconPickerTarget.type === "note") {
          const note = iconPickerTarget.note;
          const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
          if (relPath) {
            removeFileIcon(relPath);
          }
          onUpdateNote?.(note.id, { icon: undefined, iconColor: undefined });
        }
        setIconPickerTarget(null);
      }}
    />
      </aside>
    </TooltipProvider>
  );
}

export default React.memo(SidebarComponent);
