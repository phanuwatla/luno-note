import HtmlCodeEditor from "@/components/HtmlCodeEditor";
import RightPanel from "@/components/RightPanel";
import VersionHistoryPanel from "@/components/VersionHistoryPanel";
import VersionHistorySplitDiffView from "@/components/VersionHistorySplitDiffView";
import { saveVersionSnapshot, type NoteVersionSnapshot } from "@/lib/versionHistoryStorage";
import { AnimatePresence } from "framer-motion";
import { Note, extractBaseTitleFromFileName, isSystemGeneratedUntitledName } from "@/hooks/useNotes";
import { getSpellingSuggestions, THAI_SPELL_CORRECTIONS, getThaiSpellRegex, getThaiAnomalyRegex, isWordMisspelled, IGNORED_SPELL_WORDS } from "@/lib/spellChecker";
import {
  Bold,
  Check,
  CheckCircle2,
  Circle,
  Code,
  CodeXml,
  SquareCode,
  Eye,
  Download,
  ExternalLink,
  File,
  FileCode,
  FileText,
  FileImage,
  FolderArchive,
  Images,
  ImagePlus,
  Mic,
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
  Plus,
  FolderPlus,
  Undo2,
  Redo2,
  Strikethrough,
  Quote,
  Smile,
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
  ArrowUp,
  ArrowDown,
  XCircle,
  Loader2,
  AlertTriangle,
  Save,
  Table as TableIcon,
  Copy,
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
  Lock,
  Unlock,
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
import FloatingCalculator from "@/components/FloatingCalculator";
import FloatingTranslator from "@/components/FloatingTranslator";
import FloatingClock from "@/components/FloatingClock";
import FloatingAudioRecorder from "@/components/FloatingAudioRecorder";
import AudioExtension from "@/components/editor/AudioExtension";
import { createPortal } from "react-dom";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { APP_THEMES, useAppSettings } from "@/hooks/useAppSettings";
import { getToolbarIcon, renderCustomIcon } from "@/lib/iconPacks";
import { SettingsBody } from "@/components/SettingsBody";
import { docxToHtml } from "@/lib/docxUtils";
import { parseFrontmatterAndTags, updateFrontmatterTags, updateFrontmatterIcon, updateFrontmatterFavorite, isMarkdownNote } from "@/lib/frontmatter";
import { uploadDriveAttachmentFile, getDriveFileShareLink, revokeDriveFileShare } from "@/lib/googleDriveApi";
import { getStoredTokenInfo, isGoogleDriveConnected, requestGoogleDriveAuth } from "@/lib/googleDriveAuth";
import { syncEngine } from "@/lib/googleDriveSync";
import { getTagColorClass } from "@/lib/tagColors";
import { runGeminiAction, type AiActionType } from "@/lib/geminiApi";
export type { AiActionType };
import { EditorContent, ReactNodeViewRenderer, useEditor, Editor as TiptapEditor } from "@tiptap/react";
import { Extension, mergeAttributes, Node as TiptapNode } from "@tiptap/core";
import { EditorState, TextSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { InputRule, inputRules } from "@tiptap/pm/inputrules";
import Image from "@tiptap/extension-image";
import ImageNodeView from "@/components/editor/ImageNodeView";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";
import StarterKit from "@tiptap/starter-kit";
import { createLowlight, common } from "lowlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import CodeBlockNodeView from "@/components/CodeBlockNodeView";

const lowlight = createLowlight(common);
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { marked } from "marked";
import { countWords, countCharacters } from "@/lib/wordCount";
import { formatDateForFileName } from "@/lib/dateTimeFormatter";
import { Underline, Highlight, Superscript, Subscript } from "@/lib/tiptapCustomMarks";

/** Preserves full ProseMirror undo/redo history and document state per note across tab switching */
export const noteEditorStateMap = new Map<string, EditorState>();

/** Set of note IDs that have been explicitly closed and should not be resurrected by transition saves */
export const closedNoteIds = new Set<string>();

/** Preserves scroll position (scrollTop) per note across tab switching while tab is open */
export const noteScrollPositionMap = new Map<string, number>();

export function getNoteScrollPosition(noteId: string): number {
  if (!noteId || closedNoteIds.has(noteId)) return 0;
  if (noteScrollPositionMap.has(noteId)) {
    return noteScrollPositionMap.get(noteId) ?? 0;
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
  noteScrollPositionMap.delete(noteId);
  try {
    sessionStorage.removeItem(`luno_scroll_${noteId}`);
  } catch {
    /* ignore */
  }
}

export const clearNoteEditorState = clearNoteEditorHistory;

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
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
        // In Edit Mode: rendered in-place without separate arrow icon, with clickable prefix
        processedLine = `<p id="fn-${fnId}" data-footnote-def="${fnId}" class="footnote-def text-sm text-muted-foreground my-1.5"><a href="#fnref-${fnId}" data-footnote-backref="${fnId}" class="footnote-backref text-primary font-medium mr-1 select-none no-underline hover:underline cursor-pointer">[^${fnId}]:</a> ${fnContent}</p>`;
        resultLines.push(processedLine);
        continue;
      }
    }

    // Handle empty or blank lines (Obsidian compatibility: every blank line becomes an editable empty paragraph)
    if (!line.trim() || /^\s*\|[\s|]*$/.test(line)) {
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
      // In Markdown, 1 blank line separates blocks. Extra blank lines (blankCount > 1) represent intentional empty paragraphs.
      for (let b = 0; b < blankCount; b++) {
        resultLines.push("<p></p>");
      }
      resultLines.push("");
      continue;
    }

    justStrippedFootnote = false;

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

    // Convert Wikilinks [[Target]] or [[Target|Alias]] outside code blocks into standard HTML links
    processedLine = processedLine.replace(/\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g, (_m, target, alias) => {
      const cleanTarget = (target || "").trim();
      const cleanAlias = (alias || "").trim() || cleanTarget;
      return `<a href="wikilink:${encodeURIComponent(cleanTarget)}" data-wikilink="${cleanTarget}" class="internal-wikilink text-primary underline underline-offset-4 cursor-pointer">${cleanAlias}</a>`;
    });

    // Convert ==highlight== outside code blocks into standard HTML mark tags
    processedLine = processedLine.replace(/==([^=\r\n]+)==/g, '<mark class="luno-highlight">$1</mark>');

    // Convert sized Markdown images ![alt|300](url) outside code blocks into HTML img tags with width
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
        return `<img src="${cleanSrc}" alt="${cleanAlt}" width="${width}" data-relative-src="${cleanSrc}" style="width: ${width}px; max-width: 100%;" />`;
      }
    );

    // Ensure spaces in standard Markdown images ![alt](url) are encoded as %20 so marked parses them properly
    processedLine = processedLine.replace(
      /!\[([^\]|\r\n]*)\]\(([^)\r\n]+)\)/g,
      (match, alt, src) => {
        const trimmed = (src || "").trim();
        const titleMatch = trimmed.match(/^(\S+.*?)(?:\s+(["'][^"']*["']))?$/);
        if (titleMatch) {
          let urlPart = titleMatch[1];
          const titlePart = titleMatch[2] ? ` ${titleMatch[2]}` : "";
          if (urlPart && !/^(https?:\/\/|data:|blob:)/i.test(urlPart)) {
            try {
              urlPart = encodeURI(decodeURI(urlPart));
            } catch {
              urlPart = urlPart.replace(/ /g, "%20");
            }
            return `![${alt}](${urlPart}${titlePart})`;
          }
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
  }

  // In Reading Mode: render collected footnotes at the bottom below divider with return arrow
  if (isReadingMode && footnoteDefs.size > 0) {
    const footnoteItems: string[] = [];
    footnoteDefs.forEach((fnContent, fnId) => {
      footnoteItems.push(
        `<li id="fn-${fnId}" class="footnote-item" data-footnote-id="${fnId}"><p><a id="fn-${fnId}" data-footnote-target="${fnId}" class="footnote-anchor select-none"></a>${fnContent} <a href="#fnref-${fnId}" id="fnback-${fnId}" data-footnote-backref="${fnId}" class="footnote-backref text-primary hover:underline cursor-pointer select-none ml-1">↩</a></p></li>`
      );
    });
    resultLines.push("");
    resultLines.push("<p></p>");
    resultLines.push('<hr class="footnotes-sep my-6 border-t border-border/60" />');
    resultLines.push("<p></p>");
    resultLines.push(`<section class="footnotes my-4" data-footnotes="true"><ol class="footnotes-list list-decimal pl-6 space-y-1 text-sm text-muted-foreground">${footnoteItems.join("")}</ol></section>`);
  }

  return resultLines.join("\n");
}

