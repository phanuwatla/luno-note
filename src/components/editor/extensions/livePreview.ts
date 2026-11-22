import { Extension, type Editor as TiptapEditor } from "@tiptap/core";
import { DOMSerializer, Fragment, type Mark, type Node as PMNode, type Schema } from "@tiptap/pm/model";
import { EditorState, NodeSelection, Plugin, PluginKey, TextSelection, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  isHistoryTransaction,
  redo as pmRedo,
  undo as pmUndo,
} from "@tiptap/pm/history";
import { lowlight } from "@/lib/syntaxHighlighter";
import { isAudioMedia, isVideoMedia } from "@/lib/webmClassifier";

const MAX_LIVE_HISTORY_DEPTH = 100;
const LIVE_HISTORY_GROUP_DELAY_MS = 500;

export interface LivePreviewHistoryEntry {
  /** Clean (canonical collapsed) ProseMirror document snapshot */
  doc: PMNode;
  /** Selection offsets in the clean canonical doc */
  selectionFrom: number;
  selectionTo: number;
  /** Position of the expanded block in the clean doc (if captured while expanded) */
  expandedBlockPos: number | null;
  /** Cursor offset inside the raw expanded text (when expandedBlockPos !== null) */
  rawCursorOffset: number | null;
  /** Timestamp when captured */
  timestamp: number;
}

export type LiveBlockContext =
  | "heading"
  | "paragraph"
  | "blockquote"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "tableCell"
  | "media";

export interface InlineFormattedRun {
  /** 0-based start offset inside blockNode content (relative to blockPos + 1) */
  fromOffset: number;
  /** 0-based end offset inside blockNode content */
  toOffset: number;
  /** Contiguous marked ProseMirror text nodes belonging to this inline element */
  nodes: PMNode[];
}

export interface ActiveInlineSpan {
  /** 0-based start offset inside blockNode content (relative to blockPos + 1) */
  fromOffset: number;
  /** 0-based end offset inside blockNode content */
  toOffset: number;
  /** Initial raw Markdown/HTML text when this inline element was expanded */
  initialRawText: string;
  /** Original ProseMirror inline nodes before expansion for lossless unedited collapse */
  originalNodes: PMNode[];
  /** Whether the user edited this expanded inline span */
  dirty: boolean;
}

export interface ActiveLiveBlockInfo {
  /** Position right before the active block node in doc */
  blockPos: number;
  /** Original context when expanded */
  originalContext: LiveBlockContext;
  /** Whether this block was the document Title H1 at pos 0 */
  isTitleH1: boolean;
  /** Whether a block prefix (`## ` or `> `) was expanded at the start of this block */
  hasExpandedPrefix: boolean;
  /** Initial block prefix string (e.g. "## ", "> ", or "") */
  initialPrefix: string;
  /** Initial raw markdown string (for media blocks, or full initial block raw text snapshot) */
  initialRawText: string;
  /** Snapshot of the original node before expansion for lossless unedited collapse */
  originalNode: PMNode;
  /** Currently expanded inline element inside this block (Obsidian-style per-element reveal) */
  activeInline: ActiveInlineSpan | null;
  /** Original checked attribute if inside a taskItem */
  originalTaskChecked?: boolean;
  /** Whether the user modified the block while focused */
  dirty: boolean;
}

export interface LivePreviewPluginState {
  activeBlock: ActiveLiveBlockInfo | null;
  decorations: DecorationSet;
  /** Canonical undo stack preserved across Live Preview expand/collapse cycles */
  undoStack: LivePreviewHistoryEntry[];
  /** Canonical redo stack preserved across Live Preview expand/collapse cycles */
  redoStack: LivePreviewHistoryEntry[];
  /** Timestamp of the most recent user edit for keystroke grouping */
  lastEditTime: number;
  /** Block position of the most recent user edit */
  lastEditBlockPos: number | null;
  /** True once Live Preview has interacted with document edits so undo/redo stays consistent even after toggling Live Preview off */
  liveHistoryActive: boolean;
}

export interface LivePreviewOptions {
  enabled: boolean | (() => boolean);
  hasTitleH1?: boolean | (() => boolean);
  isSlashMenuOpen?: () => boolean;
}

export const livePreviewPluginKey = new PluginKey<LivePreviewPluginState>("livePreview");

interface OffsetSegment {
  renderedStart: number;
  renderedEnd: number;
  rawStart: number;
  rawEnd: number;
}

export interface SerializedLiveBlock {
  rawMarkdown: string;
  blockPrefix: string;
  mapRenderedToRaw: (renderedOffset: number, placeBeforePrefixAtZero?: boolean) => number;
}

/**
 * Checks whether a ProseMirror node is an expandable attachment/media node (image, video, or audio).
 * Excludes dynamic QR code generator widgets (`data-qr-code="true"`).
 */
export function isExpandableMediaNode(node: PMNode | null | undefined): boolean {
  if (!node) return false;
  const typeName = node.type.name;
  if (typeName !== "image" && typeName !== "video" && typeName !== "audio") {
    return false;
  }
  if (typeName === "image" && String(node.attrs?.["data-qr-code"] || "") === "true") {
    return false;
  }
  return true;
}

/**
 * Serializes an `image`, `video`, or `audio` ProseMirror node into its Obsidian/Markdown embed syntax
 * (e.g. `![[attachments/photo.png|400]]`, `![Caption|350](attachments/photo.png)`, `![[attachments/video.mp4|640]]`, `![[attachments/audio.webm]]`).
 */
export function serializeMediaNodeToRawMarkdown(node: PMNode): string {
  const typeName = node.type.name;
  const relSrc = String(node.attrs?.["data-relative-src"] || "").trim();
  const wikiEmbedAttr = String(node.attrs?.["data-wikilink-embed"] || "").trim();
  const rawSrc = String(node.attrs?.src || "").trim();
  const alt = String(node.attrs?.alt || "").trim();
  const title = String(node.attrs?.title || "").trim();

  let displaySrc =
    relSrc ||
    (wikiEmbedAttr && wikiEmbedAttr !== "true" ? wikiEmbedAttr : "") ||
    (!/^(?:blob:|data:)/i.test(rawSrc) ? rawSrc : "") ||
    title ||
    alt ||
    rawSrc;

  if (displaySrc && !/^(?:https?:\/\/|data:|blob:)/i.test(displaySrc)) {
    try {
      displaySrc = decodeURIComponent(displaySrc);
    } catch {
      // Keep as-is if malformed percent encoding
    }
  }

  const rawWidth = node.attrs?.width;
  const parsedWidth =
    rawWidth !== null && rawWidth !== undefined && String(rawWidth).trim() !== ""
      ? parseInt(String(rawWidth), 10)
      : null;
  const validWidth = parsedWidth && !Number.isNaN(parsedWidth) && parsedWidth > 0 ? parsedWidth : null;

  const baseName = displaySrc.split(/[\\/]/).pop() || displaySrc;
  let decodedBaseName = baseName;
  try {
    decodedBaseName = decodeURIComponent(baseName);
  } catch {
    // ignore
  }

  const labelCandidate = typeName === "image" ? alt : title || alt;
  const hasCustomLabel = Boolean(
    labelCandidate &&
      labelCandidate !== displaySrc &&
      labelCandidate !== baseName &&
      labelCandidate !== decodedBaseName
  );

  const isLocalPath = Boolean(displaySrc && !/^(?:https?:\/\/|data:|blob:)/i.test(displaySrc));
  const useWikilinkEmbed =
    Boolean(wikiEmbedAttr) ||
    (isLocalPath && (typeName === "video" || typeName === "audio" || !hasCustomLabel));

  if (useWikilinkEmbed) {
    if (hasCustomLabel && validWidth) {
      return `![[${displaySrc}|${labelCandidate}|${validWidth}]]`;
    }
    if (validWidth) {
      return `![[${displaySrc}|${validWidth}]]`;
    }
    if (hasCustomLabel) {
      return `![[${displaySrc}|${labelCandidate}]]`;
    }
    return `![[${displaySrc}]]`;
  }

  if (validWidth) {
    return `![${labelCandidate}|${validWidth}](${displaySrc})`;
  }
  return `![${labelCandidate}](${displaySrc})`;
}

/**
 * Parses a raw Markdown/HTML media line (`![[file|width]]`, `![alt|width](url "title")`, `<img ...>`, `<video ...>`, `<audio ...>`)
 * back into an `image`, `video`, or `audio` ProseMirror node.
 * Preserves the resolved `blob:` `src` from `originalNode` when the underlying file path is unchanged.
 */
export function parseRawMarkdownToMediaNode(
  rawText: string,
  schema: Schema,
  originalNode?: PMNode | null
): PMNode | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const normalizeRelTarget = (target: string): string => {
    let clean = target.trim();
    if (clean && !/^(?:https?:\/\/|data:|blob:)/i.test(clean)) {
      try {
        clean = encodeURI(decodeURI(clean));
      } catch {
        clean = clean.replace(/ /g, "%20");
      }
    }
    return clean;
  };

  const decodeSafe = (val: string): string => {
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  };

  const resolveMediaSrc = (cleanSrc: string): string => {
    if (!originalNode) return cleanSrc;
    const origRel = String(originalNode.attrs?.["data-relative-src"] || "").trim();
    const origSrc = String(originalNode.attrs?.src || "").trim();
    if (
      origSrc &&
      (cleanSrc === origRel ||
        decodeSafe(cleanSrc) === decodeSafe(origRel) ||
        cleanSrc === origSrc)
    ) {
      return origSrc;
    }
    return cleanSrc;
  };

  const buildMediaNode = (params: {
    target: string;
    width: number | null;
    customLabel: string;
    isWikilink: boolean;
    explicitKind?: "image" | "video" | "audio";
  }): PMNode | null => {
    const { target, width, customLabel, isWikilink, explicitKind } = params;
    if (!target) return null;

    const cleanSrc = normalizeRelTarget(target);
    const resolvedSrc = resolveMediaSrc(cleanSrc);
    const baseName = decodeSafe(target.split(/[\\/]/).pop() || target);
    const classifyInput = width ? `${target}|${width}` : target;

    let kind: "image" | "video" | "audio";
    if (explicitKind) {
      kind = explicitKind;
    } else if (isVideoMedia(classifyInput)) {
      kind = "video";
    } else if (isAudioMedia(classifyInput)) {
      kind = "audio";
    } else if (
      originalNode &&
      (originalNode.type.name === "video" || originalNode.type.name === "audio") &&
      resolvedSrc === originalNode.attrs?.src
    ) {
      kind = originalNode.type.name as "video" | "audio";
    } else {
      kind = "image";
    }

    if (kind === "video" && schema.nodes.video) {
      const baseAttrs = originalNode?.type.name === "video" ? { ...originalNode.attrs } : {};
      return schema.nodes.video.create({
        ...baseAttrs,
        src: resolvedSrc,
        "data-relative-src": cleanSrc,
        title: customLabel || baseName,
        width: width ?? null,
      });
    }

    if (kind === "audio" && schema.nodes.audio) {
      const baseAttrs = originalNode?.type.name === "audio" ? { ...originalNode.attrs } : {};
      return schema.nodes.audio.create({
        ...baseAttrs,
        src: resolvedSrc,
        "data-relative-src": cleanSrc,
        title: customLabel || baseName,
      });
    }

    if (schema.nodes.image) {
      const baseAttrs = originalNode?.type.name === "image" ? { ...originalNode.attrs } : {};
      return schema.nodes.image.create({
        ...baseAttrs,
        src: resolvedSrc,
        "data-relative-src": cleanSrc,
        "data-wikilink-embed": isWikilink ? "true" : null,
        alt: customLabel || (isWikilink ? baseName : ""),
        title: customLabel || baseAttrs.title || null,
        width: width ?? null,
      });
    }

    return null;
  };

  // 1. Obsidian Wikilink Embed: ![[target]] or ![[target|400]] or ![[target|alt|400]]
  const wikiEmbedMatch = /^!\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]*))?\]\]$/.exec(trimmed);
  if (wikiEmbedMatch) {
    const target = (wikiEmbedMatch[1] || "").trim();
    const pipeRaw = (wikiEmbedMatch[2] || "").trim();
    let width: number | null = null;
    let customLabel = "";

    if (pipeRaw) {
      const parts = pipeRaw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const part of parts) {
        const dimMatch = /^(\d+)(?:x\d+)?$/.exec(part);
        if (dimMatch) {
          width = parseInt(dimMatch[1], 10);
        } else {
          customLabel = part;
        }
      }
    }

    const isMediaExt =
      /\.(?:png|jpe?g|gif|webp|svg|bmp|ico|avif|tiff?|mp4|mov|mkv|avi|wmv|flv|m4v|3gp|ogv|mpg|mpeg|webm|mp3|wav|ogg|m4a|flac|aac|opus|wma|aiff|mid|midi|weba)(?:[?#].*)?$/i.test(
        target
      );
    if (isMediaExt || originalNode || !target.includes(".")) {
      return buildMediaNode({
        target,
        width,
        customLabel,
        isWikilink: true,
      });
    }
  }

  // 2. Standard Markdown Image / Media: ![alt](url) or ![alt|400](url "title")
  const mdEmbedMatch = /^!\[([^\]\r\n]*)\]\(([^)\r\n]+)\)$/.exec(trimmed);
  if (mdEmbedMatch) {
    const rawAlt = (mdEmbedMatch[1] || "").trim();
    const rawUrlPart = (mdEmbedMatch[2] || "").trim();
    const urlTitleMatch = /^(\S+.*?)(?:\s+["']([^"']*)["'])?$/.exec(rawUrlPart);
    const target = (urlTitleMatch ? urlTitleMatch[1] : rawUrlPart).trim();
    const titleFromUrl = urlTitleMatch?.[2]?.trim() || "";

    let width: number | null = null;
    let customLabel = rawAlt;

    const sizedAltMatch = /^(.*?)\|(\d+)(?:x\d+)?$/.exec(rawAlt);
    if (sizedAltMatch) {
      customLabel = sizedAltMatch[1].trim();
      width = parseInt(sizedAltMatch[2], 10);
    }

    return buildMediaNode({
      target,
      width,
      customLabel: customLabel || titleFromUrl,
      isWikilink: false,
    });
  }

  // 3. Raw HTML <img ... />, <video ...></video>, <audio ...></audio>
  const htmlMediaMatch = /^<(img|video|audio)\s+([^>]+?)(?:\/>|>(?:<\/\1>)?)$/i.exec(trimmed);
  if (htmlMediaMatch) {
    const tag = htmlMediaMatch[1].toLowerCase() as "img" | "video" | "audio";
    const attrsStr = htmlMediaMatch[2];
    const getAttr = (name: string): string => {
      const m = new RegExp(`\\b${name}=["']([^"']*)["']`, "i").exec(attrsStr);
      return m ? m[1].trim() : "";
    };
    const target = getAttr("data-relative-src") || getAttr("src");
    const widthStr = getAttr("width");
    const width = widthStr && /^\d+$/.test(widthStr) ? parseInt(widthStr, 10) : null;
    const customLabel = getAttr("alt") || getAttr("title") || getAttr("data-title");
    const isWikilink = Boolean(getAttr("data-wikilink-embed"));
    if (target) {
      return buildMediaNode({
        target,
        width,
        customLabel,
        isWikilink,
        explicitKind: tag === "img" ? "image" : tag,
      });
    }
  }

  return null;
}

/**
 * Checks if a node is inside a reading-mode bottom footnotes section.
 */
