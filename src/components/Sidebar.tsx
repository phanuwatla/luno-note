import { Note } from "@/hooks/useNotes";
import { Plus, Search, FileText, FileCode, FileImage, File, Folder, FolderOpen, FolderPlus, Copy, ClipboardList, Files, Pencil, Trash2, FolderArchive, Settings, Home, Compass, Star, Tag, HelpCircle, Sun, Moon, ArrowDown } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelRightCloseIcon } from "@/components/icons/PanelRightCloseIcon";
import { PanelRightOpenIcon } from "@/components/icons/PanelRightOpenIcon";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import type { CreateNoteOptions, OpenFolderPending } from "@/lib/fileHandles";

interface SidebarProps {
  notes: Note[];
  folderPaths?: string[];
  activeNoteId: string | null;
  openedFolderName?: string | null;
  onSelect: (id: string) => void;
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
  confirmBeforeDelete?: boolean;
  sidebarWidth?: number;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  onOpenSidebar?: () => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  notes: Note[];
}

function buildFolderTree(notes: Note[], folderPaths: string[] = [], openedFolderName?: string | null): FolderNode {
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
    getOrCreateFolder(path).notes.push(note);
  }

  for (const path of folderPaths) {
    if (path) getOrCreateFolder(path);
  }

  return root;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getPreview(content: string, title: string, noContentLabel: string) {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  let bodyText = "";

  if (isHtml) {
    const parser = document.createElement("div");
    parser.innerHTML = content;

    const elements = Array.from(parser.children);
    if (elements.length > 1) {
      bodyText = elements
        .slice(1)
        .map((el) => el.textContent || "")
        .join(" ");
    } else {
      bodyText = parser.textContent || parser.innerText || "";
    }
  } else {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    bodyText = lines.slice(1).join(" ") || lines[0] || "";
  }

  const text = bodyText.replace(/\s+/g, " ").trim();
  if (!text) {
    const fallbackTitle = title.trim();
    return fallbackTitle || noContentLabel;
  }
  return text.length > 80 ? text.slice(0, 80) + "…" : text;
}

function getFileType(note: Note): "txt" | "md" | "html" | "image" | "binary" | "zip" | "unknown" {
  if (note.fileType === "image") return "image";
  if (note.fileType === "binary") return "binary";
  const name = note.fileName?.toLowerCase() || "";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (name.endsWith(".html") || name.endsWith(".htm")) return "html";
  if (name.endsWith(".zip")) return "zip";
  return "unknown";
}

function NoteIcon({ note, active }: { note: Note; active: boolean }) {
  const cls = `h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`;
  const type = getFileType(note);
  // Force FolderArchive for .zip files regardless of fileType
  const name = note.fileName?.toLowerCase() || "";
  if (name.endsWith(".zip")) return <FolderArchive className={cls} />;
  if (type === "md") return <FileCode className={cls} />;
  if (type === "html") return <FileCode className={cls} />;
  if (type === "image") return <FileImage className={cls} />;
  if (type === "zip") return <FolderArchive className={cls} />;
  if (type === "binary") return <File className={cls} />;
  return <FileText className={cls} />;
}

function MarkdownIndicator({ active }: { active: boolean }) {
  return (
    <span
      className={`ml-auto flex shrink-0 items-center justify-end gap-[1px] text-[10px] font-bold leading-none select-none ${
        active ? "text-primary opacity-90" : "text-muted-foreground/70"
      }`}
      title="Markdown"
    >
      <span>M</span>
      <ArrowDown className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
    </span>
  );
}

