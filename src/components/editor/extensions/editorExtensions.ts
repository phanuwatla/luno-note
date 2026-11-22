import { Extension, mergeAttributes, Node as TiptapNode } from "@tiptap/core";
import Paragraph from "@tiptap/extension-paragraph";
import { ReactNodeViewRenderer, type Editor as TiptapEditor } from "@tiptap/react";
import { Fragment, type Node as PMNode, type Schema } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey, Selection, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { InputRule, inputRules } from "@tiptap/pm/inputrules";
import type { AppTheme } from "@/hooks/useAppSettings";
import { getTagColorClass } from "@/lib/tagColors";
import {
  THAI_STRUCTURAL_ANOMALY_REGEX,
  findThaiMisspellingsInText,
  isWordMisspelled,
  IGNORED_SPELL_WORDS,
} from "@/lib/spellChecker";
import { getWrongLanguageCandidate } from "@/lib/wrongLanguageDetector";
import { lowlight } from "@/lib/syntaxHighlighter";
import ToggleNodeView from "@/components/ToggleNodeView";
import { collapseBlockInTransaction, livePreviewPluginKey } from "./livePreview";

function createHashtagDecorations(doc: any, theme?: any, tagColorStyle?: any) {
  const decorations: Decoration[] = [];
  const tagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n]|$)/g;

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

export const hashtagPluginKey = new PluginKey("hashtagDecoration");

export interface HashtagDecorationOptions {
  theme: AppTheme;
  tagColorStyle: "multicolor" | "accent";
}

