import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, Selection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

export interface HeadingToggleOptions {
  enabled: boolean | (() => boolean);
  noteId?: string;
  fileName?: string;
}

export interface HeadingToggleState {
  foldedPositions: Set<number>;
  decorations: DecorationSet;
  activeNoteId?: string;
  fileName?: string;
}

export const headingTogglePluginKey = new PluginKey<HeadingToggleState>("headingToggle");

/**
 * Checks whether a heading node is the document Title (the first H1 at pos 0).
 * Title headings must not have fold toggles.
 */
export function isTitleHeading(doc: Node, pos: number, node: Node): boolean {
  if (node.type.name !== "heading" || ((node.attrs?.level as number) || 1) !== 1) {
    return false;
  }
  return pos === 0 || doc.firstChild === node;
}

/**
 * Returns all child blocks within the same parent that fall under the heading's scope.
 * The scope extends until the next heading with level <= current level or end of parent.
 */
export function getFoldableChildPositions(
  doc: Node,
  headingPos: number,
  level: number
): { from: number; to: number }[] {
  try {
    const $pos = doc.resolve(headingPos);
    const parent = $pos.parent;
    const parentDepth = $pos.depth;
    const parentStart = $pos.start(parentDepth);
    const headingIndex = $pos.index(parentDepth);

    const ranges: { from: number; to: number }[] = [];
    let currentChildPos = parentStart;

    // Advance position past all previous siblings and this heading
    for (let i = 0; i <= headingIndex; i++) {
      currentChildPos += parent.child(i).nodeSize;
    }

    // Collect all following siblings until a heading of equal or higher level (<= level)
    for (let i = headingIndex + 1; i < parent.childCount; i++) {
      const child = parent.child(i);
      if (child.type.name === "heading") {
        const childLevel = (child.attrs?.level as number) || 1;
        if (childLevel <= level) {
          break;
        }
      }
      ranges.push({
        from: currentChildPos,
        to: currentChildPos + child.nodeSize,
      });
      currentChildPos += child.nodeSize;
    }

    return ranges;
  } catch {
    return [];
  }
}

/**
 * Collects all heading node positions across the document (excluding the Title H1).
 */
export function getAllHeadingPositions(doc: Node): Set<number> {
  const positions = new Set<number>();
  doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      if (!isTitleHeading(doc, pos, node)) {
        positions.add(pos);
      }
      return false;
    }
    return true;
  });
  return positions;
}

/**
 * Generates stable unique keys for folded headings within a document.
 * Format: `H${level}:${cleanText}#${occurrenceIndex}`
 * Skips the document Title H1 (first H1 at pos 0).
 */
export function getFoldedHeadingKeys(doc: Node, foldedPositions: Set<number>): string[] {
  if (foldedPositions.size === 0) return [];
  const keys: string[] = [];
  const counter = new Map<string, number>();

  doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return true;
    if (isTitleHeading(doc, pos, node)) return false;

    const level = (node.attrs?.level as number) || 1;
    const text = (node.textContent || "").trim();
    const baseKey = `H${level}:${text}`;
    const occ = counter.get(baseKey) || 0;
    counter.set(baseKey, occ + 1);

    const fullKey = `${baseKey}#${occ}`;
    if (foldedPositions.has(pos)) {
      keys.push(fullKey);
    }
    return false;
  });

  return keys;
}

/**
 * Reconstructs folded heading node positions from saved keys for a given document.
 */
export function restoreFoldedPositionsFromKeys(
  doc: Node,
  savedKeys: string[] | Set<string>
): Set<number> {
  const keySet = Array.isArray(savedKeys) ? new Set(savedKeys) : savedKeys;
  if (!keySet || keySet.size === 0) return new Set();

  const result = new Set<number>();
  const counter = new Map<string, number>();

  doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return true;
    if (isTitleHeading(doc, pos, node)) return false;

    const level = (node.attrs?.level as number) || 1;
    const text = (node.textContent || "").trim();
    const baseKey = `H${level}:${text}`;
    const occ = counter.get(baseKey) || 0;
    counter.set(baseKey, occ + 1);

    const fullKey = `${baseKey}#${occ}`;
    if (keySet.has(fullKey)) {
      result.add(pos);
    }
    return false;
  });

  return result;
}

/**
 * Retrieves persisted folded heading keys from localStorage for a note.
 */
