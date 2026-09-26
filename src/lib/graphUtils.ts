import type { Note } from "@/hooks/useNotes";
import { isSystemOrWebTab } from "@/hooks/useTabs";

export interface GraphNode {
  id: string;
  title: string;
  label: string;
  folderPath?: string;
  tags?: string[];
  degree: number;
  connectionIds: Set<string>;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isFavorite?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface NoteGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Extracts all raw link targets (wikilinks, markdown internal links, data-wikilinks) from note content.
 */
export function extractNoteLinks(content?: string): string[] {
  if (!content || typeof content !== "string") return [];

  const targets: string[] = [];

  // 1. Wikilinks: [[Target]] or [[Target|Alias]]
  const wikilinkRegex = /\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = wikilinkRegex.exec(content)) !== null) {
    const raw = match[1]?.trim();
    if (raw) targets.push(raw);
  }

  // 2. HTML data-wikilink or href="wikilink:..."
  const dataWikiRegex = /data-wikilink=["']([^"']+)["']/g;
  while ((match = dataWikiRegex.exec(content)) !== null) {
    const raw = match[1]?.trim();
    if (raw) targets.push(raw);
  }

  const hrefWikiRegex = /href=["']wikilink:([^"']+)["']/g;
  while ((match = hrefWikiRegex.exec(content)) !== null) {
    const raw = match[1]?.trim();
    if (raw) targets.push(decodeURIComponent(raw));
  }

  // 3. Markdown standard internal links: [text](target.md) or [text](./target.md)
  const mdLinkRegex = /\[[^\]]+\]\(([^):#\s?]+\.(?:md|markdown))\)/g;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const raw = match[1]?.trim();
    if (raw) {
      // strip ./ or leading slashes
      const clean = raw.replace(/^\.?\/+/, "");
      targets.push(clean);
    }
  }

  return Array.from(new Set(targets));
}

/**
 * Resolves a raw target string to an existing note ID.
 */
export function resolveLinkedNoteId(target: string, notes: Note[]): string | null {
  if (!target || !notes || notes.length === 0) return null;

  const cleanTarget = target.trim().toLowerCase();
  const baseClean = cleanTarget.replace(/\.[^/.]+$/, "");

  const matched = notes.find((n) => {
    if (isSystemOrWebTab(n.id) || n.fileType === "image" || n.fileType === "binary") return false;

    const nameWithoutExt = (n.fileName || n.title || "").replace(/\.[^/.]+$/, "").toLowerCase();
    const fullFileName = (n.fileName || "").toLowerCase();
    const title = (n.title || "").toLowerCase();
    const relPath = n.fileName ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName).toLowerCase() : "";

    return (
      nameWithoutExt === baseClean ||
      fullFileName === cleanTarget ||
      title === cleanTarget ||
      relPath === cleanTarget ||
      (n.folderPath && `${n.folderPath.toLowerCase()}/${nameWithoutExt}` === baseClean)
    );
  });

  return matched ? matched.id : null;
}

export function isMarkdownFile(n: Note): boolean {
  if (!n || !n.id) return false;
  if (
    isSystemOrWebTab(n.id) ||
    n.fileType === "image" ||
    n.fileType === "binary" ||
    n.id.startsWith("web:") ||
    (n as any).isFolder
  ) {
    return false;
  }
  const fileName = (n.fileName || "").toLowerCase();
  if (fileName) {
    return fileName.endsWith(".md") || fileName.endsWith(".markdown");
  }
  return n.contentFormat === "markdown" && !!n.title && n.title !== "Untitled";
}

/**
 * Builds the complete graph data (nodes and edges) from the list of workspace notes.
 */