export const HashtagDecoration = Extension.create<HashtagDecorationOptions>({
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
                  const docSize = tr.doc.content.size;
                  if (docSize === 0) {
                    set = DecorationSet.empty;
                    return;
                  }
                  const safeStart = Math.max(1, Math.min(newStart, docSize));
                  const safeEnd = Math.max(1, Math.min(newEnd, docSize));
                  const $from = tr.doc.resolve(safeStart);
                  const $to = tr.doc.resolve(safeEnd);
                  const fromDepth = Math.max(0, Math.min($from.depth, 1));
                  const toDepth = Math.max(0, Math.min($to.depth, 1));
                  const depth = Math.min(fromDepth, toDepth);
                  if (depth >= 1) {
                    const start = $from.start(depth);
                    const end = $to.end(depth);
                    set = set.remove(set.find(start, end));
                    const newDecos: Decoration[] = [];
                    const parentNode = $from.node(depth);
                  const tagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n]|$)/g;
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
                        if (startPos >= 0 && endPos <= tr.doc.content.size && startPos < endPos) {
                          const colorClass = getTagColorClass(rawTag, options.theme, undefined, options.tagColorStyle);
                          newDecos.push(
                            Decoration.inline(startPos, endPos, {
                              class: `inline-tag-badge border ${colorClass}`,
                            })
                          );
                        }
                      }
                    }
                  });
                  if (newDecos.length > 0) {
                    set = set.add(tr.doc, newDecos);
                  }
                }
                });
              }
              return set;
            } catch {
              return oldState.map(tr.mapping, tr.doc);
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

export const spellCheckPluginKey = new PluginKey("spellCheckDecoration");
let globalSpellCheckEnabled: boolean | null = null;

export function setGlobalSpellCheckEnabled(enabled: boolean | null): void {
  globalSpellCheckEnabled = enabled;
}

const THAI_CHAR_TEST = /[\u0E00-\u0E7F]/;

const THAI_COMBINING_OR_ATTACHED = /[\u0E30-\u0E3A\u0E47-\u0E4E]/;
const THAI_BASE_CONSONANT = /[\u0E01-\u0E2E]/;

export function expandThaiAnomalyCluster(
  text: string,
  matchStart: number,
  matchEnd: number
): { start: number; end: number } | null {
  // If the anomaly is purely leading vowels like "เเ", it does not attach to a preceding consonant
  if (!THAI_COMBINING_OR_ATTACHED.test(text[matchStart])) {
    return { start: matchStart, end: matchEnd };
  }

  // Scan backwards to find the base consonant
  let clusterStart = matchStart;
  while (clusterStart > 0 && THAI_COMBINING_OR_ATTACHED.test(text[clusterStart - 1])) {
    clusterStart--;
  }

  if (clusterStart === 0 || !THAI_BASE_CONSONANT.test(text[clusterStart - 1])) {
    // No preceding base consonant to anchor to.
    // Creating an isolated inline element around orphan combining marks breaks Blink/HarfBuzz shaping.
    return null;
  }

  // Include the base consonant
  clusterStart--;

  // Scan forwards to include any trailing combining marks belonging to the same cluster
  let clusterEnd = matchEnd;
  while (clusterEnd < text.length && THAI_COMBINING_OR_ATTACHED.test(text[clusterEnd])) {
    clusterEnd++;
  }

  return { start: clusterStart, end: clusterEnd };
}

function collectSpellCheckDecorationsForNode(
  node: any,
  pos: number,
  decorations: Decoration[]
): boolean {
  if (
    node.type.name === "codeBlock" ||
    node.type.name === "codeBlockLowlight" ||
    node.type.name === "mathBlock" ||
    node.type.name === "image"
  ) {
    return false;
  }

  if (node.isText && node.text) {
    if (node.marks && node.marks.some((m: any) => m.type.name === "code")) {
      return false;
    }

    const text = node.text;

    // Collect ranges of hashtags, wikilinks, and URLs to exclude from spell checking
    const excludedRanges: Array<{ start: number; end: number }> = [];

    // 1. Hashtags: #tag (exclude from spell check so spell check decorations don't split the hashtag pill badge)
    const tagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n]|$)/g;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = tagRegex.exec(text)) !== null) {
      const rawTag = tagMatch[1];
      if (!/^\d+$/.test(rawTag)) {
        const hashIdx = tagMatch[0].indexOf("#");
        const start = tagMatch.index + hashIdx;
        const end = start + 1 + rawTag.length;
        excludedRanges.push({ start, end });
      }
    }

    // 2. Wikilinks: [[target]] or [[target|alias]]
    const wikilinkRegex = /\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g;
    let wikiMatch: RegExpExecArray | null;
    while ((wikiMatch = wikilinkRegex.exec(text)) !== null) {
      excludedRanges.push({ start: wikiMatch.index, end: wikiMatch.index + wikiMatch[0].length });
    }

    // 3. URLs, Email addresses, and file names with extensions
    const urlRegex = /https?:\/\/[^\s<>)\]}]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b[\w-]+\.(?:md|txt|pdf|png|jpg|jpeg|gif|webp|svg|mp3|mp4|webm|wav|html|css|js|ts|tsx|jsx|json|yaml|yml|docx|xlsx|zip)\b/gi;
    let urlMatch: RegExpExecArray | null;
    while ((urlMatch = urlRegex.exec(text)) !== null) {
      excludedRanges.push({ start: urlMatch.index, end: urlMatch.index + urlMatch[0].length });
    }

    const isInsideExcludedRange = (fromIdx: number, toIdx: number) =>
      excludedRanges.some((r) => fromIdx < r.end && toIdx > r.start);

    const thaiAnomalyRegex = THAI_STRUCTURAL_ANOMALY_REGEX;
    const latinSpellRegex = /(?<![A-Za-z0-9_])[A-Za-z]+(?:['\u2019][A-Za-z]+)*(?![A-Za-z0-9_])/g;

    // 1. Thai Dictionary DAG Segmentation, Misspellings & Typographical Anomalies check
    if (THAI_CHAR_TEST.test(text)) {
      const decoratedRanges: Array<{ start: number; end: number }> = [];
      const thaiErrors = findThaiMisspellingsInText(text);

      for (const err of thaiErrors) {
        if (isInsideExcludedRange(err.start, err.end)) continue;
        const from = pos + err.start;
        const to = pos + err.end;
        if (from >= 0 && to <= pos + text.length && from < to) {
          decoratedRanges.push({ start: err.start, end: err.end });
          decorations.push(
            Decoration.inline(from, to, {
              class: "luno-spell-error",
              "data-spell-word": err.word,
            })
          );
        }
      }

      thaiAnomalyRegex.lastIndex = 0;
      let match: RegExpExecArray | null;
      let lastAnomalyEnd = -1;
      while ((match = thaiAnomalyRegex.exec(text)) !== null) {
        if (isInsideExcludedRange(match.index, match.index + match[0].length)) continue;
        const expanded = expandThaiAnomalyCluster(text, match.index, match.index + match[0].length);
        if (!expanded) continue;
        if (decoratedRanges.some((r) => expanded.start < r.end && expanded.end > r.start)) {
          continue;
        }
        if (expanded.start < lastAnomalyEnd) {
          continue;
        }
        lastAnomalyEnd = expanded.end;
        const word = text.slice(expanded.start, expanded.end);
        const from = pos + expanded.start;
        const to = pos + expanded.end;
        if (from >= 0 && to <= pos + text.length && from < to) {
          decorations.push(
            Decoration.inline(from, to, {
              class: "luno-spell-error",
              "data-spell-word": word,
            })
          );
        }
      }
    }

    // 2. English words check (Hunspell nspell + dictionary-en)
    latinSpellRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = latinSpellRegex.exec(text)) !== null) {
      if (isInsideExcludedRange(match.index, match.index + match[0].length)) continue;
      const word = match[0];
      if (word.length >= 2 && !IGNORED_SPELL_WORDS.has(word.toLowerCase())) {
        if (isWordMisspelled(word)) {
          const from = pos + match.index;
          const to = from + word.length;
          if (from >= 0 && to <= pos + text.length && from < to) {
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
  }
  return true;
}

function createSpellCheckDecorations(doc: any, enabled: boolean): DecorationSet {
  if (!enabled) return DecorationSet.empty;
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    return collectSpellCheckDecorationsForNode(node, pos, decorations);
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
    const isSpellCheckActive = (meta?: { enabled?: boolean }) => {
      if (typeof meta?.enabled === "boolean") {
        extension.options.enabled = meta.enabled;
        return meta.enabled;
      }
      if (globalSpellCheckEnabled !== null) {
        return globalSpellCheckEnabled;
      }
      return Boolean(extension.options.enabled);
    };

    return [
      new Plugin({
        key: spellCheckPluginKey,
        state: {
          init(_, { doc }) {
            return isSpellCheckActive() ? createSpellCheckDecorations(doc, true) : DecorationSet.empty;
          },
          apply(tr, oldState) {
            const meta = tr.getMeta(spellCheckPluginKey);
            if (!isSpellCheckActive(meta)) return DecorationSet.empty;
            if (meta?.recompute || oldState === DecorationSet.empty) {
              return createSpellCheckDecorations(tr.doc, true);
            }
            if (!tr.docChanged || tr.steps.length === 0) return oldState;

            try {
              let set = oldState.map(tr.mapping, tr.doc);
              for (const step of tr.steps) {
                step.getMap().forEach((_oldStart, _oldEnd, newStart, newEnd) => {
                  const docSize = tr.doc.content.size;
                  if (docSize === 0) {
                    set = DecorationSet.empty;
                    return;
                  }
                  const safeStart = Math.max(1, Math.min(newStart, docSize));
                  const safeEnd = Math.max(1, Math.min(newEnd, docSize));
                  const $from = tr.doc.resolve(safeStart);
                  const $to = tr.doc.resolve(safeEnd);
                  const fromDepth = Math.max(0, Math.min($from.depth, 1));
                  const toDepth = Math.max(0, Math.min($to.depth, 1));
                  const depth = Math.min(fromDepth, toDepth);
                  if (depth >= 1) {
                    const start = $from.start(depth);
                    const end = $to.end(depth);
                    set = set.remove(set.find(start, end));
                    const newDecos: Decoration[] = [];
                    const parentNode = $from.node(depth);
                    parentNode.descendants((child: any, childPos: number) => {
                      const absPos = start + childPos;
                      collectSpellCheckDecorationsForNode(child, absPos, newDecos);
                    });
                    if (newDecos.length > 0) {
                      set = set.add(tr.doc, newDecos);
                    }
                  }
                });
              }
              return set;
            } catch {
              return oldState.map(tr.mapping, tr.doc);
            }
          },
        },
        props: {
          decorations(state) {
            if (!isSpellCheckActive()) return DecorationSet.empty;
            return spellCheckPluginKey.getState(state) || DecorationSet.empty;
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

export const inlineCodeHighlightPluginKey = new PluginKey("inlineCodeHighlight");

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
            if (!tr.docChanged || tr.steps.length === 0) return oldState;
            try {
              let set = oldState.map(tr.mapping, tr.doc);
              for (const step of tr.steps) {
                step.getMap().forEach((_oldStart, _oldEnd, newStart, newEnd) => {
                  const docSize = tr.doc.content.size;
                  if (docSize === 0) {
                    set = DecorationSet.empty;
                    return;
                  }
                  const safeStart = Math.max(1, Math.min(newStart, docSize));
                  const safeEnd = Math.max(1, Math.min(newEnd, docSize));
                  const $from = tr.doc.resolve(safeStart);
                  const $to = tr.doc.resolve(safeEnd);
                  const fromDepth = Math.max(0, Math.min($from.depth, 1));
                  const toDepth = Math.max(0, Math.min($to.depth, 1));
                  const depth = Math.min(fromDepth, toDepth);
                  if (depth >= 1) {
                    const start = $from.start(depth);
                    const end = $to.end(depth);
                    set = set.remove(set.find(start, end));
                    const newDecos: Decoration[] = [];
                    const parentNode = $from.node(depth);
                    parentNode.descendants((child: any, childPos: number, parent: any) => {
                      if (child.isText) {
                        if (parent && (parent.type.name === "codeBlock" || parent.type.name === "code")) return;
                        const hasCodeMark = child.marks && child.marks.some((m: any) => m.type.name === "code");
                        if (!hasCodeMark) return;
                        const text = child.text || "";
                        if (!text.trim()) return;
                        try {
                          const result = lowlight.highlightAuto(text);
                          if (result?.children?.length) {
                            parseLowlightAst(result.children, start + childPos, newDecos, []);
                          }
                        } catch { /* ignore */ }
                      }
                    });
                    if (newDecos.length > 0) {
                      set = set.add(tr.doc, newDecos);
                    }
                  }
                });
              }
              return set;
            } catch {
              return oldState.map(tr.mapping, tr.doc);
            }
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
  enabled: boolean | (() => boolean);
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

  addStorage() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    const rules = buildSmartTypographyRules(() => {
      const opt = extension.options.enabled;
      if (typeof opt === "function") return Boolean(opt());
      if (typeof (extension.editor?.storage as any)?.smartTypography?.enabled === "boolean") {
        return (extension.editor.storage as any).smartTypography.enabled;
      }
      return Boolean(opt);
    });
    return [inputRules({ rules })];
  },
});

export const wrongLanguageSuggestionPluginKey = new PluginKey("wrongLanguageSuggestion");

export interface WrongLanguageSuggestionOptions {
  enabled: boolean;
}

export interface WrongLangPluginState {
  suggestion: {
    from: number;
    to: number;
    original: string;
    replacement: string;
    targetLang: "th" | "en";
  } | null;
  dismissedPos: number | null;
}

export const WrongLanguageSuggestion = Extension.create<WrongLanguageSuggestionOptions>({
  name: "wrongLanguageSuggestion",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: wrongLanguageSuggestionPluginKey,
        state: {
          init() {
            return { suggestion: null, dismissedPos: null } as WrongLangPluginState;
          },
          apply(tr, oldState: WrongLangPluginState, _oldEditorState, newEditorState) {
            if (!extension.options.enabled) {
              return { suggestion: null, dismissedPos: null };
            }

            const meta = tr.getMeta(wrongLanguageSuggestionPluginKey);
            if (meta?.dismiss) {
              return { suggestion: null, dismissedPos: newEditorState.selection.head };
            }

            const sel = newEditorState.selection;
            if (!sel.empty) {
              return { suggestion: null, dismissedPos: null };
            }

            const head = sel.head;
            if (oldState.dismissedPos === head && !tr.docChanged) {
              return oldState;
            }

            const $head = sel.$head;
            const parent = $head.parent;
            if (!parent.isTextblock || parent.type.name === "codeBlock" || parent.type.name === "codeBlockLowlight") {
              return { suggestion: null, dismissedPos: null };
            }

            const startOfBlock = $head.start();
            const textBefore = newEditorState.doc.textBetween(startOfBlock, head, "\n", "\n");
            const candidate = getWrongLanguageCandidate(textBefore);

            if (!candidate) {
              return { suggestion: null, dismissedPos: null };
            }

            const from = head - candidate.fromOffset;
            const to = head;

            return {
              suggestion: {
                from,
                to,
                original: candidate.original,
                replacement: candidate.replacement,
                targetLang: candidate.targetLang,
              },
              dismissedPos: null,
            };
          },
        },
        props: {
          decorations(state) {
            try {
              if (!extension.options.enabled) return DecorationSet.empty;
              const pluginState = wrongLanguageSuggestionPluginKey.getState(state) as WrongLangPluginState | undefined;
              if (!pluginState || !pluginState.suggestion) return DecorationSet.empty;

              const { to, replacement } = pluginState.suggestion;
              const widget = Decoration.widget(
                to,
                () => {
                  const span = document.createElement("span");
                  span.className =
                    "luno-ghost-suggestion select-none pointer-events-none opacity-50 dark:opacity-60 italic text-muted-foreground font-normal inline-flex items-center align-middle gap-1.5 ml-1";
                  span.dataset.ghostReplacement = replacement;

                  const textSpan = document.createElement("span");
                  textSpan.className = "inline-flex items-center leading-none";
                  textSpan.textContent = replacement;
                  span.appendChild(textSpan);

                  const kbd = document.createElement("kbd");
                  kbd.className =
                    "not-italic text-[0.8em] leading-none px-1.5 py-1 rounded-md bg-muted border border-border/80 text-muted-foreground font-mono font-medium shadow-sm inline-flex items-center justify-center align-middle";
                  kbd.textContent = "Tab ⇥";
                  span.appendChild(kbd);

                  return span;
                },
                { side: 1, key: "luno-ghost-suggestion" }
              );

              return DecorationSet.create(state.doc, [widget]);
            } catch {
              return DecorationSet.empty;
            }
          },
        },
      }),
    ];
  },
});


let pendingToggleTitleFocusAt = 0;

interface ActiveToggleTitleEntry {
  getPos: () => number | undefined;
  inputEl: HTMLInputElement | null;
  focused: boolean;
  keepPendingForToolbar: boolean;
}

export interface ToggleUnwrapTarget {
  pos: number;
  nodeSize: number;
  liveTitle?: string;
}

export interface UnwrapToggleOptions {
  liveTitle?: string;
  cursorPlacement?: "preserve" | "start" | "titleEnd";
}

const activeToggleTitleByEditor = new WeakMap<TiptapEditor, ActiveToggleTitleEntry>();
const toggleFocusListeners = new Set<(editor: TiptapEditor) => void>();
const toggleFocusPluginKey = new PluginKey("lunoToggleFocus");

function notifyToggleFocusListeners(editor: TiptapEditor): void {
  toggleFocusListeners.forEach((listener) => {
    try {
      listener(editor);
    } catch {
      /* ignore listener errors */
    }
  });
}

export function subscribeToggleFocusChange(listener: (editor: TiptapEditor) => void): () => void {
  toggleFocusListeners.add(listener);
  return () => {
    toggleFocusListeners.delete(listener);
  };
}

export function registerFocusedToggleTitle(
  editor: TiptapEditor | undefined,
  getPos: (() => number | undefined) | undefined,
  inputEl: HTMLInputElement | null
): void {
  if (!editor || typeof getPos !== "function") return;
  activeToggleTitleByEditor.set(editor, {
    getPos,
    inputEl,
    focused: true,
    keepPendingForToolbar: false,
  });
  notifyToggleFocusListeners(editor);
}

export function blurFocusedToggleTitle(
  editor: TiptapEditor | undefined,
  inputEl: HTMLInputElement | null,
  keepPendingForToolbar = false
): void {
  if (!editor) return;
  const entry = activeToggleTitleByEditor.get(editor);
  if (!entry || (inputEl && entry.inputEl !== inputEl)) return;
  if (keepPendingForToolbar) {
    entry.focused = false;
    entry.keepPendingForToolbar = true;
  } else {
    activeToggleTitleByEditor.delete(editor);
  }
  notifyToggleFocusListeners(editor);
}

export function clearFocusedToggleTitle(
  editor: TiptapEditor | undefined,
  onlyIfInputEl?: HTMLInputElement | null
): void {
  if (!editor) return;
  const entry = activeToggleTitleByEditor.get(editor);
  if (!entry) return;
  if (onlyIfInputEl && entry.inputEl !== onlyIfInputEl) return;
  activeToggleTitleByEditor.delete(editor);
  notifyToggleFocusListeners(editor);
}

export function isPendingToggleTitleFocus(): boolean {
  if (!pendingToggleTitleFocusAt) return false;
  return Date.now() - pendingToggleTitleFocusAt < 500;
}

export function clearPendingToggleTitleFocus(): void {
  pendingToggleTitleFocusAt = 0;
}

export function consumePendingToggleTitleFocus(): boolean {
  if (!isPendingToggleTitleFocus()) return false;
  pendingToggleTitleFocusAt = 0;
  return true;
}

export function getToggleButtonMode(selection: { empty: boolean }): "wrap" | "insert" {
  return selection.empty ? "insert" : "wrap";
}

export function isToggleBodyEmptySingleParagraph(
  node:
    | {
        childCount?: number;
        firstChild?: { type?: { name?: string }; content?: { size?: number } } | null;
      }
    | null
    | undefined
): boolean {
  if (!node || node.childCount !== 1) return false;
  const firstChild = node.firstChild;
  if (!firstChild || firstChild.type?.name !== "paragraph") return false;
  return (firstChild.content?.size ?? 0) === 0;
}

function getValidActiveToggleTitleTarget(
  editor: TiptapEditor,
  requireToolbarOrFocused: boolean
): ToggleUnwrapTarget | null {
  const entry = activeToggleTitleByEditor.get(editor);
  if (!entry || !editor.state?.doc) return null;

  if (!entry.focused) {
    if (!entry.keepPendingForToolbar) return null;
    if (requireToolbarOrFocused && typeof document !== "undefined") {
      const active = document.activeElement;
      const inToolbarOrMenu =
        active instanceof HTMLElement &&
        Boolean(
          active.closest(
            '[data-editor-toolbar="true"], [role="menu"], [data-radix-popper-content-wrapper]'
          )
        );
      if (!inToolbarOrMenu) return null;
    }
  } else if (
    typeof document !== "undefined" &&
    entry.inputEl &&
    document.activeElement !== entry.inputEl &&
    !entry.keepPendingForToolbar
  ) {
    // Input is still marked focused in tests or during toolbar mousedown preventDefault;
    // only ignore if focus clearly moved to another non-toolbar element
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      !active.closest(
        '[data-editor-toolbar="true"], [role="menu"], [data-radix-popper-content-wrapper]'
      )
    ) {
      return null;
    }
  }

  const pos = entry.getPos();
  if (typeof pos !== "number" || pos < 0 || pos >= editor.state.doc.content.size) {
    return null;
  }
  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "toggle") {
    return null;
  }
  const liveTitle =
    entry.inputEl && typeof entry.inputEl.value === "string"
      ? entry.inputEl.value
      : String(node.attrs?.title ?? "");

  return {
    pos,
    nodeSize: node.nodeSize,
    liveTitle,
  };
}