export function getSavedFoldedHeadingKeys(noteId?: string, fileName?: string): string[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    if (noteId) {
      const raw = window.localStorage.getItem(`luno_folds_${noteId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    if (fileName) {
      const raw = window.localStorage.getItem(`luno_folds_fn_${fileName}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    // Ignore JSON errors or quota issues
  }
  return [];
}

/**
 * Persists folded heading keys to localStorage for a note.
 */
export function saveSavedFoldedHeadingKeys(
  noteId?: string,
  keys: string[] = [],
  fileName?: string
): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (!noteId && !fileName) return;

  try {
    if (keys.length === 0) {
      if (noteId) window.localStorage.removeItem(`luno_folds_${noteId}`);
      if (fileName) window.localStorage.removeItem(`luno_folds_fn_${fileName}`);
    } else {
      const serialized = JSON.stringify(keys);
      if (noteId) window.localStorage.setItem(`luno_folds_${noteId}`, serialized);
      if (fileName) window.localStorage.setItem(`luno_folds_fn_${fileName}`, serialized);
    }
  } catch {
    // Ignore quota issues
  }
}

/**
 * Clears persisted folded heading keys from localStorage for a note.
 */
export function clearSavedFoldedHeadingKeys(noteId?: string, fileName?: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (noteId) window.localStorage.removeItem(`luno_folds_${noteId}`);
    if (fileName) window.localStorage.removeItem(`luno_folds_fn_${fileName}`);
  } catch {
    // Ignore
  }
}

/**
 * Dispatches a transaction to toggle the fold state of a heading at hPos.
 */
export function handleToggleFold(view: EditorView, hPos: number) {
  const node = view.state.doc.nodeAt(hPos);
  if (!node || node.type.name !== "heading") return;
  if (isTitleHeading(view.state.doc, hPos, node)) return;

  const pluginState = headingTogglePluginKey.getState(view.state);
  const willFold = !pluginState?.foldedPositions.has(hPos);

  let tr = view.state.tr
    .setMeta("addToHistory", false)
    .setMeta(headingTogglePluginKey, { toggleAt: hPos });

  if (willFold) {
    const level = (node.attrs?.level as number) || 1;
    const ranges = getFoldableChildPositions(view.state.doc, hPos, level);
    if (ranges.length > 0) {
      const foldStart = ranges[0].from;
      const foldEnd = ranges[ranges.length - 1].to;
      const sel = view.state.selection;
      if (sel.from >= foldStart && sel.to <= foldEnd) {
        tr = tr.setSelection(Selection.near(tr.doc.resolve(hPos + node.nodeSize - 1)));
      }
    }
  }

  view.dispatch(tr);
}

/**
 * Creates the toggle chevron button inside the heading.
 * Positioned in the left gutter via CSS so it does not crowd or displace heading text.
 */