export function buildNoteGraph(notes: Note[]): NoteGraphData {
  const eligibleNotes = notes.filter(isMarkdownFile);

  const nodeMap = new Map<string, GraphNode>();

  eligibleNotes.forEach((n) => {
    const title = n.title || n.fileName || "Untitled";
    const label = (n.fileName || n.title || "Untitled").replace(/\.[^/.]+$/, "");

    nodeMap.set(n.id, {
      id: n.id,
      title,
      label,
      folderPath: n.folderPath,
      tags: n.tags,
      degree: 0,
      connectionIds: new Set<string>(),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isFavorite: n.isFavorite,
    });
  });

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  eligibleNotes.forEach((note) => {
    const rawTargets = extractNoteLinks(note.content);
    rawTargets.forEach((target) => {
      const targetId = resolveLinkedNoteId(target, eligibleNotes);
      if (targetId && targetId !== note.id && nodeMap.has(targetId)) {
        // Unique undirected edge key to avoid duplicate lines
        const edgeKey = [note.id, targetId].sort().join("<->");
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            id: edgeKey,
            source: note.id,
            target: targetId,
          });

          const sourceNode = nodeMap.get(note.id);
          const targetNode = nodeMap.get(targetId);
          if (sourceNode && targetNode) {
            sourceNode.degree += 1;
            sourceNode.connectionIds.add(targetId);
            targetNode.degree += 1;
            targetNode.connectionIds.add(note.id);
          }
        }
      }
    });
  });

  // Separate connected nodes and orphan nodes for clean initial layout
  const connectedNodes: GraphNode[] = [];
  const orphanNodes: GraphNode[] = [];

  nodeMap.forEach((node) => {
    if (node.degree > 0) connectedNodes.push(node);
    else orphanNodes.push(node);
  });

  // Layout connected nodes in central cluster
  connectedNodes.forEach((node, idx) => {
    const count = connectedNodes.length;
    const angle = (idx / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2;
    const radius = count <= 1 ? 0 : Math.min(130 + count * 20, 210);
    node.x = Math.cos(angle) * radius;
    node.y = Math.sin(angle) * radius;
  });

  // Layout orphan nodes comfortably outside the connected cluster
  orphanNodes.forEach((node, idx) => {
    const count = orphanNodes.length;
    const offsetAngle = Math.PI / 4 + (idx / Math.max(count, 1)) * 2 * Math.PI;
    const radius = connectedNodes.length > 0 ? 220 + idx * 25 : Math.min(120 + count * 25, 240);
    node.x = Math.cos(offsetAngle) * radius;
    node.y = Math.sin(offsetAngle) * radius;
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

/**
 * Wraps text into multiple lines for node labels (supports Thai and English word breaking).
 * - Fits within maxWidth
 * - If text is long, wraps to line 2 (up to maxLines, default 2)
 * - If text exceeds maxLines (2 lines), truncates with ellipsis "..." on the last line
 */
export function wrapNodeText(
  ctxOrMeasure: CanvasRenderingContext2D | ((str: string) => number),
  text: string,
  maxWidth: number,
  maxLines: number = 2
): string[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  const measure =
    typeof ctxOrMeasure === "function"
      ? ctxOrMeasure
      : (str: string) => ctxOrMeasure.measureText(str).width;

  // If entire text fits on one line, return immediately
  if (measure(trimmed) <= maxWidth) {
    return [trimmed];
  }

  // Segment text into words/tokens: use Intl.Segmenter if available, fallback to regex
  let segments: string[] = [];
  if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: "word" });
      segments = Array.from(segmenter.segment(trimmed), (s: any) => s.segment);
    } catch {
      segments = trimmed.split(/(\s+)/);
    }
  } else {
    segments = trimmed.split(/(\s+)/);
  }

  const lines: string[] = [];
  let currentLine = "";
  let didTruncate = false;
  let segIndex = 0;

  while (segIndex < segments.length) {
    const seg = segments[segIndex];
    if (!seg) {
      segIndex++;
      continue;
    }

    // Skip leading whitespace if currentLine is empty
    if (!currentLine && !seg.trim()) {
      segIndex++;
      continue;
    }

    const testLine = currentLine ? currentLine + seg : seg;
    if (measure(testLine) <= maxWidth) {
      currentLine = testLine;
      segIndex++;
    } else {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = "";
        if (lines.length >= maxLines) {
          didTruncate = true;
          break;
        }
      } else {
        // Single segment exceeds maxWidth on empty line: break by char/grapheme
        let chunk = "";
        const chars = Array.from(seg);
        let charIndex = 0;
        while (charIndex < chars.length) {
          const c = chars[charIndex];
          if (measure(chunk + c) <= maxWidth) {
            chunk += c;
            charIndex++;
          } else {
            if (chunk) {
              lines.push(chunk.trim());
              chunk = "";
              if (lines.length >= maxLines) {
                didTruncate = true;
                break;
              }
            } else {
              lines.push(c);
              charIndex++;
              if (lines.length >= maxLines) {
                didTruncate = true;
                break;
              }
            }
          }
        }

        if (didTruncate) break;
        if (chunk) {
          currentLine = chunk;
        }
        segIndex++;
      }
    }
  }

  if (currentLine.trim() && lines.length < maxLines && !didTruncate) {
    lines.push(currentLine.trim());
  } else if (currentLine.trim() && lines.length >= maxLines) {
    didTruncate = true;
  }

  if (segIndex < segments.length) {
    didTruncate = true;
  }

  // If text exceeded maxLines, apply ellipsis '...' to the last line
  if (didTruncate && lines.length > 0) {
    let last = lines[lines.length - 1].trim();
    while (last.length > 0 && measure(last + "...") > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = (last ? last.trimEnd() : "") + "...";
  }

  return lines.map((l) => l.trim()).filter(Boolean).slice(0, maxLines);
}

/**
 * Calculates the dynamic base radius of a node based on its connection degree.
 * Nodes with more links/edges are larger so hubs stand out clearly while staying sleek and proportional.
 */
export function getNodeBaseRadius(degree: number): number {
  if (degree <= 0) return 2.6;
  // Scaled smoothly using square root so high-degree nodes grow elegantly without overwhelming the canvas
  return Math.min(7.5, 2.6 + Math.sqrt(degree) * 0.95);
}