function findEnclosingToggleAtResolvedPos(
  $pos: { depth: number; node: (d: number) => PMNode; before: (d: number) => number }
): { pos: number; nodeSize: number; depth: number } | null {
  for (let d = $pos.depth; d >= 1; d--) {
    const ancestor = $pos.node(d);
    if (ancestor?.type?.name === "toggle") {
      return {
        pos: $pos.before(d),
        nodeSize: ancestor.nodeSize,
        depth: d,
      };
    }
  }
  return null;
}

export function findToggleTargets(
  editor: TiptapEditor | null,
  options?: { ignoreTitleInput?: boolean; requireToolbarOrFocused?: boolean }
): { targets: ToggleUnwrapTarget[]; fromTitleInput: boolean } {
  if (!editor || editor.isDestroyed || !editor.state) {
    return { targets: [], fromTitleInput: false };
  }

  if (!options?.ignoreTitleInput) {
    const titleTarget = getValidActiveToggleTitleTarget(
      editor,
      Boolean(options?.requireToolbarOrFocused)
    );
    if (titleTarget) {
      return { targets: [titleTarget], fromTitleInput: true };
    }
  }

  const { selection, doc } = editor.state;
  if (!selection || !doc) {
    return { targets: [], fromTitleInput: false };
  }

  // 1. NodeSelection directly on a toggle node
  if (
    selection instanceof NodeSelection ||
    ("node" in selection && (selection as NodeSelection).node?.type?.name === "toggle")
  ) {
    const selectedNode = (selection as NodeSelection).node;
    if (selectedNode?.type?.name === "toggle") {
      return {
        targets: [{ pos: selection.from, nodeSize: selectedNode.nodeSize }],
        fromTitleInput: false,
      };
    }
  }

  const $from = (selection as { $from?: { depth: number; node: (d: number) => PMNode; before: (d: number) => number } }).$from;
  const $to = (selection as { $to?: { depth: number; node: (d: number) => PMNode; before: (d: number) => number } }).$to;

  if ($from && $to && typeof $from.depth === "number" && typeof $to.depth === "number") {
    // 2. Shared enclosing toggle (handles collapsed cursor & selections inside a single toggle, including nested toggles)
    const maxSharedDepth = Math.min($from.depth, $to.depth);
    for (let d = maxSharedDepth; d >= 1; d--) {
      if ($from.node(d)?.type?.name === "toggle" && $from.before(d) === $to.before(d)) {
        return {
          targets: [{ pos: $from.before(d), nodeSize: $from.node(d).nodeSize }],
          fromTitleInput: false,
        };
      }
    }

    // 3. Selection spanning across one or more toggle boundaries
    if (selection.from < selection.to) {
      const collected: ToggleUnwrapTarget[] = [];
      const seenPos = new Set<number>();

      const addTarget = (pos: number, nodeSize: number) => {
        if (seenPos.has(pos)) return;
        seenPos.add(pos);
        collected.push({ pos, nodeSize });
      };

      const fromToggle = findEnclosingToggleAtResolvedPos($from);
      if (fromToggle) {
        addTarget(fromToggle.pos, fromToggle.nodeSize);
      }

      if (typeof doc.nodesBetween === "function") {
        doc.nodesBetween(selection.from, selection.to, (node: PMNode, pos: number) => {
          if (node.type.name === "toggle") {
            addTarget(pos, node.nodeSize);
            return false;
          }
          return true;
        });
      }

      const toToggle = findEnclosingToggleAtResolvedPos($to);
      if (toToggle) {
        addTarget(toToggle.pos, toToggle.nodeSize);
      }

      if (collected.length > 0) {
        collected.sort((a, b) => a.pos - b.pos);
        // Filter out targets nested inside another collected target
        const outermost: ToggleUnwrapTarget[] = [];
        for (const candidate of collected) {
          const isNested = outermost.some(
            (outer) => candidate.pos >= outer.pos && candidate.pos + candidate.nodeSize <= outer.pos + outer.nodeSize
          );
          if (!isNested) {
            outermost.push(candidate);
          }
        }
        return { targets: outermost, fromTitleInput: false };
      }
    }
  }

  return { targets: [], fromTitleInput: false };
}

