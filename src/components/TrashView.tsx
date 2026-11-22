import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Trash2,
  Search,
  RotateCcw,
  Files,
  Clock,
  PieChart,
  Filter,
  MoreHorizontal,
  Folder,
  FileText,
  FileCode,
  FileImage,
  Check,
  X,
  Settings,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { TrashedNote, formatByteSize } from "@/hooks/useTrash";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { NoteIcon as SharedNoteIcon } from "@/components/shared/NoteIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatTime } from "@/lib/dateTimeFormatter";
import { getTagColorClass } from "@/lib/tagColors";
import { stripHtmlAndMarkdown } from "@/lib/snippetUtils";
import { isEncryptedNote } from "@/lib/noteCrypto";

interface TrashViewProps {
  trashedNotes: TrashedNote[];
  onRestore: (ids: string[]) => void;
  onDeletePermanently: (ids: string[]) => void;
  onEmptyTrash: () => void;
  onOpenSettings?: () => void;
}

export { EditorCheckbox } from "@/components/shared/EditorCheckbox";
import { EditorCheckbox } from "@/components/shared/EditorCheckbox";

export type TrashSortBy =
  | "name-asc"
  | "name-desc"
  | "modified-desc"
  | "modified-asc"
  | "created-desc"
  | "created-asc";

const TRASH_SORT_STORAGE_KEY = "notes-app-trash-sort";

