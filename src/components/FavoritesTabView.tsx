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
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { parseFrontmatterAndTags, isMarkdownNote } from "@/lib/frontmatter";
import { getTagColorClass } from "@/lib/tagColors";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import type { Note } from "@/hooks/useNotes";

interface FavoritesTabViewProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  onCreateBlankNote?: () => void;
}

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
      { id: "md", label: "Markdown (.md)" },
      { id: "html", label: "HTML (.html)" },
      { id: "txt", label: isTh ? "ข้อความ (.txt)" : "Text (.txt)" },
      { id: "image", label: isTh ? "รูปภาพ" : "Images" },
    ],
    [isTh]
  );

  const filteredNotes = useMemo(() => {
    return favoriteNotes.filter((note) => {
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
  }, [favoriteNotes, selectedFormat, query]);

  const getCleanSnippet = (note: Note) => {
    if (!note.content) return "";
    if (note.fileType === "image") return isTh ? "ไฟล์รูปภาพ" : "Image file";
    try {
      const parsed = parseFrontmatterAndTags(note.content);
      const text = (parsed.bodyContent || note.content)
        .replace(/^[#\s*>-]+/gm, "")
        .replace(/\[\[([^\]]+)\]\]/g, "$1")
        .replace(/`{1,3}[^`]*`{1,3}/g, "")
        .trim();
      return text.slice(0, 160);
    } catch {
      return note.content.slice(0, 160);
    }
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
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {favoriteNotes.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isTh
                  ? "เข้าถึงโน้ตและไฟล์สำคัญที่คุณติดดาวไว้ได้อย่างรวดเร็วในที่เดียว"
                  : "Quickly access your pinned and starred notes in one place."}
              </p>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3.5 py-2 border border-sidebar-border/40 hover:border-primary/60 focus-within:border-primary w-full md:w-64 transition-all shadow-none group">
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
          </div>

          {/* 2. Format Filter Pills (Shaded/Outlined Tint Style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {formatCategories.map((cat) => {
              const isSelected = selectedFormat === cat.id;
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
                  {cat.label}
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
                              ) : formatExt === "HTML" ? (
                                <FileCode className="h-4 w-4 shrink-0 text-blue-500" />
                              ) : formatExt === "IMG" ? (
                                <FileImage className="h-4 w-4 shrink-0 text-emerald-500" />
                              ) : (
                                <FileText className="h-4 w-4 shrink-0 text-primary" />
                              )}
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

                          <span className="text-[10px] shrink-0 text-muted-foreground/70 font-mono">
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