export default function Sidebar({ notes, folderPaths = [], activeNoteId, openedFolderName, onSelect, onCreate, onCreateFolder, onCopyFile, onCopyFiles, onCopyFolder, onPasteToFolder, onDuplicateFile, onDuplicateFiles, onDuplicateFolder, onRenameFile, onRenameFolder, onMoveFile, onMoveFolder, canPaste = false, onDeleteFile, onDeleteFiles, onDeleteFolder, onOpenFolder, confirmBeforeDelete = false, sidebarWidth = 280, isMobile = false, sidebarOpen = true, onOpenSidebar, onClose, onOpenSettings }: SidebarProps) {
  const { settings, updateSetting } = useAppSettings();
  const [query, setQuery] = useState("");
  const [navFilter, setNavFilter] = useState<"all" | "explore" | "favorites" | "tags" | "trash">("all");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<null | { kind: "file" | "folder"; fileName?: string; contentFormat?: "plain" | "markdown" | "html"; folderName?: string }>(null);

  const openFolderBeforeCreation = () => {
    if (!openedFolderName && onOpenFolder) {
      onOpenFolder();
      return true;
    }
    return false;
  };

  const openCreateFileDialog = () => {
    setCreateFileDialogOpen(true);
  };

  const openCreateFolderDialog = () => {
    setCreateFolderDialogOpen(true);
  };
  const [renameFileDialogOpen, setRenameFileDialogOpen] = useState(false);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileExt, setNewFileExt] = useState<"txt" | "md" | "html">("txt");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [lastSelectedNoteId, setLastSelectedNoteId] = useState<string | null>(null);
  const [renameFileName, setRenameFileName] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");
  const [renameTargetNote, setRenameTargetNote] = useState<Note | null>(null);
  const [renameTargetFolderPath, setRenameTargetFolderPath] = useState<string>("");
  const [draggedItem, setDraggedItem] = useState<{ kind: "file" | "folder"; note?: Note; folderPath?: string } | null>(null);
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
  const { t } = useTranslation();
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
      const fileName = pendingCreate.fileName ?? `untitled.txt`;
      const contentFormat = pendingCreate.contentFormat ?? "plain";
      onCreate(selectedFolderPath || currentFolderPath, { fileName, contentFormat });
    } else if (pendingCreate.kind === "folder") {
      if (onCreateFolder) onCreateFolder(selectedFolderPath || currentFolderPath, pendingCreate.folderName ?? "untitled-folder");
    }

    setPendingCreate(null);
  }, [openedFolderName, pendingCreate, onCreate, onCreateFolder, selectedFolderPath, currentFolderPath]);

  const hasTreeView = useMemo(() => notes.some((n) => n.folderPath !== undefined) || folderPaths.length > 0, [notes, folderPaths]);

  const filtered = useMemo(
    () => {
      if (!query) return notes;
      const q = query.toLowerCase();
      return notes.filter((n) => {
        const titleMatch = n.title?.toLowerCase().includes(q);
        const fileNameMatch = n.fileName?.toLowerCase().includes(q);
        const contentMatch = n.content?.toLowerCase().includes(q);
        return titleMatch || fileNameMatch || contentMatch;
      });
    },
    [notes, query],
  );

  const folderTree = useMemo(() => buildFolderTree(notes, folderPaths, openedFolderName), [notes, folderPaths, openedFolderName]);

  useEffect(() => {
    if (openedFolderName) {
      setOpenFolders((prev) => {
        const next = new Set(prev);
        next.add("__opened_root__");
        return next;
      });
    }
  }, [openedFolderName]);
  const selectableNotes = useMemo(() => (query ? filtered : notes), [notes, filtered, query]);

  const setSingleSelectedNote = (noteId: string) => {
    setSelectedNoteIds(new Set([noteId]));
    setLastSelectedNoteId(noteId);
  };

  const handleNoteSelection = (noteId: string, event: React.MouseEvent<HTMLButtonElement>) => {
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

  const handleDropToFolder = (targetFolderPath: string) => {
    if (!draggedItem) return;

    if (draggedItem.kind === "file" && draggedItem.note) {
      onMoveFile?.(draggedItem.note, targetFolderPath);
    }

    if (draggedItem.kind === "folder" && draggedItem.folderPath) {
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

  const handleCreateFromDialog = () => {
    const baseName = newFileName.trim();
    const contentFormat = newFileExt === "md" ? "markdown" : newFileExt === "html" ? "html" : "plain";
    // ใช้ extension ที่เลือกเสมอ
    const fileName = baseName ? `${baseName}.${newFileExt}` : `untitled.${newFileExt}`;

    // If there's no opened folder yet, store pending create and trigger folder picker
    if (!openedFolderName && onOpenFolder) {
      setPendingCreate({ kind: "file", fileName, contentFormat });
      setCreateFileDialogOpen(false);
      setNewFileName("");
      setNewFileExt("txt");
      onOpenFolder({ kind: "file", fileName, contentFormat });
      return;
    }

    onCreate(selectedFolderPath || currentFolderPath, { fileName, contentFormat });
    setCreateFileDialogOpen(false);
    setNewFileName("");
    setNewFileExt("txt");
  };

  const handleCreateFolderFromDialog = () => {
    if (!onCreateFolder) return;
    const safeFolderName = newFolderName.trim().replace(/[\\/:*?"<>|]/g, "_");
    const folderName = safeFolderName || "untitled-folder";

    if (!openedFolderName && onOpenFolder) {
      setPendingCreate({ kind: "folder", folderName });
      setCreateFolderDialogOpen(false);
      setNewFolderName("");
      onOpenFolder({ kind: "folder", folderName });
      return;
    }

    onCreateFolder(selectedFolderPath || currentFolderPath, folderName);
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

    if (hasTreeView && !query) {
      return (
        <ContextMenu key={note.id}>
          <ContextMenuTrigger asChild>
            <button
              onClick={() => {
                onSelect(note.id);
                if (isMobile) onClose?.();
              }}
              draggable
              onDragStart={() => setDraggedItem({ kind: "file", note })}
              onDragEnd={() => {
                setDraggedItem(null);
                setDropTargetFolderPath(null);
              }}
              onMouseDown={(event) => handleNoteSelection(note.id, event)}
              onContextMenu={() => {
                if (!selectedNoteIds.has(note.id)) setSingleSelectedNote(note.id);
              }}
              className={`flex w-full items-center gap-1.5 px-3 ${settings.sidebarDensity === "compact" ? "py-1 text-[12.5px]" : "py-1.5 text-[13px]"} text-left transition-colors rounded-lg ${
                activeNoteId === note.id
                  ? "bg-primary/10 text-primary font-medium"
                  : selectedNoteIds.has(note.id)
                    ? "bg-sidebar-accent/40 text-foreground"
                    : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
              }`}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
            >
              <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <NoteIcon note={note} active={activeNoteId === note.id} />
              <span className={`truncate ${activeNoteId === note.id ? "font-semibold text-primary" : "font-normal"}`}>{noteLabel}</span>
              {isMarkdownNote && <MarkdownIndicator active={activeNoteId === note.id} />}
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-44 rounded-xl">
            <ContextMenuItem onClick={() => handleCopyFromContext(note)} className="gap-2">
              <Copy className="h-4 w-4" />
              <span>{t("sidebar.copyAction")}</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDuplicateFromContext(note)} className="gap-2">
              <Files className="h-4 w-4" />
              <span>{t("sidebar.duplicateAction")}</span>
            </ContextMenuItem>
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
            <ContextMenuItem onClick={() => handleDeleteFromContext(note)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              <span>{t("sidebar.deleteFileAction")}</span>
            </ContextMenuItem>
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
            onClick={() => {
              onSelect(note.id);
              if (isMobile) onClose?.();
            }}
            draggable
            onDragStart={() => setDraggedItem({ kind: "file", note })}
            onDragEnd={() => {
              setDraggedItem(null);
              setDropTargetFolderPath(null);
            }}
            onMouseDown={(event) => handleNoteSelection(note.id, event)}
            onContextMenu={() => {
              if (!selectedNoteIds.has(note.id)) setSingleSelectedNote(note.id);
            }}
            className={`mx-2 mt-2 w-[calc(100%-1rem)] rounded-xl border px-4 py-3 text-left transition-colors duration-100 ${
              activeNoteId === note.id
                ? "border-transparent bg-background shadow-sm"
                : selectedNoteIds.has(note.id)
                  ? "border-transparent bg-sidebar-accent/40"
                  : "border-transparent bg-transparent hover:bg-sidebar-accent"
            }`}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <NoteIcon note={note} active={activeNoteId === note.id} />
                <span
                  className={`truncate text-sm ${
                    activeNoteId === note.id ? "font-semibold text-primary" : "font-medium text-foreground"
                  }`}
                >
                  {noteLabel}
                </span>
                {isMarkdownNote && <MarkdownIndicator active={activeNoteId === note.id} />}
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(note.updatedAt)}</span>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{getPreview(note.content, note.title, t("sidebar.noContent"))}</p>
          </motion.button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-44 rounded-xl">
          <ContextMenuItem onClick={() => handleCopyFromContext(note)} className="gap-2">
            <Copy className="h-4 w-4" />
            <span>{t("sidebar.copyAction")}</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleDuplicateFromContext(note)} className="gap-2">
            <Files className="h-4 w-4" />
            <span>{t("sidebar.duplicateAction")}</span>
          </ContextMenuItem>
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
          <ContextMenuItem onClick={() => handleDeleteFromContext(note)} className="gap-2">
            <Trash2 className="h-4 w-4" />
            <span>{t("sidebar.deleteFileAction")}</span>
          </ContextMenuItem>
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
              className={`flex w-full items-center gap-1.5 px-3 ${settings.sidebarDensity === "compact" ? "py-1 text-[12.5px]" : "py-1.5 text-[13.5px]"} font-medium transition-colors rounded-lg ${
                dropTargetFolderPath === node.path
                  ? "bg-sidebar-accent/50 text-foreground"
                  : "text-foreground font-semibold hover:text-foreground hover:bg-sidebar-accent/40"
              }`}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              {isOpen ? (
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : (
                <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
              <span className="truncate">{node.name}</span>
              {hasContent && (
                <span className="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground">{node.notes.length + node.children.length}</span>
              )}
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
          <ContextMenuItem onClick={() => onCopyFolder?.(node.path)} className="gap-2">
            <Copy className="h-4 w-4" />
            <span>{t("sidebar.copyAction")}</span>
          </ContextMenuItem>
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
          <ContextMenuItem onClick={() => onDuplicateFolder?.(node.path)} className="gap-2">
            <Files className="h-4 w-4" />
            <span>{t("sidebar.duplicateAction")}</span>
          </ContextMenuItem>
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
          <ContextMenuItem onClick={() => handleDeleteFolderFromContext(node.path)} className="gap-2">
            <Trash2 className="h-4 w-4" />
            <span>{t("sidebar.deleteFolderAction")}</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  if (sidebarOpen === false && !isMobile) {
    return (
      <TooltipProvider delayDuration={200}>
        <aside className="flex flex-col items-center border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full w-[52px] shrink-0 py-3 select-none justify-between transition-all duration-200">
          <div className="flex flex-col items-center gap-2.5 w-full px-1.5">
            {/* Top Logo / Open Sidebar Hover Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenSidebar}
                  className="group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:bg-sidebar-accent hover:text-foreground"
                >
                  {/* Normal state: Logo */}
                  <span className="transition-all duration-200 group-hover:scale-0 group-hover:opacity-0 flex items-center justify-center">
                    <img src="/luno-logo.png" alt="Luno Logo" className="h-5 w-5 object-contain shrink-0" />
                  </span>

                  {/* Hover state: Open Sidebar Button */}
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 text-primary-foreground">
                    <PanelRightCloseIcon className="h-4 w-4" />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("sidebar.openSidebar") || "Open Sidebar"}
              </TooltipContent>
            </Tooltip>

            {/* Top Divider */}
            <div className="w-5 h-[1px] bg-sidebar-border/60 my-0.5" />

            {/* Nav Item 1: Files / Notes (Active Highlight) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenSidebar}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors"
                >
                  <Files className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("sidebar.notesLabel") || "Notes & Files"}
              </TooltipContent>
            </Tooltip>

            {/* Nav Item 2: Explore / Sparkles */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenSidebar}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Compass className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("sidebar.exploreLabel") || "Explore"}
              </TooltipContent>
            </Tooltip>

            {/* Nav Item 3: Plus (New Note) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => void onCreate()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("sidebar.newNote") || "New Note"}
              </TooltipContent>
            </Tooltip>

            {/* Nav Item 4: Open Workspace / Folder */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => void onOpenFolder?.()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Folder className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("sidebar.openFolderAction") || "Open Folder"}
              </TooltipContent>
            </Tooltip>

            {/* Bottom Divider */}
            <div className="w-5 h-[1px] bg-sidebar-border/60 my-0.5" />
          </div>

          {/* Bottom Nav Item: Settings */}
          <div className="flex flex-col items-center w-full px-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {t("settings.title") || "Settings"}
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>
    );
  }

  return (
    <aside
      className={
        `flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full w-full w-[280px] shrink-0 transition-all duration-200 select-none ` +
        (isMobile ? 'fixed left-0 top-0 z-50 w-[90vw] max-w-[320px] shadow-2xl' : 'relative')
      }
      style={!isMobile ? { width: `${sidebarWidth || 280}px` } : undefined}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-[22px] w-[22px] items-center justify-center shrink-0">
            <img src="/luno-logo.png" alt="Luno Logo" className="h-[22px] w-auto object-contain shrink-0" />
          </div>
          <span className="font-krona text-[16px] font-normal tracking-tight text-foreground">Luno</span>
        </div>

        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors" onClick={onClose}>
          <PanelRightOpenIcon className="h-4 w-4" />
          <span className="sr-only">{t("sidebar.hideSidebar")}</span>
        </Button>
      </div>

      {/* Search Input Box */}
      <div className="px-3 py-1">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3 py-2 border border-sidebar-border/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <Search size={15} className="shrink-0 text-muted-foreground" />
          <input
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
          onClick={() => { setQuery(""); setNavFilter("all"); }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            navFilter === "all" ? "bg-sidebar-accent text-foreground font-semibold" : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          <Home className="h-4 w-4 shrink-0 text-foreground" />
          <span>{t("sidebar.home")}</span>
        </button>
        <button
          type="button"
          onClick={() => setNavFilter("explore")}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            navFilter === "explore" ? "bg-sidebar-accent text-foreground font-semibold" : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          <Compass className="h-4 w-4 shrink-0 text-foreground" />
          <span>{t("sidebar.explore")}</span>
        </button>
        <button
          type="button"
          onClick={() => setNavFilter("favorites")}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            navFilter === "favorites" ? "bg-sidebar-accent text-foreground font-semibold" : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          <Star className="h-4 w-4 shrink-0 text-foreground" />
          <span>{t("sidebar.favorites")}</span>
        </button>
        <button
          type="button"
          onClick={() => setNavFilter("tags")}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            navFilter === "tags" ? "bg-sidebar-accent text-foreground font-semibold" : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          <Tag className="h-4 w-4 shrink-0 text-foreground" />
          <span>{t("sidebar.tags")}</span>
        </button>
        <button
          type="button"
          onClick={() => setNavFilter("trash")}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
            navFilter === "trash" ? "bg-sidebar-accent text-foreground font-semibold" : "text-foreground/80 hover:bg-sidebar-accent/50 hover:text-foreground"
          }`}
        >
          <Trash2 className="h-4 w-4 shrink-0 text-foreground" />
          <span>{t("sidebar.trash")}</span>
        </button>
      </div>

      {/* WORKSPACE Header */}
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-1.5">
        <span className="text-[10px] font-semibold tracking-wider text-foreground uppercase">{t("sidebar.workspace")}</span>
        <div className="flex items-center gap-1">
          {onOpenFolder && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md text-foreground hover:text-foreground hover:bg-sidebar-accent"
              onClick={() => void onOpenFolder()}
              title={t("sidebar.openFolder")}
            >
              <Folder className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md text-foreground hover:text-foreground hover:bg-sidebar-accent"
                title={t("sidebar.newNote")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl px-0 py-2">
              <DropdownMenuItem onClick={openCreateFileDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <FileText className="h-4 w-4" />
                <span>{t("sidebar.createFileAction")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openCreateFolderDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <FolderPlus className="h-4 w-4" />
                <span>{t("sidebar.createFolderAction")}</span>
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={onOpenSettings}
            title={t("common.settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            title={t("sidebar.help")}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => updateSetting("colorScheme", settings.colorScheme === "dark" ? "light" : "dark")}
          title={t("sidebar.toggleTheme")}
        >
          {settings.colorScheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <Dialog open={createFileDialogOpen} onOpenChange={setCreateFileDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("sidebar.createFileTitle")}</DialogTitle>
            <DialogDescription>{t("sidebar.createFileDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div>
              <label htmlFor="new-file-name" className="mb-2 block text-sm font-medium text-foreground">
                {t("sidebar.fileNameLabel")}
              </label>
              <input
                id="new-file-name"
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateFromDialog();
                  }
                }}
                placeholder="untitled"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="new-file-ext" className="mb-2 block text-sm font-medium text-foreground">
                {t("sidebar.fileExtensionLabel")}
              </label>
              <Select value={newFileExt} onValueChange={(v) => setNewFileExt(v === "md" ? "md" : v === "html" ? "html" : "txt")}>
                <SelectTrigger id="new-file-ext" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">{t("sidebar.fileTypeTxt")}</SelectItem>
                  <SelectItem value="md">{t("sidebar.fileTypeMd")}</SelectItem>
                  <SelectItem value="html">{t("sidebar.fileTypeHtml")}</SelectItem>
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
              placeholder="untitled-folder"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
    <Dialog open={deleteFolderConfirmOpen} onOpenChange={setDeleteFolderConfirmOpen}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("sidebar.deleteFolderAction")}</DialogTitle>
          <DialogDescription>{t("sidebar.deleteFilesDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDeleteFolderConfirmOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDeleteFolderConfirmed}>
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </aside>
  );
}
