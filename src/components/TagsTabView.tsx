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
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { parseFrontmatterAndTags, isMarkdownNote } from "@/lib/frontmatter";
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
import { Button } from "@/components/ui/button";
import { renderCustomIcon, getToolbarIcon } from "@/lib/iconPacks";
import type { Note } from "@/hooks/useNotes";

interface TagsTabViewProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
  onToggleFavorite?: (noteId: string) => void;
  onRenameTagGlobally?: (oldTag: string, newTag: string) => void;
  onDeleteTagGlobally?: (tag: string) => void;
  onCreateBlankNote?: () => void;
}

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
        } catch {}
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
        } catch {}
      }
      return tags.length > 0;
    });
  }, [notes]);

  // Filtered notes based on selectedTag and query
  const filteredNotes = useMemo(() => {
    return taggedNotes.filter((note) => {
      let tags = note.tags || [];
      if (tags.length === 0 && isMarkdownNote(note) && note.content) {
        try {
          tags = parseFrontmatterAndTags(note.content).allTags || [];
        } catch {}
      }

      if (selectedTag !== "all" && !tags.includes(selectedTag)) {
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
  }, [taggedNotes, selectedTag, query]);

  const getCleanSnippet = (note: Note) => {
    if (!note.content) return "";
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
      <div className="flex-1 h-full min-h-0 overflow-y-auto bg-background text-foreground select-none flex flex-col">
        <div className="max-w-5xl w-full mx-auto px-6 py-5 flex-1 flex flex-col gap-5">
          {/* 1. Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 pb-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <TagIcon className="h-6 w-6 text-primary shrink-0" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {isTh ? "แท็กทั้งหมด" : "Tags"}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {isTh
                  ? "ค้นหา กรอง และจัดระเบียบโน้ตและไฟล์ทั้งหมดตามแท็กได้อย่างง่ายดาย"
                  : "Browse, filter, and organize your notes and files by tags effortlessly."}
              </p>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3.5 py-2 border border-sidebar-border/40 hover:border-primary/60 focus-within:border-primary w-full md:w-64 transition-all shadow-none group">
              {renderIcon("search", "h-3.5 w-3.5 shrink-0 text-muted-foreground group-focus-within:text-primary transition-colors")}
              <input
                ref={searchInputRef}
                data-tags-search="true"
                type="text"
                placeholder={isTh ? "ค้นหาแท็กหรือโน้ต..." : "Search tags or notes..."}
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

          {/* 2. Tag Filter Pills (Shaded / Outlined Tint Style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 py-0.5">
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                selectedTag === "all"
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/40"
              }`}
            >
              {isTh ? "ทั้งหมด" : "All"} ({taggedNotes.length})
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
                      ? `${colorClass} font-semibold shadow-2xs`
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
                          aria-label={isTh ? "จัดการแท็ก" : "Tag options"}
                        >
                          <MoreVertical className="h-3 w-3 shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="w-48 rounded-xl p-1.5 shadow-lg border border-border">
                        {onRenameTagGlobally && (
                          <DropdownMenuItem
                            onClick={() => handleStartRename(tag)}
                            className="gap-2.5 cursor-pointer py-2 px-3 rounded-lg text-sm"
                          >
                            <Edit2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>{isTh ? "เปลี่ยนชื่อแท็ก" : "Rename Tag"}</span>
                          </DropdownMenuItem>
                        )}
                        {onDeleteTagGlobally && (
                          <DropdownMenuItem
                            onClick={() => setTagToDelete(tag)}
                            className="gap-2.5 text-destructive focus:text-destructive cursor-pointer py-2 px-3 rounded-lg text-sm"
                          >
                            <Trash2 className="h-4 w-4 shrink-0" />
                            <span>{isTh ? "ลบแท็กนี้" : "Delete Tag"}</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3. Tagged Notes Grid / Empty State */}
          <div className={`space-y-4 ${filteredNotes.length === 0 ? "flex-1 flex flex-col items-center justify-center min-h-[360px]" : ""}`}>
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                {tagStats.length === 0 ? (
                  <>
                    <TagIcon className="h-10 w-10 text-muted-foreground/40 stroke-1 mb-1" />
                    <p className="text-base font-semibold text-foreground">
                      {isTh ? "ยังไม่มีแท็กในโน้ต" : "No tags found"}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {isTh
                        ? "พิมพ์ #ชื่อแท็ก ในเนื้อหาโน้ตเพื่อจัดหมวดหมู่และค้นหาได้อย่างรวดเร็ว"
                        : "Type #tag in any note content to organize and find notes instantly."}
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="h-10 w-10 text-muted-foreground/40 stroke-1 mb-1" />
                    <p className="text-sm font-semibold text-foreground">
                      {isTh ? "ไม่พบโน้ตที่ตรงกับแท็กนี้" : "No notes matching this tag"}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {isTh
                        ? "ลองเลือกแท็กอื่นหรือล้างคำค้นหาเพื่อดูโน้ตทั้งหมด"
                        : "Try choosing another tag or clear your search query."}
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
                                      aria-label={note.isFavorite ? (isTh ? "ยกเลิกการติดดาว" : "Unstar") : (isTh ? "ติดดาว" : "Star")}
                                    >
                                      <Star className={`h-3.5 w-3.5 ${note.isFavorite ? "fill-amber-500" : ""}`} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={4}>
                                    {note.isFavorite ? (isTh ? "ยกเลิกการติดดาว" : "Unstar") : (isTh ? "ติดดาว" : "Star")}
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
                            {note.tags && note.tags.length > 0 ? (
                              note.tags.map((tag, idx) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTag(tag);
                                  }}
                                  className={`px-1.5 py-0.2 rounded-md font-medium border text-[10px] truncate max-w-[100px] cursor-pointer hover:opacity-80 transition-opacity ${getTagColorClass(
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
                                <Folder className="h-3 w-3 shrink-0" />
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
        </div>

        {/* Global Tag Rename Dialog */}
        <Dialog open={Boolean(tagToRename)} onOpenChange={(open) => !open && setTagToRename(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{isTh ? `เปลี่ยนชื่อแท็ก #${tagToRename}` : `Rename Tag #${tagToRename}`}</DialogTitle>
              <DialogDescription>
                {isTh ? "เปลี่ยนชื่อแท็กนี้ในโน้ตทั้งหมดที่ใช้แท็กนี้อยู่" : "Rename this tag across all notes that use it."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-1">
              <label htmlFor="rename-tag-name" className="mb-2 block text-sm font-medium text-foreground">
                {isTh ? "ชื่อแท็กใหม่" : "New Tag Name"}
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
                {isTh ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmRename}
                disabled={!newTagName.trim() || newTagName.trim() === tagToRename}
              >
                {isTh ? "บันทึก" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Global Tag Delete Confirmation Dialog */}
        <Dialog open={Boolean(tagToDelete)} onOpenChange={(open) => !open && setTagToDelete(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{isTh ? `ลบแท็ก #${tagToDelete}` : `Delete Tag #${tagToDelete}`}</DialogTitle>
              <DialogDescription>
                {isTh
                  ? `คุณต้องการลบแท็ก #${tagToDelete} ออกจากโน้ตทั้งหมดหรือไม่? (เนื้อหาของโน้ตจะยังคงปลอดภัย)`
                  : `Are you sure you want to remove the tag #${tagToDelete} from all notes? (Note contents will remain safe)`}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTagToDelete(null)}>
                {isTh ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                {isTh ? "ลบแท็ก" : "Delete Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