export function isToggleActive(editor: TiptapEditor | null): boolean {
  if (!editor || editor.isDestroyed || !editor.state) return false;
  return findToggleTargets(editor, { requireToolbarOrFocused: true }).targets.length > 0;
}

function buildUnwrappedToggleNodes(
  schema: Schema,
  toggleNode: PMNode,
  liveTitle?: string
): { nodes: PMNode[]; titleNodeSize: number; skippedEmptyBody: boolean } {
  const paragraphType = schema.nodes.paragraph;
  const rawTitle = typeof liveTitle === "string" ? liveTitle : String(toggleNode.attrs?.title ?? "");
  const cleanTitle = rawTitle.trim();

  const nodes: PMNode[] = [];
  let titleNodeSize = 0;

  if (cleanTitle.length > 0 && paragraphType) {
    const titleParagraph = paragraphType.create(null, schema.text(cleanTitle));
    nodes.push(titleParagraph);
    titleNodeSize = titleParagraph.nodeSize;
  }

  const bodyIsSingleEmptyParagraph = isToggleBodyEmptySingleParagraph(toggleNode);

  if (cleanTitle.length > 0 && bodyIsSingleEmptyParagraph) {
    return { nodes, titleNodeSize, skippedEmptyBody: true };
  }

  toggleNode.forEach((child) => {
    nodes.push(child);
  });

  if (nodes.length === 0 && paragraphType) {
    nodes.push(paragraphType.create());
  }

  return { nodes, titleNodeSize, skippedEmptyBody: false };
}