export default function TrashView({
  trashedNotes,
  onRestore,
  onDeletePermanently,
  onEmptyTrash,
  onOpenSettings,
}: TrashViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const isTh = settings.language === "th";

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "md" | "txt" | "html" | "other">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<TrashSortBy>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem(TRASH_SORT_STORAGE_KEY) as TrashSortBy;
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
      }
    } catch {
      // ignore
    }
    return "name-asc";
  });

  const handleSortChange = (newSort: TrashSortBy) => {
    setSortBy(newSort);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(TRASH_SORT_STORAGE_KEY, newSort);
      }
    } catch {
      // ignore
    }
  };

  const [emptyTrashDialogOpen, setEmptyTrashDialogOpen] = useState(false);
  const [deletePermanentDialogOpen, setDeletePermanentDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Global Ctrl+F / Ctrl+K handler to focus search input when not typing in an editor or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "k" || e.code === "KeyF" || e.code === "KeyK" || e.key === "า" || e.key === "ด")
      ) {
        const target = e.target as HTMLElement | null;
        if (
          target !== searchInputRef.current &&
          (target?.isContentEditable ||
            target?.tagName === "INPUT" ||
            target?.tagName === "TEXTAREA" ||
            target?.closest?.('[role="dialog"], [role="alertdialog"], .ProseMirror, .cm-editor'))
        ) {
          return;
        }
        if (searchInputRef.current && searchInputRef.current.offsetParent !== null) {
          e.preventDefault();
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const retentionDays = settings.trashRetentionDays ?? 30;

  // Compute expiration days remaining for a given trashed item
  const getExpirationInfo = (deletedAt: number) => {
    if (retentionDays <= 0) {
      return { days: -1, text: t("trash.never"), colorClass: "text-muted-foreground" };
    }
    const msPassed = Date.now() - (deletedAt || Date.now());
    const totalMs = retentionDays * 24 * 60 * 60 * 1000;
    const msRemaining = totalMs - msPassed;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    if (daysRemaining === 0) {
      return { days: 0, text: t("trash.expired"), colorClass: "text-rose-600 dark:text-rose-400 font-medium" };
    }
    if (daysRemaining <= 5) {
      return { days: daysRemaining, text: t("trash.days", { daysRemaining }), colorClass: "text-rose-600 dark:text-rose-400 font-medium" };
    }
    if (daysRemaining <= 10) {
      return { days: daysRemaining, text: t("trash.days", { daysRemaining }), colorClass: "text-amber-600 dark:text-amber-400 font-medium" };
    }
    return { days: daysRemaining, text: t("trash.days", { daysRemaining }), colorClass: "text-emerald-600 dark:text-emerald-400 font-medium" };
  };

  // Format relative deleted timestamp (e.g. Today 10:24, Yesterday 16:40, 2 days ago)
  const formatDeletedTime = (timestamp: number) => {
    if (!timestamp) return "-";
    const now = new Date();
    const date = new Date(timestamp);
    const isToday = now.toDateString() === date.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    const timeStr = formatTime(date, settings.timeFormat, settings.language);

    if (isToday) {
      return t("trash.today2", { timeStr });
    }
    if (isYesterday) {
      return t("trash.yesterday2", { timeStr });
    }

    const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays > 0 && diffDays < 30) {
      return t("trash.daysAgo", { diffDays });
    }

    return `${formatDate(date, settings.dateFormat, settings.language)} ${timeStr}`;
  };

  // Filter, search and sort notes/files
  const filteredNotes = useMemo(() => {
    const list = trashedNotes.filter((note) => {
      // Type filter
      if (filterType !== "all") {
        const name = (note.fileName || "").toLowerCase();
        if (filterType === "md" && !name.endsWith(".md") && !name.endsWith(".markdown")) return false;
        if (filterType === "txt" && !name.endsWith(".txt")) return false;
        if (filterType === "html" && !name.endsWith(".html") && !name.endsWith(".htm")) return false;
        if (filterType === "other") {
          const isDoc = name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt") || name.endsWith(".html") || name.endsWith(".htm");
          if (isDoc) return false;
        }
      }

      // Query search
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const titleMatch = (note.title || "").toLowerCase().includes(q);
      const fileMatch = (note.fileName || "").toLowerCase().includes(q);
      const folderMatch = (note.folderPath || "").toLowerCase().includes(q);
      const tagMatch = (note.tags || []).some((t) => t.toLowerCase().includes(q));
      const isNoteLocked = Boolean(note.isLocked || isEncryptedNote(note.content));
      const contentMatch = isNoteLocked ? false : (note.content || "").toLowerCase().includes(q);

      return titleMatch || fileMatch || folderMatch || tagMatch || contentMatch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "name-asc") {
        const nameA = a.fileName || a.title || "";
        const nameB = b.fileName || b.title || "";
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
      }
      if (sortBy === "name-desc") {
        const nameA = a.fileName || a.title || "";
        const nameB = b.fileName || b.title || "";
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: "base" });
      }
      if (sortBy === "modified-desc") {
        const modA = a.updatedAt || a.deletedAt || a.createdAt || 0;
        const modB = b.updatedAt || b.deletedAt || b.createdAt || 0;
        return modB - modA;
      }
      if (sortBy === "modified-asc") {
        const modA = a.updatedAt || a.deletedAt || a.createdAt || 0;
        const modB = b.updatedAt || b.deletedAt || b.createdAt || 0;
        return modA - modB;
      }
      if (sortBy === "created-desc") {
        const creA = a.createdAt || a.deletedAt || 0;
        const creB = b.createdAt || b.deletedAt || 0;
        return creB - creA;
      }
      if (sortBy === "created-asc") {
        const creA = a.createdAt || a.deletedAt || 0;
        const creB = b.createdAt || b.deletedAt || 0;
        return creA - creB;
      }
      return 0;
    });
  }, [trashedNotes, filterType, query, sortBy]);

  // Total storage metrics
  const totalStorageBytes = useMemo(() => {
    return trashedNotes.reduce((acc, n) => acc + (n.size || 0), 0);
  }, [trashedNotes]);

  // Select all / Deselect all
  const allFilteredSelected = filteredNotes.length > 0 && filteredNotes.every((n) => selectedIds.includes(n.id));
  const someFilteredSelected = filteredNotes.some((n) => selectedIds.includes(n.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredNotes.map((n) => n.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const filteredIdSet = new Set(filteredNotes.map((n) => n.id));
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIdSet])));
    }
  };

  const handleToggleSelectRow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Restore actions
  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    onRestore(selectedIds);
    setSelectedIds([]);
  };

  const handleRestoreAll = () => {
    if (trashedNotes.length === 0) return;
    onRestore(trashedNotes.map((n) => n.id));
    setSelectedIds([]);
  };

  // Permanent delete actions
  const handlePromptDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setPendingDeleteIds(selectedIds);
    setDeletePermanentDialogOpen(true);
  };

  const handleConfirmPermanentDelete = () => {
    if (pendingDeleteIds.length > 0) {
      onDeletePermanently(pendingDeleteIds);
      setSelectedIds((prev) => prev.filter((id) => !pendingDeleteIds.includes(id)));
      setPendingDeleteIds([]);
    }
    setDeletePermanentDialogOpen(false);
  };

  const renderNoteIcon = (note: TrashedNote, cls = "h-4 w-4") => (
    <SharedNoteIcon note={note} className={cls} colorClassName="text-muted-foreground/80" />
  );

  const getNoteSnippet = (content?: string, isLocked?: boolean) => {
    if (isLocked || isEncryptedNote(content)) {
      return t("trash.lockedContent");
    }
    if (!content) return "";
    return stripHtmlAndMarkdown(content).slice(0, 90);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 h-full overflow-hidden bg-background text-foreground select-none flex flex-col">
        <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-5 h-full min-h-0 overflow-hidden">
          {/* 1. Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-primary shrink-0" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
                  {t("trash.title")}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {retentionDays > 0
                  ? (t("trash.filesInTrashArePermanently", { retentionDays }))
                  : (t("trash.filesInTrashWillBe"))}
              </p>
            </div>

            {/* Functional Search Input Box & Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3.5 py-2 border border-sidebar-border/40 hover:border-primary/60 focus-within:border-primary w-full sm:w-56 md:w-64 transition-all shadow-none group">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  ref={searchInputRef}
                  data-trash-search="true"
                  type="text"
                  placeholder={t("trash.searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Action Buttons Group (matching sidebar sort/open/+ style) */}
              <div className="flex items-center gap-1">
                {/* Filter Dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-md shrink-0 transition-colors bg-transparent focus:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-transparent ${
                            filterType !== "all"
                              ? "text-primary hover:text-primary hover:bg-sidebar-accent/50"
                              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                          }`}
                        >
                          <Filter className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{t("trash.filterTooltip")}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-md">
                    <DropdownMenuItem
                      onClick={() => setFilterType("all")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        filterType === "all" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {filterType === "all" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterAll")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterType("md")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        filterType === "md" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {filterType === "md" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterMd")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterType("txt")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        filterType === "txt" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {filterType === "txt" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterTxt")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterType("html")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        filterType === "html" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {filterType === "html" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterHtml")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterType("other")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        filterType === "other" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {filterType === "other" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterOther")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent bg-transparent focus:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-transparent shrink-0 transition-colors"
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{t("sidebar.sort")}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5 shadow-md">
                    <DropdownMenuItem
                      onClick={() => handleSortChange("name-asc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "name-asc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ArrowDownAZ className="h-4 w-4" />
                        <span>{t("sidebar.sortNameAsc")}</span>
                      </div>
                      {sortBy === "name-asc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("name-desc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "name-desc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ArrowUpAZ className="h-4 w-4" />
                        <span>{t("sidebar.sortNameDesc")}</span>
                      </div>
                      {sortBy === "name-desc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("modified-desc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "modified-desc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4" />
                        <span>{t("sidebar.sortModifiedDesc")}</span>
                      </div>
                      {sortBy === "modified-desc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("modified-asc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "modified-asc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 opacity-60" />
                        <span>{t("sidebar.sortModifiedAsc")}</span>
                      </div>
                      {sortBy === "modified-asc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("created-desc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "created-desc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4" />
                        <span>{t("sidebar.sortCreatedDesc")}</span>
                      </div>
                      {sortBy === "created-desc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("created-asc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "created-asc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 opacity-60" />
                        <span>{t("sidebar.sortCreatedAsc")}</span>
                      </div>
                      {sortBy === "created-asc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* More Action Menu */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent bg-transparent focus:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-transparent shrink-0 transition-colors"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{t("trash.moreOptions")}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-md">
                    <DropdownMenuItem
                      disabled={trashedNotes.length === 0}
                      onClick={handleRestoreAll}
                      className="gap-2.5 py-1.5 px-3 rounded-lg cursor-pointer text-[13px]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>{t("trash.restoreAllFiles")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={trashedNotes.length === 0}
                      onClick={() => setEmptyTrashDialogOpen(true)}
                      className="gap-2.5 py-1.5 px-3 rounded-lg text-destructive focus:text-destructive cursor-pointer text-[13px]"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span>{t("trash.emptyTrash")}</span>
                    </DropdownMenuItem>
                    {onOpenSettings && (
                      <>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                          onClick={onOpenSettings}
                          className="gap-2.5 py-1.5 px-3 rounded-lg cursor-pointer text-[13px]"
                        >
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <span>{t("trash.settings")}</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* 2. Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {/* Card 1: Files in Trash */}
            <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-sm hover:border-primary/60 hover:bg-muted/50 transition-all">
              <Files className="h-5 w-5 text-foreground/80 shrink-0 stroke-[1.8]" />
              <div className="min-w-0 truncate">
                <div className="text-sm font-bold text-foreground leading-tight truncate">{trashedNotes.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{t("trash.filesInTrash")}</div>
              </div>
            </div>

            {/* Card 2: Auto Delete Duration */}
            <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-sm hover:border-primary/60 hover:bg-muted/50 transition-all">
              <Clock className="h-5 w-5 text-foreground/80 shrink-0 stroke-[1.8]" />
              <div className="min-w-0 truncate">
                <div className="text-sm font-bold text-foreground leading-tight truncate">
                  {retentionDays > 0 ? (t("trash.days2", { retentionDays })) : (t("trash.never"))}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{t("trash.autoDelete")}</div>
              </div>
            </div>

            {/* Card 3: Storage Used */}
            <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-sm hover:border-primary/60 hover:bg-muted/50 transition-all">
              <PieChart className="h-5 w-5 text-foreground/80 shrink-0 stroke-[1.8]" />
              <div className="min-w-0 truncate">
                <div className="text-sm font-bold text-foreground leading-tight truncate">{formatByteSize(totalStorageBytes)}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{t("trash.storageUsed")}</div>
              </div>
            </div>
          </div>

          {/* 3. Table Container (Full Width) */}
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden w-full">
            <div className="flex flex-1 flex-col rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden min-w-0">
              {/* Table Header with Grayish Background (like Editor table) */}
              <div className="flex items-center px-4 py-2.5 bg-muted/60 dark:bg-muted/40 border-b border-border/50 text-xs font-semibold text-foreground shrink-0 select-none min-w-0">
                <div className="w-6 flex items-center justify-center shrink-0">
                  <EditorCheckbox
                    checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                    onChange={handleToggleSelectAll}
                  />
                </div>
                <div className="flex-1 min-w-[140px] px-2 truncate">{t("trash.file")}</div>
                <div className="w-44 lg:w-56 hidden md:block px-2 shrink-0 truncate">{t("trash.colOriginalLocation")}</div>
                <div className="w-28 hidden sm:block px-2 shrink-0 truncate">{t("trash.deleted2")}</div>
                <div className="w-24 hidden lg:block px-2 shrink-0 truncate">{t("trash.colSize")}</div>
                <div className="w-24 px-2 text-right sm:text-left shrink-0">{t("trash.colExpiresIn")}</div>
              </div>

              {/* Table Body (Scrollable rows) */}
              <div className="no-scrollbar flex-1 overflow-y-auto divide-y divide-border/20 min-w-0">
                {filteredNotes.length === 0 ? (
                  <EmptyState
                    className="h-full"
                    icon={<Trash2 />}
                    title={trashedNotes.length === 0 ? (t("trash.emptyTrashEmpty")) : (t("trash.noFilesFound"))}
                    description={
                      trashedNotes.length === 0
                        ? (t("trash.deletedFilesWillAppearHere"))
                        : (t("trash.trySearchingWithADifferent"))
                    }
                  />
                ) : (
                  filteredNotes.map((note) => {
                    const isSelected = selectedIds.includes(note.id);
                    const exp = getExpirationInfo(note.deletedAt);
                    const snippet = getNoteSnippet(note.content, note.isLocked);
                    const originalLoc = note.originalFolderPath || note.folderPath || (t("trash.root"));

                    return (
                      <div
                        key={note.id}
                        onClick={() => handleToggleSelectRow(note.id)}
                        className={`group flex items-center px-4 py-2.5 text-xs transition-colors cursor-pointer min-w-0 ${
                          isSelected
                            ? "bg-emerald-50/70 dark:bg-emerald-950/20 text-foreground"
                            : "hover:bg-muted/30 text-foreground/90"
                        }`}
                      >
                        {/* Checkbox styled identical to Editor */}
                        <div className="w-6 flex items-center justify-center shrink-0">
                          <EditorCheckbox
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(note.id)}
                          />
                        </div>

                        {/* Note Info: Icon + Title + Tag Pill + Snippet */}
                        <div className="flex-1 min-w-[140px] px-2 flex items-center gap-2.5 overflow-hidden">
                          {settings.showFileIcons !== false && (
                            <div className="shrink-0">
                              {renderNoteIcon(note, "h-4 w-4")}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-semibold text-foreground text-xs truncate">
                                {note.title || note.fileName || (t("editor.untitled"))}
                              </span>
                              {note.tags && note.tags.length > 0 && (
                                note.tags.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={tag}
                                    className={`shrink-0 text-[9.5px] px-1.5 py-0.5 rounded font-medium border ${getTagColorClass(
                                      tag,
                                      settings.theme,
                                      idx,
                                      settings.tagColorStyle
                                    )}`}
                                  >
                                    {tag}
                                  </span>
                                ))
                              )}
                            </div>
                            {snippet && (
                              <p className="text-[11px] text-muted-foreground/75 truncate mt-0.5 font-normal leading-tight">
                                {snippet}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Original Location (without >) */}
                        <div className="w-44 lg:w-56 hidden md:flex items-center gap-1.5 px-2 text-muted-foreground overflow-hidden shrink-0">
                          <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate text-xs font-normal cursor-default">
                                {originalLoc}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {originalLoc}
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Deleted Timestamp */}
                        <div className="w-28 hidden sm:block px-2 text-muted-foreground text-xs truncate font-normal shrink-0">
                          {formatDeletedTime(note.deletedAt)}
                        </div>

                        {/* Size */}
                        <div className="w-24 hidden lg:block px-2 text-muted-foreground text-xs font-normal shrink-0">
                          {formatByteSize(note.size || 0)}
                        </div>

                        {/* Expires In */}
                        <div className="w-24 px-2 text-right sm:text-left shrink-0">
                          <span className={`text-xs ${exp.colorClass}`}>
                            {exp.text}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Table Bottom Action Bar (Fixed height to prevent layout shift) */}
              <div className="flex items-center justify-between px-4 min-h-[52px] border-t border-border/50 text-xs text-muted-foreground shrink-0 min-w-0 bg-card">
                <div className="flex items-center gap-3 min-w-0 truncate">
                  <span className="font-medium text-foreground shrink-0">
                    {t("trash.selected", { v0: selectedIds.length })}
                  </span>

                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleRestoreSelected}
                        className="px-4 py-2 rounded-[10px] border border-border/80 bg-background hover:bg-accent hover:text-white text-foreground text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all shrink-0"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>{t("trash.restore")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePromptDeleteSelected}
                        className="px-4 py-2 rounded-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{t("trash.deletePermanently")}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground shrink-0">
                  {t("trash.items", { v0: filteredNotes.length })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog: Delete Permanently */}
        <AlertDialog open={deletePermanentDialogOpen} onOpenChange={setDeletePermanentDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("trash.deletePermanentTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteIds.length === 1
                  ? (() => {
                      const note = trashedNotes.find((n) => n.id === pendingDeleteIds[0]);
                      const name = note?.fileName || note?.title;
                      return name
                        ? (t("trash.deletePermanentDesc", { file: name }))
                        : (t("trash.thisFileWillBePermanently"));
                    })()
                  : (t("trash.deletePermanentBatchDesc", { count: pendingDeleteIds.length }))}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleConfirmPermanentDelete}
              >
                {t("trash.deletePermanently")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmation Dialog: Empty Trash */}
        <AlertDialog open={emptyTrashDialogOpen} onOpenChange={setEmptyTrashDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("trash.emptyTrashTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("trash.emptyTrashDesc", { count: trashedNotes.length })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  onEmptyTrash();
                  setSelectedIds([]);
                  setEmptyTrashDialogOpen(false);
                }}
              >
                {t("trash.emptyTrash")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
