import type { Note } from "@/hooks/useNotes";
import { isSystemOrWebTab } from "@/hooks/useTabs";

export type GraphNodeType = "note" | "image" | "video" | "audio" | "file";

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
  nodeType?: GraphNodeType;
  imageSrc?: string;
  mediaSrc?: string;
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

export const IMAGE_EXTENSIONS_REGEX = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif|tiff?|heic|heif)(?:[?#].*)?$/i;
export const VIDEO_EXTENSIONS_REGEX = /\.(mp4|webm|mkv|avi|mov|wmv|flv|m4v|3gp|ogv|m2ts|mts|mpg|mpeg)(?:[?#].*)?$/i;
export const AUDIO_EXTENSIONS_REGEX = /\.(mp3|wav|ogg|m4a|aac|flac|wma|aiff|opus|mid|midi|weba)(?:[?#].*)?$/i;
export const ATTACHMENT_EXTENSIONS_REGEX = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|tar|gz)(?:[?#].*)?$/i;

import { isAudioMedia, isVideoMedia } from "./webmClassifier";

export function isImageSource(src?: string): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (trimmed.startsWith("data:image/")) return true;
  if (trimmed.startsWith("blob:")) {
    if (isAudioMedia(trimmed) || isVideoMedia(trimmed)) return false;
    return true;
  }
  return IMAGE_EXTENSIONS_REGEX.test(trimmed);
}

export function isVideoSource(src?: string, meta?: any): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (trimmed.startsWith("data:video/")) return true;
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("data:audio/")) return false;
  return isVideoMedia(trimmed, meta);
}

export function isAudioSource(src?: string, meta?: any): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (trimmed.startsWith("data:audio/")) return true;
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("data:video/")) return false;
  return isAudioMedia(trimmed, meta);
}

export function isAttachmentFileSource(src?: string): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  return ATTACHMENT_EXTENSIONS_REGEX.test(trimmed);
}

export function classifyMediaSource(
  src: string,
  fallbackType: GraphNodeType = "image"
): GraphNodeType {
  if (!src) return fallbackType;
  const clean = src.split(/[?#]/)[0].trim().toLowerCase();

  if (clean.startsWith("data:image/")) return "image";
  if (clean.startsWith("data:video/")) return "video";
  if (clean.startsWith("data:audio/")) return "audio";

  if (isAudioMedia(clean)) return "audio";
  if (isVideoMedia(clean)) return "video";
  if (IMAGE_EXTENSIONS_REGEX.test(clean)) return "image";
  if (ATTACHMENT_EXTENSIONS_REGEX.test(clean)) return "file";

  return fallbackType;
}

export interface ExtractedImageLink {
  src: string;
  alt?: string;
}

export interface ExtractedMediaLink {
  src: string;
  alt?: string;
  mediaType: GraphNodeType;
}

/**
 * Extracts all embedded / inserted media and attachment files from note content:
 * 1. Obsidian Embeds: ![[image.png]], ![[video.mp4|640]], ![[voice.mp3]], ![[doc.pdf]]
 * 2. Markdown Media: ![alt](path/to/media.png|mp4|mp3)
 * 3. HTML Images: <img src="..." alt="..." />
 * 4. HTML Video: <video src="..." ...></video> or <video><source src="..." /></video>
 * 5. HTML Audio: <audio src="..." ...></audio> or <audio><source src="..." /></audio>
 * 6. Wikilinks to media: [[video.mp4]], [[audio.mp3]], [[image.png]], [[doc.pdf]]
 * 7. Markdown links to media: [watch](video.mp4), [listen](audio.mp3), [view](doc.pdf)
 */
export function extractNoteMediaLinks(content?: string): ExtractedMediaLink[] {
  if (!content || typeof content !== "string") return [];

  const results: ExtractedMediaLink[] = [];
  const seenSrc = new Set<string>();

  const addMedia = (rawSrc: string, alt?: string, explicitType?: GraphNodeType) => {
    let cleanSrc = rawSrc.trim();
    if (!cleanSrc) return;
    cleanSrc = cleanSrc.replace(/^<|>$/g, "").split(/\s+["']/)[0].trim();
    if (!cleanSrc) return;

    const mediaType = explicitType || classifyMediaSource(cleanSrc);
    const isQr = /\bqrcode\b/i.test(cleanSrc) || /\bdata-qr-code\b/i.test(alt || "");

    const isValid =
      isImageSource(cleanSrc) ||
      isVideoSource(cleanSrc) ||
      isAudioSource(cleanSrc) ||
      isAttachmentFileSource(cleanSrc) ||
      explicitType !== undefined ||
      isQr;

    if (!isValid) return;

    if (!seenSrc.has(cleanSrc)) {
      seenSrc.add(cleanSrc);
      results.push({
        src: cleanSrc,
        alt: alt?.trim(),
        mediaType,
      });
    }
  };

  // 1. Obsidian Embeds: ![[path]] or ![[path|alt_or_width]]
  const embedRegex = /!\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = embedRegex.exec(content)) !== null) {
    const rawTarget = match[1]?.trim();
    const altOrWidth = match[2]?.trim();
    if (rawTarget) {
      addMedia(rawTarget, altOrWidth);
    }
  }

  // 2. Standard Markdown Images / Media: ![alt](url)
  const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = mdImgRegex.exec(content)) !== null) {
    const alt = match[1]?.trim();
    const rawUrlPart = match[2]?.trim();
    if (rawUrlPart) {
      addMedia(rawUrlPart, alt);
    }
  }

  // 3. HTML img tags: <img src="..." alt="..." /> or <img data-relative-src="..." ... />
  const htmlImgRegex = /<img\b([^>]+)>/gi;
  while ((match = htmlImgRegex.exec(content)) !== null) {
    const tagAttrs = match[1];
    const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(tagAttrs);
    const relMatch = /\bdata-relative-src=["']([^"']+)["']/i.exec(tagAttrs);
    const altMatch = /\balt=["']([^"']*)["']/i.exec(tagAttrs);
    const isQr = /\bdata-qr-code=["']true["']/i.test(tagAttrs) || /\bdata-qr-text=/i.test(tagAttrs);

    let chosenSrc = relMatch?.[1]?.trim() || srcMatch?.[1]?.trim();
    if (chosenSrc) {
      let cleanSrc = chosenSrc.replace(/^<|>$/g, "").split(/\s+["']/)[0].trim();
      if (cleanSrc && (isImageSource(cleanSrc) || isQr || !cleanSrc.startsWith("http"))) {
        addMedia(cleanSrc, altMatch?.[1]?.trim(), "image");
      }
    }
  }

  // 4. HTML video tags: <video ...> or <video ...><source src="..." ...></video>
  const htmlVideoRegex = /<video\b([^>]*)>([\s\S]*?)(?:<\/video>|$)/gi;
  while ((match = htmlVideoRegex.exec(content)) !== null) {
    const tagAttrs = match[1];
    const innerHtml = match[2] || "";
    const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(tagAttrs);
    const relMatch = /\bdata-relative-src=["']([^"']+)["']/i.exec(tagAttrs);
    const titleMatch = /\b(?:data-title|title)=["']([^"']*)["']/i.exec(tagAttrs);

    let chosenSrc = relMatch?.[1]?.trim() || srcMatch?.[1]?.trim();
    if (!chosenSrc && innerHtml) {
      const sourceMatch = /<source\b[^>]*\bsrc=["']([^"']+)["']/i.exec(innerHtml);
      if (sourceMatch?.[1]?.trim()) {
        chosenSrc = sourceMatch[1].trim();
      }
    }

    if (chosenSrc) {
      let cleanSrc = chosenSrc.replace(/^<|>$/g, "").split(/\s+["']/)[0].trim();
      if (cleanSrc) {
        const isExplicitAudio = /\.(mp3|wav|ogg|m4a|aac|flac|wma|aiff|opus|mid|midi|weba)$/i.test(cleanSrc);
        const type = isExplicitAudio ? "audio" : "video";
        addMedia(cleanSrc, titleMatch?.[1]?.trim(), type);
      }
    }
  }

  // 5. HTML audio tags: <audio ...> or <audio ...><source src="..." ...></audio>
  const htmlAudioRegex = /<audio\b([^>]*)>([\s\S]*?)(?:<\/audio>|$)/gi;
  while ((match = htmlAudioRegex.exec(content)) !== null) {
    const tagAttrs = match[1];
    const innerHtml = match[2] || "";
    const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(tagAttrs);
    const relMatch = /\bdata-relative-src=["']([^"']+)["']/i.exec(tagAttrs);
    const titleMatch = /\b(?:data-title|title)=["']([^"']*)["']/i.exec(tagAttrs);

    let chosenSrc = relMatch?.[1]?.trim() || srcMatch?.[1]?.trim();
    if (!chosenSrc && innerHtml) {
      const sourceMatch = /<source\b[^>]*\bsrc=["']([^"']+)["']/i.exec(innerHtml);
      if (sourceMatch?.[1]?.trim()) {
        chosenSrc = sourceMatch[1].trim();
      }
    }

    if (chosenSrc) {
      let cleanSrc = chosenSrc.replace(/^<|>$/g, "").split(/\s+["']/)[0].trim();
      if (cleanSrc) {
        const isExplicitVideo = /\.(mp4|mkv|avi|mov|wmv|flv|m4v|3gp|ogv|m2ts|mts|mpg|mpeg)$/i.test(cleanSrc);
        const type = isExplicitVideo ? "video" : "audio";
        addMedia(cleanSrc, titleMatch?.[1]?.trim(), type);
      }
    }
  }

  // 6. Wikilinks to media/attachments: [[file.mp4]], [[song.mp3]], [[image.png]], [[doc.pdf]]
  const wikilinkRegex = /(?:^|[^!])\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g;
  while ((match = wikilinkRegex.exec(content)) !== null) {
    const rawTarget = match[1]?.trim();
    const alias = match[2]?.trim();
    if (rawTarget) {
      const clean = rawTarget.split(/[?#]/)[0].trim();
      if (isVideoSource(clean) || isAudioSource(clean) || isImageSource(clean) || isAttachmentFileSource(clean)) {
        addMedia(rawTarget, alias);
      }
    }
  }

  // 7. Markdown standard links to media/attachments: [text](file.mp4), [text](song.mp3), [text](doc.pdf)
  const mdLinkRegex = /(?:^|[^!])\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const alt = match[1]?.trim();
    const rawUrlPart = match[2]?.trim();
    if (rawUrlPart) {
      const clean = rawUrlPart.split(/[?#]/)[0].trim();
      if (isVideoSource(clean) || isAudioSource(clean) || isImageSource(clean) || isAttachmentFileSource(clean)) {
        addMedia(rawUrlPart, alt);
      }
    }
  }

  return results;
}

/**
 * Extracts all embedded / inserted images from note content (backwards compatibility wrapper).
 */
export function extractNoteImageLinks(content?: string): ExtractedImageLink[] {
  return extractNoteMediaLinks(content)
    .filter((m) => m.mediaType === "image")
    .map((m) => ({ src: m.src, alt: m.alt }));
}

/**
 * Resolves a media link/source to a corresponding note in workspace notes (if present).
 */
export function resolveLinkedMediaNote(src: string, notes: Note[]): Note | null {
  if (!src || !notes || notes.length === 0) return null;

  // Direct ID match
  const directId = notes.find((n) => n.id === src);
  if (directId) return directId;

  // Clean source
  let clean = src.split(/[?#]/)[0].trim();
  try {
    clean = decodeURIComponent(clean);
  } catch {}
  clean = clean.replace(/\\/g, "/");
  while (clean.startsWith("./") || clean.startsWith("../")) {
    clean = clean.replace(/^(\.\/|\.\.\/)+/, "");
  }
  const cleanLower = clean.toLowerCase();
  const fileName = clean.split("/").pop()?.toLowerCase() || "";

  return (
    notes.find((n) => {
      if (isSystemOrWebTab(n.id)) return false;
      const nFileName = (n.fileName || "").toLowerCase();
      const nTitle = (n.title || "").toLowerCase();
      const nRelPath = n.fileName
        ? (n.folderPath ? `${n.folderPath}/${n.fileName}` : n.fileName).toLowerCase()
        : "";

      if (nFileName && nFileName === fileName) return true;
      if (nRelPath && (nRelPath === cleanLower || cleanLower.endsWith(`/${nRelPath}`))) return true;
      if (nTitle && (nTitle === fileName || nTitle === cleanLower)) return true;
      return false;
    }) || null
  );
}

/**
 * Resolves an image link/source to a corresponding note in workspace notes (if present).
 */
export function resolveLinkedImageNote(src: string, notes: Note[]): Note | null {
  return resolveLinkedMediaNote(src, notes);
}

/**
 * Extracts all raw link targets (wikilinks, markdown internal links, data-wikilinks) from note content.
 */
export function extractNoteLinks(content?: string): string[] {
  if (!content || typeof content !== "string") return [];

  const targets: string[] = [];

  // 1. Wikilinks: [[Target]] or [[Target|Alias]] (ignoring ![[...]] embeds)
  const wikilinkRegex = /(?:^|[^!])\[\[([^\]|\r\n]+)(?:\|([^\]\r\n]+))?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = wikilinkRegex.exec(content)) !== null) {
    const raw = match[1]?.trim();
    if (raw && !isImageSource(raw)) targets.push(raw);
  }

  // 2. HTML data-wikilink or href="wikilink:..."
  const dataWikiRegex = /data-wikilink=["']([^"']+)["']/g;
  while ((match = dataWikiRegex.exec(content)) !== null) {
    const raw = match[1]?.trim();
    if (raw && !isImageSource(raw)) targets.push(raw);
  }

  const hrefWikiRegex = /href=["']wikilink:([^"']+)["']/g;
  while ((match = hrefWikiRegex.exec(content)) !== null) {
    const raw = match[1]?.trim();
    if (raw && !isImageSource(raw)) targets.push(decodeURIComponent(raw));
  }

  // 3. Markdown standard internal links: [text](target.md) or [text](./target.md)
  const mdLinkRegex = /(?:^|[^!])\[[^\]]+\]\(([^):#\s?]+\.(?:md|markdown))\)/g;
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
 * Builds the complete graph data (nodes and edges) from the list of workspace notes,
 * including markdown notes and inserted media nodes (images, videos, audio, attachments).
 */
export function buildNoteGraph(notes: Note[]): NoteGraphData {
  const eligibleNotes = notes.filter(isMarkdownFile);

  const nodeMap = new Map<string, GraphNode>();
  const mediaNodesMap = new Map<string, GraphNode>();

  // 1. Add eligible markdown notes
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
      nodeType: "note",
    });
  });

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  // 2. Link markdown notes to other markdown notes
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

    // 3. Extract and link inserted media from this note (images, videos, audio, files)
    const mediaLinks = extractNoteMediaLinks(note.content);
    mediaLinks.forEach((media) => {
      const resolved = resolveLinkedMediaNote(media.src, notes);

      let resolvedMediaType = media.mediaType;
      if (resolved) {
        if (resolved.fileType === "image") {
          resolvedMediaType = "image";
        } else if (isAudioMedia(resolved.fileName || resolved.title || "", resolved)) {
          resolvedMediaType = "audio";
        } else if (isVideoMedia(resolved.fileName || resolved.title || "", resolved)) {
          resolvedMediaType = "video";
        } else if (resolved.fileType === "binary") {
          resolvedMediaType = "file";
        }
      }

      const typePrefix =
        resolvedMediaType === "image"
          ? "img"
          : resolvedMediaType === "video"
          ? "vid"
          : resolvedMediaType === "audio"
          ? "aud"
          : "file";

      const mediaId = resolved ? resolved.id : `${typePrefix}:${media.src}`;

      let baseName = "";
      if (resolved?.fileName) {
        baseName = resolved.fileName;
      } else if (/^(data:|blob:)/i.test(media.src)) {
        const defaultExt =
          resolvedMediaType === "audio"
            ? "webm"
            : resolvedMediaType === "video"
            ? "mp4"
            : resolvedMediaType === "file"
            ? "bin"
            : "png";
        baseName =
          media.alt && !media.alt.toLowerCase().startsWith("data:")
            ? /\.[a-zA-Z0-9]+$/i.test(media.alt)
              ? media.alt
              : `${media.alt.toLowerCase().replace(/\s+/g, "_")}.${defaultExt}`
            : resolvedMediaType === "audio"
            ? "voice_note.webm"
            : resolvedMediaType === "video"
            ? "video.mp4"
            : resolvedMediaType === "file"
            ? "attachment.bin"
            : "qrcode.png";
      } else {
        const urlClean = media.src.split(/[?#]/)[0];
        const defaultFallback =
          resolvedMediaType === "audio"
            ? "audio.mp3"
            : resolvedMediaType === "video"
            ? "video.mp4"
            : resolvedMediaType === "file"
            ? "attachment.bin"
            : "image.png";
        baseName = urlClean.split("/").pop() || media.alt || defaultFallback;
      }

      const mediaTitle = resolved
        ? resolved.title || resolved.fileName || baseName
        : media.alt && media.alt !== "QR Code"
        ? media.alt
        : baseName;
      const mediaLabel = baseName || mediaTitle;

      let deducedFolderPath = resolved?.folderPath;
      if (!deducedFolderPath) {
        let cleanSrc = media.src.split(/[?#]/)[0].trim();
        try {
          cleanSrc = decodeURIComponent(cleanSrc);
        } catch {}
        cleanSrc = cleanSrc.replace(/\\/g, "/");

        if (!/^(https?:|data:|blob:)/i.test(cleanSrc)) {
          cleanSrc = cleanSrc.replace(/^\/+/, "");
          const attachMatch = cleanSrc.match(/(?:^|\.\.\/|\.\/)*(attachments?(?:\/[^/]+)*)\/[^/]+$/i);
          if (attachMatch) {
            deducedFolderPath = attachMatch[1];
          } else {
            const parts = (note.folderPath || "").split("/").filter(Boolean);
            const srcParts = cleanSrc.split("/").filter(Boolean);
            srcParts.pop();
            for (const seg of srcParts) {
              if (seg === "..") {
                parts.pop();
              } else if (seg !== ".") {
                parts.push(seg);
              }
            }
            deducedFolderPath = parts.length > 0 ? parts.join("/") : undefined;
          }
        }
      }

      if (!mediaNodesMap.has(mediaId)) {
        const nodeSrc = resolved ? resolved.content || resolved.fileName : media.src;
        mediaNodesMap.set(mediaId, {
          id: mediaId,
          title: mediaTitle,
          label: mediaLabel,
          folderPath: deducedFolderPath,
          tags: resolved?.tags,
          degree: 0,
          connectionIds: new Set<string>(),
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          isFavorite: resolved?.isFavorite,
          nodeType: resolvedMediaType,
          imageSrc: nodeSrc,
          mediaSrc: nodeSrc,
        });
      }

      // Edge between markdown note and media node
      const edgeKey = [note.id, mediaId].sort().join("<->");
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: edgeKey,
          source: note.id,
          target: mediaId,
        });

        const sourceNode = nodeMap.get(note.id);
        const mediaNode = mediaNodesMap.get(mediaId);
        if (sourceNode && mediaNode) {
          sourceNode.degree += 1;
          sourceNode.connectionIds.add(mediaId);
          mediaNode.degree += 1;
          mediaNode.connectionIds.add(note.id);
        }
      }
    });
  });

  // Separate connected notes, orphan notes, and media nodes for clean layout
  const connectedNodes: GraphNode[] = [];
  const orphanNotes: GraphNode[] = [];
  const mediaNodes: GraphNode[] = Array.from(mediaNodesMap.values());

  nodeMap.forEach((node) => {
    if (node.degree > 0) connectedNodes.push(node);
    else orphanNotes.push(node);
  });

  // Layout connected notes in central cluster
  connectedNodes.forEach((node, idx) => {
    const count = connectedNodes.length;
    const angle = (idx / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2;
    const radius = count <= 1 ? 0 : Math.min(130 + count * 20, 210);
    node.x = Math.cos(angle) * radius;
    node.y = Math.sin(angle) * radius;
  });

  // Layout connected media nodes around their parent notes
  mediaNodes.forEach((mNode, mIdx) => {
    const parentId = Array.from(mNode.connectionIds)[0];
    const parent = parentId ? nodeMap.get(parentId) : null;
    if (parent) {
      const angle = (mIdx * 1.618) * 2 * Math.PI;
      const dist = 90 + (mIdx % 3) * 20;
      mNode.x = parent.x + Math.cos(angle) * dist;
      mNode.y = parent.y + Math.sin(angle) * dist;
    } else {
      const angle = (mIdx / Math.max(mediaNodes.length, 1)) * 2 * Math.PI;
      mNode.x = Math.cos(angle) * 120;
      mNode.y = Math.sin(angle) * 120;
    }
  });

  // Layout orphan notes comfortably outside the connected cluster
  orphanNotes.forEach((node, idx) => {
    const count = orphanNotes.length;
    const offsetAngle = Math.PI / 4 + (idx / Math.max(count, 1)) * 2 * Math.PI;
    const radius = connectedNodes.length > 0 ? 220 + idx * 25 : Math.min(120 + count * 25, 240);
    node.x = Math.cos(offsetAngle) * radius;
    node.y = Math.sin(offsetAngle) * radius;
  });

  return {
    nodes: [...Array.from(nodeMap.values()), ...mediaNodes],
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
  if (degree <= 0) return 3.12;
  // Scaled smoothly using square root so high-degree nodes grow elegantly without overwhelming the canvas (increased by 20%)
  return Math.min(9.0, 3.12 + Math.sqrt(degree) * 1.14);
}

