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
import type { Note } from "@/hooks/useNotes";

interface FavoritesTabViewProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  onCreateBlankNote?: () => void;
}

export type FavoritesSortBy =
  | "name-asc"
  | "name-desc"
  | "modified-desc"
  | "modified-asc"
  | "created-desc"
  | "created-asc";

const FAVORITES_SORT_STORAGE_KEY = "notes-app-favorites-sort";

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
  const [sortBy, setSortBy] = useState<FavoritesSortBy>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem(FAVORITES_SORT_STORAGE_KEY) as FavoritesSortBy;
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

  const handleSortChange = (newSort: FavoritesSortBy) => {
    setSortBy(newSort);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(FAVORITES_SORT_STORAGE_KEY, newSort);
      }
    } catch {
      // ignore
    }
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const renderIcon = (key: string, cls = "h-4 w-4") => {
    const IconComp = getToolbarIcon(key, pack);
    return <IconComp className={cls} />;
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
      { id: "all", label: isTh ? "ทั้งหมด" : "All" },
      { id: "md", label: "Markdown" },
      { id: "html", label: "HTML" },
      { id: "txt", label: isTh ? "ข้อความ" : "Text" },
      { id: "image", label: isTh ? "รูปภาพ" : "Images" },
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
      const name = note.fileName?.toLowerCase() || "";
      const isMd = name.endsWith(".md") || name.endsWith(".markdown") || note.contentFormat === "markdown";
      const isHtml = name.endsWith(".html") || name.endsWith(".htm") || note.contentFormat === "html";
      const isTxt = name.endsWith(".txt") || note.contentFormat === "plain";
      const isImg = note.fileType === "image" || /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(name);

      if (isMd) counts.md++;
      if (isHtml) counts.html++;
      if (isTxt) counts.txt++;
      if (isImg) counts.image++;
    });

    return counts;
  }, [favoriteNotes]);

  const filteredNotes = useMemo(() => {
    const list = favoriteNotes.filter((note) => {
      const name = note.fileName?.toLowerCase() || "";
      const isMd = name.endsWith(".md") || name.endsWith(".markdown") || note.contentFormat === "markdown";
      const isHtml = name.endsWith(".html") || name.endsWith(".htm") || note.contentFormat === "html";
      const isTxt = name.endsWith(".txt") || note.contentFormat === "plain";
      const isImg = note.fileType === "image" || /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(name);

      if (selectedFormat === "md" && !isMd) return false;
      if (selectedFormat === "html" && !isHtml) return false;
      if (selectedFormat === "txt" && !isTxt) return false;
      if (selectedFormat === "image" && !isImg) return false;

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
        const modA = a.updatedAt || a.createdAt || 0;
        const modB = b.updatedAt || b.createdAt || 0;
        return modB - modA;
      }
      if (sortBy === "modified-asc") {
        const modA = a.updatedAt || a.createdAt || 0;
        const modB = b.updatedAt || b.createdAt || 0;
        return modA - modB;
      }
      if (sortBy === "created-desc") {
        const creA = a.createdAt || 0;
        const creB = b.createdAt || 0;
        return creB - creA;
      }
      if (sortBy === "created-asc") {
        const creA = a.createdAt || 0;
        const creB = b.createdAt || 0;
        return creA - creB;
      }
      return 0;
    });
  }, [favoriteNotes, selectedFormat, query, sortBy]);

  const getCleanSnippet = (note: Note) => {
    return getNotePreviewSnippet(note, 160, isTh);
  };

  const getFormatBadge = (note: Note) => {
    const name = note.fileName?.toLowerCase() || "";
    if (note.fileType === "image" || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return "IMG";
    if (name.endsWith(".html") || note.contentFormat === "html") return "HTML";
    if (name.endsWith(".txt") || note.contentFormat === "plain") return "TXT";
    return "MD";
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex-1 h-full min-h-0 overflow-y-auto bg-background text-foreground select-none flex flex-col">
        <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-5">
          {/* 1. Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-amber-500 fill-amber-500 shrink-0" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {isTh ? "โน้ตที่ติดดาว" : "Favorites"}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {isTh
                  ? "เข้าถึงโน้ตและไฟล์สำคัญที่คุณติดดาวไว้ได้อย่างรวดเร็วในที่เดียว"
                  : "Quickly access your pinned and starred notes in one place."}
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
                  placeholder={isTh ? "ค้นหาในรายการโปรด..." : "Search favorites..."}
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
                    aria-label={isTh ? "ล้างข้อความ" : "Clear search"}
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
                    <TooltipContent>{t("trash.filterTooltip") || (isTh ? "กรองตามประเภท" : "Filter files")}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-md">
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("all")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "all" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : "text-foreground hover:bg-primary/8 hover:text-primary data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "all" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterAll") || (isTh ? "ไฟล์ทั้งหมด" : "All items")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("md")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "md" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : "text-foreground hover:bg-primary/8 hover:text-primary data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "md" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterMd") || "Markdown (.md)"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("txt")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "txt" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : "text-foreground hover:bg-primary/8 hover:text-primary data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "txt" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterTxt") || (isTh ? "ข้อความ (.txt)" : "Text (.txt)")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("html")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "html" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : "text-foreground hover:bg-primary/8 hover:text-primary data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "html" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{t("trash.filterHtml") || "HTML (.html)"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFormat("image")}
                      className={`py-1.5 px-3 rounded-lg flex items-center gap-2.5 cursor-pointer text-[13px] ${
                        selectedFormat === "image" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : "text-foreground hover:bg-primary/8 hover:text-primary data-[highlighted]:bg-primary/8 data-[highlighted]:text-primary"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {selectedFormat === "image" && <Check className="h-4 w-4 text-primary stroke-[2.5]" />}
                      </span>
                      <span>{isTh ? "รูปภาพ" : "Images"}</span>
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
                    <TooltipContent>{t("sidebar.sort") || (isTh ? "เรียงลำดับ" : "Sort by")}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5 shadow-md">
                    <DropdownMenuItem
                      onClick={() => handleSortChange("name-asc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "name-asc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ArrowDownAZ className="h-4 w-4" />
                        <span>{t("sidebar.sortNameAsc") || "Name (A to Z)"}</span>
                      </div>
                      {sortBy === "name-asc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("name-desc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "name-desc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ArrowUpAZ className="h-4 w-4" />
                        <span>{t("sidebar.sortNameDesc") || "Name (Z to A)"}</span>
                      </div>
                      {sortBy === "name-desc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("modified-desc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "modified-desc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4" />
                        <span>{t("sidebar.sortModifiedDesc") || "Date modified (Newest)"}</span>
                      </div>
                      {sortBy === "modified-desc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("modified-asc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "modified-asc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 opacity-60" />
                        <span>{t("sidebar.sortModifiedAsc") || "Date modified (Oldest)"}</span>
                      </div>
                      {sortBy === "modified-asc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("created-desc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "created-desc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4" />
                        <span>{t("sidebar.sortCreatedDesc") || "Date created (Newest)"}</span>
                      </div>
                      {sortBy === "created-desc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSortChange("created-asc")}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        sortBy === "created-asc" ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/18 hover:bg-primary/18" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 opacity-60" />
                        <span>{t("sidebar.sortCreatedAsc") || "Date created (Oldest)"}</span>
                      </div>
                      {sortBy === "created-asc" && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/40"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* 3. Favorite Notes Grid / Empty State */}
          <div className={`space-y-4 ${filteredNotes.length === 0 ? "flex-1 flex flex-col items-center justify-center min-h-[360px]" : ""}`}>
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                {favoriteNotes.length === 0 ? (
                  <>
                    <Star className="h-10 w-10 text-muted-foreground/40 stroke-1 mb-1" />
                    <p className="text-base font-semibold text-foreground">
                      {isTh ? "ยังไม่มีโน้ตที่ติดดาว" : "No favorite notes yet"}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {isTh
                        ? "กดที่ไอคอนดาวบนโน้ตหรือการ์ดเพื่อเพิ่มเข้ามาในรายการโปรดสำหรับการเข้าถึงด่วน"
                        : "Click the star icon on any note or card to add it to your favorites for quick access."}
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="h-10 w-10 text-muted-foreground/40 stroke-1 mb-1" />
                    <p className="text-sm font-semibold text-foreground">
                      {isTh ? "ไม่พบโน้ตที่ตรงกับการค้นหา" : "No matching favorite notes"}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {isTh
                        ? "ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นเพื่อดูโน้ตที่ติดดาวทั้งหมด"
                        : "Try changing search terms or switch category filter to see all favorites."}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => {
                    const snippet = getCleanSnippet(note);
                    const formatExt = getFormatBadge(note);
                    const dateFormatted = formatRelativeDateTime(
                      note.updatedAt || note.createdAt || Date.now(),
                      settings.language,
                      settings.dateFormat,
                      settings.timeFormat
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
                        className="flex flex-col justify-between p-4 rounded-xl bg-card border-[1.5px] border-border/70 hover:border-primary/60 hover:bg-muted/40 transition-all group shadow-2xs cursor-pointer relative text-left"
                      >
                        {/* Top Row: Icon + Title + Format + Star Button */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {note.icon ? (
                                <span className="shrink-0 flex items-center justify-center">
                                  {renderCustomIcon(note.icon, "h-4 w-4", { color: note.iconColor })}
                                </span>
                              ) : (() => {
                                const defaultKey = getDefaultFileIconKey(note.fileName, note.fileType, note.contentFormat);
                                const IconComp = getToolbarIcon(defaultKey, settings.iconPack);
                                return <IconComp className="h-4 w-4 shrink-0 text-primary" />;
                              })()}
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
                                    aria-label={isTh ? "ยกเลิกการติดดาว" : "Remove from favorites"}
                                  >
                                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={4}>
                                  {isTh ? "ยกเลิกการติดดาว" : "Unstar"}
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
                            {note.tags && note.tags.length > 0 ? (
                              note.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={tag}
                                  className={`px-1.5 py-0.2 rounded-md font-medium border text-[10px] truncate max-w-[100px] ${getTagColorClass(
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
                                <Folder className="h-3 w-3 shrink-0" />
                                <span className="truncate">{note.folderPath}</span>
                              </span>
                            ) : null}
                            {note.tags && note.tags.length > 2 && (
                              <span className="text-[9.5px] text-muted-foreground/70">
                                +{note.tags.length - 2}
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
        </div>
      </div>
    </TooltipProvider>
  );
}