function focusToggleTitleInputAtPos(editor: TiptapEditor, togglePos: number): boolean {
  try {
    const dom = editor.view?.nodeDOM(togglePos);
    const input =
      dom instanceof HTMLElement
        ? dom.querySelector<HTMLInputElement>(":scope > summary input")
        : null;
    if (!input) return false;
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
    return true;
  } catch {
    return false;
  }
}

export function unwrapToggles(
  editor: TiptapEditor | null,
  targets: ToggleUnwrapTarget[],
  options?: UnwrapToggleOptions
): boolean {
  if (!editor || editor.isDestroyed || !editor.view || !editor.state || targets.length === 0) {
    return false;
  }

  const { state } = editor;
  const tr = state.tr;
  const cursorPlacement = options?.cursorPlacement ?? "preserve";

  const origSelFrom = state.selection.from;
  const origSelTo = state.selection.to;

  // Collapse active LivePreview block first if it lies inside any toggle being unwrapped
  // so temporarily expanded raw markdown syntax is converted back to formatted ProseMirror nodes.
  const lpState = state.plugins ? livePreviewPluginKey.getState(state) : undefined;
  if (lpState?.activeBlock) {
    const lpPos = lpState.activeBlock.blockPos;
    const affectsActiveBlock = targets.some(
      (target) => lpPos >= target.pos && lpPos < target.pos + target.nodeSize
    );
    if (affectsActiveBlock) {
      collapseBlockInTransaction(tr, lpState.activeBlock, state.schema);
      tr.setMeta(livePreviewPluginKey, { activeBlock: null });
    }
  }

  const mappedSelFrom = tr.mapping.map(origSelFrom);
  const mappedSelTo = tr.mapping.map(origSelTo);

  // Map and sort descending so earlier replacements never shift remaining positions
  const mappedTargets = targets
    .map((target) => ({
      pos: tr.mapping.map(target.pos),
      liveTitle: target.liveTitle ?? options?.liveTitle,
    }))
    .sort((a, b) => b.pos - a.pos);

  let unwrappedCount = 0;
  let firstUnwrappedPos: number | null = null;
  let firstTitleNodeSize = 0;
  let preservedSelectionRange: { from: number; to: number } | null = null;

  for (const target of mappedTargets) {
    if (target.pos < 0 || target.pos >= tr.doc.content.size) continue;
    const toggleNode = tr.doc.nodeAt(target.pos);
    if (!toggleNode || toggleNode.type.name !== "toggle") continue;

    const { nodes, titleNodeSize, skippedEmptyBody } = buildUnwrappedToggleNodes(
      state.schema,
      toggleNode,
      target.liveTitle
    );
    if (nodes.length === 0) continue;

    const fragment = Fragment.fromArray(nodes);
    const oldEnd = target.pos + toggleNode.nodeSize;

    const selWasInsideToggle =
      mappedTargets.length === 1 &&
      cursorPlacement === "preserve" &&
      mappedSelFrom >= target.pos + 1 &&
      mappedSelFrom < oldEnd;

    const relFrom = selWasInsideToggle ? Math.max(0, mappedSelFrom - (target.pos + 1)) : 0;
    const relTo = selWasInsideToggle
      ? Math.max(relFrom, Math.min(mappedSelTo, oldEnd - 1) - (target.pos + 1))
      : 0;

    tr.replaceWith(target.pos, oldEnd, fragment);
    unwrappedCount++;
    firstUnwrappedPos = target.pos;
    firstTitleNodeSize = titleNodeSize;

    if (selWasInsideToggle) {
      if (skippedEmptyBody) {
        const titleEnd = Math.min(target.pos + Math.max(1, titleNodeSize - 1), tr.doc.content.size);
        preservedSelectionRange = { from: titleEnd, to: titleEnd };
      } else {
        const newContentStart = target.pos + titleNodeSize;
        const newContentEnd = target.pos + fragment.size;
        preservedSelectionRange = {
          from: Math.min(newContentStart + relFrom, newContentEnd, tr.doc.content.size),
          to: Math.min(newContentStart + relTo, newContentEnd, tr.doc.content.size),
        };
      }
    }
  }

  if (unwrappedCount === 0 || firstUnwrappedPos === null) {
    return false;
  }

  // Position cursor cleanly after unwrapping
  try {
    const docSize = tr.doc.content.size;
    if (cursorPlacement === "preserve" && preservedSelectionRange) {
      const $newFrom = tr.doc.resolve(Math.max(0, Math.min(preservedSelectionRange.from, docSize)));
      const $newTo = tr.doc.resolve(Math.max(0, Math.min(preservedSelectionRange.to, docSize)));
      if ($newFrom.parent.inlineContent && $newTo.parent.inlineContent) {
        tr.setSelection(TextSelection.create(tr.doc, $newFrom.pos, $newTo.pos));
      } else {
        tr.setSelection(Selection.near($newFrom, 1));
      }
    } else if (cursorPlacement === "titleEnd" && firstTitleNodeSize > 0) {
      const endPos = Math.max(0, Math.min(firstUnwrappedPos + firstTitleNodeSize - 1, docSize));
      tr.setSelection(Selection.near(tr.doc.resolve(endPos), -1));
    } else {
      const startPos = Math.max(0, Math.min(firstUnwrappedPos, docSize));
      tr.setSelection(Selection.near(tr.doc.resolve(startPos), 1));
    }
  } catch {
    /* keep ProseMirror mapped selection if resolution fails */
  }

  clearPendingToggleTitleFocus();
  activeToggleTitleByEditor.delete(editor);
  notifyToggleFocusListeners(editor);

  editor.view.dispatch(tr.scrollIntoView());
  editor.view.focus();
  return true;
}

