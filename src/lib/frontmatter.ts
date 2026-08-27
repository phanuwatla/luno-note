/**
 * Utility functions for parsing and updating YAML Frontmatter and Tags in Markdown files.
 * Designed for full portability and interoperability with Obsidian and standard Markdown tools.
 */

export interface ParsedFrontmatter {
  hasFrontmatter: boolean;
  frontmatterRaw: string;
  frontmatterData: Record<string, any>;
  bodyContent: string;
  frontmatterTags: string[];
  inlineTags: string[];
  allTags: string[];
}

export function isTiptapJson(text: string): boolean {
  if (typeof text !== "string") return false;
  const trimmed = text.trimStart();
  return trimmed.startsWith('{"type":"doc"') || trimmed.includes('{"type":"doc"');
}

export function isMarkdownFileName(fileName?: string, contentFormat?: string, fileType?: string): boolean {
  if (fileType === "image" || fileType === "binary") return false;
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext && ext !== "md" && ext !== "markdown") {
      return false;
    }
    if (fileName.toLowerCase().endsWith(".md") || fileName.toLowerCase().endsWith(".markdown")) {
      return true;
    }
  }
  if (contentFormat) {
    return contentFormat === "markdown";
  }
  return true;
}

export function isMarkdownNote(note?: { fileName?: string; contentFormat?: string; fileType?: string } | null): boolean {
  if (!note) return false;
  return isMarkdownFileName(note.fileName, note.contentFormat, note.fileType);
}

/**
 * Normalizes a single tag:
 * - Trims whitespace
 * - Strips leading '#'
 * - Preserves user casing for display, but uses case-insensitive comparison for deduplication
 */
export function normalizeTag(tag: string): string {
  if (!tag) return "";
  let clean = tag.trim();
  if (clean.startsWith("#")) {
    clean = clean.slice(1).trim();
  }
  return clean;
}

/**
 * Deduplicates tags case-insensitively while maintaining original tag strings.
 */
export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawTag of tags) {
    const norm = normalizeTag(rawTag);
    if (!norm) continue;
    const lower = norm.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(norm);
    }
  }

  return result;
}

/**
 * Extract inline tags (e.g., #project, #web/dev) from Markdown content.
 * Ignores code blocks, inline code, and Markdown headings (# Heading).
 */