function createHashtagDecorations(doc: any, theme?: any, tagColorStyle?: any) {
  const decorations: Decoration[] = [];
  const tagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n])/g;

  doc.descendants((node: any, pos: number, parent: any) => {
    if (node.isText) {
      if (parent && (parent.type.name === "codeBlock" || parent.type.name === "code")) {
        return;
      }
      if (node.marks && node.marks.some((m: any) => m.type.name === "code")) {
        return;
      }

      const text = node.text || "";
      let match: RegExpExecArray | null;
      tagRegex.lastIndex = 0;

      while ((match = tagRegex.exec(text)) !== null) {
        const rawTag = match[1];
        if (/^\d+$/.test(rawTag)) continue;

        const hashIndex = match[0].indexOf("#");
        const startPos = pos + match.index + hashIndex;
        const endPos = startPos + 1 + rawTag.length;

        const colorClass = getTagColorClass(rawTag, theme, undefined, tagColorStyle);

        decorations.push(
          Decoration.inline(startPos, endPos, {
            class: `inline-tag-badge border ${colorClass}`,
          })
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

const hashtagPluginKey = new PluginKey("hashtagDecoration");

export const HashtagDecoration = Extension.create({
  name: "hashtagDecoration",

  addOptions() {
    return {
      theme: "emerald",
      tagColorStyle: "multicolor",
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      new Plugin({
        key: hashtagPluginKey,
        state: {
          init(_, { doc }) {
            return createHashtagDecorations(doc, options.theme, options.tagColorStyle);
          },
          apply(tr, oldState) {
            if (tr.getMeta(hashtagPluginKey)?.recompute) {
              return createHashtagDecorations(tr.doc, options.theme, options.tagColorStyle);
            }
            if (!tr.docChanged) return oldState;
            if (!oldState || tr.steps.length === 0) {
              return createHashtagDecorations(tr.doc, options.theme, options.tagColorStyle);
            }
            try {
              let set = oldState.map(tr.mapping, tr.doc);
              for (const step of tr.steps) {
                step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
                  const safeStart = Math.min(newStart, tr.doc.content.size);
                  const safeEnd = Math.min(newEnd, tr.doc.content.size);
                  const $from = tr.doc.resolve(safeStart);
                  const $to = tr.doc.resolve(safeEnd);
                  const start = $from.start();
                  const end = $to.end();
                  set = set.remove(set.find(start, end));
                  const newDecos: Decoration[] = [];
                  const parentNode = $from.parent;
                  const tagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n])/g;
                  parentNode.descendants((child: any, childPos: number, parent: any) => {
                    if (child.isText) {
                      if (parent && (parent.type.name === "codeBlock" || parent.type.name === "code")) return;
                      if (child.marks && child.marks.some((m: any) => m.type.name === "code")) return;
                      const text = child.text || "";
                      let match: RegExpExecArray | null;
                      tagRegex.lastIndex = 0;
                      const absPos = start + childPos;
                      while ((match = tagRegex.exec(text)) !== null) {
                        const rawTag = match[1];
                        if (/^\d+$/.test(rawTag)) continue;
                        const hashIndex = match[0].indexOf("#");
                        const startPos = absPos + match.index + hashIndex;
                        const endPos = startPos + 1 + rawTag.length;
                        const colorClass = getTagColorClass(rawTag, options.theme, undefined, options.tagColorStyle);
                        newDecos.push(
                          Decoration.inline(startPos, endPos, {
                            class: `inline-tag-badge border ${colorClass}`,
                          })
                        );
                      }
                    }
                  });
                  if (newDecos.length > 0) {
                    set = set.add(tr.doc, newDecos);
                  }
                });
              }
              return set;
            } catch {
              return createHashtagDecorations(tr.doc, options.theme, options.tagColorStyle);
            }
          },
        },
        props: {
          decorations(state) {
            return hashtagPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

const spellCheckPluginKey = new PluginKey("spellCheckDecoration");
const LATIN_SPELL_REGEX = /[A-Za-z']+/g;
const THAI_CHAR_TEST = /[\u0E00-\u0E7F]/;

function createSpellCheckDecorations(doc: any, enabled: boolean): DecorationSet {
  if (!enabled) return DecorationSet.empty;
  const decorations: Decoration[] = [];
  const thaiSpellRegex = getThaiSpellRegex();
  const thaiAnomalyRegex = getThaiAnomalyRegex();
  const latinSpellRegex = /[A-Za-z']+/g;

  doc.descendants((node: any, pos: number) => {
    if (
      node.type.name === "codeBlock" ||
      node.type.name === "codeBlockLowlight" ||
      node.type.name === "mathBlock" ||
      node.type.name === "image"
    ) {
      return false;
    }

    if (node.isText && node.text) {
      const text = node.text;

      // 1. Thai Misspellings & Typographical Anomalies check
      if (THAI_CHAR_TEST.test(text)) {
        thaiSpellRegex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = thaiSpellRegex.exec(text)) !== null) {
          const misspelled = match[0];
          const from = pos + match.index;
          const to = from + misspelled.length;
          decorations.push(
            Decoration.inline(from, to, {
              class: "luno-spell-error",
              "data-spell-word": misspelled,
            })
          );
        }

        thaiAnomalyRegex.lastIndex = 0;
        while ((match = thaiAnomalyRegex.exec(text)) !== null) {
          const anomaly = match[0];
          const from = pos + match.index;
          const to = from + anomaly.length;
          decorations.push(
            Decoration.inline(from, to, {
              class: "luno-spell-error",
              "data-spell-word": anomaly,
            })
          );
        }
      }

      // 2. English words check
      latinSpellRegex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = latinSpellRegex.exec(text)) !== null) {
        const word = match[0];
        if (word.length >= 2 && !IGNORED_SPELL_WORDS.has(word.toLowerCase())) {
          if (isWordMisspelled(word)) {
            const from = pos + match.index;
            const to = from + word.length;
            decorations.push(
              Decoration.inline(from, to, {
                class: "luno-spell-error",
                "data-spell-word": word,
              })
            );
          }
        }
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const SpellCheckDecoration = Extension.create({
  name: "spellCheckDecoration",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    return [
      new Plugin({
        key: spellCheckPluginKey,
        state: {
          init(_, { doc }) {
            return createSpellCheckDecorations(doc, extension.options.enabled);
          },
          apply(tr, oldState) {
            if (!extension.options.enabled) return DecorationSet.empty;
            if (!tr.docChanged) return oldState;
            return createSpellCheckDecorations(tr.doc, extension.options.enabled);
          },
        },
        props: {
          decorations(state) {
            return spellCheckPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

function parseLowlightAst(
  nodes: any[],
  currentPos: number,
  decorations: Decoration[],
  parentClasses: string[] = []
): number {
  let pos = currentPos;
  for (const node of nodes) {
    if (node.type === "text") {
      const text = node.value || "";
      const textLen = text.length;
      if (textLen > 0 && parentClasses.length > 0) {
        decorations.push(
          Decoration.inline(pos, pos + textLen, {
            class: parentClasses.join(" "),
          })
        );
      }
      pos += textLen;
    } else if (node.type === "element") {
      const nodeClasses = Array.isArray(node.properties?.className)
        ? node.properties.className
        : [];
      const merged = [...parentClasses, ...nodeClasses];
      pos = parseLowlightAst(node.children || [], pos, decorations, merged);
    }
  }
  return pos;
}

function createInlineCodeDecorations(doc: any) {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number, parent: any) => {
    if (node.isText) {
      if (parent && (parent.type.name === "codeBlock" || parent.type.name === "code")) {
        return;
      }
      const hasCodeMark = node.marks && node.marks.some((m: any) => m.type.name === "code");
      if (!hasCodeMark) return;

      const text = node.text || "";
      if (!text.trim()) return;

      try {
        const result = lowlight.highlightAuto(text);
        if (result && result.children && result.children.length > 0) {
          parseLowlightAst(result.children, pos, decorations, []);
        }
      } catch {
        // Fallback gracefully
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

const inlineCodeHighlightPluginKey = new PluginKey("inlineCodeHighlight");

export interface InlineCodeHighlightOptions {
  enabled: boolean;
}

export const InlineCodeHighlight = Extension.create<InlineCodeHighlightOptions>({
  name: "inlineCodeHighlight",

  addOptions() {
    return {
      enabled: false,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    return [
      new Plugin({
        key: inlineCodeHighlightPluginKey,
        state: {
          init(_, { doc }) {
            return extension.options.enabled ? createInlineCodeDecorations(doc) : DecorationSet.empty;
          },
          apply(tr, oldState) {
            if (!extension.options.enabled) return DecorationSet.empty;
            return tr.docChanged ? createInlineCodeDecorations(tr.doc) : oldState;
          },
        },
        props: {
          decorations(state) {
            return inlineCodeHighlightPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

export interface SmartTypographyOptions {
  enabled: boolean;
}

function makeSmartRule(
  match: RegExp,
  replacement: string,
  isEnabled: () => boolean
): InputRule {
  return new InputRule(
    match,
    (state, matchArr, start, end) => {
      if (!isEnabled()) return null;
      let insert = replacement;
      if (matchArr[1]) {
        const offset = matchArr[0].lastIndexOf(matchArr[1]);
        insert += matchArr[0].slice(offset + matchArr[1].length);
        start += offset;
        const cutOff = start - end;
        if (cutOff > 0) {
          insert = matchArr[0].slice(offset - cutOff, offset) + insert;
          start = end;
        }
      }
      return state.tr.insertText(insert, start, end);
    },
    { inCodeMark: false, inCode: false }
  );
}

function buildSmartTypographyRules(isEnabled: () => boolean): InputRule[] {
  return [
    // 1. Em-dash: '---' or when adding third dash after en-dash '–-'
    makeSmartRule(/(?:^|[^\-])(---)$/, "—", isEnabled),
    makeSmartRule(/(–-)$/, "—", isEnabled),

    // 2. En-dash: '--'
    makeSmartRule(/(?:^|[^\-])(--)$/, "–", isEnabled),

    // 3. Ellipsis: '...' -> '…'
    makeSmartRule(/(\.\.\.)$/, "…", isEnabled),

    // 4. Smart Double Quotes:
    // Opening quote: after space, start of line, or open brackets/quotes
    makeSmartRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“", isEnabled),
    // Closing quote: after any non-whitespace
    makeSmartRule(/(")$/, "”", isEnabled),

    // 5. Smart Single Quotes & Apostrophe:
    // Opening single quote: after space, start of line, or open brackets/quotes
    makeSmartRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘", isEnabled),
    // Closing single quote / apostrophe: after any character
    makeSmartRule(/(')$/, "’", isEnabled),

    // 6. Arrows:
    makeSmartRule(/(?:^|\s)(->)$/, "→", isEnabled),
    makeSmartRule(/(?:^|\s)(<-)$/, "←", isEnabled),
    makeSmartRule(/(?:^|\s)(=>)$/, "⇒", isEnabled),

    // 7. Symbols:
    makeSmartRule(/(\(c\))$/i, "©", isEnabled),
    makeSmartRule(/(\(r\))$/i, "®", isEnabled),
    makeSmartRule(/(\(tm\))$/i, "™", isEnabled),
    makeSmartRule(/(?:^|\s)(\+-)$/, "±", isEnabled),
    makeSmartRule(/(?:^|\s)(!=)$/, "≠", isEnabled),

    // 8. Fractions:
    makeSmartRule(/(?:^|\s)(1\/2)$/, "½", isEnabled),
    makeSmartRule(/(?:^|\s)(1\/4)$/, "¼", isEnabled),
    makeSmartRule(/(?:^|\s)(3\/4)$/, "¾", isEnabled),
  ];
}

export const SmartTypography = Extension.create<SmartTypographyOptions>({
  name: "smartTypography",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    const rules = buildSmartTypographyRules(() => Boolean(extension.options.enabled));
    return [inputRules({ rules })];
  },
});

import TurndownService from "turndown";
import ToggleNodeView from "@/components/ToggleNodeView";
import { WorkspaceImagePickerDialog } from "@/components/editor/WorkspaceImagePickerDialog";
import { LockedNoteViewer } from "@/components/LockedNoteViewer";
import { encryptNoteContent, isEncryptedNote } from "@/lib/noteCrypto";
import { canUseNativeFileSystem, getStoredFileHandle, removeStoredFileHandle, setStoredFileHandle, requestPermissionIfAvailable, isNoteDeleted, isRelativePathDeleted, type CreateNoteOptions, type OpenFolderPending } from "@/lib/fileHandles";
import { rewriteHtmlForPreview } from "@/lib/htmlPreview";
import { toast } from "@/hooks/use-toast";
import { compressImageFile } from "@/lib/imageCompressor";
import { saveImageToIndexedDb } from "@/lib/imageStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { PanelRightCloseIcon } from "./icons/PanelRightCloseIcon";
import { DeleteRowIcon } from "@/components/icons/DeleteRowIcon";
import { DeleteColumnIcon } from "@/components/icons/DeleteColumnIcon";
import { DeleteTableIcon } from "@/components/icons/DeleteTableIcon";

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

const EN_TO_TH_KEYMAP: Record<string, string> = {
  "`": "_",
  "1": "ๅ",
  "2": "/",
  "3": "-",
  "4": "ภ",
  "5": "ถ",
  "6": "ุ",
  "7": "ึ",
  "8": "ค",
  "9": "ต",
  "0": "จ",
  "-": "ข",
  "=": "ช",
  "q": "ๆ",
  "w": "ไ",
  "e": "ำ",
  "r": "พ",
  "t": "ะ",
  "y": "ั",
  "u": "ี",
  "i": "ร",
  "o": "น",
  "p": "ย",
  "[": "บ",
  "]": "ล",
  "\\": "ฃ",
  "a": "ฟ",
  "s": "ห",
  "d": "ก",
  "f": "ด",
  "g": "เ",
  "h": "้",
  "j": "่",
  "k": "า",
  "l": "ส",
  ";": "ว",
  "'": "ง",
  "z": "ผ",
  "x": "ป",
  "c": "แ",
  "v": "อ",
  "b": "ิ",
  "n": "ื",
  "m": "ท",
  ",": "ม",
  ".": "ใ",
  "/": "ฝ",
  "~": "%",
  "!": "+",
  "@": "\"",
  "#": "/",
  "$": ",",
  "%": "?",
  "^": "ู",
  "&": "_",
  "*": ".",
  "(": "(",
  ")": ")",
  "_": "-",
  "+": "ภ",
  "Q": "๐",
  "W": "\"",
  "E": "ฎ",
  "R": "ฑ",
  "T": "ธ",
  "Y": "ํ",
  "U": "๊",
  "I": "ณ",
  "O": "ฯ",
  "P": "ญ",
  "{": "ฐ",
  "}": ",",
  "|": "ฅ",
  "A": "ฤ",
  "S": "ฆ",
  "D": "ฏ",
  "F": "โ",
  "G": "ฌ",
  "H": "็",
  "J": "๋",
  "K": "ษ",
  "L": "ศ",
  ":": "ซ",
  "\"": ".",
  "Z": "(",
  "X": ")",
  "C": "ฉ",
  "V": "ฮ",
  "B": "ฺ",
  "N": "์",
  "M": "?",
  "<": "ฒ",
  ">": "ฬ",
  "?": "ฦ",
};

const TH_TO_EN_KEYMAP: Record<string, string> = Object.entries(EN_TO_TH_KEYMAP).reduce(
  (acc, [en, th]) => {
    if (!(th in acc)) {
      acc[th] = en;
    }
    return acc;
  },
  {} as Record<string, string>,
);

export function getToggleButtonMode(selection: { empty: boolean }): "wrap" | "insert" {
  return selection.empty ? "insert" : "wrap";
}

export function handleToggleClick(editor: TiptapEditor | null) {
  if (!editor) return;
  const { from, to, empty } = editor.state.selection;
  const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ", " ").trim();

  if (selectedText) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "toggle",
        attrs: { title: selectedText },
        content: [{ type: "paragraph" }],
      })
      .run();
  } else {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "toggle",
        attrs: { title: "" },
        content: [{ type: "paragraph" }],
      })
      .run();
  }
}

export const Toggle = TiptapNode.create({
  name: "toggle",
  group: "block",
  content: "block+",
  defining: true,
  draggable: false,
  addAttributes() {
    return {
      title: {
        default: "",
      },
      open: {
        default: false,
        parseHTML: (element) => Boolean((element as HTMLDetailsElement).open),
        renderHTML: (attributes) => (attributes.open ? { open: "" } : {}),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "details",
        getAttrs: (element) => {
          const summary = (element as HTMLElement).querySelector("summary");
          return {
            title: summary?.textContent?.trim() || "",
            open: Boolean((element as HTMLDetailsElement).open),
          };
        },
        contentElement: "div",
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const sanitizedAttributes = { ...HTMLAttributes };
    delete sanitizedAttributes.open;

    return [
      "details",
      node.attrs.open ? mergeAttributes(sanitizedAttributes, { open: "" }) : mergeAttributes(sanitizedAttributes),
      ["summary", node.attrs.title],
      ["div", 0],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ToggleNodeView);
  },
});

export type SlashMenuItem = {
  id: string;
  titleKey: string;
  categoryKey?: string;
  icon: React.ReactNode;
  keywords: string[];
  action: (
    editor: TiptapEditor,
    helpers: {
      openLinkDialog: () => void;
      openImageDialog: () => void;
      openWorkspaceImageDialog?: () => void;
      triggerImageUpload: () => void;
      openAudioRecorder: () => void;
      handleFixLanguage: () => void;
      openTranslator?: () => void;
      openCalculator?: () => void;
      openClock?: () => void;
      triggerAi?: (actionType?: AiActionType) => void;
    }
  ) => void;
};

export const slashMenuStateRef = {
  current: {
    open: false,
    query: "",
    slashRange: null as { from: number; to: number } | null,
    coords: null as { top: number; left: number } | null,
    selectedIndex: 0,
    filteredItems: [] as SlashMenuItem[],
    onSelect: null as ((item: SlashMenuItem) => void) | null,
    notify: null as (() => void) | null,
  },
};

export const slashMenuScrollRef = {
  current: null as HTMLDivElement | null,
};

const escHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const insertFootnoteAtSelection = (editor: any) => {
  if (!editor || editor.isDestroyed) return;

  const doc = editor.state.doc;
  const existingDefs: { id: string; content: string }[] = [];
  const existingNums: number[] = [];
  const rangesToDelete: { from: number; to: number }[] = [];

  try {
    // Collect all existing citation numbers across the whole document
    doc.descendants((node: any) => {
      if (node.isText && node.text) {
        const matches = Array.from(node.text.matchAll(/\[\^?(\d+)\]/g));
        for (const m of matches as RegExpMatchArray[]) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n)) existingNums.push(n);
        }
      }
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.attrs?.["data-footnote-ref"]) {
            const n = parseInt(mark.attrs["data-footnote-ref"], 10);
            if (!isNaN(n)) existingNums.push(n);
          }
          if (mark.attrs?.["data-footnote-backref"]) {
            const n = parseInt(mark.attrs["data-footnote-backref"], 10);
            if (!isNaN(n)) existingNums.push(n);
          }
        });
      }
    });

    // Scan top-level children to find definition paragraphs and their preceding blank line
    let prevChildBlankRange: { from: number; to: number } | null = null;
    let inDefGroup = false;

    doc.forEach((childNode: any, offset: number) => {
      const isDef =
        childNode.type?.name === "paragraph" &&
        (childNode.attrs?.["data-footnote-def"] ||
          (childNode.attrs?.["id"]?.startsWith("fn-") ? childNode.attrs["id"].replace(/^fn-/, "") : null) ||
          /^\s*\[\^[^\]]+\]:/.test(childNode.textContent || ""));

      const isEmpty =
        childNode.type?.name === "paragraph" &&
        !childNode.textContent?.trim() &&
        !isDef;

      if (isDef) {
        if (!inDefGroup && prevChildBlankRange) {
          rangesToDelete.push(prevChildBlankRange);
        }
        inDefGroup = true;

        let fnId = childNode.attrs?.["data-footnote-def"] || (childNode.attrs?.["id"]?.startsWith("fn-") ? childNode.attrs["id"].replace(/^fn-/, "") : null);
        let content = childNode.textContent || "";
        const match = content.match(/^\s*\[\^([^\]]+)\]:\s*(.*)$/);
        if (match) {
          fnId = fnId || match[1];
          content = match[2].trim();
        } else {
          content = content.replace(/^\s*\[\^[^\]]+\]:\s*/, "").trim();
        }

        if (fnId) {
          existingDefs.push({
            id: String(fnId),
            content,
          });
        }
        rangesToDelete.push({
          from: offset,
          to: offset + childNode.nodeSize,
        });
      } else {
        inDefGroup = false;
      }

      if (isEmpty) {
        prevChildBlankRange = {
          from: offset,
          to: offset + childNode.nodeSize,
        };
      } else {
        prevChildBlankRange = null;
      }
    });
  } catch {
    const docText = editor.getText();
    const matches = Array.from(docText.matchAll(/\[\^(\d+)\]/g));
    for (const m of matches as RegExpMatchArray[]) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n)) existingNums.push(n);
    }
  }

  let nextNum = 1;
  if (existingNums.length > 0) {
    nextNum = Math.max(...existingNums) + 1;
  }

  const tr = editor.state.tr;

  // 1. Delete all old definitions and their preceding blank line in reverse order
  rangesToDelete.sort((a, b) => b.from - a.from);
  for (const r of rangesToDelete) {
    if (r.from < tr.doc.content.size && r.to <= tr.doc.content.size) {
      tr.delete(r.from, r.to);
    }
  }

  // 2. Map current cursor position through deletions
  const mappedCursorPos = tr.mapping.map(editor.state.selection.from);

  // 3. Insert citation [nextNum] at mapped cursor position
  const citationSchema = editor.schema;
  const supMark = citationSchema.marks.superscript ? citationSchema.marks.superscript.create() : null;
  const linkMark = citationSchema.marks.link.create({
    href: `#fn-${nextNum}`,
    id: `fnref-${nextNum}`,
    "data-footnote-ref": String(nextNum),
    class: "footnote-ref text-primary hover:underline cursor-pointer select-none font-medium px-0.5",
  });
  const marks = supMark ? [linkMark, supMark] : [linkMark];
  const citationText = citationSchema.text(`[${nextNum}]`, marks);
  tr.insert(mappedCursorPos, citationText);

  // 4. Resolve the end of the top-level block containing the new citation
  const resolved = tr.doc.resolve(mappedCursorPos + citationText.nodeSize);
  const afterBlockPos = resolved.after(1);

  // 5. Construct the new definitions block
  const allDefs = [...existingDefs, { id: String(nextNum), content: "" }];
  const defNodes: any[] = [];
  defNodes.push(citationSchema.nodes.paragraph.create());

  for (const def of allDefs) {
    const backlink = citationSchema.marks.link.create({
      href: `#fnref-${def.id}`,
      "data-footnote-backref": def.id,
      class: "footnote-backref text-primary font-medium mr-1 select-none no-underline hover:underline cursor-pointer",
    });
    const prefix = citationSchema.text(`[^${def.id}]:`, [backlink]);
    const children = [prefix];
    if (def.content) {
      children.push(citationSchema.text(" " + def.content));
    } else {
      children.push(citationSchema.text(" "));
    }
    const para = citationSchema.nodes.paragraph.create(
      {
        id: `fn-${def.id}`,
        "data-footnote-def": def.id,
        class: "footnote-def text-sm text-muted-foreground my-1.5",
      },
      children
    );
    defNodes.push(para);
  }

  // 6. Insert new definitions block right after current block (or at document end)
  const insertPos = Math.min(afterBlockPos, tr.doc.content.size);
  tr.insert(insertPos, defNodes);

  // 7. Move selection inside the new definition line
  let targetPos = -1;
  tr.doc.descendants((node: any, pos: number) => {
    if (node.type?.name === "paragraph" && node.attrs?.["data-footnote-def"] === String(nextNum)) {
      targetPos = pos + node.nodeSize - 1;
      return false;
    }
  });

  if (targetPos >= 0) {
    tr.setSelection(editor.state.selection.constructor.near(tr.doc.resolve(targetPos)));
  }

  editor.view.dispatch(tr);
  editor.view.focus();
};

export const SLASH_ITEMS: SlashMenuItem[] = [
  // 1. History
  {
    id: "undo",
    titleKey: "editor.undo",
    categoryKey: "settings.toolCategoryHistory",
    icon: <Undo2 className="mr-2 h-4 w-4" />,
    keywords: ["undo", "history", "ย้อนกลับ", "เลิกทำ", "ยกเลิก"],
    action: (editor) => editor.chain().focus().undo().run(),
  },
  {
    id: "redo",
    titleKey: "editor.redo",
    categoryKey: "settings.toolCategoryHistory",
    icon: <Redo2 className="mr-2 h-4 w-4" />,
    keywords: ["redo", "history", "ทำซ้ำ", "ทำอีกครั้ง"],
    action: (editor) => editor.chain().focus().redo().run(),
  },

  // 2. Headings
  {
    id: "h1",
    titleKey: "editor.heading1",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading1Icon className="mr-2 h-4 w-4" />,
    keywords: ["h1", "heading1", "header1", "หัวข้อ1", "หัวข้อ 1", "หัวเรื่องใหญ่"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    titleKey: "editor.heading2",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading2Icon className="mr-2 h-4 w-4" />,
    keywords: ["h2", "heading2", "header2", "หัวข้อ2", "หัวข้อ 2", "หัวเรื่องกลาง"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    titleKey: "editor.heading3",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading3Icon className="mr-2 h-4 w-4" />,
    keywords: ["h3", "heading3", "header3", "หัวข้อ3", "หัวข้อ 3", "หัวเรื่องเล็ก"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "h4",
    titleKey: "editor.heading4",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading4Icon className="mr-2 h-4 w-4" />,
    keywords: ["h4", "heading4", "header4", "หัวข้อ4", "หัวข้อ 4"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    id: "h5",
    titleKey: "editor.heading5",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading5Icon className="mr-2 h-4 w-4" />,
    keywords: ["h5", "heading5", "header5", "หัวข้อ5", "หัวข้อ 5"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    id: "h6",
    titleKey: "editor.heading6",
    categoryKey: "settings.toolCategoryHeading",
    icon: <Heading6Icon className="mr-2 h-4 w-4" />,
    keywords: ["h6", "heading6", "header6", "หัวข้อ6", "หัวข้อ 6"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 6 }).run(),
  },

  // 3. Inline Formatting
  {
    id: "bold",
    titleKey: "editor.bold",
    categoryKey: "settings.toolCategoryInline",
    icon: <Bold className="mr-2 h-4 w-4" />,
    keywords: ["bold", "b", "ตัวหนา", "หนา"],
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    titleKey: "editor.italic",
    categoryKey: "settings.toolCategoryInline",
    icon: <Italic className="mr-2 h-4 w-4" />,
    keywords: ["italic", "i", "ตัวเอียง", "เอียง"],
    action: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "underline",
    titleKey: "editor.underline",
    categoryKey: "settings.toolCategoryInline",
    icon: <UnderlineIcon className="mr-2 h-4 w-4" />,
    keywords: ["underline", "u", "ขีดเส้นใต้", "เส้นใต้"],
    action: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    id: "strike",
    titleKey: "editor.strikethrough",
    categoryKey: "settings.toolCategoryInline",
    icon: <Strikethrough className="mr-2 h-4 w-4" />,
    keywords: ["strike", "strikethrough", "s", "ขีดฆ่า"],
    action: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: "highlight",
    titleKey: "editor.highlight",
    categoryKey: "settings.toolCategoryInline",
    icon: <Highlighter className="mr-2 h-4 w-4" />,
    keywords: ["highlight", "mark", "hl", "ไฮไลต์", "ไฮไลท์", "เน้นข้อความ", "ป้าย"],
    action: (editor) => editor.chain().focus().toggleHighlight().run(),
  },

  // 4. Lists
  {
    id: "bulletList",
    titleKey: "editor.bulletList",
    categoryKey: "settings.toolCategoryList",
    icon: <List className="mr-2 h-4 w-4" />,
    keywords: ["bullet", "list", "ul", "รายการ", "จุด"],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    titleKey: "editor.numberedList",
    categoryKey: "settings.toolCategoryList",
    icon: <ListOrdered className="mr-2 h-4 w-4" />,
    keywords: ["number", "ordered", "ol", "เลข", "ลำดับ"],
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "taskList",
    titleKey: "editor.checkbox",
    categoryKey: "settings.toolCategoryList",
    icon: <ListTodoIcon className="mr-2 h-4 w-4" />,
    keywords: ["todo", "task", "check", "checkbox", "กล่อง", "เช็ค", "ทาสก์"],
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },

  // 5. Blocks & Structure
  {
    id: "toggle",
    titleKey: "editor.toggle",
    categoryKey: "settings.toolCategoryBlock",
    icon: <ChevronsDownUp className="mr-2 h-4 w-4" />,
    keywords: ["toggle", "collapse", "details", "พับ", "ย่อย"],
    action: (editor) => handleToggleClick(editor),
  },
  {
    id: "code",
    titleKey: "editor.inlineCode",
    categoryKey: "settings.toolCategoryBlock",
    icon: <CodeXml className="mr-2 h-4 w-4" />,
    keywords: ["code", "inline", "โค้ด", "โค้ดในบรรทัด"],
    action: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: "codeBlock",
    titleKey: "editor.codeBlock",
    categoryKey: "settings.toolCategoryBlock",
    icon: <SquareCode className="mr-2 h-4 w-4" />,
    keywords: ["codeblock", "code", "block", "โค้ด", "บล็อกโค้ด"],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "blockquote",
    titleKey: "editor.blockquote",
    categoryKey: "settings.toolCategoryBlock",
    icon: <Quote className="mr-2 h-4 w-4" />,
    keywords: ["quote", "blockquote", "คำพูด", "อ้างอิง"],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "footnote",
    titleKey: "editor.footnote",
    categoryKey: "settings.toolCategoryBlock",
    icon: <FootnoteIcon className="mr-2 h-4 w-4" />,
    keywords: ["footnote", "note", "fn", "เชิงอรรถ", "อ้างอิงท้ายหน้า", "อ้างอิง", "reference"],
    action: (editor) => insertFootnoteAtSelection(editor),
  },
  {
    id: "horizontalRule",
    titleKey: "editor.horizontalRule",
    categoryKey: "settings.toolCategoryBlock",
    icon: <Minus className="mr-2 h-4 w-4" />,
    keywords: ["hr", "horizontal", "rule", "line", "divider", "เส้นแบ่ง", "เส้น", "คั่น"],
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "table",
    titleKey: "editor.insertTable",
    categoryKey: "settings.toolCategoryBlock",
    icon: <TableIcon className="mr-2 h-4 w-4" />,
    keywords: ["table", "grid", "ตาราง", "แถว", "คอลัมน์"],
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  // 6. Media & Tools
  {
    id: "link",
    titleKey: "editor.link",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Link2 className="mr-2 h-4 w-4" />,
    keywords: ["link", "url", "ลิงก์"],
    action: (_editor, helpers) => helpers.openLinkDialog(),
  },
  {
    id: "imageUrl",
    titleKey: "editor.insertImageByUrl",
    categoryKey: "settings.toolCategoryMedia",
    icon: <ImagePlus className="mr-2 h-4 w-4" />,
    keywords: ["image", "img", "photo", "pic", "รูป", "ภาพ", "url"],
    action: (_editor, helpers) => helpers.openImageDialog(),
  },
  {
    id: "imageWorkspace",
    titleKey: "editor.insertImageFromWorkspace",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Images className="mr-2 h-4 w-4" />,
    keywords: ["image", "workspace", "attachment", "attachments", "รูป", "ไฟล์แนบ", "คลังภาพ"],
    action: (_editor, helpers) => helpers.openWorkspaceImageDialog?.(),
  },
  {
    id: "imageUpload",
    titleKey: "editor.uploadImage",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Upload className="mr-2 h-4 w-4" />,
    keywords: ["upload", "file", "image", "img", "อัปโหลด", "อัพโหลด", "รูป", "ไฟล์"],
    action: (_editor, helpers) => helpers.triggerImageUpload(),
  },
  {
    id: "emoji",
    titleKey: "editor.insertEmoji",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Smile className="mr-2 h-4 w-4" />,
    keywords: ["emoji", "smile", "อิโมจิ", "ยิ้ม"],
    action: (editor) => editor.chain().focus().insertContent("😊").run(),
  },
  {
    id: "audio",
    titleKey: "editor.recordAudio",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Mic className="mr-2 h-4 w-4" />,
    keywords: ["audio", "record", "voice", "sound", "mic", "อัดเสียง", "เสียง", "บันทึกเสียง", "ไมค์"],
    action: (_editor, helpers) => helpers.openAudioRecorder(),
  },
  {
    id: "calculator",
    titleKey: "editor.calculator",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Calculator className="mr-2 h-4 w-4" />,
    keywords: ["calculator", "calc", "math", "เครื่องคิดเลข", "คำนวณ", "เลข"],
    action: (_editor, helpers) => helpers.openCalculator?.(),
  },
  {
    id: "translator",
    titleKey: "editor.translator",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Languages className="mr-2 h-4 w-4" />,
    keywords: ["translate", "translator", "language", "แปล", "แปลภาษา", "ดิกชันนารี", "ภาษา"],
    action: (_editor, helpers) => helpers.openTranslator?.(),
  },
  {
    id: "clock",
    titleKey: "editor.clock",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Clock className="mr-2 h-4 w-4" />,
    keywords: ["clock", "timer", "stopwatch", "time", "นาฬิกา", "จับเวลา", "เวลา"],
    action: (_editor, helpers) => helpers.openClock?.(),
  },
  {
    id: "fixLanguage",
    titleKey: "editor.fixLanguage",
    categoryKey: "settings.toolCategoryMedia",
    icon: <Wrench className="mr-2 h-4 w-4" />,
    keywords: ["fix", "lang", "language", "th", "en", "ซ่อม", "ภาษา", "แก้แป้นพิมพ์"],
    action: (_editor, helpers) => helpers.handleFixLanguage(),
  },

  // 7. AI Assistant
  {
    id: "aiImprove",
    titleKey: "settings.aiImprove",
    categoryKey: "settings.toolCategoryAi",
    icon: <WandSparklesIcon className="mr-2 h-4 w-4" />,
    keywords: ["ai", "improve", "เขียนดีขึ้น", "ปรับปรุง", "เกลา", "เอไอ"],
    action: (_editor, helpers) => helpers.triggerAi?.("improve"),
  },
  {
    id: "aiFixGrammar",
    titleKey: "settings.aiFixGrammar",
    categoryKey: "settings.toolCategoryAi",
    icon: <SpellCheckIcon className="mr-2 h-4 w-4" />,
    keywords: ["ai", "grammar", "spell", "ไวยากรณ์", "สะกด", "ตรวจคำผิด"],
    action: (_editor, helpers) => helpers.triggerAi?.("fix_grammar"),
  },
  {
    id: "aiMakeShorter",
    titleKey: "settings.aiMakeShorter",
    categoryKey: "settings.toolCategoryAi",
    icon: <Minimize2 className="mr-2 h-4 w-4" />,
    keywords: ["ai", "short", "shorter", "summarize", "ย่อ", "สั้นลง", "สรุป"],
    action: (_editor, helpers) => helpers.triggerAi?.("make_shorter"),
  },
  {
    id: "aiMakeLonger",
    titleKey: "settings.aiMakeLonger",
    categoryKey: "settings.toolCategoryAi",
    icon: <Maximize2 className="mr-2 h-4 w-4" />,
    keywords: ["ai", "long", "longer", "expand", "ขยาย", "ยาวขึ้น", "เพิ่มรายละเอียด"],
    action: (_editor, helpers) => helpers.triggerAi?.("make_longer"),
  },
  {
    id: "aiSimplify",
    titleKey: "settings.aiSimplify",
    categoryKey: "settings.toolCategoryAi",
    icon: <BookOpen className="mr-2 h-4 w-4" />,
    keywords: ["ai", "simplify", "เข้าใจง่าย", "ภาษาเรียบง่าย"],
    action: (_editor, helpers) => helpers.triggerAi?.("simplify"),
  },
  {
    id: "aiFormalize",
    titleKey: "settings.aiFormalize",
    categoryKey: "settings.toolCategoryAi",
    icon: <BriefcaseBusinessIcon className="mr-2 h-4 w-4" />,
    keywords: ["ai", "formal", "formalize", "ทางการ", "ภาษาทางการ"],
    action: (_editor, helpers) => helpers.triggerAi?.("formalize"),
  },
  {
    id: "aiMakeCasual",
    titleKey: "settings.aiMakeCasual",
    categoryKey: "settings.toolCategoryAi",
    icon: <MessageCircle className="mr-2 h-4 w-4" />,
    keywords: ["ai", "casual", "เป็นกันเอง", "ภาษาสนทนา"],
    action: (_editor, helpers) => helpers.triggerAi?.("make_casual"),
  },
  {
    id: "aiTranslate",
    titleKey: "settings.aiTranslate",
    categoryKey: "settings.toolCategoryAi",
    icon: <Languages className="mr-2 h-4 w-4" />,
    keywords: ["ai", "translate", "แปล", "แปลภาษา", "อังกฤษ", "ไทย"],
    action: (_editor, helpers) => helpers.triggerAi?.("translate"),
  },
  {
    id: "aiContinueWriting",
    titleKey: "settings.aiContinueWriting",
    categoryKey: "settings.toolCategoryAi",
    icon: <ArrowRight className="mr-2 h-4 w-4" />,
    keywords: ["ai", "continue", "write", "เขียนต่อ", "ต่อข้อความ"],
    action: (_editor, helpers) => helpers.triggerAi?.("continue_writing"),
  },
  {
    id: "aiRewrite",
    titleKey: "settings.aiRewrite",
    categoryKey: "settings.toolCategoryAi",
    icon: <PenLineIcon className="mr-2 h-4 w-4" />,
    keywords: ["ai", "rewrite", "เขียนใหม่", "เรียบเรียงใหม่", "สำนวนใหม่"],
    action: (_editor, helpers) => helpers.triggerAi?.("rewrite"),
  },
];

const IndentKeymap = Extension.create({
  name: "indentKeymap",
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
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
      Escape: () => {
        if (slashMenuStateRef.current.open) {
          slashMenuStateRef.current.open = false;
          slashMenuStateRef.current.notify?.();
          return true;
        }
        return false;
      },
    };
  },
});

export interface EditorProps {
  note: Note | null;
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
  onOpenWebTab?: (url: string) => void;
  onUnlockNote?: (noteId: string, pin: string) => Promise<boolean>;
  onRelockNote?: (noteId: string) => void;
  onGetActivePin?: (noteId: string) => string | undefined;
  paneId?: string;
}

interface SaveSnapshot {
  ext: "md" | "txt" | "html";
  content: string;
}

function TableInteractiveOverlay({ editor }: { editor: TiptapEditor }) {
  if (!editor || !editor.isEditable) return null;
  const { t } = useTranslation();
  const [tableRect, setTableRect] = useState<DOMRect | null>(null);
  const [cellRect, setCellRect] = useState<DOMRect | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [duplicateSubmenuOpen, setDuplicateSubmenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasScrollable = el.scrollHeight > el.clientHeight;
    setCanScrollUp(hasScrollable && el.scrollTop > 2);
    setCanScrollDown(hasScrollable && el.scrollTop < el.scrollHeight - el.clientHeight - 2);
  }, []);

  const startAutoScroll = useCallback((direction: "up" | "down") => {
    stopAutoScroll();
    const step = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.scrollTop += direction === "up" ? -12 : 12;
      checkScroll();
    };
    step();
    scrollIntervalRef.current = setInterval(step, 30);
  }, [checkScroll, stopAutoScroll]);

  const scrollMenu = useCallback((direction: "up" | "down") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const delta = direction === "up" ? -100 : 100;
    el.scrollBy({ top: delta, behavior: "smooth" });
    setTimeout(checkScroll, 150);
  }, [checkScroll]);

  useEffect(() => {
    if (menuOpen) {
      setTimeout(checkScroll, 50);
    } else {
      stopAutoScroll();
      setCanScrollUp(false);
      setCanScrollDown(false);
    }
  }, [menuOpen, duplicateSubmenuOpen, checkScroll, stopAutoScroll]);

  useEffect(() => {
    if (!menuOpen) {
      setDuplicateSubmenuOpen(false);
    }
  }, [menuOpen]);

  // Click / Tap outside to dismiss popover menu
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => window.removeEventListener("pointerdown", handlePointerDown, true);
  }, [menuOpen]);

  const updatePositions = useCallback(() => {
    if (!editor || editor.isDestroyed || !editor.isActive("table")) {
      setTableRect(null);
      setCellRect(null);
      return;
    }

    try {
      const { selection } = editor.state;
      const domAtPos = editor.view.domAtPos(selection.from);
      let node: Node | null = domAtPos.node;
      if (node && node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      const tableEl = (node as HTMLElement)?.closest?.("table") as HTMLElement | null;

      if (!tableEl) {
        setCellRect(null);
        setTableRect(null);
        return;
      }

      setTableRect(tableEl.getBoundingClientRect());

      // Check if multiple cells are selected (.selectedCell)
      const selectedCells = tableEl.querySelectorAll("td.selectedCell, th.selectedCell");

      if (selectedCells.length > 0) {
        let minTop = Infinity;
        let minLeft = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        selectedCells.forEach((cell) => {
          const r = cell.getBoundingClientRect();
          if (r.top < minTop) minTop = r.top;
          if (r.left < minLeft) minLeft = r.left;
          if (r.right > maxRight) maxRight = r.right;
          if (r.bottom > maxBottom) maxBottom = r.bottom;
        });

        setCellRect(new DOMRect(minLeft, minTop, maxRight - minLeft, maxBottom - minTop));
      } else {
        const cellEl = (node as HTMLElement)?.closest?.("td, th") as HTMLElement | null;
        if (cellEl) {
          setCellRect(cellEl.getBoundingClientRect());
        } else {
          setCellRect(null);
        }
      }
    } catch {
      setCellRect(null);
      setTableRect(null);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    updatePositions();

    const handleUpdate = () => updatePositions();

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      if (!editor.isDestroyed) {
        editor.off("selectionUpdate", handleUpdate);
        editor.off("transaction", handleUpdate);
      }
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [editor, updatePositions]);

  let isMultiSelection = false;
  try {
    if (editor && !editor.isDestroyed && tableRect) {
      const { selection } = editor.state;
      const domAtPos = editor.view.domAtPos(selection.from);
      let node: Node | null = domAtPos.node;
      if (node && node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      const tableEl = (node as HTMLElement)?.closest?.("table") as HTMLElement | null;
      if (tableEl) {
        isMultiSelection = tableEl.querySelectorAll("td.selectedCell, th.selectedCell").length > 1;
      }
    }
  } catch {
    // fallback
  }

  const canMerge = editor?.can()?.mergeCells();
  const canSplit = editor?.can()?.splitCell();

  const items = useMemo(() => {
    if (!editor || editor.isDestroyed) return [];
    return [
      {
        id: "toggleHeaderRow",
        label: t("editor.toggleHeaderRow"),
        icon: <TableIcon className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().toggleHeaderRow().run(),
      },
      {
        id: "toggleHeaderColumn",
        label: t("editor.toggleHeaderColumn"),
        icon: <Columns className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().toggleHeaderColumn().run(),
      },
      ...(isMultiSelection || canMerge
        ? [
            {
              id: "mergeCells",
              label: t("editor.mergeCells"),
              icon: <Layers className="mr-2 h-4 w-4 shrink-0" />,
              action: () => editor.chain().focus().mergeCells().run(),
            },
          ]
        : []),
      ...(canSplit
        ? [
            {
              id: "splitCell",
              label: t("editor.splitCell"),
              icon: <Layers className="mr-2 h-4 w-4 shrink-0" />,
              action: () => editor.chain().focus().splitCell().run(),
            },
          ]
        : []),
      {
        id: "addColumnBefore",
        label: t("editor.addColumnLeft"),
        icon: <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addColumnBefore().run(),
      },
      {
        id: "addColumnAfter",
        label: t("editor.addColumnRight"),
        icon: <ArrowRight className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addColumnAfter().run(),
      },
      {
        id: "addRowBefore",
        label: t("editor.addRowAbove"),
        icon: <ArrowUp className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addRowBefore().run(),
      },
      {
        id: "addRowAfter",
        label: t("editor.addRowBelow"),
        icon: <ArrowDown className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().addRowAfter().run(),
      },
      {
        id: "clearContents",
        label: t("editor.clearContents"),
        icon: <Eraser className="mr-2 h-4 w-4 shrink-0" />,
        action: () => editor.chain().focus().deleteSelection().run(),
      },
      {
        id: "deleteRow",
        label: t("editor.deleteRow"),
        icon: <DeleteRowIcon className="mr-2 h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteRow().run(),
      },
      {
        id: "deleteColumn",
        label: t("editor.deleteColumn"),
        icon: <DeleteColumnIcon className="mr-2 h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteColumn().run(),
      },
      {
        id: "deleteTable",
        label: t("editor.deleteTable"),
        icon: <DeleteTableIcon className="mr-2 h-4 w-4 shrink-0" />,
        danger: true,
        action: () => editor.chain().focus().deleteTable().run(),
      },
    ];
  }, [editor, isMultiSelection, canMerge, canSplit, t]);

  const normalItems = useMemo(() => items.filter((item) => !item.danger), [items]);
  const dangerItems = useMemo(() => items.filter((item) => item.danger), [items]);

  const allFlatItems = useMemo(() => {
    const list: Array<{ id: string; label: string; icon: React.ReactNode; danger?: boolean; action: () => void }> = [];
    normalItems.forEach((item) => list.push(item));
    list.push({
      id: "duplicate",
      label: t("editor.duplicate"),
      icon: <Copy className="mr-2 h-4 w-4 shrink-0" />,
      action: () => setDuplicateSubmenuOpen((v) => !v),
    });
    if (duplicateSubmenuOpen) {
      list.push({
        id: "duplicateRow",
        label: t("editor.duplicateRow"),
        icon: <DeleteRowIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />,
        action: () => {
          editor.chain().focus().addRowAfter().run();
          setMenuOpen(false);
          setDuplicateSubmenuOpen(false);
        },
      });
      list.push({
        id: "duplicateColumn",
        label: t("editor.duplicateColumn"),
        icon: <DeleteColumnIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />,
        action: () => {
          editor.chain().focus().addColumnAfter().run();
          setMenuOpen(false);
          setDuplicateSubmenuOpen(false);
        },
      });
    }
    dangerItems.forEach((item) => list.push(item));
    return list;
  }, [normalItems, duplicateSubmenuOpen, dangerItems, editor, t]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [menuOpen, duplicateSubmenuOpen]);

  // Arrow up/down & Enter/Escape keyboard navigation
  useEffect(() => {
    if (!menuOpen || allFlatItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < 0 ? 0 : (prev + 1) % allFlatItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < 0 ? allFlatItems.length - 1 : (prev - 1 + allFlatItems.length) % allFlatItems.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = allFlatItems[selectedIndex];
          if (selected) {
            selected.action();
            if (selected.id !== "duplicate") {
              setMenuOpen(false);
            }
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [menuOpen, selectedIndex, allFlatItems]);

  useEffect(() => {
    if (!menuOpen || selectedIndex < 0 || !scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector(`[data-flat-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, menuOpen]);

  if (!editor || editor.isDestroyed || !editor.isActive("table") || !tableRect || !cellRect) {
    return null;
  }

  let currentFlatIndex = 0;

  return (
    <>
      {/* Active Focused Cell Blue Outline */}
      <div
        className="fixed pointer-events-none z-30 border-2 border-primary rounded-[2px]"
        style={{
          top: `${cellRect.top}px`,
          left: `${cellRect.left}px`,
          width: `${cellRect.width}px`,
          height: `${cellRect.height}px`,
        }}
      />

      {/* Column Handle Bar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-40 cursor-pointer rounded-full bg-primary shadow-sm hover:scale-110 transition-transform -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${cellRect.top + 1}px`,
              left: `${cellRect.left + cellRect.width / 2}px`,
              width: "20px",
              height: "6px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuPos({ top: cellRect.top + 10, left: cellRect.left + cellRect.width / 2 - 100 });
              setMenuOpen((v) => !v);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>{t("editor.tableOptions")}</TooltipContent>
      </Tooltip>

      {/* Right Margin Plus Button (+) to add Column */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-30 flex items-center justify-center rounded-lg border border-border/80 bg-popover/90 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/10 cursor-pointer shadow-sm transition-all"
            style={{
              top: `${tableRect.top}px`,
              left: `${tableRect.right + 10}px`,
              width: "16px",
              height: `${tableRect.height}px`,
            }}
            onClick={() => {
              editor.chain().focus().addColumnAfter().run();
              setTimeout(updatePositions, 50);
            }}
          >
            <Plus className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{t("editor.addColumnRight")}</TooltipContent>
      </Tooltip>

      {/* Bottom Margin Plus Button (+) to add Row */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="fixed z-30 flex items-center justify-center rounded-lg border border-border/80 bg-popover/90 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/10 cursor-pointer shadow-sm transition-all"
            style={{
              top: `${tableRect.bottom + 10}px`,
              left: `${tableRect.left}px`,
              width: `${tableRect.width}px`,
              height: "16px",
            }}
            onClick={() => {
              editor.chain().focus().addRowAfter().run();
              setTimeout(updatePositions, 50);
            }}
          >
            <Plus className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{t("editor.addRowBelow")}</TooltipContent>
      </Tooltip>

      {/* Floating Actions Popover Card (100% Identical to Slash Commands Menu with Chevron Scroll Indicators) */}
      {menuOpen && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-56 rounded-xl border border-border bg-popover px-0 py-1.5 shadow-xl animate-in fade-in-80 zoom-in-95 flex flex-col max-h-80 overflow-hidden text-popover-foreground select-none"
          style={{
            top: `${Math.min(menuPos.top, window.innerHeight - 360)}px`,
            left: `${Math.min(menuPos.left, window.innerWidth - 240)}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/40 shrink-0">
            {t("editor.tableOptions")}
          </div>

          {canScrollUp && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("up")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollMenu("up")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronUp className="h-4 w-4" />
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="overflow-y-auto no-scrollbar flex-1 py-1 pb-3"
          >
            {normalItems.map((item) => {
              const flatIndex = currentFlatIndex++;
              const isSelected = flatIndex === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-flat-index={flatIndex}
                  role="button"
                  tabIndex={0}
                  className={`mx-1 flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm transition-colors select-none ${
                    isSelected
                      ? "bg-accent/5 text-primary font-semibold"
                      : "text-foreground font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                  }`}
                  onMouseEnter={() => setSelectedIndex(flatIndex)}
                  onClick={() => {
                    item.action();
                    setMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="truncate flex-1">{item.label}</span>
                </div>
              );
            })}

            {/* Duplicate Waterfall Submenu */}
            {(() => {
              const duplicateFlatIndex = currentFlatIndex++;
              const isDuplicateSelected = duplicateFlatIndex === selectedIndex;
              return (
                <>
                  <div
                    data-flat-index={duplicateFlatIndex}
                    role="button"
                    tabIndex={0}
                    className={`mx-1 flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm transition-colors select-none ${
                      isDuplicateSelected
                        ? "bg-accent/5 text-primary font-semibold"
                        : "text-foreground font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                    }`}
                    onMouseEnter={() => setSelectedIndex(duplicateFlatIndex)}
                    onClick={() => setDuplicateSubmenuOpen((v) => !v)}
                  >
                    <Copy className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{t("editor.duplicate")}</span>
                    <ChevronRight
                      className={`ml-auto h-4 w-4 shrink-0 opacity-60 transition-transform ${
                        duplicateSubmenuOpen ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {duplicateSubmenuOpen && (
                    <div className="my-0.5 space-y-0.5 animate-in fade-in-50 slide-in-from-top-1">
                      {(() => {
                        const dupRowIndex = currentFlatIndex++;
                        const isDupRowSelected = dupRowIndex === selectedIndex;
                        return (
                          <div
                            data-flat-index={dupRowIndex}
                            role="button"
                            tabIndex={0}
                            className={`mx-1 ml-6 flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-xs transition-colors select-none ${
                              isDupRowSelected
                                ? "bg-accent/5 text-primary font-semibold"
                                : "text-foreground/90 font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                            }`}
                            onMouseEnter={() => setSelectedIndex(dupRowIndex)}
                            onClick={() => {
                              editor.chain().focus().addRowAfter().run();
                              setMenuOpen(false);
                              setDuplicateSubmenuOpen(false);
                            }}
                          >
                            <DeleteRowIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="truncate flex-1">{t("editor.duplicateRow")}</span>
                          </div>
                        );
                      })()}
                      {(() => {
                        const dupColIndex = currentFlatIndex++;
                        const isDupColSelected = dupColIndex === selectedIndex;
                        return (
                          <div
                            data-flat-index={dupColIndex}
                            role="button"
                            tabIndex={0}
                            className={`mx-1 ml-6 flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-xs transition-colors select-none ${
                              isDupColSelected
                                ? "bg-accent/5 text-primary font-semibold"
                                : "text-foreground/90 font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                            }`}
                            onMouseEnter={() => setSelectedIndex(dupColIndex)}
                            onClick={() => {
                              editor.chain().focus().addColumnAfter().run();
                              setMenuOpen(false);
                              setDuplicateSubmenuOpen(false);
                            }}
                          >
                            <DeleteColumnIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="truncate flex-1">{t("editor.duplicateColumn")}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              );
            })()}

            {dangerItems.length > 0 && (
              <>
                <div className="my-1 border-t border-border/40" />
                <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider shrink-0">
                  {t("editor.deleteActions")}
                </div>
                {dangerItems.map((item) => {
                  const flatIndex = currentFlatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      data-flat-index={flatIndex}
                      role="button"
                      tabIndex={0}
                      className={`mx-1 flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm transition-colors select-none ${
                        isSelected
                          ? "bg-accent/5 text-primary font-semibold"
                          : "text-foreground font-normal hover:bg-accent/5 hover:text-primary hover:font-semibold"
                      }`}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      onClick={() => {
                        item.action();
                        setMenuOpen(false);
                      }}
                    >
                      {item.icon}
                      <span className="truncate flex-1">{item.label}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {canScrollDown && (
            <div
              role="button"
              tabIndex={-1}
              onMouseEnter={() => startAutoScroll("down")}
              onMouseLeave={stopAutoScroll}
              onClick={() => scrollMenu("down")}
              className="flex cursor-default items-center justify-center py-1 shrink-0 text-muted-foreground select-none"
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function createTurndownService(assetBlobUrlMap?: Map<string, string>): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
  });

  // Preserve raw Markdown content without escaping dots after numbers (e.g. ## 8. Ordered Lists) or brackets
  td.escape = (str: string) => str;

  // Serialize empty paragraphs using a placeholder token so Turndown cannot collapse consecutive blank lines
  td.addRule("emptyParagraph", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "P" &&
        !el.textContent?.trim() &&
        !el.querySelector("img, audio, input, label") &&
        !el.closest("table, li, blockquote, [data-type='taskItem']")
      );
    },
    replacement: () => "\n<!--luno:blank-->",
  });

  // Serialize headings matching Obsidian line structure
  td.addRule("heading", {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: (content, node) => {
      const h = node as HTMLElement;
      const level = Number(h.nodeName.charAt(1)) || 1;
      const prefix = "#".repeat(level);
      return `\n${prefix} ${content}\n`;
    },
  });

  // Serialize normal non-empty paragraphs matching Obsidian line structure
  td.addRule("paragraph", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "P" &&
        Boolean(el.textContent?.trim() || el.querySelector("img, audio, input, label")) &&
        !el.closest("table, li, blockquote, [data-type='taskItem']")
      );
    },
    replacement: (content) => `\n${content}\n`,
  });

  // Serialize lists matching CommonMark block boundaries
  td.addRule("list", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        (el.nodeName === "UL" || el.nodeName === "OL") &&
        !el.classList?.contains("footnotes-list") &&
        !el.closest("section.footnotes, [data-footnotes]")
      );
    },
    replacement: (content, node) => {
      const parent = node.parentNode;
      if (parent && parent.nodeName === "LI") {
        return "\n" + content;
      }
      return `\n${content}\n`;
    },
  });

  // Serialize blockquotes matching Obsidian line structure
  td.addRule("blockquote", {
    filter: "blockquote",
    replacement: (content) => {
      const clean = content.trim().replace(/^/gm, "> ");
      return `\n${clean}\n`;
    },
  });

  // Serialize horizontal rules matching Obsidian line structure
  td.addRule("horizontalRule", {
    filter: "hr",
    replacement: () => `\n---\n`,
  });

  // Override Turndown built-in fencedCodeBlock, codeBlock, and code rules in-place so td.rules.array uses them
  if (td.rules.fencedCodeBlock) {
    td.rules.fencedCodeBlock.filter = (node, options) => {
      return options.codeBlockStyle === "fenced" && node.nodeName === "PRE";
    };
    td.rules.fencedCodeBlock.replacement = (_content, node, options) => {
      const codeEl = ((node as HTMLElement).querySelector("code") || node) as HTMLElement;
      const className = codeEl?.getAttribute("class") || "";
      const language = (className.match(/language-(\S+)/) || [null, ""])[1];
      const rawCode = codeEl?.textContent || "";
      const cleanCode = rawCode.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
      const fence = options.fence || "```";
      return `\n${fence}${language}\n${cleanCode}\n${fence}\n`;
    };
  }

  if (td.rules.codeBlock) {
    td.rules.codeBlock.filter = () => false;
  }

  if (td.rules.code) {
    td.rules.code.filter = (node) => {
      const hasSiblings = node.previousSibling || node.nextSibling;
      const isCodeBlock = node.parentNode && node.parentNode.nodeName === "PRE" && !hasSiblings;
      return node.nodeName === "CODE" && !isCodeBlock;
    };
    td.rules.code.replacement = (content) => {
      if (!content.trim()) return "";
      let delimiter = "`";
      const matches = content.match(/`+/gm) || [];
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
      return delimiter + content + delimiter;
    };
  }

  const defaultBlankReplacement = td.rules.blankRule.replacement;
  td.rules.blankRule.replacement = (content, node, options) => {
    const el = node as HTMLElement;
    if (
      el.nodeName === "P" &&
      !el.textContent?.trim() &&
      !el.closest("table, li, blockquote, [data-type='taskItem']")
    ) {
      return "\n<!--luno:blank-->";
    }
    return defaultBlankReplacement ? defaultBlankReplacement.call(td.rules.blankRule, content, node, options) : "\n<!--luno:blank-->";
  };

  // Convert <u> to <u>text</u> in markdown
  td.addRule("underline", {
    filter: "u",
    replacement: (content) => `<u>${content}</u>`,
  });

  // Convert <mark> or .luno-highlight to ==text== in markdown
  td.addRule("highlight", {
    filter: (node) =>
      node.nodeName === "MARK" ||
      (node.nodeName === "SPAN" && (node as HTMLElement).classList?.contains("luno-highlight")),
    replacement: (content) => `==${content}==`,
  });

  // Convert footnote reference HTML <sup><a href="#fn-1" data-footnote-ref="1">[1]</a></sup> back into [^1]
  td.addRule("footnoteRef", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.getAttribute("data-footnote-ref") !== null ||
        (el.nodeName === "SUP" && Boolean(el.querySelector("[data-footnote-ref]") || /\[\^?[^\]]+\]/.test(el.textContent || ""))) ||
        (el.nodeName === "A" && (el.getAttribute("href") || "").startsWith("#fn-"))
      );
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const ref =
        el.getAttribute("data-footnote-ref") ||
        el.querySelector("[data-footnote-ref]")?.getAttribute("data-footnote-ref") ||
        (el.getAttribute("href") || "").replace(/^#fn-/, "") ||
        el.textContent ||
        "";
      const cleanRef = ref.replace(/[\[\]\^]/g, "").trim();
      return cleanRef ? `[^${cleanRef}]` : "";
    },
  });

  // Convert in-place footnote definition HTML <p id="fn-1" data-footnote-def="1">... back into [^1]: ...
  td.addRule("footnoteDef", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "P" &&
        (el.getAttribute("data-footnote-def") !== null || el.classList?.contains("footnote-def") || /^\s*\[\^[^\]]+\]:/.test(el.textContent || ""))
      );
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const fnId =
        el.getAttribute("data-footnote-def") ||
        (el.getAttribute("id") || "").replace(/^fn-/, "") ||
        "1";
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".footnote-backref, [data-footnote-backref]").forEach((a) => a.remove());
      const rawContent = td.turndown(clone.innerHTML).trim();
      const cleanContent = rawContent.replace(/^\[\^[^\]]+\]:\s*/, "").trim();
      return `\n[^${fnId}]: ${cleanContent}\n`;
    },
  });

  // Ignore reading mode bottom footnotes list items and section so they never write to disk
  td.addRule("readingModeFootnoteItem", {
    filter: (node) => {
      const el = node as HTMLElement;
      return el.nodeName === "LI" && (el.classList?.contains("footnote-item") || el.getAttribute("data-footnote-id") !== null);
    },
    replacement: () => "",
  });

  td.addRule("footnotesSection", {
    filter: (node) => (node as HTMLElement).nodeName === "SECTION" && (node as HTMLElement).classList?.contains("footnotes"),
    replacement: () => "",
  });

  td.addRule("footnotesSep", {
    filter: (node) => (node as HTMLElement).nodeName === "HR" && (node as HTMLElement).classList?.contains("footnotes-sep"),
    replacement: () => "",
  });

  // Suppress duplicate standalone footnote backrefs
  td.addRule("footnoteBackref", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.getAttribute("data-footnote-backref") !== null ||
        el.classList?.contains("footnote-backref") ||
        (el.nodeName === "A" && (el.getAttribute("href") || "").startsWith("#fnref-"))
      );
    },
    replacement: () => "",
  });

  // Convert <sup> to <sup>text</sup> in markdown (if not a footnote ref)
  td.addRule("superscript", {
    filter: (node) => node.nodeName === "SUP" && !node.querySelector("[data-footnote-ref]"),
    replacement: (content) => `<sup>${content}</sup>`,
  });

  // Convert <sub> to <sub>text</sub> in markdown
  td.addRule("subscript", {
    filter: "sub",
    replacement: (content) => `<sub>${content}</sub>`,
  });

  // Convert HTML images back to Markdown, preserving relative asset paths and width
  td.addRule("relativeImage", {
    filter: "img",
    replacement: (_content, node) => {
      const img = node as HTMLImageElement;
      const alt = img.getAttribute("alt") || "";
      const title = img.getAttribute("title");
      const rawWidth = img.getAttribute("width") || img.style.width || "";
      const widthMatch = rawWidth ? String(rawWidth).match(/\d+/) : null;
      const width = widthMatch ? widthMatch[0] : "";
      let relSrc = img.getAttribute("data-relative-src") || assetBlobUrlMap?.get(img.src) || img.getAttribute("src") || "";
      if (relSrc && !/^(https?:\/\/|data:|blob:)/i.test(relSrc)) {
        try {
          relSrc = encodeURI(decodeURI(relSrc));
        } catch {
          relSrc = relSrc.replace(/ /g, "%20");
        }
      }
      const titleAttr = title ? ` "${title}"` : "";
      if (width) {
        return `![${alt}|${width}](${relSrc}${titleAttr})`;
      }
      return `![${alt}](${relSrc}${titleAttr})`;
    },
  });

  // Convert HTML audio back to Markdown audio
  td.addRule("audio", {
    filter: "audio",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const src = el.getAttribute("src") || "";
      const title = el.getAttribute("data-title") || el.getAttribute("title") || "";
      const titleAttr = title ? ` data-title="${title.replace(/"/g, "&quot;")}"` : "";
      if (!src) return "";
      return `\n\n<audio controls src="${src}"${titleAttr}></audio>\n\n`;
    },
  });

  // Convert Wikilinks (<a href="wikilink:..." data-wikilink="...">) back into standard [[Target]] or [[Target|Alias]]
  td.addRule("wikilink", {
    filter: (node) => {
      if (node.nodeName !== "A") return false;
      const href = (node.getAttribute("href") || "").trim();
      const dataWiki = node.getAttribute("data-wikilink");
      return Boolean(dataWiki) || href.startsWith("wikilink:");
    },
    replacement: (content, node) => {
      const rawTarget =
        node.getAttribute("data-wikilink") ||
        decodeURIComponent((node.getAttribute("href") || "").replace(/^wikilink:/, ""));
      const target = rawTarget.trim();
      const text = (content || node.textContent || "").trim();
      if (!target) return text;
      if (!text || text === target) {
        return `[[${target}]]`;
      }
      return `[[${target}|${text}]]`;
    },
  });

  // Clean list item formatting to prevent loose lists with blank lines and broken indentation
  td.addRule("cleanListItem", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "LI" &&
        el.getAttribute("data-type") !== "taskItem" &&
        !el.classList?.contains("footnote-item") &&
        el.getAttribute("data-footnote-id") === null
      );
    },
    replacement: (content, node, options) => {
      const cleanContent = content
        .replace(/^\n+/, "")
        .replace(/\n+$/, "")
        .replace(/\n/gm, "\n    ");

      const parent = node.parentNode;
      const isOrdered = parent && parent.nodeName === "OL";
      let prefix = options.bulletListMarker + " ";
      if (isOrdered) {
        const start = (parent as HTMLElement).getAttribute("start");
        const index = Array.from(parent.children).filter((c) => c.nodeName === "LI").indexOf(node) + 1;
        prefix = (start ? Number(start) + index - 1 : index) + ". ";
      }
      return (
        prefix + cleanContent + (node.nextSibling && !/\n$/.test(cleanContent) ? "\n" : "")
      );
    },
  });

  // Prevent Turndown built-in inline `code`, `span`, and other element rules from processing children inside <pre> and splitting code blocks
  td.addRule("insidePreCode", {
    filter: (node) => {
      let curr: Node | null = node.parentNode;
      while (curr) {
        if (curr.nodeName === "PRE" || (curr.nodeName === "DIV" && (curr as HTMLElement).classList.contains("code-block-wrapper"))) return true;
        curr = curr.parentNode;
      }
      return false;
    },
    replacement: (_content, node) => node.textContent || "",
  });

  // Preserve fenced code blocks when converting HTML to Markdown for disk, intercepting .code-block-wrapper cleanly
  td.addRule("fencedCodeBlock", {
    filter: (node) => {
      if (node.nodeName === "PRE") {
        // If pre is inside a code-block-wrapper, let the parent wrapper handle it
        let parent: Node | null = node.parentNode;
        while (parent) {
          if (parent.nodeName === "DIV" && (parent as HTMLElement).classList?.contains("code-block-wrapper")) {
            return false;
          }
          parent = parent.parentNode;
        }
        return true;
      }
      return node.nodeName === "DIV" && (node as HTMLElement).classList?.contains("code-block-wrapper");
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const codeEl = el.querySelector("code") || el.querySelector("pre") || el;
      const className = codeEl.getAttribute("class") || el.getAttribute("class") || "";
      const langMatch = className.match(/language-([a-zA-Z0-9_-]+)/);
      const lang = langMatch ? langMatch[1] : "";
      const rawText = codeEl.textContent || "";
      const codeText = rawText.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
      return `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
    },
  });

  // Convert HTML tables back into clean GFM Markdown tables unless originally HTML or using merged cells
  td.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const table = node as HTMLElement;

      const hasSpans = Boolean(table.querySelector('[colspan]:not([colspan="1"]), [rowspan]:not([rowspan="1"])'));
      const isOriginalHtmlTable = table.getAttribute("data-original-html-table") === "true";

      if (isOriginalHtmlTable || hasSpans) {
        const clone = table.cloneNode(true) as HTMLElement;
        clone.removeAttribute("data-original-html-table");
        return `\n${clone.outerHTML}\n`;
      }

      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) return "";

      const matrix: string[][] = [];
      let maxCols = 0;

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        if (cells.length === 0) return;
        const rowData = cells.map((cell) => {
          let text = td.turndown(cell.innerHTML).replace(/\n+/g, " ").trim();
          text = text.replace(/\\\|/g, "___PIPE_TEMP___").replace(/\|/g, "\\|").replace(/___PIPE_TEMP___/g, "\\|");
          return text;
        });
        if (rowData.length > maxCols) maxCols = rowData.length;
        matrix.push(rowData);
      });

      while (matrix.length > 1 && matrix[matrix.length - 1].every((cell) => !cell.trim())) {
        matrix.pop();
      }

      if (matrix.length === 0 || maxCols === 0) return "";

      const header = matrix[0];
      while (header.length < maxCols) header.push("");
      const headerLine = `| ${header.join(" | ")} |`;
      const separatorLine = `| ${Array(maxCols).fill("---").join(" | ")} |`;

      const bodyLines = matrix.slice(1).map((row) => {
        while (row.length < maxCols) row.push("");
        return `| ${row.join(" | ")} |`;
      });

      const lines = [headerLine, separatorLine, ...bodyLines];
      return `\n${lines.join("\n")}\n`;
    },
  });

  // Suppress individual taskItem processing – handled wholesale by taskList rule below
  td.addRule("taskItem", {
    filter: (node: HTMLElement) =>
      node.nodeName === "LI" && node.getAttribute("data-type") === "taskItem",
    replacement: () => "",
  });

  // Convert Tiptap's <ul data-type="taskList"> to markdown checkboxes
  td.addRule("taskList", {
    filter: (node: HTMLElement) =>
      node.nodeName === "UL" && node.getAttribute("data-type") === "taskList",
    replacement: (_content: string, node: TurndownService.Node) => {
      const ul = node as HTMLElement;
      const items = Array.from(ul.querySelectorAll('li[data-type="taskItem"]')).map((li) => {
        const checked = (li as HTMLElement).getAttribute("data-checked") === "true" ? "x" : " ";
        const contentDiv = li.querySelector("div");
        const text = contentDiv ? contentDiv.textContent?.trim() ?? "" : "";
        return `- [${checked}] ${text}`;
      });
      return "\n" + items.join("\n") + "\n";
    },
  });

  // Preserve Tiptap <details><summary>title</summary>...<details> in markdown
  td.addRule("toggle", {
    filter: (node: HTMLElement) => node.nodeName === "DETAILS",
    replacement: (_content: string, node: TurndownService.Node) => {
      const el = node as HTMLElement;
      const summary = el.querySelector("summary");
      const title = summary?.textContent?.trim() || "";
      const isOpen = el.hasAttribute("open");

      const div = el.querySelector("div");
      let innerHtml = "";
      if (div) {
        innerHtml = div.innerHTML;
      } else {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelector("summary")?.remove();
        innerHtml = clone.innerHTML;
      }

      const innerMarkdown = td.turndown(innerHtml).replace(/^[\r\n]+|[\r\n]+$/g, "");
      const bodyContent = innerMarkdown || "<p></p>";

      return `\n<details${isOpen ? " open" : ""}><summary>${title}</summary><div>\n\n${bodyContent}\n\n</div></details>\n`;
    },
  });

  return td;
}

export default function Editor(props: EditorProps & { notes?: Note[] }) {
  const { note, onUpdate, onDelete, onDeleteFile, onCreate, onCreateFolder, onOpenFolder, onRenameFile, onDuplicateFile, openedFolderName, onOpenSidebar, isSidebarOpen = false, editorFontSize = 15, isMobile = false, notes, rootDirHandle, onCloseSplit, settingsOpen: propSettingsOpen, onSettingsOpenChange, rightPanelOpen = false, onCloseRightPanel, onSelectNote, onOpenWebTab, onUnlockNote, onRelockNote, onGetActivePin, paneId = "main" } = props;

  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileExt, setNewFileExt] = useState<"txt" | "md" | "html">("txt");
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingCreate, setPendingCreate] = useState<null | { kind: "file" | "folder"; fileName?: string; contentFormat?: "plain" | "markdown" | "html"; folderName?: string }>(null);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [htmlCursor, setHtmlCursor] = useState({ line: 1, col: 1 });

  // Version History State
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [comparingVersion, setComparingVersion] = useState<NoteVersionSnapshot | null>(null);

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
        const tokenInfo = getStoredTokenInfo();
        if (tokenInfo?.access_token) {
          const link = await getDriveFileShareLink(tokenInfo.access_token, note.driveFileId);
          setShareLink(link);
          try {
            await navigator.clipboard.writeText(link);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 3000);
          } catch {}
          setShareSuccessDialogOpen(true);
          toast({
            title: t("shareDialog.shareViaDrive") || "Share via Google Drive",
            description: t("shareDialog.copied") || "Link copied to clipboard!",
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
      updateSettings({ storageMode: "gdrive" });

      const tokenInfo = getStoredTokenInfo();
      if (!tokenInfo?.access_token) {
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
        const link = await getDriveFileShareLink(tokenInfo.access_token, targetFileId);
        setShareLink(link);
        try {
          await navigator.clipboard.writeText(link);
          setCopiedShareLink(true);
          setTimeout(() => setCopiedShareLink(false), 3000);
        } catch {}
        setShareSyncDialogOpen(false);
        setShareSuccessDialogOpen(true);
        toast({
          title: t("shareDialog.shareViaDrive") || "Share via Google Drive",
          description: t("shareDialog.copied") || "Link copied to clipboard!",
        });
      } else {
        // Fallback: full sync and get structure
        await syncEngine.syncAllNotes(notes || [note]);
        const updated = (notes || []).find((n) => n.id === note.id);
        const finalId = updated?.driveFileId || note.driveFileId;
        if (finalId) {
          const link = await getDriveFileShareLink(tokenInfo.access_token, finalId);
          setShareLink(link);
          try {
            await navigator.clipboard.writeText(link);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 3000);
          } catch {}
          setShareSyncDialogOpen(false);
          setShareSuccessDialogOpen(true);
        }
      }
    } catch (err) {
      console.warn("Sync and share error:", err);
      toast({
        title: t("shareDialog.title") || "Share",
        description: t("shareDialog.error") || "Failed to generate share link.",
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
      const tokenInfo = getStoredTokenInfo();
      if (!tokenInfo?.access_token) return;

      const success = await revokeDriveFileShare(tokenInfo.access_token, targetFileId);
      if (success) {
        setShareLink("");
        setShareSuccessDialogOpen(false);
        toast({
          title: t("shareDialog.revokeSuccessTitle") || "Sharing Stopped",
          description: t("shareDialog.revokeSuccessDesc") || "Public access to this note has been revoked.",
        });
      } else {
        toast({
          title: t("shareDialog.title") || "Share",
          description: t("shareDialog.revokeError") || "Failed to stop sharing. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.warn("Revoke share error:", err);
      toast({
        title: t("shareDialog.title") || "Share",
        description: t("shareDialog.revokeError") || "Failed to stop sharing. Please try again.",
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
    const baseName = (newFileName || "").trim();
    const contentFormat = newFileExt === "md" ? "markdown" : newFileExt === "html" ? "html" : "plain";
    const dateStr = formatDateForFileName(new Date(), settings.dateFormat);
    let defaultBaseName = "Untitled";
    if (settings.newFilePattern === "date") {
      defaultBaseName = `Note_${dateStr}`;
    } else if (settings.newFilePattern === "daily") {
      defaultBaseName = `Daily-${dateStr}`;
    }
    const fileName = baseName ? `${baseName}.${newFileExt}` : `${defaultBaseName}.${newFileExt}`;

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
        setAlertMessage("นำเข้า docx ไม่สำเร็จ: " + (e as Error).message);
      }
      setImportDocxDialogOpen(false);
      event.target.value = "";
    };
  const autoSaveDiskTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRenameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRenameRef = useRef<{ note: Note; firstH1Text: string; newFileName: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileToolbarAreaRef = useRef<HTMLDivElement>(null);
  const syncingFromNote = useRef(false);
  const loadingNoteIdRef = useRef<string | null>(null);
  const isNoteCurrentlyLocked = Boolean((note?.isLocked && !note?.isDecrypted) || (note?.content && isEncryptedNote(note.content)));
  const editorActiveNoteIdRef = useRef<string | null>(isNoteCurrentlyLocked ? null : (note?.id ?? null));
  const fileHandleByNoteIdRef = useRef<Record<string, FileSystemFileHandle>>({});
  const deletedNoteIdsRef = useRef<Set<string>>(new Set());
  const editorSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lineEnding, setLineEnding] = useState<"LF" | "CRLF">("LF");
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkTab, setLinkTab] = useState<"workspace" | "external">("workspace");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDisplayText, setLinkDisplayText] = useState("");
  const [selectedWorkspaceNote, setSelectedWorkspaceNote] = useState<Note | null>(null);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [workspaceImageDialogOpen, setWorkspaceImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [audioRecorderOpen, setAudioRecorderOpen] = useState(false);

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
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [canZoomImage, setCanZoomImage] = useState(false);
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false);
  const [htmlDeviceMode, setHtmlDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [calculatorZIndex, setCalculatorZIndex] = useState<number>(50);
  const [clockZIndex, setClockZIndex] = useState<number>(50);
  const [audioRecorderZIndex, setAudioRecorderZIndex] = useState<number>(50);
  const [translatorOpen, setTranslatorOpen] = useState(false);
  const [translatorInitialText, setTranslatorInitialText] = useState("");
  const [translatorZIndex, setTranslatorZIndex] = useState<number>(50);
  const nextWindowZIndexRef = useRef<number>(51);

  const bringCalculatorToFront = useCallback(() => {
    setCalculatorZIndex(nextWindowZIndexRef.current++);
  }, []);

  const bringClockToFront = useCallback(() => {
    setClockZIndex(nextWindowZIndexRef.current++);
  }, []);

  const bringAudioRecorderToFront = useCallback(() => {
    setAudioRecorderZIndex(nextWindowZIndexRef.current++);
  }, []);

  const bringTranslatorToFront = useCallback(() => {
    setTranslatorZIndex(nextWindowZIndexRef.current++);
  }, []);

  const toggleCalculator = useCallback(() => {
    setCalculatorOpen((prev) => {
      const next = !prev;
      if (next) bringCalculatorToFront();
      return next;
    });
  }, [bringCalculatorToFront]);

  const toggleClock = useCallback(() => {
    setClockOpen((prev) => {
      const next = !prev;
      if (next) bringClockToFront();
      return next;
    });
  }, [bringClockToFront]);

  const { settings, updateSetting, resetSettings, keyboardLanguage, toggleKeyboardLanguage } = useAppSettings();
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

  const turndown = useMemo(() => {
    return createTurndownService(assetBlobUrlMap.current);
  }, []);

  const isLikelyHtml = (text: string) => /<\/?[a-z][\s\S]*>/i.test(text);
  
  const getContentFormat = (): "plain" | "markdown" | "html" => {
    if (note?.contentFormat) return note.contentFormat;
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
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
      return typeof text === "string" ? text : "";
    }
    if (typeof text !== "string" || !text.trim()) {
      if (isTxt) return "<p></p>";
      return baseTitle ? `<h1>${escHtml(baseTitle)}</h1>` : "<h1></h1>";
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
    cleanText = cleanText.replace(/^\r?\n/, "");

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
    return editorHtml.replace(/>\s+</g, "><");
  };

  /** Convert one task-list line/element to a Tiptap taskItem <li> string */
  const toTaskItemHtml = (isChecked: boolean, text: string) =>
    `<li data-type="taskItem" data-checked="${isChecked}">` +
    `<label contenteditable="false"><input type="checkbox"${isChecked ? " checked" : ""}><span></span></label>` +
    `<div><p>${text}</p></div>` +
    `</li>`;

  /** Convert a DOM tree's GFM / legacy task list items to Tiptap's native format */
  const migrateDomTaskLists = (root: HTMLElement) => {
    // Handle legacy HTML saved before this fix (<li class="task-list-item">)
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
      li.replaceWith(tpl.content.firstChild!);
    });

    // Handle marked GFM output (<li> with <input type="checkbox"> child)
    root.querySelectorAll("li").forEach((li) => {
      const checkbox = li.querySelector('input[type="checkbox"]');
      if (!checkbox || li.getAttribute("data-type") === "taskItem") return;
      const isChecked = (checkbox as HTMLInputElement).checked;
      checkbox.remove();
      const inner = ((li as HTMLElement).innerHTML || "").trim();
      const tpl = document.createElement("template");
      tpl.innerHTML = toTaskItemHtml(isChecked, inner || "<p></p>");
      li.replaceWith(tpl.content.firstChild!);
    });

    // Re-tag any <ul> that now contains taskItems
    root.querySelectorAll("ul").forEach((ul) => {
      if (ul.querySelector('li[data-type="taskItem"]')) {
        ul.setAttribute("data-type", "taskList");
        ul.removeAttribute("class");
      }
    });
  };

  const prepareDomForEditor = (root: HTMLElement) => {
    migrateDomTaskLists(root);

    // Clean up extra leading/trailing newlines in code blocks from marked output and ensure no double HTML entity encoding
    root.querySelectorAll("pre code, pre").forEach((el) => {
      if (el.tagName === "CODE" || (el.tagName === "PRE" && !el.querySelector("code"))) {
        const rawText = (el.textContent || "").replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
        // Cleanly set innerHTML to escHtml so DOM Parser reads exact unescaped characters with zero double-escaping
        el.innerHTML = escHtml(rawText);
      }
    });

    // Unwrap paragraphs containing audio elements or image elements to ensure they are parsed as top-level block nodes
    root.querySelectorAll("p").forEach((p) => {
      if (p.closest("table, td, th")) return;
      const audio = p.querySelector("audio");
      if (audio) {
        if (p.children.length === 1 && !p.textContent?.trim()) {
          p.replaceWith(audio);
        } else {
          p.parentElement?.insertBefore(audio, p);
          if (!p.textContent?.trim() && !p.children.length) {
            p.remove();
          }
        }
      }
      const img = p.querySelector("img");
      if (img) {
        if (p.children.length === 1 && !p.textContent?.trim()) {
          p.replaceWith(img);
        } else {
          p.querySelectorAll("br").forEach((br) => {
            if (br.nextElementSibling === img || br.previousElementSibling === img || !br.nextSibling || br.nextSibling === img) {
              br.remove();
            }
          });
          if (p.contains(img)) {
            p.after(img);
          }
          if (!p.textContent?.trim() && !p.children.length) {
            p.remove();
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
        } catch {}
        img.setAttribute("data-relative-src", encodedRel);
        const cachedBlobUrl =
          assetBlobUrlMap.current.get(encodedRel) ||
          assetBlobUrlMap.current.get(decodedRel) ||
          assetBlobUrlMap.current.get(src);
        if (cachedBlobUrl) {
          img.setAttribute("src", cachedBlobUrl);
        }
      }
    });

    // Clean up empty paragraph before an image or audio if it was created by Markdown block splitting
    root.querySelectorAll("p").forEach((p) => {
      if (p.closest("table, td, th")) return;
      if (!p.textContent?.trim() && !p.querySelector("img, audio, input, label")) {
        const next = p.nextElementSibling;
        if (next && (next.tagName === "IMG" || next.tagName === "AUDIO")) {
          p.remove();
        }
      }
    });

    // Preserve spaces between inline code tags so ProseMirror DOMParser does not collapse the space and merge adjacent code marks
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

    // Convert inline hashtags (#tag) outside code blocks, headings, links into pill badges
    const inlineTagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n])/g;
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
              const colorClass = getTagColorClass(rawTag, settingsRef.current?.theme, undefined, settingsRef.current?.tagColorStyle);
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

    // Convert inline Wikilinks [[Target]] or [[Target|Alias]] outside code blocks / pre into internal links
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
  };

  const toEditorHtml = (text: string, isTxt: boolean = false, readingMode: boolean = isReadingMode): string => {
    if (!text) return isTxt ? "<p></p>" : "<p></p>";

    const temp = document.createElement("div");
    const format = isTxt ? "plain" : (note?.contentFormat ?? "markdown");

    if (format === "html") {
      temp.innerHTML = text;
    } else if (format === "plain") {
      const lines = text.split("\n");
      temp.innerHTML = lines.map((l) => `<p>${l ? l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "<br>"}</p>`).join("");
    } else {
      try {
        const textWithTableAttr = text.replace(/<table([\s>])/gi, '<table data-original-html-table="true"$1');
        const preprocessed = preprocessMarkdownForEditor(textWithTableAttr, readingMode);
        const parsed = marked.parse(preprocessed, { async: false, gfm: true, breaks: true });
        temp.innerHTML = typeof parsed === "string" ? parsed : text;
      } catch {
        temp.innerHTML = text;
      }
    }

    prepareDomForEditor(temp);
    const cleanHtml = temp.innerHTML
      .replace(/^\s*(?:<hr\s*\/?>\s*)?<p>\s*tags:\s*<\/p>\s*(?:<ul>[\s\S]*?<\/ul>|<ol>[\s\S]*?<\/ol>|\s*)*/i, "")
      .replace(/>\s+</g, "><");
    return cleanHtml;
  };

  const EDITOR_CLASSES =
    "w-full max-w-full break-words [overflow-wrap:anywhere] outline-none text-foreground [&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0 [&_.is-empty::before]:text-muted-foreground/40 [&_.is-empty::before]:content-[attr(data-placeholder)] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>h1:first-child]:text-2xl [&>h1:first-child]:font-semibold [&>h1:first-child]:leading-tight [&>h1:first-child]:md:text-3xl [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:md:text-3xl [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_h5]:text-sm [&_h5]:font-semibold [&_h6]:text-xs [&_h6]:font-semibold [&_h6]:text-muted-foreground [&_img]:my-0 [&_img]:h-auto [&_img]:max-w-full [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-0 [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-6 [&_details]:my-0 [&_details]:py-0 [&_details_summary]:my-0 [&_details_summary]:py-0" +
    " [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 [&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-0 [&_ul[data-type='taskList']_li_label]:w-6 [&_ul[data-type='taskList']_li_label]:h-7 [&_ul[data-type='taskList']_li_label]:shrink-0 [&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center [&_ul[data-type='taskList']_li_label]:justify-center [&_ul[data-type='taskList']_li_label_input]:h-[14px] [&_ul[data-type='taskList']_li_label_input]:w-[14px] [&_ul[data-type='taskList']_li_label_input]:bg-transparent [&_ul[data-type='taskList']_li_label_input]:rounded-[3px] [&_ul[data-type='taskList']_li_label_input]:border [&_ul[data-type='taskList']_li_label_input]:border-muted-foreground/50 [&_ul[data-type='taskList']_li_label_input]:cursor-pointer [&_ul[data-type='taskList']_li_label_input]:accent-primary [&_ul[data-type='taskList']_li_>_div]:flex-1 [&_ul[data-type='taskList']_li_>_div_p]:my-0 [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:line-through [&_ul[data-type='taskList']_li[data-checked='true']_>_div_p]:text-muted-foreground/90" +
    " [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:max-w-full [&_.tableWrapper]:my-4 [&_table]:my-0 [&_table]:w-[70%] max-md:[&_table]:w-full [&_td]:border [&_td]:border-border/60 [&_td]:py-2 [&_td]:px-3 [&_td]:relative [&_th]:border [&_th]:border-border/60 [&_th]:py-2 [&_th]:px-3 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left [&_td_p]:my-0 [&_td_p]:leading-normal [&_th_p]:my-0 [&_th_p]:leading-normal" +
    " [&_.footnote-ref]:text-primary [&_.footnote-ref]:no-underline hover:[&_.footnote-ref]:underline [&_.footnote-ref]:font-medium [&_.footnote-ref]:cursor-pointer [&_sup]:text-[0.75em] [&_sup]:leading-none [&_sup]:align-super [&_sub]:text-[0.75em] [&_sub]:leading-none [&_sub]:align-sub [&_.footnote-def]:text-sm [&_.footnote-def]:text-muted-foreground [&_.footnote-def]:my-1 [&_.footnote-backref]:text-primary [&_.footnote-backref]:no-underline hover:[&_.footnote-backref]:underline [&_.footnote-backref]:font-medium [&_.footnote-backref]:cursor-pointer";

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
  const openImageDialogRef = useRef<(() => void) | null>(null);
  const openWorkspaceImageDialogRef = useRef<(() => void) | null>(null);
  const triggerImageUploadRef = useRef<(() => void) | null>(null);
  const openAudioRecorderRef = useRef<(() => void) | null>(null);
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
  }, [t, isMobile, note]);

  const executeSlashCommand = useCallback(
    (editorInstance: TiptapEditor, item: SlashMenuItem) => {
      if (slashMenuStateRef.current.slashRange) {
        const { from, to } = slashMenuStateRef.current.slashRange;
        editorInstance.chain().focus().deleteRange({ from, to }).run();
      }
      slashMenuStateRef.current.open = false;
      setSlashMenuState((prev) => ({ ...prev, open: false }));
      item.action(editorInstance, {
        openLinkDialog: () => openLinkDialogRef.current?.(),
        openImageDialog: () => openImageDialogRef.current?.(),
        openWorkspaceImageDialog: () => openWorkspaceImageDialogRef.current?.(),
        triggerImageUpload: () => triggerImageUploadRef.current?.(),
        openAudioRecorder: () => openAudioRecorderRef.current?.(),
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
        coords: { top: coords.bottom + window.scrollY, left: coords.left + window.scrollX },
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
    [t, executeSlashCommand],
  );

  const [editorTick, setEditorTick] = useState(0);
  const tickRafRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const scheduleEditorTick = useCallback(() => {
    if (tickRafRef.current !== null) return;
    const now = Date.now();
    const elapsed = now - lastTickTimeRef.current;
    if (elapsed >= 350) {
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
      }, 350 - elapsed);
    }
  }, []);

  const processAndInsertImageFileRef = useRef<((file: File) => Promise<void>) | null>(null);
  const debouncedContentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedVersionSnapshotTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveContentRef = useRef<{ id: string; content: string } | null>(null);
  const userEditedRef = useRef(false);
  const editorInstanceRef = useRef<TiptapEditor | null>(null);

  const editorScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const restoreScrollPosition = useCallback((noteId: string) => {
    if (!noteId) return;
    const targetTop = getNoteScrollPosition(noteId);
    
    const applyScroll = () => {
      if (editorScrollContainerRef.current) {
        editorScrollContainerRef.current.scrollTop = targetTop;
      }
    };

    applyScroll();
    requestAnimationFrame(applyScroll);
    setTimeout(applyScroll, 25);
    setTimeout(applyScroll, 75);
    setTimeout(applyScroll, 150);
  }, []);

  const handleEditorScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!note?.id) return;
    const top = e.currentTarget.scrollTop;
    setNoteScrollPosition(note.id, top);
  }, [note?.id]);

  const serializeEditorContent = useCallback((targetNote: Note, instance: TiptapEditor): string => {
    if (isTxtFile(targetNote)) {
      return getPlainTextFromHtml(instance.getHTML());
    }
    const html = instance.getHTML();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    // Strip reading-mode footnote section and separator if any are present in the DOM
    temp.querySelectorAll("section.footnotes, [data-footnotes], hr.footnotes-sep").forEach((el) => el.remove());
    const firstChild = temp.firstElementChild;
    if (firstChild && firstChild.tagName.toLowerCase() === "h1") {
      firstChild.remove();
    }
    return normalizeSerializedMarkdown(turndown.turndown(temp.innerHTML));
  }, [isTxtFile, turndown]);

  const flushDebouncedContentSave = useCallback(() => {
    if (debouncedContentSaveTimeoutRef.current) {
      clearTimeout(debouncedContentSaveTimeoutRef.current);
      debouncedContentSaveTimeoutRef.current = null;
    }
    if (userEditedRef.current && noteRef.current) {
      const currentNote = noteRef.current;
      let contentToSave = pendingSaveContentRef.current?.content;
      if ((contentToSave === undefined || contentToSave === null) && editorInstanceRef.current) {
        try {
          contentToSave = serializeEditorContent(currentNote, editorInstanceRef.current);
        } catch {
          // fallback
        }
      }
      pendingSaveContentRef.current = null;
      if (contentToSave !== undefined && contentToSave !== null) {
        onUpdate(currentNote.id, { content: contentToSave });
      }
      userEditedRef.current = false;
    } else if (!userEditedRef.current) {
      pendingSaveContentRef.current = null;
    }
  }, [onUpdate, serializeEditorContent]);

  const navigateFootnoteOrAnchor = useCallback((clickedEl: HTMLElement, container: HTMLElement | null): boolean => {
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

    if (!cleanId) return false;

    const rootEl = container || editorScrollContainerRef.current || document;
    let targetEl: HTMLElement | null = null;

    if (isCitation) {
      // User clicked citation [1] in text -> jump down to definition at bottom (or in-place)
      targetEl =
        (rootEl.querySelector(`[data-footnote-def="${cleanId}"]`) as HTMLElement) ||
        (rootEl.querySelector(`[data-footnote-backref="${cleanId}"]`) as HTMLElement) ||
        (rootEl.querySelector(`[data-footnote-target="${cleanId}"]`) as HTMLElement) ||
        (rootEl.querySelector(`[id="fn-${cleanId}"]`) as HTMLElement) ||
        (rootEl.querySelector(`[data-footnote-id="${cleanId}"]`) as HTMLElement) ||
        (document.getElementById(`fn-${cleanId}`));
    } else {
      // User clicked return arrow ↩ (or [^1]:) -> jump back up to citation [1] in text
      targetEl =
        (rootEl.querySelector(`[data-footnote-ref="${cleanId}"]`) as HTMLElement) ||
        (rootEl.querySelector(`[id="fnref-${cleanId}"]`) as HTMLElement) ||
        (document.getElementById(`fnref-${cleanId}`));
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
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        paragraph: false,
        dropcursor: {
          color: "hsl(var(--border))",
          width: 1,
          class: "prosemirror-dropcursor",
        },
      }),
      Paragraph.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            id: {
              default: null,
              parseHTML: (element) => element.getAttribute("id"),
              renderHTML: (attributes) => {
                if (!attributes.id) return {};
                return { id: attributes.id };
              },
            },
            "data-footnote-def": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-footnote-def"),
              renderHTML: (attributes) => {
                if (!attributes["data-footnote-def"]) return {};
                return { "data-footnote-def": attributes["data-footnote-def"] };
              },
            },
          };
        },
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockNodeView);
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
      InlineCodeHighlight.configure({
        enabled: settings.highlightInlineCode === true,
      }),
      SmartTypography.configure({
        enabled: settings.smartTypography !== false,
      }),
      Underline,
      Highlight,
      Superscript,
      Subscript,
      Toggle,
      TaskList,
      TaskItem,
      AudioExtension,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      IndentKeymap,
      Link.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
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
        autolink: settings.smartTypography !== false,
        validate: () => true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
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
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView);
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

          // If slash was typed in focused line, show "Type to search..."
          const text = node.textContent;
          if (hasAnchor && text.startsWith("/")) {
            return tRef.current("editor.typeToSearch");
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
      attributes: {
        spellcheck: "false",
        style: `font-size:${editorFontSize}px;line-height:${settings.lineHeight};`,
        class: `${EDITOR_CLASSES} ${isReadingMode ? "luno-reading-view" : ""} ${
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
              title: t("editor.noteNotFound") || "Note not found",
              description: `[[${wikilinkTarget}]]`,
            });
            return true;
          }
        }

        if (navigateFootnoteOrAnchor(target, (view.dom.closest(".luno-editor-container") || view.dom.parentElement || document) as HTMLElement)) {
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
            } else if (window.electronAPI?.openExternal) {
              void window.electronAPI.openExternal(href);
            } else {
              window.open(href, "_blank", "noopener,noreferrer");
            }
          } else if (window.electronAPI?.openExternal) {
            void window.electronAPI.openExternal(href);
          } else {
            window.open(href, "_blank", "noopener,noreferrer");
          }
          return true;
        }

        return false;
      },
      handleDrop: (_view, event) => {
        if (event.dataTransfer) {
          const files = event.dataTransfer.files;
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file && file.type.startsWith("image/")) {
                event.preventDefault();
                void processAndInsertImageFileRef.current?.(file);
                return true;
              }
            }
          }
          const items = event.dataTransfer.items;
          if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item && item.kind === "file" && item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                  event.preventDefault();
                  void processAndInsertImageFileRef.current?.(file);
                  return true;
                }
              }
            }
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        if (event.clipboardData) {
          const files = event.clipboardData.files;
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file && file.type.startsWith("image/")) {
                event.preventDefault();
                void processAndInsertImageFileRef.current?.(file);
                return true;
              }
            }
          }
          const items = event.clipboardData.items;
          if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item && item.kind === "file" && item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                  event.preventDefault();
                  void processAndInsertImageFileRef.current?.(file);
                  return true;
                }
              }
            }
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
      } else {
        // Ensure initial editor state has a clean history (undoDepth: 0)
        const cleanState = EditorState.create({
          doc: instance.state.doc,
          plugins: instance.state.plugins,
        });
        instance.view.updateState(cleanState);
        if (note?.id) {
          noteEditorStateMap.set(note.id, instance.state);
        }
      }
    },
    onBlur: () => {
      if (note?.id && editor?.state) {
        noteEditorStateMap.set(note.id, editor.state);
      }
      flushPendingRename();
      flushDebouncedContentSave();
    },
    onSelectionUpdate: ({ editor: instance }) => {
      checkSlashCommand(instance);
      scheduleEditorTick();
      if (note?.id) {
        noteEditorStateMap.set(note.id, instance.state);
      }
      const { from } = instance.state.selection;
      if (from > (instance.state.doc.firstChild?.nodeSize ?? 0)) {
        flushPendingRename();
      }
    },
    onUpdate: ({ editor: instance }) => {
      checkSlashCommand(instance);
      scheduleEditorTick();
      if (note?.id) {
        noteEditorStateMap.set(note.id, instance.state);
      }
      if (isReadingMode || !note || syncingFromNote.current || isNoteDeleted(note.id)) return;
      if (loadingNoteIdRef.current === note.id) return;
      userEditedRef.current = true;
      if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== note.id) return;
      if (note.fileType === "image" || note.fileType === "binary" || isHtmlFile(note) || isTxtFile(note)) return;

      const doc = instance.state.doc;
      const firstChild = doc.firstChild;
      let firstH1Text = "";
      if (firstChild && firstChild.type.name === "heading" && firstChild.attrs?.level === 1) {
        firstH1Text = (firstChild.textContent || "").trim();
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
              }, 800);
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
        if (userEditedRef.current && noteRef.current) {
          const currentNote = noteRef.current;
          const savedContent = serializeEditorContent(currentNote, instance);
          pendingSaveContentRef.current = { id: currentNote.id, content: savedContent };
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
          pendingSaveContentRef.current = null;
          setLastEditedTime(Date.now());
          onUpdate(currentNote.id, { content: savedContent });
          userEditedRef.current = false;

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
        } else if (!userEditedRef.current) {
          pendingSaveContentRef.current = null;
        }
        if (!settings.autoSave) {
          setSaveStatus("unsaved");
          return;
        }
        setSaveStatus("auto_saving");
        scheduleAutoSaveDiskRef.current?.();
      }, 1000);
    },
  });

  editorInstanceRef.current = editor;

  const toggleTranslator = useCallback(() => {
    setTranslatorOpen((prev) => {
      const next = !prev;
      if (next) {
        bringTranslatorToFront();
        if (editor && !editor.state.selection.empty) {
          const selectedText = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            " ",
            " ",
          );
          setTranslatorInitialText(selectedText);
        } else {
          setTranslatorInitialText("");
        }
      }
      return next;
    });
  }, [editor, bringTranslatorToFront]);

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
    setTranslatorInitialText(selectedText);
    bringTranslatorToFront();
    setTranslatorOpen(true);
  }, [editor, bringTranslatorToFront]);

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
      if (selectedText) {
        const suggestions = getSpellingSuggestions(selectedText);
        if (suggestions.length > 0) {
          setContextSpellData({
            word: selectedText,
            suggestions,
            from: selFrom,
            to: selTo,
          });
          return;
        }
      }
    }

    // 2. Find position under mouse cursor
    const view = editor.view;
    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!pos) {
      setContextSpellData(null);
      return;
    }
    const $pos = view.state.doc.resolve(pos.pos);
    const parentText = $pos.parent.textContent;
    const offsetInParent = $pos.parentOffset;
    const parentStartPos = $pos.start();
    if (!parentText) {
      setContextSpellData(null);
      return;
    }

    // 3. Try Intl.Segmenter (word level segmentation for Thai/English)
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      try {
        const segmenter = new (Intl as any).Segmenter(["th", "en"], { granularity: "word" });
        for (const seg of segmenter.segment(parentText)) {
          if (seg.isWordLike) {
            const start = seg.index;
            const end = seg.index + seg.segment.length;
            if (offsetInParent >= start && offsetInParent <= end) {
              const suggestions = getSpellingSuggestions(seg.segment);
              if (suggestions.length > 0) {
                setContextSpellData({
                  word: seg.segment,
                  suggestions,
                  from: parentStartPos + start,
                  to: parentStartPos + end,
                });
                return;
              }
            }
          }
        }
      } catch {
        // continue to next detection strategy
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
      const start = anomalyMatch.index;
      const end = anomalyMatch.index + anomalyMatch[0].length;
      if (offsetInParent >= start - 1 && offsetInParent <= end + 1) {
        const anomaly = anomalyMatch[0];
        const suggestions = getSpellingSuggestions(anomaly);
        if (suggestions.length > 0) {
          setContextSpellData({
            word: anomaly,
            suggestions,
            from: parentStartPos + start,
            to: parentStartPos + end,
          });
          return;
        }
      }
    }

    // 5. English / latin word regex boundary around offset
    const latinWordRegex = /[A-Za-z0-9_']+/g;
    let match: RegExpExecArray | null;
    while ((match = latinWordRegex.exec(parentText)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (offsetInParent >= start && offsetInParent <= end) {
        const word = match[0];
        const suggestions = getSpellingSuggestions(word);
        if (suggestions.length > 0) {
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
    let syntaxLabel = t("editor.formatMarkdown") || "Markdown";
    const fileName = note?.fileName?.toLowerCase() ?? "";
    if (fileName.endsWith(".html") || note?.contentFormat === "html") {
      syntaxLabel = "HTML";
    } else if (fileName.endsWith(".txt")) {
      syntaxLabel = t("editor.formatText") || "Plain Text";
    }

    const currentFontSize = settings.editorFontSize || editorFontSize || 15;
    const zoom = Math.round((currentFontSize / 15) * 100);

    if (note?.contentFormat === "html") {
      const textContent = note?.content || "";
      const charCount = countCharacters(textContent);
      const wordCount = countWords(textContent);
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      return {
        line: htmlCursor.line,
        col: htmlCursor.col,
        charCount,
        wordCount,
        readingTime,
        syntaxLabel: "HTML",
        zoom,
      };
    }

    if (!editor) {
      const charCount = note?.content ? countCharacters(note.content) : 0;
      const wordCount = note?.content ? countWords(note.content) : 0;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      return {
        line: 1,
        col: 1,
        charCount,
        wordCount,
        readingTime,
        syntaxLabel,
        zoom,
      };
    }

    const { selection, doc } = editor.state;
    const pos = selection.$from.pos;
    const textBefore = doc.textBetween(0, pos, "\n", "\n");
    const lines = textBefore.split("\n");
    const line = lines.length;
    const col = (lines[lines.length - 1]?.length ?? 0) + 1;
    const textContent = doc?.textContent || "";
    const charCount = countCharacters(textContent);
    const wordCount = countWords(textContent);
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      line,
      col,
      charCount,
      wordCount,
      readingTime,
      syntaxLabel,
      zoom,
    };
  }, [editor, editorTick, note, editorFontSize, settings.editorFontSize, htmlCursor]);

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

  const saveLinkedFileToDisk = useCallback(async () => {
    if (!note || !editor || !settings.autoSave) return;
    if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== note.id) return;
    if (note.fileType === "image" || note.fileType === "binary") return;
    if (deletedNoteIdsRef.current.has(note.id) || isNoteDeleted(note.id)) return;
    if (Array.isArray(notes) && !notes.some((n) => n.id === note.id)) return;

    const opId = ++saveOpIdRef.current;
    setSaveStatus("auto_saving");

    const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
    if (relPath && isRelativePathDeleted(relPath)) {
      if (saveOpIdRef.current === opId) {
        setSaveStatus("auto_saved");
      }
      return;
    }

    try {
      const ext = getPreferredExtension() as "md" | "txt" | "html";
      const content = getContentToSave(ext);
      await performSave(content, ext, true);
    } catch {
      if (saveOpIdRef.current === opId) {
        setSaveStatus("failed");
      }
    }
  }, [note, editor, settings.autoSave, notes]);

  const scheduleAutoSaveDisk = useCallback(() => {
    if (autoSaveDiskTimeoutRef.current) {
      clearTimeout(autoSaveDiskTimeoutRef.current);
    }
    autoSaveDiskTimeoutRef.current = setTimeout(() => {
      void saveLinkedFileToDisk();
    }, 200);
  }, [saveLinkedFileToDisk]);

  useEffect(() => {
    scheduleAutoSaveDiskRef.current = scheduleAutoSaveDisk;
  }, [scheduleAutoSaveDisk]);

  const prevTagsStrRef = useRef<string>("");
  useEffect(() => {
    if (!note) return;
    const currentTagsStr = JSON.stringify(note.tags || []);
    if (prevTagsStrRef.current && prevTagsStrRef.current !== currentTagsStr) {
      scheduleAutoSaveDiskRef.current?.();
    }
    prevTagsStrRef.current = currentTagsStr;
  }, [note?.tags]);

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
  }, [editor, editorTick, settings.showCodeLineNumbers, note?.content]);

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
    } catch {}
  }, [editor, settings.theme, settings.tagColorStyle]);

  // Dynamically sync SmartTypography and autolink when changed in settings
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    try {
      const linkExt = editor.extensionManager.extensions.find((e) => e.name === "link");
      if (linkExt) {
        linkExt.options.autolink = settings.smartTypography !== false;
      }
      const typoExt = editor.extensionManager.extensions.find((e) => e.name === "smartTypography");
      if (typoExt) {
        typoExt.options.enabled = settings.smartTypography !== false;
      }
    } catch {}
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
      flushDebouncedContentSave();
      if (pendingSaveContentRef.current) {
        const { id, content } = pendingSaveContentRef.current;
        pendingSaveContentRef.current = null;
        onUpdate(id, { content });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [flushPendingRename, flushDebouncedContentSave, onUpdate]);

  type SaveStatus =
    | "saved"
    | "auto_saved"
    | "manually_saved"
    | "saving"
    | "auto_saving"
    | "unsaved"
    | "failed"
    | "unavailable";

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastEditedTime, setLastEditedTime] = useState<number | null>(null);
  const saveOpIdRef = useRef(0);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [statusPortalTarget, setStatusPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const actionId = `breadcrumb-editor-actions-${paneId}`;
    const statusId = `breadcrumb-save-status-${paneId}`;

    let interval: ReturnType<typeof setInterval> | null = null;

    const findTargets = () => {
      const target = document.getElementById(actionId);
      if (target) {
        setPortalTarget((prev) => (prev !== target ? target : prev));
      }
      const statusTarget = document.getElementById(statusId);
      if (statusTarget) {
        setStatusPortalTarget((prev) => (prev !== statusTarget ? statusTarget : prev));
      }
      if (target && statusTarget && interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    findTargets();
    interval = setInterval(findTargets, 300);

    const observer = new MutationObserver(findTargets);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (interval) clearInterval(interval);
      observer.disconnect();
    };
  }, [paneId]);

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
    if (!editor || !note) return;

    if ((note.isLocked && !note.isDecrypted) || isEncryptedNote(note.content)) {
      editorActiveNoteIdRef.current = null;
      noteEditorStateMap.delete(note.id);
      return;
    }

    const baseTitle = getBaseTitle(note);

    // If editor is already showing content for this exact active note, sync Title H1 if fileName was changed externally
    if (editorActiveNoteIdRef.current === note.id) {
      if (!isTxtFile(note)) {
        const firstChild = editor.state.doc.firstChild;
        if (firstChild && firstChild.type.name === "heading" && firstChild.attrs?.level === 1) {
          const currentH1 = (firstChild.textContent || "").trim();
          if (baseTitle && currentH1 !== baseTitle) {
            syncingFromNote.current = true;
            const tr = editor.state.tr;
            const from = 1;
            const to = 1 + firstChild.nodeSize - 2;
            tr.replaceWith(from, to, editor.schema.text(baseTitle));
            editor.view.dispatch(tr);
            syncingFromNote.current = false;
          }
        }
      }
      return;
    }

    if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== note.id) {
      if (debounceRenameTimeoutRef.current) {
        clearTimeout(debounceRenameTimeoutRef.current);
        debounceRenameTimeoutRef.current = null;
      }
      pendingRenameRef.current = null;
    }

    if (isHtmlFile(note)) {
      if (debounceRenameTimeoutRef.current) {
        clearTimeout(debounceRenameTimeoutRef.current);
        debounceRenameTimeoutRef.current = null;
      }
      pendingRenameRef.current = null;
      editorActiveNoteIdRef.current = note.id;
      return;
    }

    // Save previous active note's state and scroll position into map before switching to new note
    if (editorActiveNoteIdRef.current && editorActiveNoteIdRef.current !== note.id) {
      const prevId = editorActiveNoteIdRef.current;
      if (!closedNoteIds.has(prevId)) {
        if (editor.state) {
          noteEditorStateMap.set(prevId, editor.state);
        }
        if (editorScrollContainerRef.current) {
          setNoteScrollPosition(prevId, editorScrollContainerRef.current.scrollTop);
        }
      }
    }

    // Since this note is now active and being viewed/edited, remove it from closedNoteIds
    closedNoteIds.delete(note.id);

    // Check if this note already has a preserved editor state (from an open tab)
    const savedState = noteEditorStateMap.get(note.id);
    if (savedState) {
      syncingFromNote.current = true;
      editorActiveNoteIdRef.current = note.id;
      editor.view.updateState(savedState);
      syncingFromNote.current = false;
      loadingNoteIdRef.current = null;
      setEditorTick((v) => v + 1);
      restoreScrollPosition(note.id);
      return;
    }

    loadingNoteIdRef.current = note.id;
    let noteContent = note.content ?? "";
    if (!noteContent.trim()) {
      try {
        const backup = localStorage.getItem(`luno_backup_${note.id}`) ||
                       (note.fileName ? localStorage.getItem(`luno_backup_fn_${note.fileName}`) : null);
        if (backup && backup.trim()) {
          noteContent = backup;
        }
      } catch {
        /* ignore */
      }
    }
    const parsed = parseEditorContent(noteContent, baseTitle, isTxtFile(note), isHtmlFile(note));

    syncingFromNote.current = true;
    editorActiveNoteIdRef.current = note.id;
    (editor.commands.setContent as any)(parsed as string, false, { preserveWhitespace: "full" });
    void resolveRelativeImagesInEditor(editor);

    if (!isTxtFile(note)) {
      const firstChild = editor.state.doc.firstChild;
      if (firstChild && firstChild.type.name === "heading" && firstChild.attrs?.level === 1) {
        const currentH1 = (firstChild.textContent || "").trim();
        if (baseTitle && currentH1 !== baseTitle) {
          const tr = editor.state.tr;
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
    noteEditorStateMap.set(note.id, editor.state);

    setEditorTick((v) => v + 1);
    syncingFromNote.current = false;
    loadingNoteIdRef.current = null;
    restoreScrollPosition(note.id);
  }, [editor, note?.id, note?.content, note?.fileName, note?.title, getBaseTitle, restoreScrollPosition]);

  useEffect(() => {
    return () => {
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
      if (pendingSaveContentRef.current) {
        const pending = pendingSaveContentRef.current;
        pendingSaveContentRef.current = null;
        if (userEditedRef.current && pending.id === note?.id) {
          onUpdate(pending.id, { content: pending.content });
        }
        userEditedRef.current = false;
      }
    };
  }, [note?.id, onUpdate]);

  // Save active note state on unmount & flush pending save
  useEffect(() => {
    return () => {
      if (note?.id && !closedNoteIds.has(note.id)) {
        if (editor && !editor.isDestroyed) {
          noteEditorStateMap.set(note.id, editor.state);
        }
        if (editorScrollContainerRef.current) {
          setNoteScrollPosition(note.id, editorScrollContainerRef.current.scrollTop);
        }
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
      if (editorActiveNoteIdRef.current && editor && !editor.isDestroyed) {
        if (pendingSaveContentRef.current) {
          const { id, content } = pendingSaveContentRef.current;
          pendingSaveContentRef.current = null;
          onUpdate(id, { content });
        }
      }
    };
  }, [editor, onUpdate, note?.id]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      parseOptions: {
        preserveWhitespace: "full",
      },
      editorProps: {
        attributes: {
          style: `font-size:${editorFontSize}px;line-height:${settings.lineHeight};`,
          class: `${EDITOR_CLASSES} ${isReadingMode ? "luno-reading-view" : ""} ${
            settings.accentHeadings
              ? "[&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary [&>h1:first-child]:text-primary"
              : "[&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-muted-foreground [&>h1:first-child]:text-foreground"
          }`,
          spellcheck: "false",
        },
      },
    });
    if (editor?.view?.dom) {
      editor.view.dom.setAttribute("spellcheck", "false");
    }
  }, [editor, editorFontSize, settings.lineHeight, settings.accentHeadings, isReadingMode]);

  const isFirstReadingModeEffectRef = useRef(true);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!isReadingMode);
    if (isFirstReadingModeEffectRef.current) {
      isFirstReadingModeEffectRef.current = false;
      return;
    }
    if (!note) return;
    const rawContent = noteRef.current?.content ?? note.content ?? "";
    const isTxt = isTxtFile(note);
    const isHtml = isHtmlFile(note);
    const baseTitle = getBaseTitle(note);
    const parsed = parseEditorContent(rawContent, baseTitle, isTxt, isHtml, isReadingMode);
    const prevScroll = editorScrollContainerRef.current?.scrollTop;
    (editor.commands.setContent as any)(parsed as string, false, { preserveWhitespace: "full" });
    if (typeof prevScroll === "number" && editorScrollContainerRef.current) {
      editorScrollContainerRef.current.scrollTop = prevScroll;
    }
  }, [editor, isReadingMode, note?.id, getBaseTitle]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.extensionManager.extensions.forEach((ext) => {
      if (ext.name === "spellCheckDecoration") {
        ext.options.enabled = spellCheckEnabled;
      }
    });
    editor.view.dispatch(editor.state.tr);
  }, [editor, spellCheckEnabled]);


  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(editor.state.tr);
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
  // Custom events for calculator and clock toggle
  useEffect(() => {
    const handleToggleCalc = () => {
      setCalculatorOpen((prev) => {
        if (!prev) bringCalculatorToFront();
        return !prev;
      });
    };
    const handleToggleClock = () => {
      setClockOpen((prev) => {
        if (!prev) bringClockToFront();
        return !prev;
      });
    };
    const handleToggleTranslator = () => {
      toggleTranslator();
    };

    window.addEventListener("app:toggle-calculator", handleToggleCalc);
    window.addEventListener("app:toggle-clock", handleToggleClock);
    window.addEventListener("app:toggle-translator", handleToggleTranslator);
    return () => {
      window.removeEventListener("app:toggle-calculator", handleToggleCalc);
      window.removeEventListener("app:toggle-clock", handleToggleClock);
      window.removeEventListener("app:toggle-translator", handleToggleTranslator);
    };
  }, [bringCalculatorToFront, bringClockToFront, toggleTranslator]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      const key = e.key ? e.key.toLowerCase() : "";
      const code = e.code || "";

      // Ctrl + S (Save Note)
      if ((key === "s" || code === "KeyS") && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        handleSaveFile();
        return;
      }

      // Ctrl + Shift + C (Toggle Calculator)
      if (e.shiftKey && (key === "c" || code === "KeyC")) {
        e.preventDefault();
        e.stopPropagation();
        setCalculatorOpen((prev) => {
          if (!prev) bringCalculatorToFront();
          return !prev;
        });
        return;
      }

      // Ctrl + Shift + T (Toggle Clock)
      if (e.shiftKey && (key === "t" || code === "KeyT")) {
        e.preventDefault();
        e.stopPropagation();
        setClockOpen((prev) => {
          if (!prev) bringClockToFront();
          return !prev;
        });
        return;
      }

      // Ctrl + Shift + L (Fix Mistyped Language TH/EN)
      if (e.shiftKey && (key === "l" || code === "KeyL")) {
        e.preventDefault();
        e.stopPropagation();
        handleFixLanguage();
        return;
      }

      // Ctrl + B (Bold Text)
      if ((key === "b" || code === "KeyB") && !e.shiftKey && !e.altKey) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleBold().run();
        }
        return;
      }

      // Ctrl + I (Italic Text)
      if ((key === "i" || code === "KeyI") && !e.shiftKey && !e.altKey) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleItalic().run();
        }
        return;
      }

      // Ctrl + U (Underline Text)
      if ((key === "u" || code === "KeyU") && !e.shiftKey && !e.altKey) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleUnderline().run();
        }
        return;
      }

      // Ctrl + Shift + X or Alt + Shift + 5 (Strikethrough)
      if ((e.shiftKey && (key === "x" || code === "KeyX")) || (e.altKey && e.shiftKey && (key === "5" || code === "Digit5"))) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleStrike().run();
        }
        return;
      }

      // Ctrl + Shift + H (Highlight Text)
      if (e.shiftKey && (key === "h" || code === "KeyH")) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleHighlight().run();
        }
        return;
      }

      // Ctrl + Shift + E or Ctrl + ` (Inline Code)
      if ((e.shiftKey && (key === "e" || code === "KeyE")) || key === "`" || code === "Backquote") {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleCode().run();
        }
        return;
      }

      // Ctrl + Shift + 7 (Numbered List)
      if (e.shiftKey && (key === "7" || code === "Digit7" || code === "Numpad7")) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleOrderedList().run();
        }
        return;
      }

      // Ctrl + Shift + 8 (Bullet List)
      if (e.shiftKey && (key === "8" || key === "*" || code === "Digit8" || code === "Numpad8")) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleBulletList().run();
        }
        return;
      }

      // Ctrl + Shift + 9 (Task / Todo List)
      if (e.shiftKey && (key === "9" || code === "Digit9" || code === "Numpad9")) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleTaskList().run();
        }
        return;
      }

      // Ctrl + Shift + Q (Blockquote)
      if (e.shiftKey && (key === "q" || code === "KeyQ")) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleBlockquote().run();
        }
        return;
      }

      // Ctrl + Alt + C (Code Block)
      if (e.altKey && (key === "c" || code === "KeyC")) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleCodeBlock().run();
        }
        return;
      }

      // Ctrl + K (Insert / Edit Link in Editor)
      if ((key === "k" || code === "KeyK") && !e.shiftKey && !e.altKey) {
        if (editor && !editor.isDestroyed && editor.isFocused) {
          e.preventDefault();
          e.stopPropagation();
          handleOpenLinkDialog();
          return;
        }
      }

      // Ctrl + Shift + N (Clear Formatting)
      if (e.shiftKey && (key === "n" || code === "KeyN")) {
        if (editor && !editor.isDestroyed) {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().unsetAllMarks().clearNodes().run();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [note, editor, bringCalculatorToFront, bringClockToFront, handleSaveFile]);
  const showUiAlert = (message: string) => setAlertMessage(message);
  const countMappable = (text: string, map: Record<string, string>) => [...text].reduce((count, ch) => count + (map[ch] ? 1 : 0), 0);
  const convertWithMap = (text: string, map: Record<string, string>) => [...text].map((ch) => map[ch] ?? ch).join("");

  const rememberSelection = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    editorSelectionRef.current = { from, to };
  };

  const getFocusedChain = () => {
    if (!editor) return null;

    let chain = editor.chain().focus();
    if (editorSelectionRef.current) {
      chain = chain.setTextSelection(editorSelectionRef.current);
    }

    return chain;
  };

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^(https?:|mailto:|tel:|data:|\/)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleFixLanguage = () => {
    if (!editor) return;
    const {
      from,
      to,
      empty,
    } = editor.state.selection;

    if (empty) {
      showUiAlert(t("editor.selectTextToFix"));
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, "\n", "\n");
    if (!selectedText.trim()) {
      showUiAlert(t("editor.selectTextToFix"));
      return;
    }

    const enToThScore = countMappable(selectedText, EN_TO_TH_KEYMAP);
    const thToEnScore = countMappable(selectedText, TH_TO_EN_KEYMAP);
    const map = enToThScore >= thToEnScore ? EN_TO_TH_KEYMAP : TH_TO_EN_KEYMAP;
    const convertedText = convertWithMap(selectedText, map);

    if (convertedText === selectedText) return;

    const tr = editor.state.tr.insertText(convertedText, from, to);
    editor.view.dispatch(tr);
    editor.chain().focus().setTextSelection({ from, to: from + convertedText.length }).run();
  };

  // AI Assistant states & handlers
  const [aiApiKeyModalOpen, setAiApiKeyModalOpen] = useState(false);
  const [aiResultModalOpen, setAiResultModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOutputText, setAiOutputText] = useState("");
  const [aiActionPending, setAiActionPending] = useState<AiActionType | null>(null);
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const [aiKeyInputValue, setAiKeyInputValue] = useState("");
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

  const handleAcceptDiff = useCallback(() => {
    if (!editor || !aiDiffState) return;
    const { from, to, proposedText } = aiDiffState;
    editor.chain().focus().insertContentAt({ from, to }, proposedText).run();
    setAiDiffState(null);
  }, [editor, aiDiffState]);

  const handleRejectDiff = useCallback(() => {
    setAiDiffState(null);
  }, []);

  const handleInsertBelowDiff = useCallback(() => {
    if (!editor || !aiDiffState) return;
    const { to, proposedText } = aiDiffState;
    editor.chain().focus().insertContentAt(to, `\n\n${proposedText}`).run();
    setAiDiffState(null);
  }, [editor, aiDiffState]);

  const handleAiAction = async (action: AiActionType) => {
    if (!editor) return;

    if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
      setAiActionPending(action);
      setAiKeyInputValue("");
      setAiErrorMsg("");
      setAiApiKeyModalOpen(true);
      return;
    }

    const { from, to } = editor.state.selection;
    let targetText = "";
    let selectionFrom = from;
    let selectionTo = to;

    if (from !== to) {
      targetText = editor.state.doc.textBetween(from, to, " ");
    } else {
      const currentNode = editor.state.selection.$from.parent;
      const nodeText = currentNode?.textContent || "";
      if (currentNode && nodeText.trim()) {
        targetText = nodeText.trim();
        selectionFrom = editor.state.selection.$from.start();
        selectionTo = editor.state.selection.$from.end();
      } else {
        targetText = (editor.getText() || "").trim();
        selectionFrom = 0;
        selectionTo = editor.state.doc.content.size;
      }
    }

    const trimmedTargetText = targetText.trim();

    if (!trimmedTargetText) {
      showUiAlert("โปรดเลือกหรือพิมพ์ข้อความที่ต้องการให้ผู้ช่วย AI ดำเนินการ");
      return;
    }

    setAiGenerating(true);
    setAiErrorMsg("");

    try {
      const { result, modelUsed } = await runGeminiAction(settings.geminiApiKey, action, trimmedTargetText, lang);
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
      if (msg.includes("Gemini API Key") || msg.includes("API key")) {
        setAiActionPending(action);
        setAiErrorMsg(msg);
        setAiKeyInputValue(settings.geminiApiKey);
        setAiApiKeyModalOpen(true);
      } else {
        showUiAlert(`เกิดข้อผิดพลาด AI: ${msg}`);
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveApiKeyFromModal = () => {
    const trimmed = aiKeyInputValue.trim();
    if (!trimmed) return;
    updateSetting("geminiApiKey", trimmed);
    setAiApiKeyModalOpen(false);
    if (aiActionPending) {
      const actionToRun = aiActionPending;
      setAiActionPending(null);
      setTimeout(() => {
        handleAiAction(actionToRun);
      }, 100);
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
        showUiAlert(t("editor.selectNoteFirst") || "Please select a note from your workspace.");
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
      } catch {}

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
      const chain = getFocusedChain();
      if (chain) {
        chain.setImage({ src: finalBlobUrl, alt: fileName, "data-relative-src": encodedRelPath } as any).run();
      }
    },
    [getFocusedChain]
  );

  const openAudioRecorder = useCallback(() => {
    rememberSelection();
    setAudioRecorderOpen((prev) => {
      const next = !prev;
      if (next) bringAudioRecorderToFront();
      return next;
    });
  }, [rememberSelection, bringAudioRecorderToFront]);

  const triggerImageUpload = useCallback(() => {
    rememberSelection();
    imageInputRef.current?.click();
  }, [rememberSelection]);

  useEffect(() => {
    openLinkDialogRef.current = openLinkDialog;
    openImageDialogRef.current = openImageDialog;
    openWorkspaceImageDialogRef.current = openWorkspaceImageDialog;
    triggerImageUploadRef.current = triggerImageUpload;
    openAudioRecorderRef.current = openAudioRecorder;
    handleFixLanguageRef.current = handleFixLanguage;
    openTranslatorRef.current = toggleTranslator;
    openCalculatorRef.current = toggleCalculator;
    openClockRef.current = toggleClock;
    handleAiActionRef.current = (action) => handleAiAction(action || "improve");
    processAndInsertImageFileRef.current = processAndInsertImageFile;
  });

  const handleApplyImageUrl = () => {
    const nextUrl = normalizeUrl(imageUrl);
    if (!nextUrl) {
      showUiAlert(t("editor.invalidImageUrl"));
      return;
    }

    try {
      new URL(nextUrl, window.location.origin);
    } catch {
      showUiAlert(t("editor.invalidImageUrl"));
      return;
    }

    const chain = getFocusedChain();
    if (!chain) return;
    chain.setImage({ src: nextUrl, alt: "" }).run();
    setImageDialogOpen(false);
    setImageUrl("");
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

  const processAndInsertImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showUiAlert(t("editor.invalidImageFile"));
      return;
    }

    if (settings.storageMode === "gdrive" && isGoogleDriveConnected()) {
      try {
        const tokenInfo = getStoredTokenInfo();
        const structure = await syncEngine.initializeSync();
        if (tokenInfo && structure) {
          const uploaded = await uploadDriveAttachmentFile(
            tokenInfo.access_token,
            structure.attachmentsId,
            file,
            file.name
          );
          const driveImgUrl = uploaded.webContentLink || `https://drive.google.com/uc?export=view&id=${uploaded.id}`;
          const chain = getFocusedChain();
          if (chain) chain.setImage({ src: driveImgUrl, alt: file.name }).run();
          return;
        }
      } catch (err) {
        console.warn("Failed to upload image to Google Drive attachments:", err);
      }
    }

    let compressed: { dataUrl: string; blob: Blob; fileName: string } | null = null;
    try {
      compressed = await compressImageFile(file);
    } catch (err) {
      console.warn("Failed to compress image file:", err);
    }

    const finalDataUrl = compressed?.dataUrl;
    const finalBlob = compressed?.blob || file;
    const finalFileName = file.name;

    // 1. Electron Desktop Workspace Support
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileBase64) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const rawBase64 = finalDataUrl?.includes("base64,") ? finalDataUrl.split("base64,")[1] : "";
          if (rawBase64) {
            let uniqueName = finalFileName;
            const attachmentsFolder = `${saved.folderPath}/attachments`;
            if (electronAPI.readDirectoryFiles) {
              const existing: string[] = (await electronAPI.readDirectoryFiles(attachmentsFolder)) || [];
              const lastDot = finalFileName.lastIndexOf(".");
              const baseName = lastDot > 0 ? finalFileName.slice(0, lastDot) : finalFileName;
              const ext = lastDot > 0 ? finalFileName.slice(lastDot) : "";
              let counter = 1;
              while (existing.includes(uniqueName)) {
                uniqueName = `${baseName} ${counter}${ext}`;
                counter++;
              }
            }

            const fullAttachmentPath = `${saved.folderPath}/attachments/${uniqueName}`;
            await electronAPI.writeFileBase64({ fullPath: fullAttachmentPath, base64: rawBase64 });

            const relPath = getRelativeAttachmentPath(uniqueName);
            const blobUrl = URL.createObjectURL(finalBlob);
            const decodedRel = decodeURIComponent(relPath);
            assetBlobUrlMap.current.set(relPath, blobUrl);
            assetBlobUrlMap.current.set(decodedRel, blobUrl);
            assetBlobUrlMap.current.set(blobUrl, relPath);

            const chain = getFocusedChain();
            if (chain) {
              chain.setImage({ src: blobUrl, alt: file.name, "data-relative-src": relPath } as any).run();
            }
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to save attachment in Electron workspace:", err);
      }
    }

    // 2. Web File System Access API Support
    if (rootDirHandle) {
      try {
        const attachmentsDir = await rootDirHandle.getDirectoryHandle("attachments", { create: true });
        const attachmentFileName = await getUniqueAttachmentFileName(attachmentsDir, finalFileName);
        const fileHandle = await attachmentsDir.getFileHandle(attachmentFileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(finalBlob);
        await writable.close();

        const relPath = getRelativeAttachmentPath(attachmentFileName);
        const blobUrl = URL.createObjectURL(finalBlob);
        const decodedRel = decodeURIComponent(relPath);
        assetBlobUrlMap.current.set(relPath, blobUrl);
        assetBlobUrlMap.current.set(decodedRel, blobUrl);
        assetBlobUrlMap.current.set(blobUrl, relPath);

        const chain = getFocusedChain();
        if (chain) {
          chain.setImage({ src: blobUrl, alt: file.name, "data-relative-src": relPath } as any).run();
        }
        return;
      } catch (err) {
        console.warn("Failed to save attachment to workspace folder:", err);
      }
    }

    if (finalDataUrl) {
      const chain = getFocusedChain();
      if (chain) chain.setImage({ src: finalDataUrl, alt: file.name }).run();

      const imgId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      void saveImageToIndexedDb(imgId, finalBlob);
    } else {
      showUiAlert(t("editor.invalidImageFile"));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processAndInsertImageFile(file);
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
    const tags = Array.from(new Set([...(note.tags || []), ...parsedFm.allTags]));
    onUpdate(note.id, { content, contentFormat: format, tags });
  };

  const canUseNativeFs = canUseNativeFileSystem;

  const [selectedExtension, setSelectedExtension] = useState<"md" | "txt" | "html" | null>(null);

  const getPreferredExtension = () => {
    if (selectedExtension) return selectedExtension;
    const currentFileName = note?.fileName?.toLowerCase() ?? "";
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

  const normalizeSerializedMarkdown = (markdown: string): string => {
    let clean = markdown.replace(/\r\n?/g, "\n");
    let leadingBlankCount = 0;
    while (clean.startsWith("<!--luno:blank-->") || clean.startsWith("\n<!--luno:blank-->")) {
      leadingBlankCount++;
      clean = clean.replace(/^\n*<!--luno:blank-->\n*/, "");
    }
    clean = clean.replace(/^\n+/, "");
    clean = clean.replace(/\n*<!--luno:blank-->\n*/g, "\n\n");
    clean = clean.replace(/<!--luno:blank-->/g, "");
    clean = clean.replace(/\n[ \t]*\|[ \t|]*\n/g, "\n\n");
    clean = clean.replace(/[ \t]+(?=\n)/g, "");
    clean = clean.replace(/\n+$/, "");
    if (leadingBlankCount > 0) {
      clean = "\n".repeat(leadingBlankCount) + clean;
    }
    return clean;
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
    } catch {}
    if (!trimmed) return "";
    if (trimmed.startsWith("/")) return trimmed.replace(/^\/+/, "");

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
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.readImageDataUrl) {
      try {
        const saved = await electronAPI.getSavedWorkspace();
        if (saved?.folderPath) {
          const fullPath = `${saved.folderPath}/${resolvedRelPath}`;
          const dataUrl = await electronAPI.readImageDataUrl(fullPath);
          if (dataUrl) return dataUrl;
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

    const { doc, tr } = instance.state;
    const tasks: Array<{ pos: number; relPath: string }> = [];

    doc.descendants((node, pos) => {
      if (node.type.name === "image") {
        const src = (node.attrs.src as string) || "";
        const dataRelSrc = (node.attrs["data-relative-src"] as string) || "";
        const relPath = dataRelSrc || (src && !/^(https?:\/\/|data:|blob:)/i.test(src) ? src : "");

        if (relPath && !/^(https?:\/\/|data:|blob:)/i.test(relPath)) {
          tasks.push({ pos, relPath });
        }
      }
    });

    if (tasks.length === 0) return;

    let modified = false;

    for (const { pos, relPath } of tasks) {
      let encodedRel = relPath;
      try {
        encodedRel = encodeURI(decodeURI(relPath));
      } catch {
        encodedRel = relPath.replace(/ /g, "%20");
      }
      let decodedRel = relPath;
      try {
        decodedRel = decodeURIComponent(relPath);
      } catch {}

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
          console.warn("Failed to resolve relative image in ProseMirror doc:", relPath, err);
        }
      }

      if (blobUrl) {
        const currentNode = instance.state.doc.nodeAt(pos);
        if (currentNode && currentNode.type.name === "image") {
          if (currentNode.attrs.src !== blobUrl || currentNode.attrs["data-relative-src"] !== encodedRel) {
            tr.setNodeMarkup(pos, undefined, {
              ...currentNode.attrs,
              src: blobUrl,
              "data-relative-src": encodedRel,
            });
            modified = true;
          }
        }
      }
    }

    if (modified && !instance.isDestroyed) {
      instance.view.dispatch(tr);
      setEditorTick((v) => v + 1);
    }
  }, [rootDirHandle, note]);

  useEffect(() => {
    if (editor) {
      void resolveRelativeImagesInEditor(editor);
    }
  }, [editor, note?.id, rootDirHandle, resolveRelativeImagesInEditor]);

  const handleRestoreVersionContent = useCallback((ver: NoteVersionSnapshot) => {
    if (!note) return;
    saveVersionSnapshot(note, "pre-restore");

    // 1. Update localStorage crash-recovery backups
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

    // 2. Update React Note state
    onUpdate(note.id, { content: ver.content });

    // 3. Update TipTap Editor DOM
    if (editor && !editor.isDestroyed) {
      const baseTitle = getBaseTitle(note);
      const parsed = parseEditorContent(ver.content, baseTitle, isTxtFile(note), isHtmlFile(note));
      syncingFromNote.current = true;
      (editor.commands.setContent as any)(parsed as string, false, { preserveWhitespace: "full" });
      void resolveRelativeImagesInEditor(editor);
    }

    // 4. Trigger Auto-Save to Disk / Workspace Files
    setSaveStatus("auto_saving");
    scheduleAutoSaveDiskRef.current?.();

    toast({
      title: t("versionHistoryPanel.restoreSuccess"),
    });
  }, [note, onUpdate, editor, getBaseTitle, parseEditorContent, isTxtFile, isHtmlFile, resolveRelativeImagesInEditor, t, toast]);

  const handleManualVersionSnapshot = useCallback((): NoteVersionSnapshot | null => {
    if (!note) return null;
    const currentContent = editor ? serializeEditorContent(note, editor) : (note.content || "");
    const snap = saveVersionSnapshot(
      { ...note, content: currentContent },
      "manual",
      undefined,
      true,
      editorStats.wordCount,
      editorStats.charCount
    );
    return snap;
  }, [note, editor, serializeEditorContent, editorStats]);

  const fileToDataUrl = async (file: File) => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file as data URL"));
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadPreviewHtml = async () => {
      if (!note || note.contentFormat !== "html" || !note.content) {
        if (!cancelled) setPreviewHtml("");
        return;
      }

      const rewritten = await rewriteHtmlForPreview(note.content, async (assetPath) => {
        return await resolveAssetDataUrl(assetPath);
      });

      if (!cancelled) setPreviewHtml(rewritten);
    };

    void loadPreviewHtml();
    return () => {
      cancelled = true;
    };
  }, [note?.id, note?.content, note?.contentFormat, note?.folderPath, rootDirHandle]);

  const openHtmlPreviewInNewTab = () => {
    if (!note) return;

    const contentToOpen = note.contentFormat === "html" ? (previewHtml || note.content) : (editor?.getHTML() ?? note.content);
    if (!contentToOpen) return;

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

  const getContentToSave = (targetExt?: "md" | "txt" | "html"): string => {
    if (!note) return "";
    if (isHtmlFile(note)) {
      return note.content || "";
    }
    const format = targetExt === "html" ? "html" : targetExt ? (targetExt === "txt" ? "plain" : "markdown") : getContentFormat();

    let rawHtml = "";
    if (editor && !editor.isDestroyed) {
      rawHtml = editor.getHTML();
    }

    let htmlContent = (!note || isTxtFile(note)) ? rawHtml : stripTopH1FromHtml(rawHtml);

    const isBlank = !htmlContent || htmlContent.trim() === "<p></p>" || htmlContent.trim() === "<h1></h1><p></p>";
    if (isBlank && note.content && note.content.trim() !== "<p></p>") {
      if (isTiptapJson(note.content)) {
        try {
          const parsed = JSON.parse(note.content);
          const extracted = extractTextFromTiptapJson(parsed);
          htmlContent = extracted ? `<p>${extracted}</p>` : note.content;
        } catch {
          htmlContent = note.content;
        }
      } else {
        htmlContent = note.content;
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
      if (isMarkdownNote(note)) {
        mdText = updateFrontmatterTags(mdText, note.tags || []);
        if (note.icon !== undefined || note.iconColor !== undefined) {
          mdText = updateFrontmatterIcon(mdText, note.icon, note.iconColor);
        }
        if (note.isFavorite !== undefined) {
          mdText = updateFrontmatterFavorite(mdText, note.isFavorite);
        }
      }
      return mdText;
    }
  };

  const setSavedSnapshot = (noteId: string, ext: "md" | "txt" | "html", content: string) => {
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

  const downloadMarkdown = (markdown: string, ext: "md" | "txt" | "html" = "txt") => {
    if (!note) return;

    const normalizedContent = lineEnding === "CRLF"
      ? markdown.replace(/\r?\n/g, "\r\n")
      : markdown.replace(/\r\n/g, "\n");

    const blobType = ext === "txt" ? "text/plain;charset=utf-8" : ext === "html" ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8";
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

  const performSave = async (content: string, ext: "md" | "txt" | "html", isSilent = false) => {
    if (!note || isNoteDeleted(note.id) || deletedNoteIdsRef.current.has(note.id)) return;
    if (note.fileType === "image" || note.fileType === "binary") return;

    const normalizedContent = lineEnding === "CRLF"
      ? content.replace(/\r?\n/g, "\r\n")
      : content.replace(/\r\n/g, "\n");

    const currentOpId = ++saveOpIdRef.current;
    if (!isSilent) setSaveStatus("saving");

    const relPath = note.fileName ? (note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName) : "";
    if (relPath && isRelativePathDeleted(relPath)) {
      if (saveOpIdRef.current === currentOpId) setSaveStatus("failed");
      return;
    }

    let finalPayloadToDisk = normalizedContent;
    if (note.isLocked) {
      const activePin = onGetActivePin?.(note.id);
      if (activePin) {
        try {
          finalPayloadToDisk = await encryptNoteContent(normalizedContent, activePin);
        } catch (err) {
          console.error("Failed to encrypt note before disk save:", err);
        }
      }
    }

    // 1. Electron Desktop Native Direct Disk Save
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent) {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath && note.fileName) {
        const fullPath = note.folderPath
          ? `${saved.folderPath}/${note.folderPath}/${note.fileName}`
          : `${saved.folderPath}/${note.fileName}`;

        const ok = await electronAPI.writeFileContent({ fullPath, content: finalPayloadToDisk });
        if (ok) {
          setSavedSnapshot(note.id, ext, normalizedContent);
          if (saveOpIdRef.current === currentOpId) {
            setSaveStatus(isSilent ? "auto_saved" : "manually_saved");
          }
          if (!isSilent) {
            toast({
              title: t("editor.saveToastTitle") || "Saved",
              description: note.fileName,
            });
          }
          return;
        }
      }
    }

    const existingHandle = await getFreshFileHandle(note, true);
    if (!existingHandle?.createWritable) {
      if (saveOpIdRef.current === currentOpId) {
        setSavedSnapshot(note.id, ext, normalizedContent);
        setSaveStatus(isSilent ? "auto_saved" : "manually_saved");
        if (!isSilent) {
          toast({
            title: t("editor.saveToastTitle") || "Saved",
            description: note.fileName || note.title || "Note",
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
      await setStoredFileHandle(note.id, existingHandle);
      const savedFile = await existingHandle.getFile();
      updateLinkedMetadata(note.id, savedFile.name);
      if (!isSilent) {
        toast({
          title: t("editor.saveToastTitle"),
          description: t("editor.saveToastSuccess", { file: savedFile.name }),
        });
      }
      setSavedSnapshot(note.id, ext, normalizedContent);
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

  const performSaveAs = async (customContent?: string, customExt?: "md" | "txt" | "html") => {
    if (!note || isNoteDeleted(note.id)) return;
    if (note.fileType === "image" || note.fileType === "binary") return;

    const preferredExt = customExt || (getPreferredExtension() as "md" | "txt" | "html");
    const rawContent = customContent ?? getContentToSave(preferredExt);
    const content = lineEnding === "CRLF"
      ? rawContent.replace(/\r?\n/g, "\r\n")
      : rawContent.replace(/\r\n/g, "\n");
    const baseName = getSuggestedFileName().replace(/\.(md|txt|html)$/i, "");
    const defaultFileName = `${baseName}.${preferredExt}`;

    const currentOpId = ++saveOpIdRef.current;
    setSaveStatus("saving");

    // 1. Electron Desktop Native Save As Dialog
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.showSaveDialog && electronAPI?.writeFileContent) {
      try {
        const filePath = await electronAPI.showSaveDialog({
          title: t("editor.saveAs") || "Save As",
          defaultPath: defaultFileName,
          filters: [
            { name: "Markdown Document (*.md)", extensions: ["md", "markdown"] },
            { name: "Plain Text Document (*.txt)", extensions: ["txt"] },
            { name: "HTML Document (*.html)", extensions: ["html", "htm"] },
            { name: "All Files (*.*)", extensions: ["*"] },
          ],
        });

        if (!filePath) {
          if (saveOpIdRef.current === currentOpId) setSaveStatus("saved");
          return;
        }

        const selectedExt = (filePath.split(".").pop() || "md").toLowerCase() as "md" | "txt" | "html";
        const finalContent = getContentToSave(selectedExt === "html" || selectedExt === "txt" ? selectedExt : "md");
        const ok = await electronAPI.writeFileContent({ fullPath: filePath, content: finalContent });
        if (ok) {
          setSavedSnapshot(note.id, selectedExt, finalContent);
          if (saveOpIdRef.current === currentOpId) setSaveStatus("manually_saved");
          const justName = filePath.replace(/\\/g, "/").split("/").pop() || defaultFileName;
          toast({
            title: t("editor.saveToastTitle") || "Saved",
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
          ],
        });

        const file = await handle.getFile();
        const chosenExt = (file.name.split(".").pop() || "md").toLowerCase() as "md" | "txt" | "html";
        const finalContent = getContentToSave(chosenExt === "html" || chosenExt === "txt" ? chosenExt : "md");

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
              contentFormat: chosenExt === "txt" ? "plain" : chosenExt === "html" ? "html" : "markdown",
              isLinkedFile: false,
              fileName: undefined,
            });
          }
        }

        fileHandleByNoteIdRef.current[targetNoteId] = handle;
        await setStoredFileHandle(targetNoteId, handle);
        updateLinkedMetadata(targetNoteId, file.name);
        toast({
          title: t("editor.saveToastTitle") || "Saved",
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
    if (!note || !canUseNativeFs()) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    if (note.content?.startsWith("data:image/") || note.content?.startsWith("data:application/")) {
      setImageBlobUrl(note.content);
    }

    const hydrateHandle = async () => {
      // 1. Electron Desktop Native Support
      const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
      if (electronAPI?.getSavedWorkspace && (electronAPI?.readImageDataUrl || electronAPI?.readFileBase64)) {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          if (saved?.folderPath && note?.fileName) {
            const relPath = note.folderPath ? `${note.folderPath}/${note.fileName}` : note.fileName;
            const fullPath = `${saved.folderPath}/${relPath}`;
            const isImg = note.fileType === "image" || /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(note.fileName);
            if (isImg) {
              let dataUrl = electronAPI.readImageDataUrl ? await electronAPI.readImageDataUrl(fullPath) : null;
              if (!dataUrl && electronAPI.readFileBase64) {
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
                  dataUrl = `data:${mime};base64,${b64}`;
                }
              }
              if (dataUrl && !cancelled) {
                setImageBlobUrl(dataUrl);
                return;
              }
            }
          }
        } catch (err) {
          console.warn("Electron hydrate image failed:", err);
        }
      }

      let storedHandle = await getStoredFileHandle(note.id);
      if (!storedHandle && rootDirHandle && note.fileName) {
        try {
          let targetDir = rootDirHandle;
          const segments = (note.folderPath ?? "").split("/").filter(Boolean);
          for (const segment of segments) {
            targetDir = await targetDir.getDirectoryHandle(segment, { create: false });
          }
          storedHandle = await targetDir.getFileHandle(note.fileName, { create: false });
          await setStoredFileHandle(note.id, storedHandle);
        } catch {
          /* ignore handle fallback error */
        }
      }
      if (cancelled || !storedHandle) return;

      fileHandleByNoteIdRef.current[note.id] = storedHandle;

      try {
        const permission = await requestPermissionIfAvailable(storedHandle, "read");
        if (permission !== "granted") return;

        const file = await storedHandle.getFile();

        if (note.fileType === "image") {
          objectUrl = URL.createObjectURL(file);
          if (!cancelled) setImageBlobUrl(objectUrl);
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
    };

    setImageBlobUrl(null);
    setIsImageZoomed(false);
    setCanZoomImage(false);
    void hydrateHandle();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [note?.id]);

  function getExportBaseName() {
    if (!note) return t("editor.untitled");
    const name = note.fileName || note.title?.trim() || t("editor.untitled");
    const dotIdx = name.lastIndexOf(".");
    return dotIdx > 0 ? name.slice(0, dotIdx) : name;
  }

  function handleExportPdf() {
    if (!note) return;
    const content = isHtmlFile(note) ? note.content : (editor?.getHTML() ?? note.content);

    const win = window.open("", "_blank");
    if (!win) return;
    const docTitle = note.fileName || note.title?.trim() || t("editor.untitled");
    win.document.write(
      isHtmlFile(note)
        ? content
        : `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docTitle}</title>` +
          `<style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6;}` +
          `h1,h2,h3{margin-top:1.2em;}pre{background:#f4f4f4;padding:1em;border-radius:4px;overflow:auto;}` +
          `code{background:#f4f4f4;padding:.2em .4em;border-radius:3px;}blockquote{border-left:4px solid #ccc;margin:0;padding-left:1em;color:#666;}</style>` +
          `</head><body>${content}</body></html>`
    );
    win.document.close();
    win.focus();
    win.print();
  }

  function handleExportWord() {
    if (!note) return;
    const content = isHtmlFile(note) ? note.content : (editor?.getHTML() ?? note.content);
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="UTF-8"></head><body>${content}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getExportBaseName()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveFile() {
    if (!note) return;
    if (note.fileType === "image" || note.fileType === "binary") return;

    const ext = getPreferredExtension() as "md" | "txt" | "html";
    const content = getContentToSave(ext);

    // 1. Electron Desktop Native Direct Save to Disk
    const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
    if (electronAPI?.getSavedWorkspace && electronAPI?.writeFileContent) {
      const saved = await electronAPI.getSavedWorkspace();
      if (saved?.folderPath && note.fileName) {
        setSaveStatus("saving");
        const fullPath = note.folderPath
          ? `${saved.folderPath}/${note.folderPath}/${note.fileName}`
          : `${saved.folderPath}/${note.fileName}`;

        const ok = await electronAPI.writeFileContent({ fullPath, content });
        if (ok) {
          setSaveStatus("manually_saved");
          setSavedSnapshot(note.id, ext, content);
          toast({
            title: t("editor.saveToastTitle") || "Saved",
            description: note.fileName,
          });
          return;
        }
      }
    }

    // 2. Web Browser File Handle Save or Cloud / Workspace Save
    if (settings.storageMode === "gdrive" || rootDirHandle || note.fileName) {
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

  async function handleExtensionSelected(ext: "md" | "txt" | "html") {
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
    const isNonEditable =
      !note ||
      note.fileType === "image" ||
      note.fileType === "binary" ||
      note.fileName?.toLowerCase()?.endsWith(".zip") ||
      note.fileName?.toLowerCase()?.endsWith(".pdf");

    if (isNonEditable) {
      return null;
    }

    const solidCheckIcon = (
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 fill-emerald-600 text-white dark:fill-emerald-400 dark:text-background" />
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
      <div className="flex items-center gap-1.5 select-none text-[11.5px] shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 cursor-default ${textClass}`}>
              {icon}
              {!isIconOnly && <span className="hidden sm:inline">{text}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>{text}</TooltipContent>
        </Tooltip>
        {!isIconOnly && (
          <>
            <span className="hidden md:inline text-muted-foreground/30 font-light">|</span>
            <span className="hidden md:inline text-muted-foreground/70">{getLastEditedLabel()}</span>
          </>
        )}
      </div>
    );
  }

  function renderActionButtons() {
    return (
      <Fragment>
        {note?.contentFormat === "html" && (
          <div className="flex items-center gap-1 mr-1.5">
            <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-[11px] font-medium border border-border/50 select-none">
              <button
                type="button"
                onClick={() => setHtmlPreviewOpen(false)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                  !htmlPreviewOpen
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="h-3 w-3" />
                <span className="hidden sm:inline">{t("editor.modeEditor")}</span>
              </button>
              <button
                type="button"
                onClick={() => setHtmlPreviewOpen(true)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                  htmlPreviewOpen
                    ? "bg-background text-foreground shadow-xs font-semibold"
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
                          ? "bg-background text-foreground shadow-xs font-semibold"
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
                          ? "bg-background text-foreground shadow-xs font-semibold"
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
                          ? "bg-background text-foreground shadow-xs font-semibold"
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
        {note?.contentFormat !== "html" && (
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
                  {isReadingMode ? (t("editor.editMode") || "Edit mode") : (t("editor.readingMode") || "Reading mode")}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isReadingMode ? (t("editor.editMode") || "Edit mode") : (t("editor.readingMode") || "Reading mode")}
            </TooltipContent>
          </Tooltip>
        )}
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
                <span className="sr-only">{t("pinLock.relockNote") || "Lock Note"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("pinLock.relockNote") || "Lock Note Now"}</TooltipContent>
          </Tooltip>
        )}
        <DropdownMenu>
          <Tooltip>
          <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" disabled={!note} className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5">
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
          <DropdownMenuContent align="end" className="w-48 rounded-xl px-0 py-2">
            <DropdownMenuItem disabled={!note} onClick={() => void handleSaveFile()} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
              {(() => {
                const SaveIconComp = getToolbarIcon("save", settings.iconPack);
                return <SaveIconComp className="h-4 w-4" />;
              })()}
              <span>{t("editor.save")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!note} onClick={() => void performSaveAs()} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
              {(() => {
                const FileIconComp = getToolbarIcon("file", settings.iconPack);
                return <FileIconComp className="h-4 w-4" />;
              })()}
              <span>{t("editor.saveAs")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!note || isSharingLoading}
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
              <span className="sr-only">{t("breadcrumb.share") || "Share"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("breadcrumb.share") || "Share Note"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!note}
              className="hidden md:inline-flex h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5"
              onClick={() => {
                if (note) {
                  setVersionHistoryOpen((prev) => !prev);
                }
              }}
            >
              {(() => {
                const HistoryIconComp = getToolbarIcon("history", settings.iconPack);
                return <HistoryIconComp className="h-3.5 w-3.5" />;
              })()}
              <span className="sr-only">{t("breadcrumb.versionHistory") || "Version History"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("breadcrumb.versionHistory") || "Version History"}</TooltipContent>
        </Tooltip>
      </Fragment>
    );
  }

  if (!note) {
    return (
      <>
        {statusPortalTarget && createPortal(renderSaveStatusIndicator(), statusPortalTarget)}
        {portalTarget && createPortal(renderActionButtons(), portalTarget)}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground relative">
          <p className="text-sm">{t("editor.selectOrCreate")}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("sidebar.newNote")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-44 rounded-xl px-0 py-2">
              <DropdownMenuItem onClick={handleOpenCreateFileDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
                <FileText className="h-4 w-4" />
                <span>{t("sidebar.createFileAction")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenCreateFolderDialog} className="gap-2 cursor-pointer py-2 px-4 mx-1 rounded-lg">
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
                <Select value={newFileExt} onValueChange={(v) => setNewFileExt(v === "md" ? "md" : v === "html" ? "html" : "txt")}>
                  <SelectTrigger id="new-file-ext-editor" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">{t("sidebar.fileTypeTxt")}</SelectItem>
                    <SelectItem value="md">{t("sidebar.fileTypeMd")}</SelectItem>
                    <SelectItem value="html">{t("sidebar.fileTypeHtml")}</SelectItem>
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





  return (
    <>
      <TooltipProvider delayDuration={420}>
      <div className="flex min-h-0 flex-1 flex-row bg-background relative overflow-hidden">
        <div className="flex flex-1 min-h-0 flex-col min-w-0 overflow-hidden">
          <div className={note.contentFormat === "html" && !isMobile ? "hidden" : "px-3 py-2 sm:px-4 md:px-6"}>
            <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-3">
        <div ref={mobileToolbarAreaRef} className={`min-w-0 ${isMobile ? "order-2" : ""}`}>
          {!isReadingMode && ((note.fileName?.toLowerCase().endsWith('.txt') || note.fileName?.toLowerCase().endsWith('.md') || note.fileName?.toLowerCase().endsWith('.markdown')) || (!note.fileName && (getContentFormat() === 'markdown' || getContentFormat() === 'plain'))) ? (() => {
            const ALL_TOOLBAR_ITEMS: Array<{
              id: string;
              group: "history" | "heading" | "inline" | "list" | "block" | "media" | "ai";
              labelKey: string;
            }> = [
              { id: "undo", group: "history", labelKey: "editor.undo" },
              { id: "redo", group: "history", labelKey: "editor.redo" },
              { id: "h1", group: "heading", labelKey: "editor.heading1" },
              { id: "h2", group: "heading", labelKey: "editor.heading2" },
              { id: "h3", group: "heading", labelKey: "editor.heading3" },
              { id: "h4", group: "heading", labelKey: "editor.heading4" },
              { id: "h5", group: "heading", labelKey: "editor.heading5" },
              { id: "h6", group: "heading", labelKey: "editor.heading6" },
              { id: "bold", group: "inline", labelKey: "editor.bold" },
              { id: "italic", group: "inline", labelKey: "editor.italic" },
              { id: "underline", group: "inline", labelKey: "editor.underline" },
              { id: "strike", group: "inline", labelKey: "editor.strikethrough" },
              { id: "highlight", group: "inline", labelKey: "editor.highlight" },
              { id: "bulletList", group: "list", labelKey: "editor.bulletList" },
              { id: "orderedList", group: "list", labelKey: "editor.numberedList" },
              { id: "taskList", group: "list", labelKey: "editor.checkbox" },
              { id: "toggle", group: "block", labelKey: "editor.toggle" },
              { id: "code", group: "block", labelKey: "editor.inlineCode" },
              { id: "codeBlock", group: "block", labelKey: "editor.codeBlock" },
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

            const totalAvailable = mobileToolbarWidth > 0 ? mobileToolbarWidth - CONTAINER_PADDING : 1000;

            let fullWidthNeeded = 0;
            let lastGroup = "";
            for (const item of TOOLBAR_ITEMS) {
              if (lastGroup && item.group !== lastGroup) fullWidthNeeded += SEP_WIDTH;
              fullWidthNeeded += BUTTON_WIDTH;
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
                let cost = BUTTON_WIDTH;
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
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : renderToolIcon("aiAssistant")}
                              <span className="sr-only">{t("settings.aiAssistant")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("settings.aiAssistant")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl px-0 py-2">
                        <DropdownMenuItem onClick={() => handleAiAction("improve")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <WandSparklesIcon className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiImprove")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("fix_grammar")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <SpellCheckIcon className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiFixGrammar")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_shorter")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Minimize2 className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiMakeShorter")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_longer")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Maximize2 className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiMakeLonger")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("simplify")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiSimplify")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("formalize")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <BriefcaseBusinessIcon className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiFormalize")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("make_casual")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiMakeCasual")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("translate")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Languages className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiTranslate")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("continue_writing")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <ArrowRight className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiContinueWriting")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAiAction("rewrite")} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <PenLineIcon className="mr-2 h-4 w-4" />
                          <span>{t("settings.aiRewrite")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                case "h1":
                  return (
                    <Tooltip key="h1">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("heading", { level: 1 }) ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        >
                          {renderToolIcon("h1")}
                          <span className="sr-only">{t("editor.heading1")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.heading1")}</TooltipContent>
                    </Tooltip>
                  );
                case "h2":
                  return (
                    <Tooltip key="h2">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("heading", { level: 2 }) ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        >
                          {renderToolIcon("h2")}
                          <span className="sr-only">{t("editor.heading2")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.heading2")}</TooltipContent>
                    </Tooltip>
                  );
                case "h3":
                  return (
                    <Tooltip key="h3">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("heading", { level: 3 }) ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                        >
                          {renderToolIcon("h3")}
                          <span className="sr-only">{t("editor.heading3")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.heading3")}</TooltipContent>
                    </Tooltip>
                  );
                case "h4":
                  return (
                    <Tooltip key="h4">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("heading", { level: 4 }) ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
                        >
                          {renderToolIcon("h4")}
                          <span className="sr-only">{t("editor.heading4")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.heading4")}</TooltipContent>
                    </Tooltip>
                  );
                case "h5":
                  return (
                    <Tooltip key="h5">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("heading", { level: 5 }) ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 5 }).run()}
                        >
                          {renderToolIcon("h5")}
                          <span className="sr-only">{t("editor.heading5")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.heading5")}</TooltipContent>
                    </Tooltip>
                  );
                case "h6":
                  return (
                    <Tooltip key="h6">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("heading", { level: 6 }) ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleHeading({ level: 6 }).run()}
                        >
                          {renderToolIcon("h6")}
                          <span className="sr-only">{t("editor.heading6")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.heading6")}</TooltipContent>
                    </Tooltip>
                  );
                case "bold":
                  return (
                    <Tooltip key="bold">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("bold") ? "bg-primary/15 text-primary" : ""}`}
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
                case "italic":
                  return (
                    <Tooltip key="italic">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("italic") ? "bg-primary/15 text-primary" : ""}`}
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
                case "underline":
                  return (
                    <Tooltip key="underline">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("underline") ? "bg-primary/15 text-primary" : ""}`}
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
                case "strike":
                  return (
                    <Tooltip key="strike">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("strike") ? "bg-primary/15 text-primary" : ""}`}
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
                case "highlight":
                  return (
                    <Tooltip key="highlight">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("highlight") ? "bg-primary/15 text-primary" : ""}`}
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
                case "bulletList":
                  return (
                    <Tooltip key="bulletList">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("bulletList") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        >
                          {renderToolIcon("bulletList")}
                          <span className="sr-only">{t("editor.bulletList")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.bulletList")}</TooltipContent>
                    </Tooltip>
                  );
                case "orderedList":
                  return (
                    <Tooltip key="orderedList">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("orderedList") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        >
                          {renderToolIcon("orderedList")}
                          <span className="sr-only">{t("editor.orderedList")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.orderedList")}</TooltipContent>
                    </Tooltip>
                  );
                case "taskList":
                  return (
                    <Tooltip key="taskList">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("taskList") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleTaskList().run()}
                        >
                          {renderToolIcon("taskList")}
                          <span className="sr-only">{t("editor.checkbox")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.checkbox")}</TooltipContent>
                    </Tooltip>
                  );
                case "toggle":
                  return (
                    <Tooltip key="toggle">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("toggle") ? "bg-primary/15 text-primary" : ""}`}
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
                case "code":
                  return (
                    <Tooltip key="code">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("code") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleCode().run()}
                        >
                          {renderToolIcon("code")}
                          <span className="sr-only">{t("editor.code")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.code")}</TooltipContent>
                    </Tooltip>
                  );
                case "codeBlock":
                  return (
                    <Tooltip key="codeBlock">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("codeBlock") ? "bg-primary/15 text-primary" : ""}`}
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                        >
                          {renderToolIcon("codeBlock")}
                          <span className="sr-only">{t("editor.codeBlock")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.codeBlock")}</TooltipContent>
                    </Tooltip>
                  );
                case "blockquote":
                  return (
                    <Tooltip key="blockquote">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("blockquote") ? "bg-primary/15 text-primary" : ""}`}
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
                case "horizontalRule":
                  return (
                    <Tooltip key="horizontalRule">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
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
                          className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
                          disabled={!editor}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (!editor) return;
                            insertFootnoteAtSelection(editor);
                          }}
                        >
                          {renderToolIcon("footnote")}
                          <span className="sr-only">{t("editor.footnote")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("editor.footnote")}</TooltipContent>
                    </Tooltip>
                  );
                case "table":
                  if (!editor) return null;
                  if (!editor.isActive("table")) {
                    return (
                      <Tooltip key="table">
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full"
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
                              className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full bg-primary/15 text-primary"
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {renderToolIcon("table")}
                              <span className="sr-only">{t("editor.tableOptions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("editor.tableOptions")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="start" className="w-56 rounded-xl px-0 py-2">
                        <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("editor.addRowAbove")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("editor.addRowBelow")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2 text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteRow")}</span>
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-border/40" />
                        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("editor.addColumnLeft")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("editor.addColumnRight")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2 text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteColumn")}</span>
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-border/40" />
                        <DropdownMenuItem
                          onClick={() => editor.chain().focus().mergeCells().run()}
                          disabled={!editor.can().mergeCells()}
                          className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                        >
                          {renderToolIcon("table", "mr-2")}
                          <span>{t("editor.mergeCells")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => editor.chain().focus().splitCell().run()}
                          disabled={!editor.can().splitCell()}
                          className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                        >
                          {renderToolIcon("table", "mr-2")}
                          <span>{t("editor.splitCell")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          {renderToolIcon("table", "mr-2")}
                          <span>{t("editor.toggleHeaderRow")}</span>
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-border/40" />
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2 text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span>{t("editor.deleteTable")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
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
                      <PopoverContent align="start" className="w-72 rounded-xl p-3 shadow-lg">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                          {t("editor.insertEmoji")}
                        </div>
                        <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto pr-1 select-none no-scrollbar">
                          {EMOJI_LIST.map((emoji, index) => (
                            <button
                              key={`${emoji}-${index}`}
                              type="button"
                              className="h-8 w-8 text-lg rounded-lg hover:bg-muted focus:bg-muted flex items-center justify-center transition-colors cursor-pointer"
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
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${calculatorOpen ? "bg-primary/15 text-primary" : ""}`}
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
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${translatorOpen ? "bg-primary/15 text-primary" : ""}`}
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
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${clockOpen ? "bg-primary/15 text-primary" : ""}`}
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
                case "link":
                  return (
                    <Tooltip key="link">
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full ${editor?.isActive("link") ? "bg-primary/15 text-primary" : ""}`}
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
                      <DropdownMenuContent align="start" className="w-56 rounded-xl px-0 py-2">
                        <DropdownMenuItem onClick={openImageDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <ImagePlus className="mr-2 h-4 w-4" />
                          <span>{t("editor.insertImageByUrl")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openWorkspaceImageDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                          <Images className="mr-2 h-4 w-4" />
                          <span>{t("editor.insertImageFromWorkspace")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            rememberSelection();
                            imageInputRef.current?.click();
                          }}
                          className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          <span>{t("editor.uploadImage")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                return <IconComp className="mr-2 h-4 w-4" />;
              };

              switch (id) {
                case "undo":
                  return (
                    <DropdownMenuItem key="undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor || !editor.can().undo()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("undo")}
                      <span>{t("editor.undo")}</span>
                    </DropdownMenuItem>
                  );
                case "redo":
                  return (
                    <DropdownMenuItem key="redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor || !editor.can().redo()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("redo")}
                      <span>{t("editor.redo")}</span>
                    </DropdownMenuItem>
                  );
                case "h1":
                  return (
                    <DropdownMenuItem key="h1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("h1")}
                      <span>{t("editor.heading1")}</span>
                    </DropdownMenuItem>
                  );
                case "h2":
                  return (
                    <DropdownMenuItem key="h2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("h2")}
                      <span>{t("editor.heading2")}</span>
                    </DropdownMenuItem>
                  );
                case "h3":
                  return (
                    <DropdownMenuItem key="h3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("h3")}
                      <span>{t("editor.heading3")}</span>
                    </DropdownMenuItem>
                  );
                case "h4":
                  return (
                    <DropdownMenuItem key="h4" onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("h4")}
                      <span>{t("editor.heading4")}</span>
                    </DropdownMenuItem>
                  );
                case "h5":
                  return (
                    <DropdownMenuItem key="h5" onClick={() => editor?.chain().focus().toggleHeading({ level: 5 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("h5")}
                      <span>{t("editor.heading5")}</span>
                    </DropdownMenuItem>
                  );
                case "h6":
                  return (
                    <DropdownMenuItem key="h6" onClick={() => editor?.chain().focus().toggleHeading({ level: 6 }).run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("h6")}
                      <span>{t("editor.heading6")}</span>
                    </DropdownMenuItem>
                  );
                case "bold":
                  return (
                    <DropdownMenuItem key="bold" onClick={() => editor?.chain().focus().toggleBold().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("bold")}
                      <span>{t("editor.bold")}</span>
                    </DropdownMenuItem>
                  );
                case "italic":
                  return (
                    <DropdownMenuItem key="italic" onClick={() => editor?.chain().focus().toggleItalic().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("italic")}
                      <span>{t("editor.italic")}</span>
                    </DropdownMenuItem>
                  );
                case "underline":
                  return (
                    <DropdownMenuItem key="underline" onClick={() => editor?.chain().focus().toggleUnderline().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("underline")}
                      <span>{t("editor.underline")}</span>
                    </DropdownMenuItem>
                  );
                case "strike":
                  return (
                    <DropdownMenuItem key="strike" onClick={() => editor?.chain().focus().toggleStrike().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("strike")}
                      <span>{t("editor.strikethrough")}</span>
                    </DropdownMenuItem>
                  );
                case "highlight":
                  return (
                    <DropdownMenuItem key="highlight" onClick={() => editor?.chain().focus().toggleHighlight().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("highlight")}
                      <span>{t("editor.highlight")}</span>
                    </DropdownMenuItem>
                  );
                case "bulletList":
                  return (
                    <DropdownMenuItem key="bulletList" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("bulletList")}
                      <span>{t("editor.bulletList")}</span>
                    </DropdownMenuItem>
                  );
                case "orderedList":
                  return (
                    <DropdownMenuItem key="orderedList" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("orderedList")}
                      <span>{t("editor.numberedList")}</span>
                    </DropdownMenuItem>
                  );
                case "taskList":
                  return (
                    <DropdownMenuItem key="taskList" onClick={() => editor?.chain().focus().toggleTaskList().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("taskList")}
                      <span>{t("editor.checkbox")}</span>
                    </DropdownMenuItem>
                  );
                case "toggle":
                  return (
                    <DropdownMenuItem key="toggle" onClick={() => handleToggleClick(editor)} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("toggle")}
                      <span>{t("editor.toggle")}</span>
                    </DropdownMenuItem>
                  );
                case "code":
                  return (
                    <DropdownMenuItem key="code" onClick={() => editor?.chain().focus().toggleCode().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("code")}
                      <span>{t("editor.inlineCode")}</span>
                    </DropdownMenuItem>
                  );
                case "blockquote":
                  return (
                    <DropdownMenuItem key="blockquote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("blockquote")}
                      <span>{t("editor.blockquote")}</span>
                    </DropdownMenuItem>
                  );
                case "table":
                  return (
                    <DropdownMenuItem
                      key="table"
                      onClick={() => {
                        if (editor) {
                          if (editor.isActive("table")) {
                            editor.chain().focus().deleteTable().run();
                          } else {
                            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                          }
                        }
                      }}
                      className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                    >
                      {renderDropdownIcon("table")}
                      <span>{t("editor.insertTable")}</span>
                    </DropdownMenuItem>
                  );
                case "emoji":
                  return (
                    <DropdownMenuItem key="emoji" onClick={() => {}} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("emoji")}
                      <span>{t("editor.insertEmoji")}</span>
                    </DropdownMenuItem>
                  );
                case "calculator":
                  return (
                    <DropdownMenuItem key="calculator" onClick={toggleCalculator} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("calculator")}
                      <span>{t("editor.calculator")}</span>
                    </DropdownMenuItem>
                  );
                case "translator":
                  return (
                    <DropdownMenuItem key="translator" onClick={toggleTranslator} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("translator")}
                      <span>{t("editor.translator")}</span>
                    </DropdownMenuItem>
                  );
                case "clock":
                  return (
                    <DropdownMenuItem key="clock" onClick={toggleClock} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("clock")}
                      <span>{t("editor.clock")}</span>
                    </DropdownMenuItem>
                  );
                case "link":
                  return (
                    <DropdownMenuItem key="link" onClick={openLinkDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("link")}
                      <span>{t("editor.link")}</span>
                    </DropdownMenuItem>
                  );
                case "image":
                  return (
                    <Fragment key="image">
                      <DropdownMenuItem onClick={openImageDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                        {renderDropdownIcon("image")}
                        <span>{t("editor.insertImageByUrl")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openWorkspaceImageDialog} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                        <Images className="mr-2 h-4 w-4" />
                        <span>{t("editor.insertImageFromWorkspace")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          rememberSelection();
                          imageInputRef.current?.click();
                        }}
                        className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        <span>{t("editor.uploadImage")}</span>
                      </DropdownMenuItem>
                    </Fragment>
                  );
                case "audio":
                  return (
                    <DropdownMenuItem
                      key="audio"
                      onClick={openAudioRecorder}
                      className="mx-1 cursor-pointer rounded-lg px-4 py-2"
                    >
                      {renderDropdownIcon("audio")}
                      <span>{t("editor.recordAudio")}</span>
                    </DropdownMenuItem>
                  );
                case "fixLanguage":
                  return (
                    <DropdownMenuItem key="fixLanguage" onClick={handleFixLanguage} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("fixLanguage")}
                      <span>{t("editor.fixLanguage")}</span>
                    </DropdownMenuItem>
                  );
                case "aiAssistant":
                  return (
                    <DropdownMenuItem key="aiAssistant" onClick={() => {}} className="mx-1 cursor-pointer rounded-lg px-4 py-2">
                      {renderDropdownIcon("aiAssistant")}
                      <span>{t("settings.aiAssistant")}</span>
                    </DropdownMenuItem>
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
                    <DropdownMenu>
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
                      <DropdownMenuContent align="end" sideOffset={4} className="w-56 rounded-xl px-0 py-2">
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
          <div className="ml-auto flex items-center gap-1">
          {statusPortalTarget && createPortal(renderSaveStatusIndicator(), statusPortalTarget)}
          {portalTarget && createPortal(renderActionButtons(), portalTarget)}
          <input ref={docxInputRef} type="file" accept=".docx" className="hidden" onChange={handleImportDocx} />
          <Dialog open={importDocxDialogOpen} onOpenChange={setImportDocxDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>นำเข้าไฟล์ docx</DialogTitle>
                <DialogDescription>เลือกไฟล์ docx เพื่อแปลงเป็น HTML และแก้ไขใน Editor</DialogDescription>
              </DialogHeader>
              <div className="py-1">
                <Button type="button" onClick={() => docxInputRef.current?.click()}>
                  เลือกไฟล์ docx
                </Button>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setImportDocxDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* AI Assistant API Key Dialog */}
          <Dialog open={aiApiKeyModalOpen} onOpenChange={setAiApiKeyModalOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t("settings.aiApiKeyRequiredTitle")}</DialogTitle>
                <DialogDescription>{t("settings.aiApiKeyRequiredDesc")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5 py-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="ai-api-key-modal-input" className="block text-sm font-semibold text-foreground">
                    Gemini API Key
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (onOpenWebTab) {
                        e.preventDefault();
                        onOpenWebTab("https://aistudio.google.com/app/apikey");
                      }
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    Get Free API Key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <input
                  id="ai-api-key-modal-input"
                  type="password"
                  value={aiKeyInputValue}
                  onChange={(e) => setAiKeyInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveApiKeyFromModal();
                    }
                  }}
                  placeholder="AIzaSy..."
                  className="w-full rounded-2xl border border-border/80 bg-background px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-0 shadow-none"
                />
                {aiErrorMsg && (
                  <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-xl border border-destructive/20 mt-1">
                    {aiErrorMsg}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setAiApiKeyModalOpen(false)}>
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button type="button" onClick={handleSaveApiKeyFromModal} disabled={!aiKeyInputValue.trim()}>
                  Save Key & Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>



          </div>
        </div>
      </div>
      </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <div
          ref={editorScrollContainerRef}
          onScroll={handleEditorScroll}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (navigateFootnoteOrAnchor(target, e.currentTarget)) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }

            if (
              editor &&
              !target.closest("button, a, input, textarea, select, [role='button'], [role='menuitem'], summary, .code-block-wrapper, table")
            ) {
              if (target === e.currentTarget || target.closest("[data-editor-bottom-area]")) {
                editor.commands.focus("end");
              }
            }
          }}
          className={`flex flex-col cursor-text ${
            note.contentFormat === "html" ? "flex-1 min-h-0" : "flex-1 overflow-y-auto overflow-x-hidden"
          } w-full`}
        >
          {comparingVersion ? (
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
          ) : (note.isLocked && !note.isDecrypted) || isEncryptedNote(note.content) ? (
            <LockedNoteViewer
              note={note}
              onUnlock={async (pin) => {
                if (onUnlockNote) {
                  return await onUnlockNote(note.id, pin);
                }
                return false;
              }}
            />
          ) : note.fileType === "image" || /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(note.fileName || "") ? (
            <div className={`flex min-h-full w-full ${isImageZoomed && canZoomImage ? "items-start justify-center p-4 overflow-auto" : "items-center justify-center p-4 overflow-hidden"}`}>
              {imageBlobUrl || (note.content?.startsWith("data:") ? note.content : null) ? (
                <img
                  src={imageBlobUrl || (note.content?.startsWith("data:") ? note.content : undefined)}
                  alt={note.fileName}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const container = img.parentElement;
                    if (container) {
                      const maxW = container.clientWidth;
                      const maxH = container.clientHeight;
                      const isLarge = img.naturalWidth > maxW || img.naturalHeight > maxH;
                      setCanZoomImage(isLarge);
                    }
                  }}
                  onClick={() => {
                    if (canZoomImage) {
                      setIsImageZoomed((prev) => !prev);
                    }
                  }}
                  className={`object-contain select-none ${
                    !canZoomImage
                      ? "max-h-full max-w-full cursor-default"
                      : isImageZoomed
                        ? "max-h-none max-w-none cursor-zoom-out"
                        : "max-h-full max-w-full cursor-zoom-in"
                  }`}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{note.fileName}</p>
              )}
            </div>
          ) : note.fileType === "binary" || (note.fileName?.toLowerCase()?.endsWith(".zip")) ? (
            <div className="flex min-h-full w-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
              {note.fileName?.toLowerCase()?.endsWith(".zip") ? (
                <FolderArchive className="h-12 w-12 opacity-30" />
              ) : (
                <File className="h-12 w-12 opacity-30" />
              )}
              <p className="text-sm">{note.fileName}</p>
              <p className="text-xs opacity-60">{t("editor.previewNotSupported")}</p>
            </div>
          ) : note.contentFormat === "html" ? (
            htmlPreviewOpen ? (
              <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-muted/20">
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
                      srcDoc={previewHtml || note.content}
                      sandbox="allow-scripts allow-same-origin"
                      title="HTML Preview"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <HtmlCodeEditor
                key={note.id}
                value={note.content}
                onChange={(val) => onUpdate(note.id, { content: val })}
                fontSize={editorFontSize}
                onCursorChange={(line, col) => setHtmlCursor({ line, col })}
                spellCheck={spellCheckEnabled}
                noteId={note.id}
              />
            )
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild onContextMenuCapture={handleEditorContextMenu}>
                <div className={`flex w-full min-w-0 flex-col ${
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
                  {editor && !isReadingMode && <TableInteractiveOverlay editor={editor} />}
                  <EditorContent
                    editor={editor}
                    className="w-full min-w-0 max-w-full"
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
                            title: t("editor.noteNotFound") || "Note not found",
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
                          } else if (window.electronAPI?.openExternal) {
                            void window.electronAPI.openExternal(href);
                          } else {
                            window.open(href, "_blank", "noopener,noreferrer");
                          }
                        } else if (window.electronAPI?.openExternal) {
                          void window.electronAPI.openExternal(href);
                        } else {
                          window.open(href, "_blank", "noopener,noreferrer");
                        }
                      }
                    }}
                  />
                  <div
                    data-editor-bottom-area="true"
                    onClick={() => {
                      if (editor) {
                        editor.commands.focus("end");
                      }
                    }}
                    className="h-10 sm:h-12 md:h-14 w-full shrink-0 cursor-text"
                  />
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-56 rounded-xl">
                {contextSpellData && contextSpellData.suggestions.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground flex items-center justify-between border-b border-border/40 mb-1">
                      <span>{t("settings.spellCheckSetting") || "Spell Suggestions"}</span>
                      <span className="text-[10px] text-muted-foreground/60 italic font-mono">({contextSpellData.word})</span>
                    </div>
                    {contextSpellData.suggestions.map((suggestion) => (
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
                        className="gap-2 font-medium text-primary focus:text-primary focus:bg-primary/10"
                      >
                        <Check className="h-4 w-4 shrink-0" />
                        <span>{suggestion}</span>
                      </ContextMenuItem>
                    ))}
                    <ContextMenuSeparator />
                  </>
                )}

                <ContextMenuItem
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  <span>{t("editor.undo") || "Undo"}</span>
                  <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="gap-2"
                >
                  <Redo2 className="h-4 w-4" />
                  <span>{t("editor.redo") || "Redo"}</span>
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
                  className="gap-2"
                >
                  <Scissors className="h-4 w-4" />
                  <span>{t("editor.cut") || "Cut"}</span>
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
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>{t("editor.copy") || "Copy"}</span>
                  <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={async () => {
                    if (!editor) return;
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        editor.chain().focus().insertContent(text).run();
                      }
                    } catch {
                      // clipboard fallback
                    }
                  }}
                  className="gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>{t("editor.paste") || "Paste"}</span>
                  <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                  onClick={() => editor?.chain().focus().selectAll().run()}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>{t("editor.selectAll") || "Select All"}</span>
                  <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
                </ContextMenuItem>

                {editor && !editor.state.selection.empty && (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={openTranslatorWithSelection}
                      className="gap-2"
                    >
                      <Languages className="h-4 w-4" />
                      <span>{t("editor.translateSelection") || "Translate"}</span>
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={handleFixLanguage}
                      className="gap-2"
                    >
                      <Wrench className="h-4 w-4" />
                      <span>{t("editor.fixLanguage") || "Fix Language (TH/EN)"}</span>
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
          <div className="flex h-7 w-full shrink-0 items-center justify-between border-t border-border/60 bg-card/60 dark:bg-card/40 px-3 text-[11px] text-muted-foreground select-none overflow-x-auto no-scrollbar">
            {/* Left side: Ln 1, Col 1 | (words | characters if not HTML) | Markdown/HTML */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-normal text-muted-foreground cursor-default hover:text-foreground transition-colors">
                    {t("editor.lineCol", { line: editorStats.line, col: editorStats.col }) || `Ln ${editorStats.line}, Col ${editorStats.col}`}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("editor.cursorPosition", { line: editorStats.line, col: editorStats.col })}
                </TooltipContent>
              </Tooltip>

              {note?.contentFormat !== "html" && (
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
                    {editorStats.syntaxLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("editor.syntaxMode", { syntax: editorStats.syntaxLabel })}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Right side: 100% - + UTF-8 LF | (Spell if not HTML) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Clickable % to reset zoom to 100% */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateSetting("editorFontSize", 15)}
                    className="tabular-nums font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1 py-0.5 hover:bg-muted/60"
                  >
                    {`${editorStats.zoom}%`}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("editor.zoomReset")}
                </TooltipContent>
              </Tooltip>

              {/* Zoom out button - */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateSetting("editorFontSize", Math.max(13, (settings.editorFontSize || 15) - 1))}
                    className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer text-xs font-semibold leading-none"
                  >
                    -
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("editor.zoomOut")}
                </TooltipContent>
              </Tooltip>

              {/* Zoom in button + */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateSetting("editorFontSize", Math.min(22, (settings.editorFontSize || 15) + 1))}
                    className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted/80 hover:text-foreground text-muted-foreground transition-colors cursor-pointer text-xs font-semibold leading-none"
                  >
                    +
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
                      {settings.language === "th"
                        ? keyboardLanguage === "th" ? "ไทย" : "อังกฤษ"
                        : keyboardLanguage === "th" ? "TH" : "EN"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold">
                    {settings.language === "th"
                      ? `แป้นพิมพ์: ${keyboardLanguage === "th" ? "ไทย" : "อังกฤษ"}`
                      : `Keyboard: ${keyboardLanguage === "th" ? "TH" : "EN"}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {settings.language === "th"
                      ? "สลับภาษา: Win+Spacebar"
                      : "Switch: Win+Spacebar"}
                  </p>
                </TooltipContent>
              </Tooltip>

              {note?.contentFormat !== "html" && (
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
                    title: target.title ? `${target.title} copy` : "Untitled",
                    content: target.content,
                    tags: target.tags,
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
              currentWordCount={editorStats.wordCount}
              currentCharCount={editorStats.charCount}
              onManualSnapshot={handleManualVersionSnapshot}
              onRestoreVersion={(ver) => {
                handleRestoreVersionContent(ver);
              }}
              onCompareVersion={(ver) => {
                setComparingVersion(ver);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <FloatingCalculator
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        zIndex={calculatorZIndex}
        onFocusWindow={bringCalculatorToFront}
      />

      <FloatingClock
        isOpen={clockOpen}
        onClose={() => setClockOpen(false)}
        zIndex={clockZIndex}
        onFocusWindow={bringClockToFront}
      />

      <FloatingTranslator
        isOpen={translatorOpen}
        onClose={() => setTranslatorOpen(false)}
        initialText={translatorInitialText}
        onInsertTranslation={handleInsertTranslation}
        zIndex={translatorZIndex}
        onFocusWindow={bringTranslatorToFront}
      />



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
          <div className="grid gap-3 py-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden">
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
                  ? "bg-background text-foreground shadow-xs font-semibold"
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
                  ? "bg-background text-foreground shadow-xs font-semibold"
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
                          <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
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

      <FloatingAudioRecorder
        isOpen={audioRecorderOpen}
        onClose={() => setAudioRecorderOpen(false)}
        zIndex={audioRecorderZIndex}
        onFocusWindow={bringAudioRecorderToFront}
        rootDirHandle={rootDirHandle}
        onInsertAudio={({ src, title }) => {
          if (!editor) return;
          userEditedRef.current = true;
          editorSelectionRef.current = null;
          editor.chain().focus().setAudio({ src, title }).run();
          setLastEditedTime(Date.now());
          if (settings.autoSave) {
            setSaveStatus("auto_saving");
            scheduleAutoSaveDiskRef.current?.();
          } else {
            setSaveStatus("unsaved");
          }
        }}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sidebar.deleteFileAction")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sidebar.deleteFilesDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                void handleDeleteNote();
              }}
            >
              {t("common.delete")}
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
          className="fixed z-50 w-56 rounded-xl border border-border bg-popover px-0 py-1.5 shadow-xl animate-in fade-in-80 zoom-in-95 flex flex-col max-h-72 overflow-hidden text-popover-foreground select-none"
          style={{
            top: `${Math.min(slashMenuState.coords.top + 6, window.innerHeight - 300)}px`,
            left: `${Math.min(slashMenuState.coords.left, window.innerWidth - 240)}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/40 shrink-0">
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
              <div className="px-4 py-3 text-xs text-center text-muted-foreground">
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
                      <div className={`px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground/80 select-none ${idx > 0 ? "mt-1 border-t border-border/25" : ""}`}>
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
                      className={`mx-1 flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-all select-none gap-2.5 ${
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                          : "text-foreground font-normal hover:bg-foreground/5 hover:text-foreground"
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
      <Dialog open={shareSyncDialogOpen} onOpenChange={setShareSyncDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <GoogleDriveIcon className="h-5 w-5 shrink-0" />
              <span>{t("shareDialog.syncRequiredTitle") || "Sync to Google Drive Required"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              {t("shareDialog.syncRequiredDesc") ||
                "This note is currently stored locally on this machine. To generate a shareable link, this workspace needs to be synced to Google Drive. Would you like to sync it now?"}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSharingLoading}
              onClick={() => setShareSyncDialogOpen(false)}
              className="rounded-xl text-xs cursor-pointer"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              disabled={isSharingLoading}
              onClick={handleConfirmSyncAndShare}
              className="rounded-xl text-xs gap-1.5 cursor-pointer"
            >
              {isSharingLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("shareDialog.syncing") || "Syncing to Drive..."}</span>
                </>
              ) : (
                <>
                  <GoogleDriveIcon className="h-3.5 w-3.5" />
                  <span>{t("shareDialog.syncAndShareBtn") || "Sync & Share Note"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog 2: Share link generated successfully */}
      <Dialog open={shareSuccessDialogOpen} onOpenChange={setShareSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <GoogleDriveIcon className="h-5 w-5 shrink-0" />
              <span>{t("shareDialog.shareLinkTitle") || "Google Drive Share Link"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              {t("shareDialog.shareLinkDesc") || "Anyone with this link can view this document on Google Drive."}
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
                  <span>{t("common.copied") || "Copied"}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t("shareDialog.copyLink") || "Copy Link"}</span>
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
              {t("common.close") || "Close"}
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
                    <span>{t("shareDialog.revoking") || "Stopping share..."}</span>
                  </>
                ) : (
                  <>
                    <GlobeOff className="h-3.5 w-3.5" />
                    <span>{t("shareDialog.revokeShare") || "Stop Sharing"}</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.open(shareLink, "_blank")}
                className="rounded-xl text-xs gap-1.5 cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{t("shareDialog.openDrive") || "Open in Google Drive"}</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TooltipProvider>
    </>
  );
}

