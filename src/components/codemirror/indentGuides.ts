import { Extension, RangeSetBuilder } from "@codemirror/state";
import { EditorView, ViewPlugin, ViewUpdate, WidgetType, Decoration, DecorationSet } from "@codemirror/view";
import { getIndentUnit } from "@codemirror/language";

export interface IndentGuidesConfig {
  hideFirstIndent?: boolean;
  highlightActiveBlock?: boolean;
}

class IndentGuideWidget extends WidgetType {
  constructor(
    readonly positions: number[],
    readonly widthPx: number,
    readonly activeIndex: number = -1
  ) {
    super();
  }

  toDOM() {
    const wrap = document.createElement("span");
    wrap.className = "cm-indent-guides";
    wrap.setAttribute("aria-hidden", "true");
    const widthStr = `${this.widthPx}px`;
    for (let i = 0; i < this.positions.length; i++) {
      const line = document.createElement("span");
      line.className =
        i === this.activeIndex
          ? "cm-indent-guide cm-indent-guide-active"
          : "cm-indent-guide";
      line.style.left = `${this.positions[i]}px`;
      line.style.width = widthStr;
      wrap.appendChild(line);
    }
    return wrap;
  }

  eq(other: IndentGuideWidget) {
    if (this.widthPx !== other.widthPx) return false;
    if (this.activeIndex !== other.activeIndex) return false;
    if (this.positions.length !== other.positions.length) return false;
    for (let i = 0; i < this.positions.length; i++) {
      if (this.positions[i] !== other.positions[i]) return false;
    }
    return true;
  }

  ignoreEvent() {
    return true;
  }
}

function countLeadingColumns(text: string, tabSize: number): number {
  let col = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " " || ch === "\u00A0") {
      col += 1;
    } else if (ch === "\t") {
      col += tabSize - (col % tabSize);
    } else if (ch === "\r") {
      continue;
    } else {
      break;
    }
  }
  return col;
}

function getDpr(): number {
  if (typeof window !== "undefined" && window.devicePixelRatio) {
    return window.devicePixelRatio;
  }
  return 1;
}

