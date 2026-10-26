import { Extension } from "@codemirror/state";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Text } from "@codemirror/state";

/**
 * Computes the maximum column width across all lines in the document.
 * This runs across the full document text in memory (taking ~1ms for thousands of lines)
 * so that CodeMirror knows if any line anywhere in the file exceeds the viewport width,
 * avoiding scrollbar pop-in when virtualized lines are scrolled into view.
 */
export function computeDocMaxCols(doc: Text, tabSize = 2): number {
  let maxCols = 0;
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    // Fast path: if raw length is less than maxCols and has no tabs, skip
    if (line.length < maxCols && !line.text.includes("\t")) {
      continue;
    }
    let cols = 0;
    const text = line.text;
    for (let j = 0; j < text.length; j++) {
      if (text[j] === "\t") {
        cols += tabSize - (cols % tabSize);
      } else {
        cols += 1;
      }
    }
    if (cols > maxCols) {
      maxCols = cols;
    }
  }
  return maxCols;
}

export interface DocumentWidthOptions {
  enabled?: boolean;
}

/**
 * Extension ensuring that if a document contains any line exceeding the editor width,
 * the horizontal scrollbar and scrollable area are available continuously from the start,
 * rather than only popping in when scrolling down and encountering that line.
 * If all lines fit within the editor width, no horizontal scrollbar is shown.
 */
export function documentWidthExtension(options: DocumentWidthOptions = {}): Extension {
  if (options.enabled === false) return [];

  return ViewPlugin.fromClass(
    class {
      private maxCols = 0;

      constructor(readonly view: EditorView) {
        this.measureAndApply(view, true);
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(() => {
            if (this.view.dom) {
              this.measureAndApply(this.view, false);
            }
          });
        }
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.geometryChanged || update.viewportChanged) {
          this.measureAndApply(update.view, update.docChanged);
        }
      }

      private measureAndApply(view: EditorView, docChanged: boolean) {
        if (docChanged || this.maxCols === 0) {
          this.maxCols = computeDocMaxCols(view.state.doc, view.state.tabSize || 2);
        }

        const charWidth = view.defaultCharacterWidth || 8.4;
        // Estimated content width: max line character columns * charWidth + padding (32px)
        const estimatedContentWidth = Math.ceil(this.maxCols * charWidth + 32);
        const clientWidth = view.scrollDOM.clientWidth || view.dom.clientWidth || (view.dom.parentElement?.clientWidth || 0);
        const gutters = view.dom.querySelector(".cm-gutters");
        const guttersWidth = gutters ? (gutters as HTMLElement).offsetWidth || 0 : 0;
        const availableWidth = clientWidth > 0 ? clientWidth - guttersWidth : 0;

        // If clientWidth is measured and content exceeds available space,
        // set minWidth on contentDOM so horizontal scrolling is available from the start
        if (availableWidth > 0 && estimatedContentWidth > availableWidth) {
          view.contentDOM.style.minWidth = `${estimatedContentWidth}px`;
        } else {
          view.contentDOM.style.minWidth = "";
        }
      }

      destroy() {
        if (this.view.contentDOM) {
          this.view.contentDOM.style.minWidth = "";
        }
      }
    }
  );
}
