import { useEffect, useRef, useCallback, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorView, keymap, MatchDecorator, Decoration, ViewPlugin, WidgetType, scrollPastEnd } from "@codemirror/view";
import { EditorState, Extension, Prec } from "@codemirror/state";
import { search, SearchQuery, setSearchQuery, SearchCursor } from "@codemirror/search";
import { indentWithTab } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting, foldGutter, indentUnit } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { uniformIndentGuides } from "./codemirror/indentGuides";
import { documentWidthExtension } from "./codemirror/horizontalScroll";
import { getNoteScrollPosition, setNoteScrollPosition, closedNoteIds } from "@/components/Editor";
import { swapKeyboardLayout } from "@/lib/thaiKeyboardMapper";
import {
  FIX_LANGUAGE_EVENT,
  showSelectTextToFixToast,
  type FixLanguageEventDetail,
} from "@/lib/fixLanguageSystem";

export interface HtmlCodeEditorHandle {
  findNext: (query?: string) => { total: number; current: number };
  findPrev: (query?: string) => { total: number; current: number };
  setSearchQuery: (query: string) => { total: number; current: number };
  clearSearch: () => void;
  focus: () => void;
  getSelectionText: () => string;
}

export interface HtmlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  fontSize?: number;
  onCursorChange?: (line: number, col: number) => void;
  spellCheck?: boolean;
  noteId?: string;
  language?: "html" | "css" | "javascript" | "js";
  isVisible?: boolean;
  onBlur?: () => void;
  showIndentGuides?: boolean;
  wrapLines?: boolean;
  onOpenSearch?: (selectedText?: string) => void;
}

const lunoHighlightStyle = HighlightStyle.define([
  { tag: t.comment, color: "var(--hl-comment)" },
  { tag: [t.tagName, t.heading], color: "var(--hl-tag)" },
  { tag: [t.attributeName, t.propertyName], color: "var(--hl-attr)" },
  { tag: [t.string, t.special(t.string)], color: "var(--hl-string)" },
  { tag: [t.keyword, t.definitionKeyword, t.modifier], color: "var(--hl-keyword)" },
  { tag: [t.number, t.bool, t.null], color: "var(--hl-number, var(--hl-string))" },
  { tag: [t.punctuation, t.separator, t.bracket], color: "var(--hl-punct)" },
  { tag: [t.operator, t.operatorKeyword], color: "var(--hl-punct)" },
  { tag: [t.variableName, t.definition(t.variableName)], color: "hsl(var(--foreground))" },
  { tag: t.className, color: "var(--hl-tag)" },
]);

function toHex6(color: string): string | null {
  const c = color.trim().toLowerCase();
  if (c.startsWith("#")) {
    const raw = c.slice(1);
    if (raw.length === 3 || raw.length === 4) {
      return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
    }
    if (raw.length === 6 || raw.length === 8) {
      return `#${raw.slice(0, 6)}`;
    }
    return null;
  }
  const rgbMatch = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = Math.min(255, parseInt(rgbMatch[1], 10)).toString(16).padStart(2, "0");
    const g = Math.min(255, parseInt(rgbMatch[2], 10)).toString(16).padStart(2, "0");
    const b = Math.min(255, parseInt(rgbMatch[3], 10)).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return null;
}

class ColorWidget extends WidgetType {
  constructor(
    readonly color: string,
    readonly from: number,
    readonly to: number
  ) {
    super();
  }

