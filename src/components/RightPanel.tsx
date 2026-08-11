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
} from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import type { Editor } from "@tiptap/react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { updateFrontmatterTags, removeTagFromMarkdown, isTiptapJson } from "@/lib/frontmatter";
import { getTagColorClass } from "@/lib/tagColors";

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
  onSelectNote?: (id: string) => void;
}

interface OutlineItem {
  id: string;
  level: "h1" | "h2" | "h3" | "table";
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
  onSelectNote,
}: RightPanelProps) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<"outline" | "properties" | "backlinks">("outline");
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Extract outline (headings and tables) from Tiptap editor or content
  const outlineItems = useMemo(() => {
    if (!note) return [];
    const items: OutlineItem[] = [];

    if (editor) {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const level = `h${node.attrs.level}` as "h1" | "h2" | "h3";
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
        if (trimmed.startsWith("# ")) {
          items.push({ id: `line-${idx}`, level: "h1", text: trimmed.replace(/^#\s+/, "") });
        } else if (trimmed.startsWith("## ")) {
          items.push({ id: `line-${idx}`, level: "h2", text: trimmed.replace(/^##\s+/, "") });
        } else if (trimmed.startsWith("### ")) {
          items.push({ id: `line-${idx}`, level: "h3", text: trimmed.replace(/^###\s+/, "") });
        } else if (trimmed.includes("<table") || trimmed.startsWith("|")) {
          items.push({ id: `table-${idx}`, level: "table", text: "Table" });
        }
      });
    }

    return items;
  }, [editor, note]);

  // Backlinks (notes that link to or mention the current note title)
  const backlinks = useMemo(() => {
    if (!note || !notes.length) return [];
    const noteTitle = (note.fileName || note.title || "").replace(/\.[^/.]+$/, "").toLowerCase();
    if (!noteTitle) return [];

    return notes.filter((other) => {
      if (other.id === note.id) return false;
      const content = (other.content || "").toLowerCase();
      return content.includes(`[[${noteTitle}]]`) || content.includes(noteTitle);
    });
  }, [note, notes]);

  // Compute Word & Character Stats
  const stats = useMemo(() => {
    if (!note?.content) return { words: 0, chars: 0, readTime: "1 min read" };
    const text = note.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(" ").length : 0;
    const chars = text.length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return {
      words,
      chars,
      readTime: `${readTimeMinutes} min read`,
    };
  }, [note?.content]);

  // Format Dates
  const formattedDates = useMemo(() => {
    const formatDate = (val?: string) => {
      if (!val) return "Today 09:41";
      const date = new Date(val);
      if (isNaN(date.getTime())) return "Today";
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (isToday) return `Today ${timeStr}`;
      return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${timeStr}`;
    };

    return {
      created: formatDate(note?.createdAt),
      updated: formatDate(note?.updatedAt),
    };
  }, [note?.createdAt, note?.updatedAt]);

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
                        item.level === "h2" ? "pl-4 font-medium text-foreground/90 text-xs" :
                        item.level === "h3" ? "pl-8 font-normal text-muted-foreground text-xs" :
                        "pl-8 font-medium text-foreground/80 text-xs";

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
                          onClose();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg border border-border/60 p-2.5 text-left hover:bg-muted/60 transition-colors"
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

              <hr className="border-border/60" />

              {/* SECTION: TAGS */}
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
                      placeholder="Tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag();
                        if (e.key === "Escape") setIsAddingTag(false);
                      }}
                      onBlur={handleAddTag}
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
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/90 hover:bg-muted transition-colors"
                >
                  <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{t("sidebar.duplicateAction")}</span>
                </button>

                <button
                  type="button"
                  onClick={onExport}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/90 hover:bg-muted transition-colors"
                >
                  <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{t("rightPanel.export")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => note && onDelete?.(note)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>{t("common.delete")}</span>
                </button>
              </div>
            </div>
    </motion.aside>
  );
}