export function createToggleButton(
  view: EditorView | undefined,
  hPos: number,
  level: number,
  isFolded: boolean
): HTMLElement {
  const btn = document.createElement("span");
  btn.className = "luno-heading-fold-btn";
  btn.setAttribute("role", "button");
  btn.setAttribute("tabindex", "-1");
  btn.setAttribute("contenteditable", "false");
  btn.setAttribute("data-level", String(level));
  btn.setAttribute("data-folded", isFolded ? "true" : "false");
  btn.setAttribute("aria-label", isFolded ? "Expand section" : "Collapse section");

  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="luno-heading-fold-icon ${isFolded ? "is-folded" : "is-open"}" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `.trim();

  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (view) {
      handleToggleFold(view, hPos);
    }
  });

  return btn;
}

/**
 * Creates the folded indicator badge ("···") at the end of the heading line.
 */
export function createFoldedBadge(view: EditorView | undefined, hPos: number): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "luno-heading-folded-badge";
  badge.setAttribute("role", "button");
  badge.setAttribute("tabindex", "-1");
  badge.setAttribute("contenteditable", "false");
  badge.setAttribute("aria-label", "Expand section");
  badge.textContent = "···";

  badge.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  badge.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (view) {
      handleToggleFold(view, hPos);
    }
  });

  return badge;
}

/**
 * Builds the DecorationSet containing toggle buttons on each non-title heading
 * and hiding decorations on folded sections.
 */
export function buildHeadingDecorations(
  doc: Node,
  foldedPositions: Set<number>,
  enabled: boolean
): DecorationSet {
  if (!enabled) return DecorationSet.empty;

  const decorations: Decoration[] = [];
  const hiddenRanges: { from: number; to: number }[] = [];
  const hiddenFromPositions = new Set<number>();

  doc.descendants((node, pos) => {
    if (node.type.name !== "heading") return true;

    // Do not add toggle to Title (file name) heading
    if (isTitleHeading(doc, pos, node)) {
      return false;
    }

    const level = (node.attrs?.level as number) || 1;
    const isFolded = foldedPositions.has(pos);

    // 1. Toggle button at the start of the heading content (positioned in margin via CSS)
    decorations.push(
      Decoration.widget(
        pos + 1,
        (view) => createToggleButton(view, pos, level, isFolded),
        {
          side: -1,
          stopEvent: () => true,
          ignoreSelection: true,
          key: `heading-toggle-${pos}-${isFolded ? "folded" : "open"}`,
        }
      )
    );

    // 2. If folded, collect child ranges, add folded class to heading, and add folded badge at the end of heading
    if (isFolded) {
      // Add node decoration to heading to reduce margin when folded
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: "luno-heading-folded",
        })
      );

      const childRanges = getFoldableChildPositions(doc, pos, level);
      for (const r of childRanges) {
        if (!hiddenFromPositions.has(r.from)) {
          hiddenFromPositions.add(r.from);
          hiddenRanges.push(r);
        }
      }

      decorations.push(
        Decoration.widget(
          pos + node.nodeSize - 1,
          (view) => createFoldedBadge(view, pos),
          {
            side: 1,
            stopEvent: () => true,
            ignoreSelection: true,
            key: `heading-badge-${pos}`,
          }
        )
      );
    }

    return false; // Do not descend inside heading
  });

  // 3. Add node decorations to hide each folded block
  for (const r of hiddenRanges) {
    decorations.push(
      Decoration.node(r.from, r.to, {
        class: "luno-heading-folded-hidden",
      })
    );
  }

  return DecorationSet.create(doc, decorations);
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    headingToggle: {
      toggleHeadingFold: (pos?: number) => ReturnType;
      foldAllHeadings: () => ReturnType;
      unfoldAllHeadings: () => ReturnType;
      setHeadingToggleNoteInfo: (info: {
        noteId?: string;
        fileName?: string;
        restore?: boolean;
      }) => ReturnType;
    };
  }
}

export const HeadingToggle = Extension.create<HeadingToggleOptions>({
  name: "headingToggle",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addCommands() {
    return {
      toggleHeadingFold:
        (pos?: number) =>
        ({ tr, state, dispatch }) => {
          let targetPos = pos;
          if (targetPos === undefined) {
            const { $from } = state.selection;
            for (let d = $from.depth; d >= 0; d--) {
              const node = $from.node(d);
              if (node.type.name === "heading") {
                targetPos = $from.before(d);
                break;
              }
            }
          }
          if (targetPos === undefined) return false;
          const node = state.doc.nodeAt(targetPos);
          if (!node || node.type.name !== "heading") return false;
          if (isTitleHeading(state.doc, targetPos, node)) return false;

          if (dispatch) {
            tr.setMeta(headingTogglePluginKey, { toggleAt: targetPos });
          }
          return true;
        },

      foldAllHeadings:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(headingTogglePluginKey, { foldAll: true });
          }
          return true;
        },

      unfoldAllHeadings:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(headingTogglePluginKey, { unfoldAll: true });
          }
          return true;
        },

      setHeadingToggleNoteInfo:
        (info: { noteId?: string; fileName?: string; restore?: boolean }) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(headingTogglePluginKey, { setNoteInfo: info });
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: headingTogglePluginKey,
        state: {
          init(_, { doc }) {
            const isEnabled =
              typeof extension.options.enabled === "function"
                ? extension.options.enabled()
                : extension.options.enabled !== false;

            const noteId = extension.options.noteId;
            const fileName = extension.options.fileName;

            let foldedPositions = new Set<number>();
            if (isEnabled && (noteId || fileName)) {
              const savedKeys = getSavedFoldedHeadingKeys(noteId, fileName);
              if (savedKeys.length > 0) {
                foldedPositions = restoreFoldedPositionsFromKeys(doc, savedKeys);
              }
            }

            return {
              foldedPositions,
              decorations: buildHeadingDecorations(doc, foldedPositions, isEnabled),
              activeNoteId: noteId,
              fileName,
            };
          },

          apply(tr, prevState) {
            const isEnabled =
              typeof extension.options.enabled === "function"
                ? extension.options.enabled()
                : extension.options.enabled !== false;

            let activeNoteId = prevState.activeNoteId;
            let fileName = prevState.fileName;
            const meta = tr.getMeta(headingTogglePluginKey);

            if (meta?.setNoteInfo) {
              if (meta.setNoteInfo.noteId !== undefined) {
                activeNoteId = meta.setNoteInfo.noteId;
              }
              if (meta.setNoteInfo.fileName !== undefined) {
                fileName = meta.setNoteInfo.fileName;
              }
            }

            if (!isEnabled) {
              if (prevState.decorations === DecorationSet.empty && prevState.foldedPositions.size === 0) {
                return prevState.activeNoteId === activeNoteId && prevState.fileName === fileName
                  ? prevState
                  : { ...prevState, activeNoteId, fileName };
              }
              return {
                foldedPositions: new Set<number>(),
                decorations: DecorationSet.empty,
                activeNoteId,
                fileName,
              };
            }

            if (meta?.setNoteInfo?.restore) {
              const savedKeys = getSavedFoldedHeadingKeys(activeNoteId, fileName);
              const restored = restoreFoldedPositionsFromKeys(tr.doc, savedKeys);
              return {
                foldedPositions: restored,
                decorations: buildHeadingDecorations(tr.doc, restored, true),
                activeNoteId,
                fileName,
              };
            }

            if (meta?.setNoteInfo && !meta.setNoteInfo.restore) {
              return {
                ...prevState,
                activeNoteId,
                fileName,
              };
            }

            if (meta?.reset) {
              saveSavedFoldedHeadingKeys(activeNoteId, [], fileName);
              return {
                foldedPositions: new Set<number>(),
                decorations: buildHeadingDecorations(tr.doc, new Set(), true),
                activeNoteId,
                fileName,
              };
            }

            let nextFolded = new Set(prevState.foldedPositions);

            if (meta?.toggleAt !== undefined) {
              const targetPos = meta.toggleAt;
              if (nextFolded.has(targetPos)) {
                nextFolded.delete(targetPos);
              } else {
                nextFolded.add(targetPos);
              }
              saveSavedFoldedHeadingKeys(
                activeNoteId,
                getFoldedHeadingKeys(tr.doc, nextFolded),
                fileName
              );
              return {
                foldedPositions: nextFolded,
                decorations: buildHeadingDecorations(tr.doc, nextFolded, true),
                activeNoteId,
                fileName,
              };
            }

            if (meta?.foldAll) {
              nextFolded = getAllHeadingPositions(tr.doc);
              saveSavedFoldedHeadingKeys(
                activeNoteId,
                getFoldedHeadingKeys(tr.doc, nextFolded),
                fileName
              );
              return {
                foldedPositions: nextFolded,
                decorations: buildHeadingDecorations(tr.doc, nextFolded, true),
                activeNoteId,
                fileName,
              };
            }

            if (meta?.unfoldAll) {
              saveSavedFoldedHeadingKeys(activeNoteId, [], fileName);
              return {
                foldedPositions: new Set<number>(),
                decorations: buildHeadingDecorations(tr.doc, new Set(), true),
                activeNoteId,
                fileName,
              };
            }

            if (meta?.recompute) {
              return {
                foldedPositions: nextFolded,
                decorations: buildHeadingDecorations(tr.doc, nextFolded, true),
                activeNoteId,
                fileName,
              };
            }

            if (tr.docChanged) {
              const isSyncOrProgrammatic =
                Boolean(tr.getMeta("isSync")) ||
                tr.getMeta("addToHistory") === false ||
                Boolean(tr.getMeta("isDocumentReplacement"));

              const isFullDocReplacement = tr.steps.some((step: any) => {
                const from = step.from ?? step.slice?.from;
                const to = step.to ?? step.slice?.to;
                return from === 0 && typeof to === "number" && to > 0;
              });

              const mappedFolded = new Set<number>();
              for (const pos of nextFolded) {
                const newPos = tr.mapping.map(pos);
                const node = tr.doc.nodeAt(newPos);
                if (node && node.type.name === "heading" && !isTitleHeading(tr.doc, newPos, node)) {
                  mappedFolded.add(newPos);
                }
              }
              const hadFolds = prevState.foldedPositions.size > 0;
              nextFolded = mappedFolded;

              if (!isSyncOrProgrammatic && !isFullDocReplacement && (hadFolds || nextFolded.size > 0)) {
                saveSavedFoldedHeadingKeys(
                  activeNoteId,
                  getFoldedHeadingKeys(tr.doc, nextFolded),
                  fileName
                );
              }

              return {
                foldedPositions: nextFolded,
                decorations: buildHeadingDecorations(tr.doc, nextFolded, true),
                activeNoteId,
                fileName,
              };
            }

            if (prevState.activeNoteId !== activeNoteId || prevState.fileName !== fileName) {
              return {
                ...prevState,
                activeNoteId,
                fileName,
              };
            }

            return prevState;
          },
        },

        props: {
          decorations(state) {
            const pluginState = headingTogglePluginKey.getState(state);
            return pluginState?.decorations || DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

export default HeadingToggle;