function buildIndentDecos(
  view: EditorView,
  hideFirstIndent: boolean,
  highlightActiveBlock: boolean = true
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const state = view.state;
  const unitWidth = getIndentUnit(state) || 2;
  const tabSize = state.tabSize || unitWidth;
  const charWidth = view.defaultCharacterWidth || 8.4;
  const leftPadding = 4;

  const dpr = getDpr();
  // Exact 1 physical pixel width in CSS pixels (e.g. 0.8px on 125% DPR, 0.5px on 200% DPR)
  const cssWidth = Math.max(0.5, 1 / dpr);

  // Measure content position on the physical device screen
  let contentPhysicalLeft = 0;
  if (view.contentDOM && typeof view.contentDOM.getBoundingClientRect === "function") {
    const rect = view.contentDOM.getBoundingClientRect();
    contentPhysicalLeft = rect.left * dpr;
  }

  const lineLevels = new Map<number, number>();

  const getLevel = (lineNo: number): number => {
    if (lineNo < 1 || lineNo > state.doc.lines) return 0;
    if (lineLevels.has(lineNo)) return lineLevels.get(lineNo)!;
    const line = state.doc.line(lineNo);
    if (!line.text.trim().length) {
      let prevLevel = 0;
      for (let p = lineNo - 1; p >= 1; p--) {
        const pl = state.doc.line(p);
        if (pl.text.trim().length) {
          prevLevel = Math.floor(countLeadingColumns(pl.text, tabSize) / unitWidth);
          break;
        }
      }
      let nextLevel = 0;
      for (let n = lineNo + 1; n <= state.doc.lines; n++) {
        const nl = state.doc.line(n);
        if (nl.text.trim().length) {
          nextLevel = Math.floor(countLeadingColumns(nl.text, tabSize) / unitWidth);
          break;
        }
      }
      const lvl = prevLevel >= nextLevel ? prevLevel : nextLevel;
      lineLevels.set(lineNo, lvl);
      return lvl;
    }
    const col = countLeadingColumns(line.text, tabSize);
    const lvl = Math.floor(col / unitWidth);
    lineLevels.set(lineNo, lvl);
    return lvl;
  };

  let activeTargetLevel = 0;
  let activeBlockStart = -1;
  let activeBlockEnd = -1;

  if (highlightActiveBlock && state.selection && state.selection.main) {
    const head = state.selection.main.head;
    const cursorLine = state.doc.lineAt(head);
    const linePrefix = cursorLine.text.slice(0, Math.max(0, head - cursorLine.from));
    const cursorCol = countLeadingColumns(linePrefix, tabSize);
    const leadingCol = countLeadingColumns(cursorLine.text, tabSize);
    const isCursorLineEmpty = !cursorLine.text.trim().length;
    const cursorLineLevel = getLevel(cursorLine.number);

    const trimmed = cursorLine.text.trim();
    const isClosingTag =
      trimmed.startsWith("</") ||
      trimmed.startsWith("/>") ||
      trimmed.startsWith("}") ||
      trimmed.startsWith("]") ||
      trimmed.startsWith(")");

    const prevLevel = cursorLine.number > 1 ? getLevel(cursorLine.number - 1) : 0;
    const nextLevel = cursorLine.number < state.doc.lines ? getLevel(cursorLine.number + 1) : 0;

    if (!isCursorLineEmpty && cursorCol < leadingCol && !isClosingTag && nextLevel <= cursorLineLevel) {
      // User placed cursor explicitly inside the leading indentation columns of a non-closing, non-opening line
      activeTargetLevel = Math.floor(cursorCol / unitWidth) + 1;
    } else if (isClosingTag && prevLevel > cursorLineLevel) {
      // Closing tag of an inner indentation block (e.g. </div> or })
      activeTargetLevel = cursorLineLevel + 1;
    } else if (nextLevel > cursorLineLevel) {
      // Opening tag of an inner indentation block (e.g. <div class="..."> or if (...) {)
      activeTargetLevel = cursorLineLevel + 1;
    } else if (prevLevel > cursorLineLevel) {
      // Line follows a higher block
      activeTargetLevel = cursorLineLevel + 1;
    } else if (cursorLineLevel > 0) {
      activeTargetLevel = cursorLineLevel;
    }

    if (activeTargetLevel > 0) {
      // Find the continuous block of lines at or above activeTargetLevel
      let start = cursorLine.number;
      if (getLevel(start) < activeTargetLevel) {
        if (cursorLine.number < state.doc.lines && getLevel(cursorLine.number + 1) >= activeTargetLevel) {
          start = cursorLine.number + 1;
        } else if (cursorLine.number > 1 && getLevel(cursorLine.number - 1) >= activeTargetLevel) {
          start = cursorLine.number - 1;
        }
      }

      if (getLevel(start) >= activeTargetLevel) {
        let blockStart = start;
        let blockEnd = start;

        // Search upwards bounded by document start
        while (blockStart > 1) {
          if (getLevel(blockStart - 1) < activeTargetLevel) break;
          blockStart--;
        }

        // Search downwards bounded by document end
        while (blockEnd < state.doc.lines) {
          if (getLevel(blockEnd + 1) < activeTargetLevel) break;
          blockEnd++;
        }

        activeBlockStart = blockStart;
        activeBlockEnd = blockEnd;
      }
    }
  }

  const startAt = hideFirstIndent ? 1 : 0;

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = state.doc.lineAt(pos);
      const level = getLevel(line.number);

      if (level > startAt) {
        const positions: number[] = [];
        for (let i = startAt; i < level; i++) {
          const idealCss = leftPadding + i * unitWidth * charWidth;
          // Snap strictly to hardware physical device pixels to eliminate any subpixel blurring / multi-pixel smearing
          const physicalScreenX = Math.round(contentPhysicalLeft + idealCss * dpr);
          const relativeCssLeft = (physicalScreenX - contentPhysicalLeft) / dpr;
          positions.push(relativeCssLeft);
        }

        let activeIndex = -1;
        if (
          activeTargetLevel > 0 &&
          line.number >= activeBlockStart &&
          line.number <= activeBlockEnd
        ) {
          const targetIndexInPositions = (activeTargetLevel - 1) - startAt;
          if (targetIndexInPositions >= 0 && targetIndexInPositions < positions.length) {
            activeIndex = targetIndexInPositions;
          }
        }

        if (positions.length > 0) {
          builder.add(
            line.from,
            line.from,
            Decoration.widget({
              widget: new IndentGuideWidget(positions, cssWidth, activeIndex),
              side: -1,
            })
          );
        }
      }

      pos = line.to + 1;
    }
  }

  return builder.finish();
}

export function uniformIndentGuides(config: IndentGuidesConfig = {}): Extension {
  const hideFirstIndent = config.hideFirstIndent ?? false;
  const highlightActiveBlock = config.highlightActiveBlock ?? true;

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildIndentDecos(view, hideFirstIndent, highlightActiveBlock);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.geometryChanged ||
          (highlightActiveBlock && (update.selectionSet || update.focusChanged))
        ) {
          this.decorations = buildIndentDecos(update.view, hideFirstIndent, highlightActiveBlock);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
