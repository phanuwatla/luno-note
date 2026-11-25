import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Search,
  X,
  FileText,
  FileCode,
  FileImage,
  Folder,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Filter,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { parseFrontmatterAndTags, isMarkdownNote } from "@/lib/frontmatter";
import { getNotePreviewSnippet } from "@/lib/snippetUtils";
import { getTagColorClass } from "@/lib/tagColors";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import { getDefaultFileIconKey } from "@/lib/fileIconUtils";
import { NoteIcon as SharedNoteIcon } from "@/components/shared/NoteIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  type NoteCollectionSortBy,
  type NoteCollectionViewMode,
  isCollectionMarkdownNote,
  isCollectionHtmlNote,
  isCollectionTextNote,
  isCollectionImageNote,
  matchesNoteFormatFilter,
  getNoteFormatBadge,
  sortNoteCollection,
  usePersistedCollectionSort,
  usePersistedCollectionViewMode,
} from "@/components/shared/NoteCollectionPrimitives";
import type { Note } from "@/hooks/useNotes";

interface FavoritesTabViewProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  onCreateBlankNote?: () => void;
}

export type FavoritesSortBy = NoteCollectionSortBy;
export type FavoritesViewMode = NoteCollectionViewMode;

const FAVORITES_SORT_STORAGE_KEY = "notes-app-favorites-sort";
const FAVORITES_VIEW_MODE_STORAGE_KEY = "notes-app-favorites-view-mode";