export function unwrapToggleAtPos(
  editor: TiptapEditor | null,
  pos: number,
  options?: UnwrapToggleOptions
): boolean {
  if (!editor || editor.isDestroyed || !editor.state?.doc) return false;
  if (typeof pos !== "number" || pos < 0 || pos >= editor.state.doc.content.size) return false;
  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "toggle") return false;
  return unwrapToggles(
    editor,
    [{ pos, nodeSize: node.nodeSize, liveTitle: options?.liveTitle }],
    options
  );
}

export function handleToggleClick(editor: TiptapEditor | null) {
  if (!editor) return;

  // If the user is currently inside, focused on, or selecting a Toggle, cancel/unwrap it:
  // the Toggle title becomes a normal paragraph and inner content is lifted out preserving all formatting.
  const { targets, fromTitleInput } = findToggleTargets(editor);
  if (targets.length > 0) {
    unwrapToggles(editor, targets, {
      cursorPlacement: fromTitleInput ? "titleEnd" : "preserve",
    });
    return;
  }

  const { from, to, empty } = editor.state.selection;
  const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ", " ").trim();

  pendingToggleTitleFocusAt = Date.now();

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
  isolating: true,
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
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        if (!selection.empty) return false;
        const { $from } = selection;
        if ($from.parentOffset !== 0) return false;

        // 1. At the start of the first direct child inside a Toggle body:
        //    never rip the block above the toggle or silently discard the toggle title.
        if (
          $from.depth >= 2 &&
          $from.node($from.depth - 1).type.name === "toggle" &&
          $from.index($from.depth - 1) === 0
        ) {
          if ($from.parent.type.name === "heading") {
            return editor.commands.setParagraph();
          }
          if ($from.parent.type.name === "paragraph") {
            const togglePos = $from.before($from.depth - 1);
            focusToggleTitleInputAtPos(editor, togglePos);
            return true;
          }
        }

        // 2. Empty paragraph directly after a Toggle:
        //    delete the empty line and move focus cleanly without trapping cursor in a collapsed Toggle.
        if (
          $from.parent.type.name === "paragraph" &&
          $from.parent.content.size === 0 &&
          $from.depth >= 1 &&
          $from.index($from.depth - 1) > 0
        ) {
          const parentDepth = $from.depth - 1;
          const prevIndex = $from.index(parentDepth) - 1;
          const prevNode = $from.node(parentDepth).child(prevIndex);
          if (prevNode.type.name === "toggle") {
            const emptyParaFrom = $from.before();
            const emptyParaTo = $from.after();
            const prevTogglePos = emptyParaFrom - prevNode.nodeSize;
            const tr = editor.state.tr.delete(emptyParaFrom, emptyParaTo);
            if (prevNode.attrs?.open) {
              const targetPos = Math.min(prevTogglePos + prevNode.nodeSize - 1, tr.doc.content.size);
              tr.setSelection(Selection.near(tr.doc.resolve(targetPos), -1));
              editor.view.dispatch(tr.scrollIntoView());
            } else {
              editor.view.dispatch(tr.scrollIntoView());
              focusToggleTitleInputAtPos(editor, prevTogglePos);
            }
            return true;
          }
        }

        return false;
      },
      Enter: ({ editor }) => {
        const { selection, schema } = editor.state;
        if (!selection.empty) return false;
        const { $from } = selection;

        // Pressing Enter on a trailing empty paragraph at the end of a Toggle (when it has preceding content)
        // exits the Toggle cleanly into a normal paragraph below without duplicating or breaking the Toggle.
        if (
          $from.depth >= 2 &&
          $from.node($from.depth - 1).type.name === "toggle" &&
          $from.parent.type.name === "paragraph" &&
          $from.parent.content.size === 0
        ) {
          const toggleDepth = $from.depth - 1;
          const toggleNode = $from.node(toggleDepth);
          const childIndex = $from.index(toggleDepth);
          const paragraphType = schema.nodes.paragraph;
          if (
            paragraphType &&
            toggleNode.childCount > 1 &&
            childIndex === toggleNode.childCount - 1
          ) {
            const tr = editor.state.tr;
            const afterToggleBeforeDelete = $from.after(toggleDepth);
            tr.delete($from.before(), $from.after());
            const insertPos = tr.mapping.map(afterToggleBeforeDelete);
            tr.insert(insertPos, paragraphType.create());
            tr.setSelection(TextSelection.create(tr.doc, Math.min(insertPos + 1, tr.doc.content.size)));
            editor.view.dispatch(tr.scrollIntoView());
            return true;
          }
        }
        return false;
      },
    };
  },
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: toggleFocusPluginKey,
        state: {
          init() {
            return null;
          },
          apply(tr) {
            const entry = activeToggleTitleByEditor.get(editor);
            if (!entry) return null;

            const isActivelyTypingInInput =
              entry.focused &&
              !tr.selectionSet &&
              (typeof document === "undefined" || !entry.inputEl || document.activeElement === entry.inputEl);

            if (isActivelyTypingInInput) {
              const pos = entry.getPos();
              if (
                typeof pos !== "number" ||
                pos < 0 ||
                pos >= tr.doc.content.size ||
                tr.doc.nodeAt(pos)?.type.name !== "toggle"
              ) {
                activeToggleTitleByEditor.delete(editor);
                notifyToggleFocusListeners(editor);
              }
            } else if (tr.selectionSet || tr.docChanged) {
              activeToggleTitleByEditor.delete(editor);
              notifyToggleFocusListeners(editor);
            }
            return null;
          },
        },
        props: {
          handleDOMEvents: {
            focus(_view, event) {
              const target = event.target;
              const isToggleTitleInput =
                target instanceof HTMLInputElement && Boolean(target.closest("details > summary"));
              if (!isToggleTitleInput && activeToggleTitleByEditor.has(editor)) {
                clearFocusedToggleTitle(editor);
              }
              return false;
            },
          },
        },
      }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ToggleNodeView, {
      update: ({ oldNode, newNode, updateProps }) => {
        if (newNode.type.name !== oldNode.type.name) {
          return false;
        }
        if (
          oldNode.attrs.open !== newNode.attrs.open ||
          oldNode.attrs.title !== newNode.attrs.title ||
          oldNode.content !== newNode.content
        ) {
          updateProps();
        }
        return true;
      },
    });
  },
});

