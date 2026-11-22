import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag as TagIcon,
  Search,
  X,
  FileText,
  FileCode,
  FileImage,
  Folder,
  Star,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Check,
  Filter,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { parseFrontmatterAndTags, isMarkdownNote } from "@/lib/frontmatter";
import { getNotePreviewSnippet } from "@/lib/snippetUtils";
import { getTagColorClass } from "@/lib/tagColors";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { getDefaultFileIconKey } from "@/lib/fileIconUtils";
import { NoteIcon as SharedNoteIcon } from "@/components/shared/NoteIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  type NoteCollectionSortBy,
  type NoteCollectionViewMode,
  matchesNoteFormatFilter,
  getNoteFormatBadge,
  sortNoteCollection,
  usePersistedCollectionSort,
  usePersistedCollectionViewMode,
} from "@/components/shared/NoteCollectionPrimitives";
import type { Note } from "@/hooks/useNotes";

interface TagsTabViewProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
  onToggleFavorite?: (noteId: string) => void;
  onRenameTagGlobally?: (oldTag: string, newTag: string) => void;
  onDeleteTagGlobally?: (tag: string) => void;
  onCreateBlankNote?: () => void;
}

export type TagsSortBy = NoteCollectionSortBy;
export type TagsViewMode = NoteCollectionViewMode;

const TAGS_SORT_STORAGE_KEY = "notes-app-tags-sort";
const TAGS_VIEW_MODE_STORAGE_KEY = "notes-app-tags-view-mode";