export function parseInlineTags(content: string): string[] {
  if (!content) return [];

  // Remove code blocks (```...``` and ~~~...~~~)
  let clean = content.replace(/```[\s\S]*?```/g, "");
  clean = clean.replace(/~~~[\s\S]*?~~~/g, "");
  // Remove HTML <pre>...</pre> and <code>...</code> blocks (e.g. TipTap code blocks)
  clean = clean.replace(/<pre[\s\S]*?<\/pre>/gi, "");
  clean = clean.replace(/<code[\s\S]*?<\/code>/gi, "");
  // Remove inline code (`...`)
  clean = clean.replace(/`[^`\n]+`/g, "");

  // Match #tag, #tag/subtag, #thai_tag
  // Must be followed by whitespace (\s, \r, \n) or boundary punctuation [)\]},.!?:;]
  // This prevents incomplete tags (e.g. #k, #kk while typing) from being extracted until space or punctuation is entered
  const tagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n])/g;

  const found: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(clean)) !== null) {
    const rawTag = match[1];
    // Ignore pure numbers (e.g. #123) unless mixed with letters
    if (!/^\d+$/.test(rawTag)) {
      const norm = normalizeTag(rawTag);
      if (norm) {
        found.push(norm);
      }
    }
  }

  return dedupeTags(found);
}

/**
 * Parses YAML Frontmatter and extracts all tags (Frontmatter + Inline).
 */
export function parseFrontmatterAndTags(markdown: string): ParsedFrontmatter {
  if (!markdown || typeof markdown !== "string") {
    return {
      hasFrontmatter: false,
      frontmatterRaw: "",
      frontmatterData: {},
      bodyContent: markdown || "",
      frontmatterTags: [],
      inlineTags: [],
      allTags: [],
    };
  }

  const trimmed = markdown.trimStart();
  if (!trimmed.startsWith("---")) {
    const inlineTags = parseInlineTags(markdown);
    return {
      hasFrontmatter: false,
      frontmatterRaw: "",
      frontmatterData: {},
      bodyContent: markdown,
      frontmatterTags: [],
      inlineTags,
      allTags: inlineTags,
    };
  }

  // Find closing '---' or '...'
  const match = /^---\r?\n([\s\S]*?)\r?\n(?:---|View-State|\.\.\.)\r?\n?/.exec(trimmed);
  if (!match) {
    const inlineTags = parseInlineTags(markdown);
    return {
      hasFrontmatter: false,
      frontmatterRaw: "",
      frontmatterData: {},
      bodyContent: markdown,
      frontmatterTags: [],
      inlineTags,
      allTags: inlineTags,
    };
  }

  const frontmatterRaw = match[0];
  const frontmatterBody = match[1];
  const bodyContent = trimmed.slice(frontmatterRaw.length);

  const frontmatterData: Record<string, any> = {};
  const frontmatterTags: string[] = [];

  // Parse simple YAML lines
  const lines = frontmatterBody.split(/\r?\n/);
  let currentKey: string | null = null;
  let inTagsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check sequence item '- tag'
    const seqMatch = /^\s*-\s+(.+)$/.exec(line);
    if (seqMatch) {
      const itemVal = seqMatch[1].trim().replace(/^['"]|['"]$/g, "");
      if (inTagsSection && currentKey === "tags") {
        const norm = normalizeTag(itemVal);
        if (norm) frontmatterTags.push(norm);
      } else if (currentKey && Array.isArray(frontmatterData[currentKey])) {
        frontmatterData[currentKey].push(itemVal);
      }
      continue;
    }

    // Check key: value
    const kvMatch = /^([a-zA-Z0-9_\-]+)\s*:\s*(.*)$/.exec(line);
    if (kvMatch) {
      const key = kvMatch[1];
      const valStr = kvMatch[2].trim();
      currentKey = key;

      if (key === "tags") {
        inTagsSection = true;
        if (valStr) {
          // Flow sequence: tags: [a, b, c] or tags: a, b
          if (valStr.startsWith("[") && valStr.endsWith("]")) {
            const inner = valStr.slice(1, -1);
            const items = inner.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
            for (const item of items) {
              const norm = normalizeTag(item);
              if (norm) frontmatterTags.push(norm);
            }
          } else {
            // Comma or space separated string: tags: project, web
            const items = valStr.split(/[,]\s*/).map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
            for (const item of items) {
              const norm = normalizeTag(item);
              if (norm) frontmatterTags.push(norm);
            }
          }
        }
      } else {
        inTagsSection = false;
        if (valStr.startsWith("[") && valStr.endsWith("]")) {
          const inner = valStr.slice(1, -1);
          frontmatterData[key] = inner.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
        } else {
          frontmatterData[key] = valStr.replace(/^['"]|['"]$/g, "");
        }
      }
    }
  }

  frontmatterData.tags = dedupeTags(frontmatterTags);
  const inlineTags = parseInlineTags(bodyContent);
  const allTags = dedupeTags([...frontmatterTags, ...inlineTags]);

  return {
    hasFrontmatter: true,
    frontmatterRaw,
    frontmatterData,
    bodyContent,
    frontmatterTags: frontmatterData.tags,
    inlineTags,
    allTags,
  };
}

/**
 * Updates Frontmatter in Markdown content with new tags list.
 * PRESERVES all other Frontmatter keys, values, and order.
 * Creates Frontmatter block if none exists.
 */
export function updateFrontmatterTags(markdown: string, newTags: string[]): string {
  if (isTiptapJson(markdown)) {
    return markdown;
  }
  const cleanTags = dedupeTags(newTags);
  const parsed = parseFrontmatterAndTags(markdown);

  if (!parsed.hasFrontmatter) {
    if (cleanTags.length === 0) {
      return markdown;
    }
    // Create new Frontmatter block
    const yamlTags = cleanTags.map((t) => `  - ${t}`).join("\n");
    const frontmatter = `---\ntags:\n${yamlTags}\n---\n\n`;
    return frontmatter + (markdown || "");
  }

  // Frontmatter exists: update tags field while preserving all other keys
  const lines = parsed.frontmatterRaw.split(/\r?\n/);
  // Remove top and bottom --- lines
  if (lines[0].startsWith("---")) lines.shift();
  if (lines.length > 0 && (lines[lines.length - 1].startsWith("---") || lines[lines.length - 1].startsWith("..."))) {
    lines.pop();
  }

  const updatedLines: string[] = [];
  let inTags = false;
  let tagsHandled = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kvMatch = /^([a-zA-Z0-9_\-]+)\s*:\s*(.*)$/.exec(line);

    if (kvMatch) {
      const key = kvMatch[1];
      if (key === "tags") {
        inTags = true;
        tagsHandled = true;
        if (cleanTags.length > 0) {
          updatedLines.push("tags:");
          for (const tag of cleanTags) {
            updatedLines.push(`  - ${tag}`);
          }
        }
        continue;
      } else {
        inTags = false;
      }
    } else if (inTags && /^\s*-\s+/.test(line)) {
      // Skip old tag items
      continue;
    }

    if (!inTags) {
      updatedLines.push(line);
    }
  }

  // If tags key was not present in existing Frontmatter, add it
  if (!tagsHandled && cleanTags.length > 0) {
    updatedLines.push("tags:");
    for (const tag of cleanTags) {
      updatedLines.push(`  - ${tag}`);
    }
  }

  const newFrontmatter = `---\n${updatedLines.join("\n")}\n---\n`;
  return newFrontmatter + parsed.bodyContent;
}

/**
 * Renames a tag across Frontmatter and inline body tags in Markdown text.
 */
export function renameTagInMarkdown(markdown: string, oldTag: string, newTag: string): string {
  const normOld = normalizeTag(oldTag);
  const normNew = normalizeTag(newTag);
  if (!normOld || !normNew || normOld.toLowerCase() === normNew.toLowerCase()) {
    return markdown;
  }

  const parsed = parseFrontmatterAndTags(markdown);
  const updatedFrontmatterTags = parsed.frontmatterTags.map((t) =>
    t.toLowerCase() === normOld.toLowerCase() ? normNew : t
  );

  let updatedContent = updateFrontmatterTags(markdown, updatedFrontmatterTags);

  // Replace inline tags in body
  const inlineTagRegex = new RegExp(`(^|[\\s(\\[{])#${escapeRegExp(normOld)}(?=$|[\\s)\\]},.!?:;])`, "gi");
  updatedContent = updatedContent.replace(inlineTagRegex, `$1#${normNew}`);

  return updatedContent;
}

/**
 * Removes a tag from Frontmatter and inline body tags in Markdown text.
 */
export function removeTagFromMarkdown(markdown: string, tagToRemove: string): string {
  const normTarget = normalizeTag(tagToRemove);
  if (!normTarget) return markdown;

  const parsed = parseFrontmatterAndTags(markdown);
  const updatedFrontmatterTags = parsed.frontmatterTags.filter(
    (t) => t.toLowerCase() !== normTarget.toLowerCase()
  );

  let updatedContent = updateFrontmatterTags(markdown, updatedFrontmatterTags);

  // Remove inline tags in body
  const inlineTagRegex = new RegExp(`(^|[\\s(\\[{])#${escapeRegExp(normTarget)}(?=$|[\\s)\\]},.!?:;])`, "gi");
  updatedContent = updatedContent.replace(inlineTagRegex, "$1");

  return updatedContent;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
