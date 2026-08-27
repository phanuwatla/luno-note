import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  FileText,
  Type,
  Star,
  Copy,
  FolderInput,
  Download,
  Trash2,
  Plus,
  Table as TableIcon,
  FileEdit,
  AlignLeft,
  Link2,
  Wand,
  FileCode,
  ChevronRight,
} from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import type { Editor } from "@tiptap/react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateFrontmatterTags, removeTagFromMarkdown, isTiptapJson, isMarkdownNote } from "@/lib/frontmatter";
import { getTagColorClass } from "@/lib/tagColors";
import { countWords, countCharacters, calculateReadingTime } from "@/lib/wordCount";

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  editor?: Editor | null;
  notes?: Note[];
  onUpdateNote?: (id: string, updates: Partial<Note>) => void;
  onFavorite?: (id: string) => void;
  onDuplicate?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onExport?: () => void;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  onSelectNote?: (id: string) => void;
}

interface OutlineItem {
  id: string;
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "table";
  text: string;
  pos?: number;
}

export default function RightPanel({
  isOpen,
  onClose,
  note,
  editor,
  notes = [],
  onUpdateNote,
  onFavorite,
  onDuplicate,
  onDelete,
  onExport,
  onExportPdf,
  onExportWord,
  onSelectNote,
}: RightPanelProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<"outline" | "properties" | "backlinks">("outline");
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const outlineItems = useMemo(() => {
    if (!note) return [];
    const isTxtFile = note.fileName?.toLowerCase().endsWith(".txt") || note.contentFormat === "plain";
    if (isTxtFile) return [];
    const items: OutlineItem[] = [];

    if (editor) {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const lvl = Math.min(Math.max(node.attrs.level || 1, 1), 6);
          const level = `h${lvl}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
          items.push({
            id: `heading-${pos}`,
            level,
            text: node.textContent || "Untitled Heading",
            pos,
          });
        } else if (node.type.name === "table") {
          items.push({
            id: `table-${pos}`,
            level: "table",
            text: "Table",
            pos,
          });
        }
      });
    } else if (note.content) {
      const lines = note.content.split("\n");
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = `h${match[1].length}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
          items.push({ id: `line-${idx}`, level, text: match[2].trim() });
        } else if (trimmed.includes("<table") || trimmed.startsWith("|")) {
          items.push({ id: `table-${idx}`, level: "table", text: "Table" });
        }
      });
    }

    return items;
  }, [editor, note]);

  // Backlinks (notes that link to or mention the current note title via Wikilinks or Markdown links)
  const backlinks = useMemo(() => {
    if (!note || !notes.length) return [];
    const baseName = (note.fileName || note.title || "").replace(/\.[^/.]+$/, "").trim();
    const fullName = (note.fileName || note.title || "").trim();
    if (!baseName && !fullName) return [];

    const baseLower = baseName.toLowerCase();
    const fullLower = fullName.toLowerCase();

    return notes.filter((other) => {
      if (other.id === note.id) return false;
      const content = other.content || "";
      const contentLower = content.toLowerCase();

      // Check standard wikilink [[note]] or [[note|alias]] or encoded/data attributes
      const hasWikilink =
        contentLower.includes(`[[${baseLower}]]`) ||
        contentLower.includes(`[[${baseLower}|`) ||
        contentLower.includes(`[[${fullLower}]]`) ||
        contentLower.includes(`[[${fullLower}|`) ||
        contentLower.includes(`data-wikilink="${baseLower}"`) ||
        contentLower.includes(`data-wikilink="${fullLower}"`) ||
        contentLower.includes(`wikilink:${encodeURIComponent(baseLower)}`) ||
        contentLower.includes(`wikilink:${encodeURIComponent(fullLower)}`);

      if (hasWikilink) return true;

      // Check markdown link targets [text](name) or [text](name.md)
      if (contentLower.includes(`](${baseLower})`) || contentLower.includes(`](${fullLower})`)) {
        return true;
      }

      // Check full mention if title is unique and at least 3 characters
      if (baseLower.length >= 3 && contentLower.includes(baseLower)) {
        return true;
      }

      return false;
    });
  }, [note, notes]);

  // Compute Word & Character Stats accurately for Thai and all languages (Microsoft Word standard)
  const stats = useMemo(() => {
    const rawText = editor
      ? editor.state.doc.textContent
      : (note?.content || "");

    const words = countWords(rawText);
    const chars = countCharacters(rawText);
    const readTime = calculateReadingTime(words, chars, settings.language === "th" ? "th" : "en");

    return {
      words,
      chars,
      readTime,
    };
  }, [editor?.state.doc, note?.content, settings.language]);

  // Format Dates with localization
  const formattedDates = useMemo(() => {
    const isTh = settings.language === "th";
    const locale = isTh ? "th-TH" : "en-US";

    const formatDate = (val?: string | number) => {
      if (!val) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        return `${isTh ? "วันนี้" : "Today"} ${timeStr}`;
      }
      const date = new Date(val);
      if (isNaN(date.getTime()) || date.getTime() === 0) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        return `${isTh ? "วันนี้" : "Today"} ${timeStr}`;
      }

      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      const timeStr = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      if (isToday) return `${isTh ? "วันนี้" : "Today"} ${timeStr}`;
      if (isYesterday) return `${isTh ? "เมื่อวาน" : "Yesterday"} ${timeStr}`;
      return `${date.toLocaleDateString(locale, { month: "short", day: "numeric" })} ${timeStr}`;
    };

    return {
      created: formatDate(note?.createdAt),
      updated: formatDate(note?.updatedAt),
    };
  }, [note?.createdAt, note?.updatedAt, settings.language]);

  const handleScrollToItem = (item: OutlineItem) => {
    if (editor && item.pos !== undefined) {
      editor.commands.setTextSelection(item.pos);
      editor.commands.scrollIntoView();
    }
  };

  const handleAddTag = (overrideTag?: string) => {
    const rawVal = overrideTag !== undefined ? overrideTag : newTagInput;
    const tagToAdd = rawVal.trim().replace(/^#/, "");
    if (!tagToAdd || !note || !onUpdateNote) return;

    const currentTags = note.tags || [];
    const updatedTags = Array.from(new Set([...currentTags, tagToAdd]));
    onUpdateNote(note.id, { tags: updatedTags });

    setNewTagInput("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!note || !onUpdateNote) return;
    const currentTags = note.tags || [];
    const updatedTags = currentTags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    onUpdateNote(note.id, { tags: updatedTags });
  };

  if (!note || !isOpen) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full w-[280px] shrink-0 border-l border-border bg-background flex flex-col select-none overflow-hidden"
    >
      {/* Header Tabs (Outline / Properties / Backlinks) */}
      <div className="flex h-11 items-center justify-between border-b border-border/50 px-4 pt-2 shrink-0">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("outline")}
            className={`relative pb-2.5 transition-colors ${
              activeTab === "outline" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("rightPanel.outline")}
            {activeTab === "outline" && (
              <motion.div layoutId="rightPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("properties")}
            className={`relative pb-2.5 transition-colors ${
              activeTab === "properties" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("rightPanel.properties")}
            {activeTab === "properties" && (
              <motion.div layoutId="rightPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("backlinks")}
            className={`relative pb-2.5 transition-colors ${
              activeTab === "backlinks" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("rightPanel.backlinks")}
            {activeTab === "backlinks" && (
              <motion.div layoutId="rightPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("rightPanel.closePanel")}</TooltipContent>
        </Tooltip>
      </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-xs">
              {/* TAB 1: OUTLINE */}
              {activeTab === "outline" && (
                <div className="space-y-2">
                  {outlineItems.length > 0 ? (
                    outlineItems.map((item) => {
                      const levelPadding =
                        item.level === "h1" ? "pl-0 font-semibold text-foreground text-xs" :
                        item.level === "h2" ? "pl-3 font-medium text-foreground/90 text-xs" :
                        item.level === "h3" ? "pl-6 font-normal text-muted-foreground text-xs" :
                        item.level === "h4" ? "pl-8 font-normal text-muted-foreground/90 text-xs" :
                        item.level === "h5" ? "pl-10 font-normal text-muted-foreground/80 text-xs" :
                        item.level === "h6" ? "pl-12 font-normal text-muted-foreground/70 text-xs" :
                        "pl-3 font-medium text-foreground/80 text-xs";

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleScrollToItem(item)}
                          className={`flex w-full items-center gap-2 py-1.5 text-left rounded-md hover:bg-muted/60 transition-colors ${levelPadding}`}
                        >
                          <span className="text-[10px] uppercase font-bold text-muted-foreground/60 shrink-0 w-4">
                            {item.level === "table" ? "" : item.level.toUpperCase()}
                          </span>
                          {item.level === "table" && <TableIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <span className="truncate">{item.text}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="py-4 text-center text-xs text-muted-foreground opacity-60">{t("rightPanel.noHeadings")}</p>
                  )}
                </div>
              )}

              {/* TAB 2: PROPERTIES */}
              {activeTab === "properties" && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">{t("rightPanel.fileName")}</span>
                    <span className="font-medium text-foreground">{note.fileName || t("editor.untitled")}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">{t("rightPanel.fileType")}</span>
                    <span className="font-medium text-foreground uppercase">{note.fileType || note.contentFormat || "MD"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">{t("rightPanel.folder")}</span>
                    <span className="font-medium text-foreground">{note.folderPath || t("rightPanel.root")}</span>
                  </div>
                </div>
              )}

              {/* TAB 3: BACKLINKS */}
              {activeTab === "backlinks" && (
                <div className="space-y-2 text-xs">
                  {backlinks.length > 0 ? (
                    backlinks.map((linkNote) => (
                      <button
                        key={linkNote.id}
                        type="button"
                        onClick={() => {
                          onSelectNote?.(linkNote.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg border border-border/60 p-2.5 text-left hover:bg-muted/60 transition-colors cursor-pointer"
                      >
                        <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">{linkNote.fileName || linkNote.title}</span>
                      </button>
                    ))
                  ) : (
                    <p className="py-4 text-center text-xs text-muted-foreground opacity-60">{t("rightPanel.noBacklinks")}</p>
                  )}
                </div>
              )}

              {/* SECTION: TAGS */}
              {isMarkdownNote(note) && (
                <>
                  <hr className="border-border/60" />
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("rightPanel.tagsSection")}</h4>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(note.tags || []).map((tag, idx) => (
                        <span
                          key={tag}
                          className={`group flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border ${getTagColorClass(tag, settings.theme, idx, settings.tagColorStyle)}`}
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {isAddingTag ? (
                        <input
                          type="text"
                          autoFocus
                          placeholder={t("rightPanel.tagPlaceholder")}
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTag();
                            if (e.key === "Escape") setIsAddingTag(false);
                          }}
                          onBlur={() => handleAddTag()}
                          className="h-6 w-20 rounded-md border border-primary bg-transparent px-2 text-xs text-foreground outline-none"
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setIsAddingTag(true)}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{t("rightPanel.addTag")}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </>
              )}

              <hr className="border-border/60" />

              {/* SECTION: INFO */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("rightPanel.infoSection")}</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("rightPanel.created")}</span>
                    </span>
                    <span className="font-medium text-foreground/80">{formattedDates.created}</span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <FileEdit className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("rightPanel.updated")}</span>
                    </span>
                    <span className="font-medium text-foreground/80">{formattedDates.updated}</span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("rightPanel.wordCount")}</span>
                    </span>
                    <span className="font-medium text-foreground/80">{stats.words.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <AlignLeft className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("rightPanel.characterCount")}</span>
                    </span>
                    <span className="font-medium text-foreground/80">{stats.chars.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("rightPanel.readingTime")}</span>
                    </span>
                    <span className="font-medium text-foreground/80">{stats.readTime}</span>
                  </div>
                </div>
              </div>

              <hr className="border-border/60" />

              {/* SECTION: ACTIONS */}
              <div className="space-y-1.5 pb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("rightPanel.actionsSection")}</h4>

                <button
                  type="button"
                  onClick={() => note && onFavorite?.(note.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/90 hover:bg-muted transition-colors"
                >
                  <Star className={`h-4 w-4 shrink-0 ${note.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  <span>{note.isFavorite ? t("rightPanel.removeFromFavorites") : t("rightPanel.addToFavorites")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => note && onDuplicate?.(note)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/90 hover:bg-muted transition-colors cursor-pointer"
                >
                  <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{t("sidebar.duplicateAction")}</span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/90 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{t("rightPanel.export")}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="w-52 rounded-xl px-0 py-2 shadow-lg">
                    <DropdownMenuItem disabled={!note} onClick={onExportPdf} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                      <FileText className="h-4 w-4" />
                      <span>{t("editor.exportPdf")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!note} onClick={onExportWord} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                      <FileCode className="h-4 w-4" />
                      <span>{t("editor.exportWord")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  onClick={() => note && onDelete?.(note)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>{t("common.delete")}</span>
                </button>
              </div>
            </div>
    </motion.aside>
  );
}