  eq(other: ColorWidget) {
    return other.color === this.color && other.from === this.from && other.to === this.to;
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement("span");
    wrap.className = "cm-color-swatch-wrap";
    wrap.setAttribute("aria-hidden", "true");

    const swatch = document.createElement("span");
    swatch.className = "cm-color-swatch";
    swatch.style.backgroundColor = this.color;
    swatch.title = `${this.color} (Click to pick color)`;

    const input = document.createElement("input");
    input.type = "color";
    input.className = "cm-color-picker-input";
    input.tabIndex = -1;
    input.setAttribute("aria-label", `Color picker for ${this.color}`);

    const hexVal = toHex6(this.color);
    if (hexVal) {
      input.value = hexVal;
    }

    swatch.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (typeof input.showPicker === "function") {
          input.showPicker();
        } else {
          input.click();
        }
      } catch {
        input.click();
      }
    });

    input.addEventListener("input", (e) => {
      e.stopPropagation();
      const newColor = (e.target as HTMLInputElement).value;
      if (!newColor) return;
      let targetFrom = this.from;
      let targetTo = this.to;
      const currentDoc = view.state.doc;
      if (currentDoc.sliceString(targetFrom, targetTo).toLowerCase() !== this.color.toLowerCase()) {
        const searchStart = Math.max(0, this.from - 200);
        const searchEnd = Math.min(currentDoc.length, this.to + 200);
        const chunk = currentDoc.sliceString(searchStart, searchEnd);
        const idx = chunk.toLowerCase().indexOf(this.color.toLowerCase());
        if (idx !== -1) {
          targetFrom = searchStart + idx;
          targetTo = targetFrom + this.color.length;
        }
      }
      if (currentDoc.sliceString(targetFrom, targetTo).toLowerCase() === this.color.toLowerCase()) {
        view.dispatch({
          changes: { from: targetFrom, to: targetTo, insert: newColor },
        });
      }
    });

    wrap.appendChild(swatch);
    wrap.appendChild(input);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

const colorDecorator = new MatchDecorator({
  regexp: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/gi,
  decorate: (add, from, to, match) => {
    const color = match[0];
    add(
      from,
      from,
      Decoration.widget({
        widget: new ColorWidget(color, from, to),
        side: -1,
      })
    );
  },
});