export default function FavoritesTabView({
  notes,
  onOpenNote,
  onToggleFavorite,
  onCreateBlankNote,
}: FavoritesTabViewProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const isTh = settings.language === "th";
  const pack = settings?.iconPack || "lucide";

  const [query, setQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [sortBy, handleSortChange] = usePersistedCollectionSort(FAVORITES_SORT_STORAGE_KEY);
  const [viewMode, handleViewModeChange] = usePersistedCollectionViewMode(FAVORITES_VIEW_MODE_STORAGE_KEY);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  // Filter out non-favorite notes
  const favoriteNotes = useMemo(() => {
    return notes.filter((n) => {
      if (n.isFavorite) return true;
      if (isMarkdownNote(n) && n.content) {
        try {
          const parsed = parseFrontmatterAndTags(n.content);
          return Boolean(parsed.frontmatterData?.favorite);
        } catch {
          return false;
        }
      }
      return false;
    });
  }, [notes]);

  const formatCategories = useMemo(
    () => [
      { id: "all", label: t("favorites.all") },
      { id: "md", label: "Markdown" },
      { id: "html", label: "HTML" },
      { id: "txt", label: t("favorites.text") },
      { id: "image", label: t("favorites.images") },
    ],
    [isTh]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: favoriteNotes.length,
      md: 0,
      html: 0,
      txt: 0,
      image: 0,
    };

    favoriteNotes.forEach((note) => {
      if (isCollectionMarkdownNote(note)) counts.md++;
      if (isCollectionHtmlNote(note)) counts.html++;
      if (isCollectionTextNote(note)) counts.txt++;
      if (isCollectionImageNote(note)) counts.image++;
    });

    return counts;
  }, [favoriteNotes]);

  const filteredNotes = useMemo(() => {
    const list = favoriteNotes.filter((note) => {
      if (!matchesNoteFormatFilter(note, selectedFormat)) return false;
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchTitle = (note.title || note.fileName || "").toLowerCase().includes(q);
        const matchContent = (note.content || "").toLowerCase().includes(q);
        const matchFolder = (note.folderPath || "").toLowerCase().includes(q);
        const matchTags = (note.tags || []).some((tag) => tag.toLowerCase().includes(q));
        return matchTitle || matchContent || matchFolder || matchTags;
      }
      return true;
    });
    return sortNoteCollection(list, sortBy);
  }, [favoriteNotes, selectedFormat, query, sortBy]);

  const getCleanSnippet = (note: Note) => {
    return getNotePreviewSnippet(note, 160, isTh);
  };

  const getFormatBadge = (note: Note) => getNoteFormatBadge(note);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 h-full overflow-hidden bg-background text-foreground select-none flex flex-col">
        <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-5 h-full min-h-0 overflow-hidden">
          {/* 1. Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-amber-500 fill-amber-500 shrink-0" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {t("favorites.favorites")}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("favorites.quicklyAccessYourPinnedAnd")}
              </p>
            </div>

            {/* Functional Search Input Box & Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3.5 py-2 border border-sidebar-border/40 hover:border-primary/60 focus-within:border-primary w-full sm:w-56 md:w-64 transition-all shadow-none group">
                {renderIcon("search", "h-3.5 w-3.5 shrink-0 text-muted-foreground group-focus-within:text-primary transition-colors")}
                <input
                  ref={searchInputRef}
                  data-favorites-search="true"
                  type="text"
                  placeholder={t("favorites.searchFavorites")}
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
                            selectedFormat !== "all"
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
                      onClick={() => setSelectedFormat("all")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "all" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "all" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterAll")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("md")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "md" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "md" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterMd")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("txt")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "txt" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "txt" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterTxt")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("html")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "html" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "html" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterHtml")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("image")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "image" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : "text-foreground hover:bg-primary/[0.08] hover:text-primary data-[highlighted]:bg-primary/[0.08] data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "image" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
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

          {/* 2. Format Filter Pills (Shaded/Outlined Tint Style) */}
          <div
            className="flex items-center gap-1.5 pill-scrollbar w-full min-w-0 shrink-0 pb-1"
            onWheel={(e) => {
              if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            {formatCategories.map((cat) => {
              const isSelected = selectedFormat === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedFormat(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/40"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* 3. Favorite Notes Grid / List View / Empty State */}
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden w-full">
            {viewMode === "list" ? (
              <div className="flex flex-1 flex-col rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden min-w-0 luno-section-enter">
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
                      icon={favoriteNotes.length === 0 ? <Star /> : <Search />}
                      title={
                        favoriteNotes.length === 0
                          ? (t("favorites.noFavoriteNotesYet"))
                          : (t("favorites.noMatchingFavoriteNotes"))
                      }
                      description={
                        favoriteNotes.length === 0
                          ? (t("favorites.clickTheStarIconOn"))
                          : (t("favorites.tryChangingSearchTermsOr"))
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
                          className="group flex items-center px-4 py-2.5 text-xs transition-all duration-150 active:scale-[0.995] cursor-pointer min-w-0 hover:bg-muted/30 text-foreground/90"
                        >
                          {/* Star Toggle Button */}
                          <div className="w-8 flex items-center justify-center shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(note.id);
                                  }}
                                  className="p-1 rounded-md text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                  aria-label={t("favorites.removeFromFavorites")}
                                >
                                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={4}>
                                {t("favorites.unstar")}
                              </TooltipContent>
                            </Tooltip>
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
                                    <span
                                      key={tag}
                                      className={`shrink-0 text-[9.5px] px-1.5 py-0.5 rounded font-medium border ${getTagColorClass(
                                        tag,
                                        settings.theme,
                                        idx,
                                        settings.tagColorStyle
                                      )}`}
                                    >
                                      #{tag}
                                    </span>
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
                    icon={favoriteNotes.length === 0 ? <Star /> : <Search />}
                    title={
                      favoriteNotes.length === 0
                        ? (t("favorites.noFavoriteNotesYet"))
                        : (t("favorites.noMatchingFavoriteNotes"))
                    }
                    description={
                      favoriteNotes.length === 0
                        ? (t("favorites.clickTheStarIconOn"))
                        : (t("favorites.tryChangingSearchTermsOr"))
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
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onToggleFavorite(note.id);
                                        }}
                                        className="p-1 rounded-md text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                        aria-label={t("favorites.removeFromFavorites")}
                                      >
                                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={4}>
                                      {t("favorites.unstar")}
                                    </TooltipContent>
                                  </Tooltip>
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
                                  displayTags.slice(0, 2).map((tag, idx) => (
                                    <span
                                      key={tag}
                                      className={`px-1.5 py-0.5 rounded-md font-medium border text-[10px] truncate max-w-[100px] ${getTagColorClass(
                                        tag,
                                        settings.theme,
                                        idx,
                                        settings.tagColorStyle
                                      )}`}
                                    >
                                      #{tag}
                                    </span>
                                  ))
                                ) : note.folderPath ? (
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                    {renderFolderIcon(note.folderPath, "h-3 w-3")}
                                    <span className="truncate">{note.folderPath}</span>
                                  </span>
                                ) : null}
                                {displayTags && displayTags.length > 2 && (
                                  <span className="text-[9.5px] text-muted-foreground/70">
                                    +{displayTags.length - 2}
                                  </span>
                                )}
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
      </div>
    </TooltipProvider>
  );
}
