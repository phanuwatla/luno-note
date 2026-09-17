import React, { useState, useMemo, useEffect } from "react";
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
  Maximize2,
  HardDrive,
  AlignJustify,
} from "lucide-react";
import type { Note } from "@/hooks/useNotes";
import type { Editor } from "@tiptap/react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getToolbarIcon, renderCustomIcon } from "@/lib/iconPacks";
import IconPickerDialog from "@/components/IconPickerDialog";
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
import { formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import { getFileCategory, formatFileSize, getFileFormatLabel } from "@/lib/fileIconUtils";

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
  imageDimensions?: { width: number; height: number } | null;
  fileSize?: number | null;
}

interface OutlineItem {
  id: string;
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "table";
  text: string;
  pos?: number;
}

function RightPanelComponent({
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
  imageDimensions,
  fileSize,
}: RightPanelProps) {
  const { t } = useTranslation();
  const { settings, setFileIcon, removeFileIcon } = useAppSettings();
  const [activeTab, setActiveTab] = useState<"outline" | "properties" | "backlinks">("outline");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editorDocVersion, setEditorDocVersion] = useState(0);

  const fileCategory = useMemo(
    () => getFileCategory(note),
    [note?.fileName, note?.fileType, note?.contentFormat, note?.content]
  );
  const isNonTextMedia =
    fileCategory === "image" ||
    fileCategory === "audio" ||
    fileCategory === "video" ||
    fileCategory === "binary";

  const [localDimensions, setLocalDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (imageDimensions) {
      setLocalDimensions(imageDimensions);
      return;
    }
    if (fileCategory === "image" && note?.content?.startsWith("data:image/")) {
      const img = new Image();
      img.onload = () => {
        setLocalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = note.content;
    } else {
      setLocalDimensions(null);
    }
  }, [imageDimensions, fileCategory, note?.content]);

  const activeDimensions = imageDimensions || localDimensions;
  const resolvedFileSize = useMemo(() => {
    if (fileSize != null && fileSize > 0) return fileSize;
    if (note?.fileSize != null && note.fileSize > 0) return note.fileSize;
    if (note?.content) {
      if (note.content.startsWith("data:")) {
        const base64Part = note.content.split(",")[1] || "";
        const padding = (base64Part.match(/=/g) || []).length;
        return Math.max(0, Math.floor((base64Part.length * 3) / 4 - padding));
      }
      try {
        return new Blob([note.content]).size;
      } catch {
        return new TextEncoder().encode(note.content).length;
      }
    }
    if (fileSize === 0 || note?.fileSize === 0) return 0;
    return null;
  }, [fileSize, note?.fileSize, note?.content]);

  // Auto-switch away from outline tab if opening a non-text file
  useEffect(() => {
    if (isNonTextMedia && activeTab === "outline") {
      setActiveTab("properties");
    }
  }, [isNonTextMedia, activeTab]);

  useEffect(() => {
    if (!editor) return;
    let timer: NodeJS.Timeout | null = null;
    const handleEditorUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setEditorDocVersion((v) => v + 1);
      }, 350);
    };
    editor.on("update", handleEditorUpdate);
    return () => {
      if (timer) clearTimeout(timer);
      editor.off("update", handleEditorUpdate);
    };
  }, [editor]);

  const outlineItems = useMemo(() => {
    if (!note || isNonTextMedia) return [];
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
  }, [editor, note, editorDocVersion, isNonTextMedia]);

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

  // Compute Word, Line & Character Stats accurately
  const stats = useMemo(() => {
    if (isNonTextMedia) {
      return {
        words: 0,
        chars: 0,
        readTime: "",
        lines: 0,
      };
    }

    const isCode =
      fileCategory === "code" ||
      note?.contentFormat === "html" ||
      note?.contentFormat === "css";

    // For code files or when TipTap doc is empty, use note.content
    const textContent = (!isCode && editor && editor.state.doc.textContent.length > 0)
      ? editor.state.doc.textContent
      : (note?.content || "");

    // Line counting: note.content has literal \n line breaks
    const rawLinesSource = note?.content || (editor ? editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\n") : "");
    const lines = rawLinesSource ? rawLinesSource.split("\n").length : (textContent ? 1 : 0);

    const words = countWords(textContent);
    const chars = countCharacters(textContent);
    const readTime = calculateReadingTime(words, chars, settings.language === "th" ? "th" : "en");

    return {
      words,
      chars,
      readTime,
      lines,
    };
  }, [isNonTextMedia, fileCategory, note?.contentFormat, note?.content, editorDocVersion, settings.language]);

  // Format Dates with localization & user settings
  const formattedDates = useMemo(() => {
    const formatDate = (val?: string | number) => {
      if (!val) return "";
      return formatRelativeDateTime(val, settings.dateFormat, settings.timeFormat, settings.language);
    };

    return {
      created: formatDate(note?.createdAt),
      updated: formatDate(note?.updatedAt),
    };
  }, [note?.createdAt, note?.updatedAt, settings.dateFormat, settings.timeFormat, settings.language]);

  const handleScrollToItem = (item: OutlineItem) => {
    // 1. Resolve freshest node position from editor state to avoid stale memoized pos
    let targetPos = item.pos;

    if (editor) {
      const cleanItemText = item.text.trim().toLowerCase();
      editor.state.doc.descendants((node, pos) => {
        if (item.level === "table" && node.type.name === "table") {
          if (item.pos === undefined || Math.abs(pos - (item.pos || 0)) < 100) {
            targetPos = pos;
          }
        } else if (node.type.name === "heading") {
          const lvl = `h${node.attrs.level || 1}`;
          const text = (node.textContent || "").trim().toLowerCase();
          if (lvl === item.level && text === cleanItemText) {
            if (targetPos === undefined || Math.abs(pos - (item.pos ?? 0)) < 100 || item.id === `heading-${pos}`) {
              targetPos = pos;
            }
          }
        }
      });

      // Update cursor / selection to the item in TipTap editor
      if (targetPos !== undefined) {
        try {
          editor.commands.setTextSelection(targetPos);
        } catch {
          // ignore
        }
      }

      // Safely focus editor without triggering browser native focus-scroll (preventScroll: true)
      // which would otherwise cancel/abort the smooth scroll animation on the first click
      if (!editor.view.hasFocus()) {
        try {
          editor.view.dom.focus({ preventScroll: true });
        } catch {
          // fallback
        }
      }
    }

    // 2. Locate the DOM element corresponding to the outline item
    let targetEl: HTMLElement | null = null;

    if (editor && targetPos !== undefined) {
      try {
        const dom = editor.view.nodeDOM(targetPos);
        if (dom instanceof HTMLElement) {
          targetEl = dom;
        }
      } catch {
        // ignore
      }

      if (!targetEl) {
        try {
          const atPos = editor.view.domAtPos(targetPos);
          const candidate = atPos.node instanceof HTMLElement ? atPos.node : atPos.node.parentElement;
          targetEl = (candidate?.closest("h1, h2, h3, h4, h5, h6, table, .tableWrapper, [data-node-view-wrapper]") as HTMLElement) || candidate || null;
        } catch {
          // ignore
        }
      }
    }

    if (!targetEl && editor?.view?.dom) {
      const cleanItemText = item.text.trim().toLowerCase();
      if (item.level === "table") {
        targetEl = (editor.view.dom.querySelector("table, .tableWrapper") as HTMLElement) || null;
      } else {
        const headings = Array.from(editor.view.dom.querySelectorAll(item.level)) as HTMLElement[];
        targetEl = headings.find((h) => (h.textContent || "").trim().toLowerCase() === cleanItemText) || null;
        if (!targetEl && cleanItemText && headings.length > 0) {
          targetEl = headings.find((h) => (h.textContent || "").trim().toLowerCase().includes(cleanItemText)) || null;
        }
      }
    }

    // Fallback: document query selector
    if (!targetEl) {
      targetEl = (document.getElementById(item.id) as HTMLElement) || null;
    }

    // 3. If inside a collapsed toggle/details, expand it
    if (targetEl) {
      const details = targetEl.closest("details");
      if (details && !details.open) {
        details.open = true;
      }
    }

    // 4. Find the scrollable container and paper container
    const scrollContainer =
      (editor?.view?.dom ? (editor.view.dom.closest(".overflow-y-auto") as HTMLElement | null) : null) ||
      (targetEl ? (targetEl.closest(".overflow-y-auto") as HTMLElement | null) : null) ||
      (document.querySelector(".luno-editor-container") as HTMLElement | null) ||
      document.documentElement;

    const paperContainer =
      (editor?.view?.dom?.closest(".min-h-full") as HTMLElement | null) ||
      (scrollContainer ? (scrollContainer.querySelector(".min-h-full") as HTMLElement | null) : null);

    // Padding top of the document/paper layout
    const paperPaddingTop = paperContainer ? (parseFloat(window.getComputedStyle(paperContainer).paddingTop) || 0) : 32;

    // 5. Scroll so the item is positioned exactly at the top of the paper (หัวกระดาษ)
    // If it's the very first heading/title (pos 0 or 1), scroll to the very top of the paper (top: 0)
    const isFirstHeading = targetPos === 0 || targetPos === 1;

    if (scrollContainer) {
      if (isFirstHeading) {
        scrollContainer.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else if (targetEl) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        // Calculate distance relative to current scroll viewport
        const currentRelativeTop = targetRect.top - containerRect.top;

        // Position targetEl exactly at paperPaddingTop below the top of the scroll container
        const targetScrollTop = scrollContainer.scrollTop + currentRelativeTop - paperPaddingTop;
        const finalScrollTop = Math.max(0, targetScrollTop);

        scrollContainer.scrollTo({
          top: finalScrollTop,
          behavior: "smooth",
        });
      }
    }

    // 6. Provide brief subtle visual focus feedback on target element
    if (targetEl) {
      targetEl.classList.add("bg-primary/20", "transition-colors", "duration-500", "rounded");
      setTimeout(() => {
        targetEl?.classList.remove("bg-primary/20");
      }, 1200);
    }
  };

  const handleAddTag = (overrideTag?: string) => {
    if (!note || !isMarkdownNote(note) || !onUpdateNote) return;
    const rawVal = overrideTag !== undefined ? overrideTag : newTagInput;
    const tagToAdd = rawVal.trim().replace(/^#/, "");
    if (!tagToAdd) return;

    const currentTags = note.tags || [];
    const updatedTags = Array.from(new Set([...currentTags, tagToAdd]));
    onUpdateNote(note.id, { tags: updatedTags });

    setNewTagInput("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!note || !isMarkdownNote(note) || !onUpdateNote) return;
    const currentTags = note.tags || [];
    const updatedTags = currentTags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    onUpdateNote(note.id, { tags: updatedTags });
  };

  if (!note || !isOpen) return null;

  const currentRelPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
  const currentIcon = note.icon || (currentRelPath && settings?.fileIcons?.[currentRelPath]?.icon);
  const currentColor = note.iconColor || (currentRelPath && settings?.fileIcons?.[currentRelPath]?.color);

  const pack = settings?.iconPack || "lucide";
  const renderIcon = (key: string, cls = "h-4 w-4") => {
    const IconComp = getToolbarIcon(key, pack);
    return <IconComp className={cls} />;
  };

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="h-full w-[280px] shrink-0 border-l border-border bg-background flex flex-col select-none overflow-hidden"
    >
      {/* Header Tabs (Outline / Properties / Backlinks) */}
      <div className="flex h-11 items-center justify-between border-b border-border/50 px-4 pt-2 shrink-0">
        <div className="flex items-center gap-4 text-xs font-semibold">
          {!isNonTextMedia && (
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
          )}
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
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {renderIcon("x", "h-3.5 w-3.5")}
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
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => handleScrollToItem(item)}
                          className={`flex w-full items-center gap-2 py-1.5 text-left rounded-md hover:bg-muted/60 transition-colors ${levelPadding}`}
                        >
                          <span className="text-[10px] uppercase font-bold text-muted-foreground/60 shrink-0 w-4">
                            {item.level === "table" ? "" : item.level.toUpperCase()}
                          </span>
                          {item.level === "table" && renderIcon("table", "h-3.5 w-3.5 text-muted-foreground shrink-0")}
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
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">{t("rightPanel.fileName")}</span>
                    <span className="font-medium text-foreground">{note.fileName || t("editor.untitled")}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">{t("rightPanel.fileType")}</span>
                    <span className="font-medium text-foreground uppercase">{getFileFormatLabel(note, settings.language) || note.fileType || note.contentFormat || "MD"}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">{t("rightPanel.folder")}</span>
                    <span className="font-medium text-foreground">{note.folderPath || t("rightPanel.root")}</span>
                  </div>
                  {resolvedFileSize != null && (
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-muted-foreground">{t("rightPanel.fileSize") || "File size"}</span>
                      <span className="font-medium text-foreground">{formatFileSize(resolvedFileSize)}</span>
                    </div>
                  )}
                  {Boolean(currentIcon) && (
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-muted-foreground">{t("sidebar.changeNoteIcon") || "Icon"}</span>
                      <button
                        type="button"
                        onClick={() => setIconPickerOpen(true)}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-muted/70 text-foreground transition-colors cursor-pointer border border-border/40 text-xs"
                      >
                        {renderCustomIcon(currentIcon, "h-3.5 w-3.5", { color: currentColor })}
                      </button>
                    </div>
                  )}
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
                        {renderIcon("link", "h-3.5 w-3.5 text-primary shrink-0")}
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
                            className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            {renderIcon("x", "h-3 w-3")}
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
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                              {renderIcon("plus", "h-3.5 w-3.5")}
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
                  {/* Created date - Always shown */}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {renderIcon("clock", "h-3.5 w-3.5 shrink-0")}
                      <span>{t("rightPanel.created")}</span>
                    </span>
                    <span className="font-medium text-foreground/80">{formattedDates.created}</span>
                  </div>

                  {/* Updated date - Always shown */}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {renderIcon("pencil", "h-3.5 w-3.5 shrink-0")}
                      <span>{t("rightPanel.updated")}</span>
                    </span>
                    <span className="font-medium text-foreground/80">{formattedDates.updated}</span>
                  </div>

                  {/* Image Dimensions - Shown only for images when known */}
                  {fileCategory === "image" && activeDimensions && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{t("rightPanel.imageDimensions") || "Dimensions"}</span>
                      </span>
                      <span className="font-medium text-foreground/80">
                        {activeDimensions.width} × {activeDimensions.height} px
                      </span>
                    </div>
                  )}

                  {/* Lines - Shown for code files */}
                  {fileCategory === "code" && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <AlignJustify className="h-3.5 w-3.5 shrink-0" />
                        <span>{t("rightPanel.lines") || "Lines"}</span>
                      </span>
                      <span className="font-medium text-foreground/80">{stats.lines.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Words - Shown for markdown and plain text files only */}
                  {(fileCategory === "markdown" || fileCategory === "text") && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-2">
                        {renderIcon("fileText", "h-3.5 w-3.5 shrink-0")}
                        <span>{t("rightPanel.wordCount")}</span>
                      </span>
                      <span className="font-medium text-foreground/80">{stats.words.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Characters - Shown for markdown, plain text, and code files */}
                  {(fileCategory === "markdown" || fileCategory === "text" || fileCategory === "code") && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Type className="h-3.5 w-3.5 shrink-0" />
                        <span>{t("rightPanel.characterCount")}</span>
                      </span>
                      <span className="font-medium text-foreground/80">{stats.chars.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Reading time - Shown for markdown and plain text files only */}
                  {(fileCategory === "markdown" || fileCategory === "text") && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-2">
                        {renderIcon("clock", "h-3.5 w-3.5 shrink-0")}
                        <span>{t("rightPanel.readingTime")}</span>
                      </span>
                      <span className="font-medium text-foreground/80">{stats.readTime}</span>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-border/60" />

              {/* SECTION: ACTIONS */}
              <div className="space-y-1.5 pb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("rightPanel.actionsSection")}</h4>

                <button
                  type="button"
                  onClick={() => note && onFavorite?.(note.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/90 hover:bg-muted transition-colors cursor-pointer"
                >
                  {renderIcon("star", `h-4 w-4 shrink-0 ${note.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`)}
                  <span>{note.isFavorite ? t("rightPanel.removeFromFavorites") : t("rightPanel.addToFavorites")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => note && onDuplicate?.(note)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/90 hover:bg-muted transition-colors cursor-pointer"
                >
                  {renderIcon("copy", "h-4 w-4 text-muted-foreground shrink-0")}
                  <span>{t("sidebar.duplicateAction")}</span>
                </button>

                {!isNonTextMedia && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/90 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {renderIcon("download", "h-4 w-4 text-muted-foreground shrink-0")}
                          <span>{t("rightPanel.export")}</span>
                        </div>
                        {renderIcon("chevronRight", "h-3.5 w-3.5 text-muted-foreground/60")}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-52">
                      <DropdownMenuItem disabled={!note} onClick={onExportPdf}>
                        {renderIcon("fileText", "h-4 w-4")}
                        <span>{t("editor.exportPdf")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!note} onClick={onExportWord}>
                        {renderIcon("fileCode", "h-4 w-4")}
                        <span>{t("editor.exportWord")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <button
                  type="button"
                  onClick={() => note && onDelete?.(note)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  {renderIcon("trash", "h-4 w-4 shrink-0 text-destructive")}
                  <span>{t("common.delete")}</span>
                </button>
              </div>
            </div>

      <IconPickerDialog
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        title={t("sidebar.changeNoteIcon") || "Change Icon"}
        initialIcon={currentIcon}
        initialColor={currentColor}
        onSelectIcon={(icon, color) => {
          if (currentRelPath) {
            setFileIcon(currentRelPath, icon, color);
          }
          onUpdateNote?.(note.id, { icon, iconColor: color });
          setIconPickerOpen(false);
        }}
        onRemoveIcon={() => {
          if (currentRelPath) {
            removeFileIcon(currentRelPath);
          }
          onUpdateNote?.(note.id, { icon: undefined, iconColor: undefined });
          setIconPickerOpen(false);
        }}
      />
    </motion.aside>
  );
}

export default React.memo(RightPanelComponent);