export default function TagsTabView({
  notes,
  onOpenNote,
  onToggleFavorite,
  onRenameTagGlobally,
  onDeleteTagGlobally,
  onCreateBlankNote,
}: TagsTabViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const isTh = settings.language === "th";
  const pack = settings?.iconPack || "lucide";

  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "md" | "txt" | "html" | "image">("all");
  const [sortBy, handleSortChange] = usePersistedCollectionSort(TAGS_SORT_STORAGE_KEY);
  const [viewMode, handleViewModeChange] = usePersistedCollectionViewMode(TAGS_VIEW_MODE_STORAGE_KEY);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Dialog states for global tag rename and delete
  const [tagToRename, setTagToRename] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [openMenuTag, setOpenMenuTag] = useState<string | null>(null);

  const renderIcon = (key: string, cls = "h-4 w-4") => {
    const IconComp = getToolbarIcon(key, pack);
    return <IconComp className={cls} />;
  };

  const renderNoteIcon = (note: Note, cls = "h-4 w-4") => (
    <SharedNoteIcon note={note} className={cls} iconPack={pack} />
  );

  const renderFolderIcon = (folderPath?: string, cls = "h-3.5 w-3.5 shrink-0") => {
    if (settings?.showFileIcons === false) return null;
    const customFolder = folderPath ? settings?.folderIcons?.[folderPath] : undefined;
    if (customFolder?.icon) {
      const custom = renderCustomIcon(customFolder.icon, `${cls} shrink-0`, { color: customFolder.color });
      if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
    }
    const FolderIcon = getToolbarIcon("folder", pack);
    return (
      <FolderIcon
        className={`${cls} shrink-0 ${customFolder?.color ? "" : "text-muted-foreground/70"}`}
        style={customFolder?.color ? { color: customFolder.color } : undefined}
      />
    );
  };

  const getNoteTags = (note: Note): string[] => {
    let tags = note.tags || [];
    if (tags.length === 0 && isMarkdownNote(note) && note.content) {
      try {
        tags = parseFrontmatterAndTags(note.content).allTags || [];
      } catch { /* ignore */ }
    }
    return tags;
  };

  // Keyboard shortcut Ctrl+K / Ctrl+F for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isCmdOrCtrl && (key === "k" || key === "f" || key === "า" || key === "ด")) {
        const active = document.activeElement;
        const isEditing =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute("contenteditable") === "true";

        if (!isEditing) {
          e.preventDefault();
          e.stopPropagation();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute all tags and their note frequencies
  const tagStats = useMemo(() => {
    const tagCountMap = new Map<string, number>();

    notes.forEach((note) => {
      const tagSet = new Set<string>();
      (note.tags || []).forEach((tag) => {
        const clean = tag.trim();
        if (clean) tagSet.add(clean);
      });

      if (isMarkdownNote(note) && note.content) {
        try {
          const parsed = parseFrontmatterAndTags(note.content);
          (parsed.allTags || []).forEach((tag) => {
            const clean = tag.trim();
            if (clean) tagSet.add(clean);
          });
        } catch { /* ignore */ }
      }

      tagSet.forEach((tag) => {
        tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
      });
    });

    const list = Array.from(tagCountMap.entries()).map(([tag, count]) => ({
      tag,
      count,
    }));

    // Sort by frequency descending, then alphabetically
    return list.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [notes]);

  // Notes that have tags
  const taggedNotes = useMemo(() => {
    return notes.filter((note) => {
      let tags = note.tags || [];
      if (tags.length === 0 && isMarkdownNote(note) && note.content) {
        try {
          tags = parseFrontmatterAndTags(note.content).allTags || [];
        } catch { /* ignore */ }
      }
      return tags.length > 0;
    });
  }, [notes]);

  // Filtered notes based on selectedTag, filterType, and query
  const filteredNotes = useMemo(() => {
    const list = taggedNotes.filter((note) => {
      const tags = getNoteTags(note);
      if (selectedTag !== "all" && !tags.includes(selectedTag)) {
        return false;
      }
      if (!matchesNoteFormatFilter(note, filterType)) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchTitle = (note.title || note.fileName || "").toLowerCase().includes(q);
        const matchContent = (note.content || "").toLowerCase().includes(q);
        const matchTag = tags.some((t) => t.toLowerCase().includes(q));
        const matchFolder = (note.folderPath || "").toLowerCase().includes(q);
        return matchTitle || matchContent || matchTag || matchFolder;
      }
      return true;
    });
    return sortNoteCollection(list, sortBy);
  }, [taggedNotes, selectedTag, filterType, query, sortBy]);

  const getCleanSnippet = (note: Note) => {
    return getNotePreviewSnippet(note, 160, isTh);
  };

  const getFormatBadge = (note: Note) => getNoteFormatBadge(note);

  const handleStartRename = (tag: string) => {
    setTagToRename(tag);
    setNewTagName(tag);
  };

  const handleConfirmRename = () => {
    if (tagToRename && newTagName.trim() && newTagName.trim() !== tagToRename) {
      onRenameTagGlobally?.(tagToRename, newTagName.trim());
      if (selectedTag === tagToRename) {
        setSelectedTag(newTagName.trim());
      }
    }
    setTagToRename(null);
    setNewTagName("");
  };

  const handleConfirmDelete = () => {
    if (tagToDelete) {
      onDeleteTagGlobally?.(tagToDelete);
      if (selectedTag === tagToDelete) {
        setSelectedTag("all");
      }
    }
    setTagToDelete(null);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 h-full overflow-hidden bg-background text-foreground select-none flex flex-col">
        <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-5 h-full min-h-0 overflow-hidden">
          {/* 1. Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <TagIcon className="h-6 w-6 text-primary shrink-0" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {t("tags.tags")}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("tags.browseFilterAndOrganizeYour")}
              </p>
            </div>

            {/* Functional Search Input Box & Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3.5 py-2 border border-sidebar-border/40 hover:border-primary/60 focus-within:border-primary w-full sm:w-56 md:w-64 transition-all shadow-none group">
                {renderIcon("search", "h-3.5 w-3.5 shrink-0 text-muted-foreground group-focus-within:text-primary transition-colors")}
                <input
                  ref={searchInputRef}
                  data-tags-search="true"
                  type="text"
                  placeholder={t("tags.searchTagsOrNotes")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setQuery("");
                      searchInputRef.current?.blur();
                    }
                  }}
                  className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                    aria-label={t("home.clearSearch")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Action Buttons Group (Filter + Sort) */}
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
                      onClick={() => setFilterType("image")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        filterType === "image" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {filterType === "image" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("favorites.images")}</span>
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

                {/* View Mode Toggle (List / Card) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewModeChange(viewMode === "list" ? "card" : "list")}
                      className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent bg-transparent focus:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-transparent shrink-0 transition-colors"
                      aria-label={
                        viewMode === "list"
                          ? (t("favorites.switchToCardView"))
                          : (t("favorites.switchToListView"))
                      }
                    >
                      {viewMode === "list" ? (
                        <LayoutGrid className="h-3.5 w-3.5" />
                      ) : (
                        <List className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {viewMode === "list"
                      ? (t("favorites.switchToCardView"))
                      : (t("favorites.switchToListView"))}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* 2. Tag Filter Pills (Shaded / Outlined Tint Style) */}
          <div
            className="flex items-center gap-1.5 pill-scrollbar w-full min-w-0 shrink-0 pb-1 pt-0.5"
            onWheel={(e) => {
              if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                selectedTag === "all"
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/40"
              }`}
            >
              {t("favorites.all")} ({taggedNotes.length})
            </button>

            {tagStats.map(({ tag, count }, idx) => {
              const isSelected = selectedTag === tag;
              const colorClass = getTagColorClass(tag, settings.theme, idx, settings.tagColorStyle);

              return (
                <div
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`group inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? `${colorClass} font-semibold shadow-sm`
                      : "border-border bg-card/60 text-foreground/80 hover:text-foreground hover:border-foreground/30 hover:bg-muted/40"
                  }`}
                >
                  <span>#{tag}</span>
                  <span className="text-[10px] font-mono opacity-60 ml-1">({count})</span>
                  {(onRenameTagGlobally || onDeleteTagGlobally) && (
                    <DropdownMenu
                      open={openMenuTag === tag}
                      onOpenChange={(open) => setOpenMenuTag(open ? tag : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className={`transition-all duration-150 cursor-pointer shrink-0 flex items-center justify-center p-0 text-muted-foreground hover:text-foreground ${
                            openMenuTag === tag
                              ? "w-3.5 opacity-100 ml-1.5"
                              : "w-0 opacity-0 overflow-hidden group-hover:w-3.5 group-hover:opacity-100 group-hover:ml-1.5"
                          }`}
                          aria-label={t("tags.tagOptions")}
                        >
                          <MoreVertical className="h-3 w-3 shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="w-48">
                        {onRenameTagGlobally && (
                          <DropdownMenuItem
                            onClick={() => handleStartRename(tag)}
                          >
                            <Edit2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>{t("tags.renameTag")}</span>
                          </DropdownMenuItem>
                        )}
                        {onDeleteTagGlobally && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setTagToDelete(tag)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 shrink-0 text-destructive" />
                            <span>{t("tags.deleteTag")}</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3. Tagged Notes Grid / List View / Empty State */}
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden w-full">
            {viewMode === "list" ? (
              <div className="flex flex-1 flex-col rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden min-w-0">
                {/* Table Header with Grayish Background (matching TrashView) */}
                <div className="flex items-center px-4 py-2.5 bg-muted/60 dark:bg-muted/40 border-b border-border/50 text-xs font-semibold text-foreground shrink-0 select-none min-w-0">
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <Star className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-[140px] px-2 truncate">{t("trash.file")}</div>
                  <div className="w-44 lg:w-56 hidden md:block px-2 shrink-0 truncate">{t("favorites.location")}</div>
                  <div className="w-32 hidden sm:block px-2 shrink-0 truncate">{t("favorites.modified")}</div>
                  <div className="w-20 hidden lg:block px-2 shrink-0 truncate">{t("trash.type")}</div>
                  <div className="w-8 px-1 shrink-0"></div>
                </div>

                {/* Table Body (Scrollable rows matching TrashView) */}
                <div className="no-scrollbar flex-1 overflow-y-auto divide-y divide-border/20 min-w-0">
                  {filteredNotes.length === 0 ? (
                    <EmptyState
                      className="h-full"
                      icon={tagStats.length === 0 ? <TagIcon /> : <Search />}
                      title={
                        tagStats.length === 0
                          ? (t("tags.noTagsFound"))
                          : (t("tags.noNotesMatchingThisTag"))
                      }
                      description={
                        tagStats.length === 0
                          ? (t("tags.typeTagInAnyNote"))
                          : (t("tags.tryChoosingAnotherTagOr"))
                      }
                    />
                  ) : (
                    filteredNotes.map((note) => {
                    const snippet = getCleanSnippet(note);
                    const formatExt = getFormatBadge(note);
                    const displayTags = getNoteTags(note);
                    const dateFormatted = formatRelativeDateTime(
                      note.updatedAt || note.createdAt || Date.now(),
                      settings.dateFormat,
                      settings.timeFormat,
                      settings.language
                    );
                    const location = note.folderPath || (t("trash.root"));

                    return (
                      <div
                        key={note.id}
                        onClick={() => onOpenNote(note.id)}
                        className="group flex items-center px-4 py-2.5 text-xs transition-colors cursor-pointer min-w-0 hover:bg-muted/30 text-foreground/90"
                      >
                        {/* Star Toggle Button */}
                        <div className="w-8 flex items-center justify-center shrink-0">
                          {onToggleFavorite && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(note.id);
                                  }}
                                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                                    note.isFavorite
                                      ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                      : "text-muted-foreground/40 hover:text-amber-500 hover:bg-muted/50"
                                  }`}
                                  aria-label={note.isFavorite ? (t("favorites.unstar")) : (t("tags.star"))}
                                >
                                  <Star className={`h-3.5 w-3.5 ${note.isFavorite ? "fill-amber-500 text-amber-500" : ""}`} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={4}>
                                {note.isFavorite ? (t("favorites.unstar")) : (t("tags.star"))}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {/* Note Info: Icon + Title + Tag Pill + Snippet */}
                        <div className="flex-1 min-w-[140px] px-2 flex items-center gap-2.5 overflow-hidden">
                          {renderNoteIcon(note, "h-4 w-4")}
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-semibold text-foreground text-xs truncate group-hover:text-primary transition-colors">
                                {note.fileName || note.title || t("editor.untitled")}
                              </span>
                              {displayTags && displayTags.length > 0 &&
                                displayTags.slice(0, 3).map((tag, idx) => (
                                  <button
                                    type="button"
                                    key={tag}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTag(tag);
                                    }}
                                    className={`shrink-0 text-[9.5px] px-1.5 py-0.5 rounded font-medium border cursor-pointer hover:opacity-80 transition-opacity ${getTagColorClass(
                                      tag,
                                      settings.theme,
                                      idx,
                                      settings.tagColorStyle
                                    )}`}
                                  >
                                    #{tag}
                                  </button>
                                ))}
                              {displayTags && displayTags.length > 3 && (
                                <span className="text-[9.5px] text-muted-foreground/70 shrink-0">
                                  +{displayTags.length - 3}
                                </span>
                              )}
                            </div>
                            {snippet && (
                              <p className="text-[11px] text-muted-foreground/75 truncate mt-0.5 font-normal leading-tight">
                                {snippet}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="w-44 lg:w-56 hidden md:flex items-center gap-1.5 px-2 text-muted-foreground overflow-hidden shrink-0">
                          {renderFolderIcon(note.folderPath, "h-3.5 w-3.5")}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate text-xs font-normal cursor-default">
                                {location}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {location}
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Modified Date */}
                        <div className="w-32 hidden sm:block px-2 text-muted-foreground text-xs truncate font-normal shrink-0">
                          {dateFormatted}
                        </div>

                        {/* Format Badge */}
                        <div className="w-20 hidden lg:block px-2 text-muted-foreground text-xs font-normal shrink-0">
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border border-border/40 bg-sidebar-accent/60 text-muted-foreground uppercase">
                            .{formatExt.toLowerCase()}
                          </span>
                        </div>

                        {/* Action Arrow */}
                        <div className="w-8 px-1 flex justify-end shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

                {/* Table Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 text-xs text-muted-foreground shrink-0 min-w-0 bg-card">
                  <span className="text-[11.5px] text-muted-foreground font-medium">
                    {t("trash.items", { v0: filteredNotes.length })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto w-full pr-1">
                {filteredNotes.length === 0 ? (
                  <EmptyState
                    className="h-full"
                    icon={tagStats.length === 0 ? <TagIcon /> : <Search />}
                    title={
                      tagStats.length === 0
                        ? (t("tags.noTagsFound"))
                        : (t("tags.noNotesMatchingThisTag"))
                    }
                    description={
                      tagStats.length === 0
                        ? (t("tags.typeTagInAnyNote"))
                        : (t("tags.tryChoosingAnotherTagOr"))
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-4">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => {
                    const snippet = getCleanSnippet(note);
                    const formatExt = getFormatBadge(note);
                    const displayTags = getNoteTags(note);
                    const dateFormatted = formatRelativeDateTime(
                      note.updatedAt || note.createdAt || Date.now(),
                      settings.dateFormat,
                      settings.timeFormat,
                      settings.language
                    );

                    return (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onOpenNote(note.id)}
                        className="flex flex-col justify-between p-4 rounded-xl bg-card border-[1.5px] border-border/70 hover:border-primary/60 hover:bg-muted/40 transition-all group shadow-sm cursor-pointer relative text-left"
                      >
                        {/* Top Row: Icon + Title + Format + Star Button */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {renderNoteIcon(note, "h-4 w-4")}
                              <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                                {note.fileName || note.title || t("editor.untitled")}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border border-border/40 bg-sidebar-accent/60 text-muted-foreground uppercase">
                                .{formatExt.toLowerCase()}
                              </span>

                              {/* Star Toggle Button */}
                              {onToggleFavorite && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(note.id);
                                      }}
                                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                                        note.isFavorite
                                          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                          : "text-muted-foreground/50 hover:text-amber-500 hover:bg-muted/50"
                                      }`}
                                      aria-label={note.isFavorite ? (t("favorites.unstar")) : (t("tags.star"))}
                                    >
                                      <Star className={`h-3.5 w-3.5 ${note.isFavorite ? "fill-amber-500" : ""}`} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={4}>
                                    {note.isFavorite ? (t("favorites.unstar")) : (t("tags.star"))}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>

                          {/* Content Snippet Preview */}
                          {snippet && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 line-clamp-2">
                              {snippet}
                            </p>
                          )}
                        </div>

                        {/* Bottom Row: Tags + Folder + Date */}
                        <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-1.5 text-[10.5px] text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-1 min-w-0 max-w-[65%]">
                            {displayTags && displayTags.length > 0 ? (
                              displayTags.map((tag, idx) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTag(tag);
                                  }}
                                  className={`px-1.5 py-0.5 rounded-md font-medium border text-[10px] truncate max-w-[100px] cursor-pointer hover:opacity-80 transition-opacity ${getTagColorClass(
                                    tag,
                                    settings.theme,
                                    idx,
                                    settings.tagColorStyle
                                  )}`}
                                >
                                  #{tag}
                                </button>
                              ))
                            ) : note.folderPath ? (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                {renderFolderIcon(note.folderPath, "h-3 w-3")}
                                <span className="truncate">{note.folderPath}</span>
                              </span>
                            ) : null}
                          </div>

                          <span className="text-[10px] shrink-0 text-muted-foreground/70 font-normal">
                            {dateFormatted}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Tag Rename Dialog */}
        <Dialog open={Boolean(tagToRename)} onOpenChange={(open) => !open && setTagToRename(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t("tags.renameTag2", { tagToRename })}</DialogTitle>
              <DialogDescription>
                {t("tags.renameThisTagAcrossAll")}
              </DialogDescription>
            </DialogHeader>

            <div className="py-1">
              <label htmlFor="rename-tag-name" className="mb-2 block text-sm font-medium text-foreground">
                {t("tags.newTagName")}
              </label>
              <input
                id="rename-tag-name"
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value.replace(/^[#\s]+/, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmRename();
                  }
                }}
                placeholder={tagToRename || "tag"}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTagToRename(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmRename}
                disabled={!newTagName.trim() || newTagName.trim() === tagToRename}
              >
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Global Tag Delete Confirmation Dialog */}
        <AlertDialog open={Boolean(tagToDelete)} onOpenChange={(open) => !open && setTagToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("tags.deleteTag2", { tagToDelete })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("tags.areYouSureYouWant", { tagToDelete })}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTagToDelete(null)}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("tags.deleteTag3")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
