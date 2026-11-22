import HtmlCodeEditor, { HtmlCodeEditorHandle } from "@/components/HtmlCodeEditor";
import { PdfEditorView, PdfEditorViewHandle, clearPdfEditorDraft, pdfDraftBookmarksMap, pdfSessionCleanBase64Map } from "@/components/PdfEditorView";
import {
  getElectronCleanBasePdfPath,
  type InkoOutlineItem,
  type InkoTool,
  type InkoViewerLiveState,
  type PdfPageBookmark,
} from "@/lib/inkoPdfBridge";
import RightPanel from "@/components/RightPanel";
import VersionHistoryPanel from "@/components/VersionHistoryPanel";
import VersionHistorySplitDiffView from "@/components/VersionHistorySplitDiffView";
import { saveVersionSnapshot, type NoteVersionSnapshot } from "@/lib/versionHistoryStorage";
import { AnimatePresence } from "framer-motion";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { Note, extractBaseTitleFromFileName, isSystemGeneratedUntitledName } from "@/hooks/useNotes";
import { getSpellingSuggestions, THAI_SPELL_CORRECTIONS, getThaiSpellRegex, getThaiAnomalyRegex, THAI_SPELL_REGEX, THAI_STRUCTURAL_ANOMALY_REGEX, isWordMisspelled, IGNORED_SPELL_WORDS, findThaiMisspellingsInText, addCustomSpellWord } from "@/lib/spellChecker";
import {
  Bold,
  Bookmark,
  Check,
  CheckCircle2,
  Circle,
  Code,
  CodeXml,
  SquareCode,
  Eye,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  FileImage,
  FolderArchive,
  Images,
  ImagePlus,
  LayoutGrid,
  Mic,
  MousePointer2,
  Italic,
  Wrench,
  Link2,
  List,
  ListOrdered,
  ChevronsDownUp,
  ChevronUp,
  ChevronDown,
  Keyboard,
  Monitor,
  Tablet,
  Smartphone,
  Moon,
  MoreHorizontal,
  ClipboardList,
  Pen,
  Plus,
  Square,
  TextCursor,
  Type,
  FolderPlus,
  Undo2,
  Redo2,
  RotateCcw,
  Strikethrough,
  Quote,
  Smile,
  Palette,
  Star,
  Upload,
  Trash2,
  Trash,
  Eraser,
  Minus,
  Settings,
  Sun,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  XCircle,
  Loader2,
  AlertTriangle,
  Save,
  Table as TableIcon,
  Copy,
  ChevronLeft,
  ChevronRight,
  Columns,
  Layers,
  X,
  Wand,
  Scissors,
  Underline as UnderlineIcon,
  Highlighter,
  Target,
  Maximize2,
  Minimize2,
  BookOpen,
  PenLine,
  MessageCircle,
  Languages,
  Key,
  Calculator,
  Clock,
  Share2,
  History,
  Globe,
  Search,
  GlobeOff,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Lock,
  Unlock,
  Printer,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  QrCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Pencil,
  VideoOff,
  Video,
  Film,
  Clapperboard,
} from "lucide-react";
import { GoogleDriveIcon } from "@/components/icons/GoogleDriveIcon";
import { ListTodoIcon } from "@/components/icons/ListTodoIcon";
import { FootnoteIcon } from "@/components/icons/FootnoteIcon";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { WandSparklesIcon } from "@/components/icons/WandSparklesIcon";
import { SpellCheckIcon } from "@/components/icons/SpellCheckIcon";
import { BriefcaseBusinessIcon } from "@/components/icons/BriefcaseBusinessIcon";
import { PenLineIcon } from "@/components/icons/PenLineIcon";
import AiAssistantPanel from "@/components/AiAssistantPanel";
import QrCodeDialog from "@/components/QrCodeDialog";
import AudioExtension from "@/components/editor/AudioExtension";
import AudioPlayer from "@/components/editor/AudioPlayer";
import { audioLocalCache } from "@/components/editor/AudioNodeView";
import VideoExtension from "@/components/editor/VideoExtension";
import VideoPlayer from "@/components/editor/VideoPlayer";
import { PageLoader } from "@/components/shared/PageLoader";
import { isAudioMedia, isVideoMedia, probeWebmMediaKind } from "@/lib/webmClassifier";
import { createPortal } from "react-dom";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useTranslation } from "@/hooks/useTranslation";
import { APP_THEMES, useAppSettings, useKeyboardLanguage, FONT_OPTIONS, FONT_FAMILY_CSS, type AppTheme, useCustomFonts, saveCustomFont, renameCustomFont, deleteCustomFont, type CustomFont } from "@/hooks/useAppSettings";
import { getToolbarIcon, renderCustomIcon } from "@/lib/iconPacks";
import { getNoteDefaultIconKey, formatFileSize } from "@/lib/fileIconUtils";
import { escapeHtml } from "@/lib/htmlUtils";
export { escapeHtml };
import { docxToHtml } from "@/lib/docxUtils";
import { parseFrontmatterAndTags, updateFrontmatterTags, updateFrontmatterIcon, updateFrontmatterFavorite, isMarkdownNote } from "@/lib/frontmatter";
import { uploadDriveAttachmentFile, getDriveFileShareLink, revokeDriveFileShare } from "@/lib/googleDriveApi";
import { getStoredTokenInfo, isGoogleDriveConnected, requestGoogleDriveAuth, getValidAccessToken } from "@/lib/googleDriveAuth";
import { syncEngine } from "@/lib/googleDriveSync";
import { getTagColorClass } from "@/lib/tagColors";
import { generatePdfHtml, inlineImagesForPdf } from "@/lib/pdfExportGenerator";
import { generateDocHtml } from "@/lib/docExportGenerator";
import { swapKeyboardLayout } from "@/lib/thaiKeyboardMapper";
import { FIX_LANGUAGE_EVENT, type FixLanguageEventDetail } from "@/lib/fixLanguageSystem";
import { getWrongLanguageCandidate } from "@/lib/wrongLanguageDetector";
import { runGeminiAction, type AiActionType } from "@/lib/geminiApi";
export type { AiActionType };
import { EditorContent, ReactNodeViewRenderer, useEditor, Editor as TiptapEditor } from "@tiptap/react";
import { Extension, mergeAttributes, Node as TiptapNode } from "@tiptap/core";
import { EditorState, TextSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { InputRule, inputRules } from "@tiptap/pm/inputrules";
import { DOMSerializer } from "@tiptap/pm/model";
import Image from "@tiptap/extension-image";
import ImageNodeView, { dataUrlToBlobUrl, asyncDataUrlToBlobUrl, imageLocalCache } from "@/components/editor/ImageNodeView";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import CodeBlockNodeView from "@/components/CodeBlockNodeView";
import { lowlight } from "@/lib/syntaxHighlighter";
export { lowlight };
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { marked } from "marked";
import { countWords, countCharacters } from "@/lib/wordCount";
import { formatDateForFileName, formatRelativeDateTime } from "@/lib/dateTimeFormatter";
import HeadingToggle, { headingTogglePluginKey } from "@/lib/headingToggle";
export { HeadingToggle, headingTogglePluginKey };
import { Underline, Highlight, Superscript, Subscript, Kbd, TextColor, FontFamily, FontSize, TextAlign } from "@/lib/tiptapCustomMarks";
import {
  hashtagPluginKey,
  HashtagDecoration,
  type HashtagDecorationOptions,
  spellCheckPluginKey,
  setGlobalSpellCheckEnabled,
  expandThaiAnomalyCluster,
  SpellCheckDecoration,
  inlineCodeHighlightPluginKey,
  InlineCodeHighlight,
  type InlineCodeHighlightOptions,
  SmartTypography,
  type SmartTypographyOptions,
  wrongLanguageSuggestionPluginKey,
  WrongLanguageSuggestion,
  type WrongLanguageSuggestionOptions,
  type WrongLangPluginState,
  getToggleButtonMode,
  handleToggleClick,
  isToggleActive,
  unwrapToggleAtPos,
  subscribeToggleFocusChange,
  Toggle,
  CustomParagraph,
  LivePreview,
  livePreviewPluginKey,
  getCleanCollapsedHtml,
  type LivePreviewOptions,
} from "@/components/editor/extensions/editorExtensions";
import {
  SLASH_ITEMS,
  insertFootnoteAtSelection,
  slashMenuStateRef,
  slashMenuScrollRef,
  type SlashMenuItem,
} from "@/components/editor/slashItems";
import { TableInteractiveOverlay } from "@/components/editor/TableInteractiveOverlay";
import { createTurndownService } from "@/components/editor/turndownService";
import { WorkspaceImagePickerDialog } from "@/components/editor/WorkspaceImagePickerDialog";
import { WorkspaceVideoPickerDialog } from "@/components/editor/WorkspaceVideoPickerDialog";
import { videoLocalCache } from "@/components/editor/VideoNodeView";
import { LockedNoteViewer } from "@/components/LockedNoteViewer";
import { encryptNoteContent, isEncryptedNote } from "@/lib/noteCrypto";
import { canUseNativeFileSystem, getStoredFileHandle, removeStoredFileHandle, setStoredFileHandle, requestPermissionIfAvailable, isNoteDeleted, isRelativePathDeleted, type CreateNoteOptions, type OpenFolderPending } from "@/lib/fileHandles";
import { rewriteHtmlForPreview } from "@/lib/htmlPreview";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { compressImageFile } from "@/lib/imageCompressor";
import { saveImageToIndexedDb, getImageFromIndexedDb } from "@/lib/imageStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Heading1Icon } from "@/components/icons/Heading1Icon";
import { Heading2Icon } from "@/components/icons/Heading2Icon";
import { Heading3Icon } from "@/components/icons/Heading3Icon";
import { Heading4Icon } from "@/components/icons/Heading4Icon";
import { Heading5Icon } from "@/components/icons/Heading5Icon";
import { Heading6Icon } from "@/components/icons/Heading6Icon";
import { CircleDotDashedIcon } from "@/components/icons/CircleDotDashedIcon";
import { CircleEllipsisIcon } from "@/components/icons/CircleEllipsisIcon";
import { PanelRightCloseIcon } from "@/components/icons/PanelRightCloseIcon";
import { DeleteRowIcon } from "@/components/icons/DeleteRowIcon";
import { DeleteColumnIcon } from "@/components/icons/DeleteColumnIcon";
import { DeleteTableIcon } from "@/components/icons/DeleteTableIcon";

export {
  HashtagDecoration,
  spellCheckPluginKey,
  setGlobalSpellCheckEnabled,
  expandThaiAnomalyCluster,
  SpellCheckDecoration,
  InlineCodeHighlight,
  SmartTypography,
  WrongLanguageSuggestion,
  getToggleButtonMode,
  handleToggleClick,
  isToggleActive,
  unwrapToggleAtPos,
  subscribeToggleFocusChange,
  Toggle,
  CustomParagraph,
  LivePreview,
  livePreviewPluginKey,
  getCleanCollapsedHtml,
  SLASH_ITEMS,
  insertFootnoteAtSelection,
  slashMenuStateRef,
  slashMenuScrollRef,
  createTurndownService,
};
export type {
  HashtagDecorationOptions,
  InlineCodeHighlightOptions,
  SmartTypographyOptions,
  WrongLanguageSuggestionOptions,
  SlashMenuItem,
};

marked.use({
  extensions: [
    {
      name: "highlight",
      level: "inline",
      start(src: string) {
        return src.match(/==/)?.index;
      },
      tokenizer(src: string) {
        const match = src.match(/^==((?:\\=|[^\r\n=]|=(?!=))+?)==/);
        if (match) {
          return {
            type: "highlight",
            raw: match[0],
            text: match[1],
            tokens: (this as any).lexer.inlineTokens(match[1]),
          };
        }
      },
      renderer(token: any) {
        return `<mark class="luno-highlight">${(this as any).parser.parseInline(token.tokens || [])}</mark>`;
      },
    },
  ],
});

/** Preserves full ProseMirror undo/redo history and document state per note across tab switching */
export const noteEditorStateMap = new Map<string, EditorState>();

/** Preserves in-memory content for HTML & CSS code editors across tab switching and preview modes */
export const codeEditorContentMap = new Map<string, string>();

/** Set of note IDs that have been explicitly closed and should not be resurrected by transition saves */
export const closedNoteIds = new Set<string>();

/** Preserves scroll position (scrollTop) per note across tab switching while tab is open */
export const noteScrollPositionMap = new Map<string, number>();

export function getNoteScrollPosition(noteId: string): number {
  if (!noteId || closedNoteIds.has(noteId)) return 0;
  if (noteScrollPositionMap.has(noteId)) {
    return noteScrollPositionMap.get(noteId) ?? 0;
  }
  try {
    const saved = sessionStorage.getItem(`luno_scroll_${noteId}`);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) {
        noteScrollPositionMap.set(noteId, parsed);
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function setNoteScrollPosition(noteId: string, top: number) {
  if (!noteId || closedNoteIds.has(noteId)) return;
  const cleanTop = Math.max(0, Math.round(top || 0));
  noteScrollPositionMap.set(noteId, cleanTop);
  try {
    sessionStorage.setItem(`luno_scroll_${noteId}`, String(cleanTop));
  } catch {
    /* ignore */
  }
}

export function clearNoteEditorHistory(noteId: string) {
  if (!noteId) return;
  closedNoteIds.add(noteId);
  noteEditorStateMap.delete(noteId);
  codeEditorContentMap.delete(noteId);
  noteScrollPositionMap.delete(noteId);
  clearPdfEditorDraft(noteId);
  try {
    sessionStorage.removeItem(`luno_scroll_${noteId}`);
    localStorage.removeItem(`luno_backup_${noteId}`);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("luno:clear-note-editor-history", { detail: { noteId } }));
  }
}

export function TextColorIcon({ color, className = "h-4 w-4" }: { color?: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 16 6-12 6 12" />
      <path d="M8 12h8" />
      <path
        d="M4 21h16"
        stroke={color || "currentColor"}
        strokeWidth="3"
      />
    </svg>
  );
}

export const clearNoteEditorState = clearNoteEditorHistory;

export interface MatchedFontOption {
  id: string;
  nameKey?: string;
  displayName?: string;
  css: string;
  isCustom?: boolean;
}

export function findMatchingFontOption(
  rawFont: string | null | undefined,
  customFonts?: import("@/lib/customFontStore").CustomFont[]
): MatchedFontOption | undefined {
  if (!rawFont || typeof rawFont !== "string") return undefined;
  const trimmed = rawFont.trim();
  if (!trimmed) return undefined;

  const clean = (s: string) => s.replace(/['"]/g, "").trim().toLowerCase();
  const cleanedRaw = clean(trimmed);
  const rawParts = cleanedRaw.split(",").map((p) => p.trim()).filter(Boolean);
  const primaryRaw = rawParts[0] || "";

  // 0. Match custom fonts
  if (customFonts && customFonts.length > 0) {
    const cfMatch = customFonts.find(
      (cf) =>
        cf.id === trimmed ||
        cf.id.toLowerCase() === cleanedRaw ||
        clean(cf.name) === cleanedRaw ||
        clean(cf.name) === primaryRaw ||
        cf.css === trimmed ||
        clean(cf.css) === cleanedRaw
    );
    if (cfMatch) {
      return {
        id: cfMatch.id,
        displayName: cfMatch.name,
        css: cfMatch.css,
        isCustom: true,
      };
    }
  }

  // 1. Exact match on id or css
  const exact = FONT_OPTIONS.find((f) => f.id === trimmed || f.css === trimmed);
  if (exact) return exact;

  // 3. Check exact ID match (case-insensitive)
  const idMatch = FONT_OPTIONS.find((f) => f.id.toLowerCase() === cleanedRaw || f.id.toLowerCase() === primaryRaw);
  if (idMatch) return idMatch;

  // 4. Known aliases for explicit font names
  const aliasMap: Record<string, string> = {
    "noto serif thai": "notoSerifThai",
    "noto sans thai": "notoSansThai",
    "ibm plex thai": "ibmPlexThai",
    "ibm plex sans thai": "ibmPlexThai",
    "chakra petch": "chakraPetch",
    "jetbrains mono": "mono",
    "system-ui": "system",
    "-apple-system": "system",
    "segoe ui": "system",
    "prompt": "prompt",
    "sarabun": "sarabun",
    "kanit": "kanit",
    "mitr": "mitr",
    "mali": "mali",
    "itim": "itim",
    "sriracha": "sriracha",
    "chonburi": "chonburi",
    "inter": "inter",
    "serif": "serif",
    "mono": "mono",
    "system": "system",
  };

  if (aliasMap[cleanedRaw]) {
    const found = FONT_OPTIONS.find((f) => f.id === aliasMap[cleanedRaw]);
    if (found) return found;
  }
  if (aliasMap[primaryRaw]) {
    const found = FONT_OPTIONS.find((f) => f.id === aliasMap[primaryRaw]);
    if (found) return found;
  }

  // 5. Match by CSS first primary name or full string
  const matched = FONT_OPTIONS.find((f) => {
    const fCleanedCss = clean(f.css);
    if (fCleanedCss === cleanedRaw) return true;

    const fParts = fCleanedCss.split(",").map((p) => p.trim()).filter(Boolean);
    const fPrimary = fParts[0] || "";
    if (fPrimary && primaryRaw) {
      if (fPrimary === primaryRaw) return true;
      if (primaryRaw.startsWith(fPrimary) || fPrimary.startsWith(primaryRaw)) return true;
    }
    return false;
  });
  if (matched) return matched;

  for (const part of rawParts) {
    const targetId = aliasMap[part];
    if (targetId) {
      const found = FONT_OPTIONS.find((f) => f.id === targetId);
      if (found) return found;
    }
  }

  return undefined;
}

export function getActiveFontFamily(editor: TiptapEditor | null | undefined): string | undefined {
  if (!editor) return undefined;
  const attrFont = editor.getAttributes("fontFamily")?.fontFamily;
  if (attrFont) return attrFont;

  try {
    const { selection, doc } = editor.state;
    if (selection) {
      if (selection.empty) {
        const marks = selection.$from.marks();
        const fontMark = marks.find((m) => m.type.name === "fontFamily");
        if (fontMark?.attrs?.fontFamily) return fontMark.attrs.fontFamily;
      } else {
        let foundAttr: string | undefined;
        doc.nodesBetween(selection.from, selection.to, (node) => {
          if (!foundAttr && node.marks) {
            const fontMark = node.marks.find((m) => m.type.name === "fontFamily");
            if (fontMark?.attrs?.fontFamily) {
              foundAttr = fontMark.attrs.fontFamily;
              return false;
            }
          }
        });
        if (foundAttr) return foundAttr;
      }
    }
  } catch {
    /* ignore selection inspection errors */
  }
  return undefined;
}

export function normalizeSerializedMarkdown(markdown: string): string {
  let clean = markdown.replace(/\r\n?/g, "\n");

  // 1. Extract leading blank tokens
  let leadingCount = 0;
  const leadMatch = clean.match(/^(?:[\r\n]*<!--luno:blank-->[\r\n]*)+/);
  if (leadMatch) {
    leadingCount = (leadMatch[0].match(/<!--luno:blank-->/g) || []).length;
    clean = clean.slice(leadMatch[0].length);
  }

  // 2. Extract trailing blank tokens
  let trailingCount = 0;
  const trailMatch = clean.match(/(?:[\r\n]*<!--luno:blank-->[\r\n]*)+$/);
  if (trailMatch) {
    trailingCount = (trailMatch[0].match(/<!--luno:blank-->/g) || []).length;
    clean = clean.slice(0, clean.length - trailMatch[0].length);
  }

  // 3. Internal blanks between blocks: k empty paragraphs -> k blank lines (k + 1 newlines)
  clean = clean.replace(/\n+(?:[ \t]*<!--luno:blank-->[ \t]*\n*)+/g, (match) => {
    const k = (match.match(/<!--luno:blank-->/g) || []).length;
    return "\n".repeat(k + 1);
  });

  clean = clean.replace(/<!--luno:blank-->/g, "");
  clean = clean.replace(/\n[ \t]*\|[ \t|]*\n/g, "\n\n");
  clean = clean.replace(/[ \t]+(?=\n)/g, "");
  clean = clean.replace(/^\n+|\n+$/g, "");

  if (leadingCount > 0) {
    clean = "\n".repeat(leadingCount) + clean;
  }
  if (trailingCount > 0) {
    clean = clean + "\n".repeat(trailingCount);
  }

  return clean;
}

/** Parses inline Markdown formatting (italics, bold, code, wikilinks, highlights) inside footnote content */
export function parseFootnoteInlineMarkdown(content: string): string {
  if (!content) return "";
  let processed = content;
  // Convert Wikilinks [[Target|Alias]]
  processed = processed.replace(/\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g, (_m, target, alias) => {
    const cleanTarget = (target || "").trim();
    const cleanAlias = (alias || "").trim() || cleanTarget;
    return `<a href="wikilink:${encodeURIComponent(cleanTarget)}" data-wikilink="${cleanTarget}" class="internal-wikilink text-primary underline underline-offset-4 cursor-pointer">${cleanAlias}</a>`;
  });
  // Convert ==highlight== outside code blocks
  processed = processed.replace(/==((?:\\=|[^\r\n=]|=(?!=))+?)==/g, '<mark class="luno-highlight">$1</mark>');

  try {
    const inline = marked.parseInline(processed, { async: false, gfm: true, breaks: true }) as string;
    return inline || processed;
  } catch {
    return processed;
  }
}

/** Preprocess Markdown to preserve paragraph first-line indentation and empty paragraphs while preserving code blocks and syntax */
export function preprocessMarkdownForEditor(markdown: string, isReadingMode: boolean = false): string {
  if (!markdown) return "";
  const lines = markdown.split("\n");
  let inFencedCode = false;
  let fenceChar = "";
  let fenceLength = 0;
  const resultLines: string[] = [];
  const footnoteDefs = new Map<string, string>();
  let justStrippedFootnote = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      inList = false;
      const fenceStr = fenceMatch[2];
      if (!inFencedCode) {
        inFencedCode = true;
        fenceChar = fenceStr[0];
        fenceLength = fenceStr.length;
        resultLines.push(line);
        continue;
      } else if (fenceStr[0] === fenceChar && fenceStr.length >= fenceLength && !fenceMatch[3].trim()) {
        inFencedCode = false;
        fenceChar = "";
        fenceLength = 0;
        resultLines.push(line);
        continue;
      }
    }

    if (inFencedCode) {
      inList = false;
      // Unescape legacy double-escaped HTML entities stored in code blocks by previous versions
      const unescapedLine = line.replace(/&(?:lt|gt|amp|quot|#39);/gi, (match) => {
        if (match === "&lt;") return "<";
        if (match === "&gt;") return ">";
        if (match === "&amp;") return "&";
        if (match === "&quot;") return '"';
        if (match === "&#39;") return "'";
        return match;
      });
      resultLines.push(unescapedLine);
      continue;
    }

    let processedLine = line;

    // Handle footnote definitions outside code blocks: e.g. [^1]: This is a footnote.
    const footnoteDefMatch = line.match(/^\[\^([^\]\r\n\s]+)\]:\s*(.*)$/);
    if (footnoteDefMatch) {
      inList = false;
      const fnId = footnoteDefMatch[1].trim();
      const fnContent = footnoteDefMatch[2].trim();
      if (isReadingMode) {
        // In Reading Mode: collected to render at the bottom of the document
        footnoteDefs.set(fnId, fnContent);
        // Ensure there is exactly 1 normal empty paragraph spacing after the text reference
        while (
          resultLines.length > 0 &&
          (resultLines[resultLines.length - 1] === "" || resultLines[resultLines.length - 1] === "<p></p>")
        ) {
          resultLines.pop();
        }
        resultLines.push("");
        resultLines.push("<p></p>");
        resultLines.push("");
        justStrippedFootnote = true;
        continue;
      } else {
        // In Edit Mode: rendered in-place without separate arrow icon, with clickable prefix and parsed inline formatting
        const formattedContent = parseFootnoteInlineMarkdown(fnContent);
        processedLine = `<p id="fn-${fnId}" data-footnote-def="${fnId}" class="footnote-def text-sm text-muted-foreground my-1.5"><a href="#fnref-${fnId}" data-footnote-backref="${fnId}" class="footnote-backref text-primary font-medium mr-1 select-none no-underline hover:underline cursor-pointer">[^${fnId}]:</a> ${formattedContent}</p>`;
        resultLines.push(processedLine);
        continue;
      }
    }

    // Handle empty or blank lines (Obsidian compatibility: every blank line becomes an editable empty paragraph)
    if (!line.trim() || /^\s*\|[\s|]*$/.test(line)) {
      inList = false;
      if (isReadingMode && justStrippedFootnote) {
        // Skip blank lines immediately following a stripped footnote definition in reading mode
        continue;
      }
      justStrippedFootnote = false;

      // Find the next non-empty line to check if it's an indented list / continuation block
      let nextNonEmptyIdx = i + 1;
      while (nextNonEmptyIdx < lines.length && (!lines[nextNonEmptyIdx].trim() || /^\s*\|[\s|]*$/.test(lines[nextNonEmptyIdx]))) {
        nextNonEmptyIdx++;
      }
      const nextNonEmptyLine = nextNonEmptyIdx < lines.length ? lines[nextNonEmptyIdx] : "";
      const isNextIndented = /^[ \t]{2,}/.test(nextNonEmptyLine);

      if (isNextIndented || (line.length > 0 && /^[ \t]{2,}/.test(line))) {
        // Indented continuation inside list / nested block: preserve as plain blank line so Markdown parser handles indentation as nested list
        resultLines.push("");
        continue;
      }

      // Count consecutive blank lines (cap at 50 to prevent freezing on massive corrupted whitespace files)
      let blankCount = 1;
      while (i + 1 < lines.length && (!lines[i + 1].trim() || /^\s*\|[\s|]*$/.test(lines[i + 1]))) {
        const nextCandidate = lines[i + 1];
        if (nextCandidate.length > 0 && /^[ \t]{2,}/.test(nextCandidate)) {
          break;
        }
        blankCount++;
        i++;
      }

      blankCount = Math.min(blankCount, 50);

      if (resultLines.length > 0 && resultLines[resultLines.length - 1] !== "") {
        resultLines.push("");
      }
      for (let b = 0; b < blankCount; b++) {
        resultLines.push("<p></p>");
      }
      resultLines.push("");
      continue;
    }

    justStrippedFootnote = false;

    // Track list item status and prevent unindented images/media from being lazily absorbed into <li>
    const isListLine = /^\s*(?:[-*+]\s|\d+[\.\)]\s)/.test(line);
    if (isListLine) {
      inList = true;
    } else if (inList) {
      const isIndentedContinuation = /^[ \t]{2,}/.test(line);
      if (isIndentedContinuation) {
        inList = true;
      } else {
        inList = false;
        const isStandaloneImageOrMedia = /^(!\[.*?\]\(.*?\)|\!\[\[.*?\]\]|<img\s|<video\s|<audio\s)/.test(line);
        if (isStandaloneImageOrMedia && resultLines.length > 0 && resultLines[resultLines.length - 1] !== "") {
          resultLines.push("");
        }
      }
    }

    // Normalize headings missing a space after hashes e.g. "##✨New Features" -> "## ✨New Features"
    processedLine = processedLine
      .replace(/^(#{2,6})([^\s#])/, "$1 $2")
      .replace(/^#([^\s#a-zA-Z0-9_\-\/\u0E00-\u0E7F])/, "# $1");

    // Do NOT alter indentation for Markdown structural syntax:
    // lists (- *, 1.), blockquotes (>), headings (#), horizontal rules (--- *** ___ * * *), tables (|)
    const isMarkdownSyntax = /^\s*(?:[-*+]\s|\d+[\.\)]\s|>\s|#{1,6}\s|\||---|[*]{3,}|_{3,}|[*]\s[*]\s[*]|-\s-\s-)/.test(line);

    // Only convert leading spaces/tabs for prose text lines (e.g. Thai text) outside code blocks
    const hasProseText = /[\u0E00-\u0E7F]/.test(line);

    if (!isMarkdownSyntax && hasProseText) {
      const match = line.match(/^([ \t\u00A0\u2003]{2,4}|\t+)(.*)/);
      if (match) {
        const raw = match[1];
        const count = raw.includes("\t") ? 4 : raw.length;
        if (count >= 2) {
          processedLine = `\u2003\u2003${match[2]}`;
        }
      }
    }

    // Normalize broken/unescaped double quotes inside style="..." on HTML tags (e.g. <span style="font-family: "Font Name", sans-serif;">)
    processedLine = processedLine.replace(/<([a-z0-9]+)\s+([^>]*?)style="([^">]*"[^">]*)"([^>]*)>/gi, (match, tag, before, styleVal, after) => {
      if (/\s+[a-zA-Z0-9_-]+=/i.test(styleVal)) {
        return match;
      }
      const cleanStyle = styleVal.replace(/"/g, "'");
      return `<${tag} ${before}style="${cleanStyle}"${after}>`;
    });

    // 1. Convert Obsidian Embeds ![[Target]] or ![[Target|Width]] or ![[Target|Alias]] outside code blocks
    processedLine = processedLine.replace(/!\[\[([^\]|\r\n]+?)(?:\|([^\]\r\n]+?))?\]\]/g, (_m, rawTarget, rawParam) => {
      const target = (rawTarget || "").trim();
      const param = (rawParam || "").trim();
      if (!target) return "";

      const widthMatch = param.match(/^(\d+)(?:x\d+)?$/);
      const width = widthMatch ? widthMatch[1] : "";
      const altOrTitle = !widthMatch ? param : "";

      let cleanSrc = target;
      if (cleanSrc && !/^(https?:\/\/|data:|blob:)/i.test(cleanSrc)) {
        try {
          cleanSrc = encodeURI(decodeURI(cleanSrc));
        } catch {
          cleanSrc = cleanSrc.replace(/ /g, "%20");
        }
      }

      const isAudio = isAudioMedia(target);
      const isVideo = isVideoMedia(target);
      const isImage = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif|tiff?)(?:[?#].*)?$/i.test(target);

      if (isVideo) {
        const titleAttr = altOrTitle ? ` title="${escapeHtml(altOrTitle)}" data-title="${escapeHtml(altOrTitle)}"` : "";
        const widthAttr = width ? ` width="${width}"` : "";
        return `<video src="${cleanSrc}" data-relative-src="${cleanSrc}" controls="true"${widthAttr}${titleAttr}></video>`;
      }

      if (isAudio) {
        const titleAttr = altOrTitle ? ` data-title="${escapeHtml(altOrTitle)}"` : "";
        return `<audio src="${cleanSrc}" data-relative-src="${cleanSrc}" controls="true"${titleAttr}></audio>`;
      }

      if (isImage || !target.includes(".")) {
        const widthAttr = width ? ` width="${width}" style="width: ${width}px; max-width: 100%;"` : "";
        return `<img src="${cleanSrc}" alt="${escapeHtml(altOrTitle)}" data-relative-src="${cleanSrc}" data-wikilink-embed="true"${widthAttr} />`;
      }

      return `<a href="wikilink:${encodeURIComponent(target)}" data-wikilink="${target}" class="internal-wikilink text-primary underline underline-offset-4 cursor-pointer">${altOrTitle || target}</a>`;
    });

    // 2. Convert standard Wikilinks [[Target]] or [[Target|Alias]] outside code blocks into standard HTML links
    processedLine = processedLine.replace(/(?<!\!)\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g, (_m, target, alias) => {
      const cleanTarget = (target || "").trim();
      const cleanAlias = (alias || "").trim() || cleanTarget;
      return `<a href="wikilink:${encodeURIComponent(cleanTarget)}" data-wikilink="${cleanTarget}" class="internal-wikilink text-primary underline underline-offset-4 cursor-pointer">${cleanAlias}</a>`;
    });

    // Convert ==highlight== outside code blocks into standard HTML mark tags
    processedLine = processedLine.replace(/==((?:\\=|[^\r\n=]|=(?!=))+?)==/g, '<mark class="luno-highlight">$1</mark>');

    // Convert sized Markdown images/media ![alt|300](url) outside code blocks into HTML tags with width
    processedLine = processedLine.replace(
      /!\[([^\]|\r\n]*)\|(\d+)(?:x\d+)?\]\(([^)\r\n]+)\)/g,
      (_m, alt, width, src) => {
        let cleanSrc = (src || "").trim();
        const cleanAlt = (alt || "").trim();
        if (cleanSrc && !/^(https?:\/\/|data:|blob:)/i.test(cleanSrc)) {
          try {
            cleanSrc = encodeURI(decodeURI(cleanSrc));
          } catch {
            cleanSrc = cleanSrc.replace(/ /g, "%20");
          }
        }
        const isAudio = isAudioMedia(cleanSrc);
        const isVideo = isVideoMedia(cleanSrc);
        if (isVideo) {
          const titleAttr = cleanAlt ? ` title="${escapeHtml(cleanAlt)}" data-title="${escapeHtml(cleanAlt)}"` : "";
          return `<video src="${cleanSrc}" data-relative-src="${cleanSrc}" controls="true" width="${width}"${titleAttr}></video>`;
        }
        if (isAudio) {
          const titleAttr = cleanAlt ? ` data-title="${escapeHtml(cleanAlt)}"` : "";
          return `<audio src="${cleanSrc}" data-relative-src="${cleanSrc}" controls="true"${titleAttr}></audio>`;
        }
        return `<img src="${cleanSrc}" alt="${cleanAlt}" width="${width}" data-relative-src="${cleanSrc}" style="width: ${width}px; max-width: 100%;" />`;
      }
    );

    // Ensure standard Markdown images/media ![alt](url) are parsed properly
    processedLine = processedLine.replace(
      /!\[([^\]|\r\n]*)\]\(([^)\r\n]+)\)/g,
      (match, alt, src) => {
        const trimmed = (src || "").trim();
        const titleMatch = trimmed.match(/^(\S+.*?)(?:\s+(["'][^"']*["']))?$/);
        if (titleMatch) {
          let urlPart = titleMatch[1];
          const rawTitle = titleMatch[2] ? titleMatch[2].slice(1, -1) : "";
          if (urlPart && !/^(https?:\/\/|data:|blob:)/i.test(urlPart)) {
            try {
              urlPart = encodeURI(decodeURI(urlPart));
            } catch {
              urlPart = urlPart.replace(/ /g, "%20");
            }
          }
          const isAudio = isAudioMedia(urlPart);
          const isVideo = isVideoMedia(urlPart);
          if (isVideo) {
            const displayTitle = rawTitle || alt || "";
            const titleAttr = displayTitle ? ` title="${escapeHtml(displayTitle)}" data-title="${escapeHtml(displayTitle)}"` : "";
            return `<video src="${urlPart}" data-relative-src="${urlPart}" controls="true"${titleAttr}></video>`;
          }
          if (isAudio) {
            const displayTitle = rawTitle || alt || "";
            const titleAttr = displayTitle ? ` data-title="${escapeHtml(displayTitle)}"` : "";
            return `<audio src="${urlPart}" data-relative-src="${urlPart}" controls="true"${titleAttr}></audio>`;
          }
          const titlePart = titleMatch[2] ? ` ${titleMatch[2]}` : "";
          return `![${alt}](${urlPart}${titlePart})`;
        }
        return match;
      }
    );

    // Convert footnote references outside inline code blocks: e.g. text[^1] or text[^note]
    const parts = processedLine.split(/(`+[^`\r\n]*`+)/g);
    processedLine = parts
      .map((part) => {
        if (part.startsWith("`") && part.endsWith("`")) return part;
        return part.replace(/(?<!\\)\[\^([^\]\r\n\s]+)\]/g, (_m, refId) => {
          const cleanId = refId.trim();
          return `<sup><a href="#fn-${cleanId}" id="fnref-${cleanId}" data-footnote-ref="${cleanId}" class="footnote-ref text-primary hover:underline cursor-pointer select-none font-medium px-0.5">[${cleanId}]</a></sup>`;
        });
      })
      .join("");

    resultLines.push(processedLine);

    // Ensure standalone HTML tags (such as QR Code <img ... />, media tags, or closed HTML block tags like <p style="...">...</p>)
    // are followed by a blank line if the next line is a Markdown element (heading, list, table, blockquote, hr, code block) or text.
    // Under CommonMark / GFM HTML Block Type 7, any subsequent lines without a blank line are absorbed into the HTML block,
    // which prevents headings (##), lists (-), and other markdown elements from being parsed.
    const isStandaloneHtmlBlock =
      /^\s*<(?:img|video|audio)\b[^>]*\/?>(?:\s*<\/(?:img|video|audio)>)?\s*$/i.test(processedLine) ||
      /^\s*<p>\s*<img\b[^>]*\/?>\s*<\/p>\s*$/i.test(processedLine) ||
      /<\/(?:p|h[1-6]|div|blockquote|table|section|article)>\s*$/i.test(processedLine);
    if (isStandaloneHtmlBlock && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.trim() && !/^\s*<\/(?:div|section|article|p)>/i.test(nextLine)) {
        resultLines.push("");
      }
    }
  }

  // In Reading Mode: render collected footnotes at the bottom below divider with return arrow
  // Structure: Blank Line (<p></p>) -> Divider Line (<hr class="footnotes-sep">) -> Blank Line (<p></p>) -> Footnotes list
  if (isReadingMode && footnoteDefs.size > 0) {
    const sortedEntries = Array.from(footnoteDefs.entries()).sort(([idA], [idB]) => {
      const numA = Number(idA);
      const numB = Number(idB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
    });

    const footnoteItems: string[] = [];
    sortedEntries.forEach(([fnId, fnContent]) => {
      const formattedContent = parseFootnoteInlineMarkdown(fnContent);
      footnoteItems.push(
        `<li id="fn-${fnId}" class="footnote-item" data-footnote-id="${fnId}"><p><a id="fn-${fnId}" data-footnote-target="${fnId}" class="footnote-anchor select-none"></a>${formattedContent} <a href="#fnref-${fnId}" id="fnback-${fnId}" data-footnote-backref="${fnId}" class="footnote-backref text-primary hover:underline cursor-pointer select-none ml-1">↩</a></p></li>`
      );
    });

    // Clean any trailing empty lines/paragraphs before the footnote section
    while (
      resultLines.length > 0 &&
      (resultLines[resultLines.length - 1] === "" || resultLines[resultLines.length - 1] === "<p></p>")
    ) {
      resultLines.pop();
    }

    resultLines.push("");
    resultLines.push("<p></p>");
    resultLines.push("");
    resultLines.push('<hr class="footnotes-sep my-6 border-t border-border/60" />');
    resultLines.push("");
    resultLines.push("<p></p>");
    resultLines.push("");
    resultLines.push(`<section class="footnotes my-4" data-footnotes="true"><ol class="footnotes-list list-decimal pl-6 space-y-1 text-sm text-muted-foreground">${footnoteItems.join("")}</ol></section>`);
  }

  return resultLines.join("\n");
}

export function hasReadingModeFootnotesDoc(doc: any): boolean {
  if (!doc || !doc.childCount) return false;
  // Reading mode footnotes (hr.footnotes-sep and footnotes list) are always placed at the bottom of the document
  const count = doc.childCount;
  const start = Math.max(0, count - 6);
  for (let i = start; i < count; i++) {
    const node = doc.child(i);
    if (node.type.name === "horizontalRule" && node.attrs?.class?.includes("footnotes-sep")) {
      return true;
    }
    if (node.type.name === "orderedList") {
      let hasFootnoteMark = false;
      node.descendants((child: any) => {
        if (hasFootnoteMark) return false;
        if (child.isText && (child.text?.includes("↩") || child.text?.includes("\u21a9"))) {
          hasFootnoteMark = true;
          return false;
        }
        if (
          child.marks &&
          child.marks.some(
            (m: any) =>
              m.type.name === "link" &&
              (m.attrs?.href?.includes("#fnref-") || m.attrs?.["data-footnote-backref"] || m.attrs?.["data-footnote-target"])
          )
        ) {
          hasFootnoteMark = true;
          return false;
        }
      });
      if (hasFootnoteMark) return true;
    }
  }
  return false;
}

export const EDITOR_CLASSES =
  "w-full max-w-full break-words [word-break:normal] outline-none text-foreground cursor-text [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/40 [&_.is-empty::before]:content-[attr(data-placeholder)] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h1:first-child]:text-2xl [&>h1:first-child]:font-semibold [&>h1:first-child]:leading-tight [&>h1:first-child]:md:text-3xl [&>h1:first-child]:mb-6 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:cursor-pointer [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:md:text-3xl [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_h5]:text-sm [&_h5]:font-semibold [&_h6]:text-xs [&_h6]:font-semibold [&_h6]:text-muted-foreground [&_img]:my-0 [&_img]:h-auto [&_img]:max-w-full [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-0 [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-6 [&_details]:my-0 [&_details]:py-0 [&_details_summary]:my-0 [&_details_summary]:py-0" +
  " [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-0 [&_ul[data-type='taskList']_li_label]:w-6 [&_ul[data-type='taskList']_li_label]:h-7 [&_ul[data-type='taskList']_li_label]:shrink-0 [&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center [&_ul[data-type='taskList']_li_label]:justify-center [&_ul[data-type='taskList']_li_label_input]:h-[14px] [&_ul[data-type='taskList']_li_label_input]:w-[14px] [&_ul[data-type='taskList']_li_label_input]:bg-transparent [&_ul[data-type='taskList']_li_label_input]:rounded-[3px] [&_ul[data-type='taskList']_li_label_input]:border [&_ul[data-type='taskList']_li_label_input]:border-muted-foreground/50 [&_ul[data-type='taskList']_li_label_input]:cursor-pointer [&_ul[data-type='taskList']_li_label_input]:accent-primary [&_ul[data-type='taskList']_li_>_div]:flex-1 [&_ul[data-type='taskList']_li_>_div_p]:my-0 [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:line-through [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:text-muted-foreground/90" +
  " [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:max-w-full [&_.tableWrapper]:my-4 [&_table]:my-0 [&_table]:w-[70%] max-md:[&_table]:w-full [&_td]:border [&_td]:border-border/60 [&_td]:py-2 [&_td]:px-3 [&_td]:relative [&_th]:border [&_th]:border-border/60 [&_th]:py-2 [&_th]:px-3 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left [&_td_p]:my-0 [&_td_p]:leading-normal [&_th_p]:my-0 [&_th_p]:leading-normal" +
  " [&_.footnote-ref]:text-primary [&_.footnote-ref]:no-underline hover:[&_.footnote-ref]:underline [&_.footnote-ref]:font-medium [&_.footnote-ref]:cursor-pointer [&_sup]:text-[0.75em] [&_sup]:leading-none [&_sup]:align-super [&_sub]:text-[0.75em] [&_sub]:leading-none [&_sub]:align-sub [&_.footnote-def]:text-sm [&_.footnote-def]:text-muted-foreground [&_.footnote-def]:my-1 [&_.footnote-backref]:text-primary [&_.footnote-backref]:no-underline hover:[&_.footnote-backref]:underline [&_.footnote-backref]:font-medium [&_.footnote-backref]:cursor-pointer";

// escapeHtml is re-exported from @/lib/htmlUtils

export const toTaskItemHtml = (isChecked: boolean, text: string) => {
  const trimmed = (text || "").trim();
  const inner = trimmed.startsWith("<p>") && trimmed.endsWith("</p>") ? trimmed : `<p>${trimmed}</p>`;
  return (
    `<li data-type="taskItem" data-checked="${isChecked}">` +
    `<label contenteditable="false"><input type="checkbox"${isChecked ? " checked" : ""}><span></span></label>` +
    `<div>${inner}</div>` +
    `</li>`
  );
};

export const migrateDomTaskLists = (root: HTMLElement) => {
  root.querySelectorAll("li.task-list-item").forEach((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const isChecked = checkbox ? (checkbox as HTMLInputElement).checked : false;
    checkbox?.remove();
    const contentSpan = li.querySelector(".task-list-item-content");
    const inner = contentSpan
      ? ((contentSpan as HTMLElement).innerHTML || "").trim()
      : ((li as HTMLElement).innerHTML || "").trim();
    const tpl = document.createElement("template");
    tpl.innerHTML = toTaskItemHtml(isChecked, inner);
    if (tpl.content.firstChild) {
      li.replaceWith(tpl.content.firstChild);
    }
  });

  root.querySelectorAll("li").forEach((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    if (!checkbox || li.getAttribute("data-type") === "taskItem") return;
    const isChecked = (checkbox as HTMLInputElement).checked;
    checkbox.remove();
    const inner = ((li as HTMLElement).innerHTML || "").trim();
    const tpl = document.createElement("template");
    tpl.innerHTML = toTaskItemHtml(isChecked, inner || "<p></p>");
    if (tpl.content.firstChild) {
      li.replaceWith(tpl.content.firstChild);
    }
  });

  root.querySelectorAll("ul").forEach((ul) => {
    if (ul.querySelector('li[data-type="taskItem"]')) {
      ul.setAttribute("data-type", "taskList");
      ul.removeAttribute("class");
    }
  });
};

export const prepareDomForEditor = (
  root: HTMLElement,
  options?: {
    assetBlobUrlMap?: Map<string, string>;
    theme?: string;
    tagColorStyle?: string;
    forStaticHtmlPreview?: boolean;
  }
) => {
  migrateDomTaskLists(root);

  // Clean up extra leading/trailing newlines in code blocks from marked output and ensure no double HTML entity encoding
  root.querySelectorAll("pre code, pre").forEach((el) => {
    if (el.tagName === "CODE" || (el.tagName === "PRE" && !el.querySelector("code"))) {
      const rawText = (el.textContent || "").replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
      el.innerHTML = escapeHtml(rawText);
    }
  });

  // Wrap tables in tableWrapper matching Tiptap Table structure
  root.querySelectorAll("table").forEach((table) => {
    if (!table.parentElement?.classList.contains("tableWrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "tableWrapper";
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });

  // Normalize audio tags (ensure data-relative-src is set for data: or blob: audio with title)
  root.querySelectorAll("audio").forEach((audio) => {
    const src = audio.getAttribute("src") || "";
    const title = audio.getAttribute("data-title") || audio.getAttribute("title") || "";
    const relSrc = audio.getAttribute("data-relative-src");
    if (!relSrc && title && (src.startsWith("data:audio/") || src.startsWith("blob:"))) {
      const ext = title.includes(".") ? "" : ".webm";
      audio.setAttribute("data-relative-src", `attachments/${title}${ext}`);
    }
  });

  // Unwrap paragraphs containing audio elements, video elements, or image elements
  root.querySelectorAll("p").forEach((p) => {
    if (p.closest("table, td, th")) return;
    let media = p.querySelector("img, audio, video");
    while (media && p.contains(media)) {
      p.querySelectorAll("br").forEach((br) => {
        if (
          br.nextElementSibling === media ||
          br.previousElementSibling === media ||
          !br.nextSibling ||
          br.nextSibling === media ||
          !br.previousSibling ||
          br.previousSibling === media
        ) {
          br.remove();
        }
      });
      if (!p.textContent?.trim() && p.querySelectorAll("img, audio, video, input, label").length === 1) {
        p.replaceWith(media);
        break;
      } else {
        const childNodes = Array.from(p.childNodes);
        const mediaIdx = childNodes.indexOf(media);
        const hasBefore = childNodes.slice(0, mediaIdx).some((n) => (n.textContent || "").trim().length > 0 || (n instanceof Element && /^(IMG|AUDIO|VIDEO|INPUT|LABEL)$/i.test(n.tagName)));
        const hasAfter = childNodes.slice(mediaIdx + 1).some((n) => (n.textContent || "").trim().length > 0 || (n instanceof Element && /^(IMG|AUDIO|VIDEO|INPUT|LABEL)$/i.test(n.tagName)));

        if (!hasBefore && hasAfter) {
          p.before(media);
        } else if (hasBefore && !hasAfter) {
          p.after(media);
        } else if (hasBefore && hasAfter) {
          const p2 = document.createElement("p");
          while (media.nextSibling) {
            p2.appendChild(media.nextSibling);
          }
          p.after(p2);
          p.after(media);
        } else {
          p.replaceWith(media);
          break;
        }
        if (!p.textContent?.trim() && !p.children.length) {
          p.remove();
          break;
        }
      }
      media = p.querySelector("img, audio, video");
    }
  });

  // Preserve and resolve relative video sources
  root.querySelectorAll("video").forEach((video) => {
    const src = video.getAttribute("src") || "";
    if (src && !/^(https?:\/\/|data:|blob:)/i.test(src)) {
      let encodedRel = src;
      try {
        encodedRel = encodeURI(decodeURI(src));
      } catch {
        encodedRel = src.replace(/ /g, "%20");
      }
      let decodedRel = src;
      try {
        decodedRel = decodeURIComponent(src);
      } catch { /* ignore */ }
      video.setAttribute("data-relative-src", encodedRel);
      if (options?.assetBlobUrlMap) {
        const cachedBlobUrl =
          options.assetBlobUrlMap.get(encodedRel) ||
          options.assetBlobUrlMap.get(decodedRel) ||
          options.assetBlobUrlMap.get(src);
        if (cachedBlobUrl) {
          video.setAttribute("src", cachedBlobUrl);
        }
      }
    }
  });

  // Preserve and resolve relative audio sources
  root.querySelectorAll("audio").forEach((audio) => {
    const src = audio.getAttribute("src") || "";
    if (src && !/^(https?:\/\/|data:|blob:)/i.test(src)) {
      let encodedRel = src;
      try {
        encodedRel = encodeURI(decodeURI(src));
      } catch {
        encodedRel = src.replace(/ /g, "%20");
      }
      let decodedRel = src;
      try {
        decodedRel = decodeURIComponent(src);
      } catch { /* ignore */ }
      audio.setAttribute("data-relative-src", encodedRel);
      if (options?.assetBlobUrlMap) {
        const cachedBlobUrl =
          options.assetBlobUrlMap.get(encodedRel) ||
          options.assetBlobUrlMap.get(decodedRel) ||
          options.assetBlobUrlMap.get(src);
        if (cachedBlobUrl) {
          audio.setAttribute("src", cachedBlobUrl);
        }
      }
    }
  });

  // Preserve and resolve relative image sources
  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (src && !/^(https?:\/\/|data:|blob:)/i.test(src)) {
      let encodedRel = src;
      try {
        encodedRel = encodeURI(decodeURI(src));
      } catch {
        encodedRel = src.replace(/ /g, "%20");
      }
      let decodedRel = src;
      try {
        decodedRel = decodeURIComponent(src);
      } catch { /* ignore */ }
      img.setAttribute("data-relative-src", encodedRel);
      if (options?.assetBlobUrlMap) {
        const cachedBlobUrl =
          options.assetBlobUrlMap.get(encodedRel) ||
          options.assetBlobUrlMap.get(decodedRel) ||
          options.assetBlobUrlMap.get(src);
        if (cachedBlobUrl) {
          img.setAttribute("src", cachedBlobUrl);
        }
      }
    }

    // Preserve and normalize QR code metadata
    const alt = img.getAttribute("alt") || "";
    const title = img.getAttribute("title") || "";
    const isQr =
      img.getAttribute("data-qr-code") === "true" ||
      Boolean(img.getAttribute("data-qr-text")) ||
      alt === "QR Code" ||
      alt.toLowerCase().startsWith("qr code") ||
      title === "QR Code";

    if (isQr && !img.getAttribute("data-qr-code")) {
      img.setAttribute("data-qr-code", "true");
    }
  });

  // Preserve spaces between inline code tags
  root.querySelectorAll("code").forEach((code) => {
    if (code.closest("pre")) return;
    const next = code.nextSibling;
    if (next && next.nodeType === Node.TEXT_NODE && next.nodeValue) {
      if (/^\s+/.test(next.nodeValue)) {
        next.nodeValue = next.nodeValue.replace(/^ +/, (spaces) => "\u00A0".repeat(spaces.length));
      }
    }
  });

  // Preserve first-line Em-Space indentation (\u2003\u2003) for text paragraphs matching Obsidian
  root.querySelectorAll("p").forEach((p) => {
    if (p.childNodes.length > 0 && p.firstChild && p.firstChild.nodeType === Node.TEXT_NODE) {
      const text = p.firstChild.nodeValue || "";
      const match = text.match(/^([\u00A0\u2003]{2,})/);
      if (match) {
        p.firstChild.nodeValue = text.replace(/^[\u00A0\u2003]+/, "\u2003\u2003");
      }
    }
  });

  // Convert inline hashtags (#tag) for static HTML previews only (TipTap Editor & NoteEditorPreview use live HashtagDecoration)
  if (options && (options as Record<string, unknown>).forStaticHtmlPreview === true) {
    const inlineTagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n]|$)/g;
    const formatHashtagsInNode = (element: Node) => {
      const children = Array.from(element.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = (child as HTMLElement).tagName.toLowerCase();
          if (tag === "pre" || tag === "code" || tag === "a" || tag === "input" || tag === "style" || tag === "script") {
            continue;
          }
          formatHashtagsInNode(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          const text = child.nodeValue || "";
          inlineTagRegex.lastIndex = 0;
          if (inlineTagRegex.test(text)) {
            const frag = document.createDocumentFragment();
            inlineTagRegex.lastIndex = 0;
            let lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = inlineTagRegex.exec(text)) !== null) {
              const rawTag = match[1];
              if (/^\d+$/.test(rawTag)) continue;
              const hashIndex = match[0].indexOf("#");
              const matchStart = match.index + hashIndex;
              const matchEnd = matchStart + 1 + rawTag.length;

              if (matchStart > lastIndex) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
              }

              const badge = document.createElement("span");
              const colorClass = getTagColorClass(rawTag, options?.theme as AppTheme | undefined, undefined, options?.tagColorStyle as "multicolor" | "accent" | undefined);
              badge.className = `inline-tag-badge border ${colorClass}`;
              badge.textContent = `#${rawTag}`;
              frag.appendChild(badge);

              lastIndex = matchEnd;
            }
            if (lastIndex < text.length) {
              frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
            child.replaceWith(frag);
          }
        }
      }
    };
    formatHashtagsInNode(root);
  }

  // Convert inline Wikilinks [[Target|Alias]]
  const wikilinkRegex = /\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g;
  const formatWikilinksInNode = (element: Node) => {
    const children = Array.from(element.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = (child as HTMLElement).tagName.toLowerCase();
        if (tag === "pre" || tag === "code" || tag === "a" || tag === "input" || tag === "style" || tag === "script") {
          continue;
        }
        formatWikilinksInNode(child);
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue || "";
        wikilinkRegex.lastIndex = 0;
        if (wikilinkRegex.test(text)) {
          const frag = document.createDocumentFragment();
          wikilinkRegex.lastIndex = 0;
          let lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = wikilinkRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const target = (match[1] || "").trim();
            const alias = (match[2] || "").trim();
            const matchStart = match.index;
            const matchEnd = matchStart + fullMatch.length;

            if (matchStart > lastIndex) {
              frag.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
            }

            const link = document.createElement("a");
            link.href = `wikilink:${encodeURIComponent(target)}`;
            link.setAttribute("data-wikilink", target);
            link.className = "internal-wikilink text-primary underline underline-offset-4 cursor-pointer hover:opacity-80";
            link.textContent = alias || target;
            frag.appendChild(link);

            lastIndex = matchEnd;
          }
          if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
          }
          child.replaceWith(frag);
        }
      }
    }
  };
  formatWikilinksInNode(root);

  root.querySelectorAll("details").forEach((details) => {
    const summary = details.querySelector("summary");
    const title = summary?.textContent?.trim() || "";
    summary?.remove();

    let div = details.querySelector(":scope > div");
    if (!div) {
      div = document.createElement("div");
      while (details.firstChild) {
        div.appendChild(details.firstChild);
      }
      details.appendChild(div);
    }

    const newSummary = document.createElement("summary");
    newSummary.textContent = title;
    details.insertBefore(newSummary, details.firstChild);
  });

  // Only inject <br> into empty paragraphs for external static HTML previews, NEVER for TipTap Editor
  // TipTap/ProseMirror natively handles empty <p></p> by adding its single trailing break. Adding <br> causes doubled breaks.
  if (options && (options as Record<string, unknown>).forStaticHtmlPreview === true) {
    root.querySelectorAll("p").forEach((p) => {
      if (!p.textContent?.trim() && p.children.length === 0) {
        p.innerHTML = "<br>";
      }
    });
  }
};

const BLOCK_HTML_TAGS =
  "address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|noscript|ol|p|pre|section|table|tfoot|thead|tbody|tr|th|td|ul|video|audio|details|summary";
const BLOCK_TAG_REGEX = new RegExp(`^(?:\\/?(?:${BLOCK_HTML_TAGS})|hr\\/?)(?:[\\s\\/>]|$)`, "i");

export function collapseBlockWhitespace(html: string): string {
  return html.replace(/>(\s+)</g, (match, _spaces, offset, string) => {
    const before = string.slice(0, offset + 1);
    const tagBeforeMatch = before.match(/<([^>]+)>$/);
    const after = string.slice(offset + match.length - 1);
    const tagAfterMatch = after.match(/^<([^>]+)>/);

    const isBlockBefore = Boolean(tagBeforeMatch && BLOCK_TAG_REGEX.test(tagBeforeMatch[1].trim()));
    const isBlockAfter = Boolean(tagAfterMatch && BLOCK_TAG_REGEX.test(tagAfterMatch[1].trim()));

    if (isBlockBefore || isBlockAfter) {
      return "><";
    }
    return match;
  });
}

const markdownRenderCache = new Map<string, string>();
const MAX_MARKDOWN_CACHE_SIZE = 100;

export function renderMarkdownToEditorHtml(
  markdown: string,
  options?: {
    isReadingMode?: boolean;
    theme?: string;
    tagColorStyle?: string;
    assetBlobUrlMap?: Map<string, string>;
    contentFormat?: "markdown" | "html" | "plain";
    forStaticHtmlPreview?: boolean;
  }
): string {
  if (!markdown) return "<p></p>";

  const format = options?.contentFormat ?? "markdown";
  if (format === "html") {
    const clean = sanitizeHtml(markdown);
    if (typeof document !== "undefined") {
      const root = document.createElement("div");
      root.innerHTML = clean;
      prepareDomForEditor(root, options);
      return sanitizeHtml(root.innerHTML);
    }
    return clean;
  }
  if (format === "plain") {
    const lines = markdown.split("\n");
    return lines.map((l) => `<p>${l ? escapeHtml(l) : "<br>"}</p>`).join("");
  }

  const isReading = Boolean(options?.isReadingMode);
  const theme = options?.theme || "";
  const tagStyle = options?.tagColorStyle || "";
  const isStatic = Boolean(options?.forStaticHtmlPreview);
  // Check cache for identical markdown content and display options
  const cacheKey = `${isReading}:${theme}:${tagStyle}:${isStatic}:${markdown.length}:${markdown}`;
  const cached = markdownRenderCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // 1. Strip Frontmatter block if present
  const parsedFm = parseFrontmatterAndTags(markdown);
  const cleanText = parsedFm.hasFrontmatter ? parsedFm.bodyContent : markdown;

  // 2. Normalize standalone `[ ]` or `[x]` lines to `- [ ]`
  const normalizedText = cleanText.replace(/^([ \t]*)\[([ xX])\]\s*(.*)$/gm, "$1- [$2] $3");

  // 3. Mark tables with attribute so marked preserves original HTML table structure
  const textWithTableAttr = normalizedText.replace(/<table([\s>])/gi, '<table data-original-html-table="true"$1');

  // 4. Preprocess markdown using Editor's exact preprocessor
  const preprocessed = preprocessMarkdownForEditor(textWithTableAttr, options?.isReadingMode ?? false);

  // 5. Parse with marked
  let rawHtml = "";
  try {
    const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true });
    rawHtml = typeof parsed === "string" ? parsed : cleanText;
  } catch {
    rawHtml = cleanText;
  }

  let finalHtml = "";
  // 6. Complete DOM transformations matching Editor 100%
  if (typeof document !== "undefined") {
    const root = document.createElement("div");
    root.innerHTML = sanitizeHtml(rawHtml);

    prepareDomForEditor(root, options);

    const cleanHtml = collapseBlockWhitespace(
      root.innerHTML.replace(
        /^\s*(?:<hr\s*\/?>\s*)?<p>\s*tags:\s*<\/p>\s*(?:<ul>[\s\S]*?<\/ul>|<ol>[\s\S]*?<\/ol>|\s*)*/i,
        ""
      )
    ).trim();

    finalHtml = sanitizeHtml(cleanHtml);
  } else {
    finalHtml = sanitizeHtml(rawHtml.trim());
  }

  if (markdownRenderCache.size >= MAX_MARKDOWN_CACHE_SIZE) {
    const oldestKey = markdownRenderCache.keys().next().value;
    if (oldestKey) markdownRenderCache.delete(oldestKey);
  }
  markdownRenderCache.set(cacheKey, finalHtml);

  return finalHtml;
}

const FONT_SIZE_OPTIONS = Array.from({ length: 10 }, (_, i) => 13 + i);

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😜", "🤪",
  "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔",
  "😟", "😕", "🥺", "😢", "😭", "😤", "😠", "😡", "🤯", "😳",
  "🥵", "🥶", "😱", "😨", "🤔", "🤗", "🤫", "🤥", "😶", "😬",
  "🙄", "😯", "😮", "😴", "👍", "👎", "👏", "🙌", "👐", "🤲",
  "🤝", "🙏", "✍️", "💪", "👊", "✊", "🤛", "🤜", "👋", "🖐️",
  "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
  "👈", "👉", "👆", "👇", "☝️", "❤️", "🧡", "💛", "💚", "💙",
  "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗",
  "💖", "💘", "💝", "✨", "🌟", "⭐", "💫", "🔥", "💥", "⚡",
  "🌈", "☀️", "🌙", "☁️", "❄️", "🎉", "🎊", "🏆", "🎯", "💯",
  "✅", "❌", "⚠️", "📌", "📍", "🚩", "🔔", "💡", "📝", "📄",
  "📁", "📂", "📅", "📆", "📊", "📈", "📉", "🔍", "🔎", "🔒",
  "🔓", "🔑", "📦", "✉️", "📧", "💼", "📱", "💻", "⌨️", "🖥️",
  "📷", "🎥", "🎬", "🎨", "🚀", "🛸", "⏰", "⏱️", "☕", "🍺"
];

const IndentKeymap = Extension.create({
  name: "indentKeymap",
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const ghostState = wrongLanguageSuggestionPluginKey.getState(editor.state) as WrongLangPluginState | undefined;
        if (ghostState?.suggestion) {
          const { from, to, replacement } = ghostState.suggestion;
          editor.chain().focus().insertContentAt({ from, to }, replacement).setTextSelection(from + replacement.length).run();
          return true;
        }

        if (editor.can().sinkListItem("listItem") && editor.chain().focus().sinkListItem("listItem").run()) {
          return true;
        }
        if (editor.can().sinkListItem("taskItem") && editor.chain().focus().sinkListItem("taskItem").run()) {
          return true;
        }
        return editor.chain().focus().insertContent("\u2003\u2003").run();
      },
      "Shift-Tab": ({ editor }) => {
        if (editor.can().liftListItem("listItem") && editor.chain().focus().liftListItem("listItem").run()) {
          return true;
        }
        if (editor.can().liftListItem("taskItem") && editor.chain().focus().liftListItem("taskItem").run()) {
          return true;
        }
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        const lineText = $from.nodeBefore ? $from.nodeBefore.text || "" : "";
        if (lineText.endsWith("\u2003\u2003")) {
          return editor.chain().focus().deleteRange({ from: $from.pos - 2, to: $from.pos }).run();
        }
        if (lineText.endsWith("\u2003")) {
          return editor.chain().focus().deleteRange({ from: $from.pos - 1, to: $from.pos }).run();
        }
        if (lineText.endsWith("  ")) {
          return editor.chain().focus().deleteRange({ from: $from.pos - 2, to: $from.pos }).run();
        }
        return false;
      },
      "Mod-Shift-t": ({ editor }) => {
        handleToggleClick(editor);
        return true;
      },
      ArrowDown: () => {
        if (slashMenuStateRef.current.open && slashMenuStateRef.current.filteredItems.length > 0) {
          const len = slashMenuStateRef.current.filteredItems.length;
          const curr = slashMenuStateRef.current.selectedIndex;
          const next = curr === -1 ? 0 : (curr + 1) % len;
          slashMenuStateRef.current.selectedIndex = next;
          slashMenuStateRef.current.notify?.();
          const target = slashMenuScrollRef.current?.querySelector(`[data-slash-item="${next}"]`);
          target?.scrollIntoView({ block: "nearest" });
          return true;
        }
        return false;
      },
      ArrowUp: () => {
        if (slashMenuStateRef.current.open && slashMenuStateRef.current.filteredItems.length > 0) {
          const len = slashMenuStateRef.current.filteredItems.length;
          const curr = slashMenuStateRef.current.selectedIndex;
          const next = curr <= 0 ? len - 1 : curr - 1;
          slashMenuStateRef.current.selectedIndex = next;
          slashMenuStateRef.current.notify?.();
          const target = slashMenuScrollRef.current?.querySelector(`[data-slash-item="${next}"]`);
          target?.scrollIntoView({ block: "nearest" });
          return true;
        }
        return false;
      },
      Enter: ({ editor }) => {
        if (slashMenuStateRef.current.open && slashMenuStateRef.current.filteredItems.length > 0) {
          const curr = slashMenuStateRef.current.selectedIndex;
          const idx = curr >= 0 ? curr : 0;
          const item = slashMenuStateRef.current.filteredItems[idx];
          if (item && slashMenuStateRef.current.onSelect) {
            slashMenuStateRef.current.onSelect(item);
            return true;
          }
        }
        return false;
      },
      Escape: ({ editor }) => {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          slashMenuStateRef.current.notify?.();
          return true;
        }
        const ghostState = wrongLanguageSuggestionPluginKey.getState(editor.state) as WrongLangPluginState | undefined;
        if (ghostState?.suggestion) {
          const tr = editor.state.tr.setMeta(wrongLanguageSuggestionPluginKey, { dismiss: true });
          editor.view.dispatch(tr);
          return true;
        }
        return false;
      },
    };
  },
});

export interface EditorProps {
  note: Note | null;
  isVisible?: boolean;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onDeleteFile?: (note: Note) => void | Promise<void>;
  onCreate?: (folderPath?: string, opts?: CreateNoteOptions) => Note | void | Promise<Note | void>;
  onCreateFolder?: (folderPath?: string, folderName?: string) => void | Promise<void>;
  onOpenFolder?: (pending?: OpenFolderPending) => void | Promise<void>;
  onRenameFile?: (note: Note, nextName: string) => void | Promise<void>;
  onDuplicateFile?: (note: Note) => void | Promise<void>;
  openedFolderName?: string | null;
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
  editorFontSize?: number;
  isMobile?: boolean;
  notes?: Note[];
  rootDirHandle?: FileSystemDirectoryHandle | null;
  onCloseSplit?: () => void;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
  rightPanelOpen?: boolean;
  onCloseRightPanel?: () => void;
  onSelectNote?: (id: string) => void;
  onOpenWebTab?: (url: string, initialTitle?: string, customDisplayUrl?: string, filePath?: string) => void;
  onOpenSettings?: (category?: string) => void;
  onUnlockNote?: (noteId: string, pin: string) => Promise<boolean>;
  onRelockNote?: (noteId: string) => void;
  onGetActivePin?: (noteId: string) => string | undefined;
  paneId?: string;
}

interface SaveSnapshot {
  ext: "md" | "txt" | "html" | "css" | "js";
  content: string;
}


/**
 * Shared helper to navigate footnote citations ([1]), footnote return backrefs (↩),
 * and in-page anchor links (#section) with smooth scrolling and highlight pulse.
 */
export function navigateFootnoteOrAnchor(clickedEl: HTMLElement, container: HTMLElement | null = null): boolean {
  const linkEl = clickedEl.closest("a, [data-footnote-ref], [data-footnote-backref], [data-footnote-target], sup, .footnote-ref, .footnote-backref") as HTMLElement | null;
  if (!linkEl) return false;

  const fnRef =
    linkEl.getAttribute("data-footnote-ref") ||
    linkEl.querySelector("[data-footnote-ref]")?.getAttribute("data-footnote-ref") ||
    linkEl.closest("[data-footnote-ref]")?.getAttribute("data-footnote-ref");

  const fnBackref =
    linkEl.getAttribute("data-footnote-backref") ||
    linkEl.querySelector("[data-footnote-backref]")?.getAttribute("data-footnote-backref") ||
    linkEl.closest("[data-footnote-backref]")?.getAttribute("data-footnote-backref");

  const href = linkEl.getAttribute("href") || (linkEl.querySelector("a")?.getAttribute("href") || "");

  const isBackref = Boolean(fnBackref || href.includes("#fnref-") || linkEl.classList?.contains("footnote-backref"));
  const isCitation = Boolean(!isBackref && (fnRef || href.includes("#fn-") || linkEl.classList?.contains("footnote-ref") || linkEl.closest("sup")));

  if (!isCitation && !isBackref && !href.startsWith("#")) return false;

  const cleanId = (
    fnRef ||
    fnBackref ||
    (href.includes("#") ? href.split("#")[1].replace(/^(fn|fnref)-/, "") : "") ||
    (linkEl.textContent || "").replace(/[\[\]\^:\s]/g, "")
  ).trim();

  if (!cleanId && !href.startsWith("#")) return false;

  const rootEl = container || (typeof document !== "undefined" ? (document.querySelector(".editor-scroll-container") || document) : null);
  if (!rootEl) return false;

  let targetEl: HTMLElement | null = null;

  if (isCitation) {
    // User clicked citation [1] in text -> jump down to definition at bottom (or in-place)
    targetEl =
      (rootEl.querySelector(`[data-footnote-def="${cleanId}"]`) as HTMLElement) ||
      (rootEl.querySelector(`[data-footnote-backref="${cleanId}"]`) as HTMLElement) ||
      (rootEl.querySelector(`[data-footnote-target="${cleanId}"]`) as HTMLElement) ||
      (rootEl.querySelector(`[id="fn-${cleanId}"]`) as HTMLElement) ||
      (rootEl.querySelector(`[data-footnote-id="${cleanId}"]`) as HTMLElement) ||
      (typeof document !== "undefined" ? document.getElementById(`fn-${cleanId}`) : null);
  } else if (isBackref) {
    // User clicked return arrow ↩ (or [^1]:) -> jump back up to citation [1] in text
    targetEl =
      (rootEl.querySelector(`[data-footnote-ref="${cleanId}"]`) as HTMLElement) ||
      (rootEl.querySelector(`[id="fnref-${cleanId}"]`) as HTMLElement) ||
      (typeof document !== "undefined" ? document.getElementById(`fnref-${cleanId}`) : null);
  } else if (href.startsWith("#")) {
    const targetId = href.slice(1);
    targetEl =
      (rootEl.querySelector(`[id="${targetId}"]`) as HTMLElement) ||
      (typeof document !== "undefined" ? document.getElementById(targetId) : null);
  }

  if (targetEl) {
    const scrollBlock = targetEl.closest("li, p, h1, h2, h3, h4, h5, h6, sup") || targetEl;
    scrollBlock.scrollIntoView({ behavior: "smooth", block: "center" });
    const highlightTarget = targetEl.closest("li, p, sup") || targetEl;
    highlightTarget.classList.add("bg-primary/20", "transition-colors", "duration-500", "rounded");
    setTimeout(() => {
      highlightTarget.classList.remove("bg-primary/20");
    }, 1200);
    return true;
  }

  return false;
}

export default function Editor(props: EditorProps & { notes?: Note[] }) {
  const { note, isVisible = true, onUpdate, onDelete, onDeleteFile, onCreate, onCreateFolder, onOpenFolder, onRenameFile, onDuplicateFile, openedFolderName, onOpenSidebar, isSidebarOpen = false, editorFontSize = 15, isMobile = false, notes, rootDirHandle, onCloseSplit, settingsOpen: propSettingsOpen, onSettingsOpenChange, rightPanelOpen = false, onCloseRightPanel, onSelectNote, onOpenWebTab, onOpenSettings, onUnlockNote, onRelockNote, onGetActivePin, paneId = "main" } = props;

  const { settings, updateSetting, resetSettings } = useAppSettings();
  const { keyboardLanguage, toggleKeyboardLanguage } = useKeyboardLanguage();

  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileExt, setNewFileExt] = useState<"txt" | "md" | "html" | "css" | "js">("txt");
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingCreate, setPendingCreate] = useState<null | { kind: "file" | "folder"; fileName?: string; contentFormat?: "plain" | "markdown" | "html" | "css" | "javascript"; folderName?: string }>(null);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const isReadingModeRef = useRef(isReadingMode);
  isReadingModeRef.current = isReadingMode;
  const readingModeLivePreviewEnabled = Boolean(settings.readingModeLivePreview);
  const isReadingLivePreview = false;
  const isStrictReadingMode = Boolean(isReadingMode);
  const isStrictReadingModeRef = useRef(isStrictReadingMode);
  isStrictReadingModeRef.current = isStrictReadingMode;
  const resolveRelativeImagesInEditorRef = useRef<((instance: TiptapEditor | null) => Promise<void>) | null>(null);
  const [htmlCursor, setHtmlCursor] = useState({ line: 1, col: 1 });

  // Version History State
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [comparingVersion, setComparingVersion] = useState<NoteVersionSnapshot | null>(null);

  // When active note / tab changes, automatically close version comparison
  const lastActiveNoteIdRef = useRef<string | null>(note?.id ?? null);
  useEffect(() => {
    if (lastActiveNoteIdRef.current !== (note?.id ?? null)) {
      lastActiveNoteIdRef.current = note?.id ?? null;
      if (comparingVersion) {
        setComparingVersion(null);
      }
    }
  }, [note?.id, comparingVersion]);

  // Custom Font State & Handlers
  const { customFonts, refresh: refreshCustomFonts } = useCustomFonts();
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const [fontToRename, setFontToRename] = useState<CustomFont | null>(null);
  const [fontRenameValue, setFontRenameValue] = useState("");
  const [fontToDelete, setFontToDelete] = useState<CustomFont | null>(null);
  const [isUploadingFont, setIsUploadingFont] = useState(false);

  const handleFontFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingFont(true);
    try {
      const saved = await saveCustomFont(file);
      await refreshCustomFonts();
      toast({
        title: t("settings.fontUploadedSuccess"),
        description: (t("settings.fontUploadedSuccessDesc")).replace("{name}", saved.name),
      });
    } catch (err: any) {
      console.error("[CustomFont] Upload error:", err);
      toast({
        title: t("settings.fontUploadFailed"),
        description: err?.message || t("settings.fontUploadFailedDesc") || "Could not process font file",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFont(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleConfirmFontRename = async () => {
    if (!fontToRename) return;
    const newName = fontRenameValue.trim();
    if (!newName) return;

    try {
      await renameCustomFont(fontToRename.id, newName);
      await refreshCustomFonts();
      toast({
        title: t("settings.fontRenameSuccess"),
        description: (t("settings.fontRenameSuccessDesc")).replace("{name}", newName),
      });
      setFontToRename(null);
    } catch (err: any) {
      toast({
        title: t("settings.fontRenameFailed"),
        description: err?.message || "Could not rename font",
        variant: "destructive",
      });
    }
  };

  const handleConfirmFontDelete = async () => {
    if (!fontToDelete) return;
    const deletedName = fontToDelete.name;
    try {
      await deleteCustomFont(fontToDelete.id);
      if (settings.fontFamily === fontToDelete.id) {
        updateSetting("fontFamily", "inter");
      }
      if (settings.editorFontFamily === fontToDelete.id) {
        updateSetting("editorFontFamily", "inter");
      }
      await refreshCustomFonts();
      toast({
        title: t("settings.fontDeletedSuccess"),
        description: (t("settings.fontDeletedSuccessDesc")).replace("{name}", deletedName),
      });
      setFontToDelete(null);
    } catch (err: any) {
      toast({
        title: t("settings.fontDeleteFailed"),
        description: err?.message || "Could not delete font",
        variant: "destructive",
      });
    }
  };

  // QR Code Generator Dialog State
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);

  // Floating Slash Emoji Picker State
  const [slashEmojiState, setSlashEmojiState] = useState<{
    open: boolean;
    coords: { top: number; left: number } | null;
  }>({
    open: false,
    coords: null,
  });
  const slashEmojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slashEmojiState.open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (slashEmojiRef.current && !slashEmojiRef.current.contains(e.target as Node)) {
        setSlashEmojiState({ open: false, coords: null });
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSlashEmojiState({ open: false, coords: null });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [slashEmojiState.open]);

  // Share via Google Drive State
  const [shareSyncDialogOpen, setShareSyncDialogOpen] = useState(false);
  const [shareSuccessDialogOpen, setShareSuccessDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const handleShareClick = async () => {
    if (!note) return;

    // 1. If note already has a driveFileId and Google Drive is connected -> get share link directly!
    if (note.driveFileId && isGoogleDriveConnected()) {
      setIsSharingLoading(true);
      try {
        const accessToken = await getValidAccessToken();
        if (accessToken) {
          const link = await getDriveFileShareLink(accessToken, note.driveFileId);
          setShareLink(link);
          try {
            await navigator.clipboard.writeText(link);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 3000);
          } catch { /* ignore */ }
          setShareSuccessDialogOpen(true);
          toast({
            title: t("shareDialog.shareViaDrive"),
            description: t("shareDialog.copied"),
          });
          return;
        }
      } catch (err) {
        console.warn("Failed getting Drive share link:", err);
      } finally {
        setIsSharingLoading(false);
      }
    }

    // 2. Otherwise (local note, not synced or storageMode !== 'gdrive') -> Ask user to sync workspace to Google Drive
    setShareSyncDialogOpen(true);
  };

  const handleConfirmSyncAndShare = async () => {
    if (!note) return;
    setIsSharingLoading(true);

    try {
      // 1. Connect to Google Drive if not connected
      if (!isGoogleDriveConnected()) {
        await requestGoogleDriveAuth();
      }

      if (!isGoogleDriveConnected()) {
        setIsSharingLoading(false);
        return;
      }

      // 2. Switch storageMode to 'gdrive'
      updateSetting("storageMode", "gdrive");

      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        setIsSharingLoading(false);
        return;
      }

      // 3. Sync note / workspace to Google Drive to ensure it has driveFileId
      let targetFileId = note.driveFileId;
      if (!targetFileId) {
        await new Promise<void>((resolve) => {
          syncEngine.queueNoteSync(
            note,
            (syncedNote) => {
              targetFileId = syncedNote.driveFileId;
              onUpdate(syncedNote.id, {
                driveFileId: syncedNote.driveFileId,
                driveSyncedAt: syncedNote.driveSyncedAt,
              });
              resolve();
            },
            0
          );
        });

        // Also trigger full workspace sync in background
        void syncEngine.syncAllNotes(notes || [note]);
      }

      // If we now have a driveFileId:
      if (targetFileId) {
        const link = await getDriveFileShareLink(accessToken, targetFileId);
        setShareLink(link);
        try {
          await navigator.clipboard.writeText(link);
          setCopiedShareLink(true);
          setTimeout(() => setCopiedShareLink(false), 3000);
        } catch { /* ignore */ }
        setShareSyncDialogOpen(false);
        setShareSuccessDialogOpen(true);
        toast({
          title: t("shareDialog.shareViaDrive"),
          description: t("shareDialog.copied"),
        });
      } else {
        // Fallback: full sync and get structure
        await syncEngine.syncAllNotes(notes || [note]);
        const updated = (notes || []).find((n) => n.id === note.id);
        const finalId = updated?.driveFileId || note.driveFileId;
        if (finalId) {
          const link = await getDriveFileShareLink(accessToken, finalId);
          setShareLink(link);
          try {
            await navigator.clipboard.writeText(link);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 3000);
          } catch { /* ignore */ }
          setShareSyncDialogOpen(false);
          setShareSuccessDialogOpen(true);
        }
      }
    } catch (err) {
      console.warn("Sync and share error:", err);
      toast({
        title: t("shareDialog.title"),
        description: t("shareDialog.error"),
        variant: "destructive",
      });
    } finally {
      setIsSharingLoading(false);
    }
  };

  const [isRevokingShare, setIsRevokingShare] = useState(false);

  const handleRevokeShare = async () => {
    if (!note) return;
    const targetFileId = note.driveFileId;
    if (!targetFileId) return;

    setIsRevokingShare(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) return;

      const success = await revokeDriveFileShare(accessToken, targetFileId);
      if (success) {
        setShareLink("");
        setShareSuccessDialogOpen(false);
        toast({
          title: t("shareDialog.revokeSuccessTitle"),
          description: t("shareDialog.revokeSuccessDesc"),
        });
      } else {
        toast({
          title: t("shareDialog.title"),
          description: t("shareDialog.revokeError"),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.warn("Revoke share error:", err);
      toast({
        title: t("shareDialog.title"),
        description: t("shareDialog.revokeError"),
        variant: "destructive",
      });
    } finally {
      setIsRevokingShare(false);
    }
  };

  // Complete pending creation when a folder gets opened
  useEffect(() => {
    if (!pendingCreate) return;
    if (!openedFolderName) return;

    if (pendingCreate.kind === "file") {
      const defaultExt = settings.defaultExtension || "md";
      const defaultFormat = defaultExt === "html" ? "html" as const : defaultExt === "txt" ? "plain" as const : "markdown" as const;
      const fileName = pendingCreate.fileName ?? `Untitled.${defaultExt}`;
      const contentFormat = pendingCreate.contentFormat ?? defaultFormat;
      if (onCreate) onCreate(undefined, { fileName, contentFormat });
    } else if (pendingCreate.kind === "folder") {
      if (onCreateFolder) onCreateFolder(undefined, pendingCreate.folderName ?? "Untitled");
    }

    setPendingCreate(null);
  }, [openedFolderName, pendingCreate, onCreate, onCreateFolder]);

  const handleOpenCreateFileDialog = () => {
    setNewFileName("");
    setNewFileExt("txt");
    setCreateFileDialogOpen(true);
  };

  const handleOpenCreateFolderDialog = () => {
    setNewFolderName("");
    setCreateFolderDialogOpen(true);
  };

  const handleCreateFileFromDialog = () => {
    let base = (newFileName || "").trim();
    let ext = newFileExt || "txt";
    const dotIdx = base.lastIndexOf(".");
    if (dotIdx > 0) {
      const typedExt = base.slice(dotIdx + 1).toLowerCase();
      if (["js", "mjs", "cjs", "css", "html", "htm", "md", "markdown", "txt"].includes(typedExt)) {
        ext = (typedExt === "markdown" ? "md" : typedExt === "htm" ? "html" : typedExt) as "txt" | "md" | "html" | "css" | "js";
        base = base.slice(0, dotIdx);
      }
    }
    const contentFormat = ext === "md" ? "markdown" : ext === "html" ? "html" : ext === "css" ? "css" : ext === "js" ? "javascript" : "plain";
    const dateStr = formatDateForFileName(new Date(), settings.dateFormat);
    let defaultBaseName = "Untitled";
    if (settings.newFilePattern === "date") {
      defaultBaseName = `Note_${dateStr}`;
    } else if (settings.newFilePattern === "daily") {
      defaultBaseName = `Daily-${dateStr}`;
    }
    const fileName = base ? `${base}.${ext}` : `${defaultBaseName}.${ext}`;

    if (!openedFolderName && onOpenFolder) {
      setPendingCreate({ kind: "file", fileName, contentFormat });
      setCreateFileDialogOpen(false);
      setNewFileName("");
      setNewFileExt("txt");
      onOpenFolder({ kind: "file", fileName, contentFormat });
      return;
    }

    if (onCreate) {
      onCreate(undefined, { fileName, contentFormat });
    }
    setCreateFileDialogOpen(false);
    setNewFileName("");
    setNewFileExt("txt");
  };

  const handleCreateFolderFromDialog = () => {
    const safeFolderName = (newFolderName || "").trim().replace(/[\\/:*?"<>|]/g, "_");
    const folderName = safeFolderName || "Untitled";

    if (!openedFolderName && onOpenFolder) {
      setPendingCreate({ kind: "folder", folderName });
      setCreateFolderDialogOpen(false);
      setNewFolderName("");
      onOpenFolder({ kind: "folder", folderName });
      return;
    }

    if (onCreateFolder) {
      onCreateFolder(undefined, folderName);
    }
    setCreateFolderDialogOpen(false);
    setNewFolderName("");
  };
    const [importDocxDialogOpen, setImportDocxDialogOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");
    const docxInputRef = useRef<HTMLInputElement>(null);
    // Handle docx import
    const handleImportDocx = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const html = await docxToHtml(file);
        let updated = false;
        // กรณี note ปัจจุบัน
        if (note) {
          onUpdate(note.id, { content: html, contentFormat: "html", fileType: undefined });
          updated = true;
        }
        // กรณีสร้าง note ใหม่
        else if (onCreate) {
          const result = onCreate();
          const newNote = result instanceof Promise ? await result : result;
          if (newNote && "id" in newNote) {
            onUpdate(newNote.id, { content: html, contentFormat: "html", fileType: undefined });
            updated = true;
          }
        }
        // กรณี openfolder หรือ note ถูกสร้างจากไฟล์ในระบบ: ค้นหา note ที่ fileName ตรงกับไฟล์ docx แล้ว update ซ้ำ
        if (!updated && file.name) {
          // ลองค้นหา notes จาก props (ถ้ามี)
          if (typeof window !== 'undefined') {
            const win = window as unknown as Record<string, unknown>;
            let notesArr: Note[] = [];
            if (Array.isArray(win.notesPlusNotes)) {
              notesArr = win.notesPlusNotes as Note[];
            } else if (Array.isArray(win.notes)) {
              notesArr = win.notes as Note[];
            } else if (typeof win.getNotes === 'function') {
              notesArr = (win.getNotes as () => Note[])();
            }
            const found = notesArr.find((n: Note) => n.fileName === file.name);
            if (found) {
              onUpdate(found.id, { content: html, contentFormat: "html", fileType: undefined });
              updated = true;
            }
          }
        }
        // fallback: ถ้า notes ถูกส่งมาทาง props
        if (!updated && Array.isArray(notes)) {
          const found = notes.find((n: Note) => n.fileName === file.name);
          if (found) {
            onUpdate(found.id, { content: html, contentFormat: "html", fileType: undefined });
          }
        }
      } catch (e) {
        setAlertMessage(t("uiMisc.docxImportFailed", { message: (e as Error).message }));
      }
      setImportDocxDialogOpen(false);
      event.target.value = "";
    };
  const autoSaveDiskTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSavingStartTimeRef = useRef(0);
  const debounceRenameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRenameRef = useRef<{ note: Note; firstH1Text: string; newFileName: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mobileToolbarAreaRef = useRef<HTMLDivElement>(null);
  const syncingFromNote = useRef(false);
  const loadingNoteIdRef = useRef<string | null>(null);
  const isNoteCurrentlyLocked = Boolean((note?.isLocked && !note?.isDecrypted) || (note?.content && isEncryptedNote(note.content)));
  const editorActiveNoteIdRef = useRef<string | null>(isNoteCurrentlyLocked ? null : (note?.id ?? null));
  const activeNoteRef = useRef<Note | null>(isNoteCurrentlyLocked ? null : (note ?? null));
  const fileHandleByNoteIdRef = useRef<Record<string, FileSystemFileHandle>>({});
  const internalH1RenameRef = useRef<string | null>(null);
  const deletedNoteIdsRef = useRef<Set<string>>(new Set());
  const editorSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lineEnding, setLineEnding] = useState<"LF" | "CRLF">("LF");
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [footnotePopoverState, setFootnotePopoverState] = useState<{
    open: boolean;
    coords: { top: number; left: number } | null;
  }>({
    open: false,
    coords: null,
  });
  const [footnoteInputText, setFootnoteInputText] = useState("");
  const footnoteInputRef = useRef<HTMLInputElement | null>(null);
  const footnotePopoverRef = useRef<HTMLDivElement | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkTab, setLinkTab] = useState<"workspace" | "external">("workspace");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDisplayText, setLinkDisplayText] = useState("");
  const [selectedWorkspaceNote, setSelectedWorkspaceNote] = useState<Note | null>(null);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [workspaceImageDialogOpen, setWorkspaceImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [workspaceVideoDialogOpen, setWorkspaceVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const filteredWorkspaceNotes = useMemo(() => {
    if (!notes || notes.length === 0) return [];
    const query = workspaceSearchQuery.trim().toLowerCase();
    return notes.filter((n) => {
      if (n.fileType === "image" || n.fileType === "binary") return false;
      if (!query) return true;
      const title = (n.fileName || n.title || "").toLowerCase();
      const folder = (n.folderPath || "").toLowerCase();
      return title.includes(query) || folder.includes(query);
    });
  }, [notes, workspaceSearchQuery]);
  const [savedSnapshotByNoteId, setSavedSnapshotByNoteId] = useState<Record<string, SaveSnapshot>>({});
  const [pendingSaveAction, setPendingSaveAction] = useState<"save" | "saveas" | null>(null);
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const settingsOpen = propSettingsOpen !== undefined ? propSettingsOpen : internalSettingsOpen;
  const setSettingsOpen = (open: boolean) => {
    if (onSettingsOpenChange) {
      onSettingsOpenChange(open);
    } else {
      setInternalSettingsOpen(open);
    }
  };
  const [mobileToolbarWidth, setMobileToolbarWidth] = useState(0);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [canZoomImage, setCanZoomImage] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [activeFileSize, setActiveFileSize] = useState<number | null>(null);
  const [imageZoomMode, setImageZoomMode] = useState<"fit" | "custom">("fit");
  const [imageCustomZoom, setImageCustomZoom] = useState<number>(100);
  const [pdfLoadedNoteId, setPdfLoadedNoteId] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFullPath, setPdfFullPath] = useState<string | undefined>(undefined);
  const [pdfWorkspaceFolder, setPdfWorkspaceFolder] = useState<string | null>(null);
  const [isPdfLoadingSource, setIsPdfLoadingSource] = useState(false);
  const [isPdfViewLoaded, setIsPdfViewLoaded] = useState(false);
  const [pdfSourceError, setPdfSourceError] = useState<string | null>(null);
  const [pdfViewerState, setPdfViewerState] = useState<InkoViewerLiveState | null>(null);
  const [pdfActiveTool, setPdfActiveTool] = useState<InkoTool | null>("select");
  const [lastPdfShape, setLastPdfShape] = useState<"rectangle" | "circle" | "line" | "arrow">("rectangle");
  const [pdfActiveBrushColor, setPdfActiveBrushColor] = useState<string>("#000000");
  const [pdfActiveBrushWidth, setPdfActiveBrushWidth] = useState<number>(3);
  const [pdfActiveFontSize, setPdfActiveFontSize] = useState<number>(16);
  const [pdfActiveHighlightColor, setPdfActiveHighlightColor] = useState<string>("#facc15");
  const [pdfActiveHighlightWidth, setPdfActiveHighlightWidth] = useState<number>(16);
  const [pdfActiveEraserWidth, setPdfActiveEraserWidth] = useState<number>(20);
  const [pdfActiveShapeFillColor, setPdfActiveShapeFillColor] = useState<string | null>(null);
  const [pdfActiveShapeFillOpacity, setPdfActiveShapeFillOpacity] = useState<number>(100);
  const [pdfActiveShapeNoStroke, setPdfActiveShapeNoStroke] = useState<boolean>(false);
  const [pdfPageJumpOpen, setPdfPageJumpOpen] = useState(false);
  const [pdfPageJumpValue, setPdfPageJumpValue] = useState("");
  const [pdfBookmarks, setPdfBookmarks] = useState<PdfPageBookmark[]>([]);
  const [pdfBookmarkOpen, setPdfBookmarkOpen] = useState(false);
  const [pdfBookmarkTitleInput, setPdfBookmarkTitleInput] = useState("");
  const pdfEditorRef = useRef<PdfEditorViewHandle | null>(null);
  const pdfViewerStateRef = useRef<InkoViewerLiveState | null>(null);
  pdfViewerStateRef.current = pdfViewerState;
  const pdfActiveToolRef = useRef<InkoTool | null>(null);
  pdfActiveToolRef.current = pdfActiveTool;

  const handleSelectPdfTool = useCallback((tool: InkoTool) => {
    setPdfActiveTool(tool);
    setPdfViewerState((prev) => (prev ? {
      ...prev,
      currentTool: tool,
      hasSelection: tool === "select" ? prev.hasSelection : false,
      selectedMeta: tool === "select" ? prev.selectedMeta : null,
    } : null));
    pdfEditorRef.current?.setTool(tool);
  }, []);
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false);
  const [htmlDeviceMode, setHtmlDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const codeEditorRef = useRef<HtmlCodeEditorHandle>(null);
  const codeSearchInputRef = useRef<HTMLInputElement>(null);
  const [isCodeSearchOpen, setIsCodeSearchOpen] = useState(false);
  const [codeSearchQuery, setCodeSearchQuery] = useState("");
  const [codeSearchStats, setCodeSearchStats] = useState({ total: 0, current: -1 });

  const handleOpenCodeSearch = useCallback((selectedText?: string) => {
    setIsCodeSearchOpen(true);
    const queryToUse = selectedText || codeSearchQuery;
    if (queryToUse) {
      setCodeSearchQuery(queryToUse);
      const res = codeEditorRef.current?.setSearchQuery(queryToUse);
      if (res) setCodeSearchStats(res);
    }
    setTimeout(() => {
      codeSearchInputRef.current?.focus();
      if (queryToUse) {
        codeSearchInputRef.current?.select();
      }
    }, 60);
  }, [codeSearchQuery]);

  const handleCodeSearchOpenChange = useCallback((open: boolean) => {
    setIsCodeSearchOpen(open);
    if (!open) {
      codeEditorRef.current?.clearSearch();
    } else {
      const selected = codeEditorRef.current?.getSelectionText();
      const queryToUse = selected || codeSearchQuery;
      if (queryToUse) {
        setCodeSearchQuery(queryToUse);
        const res = codeEditorRef.current?.setSearchQuery(queryToUse);
        if (res) setCodeSearchStats(res);
      }
      setTimeout(() => {
        codeSearchInputRef.current?.focus();
        if (queryToUse) {
          codeSearchInputRef.current?.select();
        }
      }, 60);
    }
  }, [codeSearchQuery]);

  const handleCodeSearchQueryChange = useCallback((query: string) => {
    setCodeSearchQuery(query);
    const res = codeEditorRef.current?.setSearchQuery(query);
    if (res) setCodeSearchStats(res);
  }, []);

  const handleCodeSearchNext = useCallback(() => {
    const res = codeEditorRef.current?.findNext(codeSearchQuery);
    if (res) setCodeSearchStats(res);
  }, [codeSearchQuery]);

  const handleCodeSearchPrev = useCallback(() => {
    const res = codeEditorRef.current?.findPrev(codeSearchQuery);
    if (res) setCodeSearchStats(res);
  }, [codeSearchQuery]);

  useEffect(() => {
    setIsCodeSearchOpen(false);
    setCodeSearchQuery("");
    setCodeSearchStats({ total: 0, current: -1 });
  }, [note?.id]);

  const pdfSearchInputRef = useRef<HTMLInputElement>(null);
  const [isPdfSearchOpen, setIsPdfSearchOpen] = useState(false);
  const [pdfSearchQuery, setPdfSearchQuery] = useState("");
  const [pdfSearchStats, setPdfSearchStats] = useState({ total: 0, current: -1 });

  const handleOpenPdfSearch = useCallback((selectedText?: string) => {
    setIsPdfSearchOpen(true);
    const queryToUse = (selectedText || pdfSearchQuery).trim();
    if (queryToUse) {
      setPdfSearchQuery(queryToUse);
      pdfEditorRef.current?.setSearchQuery(queryToUse);
    }
    setTimeout(() => {
      pdfSearchInputRef.current?.focus();
      if (queryToUse) {
        pdfSearchInputRef.current?.select();
      }
    }, 60);
  }, [pdfSearchQuery]);

  const handlePdfSearchOpenChange = useCallback((open: boolean) => {
    setIsPdfSearchOpen(open);
    if (open) {
      const queryToUse = pdfSearchQuery.trim();
      if (queryToUse) {
        pdfEditorRef.current?.setSearchQuery(queryToUse);
      }
      setTimeout(() => {
        pdfSearchInputRef.current?.focus();
        if (pdfSearchQuery) {
          pdfSearchInputRef.current?.select();
        }
      }, 60);
    }
  }, [pdfSearchQuery]);

  const handlePdfSearchQueryChange = useCallback((query: string) => {
    setPdfSearchQuery(query);
    if (!query.trim()) {
      setPdfSearchStats({ total: 0, current: -1 });
      pdfEditorRef.current?.closeSearch();
    } else {
      pdfEditorRef.current?.setSearchQuery(query);
    }
  }, []);

  const handlePdfSearchNext = useCallback(() => {
    pdfEditorRef.current?.searchNext();
  }, []);

  const handlePdfSearchPrev = useCallback(() => {
    pdfEditorRef.current?.searchPrev();
  }, []);

  useEffect(() => {
    setIsPdfSearchOpen(false);
    setPdfSearchQuery("");
    setPdfSearchStats({ total: 0, current: -1 });
  }, [note?.id]);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  // Floating utility widgets (Calculator, Clock, Translator, Audio Recorder) are hosted globally in Index.tsx via FloatingWidgetsHost

  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const getEffectiveImageZoom = useCallback(() => {
    if (imageZoomMode === "custom") return imageCustomZoom;
    if (imageElementRef.current && imageDimensions && imageDimensions.width > 0) {
      const renderedWidth = imageElementRef.current.clientWidth;
      if (renderedWidth > 0) {
        const calculated = Math.round((renderedWidth / imageDimensions.width) * 100);
        if (calculated > 0) return calculated;
      }
    }
    return 100;
  }, [imageZoomMode, imageCustomZoom, imageDimensions]);

  const handleZoomInImage = useCallback(() => {
    const current = getEffectiveImageZoom();
    setImageZoomMode("custom");
    const steps = [10, 15, 20, 25, 33, 50, 67, 75, 90, 100, 125, 150, 175, 200, 250, 300, 400, 500];
    const next = steps.find((s) => s > current);
    setImageCustomZoom(next ?? Math.min(500, current + 25));
  }, [getEffectiveImageZoom]);

  const handleZoomOutImage = useCallback(() => {
    const current = getEffectiveImageZoom();
    setImageZoomMode("custom");
    const steps = [10, 15, 20, 25, 33, 50, 67, 75, 90, 100, 125, 150, 175, 200, 250, 300, 400, 500];
    const next = [...steps].reverse().find((s) => s < current);
    setImageCustomZoom(next ?? Math.max(10, current - 25));
  }, [getEffectiveImageZoom]);

  const handleToggleZoomFit = useCallback(() => {
    if (imageZoomMode === "fit") {
      setImageZoomMode("custom");
      setImageCustomZoom(100);
    } else {
      setImageZoomMode("fit");
    }
  }, [imageZoomMode]);

  const toggleCalculator = useCallback(() => {
    window.dispatchEvent(new CustomEvent("app:toggle-calculator"));
  }, []);

  const toggleClock = useCallback(() => {
    window.dispatchEvent(new CustomEvent("app:toggle-clock"));
  }, []);

  const spellCheckEnabled = settings.spellCheck !== false;
  const settingsRef = useRef(settings);
  const keyboardLanguageRef = useRef(keyboardLanguage);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    keyboardLanguageRef.current = keyboardLanguage;
  }, [keyboardLanguage]);

  useEffect(() => {
    if (note) {
      const rawName = note.fileName || note.title || "";
      const baseName = extractBaseTitleFromFileName(rawName) || rawName || "Untitled";
      document.title = baseName;
    } else {
      document.title = "Luno Note";
    }
  }, [note?.fileName, note?.title, note?.id]);
  const { t, language: lang } = useTranslation();

  const MOBILE_FULL_TOOLBAR_MIN_WIDTH = 340;
  const assetBlobUrlMap = useRef<Map<string, string>>(new Map());

  // Revoke all blob URLs created in this editor session when unmounting
  useEffect(() => {
    const map = assetBlobUrlMap.current;
    return () => {
      for (const [key, val] of map.entries()) {
        if (typeof val === "string" && val.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(val);
          } catch { /* ignore */ }
        }
        if (typeof key === "string" && key.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(key);
          } catch { /* ignore */ }
        }
      }
      map.clear();
    };
  }, []);

  const turndown = useMemo(() => {
    return createTurndownService(assetBlobUrlMap.current);
  }, []);

  const isLikelyHtml = (text: string) => /<\/?[a-z][\s\S]*>/i.test(text);
  
  const getContentFormat = (): "plain" | "markdown" | "html" => {
    if (note?.contentFormat && note.contentFormat !== "css" && note.contentFormat !== "javascript" && note.contentFormat !== "js") return note.contentFormat;
    return "markdown";
  };

  const isTxtFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    if (targetNote.fileName?.toLowerCase().endsWith(".txt")) return true;
    if (targetNote.contentFormat === "plain") return true;
    return false;
  }, []);

  const isHtmlFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    if (targetNote.contentFormat === "html") return true;
    const fileName = targetNote.fileName?.toLowerCase() ?? "";
    if (fileName.endsWith(".html") || fileName.endsWith(".htm")) return true;
    return false;
  }, []);

  const isCssFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    if (targetNote.contentFormat === "css") return true;
    const fileName = targetNote.fileName?.toLowerCase() ?? "";
    if (fileName.endsWith(".css")) return true;
    return false;
  }, []);

  const isJsFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    if (targetNote.contentFormat === "javascript" || targetNote.contentFormat === "js") return true;
    const fileName = targetNote.fileName?.toLowerCase() ?? "";
    if (fileName.endsWith(".js") || fileName.endsWith(".mjs") || fileName.endsWith(".cjs")) return true;
    return false;
  }, []);

  const isImageFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    if (targetNote.fileType === "image") return true;
    const name = targetNote.fileName?.toLowerCase() ?? "";
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif|tiff?)$/i.test(name);
  }, []);

  const isPdfFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    const name = (targetNote.fileName || targetNote.title || "").toLowerCase();
    return /\.pdf$/i.test(name);
  }, []);

  const isBinaryFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    const name = (targetNote.fileName || targetNote.title || "").toLowerCase();
    if (/\.pdf$/i.test(name)) return false;
    if (targetNote.fileType === "binary") return true;
    return /\.(zip|rar|7z|tar|gz|bz2|docx?|xlsx?|pptx?|mp3|wav|ogg|m4a|flac|aac|mp4|webm|mov|avi|mkv|exe|bin|iso|dmg|apk)$/i.test(name);
  }, []);

  const isAudioFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    return isAudioMedia(targetNote.fileName || targetNote.title || "", targetNote);
  }, []);

  const isVideoFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    return isVideoMedia(targetNote.fileName || targetNote.title || "", targetNote);
  }, []);

  const isCodeFile = useCallback((targetNote: Note | null) => {
    if (!targetNote) return false;
    if (targetNote.contentFormat === "css" || isCssFile(targetNote)) return true;
    if (targetNote.contentFormat === "javascript" || targetNote.contentFormat === "js" || isJsFile(targetNote)) return true;
    if (targetNote.contentFormat === "html" || isHtmlFile(targetNote)) return false;
    const name = targetNote.fileName?.toLowerCase() ?? "";
    return /\.(js|jsx|ts|tsx|json|py|rb|go|rs|java|c|cpp|h|hpp|cs|php|swift|kt|scss|less|yaml|yml|toml|xml|sql|sh|bash|zsh|vue|svelte)$/i.test(name);
  }, [isCssFile, isHtmlFile, isJsFile]);

  const formatVideoDuration = useCallback((seconds: number | null | undefined): string => {
    if (seconds == null || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "--:--";
    const totalSecs = Math.round(seconds);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getFileFormatLabel = useCallback((targetNote: Note | null): string => {
    if (!targetNote) return "";
    const name = targetNote.fileName?.toLowerCase() ?? "";
    const isTh = settings.language === "th";

    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "JPEG Image";
    if (name.endsWith(".png")) return "PNG Image";
    if (name.endsWith(".webp")) return "WebP Image";
    if (name.endsWith(".svg")) return "SVG Vector";
    if (name.endsWith(".gif")) return "GIF Animation";
    if (name.endsWith(".bmp")) return "BMP Image";
    if (name.endsWith(".ico")) return "ICO Icon";
    if (name.endsWith(".avif")) return "AVIF Image";
    if (targetNote.fileType === "image") return t("editor.image");

    if (name.endsWith(".zip")) return "ZIP Archive";
    if (name.endsWith(".rar")) return "RAR Archive";
    if (name.endsWith(".7z")) return "7-Zip Archive";
    if (name.endsWith(".tar") || name.endsWith(".gz") || name.endsWith(".bz2")) return "Archive";
    if (name.endsWith(".pdf")) return "PDF Document";
    if (name.endsWith(".doc") || name.endsWith(".docx")) return "Word Document";
    if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "Excel Spreadsheet";
    if (name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".ogg") || name.endsWith(".m4a") || name.endsWith(".flac") || name.endsWith(".weba")) return t("editor.audioFile");
    if (name.endsWith(".webm")) {
      return isAudioMedia(name, targetNote)
        ? (t("editor.webmAudio"))
        : (t("editor.webmVideo"));
    }
    if (name.endsWith(".mp4") || name.endsWith(".m4v")) return "MP4 Video";
    if (name.endsWith(".mov")) return "QuickTime Video";
    if (name.endsWith(".mkv")) return "Matroska Video";
    if (name.endsWith(".avi")) return "AVI Video";
    if (name.endsWith(".wmv") || name.endsWith(".flv") || name.endsWith(".ogv") || name.endsWith(".3gp") || name.endsWith(".mpg") || name.endsWith(".mpeg")) return "Video File";
    if ((targetNote.fileType as string) === "video") return t("editor.video");
    if ((targetNote.fileType as string) === "binary") return t("editor.binaryFile");

    if (targetNote.contentFormat === "html" || name.endsWith(".html") || name.endsWith(".htm")) return "HTML";
    if (targetNote.contentFormat === "css" || name.endsWith(".css")) return "CSS";
    if (name.endsWith(".js") || name.endsWith(".mjs") || name.endsWith(".cjs")) return "JavaScript";
    if (name.endsWith(".jsx")) return "React JSX";
    if (name.endsWith(".ts")) return "TypeScript";
    if (name.endsWith(".tsx")) return "React TSX";
    if (name.endsWith(".json")) return "JSON";
    if (name.endsWith(".py")) return "Python";
    if (name.endsWith(".rs")) return "Rust";
    if (name.endsWith(".go")) return "Go";
    if (name.endsWith(".java")) return "Java";
    if (name.endsWith(".c") || name.endsWith(".h")) return "C";
    if (name.endsWith(".cpp") || name.endsWith(".hpp")) return "C++";
    if (name.endsWith(".cs")) return "C#";
    if (name.endsWith(".php")) return "PHP";
    if (name.endsWith(".swift")) return "Swift";
    if (name.endsWith(".kt")) return "Kotlin";
    if (name.endsWith(".sql")) return "SQL";
    if (name.endsWith(".yaml") || name.endsWith(".yml")) return "YAML";
    if (name.endsWith(".xml")) return "XML";
    if (name.endsWith(".sh") || name.endsWith(".bash") || name.endsWith(".zsh")) return "Shell";

    if (name.endsWith(".txt") || targetNote.contentFormat === "plain") return t("editor.formatText");
    return t("editor.formatMarkdown");
  }, [settings.language, t]);

  const handleCopyImage = useCallback(async () => {
    if (!note) return;
    try {
      const src = imageBlobUrl || (note.content?.startsWith("data:") ? note.content : undefined);
      if (!src) return;
      const res = await fetch(src);
      const blob = await res.blob();
      let pngBlob = blob;
      if (blob.type !== "image/png") {
        const img = new window.Image();
        const url = URL.createObjectURL(blob);
        try {
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || blob), "image/png"));
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob })
      ]);
      toast({
        title: t("editor.copyImage"),
        description: t("editor.imageCopied"),
      });
    } catch (err) {
      console.warn("Copy image failed:", err);
      toast({
        title: t("editor.copyImage"),
        description: t("editor.copyImageFailed"),
        variant: "destructive",
      });
    }
  }, [note, imageBlobUrl, t, toast]);

  const handleOpenInSystemApp = useCallback(async () => {
    if (!note) return;
    const electronAPI = window.electronAPI;
    if (electronAPI?.getSavedWorkspace && (electronAPI?.openPath || electronAPI?.openExternal)) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath && note.fileName) {
          const relPath = note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName;
          const fullPath = `${saved.folderPath}/${relPath}`;
          if (electronAPI.openPath) {
            await electronAPI.openPath(fullPath);
            return;
          }
          if (electronAPI.openExternal) {
            await electronAPI.openExternal(`file://${fullPath}`);
            return;
          }
        }
      } catch (err) {
        console.warn("Open in system app failed:", err);
      }
    }
    const src = videoBlobUrl || imageBlobUrl || pdfBlobUrl || (note.content?.startsWith("data:") ? note.content : undefined);
    if (src) {
      window.open(src, "_blank");
    }
  }, [note, imageBlobUrl, videoBlobUrl, pdfBlobUrl]);

  const handleRevealInFileExplorer = useCallback(async () => {
    if (!note) return;
    const electronAPI = window.electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.showItemInFolder) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath && note.fileName) {
          const relPath = note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName;
          const fullPath = `${saved.folderPath}/${relPath}`;
          await electronAPI.showItemInFolder(fullPath);
        }
      } catch (err) {
        console.warn("Reveal in explorer failed:", err);
      }
    }
  }, [note]);

  const getBaseTitle = useCallback((targetNote: Note | null): string => {
    if (!targetNote || isTxtFile(targetNote)) return "";
    
    // Priority 1: Check note.fileName first (if linked file or has fileName)
    if (targetNote.fileName) {
      const name = targetNote.fileName.trim();
      const lastDot = name.lastIndexOf(".");
      const baseFromFileName = lastDot > 0 ? name.slice(0, lastDot) : name;
      if (baseFromFileName && !isSystemGeneratedUntitledName(baseFromFileName)) {
        return baseFromFileName;
      }
    }

    // Priority 2: Check note.title
    if (targetNote.title && targetNote.title.trim() && !isSystemGeneratedUntitledName(targetNote.title)) {
      return targetNote.title.trim();
    }

    // Priority 3: Fallback to fileName base (even if default name)
    if (targetNote.fileName) {
      const name = targetNote.fileName.trim();
      const lastDot = name.lastIndexOf(".");
      return lastDot > 0 ? name.slice(0, lastDot) : name;
    }

    return targetNote.title || "";
  }, [isTxtFile]);

  const flushPendingRename = useCallback(() => {
    if (debounceRenameTimeoutRef.current) {
      clearTimeout(debounceRenameTimeoutRef.current);
      debounceRenameTimeoutRef.current = null;
    }
    if (pendingRenameRef.current) {
      const { note: targetNote, firstH1Text, newFileName } = pendingRenameRef.current;
      pendingRenameRef.current = null;
      internalH1RenameRef.current = firstH1Text;
      if (firstH1Text === "") {
        onUpdate(targetNote.id, { title: "" });
      } else if (newFileName && onRenameFile) {
        onUpdate(targetNote.id, { title: firstH1Text });
        void onRenameFile(targetNote, newFileName);
      } else if (newFileName) {
        onUpdate(targetNote.id, { fileName: newFileName, title: firstH1Text });
      } else if (firstH1Text) {
        onUpdate(targetNote.id, { title: firstH1Text });
      }
    }
  }, [onUpdate, onRenameFile]);

  const escHtml = (s: string): string => {
    if (typeof s !== "string") return "";
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /** Detect if a string is a Tiptap JSON document */
  const isTiptapJson = (text: string) => typeof text === "string" && (text.trimStart().startsWith('{"type":"doc"') || text.includes('{"type":"doc"'));

  /** Return content in the format that editor.setContent() / useEditor({ content }) accepts */
  const parseEditorContent = (
    text: unknown,
    baseTitle: string = "",
    isTxt: boolean = false,
    isHtml: boolean = false,
    readingMode: boolean = isReadingMode
  ): string | Record<string, unknown> => {
    if (isHtml) {
      return typeof text === "string" ? sanitizeHtml(text) : "";
    }
    if (typeof text !== "string") {
      return isTxt ? "<p></p>" : (baseTitle ? `<h1>${escHtml(baseTitle)}</h1><p></p>` : "<h1></h1><p></p>");
    }
    if (!text.trim()) {
      const count = Math.max(1, (text.match(/\n/g) || []).length);
      const emptyPs = "<p></p>".repeat(count);
      return isTxt ? emptyPs : (baseTitle ? `<h1>${escHtml(baseTitle)}</h1>${emptyPs}` : `<h1></h1>${emptyPs}`);
    }

    if (isEncryptedNote(text)) {
      return isTxt ? "<p></p>" : (baseTitle ? `<h1>${escHtml(baseTitle)}</h1><p></p>` : "<h1></h1><p></p>");
    }

    let cleanText = text;

    // Auto-recover if JSON string is embedded after Frontmatter
    if (isTiptapJson(cleanText)) {
      const jsonStart = cleanText.indexOf('{"type":"doc"');
      if (jsonStart >= 0) {
        try {
          const jsonStr = cleanText.slice(jsonStart);
          const json = JSON.parse(jsonStr);
          if (json && Array.isArray(json.content)) {
            const textContent = extractTextFromTiptapJson(json).trim();
            if (!textContent) {
              return isTxt ? "<p></p>" : (baseTitle ? `<h1>${escHtml(baseTitle)}</h1><p></p>` : "<h1></h1><p></p>");
            }
            if (!isTxt) {
              const firstNode = json.content[0];
              if (!firstNode || firstNode.type !== "heading" || firstNode.attrs?.level !== 1) {
                const h1Node: Record<string, unknown> = {
                  type: "heading",
                  attrs: { level: 1 },
                };
                if (baseTitle) {
                  h1Node.content = [{ type: "text", text: baseTitle }];
                }
                json.content = [h1Node, ...json.content];
              } else if (baseTitle && (!firstNode.content || firstNode.content.length === 0)) {
                firstNode.content = [{ type: "text", text: baseTitle }];
              }
            } else {
              if (json.content.length > 0 && json.content[0]?.type === "heading") {
                json.content.shift();
              }
            }
            return json;
          }
        } catch { /* fall through */ }
      }
    }

    // Strip Frontmatter block for Markdown view
    const parsedFm = parseFrontmatterAndTags(cleanText);
    if (parsedFm.hasFrontmatter) {
      cleanText = parsedFm.bodyContent;
    }

    if (isTxt) {
      if (!cleanText.trim()) return "<p></p>";
      return toEditorHtml(cleanText, true, readingMode);
    }

    const titleH1Html = baseTitle ? `<h1>${escHtml(baseTitle)}</h1>` : "<h1></h1>";
    let editorHtml = toEditorHtml(cleanText, false, readingMode);

    const firstH1Match = /^\s*(?:<p>(?:<br\s*\/?>|\s*)*<\/p>\s*)*<h1[^>]*>[\s\S]*?<\/h1>/i.exec(editorHtml);
    if (firstH1Match) {
      editorHtml = titleH1Html + editorHtml.slice(firstH1Match[0].length);
    } else if (!/^\s*<h1[^>]*>/i.test(editorHtml)) {
      editorHtml = titleH1Html + editorHtml;
    }
    return collapseBlockWhitespace(editorHtml);
  };

  const toEditorHtml = (text: string, isTxt: boolean = false, readingMode: boolean = isReadingMode): string => {
    return renderMarkdownToEditorHtml(text, {
      isReadingMode: readingMode,
      theme: settingsRef.current?.theme || settings.theme,
      tagColorStyle: settingsRef.current?.tagColorStyle || settings.tagColorStyle,
      assetBlobUrlMap: assetBlobUrlMap.current,
      contentFormat: isTxt ? "plain" : (note?.contentFormat === "html" ? "html" : "markdown"),
    });
  };

  const scheduleAutoSaveDiskRef = useRef<(() => void) | null>(null);

  const [slashMenuState, setSlashMenuState] = useState<{
    open: boolean;
    query: string;
    slashRange: { from: number; to: number } | null;
    coords: { top: number; left: number } | null;
    selectedIndex: number;
    filteredItems: SlashMenuItem[];
  }>({
    open: false,
    query: "",
    slashRange: null,
    coords: null,
    selectedIndex: -1,
    filteredItems: [],
  });

  const [overflowSubmenu, setOverflowSubmenu] = useState<string | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const checkSlashMenuScroll = useCallback(() => {
    const el = slashMenuScrollRef.current;
    if (!el) return;
    const hasScrollable = el.scrollHeight > el.clientHeight;
    setCanScrollUp(hasScrollable && el.scrollTop > 2);
    setCanScrollDown(hasScrollable && el.scrollTop < el.scrollHeight - el.clientHeight - 2);
  }, []);

  const startAutoScroll = useCallback((direction: "up" | "down") => {
    stopAutoScroll();
    const step = () => {
      const el = slashMenuScrollRef.current;
      if (!el) return;
      el.scrollTop += direction === "up" ? -12 : 12;
      checkSlashMenuScroll();
    };
    step();
    scrollIntervalRef.current = setInterval(step, 30);
  }, [checkSlashMenuScroll, stopAutoScroll]);

  const scrollSlashMenu = useCallback((direction: "up" | "down") => {
    const el = slashMenuScrollRef.current;
    if (!el) return;
    const delta = direction === "up" ? -80 : 80;
    el.scrollBy({ top: delta, behavior: "smooth" });
    setTimeout(checkSlashMenuScroll, 150);
  }, [checkSlashMenuScroll]);

  useEffect(() => {
    if (slashMenuState.open) {
      setTimeout(checkSlashMenuScroll, 50);
    } else {
      stopAutoScroll();
      setCanScrollUp(false);
      setCanScrollDown(false);
    }
  }, [slashMenuState.open, slashMenuState.filteredItems, checkSlashMenuScroll, stopAutoScroll]);

  const openLinkDialogRef = useRef<(() => void) | null>(null);
  const openFootnoteDialogRef = useRef<(() => void) | null>(null);
  const openImageDialogRef = useRef<(() => void) | null>(null);
  const openWorkspaceImageDialogRef = useRef<(() => void) | null>(null);
  const triggerImageUploadRef = useRef<(() => void) | null>(null);
  const openVideoDialogRef = useRef<(() => void) | null>(null);
  const openWorkspaceVideoDialogRef = useRef<(() => void) | null>(null);
  const triggerVideoUploadRef = useRef<(() => void) | null>(null);
  const openAudioRecorderRef = useRef<(() => void) | null>(null);
  const openQrCodeDialogRef = useRef<(() => void) | null>(null);
  const openEmojiPickerRef = useRef<(() => void) | null>(null);
  const handleFixLanguageRef = useRef<(() => void) | null>(null);
  const openTranslatorRef = useRef<(() => void) | null>(null);
  const openCalculatorRef = useRef<(() => void) | null>(null);
  const openClockRef = useRef<(() => void) | null>(null);
  const handleAiActionRef = useRef<((action?: AiActionType) => void) | null>(null);
  const tRef = useRef(t);
  const isMobileRef = useRef(isMobile);
  const noteRef = useRef(note);

  useEffect(() => {
    tRef.current = t;
    isMobileRef.current = isMobile;
    noteRef.current = note;
    if (typeof window !== "undefined") {
      (window as any).__luno_rootDirHandle = rootDirHandle || null;
    }
    if (note && (!activeNoteRef.current || activeNoteRef.current.id === note.id)) {
      activeNoteRef.current = note;
    }
  }, [t, isMobile, note, rootDirHandle]);

  const executeSlashCommand = useCallback(
    (editorInstance: TiptapEditor, item: SlashMenuItem) => {
      const savedCoords = slashMenuStateRef.current.coords;
      if (slashMenuStateRef.current.slashRange) {
        const { from, to } = slashMenuStateRef.current.slashRange;
        editorInstance.chain().focus().deleteRange({ from, to }).run();
      }
      slashMenuStateRef.current.open = false;
      setSlashMenuState((prev) => ({ ...prev, open: false }));
      item.action(editorInstance, {
        openLinkDialog: () => openLinkDialogRef.current?.(),
        openFootnoteDialog: () => openFootnoteDialogRef.current?.(),
        openImageDialog: () => openImageDialogRef.current?.(),
        openWorkspaceImageDialog: () => openWorkspaceImageDialogRef.current?.(),
        triggerImageUpload: () => triggerImageUploadRef.current?.(),
        openVideoDialog: () => openVideoDialogRef.current?.(),
        openWorkspaceVideoDialog: () => openWorkspaceVideoDialogRef.current?.(),
        triggerVideoUpload: () => triggerVideoUploadRef.current?.(),
        openAudioRecorder: () => openAudioRecorderRef.current?.(),
        openQrCodeDialog: () => openQrCodeDialogRef.current?.(),
        openEmojiPicker: () => {
          setSlashEmojiState({
            open: true,
            coords: savedCoords || { top: 200, left: 200 },
          });
        },
        handleFixLanguage: () => handleFixLanguageRef.current?.(),
        openTranslator: () => openTranslatorRef.current?.(),
        openCalculator: () => openCalculatorRef.current?.(),
        openClock: () => openClockRef.current?.(),
        triggerAi: (action) => handleAiActionRef.current?.(action),
      });
    },
    [],
  );

  const checkSlashCommand = useCallback(
    (editorInstance: TiptapEditor) => {
      if (settings?.enableSlashCommand === false) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const { selection } = editorInstance.state;
      if (!selection.empty) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const { $from } = selection;
      const textBefore = $from.parent.textBetween(0, $from.parentOffset, " ", " ");
      const slashIdx = textBefore.lastIndexOf("/");

      if (slashIdx === -1) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const charBeforeSlash = slashIdx > 0 ? textBefore[slashIdx - 1] : "";
      if (slashIdx > 0 && !/\s/.test(charBeforeSlash)) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const query = textBefore.slice(slashIdx + 1).toLowerCase();
      if (query.includes(" ")) {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          setSlashMenuState((prev) => ({ ...prev, open: false }));
        }
        return;
      }

      const startPos = $from.start() + slashIdx;
      const endPos = $from.pos;
      const coords = editorInstance.view.coordsAtPos($from.pos);

      const filtered = SLASH_ITEMS.filter((item) => {
        if (!query) return true;
        const titleStr = t(item.titleKey).toLowerCase();
        const catStr = item.categoryKey ? t(item.categoryKey).toLowerCase() : "";
        return (
          titleStr.includes(query) ||
          catStr.includes(query) ||
          item.keywords.some((kw) => kw.toLowerCase().includes(query))
        );
      });

      const newState = {
        open: true,
        query,
        slashRange: { from: startPos, to: endPos },
        coords: { top: coords.bottom, left: coords.left },
        selectedIndex: -1,
        filteredItems: filtered,
      };

      slashMenuStateRef.current = {
        ...newState,
        onSelect: (item) => executeSlashCommand(editorInstance, item),
        notify: () => {
          setSlashMenuState((prev) => ({
            ...prev,
            selectedIndex: slashMenuStateRef.current.selectedIndex,
            open: slashMenuStateRef.current.open,
          }));
        },
      };

      setSlashMenuState(newState);
    },
    [t, executeSlashCommand, settings?.enableSlashCommand],
  );

  useEffect(() => {
    if (settings?.enableSlashCommand === false && slashMenuStateRef.current.open) {
      slashMenuStateRef.current.open = false;
      setSlashMenuState((prev) => ({ ...prev, open: false }));
    }
  }, [settings?.enableSlashCommand]);

  const [editorTick, setEditorTick] = useState(0);
  const tickRafRef = useRef<number | null>(null);
  const typingTickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const scheduleEditorTick = useCallback((immediate = false, isTyping = false) => {
    if (isTyping) {
      if (typingTickTimeoutRef.current) {
        clearTimeout(typingTickTimeoutRef.current);
      }
      typingTickTimeoutRef.current = setTimeout(() => {
        typingTickTimeoutRef.current = null;
        lastTickTimeRef.current = Date.now();
        setEditorTick((v) => (v + 1) % 1000000);
      }, 250);
      return;
    }

    if (typingTickTimeoutRef.current !== null) {
      return;
    }

    if (tickRafRef.current !== null) return;
    const now = Date.now();
    const elapsed = now - lastTickTimeRef.current;
    const interval = immediate ? 100 : 500;
    if (elapsed >= interval) {
      lastTickTimeRef.current = now;
      tickRafRef.current = window.setTimeout(() => {
        tickRafRef.current = null;
        setEditorTick((v) => (v + 1) % 1000000);
      }, 0);
    } else {
      tickRafRef.current = window.setTimeout(() => {
        tickRafRef.current = null;
        lastTickTimeRef.current = Date.now();
        setEditorTick((v) => (v + 1) % 1000000);
      }, interval - elapsed);
    }
  }, []);

  const [cachedCounts, setCachedCounts] = useState<{ charCount: number; wordCount: number; readingTime: number }>({
    charCount: 0,
    wordCount: 0,
    readingTime: 1,
  });
  const debouncedCountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleCountUpdate = useCallback(() => {
    if (debouncedCountTimeoutRef.current) {
      clearTimeout(debouncedCountTimeoutRef.current);
    }
    debouncedCountTimeoutRef.current = setTimeout(() => {
      debouncedCountTimeoutRef.current = null;
      if (!editorInstanceRef.current || editorInstanceRef.current.isDestroyed) return;
      const text = editorInstanceRef.current.state.doc.textContent;
      const chars = countCharacters(text);
      const words = countWords(text);
      const rTime = Math.max(1, Math.ceil(words / 200));
      setCachedCounts((prev) => {
        if (prev.charCount === chars && prev.wordCount === words && prev.readingTime === rTime) {
          return prev;
        }
        return { charCount: chars, wordCount: words, readingTime: rTime };
      });
    }, 600);
  }, []);

  useEffect(() => {
    if (!note) return;
    const initialText = note.content || "";
    const chars = countCharacters(initialText);
    const words = countWords(initialText);
    const rTime = Math.max(1, Math.ceil(words / 200));
    setCachedCounts({ charCount: chars, wordCount: words, readingTime: rTime });
  }, [note?.id]);

  type ImageFileInput = File | { dataUrl?: string; file?: File; blob?: Blob; fileName?: string };
  const processAndInsertImageFileRef = useRef<((input: ImageFileInput) => Promise<void>) | null>(null);
  const processAndInsertVideoFileRef = useRef<((file: File) => Promise<void>) | null>(null);
  const processAndInsertAudioFileRef = useRef<((file: File) => Promise<void>) | null>(null);
  const debouncedContentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedVersionSnapshotTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveContentRef = useRef<{ id: string; content: string } | null>(null);
  const userEditedRef = useRef(false);
  const hasPendingDiskSaveRef = useRef(false);
  const editorInstanceRef = useRef<TiptapEditor | null>(null);

  const editorScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isRestoringScrollRef = useRef(false);
  const restoreScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const restoreScrollPosition = useCallback((noteId: string) => {
    if (!noteId) return;
    const targetTop = getNoteScrollPosition(noteId);
    if (targetTop <= 0) return;
    
    isRestoringScrollRef.current = true;
    if (restoreScrollTimeoutRef.current) {
      clearTimeout(restoreScrollTimeoutRef.current);
    }

    const applyScroll = () => {
      if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== noteId) return;
      if (editorScrollContainerRef.current) {
        editorScrollContainerRef.current.scrollTop = targetTop;
      }
    };

    applyScroll();
    requestAnimationFrame(applyScroll);
    setTimeout(applyScroll, 20);
    setTimeout(applyScroll, 50);
    setTimeout(applyScroll, 100);
    setTimeout(applyScroll, 200);
    setTimeout(applyScroll, 350);
    setTimeout(applyScroll, 500);

    restoreScrollTimeoutRef.current = setTimeout(() => {
      isRestoringScrollRef.current = false;
    }, 600);
  }, []);

  const prevIsVisibleRef = useRef(isVisible);
  useEffect(() => {
    if (prevIsVisibleRef.current === isVisible) return;
    const wasVisible = prevIsVisibleRef.current;
    prevIsVisibleRef.current = isVisible;

    if (!isVisible && wasVisible && note?.id && editorScrollContainerRef.current && !isHtmlFile(note) && !isCssFile(note) && !isJsFile(note)) {
      const container = editorScrollContainerRef.current;
      if (container.scrollTop > 0) {
        setNoteScrollPosition(note.id, container.scrollTop);
      }
    } else if (isVisible && !wasVisible && note?.id && !isHtmlFile(note) && !isCssFile(note) && !isJsFile(note)) {
      if (editorInstanceRef.current && (editorActiveNoteIdRef.current !== note.id || closedNoteIds.has(note.id))) {
        setEditorTick((v) => (v + 1) % 1000000);
      }
      restoreScrollPosition(note.id);
    }
  }, [isVisible, note?.id, restoreScrollPosition, isHtmlFile, isCssFile, isJsFile]);

  useEffect(() => {
    if (!slashMenuState.open) return;
    const handleOutsideMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-slash-menu="true"]')) return;
      slashMenuStateRef.current.open = false;
      setSlashMenuState((prev) => ({ ...prev, open: false }));
    };
    document.addEventListener("mousedown", handleOutsideMouseDown);
    return () => document.removeEventListener("mousedown", handleOutsideMouseDown);
  }, [slashMenuState.open]);

  const handleEditorScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (slashMenuStateRef.current.open) {
      slashMenuStateRef.current.open = false;
      setSlashMenuState((prev) => ({ ...prev, open: false }));
    }
    if (!note?.id) return;
    if (isRestoringScrollRef.current) return;
    if (isHtmlFile(note) || isCssFile(note) || isJsFile(note) || isImageFile(note) || isBinaryFile(note)) return;
    const target = e.currentTarget;
    if (
      target.scrollTop === 0 &&
      (target.clientHeight === 0 || target.scrollHeight === 0 || target.offsetParent === null)
    ) {
      return;
    }
    const top = target.scrollTop;
    setNoteScrollPosition(note.id, top);
  }, [note?.id, isHtmlFile, isCssFile, isJsFile, isImageFile, isBinaryFile]);

  const serializeEditorContent = useCallback((targetNote: Note, instance: TiptapEditor): string => {
    if (isTxtFile(targetNote)) {
      return getPlainTextFromHtml(getCleanCollapsedHtml(instance));
    }
    if (isStrictReadingModeRef.current && isMarkdownNote(targetNote)) {
      const sourceContent = noteRef.current?.id === targetNote.id ? (noteRef.current?.content ?? targetNote.content ?? "") : (targetNote.content ?? "");
      if (sourceContent) return sourceContent;
    }
    const html = getCleanCollapsedHtml(instance);
    const temp = document.createElement("div");
    temp.innerHTML = html;
    // Strip reading-mode footnote section, items, and separator if any are present in the DOM
    temp.querySelectorAll("section.footnotes, [data-footnotes], hr.footnotes-sep").forEach((el) => el.remove());
    temp.querySelectorAll(".footnote-item, [data-footnote-id], [data-footnote-target]").forEach((el) => {
      const block = el.closest("li, ol, ul, section, p") || el;
      block.remove();
    });
    temp.querySelectorAll("a[href*='#fnref-'], [data-footnote-backref]").forEach((el) => {
      const li = el.closest("li");
      if (li) {
        const ol = li.closest("ol, ul");
        li.remove();
        if (ol && !ol.textContent?.trim()) ol.remove();
      }
    });
    const firstChild = temp.firstElementChild;
    if (firstChild && firstChild.tagName.toLowerCase() === "h1") {
      firstChild.remove();
    }
    const bodyMd = normalizeSerializedMarkdown(turndown.turndown(temp.innerHTML));
    if (isMarkdownNote(targetNote)) {
      const sourceContent = noteRef.current?.id === targetNote.id ? (noteRef.current?.content ?? targetNote.content ?? "") : (targetNote.content ?? "");
      const parsedOriginal = parseFrontmatterAndTags(sourceContent);
      let serialized = bodyMd;
      if (parsedOriginal.hasFrontmatter) {
        const fm = parsedOriginal.frontmatterRaw.endsWith("\n") ? parsedOriginal.frontmatterRaw : parsedOriginal.frontmatterRaw + "\n";
        serialized = fm + bodyMd;
      }
      if (targetNote.tags && targetNote.tags.length > 0) {
        serialized = updateFrontmatterTags(serialized, targetNote.tags);
      }
      if (targetNote.icon !== undefined || targetNote.iconColor !== undefined) {
        serialized = updateFrontmatterIcon(serialized, targetNote.icon, targetNote.iconColor);
      }
      if (targetNote.isFavorite !== undefined) {
        serialized = updateFrontmatterFavorite(serialized, targetNote.isFavorite);
      }
      return serialized;
    }
    return bodyMd;
  }, [isTxtFile, turndown]);

  const flushDebouncedContentSave = useCallback((targetNote?: Note) => {
    if (debouncedContentSaveTimeoutRef.current) {
      clearTimeout(debouncedContentSaveTimeoutRef.current);
      debouncedContentSaveTimeoutRef.current = null;
    }
    const currentNote = targetNote || activeNoteRef.current;
    if (!currentNote) return;

    // Safety checks: ensure the editor actually belongs to this note and note is not locked
    if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== currentNote.id) {
      return;
    }
    const isLocked = Boolean((currentNote.isLocked && !currentNote.isDecrypted) || isEncryptedNote(currentNote.content));
    if (isLocked) {
      return;
    }

    if (userEditedRef.current && currentNote) {
      let contentToSave = pendingSaveContentRef.current?.content;
      if ((contentToSave === undefined || contentToSave === null) && (isHtmlFile(currentNote) || isCssFile(currentNote) || isJsFile(currentNote))) {
        contentToSave = codeEditorContentMap.get(currentNote.id) ?? currentNote.content;
      }
      if ((contentToSave === undefined || contentToSave === null) && editorInstanceRef.current && !editorInstanceRef.current.isDestroyed) {
        try {
          contentToSave = serializeEditorContent(currentNote, editorInstanceRef.current);
        } catch {
          // fallback
        }
      }
      if ((contentToSave === undefined || contentToSave === null) && (isHtmlFile(currentNote) || isCssFile(currentNote) || isJsFile(currentNote))) {
        contentToSave = currentNote.content;
      }
      pendingSaveContentRef.current = null;
      if (contentToSave !== undefined && contentToSave !== null) {
        if (isHtmlFile(currentNote) || isCssFile(currentNote) || isJsFile(currentNote)) {
          codeEditorContentMap.set(currentNote.id, contentToSave);
        }
        if (!currentNote.isLocked) {
          try {
            localStorage.setItem(`luno_backup_${currentNote.id}`, contentToSave);
            if (currentNote.fileName) {
              localStorage.setItem(`luno_backup_fn_${currentNote.fileName}`, contentToSave);
            }
          } catch {
            // ignore
          }
        }
        onUpdate(currentNote.id, { content: contentToSave });

        // Also flush pending debounced version snapshot if one is scheduled
        if (debouncedVersionSnapshotTimeoutRef.current) {
          clearTimeout(debouncedVersionSnapshotTimeoutRef.current);
          debouncedVersionSnapshotTimeoutRef.current = null;
        }
        if (!currentNote.isLocked) {
          saveVersionSnapshot(
            { ...currentNote, content: contentToSave },
            "auto",
            undefined,
            false
          );
        }
      }
      userEditedRef.current = false;
    } else if (!userEditedRef.current) {
      pendingSaveContentRef.current = null;
    }
  }, [onUpdate, serializeEditorContent, isHtmlFile, isCssFile, isJsFile]);

  const ensureCursorVisible = useCallback((ed?: TiptapEditor | null) => {
    const activeEditor = ed || editorInstanceRef.current;
    if (!activeEditor || activeEditor.isDestroyed || !editorScrollContainerRef.current) return;
    const container = editorScrollContainerRef.current;
    try {
      const { selection } = activeEditor.state;
      const coords = activeEditor.view.coordsAtPos(selection.head);
      if (!coords) return;
      const containerRect = container.getBoundingClientRect();
      const PADDING_BOTTOM = 60;
      const PADDING_TOP = 20;

      if (coords.bottom + PADDING_BOTTOM > containerRect.bottom) {
        const diff = coords.bottom + PADDING_BOTTOM - containerRect.bottom;
        container.scrollTop += diff;
      } else if (coords.top - PADDING_TOP < containerRect.top) {
        const diff = containerRect.top - (coords.top - PADDING_TOP);
        container.scrollTop = Math.max(0, container.scrollTop - diff);
      }
    } catch {
      // Ignore coordinate resolution errors during fast structural node replacements
    }
  }, []);

  const cursorScrollRafRef = useRef<number | null>(null);
  const scheduleEnsureCursorVisible = useCallback((instance: TiptapEditor) => {
    if (cursorScrollRafRef.current !== null) return;
    cursorScrollRafRef.current = requestAnimationFrame(() => {
      cursorScrollRafRef.current = null;
      ensureCursorVisible(instance);
    });
  }, [ensureCursorVisible]);

  const navigateFootnoteOrAnchorHandler = useCallback((clickedEl: HTMLElement, container: HTMLElement | null): boolean => {
    return navigateFootnoteOrAnchor(clickedEl, container || editorScrollContainerRef.current);
  }, []);

  const editor = useEditor({
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        paragraph: false,
        link: false,
        underline: false,
        dropcursor: {
          color: "hsl(var(--border))",
          width: 1,
          class: "prosemirror-dropcursor",
        },
      }),
      CustomParagraph,
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockNodeView, {
            update: ({ oldNode, newNode, updateProps }) => {
              if (newNode.type.name !== oldNode.type.name) {
                return false;
              }
              if (
                oldNode.attrs.language !== newNode.attrs.language ||
                oldNode.textContent !== newNode.textContent
              ) {
                updateProps();
              }
              return true;
            },
          });
        },
      }).configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      HashtagDecoration.configure({
        theme: settings.theme,
        tagColorStyle: settings.tagColorStyle,
      }),
      SpellCheckDecoration.configure({
        enabled: settings.spellCheck !== false,
      }),
      WrongLanguageSuggestion.configure({
        enabled: settings.wrongLanguageSuggestion !== false,
      }),
      InlineCodeHighlight.configure({
        enabled: settings.highlightInlineCode === true,
      }),
      SmartTypography.configure({
        enabled: () => settingsRef.current?.smartTypography !== false,
      }),
      HeadingToggle.configure({
        enabled: () => (settingsRef.current as any)?.toggleHeading !== false,
      }),
      LivePreview.configure({
        enabled: () => Boolean(!isReadingModeRef.current && settingsRef.current?.readingModeLivePreview),
        hasTitleH1: () => !isTxtFile(noteRef.current),
        isSlashMenuOpen: () => Boolean(slashMenuStateRef.current?.open),
      }),
      Underline,
      Highlight,
      Superscript,
      Subscript,
      TextColor,
      FontFamily,
      FontSize,
      TextAlign,
      Kbd,
      Toggle,
      TaskList,
      TaskItem,
      AudioExtension,
      VideoExtension,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            align: {
              default: null,
              parseHTML: (element) => element.getAttribute("align") || element.style.textAlign || null,
              renderHTML: (attributes) => {
                if (!attributes.align) return {};
                return {
                  align: attributes.align,
                  style: `text-align: ${attributes.align};`,
                };
              },
            },
          };
        },
      }),
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            align: {
              default: null,
              parseHTML: (element) => element.getAttribute("align") || element.style.textAlign || null,
              renderHTML: (attributes) => {
                if (!attributes.align) return {};
                return {
                  align: attributes.align,
                  style: `text-align: ${attributes.align};`,
                };
              },
            },
          };
        },
      }),
      IndentKeymap,
      Link.extend({
        addOptions() {
          return {
            ...this.parent?.(),
            openOnClick: false,
            autolink: true,
            protocols: ["wikilink"],
            shouldAutoLink: (url: string) => {
              if (settingsRef.current?.smartTypography === false) {
                return false;
              }
              if (!url) return false;
              const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
              const hasMaybeProtocol = /^[a-z][a-z0-9+.-]*:/i.test(url);
              if (hasProtocol || (hasMaybeProtocol && !url.includes("@"))) {
                return true;
              }
              const urlWithoutUserinfo = url.includes("@") ? url.split("@").pop()! : url;
              const hostname = urlWithoutUserinfo.split(/[/?#:]/)[0];
              if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
                return false;
              }
              if (!/\./.test(hostname)) {
                return false;
              }
              return true;
            },
          };
        },
        addAttributes() {
          return {
            ...this.parent?.(),
            class: {
              default: null,
              parseHTML: (element) => element.getAttribute("class"),
              renderHTML: (attributes) => {
                if (!attributes.class) return {};
                return {
                  class: attributes.class,
                };
              },
            },
            "data-wikilink": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-wikilink"),
              renderHTML: (attributes) => {
                if (!attributes["data-wikilink"]) return {};
                return {
                  "data-wikilink": attributes["data-wikilink"],
                };
              },
            },
            "data-footnote-ref": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-footnote-ref"),
              renderHTML: (attributes) => {
                if (!attributes["data-footnote-ref"]) return {};
                return {
                  "data-footnote-ref": attributes["data-footnote-ref"],
                };
              },
            },
            "data-footnote-backref": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-footnote-backref"),
              renderHTML: (attributes) => {
                if (!attributes["data-footnote-backref"]) return {};
                return {
                  "data-footnote-backref": attributes["data-footnote-backref"],
                };
              },
            },
            id: {
              default: null,
              parseHTML: (element) => element.getAttribute("id"),
              renderHTML: (attributes) => {
                if (!attributes.id) return {};
                return {
                  id: attributes.id,
                };
              },
            },
          };
        },
      }).configure({
        openOnClick: false,
        autolink: true,
        protocols: ["wikilink"],
        isAllowedUri: (url, ctx) => {
          if (!url) return false;
          const trimmed = url.trim().toLowerCase();
          if (
            trimmed.startsWith("javascript:") ||
            trimmed.startsWith("vbscript:") ||
            trimmed.startsWith("data:") ||
            trimmed.startsWith("file:")
          ) {
            return false;
          }
          if (url.startsWith("wikilink:") || url.startsWith("#")) return true;
          return ctx.defaultValidate(url);
        },
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 cursor-pointer",
          rel: "noopener noreferrer nofollow",
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: (element) => {
                const w = element.getAttribute("width") || element.style.width;
                if (!w) return null;
                const parsed = parseInt(w, 10);
                return isNaN(parsed) ? null : parsed;
              },
              renderHTML: (attributes) => {
                if (!attributes.width) return {};
                return {
                  width: attributes.width,
                  style: `width: ${attributes.width}px; max-width: 100%;`,
                };
              },
            },
            "data-relative-src": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-relative-src") || element.getAttribute("src"),
              renderHTML: (attributes) => {
                if (!attributes["data-relative-src"]) return {};
                return {
                  "data-relative-src": attributes["data-relative-src"],
                };
              },
            },
            "data-qr-code": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-code"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-code"]) return {};
                return {
                  "data-qr-code": attributes["data-qr-code"],
                };
              },
            },
            "data-qr-text": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-text"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-text"]) return {};
                return {
                  "data-qr-text": attributes["data-qr-text"],
                };
              },
            },
            "data-qr-color": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-color"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-color"]) return {};
                return {
                  "data-qr-color": attributes["data-qr-color"],
                };
              },
            },
            "data-qr-bg": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-bg"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-bg"]) return {};
                return {
                  "data-qr-bg": attributes["data-qr-bg"],
                };
              },
            },
            "data-qr-level": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-level"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-level"]) return {};
                return {
                  "data-qr-level": attributes["data-qr-level"],
                };
              },
            },
            "data-wikilink-embed": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-wikilink-embed"),
              renderHTML: (attributes) => {
                if (!attributes["data-wikilink-embed"]) return {};
                return {
                  "data-wikilink-embed": attributes["data-wikilink-embed"],
                };
              },
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView, {
            update: ({ oldNode, newNode, updateProps }) => {
              if (newNode.type.name !== oldNode.type.name) {
                return false;
              }
              const oldAttrs = oldNode.attrs;
              const newAttrs = newNode.attrs;
              if (
                oldAttrs.src !== newAttrs.src ||
                oldAttrs.width !== newAttrs.width ||
                oldAttrs["data-relative-src"] !== newAttrs["data-relative-src"] ||
                oldAttrs["data-wikilink-embed"] !== newAttrs["data-wikilink-embed"] ||
                oldAttrs.alt !== newAttrs.alt ||
                oldAttrs.title !== newAttrs.title ||
                oldAttrs["data-qr-code"] !== newAttrs["data-qr-code"] ||
                oldAttrs["data-qr-text"] !== newAttrs["data-qr-text"] ||
                oldAttrs["data-qr-color"] !== newAttrs["data-qr-color"] ||
                oldAttrs["data-qr-bg"] !== newAttrs["data-qr-bg"] ||
                oldAttrs["data-qr-level"] !== newAttrs["data-qr-level"]
              ) {
                updateProps();
              }
              return true;
            },
          });
        },
      }).configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: ({ node, pos, editor: ed, hasAnchor }) => {
          if (node.type.name === "codeBlock") {
            return "";
          }

          if (node.type.name === "heading" && node.attrs?.level === 1 && pos === 0) {
            if (noteRef.current?.fileName) {
              const baseTitle = extractBaseTitleFromFileName(noteRef.current.fileName);
              if (baseTitle) return baseTitle;
            }
            const pattern = settingsRef.current?.newFilePattern;
            const dateStr = formatDateForFileName(new Date(), settingsRef.current?.dateFormat);
            if (pattern === "date") return `Note_${dateStr}`;
            if (pattern === "daily") return `Daily-${dateStr}`;
            return tRef.current("editor.untitled");
          }

          const doc = ed.state.doc;
          const firstChild = doc.firstChild;
          const isTopH1Empty =
            firstChild &&
            firstChild.type.name === "heading" &&
            firstChild.attrs?.level === 1 &&
            (firstChild.textContent || "").trim() === "";

          // Check if this node is the paragraph directly under an empty top H1
          const isSecondChildAfterTopH1 =
            isTopH1Empty &&
            doc.childCount >= 2 &&
            doc.child(1) === node;

          const isH1OrH2 =
            node.type.name === "heading" &&
            (node.attrs?.level === 1 || node.attrs?.level === 2);

          // Only show placeholder for H1, H2, currently focused line, OR line 2 under empty H1
          if (!hasAnchor && !isH1OrH2 && !isSecondChildAfterTopH1) {
            return "";
          }

          const isSlashCommandEnabled = settingsRef.current?.enableSlashCommand !== false;

          // If slash was typed in focused line, show "Type to search..." only when slash command is enabled
          const text = node.textContent;
          if (hasAnchor && text.startsWith("/") && isSlashCommandEnabled) {
            return tRef.current("editor.typeToSearch");
          }

          if (!isSlashCommandEnabled) {
            return tRef.current("editor.startWritingNoSlash");
          }

          return isMobileRef.current
            ? tRef.current("editor.startWritingMobile")
            : tRef.current("editor.startWriting");
        },
        showOnlyCurrent: false,
        includeChildren: false,
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
      }),
    ],
    content: (note?.isLocked && !note?.isDecrypted) || isEncryptedNote(note?.content)
      ? (isTxtFile(note) ? "<p></p>" : (getBaseTitle(note) ? `<h1>${escHtml(getBaseTitle(note))}</h1><p></p>` : "<h1></h1><p></p>"))
      : parseEditorContent(note?.content ?? "", getBaseTitle(note), isTxtFile(note)),
    parseOptions: {
      preserveWhitespace: "full",
    },
    editorProps: {
      transformPastedHTML: (html: string) => sanitizeHtml(html),
      attributes: {
        spellcheck: "false",
        "data-spellcheck-enabled": spellCheckEnabled ? "true" : "false",
        lang: settings.language || "en",
        style: `font-size:${editorFontSize}px;line-height:${settings.lineHeight};`,
        class: `${EDITOR_CLASSES} ${
          isReadingMode
            ? isReadingLivePreview
              ? "luno-reading-view luno-reading-live-preview cursor-text"
              : "luno-reading-view !cursor-default"
            : "cursor-text"
        } ${
          settings.accentHeadings
            ? "[&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary [&>h1:first-child]:text-primary"
            : "[&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-muted-foreground [&>h1:first-child]:text-foreground"
        }`,
      },
      handleClick: (view, pos, event) => {
        const target = (event.target as HTMLElement).closest("a, [data-footnote-ref], [data-footnote-backref], [data-footnote-target], sup, .footnote-ref, .footnote-backref");
        if (!target) return false;

        const href = target.getAttribute("href") || (target.querySelector("a")?.getAttribute("href") || "");
        const dataWiki = target.getAttribute("data-wikilink") || target.querySelector("[data-wikilink]")?.getAttribute("data-wikilink");
        const wikilinkTarget = dataWiki || (href.startsWith("wikilink:") ? decodeURIComponent(href.replace(/^wikilink:/, "")) : null);

        if (wikilinkTarget) {
          event.preventDefault();
          event.stopPropagation();
          const cleanTarget = wikilinkTarget.trim().toLowerCase();
          const baseClean = cleanTarget.replace(/\.[^/.]+$/, "");

          const currentNotes = (notes || []);
          const matchedNote = currentNotes.find((n) => {
            const nameWithoutExt = (n.fileName || n.title || "").replace(/\.[^/.]+$/, "").toLowerCase();
            const fullFileName = (n.fileName || "").toLowerCase();
            const title = (n.title || "").toLowerCase();
            return (
              nameWithoutExt === baseClean ||
              fullFileName === cleanTarget ||
              title === cleanTarget ||
              (n.folderPath && `${n.folderPath.toLowerCase()}/${nameWithoutExt}` === baseClean)
            );
          });

          if (matchedNote) {
            onSelectNote?.(matchedNote.id);
            return true;
          } else {
            toast({
              title: t("editor.noteNotFound"),
              description: `[[${wikilinkTarget}]]`,
            });
            return true;
          }
        }

        if (navigateFootnoteOrAnchor(target as HTMLElement, (view.dom.closest(".luno-editor-container") || view.dom.parentElement || document) as HTMLElement)) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }

        if (href && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:"))) {
          event.preventDefault();
          event.stopPropagation();
          if (href.startsWith("http://") || href.startsWith("https://")) {
            if (onOpenWebTab) {
              onOpenWebTab(href);
            } else if ((window as any).electronAPI?.openExternal) {
              void (window as any).electronAPI.openExternal(href);
            } else {
              window.open(href, "_blank", "noopener,noreferrer");
            }
          } else if ((window as any).electronAPI?.openExternal) {
            void (window as any).electronAPI.openExternal(href);
          } else {
            window.open(href, "_blank", "noopener,noreferrer");
          }
          return true;
        }

        if (target.tagName === "A" || target.closest("a")) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }

        return false;
      },
      handleDrop: (_view, event) => {
        const isImageFile = (file: { name?: string; type?: string } | null | undefined): boolean => {
          if (!file) return false;
          if (file.type && file.type.startsWith("image/")) return true;
          const name = file.name || "";
          return /\.(png|jpe?g|gif|webp|bmp|svg|ico|tiff?|avif)$/i.test(name);
        };

        const isVideoFile = (file: { name?: string; type?: string } | null | undefined): boolean => {
          if (!file) return false;
          return isVideoMedia(file.name || "", { type: file.type });
        };

        const isAudioFile = (file: { name?: string; type?: string } | null | undefined): boolean => {
          if (!file) return false;
          return isAudioMedia(file.name || "", { type: file.type });
        };

        const coordinates = _view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (coordinates) {
          editorSelectionRef.current = { from: coordinates.pos, to: coordinates.pos };
        }

        if (event.dataTransfer) {
          const files = event.dataTransfer.files;
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file && isImageFile(file)) {
                event.preventDefault();
                void processAndInsertImageFileRef.current?.(file);
                return true;
              }
              if (file && isAudioFile(file)) {
                event.preventDefault();
                void processAndInsertAudioFileRef.current?.(file);
                return true;
              }
              if (file && isVideoFile(file)) {
                event.preventDefault();
                void processAndInsertVideoFileRef.current?.(file);
                return true;
              }
            }
          }
          const items = event.dataTransfer.items;
          if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item && (item.kind === "file" || (item.type && (item.type.startsWith("image/") || item.type.startsWith("video/") || item.type.startsWith("audio/"))))) {
                const file = item.getAsFile();
                if (file && isImageFile(file)) {
                  event.preventDefault();
                  void processAndInsertImageFileRef.current?.(file);
                  return true;
                }
                if (file && isAudioFile(file)) {
                  event.preventDefault();
                  void processAndInsertAudioFileRef.current?.(file);
                  return true;
                }
                if (file && isVideoFile(file)) {
                  event.preventDefault();
                  void processAndInsertVideoFileRef.current?.(file);
                  return true;
                }
              }
            }
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        // Remember selection coordinates immediately upon paste
        const { from, to } = _view.state.selection;
        editorSelectionRef.current = { from, to };

        const isImageFile = (file: { name?: string; type?: string } | null | undefined): boolean => {
          if (!file) return false;
          if (file.type && file.type.startsWith("image/")) return true;
          const name = file.name || "";
          return /\.(png|jpe?g|gif|webp|bmp|svg|ico|tiff?|avif)$/i.test(name);
        };

        const isVideoFile = (file: { name?: string; type?: string } | null | undefined): boolean => {
          if (!file) return false;
          return isVideoMedia(file.name || "", { type: file.type });
        };

        const isAudioFile = (file: { name?: string; type?: string } | null | undefined): boolean => {
          if (!file) return false;
          return isAudioMedia(file.name || "", { type: file.type });
        };

        const invokeImagePaste = (input: ImageFileInput) => {
          const handler = processAndInsertImageFileRef.current || processAndInsertImageFile;
          if (handler) {
            void handler(input);
          }
        };

        // 1. First priority in Electron: Synchronous native clipboard check
        // Instantly captures Windows Snipping Tool (Win+Shift+S), PrintScreen, browser copied images, and copied image files from Windows Explorer
        const electronAPI = (window as unknown as {
          electronAPI?: {
            hasClipboardImage?: () => boolean;
            readClipboardImageSync?: () => { hasImage: boolean; dataUrl: string | null; fileName?: string };
            readClipboardImage?: () => Promise<{ hasImage: boolean; dataUrl: string | null; fileName?: string }>;
          };
        })?.electronAPI;

        if (electronAPI?.readClipboardImageSync) {
          try {
            const clip = electronAPI.readClipboardImageSync();
            if (clip?.hasImage && clip.dataUrl) {
              event.preventDefault();
              invokeImagePaste({ dataUrl: clip.dataUrl, fileName: clip.fileName });
              return true;
            }
          } catch (err) {
            console.warn("readClipboardImageSync error:", err);
          }
        }

        // 2. Second priority: Standard clipboard data (files & items from web or file explorer)
        if (event.clipboardData) {
          const files = event.clipboardData.files;
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file && isImageFile(file)) {
                event.preventDefault();
                invokeImagePaste(file);
                return true;
              }
              if (file && isVideoFile(file)) {
                event.preventDefault();
                void (processAndInsertVideoFileRef.current || processAndInsertVideoFile)(file);
                return true;
              }
              if (file && isAudioFile(file)) {
                event.preventDefault();
                void (processAndInsertAudioFileRef.current || processAndInsertAudioFile)(file);
                return true;
              }
            }
          }
          const items = event.clipboardData.items;
          if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item && (item.kind === "file" || (item.type && item.type.startsWith("image/")))) {
                const file = item.getAsFile();
                if (file && isImageFile(file)) {
                  event.preventDefault();
                  invokeImagePaste(file);
                  return true;
                }
              }
              if (item && (item.kind === "file" || (item.type && item.type.startsWith("audio/")))) {
                const file = item.getAsFile();
                if (file && isAudioFile(file)) {
                  event.preventDefault();
                  void (processAndInsertAudioFileRef.current || processAndInsertAudioFile)(file);
                  return true;
                }
              }
              if (item && (item.kind === "file" || (item.type && item.type.startsWith("video/")))) {
                const file = item.getAsFile();
                if (file && isVideoFile(file)) {
                  event.preventDefault();
                  void (processAndInsertVideoFileRef.current || processAndInsertVideoFile)(file);
                  return true;
                }
              }
            }
          }

          // 2.1 Check if clipboard contains copied HTML with data URL or remote image tag and no plain text
          const plainText = event.clipboardData.getData("text/plain") || "";
          const html = event.clipboardData.getData("text/html") || "";
          if (html && !plainText.trim()) {
            const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (match && match[1]) {
              const src = match[1];
              if (src.startsWith("data:image/")) {
                event.preventDefault();
                invokeImagePaste({ dataUrl: src });
                return true;
              }
            }
          }
        }

        // 3. Fallback: If async clipboard is available and no plain text, check native Electron clipboard
        if (event.clipboardData && electronAPI?.readClipboardImage) {
          const plainText = event.clipboardData.getData("text/plain") || "";
          if (!plainText.trim()) {
            event.preventDefault();
            void (async () => {
              try {
                const clipImg = await electronAPI.readClipboardImage();
                if (clipImg?.hasImage && clipImg.dataUrl) {
                  invokeImagePaste({ dataUrl: clipImg.dataUrl, fileName: clipImg.fileName });
                }
              } catch (err) {
                console.warn("Failed reading native clipboard image on paste:", err);
              }
            })();
            return true;
          }
        }

        return false;
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter") {
          const { selection } = view.state;
          if (selection.from <= (view.state.doc.firstChild?.nodeSize ?? 0)) {
            flushPendingRename();
          }
        }
        if (settingsRef.current.autoPairBrackets && !event.ctrlKey && !event.altKey && !event.metaKey) {
          const pairs: Record<string, string> = {
            "(": ")",
            "[": "]",
            "{": "}",
            '"': '"',
            "'": "'",
            "`": "`",
          };
          const closing = pairs[event.key];
          if (closing) {
            const { selection, tr } = view.state;
            const { from, to, empty } = selection;
            if (!empty) {
              tr.insertText(closing, to);
              tr.insertText(event.key, from);
              view.dispatch(tr);
              return true;
            } else {
              tr.insertText(event.key + closing, from);
              view.dispatch(tr);
              const resolved = view.state.doc.resolve(from + 1);
              view.dispatch(view.state.tr.setSelection(TextSelection.near(resolved)));
              return true;
            }
          }
        }
        return false;
      },
    },
    onCreate: ({ editor: instance }) => {
      if ((note?.isLocked && !note?.isDecrypted) || isEncryptedNote(note?.content)) {
        if (note?.id) noteEditorStateMap.delete(note.id);
        return;
      }
      const savedState = note?.id ? noteEditorStateMap.get(note.id) : null;
      if (savedState) {
        instance.view.updateState(savedState);
        if (note?.id) {
          instance.view.dispatch(
            instance.state.tr
              .setMeta("addToHistory", false)
              .setMeta(spellCheckPluginKey, { recompute: true, enabled: spellCheckEnabled })
              .setMeta(headingTogglePluginKey, {
                setNoteInfo: { noteId: note.id, fileName: note.fileName, restore: true },
              })
          );
        }
      } else {
        // Ensure initial editor state has a clean history (undoDepth: 0)
        const cleanState = EditorState.create({
          doc: instance.state.doc,
          plugins: instance.state.plugins,
        });
        instance.view.updateState(cleanState);
        if (note?.id) {
          instance.view.dispatch(
            instance.state.tr
              .setMeta("addToHistory", false)
              .setMeta(headingTogglePluginKey, {
                setNoteInfo: { noteId: note.id, fileName: note.fileName, restore: true },
              })
          );
        }
        if (note?.id && !hasReadingModeFootnotesDoc(instance.state.doc)) {
          noteEditorStateMap.set(note.id, instance.state);
        }
      }
    },
    onBlur: () => {
      if (typingTickTimeoutRef.current) {
        clearTimeout(typingTickTimeoutRef.current);
        typingTickTimeoutRef.current = null;
        setEditorTick((v) => (v + 1) % 1000000);
      }
      const currentActiveId = editorActiveNoteIdRef.current;
      const currentNote = activeNoteRef.current;
      const isLocked = Boolean((currentNote?.isLocked && !currentNote?.isDecrypted) || isEncryptedNote(currentNote?.content));
      if (currentActiveId && currentNote && currentActiveId === currentNote.id && !isLocked) {
        if (editor?.state && !isStrictReadingModeRef.current && !syncingFromNote.current) {
          noteEditorStateMap.set(currentActiveId, editor.state);
        }
        flushPendingRename();
        flushDebouncedContentSave(currentNote);
      }
    },
    onSelectionUpdate: ({ editor: instance, transaction }: any) => {
      checkSlashCommand(instance);
      const isTyping = Boolean(transaction?.docChanged && !transaction?.getMeta("isLivePreviewToggle"));
      scheduleEditorTick(!isTyping, isTyping);
      const currentActiveId = editorActiveNoteIdRef.current;
      const currentNote = activeNoteRef.current;
      const isLocked = Boolean((currentNote?.isLocked && !currentNote?.isDecrypted) || isEncryptedNote(currentNote?.content));
      if (currentActiveId && currentNote && currentActiveId === currentNote.id && !isLocked && !isStrictReadingModeRef.current && !syncingFromNote.current) {
        noteEditorStateMap.set(currentActiveId, instance.state);
      }
      const { from } = instance.state.selection;
      if (from > (instance.state.doc.firstChild?.nodeSize ?? 0)) {
        flushPendingRename();
      }
    },
    onUpdate: ({ editor: instance, transaction }: any) => {
      checkSlashCommand(instance);
      const isLivePreviewCommit = Boolean(transaction?.getMeta("isLivePreviewCommit"));
      const isLiveToggleOnly = Boolean(transaction?.getMeta("isLivePreviewToggle") && !isLivePreviewCommit);
      if (isLivePreviewCommit) {
        void resolveRelativeImagesInEditorRef.current?.(instance);
      }
      const isTyping = Boolean(transaction?.docChanged && !transaction.getMeta("isSync") && !isLiveToggleOnly);
      if (isTyping) {
        scheduleEnsureCursorVisible(instance);
      }
      scheduleEditorTick(false, isTyping);
      scheduleCountUpdate();
      const currentActiveId = editorActiveNoteIdRef.current;
      const currentNote = activeNoteRef.current || note;
      const isLocked = Boolean((currentNote?.isLocked && !currentNote?.isDecrypted) || isEncryptedNote(currentNote?.content));

      if (currentActiveId && currentNote && currentActiveId === currentNote.id && !isLocked && !isStrictReadingModeRef.current && !syncingFromNote.current) {
        noteEditorStateMap.set(currentActiveId, instance.state);
      }
      if (isLocked || (currentActiveId && note && currentActiveId !== note.id)) return;
      if (isStrictReadingModeRef.current || !note || syncingFromNote.current || isNoteDeleted(note.id)) return;
      if (loadingNoteIdRef.current === note.id) return;
      if (transaction?.getMeta("isSync")) return;
      if (isLiveToggleOnly) return;
      if (transaction && !transaction.docChanged) return;
      userEditedRef.current = true;
      hasPendingDiskSaveRef.current = true;
      if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== note.id) return;
      const doc = instance.state.doc;
      const firstChild = doc.firstChild;
      let firstH1Text = "";
      if (firstChild && firstChild.type.name === "heading" && firstChild.attrs?.level === 1) {
        const rawH1 = firstChild.textContent || "";
        const isFirstBlockLiveExpanded =
          livePreviewPluginKey.getState(instance.state)?.activeBlock?.blockPos === 0;
        firstH1Text = (isFirstBlockLiveExpanded ? rawH1.replace(/^#{1,6}\s+/, "") : rawH1).trim();
      }

      const currentBaseTitle = getBaseTitle(note);
      if (firstH1Text !== currentBaseTitle) {
        if (firstH1Text === "") {
          pendingRenameRef.current = { note, firstH1Text: "", newFileName: "" };
        } else if (note.fileName) {
          const lastDot = note.fileName.lastIndexOf(".");
          const ext = lastDot > 0 ? note.fileName.slice(lastDot) : ".md";
          const safeName = firstH1Text.replace(/[\\/:*?"<>|]/g, "_").trim();
          if (safeName && !isSystemGeneratedUntitledName(safeName)) {
            const newFileName = `${safeName}${ext}`;
            if (newFileName !== note.fileName) {
              pendingRenameRef.current = { note, firstH1Text, newFileName };
              if (debounceRenameTimeoutRef.current) {
                clearTimeout(debounceRenameTimeoutRef.current);
              }
              debounceRenameTimeoutRef.current = setTimeout(() => {
                debounceRenameTimeoutRef.current = null;
                flushPendingRename();
              }, 1500);
            }
          } else {
            pendingRenameRef.current = { note, firstH1Text, newFileName: "" };
          }
        } else {
          pendingRenameRef.current = { note, firstH1Text, newFileName: "" };
        }
      }

      if (debouncedContentSaveTimeoutRef.current) {
        clearTimeout(debouncedContentSaveTimeoutRef.current);
      }
      debouncedContentSaveTimeoutRef.current = setTimeout(() => {
        if (isStrictReadingModeRef.current) return;
        if (userEditedRef.current && noteRef.current) {
          const currentNote = noteRef.current;
          if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== currentNote.id) return;
          if ((currentNote.isLocked && !currentNote.isDecrypted) || isEncryptedNote(currentNote.content)) return;

          const savedContent = serializeEditorContent(currentNote, instance);
          pendingSaveContentRef.current = { id: currentNote.id, content: savedContent };
          if (!currentNote.isLocked) {
            try {
              if (savedContent) {
                localStorage.setItem(`luno_backup_${currentNote.id}`, savedContent);
                if (currentNote.fileName) {
                  localStorage.setItem(`luno_backup_fn_${currentNote.fileName}`, savedContent);
                }
              }
            } catch {
              /* ignore localStorage quota */
            }
          }
          pendingSaveContentRef.current = null;
          setLastEditedTime(Date.now());
          onUpdate(currentNote.id, { content: savedContent });
          if (!instance.isFocused) {
            userEditedRef.current = false;
          }

          // Throttled and debounced automatic version snapshot on typing idle (10s)
          if (debouncedVersionSnapshotTimeoutRef.current) {
            clearTimeout(debouncedVersionSnapshotTimeoutRef.current);
          }
          debouncedVersionSnapshotTimeoutRef.current = setTimeout(() => {
            saveVersionSnapshot(
              { ...currentNote, content: savedContent },
              "auto",
              undefined,
              false,
              editorStats.wordCount,
              editorStats.charCount
            );
          }, 10000);

          if (!settings.autoSave) {
            setSaveStatus("unsaved");
            return;
          }
          autoSavingStartTimeRef.current = Date.now();
          setSaveStatus("auto_saving");
          scheduleAutoSaveDiskRef.current?.();
        } else {
          pendingSaveContentRef.current = null;
        }
      }, 1000);
    },
  }, ["luno-editor-instance"]);

  editorInstanceRef.current = editor;

  const toggleTranslator = useCallback(() => {
    let selectedText = "";
    if (editor && !editor.state.selection.empty) {
      selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        " ",
        " ",
      );
    }
    window.dispatchEvent(
      new CustomEvent("app:toggle-translator", {
        detail: { initialText: selectedText, paneId },
      }),
    );
  }, [editor, paneId]);

  const openTranslatorWithSelection = useCallback(() => {
    let selectedText = "";
    if (editor && !editor.state.selection.empty) {
      selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        " ",
        " ",
      );
    }
    window.dispatchEvent(
      new CustomEvent("app:toggle-translator", {
        detail: { initialText: selectedText, forceOpen: true, paneId },
      }),
    );
  }, [editor, paneId]);

  const handleInsertTranslation = useCallback((textToInsert: string) => {
    if (!textToInsert) return;
    if (editor) {
      editor.chain().focus().insertContent(textToInsert).run();
    } else if (note && onUpdate) {
      onUpdate(note.id, { content: (note.content || "") + "\n" + textToInsert });
    }
  }, [editor, note, onUpdate]);

  const [contextSpellData, setContextSpellData] = useState<{
    word: string;
    suggestions: string[];
    from: number;
    to: number;
  } | null>(null);

  const handleEditorContextMenu = (event: React.MouseEvent) => {
    if (!editor || settings.spellCheck === false) {
      setContextSpellData(null);
      return;
    }

    // 1. Check if user already highlighted a word
    const { from: selFrom, to: selTo, empty } = editor.state.selection;
    if (!empty && selTo - selFrom < 100) {
      const selectedText = editor.state.doc.textBetween(selFrom, selTo, "\n", "\n").trim();
      if (selectedText && isWordMisspelled(selectedText)) {
        const suggestions = getSpellingSuggestions(selectedText);
        setContextSpellData({
          word: selectedText,
          suggestions,
          from: selFrom,
          to: selTo,
        });
        return;
      }
    }

    // 2. Find position under mouse cursor
    const view = editor.view;
    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!pos) {
      setContextSpellData(null);
      return;
    }

    // 2.5. Prefer active SpellCheckDecoration range directly under cursor
    const activeDecoSet = spellCheckPluginKey.getState(view.state);
    if (activeDecoSet) {
      const docSize = view.state.doc.content.size;
      const searchFrom = Math.max(0, pos.pos - 1);
      const searchTo = Math.min(docSize, pos.pos + 1);
      const foundDecos = activeDecoSet.find(searchFrom, searchTo);
      if (foundDecos && foundDecos.length > 0) {
        const targetDeco =
          foundDecos.find((d: any) => pos.pos >= d.from && pos.pos <= d.to) || foundDecos[0];
        const decoWord =
          targetDeco.spec?.["data-spell-word"] ||
          view.state.doc.textBetween(targetDeco.from, targetDeco.to);
        if (decoWord) {
          const suggestions = getSpellingSuggestions(decoWord);
          setContextSpellData({
            word: decoWord,
            suggestions,
            from: targetDeco.from,
            to: targetDeco.to,
          });
          return;
        }
      }
    }

    const $pos = view.state.doc.resolve(pos.pos);
    const parentText = $pos.parent.textContent;
    const offsetInParent = $pos.parentOffset;
    const parentStartPos = $pos.start();
    if (!parentText) {
      setContextSpellData(null);
      return;
    }

    // 3. Check Thai DAG segmentation & misspellings in parentText around offset
    const thaiErrors = findThaiMisspellingsInText(parentText);
    for (const err of thaiErrors) {
      if (offsetInParent >= err.start - 1 && offsetInParent <= err.end + 1) {
        const suggestions = getSpellingSuggestions(err.word);
        setContextSpellData({
          word: err.word,
          suggestions,
          from: parentStartPos + err.start,
          to: parentStartPos + err.end,
        });
        return;
      }
    }

    // 4. Check known Thai misspelled entries directly in parentText around offset
    for (const [misspelled, corrects] of Object.entries(THAI_SPELL_CORRECTIONS)) {
      let searchIdx = parentText.indexOf(misspelled);
      while (searchIdx !== -1) {
        const start = searchIdx;
        const end = searchIdx + misspelled.length;
        if (offsetInParent >= start - 1 && offsetInParent <= end + 1) {
          const suggestions = corrects.filter((s) => s !== misspelled);
          if (suggestions.length > 0) {
            setContextSpellData({
              word: misspelled,
              suggestions,
              from: parentStartPos + start,
              to: parentStartPos + end,
            });
            return;
          }
        }
        searchIdx = parentText.indexOf(misspelled, searchIdx + 1);
      }
    }

    // 4.5. Check Thai structural typing anomalies (double vowels, fake sara-ae, repeated tone marks)
    THAI_STRUCTURAL_ANOMALY_REGEX.lastIndex = 0;
    let anomalyMatch: RegExpExecArray | null;
    while ((anomalyMatch = THAI_STRUCTURAL_ANOMALY_REGEX.exec(parentText)) !== null) {
      const expanded = expandThaiAnomalyCluster(parentText, anomalyMatch.index, anomalyMatch.index + anomalyMatch[0].length);
      const start = expanded ? expanded.start : anomalyMatch.index;
      const end = expanded ? expanded.end : anomalyMatch.index + anomalyMatch[0].length;
      if (offsetInParent >= start - 1 && offsetInParent <= end + 1) {
        const clusterText = parentText.slice(start, end);
        const suggestions = getSpellingSuggestions(clusterText);
        setContextSpellData({
          word: clusterText,
          suggestions,
          from: parentStartPos + start,
          to: parentStartPos + end,
        });
        return;
      }
    }

    // 5. English / latin word regex boundary around offset
    const latinWordRegex = /(?<![A-Za-z0-9_])[A-Za-z]+(?:['\u2019][A-Za-z]+)*(?![A-Za-z0-9_])/g;
    let match: RegExpExecArray | null;
    while ((match = latinWordRegex.exec(parentText)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (offsetInParent >= start && offsetInParent <= end) {
        const word = match[0];
        if (isWordMisspelled(word)) {
          const suggestions = getSpellingSuggestions(word);
          setContextSpellData({
            word,
            suggestions,
            from: parentStartPos + start,
            to: parentStartPos + end,
          });
          return;
        }
        break;
      }
    }

    setContextSpellData(null);
  };

  useEffect(() => {
    if (!(window as any).electronAPI?.onNativeSpellSuggestions) return;
    const unsub = (window as any).electronAPI.onNativeSpellSuggestions((data: { word: string; suggestions: string[] }) => {
      if (!data || !data.suggestions || data.suggestions.length === 0) return;
      setContextSpellData((prev) => {
        if (prev) {
          const merged = Array.from(new Set([...data.suggestions, ...prev.suggestions]));
          return { ...prev, suggestions: merged };
        }
        if (!editor || !data.word) return null;
        const { from } = editor.state.selection;
        const $pos = editor.state.doc.resolve(from);
        const parentText = $pos.parent.textContent;
        const idx = parentText.indexOf(data.word);
        if (idx !== -1) {
          const wordFrom = $pos.start() + idx;
          const wordTo = wordFrom + data.word.length;
          return {
            word: data.word,
            suggestions: data.suggestions,
            from: wordFrom,
            to: wordTo,
          };
        }
        return null;
      });
    });
    return () => unsub();
  }, [editor]);

  const editorStats = useMemo(() => {
    let syntaxLabel = t("editor.formatMarkdown");
    const fileName = note?.fileName?.toLowerCase() ?? "";
    if (fileName.endsWith(".css") || note?.contentFormat === "css") {
      syntaxLabel = "CSS";
    } else if (fileName.endsWith(".html") || note?.contentFormat === "html") {
      syntaxLabel = "HTML";
    } else if (fileName.endsWith(".js") || fileName.endsWith(".mjs") || fileName.endsWith(".cjs") || note?.contentFormat === "javascript" || note?.contentFormat === "js" || isJsFile(note)) {
      syntaxLabel = "JavaScript";
    } else if (fileName.endsWith(".txt")) {
      syntaxLabel = t("editor.formatText");
    }

    const currentFontSize = settings.editorFontSize || editorFontSize || 15;
    const zoom = Math.round((currentFontSize / 15) * 100);

    if (note?.contentFormat === "html" || note?.contentFormat === "css" || note?.contentFormat === "javascript" || note?.contentFormat === "js" || isCssFile(note) || isHtmlFile(note) || isJsFile(note)) {
      return {
        line: htmlCursor.line,
        col: htmlCursor.col,
        charCount: cachedCounts.charCount,
        wordCount: cachedCounts.wordCount,
        readingTime: cachedCounts.readingTime,
        syntaxLabel: (note?.contentFormat === "css" || isCssFile(note)) ? "CSS" : (note?.contentFormat === "javascript" || note?.contentFormat === "js" || isJsFile(note)) ? "JavaScript" : "HTML",
        zoom,
      };
    }

    if (!editor) {
      return {
        line: 1,
        col: 1,
        charCount: cachedCounts.charCount,
        wordCount: cachedCounts.wordCount,
        readingTime: cachedCounts.readingTime,
        syntaxLabel,
        zoom,
      };
    }

    const { selection } = editor.state;
    const $from = selection.$from;
    const currentBlockText = $from.parent.textBetween(0, $from.parentOffset, " ", " ");
    const subLines = currentBlockText.split("\n");
    const col = (subLines[subLines.length - 1]?.length ?? 0) + 1;
    const line = $from.index(0) + subLines.length;

    return {
      line,
      col,
      charCount: cachedCounts.charCount,
      wordCount: cachedCounts.wordCount,
      readingTime: cachedCounts.readingTime,
      syntaxLabel,
      zoom,
    };
  }, [editor, editorTick, note, editorFontSize, settings.editorFontSize, htmlCursor, cachedCounts]);

  const getFreshFileHandle = useCallback(async (targetNote: Note, allowCreate = false): Promise<FileSystemFileHandle | null> => {
    if (!targetNote || isNoteDeleted(targetNote.id) || deletedNoteIdsRef.current.has(targetNote.id)) {
      return null;
    }
    const relPath = targetNote.fileName ? (targetNote.folderPath ? `${targetNote.folderPath}/${targetNote.fileName}` : targetNote.fileName) : "";
    if (relPath && isRelativePathDeleted(relPath)) {
      return null;
    }

    if (rootDirHandle && targetNote.fileName) {
      try {
        let targetDir = rootDirHandle;
        const segments = (targetNote.folderPath ?? "").split("/").filter(Boolean);
        for (const segment of segments) {
          targetDir = await targetDir.getDirectoryHandle(segment, { create: allowCreate });
        }
        const handle = await targetDir.getFileHandle(targetNote.fileName, { create: allowCreate });
        fileHandleByNoteIdRef.current[targetNote.id] = handle;
        return handle;
      } catch {
        const cached = fileHandleByNoteIdRef.current[targetNote.id] ?? (await getStoredFileHandle(targetNote.id));
        if (cached) {
          fileHandleByNoteIdRef.current[targetNote.id] = cached;
          return cached;
        }
        return null;
      }
    }

    const cachedHandle = fileHandleByNoteIdRef.current[targetNote.id] ?? (await getStoredFileHandle(targetNote.id));
    if (cachedHandle) {
      fileHandleByNoteIdRef.current[targetNote.id] = cachedHandle;
      return cachedHandle;
    }
    return null;
  }, [rootDirHandle]);

  const saveLinkedFileToDisk = useCallback(async (targetNote?: Note) => {
    if (isStrictReadingModeRef.current) return;
    if (!hasPendingDiskSaveRef.current) return;
    const n = targetNote || activeNoteRef.current || note;
    if (!n || (!editor && !isHtmlFile(n) && !isCssFile(n) && !isJsFile(n)) || !settings.autoSave) return;
    if ((n.isLocked && !n.isDecrypted) || isEncryptedNote(n.content)) return;
    if (!targetNote && editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== n.id) return;
    if (n.fileType === "image" || n.fileType === "binary") return;
    if (deletedNoteIdsRef.current.has(n.id) || isNoteDeleted(n.id)) return;
    if (Array.isArray(notes) && !notes.some((item) => item.id === n.id)) return;
    if (!targetNote && (loadingNoteIdRef.current === n.id || syncingFromNote.current)) return;

    const opId = ++saveOpIdRef.current;

    const relPath = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName) : "";
    if (relPath && isRelativePathDeleted(relPath)) {
      if (saveOpIdRef.current === opId) {
        setSaveStatus("saved");
      }
      return;
    }

    try {
      const ext = getPreferredExtension(n) as "md" | "txt" | "html" | "css";
      const content = getContentToSave(ext, n);
      await performSave(content, ext, true, n);
    } catch {
      if (saveOpIdRef.current === opId) {
        setSaveStatus("failed");
      }
    }
  }, [note, editor, isHtmlFile, isCssFile, isJsFile, settings.autoSave, notes]);

  const scheduleAutoSaveDisk = useCallback(() => {
    if (autoSaveDiskTimeoutRef.current) {
      clearTimeout(autoSaveDiskTimeoutRef.current);
    }
    autoSaveDiskTimeoutRef.current = setTimeout(() => {
      void saveLinkedFileToDisk();
    }, 500);
  }, [saveLinkedFileToDisk]);

  useEffect(() => {
    scheduleAutoSaveDiskRef.current = scheduleAutoSaveDisk;
  }, [scheduleAutoSaveDisk]);

  const handleToggleHtmlPreview = useCallback((open: boolean) => {
    if (note && (isHtmlFile(note) || note.contentFormat === "html")) {
      flushDebouncedContentSave(note);
      if (open && hasPendingDiskSaveRef.current && settings.autoSave) {
        void saveLinkedFileToDisk(note);
      }
    }
    setHtmlPreviewOpen(open);
  }, [note, isHtmlFile, flushDebouncedContentSave, settings.autoSave, saveLinkedFileToDisk]);


  useEffect(() => {
    return () => {
      flushPendingRename();
    };
  }, [note?.id, flushPendingRename]);

  useEffect(() => {
    if (!editor || !settings.showCodeLineNumbers) return;
    const dom = editor.view.dom;
    const preElements = dom.querySelectorAll("pre");
    preElements.forEach((pre) => {
      const code = pre.querySelector("code");
      const text = code ? code.textContent || "" : pre.textContent || "";
      const lineCount = Math.max(1, text.split("\n").length);
      const lineNumbersStr = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
      if (pre.getAttribute("data-line-numbers") !== lineNumbersStr) {
        pre.setAttribute("data-line-numbers", lineNumbersStr);
      }
    });
  }, [editor, editorTick, settings.showCodeLineNumbers, note?.id]);

  // Sync toolbar active state when a Toggle title input gains or loses focus
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    return subscribeToggleFocusChange((changedEditor) => {
      if (changedEditor === editor) {
        scheduleEditorTick(true);
      }
    });
  }, [editor, scheduleEditorTick]);

  // Dynamically update Hashtag badges when theme or tagColorStyle changes in settings
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    try {
      const ext = editor.extensionManager.extensions.find((e) => e.name === "hashtagDecoration");
      if (ext) {
        ext.options.theme = settings.theme;
        ext.options.tagColorStyle = settings.tagColorStyle;
        const tr = editor.state.tr.setMeta(hashtagPluginKey, { recompute: true });
        editor.view.dispatch(tr);
      }
    } catch { /* ignore */ }
  }, [editor, settings.theme, settings.tagColorStyle]);

  // Dynamically sync SmartTypography and autolink when changed in settings
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    try {
      if ((editor.storage as any)?.smartTypography) {
        (editor.storage as any).smartTypography.enabled = settings.smartTypography !== false;
      }
    } catch { /* ignore */ }
  }, [editor, settings.smartTypography]);

  useEffect(() => {
    return () => {
      if (autoSaveDiskTimeoutRef.current) {
        clearTimeout(autoSaveDiskTimeoutRef.current);
      }
    };
  }, [note?.id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingRename();
      const currentTarget = activeNoteRef.current || note;
      flushDebouncedContentSave(currentTarget);
      if (hasPendingDiskSaveRef.current && currentTarget && settings.autoSave) {
        void saveLinkedFileToDisk(currentTarget);
      }
      if (pendingSaveContentRef.current) {
        const { id, content } = pendingSaveContentRef.current;
        pendingSaveContentRef.current = null;
        onUpdate(id, { content });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [flushPendingRename, flushDebouncedContentSave, saveLinkedFileToDisk, onUpdate, note, settings.autoSave]);

  type SaveStatus =
    | "saved"
    | "auto_saved"
    | "manually_saved"
    | "saving"
    | "auto_saving"
    | "unsaved"
    | "failed"
    | "unavailable"
    | "idle";

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastEditedTime, setLastEditedTime] = useState<number | null>(null);
  const saveOpIdRef = useRef(0);

  useEffect(() => {
    if (saveStatus === "auto_saved" || saveStatus === "manually_saved") {
      const timer = setTimeout(() => {
        setSaveStatus((prev) => (prev === "auto_saved" || prev === "manually_saved" ? "saved" : prev));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [statusPortalTarget, setStatusPortalTarget] = useState<HTMLElement | null>(null);

  // Synchronously compute active/connected targets so that portals mount immediately without waiting for state or effect cycles
  const effectivePortalTarget =
    portalTarget && portalTarget.isConnected
      ? portalTarget
      : typeof document !== "undefined"
      ? (document.getElementById(`breadcrumb-editor-actions-${paneId}`) as HTMLElement | null)
      : null;

  const effectiveStatusPortalTarget =
    statusPortalTarget && statusPortalTarget.isConnected
      ? statusPortalTarget
      : typeof document !== "undefined"
      ? (document.getElementById(`breadcrumb-save-status-${paneId}`) as HTMLElement | null)
      : null;

  useEffect(() => {
    const actionId = `breadcrumb-editor-actions-${paneId}`;
    const statusId = `breadcrumb-save-status-${paneId}`;

    const updateTargets = () => {
      const target = document.getElementById(actionId);
      const sTarget = document.getElementById(statusId);
      if (target && target.isConnected) {
        setPortalTarget((prev) => (prev !== target ? target : prev));
      } else {
        setPortalTarget((prev) => (prev ? null : prev));
      }
      if (sTarget && sTarget.isConnected) {
        setStatusPortalTarget((prev) => (prev !== sTarget ? sTarget : prev));
      } else {
        setStatusPortalTarget((prev) => (prev ? null : prev));
      }
    };

    updateTargets();

    const handleBreadcrumbChange = () => {
      updateTargets();
    };

    window.addEventListener("luno:breadcrumb-mounted", handleBreadcrumbChange);
    window.addEventListener("luno:breadcrumb-unmounted", handleBreadcrumbChange);
    window.addEventListener("resize", handleBreadcrumbChange);

    // Periodic lightweight check to ensure targets stay connected across tab switches and views
    const interval = setInterval(() => {
      const target = document.getElementById(actionId);
      const sTarget = document.getElementById(statusId);
      setPortalTarget((prev) => {
        if (!prev || !prev.isConnected || prev !== target) {
          return target && target.isConnected ? target : null;
        }
        return prev;
      });
      setStatusPortalTarget((prev) => {
        if (!prev || !prev.isConnected || prev !== sTarget) {
          return sTarget && sTarget.isConnected ? sTarget : null;
        }
        return prev;
      });
    }, 1000);

    return () => {
      window.removeEventListener("luno:breadcrumb-mounted", handleBreadcrumbChange);
      window.removeEventListener("luno:breadcrumb-unmounted", handleBreadcrumbChange);
      window.removeEventListener("resize", handleBreadcrumbChange);
      clearInterval(interval);
    };
  }, [paneId, note?.id]);

  useEffect(() => {
    if (note?.content) {
      setLineEnding(note.content.includes("\r\n") ? "CRLF" : "LF");
    }
  }, [note?.id]);

  const handleToggleLineEnding = () => {
    const nextEnding: "LF" | "CRLF" = lineEnding === "LF" ? "CRLF" : "LF";
    setLineEnding(nextEnding);
    if (note && onUpdate) {
      const currentContent = note.content || "";
      const updatedContent = nextEnding === "CRLF"
        ? currentContent.replace(/\r?\n/g, "\r\n")
        : currentContent.replace(/\r\n/g, "\n");
      if (updatedContent !== currentContent) {
        onUpdate(note.id, { content: updatedContent });
      }
    }
  };

  useEffect(() => {
    if (!note) return;
    if (saveStatus === "saving" || saveStatus === "auto_saving" || saveStatus === "auto_saved") return;
    if (userEditedRef.current) {
      setSaveStatus("unsaved");
    }
  }, [note?.id, note?.content]);

  useEffect(() => {
    if (saveStatus === "auto_saved") {
      const timer = setTimeout(() => {
        setSaveStatus("saved");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  useEffect(() => {
    const handleClearHistory = (e: Event) => {
      const customEvent = e as CustomEvent<{ noteId: string }>;
      const targetId = customEvent.detail?.noteId;
      if (!targetId) return;

      closedNoteIds.add(targetId);
      if (editorActiveNoteIdRef.current === targetId || activeNoteRef.current?.id === targetId) {
        editorActiveNoteIdRef.current = null;
        activeNoteRef.current = null;
        userEditedRef.current = false;
        hasPendingDiskSaveRef.current = false;
        if (editor && !editor.isDestroyed) {
          try {
            const cleanState = EditorState.create({
              doc: editor.state.schema.topNodeType.createAndFill() || editor.state.doc,
              plugins: editor.state.plugins,
            });
            editor.view.updateState(cleanState);
            setEditorTick((v) => (v + 1) % 1000000);
          } catch {
            /* ignore */
          }
        }
      }
    };

    window.addEventListener("luno:clear-note-editor-history", handleClearHistory);
    return () => {
      window.removeEventListener("luno:clear-note-editor-history", handleClearHistory);
    };
  }, [editor]);

  useEffect(() => {
    const handleFlushBeforeClose = (e: Event) => {
      const customEvent = e as CustomEvent<{ noteId: string }>;
      const targetId = customEvent.detail?.noteId;
      if (!targetId) return;

      const target = targetId === note?.id ? note : (notes || []).find((n) => n.id === targetId);
      if (!target) return;

      if (
        userEditedRef.current ||
        hasPendingDiskSaveRef.current ||
        ((isHtmlFile(target) || isCssFile(target) || isJsFile(target)) && codeEditorContentMap.has(targetId))
      ) {
        flushDebouncedContentSave(target);
        if (settings.autoSave) {
          void saveLinkedFileToDisk(target);
        }
      }
    };

    window.addEventListener("luno:flush-note-before-close", handleFlushBeforeClose);
    return () => {
      window.removeEventListener("luno:flush-note-before-close", handleFlushBeforeClose);
    };
  }, [note, notes, isHtmlFile, isCssFile, flushDebouncedContentSave, saveLinkedFileToDisk, settings.autoSave]);

  useEffect(() => {
    const handleInsertToActiveEditor = (e: Event) => {
      const customEvent = e as CustomEvent<{
        noteId?: string;
        text?: string;
        url?: string;
        title?: string;
        image?: { src: string; alt?: string; relativeSrc?: string };
        images?: Array<{ src: string; alt?: string; relativeSrc?: string }>;
        captionText?: string;
        onHandled?: () => void;
      }>;
      const { noteId, text, url, title, image, images, captionText, onHandled } = customEvent.detail || {};
      if (!editor || editor.isDestroyed) return;

      // Only handle TipTap-editable notes (markdown / plain text)
      if (
        note &&
        (isHtmlFile(note) ||
          isCssFile(note) ||
          isJsFile(note) ||
          isPdfFile(note) ||
          isImageFile(note) ||
          isAudioFile(note) ||
          isVideoFile(note))
      ) {
        return;
      }

      // If noteId is specified, only handle if it matches this editor's note
      if (noteId && note?.id && noteId !== note.id) return;

      try {
        const { state } = editor;
        const { selection, doc } = state;
        const isFocused = editor.isFocused;
        const hasCustomSelection = isFocused && selection.from > 1;

        const imageList = images && images.length > 0 ? images : image ? [image] : [];
        if (imageList.length > 0) {
          const validNodes: Array<Record<string, unknown>> = [];
          for (const img of imageList) {
            if (!img?.src || /^(javascript|vbscript):/i.test(img.src.trim())) continue;
            if (img.relativeSrc) {
              let decodedRel = img.relativeSrc;
              try {
                decodedRel = decodeURIComponent(img.relativeSrc);
              } catch {
                /* ignore malformed URI */
              }
              assetBlobUrlMap.current.set(img.relativeSrc, img.src);
              assetBlobUrlMap.current.set(decodedRel, img.src);
              assetBlobUrlMap.current.set(img.src, img.relativeSrc);
              imageLocalCache.set(img.relativeSrc, img.src);
              imageLocalCache.set(decodedRel, img.src);
            }
            validNodes.push({
              type: "image",
              attrs: {
                src: img.src,
                alt: img.alt || "",
                ...(img.relativeSrc ? { "data-relative-src": img.relativeSrc } : {}),
              },
            });
          }

          if (validNodes.length === 0) return;

          if (hasCustomSelection) {
            editor.chain().focus().insertContent([...validNodes, { type: "paragraph" }]).run();
          } else {
            const endPos = doc.content.size;
            editor.chain().focus().insertContentAt(endPos, [...validNodes, { type: "paragraph" }]).run();
          }

          const extraCaption = (captionText || "").trim();
          if (extraCaption) {
            const captionHtml = toEditorHtml(extraCaption, isTxtFile(note), false);
            const nextEndPos = editor.state.doc.content.size;
            editor.chain().focus().insertContentAt(nextEndPos, captionHtml).run();
          }
        } else if ((url || "").trim()) {
          const targetUrl = (url || "").trim();
          const displayText = (title || "").trim() || targetUrl;
          const linkNode = {
            type: "text",
            text: displayText,
            marks: [{ type: "link", attrs: { href: targetUrl } }],
          };

          if (hasCustomSelection) {
            if (!selection.empty) {
              editor.chain().focus().setLink({ href: targetUrl }).run();
            } else {
              editor.chain().focus().insertContent([linkNode, { type: "text", text: " " }]).run();
            }
          } else {
            // If the last node in the document is an empty paragraph, insert directly into it
            const lastChild = doc.lastChild;
            if (lastChild && lastChild.type.name === "paragraph" && lastChild.content.size === 0) {
              const pos = Math.max(1, doc.content.size - 1);
              editor.chain().focus().insertContentAt(pos, linkNode).run();
            } else {
              // Append exactly one new paragraph with the link
              const endPos = doc.content.size;
              editor.chain().focus().insertContentAt(endPos, {
                type: "paragraph",
                content: [linkNode],
              }).run();
            }
          }
        } else if ((text || "").trim()) {
          const html = toEditorHtml(text!.trim(), isTxtFile(note), false);
          if (hasCustomSelection) {
            editor.chain().focus().insertContent(html).run();
          } else {
            const endPos = doc.content.size;
            editor.chain().focus().insertContentAt(endPos, html).run();
          }
        } else {
          return;
        }

        userEditedRef.current = true;
        hasPendingDiskSaveRef.current = true;
        if (note) {
          flushDebouncedContentSave(note);
          if (settings.autoSave) {
            void saveLinkedFileToDisk(note);
          }
        }
        onHandled?.();
      } catch (err) {
        console.warn("Failed inserting content into editor:", err);
      }
    };

    window.addEventListener("luno:insert-to-active-editor", handleInsertToActiveEditor);
    return () => {
      window.removeEventListener("luno:insert-to-active-editor", handleInsertToActiveEditor);
    };
  }, [editor, note, flushDebouncedContentSave, saveLinkedFileToDisk, settings.autoSave]);

  useEffect(() => {
    if (!editor) return;

    if (!note) {
      if (editorActiveNoteIdRef.current) {
        editorActiveNoteIdRef.current = null;
        activeNoteRef.current = null;
        userEditedRef.current = false;
        hasPendingDiskSaveRef.current = false;
        try {
          const cleanState = EditorState.create({
            doc: editor.state.schema.topNodeType.createAndFill() || editor.state.doc,
            plugins: editor.state.plugins,
          });
          editor.view.updateState(cleanState);
          setEditorTick((v) => (v + 1) % 1000000);
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const baseTitle = getBaseTitle(note);

    // If editor is already showing content for this exact active note and it was not closed, sync Title H1 if fileName was changed externally
    if (editorActiveNoteIdRef.current === note.id && !closedNoteIds.has(note.id)) {
      activeNoteRef.current = note;
      if (!isTxtFile(note)) {
        const firstChild = editor.state.doc.firstChild;
        if (firstChild && firstChild.type.name === "heading" && firstChild.attrs?.level === 1) {
          const currentH1 = (firstChild.textContent || "").trim();
          const isInternalRename =
            internalH1RenameRef.current !== null &&
            (internalH1RenameRef.current === currentH1 ||
              internalH1RenameRef.current === baseTitle ||
              currentH1.startsWith(internalH1RenameRef.current) ||
              baseTitle.startsWith(internalH1RenameRef.current));
          if (!editor.isFocused && !userEditedRef.current && !isInternalRename && baseTitle && currentH1 !== baseTitle) {
            syncingFromNote.current = true;
            const tr = editor.state.tr;
            tr.setMeta("addToHistory", false);
            tr.setMeta("isSync", true);
            const from = 1;
            const to = Math.max(1, 1 + firstChild.nodeSize - 2);
            if (from <= to) {
              tr.replaceWith(from, to, editor.schema.text(baseTitle));
              editor.view.dispatch(tr);
            }
            syncingFromNote.current = false;
          }
          if (internalH1RenameRef.current !== null && (baseTitle === internalH1RenameRef.current || currentH1 === internalH1RenameRef.current)) {
            internalH1RenameRef.current = null;
          }
        }
      }
      return;
    }

    // Save previous active note's state and scroll position into map before switching to new note
    if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== note.id) {
      if (debounceRenameTimeoutRef.current) {
        clearTimeout(debounceRenameTimeoutRef.current);
        debounceRenameTimeoutRef.current = null;
      }
      pendingRenameRef.current = null;

      const prevId = editorActiveNoteIdRef.current;
      const prevNote = activeNoteRef.current;
      if (editor && !editor.isDestroyed && livePreviewPluginKey.getState(editor.state)?.activeBlock) {
        editor.view.dispatch(
          editor.state.tr
            .setMeta(livePreviewPluginKey, { collapse: true })
            .setMeta("addToHistory", false)
        );
      }
      if (userEditedRef.current && prevNote) {
        flushDebouncedContentSave(prevNote);
      }
      if (hasPendingDiskSaveRef.current && prevNote && settings.autoSave) {
        void saveLinkedFileToDisk(prevNote);
      }
      if (!closedNoteIds.has(prevId)) {
        if (editor?.state && !isStrictReadingModeRef.current && !isHtmlFile(prevNote) && !isCssFile(prevNote) && !isJsFile(prevNote)) {
          noteEditorStateMap.set(prevId, editor.state);
        }
        if (editorScrollContainerRef.current && !isHtmlFile(prevNote) && !isCssFile(prevNote) && !isJsFile(prevNote)) {
          const container = editorScrollContainerRef.current;
          if (container.scrollTop > 0) {
            setNoteScrollPosition(prevId, container.scrollTop);
          }
        }
      }
    }

    if ((note.isLocked && !note.isDecrypted) || isEncryptedNote(note.content)) {
      editorActiveNoteIdRef.current = null;
      activeNoteRef.current = null;
      userEditedRef.current = false;
      hasPendingDiskSaveRef.current = false;
      noteEditorStateMap.delete(note.id);
      try {
        const cleanState = EditorState.create({
          doc: editor.state.schema.topNodeType.createAndFill() || editor.state.doc,
          plugins: editor.state.plugins,
        });
        editor.view.updateState(cleanState);
        setEditorTick((v) => (v + 1) % 1000000);
      } catch {
        /* ignore */
      }
      return;
    }

    if (isHtmlFile(note) || isCssFile(note) || isJsFile(note)) {
      if (debounceRenameTimeoutRef.current) {
        clearTimeout(debounceRenameTimeoutRef.current);
        debounceRenameTimeoutRef.current = null;
      }
      pendingRenameRef.current = null;
      editorActiveNoteIdRef.current = note.id;
      activeNoteRef.current = note;
      closedNoteIds.delete(note.id);
      userEditedRef.current = false;
      hasPendingDiskSaveRef.current = false;
      if (!note.content && !codeEditorContentMap.has(note.id)) {
        try {
          const backup = localStorage.getItem(`luno_backup_${note.id}`) ||
                         (note.fileName ? localStorage.getItem(`luno_backup_fn_${note.fileName}`) : null);
          if (backup) {
            codeEditorContentMap.set(note.id, backup);
            onUpdate(note.id, { content: backup });
          }
        } catch {
          /* ignore */
        }
      }
      return;
    }

    // Since this note is now active and being viewed/edited, remove it from closedNoteIds
    closedNoteIds.delete(note.id);

    // Check if this note already has a preserved editor state (from an open tab)
    const savedState = noteEditorStateMap.get(note.id);
    if (savedState) {
      if (!isStrictReadingMode && hasReadingModeFootnotesDoc(savedState.doc)) {
        noteEditorStateMap.delete(note.id);
      } else {
        syncingFromNote.current = true;
        editorActiveNoteIdRef.current = note.id;
        activeNoteRef.current = note;
        editor.view.updateState(savedState);
        if (note?.id) {
          editor.view.dispatch(
            editor.state.tr
              .setMeta("addToHistory", false)
              .setMeta(spellCheckPluginKey, { recompute: true, enabled: spellCheckEnabled })
              .setMeta(headingTogglePluginKey, {
                setNoteInfo: { noteId: note.id, fileName: note.fileName, restore: true },
              })
          );
        }
        if (isStrictReadingMode) {
          editor.setEditable(false);
          const rawContent = noteRef.current?.content ?? note.content ?? "";
          if (/\[\^[^\]]+\]/.test(rawContent)) {
            const parsed = parseEditorContent(rawContent, baseTitle, isTxtFile(note), isHtmlFile(note), true);
            (editor.commands.setContent as any)(parsed as string, false, { preserveWhitespace: "full" });
          }
        } else if (isReadingLivePreview) {
          editor.setEditable(true);
          if (livePreviewPluginKey.getState(editor.state)?.activeBlock) {
            editor.view.dispatch(
              editor.state.tr
                .setMeta(livePreviewPluginKey, { collapse: true })
                .setMeta("addToHistory", false)
            );
          }
        }
        userEditedRef.current = false;
        hasPendingDiskSaveRef.current = false;
        if (debouncedContentSaveTimeoutRef.current) {
          clearTimeout(debouncedContentSaveTimeoutRef.current);
          debouncedContentSaveTimeoutRef.current = null;
        }
        if (autoSaveDiskTimeoutRef.current) {
          clearTimeout(autoSaveDiskTimeoutRef.current);
          autoSaveDiskTimeoutRef.current = null;
        }
        setSaveStatus("saved");
        syncingFromNote.current = false;
        loadingNoteIdRef.current = null;
        setEditorTick((v) => v + 1);
        restoreScrollPosition(note.id);
        return;
      }
    }

    loadingNoteIdRef.current = note.id;
    let noteContent = note.content ?? "";
    if (!noteContent.trim()) {
      try {
        const backup = localStorage.getItem(`luno_backup_${note.id}`) ||
                       (note.fileName ? localStorage.getItem(`luno_backup_fn_${note.fileName}`) : null);
        if (backup && backup.trim() && !isEncryptedNote(backup)) {
          noteContent = backup;
        }
      } catch {
        /* ignore */
      }
    }
    const parsed = parseEditorContent(noteContent, baseTitle, isTxtFile(note), isHtmlFile(note), Boolean(isStrictReadingMode));

    syncingFromNote.current = true;
    editorActiveNoteIdRef.current = note.id;
    activeNoteRef.current = note;
    if (note?.id) {
      editor.view.dispatch(
        editor.state.tr
          .setMeta("addToHistory", false)
          .setMeta("isSync", true)
          .setMeta(headingTogglePluginKey, {
            setNoteInfo: { noteId: note.id, fileName: note.fileName, restore: false },
          })
      );
    }
    (editor.commands.setContent as any)(parsed as string, false, { preserveWhitespace: "full" });
    void resolveRelativeImagesInEditor(editor);

    if (!isTxtFile(note)) {
      const firstChild = editor.state.doc.firstChild;
      if (firstChild && firstChild.type.name === "heading" && firstChild.attrs?.level === 1) {
        const currentH1 = (firstChild.textContent || "").trim();
        if (baseTitle && currentH1 !== baseTitle) {
          const tr = editor.state.tr;
          tr.setMeta("addToHistory", false);
          tr.setMeta("isSync", true);
          const from = 1;
          const to = 1 + firstChild.nodeSize - 2;
          tr.replaceWith(from, to, editor.schema.text(baseTitle));
          editor.view.dispatch(tr);
        }
      }
    }

    // Reset history stack for the freshly loaded note document so undo/redo are clean (depth: 0)
    const cleanState = EditorState.create({
      doc: editor.state.doc,
      plugins: editor.state.plugins,
    });
    editor.view.updateState(cleanState);
    if (note?.id) {
      editor.view.dispatch(
        editor.state.tr
          .setMeta("addToHistory", false)
          .setMeta(headingTogglePluginKey, {
            setNoteInfo: { noteId: note.id, fileName: note.fileName, restore: true },
          })
      );
    }
    if (!isStrictReadingMode) {
      noteEditorStateMap.set(note.id, editor.state);
    }

    userEditedRef.current = false;
    hasPendingDiskSaveRef.current = false;
    if (debouncedContentSaveTimeoutRef.current) {
      clearTimeout(debouncedContentSaveTimeoutRef.current);
      debouncedContentSaveTimeoutRef.current = null;
    }
    if (autoSaveDiskTimeoutRef.current) {
      clearTimeout(autoSaveDiskTimeoutRef.current);
      autoSaveDiskTimeoutRef.current = null;
    }
    setSaveStatus("saved");

    setEditorTick((v) => v + 1);
    syncingFromNote.current = false;
    loadingNoteIdRef.current = null;
    restoreScrollPosition(note.id);
  }, [editor, note?.id, note?.fileName, note?.title, getBaseTitle, restoreScrollPosition, flushDebouncedContentSave, saveLinkedFileToDisk, settings.autoSave, isVisible]);

  // Save active note state on unmount or switching note, and flush pending saves
  useEffect(() => {
    return () => {
      if (typingTickTimeoutRef.current) {
        clearTimeout(typingTickTimeoutRef.current);
        typingTickTimeoutRef.current = null;
      }
      if (cursorScrollRafRef.current !== null) {
        cancelAnimationFrame(cursorScrollRafRef.current);
        cursorScrollRafRef.current = null;
      }
      if (debouncedContentSaveTimeoutRef.current) {
        clearTimeout(debouncedContentSaveTimeoutRef.current);
        debouncedContentSaveTimeoutRef.current = null;
      }
      if (debouncedVersionSnapshotTimeoutRef.current) {
        clearTimeout(debouncedVersionSnapshotTimeoutRef.current);
        debouncedVersionSnapshotTimeoutRef.current = null;
      }
      if (autoSaveDiskTimeoutRef.current) {
        clearTimeout(autoSaveDiskTimeoutRef.current);
        autoSaveDiskTimeoutRef.current = null;
      }
      const target = activeNoteRef.current || noteRef.current;
      if (editor && !editor.isDestroyed && livePreviewPluginKey.getState(editor.state)?.activeBlock) {
        editor.view.dispatch(
          editor.state.tr
            .setMeta(livePreviewPluginKey, { collapse: true })
            .setMeta("addToHistory", false)
        );
      }
      if (target?.id && !closedNoteIds.has(target.id)) {
        if (editor && !editor.isDestroyed && !isStrictReadingModeRef.current && !isHtmlFile(target) && !isCssFile(target) && !isJsFile(target)) {
          noteEditorStateMap.set(target.id, editor.state);
        }
        if (editorScrollContainerRef.current && !isHtmlFile(target) && !isCssFile(target) && !isJsFile(target)) {
          const container = editorScrollContainerRef.current;
          if (container.scrollTop > 0) {
            setNoteScrollPosition(target.id, container.scrollTop);
          }
        }
      }
      if (userEditedRef.current && target) {
        flushDebouncedContentSave(target);
      } else if (pendingSaveContentRef.current) {
        const pending = pendingSaveContentRef.current;
        pendingSaveContentRef.current = null;
        if (userEditedRef.current && target && pending.id === target.id) {
          onUpdate(pending.id, { content: pending.content });
        }
        userEditedRef.current = false;
      }
      if (hasPendingDiskSaveRef.current && target && settings.autoSave) {
        void saveLinkedFileToDisk(target);
      }
      hasPendingDiskSaveRef.current = false;
    };
  }, [editor, onUpdate, note?.id, flushDebouncedContentSave, saveLinkedFileToDisk, settings.autoSave]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      parseOptions: {
        preserveWhitespace: "full",
      },
      editorProps: {
        transformPastedHTML: (html: string) => sanitizeHtml(html),
        attributes: {
          style: `font-size:${editorFontSize}px;line-height:${settings.lineHeight};`,
          class: `${EDITOR_CLASSES} ${
            isReadingMode
              ? isReadingLivePreview
                ? "luno-reading-view luno-reading-live-preview cursor-text"
                : "luno-reading-view !cursor-default"
              : "cursor-text"
          } ${
            settings.accentHeadings
              ? "[&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary [&>h1:first-child]:text-primary"
              : "[&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-muted-foreground [&>h1:first-child]:text-foreground"
          }`,
          spellcheck: "false",
          "data-spellcheck-enabled": spellCheckEnabled ? "true" : "false",
          lang: settings.language || "en",
        },
      },
    });
    if (editor?.view?.dom) {
      editor.view.dom.setAttribute("spellcheck", "false");
      editor.view.dom.setAttribute("data-spellcheck-enabled", spellCheckEnabled ? "true" : "false");
      editor.view.dom.setAttribute("lang", settings.language || "en");
    }
  }, [editor, editorFontSize, settings.lineHeight, settings.accentHeadings, isReadingMode, isReadingLivePreview, settings.language, spellCheckEnabled]);

  const prevReadingModeRef = useRef(isReadingMode);
  useEffect(() => {
    isReadingModeRef.current = isReadingMode;
    isStrictReadingModeRef.current = isReadingMode;
    if (!editor || editor.isDestroyed) return;
    if (prevReadingModeRef.current === isReadingMode) {
      if (editor.isEditable !== !isReadingMode) {
        editor.setEditable(!isReadingMode);
      }
      return;
    }
    const enteringReadingMode = isReadingMode;
    prevReadingModeRef.current = isReadingMode;

    if (!note) {
      if (editor.isEditable !== !isReadingMode) {
        editor.setEditable(!isReadingMode);
      }
      return;
    }

    const prevScroll = editorScrollContainerRef.current?.scrollTop;

    if (enteringReadingMode) {
      // Edit Mode -> Reading Mode: collapse any active Live Preview line first, flush saves, then enter read-only Reading Mode
      syncingFromNote.current = true;
      if (livePreviewPluginKey.getState(editor.state)?.activeBlock) {
        editor.view.dispatch(
          editor.state.tr
            .setMeta(livePreviewPluginKey, { collapse: true })
            .setMeta("addToHistory", false)
        );
      }
      if (userEditedRef.current && note) {
        flushDebouncedContentSave(note);
      }
      if (note.id && !hasReadingModeFootnotesDoc(editor.state.doc)) {
        noteEditorStateMap.set(note.id, editor.state);
      }
      userEditedRef.current = false;
      hasPendingDiskSaveRef.current = false;
      if (debouncedContentSaveTimeoutRef.current) {
        clearTimeout(debouncedContentSaveTimeoutRef.current);
        debouncedContentSaveTimeoutRef.current = null;
      }
      if (autoSaveDiskTimeoutRef.current) {
        clearTimeout(autoSaveDiskTimeoutRef.current);
        autoSaveDiskTimeoutRef.current = null;
      }

      editor.setEditable(false);

      const rawContent = noteRef.current?.content ?? note.content ?? "";
      const hasFootnotes = /\[\^[^\]]+\]/.test(rawContent);
      if (hasFootnotes) {
        const isTxt = isTxtFile(note);
        const isHtml = isHtmlFile(note);
        const baseTitle = getBaseTitle(note);
        const parsed = parseEditorContent(rawContent, baseTitle, isTxt, isHtml, true);
        (editor.commands.setContent as any)(parsed as string, false, { preserveWhitespace: "full" });
      }

      userEditedRef.current = false;
      hasPendingDiskSaveRef.current = false;
      syncingFromNote.current = false;
    } else {
      // Reading Mode -> Edit Mode:
      syncingFromNote.current = true;
      userEditedRef.current = false;
      hasPendingDiskSaveRef.current = false;
      if (debouncedContentSaveTimeoutRef.current) {
        clearTimeout(debouncedContentSaveTimeoutRef.current);
        debouncedContentSaveTimeoutRef.current = null;
      }
      if (autoSaveDiskTimeoutRef.current) {
        clearTimeout(autoSaveDiskTimeoutRef.current);
        autoSaveDiskTimeoutRef.current = null;
      }

      editor.setEditable(true);

      const rawContent = noteRef.current?.content ?? note.content ?? "";
      const hasFootnotes = /\[\^[^\]]+\]/.test(rawContent);
      const savedState = note.id ? noteEditorStateMap.get(note.id) : null;
      const isSavedStateValid = savedState && !hasReadingModeFootnotesDoc(savedState.doc);

      if (isSavedStateValid && !hasFootnotes) {
        editor.view.updateState(savedState);
        if (note.id) {
          editor.view.dispatch(
            editor.state.tr
              .setMeta("addToHistory", false)
              .setMeta(spellCheckPluginKey, { recompute: true, enabled: spellCheckEnabled })
              .setMeta(headingTogglePluginKey, {
                setNoteInfo: { noteId: note.id, fileName: note.fileName, restore: true },
              })
          );
        }
      } else {
        // If note has footnotes or savedState was tainted, always parse fresh clean Edit-Mode content!
        const isTxt = isTxtFile(note);
        const isHtml = isHtmlFile(note);
        const baseTitle = getBaseTitle(note);
        const parsed = parseEditorContent(rawContent, baseTitle, isTxt, isHtml, false);
        (editor.commands.setContent as any)(parsed as string, false, { preserveWhitespace: "full" });
        const cleanState = EditorState.create({
          doc: editor.state.doc,
          plugins: editor.state.plugins,
        });
        editor.view.updateState(cleanState);
        if (note.id) {
          editor.view.dispatch(
            editor.state.tr
              .setMeta("addToHistory", false)
              .setMeta(headingTogglePluginKey, {
                setNoteInfo: { noteId: note.id, fileName: note.fileName, restore: true },
              })
          );
          noteEditorStateMap.set(note.id, editor.state);
        }
      }
      userEditedRef.current = false;
      hasPendingDiskSaveRef.current = false;
      syncingFromNote.current = false;
      setEditorTick((v) => v + 1);
    }

    if (typeof prevScroll === "number" && editorScrollContainerRef.current) {
      editorScrollContainerRef.current.scrollTop = prevScroll;
    }
  }, [editor, isReadingMode, getBaseTitle, isTxtFile, isHtmlFile, note?.id, flushDebouncedContentSave]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (!readingModeLivePreviewEnabled || isReadingMode) {
      if (livePreviewPluginKey.getState(editor.state)?.activeBlock) {
        editor.view.dispatch(
          editor.state.tr
            .setMeta(livePreviewPluginKey, { collapse: true })
            .setMeta("addToHistory", false)
        );
      }
    } else if (editor.isFocused && !livePreviewPluginKey.getState(editor.state)?.activeBlock) {
      editor.view.dispatch(
        editor.state.tr
          .setMeta(livePreviewPluginKey, { focus: true })
          .setMeta("addToHistory", false)
      );
    }
  }, [editor, readingModeLivePreviewEnabled, isReadingMode]);

  useEffect(() => {
    setGlobalSpellCheckEnabled(spellCheckEnabled);
    if (!spellCheckEnabled) {
      setContextSpellData(null);
    }
    if (!editor || editor.isDestroyed) return;
    if (editor?.view?.dom) {
      editor.view.dom.setAttribute("data-spellcheck-enabled", spellCheckEnabled ? "true" : "false");
    }
    editor.extensionManager.extensions.forEach((ext) => {
      if (ext.name === "spellCheckDecoration") {
        ext.options.enabled = spellCheckEnabled;
      }
      if (ext.name === "wrongLanguageSuggestion") {
        ext.options.enabled = settings.wrongLanguageSuggestion !== false;
      }
    });
    const tr = editor.state.tr
      .setMeta("addToHistory", false)
      .setMeta(spellCheckPluginKey, { recompute: true, enabled: spellCheckEnabled });
    editor.view.dispatch(tr);
    const currentActiveId = editorActiveNoteIdRef.current;
    if (currentActiveId && !isStrictReadingModeRef.current && !syncingFromNote.current) {
      noteEditorStateMap.set(currentActiveId, editor.state);
    }
  }, [editor, spellCheckEnabled, settings.wrongLanguageSuggestion]);

  const toggleHeadingEnabled = (settings as any).toggleHeading !== false;
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.extensionManager.extensions.forEach((ext) => {
      if (ext.name === "headingToggle") {
        ext.options.enabled = toggleHeadingEnabled;
      }
    });
    const tr = editor.state.tr
      .setMeta("addToHistory", false)
      .setMeta(headingTogglePluginKey, { recompute: true });
    editor.view.dispatch(tr);
  }, [editor, toggleHeadingEnabled]);


  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(editor.state.tr.setMeta("addToHistory", false));
  }, [editor, settings.language, t]);

  useEffect(() => {
    const updateWidth = () => {
      setMobileToolbarWidth(mobileToolbarAreaRef.current?.clientWidth ?? 0);
    };

    updateWidth();

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => updateWidth())
      : null;

    if (observer && mobileToolbarAreaRef.current) {
      observer.observe(mobileToolbarAreaRef.current);
    }

    window.addEventListener("resize", updateWidth);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const shouldUseMobileOverflow = mobileToolbarWidth > 0 && mobileToolbarWidth < MOBILE_FULL_TOOLBAR_MIN_WIDTH;
  // Receive insertions from global FloatingTranslator & FloatingAudioRecorder hosted in Index.tsx
  useEffect(() => {
    const isTargetPane = (targetPaneId?: string) => {
      if (targetPaneId) return targetPaneId === paneId;
      return paneId === "main" || paneId === "left" || Boolean(editor?.isFocused);
    };

    const handleInsertTranslationEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string; paneId?: string }>).detail;
      if (!detail?.text || !isTargetPane(detail.paneId)) return;
      handleInsertTranslation(detail.text);
    };

    const handleInsertAudioEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ src: string; title: string; relativeSrc?: string; paneId?: string }>).detail;
      if (!detail || !editor || !isTargetPane(detail.paneId)) return;
      const targetTitle = detail.title || `Voice Note - ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const targetRel =
        detail.relativeSrc ||
        `attachments/${targetTitle.endsWith(".webm") || targetTitle.endsWith(".mp3") ? targetTitle : `${targetTitle}.webm`}`;
      let decodedRel = targetRel;
      try {
        decodedRel = decodeURIComponent(targetRel);
      } catch {
        /* ignore malformed URI */
      }
      if (detail.src) {
        assetBlobUrlMap.current.set(targetRel, detail.src);
        assetBlobUrlMap.current.set(decodedRel, detail.src);
        assetBlobUrlMap.current.set(detail.src, targetRel);
        audioLocalCache.set(targetRel, detail.src);
        audioLocalCache.set(decodedRel, detail.src);
      }
      editor.chain().focus().insertContent({
        type: "audio",
        attrs: {
          src: detail.src,
          title: targetTitle,
          "data-relative-src": targetRel,
        },
      }).run();
    };

    window.addEventListener("luno:insert-translation", handleInsertTranslationEvent);
    window.addEventListener("luno:insert-audio", handleInsertAudioEvent);
    return () => {
      window.removeEventListener("luno:insert-translation", handleInsertTranslationEvent);
      window.removeEventListener("luno:insert-audio", handleInsertAudioEvent);
    };
  }, [paneId, editor, handleInsertTranslation, assetBlobUrlMap]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : "";
      const code = e.code || "";

      // Target element check for editable fields
      const target = e.target as HTMLElement | null;
      const isTyping = Boolean(
        target && (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest("input, textarea, [contenteditable='true'], [role='textbox'], dialog[open]")
        )
      );

      // PDF Editor shortcuts (when viewing a PDF note)
      if (isPdfFile(note)) {
        if (ctrl && !e.altKey) {
          // Ctrl + S (Save Note)
          if ((key === "s" || code === "KeyS" || key === "ห") && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSaveFile();
            return;
          }
          // Ctrl + F (Search PDF)
          if (!e.shiftKey && (key === "f" || code === "KeyF" || key === "ด")) {
            e.preventDefault();
            e.stopPropagation();
            handleOpenPdfSearch();
            return;
          }
          // Ctrl + P (Print PDF)
          if (!e.shiftKey && (key === "p" || code === "KeyP" || key === "ย")) {
            e.preventDefault();
            e.stopPropagation();
            void pdfEditorRef.current?.printPdf();
            return;
          }
          // Ctrl + Z (Undo)
          if (!e.shiftKey && (key === "z" || code === "KeyZ" || key === "ผ")) {
            e.preventDefault();
            e.stopPropagation();
            if (pdfEditorRef.current?.undo) {
              pdfEditorRef.current.undo();
            } else {
              pdfEditorRef.current?.sendCommand("undo");
            }
            return;
          }
          // Ctrl + Y or Ctrl + Shift + Z (Redo)
          if ((!e.shiftKey && (key === "y" || code === "KeyY" || key === "ั")) || (e.shiftKey && (key === "z" || code === "KeyZ" || key === "ผ"))) {
            e.preventDefault();
            e.stopPropagation();
            if (pdfEditorRef.current?.redo) {
              pdfEditorRef.current.redo();
            } else {
              pdfEditorRef.current?.sendCommand("redo");
            }
            return;
          }
          // Ctrl + + / Ctrl + = (Zoom In)
          if (key === "+" || key === "=" || code === "Equal" || code === "NumpadAdd") {
            e.preventDefault();
            e.stopPropagation();
            pdfEditorRef.current?.sendCommand("zoomIn");
            return;
          }
          // Ctrl + - / Ctrl + _ (Zoom Out)
          if (key === "-" || key === "_" || code === "Minus" || code === "NumpadSubtract") {
            e.preventDefault();
            e.stopPropagation();
            pdfEditorRef.current?.sendCommand("zoomOut");
            return;
          }
          // Ctrl + 0 (Reset Zoom)
          if (key === "0" || code === "Digit0" || code === "Numpad0") {
            e.preventDefault();
            e.stopPropagation();
            pdfEditorRef.current?.sendCommand("zoomReset");
            return;
          }
        } else if (!ctrl && !e.altKey && !isTyping) {
          // Delete / Backspace: Delete selected annotation item
          if (key === "delete" || code === "Delete" || key === "backspace" || code === "Backspace") {
            if (pdfViewerStateRef.current?.hasSelection) {
              e.preventDefault();
              e.stopPropagation();
              pdfEditorRef.current?.sendCommand("deleteSelected");
              setPdfViewerState((prev) => (prev ? { ...prev, hasSelection: false, selectedMeta: null } : null));
              return;
            }
          }
          // Escape: Deselect annotation / revert tool to select
          if (key === "escape" || code === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            pdfEditorRef.current?.sendCommand("clearSelection");
            setPdfViewerState((prev) => (prev ? { ...prev, hasSelection: false, selectedMeta: null } : null));
            const curTool = pdfActiveToolRef.current || pdfViewerStateRef.current?.currentTool;
            if (curTool && curTool !== "select" && curTool !== "contentSelect") {
              handleSelectPdfTool("select");
            }
            return;
          }
          // Single-key Tool Switching (V, I, P, H, E, T, R, O, L, A) - supports both English and Thai keyboard layouts
          if (!e.shiftKey) {
            const toolByCodeMap: Record<string, InkoTool> = {
              KeyV: "select",
              KeyI: "contentSelect",
              KeyP: "pen",
              KeyH: "highlighter",
              KeyE: "eraser",
              KeyT: "text",
              KeyR: "rectangle",
              KeyO: "circle",
              KeyL: "line",
              KeyA: "arrow",
            };
            const toolByKeyMap: Record<string, InkoTool> = {
              v: "select",
              i: "contentSelect",
              p: "pen",
              h: "highlighter",
              e: "eraser",
              t: "text",
              r: "rectangle",
              o: "circle",
              l: "line",
              a: "arrow",
              // Thai Kedmanee layout mappings
              "อ": "select",
              "ร": "contentSelect",
              "ย": "pen",
              "้": "highlighter",
              "ำ": "eraser",
              "ะ": "text",
              "พ": "rectangle",
              "น": "circle",
              "ส": "line",
              "ฟ": "arrow",
            };
            const targetTool = toolByCodeMap[code] || toolByKeyMap[key];
            if (targetTool) {
              e.preventDefault();
              e.stopPropagation();
              if (targetTool === "rectangle" || targetTool === "circle" || targetTool === "line" || targetTool === "arrow") {
                setLastPdfShape(targetTool);
              }
              handleSelectPdfTool(targetTool);
              return;
            }
          }
        }
      }

      // If not Ctrl, stop here for non-PDF shortcuts
      if (!ctrl) return;

      // Ctrl + S (Save Note) — only active/focused pane (or main pane when no editor pane is focused)
      if ((key === "s" || code === "KeyS" || key === "ห") && !e.shiftKey && !e.altKey) {
        const activeInThisEditor =
          Boolean(editor && !editor.isDestroyed && editor.isFocused) ||
          Boolean(target?.closest?.(`[data-editor-pane="${paneId}"]`));
        const activeInAnyEditorPane = Boolean(target?.closest?.("[data-editor-pane]"));
        if (!activeInThisEditor && (activeInAnyEditorPane || paneId !== "main")) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleSaveFile();
        return;
      }

      // Formatting shortcuts below require this editor instance to be actively focused
      if (!editor || editor.isDestroyed || !editor.isFocused) return;

      // Ctrl + B (Bold Text)
      if ((key === "b" || code === "KeyB") && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleBold().run();
        return;
      }

      // Ctrl + I (Italic Text)
      if ((key === "i" || code === "KeyI") && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleItalic().run();
        return;
      }

      // Ctrl + U (Underline Text)
      if ((key === "u" || code === "KeyU") && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleUnderline().run();
        return;
      }

      // Ctrl + Shift + X or Alt + Shift + 5 (Strikethrough)
      if ((e.shiftKey && (key === "x" || code === "KeyX")) || (e.altKey && e.shiftKey && (key === "5" || code === "Digit5"))) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleStrike().run();
        return;
      }

      // Ctrl + Shift + H (Highlight Text)
      if (e.shiftKey && (key === "h" || code === "KeyH")) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleHighlight().run();
        return;
      }

      // Ctrl + . or Ctrl + Shift + . (Superscript)
      if ((key === "." || key === ">" || code === "Period") && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleSuperscript().run();
        return;
      }

      // Ctrl + Shift + , (Subscript)
      if ((key === "," || key === "<" || code === "Comma") && e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleSubscript().run();
        return;
      }

      // Ctrl + Shift + E or Ctrl + ` (Inline Code)
      if ((e.shiftKey && (key === "e" || code === "KeyE")) || key === "`" || code === "Backquote") {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleCode().run();
        return;
      }

      // Ctrl + Shift + 7 (Numbered List)
      if (e.shiftKey && (key === "7" || code === "Digit7" || code === "Numpad7")) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleOrderedList().run();
        return;
      }

      // Ctrl + Shift + 8 (Bullet List)
      if (e.shiftKey && (key === "8" || key === "*" || code === "Digit8" || code === "Numpad8")) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleBulletList().run();
        return;
      }

      // Ctrl + Shift + 9 (Task / Todo List)
      if (e.shiftKey && (key === "9" || code === "Digit9" || code === "Numpad9")) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleTaskList().run();
        return;
      }

      // Ctrl + Shift + Q (Blockquote)
      if (e.shiftKey && (key === "q" || code === "KeyQ")) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleBlockquote().run();
        return;
      }

      // Ctrl + Alt + C (Code Block)
      if (e.altKey && (key === "c" || code === "KeyC")) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().toggleCodeBlock().run();
        return;
      }

      // Ctrl + K (Insert / Edit Link in Editor)
      if ((key === "k" || code === "KeyK") && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        openLinkDialog();
        return;
      }

      // Ctrl + Shift + N (Clear Formatting)
      if (e.shiftKey && (key === "n" || code === "KeyN")) {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().unsetAllMarks().unsetColor().unsetFontFamily().unsetFontSize().clearNodes().run();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [note, editor, handleSaveFile, handleOpenPdfSearch, handleSelectPdfTool]);
  const showUiAlert = (message: string) => setAlertMessage(message);
  const rememberSelection = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    editorSelectionRef.current = { from, to };
  };

  const getFocusedChain = () => {
    if (!editor) return null;

    let chain = editor.chain().focus();
    if (editorSelectionRef.current) {
      const docSize = editor.state.doc.content.size;
      const { from, to } = editorSelectionRef.current;
      if (typeof from === "number" && typeof to === "number" && from >= 0 && to <= docSize && from <= to) {
        chain = chain.setTextSelection({ from, to });
      }
      editorSelectionRef.current = null;
    }

    return chain;
  };

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^(javascript|vbscript):/i.test(trimmed)) return "";
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const insertImageToEditor = (attrs: { src: string; alt?: string; "data-relative-src"?: string; width?: number | null }): boolean => {
    if (!editor || !attrs || !attrs.src || /^(javascript|vbscript):/i.test(attrs.src.trim())) return false;

    // 1. Focus editor and check selection
    if (!editor.isFocused) {
      editor.commands.focus();
    }

    const savedSelection = editorSelectionRef.current;
    if (savedSelection) {
      const docSize = editor.state.doc.content.size;
      const { from, to } = savedSelection;
      if (typeof from === "number" && typeof to === "number" && from >= 0 && to <= docSize && from <= to) {
        editor.commands.setTextSelection({ from, to });
      }
      editorSelectionRef.current = null;
    }

    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    const parentNode = $from.parent;

    // 2. If inside a node that only accepts inline content (heading or codeBlock)
    if (parentNode.type.name === "heading" || parentNode.type.name === "codeBlock") {
      try {
        const afterPos = $from.after();
        const success = editor.chain().focus().insertContentAt(afterPos, [
          { type: "image", attrs },
          { type: "paragraph" },
        ]).run();
        if (success) return true;
      } catch (err) {
        console.warn("insertContentAt after heading/codeBlock failed:", err);
      }
    }

    // 3. If inside an empty paragraph, replace it directly
    if (parentNode.type.name === "paragraph" && parentNode.content.size === 0) {
      try {
        const fromPos = $from.before();
        const toPos = $from.after();
        const success = editor.chain().focus().insertContentAt({ from: fromPos, to: toPos }, [
          { type: "image", attrs },
          { type: "paragraph" },
        ]).run();
        if (success) return true;
      } catch (err) {
        console.warn("insertContentAt empty paragraph replacement failed:", err);
      }
    }

    // 4. Try normal setImage first
    try {
      const success = editor.chain().focus().setImage(attrs as any).run();
      if (success) return true;
    } catch (e) {
      console.warn("chain.setImage error:", e);
    }

    // 5. Try insertContent at selection
    try {
      const success = editor.commands.insertContent({ type: "image", attrs });
      if (success) return true;
    } catch (e) {
      console.warn("commands.insertContent error:", e);
    }

    // 6. Fallback: insert after current block
    try {
      const afterPos = $from.after();
      const success = editor.chain().focus().insertContentAt(afterPos, [
        { type: "image", attrs },
        { type: "paragraph" },
      ]).run();
      if (success) return true;
    } catch (e) {
      console.warn("insert afterPos failed:", e);
    }

    // 7. Direct ProseMirror schema transaction at top-level boundary
    try {
      const schema = editor.schema;
      const imageType = schema.nodes.image;
      if (imageType) {
        const imageNode = imageType.create(attrs);
        const pType = schema.nodes.paragraph;
        const pNode = pType ? pType.create() : null;
        const nodesToInsert = pNode ? [imageNode, pNode] : [imageNode];

        let insertPos = $from.after(1);
        if (typeof insertPos !== "number" || insertPos > editor.state.doc.content.size || insertPos < 0) {
          insertPos = editor.state.doc.content.size;
        }
        const tr = editor.state.tr.insert(insertPos, nodesToInsert);
        editor.view.dispatch(tr);
        return true;
      }
    } catch (e) {
      console.warn("Direct ProseMirror transaction failed:", e);
    }

    // 8. Ultimate fallback: insert at end of document
    try {
      const docEnd = editor.state.doc.content.size;
      const success = editor.commands.insertContentAt(docEnd, [
        { type: "image", attrs },
        { type: "paragraph" },
      ]);
      return !!success;
    } catch (err) {
      console.warn("insertImageToEditor fallback failed:", err);
      return false;
    }
  };

  const insertVideoToEditor = (attrs: { src: string; title?: string; "data-relative-src"?: string; width?: number | null; textAlign?: string }): boolean => {
    if (!editor || !attrs || !attrs.src || /^(javascript|vbscript):/i.test(attrs.src.trim())) return false;

    // 1. Focus editor and check selection
    if (!editor.isFocused) {
      editor.commands.focus();
    }

    const savedSelection = editorSelectionRef.current;
    if (savedSelection) {
      const docSize = editor.state.doc.content.size;
      const { from, to } = savedSelection;
      if (typeof from === "number" && typeof to === "number" && from >= 0 && to <= docSize && from <= to) {
        editor.commands.setTextSelection({ from, to });
      }
      editorSelectionRef.current = null;
    }

    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    const parentNode = $from.parent;

    const onInsertedSuccess = () => {
      userEditedRef.current = true;
      hasPendingDiskSaveRef.current = true;
      setLastEditedTime(Date.now());
      if (settings.autoSave) {
        setSaveStatus("auto_saving");
        scheduleAutoSaveDiskRef.current?.();
      } else {
        setSaveStatus("unsaved");
      }
      return true;
    };

    // 2. If a media node (video, image, audio) is selected or selection is at top level, insert after it instead of overwriting it!
    const selectedNode = (selection as any).node;
    if (selectedNode && ["video", "image", "audio"].includes(selectedNode.type?.name)) {
      try {
        const afterPos = selection.to;
        const success = editor.chain().focus().insertContentAt(afterPos, [
          { type: "video", attrs },
          { type: "paragraph" },
        ]).run();
        if (success) return onInsertedSuccess();
      } catch (err) {
        console.warn("insertContentAt after selected media node failed:", err);
      }
    }

    // 3. If inside a node that only accepts inline content (heading or codeBlock)
    if (parentNode.type.name === "heading" || parentNode.type.name === "codeBlock") {
      try {
        const afterPos = $from.after();
        const success = editor.chain().focus().insertContentAt(afterPos, [
          { type: "video", attrs },
          { type: "paragraph" },
        ]).run();
        if (success) return onInsertedSuccess();
      } catch (err) {
        console.warn("insertContentAt after heading/codeBlock failed:", err);
      }
    }

    // 4. If inside an empty paragraph, replace it directly and provide trailing paragraph
    if (parentNode.type.name === "paragraph" && parentNode.content.size === 0) {
      try {
        const fromPos = $from.before();
        const toPos = $from.after();
        const success = editor.chain().focus().insertContentAt({ from: fromPos, to: toPos }, [
          { type: "video", attrs },
          { type: "paragraph" },
        ]).run();
        if (success) return onInsertedSuccess();
      } catch (err) {
        console.warn("insertContentAt empty paragraph replacement failed:", err);
      }
    }

    // 5. Try normal setVideo first (which appends a trailing paragraph)
    try {
      const success = (editor.chain().focus() as any).setVideo(attrs).run();
      if (success) return onInsertedSuccess();
    } catch (e) {
      console.warn("chain.setVideo error:", e);
    }

    // 6. Try insertContent at selection
    try {
      const success = editor.commands.insertContent([
        { type: "video", attrs },
        { type: "paragraph" },
      ]);
      if (success) return onInsertedSuccess();
    } catch (e) {
      console.warn("commands.insertContent error:", e);
    }

    // 7. Fallback: insert after current block
    try {
      const afterPos = $from.after();
      const success = editor.chain().focus().insertContentAt(afterPos, [
        { type: "video", attrs },
        { type: "paragraph" },
      ]).run();
      if (success) return onInsertedSuccess();
    } catch (e) {
      console.warn("insert afterPos failed:", e);
    }

    // 8. Direct ProseMirror schema transaction at top-level boundary
    try {
      const schema = editor.schema;
      const videoType = schema.nodes.video;
      const pType = schema.nodes.paragraph;
      if (videoType) {
        const videoNode = videoType.create(attrs);
        const pNode = pType ? pType.create() : null;
        const nodesToInsert = pNode ? [videoNode, pNode] : [videoNode];

        let insertPos = $from.after(1);
        if (typeof insertPos !== "number" || insertPos > editor.state.doc.content.size || insertPos < 0) {
          insertPos = editor.state.doc.content.size;
        }
        const tr = editor.state.tr.insert(insertPos, nodesToInsert);
        editor.view.dispatch(tr);
        return onInsertedSuccess();
      }
    } catch (e) {
      console.warn("Direct ProseMirror transaction failed:", e);
    }

    // 9. Ultimate fallback: insert at end of document
    try {
      const docEnd = editor.state.doc.content.size;
      const success = editor.commands.insertContentAt(docEnd, [
        { type: "video", attrs },
        { type: "paragraph" },
      ]);
      return success ? onInsertedSuccess() : false;
    } catch (err) {
      console.warn("insertVideoToEditor fallback failed:", err);
      return false;
    }
  };

  const insertAudioToEditor = (attrs: { src: string; title?: string; "data-relative-src"?: string }): boolean => {
    if (!editor || !attrs || !attrs.src || /^(javascript|vbscript):/i.test(attrs.src.trim())) return false;

    // 1. Focus editor and check selection
    if (!editor.isFocused) {
      editor.commands.focus();
    }

    const savedSelection = editorSelectionRef.current;
    if (savedSelection) {
      const docSize = editor.state.doc.content.size;
      const { from, to } = savedSelection;
      if (typeof from === "number" && typeof to === "number" && from >= 0 && to <= docSize && from <= to) {
        editor.commands.setTextSelection({ from, to });
      }
      editorSelectionRef.current = null;
    }

    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    const parentNode = $from.parent;

    const onInsertedSuccess = () => {
      userEditedRef.current = true;
      hasPendingDiskSaveRef.current = true;
      setLastEditedTime(Date.now());
      if (settings.autoSave) {
        setSaveStatus("auto_saving");
        scheduleAutoSaveDiskRef.current?.();
      } else {
        setSaveStatus("unsaved");
      }
      return true;
    };

    // 2. If a media node is selected or selection is at top level, insert after it instead of overwriting it!
    const selectedNode = (selection as any).node;
    if (selectedNode && ["video", "image", "audio"].includes(selectedNode.type?.name)) {
      try {
        const afterPos = selection.to;
        const success = editor.chain().focus().insertContentAt(afterPos, [
          { type: "audio", attrs },
          { type: "paragraph" },
        ]).run();
        if (success) return onInsertedSuccess();
      } catch (err) {
        console.warn("insertContentAt after selected media node failed:", err);
      }
    }

    // 3. If inside a node that only accepts inline content (heading or codeBlock)
    if (parentNode.type.name === "heading" || parentNode.type.name === "codeBlock") {
      try {
        const afterPos = $from.after();
        const success = editor.chain().focus().insertContentAt(afterPos, [
          { type: "audio", attrs },
          { type: "paragraph" },
        ]).run();
        if (success) return onInsertedSuccess();
      } catch (err) {
        console.warn("insertContentAt after heading/codeBlock failed:", err);
      }
    }

    // 4. If inside an empty paragraph, replace it directly
    if (parentNode.type.name === "paragraph" && parentNode.content.size === 0) {
      try {
        const fromPos = $from.before();
        const toPos = $from.after();
        const success = editor.chain().focus().insertContentAt({ from: fromPos, to: toPos }, [
          { type: "audio", attrs },
          { type: "paragraph" },
        ]).run();
        if (success) return onInsertedSuccess();
      } catch (err) {
        console.warn("insertContentAt empty paragraph replacement failed:", err);
      }
    }

    // 5. Try normal setAudio first
    try {
      const success = (editor.chain().focus() as any).setAudio(attrs).run();
      if (success) return onInsertedSuccess();
    } catch (e) {
      console.warn("chain.setAudio error:", e);
    }

    // 6. Try insertContent at selection
    try {
      const success = editor.commands.insertContent([
        { type: "audio", attrs },
        { type: "paragraph" },
      ]);
      if (success) return onInsertedSuccess();
    } catch (e) {
      console.warn("insertContent audio error:", e);
    }

    // 7. Direct ProseMirror schema transaction at top-level boundary
    try {
      const schema = editor.schema;
      const audioType = schema.nodes.audio;
      const pType = schema.nodes.paragraph;
      if (audioType) {
        const audioNode = audioType.create(attrs);
        const pNode = pType ? pType.create() : null;
        const nodesToInsert = pNode ? [audioNode, pNode] : [audioNode];

        let insertPos = $from.after(1);
        if (typeof insertPos !== "number" || insertPos > editor.state.doc.content.size || insertPos < 0) {
          insertPos = editor.state.doc.content.size;
        }
        const tr = editor.state.tr.insert(insertPos, nodesToInsert);
        editor.view.dispatch(tr);
        return onInsertedSuccess();
      }
    } catch (e) {
      console.warn("Direct ProseMirror transaction audio failed:", e);
    }

    // 8. Ultimate fallback: insert at end of document
    try {
      const docEnd = editor.state.doc.content.size;
      const success = editor.commands.insertContentAt(docEnd, [
        { type: "audio", attrs },
        { type: "paragraph" },
      ]);
      return success ? onInsertedSuccess() : false;
    } catch (err) {
      console.warn("insertAudioToEditor fallback failed:", err);
      return false;
    }
  };

  const handleFixLanguage = () => {
    if (!editor || editor.isDestroyed || !editor.isEditable) return;
    const {
      from,
      to,
      empty,
    } = editor.state.selection;

    if (empty) {
      toast({
        title: t("editor.fixLanguage"),
        description: t("editor.selectTextToFix"),
      });
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, "\n", "\n");
    if (!selectedText.trim()) {
      toast({
        title: t("editor.fixLanguage"),
        description: t("editor.selectTextToFix"),
      });
      return;
    }

    const segments: Array<{ start: number; end: number; converted: string; original: string }> = [];
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText || !node.text) return;
      const segStart = Math.max(pos, from);
      const segEnd = Math.min(pos + node.text.length, to);
      if (segEnd <= segStart) return;
      const original = node.text.slice(segStart - pos, segEnd - pos);
      const converted = swapKeyboardLayout(original);
      if (converted !== original) {
        segments.push({ start: segStart, end: segEnd, converted, original });
      }
    });

    if (segments.length === 0) return;

    const tr = editor.state.tr;
    let lengthDelta = 0;
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      tr.insertText(seg.converted, seg.start, seg.end);
      lengthDelta += seg.converted.length - seg.original.length;
    }
    editor.view.dispatch(tr);
    editor.chain().focus().setTextSelection({ from, to: to + lengthDelta }).run();
  };

  // AI Assistant states & handlers
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOutputText, setAiOutputText] = useState("");
  interface AiDiffState {
    from: number;
    to: number;
    originalText: string;
    proposedText: string;
    action: AiActionType;
    modelUsed?: string;
  }

  const [aiDiffState, setAiDiffState] = useState<AiDiffState | null>(null);

  useEffect(() => {
    setAiDiffState(null);
  }, [note?.id]);

  const handleOpenAiSettings = useCallback(() => {
    toast({
      title: t("lunoAi.apiKeyRequiredTitle"),
      description: t("lunoAi.apiKeyRequired"),
    });
    if (onOpenSettings) {
      onOpenSettings("ai");
    } else {
      window.dispatchEvent(new CustomEvent("luno:open-settings", { detail: { category: "ai" } }));
    }
  }, [onOpenSettings, t]);

  const getSelectionMarkdown = useCallback((from: number, to: number): string => {
    if (!editor) return "";
    try {
      const slice = editor.state.doc.slice(from, to);
      const fragment = DOMSerializer.fromSchema(editor.schema).serializeFragment(slice.content);
      const temp = document.createElement("div");
      temp.appendChild(fragment);

      migrateDomTaskLists(temp);
      const orphanTaskItems = Array.from(temp.querySelectorAll('li[data-type="taskItem"]')).filter(
        (li) => !li.closest('ul[data-type="taskList"]')
      );
      if (orphanTaskItems.length > 0) {
        const ul = document.createElement("ul");
        ul.setAttribute("data-type", "taskList");
        orphanTaskItems[0].parentNode?.insertBefore(ul, orphanTaskItems[0]);
        orphanTaskItems.forEach((li) => ul.appendChild(li));
      }

      const md = turndown.turndown(temp.innerHTML).trim();
      if (md) return md;
    } catch (e) {
      console.warn("Failed to get markdown slice", e);
    }
    return editor.state.doc.textBetween(from, to, "\n", "\n");
  }, [editor, turndown]);

  const getFullEditorMarkdown = useCallback((): string => {
    if (!editor) return "";
    if (isTxtFile(note)) {
      return (editor.getText() || "").trim();
    }
    try {
      const temp = document.createElement("div");
      temp.innerHTML = editor.getHTML();
      // Strip reading-mode footnote section, items, and separator if any are present in the DOM
      temp.querySelectorAll("section.footnotes, [data-footnotes], hr.footnotes-sep").forEach((el) => el.remove());
      temp.querySelectorAll(".footnote-item, [data-footnote-id], [data-footnote-target]").forEach((el) => {
        const block = el.closest("li, ol, ul, section, p") || el;
        block.remove();
      });
      temp.querySelectorAll("a[href*='#fnref-'], [data-footnote-backref]").forEach((el) => {
        const li = el.closest("li");
        if (li) {
          const ol = li.closest("ol, ul");
          li.remove();
          if (ol && !ol.textContent?.trim()) ol.remove();
        }
      });
      const firstChild = temp.firstElementChild;
      if (firstChild && firstChild.tagName.toLowerCase() === "h1") {
        firstChild.remove();
      }
      const md = normalizeSerializedMarkdown(turndown.turndown(temp.innerHTML)).trim();
      if (md) return md;
    } catch (e) {
      console.warn("Failed to get full editor markdown", e);
    }
    return (editor.getText() || "").trim();
  }, [editor, isTxtFile, note, turndown]);

  const handleAcceptDiff = useCallback(() => {
    if (!editor || !aiDiffState) return;
    const { from, to, proposedText } = aiDiffState;
    const docSize = editor.state.doc.content.size;
    const safeTo = Math.min(to, docSize);
    const safeFrom = Math.min(from, safeTo);

    const isWholeDoc = safeFrom === 0 && safeTo === docSize;
    if (isWholeDoc) {
      const isTxt = isTxtFile(note);
      const isHtml = isHtmlFile(note);
      const baseTitle = getBaseTitle(note);
      const parsed = parseEditorContent(proposedText, baseTitle, isTxt, isHtml);
      editor.commands.setContent(parsed, { emitUpdate: true });
    } else {
      const isRich =
        proposedText.includes("\n") ||
        /(?:[ \t]*(?:[-*+]|\d+\.)?[ \t]*\[[ xX]\]|[ \t]*[-*+]\s|[ \t]*\d+\.\s|#{1,6}\s|>\s|```|\|)/.test(proposedText) ||
        /(\*\*|__|\*|_|~~|==|`|<[a-z][\s\S]*>)/i.test(proposedText);

      if (isRich) {
        let html = toEditorHtml(proposedText, isTxtFile(note), false);
        const trimmed = html.trim();
        // If proposedText has no newlines and html is wrapped in a single <p>...</p>,
        // unwrap <p> so inline HTML/spans can replace inline selections without inserting block breaks
        if (
          !proposedText.includes("\n") &&
          trimmed.startsWith("<p>") &&
          trimmed.endsWith("</p>") &&
          !/<(?:p|div|ul|ol|li|h[1-6]|blockquote|pre|table)[\s>]/i.test(trimmed.slice(3, -4))
        ) {
          html = trimmed.slice(3, -4);
        }
        editor.chain().focus().insertContentAt({ from: safeFrom, to: safeTo }, html).run();
      } else {
        editor.chain().focus().insertContentAt({ from: safeFrom, to: safeTo }, proposedText).run();
      }
    }
    setAiDiffState(null);
  }, [editor, aiDiffState, note, isTxtFile, isHtmlFile, getBaseTitle, parseEditorContent, toEditorHtml]);

  const handleRejectDiff = useCallback(() => {
    setAiDiffState(null);
  }, []);

  const handleInsertBelowDiff = useCallback(() => {
    if (!editor || !aiDiffState) return;
    const { to, proposedText } = aiDiffState;
    const docSize = editor.state.doc.content.size;
    const safeTo = Math.min(to, docSize);
    const isRich =
      proposedText.includes("\n") ||
      /(?:[ \t]*(?:[-*+]|\d+\.)?[ \t]*\[[ xX]\]|[ \t]*[-*+]\s|[ \t]*\d+\.\s|#{1,6}\s|>\s|```|\|)/.test(proposedText) ||
      /(\*\*|__|\*|_|~~|==|`|<[a-z][\s\S]*>)/i.test(proposedText);

    if (isRich) {
      const html = toEditorHtml(proposedText, isTxtFile(note), false);
      editor.chain().focus().insertContentAt(safeTo, html).run();
    } else {
      editor.chain().focus().insertContentAt(safeTo, `\n\n${proposedText}`).run();
    }
    setAiDiffState(null);
  }, [editor, aiDiffState, note, isTxtFile, toEditorHtml]);

  const handleAiAction = async (action: AiActionType) => {
    if (!editor) return;

    if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
      handleOpenAiSettings();
      return;
    }

    const { from, to } = editor.state.selection;
    let targetText = "";
    let selectionFrom = from;
    let selectionTo = to;

    if (from !== to) {
      targetText = getSelectionMarkdown(from, to);
    } else {
      targetText = getFullEditorMarkdown();
      selectionFrom = 0;
      selectionTo = editor.state.doc.content.size;
    }

    const trimmedTargetText = targetText.trim();

    if (!trimmedTargetText) {
      showUiAlert("โปรดเลือกหรือพิมพ์ข้อความที่ต้องการให้ผู้ช่วย AI ดำเนินการ");
      return;
    }

    setAiGenerating(true);

    try {
      const { result, modelUsed } = await runGeminiAction(settings.geminiApiKey, action, trimmedTargetText, lang, settings.aiModel);
      const cleanResult = result.trim();
      setAiOutputText(cleanResult);

      setAiDiffState({
        from: selectionFrom,
        to: selectionTo,
        originalText: trimmedTargetText,
        proposedText: cleanResult,
        action: action,
        modelUsed: modelUsed,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Gemini API Key") || msg.includes("API key") || msg.includes("API_KEY")) {
        handleOpenAiSettings();
      } else {
        showUiAlert(`เกิดข้อผิดพลาด AI: ${msg}`);
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const openLinkDialog = () => {
    if (!editor) return;
    rememberSelection();

    const attrs = editor.getAttributes("link");
    const existingHref = attrs.href ?? "";
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      " "
    );

    setLinkDisplayText(selectedText || "");
    setWorkspaceSearchQuery("");

    if (existingHref.startsWith("wikilink:") || attrs["data-wikilink"]) {
      setLinkTab("workspace");
      const targetName = decodeURIComponent(existingHref.replace(/^wikilink:/, "")) || attrs["data-wikilink"] || "";
      const found = (notes || []).find((n) => {
        const base = (n.fileName || n.title || "").replace(/\.[^/.]+$/, "").toLowerCase();
        return base === targetName.toLowerCase() || (n.fileName || "").toLowerCase() === targetName.toLowerCase();
      });
      setSelectedWorkspaceNote(found || null);
      setLinkUrl("");
    } else if (existingHref) {
      setLinkTab("external");
      setLinkUrl(existingHref);
      setSelectedWorkspaceNote(null);
    } else {
      setLinkTab(notes && notes.length > 0 ? "workspace" : "external");
      setLinkUrl("");
      setSelectedWorkspaceNote(null);
    }

    setLinkDialogOpen(true);
  };

  const handleApplyLink = () => {
    if (!editor) return;
    const chain = getFocusedChain();
    if (!chain) return;

    if (linkTab === "external") {
      const nextUrl = normalizeUrl(linkUrl);
      if (!nextUrl) {
        chain.extendMarkRange("link").unsetLink().run();
        setLinkDialogOpen(false);
        setLinkUrl("");
        setLinkDisplayText("");
        return;
      }

      try {
        new URL(nextUrl, window.location.origin);
      } catch {
        showUiAlert(t("editor.invalidLinkUrl"));
        return;
      }

      const displayText = linkDisplayText.trim();
      if (displayText && editor.state.selection.empty) {
        chain
          .insertContent({
            type: "text",
            text: displayText,
            marks: [{ type: "link", attrs: { href: nextUrl } }],
          })
          .run();
      } else {
        chain.extendMarkRange("link").setLink({ href: nextUrl }).run();
      }
    } else {
      // Workspace Note link
      if (!selectedWorkspaceNote) {
        showUiAlert(t("editor.selectNoteFirst"));
        return;
      }

      const noteTitle = (selectedWorkspaceNote.fileName || selectedWorkspaceNote.title || "").replace(/\.[^/.]+$/, "").trim();
      const href = `wikilink:${encodeURIComponent(noteTitle)}`;
      const displayText = linkDisplayText.trim() || noteTitle;

      if (editor.state.selection.empty) {
        chain
          .insertContent({
            type: "text",
            text: displayText,
            marks: [
              {
                type: "link",
                attrs: {
                  href,
                  "data-wikilink": noteTitle,
                  class: "internal-wikilink text-primary underline underline-offset-4 cursor-pointer",
                },
              },
            ],
          })
          .run();
      } else {
        chain
          .extendMarkRange("link")
          .setLink({
            href,
          })
          .updateAttributes("link", {
            "data-wikilink": noteTitle,
            class: "internal-wikilink text-primary underline underline-offset-4 cursor-pointer",
          })
          .run();
      }
    }

    setLinkDialogOpen(false);
    setLinkUrl("");
    setLinkDisplayText("");
    setSelectedWorkspaceNote(null);
  };

  const handleRemoveLink = () => {
    const chain = getFocusedChain();
    if (!chain) return;
    chain.extendMarkRange("link").unsetLink().run();
    setLinkDialogOpen(false);
    setLinkUrl("");
    setLinkDisplayText("");
    setSelectedWorkspaceNote(null);
  };

  const openFootnoteDialog = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    rememberSelection();
    setFootnoteInputText("");

    let coords: { top: number; left: number } | null = null;
    try {
      const { from } = editor.state.selection;
      const c = editor.view.coordsAtPos(from);
      if (c && c.bottom > 0) {
        coords = {
          top: c.bottom + 8,
          left: Math.max(16, Math.min(c.left - 20, window.innerWidth - 320)),
        };
      }
    } catch {
      // fallback
    }

    if (!coords || coords.top <= 0) {
      coords = {
        top: 140,
        left: Math.max(16, window.innerWidth / 2 - 140),
      };
    }

    setFootnotePopoverState({ open: true, coords });
    setTimeout(() => {
      footnoteInputRef.current?.focus();
      footnoteInputRef.current?.select();
    }, 50);
  }, [editor, rememberSelection]);

  useEffect(() => {
    if (!footnotePopoverState.open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (footnotePopoverRef.current && !footnotePopoverRef.current.contains(e.target as Node)) {
        setFootnotePopoverState({ open: false, coords: null });
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFootnotePopoverState({ open: false, coords: null });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [footnotePopoverState.open]);

  const handleConfirmFootnote = useCallback(() => {
    const textToInsert = footnoteInputText;
    setFootnotePopoverState({ open: false, coords: null });
    setFootnoteInputText("");
    if (!editor || editor.isDestroyed) return;
    if (editorSelectionRef.current) {
      const docSize = editor.state.doc.content.size;
      const { from, to } = editorSelectionRef.current;
      if (typeof from === "number" && typeof to === "number" && from >= 0 && to <= docSize && from <= to) {
        editor.commands.setTextSelection({ from, to });
      }
    }
    insertFootnoteAtSelection(editor, textToInsert);
  }, [editor, footnoteInputText]);

  const openImageDialog = () => {
    rememberSelection();
    setImageUrl("");
    setImageDialogOpen(true);
  };

  const openWorkspaceImageDialog = useCallback(() => {
    rememberSelection();
    setWorkspaceImageDialogOpen(true);
  }, [rememberSelection]);

  const handleInsertWorkspaceImage = useCallback(
    (targetNote: Note, relativePath: string, blobUrl?: string) => {
      const fileName = targetNote.fileName || targetNote.title || "image.png";
      let encodedRelPath = relativePath;
      try {
        encodedRelPath = encodeURI(decodeURI(relativePath));
      } catch {
        encodedRelPath = relativePath.replace(/ /g, "%20");
      }
      let decodedRelPath = relativePath;
      try {
        decodedRelPath = decodeURIComponent(relativePath);
      } catch { /* ignore */ }

      const finalBlobUrl =
        blobUrl ||
        assetBlobUrlMap.current.get(encodedRelPath) ||
        assetBlobUrlMap.current.get(decodedRelPath) ||
        assetBlobUrlMap.current.get(relativePath) ||
        encodedRelPath;

      if (blobUrl) {
        assetBlobUrlMap.current.set(encodedRelPath, blobUrl);
        assetBlobUrlMap.current.set(decodedRelPath, blobUrl);
        assetBlobUrlMap.current.set(blobUrl, encodedRelPath);
      }
      insertImageToEditor({ src: finalBlobUrl, alt: fileName, "data-relative-src": encodedRelPath });
    },
    [insertImageToEditor]
  );

  const openVideoDialog = () => {
    rememberSelection();
    setVideoUrl("");
    setVideoDialogOpen(true);
  };

  const openWorkspaceVideoDialog = useCallback(() => {
    rememberSelection();
    setWorkspaceVideoDialogOpen(true);
  }, [rememberSelection]);

  const handleInsertWorkspaceVideo = useCallback(
    (targetNote: Note, relativePath: string, blobUrl?: string) => {
      const fileName = targetNote.fileName || targetNote.title || "video.mp4";
      let encodedRelPath = relativePath;
      try {
        encodedRelPath = encodeURI(decodeURI(relativePath));
      } catch {
        encodedRelPath = relativePath.replace(/ /g, "%20");
      }
      let decodedRelPath = relativePath;
      try {
        decodedRelPath = decodeURIComponent(relativePath);
      } catch { /* ignore */ }

      const finalBlobUrl =
        (blobUrl && !blobUrl.startsWith("luno-asset:")) ? blobUrl :
        assetBlobUrlMap.current.get(encodedRelPath) ||
        assetBlobUrlMap.current.get(decodedRelPath) ||
        assetBlobUrlMap.current.get(relativePath) ||
        encodedRelPath;

      if (blobUrl && !blobUrl.startsWith("luno-asset:")) {
        assetBlobUrlMap.current.set(encodedRelPath, blobUrl);
        assetBlobUrlMap.current.set(decodedRelPath, blobUrl);
        assetBlobUrlMap.current.set(blobUrl, encodedRelPath);
        videoLocalCache.set(encodedRelPath, blobUrl);
        videoLocalCache.set(decodedRelPath, blobUrl);
        videoLocalCache.set(relativePath, blobUrl);
      }
      insertVideoToEditor({ src: finalBlobUrl, title: fileName, "data-relative-src": encodedRelPath });
    },
    [insertVideoToEditor]
  );

  const triggerVideoUpload = useCallback(() => {
    rememberSelection();
    videoInputRef.current?.click();
  }, [rememberSelection]);

  const openAudioRecorder = useCallback(() => {
    rememberSelection();
    window.dispatchEvent(new CustomEvent("app:toggle-audio-recorder", { detail: { paneId } }));
  }, [rememberSelection, paneId]);

  const triggerImageUpload = useCallback(() => {
    rememberSelection();
    imageInputRef.current?.click();
  }, [rememberSelection]);

  useEffect(() => {
    openLinkDialogRef.current = openLinkDialog;
    openFootnoteDialogRef.current = openFootnoteDialog;
    openImageDialogRef.current = openImageDialog;
    openWorkspaceImageDialogRef.current = openWorkspaceImageDialog;
    triggerImageUploadRef.current = triggerImageUpload;
    openVideoDialogRef.current = openVideoDialog;
    openWorkspaceVideoDialogRef.current = openWorkspaceVideoDialog;
    triggerVideoUploadRef.current = triggerVideoUpload;
    openAudioRecorderRef.current = openAudioRecorder;
    openQrCodeDialogRef.current = () => setQrCodeDialogOpen(true);
    openEmojiPickerRef.current = () => setSlashEmojiState({ open: true, coords: { top: 200, left: 200 } });
    handleFixLanguageRef.current = handleFixLanguage;
    openTranslatorRef.current = toggleTranslator;
    openCalculatorRef.current = toggleCalculator;
    openClockRef.current = toggleClock;
    handleAiActionRef.current = (action) => handleAiAction(action || "improve");
    processAndInsertImageFileRef.current = processAndInsertImageFile;
    processAndInsertVideoFileRef.current = processAndInsertVideoFile;
    processAndInsertAudioFileRef.current = processAndInsertAudioFile;
  });

  useEffect(() => {
    const onSystemFixLanguage = (event: Event) => {
      const customEvent = event as CustomEvent<FixLanguageEventDetail>;
      if (customEvent.detail?.handled) return;
      if (editor && !editor.isDestroyed && editor.isFocused) {
        if (customEvent.detail) {
          customEvent.detail.handled = true;
        }
        handleFixLanguageRef.current?.();
      }
    };
    window.addEventListener(FIX_LANGUAGE_EVENT, onSystemFixLanguage);
    return () => window.removeEventListener(FIX_LANGUAGE_EVENT, onSystemFixLanguage);
  }, [editor]);

  useEffect(() => {
    const handleTriggerAiEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ action?: AiActionType }>;
      handleAiActionRef.current?.(customEvent.detail?.action || "improve");
    };
    window.addEventListener("luno:trigger-ai-action", handleTriggerAiEvent);
    return () => {
      window.removeEventListener("luno:trigger-ai-action", handleTriggerAiEvent);
    };
  }, []);

  const handleApplyImageUrl = () => {
    const nextUrl = normalizeUrl(imageUrl);
    if (!nextUrl) {
      showUiAlert(t("editor.invalidImageUrl"));
      return;
    }

    try {
      const parsed = new URL(nextUrl, window.location.origin);
      if (!["http:", "https:", "data:", "blob:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      showUiAlert(t("editor.invalidImageUrl"));
      return;
    }

    insertImageToEditor({ src: nextUrl, alt: "" });
    setImageDialogOpen(false);
    setImageUrl("");
  };

  const handleApplyVideoUrl = () => {
    const nextUrl = normalizeUrl(videoUrl);
    if (!nextUrl) {
      showUiAlert(t("editor.invalidVideoUrl"));
      return;
    }

    try {
      const parsed = new URL(nextUrl, window.location.origin);
      if (!["http:", "https:", "data:", "blob:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      showUiAlert(t("editor.invalidVideoUrl"));
      return;
    }

    insertVideoToEditor({ src: nextUrl, title: "" });
    setVideoDialogOpen(false);
    setVideoUrl("");
  };

  const getUniqueAttachmentFileName = async (attachmentsDir: FileSystemDirectoryHandle, originalName: string): Promise<string> => {
    try {
      await attachmentsDir.getFileHandle(originalName);
    } catch {
      return originalName;
    }

    const lastDot = originalName.lastIndexOf(".");
    const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
    const ext = lastDot > 0 ? originalName.slice(lastDot) : "";

    let counter = 1;
    while (counter < 1000) {
      const candidate = `${baseName} ${counter}${ext}`;
      try {
        await attachmentsDir.getFileHandle(candidate);
        counter++;
      } catch {
        return candidate;
      }
    }
    return `${baseName}_${Date.now()}${ext}`;
  };

  const getRelativeAttachmentPath = (attachmentFileName: string) => {
    const depth = (note?.folderPath ?? "").split("/").filter(Boolean).length;
    const prefix = depth > 0 ? "../".repeat(depth) : "";
    const rawPath = `${prefix}attachments/${attachmentFileName}`;
    try {
      return encodeURI(decodeURI(rawPath));
    } catch {
      return rawPath.replace(/ /g, "%20");
    }
  };

  const saveQrCodeAttachment = async (
    dataUrl: string,
    qrText?: string,
    existingRelPath?: string | null
  ): Promise<{ relPath: string; blobUrl: string }> => {
    let targetFileName = "";
    if (existingRelPath) {
      let cleanRel = decodeURIComponent(existingRelPath);
      while (cleanRel.startsWith("../") || cleanRel.startsWith("./")) {
        cleanRel = cleanRel.replace(/^(\.\.\/|\.\/)/, "");
      }
      if (cleanRel.startsWith("attachments/")) {
        targetFileName = cleanRel.replace(/^attachments\//, "");
      }
    }

    if (!targetFileName) {
      const cleanSlug = (qrText || "qrcode")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//i, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 30)
        .replace(/^_+|_+$/g, "") || "code";
      const timeTag = Date.now().toString().slice(-6);
      targetFileName = `qrcode_${cleanSlug}_${timeTag}.png`;
    }

    const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
    let uniqueTargetName = targetFileName;
    if (!existingRelPath && electronAPI?.getSavedWorkspace && electronAPI?.readDirectoryFiles) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const attachmentsFolder = `${saved.folderPath}/attachments`;
          const existingFiles = (await electronAPI.readDirectoryFiles(attachmentsFolder)) || [];
          const existingNames = new Set(existingFiles.map((f: any) => (typeof f === "string" ? f : f?.name)));
          const lastDot = targetFileName.lastIndexOf(".");
          const baseName = lastDot > 0 ? targetFileName.slice(0, lastDot) : targetFileName;
          const ext = lastDot > 0 ? targetFileName.slice(lastDot) : "";
          let counter = 1;
          while (existingNames.has(uniqueTargetName)) {
            uniqueTargetName = `${baseName}_${counter}${ext}`;
            counter++;
          }
        }
      } catch (e) {
        console.warn("Pre-checking attachments folder error for QR code:", e);
      }
    }

    let blob: Blob | null = null;
    try {
      const res = await fetch(dataUrl);
      blob = await res.blob();
    } catch { /* ignore */ }

    const blobUrl = blob ? URL.createObjectURL(blob) : dataUrlToBlobUrl(dataUrl);
    const relPath = getRelativeAttachmentPath(uniqueTargetName);
    let decodedRel = relPath;
    try {
      decodedRel = decodeURIComponent(relPath);
    } catch { /* ignore */ }

    if (blobUrl) {
      assetBlobUrlMap.current.set(relPath, blobUrl);
      assetBlobUrlMap.current.set(decodedRel, blobUrl);
      assetBlobUrlMap.current.set(blobUrl, relPath);
    }

    // Save to Electron workspace on disk
    if (electronAPI?.getSavedWorkspace) {
      void (async () => {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath) {
            const fullAttachmentPath = `${saved.folderPath}/attachments/${uniqueTargetName}`;
            if (blob && electronAPI.writeFileBuffer) {
              const buffer = await blob.arrayBuffer();
              await electronAPI.writeFileBuffer({ fullPath: fullAttachmentPath, buffer });
              return;
            }
            if (electronAPI.writeFileBase64) {
              const rawBase64 = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
              if (rawBase64) {
                await electronAPI.writeFileBase64({ fullPath: fullAttachmentPath, base64: rawBase64 });
              }
            }
          }
        } catch (err) {
          console.warn("Failed to save QR attachment in Electron:", err);
        }
      })();
    }

    // Save to Web File System Access API
    if (rootDirHandle && blob) {
      void (async () => {
        try {
          const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: true });
          const fileHandle = await attachmentsDir.getFileHandle(uniqueTargetName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          console.warn("Failed to save QR attachment via Web FileSystem:", err);
        }
      })();
    }

    return { relPath, blobUrl };
  };

  const processAndInsertImageFile = async (rawInput: ImageFileInput) => {
    let file: File | null = rawInput instanceof File ? rawInput : (rawInput.file || null);
    const initialDataUrl = !(rawInput instanceof File) ? (rawInput.dataUrl || null) : null;
    const initialBlob = !(rawInput instanceof File) ? (rawInput.blob || null) : null;
    let targetFileName = !(rawInput instanceof File) ? (rawInput.fileName || null) : null;

    const isImg = (f: { name?: string; type?: string } | null | undefined): boolean => {
      if (!f) return false;
      if (f.type && f.type.startsWith("image/")) return true;
      const name = f.name || "";
      return /\.(png|jpe?g|gif|webp|bmp|svg|ico|tiff?|avif)$/i.test(name);
    };

    if (file && !isImg(file)) {
      showUiAlert(t("editor.invalidImageFile"));
      return;
    }

    if (file && (!file.type || !file.type.startsWith("image/"))) {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
        : ext === "png" ? "image/png"
        : ext === "webp" ? "image/webp"
        : ext === "gif" ? "image/gif"
        : ext === "svg" ? "image/svg+xml"
        : ext === "bmp" ? "image/bmp"
        : "image/png";
      file = new File([file], file.name || `image_${Date.now()}.${ext}`, { type: mime });
    }

    if (!targetFileName) {
      const isGenericFileName = !file?.name || /^(image\.(png|jpe?g|webp|gif|bmp)|blob)$/i.test(file.name);
      if (file && file.name && !isGenericFileName) {
        targetFileName = file.name;
      } else {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const activeDateFormat = settingsRef.current?.dateFormat || settings.dateFormat || "YYYY-MM-DD";
        const dateStr = formatDateForFileName(now, activeDateFormat);
        const timeTag = `${dateStr}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        let ext = "png";
        if (initialDataUrl) {
          if (initialDataUrl.includes("image/jpeg") || initialDataUrl.includes("image/jpg")) ext = "jpg";
          else if (initialDataUrl.includes("image/webp")) ext = "webp";
        } else if (file?.type) {
          ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
        }
        targetFileName = `Pasted_Image_${timeTag}.${ext}`;
        if (file) {
          file = new File([file], targetFileName, { type: file.type });
        }
      }
    }

    let finalDataUrl = initialDataUrl;
    let finalBlob = initialBlob || file;

    if (!finalDataUrl && file) {
      try {
        const compressed = await compressImageFile(file);
        if (compressed?.dataUrl) {
          finalDataUrl = compressed.dataUrl;
          finalBlob = compressed.blob;
        }
      } catch (err) {
        console.warn("Failed to compress image file:", err);
      }
    }

    if (!finalDataUrl && finalBlob) {
      try {
        finalDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = reject;
          reader.readAsDataURL(finalBlob!);
        });
      } catch (err) {
        console.warn("Fallback FileReader failed for image:", err);
      }
    }

    const base64ToBlob = (dataUrl: string): Blob | null => {
      try {
        const parts = dataUrl.split(",");
        if (parts.length < 2) return null;
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/png";
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mime });
      } catch (e) {
        console.warn("base64ToBlob error:", e);
        return null;
      }
    };

    if (!finalBlob && finalDataUrl) {
      finalBlob = base64ToBlob(finalDataUrl);
      if (!finalBlob) {
        try {
          const res = await fetch(finalDataUrl);
          finalBlob = await res.blob();
        } catch {
          /* ignore */
        }
      }
    }

    const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
    let uniqueTargetName = targetFileName;
    if (electronAPI?.getSavedWorkspace && electronAPI?.readDirectoryFiles) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const attachmentsFolder = `${saved.folderPath}/attachments`;
          const existingFiles = (await electronAPI.readDirectoryFiles(attachmentsFolder)) || [];
          const existingNames = new Set(existingFiles.map((f: any) => (typeof f === "string" ? f : f?.name)));
          const lastDot = targetFileName.lastIndexOf(".");
          const baseName = lastDot > 0 ? targetFileName.slice(0, lastDot) : targetFileName;
          const ext = lastDot > 0 ? targetFileName.slice(lastDot) : "";
          let counter = 1;
          while (existingNames.has(uniqueTargetName)) {
            uniqueTargetName = `${baseName} ${counter}${ext}`;
            counter++;
          }
        }
      } catch (e) {
        console.warn("Pre-checking attachments folder error:", e);
      }
    }

    const blobUrl = finalBlob ? URL.createObjectURL(finalBlob) : "";
    const relPath = getRelativeAttachmentPath(uniqueTargetName);
    let decodedRel = relPath;
    try {
      decodedRel = decodeURIComponent(relPath);
    } catch { /* ignore */ }

    if (blobUrl) {
      assetBlobUrlMap.current.set(relPath, blobUrl);
      assetBlobUrlMap.current.set(decodedRel, blobUrl);
      assetBlobUrlMap.current.set(blobUrl, relPath);
    }
    if (finalDataUrl) {
      assetBlobUrlMap.current.set(relPath, finalDataUrl);
      assetBlobUrlMap.current.set(decodedRel, finalDataUrl);
    }

    // Insert into editor immediately: prefer lightweight blobUrl so editor state does not bloat
    const insertSrc = blobUrl || finalDataUrl;
    const inserted = insertImageToEditor({
      src: insertSrc,
      alt: uniqueTargetName,
      "data-relative-src": relPath,
    });
    if (!inserted) {
      showUiAlert(t("editor.invalidImageFile"));
    }

    if (finalBlob) {
      const imgId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      void saveImageToIndexedDb(imgId, finalBlob);
    }

    // 2. Electron Desktop Workspace Support - save file to disk asynchronously in background
    if (electronAPI?.getSavedWorkspace) {
      void (async () => {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath) {
            const fullAttachmentPath = `${saved.folderPath}/attachments/${uniqueTargetName}`;
            const nativeSourcePath = file ? (electronAPI.getPathForFile?.(file) || (file as any).path) : null;
            if (nativeSourcePath && electronAPI.copyFileOrFolder) {
              await electronAPI.copyFileOrFolder({ sourceFullPath: nativeSourcePath, targetFullPath: fullAttachmentPath });
              return;
            }

            if (finalBlob && electronAPI.writeFileBuffer) {
              const buffer = await finalBlob.arrayBuffer();
              await electronAPI.writeFileBuffer({ fullPath: fullAttachmentPath, buffer });
              return;
            }

            if (electronAPI.writeFileBase64 && finalDataUrl) {
              const rawBase64 = finalDataUrl.includes("base64,") ? finalDataUrl.split("base64,")[1] : finalDataUrl;
              if (rawBase64) {
                await electronAPI.writeFileBase64({ fullPath: fullAttachmentPath, base64: rawBase64 });
              }
            }
          }
        } catch (err) {
          console.warn("Failed to save attachment in Electron workspace:", err);
        }
      })();
    }

    // 3. Web File System Access API Support
    if (rootDirHandle && finalBlob) {
      void (async () => {
        try {
          const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: true });
          const attachmentFileName = await getUniqueAttachmentFileName(attachmentsDir, targetFileName);
          const fileHandle = await attachmentsDir.getFileHandle(attachmentFileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(finalBlob!);
          await writable.close();
        } catch (err) {
          console.warn("Failed to save attachment to workspace folder:", err);
        }
      })();
    }

    // 4. Google Drive background sync upload
    if (settings.storageMode === "gdrive" && isGoogleDriveConnected() && finalBlob) {
      void (async () => {
        try {
          const accessToken = await getValidAccessToken();
          const structure = await syncEngine.initializeSync();
          if (accessToken && structure?.attachmentsId) {
            await uploadDriveAttachmentFile(
              accessToken,
              structure.attachmentsId,
              finalBlob!,
              targetFileName
            );
          }
        } catch (err) {
          console.warn("Failed to background upload image to Google Drive attachments:", err);
        }
      })();
    }
  };

  processAndInsertImageFileRef.current = processAndInsertImageFile;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processAndInsertImageFile(file);
    event.target.value = "";
  };

  const processAndInsertVideoFile = async (file: File) => {
    const isVid = (f: { name?: string; type?: string } | null | undefined): boolean => {
      if (!f) return false;
      return isVideoMedia(f.name || "", { type: f.type });
    };

    if (!isVid(file)) {
      showUiAlert(t("editor.invalidVideoFile"));
      return;
    }

    const targetFileName = file.name || `video_${Date.now()}.mp4`;
    const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
    let uniqueTargetName = targetFileName;
    if (electronAPI?.getSavedWorkspace && electronAPI?.readDirectoryFiles) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const attachmentsFolder = `${saved.folderPath}/attachments`;
          const existingFiles = (await electronAPI.readDirectoryFiles(attachmentsFolder)) || [];
          const existingNames = new Set(existingFiles.map((f: any) => (typeof f === "string" ? f : f?.name)));
          const lastDot = targetFileName.lastIndexOf(".");
          const baseName = lastDot > 0 ? targetFileName.slice(0, lastDot) : targetFileName;
          const ext = lastDot > 0 ? targetFileName.slice(lastDot) : "";
          let counter = 1;
          while (existingNames.has(uniqueTargetName)) {
            uniqueTargetName = `${baseName} ${counter}${ext}`;
            counter++;
          }
        }
      } catch (e) {
        console.warn("Pre-checking attachments folder error:", e);
      }
    }

    const blobUrl = URL.createObjectURL(file);
    const relPath = getRelativeAttachmentPath(uniqueTargetName);
    let decodedRel = relPath;
    try {
      decodedRel = decodeURIComponent(relPath);
    } catch { /* ignore */ }

    assetBlobUrlMap.current.set(relPath, blobUrl);
    assetBlobUrlMap.current.set(decodedRel, blobUrl);
    assetBlobUrlMap.current.set(blobUrl, relPath);
    videoLocalCache.set(relPath, blobUrl);
    videoLocalCache.set(decodedRel, blobUrl);

    const inserted = insertVideoToEditor({
      src: blobUrl,
      title: uniqueTargetName,
      "data-relative-src": relPath,
    });
    if (!inserted) {
      showUiAlert(t("editor.invalidVideoFile"));
    }

    // 2. Electron Desktop Workspace Support - save file to disk asynchronously in background
    if (electronAPI?.getSavedWorkspace) {
      void (async () => {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath) {
            const fullAttachmentPath = `${saved.folderPath}/attachments/${uniqueTargetName}`;
            const nativeSourcePath = electronAPI.getPathForFile?.(file) || (file as any).path;
            if (nativeSourcePath && electronAPI.copyFileOrFolder) {
              await electronAPI.copyFileOrFolder({ sourceFullPath: nativeSourcePath, targetFullPath: fullAttachmentPath });
              return;
            }

            if (electronAPI.writeFileBuffer) {
              const buffer = await file.arrayBuffer();
              await electronAPI.writeFileBuffer({ fullPath: fullAttachmentPath, buffer });
              return;
            }

            if (electronAPI.writeFileBase64) {
              const rawBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const res = typeof reader.result === "string" ? reader.result : "";
                  resolve(res.includes("base64,") ? res.split("base64,")[1] : res);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              if (rawBase64) {
                await electronAPI.writeFileBase64({ fullPath: fullAttachmentPath, base64: rawBase64 });
              }
            }
          }
        } catch (err) {
          console.warn("Failed to save video attachment in Electron workspace:", err);
        }
      })();
    }

    // 3. Web File System Access API Support
    if (rootDirHandle) {
      void (async () => {
        try {
          const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: true });
          const attachmentFileName = await getUniqueAttachmentFileName(attachmentsDir, targetFileName);
          const fileHandle = await attachmentsDir.getFileHandle(attachmentFileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(file);
          await writable.close();
        } catch (err) {
          console.warn("Failed to save video attachment to workspace folder:", err);
        }
      })();
    }

    // 4. Google Drive background sync upload
    if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
      void (async () => {
        try {
          const accessToken = await getValidAccessToken();
          const structure = await syncEngine.initializeSync();
          if (accessToken && structure?.attachmentsId) {
            await uploadDriveAttachmentFile(
              accessToken,
              structure.attachmentsId,
              file,
              targetFileName
            );
          }
        } catch (err) {
          console.warn("Failed to background upload video to Google Drive attachments:", err);
        }
      })();
    }
  };

  const processAndInsertAudioFile = async (file: File) => {
    const isAudio = (f: { name?: string; type?: string } | null | undefined): boolean => {
      if (!f) return false;
      return isAudioMedia(f.name || "", { type: f.type });
    };

    if (!isAudio(file)) {
      showUiAlert(t("editor.invalidAudioFile"));
      return;
    }

    const targetFileName = file.name || `audio_${Date.now()}.mp3`;
    const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
    let uniqueTargetName = targetFileName;
    if (electronAPI?.getSavedWorkspace && electronAPI?.readDirectoryFiles) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const attachmentsFolder = `${saved.folderPath}/attachments`;
          const existingFiles = (await electronAPI.readDirectoryFiles(attachmentsFolder)) || [];
          const existingNames = new Set(existingFiles.map((f: any) => (typeof f === "string" ? f : f?.name)));
          const lastDot = targetFileName.lastIndexOf(".");
          const baseName = lastDot > 0 ? targetFileName.slice(0, lastDot) : targetFileName;
          const ext = lastDot > 0 ? targetFileName.slice(lastDot) : "";
          let counter = 1;
          while (existingNames.has(uniqueTargetName)) {
            uniqueTargetName = `${baseName} ${counter}${ext}`;
            counter++;
          }
        }
      } catch (e) {
        console.warn("Pre-checking attachments folder error:", e);
      }
    }

    const blobUrl = URL.createObjectURL(file);
    const relPath = getRelativeAttachmentPath(uniqueTargetName);
    let decodedRel = relPath;
    try {
      decodedRel = decodeURIComponent(relPath);
    } catch { /* ignore */ }

    assetBlobUrlMap.current.set(relPath, blobUrl);
    assetBlobUrlMap.current.set(decodedRel, blobUrl);
    assetBlobUrlMap.current.set(blobUrl, relPath);
    audioLocalCache.set(relPath, blobUrl);
    audioLocalCache.set(decodedRel, blobUrl);

    const inserted = insertAudioToEditor({
      src: blobUrl,
      title: uniqueTargetName,
      "data-relative-src": relPath,
    });
    if (!inserted) {
      showUiAlert(t("editor.invalidAudioFile"));
    }

    // 1. Electron Desktop Workspace Support - save file to disk asynchronously in background
    if (electronAPI?.getSavedWorkspace) {
      void (async () => {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath) {
            const fullAttachmentPath = `${saved.folderPath}/attachments/${uniqueTargetName}`;
            const nativeSourcePath = electronAPI.getPathForFile?.(file) || (file as any).path;
            if (nativeSourcePath && electronAPI.copyFileOrFolder) {
              await electronAPI.copyFileOrFolder({ sourceFullPath: nativeSourcePath, targetFullPath: fullAttachmentPath });
              return;
            }

            if (electronAPI.writeFileBuffer) {
              const buffer = await file.arrayBuffer();
              await electronAPI.writeFileBuffer({ fullPath: fullAttachmentPath, buffer });
              return;
            }

            if (electronAPI.writeFileBase64) {
              const rawBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const res = typeof reader.result === "string" ? reader.result : "";
                  resolve(res.includes("base64,") ? res.split("base64,")[1] : res);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              if (rawBase64) {
                await electronAPI.writeFileBase64({ fullPath: fullAttachmentPath, base64: rawBase64 });
              }
            }
          }
        } catch (err) {
          console.warn("Failed to save audio attachment in Electron workspace:", err);
        }
      })();
    }

    // 2. Web File System Access API Support
    if (rootDirHandle) {
      void (async () => {
        try {
          const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: true });
          const attachmentFileName = await getUniqueAttachmentFileName(attachmentsDir, targetFileName);
          const fileHandle = await attachmentsDir.getFileHandle(attachmentFileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(file);
          await writable.close();
        } catch (err) {
          console.warn("Failed to save audio attachment to workspace folder:", err);
        }
      })();
    }

    // 3. Google Drive background sync upload
    if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
      void (async () => {
        try {
          const accessToken = await getValidAccessToken();
          const structure = await syncEngine.initializeSync();
          if (accessToken && structure?.attachmentsId) {
            await uploadDriveAttachmentFile(
              accessToken,
              structure.attachmentsId,
              file,
              targetFileName
            );
          }
        } catch (err) {
          console.warn("Failed to background upload audio to Google Drive attachments:", err);
        }
      })();
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processAndInsertVideoFile(file);
    event.target.value = "";
  };

  const parseAndSetContent = (text: string, format?: "plain" | "markdown") => {
    if (!note) return;
    if (isHtmlFile(note)) {
      onUpdate(note.id, { content: text, contentFormat: "html", tags: [] });
      return;
    }
    if (!isMarkdownNote(note)) {
      onUpdate(note.id, { content: text, contentFormat: format, tags: [] });
      return;
    }
    const parsedFm = parseFrontmatterAndTags(text);
    const cleanText = parsedFm.hasFrontmatter ? parsedFm.bodyContent : text;
    const content = format === "plain" ? cleanText : toEditorHtml(cleanText, false);
    const tags = parsedFm.allTags;
    onUpdate(note.id, { content, contentFormat: format, tags });
  };

  const canUseNativeFs = canUseNativeFileSystem;

  const [selectedExtension, setSelectedExtension] = useState<"md" | "txt" | "html" | "css" | "js" | null>(null);

  const getPreferredExtension = (targetNote?: Note) => {
    if (selectedExtension) return selectedExtension;
    const n = targetNote || activeNoteRef.current || note;
    const currentFileName = n?.fileName?.toLowerCase() ?? "";
    if (currentFileName.endsWith(".css") || n?.contentFormat === "css") return "css";
    if (currentFileName.endsWith(".js") || currentFileName.endsWith(".mjs") || currentFileName.endsWith(".cjs") || n?.contentFormat === "javascript" || n?.contentFormat === "js") return "js";
    if (currentFileName.endsWith(".txt")) return "txt";
    if (currentFileName.endsWith(".md") || currentFileName.endsWith(".markdown")) return "md";
    if (currentFileName.endsWith(".html") || currentFileName.endsWith(".htm")) return "html";
    return "txt";
  };

  const getSuggestedFileName = () => {
    const safeTitle = (note?.title || "note").trim().replace(/[\\/:*?"<>|]/g, "_") || "note";
    const ext = selectedExtension || getPreferredExtension();
    return `${safeTitle}.${ext}`;
  };


  const getMarkdownFromHtml = (html: string): string => {
    return normalizeSerializedMarkdown(turndown.turndown(html));
  };

  const getPlainTextFromHtml = (html: string): string => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const blockTags = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "pre", "tr"]);

    const walk = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === "br") return "\n";
      const inner = Array.from(el.childNodes).map(walk).join("");
      return blockTags.has(tag) ? inner + "\n" : inner;
    };

    return Array.from(temp.childNodes)
      .map(walk)
      .join("")
      .trimEnd();
  };

  const resolveAssetPath = (baseFolderPath: string, assetPath: string) => {
    let trimmed = assetPath.trim();
    try {
      trimmed = decodeURIComponent(trimmed);
    } catch { /* ignore */ }
    if (!trimmed) return "";
    if (trimmed.startsWith("/")) return trimmed.replace(/^\/+/, "");

    // If path starts with attachments or attachment (or relative ./ ../ to them), it's anchored at workspace root
    const cleanRel = trimmed.replace(/^(\.\/|\.\.\/)+/, "");
    if (/^attachments?(?:\/|$)/i.test(cleanRel)) {
      return cleanRel;
    }

    const segments = `${baseFolderPath}/${trimmed}`.split("/").filter(Boolean);
    const stack: string[] = [];

    for (const segment of segments) {
      if (segment === ".") continue;
      if (segment === "..") {
        if (stack.length > 0) stack.pop();
        continue;
      }
      stack.push(segment);
    }

    return stack.join("/");
  };

  const resolveAssetHandle = async (assetPath: string) => {
    if (!rootDirHandle || !note) return null;

    const resolvedPath = resolveAssetPath(note.folderPath || "", assetPath);
    if (!resolvedPath) return null;

    const segments = resolvedPath.split("/").filter(Boolean);
    let current: FileSystemDirectoryHandle | FileSystemFileHandle | null = rootDirHandle;

    for (const segment of segments) {
      if (!current || !("getDirectoryHandle" in current)) return null;
      try {
        current = await current.getDirectoryHandle(segment, { create: false });
      } catch {
        if (segment.toLowerCase() === "attachment") {
          try {
            current = await current.getDirectoryHandle("attachments", { create: false });
            continue;
          } catch { /* ignore */ }
        } else if (segment.toLowerCase() === "attachments") {
          try {
            current = await current.getDirectoryHandle("attachment", { create: false });
            continue;
          } catch { /* ignore */ }
        }
        try {
          current = await current.getFileHandle(segment, { create: false });
        } catch {
          return null;
        }
      }
    }

    if (!current || !("getFile" in current)) return null;
    return current as FileSystemFileHandle;
  };

  const resolveAssetDataUrl = async (assetPath: string): Promise<string | null> => {
    if (!note) return null;
    const resolvedRelPath = resolveAssetPath(note.folderPath || "", assetPath);
    if (!resolvedRelPath) return null;

    // 1. Electron Desktop Native Support
    const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && (electronAPI?.readFileBuffer || electronAPI?.readImageDataUrl || electronAPI?.readFileBase64)) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const fullPath = `${saved.folderPath}/${resolvedRelPath}`.replace(/\\/g, "/");
          if (electronAPI.readFileBuffer) {
            try {
              let buf = await electronAPI.readFileBuffer(fullPath);
              if (!buf) {
                if (fullPath.includes("/attachment/")) {
                  buf = await electronAPI.readFileBuffer(fullPath.replace("/attachment/", "/attachments/"));
                } else if (fullPath.includes("/attachments/")) {
                  buf = await electronAPI.readFileBuffer(fullPath.replace("/attachments/", "/attachment/"));
                }
              }
              if (buf && buf.byteLength > 0) {
                const ext = resolvedRelPath.split(".").pop()?.toLowerCase() || "";
                let mime = "application/octet-stream";
                if (["mp4", "m4v"].includes(ext)) mime = "video/mp4";
                else if (ext === "webm") mime = "video/webm";
                else if (ext === "mov") mime = "video/quicktime";
                else if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
                  mime = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
                }
                const blobUrl = URL.createObjectURL(new Blob([buf], { type: mime }));
                videoLocalCache.set(resolvedRelPath, blobUrl);
                return blobUrl;
              }
            } catch { /* ignore */ }
          }
          let dataUrl = electronAPI.readImageDataUrl ? await electronAPI.readImageDataUrl(fullPath) : null;
          if (!dataUrl && electronAPI.readImageDataUrl) {
            if (fullPath.includes("/attachment/")) {
              dataUrl = await electronAPI.readImageDataUrl(fullPath.replace("/attachment/", "/attachments/"));
            } else if (fullPath.includes("/attachments/")) {
              dataUrl = await electronAPI.readImageDataUrl(fullPath.replace("/attachments/", "/attachment/"));
            }
          }
          if (!dataUrl && electronAPI.readFileBase64) {
            let b64 = await electronAPI.readFileBase64(fullPath);
            if (!b64) {
              if (fullPath.includes("/attachment/")) {
                b64 = await electronAPI.readFileBase64(fullPath.replace("/attachment/", "/attachments/"));
              } else if (fullPath.includes("/attachments/")) {
                b64 = await electronAPI.readFileBase64(fullPath.replace("/attachments/", "/attachment/"));
              }
            }
            if (b64) {
              const ext = resolvedRelPath.split(".").pop()?.toLowerCase() || "";
              let mime = "application/octet-stream";
              if (["mp4", "m4v"].includes(ext)) mime = "video/mp4";
              else if (ext === "webm") mime = "video/webm";
              else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) mime = `image/${ext === "jpg" ? "jpeg" : ext}`;
              dataUrl = `data:${mime};base64,${b64}`;
            }
          }
          if (dataUrl) return await asyncDataUrlToBlobUrl(dataUrl);
        }
      } catch (err) {
        console.warn("Electron asset resolution failed:", assetPath, err);
      }
    }

    // 2. Web File System Access API
    if (rootDirHandle) {
      try {
        const handle = await resolveAssetHandle(assetPath);
        if (handle && typeof handle.getFile === "function") {
          const file = await handle.getFile();
          if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
            return URL.createObjectURL(file);
          }
          return await fileToDataUrl(file);
        }
      } catch (err) {
        console.warn("Web asset resolution failed:", assetPath, err);
      }
    }

    return null;
  };

  const resolveRelativeImagesInEditor = useCallback(async (instance: TiptapEditor | null) => {
    if (!instance || instance.isDestroyed || !note) return;

    const { doc } = instance.state;
    // Fast check: avoid traversing documents that do not contain any image, video, or audio nodes
    let hasMediaNode = false;
    doc.descendants((node) => {
      if (node.type.name === "image" || node.type.name === "video" || node.type.name === "audio") {
        hasMediaNode = true;
        return false;
      }
      return true;
    });
    if (!hasMediaNode) return;

    const tasks: string[] = [];

    doc.descendants((node) => {
      if (node.type.name === "image" || node.type.name === "video" || node.type.name === "audio") {
        const src = (node.attrs.src as string) || "";
        const dataRelSrc = (node.attrs["data-relative-src"] as string) || "";
        const relPath = dataRelSrc || (src && !/^(https?:\/\/|data:|blob:)/i.test(src) ? src : "");

        if (relPath && !/^(https?:\/\/|data:|blob:)/i.test(relPath)) {
          if (!tasks.includes(relPath)) {
            tasks.push(relPath);
          }
        }
      }
    });

    if (tasks.length === 0) return;

    const resolvedMap = new Map<string, string>();

    for (const relPath of tasks) {
      let encodedRel = relPath;
      try {
        encodedRel = encodeURI(decodeURI(relPath));
      } catch {
        encodedRel = relPath.replace(/ /g, "%20");
      }
      let decodedRel = relPath;
      try {
        decodedRel = decodeURIComponent(relPath);
      } catch { /* ignore */ }

      let blobUrl =
        assetBlobUrlMap.current.get(encodedRel) ||
        assetBlobUrlMap.current.get(decodedRel) ||
        assetBlobUrlMap.current.get(relPath);

      if (!blobUrl) {
        try {
          const resolvedUrl = await resolveAssetDataUrl(relPath);
          if (resolvedUrl) {
            blobUrl = resolvedUrl;
            assetBlobUrlMap.current.set(encodedRel, blobUrl);
            assetBlobUrlMap.current.set(decodedRel, blobUrl);
            assetBlobUrlMap.current.set(blobUrl, encodedRel);
          }
        } catch (err) {
          console.warn("Failed to resolve relative media in ProseMirror doc:", relPath, err);
        }
      }

      if (blobUrl) {
        resolvedMap.set(relPath, blobUrl);
        resolvedMap.set(encodedRel, blobUrl);
        resolvedMap.set(decodedRel, blobUrl);
      }
    }

    if (resolvedMap.size > 0 && !instance.isDestroyed) {
      const currentDoc = instance.state.doc;
      const tr = instance.state.tr;
      let modified = false;

      currentDoc.descendants((node, pos) => {
        if (node.type.name === "image" || node.type.name === "video" || node.type.name === "audio") {
          const src = (node.attrs.src as string) || "";
          const dataRelSrc = (node.attrs["data-relative-src"] as string) || "";
          const relPath = dataRelSrc || (src && !/^(https?:\/\/|data:|blob:)/i.test(src) ? src : "");
          const blobUrl = resolvedMap.get(relPath) || (src ? resolvedMap.get(src) : undefined);

          if (blobUrl && node.attrs.src !== blobUrl) {
            let encodedRel = relPath;
            try {
              encodedRel = encodeURI(decodeURI(relPath));
            } catch {
              encodedRel = relPath.replace(/ /g, "%20");
            }
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              src: blobUrl,
              "data-relative-src": encodedRel,
            });
            modified = true;
          }
        }
      });

      if (modified && !instance.isDestroyed) {
        syncingFromNote.current = true;
        try {
          tr.setMeta("addToHistory", false);
          tr.setMeta("isSync", true);
          instance.view.dispatch(tr);
          setEditorTick((v) => v + 1);
        } finally {
          syncingFromNote.current = false;
        }
      }
    }
  }, [rootDirHandle, note?.id]);
  resolveRelativeImagesInEditorRef.current = resolveRelativeImagesInEditor;

  useEffect(() => {
    if (editor) {
      void resolveRelativeImagesInEditor(editor);
    }
  }, [editor, note?.id, rootDirHandle, resolveRelativeImagesInEditor]);

  const handleRestoreVersionContent = useCallback((ver: NoteVersionSnapshot) => {
    if (!note) return;
    const currentContent = (isHtmlFile(note) || isCssFile(note) || isJsFile(note) || !editor)
      ? (note.content || "")
      : serializeEditorContent(note, editor);
    saveVersionSnapshot({ ...note, content: currentContent }, "pre-restore");

    // 1. Update localStorage crash-recovery backups (never store plaintext for PIN-locked notes)
    if (!note.isLocked) {
      try {
        if (ver.content) {
          localStorage.setItem(`luno_backup_${note.id}`, ver.content);
          if (note.fileName) {
            localStorage.setItem(`luno_backup_fn_${note.fileName}`, ver.content);
          }
        }
      } catch {
        /* ignore */
      }
    }

    // 2. Parse restored properties if present
    let restoredTags = ver.tags;
    let restoredIcon = ver.icon;
    let restoredIconColor = ver.iconColor;
    let restoredIsFavorite = ver.isFavorite;

    if (ver.content && isMarkdownNote(note)) {
      const parsedFm = parseFrontmatterAndTags(ver.content);
      if (parsedFm.hasFrontmatter) {
        if (!restoredTags || restoredTags.length === 0) {
          restoredTags = parsedFm.allTags;
        }
        if (restoredIcon === undefined && typeof parsedFm.frontmatterData?.icon === "string") {
          restoredIcon = parsedFm.frontmatterData.icon;
        }
        if (restoredIconColor === undefined) {
          const col = parsedFm.frontmatterData?.iconColor || parsedFm.frontmatterData?.icon_color;
          if (typeof col === "string") restoredIconColor = col;
        }
        if (restoredIsFavorite === undefined) {
          const fav = parsedFm.frontmatterData?.favorite ?? parsedFm.frontmatterData?.isFavorite;
          if (typeof fav === "boolean") restoredIsFavorite = fav;
        }
      }
    }

    // 3. Update React Note state with full properties
    const patch: Partial<Note> = {
      content: ver.content,
      tags: restoredTags ?? [],
      icon: restoredIcon,
      iconColor: restoredIconColor,
      isFavorite: restoredIsFavorite ?? false,
    };
    onUpdate(note.id, patch);

    // 4. Update TipTap Editor DOM (for markdown and txt files) or CodeEditor cache (for html/css/js)
    if (isHtmlFile(note) || isCssFile(note) || isJsFile(note)) {
      codeEditorContentMap.set(note.id, ver.content);
    } else if (editor && !editor.isDestroyed) {
      const baseTitle = getBaseTitle(note);
      const parsed = parseEditorContent(ver.content, baseTitle, isTxtFile(note), isHtmlFile(note));
      syncingFromNote.current = true;
      try {
        (editor.commands.setContent as any)(parsed as string, false, { preserveWhitespace: "full" });
        noteEditorStateMap.set(note.id, editor.state);
      } finally {
        syncingFromNote.current = false;
      }
      void resolveRelativeImagesInEditor(editor);
    }

    // 5. Trigger Auto-Save to Disk / Workspace Files
    hasPendingDiskSaveRef.current = true;
    setSaveStatus("auto_saving");
    scheduleAutoSaveDiskRef.current?.();

    const timeLabel = formatRelativeDateTime(ver.timestamp, settings.dateFormat, settings.timeFormat, settings.language);
    const triggerLabel =
      ver.label ||
      (ver.trigger === "manual"
        ? t("versionHistoryPanel.manualSnapshot")
        : ver.trigger === "pre-restore"
        ? t("versionHistoryPanel.preRestoreBackup")
        : t("versionHistoryPanel.autoSnapshot"));

    toast({
      title: t("versionHistoryPanel.restoreSuccess"),
      description: `${triggerLabel} • ${timeLabel}`,
    });
  }, [note, onUpdate, editor, getBaseTitle, parseEditorContent, isTxtFile, isHtmlFile, isCssFile, serializeEditorContent, resolveRelativeImagesInEditor, t, toast, settings.dateFormat, settings.timeFormat, settings.language, lang]);

  const handleManualVersionSnapshot = useCallback((): NoteVersionSnapshot | null => {
    if (!note) return null;
    const isCode = isHtmlFile(note) || isCssFile(note) || isJsFile(note) || !editor;
    const currentContent = isCode ? (note.content || "") : serializeEditorContent(note, editor);
    const words = isCode
      ? (currentContent.trim() ? currentContent.trim().split(/\s+/).filter(Boolean).length : 0)
      : editorStats.wordCount;
    const chars = isCode ? currentContent.length : editorStats.charCount;

    const snap = saveVersionSnapshot(
      { ...note, content: currentContent },
      "manual",
      undefined,
      true,
      words,
      chars
    );
    return snap;
  }, [note, editor, isHtmlFile, isCssFile, isJsFile, serializeEditorContent, editorStats]);

  const handleCodeEditorChange = useCallback((val: string) => {
    if (!note) return;
    codeEditorContentMap.set(note.id, val);
    pendingSaveContentRef.current = { id: note.id, content: val };
    userEditedRef.current = true;
    hasPendingDiskSaveRef.current = true;
    setLastEditedTime(Date.now());
    setSaveStatus("unsaved");

    if (!note.isLocked) {
      try {
        localStorage.setItem(`luno_backup_${note.id}`, val);
        if (note.fileName) {
          localStorage.setItem(`luno_backup_fn_${note.fileName}`, val);
        }
      } catch {
        /* ignore localStorage quota */
      }
    }

    if (debouncedContentSaveTimeoutRef.current) {
      clearTimeout(debouncedContentSaveTimeoutRef.current);
    }

    debouncedContentSaveTimeoutRef.current = setTimeout(() => {
      if (isReadingModeRef.current) return;
      const currentNote = noteRef.current || note;
      if (!currentNote) return;

      const latestContent = (pendingSaveContentRef.current?.id === currentNote.id
        ? pendingSaveContentRef.current.content
        : null) ?? codeEditorContentMap.get(currentNote.id) ?? val;

      codeEditorContentMap.set(currentNote.id, latestContent);
      if (!currentNote.isLocked) {
        try {
          if (latestContent) {
            localStorage.setItem(`luno_backup_${currentNote.id}`, latestContent);
            if (currentNote.fileName) {
              localStorage.setItem(`luno_backup_fn_${currentNote.fileName}`, latestContent);
            }
          }
        } catch {
          /* ignore localStorage quota */
        }
      }

      onUpdate(currentNote.id, { content: latestContent });

      // Throttled and debounced automatic version snapshot on typing idle (10s)
      if (debouncedVersionSnapshotTimeoutRef.current) {
        clearTimeout(debouncedVersionSnapshotTimeoutRef.current);
      }
      const targetNote = { ...currentNote, content: latestContent };
      debouncedVersionSnapshotTimeoutRef.current = setTimeout(() => {
        const words = latestContent.trim() ? latestContent.trim().split(/\s+/).filter(Boolean).length : 0;
        const chars = latestContent.length;
        saveVersionSnapshot(
          targetNote,
          "auto",
          undefined,
          false,
          words,
          chars
        );
      }, 10000);

      if (!settings.autoSave) {
        setSaveStatus("unsaved");
        return;
      }
      autoSavingStartTimeRef.current = Date.now();
      setSaveStatus("auto_saving");
      scheduleAutoSaveDiskRef.current?.();
    }, 1000);
  }, [note, onUpdate, settings.autoSave, saveVersionSnapshot]);

  const fileToDataUrl = async (file: File) => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file as data URL"));
      reader.readAsDataURL(file);
    });
  };

  const resolveCssContent = async (assetPath: string): Promise<string | null> => {
    if (!note) return null;
    const resolvedRelPath = resolveAssetPath(note.folderPath || "", assetPath);
    if (!resolvedRelPath) return null;

    // 1. Check in-memory notes array first (live preview while editing CSS!)
    const normRel = resolvedRelPath.replace(/\\/g, "/").toLowerCase();
    const matchedNote = (notes || []).find((n) => {
      const nRel = (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName || "").replace(/\\/g, "/").toLowerCase();
      const nFile = (n.fileName || "").toLowerCase();
      return nRel === normRel || nFile === normRel;
    });

    if (matchedNote) {
      if (codeEditorContentMap.has(matchedNote.id)) {
        return codeEditorContentMap.get(matchedNote.id)!;
      }
      if (typeof matchedNote.content === "string") {
        return matchedNote.content;
      }
    }

    // 2. Electron Desktop direct file read
    const electronAPI = window.electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.readFileContent) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const fullPath = `${saved.folderPath}/${resolvedRelPath}`;
          const content = await electronAPI.readFileContent(fullPath);
          if (typeof content === "string") return content;
        }
      } catch (err) {
        console.warn("Electron CSS asset read failed:", assetPath, err);
      }
    }

    // 3. Web File System Access API
    if (rootDirHandle) {
      try {
        const handle = await resolveAssetHandle(assetPath);
        if (handle && typeof handle.getFile === "function") {
          const file = await handle.getFile();
          return await file.text();
        }
      } catch (err) {
        console.warn("Web CSS asset read failed:", assetPath, err);
      }
    }

    return null;
  };

  useEffect(() => {
    let cancelled = false;

    const loadPreviewHtml = async () => {
      if (!note || (note.contentFormat !== "html" && !isHtmlFile(note))) {
        if (!cancelled) setPreviewHtml("");
        return;
      }

      const rawHtml = codeEditorContentMap.get(note.id) ?? pendingSaveContentRef.current?.content ?? note.content ?? "";
      if (!rawHtml) {
        if (!cancelled) setPreviewHtml("");
        return;
      }

      const rewritten = await rewriteHtmlForPreview(
        rawHtml,
        async (assetPath) => {
          return await resolveAssetDataUrl(assetPath);
        },
        async (assetPath) => {
          return await resolveCssContent(assetPath);
        }
      );

      if (!cancelled) setPreviewHtml(rewritten);
    };

    void loadPreviewHtml();
    return () => {
      cancelled = true;
    };
  }, [note?.id, note?.content, note?.contentFormat, note?.folderPath, rootDirHandle, notes, isHtmlFile]);

  const openHtmlPreviewInNewTab = async () => {
    if (!note) return;

    const rawHtml = codeEditorContentMap.get(note.id) ?? note.content;
    const contentToOpen = note.contentFormat === "html" || isHtmlFile(note) ? (previewHtml || rawHtml) : (editor?.getHTML() ?? note.content);
    if (!contentToOpen) return;

    const rawTitle = note.fileName || note.title || "HTML Preview";
    const safeName = rawTitle.endsWith(".html") || rawTitle.endsWith(".htm") ? rawTitle : `${rawTitle}.html`;
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(contentToOpen)}`;

    let realFilePath: string | null = null;
    const electronAPI = window.electronAPI;

    if (electronAPI?.getSavedWorkspace) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath && note.fileName) {
          const fullPath = note.folderPath
            ? `${saved.folderPath}/${note.folderPath}/${note.fileName}`
            : `${saved.folderPath}/${note.fileName}`;

          if (electronAPI.writeFileContent && (note.contentFormat === "html" || isHtmlFile(note)) && rawHtml) {
            await electronAPI.writeFileContent({ fullPath, content: rawHtml });
          }
          realFilePath = fullPath.replace(/\\/g, "/");
        }
      } catch (err) {
        console.warn("Failed saving note to workspace on html preview:", err);
      }
    }

    if (!realFilePath && electronAPI?.savePreviewFile) {
      try {
        realFilePath = await electronAPI.savePreviewFile({ fileName: safeName, content: contentToOpen });
      } catch (err) {
        console.warn("Failed writing preview file to temp:", err);
      }
    }

    // Relative path with file:/// for clean display in omnibox
    const relativePath = note.folderPath ? `${note.folderPath}/${safeName}` : safeName;
    const cleanRelative = relativePath.replace(/^[/\\]+/, "").replace(/\\/g, "/");
    const displayUrl = `file:///${cleanRelative}`;

    if (onOpenWebTab) {
      onOpenWebTab(dataUrl, rawTitle, displayUrl, realFilePath || undefined);
      return;
    }

    const blob = new Blob([contentToOpen], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (popup) {
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      URL.revokeObjectURL(url);
    }
  };

  const extractTextFromTiptapJson = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === "text" && typeof n.text === "string") return n.text;
    if (Array.isArray(n.content)) {
      return n.content.map(extractTextFromTiptapJson).filter(Boolean).join("\n");
    }
    return "";
  };

  const stripTopH1FromHtml = (html: string): string => {
    if (!html) return "";
    return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, "");
  };

  const getContentToSave = (targetExt?: "md" | "txt" | "html" | "css" | "js", targetNote?: Note): string => {
    const n = targetNote || activeNoteRef.current || note;
    if (!n) return "";
    if (isHtmlFile(n) || isCssFile(n) || isJsFile(n) || targetExt === "css" || targetExt === "html" || targetExt === "js") {
      if (pendingSaveContentRef.current && pendingSaveContentRef.current.id === n.id) {
        return pendingSaveContentRef.current.content;
      }
      if (codeEditorContentMap.has(n.id)) {
        return codeEditorContentMap.get(n.id)!;
      }
      try {
        const backup = localStorage.getItem(`luno_backup_${n.id}`) ||
                       (n.fileName ? localStorage.getItem(`luno_backup_fn_${n.fileName}`) : null);
        if (backup !== null && backup !== undefined && !isEncryptedNote(backup)) {
          return backup;
        }
      } catch {
        /* ignore */
      }
      return n.content || "";
    }
    const sourceContent = noteRef.current?.id === n.id ? (noteRef.current?.content ?? n.content ?? "") : (n.content ?? "");
    if (isStrictReadingModeRef.current && (!targetExt || targetExt === "md" || isMarkdownNote(n))) {
      return sourceContent;
    }
    const format = targetExt === "txt" ? "plain" : targetExt === "md" ? "markdown" : getContentFormat();

    let rawHtml = "";
    if (editor && !editor.isDestroyed) {
      rawHtml = getCleanCollapsedHtml(editor);
    }

    let htmlContent = (!n || isTxtFile(n)) ? rawHtml : stripTopH1FromHtml(rawHtml);
    if (htmlContent && /footnote/i.test(htmlContent)) {
      htmlContent = htmlContent
        .replace(/<hr\b[^>]*class="[^"]*footnotes-sep[^"]*"[^>]*>/gi, "")
        .replace(/<section\b[^>]*class="[^"]*footnotes[^"]*"[^>]*>[\s\S]*?<\/section>/gi, "")
        .replace(/<ol\b[^>]*class="[^"]*footnotes-list[^"]*"[^>]*>[\s\S]*?<\/ol>/gi, "");
    }

    const isBlank = !htmlContent || htmlContent.trim() === "<p></p>" || htmlContent.trim() === "<h1></h1><p></p>";
    if (isBlank && n.content && n.content.trim() !== "<p></p>") {
      if (isTiptapJson(n.content)) {
        try {
          const parsed = JSON.parse(n.content);
          const extracted = extractTextFromTiptapJson(parsed);
          htmlContent = extracted ? `<p>${extracted}</p>` : n.content;
        } catch {
          htmlContent = n.content;
        }
      } else {
        htmlContent = n.content;
      }
    }

    if (!htmlContent) return "";

    if (format === "html") {
      return isLikelyHtml(htmlContent) ? htmlContent : `<p>${htmlContent}</p>`;
    } else if (format === "plain") {
      if (isLikelyHtml(htmlContent)) return getPlainTextFromHtml(htmlContent);
      const stripped = htmlContent
        .replace(/^#{1,6}\s+/gm, "")       // headings
        .replace(/\*\*(.+?)\*\*/g, "$1")   // bold
        .replace(/\*(.+?)\*/g, "$1")       // italic
        .replace(/^[-*+]\s+/gm, "")        // list markers
        .replace(/`([^`]+)`/g, "$1")       // inline code
        .replace(/~~(.+?)~~/g, "$1")       // strikethrough
        .replace(/\[(.+?)\]\(.+?\)/g, "$1"); // links
      return stripped;
    } else {
      // For markdown, convert HTML back to markdown using turndown rules
      let mdText = isLikelyHtml(htmlContent) ? getMarkdownFromHtml(htmlContent) : htmlContent;
      if (isMarkdownNote(n)) {
        const sourceContent = noteRef.current?.id === n.id ? (noteRef.current?.content ?? n.content ?? "") : (n.content ?? "");
        const parsedOriginal = parseFrontmatterAndTags(sourceContent);
        if (parsedOriginal.hasFrontmatter) {
          // Re-attach existing frontmatter without polluting it with inline tags
          const fm = parsedOriginal.frontmatterRaw.endsWith("\n") ? parsedOriginal.frontmatterRaw : parsedOriginal.frontmatterRaw + "\n";
          mdText = fm + mdText;
        }
        if (n.tags && n.tags.length > 0) {
          mdText = updateFrontmatterTags(mdText, n.tags);
        }
        if (n.icon !== undefined || n.iconColor !== undefined) {
          mdText = updateFrontmatterIcon(mdText, n.icon, n.iconColor);
        }
        if (n.isFavorite !== undefined) {
          mdText = updateFrontmatterFavorite(mdText, n.isFavorite);
        }
      }
      return mdText;
    }
  };

  const setSavedSnapshot = (noteId: string, ext: "md" | "txt" | "html" | "css" | "js", content: string) => {
    setSavedSnapshotByNoteId((prev) => ({
      ...prev,
      [noteId]: { ext, content },
    }));
  };

  const clearSavedSnapshot = (noteId: string) => {
    setSavedSnapshotByNoteId((prev) => {
      if (!(noteId in prev)) return prev;
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  };

  const updateLinkedMetadata = (noteId: string, fileName: string) => {
    onUpdate(noteId, {
      fileName,
      isLinkedFile: true,
    });
  };

  const clearLinkedMetadata = async () => {
    if (!note) return;
    fileHandleByNoteIdRef.current[note.id] = undefined;
    await removeStoredFileHandle(note.id);
    clearSavedSnapshot(note.id);
    onUpdate(note.id, {
      fileName: undefined,
      isLinkedFile: false,
    });
  };

  const downloadMarkdown = (markdown: string, ext: "md" | "txt" | "html" | "css" | "js" = "txt") => {
    if (!note) return;

    const normalizedContent = lineEnding === "CRLF"
      ? markdown.replace(/\r?\n/g, "\r\n")
      : markdown.replace(/\r\n/g, "\n");

    const blobType =
      ext === "txt"
        ? "text/plain;charset=utf-8"
        : ext === "html"
        ? "text/html;charset=utf-8"
        : ext === "css"
        ? "text/css;charset=utf-8"
        : ext === "js"
        ? "text/javascript;charset=utf-8"
        : "text/markdown;charset=utf-8";
    const blob = new Blob([normalizedContent], { type: blobType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTitle = (note?.title || "note").trim().replace(/[\\/:*?"<>|]/g, "_") || "note";

    anchor.href = url;
    anchor.download = `${safeTitle}.${ext}`;
    anchor.click();
    URL.revokeObjectURL(url);

    toast({
      title: t("editor.saveToastTitle"),
      description: t("editor.saveToastDownloaded", { file: anchor.download }),
    });

    setSavedSnapshot(note.id, ext, normalizedContent);
  };

  const performSave = async (content: string, ext: "md" | "txt" | "html" | "css", isSilent = false, targetNote?: Note) => {
    const n = targetNote || activeNoteRef.current || note;
    if (!n || isNoteDeleted(n.id) || deletedNoteIdsRef.current.has(n.id)) return;
    if (n.fileType === "image" || n.fileType === "binary") return;

    const normalizedContent = lineEnding === "CRLF"
      ? content.replace(/\r?\n/g, "\r\n")
      : content.replace(/\r\n/g, "\n");

    const currentOpId = ++saveOpIdRef.current;
    if (!isSilent) setSaveStatus("saving");

    const relPath = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName) : "";
    if (relPath && isRelativePathDeleted(relPath)) {
      if (saveOpIdRef.current === currentOpId) setSaveStatus("failed");
      return;
    }

    let finalPayloadToDisk = normalizedContent;
    if (n.isLocked) {
      const activePin = onGetActivePin?.(n.id);
      if (!activePin) {
        console.warn("Attempted to save locked note without active PIN session. Aborting save to protect ciphertext on disk.");
        if (saveOpIdRef.current === currentOpId) setSaveStatus("idle");
        return;
      }
      try {
        finalPayloadToDisk = await encryptNoteContent(normalizedContent, activePin);
      } catch (err) {
        console.error("Failed to encrypt note before disk save. Aborting save to prevent data leak:", err);
        if (saveOpIdRef.current === currentOpId) setSaveStatus("failed");
        return;
      }
    }

    const ensureMinAutoSavingDuration = async () => {
      if (isSilent && autoSavingStartTimeRef.current > 0) {
        const elapsed = Date.now() - autoSavingStartTimeRef.current;
        const MIN_DURATION = 800; // minimum 800ms display time so Auto-saving... is clearly visible and smooth
        const remaining = MIN_DURATION - elapsed;
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        autoSavingStartTimeRef.current = 0;
      }
    };

    // 1. Electron Desktop Native Direct Disk Save
    const electronAPI = window.electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent) {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath && n.fileName) {
        const fullPath = n.folderPath
          ? `${saved.folderPath}/${n.folderPath}/${n.fileName}`
          : `${saved.folderPath}/${n.fileName}`;

        const ok = await electronAPI.writeFileContent({ fullPath, content: finalPayloadToDisk });
        if (ok) {
          if (saveOpIdRef.current === currentOpId) {
            hasPendingDiskSaveRef.current = false;
            if (!isSilent) {
              userEditedRef.current = false;
              pendingSaveContentRef.current = null;
            }
            if (isHtmlFile(n) || isCssFile(n) || isJsFile(n)) {
              codeEditorContentMap.set(n.id, normalizedContent);
            }
            if (n.content !== normalizedContent && (!userEditedRef.current || !isSilent)) {
              onUpdate(n.id, { content: normalizedContent });
            }
          }
          setSavedSnapshot(n.id, ext, normalizedContent);
          await ensureMinAutoSavingDuration();
          if (saveOpIdRef.current === currentOpId) {
            setSaveStatus(isSilent ? "auto_saved" : "manually_saved");
          }
          if (!isSilent) {
            toast({
              title: t("editor.saveToastTitle"),
              description: n.fileName,
            });
          }
          return;
        }
      }
    }

    const existingHandle = await getFreshFileHandle(n, true);
    if (!existingHandle?.createWritable) {
      if (saveOpIdRef.current === currentOpId) {
        hasPendingDiskSaveRef.current = false;
        if (isHtmlFile(n) || isCssFile(n) || isJsFile(n)) {
          codeEditorContentMap.set(n.id, normalizedContent);
        }
        if (n.content !== normalizedContent && !userEditedRef.current) {
          onUpdate(n.id, { content: normalizedContent });
        }
        setSavedSnapshot(n.id, ext, normalizedContent);
        await ensureMinAutoSavingDuration();
        setSaveStatus(isSilent ? "auto_saved" : "manually_saved");
        if (!isSilent) {
          toast({
            title: t("editor.saveToastTitle"),
            description: n.fileName || n.title || "Note",
          });
        }
      }
      return;
    }

    let writable: FileSystemWritableFileStream | null = null;
    try {
      if (!isSilent) {
        const permission = await requestPermissionIfAvailable(existingHandle, "readwrite");
        if (permission !== "granted") {
          downloadMarkdown(finalPayloadToDisk, ext);
          if (saveOpIdRef.current === currentOpId) setSaveStatus("manually_saved");
          return;
        }
      }

      writable = await existingHandle.createWritable();
      await writable.write(finalPayloadToDisk);
      await writable.close();
      writable = null;
      if (saveOpIdRef.current === currentOpId) {
        hasPendingDiskSaveRef.current = false;
        if (isHtmlFile(n) || isCssFile(n) || isJsFile(n)) {
          codeEditorContentMap.set(n.id, normalizedContent);
        }
        if (n.content !== normalizedContent && !userEditedRef.current) {
          onUpdate(n.id, { content: normalizedContent });
        }
      }
      await setStoredFileHandle(n.id, existingHandle);
      const savedFile = await existingHandle.getFile();
      updateLinkedMetadata(n.id, savedFile.name);
      if (!isSilent) {
        toast({
          title: t("editor.saveToastTitle"),
          description: t("editor.saveToastSuccess", { file: savedFile.name }),
        });
      }
      setSavedSnapshot(n.id, ext, normalizedContent);
      await ensureMinAutoSavingDuration();
      if (saveOpIdRef.current === currentOpId) {
        setSaveStatus(isSilent ? "auto_saved" : "manually_saved");
      }
    } catch (error) {
      if (writable) {
        try {
          await (writable as unknown as { abort?: () => Promise<void> }).abort?.();
        } catch {
          /* ignore abort error */
        }
      }
      console.error("Save to existing file failed", error);
      if (saveOpIdRef.current === currentOpId) setSaveStatus("failed");
      if ((error as Error)?.name === "NotFoundError" || (error as Error)?.name === "NotAllowedError") {
        await clearLinkedMetadata();
      }
      if (!isSilent) downloadMarkdown(normalizedContent, ext);
    }
  };

  const performSaveAs = async (customContent?: string, customExt?: "md" | "txt" | "html" | "css") => {
    if (!note || isNoteDeleted(note.id)) return;
    if (note.fileType === "image" || note.fileType === "binary") return;

    const preferredExt = customExt || (getPreferredExtension() as "md" | "txt" | "html" | "css" | "js");
    const rawContent = customContent ?? getContentToSave(preferredExt);
    const content = lineEnding === "CRLF"
      ? rawContent.replace(/\r?\n/g, "\r\n")
      : rawContent.replace(/\r\n/g, "\n");
    const baseName = getSuggestedFileName().replace(/\.(md|txt|html|css|js|mjs|cjs)$/i, "");
    const defaultFileName = `${baseName}.${preferredExt}`;

    const currentOpId = ++saveOpIdRef.current;
    setSaveStatus("saving");

    // 1. Electron Desktop Native Save As Dialog
    const electronAPI = window.electronAPI;
    if (electronAPI?.showSaveDialog && electronAPI?.writeFileContent) {
      try {
        const filePath = await electronAPI.showSaveDialog({
          title: t("editor.saveAs"),
          defaultPath: defaultFileName,
          filters: [
            { name: "Markdown Document (*.md)", extensions: ["md", "markdown"] },
            { name: "Plain Text Document (*.txt)", extensions: ["txt"] },
            { name: "HTML Document (*.html)", extensions: ["html", "htm"] },
            { name: "CSS Stylesheet (*.css)", extensions: ["css"] },
            { name: "JavaScript File (*.js)", extensions: ["js", "mjs", "cjs"] },
            { name: "All Files (*.*)", extensions: ["*"] },
          ],
        });

        if (!filePath) {
          if (saveOpIdRef.current === currentOpId) setSaveStatus("saved");
          return;
        }

        const selectedExt = (filePath.split(".").pop() || "md").toLowerCase() as "md" | "txt" | "html" | "css" | "js";
        const finalContent = getContentToSave(selectedExt === "html" || selectedExt === "txt" || selectedExt === "css" || selectedExt === "js" ? selectedExt : "md");
        const ok = await electronAPI.writeFileContent({ fullPath: filePath, content: finalContent });
        if (ok) {
          setSavedSnapshot(note.id, selectedExt, finalContent);
          if (saveOpIdRef.current === currentOpId) setSaveStatus("manually_saved");
          const justName = filePath.replace(/\\/g, "/").split("/").pop() || defaultFileName;
          toast({
            title: t("editor.saveToastTitle"),
            description: justName,
          });
        }
        return;
      } catch (err) {
        console.error("Electron Save As failed:", err);
      }
    }

    // 2. Web Browser Native Save As File Picker
    if (typeof (window as any).showSaveFilePicker === "function") {
      try {
        const w = window as unknown as { showSaveFilePicker: (options?: unknown) => Promise<FileSystemFileHandle> };
        const handle = await w.showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [
            {
              description: "Markdown Document (*.md)",
              accept: { "text/markdown": [".md", ".markdown"] },
            },
            {
              description: "Plain Text Document (*.txt)",
              accept: { "text/plain": [".txt"] },
            },
            {
              description: "HTML Document (*.html)",
              accept: { "text/html": [".html", ".htm"] },
            },
            {
              description: "CSS Stylesheet (*.css)",
              accept: { "text/css": [".css"] },
            },
            {
              description: "JavaScript File (*.js)",
              accept: { "text/javascript": [".js", ".mjs", ".cjs"] },
            },
          ],
        });

        const file = await handle.getFile();
        const chosenExt = (file.name.split(".").pop() || "md").toLowerCase() as "md" | "txt" | "html" | "css" | "js";
        const finalContent = getContentToSave(chosenExt === "html" || chosenExt === "txt" || chosenExt === "css" || chosenExt === "js" ? chosenExt : "md");

        const writable = await handle.createWritable();
        await writable.write(finalContent);
        await writable.close();

        let targetNoteId = note.id;
        if (note.isLinkedFile && onCreate) {
          const result = onCreate(note.folderPath ?? undefined);
          const createdNote = result instanceof Promise ? await result : result;
          if (createdNote && "id" in createdNote) {
            targetNoteId = createdNote.id;
            onUpdate(targetNoteId, {
              content: chosenExt === "txt" ? finalContent : note.content,
              contentFormat: chosenExt === "txt" ? "plain" : chosenExt === "html" ? "html" : chosenExt === "css" ? "css" : chosenExt === "js" ? "javascript" : "markdown",
              isLinkedFile: false,
              fileName: undefined,
            });
          }
        }

        fileHandleByNoteIdRef.current[targetNoteId] = handle;
        await setStoredFileHandle(targetNoteId, handle);
        updateLinkedMetadata(targetNoteId, file.name);
        toast({
          title: t("editor.saveToastTitle"),
          description: file.name,
        });
        setSavedSnapshot(targetNoteId, chosenExt, finalContent);
        if (saveOpIdRef.current === currentOpId) setSaveStatus("manually_saved");
        return;
      } catch (error: any) {
        if (error?.name === "AbortError") {
          // User clicked Cancel in native dialog
          if (saveOpIdRef.current === currentOpId) setSaveStatus("saved");
          return;
        }
        console.warn("Save file picker failed, falling back to download:", error);
      }
    }

    // 3. Browser fallback
    downloadMarkdown(content, preferredExt);
    if (saveOpIdRef.current === currentOpId) setSaveStatus("manually_saved");
  };



  useEffect(() => {
    if (!note) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    let audioObjectUrl: string | null = null;
    let videoObjectUrl: string | null = null;
    let pdfObjectUrl: string | null = null;

    const initialUrl =
      note.content?.startsWith("data:image/") ||
      note.content?.startsWith("data:application/") ||
      note.content?.startsWith("blob:") ||
      note.content?.startsWith("http://") ||
      note.content?.startsWith("https://")
        ? note.content
        : null;

    setImageBlobUrl(initialUrl);
    setAudioBlobUrl(note.content?.startsWith("data:audio/") ? note.content : null);
    setVideoBlobUrl(
      note.content?.startsWith("data:video/") ||
      (isVideoFile(note) && (note.content?.startsWith("blob:") || note.content?.startsWith("http")))
        ? note.content
        : null
    );
    const sessionCleanPdfB64 = isPdfFile(note) ? pdfSessionCleanBase64Map.get(note.id) || null : null;
    const initialPdfB64 = sessionCleanPdfB64
      ? sessionCleanPdfB64
      : note.content?.startsWith("data:application/pdf;base64,")
      ? note.content.slice("data:application/pdf;base64,".length)
      : null;
    const initialPdfUrl =
      isPdfFile(note) && (note.content?.startsWith("blob:") || note.content?.startsWith("http"))
        ? note.content
        : null;
    setPdfLoadedNoteId(initialPdfB64 || initialPdfUrl ? note.id : null);
    setPdfBase64(initialPdfB64);
    setPdfBlobUrl(initialPdfUrl);
    setPdfFullPath((note as any)?.fullPath || undefined);
    setPdfWorkspaceFolder(null);
    setPdfSourceError(null);
    setPdfViewerState(null);
    setPdfActiveTool("select");
    setPdfBookmarks(pdfDraftBookmarksMap.get(note.id) || []);
    setPdfBookmarkOpen(false);
    setPdfBookmarkTitleInput("");
    setIsPdfViewLoaded(false);
    setIsPdfLoadingSource(isPdfFile(note) && !initialPdfB64 && !initialPdfUrl);
    setVideoDimensions(null);
    setVideoDuration(null);
    setVideoError(false);
    setIsImageZoomed(false);
    setCanZoomImage(false);
    setImageDimensions(null);
    setImageZoomMode("fit");
    setImageCustomZoom(100);
    setActiveFileSize((note as any)?.fileSize || null);

    const hydrateHandle = async () => {
      // 0. Check in-memory imageLocalCache and assetBlobUrlMap first for instant preview
      if (isImageFile(note)) {
        const relPath = note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName;
        if (relPath) {
          const altRelPath = relPath.startsWith("attachments/")
            ? relPath.replace(/^attachments\//, "attachment/")
            : relPath.startsWith("attachment/")
            ? relPath.replace(/^attachment\//, "attachments/")
            : undefined;

          const cachedUrl =
            imageLocalCache.get(relPath) ||
            (altRelPath ? imageLocalCache.get(altRelPath) : undefined) ||
            imageLocalCache.get(note.fileName || "") ||
            assetBlobUrlMap.current.get(relPath) ||
            (altRelPath ? assetBlobUrlMap.current.get(altRelPath) : undefined) ||
            assetBlobUrlMap.current.get(note.fileName || "");

          if (cachedUrl && !cancelled) {
            setImageBlobUrl(cachedUrl);
          }
        }
      }

      // 1. Electron Desktop Native Support
      const electronAPI = window.electronAPI;
      if (electronAPI && (electronAPI.readImageDataUrl || electronAPI.readFileBase64)) {
        try {
          let fullPath = (note as any).fullPath;
          if (!fullPath && electronAPI.getSavedWorkspace && note?.fileName) {
            const saved = await electronAPI.getSavedWorkspace();
            const wsFolder = typeof saved === "string" ? saved : saved?.folderPath;
            if (wsFolder && typeof wsFolder === "string") {
              const relPath = note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName;
              fullPath = `${wsFolder.replace(/[\\/]+$/, "")}/${relPath}`;
            }
          }

          if (fullPath) {
            const isImg = isImageFile(note);
            if (isImg) {
              const normPath = fullPath.replace(/\\/g, "/");
              let dataUrl = electronAPI.readImageDataUrl ? await electronAPI.readImageDataUrl(normPath) : null;
              if (!dataUrl && electronAPI.readImageDataUrl) {
                if (normPath.includes("/attachment/")) {
                  dataUrl = await electronAPI.readImageDataUrl(normPath.replace("/attachment/", "/attachments/"));
                } else if (normPath.includes("/attachments/")) {
                  dataUrl = await electronAPI.readImageDataUrl(normPath.replace("/attachments/", "/attachment/"));
                }
              }
              if (!dataUrl && electronAPI.readFileBase64) {
                let b64 = await electronAPI.readFileBase64(normPath);
                if (!b64) {
                  if (normPath.includes("/attachment/")) {
                    b64 = await electronAPI.readFileBase64(normPath.replace("/attachment/", "/attachments/"));
                  } else if (normPath.includes("/attachments/")) {
                    b64 = await electronAPI.readFileBase64(normPath.replace("/attachments/", "/attachment/"));
                  }
                }
                if (b64) {
                  const ext = (note.fileName || "").toLowerCase();
                  const mime = ext.endsWith(".png")
                    ? "image/png"
                    : ext.endsWith(".gif")
                    ? "image/gif"
                    : ext.endsWith(".webp")
                    ? "image/webp"
                    : ext.endsWith(".svg")
                    ? "image/svg+xml"
                    : "image/jpeg";
                  dataUrl = `data:${mime};base64,${b64}`;
                }
              }
              if (dataUrl && !cancelled) {
                if (dataUrl.startsWith("data:")) {
                  const base64Part = dataUrl.split(",")[1] || "";
                  const padding = (base64Part.match(/=/g) || []).length;
                  setActiveFileSize(Math.max(0, Math.floor((base64Part.length * 3) / 4 - padding)));
                }
                setImageBlobUrl(dataUrl);
                return;
              }
            }

            const isAud = isAudioFile(note);
            if (isAud && electronAPI.readFileBase64) {
              const b64 = await electronAPI.readFileBase64(fullPath);
              if (b64 && !cancelled) {
                const ext = (note.fileName || "").toLowerCase();
                let mime = "audio/mpeg";
                if (ext.endsWith(".wav")) mime = "audio/wav";
                else if (ext.endsWith(".ogg") || ext.endsWith(".opus")) mime = "audio/ogg";
                else if (ext.endsWith(".m4a") || ext.endsWith(".aac")) mime = "audio/mp4";
                else if (ext.endsWith(".flac")) mime = "audio/flac";
                else if (ext.endsWith(".webm")) mime = "audio/webm";

                try {
                  const byteCharacters = atob(b64);
                  setActiveFileSize(byteCharacters.length);
                  const byteNumbers = new Uint8Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const blob = new Blob([byteNumbers], { type: mime });
                  audioObjectUrl = URL.createObjectURL(blob);
                  setAudioBlobUrl(audioObjectUrl);
                  setVideoBlobUrl(null);
                  if (ext.endsWith(".webm")) {
                    probeWebmMediaKind(audioObjectUrl, note.fileName).then((kind) => {
                      if (cancelled) return;
                      if (kind === "video") {
                        setVideoBlobUrl(audioObjectUrl);
                        setAudioBlobUrl(null);
                      }
                    });
                  }
                } catch {
                  const padding = (b64.match(/=/g) || []).length;
                  setActiveFileSize(Math.max(0, Math.floor((b64.length * 3) / 4 - padding)));
                  const dataUrl = `data:${mime};base64,${b64}`;
                  setAudioBlobUrl(dataUrl);
                  setVideoBlobUrl(null);
                  if (ext.endsWith(".webm")) {
                    probeWebmMediaKind(dataUrl, note.fileName).then((kind) => {
                      if (cancelled) return;
                      if (kind === "video") {
                        setVideoBlobUrl(dataUrl);
                        setAudioBlobUrl(null);
                      }
                    });
                  }
                }
                return;
              }
            }

            const isVid = isVideoFile(note);
            if (isVid && electronAPI.readFileBase64) {
              const b64 = await electronAPI.readFileBase64(fullPath);
              if (b64 && !cancelled) {
                const ext = (note.fileName || "").toLowerCase();
                let mime = "video/mp4";
                if (ext.endsWith(".webm")) mime = "video/webm";
                else if (ext.endsWith(".mov")) mime = "video/quicktime";
                else if (ext.endsWith(".mkv")) mime = "video/x-matroska";
                else if (ext.endsWith(".avi")) mime = "video/x-msvideo";
                else if (ext.endsWith(".ogv")) mime = "video/ogg";
                else if (ext.endsWith(".m4v") || ext.endsWith(".3gp") || ext.endsWith(".mpg") || ext.endsWith(".mpeg")) mime = "video/mp4";

                try {
                  const byteCharacters = atob(b64);
                  setActiveFileSize(byteCharacters.length);
                  const byteNumbers = new Uint8Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const blob = new Blob([byteNumbers], { type: mime });
                  videoObjectUrl = URL.createObjectURL(blob);
                  setVideoBlobUrl(videoObjectUrl);
                  setAudioBlobUrl(null);
                  if (ext.endsWith(".webm")) {
                    probeWebmMediaKind(videoObjectUrl, note.fileName).then((kind) => {
                      if (cancelled) return;
                      if (kind === "audio") {
                        setAudioBlobUrl(videoObjectUrl);
                        setVideoBlobUrl(null);
                      }
                    });
                  }
                } catch {
                  const padding = (b64.match(/=/g) || []).length;
                  setActiveFileSize(Math.max(0, Math.floor((b64.length * 3) / 4 - padding)));
                  const dataUrl = `data:${mime};base64,${b64}`;
                  setVideoBlobUrl(dataUrl);
                  setAudioBlobUrl(null);
                  if (ext.endsWith(".webm")) {
                    probeWebmMediaKind(dataUrl, note.fileName).then((kind) => {
                      if (cancelled) return;
                      if (kind === "audio") {
                        setAudioBlobUrl(dataUrl);
                        setVideoBlobUrl(null);
                      }
                    });
                  }
                }
                return;
              }
            }

            // For PDF files in Electron, load base64 directly for Inko PDF Editor
            // Prefer pristine .base.pdf if annotations were previously flattened onto fullPath,
            // so reopening in Luno Note never double-renders flattened strokes under editable vector layers.
            const isPdf = isPdfFile(note);
            if (isPdf && electronAPI.readFileBase64) {
              try {
                let workspaceRoot: string | null = null;
                if (electronAPI.getSavedWorkspace) {
                  try {
                    const saved = await electronAPI.getSavedWorkspace();
                    workspaceRoot = (typeof saved === "string" ? saved : saved?.folderPath) || null;
                  } catch { /* ignore */ }
                }
                const b64 = await electronAPI.readFileBase64(fullPath);
                let sourceB64 = pdfSessionCleanBase64Map.get(note.id) || b64;
                if (!pdfSessionCleanBase64Map.get(note.id)) {
                  const candidateCleanPaths = Array.from(
                    new Set(
                      [
                        getElectronCleanBasePdfPath(fullPath, workspaceRoot),
                        getElectronCleanBasePdfPath(fullPath, null),
                      ].filter(Boolean) as string[]
                    )
                  );
                  for (const cleanBasePath of candidateCleanPaths) {
                    try {
                      const cleanB64 = await electronAPI.readFileBase64(cleanBasePath);
                      if (cleanB64 && cleanB64.length > 0) {
                        sourceB64 = cleanB64;
                        break;
                      }
                    } catch { /* ignore */ }
                  }
                }
                if (sourceB64) {
                  pdfSessionCleanBase64Map.set(note.id, sourceB64);
                }
                if (!cancelled) {
                  setPdfFullPath(fullPath);
                  setPdfWorkspaceFolder(workspaceRoot);
                  if (sourceB64) {
                    const sizeSource = b64 || sourceB64;
                    const padding = (sizeSource.match(/=/g) || []).length;
                    setActiveFileSize(Math.max(0, Math.floor((sizeSource.length * 3) / 4 - padding)));
                    setPdfBase64(sourceB64);
                    setPdfLoadedNoteId(note.id);
                    setPdfSourceError(null);
                  } else {
                    setPdfSourceError(t("editor.failedToReadPdfFile"));
                  }
                  setIsPdfLoadingSource(false);
                }
                return;
              } catch (err) {
                if (!cancelled) {
                  setPdfSourceError(err instanceof Error ? err.message : String(err));
                  setIsPdfLoadingSource(false);
                }
                return;
              }
            }

            // For other binary / raw files in Electron, load file size from base64 if not known yet
            if (!isImg && !isAud && !isVid && !isPdf && electronAPI.readFileBase64) {
              try {
                const b64 = await electronAPI.readFileBase64(fullPath);
                if (b64 && !cancelled) {
                  const padding = (b64.match(/=/g) || []).length;
                  setActiveFileSize(Math.max(0, Math.floor((b64.length * 3) / 4 - padding)));
                }
              } catch { /* ignore */ }
            }
          }
        } catch (err) {
          console.warn("Electron hydrate media failed:", err);
        }
      }

      // 2. Web File System Access API
      if (canUseNativeFs()) {
        let storedHandle = await getStoredFileHandle(note.id);
        if (!storedHandle && rootDirHandle && note.fileName) {
          try {
            let targetDir = rootDirHandle;
            const segments = (note.folderPath ?? "").split("/").filter(Boolean);
            for (let i = 0; i < segments.length; i++) {
              const segment = segments[i];
              try {
                targetDir = await targetDir.getDirectoryHandle(segment, { create: false });
              } catch (segErr) {
                if (segment.toLowerCase() === "attachment") {
                  try {
                    targetDir = await targetDir.getDirectoryHandle("attachments", { create: false });
                  } catch {
                    throw segErr;
                  }
                } else if (segment.toLowerCase() === "attachments") {
                  try {
                    targetDir = await targetDir.getDirectoryHandle("attachment", { create: false });
                  } catch {
                    throw segErr;
                  }
                } else {
                  throw segErr;
                }
              }
            }
            try {
              storedHandle = await targetDir.getFileHandle(note.fileName, { create: false });
            } catch (fileErr) {
              if (note.folderPath?.toLowerCase().includes("attachment")) {
                const altFolder = note.folderPath.toLowerCase().startsWith("attachments") ? "attachment" : "attachments";
                try {
                  const altDir = await rootDirHandle.getDirectoryHandle(altFolder, { create: false });
                  storedHandle = await altDir.getFileHandle(note.fileName, { create: false });
                } catch {
                  throw fileErr;
                }
              } else {
                throw fileErr;
              }
            }
            await setStoredFileHandle(note.id, storedHandle);
          } catch {
            /* ignore handle fallback error */
          }
        }
        if (cancelled || !storedHandle) {
          if (!cancelled && isPdfFile(note)) {
            setIsPdfLoadingSource(false);
          }
          return;
        }

        fileHandleByNoteIdRef.current[note.id] = storedHandle;

        try {
          const permission = await requestPermissionIfAvailable(storedHandle, "read");
          if (permission !== "granted") {
            if (!cancelled && isPdfFile(note)) {
              setIsPdfLoadingSource(false);
            }
            return;
          }

          const file = await storedHandle.getFile();
          if (!cancelled) {
            setActiveFileSize(file.size);
          }

          if (isImageFile(note)) {
            objectUrl = URL.createObjectURL(file);
            if (!cancelled) setImageBlobUrl(objectUrl);
            return;
          }

          if (isAudioFile(note)) {
            audioObjectUrl = URL.createObjectURL(file);
            if (!cancelled) {
              setAudioBlobUrl(audioObjectUrl);
              setVideoBlobUrl(null);
            }
            if ((note.fileName || "").toLowerCase().endsWith(".webm")) {
              probeWebmMediaKind(audioObjectUrl, note.fileName).then((kind) => {
                if (cancelled) return;
                if (kind === "video") {
                  setVideoBlobUrl(audioObjectUrl);
                  setAudioBlobUrl(null);
                }
              });
            }
            return;
          }

          if (isVideoFile(note)) {
            videoObjectUrl = URL.createObjectURL(file);
            if (!cancelled) {
              setVideoBlobUrl(videoObjectUrl);
              setAudioBlobUrl(null);
            }
            if ((note.fileName || "").toLowerCase().endsWith(".webm")) {
              probeWebmMediaKind(videoObjectUrl, note.fileName).then((kind) => {
                if (cancelled) return;
                if (kind === "audio") {
                  setAudioBlobUrl(videoObjectUrl);
                  setVideoBlobUrl(null);
                }
              });
            }
            return;
          }

          if (isPdfFile(note)) {
            const pdfBlob = file.type === "application/pdf" ? file : new Blob([file], { type: "application/pdf" });
            pdfObjectUrl = URL.createObjectURL(pdfBlob);
            if (!cancelled) {
              setPdfBlobUrl(pdfObjectUrl);
              setPdfLoadedNoteId(note.id);
              setPdfSourceError(null);
              setIsPdfLoadingSource(false);
            }
            // Generate base64 in background for offline persistence if needed, without blocking immediate PDF rendering
            file.arrayBuffer().then((buf) => {
              if (cancelled) return;
              const bytes = new Uint8Array(buf);
              let binary = "";
              const chunkSize = 0x8000;
              for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
              }
              const b64 = window.btoa(binary);
              if (!cancelled) {
                setPdfBase64(b64);
                setPdfLoadedNoteId(note.id);
              }
            }).catch(() => {});
            return;
          }

          if (note.fileType === "binary") return;

          const text = await file.text();
          const fname = file.name.toLowerCase();
          let format: "plain" | "markdown" | "html" = "markdown";
          if (fname.endsWith(".txt")) format = "plain";
          else if (fname.endsWith(".html") || fname.endsWith(".htm")) format = "html";

          if (!cancelled) {
            if (format === "html") {
              onUpdate(note.id, { content: text, contentFormat: "html" });
            } else {
              parseAndSetContent(text, format);
            }
            updateLinkedMetadata(note.id, file.name);
            setSavedSnapshot(note.id, format === "plain" ? "txt" : format === "html" ? "html" : "md", text);
          }
        } catch (error) {
          console.error("Load linked file failed", error);
          if (!cancelled) await clearLinkedMetadata();
        }
      }

      // 3. Data URL / Blob URL / IndexedDB Image Fallback
      if (!cancelled && isImageFile(note) && !objectUrl && !initialUrl) {
        if (note.content?.startsWith("data:image/") || note.content?.startsWith("blob:")) {
          setImageBlobUrl(note.content);
        } else {
          try {
            const idbBlob = await getImageFromIndexedDb(note.id);
            if (idbBlob && !cancelled) {
              objectUrl = URL.createObjectURL(idbBlob);
              setActiveFileSize(idbBlob.size);
              setImageBlobUrl(objectUrl);
            }
          } catch { /* ignore */ }
        }
      }
      if (!cancelled && isPdfFile(note)) {
        setIsPdfLoadingSource(false);
      }
    };

    void hydrateHandle();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
    };
  }, [note?.id, note?.fileName, note?.folderPath, note?.fileType, (note as any)?.fullPath, canUseNativeFs, rootDirHandle]);

  async function blobUrlToDataUrl(url: string): Promise<string> {
    if (!url || url.startsWith("data:")) return url;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("blobUrlToDataUrl failed:", err);
      return url;
    }
  }


  function printHtmlInBrowser(html: string) {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      try {
        document.body.removeChild(iframe);
      } catch { /* ignore */ }
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    const cleanup = () => {
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        } catch { /* ignore */ }
      }, 1000);
    };

    const executePrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Browser print failed:", err);
      } finally {
        cleanup();
      }
    };

    const waitForResourcesAndPrint = async () => {
      try {
        const docWithFonts = iframeDoc as unknown as { fonts?: { ready: Promise<void> } };
        const images = Array.from(iframeDoc.images);
        await Promise.race([
          Promise.all([
            docWithFonts?.fonts?.ready ? docWithFonts.fonts.ready : Promise.resolve(),
            Promise.all(
              images.map((img) => {
                img.loading = "eager";
                img.decoding = "sync";
                if (img.complete) {
                  return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
                }
                return new Promise<void>((resolve) => {
                  img.onload = () => {
                    if (img.decode) img.decode().catch(() => {}).then(resolve);
                    else resolve();
                  };
                  img.onerror = () => resolve();
                });
              })
            ),
          ]),
          new Promise((r) => setTimeout(r, 4000)),
        ]);
      } catch {
        // continue to print
      }
      setTimeout(executePrint, 200);
    };

    void waitForResourcesAndPrint();
  }

  const handlePrintImage = useCallback(async () => {
    if (!note) return;
    let src = imageBlobUrl || (note.content?.startsWith("data:") ? note.content : undefined);

    const electronAPI = (window as any).electronAPI;

    if (electronAPI?.readFileBase64 && (!src || src.startsWith("blob:"))) {
      try {
        const saved = await electronAPI.getSavedWorkspace?.();
        if (saved?.folderPath && note.fileName) {
          const folderPrefix = note.folderPath ? `${note.folderPath}/` : "";
          const fullPath = `${saved.folderPath}/${folderPrefix}${note.fileName}`;
          const b64 = await electronAPI.readFileBase64(fullPath);
          if (b64) {
            const ext = (note.fileName || "").toLowerCase();
            const mime = ext.endsWith(".png")
              ? "image/png"
              : ext.endsWith(".gif")
              ? "image/gif"
              : ext.endsWith(".webp")
              ? "image/webp"
              : ext.endsWith(".svg")
              ? "image/svg+xml"
              : "image/jpeg";
            src = `data:${mime};base64,${b64}`;
          }
        }
      } catch (err) {
        console.warn("Failed to read image for printing:", err);
      }
    }

    if (!src && imageBlobUrl) {
      src = imageBlobUrl;
    }

    if (!src) {
      toast({
        title: t("common.error"),
        description: t("editor.imageLoadError"),
        variant: "destructive",
      });
      return;
    }

    if (src.startsWith("blob:")) {
      try {
        src = await blobUrlToDataUrl(src);
      } catch (e) {
        console.warn("Could not convert blob URL to data URL:", e);
      }
    }

    const docTitle = note.fileName || note.title?.trim() || t("editor.untitled");
    const printHtml =
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(docTitle)}</title>` +
      `<style>` +
      `@page { size: auto; margin: 15mm; } ` +
      `body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; } ` +
      `img { max-width: 100vw; max-height: 100vh; width: auto; height: auto; object-fit: contain; }` +
      `</style>` +
      `</head><body><img src="${src}" alt="${escapeHtml(docTitle)}" /></body></html>`;

    if (electronAPI?.printContent) {
      const res = await electronAPI.printContent({ html: printHtml, title: docTitle });
      if (res && !res.success && res.error && res.failureReason !== "cancelled") {
        toast({
          title: t("common.error"),
          description: res.error,
          variant: "destructive",
        });
      }
    } else {
      printHtmlInBrowser(printHtml);
    }
  }, [note, imageBlobUrl, t]);

  function getExportBaseName() {
    if (!note) return t("editor.untitled");
    const name = note.fileName || note.title?.trim() || t("editor.untitled");
    const dotIdx = name.lastIndexOf(".");
    return dotIdx > 0 ? name.slice(0, dotIdx) : name;
  }

  async function handleExportPdf() {
    if (!note) return;
    const baseName = getExportBaseName();
    const docTitle = note.fileName?.replace(/\.[^/.]+$/, "") || note.title?.trim() || t("editor.untitled");

    let rawContent = "";
    if (isHtmlFile(note)) {
      rawContent = previewHtml || note.content;
    } else if (editor && !editor.isDestroyed && editor.view?.dom) {
      // 1. Clone live rendered Editor DOM to preserve syntax highlighting spans (lowlight) and React node views
      const clone = editor.view.dom.cloneNode(true) as HTMLElement;

      // 2. Remove interactive UI elements not meant for PDF (copy buttons, dropdowns, resize handles, control overlays)
      clone
        .querySelectorAll(
          "button, [role='button'], .column-resize-handle, .prosemirror-dropcursor, [data-resize-handle], .table-resize-handle, .table-column-handle, .table-row-handle, .cursor-se-resize, [title*='resize'], .node-image .absolute"
        )
        .forEach((el) => el.remove());

      // 3. Reset any content-visibility, contain, and 3D transforms that break Chromium printing
      clone.querySelectorAll("*").forEach((node) => {
        const el = node as HTMLElement;
        if (el.style) {
          if (el.style.contentVisibility) el.style.contentVisibility = "visible";
          if (el.style.contain) el.style.contain = "none";
          if (el.style.containIntrinsicSize) el.style.containIntrinsicSize = "none";
          if (el.style.transform && el.style.transform.includes("translateZ")) {
            el.style.transform = "none";
          }
        }
      });

      // 4. Synchronize live image src and force eager loading for print
      const origImgs = editor.view.dom.querySelectorAll<HTMLImageElement>("img");
      const clonedImgs = clone.querySelectorAll<HTMLImageElement>("img");
      clonedImgs.forEach((clonedImg, idx) => {
        const orig = origImgs[idx];
        if (orig) {
          const liveSrc = orig.currentSrc || orig.src;
          if (liveSrc && (!clonedImg.getAttribute("src") || !clonedImg.getAttribute("src")?.startsWith("data:"))) {
            clonedImg.setAttribute("src", liveSrc);
          }
        }
        clonedImg.removeAttribute("loading");
        clonedImg.setAttribute("loading", "eager");
        clonedImg.setAttribute("decoding", "sync");
      });

      // 5. Preserve checked state on checkboxes
      const originalCheckboxes = editor.view.dom.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      const clonedCheckboxes = clone.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      clonedCheckboxes.forEach((cb, idx) => {
        const orig = originalCheckboxes[idx];
        const isChecked = orig ? orig.checked : cb.closest('[data-checked="true"]') !== null;
        if (isChecked) {
          cb.setAttribute("checked", "checked");
          cb.checked = true;
        } else {
          cb.removeAttribute("checked");
          cb.checked = false;
        }
      });

      // 6. Synchronize live computed styles on inline hashtag badges for 100% editor parity
      const origBadges = editor.view.dom.querySelectorAll<HTMLElement>(".inline-tag-badge");
      const clonedBadges = clone.querySelectorAll<HTMLElement>(".inline-tag-badge");
      clonedBadges.forEach((clonedBadge, idx) => {
        const orig = origBadges[idx];
        if (orig) {
          const comp = window.getComputedStyle(orig);
          clonedBadge.style.backgroundColor = comp.backgroundColor;
          clonedBadge.style.color = comp.color;
          clonedBadge.style.borderColor = comp.borderColor;
          clonedBadge.style.borderWidth = comp.borderWidth || "1px";
          clonedBadge.style.borderStyle = comp.borderStyle || "solid";
          clonedBadge.style.borderRadius = comp.borderRadius || "0.375rem";
          clonedBadge.style.padding = comp.padding || "0.05rem 0.4rem";
          clonedBadge.style.fontSize = comp.fontSize || "0.85em";
          clonedBadge.style.fontWeight = comp.fontWeight || "500";
          clonedBadge.style.lineHeight = comp.lineHeight || "1.25";
          clonedBadge.style.display = "inline-flex";
          clonedBadge.style.alignItems = "center";
          clonedBadge.style.margin = comp.margin || "0 0.15rem";
          clonedBadge.style.verticalAlign = comp.verticalAlign || "baseline";
          clonedBadge.style.boxDecorationBreak = "clone";
          (clonedBadge.style as any).webkitBoxDecorationBreak = "clone";
        }
      });

      rawContent = clone.innerHTML;
    } else {
      rawContent = editor?.getHTML() ?? note.content ?? "";
    }

    if (!rawContent) return;

    const electronAPI = (window as any).electronAPI;
    let workspacePath = "";
    if (electronAPI?.getSavedWorkspace) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        workspacePath = saved?.folderPath || "";
      } catch { /* ignore */ }
    }

    // Inline all images (including QR codes, blob: URLs, and workspace attachments) to data: base64 URLs
    const content = await inlineImagesForPdf(rawContent, {
      readImageDataUrl: electronAPI?.readImageDataUrl
        ? (p: string) => electronAPI.readImageDataUrl(p)
        : undefined,
      workspacePath,
    });

    // Extract custom font CSS if registered
    const customFontsCss = typeof document !== "undefined"
      ? document.getElementById("luno-custom-fonts")?.textContent || ""
      : "";

    // Generate editor-parity PDF HTML
    const fullHtml = isHtmlFile(note) && content.includes("<html")
      ? content
      : generatePdfHtml({
          title: docTitle,
          bodyHtml: content,
          tags: isMarkdownNote(note) ? note.tags : undefined,
          editorFontFamily: settings.editorFontFamily || settings.fontFamily,
          editorFontSize: settings.editorFontSize || editorFontSize || 15,
          lineHeight: settings.lineHeight || "1.6",
          theme: settings.theme,
          accentHeadings: settings.accentHeadings,
          showCodeLineNumbers: settings.showCodeLineNumbers,
          tagColorStyle: settings.tagColorStyle,
          customAccentColor: settings.customAccentColor,
          customFontsCss,
          lang: settings.language || "th",
        });

    if (electronAPI?.exportPdf) {
      try {
        const res = await electronAPI.exportPdf({
          html: fullHtml,
          title: docTitle,
          defaultPath: `${baseName}.pdf`,
        });

        if (res.canceled) return;

        if (res.success && res.filePath) {
          const justName = res.filePath.replace(/\\/g, "/").split("/").pop() || `${baseName}.pdf`;
          toast({
            title: t("editor.exportPdfSuccess"),
            description: justName,
            action: electronAPI.showItemInFolder ? (
              <ToastAction
                altText={t("editor.showInFolder")}
                onClick={() => electronAPI.showItemInFolder?.(res.filePath!)}
              >
                {t("editor.showInFolder")}
              </ToastAction>
            ) : undefined,
          });
        } else if (res.error) {
          toast({
            title: t("common.error"),
            description: res.error,
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Export PDF failed:", err);
        toast({
          title: t("common.error"),
          description: String(err),
          variant: "destructive",
        });
      }
    } else {
      printHtmlInBrowser(fullHtml);
    }
  }

  async function handleExportWord() {
    if (!note) return;
    const baseName = getExportBaseName();
    const docTitle = note.fileName?.replace(/\.[^/.]+$/, "") || note.title?.trim() || t("editor.untitled");

    let rawContent = "";
    if (isHtmlFile(note)) {
      rawContent = previewHtml || note.content;
    } else if (editor && !editor.isDestroyed && editor.view?.dom) {
      // 1. Clone live rendered Editor DOM to preserve syntax highlighting spans (lowlight) and React node views
      const clone = editor.view.dom.cloneNode(true) as HTMLElement;

      // 2. Remove interactive UI elements not meant for Word export
      clone
        .querySelectorAll(
          "button, [role='button'], .column-resize-handle, .prosemirror-dropcursor, [data-resize-handle], .table-resize-handle, .table-column-handle, .table-row-handle, .cursor-se-resize, [title*='resize'], .node-image .absolute"
        )
        .forEach((el) => el.remove());

      // 3. Reset any content-visibility, contain, and 3D transforms
      clone.querySelectorAll("*").forEach((node) => {
        const el = node as HTMLElement;
        if (el.style) {
          if (el.style.contentVisibility) el.style.contentVisibility = "visible";
          if (el.style.contain) el.style.contain = "none";
          if (el.style.containIntrinsicSize) el.style.containIntrinsicSize = "none";
          if (el.style.transform && el.style.transform.includes("translateZ")) {
            el.style.transform = "none";
          }
        }
      });

      // 4. Synchronize live image src and force eager loading
      const origImgs = editor.view.dom.querySelectorAll<HTMLImageElement>("img");
      const clonedImgs = clone.querySelectorAll<HTMLImageElement>("img");
      clonedImgs.forEach((clonedImg, idx) => {
        const orig = origImgs[idx];
        if (orig) {
          const liveSrc = orig.currentSrc || orig.src;
          if (liveSrc && (!clonedImg.getAttribute("src") || !clonedImg.getAttribute("src")?.startsWith("data:"))) {
            clonedImg.setAttribute("src", liveSrc);
          }
        }
        clonedImg.removeAttribute("loading");
        clonedImg.setAttribute("loading", "eager");
        clonedImg.setAttribute("decoding", "sync");
      });

      // 5. Preserve checked state on checkboxes
      const originalCheckboxes = editor.view.dom.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      const clonedCheckboxes = clone.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      clonedCheckboxes.forEach((cb, idx) => {
        const orig = originalCheckboxes[idx];
        const isChecked = orig ? orig.checked : cb.closest('[data-checked="true"]') !== null;
        if (isChecked) {
          cb.setAttribute("checked", "checked");
          cb.checked = true;
        } else {
          cb.removeAttribute("checked");
          cb.checked = false;
        }
      });

      // 6. Synchronize live computed styles on inline hashtag badges
      const origBadges = editor.view.dom.querySelectorAll<HTMLElement>(".inline-tag-badge");
      const clonedBadges = clone.querySelectorAll<HTMLElement>(".inline-tag-badge");
      clonedBadges.forEach((clonedBadge, idx) => {
        const orig = origBadges[idx];
        if (orig) {
          const comp = window.getComputedStyle(orig);
          clonedBadge.style.backgroundColor = comp.backgroundColor;
          clonedBadge.style.color = comp.color;
          clonedBadge.style.borderColor = comp.borderColor;
          clonedBadge.style.borderWidth = comp.borderWidth || "1px";
          clonedBadge.style.borderStyle = comp.borderStyle || "solid";
          clonedBadge.style.borderRadius = comp.borderRadius || "0.375rem";
          clonedBadge.style.padding = comp.padding || "0.05rem 0.4rem";
          clonedBadge.style.fontSize = comp.fontSize || "0.85em";
          clonedBadge.style.fontWeight = comp.fontWeight || "500";
          clonedBadge.style.lineHeight = comp.lineHeight || "1.25";
          clonedBadge.style.display = "inline-flex";
          clonedBadge.style.alignItems = "center";
          clonedBadge.style.margin = comp.margin || "0 0.15rem";
          clonedBadge.style.verticalAlign = comp.verticalAlign || "baseline";
          clonedBadge.style.boxDecorationBreak = "clone";
          (clonedBadge.style as any).webkitBoxDecorationBreak = "clone";
        }
      });

      rawContent = clone.innerHTML;
    } else {
      rawContent = editor?.getHTML() ?? note.content ?? "";
    }

    if (!rawContent) return;

    const electronAPI = (window as any).electronAPI;
    let workspacePath = "";
    if (electronAPI?.getSavedWorkspace) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        workspacePath = saved?.folderPath || "";
      } catch { /* ignore */ }
    }

    // Inline all images (including QR codes, blob: URLs, and workspace attachments) to data: base64 URLs
    const content = await inlineImagesForPdf(rawContent, {
      readImageDataUrl: electronAPI?.readImageDataUrl
        ? (p: string) => electronAPI.readImageDataUrl(p)
        : undefined,
      workspacePath,
    });

    // Generate editor-parity Word HTML document
    const fullDocHtml = generateDocHtml({
      title: docTitle,
      bodyHtml: content,
      tags: isMarkdownNote(note) ? note.tags : undefined,
      editorFontFamily: settings.editorFontFamily || settings.fontFamily,
      editorFontSize: settings.editorFontSize || editorFontSize || 15,
      lineHeight: settings.lineHeight || "1.6",
      theme: settings.theme,
      accentHeadings: settings.accentHeadings,
      showCodeLineNumbers: settings.showCodeLineNumbers,
      tagColorStyle: settings.tagColorStyle,
      customAccentColor: settings.customAccentColor,
      lang: settings.language || "th",
    });

    if (electronAPI?.showSaveDialog && electronAPI?.writeFileContent) {
      try {
        const filePath = await electronAPI.showSaveDialog({
          title: t("editor.exportWord"),
          defaultPath: `${baseName}.doc`,
          filters: [
            { name: "Word Document (*.doc)", extensions: ["doc"] },
            { name: "All Files (*.*)", extensions: ["*"] },
          ],
        });

        if (!filePath) return;

        const ok = await electronAPI.writeFileContent({
          fullPath: filePath,
          content: "\ufeff" + fullDocHtml,
        });

        if (ok) {
          const justName = filePath.replace(/\\/g, "/").split("/").pop() || `${baseName}.doc`;
          toast({
            title: t("editor.exportWordSuccess"),
            description: justName,
            action: electronAPI.showItemInFolder ? (
              <ToastAction
                altText={t("editor.showInFolder")}
                onClick={() => electronAPI.showItemInFolder?.(filePath)}
              >
                {t("editor.showInFolder")}
              </ToastAction>
            ) : undefined,
          });
          return;
        }
      } catch (err) {
        console.error("Native Word export error:", err);
      }
    }

    // Fallback: Web browser download
    const blob = new Blob(["\ufeff", fullDocHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: t("editor.exportWordSuccess"),
      description: `${baseName}.doc`,
    });
  }

  async function handleSaveFile() {
    if (!note) return;
    if (isPdfFile(note)) {
      setSaveStatus("saving");
      const ok = await pdfEditorRef.current?.saveAnnotations();
      if (ok) {
        setSaveStatus("manually_saved");
      } else {
        setSaveStatus("unsaved");
      }
      return;
    }
    if (note.fileType === "image" || note.fileType === "binary") return;

    if (debouncedContentSaveTimeoutRef.current) {
      clearTimeout(debouncedContentSaveTimeoutRef.current);
      debouncedContentSaveTimeoutRef.current = null;
    }

    const ext = getPreferredExtension() as "md" | "txt" | "html" | "css";
    const content = getContentToSave(ext);

    if (isHtmlFile(note) || isCssFile(note) || isJsFile(note) || ext === "html" || ext === "css") {
      codeEditorContentMap.set(note.id, content);
      if (!note.isLocked) {
        try {
          localStorage.setItem(`luno_backup_${note.id}`, content);
          if (note.fileName) {
            localStorage.setItem(`luno_backup_fn_${note.fileName}`, content);
          }
        } catch {
          /* ignore */
        }
      }
      userEditedRef.current = false;
      hasPendingDiskSaveRef.current = false;
      pendingSaveContentRef.current = null;
    }

    // 1. Electron Desktop Native Direct Save or Cloud / Workspace Save
    const electronAPI = window.electronAPI;
    if ((electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent && note.fileName) || settings.storageMode === "gdrive" || rootDirHandle || note.fileName) {
      await performSave(content, ext, false);
      return;
    }

    const existingHandle = fileHandleByNoteIdRef.current[note.id] ?? (await getStoredFileHandle(note.id));

    if (!existingHandle?.createWritable) {
      setPendingSaveAction("saveas");
      setExtensionDialogOpen(true);
      return;
    }

    await performSave(content, ext, false);
  }

  async function handleExtensionSelected(ext: "md" | "txt" | "html" | "css") {
    if (!note) return;
    setSelectedExtension(ext);
    const content = getContentToSave(ext);
    setExtensionDialogOpen(false);
    if (pendingSaveAction === "save") {
      await performSave(content, ext);
    } else if (pendingSaveAction === "saveas") {
      await performSaveAs(content, ext);
    }
    setPendingSaveAction(null);
  }

  async function handleDeleteNote() {
    if (!note) return;

    deletedNoteIdsRef.current.add(note.id);
    if (autoSaveDiskTimeoutRef.current) {
      clearTimeout(autoSaveDiskTimeoutRef.current);
    }
    delete fileHandleByNoteIdRef.current[note.id];
    await clearLinkedMetadata();

    setDeleteConfirmOpen(false);
    if (onDeleteFile) {
      await onDeleteFile(note);
    } else {
      onDelete(note.id);
    }
  }

  function renderSaveStatusIndicator() {
    if (isNoteCurrentlyLocked) {
      return null;
    }

    const isNonEditable =
      !note ||
      note.fileType === "image" ||
      (note.fileType === "binary" && !isPdfFile(note)) ||
      note.fileName?.toLowerCase()?.endsWith(".zip");

    if (isNonEditable) {
      return null;
    }

    const isAnim = settings?.enableAnimations !== false;

    const solidCheckIcon = (
      <CheckCircle2
        key={saveStatus}
        className={`h-3.5 w-3.5 shrink-0 fill-emerald-600 text-white dark:fill-emerald-400 dark:text-background ${
          isAnim ? "animate-in zoom-in-75 fade-in duration-300 ease-out" : ""
        }`}
      />
    );

    let icon = solidCheckIcon;
    let text = t("saveStatus.saved");
    let textClass = "text-emerald-600 dark:text-emerald-400 font-medium";

    switch (saveStatus) {
      case "saving":
        icon = <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/70" />;
        text = t("saveStatus.saving");
        textClass = "text-muted-foreground/70 font-medium";
        break;
      case "auto_saving":
        icon = <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground/70" />;
        text = t("saveStatus.autoSaving");
        textClass = "text-muted-foreground/70 font-medium";
        break;
      case "auto_saved":
        icon = solidCheckIcon;
        text = t("saveStatus.autoSaved");
        textClass = "text-emerald-600 dark:text-emerald-400 font-medium";
        break;
      case "manually_saved":
        icon = solidCheckIcon;
        text = t("saveStatus.manuallySaved");
        textClass = "text-emerald-600 dark:text-emerald-400 font-medium";
        break;
      case "saved":
        icon = solidCheckIcon;
        text = t("saveStatus.saved");
        textClass = "text-emerald-600 dark:text-emerald-400 font-medium";
        break;
      case "unsaved":
        icon = <CircleDotDashedIcon className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />;
        text = t("saveStatus.unsavedChanges");
        textClass = "text-amber-600 dark:text-amber-400 font-medium";
        break;
      case "failed":
        icon = <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />;
        text = t("saveStatus.saveFailed");
        textClass = "text-rose-600 dark:text-rose-400 font-medium";
        break;
    }

    const getLastEditedLabel = () => {
      if (!lastEditedTime) return t("saveStatus.editedJustNow");
      const diffSec = Math.floor((Date.now() - lastEditedTime) / 1000);
      if (diffSec < 10) return t("saveStatus.editedJustNow");
      if (diffSec < 60) return t("saveStatus.editedAt", { time: t("saveStatus.secondsAgo", { count: diffSec }) });
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return t("saveStatus.editedAt", { time: t("saveStatus.minutesAgo", { count: diffMin }) });
      const diffHr = Math.floor(diffMin / 60);
      return t("saveStatus.editedAt", { time: t("saveStatus.hoursAgo", { count: diffHr }) });
    };

    const isIconOnly = paneId !== "main";

    return (
      <div className="flex items-center gap-1.5 select-none text-[11.5px] shrink-0 transition-opacity duration-300">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 cursor-default transition-colors duration-200 ${textClass}`}>
              {icon}
              {!isIconOnly && <span className="hidden sm:inline transition-all duration-200">{text}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>{text}</TooltipContent>
        </Tooltip>
        {!isIconOnly && (
          <>
            <span className="hidden md:inline text-muted-foreground/30 font-light">|</span>
            <span className="hidden md:inline text-muted-foreground/70 transition-opacity duration-300">{getLastEditedLabel()}</span>
          </>
        )}
      </div>
    );
  }

  function renderActionButtons() {
    if (!note || isNoteCurrentlyLocked) return null;

    const isImg = isImageFile(note);
    const isBin = isBinaryFile(note);
    const isHtml = note.contentFormat === "html" || isHtmlFile(note);
    const isCss = note.contentFormat === "css" || isCssFile(note);
    const isJs = note.contentFormat === "javascript" || note.contentFormat === "js" || isJsFile(note);
    const isCode = isCodeFile(note);

    // 1. Image Actions: Print, Share (and Relock if locked)
    if (isImg) {
      return (
        <Fragment>
          {/* Print Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrintImage}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="sr-only">{t("editor.print")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.print")}</TooltipContent>
          </Tooltip>

          {/* Share Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!note || isSharingLoading || isNoteCurrentlyLocked}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                onClick={handleShareClick}
              >
                {isSharingLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  (() => {
                    const ShareIconComp = getToolbarIcon("share", settings.iconPack);
                    return <ShareIconComp className="h-3.5 w-3.5" />;
                  })()
                )}
                <span className="sr-only">{t("breadcrumb.share")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("breadcrumb.share")}</TooltipContent>
          </Tooltip>

          {/* Relock Note */}
          {note.isLocked && note.isDecrypted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRelockNote?.(note.id)}
                  className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                >
                  {(() => {
                    const LockIconComp = getToolbarIcon("lock", settings.iconPack);
                    return <LockIconComp className="h-3.5 w-3.5" />;
                  })()}
                  <span className="sr-only">{t("pinLock.relockNote")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("pinLock.relockNote")}</TooltipContent>
            </Tooltip>
          )}
        </Fragment>
      );
    }

    // 1b. PDF Editor Actions: Search, Reading/Editing Mode, Save Dropdown, Print, Share, Relock
    if (isPdfFile(note)) {
      const isTh = settings.language === "th";
      return (
        <Fragment>
          {/* Search Button for PDF Editor (matching Relations tab & Code editor search style) */}
          <Popover open={isPdfSearchOpen} onOpenChange={handlePdfSearchOpenChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-testid="pdf-search-button"
                    className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none select-none"
                  >
                    {(() => {
                      const SearchIconComp = getToolbarIcon("search", settings.iconPack);
                      return <SearchIconComp className="h-3.5 w-3.5" />;
                    })()}
                    <span className="sr-only">{t("sidebar.searchShortPlaceholder")}</span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t("editor.findCtrlF")}
              </TooltipContent>
            </Tooltip>

            <PopoverContent
              data-pdf-search-popover="true"
              align="end"
              sideOffset={6}
              className="w-64 sm:w-72 p-2 rounded-2xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md select-text"
            >
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 border border-border/60 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                {(() => {
                  const SearchIconComp = getToolbarIcon("search", settings.iconPack);
                  return <SearchIconComp className="h-3.5 w-3.5 shrink-0 text-muted-foreground pointer-events-none" />;
                })()}
                <input
                  ref={pdfSearchInputRef}
                  data-pdf-search="true"
                  data-testid="pdf-search-input"
                  type="text"
                  value={pdfSearchQuery}
                  onChange={(e) => handlePdfSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.shiftKey) {
                        handlePdfSearchPrev();
                      } else {
                        handlePdfSearchNext();
                      }
                    } else if (e.key === "Escape") {
                      if (pdfSearchQuery) {
                        handlePdfSearchQueryChange("");
                      } else {
                        setIsPdfSearchOpen(false);
                        pdfEditorRef.current?.closeSearch();
                      }
                    }
                  }}
                  placeholder={t("editor.findInPdf")}
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-normal"
                  autoFocus
                />
                {pdfSearchQuery && (
                  <button
                    type="button"
                    data-testid="pdf-search-clear"
                    onClick={() => handlePdfSearchQueryChange("")}
                    className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {pdfSearchQuery.trim() && (
                <div className="mt-2 px-1 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40 pt-1.5">
                  <span data-testid="pdf-search-count">
                    {pdfSearchStats.total > 0
                      ? t(pdfSearchStats.total === 1 ? "editor.searchMatchOne" : "editor.searchMatchMany", {
                          total: pdfSearchStats.total,
                          progress: pdfSearchStats.current >= 0 ? ` (${pdfSearchStats.current + 1}/${pdfSearchStats.total})` : "",
                        })
                      : t("editor.noMatchingText")}
                  </span>
                  {pdfSearchStats.total > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            data-testid="pdf-search-prev"
                            onClick={handlePdfSearchPrev}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                            <span className="sr-only">Previous match</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.previousMatchShiftEnter")}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            data-testid="pdf-search-next"
                            onClick={handlePdfSearchNext}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                            <span className="sr-only">Next match</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.nextMatchEnter")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Reading / Editing Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsReadingMode((prev) => !prev)}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus-visible:ring-0 focus-visible:outline-none focus:outline-none"
              >
                {(() => {
                  const IconComp = getToolbarIcon(isReadingMode ? "edit" : "bookOpen", settings.iconPack);
                  return <IconComp className="h-3.5 w-3.5" />;
                })()}
                <span className="sr-only">
                  {isReadingMode ? (t("editor.editMode")) : (t("editor.readingMode"))}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isReadingMode ? (t("editor.editMode")) : (t("editor.readingMode"))}
            </TooltipContent>
          </Tooltip>

          {/* Save Dropdown for PDF */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!note || isNoteCurrentlyLocked}
                    className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                  >
                    {(() => {
                      const SaveIconComp = getToolbarIcon("save", settings.iconPack);
                      return <SaveIconComp className="h-3.5 w-3.5" />;
                    })()}
                    <span className="sr-only">{t("editor.saveFile")}</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("editor.saveFile")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-md">
              <DropdownMenuItem
                disabled={!note || isNoteCurrentlyLocked}
                onClick={() => void handleSaveFile()}
                className="gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center"
              >
                {(() => {
                  const SaveIconComp = getToolbarIcon("save", settings.iconPack);
                  return <SaveIconComp className="h-4 w-4 shrink-0" />;
                })()}
                <span>{t("editor.save")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!note || isNoteCurrentlyLocked}
                onClick={() => void pdfEditorRef.current?.exportFlattenedPdfAs()}
                className="gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center"
              >
                {(() => {
                  const FileIconComp = getToolbarIcon("file", settings.iconPack);
                  return <FileIconComp className="h-4 w-4 shrink-0" />;
                })()}
                <span>{t("editor.saveAs")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Print PDF Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void pdfEditorRef.current?.printPdf()}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
              >
                {(() => {
                  const PrintIconComp = getToolbarIcon("printer", settings.iconPack);
                  return <PrintIconComp className="h-3.5 w-3.5" />;
                })()}
                <span className="sr-only">{t("editor.print")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("editor.print")}</TooltipContent>
          </Tooltip>

          {/* Share Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!note || isSharingLoading || isNoteCurrentlyLocked}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                onClick={handleShareClick}
              >
                {isSharingLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  (() => {
                    const ShareIconComp = getToolbarIcon("share", settings.iconPack);
                    return <ShareIconComp className="h-3.5 w-3.5" />;
                  })()
                )}
                <span className="sr-only">{t("breadcrumb.share")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("breadcrumb.share")}</TooltipContent>
          </Tooltip>

          {/* Version History Button — Standard Luno Version History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (note && !isNoteCurrentlyLocked) {
                    setVersionHistoryOpen((prev) => !prev);
                  }
                }}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none select-none"
              >
                {(() => {
                  const HistoryIconComp = getToolbarIcon("history", settings.iconPack);
                  return <HistoryIconComp className="h-3.5 w-3.5" />;
                })()}
                <span className="sr-only">{t("breadcrumb.versionHistory")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("breadcrumb.versionHistory")}</TooltipContent>
          </Tooltip>

          {/* Relock Note */}
          {note.isLocked && note.isDecrypted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRelockNote?.(note.id)}
                  className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                >
                  {(() => {
                    const LockIconComp = getToolbarIcon("lock", settings.iconPack);
                    return <LockIconComp className="h-3.5 w-3.5" />;
                  })()}
                  <span className="sr-only">{t("pinLock.relockNote")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("pinLock.relockNote")}</TooltipContent>
            </Tooltip>
          )}
        </Fragment>
      );
    }

    // 2. Binary / Archive / Document Actions: Share (and Relock if locked)
    if (isBin) {
      return (
        <Fragment>
          {/* Share Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!note || isSharingLoading}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                onClick={handleShareClick}
              >
                {isSharingLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  (() => {
                    const ShareIconComp = getToolbarIcon("share", settings.iconPack);
                    return <ShareIconComp className="h-3.5 w-3.5" />;
                  })()
                )}
                <span className="sr-only">{t("breadcrumb.share")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("breadcrumb.share")}</TooltipContent>
          </Tooltip>

          {/* Relock Note */}
          {note.isLocked && note.isDecrypted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRelockNote?.(note.id)}
                  className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
                >
                  {(() => {
                    const LockIconComp = getToolbarIcon("lock", settings.iconPack);
                    return <LockIconComp className="h-3.5 w-3.5" />;
                  })()}
                  <span className="sr-only">{t("pinLock.relockNote")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("pinLock.relockNote")}</TooltipContent>
            </Tooltip>
          )}
        </Fragment>
      );
    }

    // 3. Text / Code / HTML / Markdown Notes
    const isTh = settings.language === "th";
    return (
      <Fragment>
        {isHtml && (
          <div className="flex items-center gap-1 mr-1.5">
            <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-[11px] font-medium border border-border/50 select-none">
              <button
                type="button"
                onClick={() => handleToggleHtmlPreview(false)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                  !htmlPreviewOpen
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="h-3 w-3" />
                <span className="hidden sm:inline">{t("editor.modeEditor")}</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleHtmlPreview(true)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                  htmlPreviewOpen
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3 w-3" />
                <span className="hidden sm:inline">{t("editor.modePreview")}</span>
              </button>
            </div>

            {/* Responsive Device Switcher (Desktop, Tablet, Mobile) */}
            {htmlPreviewOpen && (
              <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-[11px] font-medium border border-border/50 select-none">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setHtmlDeviceMode("desktop")}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        htmlDeviceMode === "desktop"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      aria-label="Desktop (100%)"
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={4}>
                    Desktop (100%)
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setHtmlDeviceMode("tablet")}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        htmlDeviceMode === "tablet"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      aria-label="Tablet (768px)"
                    >
                      <Tablet className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={4}>
                    Tablet (768px)
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setHtmlDeviceMode("mobile")}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        htmlDeviceMode === "mobile"
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      aria-label="Mobile (375px)"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={4}>
                    Mobile (375px)
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}

        {/* Search Button for Code Editor (matching Relations tab search style) */}
        {(isHtml || isCss || isCode) && !htmlPreviewOpen && (
          <Popover open={isCodeSearchOpen} onOpenChange={handleCodeSearchOpenChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none select-none"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span className="sr-only">{t("sidebar.searchShortPlaceholder")}</span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t("editor.find")}
              </TooltipContent>
            </Tooltip>

            <PopoverContent
              data-code-search-popover="true"
              align="end"
              sideOffset={6}
              className="w-64 sm:w-72 p-2 rounded-2xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md select-text"
            >
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 border border-border/60 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground pointer-events-none" />
                <input
                  ref={codeSearchInputRef}
                  data-code-search="true"
                  type="text"
                  value={codeSearchQuery}
                  onChange={(e) => handleCodeSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.shiftKey) {
                        handleCodeSearchPrev();
                      } else {
                        handleCodeSearchNext();
                      }
                    } else if (e.key === "Escape") {
                      if (codeSearchQuery) {
                        handleCodeSearchQueryChange("");
                      } else {
                        setIsCodeSearchOpen(false);
                        codeEditorRef.current?.clearSearch();
                      }
                    }
                  }}
                  placeholder={t("editor.findInCode")}
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-normal"
                  autoFocus
                />
                {codeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => handleCodeSearchQueryChange("")}
                    className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {codeSearchQuery.trim() && (
                <div className="mt-2 px-1 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40 pt-1.5">
                  <span>
                    {codeSearchStats.total > 0
                      ? t(codeSearchStats.total === 1 ? "editor.searchMatchOne" : "editor.searchMatchMany", {
                          total: codeSearchStats.total,
                          progress: codeSearchStats.current >= 0 ? ` (${codeSearchStats.current + 1}/${codeSearchStats.total})` : "",
                        })
                      : t("editor.noMatchingText")}
                  </span>
                  {codeSearchStats.total > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={handleCodeSearchPrev}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                            <span className="sr-only">Previous match</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.previousMatchShiftEnter")}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={handleCodeSearchNext}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                            <span className="sr-only">Next match</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.nextMatchEnter")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Reading Mode button for Markdown / Text files */}
        {!(isHtml || isCss || isCode) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!note}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus-visible:ring-0 focus-visible:outline-none focus:outline-none"
                onClick={() => {
                  const currentTop = editorScrollContainerRef.current?.scrollTop || 0;
                  if (note?.id && currentTop > 0) {
                    setNoteScrollPosition(note.id, currentTop);
                  }
                  setIsReadingMode((prev) => {
                    const next = !prev;
                    requestAnimationFrame(() => {
                      if (editorScrollContainerRef.current && currentTop > 0) {
                        editorScrollContainerRef.current.scrollTop = currentTop;
                      }
                    });
                    setTimeout(() => {
                      if (editorScrollContainerRef.current && currentTop > 0) {
                        editorScrollContainerRef.current.scrollTop = currentTop;
                      }
                    }, 50);
                    return next;
                  });
                }}
              >
                {(() => {
                  const IconComp = getToolbarIcon(isReadingMode ? "edit" : "bookOpen", settings.iconPack);
                  return <IconComp className="h-3.5 w-3.5" />;
                })()}
                <span className="sr-only">
                  {isReadingMode ? (t("editor.editMode")) : (t("editor.readingMode"))}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isReadingMode ? (t("editor.editMode")) : (t("editor.readingMode"))}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Lock note button */}
        {note && note.isLocked && note.isDecrypted && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRelockNote?.(note.id)}
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
              >
                {(() => {
                  const LockIconComp = getToolbarIcon("lock", settings.iconPack);
                  return <LockIconComp className="h-3.5 w-3.5" />;
                })()}
                <span className="sr-only">{t("pinLock.relockNote")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("pinLock.relockNote")}</TooltipContent>
          </Tooltip>
        )}

        {/* Save Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" disabled={!note || isNoteCurrentlyLocked} className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5">
                  {(() => {
                    const SaveIconComp = getToolbarIcon("save", settings.iconPack);
                    return <SaveIconComp className="h-3.5 w-3.5" />;
                  })()}
                  <span className="sr-only">{t("editor.saveFile")}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{t("editor.saveFile")}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem disabled={!note || isNoteCurrentlyLocked} onClick={() => void handleSaveFile()}>
              {(() => {
                const SaveIconComp = getToolbarIcon("save", settings.iconPack);
                return <SaveIconComp className="h-4 w-4" />;
              })()}
              <span>{t("editor.save")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!note || isNoteCurrentlyLocked} onClick={() => void performSaveAs()}>
              {(() => {
                const FileIconComp = getToolbarIcon("file", settings.iconPack);
                return <FileIconComp className="h-4 w-4" />;
              })()}
              <span>{t("editor.saveAs")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Share Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!note || isSharingLoading || isNoteCurrentlyLocked}
              className="hidden sm:inline-flex h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer"
              onClick={handleShareClick}
            >
              {isSharingLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                (() => {
                  const ShareIconComp = getToolbarIcon("share", settings.iconPack);
                  return <ShareIconComp className="h-3.5 w-3.5" />;
                })()
              )}
              <span className="sr-only">{t("breadcrumb.share")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("breadcrumb.share")}</TooltipContent>
        </Tooltip>

        {/* Version History Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!note || isNoteCurrentlyLocked}
              className="inline-flex h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none select-none"
              onClick={() => {
                if (note && !isNoteCurrentlyLocked) {
                  setVersionHistoryOpen((prev) => !prev);
                }
              }}
            >
              {(() => {
                const HistoryIconComp = getToolbarIcon("history", settings.iconPack);
                return <HistoryIconComp className="h-3.5 w-3.5" />;
              })()}
              <span className="sr-only">{t("breadcrumb.versionHistory")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("breadcrumb.versionHistory")}</TooltipContent>
        </Tooltip>
      </Fragment>
    );
  }

  if (!note) {
    return (
      <>
        {effectiveStatusPortalTarget && createPortal(renderSaveStatusIndicator(), effectiveStatusPortalTarget)}
        {effectivePortalTarget && createPortal(renderActionButtons(), effectivePortalTarget)}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground relative">
          <p className="text-sm">{t("editor.selectOrCreate")}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("sidebar.newNote")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52">
              <DropdownMenuItem onClick={handleOpenCreateFileDialog}>
                <FileText className="h-4 w-4" />
                <span>{t("sidebar.createFileAction")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenCreateFolderDialog}>
                <FolderPlus className="h-4 w-4" />
                <span>{t("sidebar.createFolderAction")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog open={createFileDialogOpen} onOpenChange={setCreateFileDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t("sidebar.createFileTitle")}</DialogTitle>
              <DialogDescription>{t("sidebar.createFileDescription")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div>
                <label htmlFor="new-file-name-editor" className="mb-2 block text-sm font-medium text-foreground">
                  {t("sidebar.fileNameLabel")}
                </label>
                <input
                  id="new-file-name-editor"
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateFileFromDialog();
                    }
                  }}
                  placeholder={
                    settings.newFilePattern === "date"
                      ? `Note_${formatDateForFileName(new Date(), settings.dateFormat)}`
                      : settings.newFilePattern === "daily"
                      ? `Daily-${formatDateForFileName(new Date(), settings.dateFormat)}`
                      : "Untitled"
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="new-file-ext-editor" className="mb-2 block text-sm font-medium text-foreground">
                  {t("sidebar.fileExtensionLabel")}
                </label>
                <Select value={newFileExt} onValueChange={(v) => setNewFileExt(v as "txt" | "md" | "html" | "css" | "js")}>
                  <SelectTrigger id="new-file-ext-editor" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">{t("sidebar.fileTypeTxt")}</SelectItem>
                    <SelectItem value="md">{t("sidebar.fileTypeMd")}</SelectItem>
                    <SelectItem value="html">{t("sidebar.fileTypeHtml")}</SelectItem>
                    <SelectItem value="css">{t("sidebar.fileTypeCss")}</SelectItem>
                    <SelectItem value="js">{t("sidebar.fileTypeJs")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateFileDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={handleCreateFileFromDialog}>
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
              <label htmlFor="new-folder-name-editor" className="mb-2 block text-sm font-medium text-foreground">
                {t("sidebar.folderNameLabel")}
              </label>
              <input
                id="new-folder-name-editor"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateFolderFromDialog();
                  }
                }}
                placeholder="Untitled"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
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

        <AlertDialog open={Boolean(alertMessage)} onOpenChange={(open) => !open && setAlertMessage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("editor.cannotOpenFile")}</AlertDialogTitle>
              <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>{t("common.ok")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-lg p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" />
                <span>{t("editor.shortcutsTitle")}</span>
              </DialogTitle>
              <DialogDescription>{t("editor.shortcutsDescription")}</DialogDescription>
            </DialogHeader>

            <div className="my-2 max-h-[60vh] overflow-y-auto space-y-2.5 pr-1 no-scrollbar text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutTabDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutTab")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutBoldDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutBold")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutItalicDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutItalic")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutStrikeDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutStrike")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutSuperscriptDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutSuperscript")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutSubscriptDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutSubscript")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutToggleDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutToggle")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutFixLangDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutFixLang")}</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("editor.shortcutSaveDesc")}</span>
                <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutSave")}</kbd>
              </div>
            </div>

            <DialogFooter className="sm:justify-end">
              <Button type="button" onClick={() => setShortcutsDialogOpen(false)}>
                {t("common.ok")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const displayFileName = note.fileName || `${note.title?.trim() || t("editor.untitled")}`;
  // const [fileInfoOpen, setFileInfoOpen] = useState(false);
  const isSaved = saveStatus === "saved" || saveStatus === "auto_saved" || saveStatus === "manually_saved";
  const saveStatusLabel = isSaved ? t("editor.saveStatusSaved") : t("editor.saveStatusUnsaved");

  const renderPdfToolbar = () => {
    const currentTool: InkoTool = pdfActiveTool || pdfViewerState?.currentTool || "select";
    const selectedMeta = pdfViewerState?.selectedMeta || null;
    const canUndo = Boolean(pdfViewerState?.canUndo);
    const canRedo = Boolean(pdfViewerState?.canRedo);
    const hasSelection = Boolean(pdfViewerState?.hasSelection) || Boolean(selectedMeta);
    const showThumbnails = Boolean(pdfViewerState?.showThumbnails);
    const currentPageNum = pdfViewerState?.currentPage || 1;
    const currentPageBookmark =
      pdfBookmarks.find((b) => b.page === currentPageNum) || null;
    const isCurrentPageBookmarked = Boolean(currentPageBookmark);

    const flatOutlineItems: Array<{ title: string; page: number | null; depth: number }> = [];
    if (Array.isArray(pdfViewerState?.outline) && pdfViewerState.outline.length > 0) {
      const walkOutline = (items: InkoOutlineItem[], depth: number) => {
        if (depth > 4) return;
        for (const it of items) {
          flatOutlineItems.push({ title: it.title, page: it.page, depth });
          if (Array.isArray(it.children) && it.children.length > 0) {
            walkOutline(it.children, depth + 1);
          }
        }
      };
      walkOutline(pdfViewerState.outline, 0);
    }

    const currentColor =
      currentTool === "select" && selectedMeta?.color
        ? selectedMeta.color
        : pdfActiveBrushColor;
    const currentWidth =
      currentTool === "select" && selectedMeta?.width
        ? Math.max(1, Math.round(selectedMeta.width))
        : pdfActiveBrushWidth;
    const currentFontSize =
      currentTool === "select" && selectedMeta?.fontSize
        ? Math.max(8, Math.round(selectedMeta.fontSize))
        : pdfActiveFontSize;
    const currentHighlightColor =
      currentTool === "select" && selectedMeta?.kind === "highlighter" && selectedMeta.color
        ? selectedMeta.color
        : pdfActiveHighlightColor;
    const currentHighlightWidth =
      currentTool === "select" && selectedMeta?.kind === "highlighter" && selectedMeta.width
        ? Math.max(6, Math.round(selectedMeta.width))
        : pdfActiveHighlightWidth;
    const currentEraserWidth = pdfActiveEraserWidth;
    const currentShapeFillColor =
      currentTool === "select" && selectedMeta?.canFill
        ? selectedMeta.fillColor || null
        : pdfActiveShapeFillColor;
    const currentShapeFillOpacity =
      currentTool === "select" && selectedMeta?.canFill && selectedMeta.fillOpacity != null
        ? selectedMeta.fillOpacity
        : pdfActiveShapeFillOpacity;

    const handleSetBrushWidth = (w: number) => {
      setPdfActiveBrushWidth(w);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        brushWidth: w,
        selectedMeta: prev.selectedMeta ? { ...prev.selectedMeta, width: w } : prev.selectedMeta,
      } : null));
      pdfEditorRef.current?.setBrushWidth(w);
    };

    const handleSetHighlightWidth = (w: number) => {
      setPdfActiveHighlightWidth(w);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        highlightWidth: w,
        selectedMeta: prev.selectedMeta ? { ...prev.selectedMeta, width: w } : prev.selectedMeta,
      } : null));
      pdfEditorRef.current?.setHighlightWidth(w);
      if (currentTool === "select") {
        pdfEditorRef.current?.setBrushWidth(w);
      }
    };

    const handleSetEraserWidth = (w: number) => {
      setPdfActiveEraserWidth(w);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        eraserWidth: w,
      } : null));
      pdfEditorRef.current?.setEraserWidth(w);
    };

    const handleSetShapeFillOpacity = (op: number) => {
      setPdfActiveShapeFillOpacity(op);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        shapeFillOpacity: op,
        selectedMeta: prev.selectedMeta ? { ...prev.selectedMeta, fillOpacity: op } : prev.selectedMeta,
      } : null));
      pdfEditorRef.current?.setShapeFillOpacity(op);
    };

    const handleSetFontSize = (sz: number) => {
      setPdfActiveFontSize(sz);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        fontSize: sz,
        selectedMeta: prev.selectedMeta ? { ...prev.selectedMeta, fontSize: sz } : prev.selectedMeta,
      } : null));
      pdfEditorRef.current?.setFontSize(sz);
    };

    const handleSetBrushColor = (c: string) => {
      setPdfActiveBrushColor(c);
      setPdfActiveShapeNoStroke(false);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        brushColor: c,
        shapeNoStroke: false,
        selectedMeta: prev.selectedMeta ? { ...prev.selectedMeta, color: c, noStroke: false } : prev.selectedMeta,
      } : null));
      pdfEditorRef.current?.setBrushColor(c);
      if (isFillableShapeContext) {
        pdfEditorRef.current?.setShapeStrokeColor(c);
      }
    };

    const handleSetHighlightColor = (c: string) => {
      setPdfActiveHighlightColor(c);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        highlightColor: c,
        selectedMeta: prev.selectedMeta ? { ...prev.selectedMeta, color: c } : prev.selectedMeta,
      } : null));
      pdfEditorRef.current?.setHighlightColor(c);
      if (currentTool === "select") {
        pdfEditorRef.current?.setBrushColor(c);
      }
    };

    const handleSetShapeFillColor = (c: string | null) => {
      setPdfActiveShapeFillColor(c);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        shapeFillColor: c,
        selectedMeta: prev.selectedMeta ? { ...prev.selectedMeta, fillColor: c } : prev.selectedMeta,
      } : null));
      pdfEditorRef.current?.setShapeFillColor(c);
    };

    const handleSetShapeNoStroke = () => {
      setPdfActiveShapeNoStroke(true);
      setPdfViewerState((prev) => (prev ? {
        ...prev,
        shapeNoStroke: true,
        selectedMeta: prev.selectedMeta ? { ...prev.selectedMeta, noStroke: true } : prev.selectedMeta,
      } : null));
      pdfEditorRef.current?.setShapeStrokeColor(null);
    };

    const isShapeActive =
      currentTool === "rectangle" ||
      currentTool === "circle" ||
      currentTool === "line" ||
      currentTool === "arrow";
    const selectedShapeType =
      currentTool === "select" &&
      (selectedMeta?.shapeType === "rectangle" ||
        selectedMeta?.shapeType === "circle" ||
        selectedMeta?.shapeType === "line" ||
        selectedMeta?.shapeType === "arrow")
        ? selectedMeta.shapeType
        : null;
    const activeShape: "rectangle" | "circle" | "line" | "arrow" = isShapeActive
      ? currentTool
      : selectedShapeType || lastPdfShape;

    const isTextContext =
      currentTool === "text" || (currentTool === "select" && selectedMeta?.kind === "text");
    const isHighlighterContext =
      currentTool === "highlighter" ||
      (currentTool === "select" && selectedMeta?.kind === "highlighter");
    const isEraserContext = currentTool === "eraser";
    const isFillableShapeContext =
      currentTool === "rectangle" ||
      currentTool === "circle" ||
      (currentTool === "select" && Boolean(selectedMeta?.canFill));
    const hasContextualStyleControls =
      (currentTool !== "select" && currentTool !== "contentSelect") || Boolean(selectedMeta);

    const pdfSliderCls =
      "py-1 cursor-pointer [&>span:first-child]:h-1.5 [&>span:first-child]:bg-border [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:shadow-sm";

    const appFontCss =
      FONT_FAMILY_CSS[settings?.fontFamily || "inter"] || "var(--app-font-family)";

    const PRESET_STROKE_COLORS = [
      "#000000",
      "#26A295",
      "#0ea5e9",
      "#3b82f6",
      "#6366f1",
      "#8b5cf6",
      "#d946ef",
      "#ec4899",
      "#f43f5e",
      "#f97316",
      "#eab308",
      "#84cc16",
      "#10b981",
      "#14b8a6",
      "#64748b",
      "#ffffff",
    ];

    const PRESET_HIGHLIGHT_COLORS = [
      "#facc15",
      "#4ade80",
      "#38bdf8",
      "#f472b6",
      "#fb923c",
      "#c084fc",
      "#2dd4bf",
      "#f87171",
    ];

    const PDF_FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

    const renderToolIconLocal = (toolId: string, extraClass = "h-4 w-4") => {
      const IconComp = getToolbarIcon(toolId, settings.iconPack);
      return <IconComp className={extraClass} />;
    };

    const getShapeIconKey = (shape: "rectangle" | "circle" | "line" | "arrow") => {
      if (shape === "circle") return "shapeCircle";
      if (shape === "line") return "shapeLine";
      if (shape === "arrow") return "shapeArrow";
      return "shapeSquare";
    };

    const toolBtnCls = (active: boolean) =>
      `h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full transition-colors ${
        active ? "bg-primary/[0.12] text-primary font-medium" : "text-foreground"
      }`;

    return (
      <div
        data-editor-toolbar="true"
        className="flex w-fit max-w-full items-center gap-1 overflow-x-auto no-scrollbar rounded-full border border-border bg-secondary p-1"
      >
        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full text-foreground"
              disabled={!canUndo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (pdfEditorRef.current?.undo) {
                  pdfEditorRef.current.undo();
                } else {
                  pdfEditorRef.current?.sendCommand("undo");
                }
              }}
            >
              {renderToolIconLocal("undo")}
              <span className="sr-only">{t("editor.undo")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{`${t("editor.undo")} (Ctrl+Z)`}</TooltipContent>
        </Tooltip>

        {/* Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full text-foreground"
              disabled={!canRedo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (pdfEditorRef.current?.redo) {
                  pdfEditorRef.current.redo();
                } else {
                  pdfEditorRef.current?.sendCommand("redo");
                }
              }}
            >
              {renderToolIconLocal("redo")}
              <span className="sr-only">{t("editor.redo")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{`${t("editor.redo")} (Ctrl+Y)`}</TooltipContent>
        </Tooltip>

        <div className="h-4 w-px shrink-0 bg-border" />

        {/* Select & Move (V) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={toolBtnCls(currentTool === "select")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectPdfTool("select")}
            >
              {renderToolIconLocal("select")}
              <span className="sr-only">{t("editor.selectMove")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("editor.selectMoveV")}
          </TooltipContent>
        </Tooltip>

        {/* Text Select in PDF (I) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={toolBtnCls(currentTool === "contentSelect")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectPdfTool("contentSelect")}
            >
              {renderToolIconLocal("textSelect")}
              <span className="sr-only">{t("editor.selectPdfText")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("editor.selectPdfTextI")}
          </TooltipContent>
        </Tooltip>

        {/* Pen (P) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={toolBtnCls(currentTool === "pen")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectPdfTool("pen")}
            >
              {renderToolIconLocal("pen")}
              <span className="sr-only">{t("editor.pen")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("editor.penToolP")}
          </TooltipContent>
        </Tooltip>

        {/* Highlighter (H) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={toolBtnCls(currentTool === "highlighter")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectPdfTool("highlighter")}
            >
              {renderToolIconLocal("highlight")}
              <span className="sr-only">{t("editor.highlighter")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("editor.highlighterH")}
          </TooltipContent>
        </Tooltip>

        {/* Eraser (E) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={toolBtnCls(currentTool === "eraser")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectPdfTool("eraser")}
            >
              {renderToolIconLocal("eraser")}
              <span className="sr-only">{t("editor.eraser")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("editor.eraserToolE")}
          </TooltipContent>
        </Tooltip>

        {/* Text Tool (T) — Direct Activation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={toolBtnCls(currentTool === "text")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectPdfTool("text")}
            >
              {renderToolIconLocal("textBox")}
              <span className="sr-only">{t("favorites.text")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("editor.addTextT")}
          </TooltipContent>
        </Tooltip>

        {/* Shapes Dropdown (Rectangle, Circle/Ellipse, Line, Arrow) */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={`h-8 w-[42px] shrink-0 px-1 py-0 flex items-center justify-center gap-1 rounded-full md:rounded-full text-xs md:text-sm transition-colors ${
                    isShapeActive ? "bg-primary/[0.12] text-primary font-medium" : "font-normal text-foreground"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {renderToolIconLocal(getShapeIconKey(activeShape))}
                  <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
                  <span className="sr-only">{t("editor.shapes")}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              {t("editor.shapes")}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 shadow-md">
            {(
              [
                {
                  id: "rectangle" as const,
                  icon: "shapeSquare",
                  label: t("editor.rectangle"),
                  shortcut: "R",
                },
                {
                  id: "circle" as const,
                  icon: "shapeCircle",
                  label: t("editor.circleEllipse"),
                  shortcut: "O",
                },
                {
                  id: "line" as const,
                  icon: "shapeLine",
                  label: t("editor.line"),
                  shortcut: "L",
                },
                {
                  id: "arrow" as const,
                  icon: "shapeArrow",
                  label: t("editor.arrow"),
                  shortcut: "A",
                },
              ]
            ).map((item) => {
              const isItemActive = currentTool === item.id;
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => {
                    setLastPdfShape(item.id);
                    handleSelectPdfTool(item.id);
                  }}
                  className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                    isItemActive
                      ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {renderToolIconLocal(
                      item.icon,
                      item.id === "line" ? "h-4 w-4 -rotate-45" : "h-4 w-4"
                    )}
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {item.shortcut}
                    </span>
                    {isItemActive && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px shrink-0 bg-border" />

        {/* Contextual Properties: Text / Highlighter / Eraser / Stroke */}
        {!hasContextualStyleControls ? null : isTextContext ? (
          <>
            {/* Font Size Dropdown — Exact Luno Editor Style */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-[44px] shrink-0 px-1 py-0 flex items-center justify-center gap-1 rounded-full md:rounded-full text-xs md:text-sm font-normal text-foreground"
                      style={{ fontFamily: appFontCss }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <span className="text-xs md:text-sm font-normal tabular-nums" style={{ fontFamily: appFontCss }}>
                        {currentFontSize}
                      </span>
                      <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
                      <span className="sr-only">{t("editor.fontSize")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("editor.fontSize")}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                align="start"
                className="w-40 max-h-72 overflow-y-auto rounded-xl p-1.5 shadow-md"
                style={{ fontFamily: appFontCss }}
              >
                {PDF_FONT_SIZES.map((sz) => {
                  const isCurrent = sz === currentFontSize;
                  return (
                    <DropdownMenuItem
                      key={sz}
                      onClick={() => handleSetFontSize(sz)}
                      style={{ fontFamily: appFontCss }}
                      className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                        isCurrent
                          ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]"
                          : ""
                      }`}
                    >
                      <span style={{ fontFamily: appFontCss }}>{`${sz}px`}</span>
                      {isCurrent && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Text Color Popover — Exact Luno Editor Style */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full text-foreground"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <TextColorIcon color={currentColor} className="h-4 w-4" />
                      <span className="sr-only">{t("editor.textColor")}</span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("editor.textColor")}</TooltipContent>
              </Tooltip>
              <PopoverContent
                align="start"
                className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-primary" />
                      {t("editor.textColor")}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      {currentColor}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-10 h-9 rounded-xl overflow-hidden border border-border/70 shadow-sm flex-shrink-0 cursor-pointer transition-colors hover:border-primary/50">
                      <input
                        type="color"
                        value={/^#[0-9A-Fa-f]{6}$/.test(currentColor) ? currentColor : "#000000"}
                        onChange={(e) => handleSetBrushColor(e.target.value)}
                        className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
                      />
                    </div>
                    <Input
                      value={currentColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                          handleSetBrushColor(val);
                        }
                      }}
                      placeholder="#000000"
                      className="h-9 rounded-xl text-xs uppercase tracking-wider border-border/70 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                      maxLength={7}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetBrushColor("#000000")}
                          className="h-9 w-9 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer shrink-0 border border-border/70"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span className="sr-only">{t("editor.defaultColor")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.defaultColor")}</TooltipContent>
                    </Tooltip>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                      {t("settings.quickPresets")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_STROKE_COLORS.map((color) => {
                        const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                        return (
                          <button
                            key={color}
                            type="button"
                            style={{
                              backgroundColor: color,
                              borderColor: color === "#ffffff" ? "var(--border)" : "transparent",
                            }}
                            onClick={() => handleSetBrushColor(color)}
                            className={`h-5 w-5 rounded-full border transition-transform cursor-pointer flex items-center justify-center relative ${
                              isSelected
                                ? "ring-2 ring-primary ring-offset-1 scale-110"
                                : "hover:scale-115 opacity-85 hover:opacity-100"
                            }`}
                            aria-label={color}
                          >
                            {isSelected && (
                              <Check
                                className={`w-3 h-3 ${
                                  color === "#ffffff" ? "text-foreground" : "text-white"
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        ) : isHighlighterContext ? (
          /* Highlighter Color & Thickness Popover */
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full relative"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div
                      className="h-4 w-4 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: currentHighlightColor, opacity: 0.85 }}
                    />
                    <span className="sr-only">
                      {t("editor.highlightColorSize")}
                    </span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                {t("editor.highlightColorWidth")}
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              align="center"
              className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-primary" />
                  {t("editor.highlightColor")}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {currentHighlightColor}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-10 h-9 rounded-xl overflow-hidden border border-border/70 shadow-sm flex-shrink-0 cursor-pointer transition-colors hover:border-primary/50">
                  <input
                    type="color"
                    value={
                      /^#[0-9A-Fa-f]{6}$/.test(currentHighlightColor)
                        ? currentHighlightColor
                        : "#facc15"
                    }
                    onChange={(e) => handleSetHighlightColor(e.target.value)}
                    className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
                  />
                </div>
                <Input
                  value={currentHighlightColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      handleSetHighlightColor(val);
                    }
                  }}
                  placeholder="#FACC15"
                  className="h-9 rounded-xl text-xs uppercase tracking-wider border-border/70 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                  maxLength={7}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetHighlightColor("#facc15")}
                      className="h-9 w-9 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer shrink-0 border border-border/70"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="sr-only">{t("editor.defaultColor")}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("editor.defaultColor")}</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_HIGHLIGHT_COLORS.map((color) => {
                  const isSelected = currentHighlightColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      style={{ backgroundColor: color, borderColor: "transparent" }}
                      onClick={() => handleSetHighlightColor(color)}
                      className={`h-5 w-5 rounded-full border transition-transform cursor-pointer flex items-center justify-center relative ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-1 scale-110"
                          : "hover:scale-115 opacity-85 hover:opacity-100"
                      }`}
                      aria-label={color}
                    >
                      {isSelected && <Check className="w-3 h-3 text-slate-900" />}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("editor.freehandWidth")}
                  </span>
                  <span className="text-[11px] font-medium text-foreground tabular-nums">
                    {currentHighlightWidth}px
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-3.5 w-3.5 rounded-full border border-border/70 shadow-sm shrink-0"
                    style={{ backgroundColor: currentHighlightColor, opacity: 0.85 }}
                  />
                  <Slider
                    min={8}
                    max={48}
                    step={1}
                    value={[currentHighlightWidth]}
                    onValueChange={([w]) => handleSetHighlightWidth(w)}
                    className={pdfSliderCls}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : isEraserContext ? (
          /* Eraser Size Popover */
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2 rounded-full md:rounded-full text-xs text-foreground flex items-center gap-1.5"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <span
                      className="rounded-full border border-foreground/70 bg-background shrink-0"
                      style={{
                        width: `${Math.max(6, Math.min(16, Math.round(currentEraserWidth / 3)))}px`,
                        height: `${Math.max(6, Math.min(16, Math.round(currentEraserWidth / 3)))}px`,
                      }}
                    />
                    <span className="tabular-nums text-xs">{currentEraserWidth}</span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                {t("editor.eraserSize")}
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              align="center"
              className="w-56 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {t("editor.eraserSize")}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {currentEraserWidth}px
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-3.5 w-3.5 rounded-full border border-foreground/60 bg-muted shrink-0" />
                <Slider
                  min={8}
                  max={64}
                  step={1}
                  value={[currentEraserWidth]}
                  onValueChange={([w]) => handleSetEraserWidth(w)}
                  className={pdfSliderCls}
                />
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          /* Stroke Color & Width + Optional Shape Interior Fill */
          <>
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full relative"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {isFillableShapeContext ? (
                        <div
                          className="h-4 w-4 rounded-full bg-transparent shadow-sm relative flex items-center justify-center overflow-hidden"
                          style={{
                            borderWidth: "2.5px",
                            borderStyle:
                              (currentTool === "select" && selectedMeta?.canFill
                                ? Boolean(selectedMeta?.noStroke)
                                : pdfActiveShapeNoStroke)
                                ? "none"
                                : "solid",
                            borderColor:
                              currentColor === "#ffffff" ? "hsl(var(--border))" : currentColor,
                          }}
                        >
                          {(currentTool === "select" && selectedMeta?.canFill
                            ? Boolean(selectedMeta?.noStroke)
                            : pdfActiveShapeNoStroke) && (
                            <span className="block w-5 h-[1.5px] bg-destructive/80 -rotate-45 pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        <div
                          className="h-4 w-4 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: currentColor }}
                        />
                      )}
                      <span className="sr-only">
                        {t("editor.colorStroke")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {isFillableShapeContext
                    ? t("editor.borderColorWidth")
                    : t("editor.strokeColorWidth")}
                </TooltipContent>
              </Tooltip>
              <PopoverContent
                align="center"
                className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    {isFillableShapeContext
                      ? t("editor.borderColor")
                      : t("editor.strokeColor")}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {currentColor}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-9 rounded-xl overflow-hidden border border-border/70 shadow-sm flex-shrink-0 cursor-pointer transition-colors hover:border-primary/50">
                    <input
                      type="color"
                      value={/^#[0-9A-Fa-f]{6}$/.test(currentColor) ? currentColor : "#000000"}
                      onChange={(e) => handleSetBrushColor(e.target.value)}
                      className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
                    />
                  </div>
                  <Input
                    value={currentColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        handleSetBrushColor(val);
                      }
                    }}
                    placeholder="#000000"
                    className="h-9 rounded-xl text-xs uppercase tracking-wider border-border/70 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                    maxLength={7}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetBrushColor("#000000")}
                        className="h-9 w-9 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer shrink-0 border border-border/70"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="sr-only">{t("editor.defaultColor")}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("editor.defaultColor")}</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {/* No Stroke Swatch */}
                  {isFillableShapeContext && (
                    <button
                      type="button"
                      onClick={() => handleSetShapeNoStroke()}
                      className={`h-5 w-5 rounded-full border border-border bg-background transition-transform cursor-pointer flex items-center justify-center relative overflow-hidden ${
                        (currentTool === "select" && selectedMeta?.canFill
                          ? Boolean(selectedMeta?.noStroke)
                          : pdfActiveShapeNoStroke)
                          ? "ring-2 ring-primary ring-offset-1 scale-110"
                          : "hover:scale-115 opacity-85 hover:opacity-100"
                      }`}
                      aria-label={t("editor.noStroke")}
                      title={t("editor.noStroke")}
                    >
                      <span className="block w-6 h-[1.5px] bg-destructive/80 -rotate-45 pointer-events-none" />
                    </button>
                  )}

                  {PRESET_STROKE_COLORS.map((color) => {
                    const isSelected =
                      !(
                        currentTool === "select" && selectedMeta?.canFill
                          ? Boolean(selectedMeta?.noStroke)
                          : pdfActiveShapeNoStroke
                      ) && currentColor.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        style={{
                          backgroundColor: color,
                          borderColor: color === "#ffffff" ? "var(--border)" : "transparent",
                        }}
                        onClick={() => handleSetBrushColor(color)}
                        className={`h-5 w-5 rounded-full border transition-transform cursor-pointer flex items-center justify-center relative ${
                          isSelected
                            ? "ring-2 ring-primary ring-offset-1 scale-110"
                            : "hover:scale-115 opacity-85 hover:opacity-100"
                        }`}
                        aria-label={color}
                      >
                        {isSelected && (
                          <Check
                            className={`w-3 h-3 ${
                              color === "#ffffff" ? "text-foreground" : "text-white"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("editor.strokeWidth")}
                    </span>
                    <span className="text-[11px] font-medium text-foreground tabular-nums">
                      {currentWidth}px
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-3.5 w-3.5 rounded-full border border-border/70 shadow-sm shrink-0"
                      style={{ backgroundColor: currentColor }}
                    />
                    <Slider
                      min={1}
                      max={24}
                      step={1}
                      value={[currentWidth]}
                      onValueChange={([w]) => handleSetBrushWidth(w)}
                      className={pdfSliderCls}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {isFillableShapeContext && (
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full relative"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div
                          className="h-4 w-4 rounded-[4px] border border-border shadow-sm relative overflow-hidden flex items-center justify-center bg-background"
                          style={
                            currentShapeFillColor
                              ? {
                                  backgroundColor: currentShapeFillColor,
                                  opacity: Math.max(0.2, currentShapeFillOpacity / 100),
                                }
                              : undefined
                          }
                        >
                          {!currentShapeFillColor && (
                            <span className="block w-5 h-[1.5px] bg-destructive/80 -rotate-45 pointer-events-none" />
                          )}
                        </div>
                        <span className="sr-only">
                          {t("editor.shapeFillColor")}
                        </span>
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("editor.shapeFillColor")}
                  </TooltipContent>
                </Tooltip>
                <PopoverContent
                  align="center"
                  className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-primary" />
                      {t("editor.fillColor")}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      {currentShapeFillColor || (t("editor.noFill"))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-10 h-9 rounded-xl overflow-hidden border border-border/70 shadow-sm flex-shrink-0 cursor-pointer transition-colors hover:border-primary/50 bg-background flex items-center justify-center">
                      {!currentShapeFillColor && (
                        <span className="block w-12 h-[1.5px] bg-destructive/75 -rotate-45 pointer-events-none" />
                      )}
                      <input
                        type="color"
                        value={
                          currentShapeFillColor && /^#[0-9A-Fa-f]{6}$/.test(currentShapeFillColor)
                            ? currentShapeFillColor
                            : "#000000"
                        }
                        onChange={(e) => handleSetShapeFillColor(e.target.value)}
                        className={`absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0 ${
                          currentShapeFillColor ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>
                    <Input
                      value={currentShapeFillColor || ""}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (!val) {
                          handleSetShapeFillColor(null);
                        } else if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                          handleSetShapeFillColor(val);
                        }
                      }}
                      placeholder={t("editor.noFill2")}
                      className="h-9 rounded-xl text-xs uppercase tracking-wider border-border/70 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                      maxLength={7}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetShapeFillColor(null)}
                          className="h-9 w-9 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer shrink-0 border border-border/70"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">
                            {t("editor.noFill2")}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("editor.noFillTransparent")}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {/* No Fill Swatch */}
                    <button
                      type="button"
                      onClick={() => handleSetShapeFillColor(null)}
                      className={`h-5 w-5 rounded-full border border-border bg-background transition-transform cursor-pointer flex items-center justify-center relative overflow-hidden ${
                        !currentShapeFillColor
                          ? "ring-2 ring-primary ring-offset-1 scale-110"
                          : "hover:scale-115 opacity-85 hover:opacity-100"
                      }`}
                      aria-label={t("editor.noFill2")}
                      title={t("editor.noFill2")}
                    >
                      <span className="block w-6 h-[1.5px] bg-destructive/80 -rotate-45 pointer-events-none" />
                    </button>

                    {PRESET_STROKE_COLORS.map((color) => {
                      const isSelected =
                        currentShapeFillColor?.toLowerCase() === color.toLowerCase();
                      return (
                        <button
                          key={color}
                          type="button"
                          style={{
                            backgroundColor: color,
                            borderColor: color === "#ffffff" ? "var(--border)" : "transparent",
                          }}
                          onClick={() => handleSetShapeFillColor(color)}
                          className={`h-5 w-5 rounded-full border transition-transform cursor-pointer flex items-center justify-center relative ${
                            isSelected
                              ? "ring-2 ring-primary ring-offset-1 scale-110"
                              : "hover:scale-115 opacity-85 hover:opacity-100"
                          }`}
                          aria-label={color}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3 h-3 ${
                                color === "#ffffff" ? "text-foreground" : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {currentShapeFillColor && (
                    <div className="space-y-2.5 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("editor.fillOpacity")}
                        </span>
                        <span className="text-[11px] font-medium text-foreground tabular-nums">
                          {currentShapeFillOpacity}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3.5 w-3.5 rounded-[3px] border border-border/70 shadow-sm shrink-0"
                          style={{
                            backgroundColor: currentShapeFillColor,
                            opacity: Math.max(0.2, currentShapeFillOpacity / 100),
                          }}
                        />
                        <Slider
                          min={10}
                          max={100}
                          step={1}
                          value={[currentShapeFillOpacity]}
                          onValueChange={([op]) => handleSetShapeFillOpacity(op)}
                          className={pdfSliderCls}
                        />
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}
          </>
        )}

        {/* Delete Selected */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full transition-colors text-foreground hover:bg-muted/80 disabled:opacity-40 cursor-pointer"
              disabled={!hasSelection}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setPdfViewerState((prev) =>
                  prev ? { ...prev, hasSelection: false, selectedMeta: null } : null
                );
                pdfEditorRef.current?.sendCommand("deleteSelected");
              }}
            >
              {renderToolIconLocal("trash")}
              <span className="sr-only">{t("editor.deleteSelected")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("editor.deleteSelected")}
          </TooltipContent>
        </Tooltip>

        <div className="h-4 w-px shrink-0 bg-border" />

        {/* Thumbnails Sidebar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={toolBtnCls(showThumbnails)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pdfEditorRef.current?.sendCommand("toggleThumbnails")}
            >
              {renderToolIconLocal("layoutGrid")}
              <span className="sr-only">{t("editor.thumbnails")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("editor.togglePageThumbnails")}
          </TooltipContent>
        </Tooltip>

        {/* Bookmarks / Outline */}
        <Popover
          open={pdfBookmarkOpen}
          onOpenChange={(open) => {
            setPdfBookmarkOpen(open);
            if (open) {
              const latest = pdfEditorRef.current?.getBookmarks();
              if (latest) setPdfBookmarks(latest);
              const existing = (latest || pdfBookmarks).find(
                (b) => b.page === currentPageNum
              );
              setPdfBookmarkTitleInput(existing?.title || "");
            }
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={toolBtnCls(pdfBookmarkOpen)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {renderToolIconLocal("bookmark")}
                  <span className="sr-only">
                    {t("editor.bookmarksOutline")}
                  </span>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              {t("editor.bookmarksOutline")}
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            align="end"
            className="w-72 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-primary" />
                {t("editor.bookmarksOutline")}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground tracking-wide tabular-nums select-none shrink-0">
                {t("editor.page", { currentPageNum })}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const label =
                  pdfBookmarkTitleInput.trim() ||
                  (t("editor.page", { currentPageNum }));
                const next = pdfEditorRef.current?.addBookmark(currentPageNum, label);
                if (next) setPdfBookmarks(next);
                setPdfBookmarkTitleInput("");
              }}
              className="flex items-center gap-1.5"
            >
              <Input
                value={pdfBookmarkTitleInput}
                onChange={(e) => setPdfBookmarkTitleInput(e.target.value)}
                placeholder={
                  t("editor.bookmarkTitleP", { currentPageNum })
                }
                className="h-8 rounded-xl text-xs border-border/70 bg-background px-2.5 focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 px-2.5 rounded-xl text-xs shrink-0 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("editor.save")}
              </Button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-0.5">
              {pdfBookmarks.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-muted-foreground px-1">
                    {t("editor.savedBookmarks")}
                  </div>
                  {pdfBookmarks.map((bm) => {
                    const isActive = bm.page === currentPageNum;
                    return (
                      <div
                        key={bm.id}
                        onClick={() => {
                          if (bm.page) {
                            setPdfViewerState((prev) =>
                              prev ? { ...prev, currentPage: bm.page } : prev
                            );
                            pdfEditorRef.current?.sendCommand("goToPage", { page: bm.page });
                            setPdfBookmarkOpen(false);
                          }
                        }}
                        className={`group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                          isActive
                            ? "bg-primary/[0.12] text-primary font-medium"
                            : "text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <span className="truncate flex-1 flex items-center gap-1.5">
                          <Bookmark
                            className={`h-3 w-3 shrink-0 ${
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="truncate">{bm.title}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {t("editor.p", { v0: bm.page })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = pdfEditorRef.current?.removeBookmark(bm.id);
                              if (next) setPdfBookmarks(next);
                            }}
                            aria-label={t("webViewer.removeBookmark")}
                            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {flatOutlineItems.length > 0 && (
                <div
                  className={`space-y-1 ${
                    pdfBookmarks.length > 0 ? "pt-2 border-t border-border/60" : ""
                  }`}
                >
                  <div className="text-[11px] font-medium text-muted-foreground px-1">
                    {t("editor.documentOutline")}
                  </div>
                  {flatOutlineItems.map((item, idx) => {
                    const isActive = item.page != null && item.page === currentPageNum;
                    return (
                      <button
                        key={`${idx}-${item.title}`}
                        type="button"
                        disabled={item.page == null}
                        onClick={() => {
                          if (item.page != null) {
                            pdfEditorRef.current?.sendCommand("goToPage", {
                              page: item.page,
                            });
                            setPdfBookmarkOpen(false);
                          }
                        }}
                        style={{ paddingLeft: `${8 + item.depth * 10}px` }}
                        className={`w-full flex items-center justify-between gap-2 rounded-lg pr-2 py-1.5 text-xs text-left transition-colors ${
                          item.page == null
                            ? "opacity-50 cursor-default"
                            : isActive
                            ? "bg-primary/[0.12] text-primary font-medium cursor-pointer"
                            : "text-foreground hover:bg-muted/70 cursor-pointer"
                        }`}
                      >
                        <span className="truncate flex-1">{item.title}</span>
                        {item.page != null && (
                          <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                            {item.page}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {pdfBookmarks.length === 0 && flatOutlineItems.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 px-2">
                  {t("editor.noBookmarksYetSaveOne")}
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };





  return (
    <>
      <TooltipProvider delayDuration={420}>
      <div data-editor-pane={paneId} className="flex min-h-0 flex-1 flex-row bg-background relative overflow-hidden">
        <div className="flex flex-1 min-h-0 flex-col min-w-0 overflow-hidden">
          <div
            data-editor-toolbar="true"
            className={
            (isPdfFile(note)
              ? (isReadingMode || (isPdfLoadingSource || !isPdfViewLoaded) || isNoteCurrentlyLocked || versionHistoryOpen)
              : (settings.showToolbar === false || isReadingMode || isNoteCurrentlyLocked || versionHistoryOpen || Boolean(comparingVersion && (comparingVersion.noteId === note.id || (comparingVersion.relPath && comparingVersion.relPath === (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName)))) || ((note.contentFormat === "html" || note.contentFormat === "css" || note.contentFormat === "javascript" || note.contentFormat === "js" || isCssFile(note) || isJsFile(note) || isImageFile(note) || isVideoFile(note) || isBinaryFile(note)) && !isMobile)))
              ? "hidden"
              : "px-3 py-2 sm:px-4 md:px-6"
          }>
            <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-3">
        <div ref={mobileToolbarAreaRef} className={`min-w-0 ${isMobile ? "order-2" : ""}`}>
          {!isReadingMode && isPdfFile(note) && !(isPdfLoadingSource || !isPdfViewLoaded) ? (
            renderPdfToolbar()
          ) : !isReadingMode && settings.showToolbar !== false && ((note.fileName?.toLowerCase().endsWith('.txt') || note.fileName?.toLowerCase().endsWith('.md') || note.fileName?.toLowerCase().endsWith('.markdown')) || (!note.fileName && (getContentFormat() === 'markdown' || getContentFormat() === 'plain'))) ? (() => {
            const ALL_TOOLBAR_ITEMS: Array<{
              id: string;
              group: "history" | "heading" | "typography" | "inline" | "block" | "media" | "ai";
              labelKey: string;
            }> = [
              { id: "undo", group: "history", labelKey: "editor.undo" },
              { id: "redo", group: "history", labelKey: "editor.redo" },
              { id: "heading", group: "heading", labelKey: "editor.headings" },
              { id: "fontFamily", group: "typography", labelKey: "editor.fontFamily" },
              { id: "fontSize", group: "typography", labelKey: "editor.fontSize" },
              { id: "bold", group: "inline", labelKey: "editor.bold" },
              { id: "italic", group: "inline", labelKey: "editor.italic" },
              { id: "underline", group: "inline", labelKey: "editor.underline" },
              { id: "strike", group: "inline", labelKey: "editor.strikethrough" },
              { id: "highlight", group: "inline", labelKey: "editor.highlight" },
              { id: "textColor", group: "inline", labelKey: "editor.textColor" },
              { id: "align", group: "inline", labelKey: "editor.textAlign" },
              { id: "superscript", group: "inline", labelKey: "editor.superscript" },
              { id: "subscript", group: "inline", labelKey: "editor.subscript" },
              { id: "list", group: "block", labelKey: "editor.list" },
              { id: "toggle", group: "block", labelKey: "editor.toggle" },
              { id: "code", group: "block", labelKey: "editor.code" },
              { id: "blockquote", group: "block", labelKey: "editor.blockquote" },
              { id: "horizontalRule", group: "block", labelKey: "editor.horizontalRule" },
              { id: "footnote", group: "block", labelKey: "editor.footnote" },
              { id: "table", group: "block", labelKey: "editor.insertTable" },
              { id: "emoji", group: "media", labelKey: "editor.insertEmoji" },
              { id: "calculator", group: "media", labelKey: "editor.calculator" },
              { id: "translator", group: "media", labelKey: "editor.translator" },
              { id: "clock", group: "media", labelKey: "editor.clock" },
              { id: "link", group: "media", labelKey: "editor.link" },
              { id: "image", group: "media", labelKey: "editor.insertImageByUrl" },
              { id: "video", group: "media", labelKey: "editor.insertVideoByUrl" },
              { id: "qrCode", group: "media", labelKey: "editor.qrCode" },
              { id: "audio", group: "media", labelKey: "editor.recordAudio" },
              { id: "fixLanguage", group: "media", labelKey: "editor.fixLanguage" },
              { id: "aiAssistant", group: "ai", labelKey: "settings.aiAssistant" },
            ];

            const toolbarOrder = settings.toolbarItemsOrder || [];
            const hiddenSet = new Set(settings.hiddenToolbarItems || []);

            const sortedAllItems = [...ALL_TOOLBAR_ITEMS]
              .filter(item => !hiddenSet.has(item.id))
              .sort((a, b) => {
                const idxA = toolbarOrder.indexOf(a.id);
                const idxB = toolbarOrder.indexOf(b.id);
                const posA = idxA === -1 ? 999 : idxA;
                const posB = idxB === -1 ? 999 : idxB;
                return posA - posB;
              });

            // For plain text (.txt) files, only keep tools that work without HTML
            // formatting (undo/redo, aiAssistant, emoji, calculator, translator, clock, fixLanguage) since all other formatting
            // is stripped on save via getPlainTextFromHtml().
            const isPlainText = note?.fileName?.toLowerCase().endsWith(".txt") ||
              (!note?.fileName && getContentFormat() === "plain");
            const TOOLBAR_ITEMS = isPlainText
              ? sortedAllItems.filter(item =>
                  ["undo", "redo", "aiAssistant", "emoji", "calculator", "translator", "clock", "fixLanguage"].includes(item.id)
                )
              : sortedAllItems;

            const BUTTON_WIDTH = 36;
            const SEP_WIDTH = 9;
            const THREE_DOTS_WIDTH = 36;
            const CONTAINER_PADDING = 12;

            const getItemWidth = (id: string) => {
              if (id === "fontFamily") return 105;
              if (id === "fontSize") return 44;
              if (id === "heading") return 42;
              if (id === "align") return 42;
              if (id === "list" || id === "bulletList" || id === "orderedList" || id === "taskList") return 42;
              if (id === "code" || id === "codeBlock") return 42;
              return BUTTON_WIDTH;
            };

            const totalAvailable = mobileToolbarWidth > 0 ? mobileToolbarWidth - CONTAINER_PADDING : 1000;

            let fullWidthNeeded = 0;
            let lastGroup = "";
            for (const item of TOOLBAR_ITEMS) {
              if (lastGroup && item.group !== lastGroup) fullWidthNeeded += SEP_WIDTH;
              fullWidthNeeded += getItemWidth(item.id);
              lastGroup = item.group;
            }

            let visibleCount = TOOLBAR_ITEMS.length;
            let hasOverflow = false;

            if (totalAvailable < fullWidthNeeded && mobileToolbarWidth > 0) {
              const budget = totalAvailable - THREE_DOTS_WIDTH;
              let accumulated = 0;
              let count = 0;
              lastGroup = "";

              for (let i = 0; i < TOOLBAR_ITEMS.length; i++) {
                const item = TOOLBAR_ITEMS[i];
                let cost = getItemWidth(item.id);
                if (lastGroup && item.group !== lastGroup) cost += SEP_WIDTH;

                if (accumulated + cost > budget) break;

                accumulated += cost;
                count++;
                lastGroup = item.group;
              }

              visibleCount = Math.max(1, count);
              hasOverflow = true;
            }

            const visibleItems = TOOLBAR_ITEMS.slice(0, visibleCount);
            const overflowItems = TOOLBAR_ITEMS.slice(visibleCount);

            const renderToolbarButton = (id: string) => {
              const renderToolIcon = (toolId: string) => {
                const IconComp = getToolbarIcon(toolId, settings.iconPack);
                return <IconComp className="h-4 w-4" />;
              };

              switch (id) {
                case "undo":
                  return (
                    <Tooltip key="undo">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor || !editor.can().undo()}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().undo().run()}
                        >
                          {renderToolIcon("undo")}
                          <span className="sr-only">{t("editor.undo")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.undo")}</TooltipContent>
                    </Tooltip>
                  );
                case "redo":
                  return (
                    <Tooltip key="redo">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor || !editor.can().redo()}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().redo().run()}
                        >
                          {renderToolIcon("redo")}
                          <span className="sr-only">{t("editor.redo")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.redo")}</TooltipContent>
                    </Tooltip>
                  );
                case "aiAssistant":
                  if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
                    return (
                      <Tooltip key="aiAssistant">
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                            disabled={!editor || aiGenerating}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleOpenAiSettings}
                          >
                            {renderToolIcon("aiAssistant")}
                            <span className="sr-only">{t("settings.aiAssistant")}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("settings.aiAssistant")}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return (
                    <DropdownMenu key="aiAssistant">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor || aiGenerating}
                            >
                              {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : renderToolIcon("aiAssistant")}
                              <span className="sr-only">{t("settings.aiAssistant")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("settings.aiAssistant")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuItem onClick={() => handleAiAction("improve")}>
                          <WandSparklesIcon className="h-4 w-4" />
                          <span>{t("settings.aiImprove")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("fix_grammar")}>
                          <SpellCheckIcon className="h-4 w-4" />
                          <span>{t("settings.aiFixGrammar")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_shorter")}>
                          <Minimize2 className="h-4 w-4" />
                          <span>{t("settings.aiMakeShorter")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_longer")}>
                          <Maximize2 className="h-4 w-4" />
                          <span>{t("settings.aiMakeLonger")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("simplify")}>
                          <BookOpen className="h-4 w-4" />
                          <span>{t("settings.aiSimplify")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("formalize")}>
                          <BriefcaseBusinessIcon className="h-4 w-4" />
                          <span>{t("settings.aiFormalize")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_casual")}>
                          <MessageCircle className="h-4 w-4" />
                          <span>{t("settings.aiMakeCasual")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("translate")}>
                          <Languages className="h-4 w-4" />
                          <span>{t("settings.aiTranslate")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("continue_writing")}>
                          <ArrowRight className="h-4 w-4" />
                          <span>{t("settings.aiContinueWriting")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("rewrite")}>
                          <PenLineIcon className="h-4 w-4" />
                          <span>{t("settings.aiRewrite")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                case "heading": {
                  const isH1Active = editor?.isActive("heading", { level: 1 });
                  const isH2Active = editor?.isActive("heading", { level: 2 });
                  const isH3Active = editor?.isActive("heading", { level: 3 });
                  const isH4Active = editor?.isActive("heading", { level: 4 });
                  const isH5Active = editor?.isActive("heading", { level: 5 });
                  const isH6Active = editor?.isActive("heading", { level: 6 });
                  const isHeadingActive = isH1Active || isH2Active || isH3Active || isH4Active || isH5Active || isH6Active;

                  let currentHeadingIcon = "heading";
                  if (isH1Active) currentHeadingIcon = "h1";
                  else if (isH2Active) currentHeadingIcon = "h2";
                  else if (isH3Active) currentHeadingIcon = "h3";
                  else if (isH4Active) currentHeadingIcon = "h4";
                  else if (isH5Active) currentHeadingIcon = "h5";
                  else if (isH6Active) currentHeadingIcon = "h6";

                  return (
                    <DropdownMenu key="heading">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className={`h-8 w-[42px] shrink-0 px-1 py-0 flex items-center justify-center gap-1 rounded-full md:rounded-full text-xs md:text-sm ${
                                isHeadingActive ? "text-primary font-medium" : "font-normal text-foreground"
                              }`}
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon(currentHeadingIcon)}
                              <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
                              <span className="sr-only">{t("editor.headings")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.headings")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isH1Active ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("h1")}
                            <span>{t("editor.heading1")}</span>
                          </div>
                          {isH1Active && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isH2Active ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("h2")}
                            <span>{t("editor.heading2")}</span>
                          </div>
                          {isH2Active && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isH3Active ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("h3")}
                            <span>{t("editor.heading3")}</span>
                          </div>
                          {isH3Active && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isH4Active ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("h4")}
                            <span>{t("editor.heading4")}</span>
                          </div>
                          {isH4Active && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 5 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isH5Active ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("h5")}
                            <span>{t("editor.heading5")}</span>
                          </div>
                          {isH5Active && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 6 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isH6Active ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("h6")}
                            <span>{t("editor.heading6")}</span>
                          </div>
                          {isH6Active && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                case "fontFamily": {
                  const activeFont = getActiveFontFamily(editor);
                  const isFontActive = Boolean(activeFont);
                  const activeSettingFontId = settings?.editorFontFamily || settings?.fontFamily || "inter";
                  const settingFont = findMatchingFontOption(activeSettingFontId, customFonts) || FONT_OPTIONS[0];
                  const settingFontName = settingFont
                    ? ("isCustom" in settingFont && settingFont.isCustom ? settingFont.displayName : (t(settingFont.nameKey as any) || settingFont.id))
                    : (t("editor.defaultFont"));

                  const foundFont = findMatchingFontOption(activeFont, customFonts);
                  const displayFontName = foundFont
                    ? (foundFont.isCustom ? foundFont.displayName : (t(foundFont.nameKey as any) || foundFont.id))
                    : activeFont
                      ? activeFont.replace(/['"]/g, "").split(",")[0].trim()
                      : settingFontName;

                  const displayFontCss = foundFont
                    ? foundFont.css
                    : activeFont
                      ? activeFont
                      : settingFont?.css;

                  const currentFontId = isFontActive && foundFont ? foundFont.id : settingFont?.id;

                  return (
                    <DropdownMenu key="fontFamily">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 w-[105px] shrink-0 px-2 py-0 flex items-center justify-center gap-1 rounded-full md:rounded-full text-xs md:text-sm font-normal text-foreground"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <span
                                className="truncate max-w-[72px]"
                                style={displayFontCss ? { fontFamily: displayFontCss } : undefined}
                              >
                                {displayFontName}
                              </span>
                              <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
                              <span className="sr-only">{t("editor.fontFamily")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.fontFamily")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto rounded-xl p-1.5 shadow-md">
                        {/* Custom Fonts Group */}
                        {customFonts && customFonts.length > 0 && (
                          <div className="mb-1.5 pb-1.5 border-b border-border/60">
                            <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {t("settings.customFonts")}
                            </div>
                            {customFonts.map((font) => {
                              const isCurrent = font.id === currentFontId;
                              return (
                                <ContextMenu key={font.id}>
                                  <ContextMenuTrigger asChild>
                                    <div
                                      role="menuitem"
                                      className={`cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between outline-none transition-colors select-none ${
                                        isCurrent ? "bg-primary/15 text-primary font-semibold hover:bg-primary/[0.18] focus:bg-primary/[0.18]" : "hover:bg-primary/[0.08] hover:text-primary focus:bg-primary/[0.08] focus:text-primary"
                                      }`}
                                      onClick={() => editor?.chain().focus().setFontFamily(font.css).run()}
                                      style={{ fontFamily: font.css }}
                                    >
                                      <span className="truncate flex-1">{font.name}</span>
                                      {isCurrent && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0 ml-2" />}
                                    </div>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent className="w-48 rounded-xl p-1.5 shadow-md z-[65]">
                                    <ContextMenuItem
                                      onClick={() => {
                                        setFontToRename(font);
                                        setFontRenameValue(font.name);
                                      }}
                                      className="gap-2.5 py-1.5 px-3 rounded-lg cursor-pointer text-[13px]"
                                    >
                                      <Pencil className="h-4 w-4 text-muted-foreground" />
                                      <span>{t("settings.renameFont")}</span>
                                    </ContextMenuItem>
                                    <ContextMenuItem
                                      variant="destructive"
                                      onClick={() => {
                                        setFontToDelete(font);
                                      }}
                                      className="gap-2.5 py-1.5 px-3 rounded-lg text-destructive focus:text-destructive cursor-pointer text-[13px]"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                      <span>{t("settings.deleteFont")}</span>
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              );
                            })}
                          </div>
                        )}

                        {/* System Fonts Group */}
                        <div>
                          {customFonts && customFonts.length > 0 && (
                            <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {t("settings.systemFonts")}
                            </div>
                          )}
                          {FONT_OPTIONS.map((font) => {
                            const isCurrent = font.id === currentFontId;
                            return (
                              <DropdownMenuItem
                                key={font.id}
                                onClick={() => editor?.chain().focus().setFontFamily(font.css).run()}
                                style={{ fontFamily: font.css }}
                                className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                                  isCurrent ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                                }`}
                              >
                                <span className="truncate">{t(font.nameKey as any) || font.id}</span>
                                {isCurrent && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </div>

                        {/* Upload Font Button */}
                        <div className="mt-1.5 pt-1.5 border-t border-border/60">
                          <DropdownMenuItem
                            className="w-full gap-2 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center text-muted-foreground hover:text-primary focus:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              fontFileInputRef.current?.click();
                            }}
                          >
                            <Upload className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate font-medium">{t("settings.uploadFont")}</span>
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                case "fontSize": {
                  const activeFontSize = editor?.getAttributes("fontSize")?.fontSize;
                  const isSizeActive = Boolean(activeFontSize);
                  const baseSizeNum = settings?.editorFontSize || editorFontSize || 15;
                  const baseSizeStr = String(baseSizeNum);
                  const baseSizePx = `${baseSizeNum}px`;
                  const displaySize = activeFontSize ? activeFontSize.replace(/px$/i, "") : baseSizeStr;
                  const currentSize = activeFontSize || baseSizePx;
                  const appFontCss = FONT_FAMILY_CSS[settings?.fontFamily || "inter"] || "var(--app-font-family)";
                  const FONT_SIZES = [
                    "10px",
                    "12px",
                    "13px",
                    "14px",
                    "15px",
                    "16px",
                    "17px",
                    "18px",
                    "19px",
                    "20px",
                    "21px",
                    "22px",
                    "24px",
                    "28px",
                    "32px",
                    "36px",
                    "48px",
                    "64px",
                  ];

                  return (
                    <DropdownMenu key="fontSize">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 w-[44px] shrink-0 px-1 py-0 flex items-center justify-center gap-1 rounded-full md:rounded-full text-xs md:text-sm font-normal text-foreground"
                              style={{ fontFamily: appFontCss }}
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <span
                                className="text-xs md:text-sm font-normal"
                                style={{ fontFamily: appFontCss }}
                              >
                                {displaySize}
                              </span>
                              <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
                              <span className="sr-only">{t("editor.fontSize")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.fontSize")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-40 max-h-72 overflow-y-auto rounded-xl p-1.5 shadow-md" style={{ fontFamily: appFontCss }}>
                        {FONT_SIZES.map((size) => {
                          const isCurrent = size === currentSize;
                          return (
                            <DropdownMenuItem
                              key={size}
                              onClick={() => editor?.chain().focus().setFontSize(size).run()}
                              style={{ fontFamily: appFontCss }}
                              className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                                isCurrent ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                              }`}
                            >
                              <span style={{ fontFamily: appFontCss }}>{size}</span>
                              {isCurrent && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                case "textColor": {
                  const activeColor = editor?.getAttributes("textColor")?.color;
                  const PRESET_TEXT_COLORS = [
                    "#26A295",
                    "#0ea5e9",
                    "#3b82f6",
                    "#6366f1",
                    "#8b5cf6",
                    "#d946ef",
                    "#ec4899",
                    "#f43f5e",
                    "#f97316",
                    "#eab308",
                    "#84cc16",
                    "#10b981",
                    "#14b8a6",
                    "#64748b",
                    "#000000",
                    "#ffffff",
                  ];

                  return (
                    <Popover key="textColor">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full text-foreground"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <TextColorIcon color={activeColor} className="h-4 w-4" />
                              <span className="sr-only">{t("editor.textColor")}</span>
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.textColor")}</TooltipContent>
                      </Tooltip>
                      <PopoverContent align="start" className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Palette className="w-3.5 h-3.5 text-primary" />
                              {t("editor.textColor")}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                              {activeColor || t("editor.defaultColor") || "Default"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative w-10 h-9 rounded-xl overflow-hidden border border-border/70 shadow-sm flex-shrink-0 cursor-pointer transition-colors hover:border-primary/50">
                              <input
                                type="color"
                                value={activeColor && /^#[0-9A-Fa-f]{6}$/.test(activeColor) ? activeColor : "#000000"}
                                onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                                className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
                              />
                            </div>
                            <Input
                              value={activeColor || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                   editor?.chain().focus().unsetColor().run();
                                } else {
                                  editor?.chain().focus().setColor(val).run();
                                }
                              }}
                              placeholder={t("editor.defaultColor")}
                              className="h-9 rounded-xl text-xs uppercase tracking-wider border-border/70 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                              maxLength={7}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => editor?.chain().focus().unsetColor().run()}
                                  className="h-9 w-9 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer shrink-0 border border-border/70"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span className="sr-only">{t("editor.defaultColor")}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("editor.defaultColor")}</TooltipContent>
                            </Tooltip>
                          </div>

                          <div>
                            <span className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                              {t("settings.quickPresets")}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {PRESET_TEXT_COLORS.map((color) => {
                                const isSelected = activeColor?.toLowerCase() === color.toLowerCase();
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    style={{
                                      backgroundColor: color,
                                      borderColor: color === "#ffffff" ? "var(--border)" : "transparent",
                                    }}
                                    onClick={() => editor?.chain().focus().setColor(color).run()}
                                    className={`h-5 w-5 rounded-full border transition-transform cursor-pointer flex items-center justify-center relative ${
                                      isSelected
                                        ? "ring-2 ring-primary ring-offset-1 scale-110"
                                        : "hover:scale-115 opacity-85 hover:opacity-100"
                                    }`}
                                    aria-label={color}
                                  >
                                    {isSelected && (
                                      <Check className={`w-3 h-3 ${color === "#ffffff" ? "text-foreground" : "text-white"}`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }
                case "align": {
                  const isLeft = editor?.isActive({ textAlign: "left" }) || (!editor?.isActive({ textAlign: "center" }) && !editor?.isActive({ textAlign: "right" }) && !editor?.isActive({ textAlign: "justify" }));
                  const isCenter = editor?.isActive({ textAlign: "center" });
                  const isRight = editor?.isActive({ textAlign: "right" });
                  const isJustify = editor?.isActive({ textAlign: "justify" });
                  const isNonDefaultAlign = isCenter || isRight || isJustify;

                  let currentAlignIcon = "alignLeft";
                  if (isCenter) currentAlignIcon = "alignCenter";
                  else if (isRight) currentAlignIcon = "alignRight";
                  else if (isJustify) currentAlignIcon = "alignJustify";

                  return (
                    <DropdownMenu key="align">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className={`h-8 w-[42px] shrink-0 px-1 py-0 flex items-center justify-center gap-1 rounded-full md:rounded-full text-xs md:text-sm ${
                                isNonDefaultAlign ? "text-primary font-medium" : "font-normal text-foreground"
                              }`}
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon(currentAlignIcon)}
                              <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
                              <span className="sr-only">{t("editor.textAlign")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.textAlign")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isLeft ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("alignLeft")}
                            <span>{t("editor.alignLeft")}</span>
                          </div>
                          {isLeft && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isCenter ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("alignCenter")}
                            <span>{t("editor.alignCenter")}</span>
                          </div>
                          {isCenter && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isRight ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("alignRight")}
                            <span>{t("editor.alignRight")}</span>
                          </div>
                          {isRight && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isJustify ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("alignJustify")}
                            <span>{t("editor.alignJustify")}</span>
                          </div>
                          {isJustify && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                case "bold": {
                  const isActive = editor?.isActive("bold");
                  return (
                    <Tooltip key="bold">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                        >
                          {renderToolIcon("bold")}
                          <span className="sr-only">{t("editor.bold")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.bold")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "italic": {
                  const isActive = editor?.isActive("italic");
                  return (
                    <Tooltip key="italic">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                        >
                          {renderToolIcon("italic")}
                          <span className="sr-only">{t("editor.italic")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.italic")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "underline": {
                  const isActive = editor?.isActive("underline");
                  return (
                    <Tooltip key="underline">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        >
                          {renderToolIcon("underline")}
                          <span className="sr-only">{t("editor.underline")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.underline")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "strike": {
                  const isActive = editor?.isActive("strike");
                  return (
                    <Tooltip key="strike">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleStrike().run()}
                        >
                          {renderToolIcon("strike")}
                          <span className="sr-only">{t("editor.strikethrough")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.strikethrough")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "highlight": {
                  const isActive = editor?.isActive("highlight");
                  return (
                    <Tooltip key="highlight">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHighlight().run()}
                        >
                          {renderToolIcon("highlight")}
                          <span className="sr-only">{t("editor.highlight")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.highlight")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "superscript": {
                  const isActive = editor?.isActive("superscript");
                  return (
                    <Tooltip key="superscript">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                        >
                          {renderToolIcon("superscript")}
                          <span className="sr-only">{t("editor.superscript")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.superscript")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "subscript": {
                  const isActive = editor?.isActive("subscript");
                  return (
                    <Tooltip key="subscript">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleSubscript().run()}
                        >
                          {renderToolIcon("subscript")}
                          <span className="sr-only">{t("editor.subscript")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.subscript")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "list":
                case "bulletList":
                case "orderedList":
                case "taskList": {
                  const isBullet = editor?.isActive("bulletList");
                  const isOrdered = editor?.isActive("orderedList");
                  const isTask = editor?.isActive("taskList");
                  const isAnyListActive = isBullet || isOrdered || isTask;

                  let currentListIcon = "bulletList";
                  if (isOrdered) currentListIcon = "orderedList";
                  else if (isTask) currentListIcon = "taskList";

                  return (
                    <DropdownMenu key={id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className={`h-8 w-[42px] shrink-0 px-1 py-0 flex items-center justify-center gap-1 rounded-full md:rounded-full text-xs md:text-sm ${
                                isAnyListActive ? "text-primary font-medium" : "font-normal text-foreground"
                              }`}
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon(currentListIcon)}
                              <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
                              <span className="sr-only">{t("editor.list")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.list")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isBullet ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("bulletList")}
                            <span>{t("editor.bulletList")}</span>
                          </div>
                          {isBullet && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isOrdered ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("orderedList")}
                            <span>{t("editor.orderedList")}</span>
                          </div>
                          {isOrdered && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleTaskList().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isTask ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("taskList")}
                            <span>{t("editor.checkbox")}</span>
                          </div>
                          {isTask && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                case "toggle": {
                  const isActive = isToggleActive(editor);
                  return (
                    <Tooltip key="toggle">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-pressed={isActive}
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleToggleClick(editor)}
                        >
                          {renderToolIcon("toggle")}
                          <span className="sr-only">{t("editor.toggle")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.toggle")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "code":
                case "codeBlock": {
                  const isInlineCode = editor?.isActive("code");
                  const isCodeBlock = editor?.isActive("codeBlock");
                  const isAnyCodeActive = isInlineCode || isCodeBlock;
                  const currentCodeIcon = isCodeBlock ? "codeBlock" : "code";

                  return (
                    <DropdownMenu key={id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className={`h-8 w-[42px] shrink-0 px-1 py-0 flex items-center justify-center gap-1 rounded-full md:rounded-full text-xs md:text-sm ${
                                isAnyCodeActive ? "text-primary font-medium" : "font-normal text-foreground"
                              }`}
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon(currentCodeIcon)}
                              <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
                              <span className="sr-only">{t("editor.code")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.code")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleCode().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isInlineCode ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("code")}
                            <span>{t("editor.inlineCode")}</span>
                          </div>
                          {isInlineCode && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isCodeBlock ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderToolIcon("codeBlock")}
                            <span>{t("editor.codeBlock")}</span>
                          </div>
                          {isCodeBlock && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                case "blockquote": {
                  const isActive = editor?.isActive("blockquote");
                  return (
                    <Tooltip key="blockquote">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        >
                          {renderToolIcon("blockquote")}
                          <span className="sr-only">{t("editor.blockquote")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.blockquote")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "horizontalRule":
                  return (
                    <Tooltip key="horizontalRule">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full text-foreground"
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        >
                          {renderToolIcon("horizontalRule")}
                          <span className="sr-only">{t("editor.horizontalRule")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.horizontalRule")}</TooltipContent>
                    </Tooltip>
                  );
                case "footnote":
                  return (
                    <Tooltip key="footnote">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full text-foreground"
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (!editor) return;
                            openFootnoteDialog();
                          }}
                        >
                          {renderToolIcon("footnote")}
                          <span className="sr-only">{t("editor.footnote")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.footnote")}</TooltipContent>
                    </Tooltip>
                  );
                case "table": {
                  if (!editor) return null;
                  const isTableActive = editor.isActive("table");
                  if (!isTableActive) {
                    return (
                      <Tooltip key="table">
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full text-foreground"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                          >
                            {renderToolIcon("table")}
                            <span className="sr-only">{t("editor.insertTable")}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.insertTable")}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return (
                    <DropdownMenu key="table">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full text-primary font-medium"
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon("table")}
                              <span className="sr-only">{t("editor.tableOptions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.tableOptions")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-60">
                        <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                          <Plus className="h-4 w-4" />
                          <span>{t("editor.addRowAbove")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                          <Plus className="h-4 w-4" />
                          <span>{t("editor.addRowBelow")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => editor.chain().focus().deleteRow().run()} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteRow")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                          <Plus className="h-4 w-4" />
                          <span>{t("editor.addColumnLeft")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                          <Plus className="h-4 w-4" />
                          <span>{t("editor.addColumnRight")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => editor.chain().focus().deleteColumn().run()} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteColumn")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => editor.chain().focus().mergeCells().run()}
                          disabled={!editor.can().mergeCells()}
                        >
                          {renderToolIcon("table")}
                          <span>{t("editor.mergeCells")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor.chain().focus().splitCell().run()}
                          disabled={!editor.can().splitCell()}
                        >
                          {renderToolIcon("table")}
                          <span>{t("editor.splitCell")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
                          {renderToolIcon("table")}
                          <span>{t("editor.toggleHeaderRow")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => editor.chain().focus().deleteTable().run()} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteTable")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                case "emoji":
                  return (
                    <Popover key="emoji">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon("emoji")}
                              <span className="sr-only">{t("editor.emoji")}</span>
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.emoji")}</TooltipContent>
                      </Tooltip>
                      <PopoverContent align="start" className="w-72 rounded-xl p-2.5 shadow-xl border border-border/80">
                        <div className="text-xs font-semibold text-muted-foreground mb-1.5 px-1">
                          {t("editor.insertEmoji")}
                        </div>
                        <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto pr-1 select-none no-scrollbar">
                          {EMOJI_LIST.map((emoji, index) => (
                            <button
                              key={`${emoji}-${index}`}
                              type="button"
                              className="h-8 w-8 text-lg rounded-lg hover:bg-primary/[0.08] focus:bg-primary/15 hover:text-primary focus:text-primary flex items-center justify-center transition-colors cursor-pointer"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                if (editor) {
                                  editor.chain().focus().insertContent(emoji).run();
                                }
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                case "calculator":
                  return (
                    <Tooltip key="calculator">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={toggleCalculator}
                        >
                          {renderToolIcon("calculator")}
                          <span className="sr-only">{t("editor.calculator")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.calculator")}</TooltipContent>
                    </Tooltip>
                  );
                case "translator":
                  return (
                    <Tooltip key="translator">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={toggleTranslator}
                        >
                          {renderToolIcon("translator")}
                          <span className="sr-only">{t("editor.translator")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.translator")}</TooltipContent>
                    </Tooltip>
                  );
                case "clock":
                  return (
                    <Tooltip key="clock">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={toggleClock}
                        >
                          {renderToolIcon("clock")}
                          <span className="sr-only">{t("editor.clock")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.clock")}</TooltipContent>
                    </Tooltip>
                  );
                case "link": {
                  const isActive = editor?.isActive("link");
                  return (
                    <Tooltip key="link">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={openLinkDialog}
                        >
                          {renderToolIcon("link")}
                          <span className="sr-only">{t("editor.link")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.link")}</TooltipContent>
                    </Tooltip>
                  );
                }
                case "image":
                  return (
                    <DropdownMenu key="image">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon("image")}
                              <span className="sr-only">{t("editor.image")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.image")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-60">
                        <DropdownMenuItem onClick={openImageDialog}>
                          <ImagePlus className="h-4 w-4" />
                          <span>{t("editor.insertImageByUrl")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openWorkspaceImageDialog}>
                          <Images className="h-4 w-4" />
                          <span>{t("editor.insertImageFromWorkspace")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            rememberSelection();
                            imageInputRef.current?.click();
                          }}
                        >
                          <Upload className="h-4 w-4" />
                          <span>{t("editor.uploadImage")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                case "video":
                  return (
                    <DropdownMenu key="video">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon("video")}
                              <span className="sr-only">{t("editor.video")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.video")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-60">
                        <DropdownMenuItem onClick={openVideoDialog}>
                          <Film className="h-4 w-4" />
                          <span>{t("editor.insertVideoByUrl")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openWorkspaceVideoDialog}>
                          <Video className="h-4 w-4" />
                          <span>{t("editor.insertVideoFromWorkspace")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            rememberSelection();
                            videoInputRef.current?.click();
                          }}
                        >
                          <Upload className="h-4 w-4" />
                          <span>{t("editor.uploadVideo")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                case "qrCode":
                  return (
                    <Tooltip key="qrCode">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setQrCodeDialogOpen(true)}
                        >
                          {renderToolIcon("qrCode")}
                          <span className="sr-only">{t("editor.qrCode")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.qrCode")}</TooltipContent>
                    </Tooltip>
                  );
                case "audio":
                  return (
                    <Tooltip key="audio">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={openAudioRecorder}
                        >
                          {renderToolIcon("audio")}
                          <span className="sr-only">{t("editor.recordAudio")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.recordAudio")}</TooltipContent>
                    </Tooltip>
                  );
                case "fixLanguage":
                  return (
                    <Tooltip key="fixLanguage">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleFixLanguage}
                        >
                          {renderToolIcon("fixLanguage")}
                          <span className="sr-only">{t("editor.fixLanguage")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.fixLanguage")}</TooltipContent>
                    </Tooltip>
                  );
                default:
                  return null;
              }
            };

            const renderDropdownItem = (id: string) => {
              const renderDropdownIcon = (toolId: string) => {
                const IconComp = getToolbarIcon(toolId, settings.iconPack);
                return <IconComp className="h-4 w-4" />;
              };

              switch (id) {
                case "undo":
                  return (
                    <DropdownMenuItem key="undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor || !editor.can().undo()}>
                      {renderDropdownIcon("undo")}
                      <span>{t("editor.undo")}</span>
                    </DropdownMenuItem>
                  );
                case "redo":
                  return (
                    <DropdownMenuItem key="redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor || !editor.can().redo()}>
                      {renderDropdownIcon("redo")}
                      <span>{t("editor.redo")}</span>
                    </DropdownMenuItem>
                  );
                case "heading":
                  return (
                    <DropdownMenuSub key="heading" open={overflowSubmenu === "heading"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "heading" ? null : "heading")}>
                        {renderDropdownIcon("heading")}
                        <span>{t("editor.headings")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            editor?.isActive("heading", { level: 1 }) ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("h1")}
                            <span>{t("editor.heading1")}</span>
                          </div>
                          {editor?.isActive("heading", { level: 1 }) && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            editor?.isActive("heading", { level: 2 }) ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("h2")}
                            <span>{t("editor.heading2")}</span>
                          </div>
                          {editor?.isActive("heading", { level: 2 }) && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            editor?.isActive("heading", { level: 3 }) ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("h3")}
                            <span>{t("editor.heading3")}</span>
                          </div>
                          {editor?.isActive("heading", { level: 3 }) && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            editor?.isActive("heading", { level: 4 }) ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("h4")}
                            <span>{t("editor.heading4")}</span>
                          </div>
                          {editor?.isActive("heading", { level: 4 }) && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 5 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            editor?.isActive("heading", { level: 5 }) ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("h5")}
                            <span>{t("editor.heading5")}</span>
                          </div>
                          {editor?.isActive("heading", { level: 5 }) && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 6 }).run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            editor?.isActive("heading", { level: 6 }) ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("h6")}
                            <span>{t("editor.heading6")}</span>
                          </div>
                          {editor?.isActive("heading", { level: 6 }) && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                case "fontFamily": {
                  const activeFont = getActiveFontFamily(editor);
                  const isFontActive = Boolean(activeFont);
                  const activeSettingFontId = settings?.editorFontFamily || settings?.fontFamily || "inter";
                  const settingFont = findMatchingFontOption(activeSettingFontId, customFonts) || FONT_OPTIONS[0];
                  const foundFont = findMatchingFontOption(activeFont, customFonts);
                  const currentFontId = isFontActive && foundFont ? foundFont.id : settingFont?.id;
                  return (
                    <DropdownMenuSub key="fontFamily" open={overflowSubmenu === "fontFamily"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "fontFamily" ? null : "fontFamily")}>
                        {renderDropdownIcon("fontFamily")}
                        <span>{t("editor.fontFamily")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56 max-h-80 overflow-y-auto rounded-xl p-1.5 shadow-md">
                        {/* Custom Fonts Group */}
                        {customFonts && customFonts.length > 0 && (
                          <div className="mb-1.5 pb-1.5 border-b border-border/60">
                            <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {t("settings.customFonts")}
                            </div>
                            {customFonts.map((font) => {
                              const isCurrent = font.id === currentFontId;
                              return (
                                <ContextMenu key={font.id}>
                                  <ContextMenuTrigger asChild>
                                    <div
                                      role="menuitem"
                                      className={`cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between outline-none transition-colors select-none ${
                                        isCurrent ? "bg-primary/15 text-primary font-semibold hover:bg-primary/[0.18] focus:bg-primary/[0.18]" : "hover:bg-primary/[0.08] hover:text-primary focus:bg-primary/[0.08] focus:text-primary"
                                      }`}
                                      onClick={() => editor?.chain().focus().setFontFamily(font.css).run()}
                                      style={{ fontFamily: font.css }}
                                    >
                                      <span className="truncate flex-1">{font.name}</span>
                                      {isCurrent && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0 ml-2" />}
                                    </div>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent className="w-48 rounded-xl p-1.5 shadow-md z-[65]">
                                    <ContextMenuItem
                                      onClick={() => {
                                        setFontToRename(font);
                                        setFontRenameValue(font.name);
                                      }}
                                      className="gap-2.5 py-1.5 px-3 rounded-lg cursor-pointer text-[13px]"
                                    >
                                      <Pencil className="h-4 w-4 text-muted-foreground" />
                                      <span>{t("settings.renameFont")}</span>
                                    </ContextMenuItem>
                                    <ContextMenuItem
                                      variant="destructive"
                                      onClick={() => {
                                        setFontToDelete(font);
                                      }}
                                      className="gap-2.5 py-1.5 px-3 rounded-lg text-destructive focus:text-destructive cursor-pointer text-[13px]"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                      <span>{t("settings.deleteFont")}</span>
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              );
                            })}
                          </div>
                        )}

                        {/* System Fonts Group */}
                        <div>
                          {customFonts && customFonts.length > 0 && (
                            <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {t("settings.systemFonts")}
                            </div>
                          )}
                          {FONT_OPTIONS.map((font) => {
                            const isCurrent = font.id === currentFontId;
                            return (
                              <DropdownMenuItem
                                key={font.id}
                                onClick={() => editor?.chain().focus().setFontFamily(font.css).run()}
                                style={{ fontFamily: font.css }}
                                className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                                  isCurrent ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                                }`}
                              >
                                <span className="truncate">{t(font.nameKey as any) || font.id}</span>
                                {isCurrent && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </div>

                        {/* Upload Font Button */}
                        <div className="mt-1.5 pt-1.5 border-t border-border/60">
                          <DropdownMenuItem
                            className="w-full gap-2 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center text-muted-foreground hover:text-primary focus:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              fontFileInputRef.current?.click();
                            }}
                          >
                            <Upload className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate font-medium">{t("settings.uploadFont")}</span>
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                case "fontSize": {
                  const activeFontSize = editor?.getAttributes("fontSize")?.fontSize;
                  const baseSizeNum = settings?.editorFontSize || editorFontSize || 15;
                  const baseSizePx = `${baseSizeNum}px`;
                  const currentSize = activeFontSize || baseSizePx;
                  const appFontCss = FONT_FAMILY_CSS[settings?.fontFamily || "inter"] || "var(--app-font-family)";
                  const FONT_SIZES = [
                    "10px",
                    "12px",
                    "13px",
                    "14px",
                    "15px",
                    "16px",
                    "17px",
                    "18px",
                    "19px",
                    "20px",
                    "21px",
                    "22px",
                    "24px",
                    "28px",
                    "32px",
                    "36px",
                    "48px",
                    "64px",
                  ];
                  return (
                    <DropdownMenuSub key="fontSize" open={overflowSubmenu === "fontSize"}>
                      <DropdownMenuSubTrigger style={{ fontFamily: appFontCss }} onClick={() => setOverflowSubmenu((prev) => prev === "fontSize" ? null : "fontSize")}>
                        {renderDropdownIcon("fontSize")}
                        <span style={{ fontFamily: appFontCss }}>{t("editor.fontSize")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-40 max-h-72 overflow-y-auto rounded-xl p-1.5 shadow-md" style={{ fontFamily: appFontCss }}>
                        {FONT_SIZES.map((size) => {
                          const isCurrent = size === currentSize;
                          return (
                            <DropdownMenuItem
                              key={size}
                              onClick={() => editor?.chain().focus().setFontSize(size).run()}
                              style={{ fontFamily: appFontCss }}
                              className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                                isCurrent ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                              }`}
                            >
                              <span style={{ fontFamily: appFontCss }}>{size}</span>
                              {isCurrent && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                case "textColor": {
                  const PRESET_TEXT_COLORS = [
                    "#26A295",
                    "#0ea5e9",
                    "#3b82f6",
                    "#6366f1",
                    "#8b5cf6",
                    "#d946ef",
                    "#ec4899",
                    "#f43f5e",
                    "#f97316",
                    "#eab308",
                    "#84cc16",
                    "#10b981",
                    "#14b8a6",
                    "#64748b",
                    "#000000",
                    "#ffffff",
                  ];
                  const activeColor = editor?.getAttributes("textColor")?.color;
                  return (
                    <DropdownMenuSub key="textColor" open={overflowSubmenu === "textColor"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "textColor" ? null : "textColor")}>
                        <TextColorIcon color={activeColor} className="h-4 w-4" />
                        <span>{t("editor.textColor")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-64 p-3 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Palette className="w-3.5 h-3.5 text-primary" />
                              {t("editor.textColor")}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                              {activeColor || t("editor.defaultColor") || "Default"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative w-10 h-9 rounded-xl overflow-hidden border border-border/70 shadow-sm flex-shrink-0 cursor-pointer transition-colors hover:border-primary/50">
                              <input
                                type="color"
                                value={activeColor && /^#[0-9A-Fa-f]{6}$/.test(activeColor) ? activeColor : "#000000"}
                                onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                                className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
                              />
                            </div>
                            <Input
                              value={activeColor || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  editor?.chain().focus().unsetColor().run();
                                } else {
                                  editor?.chain().focus().setColor(val).run();
                                }
                              }}
                              placeholder={t("editor.defaultColor")}
                              className="h-9 rounded-xl text-xs uppercase tracking-wider border-border/70 bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                              maxLength={7}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => editor?.chain().focus().unsetColor().run()}
                                  className="h-9 w-9 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer shrink-0 border border-border/70"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span className="sr-only">{t("editor.defaultColor")}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("editor.defaultColor")}</TooltipContent>
                            </Tooltip>
                          </div>

                          <div>
                            <span className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                              {t("settings.quickPresets")}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {PRESET_TEXT_COLORS.map((color) => {
                                const isSelected = activeColor?.toLowerCase() === color.toLowerCase();
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    style={{
                                      backgroundColor: color,
                                      borderColor: color === "#ffffff" ? "var(--border)" : "transparent",
                                    }}
                                    onClick={() => editor?.chain().focus().setColor(color).run()}
                                    className={`h-5 w-5 rounded-full border transition-transform cursor-pointer flex items-center justify-center relative ${
                                      isSelected
                                        ? "ring-2 ring-primary ring-offset-1 scale-110"
                                        : "hover:scale-115 opacity-85 hover:opacity-100"
                                    }`}
                                    aria-label={color}
                                  >
                                    {isSelected && (
                                      <Check className={`w-3 h-3 ${color === "#ffffff" ? "text-foreground" : "text-white"}`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                case "align": {
                  const isLeft = editor?.isActive({ textAlign: "left" }) || (!editor?.isActive({ textAlign: "center" }) && !editor?.isActive({ textAlign: "right" }) && !editor?.isActive({ textAlign: "justify" }));
                  const isCenter = editor?.isActive({ textAlign: "center" });
                  const isRight = editor?.isActive({ textAlign: "right" });
                  const isJustify = editor?.isActive({ textAlign: "justify" });

                  let currentAlignIcon = "alignLeft";
                  if (isCenter) currentAlignIcon = "alignCenter";
                  else if (isRight) currentAlignIcon = "alignRight";
                  else if (isJustify) currentAlignIcon = "alignJustify";

                  return (
                    <DropdownMenuSub key="align" open={overflowSubmenu === "align"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "align" ? null : "align")}>
                        {renderDropdownIcon(currentAlignIcon)}
                        <span>{t("editor.textAlign")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isLeft ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("alignLeft")}
                            <span>{t("editor.alignLeft")}</span>
                          </div>
                          {isLeft && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isCenter ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("alignCenter")}
                            <span>{t("editor.alignCenter")}</span>
                          </div>
                          {isCenter && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isRight ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("alignRight")}
                            <span>{t("editor.alignRight")}</span>
                          </div>
                          {isRight && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isJustify ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("alignJustify")}
                            <span>{t("editor.alignJustify")}</span>
                          </div>
                          {isJustify && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                case "bold": {
                  const isActive = editor?.isActive("bold");
                  return (
                    <DropdownMenuItem
                      key="bold"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("bold")}
                      <span className="flex-1">{t("editor.bold")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "italic": {
                  const isActive = editor?.isActive("italic");
                  return (
                    <DropdownMenuItem
                      key="italic"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("italic")}
                      <span className="flex-1">{t("editor.italic")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "underline": {
                  const isActive = editor?.isActive("underline");
                  return (
                    <DropdownMenuItem
                      key="underline"
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("underline")}
                      <span className="flex-1">{t("editor.underline")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "strike": {
                  const isActive = editor?.isActive("strike");
                  return (
                    <DropdownMenuItem
                      key="strike"
                      onClick={() => editor?.chain().focus().toggleStrike().run()}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("strike")}
                      <span className="flex-1">{t("editor.strikethrough")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "highlight": {
                  const isActive = editor?.isActive("highlight");
                  return (
                    <DropdownMenuItem
                      key="highlight"
                      onClick={() => editor?.chain().focus().toggleHighlight().run()}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("highlight")}
                      <span className="flex-1">{t("editor.highlight")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "superscript": {
                  const isActive = editor?.isActive("superscript");
                  return (
                    <DropdownMenuItem
                      key="superscript"
                      onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("superscript")}
                      <span className="flex-1">{t("editor.superscript")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "subscript": {
                  const isActive = editor?.isActive("subscript");
                  return (
                    <DropdownMenuItem
                      key="subscript"
                      onClick={() => editor?.chain().focus().toggleSubscript().run()}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("subscript")}
                      <span className="flex-1">{t("editor.subscript")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "list":
                case "bulletList":
                case "orderedList":
                case "taskList": {
                  const isBullet = editor?.isActive("bulletList");
                  const isOrdered = editor?.isActive("orderedList");
                  const isTask = editor?.isActive("taskList");
                  let currentListIcon = "bulletList";
                  if (isOrdered) currentListIcon = "orderedList";
                  else if (isTask) currentListIcon = "taskList";

                  return (
                    <DropdownMenuSub key="list" open={overflowSubmenu === "list"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "list" ? null : "list")}>
                        {renderDropdownIcon(currentListIcon)}
                        <span>{t("editor.list")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isBullet ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("bulletList")}
                            <span>{t("editor.bulletList")}</span>
                          </div>
                          {isBullet && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isOrdered ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("orderedList")}
                            <span>{t("editor.orderedList")}</span>
                          </div>
                          {isOrdered && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleTaskList().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isTask ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("taskList")}
                            <span>{t("editor.checkbox")}</span>
                          </div>
                          {isTask && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                case "toggle": {
                  const isActive = isToggleActive(editor);
                  return (
                    <DropdownMenuItem
                      key="toggle"
                      onClick={() => handleToggleClick(editor)}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("toggle")}
                      <span className="flex-1">{t("editor.toggle")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "code":
                case "codeBlock": {
                  const isInlineCode = editor?.isActive("code");
                  const isCodeBlock = editor?.isActive("codeBlock");
                  const currentCodeIcon = isCodeBlock ? "codeBlock" : "code";

                  return (
                    <DropdownMenuSub key="code" open={overflowSubmenu === "code"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "code" ? null : "code")}>
                        {renderDropdownIcon(currentCodeIcon)}
                        <span>{t("editor.code")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleCode().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isInlineCode ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("code")}
                            <span>{t("editor.inlineCode")}</span>
                          </div>
                          {isInlineCode && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                          className={`gap-2.5 cursor-pointer py-1.5 px-3 rounded-lg text-[13px] flex items-center justify-between ${
                            isCodeBlock ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderDropdownIcon("codeBlock")}
                            <span>{t("editor.codeBlock")}</span>
                          </div>
                          {isCodeBlock && <Check className="h-4 w-4 stroke-[2.5] text-primary shrink-0" />}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                case "blockquote": {
                  const isActive = editor?.isActive("blockquote");
                  return (
                    <DropdownMenuItem
                      key="blockquote"
                      onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("blockquote")}
                      <span className="flex-1">{t("editor.blockquote")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "horizontalRule":
                  return (
                    <DropdownMenuItem
                      key="horizontalRule"
                      onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {renderDropdownIcon("horizontalRule")}
                      <span className="flex-1">{t("editor.horizontalRule")}</span>
                    </DropdownMenuItem>
                  );
                case "footnote":
                  return (
                    <DropdownMenuItem
                      key="footnote"
                      onClick={() => {
                        if (!editor) return;
                        openFootnoteDialog();
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {renderDropdownIcon("footnote")}
                      <span className="flex-1">{t("editor.footnote")}</span>
                    </DropdownMenuItem>
                  );
                case "table": {
                  const isTableActive = editor?.isActive("table");
                  if (!isTableActive) {
                    return (
                      <DropdownMenuItem
                        key="table"
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                      >
                        {renderDropdownIcon("table")}
                        <span className="flex-1">{t("editor.insertTable")}</span>
                      </DropdownMenuItem>
                    );
                  }
                  return (
                    <DropdownMenuSub key="table" open={overflowSubmenu === "table"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "table" ? null : "table")}>
                        {renderDropdownIcon("table")}
                        <span>{t("editor.tableOptions")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-60 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem onClick={() => editor?.chain().focus().addRowBefore().run()}>
                          <Plus className="h-4 w-4" />
                          <span>{t("editor.addRowAbove")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor?.chain().focus().addRowAfter().run()}>
                          <Plus className="h-4 w-4" />
                          <span>{t("editor.addRowBelow")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => editor?.chain().focus().deleteRow().run()} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteRow")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => editor?.chain().focus().addColumnBefore().run()}>
                          <Plus className="h-4 w-4" />
                          <span>{t("editor.addColumnLeft")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor?.chain().focus().addColumnAfter().run()}>
                          <Plus className="h-4 w-4" />
                          <span>{t("editor.addColumnRight")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => editor?.chain().focus().deleteColumn().run()} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteColumn")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().mergeCells().run()}
                          disabled={!editor?.can().mergeCells()}
                        >
                          {renderDropdownIcon("table")}
                          <span>{t("editor.mergeCells")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor?.chain().focus().splitCell().run()}
                          disabled={!editor?.can().splitCell()}
                        >
                          {renderDropdownIcon("table")}
                          <span>{t("editor.splitCell")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeaderRow().run()}>
                          {renderDropdownIcon("table")}
                          <span>{t("editor.toggleHeaderRow")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => editor?.chain().focus().deleteTable().run()} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteTable")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                case "emoji":
                  return (
                    <DropdownMenuItem
                      key="emoji"
                      onSelect={(e) => {
                        const target = e.currentTarget as HTMLElement;
                        const rect = target?.getBoundingClientRect?.();
                        const top = rect ? Math.min(rect.top, window.innerHeight - 280) : 200;
                        const left = rect ? Math.max(12, rect.left - 295) : 200;
                        setSlashEmojiState({ open: true, coords: { top, left } });
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {renderDropdownIcon("emoji")}
                      <span className="flex-1">{t("editor.insertEmoji")}</span>
                    </DropdownMenuItem>
                  );
                case "calculator":
                  return (
                    <DropdownMenuItem key="calculator" onClick={toggleCalculator}>
                      {renderDropdownIcon("calculator")}
                      <span>{t("editor.calculator")}</span>
                    </DropdownMenuItem>
                  );
                case "translator":
                  return (
                    <DropdownMenuItem key="translator" onClick={toggleTranslator}>
                      {renderDropdownIcon("translator")}
                      <span>{t("editor.translator")}</span>
                    </DropdownMenuItem>
                  );
                case "clock":
                  return (
                    <DropdownMenuItem key="clock" onClick={toggleClock}>
                      {renderDropdownIcon("clock")}
                      <span>{t("editor.clock")}</span>
                    </DropdownMenuItem>
                  );
                case "link": {
                  const isActive = editor?.isActive("link");
                  return (
                    <DropdownMenuItem
                      key="link"
                      onClick={openLinkDialog}
                      className={`flex items-center gap-2 cursor-pointer ${isActive ? "text-primary font-medium" : ""}`}
                    >
                      {renderDropdownIcon("link")}
                      <span className="flex-1">{t("editor.link")}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  );
                }
                case "image":
                  return (
                    <DropdownMenuSub key="image" open={overflowSubmenu === "image"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "image" ? null : "image")}>
                        {renderDropdownIcon("image")}
                        <span>{t("editor.image")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem onClick={openImageDialog} className="flex items-center gap-2 cursor-pointer">
                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{t("editor.insertImageByUrl")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openWorkspaceImageDialog} className="flex items-center gap-2 cursor-pointer">
                          <Images className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{t("editor.insertImageFromWorkspace")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            rememberSelection();
                            imageInputRef.current?.click();
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{t("editor.uploadImage")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                case "video":
                  return (
                    <DropdownMenuSub key="video" open={overflowSubmenu === "video"}>
                      <DropdownMenuSubTrigger onClick={() => setOverflowSubmenu((prev) => prev === "video" ? null : "video")}>
                        {renderDropdownIcon("video")}
                        <span>{t("editor.video")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem onClick={openVideoDialog} className="flex items-center gap-2 cursor-pointer">
                          <Film className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{t("editor.insertVideoByUrl")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openWorkspaceVideoDialog} className="flex items-center gap-2 cursor-pointer">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{t("editor.insertVideoFromWorkspace")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            rememberSelection();
                            videoInputRef.current?.click();
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{t("editor.uploadVideo")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                case "qrCode":
                  return (
                    <DropdownMenuItem key="qrCode" onClick={() => setQrCodeDialogOpen(true)}>
                      {renderDropdownIcon("qrCode")}
                      <span>{t("editor.qrCode")}</span>
                    </DropdownMenuItem>
                  );
                case "audio":
                  return (
                    <DropdownMenuItem
                      key="audio"
                      onClick={openAudioRecorder}
                    >
                      {renderDropdownIcon("audio")}
                      <span>{t("editor.recordAudio")}</span>
                    </DropdownMenuItem>
                  );
                case "fixLanguage":
                  return (
                    <DropdownMenuItem key="fixLanguage" onClick={handleFixLanguage}>
                      {renderDropdownIcon("fixLanguage")}
                      <span>{t("editor.fixLanguage")}</span>
                    </DropdownMenuItem>
                  );
                case "aiAssistant":
                  if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
                    return (
                      <DropdownMenuItem
                        key="aiAssistant"
                        disabled={!editor || aiGenerating}
                        onClick={handleOpenAiSettings}
                      >
                        {renderDropdownIcon("aiAssistant")}
                        <span>{t("settings.aiAssistant")}</span>
                      </DropdownMenuItem>
                    );
                  }
                  return (
                    <DropdownMenuSub key="aiAssistant" open={overflowSubmenu === "aiAssistant"}>
                      <DropdownMenuSubTrigger disabled={!editor || aiGenerating} onClick={() => setOverflowSubmenu((prev) => prev === "aiAssistant" ? null : "aiAssistant")}>
                        {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : renderDropdownIcon("aiAssistant")}
                        <span>{t("settings.aiAssistant")}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-60 rounded-xl p-1.5 shadow-md">
                        <DropdownMenuItem onClick={() => handleAiAction("improve")}>
                          <WandSparklesIcon className="h-4 w-4" />
                          <span>{t("settings.aiImprove")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("fix_grammar")}>
                          <SpellCheckIcon className="h-4 w-4" />
                          <span>{t("settings.aiFixGrammar")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_shorter")}>
                          <Minimize2 className="h-4 w-4" />
                          <span>{t("settings.aiMakeShorter")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_longer")}>
                          <Maximize2 className="h-4 w-4" />
                          <span>{t("settings.aiMakeLonger")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("simplify")}>
                          <BookOpen className="h-4 w-4" />
                          <span>{t("settings.aiSimplify")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("formalize")}>
                          <BriefcaseBusinessIcon className="h-4 w-4" />
                          <span>{t("settings.aiFormalize")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_casual")}>
                          <MessageCircle className="h-4 w-4" />
                          <span>{t("settings.aiMakeCasual")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("translate")}>
                          <Languages className="h-4 w-4" />
                          <span>{t("settings.aiTranslate")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("continue_writing")}>
                          <ArrowRight className="h-4 w-4" />
                          <span>{t("settings.aiContinueWriting")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("rewrite")}>
                          <PenLineIcon className="h-4 w-4" />
                          <span>{t("settings.aiRewrite")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                default:
                  return null;
              }
            };

            return (
              <div data-editor-toolbar="true" className="flex w-fit max-w-full items-center gap-1 overflow-x-auto no-scrollbar rounded-full border border-border bg-secondary p-1">
                {visibleItems.map((item, index) => {
                  const showSeparator = index > 0 && item.group !== visibleItems[index - 1].group;
                  return (
                    <Fragment key={item.id}>
                      {showSeparator && <div className="h-4 w-px shrink-0 bg-border" />}
                      {renderToolbarButton(item.id)}
                    </Fragment>
                  );
                })}

                {hasOverflow && (
                  <>
                    <div className="h-4 w-px shrink-0 bg-border" />
                    <DropdownMenu onOpenChange={(open) => { if (!open) setOverflowSubmenu(null); }}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                              disabled={!editor}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t("editor.moreTools")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.moreTools")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" sideOffset={4} className="w-60">
                        {overflowItems.map((item) => renderDropdownItem(item.id))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            );
          })() : null}
        </div>

        <div className={`flex w-full shrink-0 items-center justify-between gap-1 ${isMobile ? "order-1 pt-0" : "pt-1"} lg:w-auto lg:justify-self-end lg:justify-end lg:pt-0`}>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,video/*" className="hidden" onChange={handleVideoUpload} />
          <div className="ml-auto flex items-center gap-1">
          {effectiveStatusPortalTarget && createPortal(renderSaveStatusIndicator(), effectiveStatusPortalTarget)}
          {effectivePortalTarget && createPortal(renderActionButtons(), effectivePortalTarget)}
          <input ref={docxInputRef} type="file" accept=".docx" className="hidden" onChange={handleImportDocx} />
          <Dialog open={importDocxDialogOpen} onOpenChange={setImportDocxDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t("docxImport.title")}</DialogTitle>
                <DialogDescription>{t("docxImport.description")}</DialogDescription>
              </DialogHeader>
              <div className="py-1">
                <Button type="button" onClick={() => docxInputRef.current?.click()}>
                  {t("docxImport.selectFile")}
                </Button>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setImportDocxDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>



          </div>
        </div>
      </div>
      </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row min-w-0 overflow-hidden">
        <div
          ref={editorScrollContainerRef}
          onScroll={handleEditorScroll}
          onWheelCapture={() => {
            isRestoringScrollRef.current = false;
          }}
          onPointerDownCapture={() => {
            isRestoringScrollRef.current = false;
          }}
          onTouchStartCapture={() => {
            isRestoringScrollRef.current = false;
          }}
          onKeyDownCapture={() => {
            isRestoringScrollRef.current = false;
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (navigateFootnoteOrAnchor(target, e.currentTarget)) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }}
          className={`flex flex-col cursor-default ${
            isImageFile(note) || isVideoFile(note) || isBinaryFile(note) || isPdfFile(note) || note.contentFormat === "html" || isHtmlFile(note) || note.contentFormat === "css" || isCssFile(note) || note.contentFormat === "javascript" || isJsFile(note)
              ? "flex-1 min-h-0 min-w-0 overflow-hidden"
              : "flex-1 overflow-y-auto overflow-x-hidden min-w-0"
          } w-full`}
        >
          {(note.isLocked && !note.isDecrypted) || isEncryptedNote(note.content) ? (
            <LockedNoteViewer
              note={note}
              onUnlock={async (pin) => {
                if (onUnlockNote) {
                  return await onUnlockNote(note.id, pin);
                }
                return false;
              }}
            />
          ) : comparingVersion && (comparingVersion.noteId === note.id || (comparingVersion.relPath && comparingVersion.relPath === (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName))) ? (
            <VersionHistorySplitDiffView
              note={note}
              version={comparingVersion}
              editorFontSize={editorFontSize}
              assetBlobUrlMap={assetBlobUrlMap}
              resolveAssetDataUrl={resolveAssetDataUrl}
              onRestore={(ver) => {
                handleRestoreVersionContent(ver);
                setComparingVersion(null);
              }}
              onClose={() => setComparingVersion(null)}
            />
          ) : isImageFile(note) ? (
            <div className="flex-1 min-h-0 min-w-0 w-full h-full p-4 md:p-6 overflow-auto flex items-center justify-center">
              {imageBlobUrl || (note.content?.startsWith("data:") || note.content?.startsWith("blob:") || note.content?.startsWith("http") ? note.content : null) ? (
                <img
                  ref={(img) => {
                    imageElementRef.current = img;
                    if (img && img.complete && img.naturalWidth > 0 && !imageDimensions) {
                      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                    }
                  }}
                  src={imageBlobUrl || (note.content?.startsWith("data:") || note.content?.startsWith("blob:") || note.content?.startsWith("http") ? note.content : undefined)}
                  alt={note.fileName}
                  style={
                    imageZoomMode === "fit"
                      ? { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }
                      : {
                          width: imageDimensions ? `${(imageDimensions.width * imageCustomZoom) / 100}px` : `${imageCustomZoom}%`,
                          maxWidth: "none",
                          maxHeight: "none",
                          flexShrink: 0,
                        }
                  }
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                    const container = img.parentElement;
                    if (container) {
                      const maxW = container.clientWidth;
                      const maxH = container.clientHeight;
                      const isLarge = img.naturalWidth > maxW || img.naturalHeight > maxH;
                      setCanZoomImage(isLarge);
                    }
                  }}
                  onClick={handleToggleZoomFit}
                  className={`m-auto select-none transition-[width,height] duration-150 border border-border/60 shadow-sm rounded-xl ${
                    imageZoomMode === "fit"
                      ? "cursor-zoom-in"
                      : "cursor-zoom-out"
                  }`}
                />
              ) : (
                <p className="m-auto text-sm text-muted-foreground">{note.fileName}</p>
              )}
            </div>
          ) : (isAudioFile(note) && !videoBlobUrl) || (audioBlobUrl && !videoBlobUrl) ? (
            <div className="flex-1 min-h-0 min-w-0 w-full h-full p-4 md:p-6 overflow-auto flex flex-col items-center justify-center">
              {audioBlobUrl ? (
                <div className="w-full max-w-2xl px-4">
                  <AudioPlayer src={audioBlobUrl} title={note.fileName} />
                </div>
              ) : (
                <PageLoader title={note.fileName || t("common.loading")} />
              )}
            </div>
          ) : isVideoFile(note) || videoBlobUrl ? (
            <div className="flex-1 min-h-0 min-w-0 w-full h-full p-4 md:p-6 overflow-auto flex flex-col items-center justify-center">
              {videoBlobUrl ? (
                <div className="relative flex flex-col items-center justify-center max-w-full max-h-full">
                  <VideoPlayer
                    src={videoBlobUrl}
                    title={note.fileName}
                    onLoadedMetadata={({ width, height, duration }) => {
                      setVideoDimensions({ width, height });
                      setVideoDuration(duration);
                    }}
                    onError={() => setVideoError(true)}
                    onOpenInSystemApp={() => void handleOpenInSystemApp()}
                  />
                </div>
              ) : (
                <PageLoader title={note.fileName || t("common.loading")} />
              )}
            </div>
          ) : isPdfFile(note) ? (
            <PdfEditorView
              key={note.id}
              ref={pdfEditorRef}
              noteId={note.id}
              fileName={note.fileName || note.title || "document.pdf"}
              filePath={pdfLoadedNoteId === note.id ? pdfFullPath : (note as any)?.fullPath}
              folderPath={pdfLoadedNoteId === note.id ? (pdfWorkspaceFolder || note.folderPath) : note.folderPath}
              fileSize={activeFileSize}
              pdfBase64={pdfLoadedNoteId === note.id ? pdfBase64 : null}
              pdfUrl={pdfLoadedNoteId === note.id ? pdfBlobUrl : null}
              isLoadingSource={pdfLoadedNoteId !== note.id || isPdfLoadingSource}
              sourceError={pdfLoadedNoteId === note.id ? pdfSourceError : null}
              readOnly={isReadingMode}
              isVisible={isVisible}
              language={lang}
              onBookmarksChange={setPdfBookmarks}
              onDirtyChange={(dirty) => {
                setSaveStatus(dirty ? "unsaved" : "saved");
              }}
              onSavingChange={(saving) => {
                if (saving) setSaveStatus("saving");
              }}
              onSaved={(savedAt) => {
                setLastEditedTime(savedAt.getTime());
                setSaveStatus("manually_saved");
              }}
              onViewerStateChange={(st) => {
                setPdfViewerState(st);
                if (st?.currentTool) {
                  setPdfActiveTool(st.currentTool);
                }
                if (st.searchStats) {
                  setPdfSearchStats({
                    total: st.searchStats.total,
                    current: st.searchStats.current,
                  });
                }
              }}
              onReplacePdfBase64={(newBase64, newByteLength) => {
                setPdfBase64(newBase64);
                setActiveFileSize(newByteLength);
              }}
              onUpdatePdfFileSize={(newByteLength) => {
                setActiveFileSize(newByteLength);
              }}
              onRequestSave={() => void handleSaveFile()}
              onRequestFind={() => handlePdfSearchOpenChange(true)}
              onRequestPrint={() => void pdfEditorRef.current?.printPdf()}
              onPdfLoaded={() => setIsPdfViewLoaded(true)}
              onOpenExternal={() => void handleOpenInSystemApp()}
            />
          ) : isBinaryFile(note) ? (
            <div className="flex-1 min-h-0 min-w-0 w-full h-full flex flex-col items-center justify-center gap-3.5 p-6 text-muted-foreground">
              {(() => {
                const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
                const customIcon = note.icon || (relPath && settings?.fileIcons?.[relPath]?.icon);
                const customColor = note.iconColor || (relPath && settings?.fileIcons?.[relPath]?.color);
                const baseCls = "h-12 w-12 shrink-0 stroke-[1.5]";
                const defaultColorCls = customColor ? "" : "text-muted-foreground/70";

                if (customIcon) {
                  const custom = renderCustomIcon(
                    customIcon,
                    `${baseCls} ${defaultColorCls}`,
                    { color: customColor || undefined, fontSize: "2.75rem" }
                  );
                  if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
                }

                const defaultKey = getNoteDefaultIconKey(note);
                const IconComp = getToolbarIcon(defaultKey, settings.iconPack);
                return (
                  <IconComp
                    className={`${baseCls} ${defaultColorCls}`}
                    strokeWidth={1.5}
                    style={customColor ? { color: customColor } : undefined}
                  />
                );
              })()}
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-semibold text-foreground">{note.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getFileFormatLabel(note)}</span>
                  {activeFileSize != null && (
                    <>
                      <span>•</span>
                      <span>{formatFileSize(activeFileSize)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : note.contentFormat === "css" || isCssFile(note) ? (
            <HtmlCodeEditor
              ref={codeEditorRef}
              key={note.id}
              value={codeEditorContentMap.get(note.id) ?? note.content}
              onChange={handleCodeEditorChange}
              fontSize={editorFontSize}
              onCursorChange={(line, col) => setHtmlCursor({ line, col })}
              onBlur={() => flushDebouncedContentSave(note)}
              spellCheck={spellCheckEnabled}
              noteId={note.id}
              language="css"
              showIndentGuides={settings.showCodeIndentGuides !== false}
              isVisible={isVisible}
              onOpenSearch={handleOpenCodeSearch}
            />
          ) : note.contentFormat === "javascript" || note.contentFormat === "js" || isJsFile(note) ? (
            <HtmlCodeEditor
              ref={codeEditorRef}
              key={note.id}
              value={codeEditorContentMap.get(note.id) ?? note.content}
              onChange={handleCodeEditorChange}
              fontSize={editorFontSize}
              onCursorChange={(line, col) => setHtmlCursor({ line, col })}
              onBlur={() => flushDebouncedContentSave(note)}
              spellCheck={spellCheckEnabled}
              noteId={note.id}
              language="javascript"
              showIndentGuides={settings.showCodeIndentGuides !== false}
              isVisible={isVisible}
              onOpenSearch={handleOpenCodeSearch}
            />
          ) : note.contentFormat === "html" || isHtmlFile(note) ? (
            <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col">
              {/* Preview View */}
              <div className={`flex-1 w-full h-full overflow-hidden flex flex-col bg-muted/20 ${htmlPreviewOpen ? "flex" : "hidden"}`}>
                <div className="flex items-center justify-between border-b border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground bg-muted/40 shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <Play className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-foreground/80">{t("editor.htmlPreview")}</span>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={openHtmlPreviewInNewTab}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground flex items-center gap-1 text-xs cursor-pointer"
                        aria-label={t("editor.openHtmlInBrowser")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t("editor.openHtmlInBrowser")}</TooltipContent>
                  </Tooltip>
                </div>

                {/* Responsive Viewport Container */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 overflow-auto bg-muted/10">
                  <div
                    className={`h-full transition-all duration-300 shadow-md rounded-lg overflow-hidden border border-border/50 bg-white ${
                      htmlDeviceMode === "mobile"
                        ? "w-[375px]"
                        : htmlDeviceMode === "tablet"
                        ? "w-[768px]"
                        : "w-full"
                    }`}
                  >
                    <iframe
                      className="w-full h-full bg-white border-0"
                      srcDoc={previewHtml || codeEditorContentMap.get(note.id) || note.content}
                      sandbox="allow-scripts allow-forms allow-modals"
                      title="HTML Preview"
                    />
                  </div>
                </div>
              </div>

              {/* Code Editor View */}
              <div className={`flex-1 w-full h-full min-h-0 overflow-hidden ${htmlPreviewOpen ? "hidden" : "flex flex-col"}`}>
                <HtmlCodeEditor
                  ref={codeEditorRef}
                  key={note.id}
                  value={codeEditorContentMap.get(note.id) ?? note.content}
                  onChange={handleCodeEditorChange}
                  fontSize={editorFontSize}
                  onCursorChange={(line, col) => setHtmlCursor({ line, col })}
                  onBlur={() => flushDebouncedContentSave(note)}
                  spellCheck={spellCheckEnabled}
                  noteId={note.id}
                  isVisible={isVisible && !htmlPreviewOpen}
                  showIndentGuides={settings.showCodeIndentGuides !== false}
                  onOpenSearch={handleOpenCodeSearch}
                />
              </div>
            </div>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild onContextMenuCapture={handleEditorContextMenu}>
                <div
                  onPasteCapture={(e) => {
                    if (e.defaultPrevented) return;
                    const target = e.target as HTMLElement | null;
                    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || (target.isContentEditable && target.closest(".ProseMirror")))) {
                      return;
                    }
                    if (editor && !isStrictReadingMode) {
                      const electronAPI = (window as any)?.electronAPI;
                      if (electronAPI?.readClipboardImageSync) {
                        try {
                          const clip = electronAPI.readClipboardImageSync();
                          if (clip?.hasImage && clip.dataUrl) {
                            e.preventDefault();
                            void (processAndInsertImageFileRef.current || processAndInsertImageFile)({
                              dataUrl: clip.dataUrl,
                              fileName: clip.fileName,
                            });
                            return;
                          }
                        } catch { /* ignore */ }
                      }
                      if (e.clipboardData) {
                        const files = e.clipboardData.files;
                        if (files && files.length > 0) {
                          for (let i = 0; i < files.length; i++) {
                            const f = files[i];
                            if (f && (f.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.name))) {
                              e.preventDefault();
                              void (processAndInsertImageFileRef.current || processAndInsertImageFile)(f);
                              return;
                            }
                          }
                        }
                      }
                    }
                  }}
                  className={`flex w-full min-w-0 flex-col ${
                  settings.editorWidth === "compact" ? "max-w-2xl" : settings.editorWidth === "full" ? "max-w-none" : "max-w-4xl"
                } px-4 pt-6 pb-0 sm:px-6 sm:pt-8 md:px-8 md:pt-10 lg:px-12 lg:pt-12 mx-auto min-h-full ${
                  settings.showCodeLineNumbers ? "show-code-line-numbers" : ""
                }`}>
                  {isMarkdownNote(note) && note.tags && note.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={tag}
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${getTagColorClass(tag, settings.theme, idx, settings.tagColorStyle)}`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {editor && !isStrictReadingMode && <TableInteractiveOverlay editor={editor} />}
                  <EditorContent
                    editor={editor}
                    className={`w-full min-w-0 max-w-full ${isStrictReadingMode ? "cursor-default" : "cursor-text"}`}
                    onClickCapture={(e) => {
                      const target = (e.target as HTMLElement).closest("a");
                      if (!target) return;
                      const href = target.getAttribute("href") || "";
                      const dataWiki = target.getAttribute("data-wikilink");
                      const wikilinkTarget = dataWiki || (href.startsWith("wikilink:") ? decodeURIComponent(href.replace(/^wikilink:/, "")) : null);
                      if (wikilinkTarget) {
                        e.preventDefault();
                        e.stopPropagation();
                        const cleanTarget = wikilinkTarget.trim().toLowerCase();
                        const baseClean = cleanTarget.replace(/\.[^/.]+$/, "");
                        const currentNotes = (notes || []);
                        const matchedNote = currentNotes.find((n) => {
                          const nameWithoutExt = (n.fileName || n.title || "").replace(/\.[^/.]+$/, "").toLowerCase();
                          const fullFileName = (n.fileName || "").toLowerCase();
                          const title = (n.title || "").toLowerCase();
                          return (
                            nameWithoutExt === baseClean ||
                            fullFileName === cleanTarget ||
                            title === cleanTarget ||
                            (n.folderPath && `${n.folderPath.toLowerCase()}/${nameWithoutExt}` === baseClean)
                          );
                        });
                        if (matchedNote) {
                          onSelectNote?.(matchedNote.id);
                        } else {
                          toast({
                            title: t("editor.noteNotFound"),
                            description: `[[${wikilinkTarget}]]`,
                          });
                        }
                      } else if (href && href.startsWith("#")) {
                        e.preventDefault();
                        e.stopPropagation();
                        const targetId = href.slice(1);
                        const rootEl = (e.currentTarget as HTMLElement).closest(".luno-editor-container") || document;
                        const targetEl = rootEl.querySelector(`[id="${targetId}"]`) || document.getElementById(targetId);
                        if (targetEl) {
                          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                          targetEl.classList.add("bg-primary/20", "transition-colors", "duration-500", "rounded");
                          setTimeout(() => {
                            targetEl.classList.remove("bg-primary/20");
                          }, 1200);
                        }
                      } else if (href && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:"))) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (href.startsWith("http://") || href.startsWith("https://")) {
                          if (onOpenWebTab) {
                            onOpenWebTab(href);
                          } else if ((window as any).electronAPI?.openExternal) {
                            void (window as any).electronAPI.openExternal(href);
                          } else {
                            window.open(href, "_blank", "noopener,noreferrer");
                          }
                        } else if ((window as any).electronAPI?.openExternal) {
                          void (window as any).electronAPI.openExternal(href);
                        } else {
                          window.open(href, "_blank", "noopener,noreferrer");
                        }
                      } else if (target.tagName === "A" || target.closest("a")) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                  <div
                    data-editor-bottom-area="true"
                    onClick={() => {
                      if (editor && !isStrictReadingMode) {
                        editor.commands.focus("end");
                      }
                    }}
                    className={
                      isStrictReadingMode
                        ? "min-h-8 sm:min-h-12 w-full shrink-0 cursor-default"
                        : isReadingLivePreview
                        ? "min-h-8 sm:min-h-12 w-full shrink-0 cursor-text"
                        : "min-h-[40vh] sm:min-h-[50vh] w-full shrink-0 cursor-text"
                    }
                  />
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent className={editor && !editor.state.selection.empty ? "w-68 min-w-[17rem] rounded-xl" : "w-56 rounded-xl"}>
                {contextSpellData && (
                  <>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between border-b border-border/40 mb-1 gap-2">
                      <span>{t("settings.spellCheckSetting")}</span>
                      <span className="text-[10px] text-muted-foreground/60 italic font-mono truncate max-w-[9rem]">({contextSpellData.word})</span>
                    </div>
                    {contextSpellData.suggestions.length > 0 ? (
                      contextSpellData.suggestions.map((suggestion) => (
                        <ContextMenuItem
                          key={suggestion}
                          onClick={() => {
                            if (!editor) return;
                            editor
                              .chain()
                              .focus()
                              .setTextSelection({ from: contextSpellData.from, to: contextSpellData.to })
                              .insertContent(suggestion)
                              .run();
                            setContextSpellData(null);
                          }}
                          className="gap-2.5 font-medium text-primary focus:text-primary focus:bg-primary/10"
                        >
                          <Check className="h-4 w-4 shrink-0 text-primary stroke-[2.5]" />
                          <span>{suggestion}</span>
                        </ContextMenuItem>
                      ))
                    ) : (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground/70 italic select-none">
                        {t("editor.noSpellSuggestions")}
                      </div>
                    )}
                    <ContextMenuItem
                      onClick={() => {
                        if (!editor) return;
                        addCustomSpellWord(contextSpellData.word);
                        editor.view.dispatch(
                          editor.state.tr.setMeta(spellCheckPluginKey, { recompute: true })
                        );
                        setContextSpellData(null);
                      }}
                      className="gap-2.5 text-xs text-muted-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("editor.addToDictionary")}</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                  </>
                )}

                <ContextMenuItem
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="gap-2.5"
                >
                  <Undo2 className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t("editor.undo")}</span>
                  <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="gap-2.5"
                >
                  <Redo2 className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t("editor.redo")}</span>
                  <ContextMenuShortcut>Ctrl+Y</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                  onClick={() => {
                    if (!editor) return;
                    const { from, to, empty } = editor.state.selection;
                    if (!empty) {
                      const text = editor.state.doc.textBetween(from, to, "\n", "\n");
                      void navigator.clipboard.writeText(text);
                      editor.chain().focus().deleteSelection().run();
                    }
                  }}
                  disabled={!editor || editor.state.selection.empty}
                  className="gap-2.5"
                >
                  <Scissors className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t("editor.cut")}</span>
                  <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => {
                    if (!editor) return;
                    const { from, to, empty } = editor.state.selection;
                    if (!empty) {
                      const text = editor.state.doc.textBetween(from, to, "\n", "\n");
                      void navigator.clipboard.writeText(text);
                    }
                  }}
                  disabled={!editor || editor.state.selection.empty}
                  className="gap-2.5"
                >
                  <Copy className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t("editor.copy")}</span>
                  <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={async () => {
                    if (!editor) return;
                    try {
                      // 1. Check native Electron clipboard image first
                      const electronAPI = (window as any)?.electronAPI;
                      if (electronAPI?.readClipboardImageSync) {
                        const clipSync = electronAPI.readClipboardImageSync();
                        if (clipSync?.hasImage && clipSync.dataUrl) {
                          await processAndInsertImageFile({ dataUrl: clipSync.dataUrl, fileName: clipSync.fileName });
                          return;
                        }
                      }
                      if (electronAPI?.readClipboardImage) {
                        const clipImg = await electronAPI.readClipboardImage();
                        if (clipImg?.hasImage && clipImg.dataUrl) {
                          await processAndInsertImageFile({ dataUrl: clipImg.dataUrl, fileName: clipImg.fileName });
                          return;
                        }
                      }

                      // 2. Check web clipboard API for image items
                      if (navigator.clipboard?.read) {
                        try {
                          const items = await navigator.clipboard.read();
                          for (const item of items) {
                            const imgType = item.types.find((t) => t.startsWith("image/"));
                            if (imgType) {
                              const blob = await item.getType(imgType);
                              const file = new File([blob], "image.png", { type: imgType });
                              await processAndInsertImageFile(file);
                              return;
                            }
                          }
                        } catch {
                          // clipboard read permission or unsupported
                        }
                      }

                      // 3. Fallback to text
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        editor.chain().focus().insertContent(text).run();
                      }
                    } catch {
                      // clipboard fallback
                    }
                  }}
                  className="gap-2.5"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t("editor.paste")}</span>
                  <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                  onClick={() => editor?.chain().focus().selectAll().run()}
                  className="gap-2.5"
                >
                  <FileText className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t("editor.selectAll")}</span>
                  <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
                </ContextMenuItem>

                {editor && !editor.state.selection.empty && (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => {
                        if (!editor) return;
                        editor
                          .chain()
                          .focus()
                          .unsetAllMarks()
                          .unsetColor()
                          .unsetFontFamily()
                          .unsetFontSize()
                          .clearNodes()
                          .run();
                      }}
                      className="gap-2.5"
                    >
                      <Eraser className="h-4 w-4" />
                      <span className="whitespace-nowrap">{t("editor.clearFormatting")}</span>
                      <ContextMenuShortcut>Ctrl+Shift+N</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={openTranslatorWithSelection}
                      className="gap-2.5"
                    >
                      <Languages className="h-4 w-4" />
                      <span className="whitespace-nowrap">{t("editor.translateSelection")}</span>
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={handleFixLanguage}
                      className="gap-2.5"
                    >
                      <Wrench className="h-4 w-4" />
                      <span className="whitespace-nowrap">{t("editor.fixLanguage")}</span>
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
          )}
        </div>
        </div>

        {/* Editor Status Bar */}
        {note && (
          <div className="flex h-7 w-full min-w-0 shrink-0 items-center justify-between border-t border-border/60 bg-card/60 dark:bg-card/40 px-3 text-[11px] text-muted-foreground select-none overflow-hidden">
            {isImageFile(note) ? (
              <>
                {/* Left side: Dimensions | File Size | Format */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                        {imageDimensions ? `${imageDimensions.width} × ${imageDimensions.height} px` : "— px"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.imageDimensions")}: {imageDimensions ? `${imageDimensions.width} × ${imageDimensions.height} px` : "—"}
                    </TooltipContent>
                  </Tooltip>

                  <div className="h-3 w-[1px] bg-border/60" />

                  {activeFileSize != null && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default hover:text-foreground transition-colors">
                            {formatFileSize(activeFileSize)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.fileSize")}: {formatFileSize(activeFileSize)}
                        </TooltipContent>
                      </Tooltip>

                      <div className="h-3 w-[1px] bg-border/60" />
                    </>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                        {getFileFormatLabel(note)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.imageFormat")}: {getFileFormatLabel(note)}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Right side: Zoom Out | % / Fit | Zoom In | Open in App */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Zoom out button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleZoomOutImage}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                        <span className="sr-only">{t("editor.zoomOut")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.zoomOut")}
                    </TooltipContent>
                  </Tooltip>

                  {/* Zoom Level / Fit Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleToggleZoomFit}
                        className="tabular-nums font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60"
                      >
                        {imageZoomMode === "fit" ? (t("editor.fitToWindow")) : `${imageCustomZoom}%`}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {imageZoomMode === "fit" ? (t("editor.actualSize")) : (t("editor.fitToWindow"))}
                    </TooltipContent>
                  </Tooltip>

                  {/* Zoom in button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleZoomInImage}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                        <span className="sr-only">{t("editor.zoomIn")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.zoomIn")}
                    </TooltipContent>
                  </Tooltip>

                  <div className="h-3 w-[1px] bg-border/60" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => void handleOpenInSystemApp()}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{t("editor.openInDefaultApp")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.openInDefaultApp")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : isVideoFile(note) ? (
              <>
                {/* Left side: Dimensions | Duration | File Size | Format */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {videoDimensions && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                            {`${videoDimensions.width} × ${videoDimensions.height} px`}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.videoDimensions")}: {`${videoDimensions.width} × ${videoDimensions.height} px`}
                        </TooltipContent>
                      </Tooltip>
                      <div className="h-3 w-[1px] bg-border/60" />
                    </>
                  )}

                  {videoDuration != null && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default hover:text-foreground transition-colors">
                            {formatVideoDuration(videoDuration)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.videoDuration")}: {formatVideoDuration(videoDuration)}
                        </TooltipContent>
                      </Tooltip>
                      <div className="h-3 w-[1px] bg-border/60" />
                    </>
                  )}

                  {activeFileSize != null && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default hover:text-foreground transition-colors">
                            {formatFileSize(activeFileSize)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.fileSize")}: {formatFileSize(activeFileSize)}
                        </TooltipContent>
                      </Tooltip>
                      <div className="h-3 w-[1px] bg-border/60" />
                    </>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                        {getFileFormatLabel(note)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.videoFormat")}: {getFileFormatLabel(note)}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Right side: Open in App */}
                <div className="flex items-center gap-2 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => void handleOpenInSystemApp()}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{t("editor.openInDefaultApp")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.openInDefaultApp")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : isPdfFile(note) ? (
              <>
                {/* Left side: Prev / Page X / Y Jump / Next | File Size | PDF Document */}
                <div className="flex items-center gap-2 shrink-0">
                  {pdfViewerState && pdfViewerState.totalPages > 0 && (
                    <>
                      <div className="flex items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled={pdfViewerState.currentPage <= 1}
                              onClick={() => pdfEditorRef.current?.sendCommand("prevPage")}
                              className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                              <span className="sr-only">
                                {t("editor.previousPage")}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {t("editor.previousPage")}
                          </TooltipContent>
                        </Tooltip>

                        <Popover
                          open={pdfPageJumpOpen}
                          onOpenChange={(open) => {
                            setPdfPageJumpOpen(open);
                            if (open) {
                              setPdfPageJumpValue(String(pdfViewerState.currentPage));
                            }
                          }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="tabular-nums text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60"
                                >
                                  {t("editor.page2", { v0: pdfViewerState.currentPage, v1: pdfViewerState.totalPages })}
                                </button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {t("editor.clickToJumpToPage")}
                            </TooltipContent>
                          </Tooltip>
                          <PopoverContent
                            side="top"
                            align="start"
                            sideOffset={6}
                            className="w-48 p-2 rounded-xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md"
                          >
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const target = parseInt(pdfPageJumpValue.trim(), 10);
                                if (!isNaN(target) && pdfViewerState.totalPages > 0) {
                                  const clamped = Math.max(
                                    1,
                                    Math.min(pdfViewerState.totalPages, target)
                                  );
                                  pdfEditorRef.current?.sendCommand("goToPage", { page: clamped });
                                  setPdfPageJumpOpen(false);
                                }
                              }}
                              className="flex items-center gap-1.5"
                            >
                              <Input
                                type="number"
                                min={1}
                                max={pdfViewerState.totalPages}
                                value={pdfPageJumpValue}
                                onChange={(e) => setPdfPageJumpValue(e.target.value)}
                                placeholder={`1-${pdfViewerState.totalPages}`}
                                className="h-7 rounded-lg text-xs tabular-nums border-border/70 bg-background px-2 focus-visible:ring-1 focus-visible:ring-primary"
                                autoFocus
                              />
                              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                                / {pdfViewerState.totalPages}
                              </span>
                              <Button
                                type="submit"
                                size="sm"
                                className="h-7 px-2.5 rounded-lg text-xs shrink-0"
                              >
                                {t("editor.go")}
                              </Button>
                            </form>
                          </PopoverContent>
                        </Popover>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled={pdfViewerState.currentPage >= pdfViewerState.totalPages}
                              onClick={() => pdfEditorRef.current?.sendCommand("nextPage")}
                              className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                              <span className="sr-only">
                                {t("editor.nextPage")}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {t("editor.nextPage")}
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="h-3 w-[1px] bg-border/60" />
                    </>
                  )}

                  {activeFileSize != null && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default hover:text-foreground transition-colors">
                            {formatFileSize(activeFileSize)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.fileSize")}: {formatFileSize(activeFileSize)}
                        </TooltipContent>
                      </Tooltip>

                      <div className="h-3 w-[1px] bg-border/60" />
                    </>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                        {getFileFormatLabel(note)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.imageFormat")}: {getFileFormatLabel(note)}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Right side: Zoom Out | % Presets & Fit Width | Zoom In | Open in App */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          const rawScale = pdfViewerState?.scale || 1.25;
                          const currentPct = Math.round((rawScale / 1.25) * 100);
                          const nextPct = Math.max(25, (Math.ceil(currentPct / 25) - 1) * 25);
                          const nextScale = (nextPct / 100) * 1.25;
                          setPdfViewerState((prev) =>
                            prev ? { ...prev, scale: nextScale } : prev
                          );
                          pdfEditorRef.current?.sendCommand("setZoomDirect", {
                            scale: nextScale,
                          });
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                      >
                        {(() => {
                          const ZoomOutIconComp = getToolbarIcon("zoomOut", settings.iconPack);
                          return <ZoomOutIconComp className="h-3.5 w-3.5" />;
                        })()}
                        <span className="sr-only">{t("editor.zoomOut")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.zoomOut")}
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="tabular-nums font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60 flex items-center gap-0.5"
                          >
                            <span>{`${Math.round(((pdfViewerState?.scale || 1.25) / 1.25) * 100)}%`}</span>
                            <ChevronDown className="h-2.5 w-2.5 opacity-60 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t("editor.zoomOptions")}
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      side="top"
                      align="center"
                      className="w-36 rounded-xl p-1.5 shadow-md"
                    >
                      <DropdownMenuItem
                        onClick={() => pdfEditorRef.current?.sendCommand("fitWidth")}
                        className="cursor-pointer py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between"
                      >
                        <span>{t("editor.fitToWidth")}</span>
                      </DropdownMenuItem>
                      <div className="my-1 h-px bg-border/60" />
                      {[50, 75, 100, 125, 150, 200].map((pct) => {
                        const currentPct = Math.round(
                          ((pdfViewerState?.scale || 1.25) / 1.25) * 100
                        );
                        const isPctActive = currentPct === pct;
                        return (
                          <DropdownMenuItem
                            key={pct}
                            onClick={() => {
                              const nextScale = (pct / 100) * 1.25;
                              setPdfViewerState((prev) =>
                                prev ? { ...prev, scale: nextScale } : prev
                              );
                              if (pct === 100) {
                                pdfEditorRef.current?.sendCommand("zoomReset");
                              } else {
                                pdfEditorRef.current?.sendCommand("setZoomDirect", {
                                  scale: nextScale,
                                });
                              }
                            }}
                            className={`cursor-pointer py-1 px-2.5 rounded-lg text-xs tabular-nums flex items-center justify-between ${
                              isPctActive
                                ? "bg-primary/15 text-primary font-semibold data-[highlighted]:bg-primary/[0.18] hover:bg-primary/[0.18]"
                                : ""
                            }`}
                          >
                            <span>{`${pct}%`}</span>
                            {isPctActive && (
                              <Check className="h-3.5 w-3.5 stroke-[2.5] text-primary shrink-0" />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          const rawScale = pdfViewerState?.scale || 1.25;
                          const currentPct = Math.round((rawScale / 1.25) * 100);
                          const nextPct = Math.min(500, (Math.floor(currentPct / 25) + 1) * 25);
                          const nextScale = (nextPct / 100) * 1.25;
                          setPdfViewerState((prev) =>
                            prev ? { ...prev, scale: nextScale } : prev
                          );
                          pdfEditorRef.current?.sendCommand("setZoomDirect", {
                            scale: nextScale,
                          });
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                      >
                        {(() => {
                          const ZoomInIconComp = getToolbarIcon("zoomIn", settings.iconPack);
                          return <ZoomInIconComp className="h-3.5 w-3.5" />;
                        })()}
                        <span className="sr-only">{t("editor.zoomIn")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.zoomIn")}
                    </TooltipContent>
                  </Tooltip>

                  <div className="h-3 w-[1px] bg-border/60" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => void handleOpenInSystemApp()}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60"
                      >
                        {(() => {
                          const ExtIconComp = getToolbarIcon("externalLink", settings.iconPack);
                          return <ExtIconComp className="h-3 w-3" />;
                        })()}
                        <span>{t("editor.openInDefaultApp")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.openInDefaultApp")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : isBinaryFile(note) ? (
              <>
                {/* Left side: File Size | Format */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {activeFileSize != null && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default hover:text-foreground transition-colors">
                            {formatFileSize(activeFileSize)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("editor.fileSize")}: {formatFileSize(activeFileSize)}
                        </TooltipContent>
                      </Tooltip>

                      <div className="h-3 w-[1px] bg-border/60" />
                    </>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                        {getFileFormatLabel(note)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.imageFormat")}: {getFileFormatLabel(note)}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Right side: Open in App */}
                <div className="flex items-center gap-2 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => void handleOpenInSystemApp()}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{t("editor.openInDefaultApp")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.openInDefaultApp")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : (
              <>
                {/* Left side: Ln 1, Col 1 | (words | characters if not HTML/Code) | Format */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                        {t("editor.lineCol", { line: editorStats.line, col: editorStats.col })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.cursorPosition", { line: editorStats.line, col: editorStats.col })}
                    </TooltipContent>
                  </Tooltip>

                  {settings.showWordCount !== false && (
                    <>
                      {!(note?.contentFormat === "html" || note?.contentFormat === "css" || isHtmlFile(note) || isCssFile(note) || isJsFile(note) || isCodeFile(note)) && (
                        <>
                          <div className="h-3 w-[1px] bg-border/60" />

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default hover:text-foreground transition-colors">
                                {editorStats.wordCount === 1
                                  ? t("editor.wordCountSingle", { count: 1 })
                                  : t("editor.wordsCount", { count: editorStats.wordCount.toLocaleString() })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {t("rightPanel.wordCount")}
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}

                      <div className="h-3 w-[1px] bg-border/60" />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default hover:text-foreground transition-colors">
                            {editorStats.charCount === 1
                              ? t("editor.characterCountSingle", { count: 1 })
                              : t("editor.charactersCount", { count: editorStats.charCount.toLocaleString() })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t("rightPanel.characterCount")}
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  <div className="h-3 w-[1px] bg-border/60" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                        {getFileFormatLabel(note)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.syntaxMode", { syntax: getFileFormatLabel(note) })}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Right side: ZoomOut | 100% | ZoomIn | UTF-8 LF | (Spell if not HTML/Code) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Zoom out button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => updateSetting("editorFontSize", Math.max(13, (settings.editorFontSize || 15) - 1))}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                        <span className="sr-only">{t("editor.zoomOut")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.zoomOut")}
                    </TooltipContent>
                  </Tooltip>

                  {/* Clickable % to reset zoom to 100% */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => updateSetting("editorFontSize", 15)}
                        className="tabular-nums font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/60"
                      >
                        {`${editorStats.zoom}%`}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.zoomReset")}
                    </TooltipContent>
                  </Tooltip>

                  {/* Zoom in button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => updateSetting("editorFontSize", Math.min(22, (settings.editorFontSize || 15) + 1))}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                        <span className="sr-only">{t("editor.zoomIn")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.zoomIn")}
                    </TooltipContent>
                  </Tooltip>

                  <div className="h-3 w-[1px] bg-border/60" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground font-normal cursor-default hover:text-foreground transition-colors px-1">
                        UTF-8
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.encoding")}
                    </TooltipContent>
                  </Tooltip>

                  {/* Line Ending toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleToggleLineEnding}
                        className="hover:text-foreground text-muted-foreground transition-colors cursor-pointer font-normal rounded px-1 py-0.5 hover:bg-muted/60"
                      >
                        {lineEnding}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("editor.lineEndingToggle", { lineEnding })}
                    </TooltipContent>
                  </Tooltip>

                  <div className="h-3 w-[1px] bg-border/60" />

                  {/* Keyboard Input Language Indicator: EN / ไทย (View-only indicator) */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1 rounded px-1 py-0.5 text-muted-foreground select-none font-normal leading-none cursor-default"
                      >
                        <span>
                          {t(keyboardLanguage === "th" ? "editor.keyboardLangTh" : "editor.keyboardLangEn")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">
                        {t("editor.keyboardStatus", { lang: t(keyboardLanguage === "th" ? "editor.keyboardLangTh" : "editor.keyboardLangEn") })}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t("editor.switchWinSpacebar")}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  {!(note?.contentFormat === "html" || note?.contentFormat === "css" || isHtmlFile(note) || isCssFile(note) || isJsFile(note) || isCodeFile(note)) && (
                    <>
                      <div className="h-3 w-[1px] bg-border/60" />

                      {/* Spellcheck toggle: status bar pill with tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => updateSetting("spellCheck", !spellCheckEnabled)}
                            className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <Check
                              className={`h-3 w-3 transition-colors ${
                                spellCheckEnabled
                                  ? "text-primary stroke-[2.5]"
                                  : "opacity-30 text-muted-foreground"
                              }`}
                            />
                            <span className={spellCheckEnabled ? "text-muted-foreground font-normal" : "text-muted-foreground/60 line-through"}>
                              {t("editor.spellCheck")}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-semibold">{t("settings.spellCheckSetting")}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {spellCheckEnabled ? t("editor.spellCheckDisable") : t("editor.spellCheckEnable")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        </div>
        {/* Docked Right Panel */}
        <AnimatePresence>
          {rightPanelOpen && (
            <RightPanel
              isOpen={rightPanelOpen}
              onClose={onCloseRightPanel || (() => {})}
              note={note}
              editor={editor}
              notes={notes}
              onSelectNote={onSelectNote}
              onUpdateNote={onUpdate}
              onFavorite={(id) => {
                const n = notes?.find((item) => item.id === id);
                if (n && onUpdate) onUpdate(id, { isFavorite: !n.isFavorite });
              }}
              onDuplicate={async (targetNote) => {
                const target = targetNote || note;
                if (!target) return;
                if (onDuplicateFile && target.fileName) {
                  await onDuplicateFile(target);
                  return;
                }
                if (onCreate) {
                  const baseName = target.fileName || "untitled.md";
                  const newName = baseName.includes(".")
                    ? baseName.replace(/(\.[^/.]+)$/, " copy$1")
                    : `${baseName} copy`;
                  onCreate(target.folderPath || "", {
                    fileName: newName,
                    initialContent: target.content,
                    contentFormat: target.contentFormat || "markdown",
                  });
                }
              }}
              onDelete={() => {
                if (settings.confirmBeforeDelete) {
                  setDeleteConfirmOpen(true);
                } else {
                  void handleDeleteNote();
                }
              }}
              onExportPdf={handleExportPdf}
              onExportWord={handleExportWord}
              isPdf={isPdfFile(note)}
              onExportFlattenedPdf={() => void pdfEditorRef.current?.exportFlattenedPdfAs()}
              onExportFormPdf={() => void pdfEditorRef.current?.exportFormPdfAs()}
              imageDimensions={imageDimensions}
              fileSize={activeFileSize ?? note?.fileSize}
            />
          )}

          {/* AI Assistant Right Panel */}
          {aiDiffState && (
            <AiAssistantPanel
              isOpen={Boolean(aiDiffState)}
              onClose={handleRejectDiff}
              diffState={aiDiffState}
              onAccept={handleAcceptDiff}
              onReject={handleRejectDiff}
              onInsertBelow={handleInsertBelowDiff}
            />
          )}

          {/* Version History Right Panel */}
          {versionHistoryOpen && note && (
            <VersionHistoryPanel
              isOpen={versionHistoryOpen}
              onClose={() => setVersionHistoryOpen(false)}
              note={note}
              currentWordCount={
                (isHtmlFile(note) || isCssFile(note) || isJsFile(note))
                  ? (note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0)
                  : editorStats.wordCount
              }
              currentCharCount={
                (isHtmlFile(note) || isCssFile(note) || isJsFile(note))
                  ? (note.content ? note.content.length : 0)
                  : editorStats.charCount
              }
              onManualSnapshot={handleManualVersionSnapshot}
              onRestoreVersion={(ver) => {
                handleRestoreVersionContent(ver);
              }}
              onCompareVersion={(ver) => {
                setComparingVersion({ ...ver, noteId: note.id });
              }}
            />
          )}
        </AnimatePresence>
      </div>





      <AlertDialog open={Boolean(alertMessage)} onOpenChange={(open) => !open && setAlertMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("editor.cannotOpenFile")}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{t("common.ok")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("editor.selectFileFormat")}</DialogTitle>
            <DialogDescription>{t("editor.selectFileFormatDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <button
              type="button"
              onClick={() => void handleExtensionSelected("txt")}
              className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-border bg-secondary p-5 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold">.txt</span>
              <span className="text-xs text-muted-foreground">Plain text</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExtensionSelected("md")}
              className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-border bg-secondary p-5 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <FileCode className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold">.md</span>
              <span className="text-xs text-muted-foreground">Markdown</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExtensionSelected("html")}
              className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-border bg-secondary p-5 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <FileCode className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold">.html</span>
              <span className="text-xs text-muted-foreground">HTML</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExtensionSelected("css")}
              className="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-border bg-secondary p-5 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <FileCode className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold">.css</span>
              <span className="text-xs text-muted-foreground">CSS</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Footnote Reference Input Popover (Anchored at insertion point, matching Relations search box style with NO dark background) */}
      {footnotePopoverState.open && footnotePopoverState.coords && (
        <div
          ref={footnotePopoverRef}
          style={{
            position: "fixed",
            top: Math.min(Math.max(12, footnotePopoverState.coords.top), window.innerHeight - 80),
            left: Math.min(Math.max(12, footnotePopoverState.coords.left), window.innerWidth - 300),
            zIndex: 60,
          }}
          className="w-64 sm:w-72 p-2 rounded-2xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md select-text animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 border border-border/60 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <FootnoteIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground pointer-events-none" />
            <input
              ref={footnoteInputRef}
              type="text"
              value={footnoteInputText}
              onChange={(e) => setFootnoteInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmFootnote();
                } else if (e.key === "Escape") {
                  setFootnotePopoverState({ open: false, coords: null });
                }
              }}
              placeholder={t("editor.footnotePlaceholder")}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-normal"
              autoFocus
            />
            {footnoteInputText && (
              <button
                type="button"
                onClick={() => setFootnoteInputText("")}
                className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleConfirmFootnote}
                  className={`h-6 w-6 rounded-full flex items-center justify-center transition-all cursor-pointer text-[10px] font-medium shrink-0 ${
                    footnoteInputText.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CornerDownLeft className="h-3.5 w-3.5" />
                  <span className="sr-only">{t("editor.pressEnterToInsert")}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t("editor.pressEnterToInsert")}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("editor.link")}</DialogTitle>
            <DialogDescription>{t("editor.linkDescription")}</DialogDescription>
          </DialogHeader>

          {/* Segmented Pill Toggle Switcher */}
          <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-semibold select-none border border-border/40">
            <button
              type="button"
              onClick={() => setLinkTab("workspace")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                linkTab === "workspace"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{t("editor.workspaceNote")}</span>
            </button>
            <button
              type="button"
              onClick={() => setLinkTab("external")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                linkTab === "external"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{t("editor.externalLink")}</span>
            </button>
          </div>

          {linkTab === "workspace" ? (
            <div className="space-y-3 py-1 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <label className="block text-xs font-medium text-muted-foreground">
                  {t("editor.searchNotes")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={workspaceSearchQuery}
                    onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyLink();
                      }
                    }}
                    placeholder={t("editor.searchNotes")}
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Note List Selector */}
              <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl border border-border/60 bg-muted/30 p-1.5 min-w-0">
                {filteredWorkspaceNotes.length > 0 ? (
                  filteredWorkspaceNotes.map((n) => {
                    const isSelected = selectedWorkspaceNote?.id === n.id;
                    const title = (n.fileName || n.title || "Untitled").replace(/\.[^/.]+$/, "");
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setSelectedWorkspaceNote(n);
                          if (!linkDisplayText) {
                            setLinkDisplayText(title);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer min-w-0 ${
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold border border-primary/30"
                            : "hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          {settings?.showFileIcons !== false && (() => {
                            const relPath = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName) : "";
                            const customIcon = n.icon || (relPath && settings?.fileIcons?.[relPath]?.icon);
                            const customColor = n.iconColor || (relPath && settings?.fileIcons?.[relPath]?.color);
                            const cls = "h-3.5 w-3.5 shrink-0";
                            if (customIcon) {
                              const custom = renderCustomIcon(customIcon, cls, { color: customColor });
                              if (custom) return <span className="inline-flex items-center justify-center shrink-0">{custom}</span>;
                            }
                            if (n.isLocked) {
                              const LockIcon = getToolbarIcon("lock", settings?.iconPack);
                              return <LockIcon className={`${cls} opacity-70`} />;
                            }
                            const defaultKey = getNoteDefaultIconKey(n);
                            const IconComp = getToolbarIcon(defaultKey, settings?.iconPack);
                            return <IconComp className={`${cls} opacity-70`} />;
                          })()}
                          <span className="text-xs truncate min-w-0">{title}</span>
                          {n.folderPath && (
                            <span className="text-[10px] text-muted-foreground/70 truncate shrink-0">
                              ({n.folderPath})
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    {t("editor.noNotesFound")}
                  </div>
                )}
              </div>

              {/* Optional Display Text */}
              <div className="space-y-1.5 min-w-0">
                <label className="block text-xs font-medium text-muted-foreground">
                  {t("editor.linkDisplayText")}
                </label>
                <input
                  type="text"
                  value={linkDisplayText}
                  onChange={(e) => setLinkDisplayText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyLink();
                    }
                  }}
                  placeholder={selectedWorkspaceNote ? (selectedWorkspaceNote.fileName || selectedWorkspaceNote.title || "").replace(/\.[^/.]+$/, "") : "Display text..."}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-1 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <label htmlFor="link-url" className="block text-xs font-medium text-muted-foreground">
                  {t("editor.linkUrl")}
                </label>
                <input
                  id="link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyLink();
                    }
                  }}
                  placeholder={t("editor.linkUrlPlaceholder")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1.5 min-w-0">
                <label className="block text-xs font-medium text-muted-foreground">
                  {t("editor.linkDisplayText")}
                </label>
                <input
                  type="text"
                  value={linkDisplayText}
                  onChange={(e) => setLinkDisplayText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyLink();
                    }
                  }}
                  placeholder="Display text..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between pt-1">
            <Button type="button" variant="outline" onClick={handleRemoveLink}>
              {t("editor.removeLink")}
            </Button>
            <Button type="button" onClick={handleApplyLink}>
              {t("editor.applyLink")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("editor.insertImageByUrl")}</DialogTitle>
            <DialogDescription>{t("editor.imageDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="image-url" className="block text-xs font-medium text-muted-foreground">
                {t("editor.imageUrl")}
              </label>
              <div className="flex gap-2">
                <input
                  id="image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyImageUrl();
                    }
                  }}
                  placeholder={t("editor.imageUrlPlaceholder")}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                />
                <Button type="button" onClick={handleApplyImageUrl} disabled={!imageUrl.trim()}>
                  {t("editor.insertImage")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WorkspaceImagePickerDialog
        isOpen={workspaceImageDialogOpen}
        onClose={() => setWorkspaceImageDialogOpen(false)}
        notes={notes}
        currentNote={note}
        rootDirHandle={rootDirHandle}
        assetBlobUrlMap={assetBlobUrlMap}
        onSelectImage={handleInsertWorkspaceImage}
      />

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("editor.insertVideoByUrl")}</DialogTitle>
            <DialogDescription>{t("editor.videoDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="video-url" className="block text-xs font-medium text-muted-foreground">
                {t("editor.videoUrl")}
              </label>
              <div className="flex gap-2">
                <input
                  id="video-url"
                  type="url"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyVideoUrl();
                    }
                  }}
                  placeholder={t("editor.videoUrlPlaceholder")}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                />
                <Button type="button" onClick={handleApplyVideoUrl} disabled={!videoUrl.trim()}>
                  {t("editor.insertVideo")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WorkspaceVideoPickerDialog
        {...({
          isOpen: workspaceVideoDialogOpen,
          onClose: () => setWorkspaceVideoDialogOpen(false),
          notes,
          currentNote: note,
          rootDirHandle,
          assetBlobUrlMap,
          onSelectVideo: handleInsertWorkspaceVideo,
        } as any)}
      />



      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sidebar.deleteFileAction")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("editor.moveSingleFileToTrashConfirm", { name: note?.fileName || note?.title || t("editor.untitled") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void handleDeleteNote();
              }}
            >
              {t("sidebar.deleteFileAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-lg p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              <span>{t("editor.shortcutsTitle")}</span>
            </DialogTitle>
            <DialogDescription>{t("editor.shortcutsDescription")}</DialogDescription>
          </DialogHeader>

          <div className="my-2 max-h-[60vh] overflow-y-auto space-y-2.5 pr-1 no-scrollbar text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutTabDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutTab")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutBoldDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutBold")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutItalicDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutItalic")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutStrikeDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutStrike")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutSuperscriptDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutSuperscript")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutSubscriptDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutSubscript")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutToggleDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutToggle")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutFixLangDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutFixLang")}</kbd>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("editor.shortcutSaveDesc")}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-semibold">{t("editor.shortcutSave")}</kbd>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => setShortcutsDialogOpen(false)}>
              {t("common.ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Slash Commands Menu */}
      {slashMenuState.open && slashMenuState.coords && (
        <div
          role="menu"
          data-slash-menu="true"
          className="fixed z-[60] w-56 rounded-xl border border-border/80 bg-popover p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95 flex flex-col max-h-72 overflow-hidden text-popover-foreground select-none"
          style={{
            top: `${Math.min(slashMenuState.coords.top + 6, window.innerHeight - 300)}px`,
            left: `${Math.min(slashMenuState.coords.left, window.innerWidth - 240)}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/40 shrink-0">
            {t("editor.slashMenuTitle")}
          </div>

          {canScrollUp && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("up")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollSlashMenu("up")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronUp className="h-4 w-4" />
            </div>
          )}

          <div
            ref={(el) => {
              slashMenuScrollRef.current = el;
            }}
            onScroll={checkSlashMenuScroll}
            className="overflow-y-auto no-scrollbar flex-1 py-1"
          >
            {slashMenuState.filteredItems.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-center text-muted-foreground">
                {t("editor.noCommandsFound")}
              </div>
            ) : (
              slashMenuState.filteredItems.map((item, idx) => {
                const isSelected = idx === slashMenuState.selectedIndex;
                const prevItem = slashMenuState.filteredItems[idx - 1];
                const showCategoryHeader = !slashMenuState.query && (idx === 0 || item.categoryKey !== prevItem?.categoryKey);

                return (
                  <Fragment key={item.id}>
                    {showCategoryHeader && item.categoryKey && (
                      <div className={`px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground/80 tracking-wider select-none ${idx > 0 ? "mt-1 border-t border-border/25" : ""}`}>
                        {t(item.categoryKey)}
                      </div>
                    )}
                    <div
                      role="menuitem"
                      tabIndex={0}
                      data-slash-item={idx}
                      data-selected={isSelected ? "true" : undefined}
                      onMouseEnter={() => {
                        setSlashMenuState((prev) => ({ ...prev, selectedIndex: idx }));
                        slashMenuStateRef.current.selectedIndex = idx;
                      }}
                      className={`flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-[13px] transition-colors select-none [&>span>svg]:h-4 [&>span>svg]:w-4 [&>span>svg]:shrink-0 [&>span>svg]:text-muted-foreground ${
                        isSelected
                          ? "bg-primary/15 text-primary font-medium [&>span>svg]:text-primary hover:bg-primary/[0.08] hover:text-primary hover:[&>span>svg]:text-primary hover:[&_svg]:text-primary"
                          : "text-foreground font-normal hover:bg-primary/[0.08] hover:text-primary hover:[&>span>svg]:text-primary hover:[&_svg]:text-primary"
                      }`}
                      onClick={() => {
                        if (editor) {
                          executeSlashCommand(editor, item);
                        }
                      }}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate flex-1">{t(item.titleKey)}</span>
                    </div>
                  </Fragment>
                );
              })
            )}
          </div>

          {canScrollDown && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("down")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollSlashMenu("down")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      )}

      {/* Share Dialog 1: Ask user if they want to sync workspace to Google Drive for sharing */}
      <AlertDialog open={shareSyncDialogOpen} onOpenChange={setShareSyncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <GoogleDriveIcon className="h-5 w-5 shrink-0" />
              <span>{t("shareDialog.syncRequiredTitle")}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("shareDialog.syncRequiredDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSharingLoading}
              onClick={() => setShareSyncDialogOpen(false)}
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSharingLoading}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmSyncAndShare();
              }}
              className="gap-1.5"
            >
              {isSharingLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("shareDialog.syncing")}</span>
                </>
              ) : (
                <>
                  <GoogleDriveIcon className="h-3.5 w-3.5" />
                  <span>{t("shareDialog.syncAndShareBtn")}</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog 2: Share link generated successfully */}
      <Dialog open={shareSuccessDialogOpen} onOpenChange={setShareSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <GoogleDriveIcon className="h-5 w-5 shrink-0" />
              <span>{t("shareDialog.shareLinkTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              {t("shareDialog.shareLinkDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 pt-2">
            <Input
              readOnly
              value={shareLink}
              className="font-mono text-xs select-all rounded-xl"
            />
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(shareLink);
                setCopiedShareLink(true);
                setTimeout(() => setCopiedShareLink(false), 3000);
              }}
              className="rounded-xl shrink-0 gap-1.5 text-xs cursor-pointer"
            >
              {copiedShareLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                  <span>{t("common.copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t("shareDialog.copyLink")}</span>
                </>
              )}
            </Button>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShareSuccessDialogOpen(false)}
              className="rounded-xl text-xs cursor-pointer"
            >
              {t("common.close")}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isRevokingShare}
                onClick={handleRevokeShare}
                className="rounded-xl text-xs cursor-pointer gap-1.5"
              >
                {isRevokingShare ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t("shareDialog.revoking")}</span>
                  </>
                ) : (
                  <>
                    <GlobeOff className="h-3.5 w-3.5" />
                    <span>{t("shareDialog.revokeShare")}</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (onOpenWebTab) {
                    onOpenWebTab(shareLink, "Google Drive");
                  } else {
                    window.open(shareLink, "_blank", "noopener,noreferrer");
                  }
                }}
                className="rounded-xl text-xs gap-1.5 cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{t("shareDialog.openDrive")}</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <QrCodeDialog
        open={qrCodeDialogOpen}
        onOpenChange={setQrCodeDialogOpen}
        onInsertQrCode={async (dataUrl, qrData) => {
          if (editor) {
            const { relPath, blobUrl } = await saveQrCodeAttachment(dataUrl, qrData?.text);
            editor
              .chain()
              .focus()
              .setImage({
                src: blobUrl || dataUrl,
                alt: "QR Code",
                width: 220,
                "data-relative-src": relPath,
                "data-qr-code": "true",
                "data-qr-text": qrData?.text || "",
                "data-qr-color": qrData?.color || "#000000",
                "data-qr-bg": qrData?.bgType || "white",
                "data-qr-level": qrData?.level || "M",
              } as any)
              .run();
          }
        }}
      />

      {/* Slash Emoji Picker Popover */}
      {slashEmojiState.open && slashEmojiState.coords && (
        <div
          ref={slashEmojiRef}
          style={{
            position: "fixed",
            top: Math.min(slashEmojiState.coords.top, window.innerHeight - 280),
            left: Math.min(Math.max(12, slashEmojiState.coords.left), window.innerWidth - 300),
            zIndex: 60,
          }}
          className="w-72 rounded-xl p-2.5 shadow-xl border border-border/80 bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95"
        >
          <div className="text-xs font-semibold text-muted-foreground mb-1.5 px-1">
            {t("editor.insertEmoji")}
          </div>
          <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto pr-1 select-none no-scrollbar">
            {EMOJI_LIST.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                className="h-8 w-8 text-lg rounded-lg hover:bg-primary/[0.08] focus:bg-primary/15 hover:text-primary focus:text-primary flex items-center justify-center transition-colors cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().insertContent(emoji).run();
                  }
                  setSlashEmojiState({ open: false, coords: null });
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Font File Input */}
      <input
        ref={fontFileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
        className="hidden"
        onChange={handleFontFileUpload}
      />

      {/* Rename Font Dialog */}
      <Dialog open={Boolean(fontToRename)} onOpenChange={(open) => !open && setFontToRename(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("settings.renameFont")}</DialogTitle>
            <DialogDescription>
              {fontToRename?.fileName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <label htmlFor="rename-font-name" className="mb-2 block text-sm font-medium text-foreground">
              {t("sidebar.fileNameLabel")}
            </label>
            <input
              id="rename-font-name"
              type="text"
              value={fontRenameValue}
              onChange={(e) => setFontRenameValue(e.target.value)}
              placeholder="Font name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleConfirmFontRename();
                }
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFontToRename(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={() => void handleConfirmFontRename()} disabled={!fontRenameValue.trim()}>
              {t("sidebar.renameAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Font Confirmation Dialog */}
      <AlertDialog open={Boolean(fontToDelete)} onOpenChange={(open) => !open && setFontToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.deleteFont")}</AlertDialogTitle>
            <AlertDialogDescription>
              {(t("settings.deleteFontConfirm")).replace("{name}", fontToDelete?.name || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFontToDelete(null)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmFontDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("settings.deleteFont")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </TooltipProvider>
    </>
  );
}