const colorExtension = ViewPlugin.fromClass(
  class {
    decorations = Decoration.none;
    constructor(view: EditorView) {
      this.decorations = colorDecorator.createDeco(view);
    }
    update(update: any) {
      this.decorations = colorDecorator.updateDeco(update, this.decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

function detectIndentUnit(text: string): number {
  if (!text) return 2;
  const lines = text.split("\n");
  let twoCount = 0;
  let fourCount = 0;
  const maxLines = Math.min(lines.length, 300);
  for (let i = 0; i < maxLines; i++) {
    const line = lines[i];
    const match = line.match(/^( +)[^\s]/);
    if (match) {
      const len = match[1].length;
      if (len === 4 || len === 8 || len === 12) {
        fourCount++;
      } else if (len === 2 || len === 6 || len === 10) {
        twoCount++;
      }
    }
  }
  return fourCount > twoCount ? 4 : 2;
}

function createFoldMarker(open: boolean): HTMLElement {
  const span = document.createElement("span");
  span.className = "cm-fold-marker";
  span.setAttribute("aria-label", open ? "Fold code block" : "Unfold code block");
  span.innerHTML = open
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cm-fold-icon"><path d="m6 9 6 6 6-6"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cm-fold-icon"><path d="m9 18 6-6-6-6"/></svg>`;
  return span;
}

const HtmlCodeEditor = forwardRef<HtmlCodeEditorHandle, HtmlCodeEditorProps>(function HtmlCodeEditor(
  {
    value,
    onChange,
    fontSize = 14,
    onCursorChange,
    spellCheck = false,
    noteId,
    language = "html",
    isVisible = true,
    onBlur,
    showIndentGuides = true,
    wrapLines = false,
    onOpenSearch,
  },
  ref
) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const viewRef = useRef<EditorView | null>(null);

  const onOpenSearchRef = useRef(onOpenSearch);
  onOpenSearchRef.current = onOpenSearch;
  const currentSearchQueryRef = useRef("");

  const executeSearch = useCallback(
    (query: string, advance: "none" | "next" | "prev" = "none"): { total: number; current: number } => {
      const view = viewRef.current;
      if (!view) return { total: 0, current: -1 };

      const trimmed = query.trim();
      currentSearchQueryRef.current = trimmed;

      if (!trimmed) {
        view.dispatch({
          effects: setSearchQuery.of(new SearchQuery({ search: "" })),
        });
        return { total: 0, current: -1 };
      }

      view.dispatch({
        effects: setSearchQuery.of(
          new SearchQuery({
            search: trimmed,
            caseSensitive: false,
            literal: true,
          })
        ),
      });

      const doc = view.state.doc;
      const cursor = new SearchCursor(doc, trimmed, 0, undefined, (s) => s.toLowerCase());
      const matches: { from: number; to: number }[] = [];
      while (!cursor.next().done) {
        matches.push({ from: cursor.value.from, to: cursor.value.to });
      }

      if (matches.length === 0) {
        return { total: 0, current: -1 };
      }

      const currentSel = view.state.selection.main;
      const currentIdx = matches.findIndex((m) => m.from === currentSel.from && m.to === currentSel.to);

      let targetIdx = 0;
      if (advance === "next") {
        targetIdx = (currentIdx + 1) % matches.length;
      } else if (advance === "prev") {
        targetIdx = currentIdx <= 0 ? matches.length - 1 : currentIdx - 1;
      } else {
        if (currentIdx !== -1) {
          targetIdx = currentIdx;
        } else {
          const found = matches.findIndex((m) => m.from >= currentSel.from);
          targetIdx = found !== -1 ? found : 0;
        }
      }

      const target = matches[targetIdx];
      view.dispatch({
        selection: { anchor: target.from, head: target.to },
        scrollIntoView: true,
        userEvent: "select.search",
      });

      return { total: matches.length, current: targetIdx };
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      setSearchQuery: (q: string) => executeSearch(q, "none"),
      findNext: (q?: string) => executeSearch(q ?? currentSearchQueryRef.current, "next"),
      findPrev: (q?: string) => executeSearch(q ?? currentSearchQueryRef.current, "prev"),
      clearSearch: () => {
        const view = viewRef.current;
        currentSearchQueryRef.current = "";
        if (view) {
          view.dispatch({
            effects: setSearchQuery.of(new SearchQuery({ search: "" })),
          });
        }
      },
      focus: () => {
        viewRef.current?.focus();
      },
      getSelectionText: () => {
        const view = viewRef.current;
        if (!view) return "";
        const sel = view.state.selection.main;
        return sel.empty ? "" : view.state.sliceDoc(sel.from, sel.to);
      },
    }),
    [executeSearch]
  );

  const searchKeymapExtension = useMemo(() => {
    return Prec.highest(
      keymap.of([
        {
          key: "Mod-f",
          run: (view) => {
            const sel = view.state.selection.main;
            const selectedText = sel.empty ? "" : view.state.sliceDoc(sel.from, sel.to);
            onOpenSearchRef.current?.(selectedText);
            return true;
          },
        },
      ])
    );
  }, []);

  // Dynamic dark mode tracking to keep CodeMirror and DOM perfectly synchronized
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onCursorChangeRef = useRef(onCursorChange);
  onCursorChangeRef.current = onCursorChange;

  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const isRestoringScrollRef = useRef(false);
  const restoreScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const restoreScrollPosition = useCallback((targetNoteId: string) => {
    if (!targetNoteId) return;
    const targetTop = getNoteScrollPosition(targetNoteId);
    if (targetTop <= 0) return;

    isRestoringScrollRef.current = true;
    if (restoreScrollTimeoutRef.current) {
      clearTimeout(restoreScrollTimeoutRef.current);
    }

    const applyScroll = () => {
      const view = viewRef.current;
      if (!view) return;
      view.scrollDOM.scrollTop = targetTop;
    };

    applyScroll();
    requestAnimationFrame(applyScroll);
    setTimeout(applyScroll, 20);
    setTimeout(applyScroll, 50);
    setTimeout(applyScroll, 100);

    restoreScrollTimeoutRef.current = setTimeout(() => {
      isRestoringScrollRef.current = false;
    }, 150);
  }, []);

  // Restore scroll when noteId changes
  useEffect(() => {
    if (!noteId) return;
    closedNoteIds.delete(noteId);
    restoreScrollPosition(noteId);
  }, [noteId, restoreScrollPosition]);

  // Handle visibility changes
  const prevIsVisibleRef = useRef(isVisible);
  useEffect(() => {
    if (prevIsVisibleRef.current === isVisible) return;
    const wasVisible = prevIsVisibleRef.current;
    prevIsVisibleRef.current = isVisible;

    if (!isVisible && wasVisible && noteId && viewRef.current) {
      const top = viewRef.current.scrollDOM.scrollTop;
      if (top > 0) {
        setNoteScrollPosition(noteId, top);
      }
    } else if (isVisible && !wasVisible && noteId) {
      restoreScrollPosition(noteId);
      viewRef.current?.requestMeasure();
    }
  }, [isVisible, noteId, restoreScrollPosition]);

  // Scroll listener ref for reliable persistence across note changes
  const handleScrollRef = useRef<() => void>(() => {});
  handleScrollRef.current = () => {
    const view = viewRef.current;
    if (!view || !noteId) return;
    const scroller = view.scrollDOM;
    const targetTop = getNoteScrollPosition(noteId);
    if (isRestoringScrollRef.current) {
      if (scroller.scrollTop !== targetTop) {
        isRestoringScrollRef.current = false;
      } else {
        return;
      }
    }
    if (
      scroller.scrollTop === 0 &&
      (scroller.clientHeight === 0 || scroller.scrollHeight === 0)
    ) {
      return;
    }
    setNoteScrollPosition(noteId, scroller.scrollTop);
  };

  // Handle unmount
  useEffect(() => {
    return () => {
      onBlurRef.current?.();
      if (restoreScrollTimeoutRef.current) {
        clearTimeout(restoreScrollTimeoutRef.current);
      }
      if (viewRef.current && noteId) {
        const top = viewRef.current.scrollDOM.scrollTop;
        if (top > 0) {
          setNoteScrollPosition(noteId, top);
        }
      }
    };
  }, [noteId]);

  // Language extension
  const langExtension = useMemo<Extension>(() => {
    if (language === "css") {
      return css();
    }
    if (language === "javascript" || language === "js") {
      return javascript({ jsx: true, typescript: true });
    }
    return html();
  }, [language]);

  // Dynamic theme extension matching Luno Note's design and dark/light modes
  const themeExtension = useMemo<Extension>(() => {
    const computedLineHeight = `${Math.round(fontSize * 1.6)}px`;
    return EditorView.theme({
      "&": {
        height: "100%",
        fontSize: `${fontSize}px`,
        backgroundColor: "transparent !important",
        color: "hsl(var(--foreground))",
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily: "inherit",
        lineHeight: computedLineHeight,
        cursor: "text",
      },
      ".cm-scroller::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
      ".cm-scroller::-webkit-scrollbar-track": {
        background: "transparent",
      },
      ".cm-scroller::-webkit-scrollbar-thumb": {
        backgroundColor: "hsl(var(--muted-foreground) / 0.25)",
        borderRadius: "4px",
      },
      ".cm-scroller::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "hsl(var(--muted-foreground) / 0.4)",
      },
      ".cm-scroller::-webkit-scrollbar-corner": {
        background: "transparent",
      },
      ".cm-content": {
        padding: "6px 4px",
        caretColor: "hsl(var(--primary))",
        fontFamily: "inherit",
        lineHeight: computedLineHeight,
        minHeight: "100%",
        color: "hsl(var(--foreground))",
        cursor: "text",
      },
      ".cm-line": {
        position: "relative",
        cursor: "text",
      },
      "&.cm-focused": {
        outline: "none",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "hsl(var(--primary)) !important",
        borderLeftWidth: "2px !important",
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "hsl(var(--primary)) !important",
        borderLeftWidth: "2px !important",
      },
      ".cm-searchMatch": {
        backgroundColor: "hsl(var(--primary) / 0.25) !important",
        borderRadius: "2px",
      },
      ".cm-searchMatch-selected": {
        backgroundColor: "hsl(var(--primary) / 0.55) !important",
        outline: "1px solid hsl(var(--primary))",
        borderRadius: "2px",
      },
      ".cm-gutters": {
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--muted-foreground) / 0.5)",
        borderRight: "1px solid hsl(var(--border) / 0.2)",
        paddingLeft: "2px",
        paddingRight: "2px",
        userSelect: "none",
        fontFamily: "inherit",
        zIndex: "10",
        cursor: "default",
      },
      ".cm-gutterElement": {
        padding: "0 4px 0 2px",
        textAlign: "right",
        fontSize: `${Math.max(12, Math.round(fontSize * 0.86))}px`,
        lineHeight: computedLineHeight,
        cursor: "default",
      },
      ".cm-foldGutter": {
        padding: "0 1px",
      },
      ".cm-foldGutter .cm-gutterElement": {
        display: "flex !important",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: "0 2px",
        color: "hsl(var(--muted-foreground) / 0.6)",
        transition: "color 0.15s ease",
      },
      ".cm-foldGutter .cm-gutterElement:hover": {
        color: "hsl(var(--foreground))",
      },
      ".cm-fold-marker": {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "14px",
        height: "14px",
      },
      ".cm-fold-icon": {
        display: "block",
        width: "12px",
        height: "12px",
        opacity: "0.75",
        transition: "opacity 0.15s ease, transform 0.15s ease",
      },
      ".cm-foldGutter .cm-gutterElement:hover .cm-fold-icon": {
        opacity: "1",
      },
      ".cm-activeLine": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
      },
      ".cm-activeLineGutter": {
        color: isDark ? "hsl(var(--foreground) / 0.9)" : "hsl(var(--primary))",
        fontWeight: "600",
        backgroundColor: "transparent",
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.16) !important" : "hsl(var(--primary) / 0.25) !important",
      },
      ".cm-selectionMatch": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "hsl(var(--primary) / 0.15)",
      },
      ".cm-color-swatch-wrap": {
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        marginRight: "4px",
        marginLeft: "1px",
        position: "relative",
        lineHeight: "1",
      },
      ".cm-color-swatch": {
        display: "inline-block",
        width: "11px",
        height: "11px",
        borderRadius: "2px",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.45)" : "1px solid rgba(0, 0, 0, 0.35)",
        cursor: "pointer",
        boxSizing: "border-box",
        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.08)",
        transition: "transform 0.1s ease, border-color 0.1s ease",
      },
      ".cm-color-swatch:hover": {
        transform: "scale(1.15)",
        borderColor: "hsl(var(--foreground))",
      },
      ".cm-color-picker-input": {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        opacity: "0",
        pointerEvents: "none",
        border: "none",
        padding: "0",
        margin: "0",
      },
      ".cm-indent-guides": {
        position: "absolute",
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: "0",
      },
      ".cm-indent-guide": {
        position: "absolute",
        top: "0",
        bottom: "0",
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)",
        pointerEvents: "none",
        userSelect: "none",
        transition: "background-color 150ms ease, opacity 150ms ease",
      },
      ".cm-indent-guide.cm-indent-guide-active": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.50)" : "rgba(0, 0, 0, 0.42)",
        zIndex: "1",
      },
      "&.cm-focused .cm-indent-guide.cm-indent-guide-active": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.72)" : "rgba(0, 0, 0, 0.65)",
      },
    }, { dark: isDark });
  }, [fontSize, isDark]);

  // Cursor position update listener
  const cursorListener = useMemo<Extension>(() => {
    return EditorView.updateListener.of((update) => {
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        onCursorChangeRef.current?.(line.number, pos - line.from + 1);
      }
    });
  }, []);

  // Custom SVG fold gutter replacing primitive text "v" and ">"
  const foldGutterExtension = useMemo<Extension>(() => {
    return foldGutter({
      markerDOM: (open) => createFoldMarker(open),
    });
  }, []);

  // Indentation guide lines (toggleable, crisp 1px DOM elements matching sidebar file tree)
  const indentGuidesExtension = useMemo<Extension[]>(() => {
    if (!showIndentGuides) return [];
    return [uniformIndentGuides({ hideFirstIndent: false, highlightActiveBlock: true })];
  }, [showIndentGuides]);

  // Content attributes (e.g. spellcheck)
  const contentAttributes = useMemo<Extension>(() => {
    return EditorView.contentAttributes.of({
      spellcheck: spellCheck ? "true" : "false",
      autocorrect: "off",
      autocapitalize: "off",
    });
  }, [spellCheck]);

  const detectedIndent = useMemo(() => {
    return detectIndentUnit(value);
  }, [value]);

  const extensions = useMemo<Extension[]>(() => {
    return [
      themeExtension,
      syntaxHighlighting(lunoHighlightStyle),
      langExtension,
      search(),
      searchKeymapExtension,
      foldGutterExtension,
      colorExtension,
      ...indentGuidesExtension,
      cursorListener,
      contentAttributes,
      ...(wrapLines ? [EditorView.lineWrapping] : [documentWidthExtension()]),
      scrollPastEnd(),
      indentUnit.of(" ".repeat(detectedIndent)),
      EditorState.tabSize.of(detectedIndent),
      keymap.of([indentWithTab]),
    ];
  }, [
    themeExtension,
    langExtension,
    searchKeymapExtension,
    foldGutterExtension,
    indentGuidesExtension,
    cursorListener,
    contentAttributes,
    wrapLines,
    detectedIndent,
  ]);

  const handleCodeChange = useCallback(
    (newVal: string) => {
      onChangeRef.current(newVal);
      if (currentSearchQueryRef.current) {
        executeSearch(currentSearchQueryRef.current, "none");
      }
    },
    [executeSearch]
  );

  const handleBlur = useCallback(() => {
    onBlurRef.current?.();
  }, []);

  useEffect(() => {
    const onSystemFixLanguage = (event: Event) => {
      const customEvent = event as CustomEvent<FixLanguageEventDetail>;
      if (customEvent.detail?.handled) return;
      const view = viewRef.current;
      if (!view || !view.hasFocus) return;

      if (customEvent.detail) {
        customEvent.detail.handled = true;
      }

      const { from, to, empty } = view.state.selection.main;
      if (empty) {
        showSelectTextToFixToast();
        return;
      }

      const selectedText = view.state.sliceDoc(from, to);
      if (!selectedText.trim()) {
        showSelectTextToFixToast();
        return;
      }

      const convertedText = swapKeyboardLayout(selectedText);
      if (convertedText === selectedText) return;

      view.dispatch({
        changes: { from, to, insert: convertedText },
        selection: { anchor: from, head: from + convertedText.length },
      });
      view.focus();
    };

    window.addEventListener(FIX_LANGUAGE_EVENT, onSystemFixLanguage);
    return () => window.removeEventListener(FIX_LANGUAGE_EVENT, onSystemFixLanguage);
  }, []);

  return (
    <div
      className="relative flex h-full w-full overflow-hidden font-mono cursor-text"
      style={{ fontSize }}
      data-testid="code-editor"
      data-language={language}
    >
      <CodeMirror
        ref={cmRef}
        value={value}
        height="100%"
        theme="none"
        className="h-full w-full"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false, // Disabled in basicSetup so our custom SVG foldGutter is used instead
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: false,
          foldKeymap: true,
          completionKeymap: false,
          lintKeymap: false,
        }}
        extensions={extensions}
        onChange={handleCodeChange}
        onBlur={handleBlur}
        onCreateEditor={(view) => {
          viewRef.current = view;
          view.scrollDOM.addEventListener("scroll", () => handleScrollRef.current(), { passive: true });
          if (noteId) {
            restoreScrollPosition(noteId);
          }
        }}
      />
    </div>
  );
});

export default HtmlCodeEditor;