export const CustomParagraph = Paragraph.extend({
  parseHTML() {
    return [
      { tag: "p" },
      {
        tag: "div",
        getAttrs: (element: HTMLElement) => {
          if (
            element.classList?.contains("code-block-wrapper") ||
            element.classList?.contains("tableWrapper") ||
            element.closest("details, table, [data-type='taskItem']")
          ) {
            return false;
          }
          return { rawTag: "div" };
        },
      },
    ];
  },
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
      rawTag: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-raw-tag") ||
          (element.tagName?.toLowerCase() === "div" ? "div" : null),
        renderHTML: (attributes) => {
          if (!attributes.rawTag) return {};
          return { "data-raw-tag": attributes.rawTag };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("style");
          if (!raw) return null;
          const cleaned = raw.replace(/(?:^|;)\s*text-align\s*:[^;]+/gi, "").trim().replace(/^;/, "");
          return cleaned || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

export {
  LivePreview,
  livePreviewPluginKey,
  isPosInDocumentTitleH1,
  findTargetTextblock,
  findInlineFormattedRuns,
  findTouchedInlineRun,
  isExpandableMediaNode,
  serializeMediaNodeToRawMarkdown,
  parseRawMarkdownToMediaNode,
  serializeInlineNodesToRawMarkdown,
  serializeBlockToRawMarkdown,
  parseInlineMarkdownToProseMirrorNodes,
  expandBlockInTransaction,
  collapseBlockInTransaction,
  buildLivePreviewDecorations,
  captureCanonicalSnapshot,
  livePreviewUndo,
  livePreviewRedo,
  livePreviewUndoDepth,
  livePreviewRedoDepth,
  getCleanCollapsedHtml,
  type LivePreviewOptions,
  type LivePreviewPluginState,
  type LivePreviewHistoryEntry,
  type InlineFormattedRun,
  type ActiveInlineSpan,
  type ActiveLiveBlockInfo,
  type LiveBlockContext,
} from "./livePreview";