function isInsideReadingFootnotesSection(doc: PMNode, pos: number): boolean {
  try {
    const $pos = doc.resolve(pos);
    for (let d = $pos.depth; d >= 1; d--) {
      const ancestor = $pos.node(d);
      if (ancestor.type.name === "orderedList") {
        let hasFootnoteBackref = false;
        ancestor.descendants((child) => {
          if (hasFootnoteBackref) return false;
          if (child.isText && (child.text?.includes("↩") || child.text?.includes("\u21a9"))) {
            hasFootnoteBackref = true;
            return false;
          }
          if (
            child.marks?.some(
              (m) =>
                m.type.name === "link" &&
                (m.attrs?.href?.includes("#fnref-") ||
                  m.attrs?.["data-footnote-backref"] ||
                  m.attrs?.["data-footnote-target"])
            )
          ) {
            hasFootnoteBackref = true;
            return false;
          }
          return true;
        });
        if (hasFootnoteBackref) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export interface TargetTextblockResult {
  blockPos: number;
  blockNode: PMNode;
  depth: number;
  context: LiveBlockContext;
  isTitleH1: boolean;
  taskChecked?: boolean;
}

/**
 * Returns true if `pos` is inside the file's dedicated Document Title H1 at `blockPos === 0`
 * (when `hasTitleH1Option` is true). Live Preview never touches or expands the file's H1 Title.
 */
export function isPosInDocumentTitleH1(
  doc: PMNode,
  pos: number,
  hasTitleH1Option: boolean = false
): boolean {
  if (!hasTitleH1Option || doc.content.size === 0) return false;
  const clamped = Math.max(0, Math.min(pos, doc.content.size));
  if (clamped === 0) {
    const first = doc.firstChild;
    return Boolean(
      first && first.type.name === "heading" && ((first.attrs?.level as number) || 1) === 1
    );
  }
  try {
    const $pos = doc.resolve(clamped);
    if ($pos.depth >= 1) {
      const topPos = $pos.before(1);
      const topNode = $pos.node(1);
      return (
        topPos === 0 &&
        topNode.type.name === "heading" &&
        ((topNode.attrs?.level as number) || 1) === 1
      );
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Finds the innermost expandable block (heading, paragraph, or media attachment: image/video/audio) at `pos`.
 */
export function findTargetTextblock(
  doc: PMNode,
  pos: number,
  hasTitleH1Option: boolean = false
): TargetTextblockResult | null {
  if (doc.content.size === 0) return null;
  const clampedPos = Math.max(0, Math.min(pos, doc.content.size));
  try {
    const directNode = doc.nodeAt(clampedPos);
    if (isExpandableMediaNode(directNode)) {
      return {
        blockPos: clampedPos,
        blockNode: directNode!,
        depth: 1,
        context: "media",
        isTitleH1: false,
      };
    }

    const $pos = doc.resolve(clampedPos);
    for (let d = $pos.depth; d >= 1; d--) {
      const node = $pos.node(d);
      if (isExpandableMediaNode(node)) {
        return {
          blockPos: $pos.before(d),
          blockNode: node,
          depth: d,
          context: "media",
          isTitleH1: false,
        };
      }
      if (node.type.name !== "heading" && node.type.name !== "paragraph") {
        if (node.type.name === "codeBlock" || node.type.name === "codeBlockLowlight" || node.type.name === "toggle") {
          return null;
        }
        continue;
      }

      const blockPos = $pos.before(d);
      if (isInsideReadingFootnotesSection(doc, blockPos + 1)) {
        return null;
      }

      // Skip blocks that contain non-text inline atom nodes (e.g. hardBreak or inline widgets)
      let hasNonTextChild = false;
      node.forEach((child) => {
        if (!child.isText) {
          hasNonTextChild = true;
        }
      });
      if (hasNonTextChild) {
        return null;
      }

      const isTitleH1 =
        hasTitleH1Option &&
        blockPos === 0 &&
        node.type.name === "heading" &&
        ((node.attrs?.level as number) || 1) === 1;

      // Live Preview must NOT affect the file's dedicated H1 Title at pos 0
      if (isTitleH1) {
        return null;
      }

      let context: LiveBlockContext = node.type.name === "heading" ? "heading" : "paragraph";
      let taskChecked: boolean | undefined;

      if (node.type.name === "paragraph" && d >= 2) {
        const parent = $pos.node(d - 1);
        if (parent.type.name === "blockquote") {
          context = "blockquote";
        } else if (parent.type.name === "taskItem") {
          context = "taskList";
          taskChecked = Boolean(parent.attrs?.checked);
        } else if (parent.type.name === "listItem") {
          const grandParent = d >= 3 ? $pos.node(d - 2) : null;
          context = grandParent?.type.name === "orderedList" ? "orderedList" : "bulletList";
        } else if (parent.type.name === "tableCell" || parent.type.name === "tableHeader") {
          context = "tableCell";
        }
      }

      return {
        blockPos,
        blockNode: node,
        depth: d,
        context,
        isTitleH1,
        taskChecked,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Computes the Markdown block prefix for a textblock.
 * Note: Like Obsidian Live Preview, list items (`bulletList`, `orderedList`, `taskList`) keep their
 * rendered visual bullets, numbers, and checkboxes at all times and do NOT expand into raw `- ` / `1. ` / `- [ ] `.
 */
export function computeBlockPrefix(doc: PMNode, blockPos: number, blockNode: PMNode): string {
  if (isExpandableMediaNode(blockNode)) {
    return "";
  }
  let blockPrefix = "";
  try {
    const $inside = doc.resolve(Math.min(blockPos + 1, doc.content.size));
    const d = $inside.depth;

    if (blockNode.type.name === "heading") {
      const level = Math.min(6, Math.max(1, Number(blockNode.attrs?.level) || 1));
      blockPrefix = `${"#".repeat(level)} `;
    } else if (blockNode.type.name === "paragraph" && d >= 2) {
      const parent = $inside.node(d - 1);
      if (parent.type.name === "blockquote") {
        blockPrefix = "> ";
      }
    }
  } catch {
    if (blockNode.type.name === "heading") {
      const level = Math.min(6, Math.max(1, Number(blockNode.attrs?.level) || 1));
      blockPrefix = `${"#".repeat(level)} `;
    }
  }
  return blockPrefix;
}

/**
 * Checks whether two adjacent marked text nodes share at least one equal ProseMirror mark
 * (so nested/overlapping formatting like `**bold *and italic***` or `[**bold** link](url)` stays one logical inline element,
 * while separate adjacent elements like `<strong>bold</strong><em>italic</em>` remain distinct elements).
 */
function sharesAtLeastOneMark(a: PMNode, b: PMNode): boolean {
  if (!a.marks?.length || !b.marks?.length) return false;
  return a.marks.some((m1) => b.marks.some((m2) => m1.eq(m2)));
}

/**
 * Finds all distinct formatted inline runs (marked text spans) inside a textblock node.
 */
export function findInlineFormattedRuns(blockNode: PMNode): InlineFormattedRun[] {
  const runs: InlineFormattedRun[] = [];
  let current: InlineFormattedRun | null = null;

  blockNode.forEach((child, offset) => {
    if (!child.isText || !child.marks || child.marks.length === 0) {
      if (current) {
        runs.push(current);
        current = null;
      }
      return;
    }

    const childEnd = offset + child.nodeSize;
    if (current && current.toOffset === offset && sharesAtLeastOneMark(current.nodes[current.nodes.length - 1], child)) {
      current.toOffset = childEnd;
      current.nodes.push(child);
    } else {
      if (current) {
        runs.push(current);
      }
      current = {
        fromOffset: offset,
        toOffset: childEnd,
        nodes: [child],
      };
    }
  });

  if (current) {
    runs.push(current);
  }

  return runs;
}

/**
 * Finds the formatted inline run touched by `[selFromOffset, selToOffset]` (inclusive of both boundaries,
 * matching Obsidian Live Preview where placing the cursor immediately before, inside, or immediately after
 * a formatted word/element reveals only that element).
 */
export function findTouchedInlineRun(
  blockNode: PMNode,
  selFromOffset: number,
  selToOffset: number,
  minOffset: number = 0
): InlineFormattedRun | null {
  const runs = findInlineFormattedRuns(blockNode);
  let best: InlineFormattedRun | null = null;

  for (const run of runs) {
    if (run.toOffset < minOffset) continue;
    if (selFromOffset <= run.toOffset && selToOffset >= run.fromOffset) {
      // If cursor is collapsed right on the boundary between two immediately adjacent distinct elements
      // (e.g. `<strong>A</strong>|<em>B</em>`), prefer the element ending at the cursor (`A`).
      if (!best || (selFromOffset === selToOffset && run.toOffset === selFromOffset)) {
        best = run;
      }
    }
  }
  return best;
}

/**
 * Serializes a list of ProseMirror inline text nodes into raw Markdown/HTML plus an offset mapper.
 */
export function serializeInlineNodesToRawMarkdown(
  children: PMNode[],
  blockPrefix: string = ""
): SerializedLiveBlock {
  let raw = blockPrefix;
  let renderedCursor = 0;
  const segments: OffsetSegment[] = [];

  const getStandardLinkKey = (node: PMNode): string | null => {
    const linkMark = node.marks?.find((m) => m.type.name === "link");
    if (!linkMark) return null;
    const href = String(linkMark.attrs?.href || "").trim();
    const fnRefAttr = linkMark.attrs?.["data-footnote-ref"];
    const fnBackrefAttr = linkMark.attrs?.["data-footnote-backref"];
    const wikiAttr = linkMark.attrs?.["data-wikilink"];
    if (fnRefAttr || fnBackrefAttr || href.startsWith("#fn-") || href.startsWith("#fnref-")) {
      return null;
    }
    if (wikiAttr || href.startsWith("wikilink:")) {
      return null;
    }
    return href || null;
  };

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const text = child.text || "";
    const childLen = text.length;
    const renderedStart = renderedCursor;
    const renderedEnd = renderedCursor + childLen;
    renderedCursor = renderedEnd;

    const marks = child.marks || [];
    if (marks.length === 0) {
      const rawStart = raw.length;
      raw += text;
      segments.push({
        renderedStart,
        renderedEnd,
        rawStart,
        rawEnd: raw.length,
      });
      continue;
    }

    // 1. Check for footnote reference: <a href="#fn-1" data-footnote-ref="1">[1]</a>
    const linkMark = marks.find((m) => m.type.name === "link");
    if (linkMark) {
      const href = String(linkMark.attrs?.href || "").trim();
      const fnRefAttr = linkMark.attrs?.["data-footnote-ref"];
      const fnBackrefAttr = linkMark.attrs?.["data-footnote-backref"];
      const bracketMatch = text.match(/^\[([^\]]+)\]$/);

      if ((fnRefAttr || href.startsWith("#fn-")) && bracketMatch) {
        const fnId = String(fnRefAttr || href.replace(/^#fn-/, "") || bracketMatch[1]).trim();
        const rawStart = raw.length;
        raw += `[^${fnId}]`;
        segments.push({
          renderedStart,
          renderedEnd,
          rawStart: rawStart + 2,
          rawEnd: rawStart + 2 + fnId.length,
        });
        continue;
      }

      // 2. Check for in-place footnote definition prefix: <a href="#fnref-1" data-footnote-backref="1">[^1]:</a>
      if ((fnBackrefAttr || href.startsWith("#fnref-")) && /^\[\^[^\]]+\]:$/.test(text)) {
        const rawStart = raw.length;
        raw += text;
        segments.push({
          renderedStart,
          renderedEnd,
          rawStart,
          rawEnd: raw.length,
        });
        continue;
      }
    }

    const currLinkHref = getStandardLinkKey(child);
    const prevLinkHref = i > 0 ? getStandardLinkKey(children[i - 1]) : null;
    const nextLinkHref = i + 1 < children.length ? getStandardLinkKey(children[i + 1]) : null;
    const isLinkStart = Boolean(currLinkHref && currLinkHref !== prevLinkHref);
    const isLinkEnd = Boolean(currLinkHref && currLinkHref !== nextLinkHref);

    const hasMdDelimMarks = marks.some((m) =>
      ["bold", "strong", "italic", "em", "strike", "highlight"].includes(m.type.name)
    );
    const leadWS = hasMdDelimMarks ? text.match(/^(\s*)/)?.[1] || "" : "";
    const trailWS = hasMdDelimMarks ? text.slice(leadWS.length).match(/(\s*)$/)?.[1] || "" : "";
    const coreText = text.slice(leadWS.length, text.length - trailWS.length);

    if (!coreText) {
      if (isLinkStart) raw += "[";
      const rawStart = raw.length;
      raw += text;
      segments.push({
        renderedStart,
        renderedEnd,
        rawStart,
        rawEnd: raw.length,
      });
      if (isLinkEnd && currLinkHref) raw += `](${currLinkHref})`;
      continue;
    }

    let open = "";
    let close = "";

    if (linkMark && !currLinkHref) {
      const href = String(linkMark.attrs?.href || "").trim();
      const wikiAttr = linkMark.attrs?.["data-wikilink"];
      if (wikiAttr || href.startsWith("wikilink:")) {
        const target = String(wikiAttr || decodeURIComponent(href.replace(/^wikilink:/, ""))).trim();
        if (coreText === target) {
          open += "[[";
          close = `]]${close}`;
        } else {
          open += `[[${target}|`;
          close = `]]${close}`;
        }
      }
    }

    const colorMark = marks.find((m) => m.type.name === "textColor");
    const fontMark = marks.find((m) => m.type.name === "fontFamily");
    const sizeMark = marks.find((m) => m.type.name === "fontSize");
    if (colorMark?.attrs?.color) {
      open += `<span style="color: ${colorMark.attrs.color};">`;
      close = `</span>${close}`;
    }
    if (fontMark?.attrs?.fontFamily) {
      open += `<span style="font-family: ${fontMark.attrs.fontFamily};">`;
      close = `</span>${close}`;
    }
    if (sizeMark?.attrs?.fontSize) {
      open += `<span style="font-size: ${sizeMark.attrs.fontSize};">`;
      close = `</span>${close}`;
    }

    if (marks.some((m) => m.type.name === "highlight")) {
      open += "==";
      close = `==${close}`;
    }
    if (marks.some((m) => m.type.name === "strike")) {
      open += "~~";
      close = `~~${close}`;
    }
    if (marks.some((m) => m.type.name === "underline")) {
      open += "<u>";
      close = `</u>${close}`;
    }
    if (marks.some((m) => m.type.name === "superscript")) {
      open += "<sup>";
      close = `</sup>${close}`;
    }
    if (marks.some((m) => m.type.name === "subscript")) {
      open += "<sub>";
      close = `</sub>${close}`;
    }
    if (marks.some((m) => m.type.name === "kbd")) {
      open += "<kbd>";
      close = `</kbd>${close}`;
    }

    const hasBold = marks.some((m) => m.type.name === "bold" || m.type.name === "strong");
    const hasItalic = marks.some((m) => m.type.name === "italic" || m.type.name === "em");
    if (hasBold && hasItalic) {
      open += "***";
      close = `***${close}`;
    } else if (hasBold) {
      open += "**";
      close = `**${close}`;
    } else if (hasItalic) {
      open += "*";
      close = `*${close}`;
    }

    if (marks.some((m) => m.type.name === "code")) {
      let delim = "`";
      const backticks: string[] = coreText.match(/`+/g) || [];
      while (backticks.includes(delim)) {
        delim += "`";
      }
      open += delim;
      close = `${delim}${close}`;
    }

    if (isLinkStart) {
      raw += "[";
    }

    if (leadWS) {
      const lStart = raw.length;
      raw += leadWS;
      segments.push({
        renderedStart,
        renderedEnd: renderedStart + leadWS.length,
        rawStart: lStart,
        rawEnd: raw.length,
      });
    }

    raw += open;
    const coreRawStart = raw.length;
    raw += coreText;
    const coreRawEnd = raw.length;
    segments.push({
      renderedStart: renderedStart + leadWS.length,
      renderedEnd: renderedEnd - trailWS.length,
      rawStart: coreRawStart,
      rawEnd: coreRawEnd,
    });
    raw += close;

    if (trailWS) {
      const tStart = raw.length;
      raw += trailWS;
      segments.push({
        renderedStart: renderedEnd - trailWS.length,
        renderedEnd,
        rawStart: tStart,
        rawEnd: raw.length,
      });
    }

    if (isLinkEnd && currLinkHref) {
      raw += `](${currLinkHref})`;
    }
  }

  const mapRenderedToRaw = (renderedOffset: number, placeBeforePrefixAtZero = false): number => {
    if (renderedOffset <= 0) {
      return placeBeforePrefixAtZero ? 0 : blockPrefix.length;
    }
    if (renderedOffset >= renderedCursor) {
      return raw.length;
    }
    for (const seg of segments) {
      if (renderedOffset >= seg.renderedStart && renderedOffset <= seg.renderedEnd) {
        const delta = Math.min(renderedOffset - seg.renderedStart, seg.rawEnd - seg.rawStart);
        return seg.rawStart + delta;
      }
    }
    return Math.min(raw.length, blockPrefix.length + renderedOffset);
  };

  return {
    rawMarkdown: raw,
    blockPrefix,
    mapRenderedToRaw,
  };
}

/**
 * Serializes a rendered ProseMirror block (heading, paragraph, or media node) into its raw Markdown string
 * and returns a character-accurate offset mapping function from rendered offsets to raw offsets.
 */
export function serializeBlockToRawMarkdown(
  doc: PMNode,
  blockPos: number,
  blockNode: PMNode,
  includeBlockPrefix: boolean = true
): SerializedLiveBlock {
  if (isExpandableMediaNode(blockNode)) {
    const rawMedia = serializeMediaNodeToRawMarkdown(blockNode);
    return {
      rawMarkdown: rawMedia,
      blockPrefix: "",
      mapRenderedToRaw: (renderedOffset: number, placeBeforePrefixAtZero = false) =>
        placeBeforePrefixAtZero || renderedOffset < 0 ? 0 : rawMedia.length,
    };
  }

  const blockPrefix = includeBlockPrefix ? computeBlockPrefix(doc, blockPos, blockNode) : "";
  const children: PMNode[] = [];
  blockNode.forEach((c) => {
    if (c.isText) children.push(c);
  });

  return serializeInlineNodesToRawMarkdown(children, blockPrefix);
}

interface InlineTokenMatch {
  index: number;
  length: number;
  buildNodes: () => PMNode[];
}

/**
 * Finds the first `<span ... style="...">...</span>` block using balanced tag depth tracking
 * so nested spans like `<span style="color:...;"><span style="font-size:...;">text</span></span>`
 * parse cleanly without stopping prematurely at the first inner `</span>`.
 */
function findBalancedSpanMatch(
  input: string
): { index: number; length: number; styleStr: string; inner: string } | null {
  const openRegex = /<span\s+[^>]*style=["']([^"']+)["'][^>]*>/i;
  const openMatch = openRegex.exec(input);
  if (!openMatch) return null;

  const startIndex = openMatch.index;
  const contentStart = startIndex + openMatch[0].length;
  const tagScanner = /<(\/?)span(?:\s[^>]*)?>/gi;
  tagScanner.lastIndex = contentStart;

  let depth = 1;
  let scanMatch: RegExpExecArray | null;
  while ((scanMatch = tagScanner.exec(input)) !== null) {
    if (scanMatch[1] === "/") {
      depth--;
      if (depth === 0) {
        const contentEnd = scanMatch.index;
        const fullEnd = contentEnd + scanMatch[0].length;
        return {
          index: startIndex,
          length: fullEnd - startIndex,
          styleStr: openMatch[1],
          inner: input.slice(contentStart, contentEnd),
        };
      }
    } else {
      depth++;
    }
  }
  return null;
}

/**
 * Finds the next earliest inline Markdown/HTML syntax token in `remaining`.
 */
function findNextInlineTokenMatch(
  remaining: string,
  schema: Schema,
  activeMarks: readonly Mark[]
): InlineTokenMatch | null {
  const addMark = (marks: readonly Mark[], newMark: Mark | null | undefined): readonly Mark[] => {
    if (!newMark) return marks;
    return newMark.addToSet(marks);
  };

  const candidates: InlineTokenMatch[] = [];

  // 1. Inline code: `code` or ``code``
  const codeMatch = /(`+)([^`]+?)\1/.exec(remaining);
  if (codeMatch && schema.marks.code) {
    candidates.push({
      index: codeMatch.index,
      length: codeMatch[0].length,
      buildNodes: () => [
        schema.text(codeMatch[2], addMark(activeMarks, schema.marks.code.create())),
      ],
    });
  }

  // 2. Footnote definition prefix at start: [^id]:
  const fnDefMatch = /^\[\^([^\]\r\n\s]+)\]:/.exec(remaining);
  if (fnDefMatch && schema.marks.link) {
    const fnId = fnDefMatch[1].trim();
    candidates.push({
      index: fnDefMatch.index,
      length: fnDefMatch[0].length,
      buildNodes: () => [
        schema.text(
          `[^${fnId}]:`,
          addMark(
            activeMarks,
            schema.marks.link.create({
              href: `#fnref-${fnId}`,
              "data-footnote-backref": fnId,
              class:
                "footnote-backref text-primary font-medium mr-1 select-none no-underline hover:underline cursor-pointer",
            })
          )
        ),
      ],
    });
  }

  // 3. Footnote reference: [^id] (not followed by :)
  const fnRefMatch = /\[\^([^\]\r\n\s]+)\](?!:)/.exec(remaining);
  if (fnRefMatch && schema.marks.link) {
    const fnId = fnRefMatch[1].trim();
    candidates.push({
      index: fnRefMatch.index,
      length: fnRefMatch[0].length,
      buildNodes: () => {
        let marks = activeMarks;
        if (schema.marks.superscript) {
          marks = addMark(marks, schema.marks.superscript.create());
        }
        marks = addMark(
          marks,
          schema.marks.link.create({
            href: `#fn-${fnId}`,
            id: `fnref-${fnId}`,
            "data-footnote-ref": fnId,
            class: "footnote-ref text-primary hover:underline cursor-pointer select-none font-medium px-0.5",
          })
        );
        return [schema.text(`[${fnId}]`, marks)];
      },
    });
  }

  // 4. Wikilink: [[Target]] or [[Target|Alias]]
  const wikiMatch = /(?<!\!)\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/.exec(remaining);
  if (wikiMatch && schema.marks.link) {
    const target = (wikiMatch[1] || "").trim();
    const alias = (wikiMatch[2] || "").trim() || target;
    if (target) {
      candidates.push({
        index: wikiMatch.index,
        length: wikiMatch[0].length,
        buildNodes: () => [
          schema.text(
            alias,
            addMark(
              activeMarks,
              schema.marks.link.create({
                href: `wikilink:${encodeURIComponent(target)}`,
                "data-wikilink": target,
                class: "internal-wikilink text-primary underline underline-offset-4 cursor-pointer",
              })
            )
          ),
        ],
      });
    }
  }

  // 5. Standard Markdown link: [label](url)
  const mdLinkMatch = /(?<!\!)\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(remaining);
  if (mdLinkMatch && schema.marks.link) {
    const label = mdLinkMatch[1];
    const href = mdLinkMatch[2].trim();
    candidates.push({
      index: mdLinkMatch.index,
      length: mdLinkMatch[0].length,
      buildNodes: () =>
        parseInlineMarkdownToProseMirrorNodes(
          label,
          schema,
          addMark(activeMarks, schema.marks.link.create({ href }))
        ),
    });
  }

  // 6. Bold + Italic: ***text*** or ___text___
  const boldItalicMatch = /(\*\*\*|___)(?=\S)(.+?)(?<=\S)\1/.exec(remaining);
  const boldMarkType = schema.marks.bold || schema.marks.strong;
  const italicMarkType = schema.marks.italic || schema.marks.em;
  if (boldItalicMatch && boldMarkType && italicMarkType) {
    candidates.push({
      index: boldItalicMatch.index,
      length: boldItalicMatch[0].length,
      buildNodes: () => {
        let marks = addMark(activeMarks, boldMarkType.create());
        marks = addMark(marks, italicMarkType.create());
        return parseInlineMarkdownToProseMirrorNodes(boldItalicMatch[2], schema, marks);
      },
    });
  }

  // 7. Bold: **text** or __text__
  const boldMatch = /(\*\*|__)(?=\S)(.+?)(?<=\S)\1/.exec(remaining);
  if (boldMatch && boldMarkType) {
    candidates.push({
      index: boldMatch.index,
      length: boldMatch[0].length,
      buildNodes: () =>
        parseInlineMarkdownToProseMirrorNodes(
          boldMatch[2],
          schema,
          addMark(activeMarks, boldMarkType.create())
        ),
    });
  }

  // 8. Highlight: ==text==
  const highlightMatch = /==(?=\S)(.+?)(?<=\S)==/.exec(remaining);
  if (highlightMatch && schema.marks.highlight) {
    candidates.push({
      index: highlightMatch.index,
      length: highlightMatch[0].length,
      buildNodes: () =>
        parseInlineMarkdownToProseMirrorNodes(
          highlightMatch[1],
          schema,
          addMark(activeMarks, schema.marks.highlight.create())
        ),
    });
  }

  // 9. Strikethrough: ~~text~~
  const strikeMatch = /~~(?=\S)(.+?)(?<=\S)~~/.exec(remaining);
  if (strikeMatch && schema.marks.strike) {
    candidates.push({
      index: strikeMatch.index,
      length: strikeMatch[0].length,
      buildNodes: () =>
        parseInlineMarkdownToProseMirrorNodes(
          strikeMatch[1],
          schema,
          addMark(activeMarks, schema.marks.strike.create())
        ),
    });
  }

  // 10. Italic: *text* or _text_
  const italicMatch = /(?<![*_A-Za-z0-9])(\*|_)(?=\S)(.+?)(?<=\S)\1(?![*_A-Za-z0-9])/.exec(remaining);
  if (italicMatch && italicMarkType) {
    candidates.push({
      index: italicMatch.index,
      length: italicMatch[0].length,
      buildNodes: () =>
        parseInlineMarkdownToProseMirrorNodes(
          italicMatch[2],
          schema,
          addMark(activeMarks, italicMarkType.create())
        ),
    });
  }

  // 11. HTML inline tags: <u>, <sup>, <sub>, <kbd>, <mark>
  const htmlTagMatch = /<(u|sup|sub|kbd|mark)>([\s\S]+?)<\/\1>/i.exec(remaining);
  if (htmlTagMatch) {
    const tag = htmlTagMatch[1].toLowerCase();
    const inner = htmlTagMatch[2];
    const markType =
      tag === "u"
        ? schema.marks.underline
        : tag === "sup"
        ? schema.marks.superscript
        : tag === "sub"
        ? schema.marks.subscript
        : tag === "kbd"
        ? schema.marks.kbd
        : schema.marks.highlight;
    if (markType) {
      candidates.push({
        index: htmlTagMatch.index,
        length: htmlTagMatch[0].length,
        buildNodes: () =>
          parseInlineMarkdownToProseMirrorNodes(inner, schema, addMark(activeMarks, markType.create())),
      });
    }
  }

  // 12. Styled <span style="...">...</span> (balanced matcher supporting both nested and combined spans)
  const spanMatch = findBalancedSpanMatch(remaining);
  if (spanMatch) {
    const { styleStr, inner } = spanMatch;
    candidates.push({
      index: spanMatch.index,
      length: spanMatch.length,
      buildNodes: () => {
        let marks = activeMarks;
        const colorMatch = styleStr.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
        if (colorMatch && schema.marks.textColor) {
          marks = addMark(marks, schema.marks.textColor.create({ color: colorMatch[1].trim() }));
        }
        const fontMatch = styleStr.match(/(?:^|;)\s*font-family\s*:\s*([^;]+)/i);
        if (fontMatch && schema.marks.fontFamily) {
          marks = addMark(
            marks,
            schema.marks.fontFamily.create({ fontFamily: fontMatch[1].trim().replace(/"/g, "'") })
          );
        }
        const sizeMatch = styleStr.match(/(?:^|;)\s*font-size\s*:\s*([^;]+)/i);
        if (sizeMatch && schema.marks.fontSize) {
          marks = addMark(marks, schema.marks.fontSize.create({ fontSize: sizeMatch[1].trim() }));
        }
        return parseInlineMarkdownToProseMirrorNodes(inner, schema, marks);
      },
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.index !== b.index ? a.index - b.index : b.length - a.length));
  return candidates[0];
}

/**
 * Recursively parses a raw inline Markdown string into ProseMirror inline text nodes with marks.
 */
export function parseInlineMarkdownToProseMirrorNodes(
  text: string,
  schema: Schema,
  activeMarks: readonly Mark[] = []
): PMNode[] {
  if (!text) return [];

  const result: PMNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const best = findNextInlineTokenMatch(remaining, schema, activeMarks);
    if (!best) {
      result.push(schema.text(remaining, activeMarks));
      break;
    }

    if (best.index > 0) {
      result.push(schema.text(remaining.slice(0, best.index), activeMarks));
    }

    const built = best.buildNodes();
    for (const n of built) {
      result.push(n);
    }

    remaining = remaining.slice(best.index + best.length);
  }

  return result;
}

/**
 * Expands a single formatted inline run inside `blockPos` in-place into its raw Markdown/HTML text
 * and maps the cursor into the exact corresponding position inside that run.
 */
function expandInlineRunInTransaction(
  tr: Transaction,
  blockPos: number,
  run: InlineFormattedRun,
  cursorOffsetInBlock: number | null
): ActiveInlineSpan {
  const schema = tr.doc.type.schema;
  const serialized = serializeInlineNodesToRawMarkdown(run.nodes, "");
  const { rawMarkdown, mapRenderedToRaw } = serialized;
  const contentStart = blockPos + 1;
  const absFrom = contentStart + run.fromOffset;
  const absTo = contentStart + run.toOffset;

  if (rawMarkdown.length > 0) {
    tr.replaceWith(absFrom, absTo, schema.text(rawMarkdown));
  } else if (absTo > absFrom) {
    tr.delete(absFrom, absTo);
  }

  if (cursorOffsetInBlock !== null) {
    const runLen = run.toOffset - run.fromOffset;
    const renderedDelta = Math.max(0, Math.min(cursorOffsetInBlock - run.fromOffset, runLen));
    let mappedDelta: number;
    if (renderedDelta <= 0) {
      mappedDelta = 0;
    } else if (renderedDelta >= runLen) {
      mappedDelta = rawMarkdown.length;
    } else {
      mappedDelta = mapRenderedToRaw(renderedDelta, false);
    }
    const newCursor = Math.max(absFrom, Math.min(absFrom + mappedDelta, absFrom + rawMarkdown.length));
    tr.setSelection(TextSelection.create(tr.doc, newCursor));
  }

  return {
    fromOffset: run.fromOffset,
    toOffset: run.fromOffset + rawMarkdown.length,
    initialRawText: rawMarkdown,
    originalNodes: run.nodes,
    dirty: false,
  };
}

/**
 * Collapses the currently active inline span inside `blockPos` back into rendered ProseMirror marks.
 */
function collapseInlineSpanInTransaction(
  tr: Transaction,
  blockPos: number,
  activeInline: ActiveInlineSpan,
  schema: Schema
): { wasModified: boolean } {
  const blockNode = tr.doc.nodeAt(blockPos);
  if (!blockNode || (blockNode.type.name !== "heading" && blockNode.type.name !== "paragraph")) {
    return { wasModified: false };
  }

  const contentStart = blockPos + 1;
  const maxOffset = blockNode.content.size;
  const clampedFrom = Math.max(0, Math.min(activeInline.fromOffset, maxOffset));
  const clampedTo = Math.max(clampedFrom, Math.min(activeInline.toOffset, maxOffset));
  const absFrom = contentStart + clampedFrom;
  const absTo = contentStart + clampedTo;

  const currentRawText = tr.doc.textBetween(absFrom, absTo);
  const wasModified = activeInline.dirty || currentRawText !== activeInline.initialRawText;

  if (!wasModified) {
    tr.replaceWith(absFrom, absTo, activeInline.originalNodes);
    return { wasModified: false };
  }

  const parsedNodes = parseInlineMarkdownToProseMirrorNodes(currentRawText, schema);
  if (parsedNodes.length > 0) {
    tr.replaceWith(absFrom, absTo, parsedNodes);
  } else if (absTo > absFrom) {
    tr.delete(absFrom, absTo);
  }
  return { wasModified: true };
}

/**
 * Scans unmarked plain-text segments of `blockPos` (outside any active selection, activeInline, or block prefix)
 * and compiles any completed raw inline Markdown/HTML syntax into rendered ProseMirror marks immediately
 * when the cursor leaves that syntax token (Obsidian-style live compilation).
 */
function compileUnfocusedPlainMarkdownInBlock(
  tr: Transaction,
  blockPos: number,
  selFromOffset: number,
  selToOffset: number,
  minOffset: number,
  activeInline: ActiveInlineSpan | null,
  schema: Schema
): boolean {
  const blockNode = tr.doc.nodeAt(blockPos);
  if (!blockNode || (blockNode.type.name !== "heading" && blockNode.type.name !== "paragraph")) {
    return false;
  }

  const replacements: Array<{ absFrom: number; absTo: number; nodes: PMNode[] }> = [];
  const contentStart = blockPos + 1;

  blockNode.forEach((child, childOffset) => {
    if (!child.isText || (child.marks && child.marks.length > 0)) return;
    const text = child.text || "";
    if (!text) return;

    let scanPos = 0;
    while (scanPos < text.length) {
      const sub = text.slice(scanPos);
      const match = findNextInlineTokenMatch(sub, schema, []);
      if (!match) break;

      const tokenStartOff = childOffset + scanPos + match.index;
      const tokenEndOff = tokenStartOff + match.length;

      const overlapsPrefix = tokenStartOff < minOffset;
      const overlapsSelection = selFromOffset <= tokenEndOff && selToOffset >= tokenStartOff;
      const overlapsActiveInline =
        activeInline !== null &&
        tokenStartOff < activeInline.toOffset &&
        tokenEndOff > activeInline.fromOffset;

      if (!overlapsPrefix && !overlapsSelection && !overlapsActiveInline) {
        const built = match.buildNodes();
        if (built.length > 0) {
          replacements.push({
            absFrom: contentStart + tokenStartOff,
            absTo: contentStart + tokenEndOff,
            nodes: built,
          });
        }
      }

      scanPos += match.index + match.length;
    }
  });

  if (replacements.length === 0) return false;

  // Apply right-to-left so earlier positions do not shift
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    tr.replaceWith(r.absFrom, r.absTo, r.nodes);
  }
  return true;
}

/**
 * Helper to compile all unmarked plain-text children of a textblock while keeping
 * already-rendered marked children 100% lossless, optionally stripping `stripLeadingChars` from offset 0.
 */
function compileMixedBlockChildren(
  blockNode: PMNode,
  schema: Schema,
  stripLeadingChars: number = 0
): PMNode[] {
  const result: PMNode[] = [];
  let remainingToStrip = stripLeadingChars;

  blockNode.forEach((child) => {
    if (!child.isText) {
      result.push(child);
      return;
    }

    const text = child.text || "";
    if (remainingToStrip > 0) {
      if (text.length <= remainingToStrip) {
        remainingToStrip -= text.length;
        return;
      }
      const sliced = text.slice(remainingToStrip);
      remainingToStrip = 0;
      if (child.marks && child.marks.length > 0) {
        result.push(schema.text(sliced, child.marks));
      } else {
        result.push(...parseInlineMarkdownToProseMirrorNodes(sliced, schema));
      }
      return;
    }

    if (child.marks && child.marks.length > 0) {
      result.push(child);
    } else {
      result.push(...parseInlineMarkdownToProseMirrorNodes(text, schema));
    }
  });

  return result;
}

/**
 * Computes the length of any leading block prefix (`## ` or `> `) present in the unmarked start of `blockNode`.
 */
function getLeadingPrefixLength(blockNode: PMNode, context: LiveBlockContext): number {
  if (context === "bulletList" || context === "orderedList" || context === "taskList" || context === "tableCell") {
    return 0;
  }
  const firstChild = blockNode.firstChild;
  if (!firstChild || !firstChild.isText || (firstChild.marks && firstChild.marks.length > 0)) {
    return 0;
  }
  const firstText = firstChild.text || "";
  const hMatch = firstText.match(/^(#{1,6})(\s+|$)/);
  if (hMatch) return hMatch[0].length;
  if (context === "blockquote") {
    const qMatch = firstText.match(/^(>\s?)/);
    if (qMatch) return qMatch[0].length;
  }
  return 0;
}

/**
 * Expands a target block in Obsidian Live Preview granular style:
 * - Media nodes (`image`, `video`, `audio`): expand into raw `![[...]]` / `![...](...)` paragraph.
 * - Headings / Blockquotes: insert only the block prefix (`## ` / `> `) at the start of the line.
 * - Inline elements (`**bold**`, `*italic*`, `<span ...>`, `` `code` ``, links, etc.): expand ONLY the specific
 *   inline element touched by the cursor, keeping all other formatted elements on the line cleanly rendered!
 */
export function expandBlockInTransaction(
  tr: Transaction,
  target: TargetTextblockResult,
  cursorPosInDoc?: number,
  placeBeforePrefixAtZero: boolean = false
): ActiveLiveBlockInfo {
  const { blockPos, blockNode, context, isTitleH1, taskChecked } = target;
  const schema = tr.doc.type.schema;

  // 1. Media node (image, video, audio): replace leaf media node with temporary paragraph containing raw embed syntax
  if (context === "media" || isExpandableMediaNode(blockNode)) {
    const rawMarkdown = serializeMediaNodeToRawMarkdown(blockNode);
    const paraAttrs = blockNode.attrs?.textAlign ? { textAlign: blockNode.attrs.textAlign } : {};
    const paraNode = schema.nodes.paragraph.create(
      paraAttrs,
      rawMarkdown ? [schema.text(rawMarkdown)] : []
    );
    tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, paraNode);

    const contentStart = blockPos + 1;
    const targetCursor = placeBeforePrefixAtZero
      ? contentStart
      : contentStart + rawMarkdown.length;
    tr.setSelection(TextSelection.create(tr.doc, targetCursor));

    return {
      blockPos,
      originalContext: "media",
      isTitleH1: false,
      hasExpandedPrefix: false,
      initialPrefix: "",
      initialRawText: rawMarkdown,
      originalNode: blockNode,
      activeInline: null,
      dirty: false,
    };
  }

  // 2. Textblock (heading or paragraph): insert ONLY block prefix (`## ` or `> `) if applicable
  const blockPrefix = computeBlockPrefix(tr.doc, blockPos, blockNode);
  const contentStart = blockPos + 1;

  let cursorOffsetInBlock: number | null = null;
  if (typeof cursorPosInDoc === "number") {
    const renderedOffset = Math.max(0, Math.min(cursorPosInDoc - contentStart, blockNode.content.size));
    cursorOffsetInBlock =
      renderedOffset === 0 && placeBeforePrefixAtZero
        ? 0
        : renderedOffset + blockPrefix.length;
  }

  if (blockPrefix.length > 0) {
    // Insert prefix as plain unmarked text at the very start of the block (leaving all inline marks intact!)
    tr.replaceWith(contentStart, contentStart, schema.text(blockPrefix));
  }

  // 3. Expand ONLY the inline formatted element touched by the cursor (if any!)
  let activeInline: ActiveInlineSpan | null = null;
  const updatedBlockNode = tr.doc.nodeAt(blockPos);

  if (updatedBlockNode && cursorOffsetInBlock !== null) {
    const touchedRun = findTouchedInlineRun(
      updatedBlockNode,
      cursorOffsetInBlock,
      cursorOffsetInBlock,
      blockPrefix.length
    );
    if (touchedRun) {
      activeInline = expandInlineRunInTransaction(tr, blockPos, touchedRun, cursorOffsetInBlock);
    } else {
      const clampedCursor = Math.max(
        contentStart,
        Math.min(contentStart + cursorOffsetInBlock, contentStart + updatedBlockNode.content.size)
      );
      tr.setSelection(TextSelection.create(tr.doc, clampedCursor));
    }
  } else if (updatedBlockNode && blockPrefix.length > 0 && cursorOffsetInBlock === null) {
    // Keep selection valid after prefix insertion if no explicit cursor was passed
    const fallbackCursor = contentStart + blockPrefix.length;
    tr.setSelection(TextSelection.create(tr.doc, fallbackCursor));
  }

  return {
    blockPos,
    originalContext: context,
    isTitleH1,
    hasExpandedPrefix: blockPrefix.length > 0,
    initialPrefix: blockPrefix,
    initialRawText: serializeBlockToRawMarkdown(tr.doc, blockPos, blockNode, true).rawMarkdown,
    originalNode: blockNode,
    activeInline,
    originalTaskChecked: taskChecked,
    dirty: false,
  };
}

/**
 * Collapses the currently active expanded block in `tr` back into its rendered ProseMirror node(s).
 */
export function collapseBlockInTransaction(
  tr: Transaction,
  activeBlock: ActiveLiveBlockInfo,
  schema: Schema
): { wasModified: boolean } {
  const { blockPos, originalContext, isTitleH1, initialRawText, originalNode, activeInline } = activeBlock;
  const initialNode = tr.doc.nodeAt(blockPos);
  if (!initialNode || (initialNode.type.name !== "heading" && initialNode.type.name !== "paragraph")) {
    return { wasModified: false };
  }

  // 1. Media block collapse
  if (originalContext === "media" || isExpandableMediaNode(originalNode)) {
    const currentRawText = initialNode.textContent || "";
    const wasModified = currentRawText !== initialRawText;
    if (!wasModified) {
      tr.replaceWith(blockPos, blockPos + initialNode.nodeSize, originalNode);
      return { wasModified: false };
    }
    const parsedMediaNode = parseRawMarkdownToMediaNode(currentRawText, schema, originalNode);
    if (parsedMediaNode) {
      tr.replaceWith(blockPos, blockPos + initialNode.nodeSize, parsedMediaNode);
      return { wasModified: true };
    }
    // User turned media syntax into regular text/heading — fall through below
  }

  // 2. Fast lossless path for unedited textblocks
  if (!activeBlock.dirty && !activeInline?.dirty && originalContext !== "media") {
    const currentFullRaw = serializeBlockToRawMarkdown(tr.doc, blockPos, initialNode, false).rawMarkdown;
    if (currentFullRaw === initialRawText) {
      if (initialNode.eq(originalNode)) {
        return { wasModified: false };
      }

      // Apply surgical in-place restore (inline span first, then block prefix) so ProseMirror
      // position mapping stays accurate for cursor restoration and Undo/Redo snapshots.
      if (activeInline) {
        collapseInlineSpanInTransaction(tr, blockPos, activeInline, schema);
      }
      if (activeBlock.hasExpandedPrefix && activeBlock.initialPrefix.length > 0) {
        const afterInlineNode = tr.doc.nodeAt(blockPos);
        if (afterInlineNode && afterInlineNode.textContent.startsWith(activeBlock.initialPrefix)) {
          tr.delete(blockPos + 1, blockPos + 1 + activeBlock.initialPrefix.length);
        }
      }
      const afterSurgical = tr.doc.nodeAt(blockPos);
      if (afterSurgical) {
        if (
          afterSurgical.type !== originalNode.type ||
          JSON.stringify(afterSurgical.attrs) !== JSON.stringify(originalNode.attrs)
        ) {
          tr.setNodeMarkup(blockPos, originalNode.type, originalNode.attrs);
        }
        const finalCheck = tr.doc.nodeAt(blockPos);
        if (finalCheck && !finalCheck.content.eq(originalNode.content)) {
          tr.replaceWith(blockPos + 1, blockPos + finalCheck.nodeSize - 1, originalNode.content);
        }
      }
      return { wasModified: false };
    }
  }

  // 3. First collapse any currently active inline span in-place
  if (activeInline) {
    collapseInlineSpanInTransaction(tr, blockPos, activeInline, schema);
  }

  const currentNode = tr.doc.nodeAt(blockPos);
  if (!currentNode || (currentNode.type.name !== "heading" && currentNode.type.name !== "paragraph")) {
    return { wasModified: true };
  }

  const currentPlainText = currentNode.textContent || "";

  let hasAnyMarks = false;
  currentNode.forEach((child) => {
    if (child.marks && child.marks.length > 0) {
      hasAnyMarks = true;
    }
  });

  const $inside = tr.doc.resolve(Math.min(blockPos + 1, tr.doc.content.size));
  const depth = $inside.depth;
  const parent = depth >= 2 ? $inside.node(depth - 1) : null;
  const parentPos = depth >= 2 ? $inside.before(depth - 1) : -1;

  const applyCompiledContentPreservingMapping = (stripLeadingChars: number) => {
    if (stripLeadingChars > 0) {
      const beforeStrip = tr.doc.nodeAt(blockPos);
      if (beforeStrip && beforeStrip.content.size >= stripLeadingChars) {
        tr.delete(blockPos + 1, blockPos + 1 + stripLeadingChars);
      }
    }
    const afterStrip = tr.doc.nodeAt(blockPos);
    if (!afterStrip) return;
    const compiled = compileMixedBlockChildren(afterStrip, schema, 0);
    const compiledFragment = Fragment.from(compiled);
    if (!afterStrip.content.eq(compiledFragment)) {
      tr.replaceWith(blockPos + 1, blockPos + afterStrip.nodeSize - 1, compiledFragment);
    }
  };

  // 4. Document Title H1 at pos 0: always keep as H1 and strip any leading # prefix
  if (isTitleH1 && blockPos === 0 && schema.nodes.heading) {
    const leadingHashMatch =
      !currentNode.firstChild?.marks?.length && currentNode.firstChild?.isText
        ? (currentNode.firstChild.text || "").match(/^#{1,6}\s+/)
        : null;
    if (currentNode.type.name !== "heading" || currentNode.attrs?.level !== 1) {
      tr.setNodeMarkup(blockPos, schema.nodes.heading, { ...currentNode.attrs, level: 1 });
    }
    applyCompiledContentPreservingMapping(leadingHashMatch ? leadingHashMatch[0].length : 0);
    return { wasModified: true };
  }

  // 5. Table cells or List items (bulletList, orderedList, taskList):
  // Lists never expose block markers; only compile any remaining raw inline markdown inside plain text children.
  if (
    parent &&
    (parent.type.name === "tableCell" ||
      parent.type.name === "tableHeader" ||
      parent.type.name === "listItem" ||
      parent.type.name === "taskItem")
  ) {
    applyCompiledContentPreservingMapping(0);
    return { wasModified: true };
  }

  // Helper to build a top-level block node when block type itself changes
  const buildTopLevelBlockFromNode = (): PMNode => {
    if (!hasAnyMarks) {
      const mediaNode = parseRawMarkdownToMediaNode(
        currentPlainText,
        schema,
        originalContext === "media" ? originalNode : null
      );
      if (mediaNode) return mediaNode;

      if (/^(?:---+|[*]{3,}|_{3,})\s*$/.test(currentPlainText) && schema.nodes.horizontalRule && blockPos > 0) {
        return schema.nodes.horizontalRule.create();
      }
    }

    const firstUnmarkedText =
      currentNode.firstChild?.isText && (!currentNode.firstChild.marks || currentNode.firstChild.marks.length === 0)
        ? currentNode.firstChild.text || ""
        : "";

    const hMatch = firstUnmarkedText.match(/^(#{1,6})(?:\s+|$)/);
    if (hMatch && schema.nodes.heading) {
      const level = hMatch[1].length;
      const compiledNodes = compileMixedBlockChildren(currentNode, schema, hMatch[0].length);
      return schema.nodes.heading.create(
        { textAlign: currentNode.attrs?.textAlign || "left", level },
        compiledNodes
      );
    }

    if (!hasAnyMarks) {
      const taskMatch = currentPlainText.match(/^[-*+]\s+\[([ xX])\]\s*(.*)$/);
      if (taskMatch && schema.nodes.taskList && schema.nodes.taskItem) {
        const checked = taskMatch[1].toLowerCase() === "x";
        const inlineNodes = parseInlineMarkdownToProseMirrorNodes(taskMatch[2] ?? "", schema);
        return schema.nodes.taskList.create(
          {},
          schema.nodes.taskItem.create({ checked }, schema.nodes.paragraph.create({}, inlineNodes))
        );
      }

      const ulMatch = currentPlainText.match(/^[-*+]\s+(.*)$/);
      if (ulMatch && schema.nodes.bulletList && schema.nodes.listItem) {
        const inlineNodes = parseInlineMarkdownToProseMirrorNodes(ulMatch[1] ?? "", schema);
        return schema.nodes.bulletList.create(
          {},
          schema.nodes.listItem.create({}, schema.nodes.paragraph.create({}, inlineNodes))
        );
      }

      const olMatch = currentPlainText.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch && schema.nodes.orderedList && schema.nodes.listItem) {
        const start = parseInt(olMatch[1], 10) || 1;
        const inlineNodes = parseInlineMarkdownToProseMirrorNodes(olMatch[2] ?? "", schema);
        return schema.nodes.orderedList.create(
          { start },
          schema.nodes.listItem.create({}, schema.nodes.paragraph.create({}, inlineNodes))
        );
      }
    }

    const bqMatch = firstUnmarkedText.match(/^>\s?/);
    if (bqMatch && schema.nodes.blockquote) {
      const compiledNodes = compileMixedBlockChildren(currentNode, schema, bqMatch[0].length);
      return schema.nodes.blockquote.create({}, schema.nodes.paragraph.create({}, compiledNodes));
    }

    const compiledNodes = compileMixedBlockChildren(currentNode, schema, 0);
    const fnDefMatch = currentPlainText.match(/^\[\^([^\]\r\n\s]+)\]:/);
    const fnAttrs = fnDefMatch
      ? { id: `fn-${fnDefMatch[1].trim()}`, "data-footnote-def": fnDefMatch[1].trim() }
      : {};
    return schema.nodes.paragraph.create(
      { textAlign: currentNode.attrs?.textAlign || "left", ...fnAttrs },
      compiledNodes
    );
  };

  // 6. Inside a blockquote
  if (parent && parent.type.name === "blockquote") {
    const firstUnmarkedText =
      currentNode.firstChild?.isText && (!currentNode.firstChild.marks || currentNode.firstChild.marks.length === 0)
        ? currentNode.firstChild.text || ""
        : "";
    const bqMatch = firstUnmarkedText.match(/^>\s?/);
    if (bqMatch) {
      applyCompiledContentPreservingMapping(bqMatch[0].length);
      return { wasModified: true };
    }
    if (parent.childCount === 1 && parentPos >= 0) {
      const replacementBlock = buildTopLevelBlockFromNode();
      tr.replaceWith(parentPos, parentPos + parent.nodeSize, replacementBlock);
      return { wasModified: true };
    }
    applyCompiledContentPreservingMapping(0);
    return { wasModified: true };
  }

  // 7. Top-level attachment / media embed
  if (!hasAnyMarks) {
    const parsedMediaNode = parseRawMarkdownToMediaNode(
      currentPlainText,
      schema,
      originalContext === "media" ? originalNode : null
    );
    if (parsedMediaNode) {
      tr.replaceWith(blockPos, blockPos + currentNode.nodeSize, parsedMediaNode);
      return { wasModified: true };
    }
  }

  // 8. Top-level heading or paragraph
  const firstUnmarkedText =
    currentNode.firstChild?.isText && (!currentNode.firstChild.marks || currentNode.firstChild.marks.length === 0)
      ? currentNode.firstChild.text || ""
      : "";
  const hMatch = firstUnmarkedText.match(/^(#{1,6})(?:\s+|$)/);
  if (hMatch && schema.nodes.heading) {
    const level = hMatch[1].length;
    if (currentNode.type.name !== "heading" || currentNode.attrs?.level !== level) {
      tr.setNodeMarkup(blockPos, schema.nodes.heading, {
        textAlign: currentNode.attrs?.textAlign || "left",
        level,
      });
    }
    applyCompiledContentPreservingMapping(hMatch[0].length);
    return { wasModified: true };
  }

  // Check if top-level block was converted to HR, list, taskList, or blockquote
  const isSpecialBlockSyntax =
    (!hasAnyMarks && /^(?:---+|[*]{3,}|_{3,})\s*$/.test(currentPlainText) && blockPos > 0) ||
    (!hasAnyMarks && /^[-*+]\s+\[([ xX])\]\s*/.test(currentPlainText)) ||
    (!hasAnyMarks && /^[-*+]\s+/.test(currentPlainText)) ||
    (!hasAnyMarks && /^\d+\.\s+/.test(currentPlainText)) ||
    /^>\s?/.test(firstUnmarkedText);

  if (isSpecialBlockSyntax) {
    const newBlock = buildTopLevelBlockFromNode();
    tr.replaceWith(blockPos, blockPos + currentNode.nodeSize, newBlock);
    return { wasModified: true };
  }

  // Otherwise, collapse as a normal paragraph in-place
  const fnDefMatch = currentPlainText.match(/^\[\^([^\]\r\n\s]+)\]:/);
  const targetAttrs = {
    textAlign: currentNode.attrs?.textAlign || "left",
    id: fnDefMatch ? `fn-${fnDefMatch[1].trim()}` : null,
    "data-footnote-def": fnDefMatch ? fnDefMatch[1].trim() : null,
  };
  if (
    currentNode.type.name !== "paragraph" ||
    currentNode.attrs?.id !== targetAttrs.id ||
    currentNode.attrs?.["data-footnote-def"] !== targetAttrs["data-footnote-def"]
  ) {
    tr.setNodeMarkup(blockPos, schema.nodes.paragraph, targetAttrs);
  }
  applyCompiledContentPreservingMapping(0);
  return { wasModified: true };
}

/**
 * Helper to walk a lowlight HAST tree and push inline syntax decorations.
 */
function addLowlightAstDecorations(
  nodes: any[],
  currentPos: number,
  decorations: Decoration[],
  parentClasses: string[] = []
): { endPos: number; addedCount: number } {
  let pos = currentPos;
  let addedCount = 0;
  for (const node of nodes) {
    if (node.type === "text") {
      const val = node.value || "";
      const len = val.length;
      if (len > 0 && parentClasses.length > 0) {
        decorations.push(
          Decoration.inline(pos, pos + len, {
            class: parentClasses.join(" "),
          })
        );
        addedCount++;
      }
      pos += len;
    } else if (node.type === "element") {
      const nodeClasses = Array.isArray(node.properties?.className)
        ? node.properties.className
        : [];
      const merged = [...parentClasses, ...nodeClasses];
      const sub = addLowlightAstDecorations(node.children || [], pos, decorations, merged);
      pos = sub.endPos;
      addedCount += sub.addedCount;
    }
  }
  return { endPos: pos, addedCount };
}

/**
 * Applies Live Preview syntax decorations to a single unmarked plain-text segment starting at `segStartPos`.
 */
function decorateUnmarkedSegment(
  text: string,
  segStartPos: number,
  isBlockStart: boolean,
  isListContext: boolean,
  decorations: Decoration[]
): void {
  if (!text) return;

  const addDeco = (fromOffset: number, toOffset: number, className: string, style?: string) => {
    if (toOffset > fromOffset && fromOffset >= 0 && toOffset <= text.length) {
      const attrs: Record<string, string> = { class: className };
      if (style) attrs.style = style;
      decorations.push(Decoration.inline(segStartPos + fromOffset, segStartPos + toOffset, attrs));
    }
  };

  // 1. Block prefix syntax marker decoration (Obsidian muted gray; lists keep visual markers)
  if (isBlockStart && !isListContext) {
    const headingPrefixMatch = text.match(/^(#{1,6})(\s+|$)/);
    if (headingPrefixMatch) {
      addDeco(0, headingPrefixMatch[0].length, "luno-live-syntax-marker");
    } else {
      const quotePrefixMatch = text.match(/^(>\s?)/);
      if (quotePrefixMatch) {
        addDeco(0, quotePrefixMatch[0].length, "luno-live-syntax-marker");
      }
    }
  }

  // 2. Inline code (`code`): muted gray backticks, HTML Editor / lowlight syntax colors on code content
  const codeRanges: Array<{ start: number; end: number }> = [];
  const syntaxProtectedRanges: Array<{ start: number; end: number }> = [];
  const codeRegex = /(`+)([^`]+?)\1/g;
  let match: RegExpExecArray | null;
  while ((match = codeRegex.exec(text)) !== null) {
    const fullStart = match.index;
    const fullEnd = fullStart + match[0].length;
    const delimLen = match[1].length;
    const codeContent = match[2];
    const codeStart = fullStart + delimLen;
    const codeEnd = fullEnd - delimLen;
    codeRanges.push({ start: fullStart, end: fullEnd });
    syntaxProtectedRanges.push({ start: fullStart, end: fullEnd });

    addDeco(fullStart, codeStart, "luno-live-syntax-marker");
    addDeco(codeStart, codeEnd, "luno-live-inline-code");

    let addedTokens = 0;
    const trimmedCode = codeContent.trim();
    if (trimmedCode.length > 0) {
      try {
        const isHtmlLike = trimmedCode.startsWith("<") && trimmedCode.endsWith(">");
        const tree =
          isHtmlLike && lowlight.registered("xml")
            ? lowlight.highlight("xml", codeContent)
            : lowlight.highlightAuto(codeContent);
        if (tree?.children?.length) {
          const res = addLowlightAstDecorations(tree.children, segStartPos + codeStart, decorations, []);
          addedTokens = res.addedCount;
        }
      } catch {
        // Fallback below
      }
    }
    if (addedTokens === 0) {
      addDeco(codeStart, codeEnd, "luno-live-hl-tag");
    }

    addDeco(codeEnd, fullEnd, "luno-live-syntax-marker");
  }

  const isInCode = (start: number, end: number) =>
    codeRanges.some((r) => start < r.end && end > r.start);

  const isInProtectedSyntax = (start: number, end: number) =>
    syntaxProtectedRanges.some((r) => start < r.end && end > r.start);

  // 2b. HTML comments (<!-- ... -->)
  const htmlCommentRegex = /<!--[\s\S]*?-->/g;
  while ((match = htmlCommentRegex.exec(text)) !== null) {
    const s = match.index;
    const e = s + match[0].length;
    if (isInCode(s, e)) continue;
    syntaxProtectedRanges.push({ start: s, end: e });
    addDeco(s, e, "luno-live-hl-comment");
  }

  // 3. HTML tags (<span style="...">, </span>, <u>, </u>, <sup>, <sub>, <kbd>, <mark>, <img ... />, <video ...>, <audio ...>)
  // Highlighted with exact HtmlCodeEditor token colors (--hl-punct, --hl-tag, --hl-attr, --hl-string, --hl-number)
  const htmlTagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)(\s+[^<>]*?)?\s*(\/?)>/g;
  while ((match = htmlTagRegex.exec(text)) !== null) {
    const tagStart = match.index;
    const tagEnd = tagStart + match[0].length;
    if (isInProtectedSyntax(tagStart, tagEnd)) continue;
    syntaxProtectedRanges.push({ start: tagStart, end: tagEnd });

    const openBracketLen = 1 + (match[1] ? match[1].length : 0);
    const tagName = match[2];
    const tagNameStart = tagStart + openBracketLen;
    const tagNameEnd = tagNameStart + tagName.length;
    const closeBracketLen = 1 + (match[4] ? match[4].length : 0);
    const closeBracketStart = tagEnd - closeBracketLen;

    addDeco(tagStart, tagNameStart, "luno-live-hl-punct");
    addDeco(tagNameStart, tagNameEnd, "luno-live-hl-tag");

    const attrsPart = match[3] || "";
    if (attrsPart) {
      const attrsOffset = tagNameEnd;
      const attrRegex = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)\s*(?:(=)\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(attrsPart)) !== null) {
        const aStart = attrsOffset + attrMatch.index;
        const aNameLen = attrMatch[1].length;
        addDeco(aStart, aStart + aNameLen, "luno-live-hl-attr");

        if (attrMatch[2] && attrMatch[3] !== undefined) {
          const eqIdx = attrMatch[0].indexOf("=", aNameLen);
          if (eqIdx >= 0) {
            addDeco(aStart + eqIdx, aStart + eqIdx + 1, "luno-live-hl-punct");
            const valOffsetInMatch = attrMatch[0].indexOf(attrMatch[3], eqIdx + 1);
            if (valOffsetInMatch >= 0) {
              const valStart = aStart + valOffsetInMatch;
              const valEnd = valStart + attrMatch[3].length;
              const rawVal = attrMatch[3].replace(/^["']|["']$/g, "");
              const isNumericVal = /^\d+$/.test(rawVal);
              addDeco(
                valStart,
                valEnd,
                isNumericVal ? "luno-live-hl-number" : "luno-live-hl-string"
              );
            }
          }
        }
      }
    }

    addDeco(closeBracketStart, tagEnd, "luno-live-hl-punct");
  }

  // 4. Attachment Wikilink Embeds: ![[target]] or ![[target|400]] or ![[target|alt|400]] (Obsidian muted gray syntax)
  const wikiEmbedRegex = /!\[\[([^\]|\r\n]+)((?:\|[^\]\r\n]*)*)\]\]/g;
  while ((match = wikiEmbedRegex.exec(text)) !== null) {
    const s = match.index;
    const e = s + match[0].length;
    if (isInProtectedSyntax(s, e)) continue;
    syntaxProtectedRanges.push({ start: s, end: e });

    const target = match[1];
    const targetStart = s + 3;
    const targetEnd = targetStart + target.length;

    addDeco(s, targetStart, "luno-live-syntax-marker");
    addDeco(targetStart, targetEnd, "text-primary underline underline-offset-4");

    const pipesPart = match[2] || "";
    if (pipesPart) {
      addDeco(targetEnd, e - 2, "luno-live-syntax-marker");
    }

    addDeco(e - 2, e, "luno-live-syntax-marker");
  }

  // 5. Attachment Standard Markdown Embeds: ![alt|400](url "title") (Obsidian muted gray syntax)
  const mdEmbedRegex = /!\[([^\]\r\n]*)\]\(([^)\r\n]+)\)/g;
  while ((match = mdEmbedRegex.exec(text)) !== null) {
    const s = match.index;
    const e = s + match[0].length;
    if (isInProtectedSyntax(s, e)) continue;
    syntaxProtectedRanges.push({ start: s, end: e });

    const altPart = match[1];
    const altStart = s + 2;
    const altEnd = altStart + altPart.length;

    addDeco(s, altStart, "luno-live-syntax-marker");

    if (altPart) {
      const pipeIdx = altPart.lastIndexOf("|");
      if (pipeIdx >= 0 && /^\d+(?:x\d+)?$/.test(altPart.slice(pipeIdx + 1).trim())) {
        if (pipeIdx > 0) {
          addDeco(altStart, altStart + pipeIdx, "text-primary");
        }
        addDeco(altStart + pipeIdx, altEnd, "luno-live-syntax-marker");
      } else {
        addDeco(altStart, altEnd, "text-primary");
      }
    }

    addDeco(altEnd, e, "luno-live-syntax-marker");
  }

  // 6. Wikilinks: [[Target]] or [[Target|Alias]] (Obsidian muted gray brackets)
  const wikiRegex = /(?<!\!)\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g;
  while ((match = wikiRegex.exec(text)) !== null) {
    const s = match.index;
    const e = s + match[0].length;
    if (isInProtectedSyntax(s, e)) continue;
    syntaxProtectedRanges.push({ start: s, end: e });

    const target = match[1];
    const alias = match[2];
    const targetStart = s + 2;
    const targetEnd = targetStart + target.length;

    addDeco(s, targetStart, "luno-live-syntax-marker");
    addDeco(targetStart, targetEnd, "text-primary underline underline-offset-4");

    if (alias !== undefined) {
      addDeco(targetEnd, targetEnd + 1, "luno-live-syntax-marker");
      addDeco(targetEnd + 1, e - 2, "text-primary underline underline-offset-4");
    }

    addDeco(e - 2, e, "luno-live-syntax-marker");
  }

  // 7. Standard links: [label](url) (Obsidian muted gray brackets and URL)
  const mdLinkRegex = /(?<!\!)\[([^\]]+)\]\(([^)\s]+)\)/g;
  while ((match = mdLinkRegex.exec(text)) !== null) {
    const s = match.index;
    const e = s + match[0].length;
    if (isInProtectedSyntax(s, e)) continue;
    const labelLen = match[1].length;
    const labelStart = s + 1;
    const labelEnd = labelStart + labelLen;
    syntaxProtectedRanges.push({ start: labelEnd, end: e });

    addDeco(s, labelStart, "luno-live-syntax-marker");
    addDeco(labelStart, labelEnd, "text-primary underline underline-offset-4");
    addDeco(labelEnd, e, "luno-live-syntax-marker");
  }

  // 8. Footnotes: [^1] or [^1]: (Obsidian muted gray brackets)
  const fnRegex = /\[\^([^\]\r\n\s]+)\](:?)/g;
  while ((match = fnRegex.exec(text)) !== null) {
    const s = match.index;
    const e = s + match[0].length;
    if (isInProtectedSyntax(s, e)) continue;
    syntaxProtectedRanges.push({ start: s, end: e });
    const idLen = match[1].length;
    addDeco(s, s + 2, "luno-live-syntax-marker");
    addDeco(s + 2, s + 2 + idLen, "text-primary font-medium");
    addDeco(s + 2 + idLen, e, "luno-live-syntax-marker");
  }

  // 9. Symmetric Markdown Delimiters (**bold**, *italic*, ~~strike~~, ==highlight==) -> Obsidian muted gray
  const addDelimitedDecos = (regex: RegExp, delimLen: number, innerClass: string) => {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const s = m.index;
      const e = s + m[0].length;
      if (isInProtectedSyntax(s, e)) continue;
      addDeco(s, s + delimLen, "luno-live-syntax-marker");
      addDeco(s + delimLen, e - delimLen, innerClass);
      addDeco(e - delimLen, e, "luno-live-syntax-marker");
    }
  };

  addDelimitedDecos(/(\*\*\*|___)(?=\S)(.+?)(?<=\S)\1/g, 3, "font-bold italic");
  addDelimitedDecos(/(?<![*_])(\*\*|__)(?=\S)(.+?)(?<=\S)\1(?![*_])/g, 2, "font-bold");
  addDelimitedDecos(/(?<![*_A-Za-z0-9])(\*|_)(?=\S)(.+?)(?<=\S)\1(?![*_A-Za-z0-9])/g, 1, "italic");
  addDelimitedDecos(/~~(?=\S)(.+?)(?<=\S)~~/g, 2, "line-through opacity-80");
  addDelimitedDecos(/==(?=\S)(.+?)(?<=\S)==/g, 2, "luno-highlight");
}

/**
 * Builds visual decorations ONLY for unmarked plain-text segments of the active Live Preview block
 * (block prefix, active inline element, newly typed raw syntax, or media embed line), leaving all
 * other rendered inline marks on the same line completely untouched!
 */
export function buildLivePreviewDecorations(
  doc: PMNode,
  activeBlock: ActiveLiveBlockInfo | null
): DecorationSet {
  if (!activeBlock) return DecorationSet.empty;

  const blockNode = doc.nodeAt(activeBlock.blockPos);
  if (!blockNode || (blockNode.type.name !== "heading" && blockNode.type.name !== "paragraph")) {
    return DecorationSet.empty;
  }

  const decorations: Decoration[] = [];
  const blockPos = activeBlock.blockPos;
  const contentStart = blockPos + 1;

  decorations.push(
    Decoration.node(blockPos, blockPos + blockNode.nodeSize, {
      class:
        activeBlock.originalContext === "media"
          ? "luno-live-active-line luno-live-active-media-line"
          : "luno-live-active-line",
      "data-live-raw": "true",
    })
  );

  const isListContext =
    activeBlock.originalContext === "bulletList" ||
    activeBlock.originalContext === "orderedList" ||
    activeBlock.originalContext === "taskList";

  // Walk child text nodes and decorate ONLY unmarked plain-text segments so untouched rendered elements on the line are never disrupted
  blockNode.forEach((child, childOffset) => {
    if (!child.isText || (child.marks && child.marks.length > 0)) return;
    const text = child.text || "";
    if (!text) return;
    decorateUnmarkedSegment(
      text,
      contentStart + childOffset,
      childOffset === 0,
      isListContext,
      decorations
    );
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Walks a transaction and its `appendedTransaction` parent chain (matching prosemirror-history semantics).
 */
function hasTransactionOrAncestorMeta(
  tr: Transaction,
  predicate: (t: Transaction) => boolean
): boolean {
  let curr: Transaction | undefined = tr;
  let guard = 0;
  while (curr && guard < 16) {
    if (predicate(curr)) return true;
    curr = curr.getMeta("appendedTransaction") as Transaction | undefined;
    guard++;
  }
  return false;
}

function getRootAppendedTransaction(tr: Transaction): Transaction {
  let curr: Transaction = tr;
  let guard = 0;
  while (guard < 16) {
    const parent = curr.getMeta("appendedTransaction") as Transaction | undefined;
    if (!parent) break;
    curr = parent;
    guard++;
  }
  return curr;
}

/**
 * Finds the top-level block position containing `pos` in `doc`.
 */
function findTopLevelBlockPos(doc: PMNode, pos: number): number {
  if (doc.content.size === 0) return 0;
  const clamped = Math.max(0, Math.min(pos, doc.content.size));
  try {
    const $pos = doc.resolve(clamped);
    return $pos.depth >= 1 ? $pos.before(1) : clamped;
  } catch {
    return 0;
  }
}

/**
 * Captures a clean (canonical collapsed) document snapshot from `state`, preserving the
 * active Live Preview block position and cursor offset so Undo/Redo restores both
 * clean document state and exact Live Preview editing position.
 */
export function captureCanonicalSnapshot(
  state: EditorState,
  activeBlock: ActiveLiveBlockInfo | null,
  hasTitleH1: boolean = false
): LivePreviewHistoryEntry {
  const timestamp = Date.now();
  if (!activeBlock) {
    return {
      doc: state.doc,
      selectionFrom: state.selection.from,
      selectionTo: state.selection.to,
      expandedBlockPos: null,
      rawCursorOffset: null,
      timestamp,
    };
  }

  const currentNode = state.doc.nodeAt(activeBlock.blockPos);
  const rawCursorOffset = currentNode
    ? Math.max(0, Math.min(state.selection.from - (activeBlock.blockPos + 1), currentNode.content.size))
    : 0;

  try {
    const tempTr = EditorState.create({ doc: state.doc, selection: state.selection }).tr;
    collapseBlockInTransaction(tempTr, activeBlock, state.schema);
    const cleanDoc = tempTr.doc;
    const mappedFrom = Math.max(0, Math.min(tempTr.mapping.map(state.selection.from), cleanDoc.content.size));
    const mappedTo = Math.max(0, Math.min(tempTr.mapping.map(state.selection.to), cleanDoc.content.size));

    let expandedBlockPos: number | null = null;
    const mappedBlockPos = Math.max(
      0,
      Math.min(tempTr.mapping.map(activeBlock.blockPos, -1), cleanDoc.content.size)
    );
    const nodeAtMapped = cleanDoc.nodeAt(mappedBlockPos);
    if (isExpandableMediaNode(nodeAtMapped)) {
      expandedBlockPos = mappedBlockPos;
    } else {
      const found = findTargetTextblock(cleanDoc, mappedFrom, hasTitleH1);
      if (found) {
        expandedBlockPos = found.blockPos;
      }
    }

    return {
      doc: cleanDoc,
      selectionFrom: mappedFrom,
      selectionTo: mappedTo,
      expandedBlockPos,
      rawCursorOffset,
      timestamp,
    };
  } catch {
    return {
      doc: state.doc,
      selectionFrom: state.selection.from,
      selectionTo: state.selection.to,
      expandedBlockPos: activeBlock.blockPos,
      rawCursorOffset,
      timestamp,
    };
  }
}

function applyHistorySnapshot(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  target: LivePreviewHistoryEntry,
  nextUndoStack: LivePreviewHistoryEntry[],
  nextRedoStack: LivePreviewHistoryEntry[],
  historyOp: "undo" | "redo",
  options?: { isEnabled?: boolean; hasTitleH1?: boolean }
): void {
  const tr = state.tr;
  tr.replaceWith(0, tr.doc.content.size, target.doc.content);

  let nextActive: ActiveLiveBlockInfo | null = null;
  const enabled = Boolean(options?.isEnabled);
  const hasTitleH1 = Boolean(options?.hasTitleH1);

  if (enabled) {
    if (
      target.expandedBlockPos !== null &&
      target.expandedBlockPos >= 0 &&
      target.expandedBlockPos <= tr.doc.content.size
    ) {
      const nodeAtPos = tr.doc.nodeAt(target.expandedBlockPos);
      const isMedia = isExpandableMediaNode(nodeAtPos);
      const lookupPos = isMedia
        ? target.expandedBlockPos
        : Math.min(target.expandedBlockPos + 1, tr.doc.content.size);
      const freshTarget = findTargetTextblock(tr.doc, lookupPos, hasTitleH1);
      if (freshTarget) {
        if (isMedia) {
          nextActive = expandBlockInTransaction(tr, freshTarget);
          const expandedNode = tr.doc.nodeAt(nextActive.blockPos);
          const contentStart = nextActive.blockPos + 1;
          const maxOff = expandedNode ? expandedNode.content.size : 0;
          const rawOff =
            target.rawCursorOffset !== null
              ? Math.max(0, Math.min(target.rawCursorOffset, maxOff))
              : maxOff;
          tr.setSelection(TextSelection.create(tr.doc, contentStart + rawOff));
        } else {
          const safeCleanPos = Math.max(
            freshTarget.blockPos + 1,
            Math.min(target.selectionFrom, freshTarget.blockPos + freshTarget.blockNode.nodeSize - 1)
          );
          nextActive = expandBlockInTransaction(tr, freshTarget, safeCleanPos);
        }
      }
    } else if (target.selectionFrom === target.selectionTo) {
      const safePos = Math.max(0, Math.min(target.selectionFrom, tr.doc.content.size));
      const freshTarget = findTargetTextblock(tr.doc, safePos, hasTitleH1);
      if (freshTarget) {
        nextActive = expandBlockInTransaction(tr, freshTarget, safePos);
      }
    }
  }

  if (!nextActive) {
    const safeFrom = Math.max(0, Math.min(target.selectionFrom, tr.doc.content.size));
    const safeTo = Math.max(0, Math.min(target.selectionTo, tr.doc.content.size));
    if (
      target.expandedBlockPos !== null &&
      target.expandedBlockPos >= 0 &&
      target.expandedBlockPos < tr.doc.content.size &&
      isExpandableMediaNode(tr.doc.nodeAt(target.expandedBlockPos))
    ) {
      tr.setSelection(NodeSelection.create(tr.doc, target.expandedBlockPos));
    } else {
      try {
        tr.setSelection(TextSelection.create(tr.doc, safeFrom, safeTo));
      } catch {
        tr.setSelection(TextSelection.near(tr.doc.resolve(safeFrom)));
      }
    }
  }

  tr.setMeta(livePreviewPluginKey, {
    historyOp,
    activeBlock: nextActive,
    undoStack: nextUndoStack,
    redoStack: nextRedoStack,
    liveHistoryActive: true,
  });
  tr.setMeta("isLivePreviewHistory", true);
  tr.setMeta("isLivePreviewCommit", true);
  tr.setMeta("addToHistory", false);
  dispatch(tr.scrollIntoView());
}

/**
 * Live-Preview-aware Undo command.
 * Delegates to native `prosemirror-history` when Live Preview is disabled and has not been active,
 * otherwise restores canonical snapshots cleanly across expanded/collapsed headings, inline elements, and media attachments.
 */
export function livePreviewUndo(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  options?: { isEnabled?: boolean; hasTitleH1?: boolean }
): boolean {
  const pluginState = livePreviewPluginKey.getState(state);
  const useLiveHistory = Boolean(pluginState && (options?.isEnabled || pluginState.liveHistoryActive));

  if (!useLiveHistory) {
    return pmUndo(state, dispatch);
  }

  if (!pluginState || pluginState.undoStack.length === 0) {
    return false;
  }

  if (!dispatch) {
    return true;
  }

  const currentSnapshot = captureCanonicalSnapshot(
    state,
    pluginState.activeBlock,
    Boolean(options?.hasTitleH1)
  );
  const nextUndoStack = pluginState.undoStack.slice();
  let target = nextUndoStack.pop()!;
  while (nextUndoStack.length > 0 && target.doc.eq(currentSnapshot.doc)) {
    target = nextUndoStack.pop()!;
  }

  const nextRedoStack = [...pluginState.redoStack, currentSnapshot].slice(-MAX_LIVE_HISTORY_DEPTH);
  applyHistorySnapshot(state, dispatch, target, nextUndoStack, nextRedoStack, "undo", options);
  return true;
}

/**
 * Live-Preview-aware Redo command.
 */
export function livePreviewRedo(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  options?: { isEnabled?: boolean; hasTitleH1?: boolean }
): boolean {
  const pluginState = livePreviewPluginKey.getState(state);
  const useLiveHistory = Boolean(pluginState && (options?.isEnabled || pluginState.liveHistoryActive));

  if (!useLiveHistory) {
    return pmRedo(state, dispatch);
  }

  if (!pluginState || pluginState.redoStack.length === 0) {
    return false;
  }

  if (!dispatch) {
    return true;
  }

  const currentSnapshot = captureCanonicalSnapshot(
    state,
    pluginState.activeBlock,
    Boolean(options?.hasTitleH1)
  );
  const nextRedoStack = pluginState.redoStack.slice();
  let target = nextRedoStack.pop()!;
  while (nextRedoStack.length > 0 && target.doc.eq(currentSnapshot.doc)) {
    target = nextRedoStack.pop()!;
  }

  const nextUndoStack = [...pluginState.undoStack, currentSnapshot].slice(-MAX_LIVE_HISTORY_DEPTH);
  applyHistorySnapshot(state, dispatch, target, nextUndoStack, nextRedoStack, "redo", options);
  return true;
}

export function livePreviewUndoDepth(state: EditorState): number {
  return livePreviewPluginKey.getState(state)?.undoStack.length ?? 0;
}

export function livePreviewRedoDepth(state: EditorState): number {
  return livePreviewPluginKey.getState(state)?.redoStack.length ?? 0;
}

/**
 * Returns serialized HTML for the editor document with any active Live Preview block
 * cleanly collapsed in an offscreen clone, so background auto-save or export never writes
 * duplicate markdown markers (like `## ## Heading 2`) while preserving the user's live cursor.
 */
export function getCleanCollapsedHtml(instance: TiptapEditor): string {
  const pluginState = livePreviewPluginKey.getState(instance.state);
  if (!pluginState?.activeBlock) {
    return instance.getHTML();
  }
  try {
    const tempTr = EditorState.create({ doc: instance.state.doc, selection: instance.state.selection }).tr;
    collapseBlockInTransaction(tempTr, pluginState.activeBlock, instance.schema);
    const serializer = DOMSerializer.fromSchema(instance.schema);
    const domFragment = serializer.serializeFragment(tempTr.doc.content);
    const container = document.createElement("div");
    container.appendChild(domFragment);
    return container.innerHTML;
  } catch {
    return instance.getHTML();
  }
}

/**
 * Maps an `ActiveInlineSpan` across a document-changing transaction, using smart boundary bias:
 * - Typing normal text/space right before `fromOffset` or right after `toOffset` stays OUTSIDE the span
 *   (so typing Space after `**bold**|` automatically leaves and compiles `**bold**`).
 * - Typing Markdown/HTML syntax delimiters (`*`, `_`, `~`, `=`, `` ` ``, `[`, `]`, `(`, `)`, `<`, `>`, `!`, `|`)
 *   at the boundary extends the span so `**bold**` -> `***bold***` stays editable inside the span.
 */
function mapActiveInlineAcrossTr(
  tr: Transaction,
  oldBlockPos: number,
  newBlockPos: number,
  newBlockNode: PMNode,
  prevInline: ActiveInlineSpan,
  isUserEdit: boolean
): ActiveInlineSpan | null {
  const oldAbsStart = oldBlockPos + 1 + prevInline.fromOffset;
  const oldAbsEnd = oldBlockPos + 1 + prevInline.toOffset;

  let startAssoc: 1 | -1 = 1;
  let endAssoc: 1 | -1 = -1;
  let editTouchedSpan = false;

  const syntaxCharsRegex = /^[*_~=`[\]()<>!|]+$/;

  for (let i = 0; i < tr.steps.length; i++) {
    const step = tr.steps[i] as any;
    const stepFrom: number | undefined = typeof step.from === "number" ? step.from : undefined;
    const stepTo: number | undefined = typeof step.to === "number" ? step.to : undefined;
    const insertedText: string =
      step.slice && step.slice.content ? step.slice.content.textBetween(0, step.slice.content.size) : "";

    if (stepFrom !== undefined && stepTo !== undefined) {
      if (stepFrom < oldAbsEnd && stepTo > oldAbsStart) {
        editTouchedSpan = true;
      } else if (stepFrom === oldAbsStart && stepTo === oldAbsStart) {
        if (insertedText && syntaxCharsRegex.test(insertedText)) {
          startAssoc = -1;
          editTouchedSpan = true;
        }
      } else if (stepFrom === oldAbsEnd && stepTo === oldAbsEnd) {
        if (insertedText && syntaxCharsRegex.test(insertedText)) {
          endAssoc = 1;
          editTouchedSpan = true;
        }
      }
    }
  }

  const newAbsStart = tr.mapping.map(oldAbsStart, startAssoc);
  const newAbsEnd = tr.mapping.map(oldAbsEnd, endAssoc);
  const newFromOff = Math.max(0, newAbsStart - (newBlockPos + 1));
  const newToOff = Math.min(newBlockNode.content.size, newAbsEnd - (newBlockPos + 1));

  if (newToOff <= newFromOff) {
    return null;
  }

  return {
    ...prevInline,
    fromOffset: newFromOff,
    toOffset: newToOff,
    dirty: prevInline.dirty || (isUserEdit && editTouchedSpan),
  };
}

export const LivePreview = Extension.create<LivePreviewOptions>({
  name: "livePreview",
  priority: 1000,

  addOptions() {
    return {
      enabled: false,
      hasTitleH1: false,
      isSlashMenuOpen: () => false,
    };
  },

  addExtensions() {
    const parentExtension = this;
    const isEnabled = (): boolean =>
      typeof parentExtension.options.enabled === "function"
        ? Boolean(parentExtension.options.enabled())
        : Boolean(parentExtension.options.enabled);
    const hasTitleH1 = (): boolean =>
      typeof parentExtension.options.hasTitleH1 === "function"
        ? Boolean(parentExtension.options.hasTitleH1())
        : Boolean(parentExtension.options.hasTitleH1);

    // Lower priority (50 < 100) so TipTap command merging overrides StarterKit's UndoRedo commands
    // for editor.commands.undo(), editor.commands.redo(), editor.can().undo(), editor.can().redo(),
    // toolbar Undo/Redo buttons, and Mod-z / Shift-Mod-z / Mod-y shortcuts.
    return [
      Extension.create({
        name: "livePreviewUndoRedo",
        priority: 50,
        addCommands() {
          return {
            undo:
              () =>
              ({ state, dispatch }) =>
                livePreviewUndo(state, dispatch, {
                  isEnabled: isEnabled(),
                  hasTitleH1: hasTitleH1(),
                }),
            redo:
              () =>
              ({ state, dispatch }) =>
                livePreviewRedo(state, dispatch, {
                  isEnabled: isEnabled(),
                  hasTitleH1: hasTitleH1(),
                }),
          };
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    const extension = this;

    const isEnabled = (): boolean => {
      return typeof extension.options.enabled === "function"
        ? Boolean(extension.options.enabled())
        : Boolean(extension.options.enabled);
    };

    const hasTitleH1 = (): boolean => {
      if (extension.options.hasTitleH1 === undefined) return false;
      return typeof extension.options.hasTitleH1 === "function"
        ? Boolean(extension.options.hasTitleH1())
        : Boolean(extension.options.hasTitleH1);
    };

    const isSlashMenuOpen = (): boolean => {
      return typeof extension.options.isSlashMenuOpen === "function"
        ? Boolean(extension.options.isSlashMenuOpen())
        : false;
    };

    return [
      new Plugin<LivePreviewPluginState>({
        key: livePreviewPluginKey,

        state: {
          init(): LivePreviewPluginState {
            return {
              activeBlock: null,
              decorations: DecorationSet.empty,
              undoStack: [],
              redoStack: [],
              lastEditTime: 0,
              lastEditBlockPos: null,
              liveHistoryActive: false,
            };
          },

          apply(tr, prevState, oldEditorState, newEditorState): LivePreviewPluginState {
            const meta = tr.getMeta(livePreviewPluginKey);
            if (meta?.historyOp) {
              const nextActive: ActiveLiveBlockInfo | null = meta.activeBlock ?? null;
              return {
                activeBlock: nextActive,
                decorations: buildLivePreviewDecorations(tr.doc, nextActive),
                undoStack: meta.undoStack ?? prevState.undoStack,
                redoStack: meta.redoStack ?? prevState.redoStack,
                lastEditTime: 0,
                lastEditBlockPos: null,
                liveHistoryActive: Boolean(meta.liveHistoryActive ?? true),
              };
            }

            let undoStack = prevState.undoStack;
            let redoStack = prevState.redoStack;
            let lastEditTime = prevState.lastEditTime;
            let lastEditBlockPos = prevState.lastEditBlockPos;
            let liveHistoryActive = prevState.liveHistoryActive;

            if (isHistoryTransaction(tr)) {
              const histMeta = tr.getMeta("history$") as { redo?: boolean } | undefined;
              const isRedoOp = Boolean(histMeta?.redo);
              const snap = captureCanonicalSnapshot(oldEditorState, prevState.activeBlock, hasTitleH1());
              if (isRedoOp) {
                if (redoStack.length > 0) {
                  redoStack = redoStack.slice(0, -1);
                }
                undoStack = [...undoStack, snap].slice(-MAX_LIVE_HISTORY_DEPTH);
              } else {
                if (undoStack.length > 0) {
                  undoStack = undoStack.slice(0, -1);
                }
                redoStack = [...redoStack, snap].slice(-MAX_LIVE_HISTORY_DEPTH);
              }
              lastEditTime = 0;
              lastEditBlockPos = null;
            } else if (tr.docChanged) {
              const isToggle = hasTransactionOrAncestorMeta(tr, (t) =>
                Boolean(t.getMeta("isLivePreviewToggle"))
              );
              const isHistoryReplay = hasTransactionOrAncestorMeta(tr, (t) =>
                Boolean(t.getMeta("isLivePreviewHistory"))
              );
              const isUserEditMeta = Boolean(tr.getMeta("isLivePreviewUserEdit"));
              const isSync = hasTransactionOrAncestorMeta(tr, (t) => Boolean(t.getMeta("isSync")));
              const addToHistory = !hasTransactionOrAncestorMeta(
                tr,
                (t) => t.getMeta("addToHistory") === false
              );
              const rootTr = getRootAppendedTransaction(tr);
              const isAppendedToSelectionOnly = rootTr !== tr && !rootTr.docChanged;

              if (
                isUserEditMeta ||
                (!isToggle && !isHistoryReplay && !isSync && !isAppendedToSelectionOnly && addToHistory)
              ) {
                liveHistoryActive = liveHistoryActive || isEnabled() || Boolean(prevState.activeBlock);
                const oldBlockPos = prevState.activeBlock
                  ? prevState.activeBlock.blockPos
                  : findTopLevelBlockPos(oldEditorState.doc, oldEditorState.selection.from);
                const newTopPos = findTopLevelBlockPos(newEditorState.doc, newEditorState.selection.from);
                const oldTopNode = oldEditorState.doc.nodeAt(
                  findTopLevelBlockPos(oldEditorState.doc, oldEditorState.selection.from)
                );
                const newTopNode = newEditorState.doc.nodeAt(newTopPos);
                const structureChanged = Boolean(
                  oldTopNode && newTopNode && oldTopNode.type !== newTopNode.type
                );
                const now = typeof tr.time === "number" && tr.time > 0 ? tr.time : Date.now();
                const uiEvent = tr.getMeta("uiEvent");
                const isShortcut = Boolean(tr.getMeta("isLivePreviewShortcut"));
                const isAppended = Boolean(tr.getMeta("appendedTransaction"));
                const forceNewGroup =
                  undoStack.length === 0 ||
                  (!isAppended &&
                    (lastEditTime === 0 ||
                      isUserEditMeta ||
                      isShortcut ||
                      Boolean(tr.getMeta("closeHistory$")) ||
                      uiEvent === "paste" ||
                      uiEvent === "cut" ||
                      uiEvent === "drop" ||
                      structureChanged ||
                      now - lastEditTime > LIVE_HISTORY_GROUP_DELAY_MS ||
                      lastEditBlockPos !== oldBlockPos));

                if (forceNewGroup) {
                  const snap = captureCanonicalSnapshot(oldEditorState, prevState.activeBlock, hasTitleH1());
                  undoStack = [...undoStack, snap].slice(-MAX_LIVE_HISTORY_DEPTH);
                }
                redoStack = [];
                lastEditTime = isUserEditMeta || isShortcut ? 0 : now;
                lastEditBlockPos = isUserEditMeta ? null : tr.mapping.map(oldBlockPos, -1);
              } else if (isToggle && meta && "activeBlock" in meta) {
                const isInlineOnlySwap = Boolean(meta.inlineSwap);
                if (!isInlineOnlySwap) {
                  lastEditTime = 0;
                  lastEditBlockPos = null;
                }
                if (
                  (isEnabled() || Boolean(meta.activeBlock) || Boolean(prevState.activeBlock)) &&
                  (undoStack.length > 0 || redoStack.length > 0)
                ) {
                  liveHistoryActive = true;
                }
              }
            } else if (tr.selectionSet || tr.getMeta("closeHistory$")) {
              lastEditTime = 0;
              lastEditBlockPos = null;
            }

            if (meta && "activeBlock" in meta) {
              const nextActive: ActiveLiveBlockInfo | null = meta.activeBlock;
              return {
                activeBlock: nextActive,
                decorations: buildLivePreviewDecorations(tr.doc, nextActive),
                undoStack,
                redoStack,
                lastEditTime,
                lastEditBlockPos,
                liveHistoryActive,
              };
            }

            const historyChanged =
              undoStack !== prevState.undoStack ||
              redoStack !== prevState.redoStack ||
              lastEditTime !== prevState.lastEditTime ||
              lastEditBlockPos !== prevState.lastEditBlockPos ||
              liveHistoryActive !== prevState.liveHistoryActive;

            if (!prevState.activeBlock) {
              if (!historyChanged) return prevState;
              return {
                ...prevState,
                undoStack,
                redoStack,
                lastEditTime,
                lastEditBlockPos,
                liveHistoryActive,
              };
            }

            if (tr.docChanged) {
              const mappedPos = tr.mapping.map(prevState.activeBlock.blockPos, -1);
              const node = tr.doc.nodeAt(mappedPos);
              if (!node || (node.type.name !== "heading" && node.type.name !== "paragraph")) {
                return {
                  activeBlock: null,
                  decorations: DecorationSet.empty,
                  undoStack,
                  redoStack,
                  lastEditTime,
                  lastEditBlockPos,
                  liveHistoryActive,
                };
              }
              const isUserEdit =
                !tr.getMeta("isLivePreviewToggle") &&
                !tr.getMeta("isSync") &&
                !tr.getMeta("isLivePreviewHistory");

              const mappedInline = prevState.activeBlock.activeInline
                ? mapActiveInlineAcrossTr(
                    tr,
                    prevState.activeBlock.blockPos,
                    mappedPos,
                    node,
                    prevState.activeBlock.activeInline,
                    isUserEdit
                  )
                : null;

              const nextActive: ActiveLiveBlockInfo = {
                ...prevState.activeBlock,
                blockPos: mappedPos,
                activeInline: mappedInline,
                dirty: prevState.activeBlock.dirty || isUserEdit,
              };
              return {
                activeBlock: nextActive,
                decorations: buildLivePreviewDecorations(tr.doc, nextActive),
                undoStack,
                redoStack,
                lastEditTime,
                lastEditBlockPos,
                liveHistoryActive,
              };
            }

            if (!historyChanged) return prevState;
            return {
              ...prevState,
              undoStack,
              redoStack,
              lastEditTime,
              lastEditBlockPos,
              liveHistoryActive,
            };
          },
        },

        appendTransaction(transactions, oldState, newState): Transaction | null {
          // Never re-trigger on our own toggle/history/sync transactions or native prosemirror-history transactions
          if (
            transactions.some(
              (t) =>
                t.getMeta("isLivePreviewToggle") ||
                t.getMeta("isLivePreviewHistory") ||
                t.getMeta("isSync") ||
                isHistoryTransaction(t)
            )
          ) {
            return null;
          }

          const oldPluginState = livePreviewPluginKey.getState(oldState);
          const oldActive = oldPluginState?.activeBlock ?? null;
          const pluginState = livePreviewPluginKey.getState(newState);
          const currentActive = pluginState?.activeBlock ?? null;
          const active = isEnabled();

          // 1. If LivePreview is disabled or an explicit blur/collapse meta was dispatched, collapse any active block
          const hasBlurOrCollapse = transactions.some((t) => {
            const m = t.getMeta(livePreviewPluginKey);
            return Boolean(m?.blur || m?.collapse);
          });

          if (!active || hasBlurOrCollapse) {
            const blockToCollapse = currentActive || oldActive;
            if (!blockToCollapse) return null;
            const mappedPos = currentActive
              ? currentActive.blockPos
              : transactions.reduce((pos, t) => t.mapping.map(pos, -1), blockToCollapse.blockPos);
            const nodeAtPos = newState.doc.nodeAt(mappedPos);
            if (!nodeAtPos) {
              return newState.tr
                .setMeta(livePreviewPluginKey, { activeBlock: null })
                .setMeta("addToHistory", false)
                .setMeta("isLivePreviewToggle", true);
            }
            const tr = newState.tr;
            const { wasModified } = collapseBlockInTransaction(
              tr,
              { ...blockToCollapse, blockPos: mappedPos },
              newState.schema
            );
            tr.setMeta(livePreviewPluginKey, { activeBlock: null });
            tr.setMeta("addToHistory", false);
            tr.setMeta("isLivePreviewToggle", true);
            if (wasModified || blockToCollapse.dirty) {
              tr.setMeta("isLivePreviewCommit", true);
            }
            return tr;
          }

          const focusMetaTargetPos = transactions
            .map((t) => t.getMeta(livePreviewPluginKey)?.focusMediaPos)
            .find((p): p is number => typeof p === "number");
          const hasFocusMeta =
            typeof focusMetaTargetPos === "number" ||
            transactions.some((t) => Boolean(t.getMeta(livePreviewPluginKey)?.focus));
          const selectionChanged = transactions.some((t) => t.selectionSet) || hasFocusMeta;
          const docChanged = transactions.some((t) => t.docChanged);

          if (!selectionChanged && !docChanged) {
            return null;
          }

          // 2. If docChanged while a block was active: handle Toolbar commands OR typing inside the active block
          if (docChanged && oldActive && typeof focusMetaTargetPos !== "number") {
            const oldTarget = findTargetTextblock(oldState.doc, oldActive.blockPos + 1, hasTitleH1());
            const targetNow = findTargetTextblock(newState.doc, newState.selection.from, hasTitleH1());

            if (oldTarget && targetNow && targetNow.context !== "media") {
              const isSameLogicalLine =
                (currentActive && targetNow.blockPos === currentActive.blockPos) ||
                (oldTarget.context !== targetNow.context &&
                  Math.abs(targetNow.blockPos - oldTarget.blockPos) <= 4);

              if (isSameLogicalLine) {
                const blockNode = targetNow.blockNode;
                const blockPos = targetNow.blockPos;
                const contentStart = blockPos + 1;

                // 2a. Did a Toolbar command apply an inline mark (AddMarkStep / RemoveMarkStep)?
                let markStepFrom: number | null = null;
                let markStepTo: number | null = null;
                let hadMarkStep = false;
                for (const t of transactions) {
                  for (const s of t.steps as any[]) {
                    const st = s.toJSON?.()?.stepType;
                    if (st === "addMark" || st === "removeMark") {
                      hadMarkStep = true;
                      if (typeof s.from === "number" && typeof s.to === "number") {
                        markStepFrom = markStepFrom === null ? s.from : Math.min(markStepFrom, s.from);
                        markStepTo = markStepTo === null ? s.to : Math.max(markStepTo, s.to);
                      }
                    }
                  }
                }

                if (hadMarkStep) {
                  const selFromOff = Math.max(0, newState.selection.from - contentStart);
                  const selToOff = Math.max(selFromOff, newState.selection.to - contentStart);
                  const prefixLen = getLeadingPrefixLength(blockNode, targetNow.context);
                  let touchedRun = findTouchedInlineRun(blockNode, selFromOff, selToOff, prefixLen);
                  let cursorTargetOff = selToOff;

                  if (!touchedRun && markStepFrom !== null && markStepTo !== null) {
                    const mFromOff = Math.max(0, markStepFrom - contentStart);
                    const mToOff = Math.max(mFromOff, markStepTo - contentStart);
                    touchedRun = findTouchedInlineRun(blockNode, mFromOff, mToOff, prefixLen);
                    if (touchedRun) {
                      cursorTargetOff = touchedRun.toOffset;
                    }
                  }

                  if (touchedRun) {
                    const tr = newState.tr;
                    const prevInline = currentActive?.activeInline ?? null;
                    if (
                      prevInline &&
                      (prevInline.toOffset <= touchedRun.fromOffset || prevInline.fromOffset >= touchedRun.toOffset)
                    ) {
                      collapseInlineSpanInTransaction(tr, blockPos, prevInline, newState.schema);
                    }
                    const freshNode = tr.doc.nodeAt(blockPos);
                    const mappedTarget = tr.mapping.map(contentStart + cursorTargetOff) - contentStart;
                    const freshRun = freshNode
                      ? findTouchedInlineRun(
                          freshNode,
                          Math.max(0, tr.mapping.map(contentStart + touchedRun.fromOffset) - contentStart),
                          Math.max(0, tr.mapping.map(contentStart + touchedRun.toOffset) - contentStart),
                          getLeadingPrefixLength(freshNode, targetNow.context)
                        )
                      : null;
                    const nextInline = freshRun
                      ? expandInlineRunInTransaction(tr, blockPos, freshRun, mappedTarget)
                      : null;
                    tr.setMeta(livePreviewPluginKey, {
                      activeBlock: {
                        ...(currentActive || oldActive),
                        blockPos,
                        originalContext:
                          oldActive.originalContext === "media" ? "media" : targetNow.context,
                        activeInline: nextInline,
                        dirty: true,
                      },
                    });
                    tr.setMeta("addToHistory", false);
                    tr.setMeta("isLivePreviewToggle", true);
                    tr.setMeta("isLivePreviewCommit", true);
                    return tr;
                  }
                }

                // 2b. Did a Toolbar or Slash command change the block type, heading level, or list/blockquote wrapper?
                const blockStructureChangedByCommand =
                  oldTarget.context !== targetNow.context ||
                  oldTarget.blockNode.type !== targetNow.blockNode.type ||
                  oldTarget.blockNode.attrs?.level !== targetNow.blockNode.attrs?.level ||
                  oldTarget.taskChecked !== targetNow.taskChecked;

                if (blockStructureChangedByCommand) {
                  const firstChild = blockNode.firstChild;
                  const firstUnmarkedText =
                    firstChild?.isText && (!firstChild.marks || firstChild.marks.length === 0)
                      ? firstChild.text || ""
                      : "";
                  const oldPrefixMatch = firstUnmarkedText.match(/^(?:#{1,6}\s+|>\s?)/);
                  const oldPrefixLen = oldPrefixMatch ? oldPrefixMatch[0].length : 0;
                  const newPrefix = computeBlockPrefix(newState.doc, blockPos, blockNode);

                  const tr = newState.tr;
                  if (newPrefix !== (oldPrefixMatch?.[0] || "")) {
                    if (newPrefix.length > 0) {
                      tr.replaceWith(contentStart, contentStart + oldPrefixLen, newState.schema.text(newPrefix));
                    } else if (oldPrefixLen > 0) {
                      tr.delete(contentStart, contentStart + oldPrefixLen);
                    }
                    const mappedCursor = Math.max(
                      contentStart,
                      Math.min(tr.mapping.map(newState.selection.from), contentStart + (tr.doc.nodeAt(blockPos)?.content.size ?? 0))
                    );
                    tr.setSelection(TextSelection.create(tr.doc, mappedCursor));
                  }
                  const updatedInline = currentActive?.activeInline
                    ? {
                        ...currentActive.activeInline,
                        fromOffset: Math.max(0, currentActive.activeInline.fromOffset + newPrefix.length - oldPrefixLen),
                        toOffset: Math.max(0, currentActive.activeInline.toOffset + newPrefix.length - oldPrefixLen),
                      }
                    : null;
                  tr.setMeta(livePreviewPluginKey, {
                    activeBlock: {
                      ...(currentActive || oldActive),
                      blockPos,
                      originalContext: targetNow.context,
                      hasExpandedPrefix: newPrefix.length > 0,
                      initialPrefix: newPrefix,
                      activeInline: updatedInline,
                      originalTaskChecked: targetNow.taskChecked,
                      dirty: true,
                    },
                  });
                  tr.setMeta("addToHistory", false);
                  tr.setMeta("isLivePreviewToggle", true);
                  tr.setMeta("isLivePreviewCommit", true);
                  return tr;
                }

                // 2c. Normal user typing inside the active block:
                // (i) Dynamically sync heading level <-> paragraph markup from leading `#` text
                // (ii) If cursor moved outside `activeInline` (e.g. typed Space after `**bold**`) or left a newly completed raw token, compile it live!
                const tr = newState.tr;
                let changed = false;
                let nextActiveInline = currentActive?.activeInline ?? null;

                const isTopLevel = targetNow.depth === 1;
                if (isTopLevel && !oldActive.isTitleH1 && oldActive.originalContext !== "media") {
                  const firstChild = blockNode.firstChild;
                  const firstUnmarkedText =
                    firstChild?.isText && (!firstChild.marks || firstChild.marks.length === 0)
                      ? firstChild.text || ""
                      : "";
                  const hMatch = firstUnmarkedText.match(/^(#{1,6})(?:\s+|$)/);
                  if (hMatch && newState.schema.nodes.heading) {
                    const desiredLevel = hMatch[1].length;
                    if (blockNode.type.name !== "heading" || blockNode.attrs?.level !== desiredLevel) {
                      tr.setNodeMarkup(blockPos, newState.schema.nodes.heading, {
                        textAlign: blockNode.attrs?.textAlign || "left",
                        level: desiredLevel,
                      });
                      changed = true;
                    }
                  } else if (!hMatch && blockNode.type.name === "heading" && newState.schema.nodes.paragraph) {
                    tr.setNodeMarkup(blockPos, newState.schema.nodes.paragraph, {
                      textAlign: blockNode.attrs?.textAlign || "left",
                    });
                    changed = true;
                  }
                }

                if (oldActive.originalContext !== "media" && newState.selection.empty) {
                  let selOff = Math.max(0, tr.mapping.map(newState.selection.from) - contentStart);

                  // Did typing (e.g. Space after `**bold**|`) move cursor outside `activeInline`?
                  if (
                    nextActiveInline &&
                    (selOff < nextActiveInline.fromOffset || selOff > nextActiveInline.toOffset)
                  ) {
                    collapseInlineSpanInTransaction(tr, blockPos, nextActiveInline, newState.schema);
                    nextActiveInline = null;
                    changed = true;
                    selOff = Math.max(0, tr.mapping.map(newState.selection.from) - contentStart);
                  }

                  // Compile any newly completed raw inline syntax on plain text that cursor just left (e.g. `**bold** `)
                  const curNodeForCompile = tr.doc.nodeAt(blockPos);
                  if (curNodeForCompile) {
                    const prefixLen = getLeadingPrefixLength(curNodeForCompile, targetNow.context);
                    const compiled = compileUnfocusedPlainMarkdownInBlock(
                      tr,
                      blockPos,
                      selOff,
                      selOff,
                      prefixLen,
                      nextActiveInline,
                      newState.schema
                    );
                    if (compiled) {
                      changed = true;
                      if (nextActiveInline) {
                        const mappedFrom = tr.mapping.map(contentStart + nextActiveInline.fromOffset, -1) - contentStart;
                        const mappedTo = tr.mapping.map(contentStart + nextActiveInline.toOffset, 1) - contentStart;
                        nextActiveInline = mappedTo > mappedFrom ? { ...nextActiveInline, fromOffset: mappedFrom, toOffset: mappedTo } : null;
                      }
                    }
                  }
                }

                if (changed) {
                  if (nextActiveInline !== (currentActive?.activeInline ?? null)) {
                    tr.setMeta(livePreviewPluginKey, {
                      activeBlock: {
                        ...(currentActive || oldActive),
                        blockPos,
                        activeInline: nextActiveInline,
                        dirty: true,
                      },
                      inlineSwap: true,
                    });
                  }
                  tr.setMeta("addToHistory", false);
                  tr.setMeta("isLivePreviewToggle", true);
                  return tr;
                }
                return null;
              }
            }
          }

          // 3. Handle selection movement (either within the same block for per-element inline reveal, or into a new block / media NodeSelection)
          const isMediaNodeSelection =
            newState.selection instanceof NodeSelection &&
            isExpandableMediaNode(newState.selection.node);

          if (!newState.selection.empty && !isMediaNodeSelection && typeof focusMetaTargetPos !== "number") {
            return null;
          }

          const lookupPos =
            typeof focusMetaTargetPos === "number"
              ? focusMetaTargetPos
              : newState.selection.from;
          const targetBlock = findTargetTextblock(newState.doc, lookupPos, hasTitleH1());

          // 3A. Selection moved WITHIN the SAME active block: Obsidian per-element inline expand/collapse!
          if (
            currentActive &&
            targetBlock &&
            currentActive.blockPos === targetBlock.blockPos &&
            currentActive.originalContext !== "media"
          ) {
            const blockPos = currentActive.blockPos;
            const contentStart = blockPos + 1;
            const selFromOff = Math.max(0, newState.selection.from - contentStart);
            const selToOff = Math.max(selFromOff, newState.selection.to - contentStart);
            const prevInline = currentActive.activeInline;

            const stillInActiveInline = Boolean(
              prevInline && selFromOff <= prevInline.toOffset && selToOff >= prevInline.fromOffset
            );

            if (stillInActiveInline) {
              return null;
            }

            const tr = newState.tr;
            let mutated = false;
            let inlineWasModified = false;

            // Step 1: Collapse previous activeInline if cursor moved outside it
            if (prevInline) {
              const res = collapseInlineSpanInTransaction(tr, blockPos, prevInline, newState.schema);
              inlineWasModified = res.wasModified;
              mutated = true;
            }

            // Step 2: Compile any uncompiled raw Markdown in plain text outside the new cursor position
            let mappedSelFrom = Math.max(
              contentStart,
              Math.min(tr.mapping.map(newState.selection.from), tr.doc.content.size)
            );
            let mappedSelFromOff = Math.max(0, mappedSelFrom - contentStart);
            const nodeAfterCollapse = tr.doc.nodeAt(blockPos);
            if (nodeAfterCollapse) {
              const prefixLen = getLeadingPrefixLength(nodeAfterCollapse, targetBlock.context);
              const compiled = compileUnfocusedPlainMarkdownInBlock(
                tr,
                blockPos,
                mappedSelFromOff,
                mappedSelFromOff,
                prefixLen,
                null,
                newState.schema
              );
              if (compiled) {
                mutated = true;
                inlineWasModified = true;
                mappedSelFrom = Math.max(
                  contentStart,
                  Math.min(tr.mapping.map(newState.selection.from), tr.doc.content.size)
                );
                mappedSelFromOff = Math.max(0, mappedSelFrom - contentStart);
              }
            }

            // Step 3: Check if the new cursor touches a formatted inline element to expand ONLY that element
            let nextInline: ActiveInlineSpan | null = null;
            const nodeForExpand = tr.doc.nodeAt(blockPos);
            if (nodeForExpand) {
              const prefixLen = getLeadingPrefixLength(nodeForExpand, targetBlock.context);
              const touchedRun = findTouchedInlineRun(
                nodeForExpand,
                mappedSelFromOff,
                mappedSelFromOff,
                prefixLen
              );
              if (touchedRun) {
                nextInline = expandInlineRunInTransaction(tr, blockPos, touchedRun, mappedSelFromOff);
                mutated = true;
              } else if (mutated) {
                // Keep cursor at the exact mapped position after collapsing the previous inline element
                const maxPos = contentStart + nodeForExpand.content.size;
                tr.setSelection(TextSelection.create(tr.doc, Math.max(contentStart, Math.min(mappedSelFrom, maxPos))));
              }
            }

            if (!mutated) {
              return null;
            }

            tr.setMeta(livePreviewPluginKey, {
              activeBlock: {
                ...currentActive,
                activeInline: nextInline,
                dirty: currentActive.dirty || inlineWasModified,
              },
              inlineSwap: true,
            });
            tr.setMeta("addToHistory", false);
            tr.setMeta("isLivePreviewToggle", true);
            if (inlineWasModified) {
              tr.setMeta("isLivePreviewCommit", true);
            }
            return tr;
          }

          if (!currentActive && !targetBlock) {
            return null;
          }

          // 3B. Selection moved to a DIFFERENT block (or initial focus on a block / media NodeSelection)
          const tr = newState.tr;
          let wasModified = false;

          // Step A: Collapse previous active block if any
          if (currentActive) {
            const res = collapseBlockInTransaction(tr, currentActive, newState.schema);
            wasModified = res.wasModified || currentActive.dirty;
          }

          // Step B: Expand new target block (prefix + ONLY the touched inline element, or media embed)
          let nextActive: ActiveLiveBlockInfo | null = null;
          if (targetBlock) {
            const mappedTargetPos = tr.mapping.map(targetBlock.blockPos);
            const mappedCursorPos = tr.mapping.map(lookupPos);
            const freshLookupPos =
              targetBlock.context === "media" ? mappedTargetPos : mappedTargetPos + 1;
            const freshTarget = findTargetTextblock(tr.doc, freshLookupPos, hasTitleH1());
            if (freshTarget) {
              const isPointer = transactions.some((t) => Boolean(t.getMeta("pointer")));
              const steppedFromLeft =
                !isPointer &&
                oldState.selection.empty &&
                oldState.selection.from < targetBlock.blockPos &&
                (newState.selection.from === targetBlock.blockPos + 1 ||
                  (targetBlock.context === "media" &&
                    newState.selection.from === targetBlock.blockPos));

              nextActive = expandBlockInTransaction(
                tr,
                freshTarget,
                mappedCursorPos,
                steppedFromLeft
              );
            }
          }

          tr.setMeta(livePreviewPluginKey, { activeBlock: nextActive });
          tr.setMeta("addToHistory", false);
          tr.setMeta("isLivePreviewToggle", true);
          if (wasModified) {
            tr.setMeta("isLivePreviewCommit", true);
          }
          return tr;
        },

        props: {
          decorations(state: EditorState) {
            if (!isEnabled()) return DecorationSet.empty;
            return livePreviewPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
          },

          handleClick(view) {
            if (!isEnabled()) return false;
            if (isPosInDocumentTitleH1(view.state.doc, view.state.selection.from, hasTitleH1())) {
              return false;
            }
            const pluginState = livePreviewPluginKey.getState(view.state);
            if (!pluginState?.activeBlock) {
              view.dispatch(
                view.state.tr
                  .setMeta(livePreviewPluginKey, { focus: true })
                  .setMeta("addToHistory", false)
              );
            }
            return false;
          },

          handleTextInput(view, from, to, text) {
            if (!isEnabled()) return false;

            // Live Preview must not intercept typing inside the file's H1 Title
            if (isPosInDocumentTitleH1(view.state.doc, from, hasTitleH1())) {
              return false;
            }

            // When typing Space at the start of a paragraph after a list marker (`-`, `*`, `+`, `1.`, `[ ]`, `[x]`),
            // allow TipTap's native list InputRule to convert the line into a visual bullet/ordered/task list immediately!
            if (text === " " && from === to) {
              const $from = view.state.doc.resolve(from);
              if ($from.parent.type.name === "paragraph") {
                const textBefore = $from.parent.textBetween(0, $from.parentOffset);
                if (/^\s*(?:[-*+]|\d+\.|\[[ xX]\])$/.test(textBefore)) {
                  return false;
                }
              }
            }

            // Insert raw text directly so WYSIWYG InputRules (which strip `## `, `**`, etc.) do not eat syntax while focused
            view.dispatch(view.state.tr.insertText(text, from, to).scrollIntoView());
            return true;
          },

          handleKeyDown(view, event) {
            const pluginState = livePreviewPluginKey.getState(view.state);
            const useLiveHistory = Boolean(
              pluginState && (isEnabled() || pluginState.liveHistoryActive)
            );

            // Live-Preview-aware Undo / Redo shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, layout-independent KeyZ/KeyY for Thai keyboards)
            if (useLiveHistory && (event.ctrlKey || event.metaKey) && !event.altKey) {
              const keyLower = event.key.toLowerCase();
              const isZ = keyLower === "z" || event.code === "KeyZ";
              const isY = keyLower === "y" || event.code === "KeyY";

              if (isZ && !event.shiftKey) {
                event.preventDefault();
                livePreviewUndo(view.state, view.dispatch, {
                  isEnabled: isEnabled(),
                  hasTitleH1: hasTitleH1(),
                });
                return true;
              }
              if ((isZ && event.shiftKey) || (isY && !event.shiftKey)) {
                event.preventDefault();
                livePreviewRedo(view.state, view.dispatch, {
                  isEnabled: isEnabled(),
                  hasTitleH1: hasTitleH1(),
                });
                return true;
              }
            }

            if (!isEnabled()) return false;

            // Defer to Slash Command palette when open
            if (isSlashMenuOpen()) {
              return false;
            }

            // Bold / Italic markdown syntax wrapping shortcuts (Ctrl+B / Ctrl+I) in Live Preview (skip file H1 Title)
            if (
              (event.ctrlKey || event.metaKey) &&
              !event.altKey &&
              !event.shiftKey &&
              !isPosInDocumentTitleH1(view.state.doc, view.state.selection.from, hasTitleH1())
            ) {
              const key = event.key.toLowerCase();
              if (key === "b" || key === "i") {
                const marker = key === "b" ? "**" : "*";
                const { from, to, empty } = view.state.selection;
                const tr = view.state.tr;
                if (!empty) {
                  const selectedText = view.state.doc.textBetween(from, to);
                  if (
                    selectedText.length >= marker.length * 2 &&
                    selectedText.startsWith(marker) &&
                    selectedText.endsWith(marker)
                  ) {
                    const unwrapped = selectedText.slice(marker.length, selectedText.length - marker.length);
                    tr.insertText(unwrapped, from, to);
                    tr.setSelection(TextSelection.create(tr.doc, from, from + unwrapped.length));
                  } else {
                    const wrapped = `${marker}${selectedText}${marker}`;
                    tr.insertText(wrapped, from, to);
                    tr.setSelection(
                      TextSelection.create(
                        tr.doc,
                        from + marker.length,
                        from + marker.length + selectedText.length
                      )
                    );
                  }
                } else {
                  tr.insertText(`${marker}${marker}`, from, to);
                  tr.setSelection(TextSelection.create(tr.doc, from + marker.length));
                }
                tr.setMeta("isLivePreviewShortcut", true);
                view.dispatch(tr.scrollIntoView());
                event.preventDefault();
                return true;
              }
            }

            // Arrow navigation into / out of attachment media blocks (image, video, audio)
            if (
              !event.shiftKey &&
              !event.ctrlKey &&
              !event.altKey &&
              !event.metaKey &&
              (event.key === "ArrowDown" ||
                event.key === "ArrowUp" ||
                event.key === "ArrowRight" ||
                event.key === "ArrowLeft")
            ) {
              const activeBlock = pluginState?.activeBlock;
              const currentBlockPos = activeBlock?.blockPos;
              const currentBlockNode =
                typeof currentBlockPos === "number" ? view.state.doc.nodeAt(currentBlockPos) : null;

              if (currentBlockNode && typeof currentBlockPos === "number") {
                const contentStart = currentBlockPos + 1;
                const contentEnd = currentBlockPos + currentBlockNode.nodeSize - 1;
                const sel = view.state.selection;

                const isSteppingForward =
                  event.key === "ArrowDown" ||
                  (event.key === "ArrowRight" && sel.empty && sel.from === contentEnd);
                const isSteppingBackward =
                  event.key === "ArrowUp" ||
                  (event.key === "ArrowLeft" && sel.empty && sel.from === contentStart);

                if (isSteppingForward) {
                  const nextPos = currentBlockPos + currentBlockNode.nodeSize;
                  if (nextPos < view.state.doc.content.size) {
                    const nextNode = view.state.doc.nodeAt(nextPos);
                    if (isExpandableMediaNode(nextNode)) {
                      view.dispatch(
                        view.state.tr
                          .setMeta(livePreviewPluginKey, { focusMediaPos: nextPos })
                          .setMeta("addToHistory", false)
                          .scrollIntoView()
                      );
                      event.preventDefault();
                      return true;
                    }
                    if (activeBlock?.originalContext === "media" && event.key === "ArrowDown") {
                      const nextTarget = findTargetTextblock(view.state.doc, nextPos + 1, hasTitleH1());
                      if (nextTarget) {
                        view.dispatch(
                          view.state.tr
                            .setSelection(
                              TextSelection.near(view.state.doc.resolve(nextTarget.blockPos + 1), 1)
                            )
                            .scrollIntoView()
                        );
                        event.preventDefault();
                        return true;
                      }
                    }
                  }
                }

                if (isSteppingBackward && currentBlockPos > 0) {
                  const $before = view.state.doc.resolve(currentBlockPos);
                  const prevNode = $before.nodeBefore;
                  if (prevNode) {
                    const prevPos = currentBlockPos - prevNode.nodeSize;
                    if (isExpandableMediaNode(prevNode)) {
                      view.dispatch(
                        view.state.tr
                          .setMeta(livePreviewPluginKey, { focusMediaPos: prevPos })
                          .setMeta("addToHistory", false)
                          .scrollIntoView()
                      );
                      event.preventDefault();
                      return true;
                    }
                    if (activeBlock?.originalContext === "media" && event.key === "ArrowUp") {
                      const prevTarget = findTargetTextblock(
                        view.state.doc,
                        Math.max(0, currentBlockPos - 1),
                        hasTitleH1()
                      );
                      if (prevTarget) {
                        const targetEnd =
                          prevTarget.blockPos + prevTarget.blockNode.nodeSize - 1;
                        view.dispatch(
                          view.state.tr
                            .setSelection(TextSelection.near(view.state.doc.resolve(targetEnd), -1))
                            .scrollIntoView()
                        );
                        event.preventDefault();
                        return true;
                      }
                    }
                  }
                }
              }
            }

            if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
              const activeBlock = pluginState?.activeBlock;
              if (!activeBlock) return false;

              const blockNode = view.state.doc.nodeAt(activeBlock.blockPos);
              if (!blockNode) return false;

              const rawText = blockNode.textContent || "";

              // 1. If pressing Enter on an empty blockquote prefix (`> `),
              // exit the blockquote and turn this line into a clean empty paragraph!
              const isEmptyQuoteMarker = /^>\s*$/.test(rawText);
              if (isEmptyQuoteMarker && activeBlock.originalContext === "blockquote") {
                const tr = view.state.tr;
                const contentStart = activeBlock.blockPos + 1;
                const contentEnd = activeBlock.blockPos + blockNode.nodeSize - 1;
                if (contentEnd > contentStart) {
                  tr.delete(contentStart, contentEnd);
                }
                collapseBlockInTransaction(
                  tr,
                  { ...activeBlock, initialRawText: "__FORCE_LIFT__", activeInline: null, dirty: true },
                  view.state.schema
                );
                const mappedPos = Math.min(tr.mapping.map(activeBlock.blockPos) + 1, tr.doc.content.size);
                const newTarget = findTargetTextblock(tr.doc, mappedPos, hasTitleH1());
                let nextActive: ActiveLiveBlockInfo | null = null;
                if (newTarget) {
                  nextActive = expandBlockInTransaction(tr, newTarget, newTarget.blockPos + 1);
                }
                tr.setMeta(livePreviewPluginKey, { activeBlock: nextActive });
                tr.setMeta("isLivePreviewToggle", true);
                tr.setMeta("isLivePreviewUserEdit", true);
                tr.setMeta("isLivePreviewCommit", true);
                view.dispatch(tr.scrollIntoView());
                event.preventDefault();
                return true;
              }

              // 2. If pressing Enter on an expanded attachment/media line, collapse it into the rendered media node
              // and create a new paragraph below it!
              const isMediaLine =
                activeBlock.originalContext === "media" ||
                parseRawMarkdownToMediaNode(rawText.trim(), view.state.schema, activeBlock.originalNode) !== null;
              if (isMediaLine && view.state.selection.empty) {
                const tr = view.state.tr;
                collapseBlockInTransaction(tr, activeBlock, view.state.schema);
                const mediaAfterCollapse = tr.doc.nodeAt(activeBlock.blockPos);
                const insertPos =
                  activeBlock.blockPos + (mediaAfterCollapse ? mediaAfterCollapse.nodeSize : 1);
                const newPara = view.state.schema.nodes.paragraph.create({});
                tr.insert(insertPos, newPara);
                const newCursor = insertPos + 1;
                tr.setSelection(TextSelection.create(tr.doc, newCursor));
                const nextActive: ActiveLiveBlockInfo = {
                  blockPos: insertPos,
                  originalContext: "paragraph",
                  isTitleH1: false,
                  hasExpandedPrefix: false,
                  initialPrefix: "",
                  initialRawText: "",
                  originalNode: newPara,
                  activeInline: null,
                  dirty: false,
                };
                tr.setMeta(livePreviewPluginKey, { activeBlock: nextActive });
                tr.setMeta("isLivePreviewToggle", true);
                tr.setMeta("isLivePreviewUserEdit", true);
                tr.setMeta("isLivePreviewCommit", true);
                view.dispatch(tr.scrollIntoView());
                event.preventDefault();
                return true;
              }

              // 3. If pressing Enter inside a heading (at end or middle), split cleanly:
              // content before cursor stays in the heading (and collapses), content after cursor moves to a new paragraph below
              // preserving any existing rendered inline marks!
              if (blockNode.type.name === "heading" && view.state.selection.empty) {
                const cursorPos = view.state.selection.from;
                const contentStart = activeBlock.blockPos + 1;
                const contentEnd = activeBlock.blockPos + blockNode.nodeSize - 1;
                if (cursorPos >= contentStart && cursorPos <= contentEnd) {
                  const offsetInHeading = cursorPos - contentStart;
                  const afterFragment: Fragment = blockNode.content.cut(offsetInHeading);

                  const tr = view.state.tr;
                  if (contentEnd > contentStart + offsetInHeading) {
                    tr.delete(contentStart + offsetInHeading, contentEnd);
                  }
                  const updatedNode = tr.doc.nodeAt(activeBlock.blockPos);
                  if (!updatedNode) return false;

                  collapseBlockInTransaction(
                    tr,
                    {
                      ...activeBlock,
                      activeInline: null,
                      dirty: true,
                    },
                    view.state.schema
                  );

                  const headingAfterCollapse = tr.doc.nodeAt(activeBlock.blockPos);
                  const insertPos = activeBlock.blockPos + (headingAfterCollapse ? headingAfterCollapse.nodeSize : 2);
                  const newPara = view.state.schema.nodes.paragraph.create({}, afterFragment);
                  tr.insert(insertPos, newPara);
                  const newCursor = insertPos + 1;
                  tr.setSelection(TextSelection.create(tr.doc, newCursor));

                  const newTarget = findTargetTextblock(tr.doc, newCursor, hasTitleH1());
                  const nextActive = newTarget
                    ? expandBlockInTransaction(tr, newTarget, newCursor)
                    : null;

                  tr.setMeta(livePreviewPluginKey, { activeBlock: nextActive });
                  tr.setMeta("isLivePreviewToggle", true);
                  tr.setMeta("isLivePreviewUserEdit", true);
                  tr.setMeta("isLivePreviewCommit", true);
                  view.dispatch(tr.scrollIntoView());
                  event.preventDefault();
                  return true;
                }
              }
            }

            return false;
          },

          handleDOMEvents: {
            beforeinput(view, event) {
              const inputEvent = event as InputEvent;
              if (inputEvent.inputType !== "historyUndo" && inputEvent.inputType !== "historyRedo") {
                return false;
              }
              const pluginState = livePreviewPluginKey.getState(view.state);
              const useLiveHistory = Boolean(
                pluginState && (isEnabled() || pluginState.liveHistoryActive)
              );
              if (!useLiveHistory || !view.editable) {
                return false;
              }
              event.preventDefault();
              if (inputEvent.inputType === "historyUndo") {
                return livePreviewUndo(view.state, view.dispatch, {
                  isEnabled: isEnabled(),
                  hasTitleH1: hasTitleH1(),
                });
              }
              return livePreviewRedo(view.state, view.dispatch, {
                isEnabled: isEnabled(),
                hasTitleH1: hasTitleH1(),
              });
            },

            mousedown(view, event) {
              if (!isEnabled()) return false;
              const mouseEvent = event as MouseEvent;
              if (mouseEvent.button !== 0) return false;
              const target = mouseEvent.target as HTMLElement | null;
              if (!target) return false;

              // Allow interactive controls on media NodeViews (play/pause, volume, progress bar, resize handle, buttons, menus)
              if (
                target.closest(
                  'button, input, a, [role="slider"], [role="menu"], [role="menuitem"], .cursor-nwse-resize, .group\\/bar, .group\\/vol, [data-radix-popper-content-wrapper]'
                )
              ) {
                return false;
              }

              const nodeViewWrapper = target.closest("[data-node-view-wrapper]") as HTMLElement | null;
              if (!nodeViewWrapper) return false;

              try {
                const domPos = view.posAtDOM(nodeViewWrapper, 0);
                const candidatePositions = [domPos, domPos - 1, domPos + 1];
                for (const candidatePos of candidatePositions) {
                  if (candidatePos >= 0 && candidatePos <= view.state.doc.content.size) {
                    const node = view.state.doc.nodeAt(candidatePos);
                    if (isExpandableMediaNode(node)) {
                      mouseEvent.preventDefault();
                      mouseEvent.stopPropagation();
                      view.focus();
                      view.dispatch(
                        view.state.tr
                          .setMeta(livePreviewPluginKey, { focusMediaPos: candidatePos })
                          .setMeta("addToHistory", false)
                      );
                      return true;
                    }
                  }
                }
              } catch {
                // ignore
              }
              return false;
            },

            focus(view) {
              if (!isEnabled()) return false;
              if (isPosInDocumentTitleH1(view.state.doc, view.state.selection.from, hasTitleH1())) {
                return false;
              }
              const pluginState = livePreviewPluginKey.getState(view.state);
              if (!pluginState?.activeBlock) {
                view.dispatch(
                  view.state.tr
                    .setMeta(livePreviewPluginKey, { focus: true })
                    .setMeta("addToHistory", false)
                );
              }
              return false;
            },

            blur(view, event) {
              if (!isEnabled()) return false;
              const related = (event as FocusEvent).relatedTarget as HTMLElement | null;
              if (
                related &&
                (related.closest('[role="menu"]') ||
                  related.closest('[role="dialog"]') ||
                  related.closest('[role="listbox"]') ||
                  related.closest("[data-editor-toolbar]") ||
                  related.closest("[data-radix-popper-content-wrapper]") ||
                  related.closest("[data-radix-menu-content]"))
              ) {
                return false;
              }
              const pluginState = livePreviewPluginKey.getState(view.state);
              if (pluginState?.activeBlock) {
                view.dispatch(
                  view.state.tr
                    .setMeta(livePreviewPluginKey, { blur: true })
                    .setMeta("addToHistory", false)
                );
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

export default LivePreview;
