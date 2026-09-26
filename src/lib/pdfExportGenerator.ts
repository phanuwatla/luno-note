import { FONT_FAMILY_CSS, type FontFamilyOption, type AppTheme } from "@/hooks/useAppSettings";
import { getTagColorClass } from "@/lib/tagColors";
import { generateQrCodeDataUrl } from "./qrCode";

export interface GeneratePdfHtmlOptions {
  title?: string;
  bodyHtml: string;
  tags?: string[];
  editorFontFamily?: string;
  editorFontSize?: number;
  lineHeight?: string | number;
  theme?: AppTheme;
  accentHeadings?: boolean;
  showCodeLineNumbers?: boolean;
  tagColorStyle?: "multicolor" | "accent";
  customAccentColor?: string;
  customFontsCss?: string;
  lang?: string;
}

export interface InlineImagesOptions {
  readImageDataUrl?: (fullPath: string) => Promise<string | null>;
  workspacePath?: string;
}

/**
 * Inlines images (including blob: URLs, local workspace files, and QR Codes) to base64 data URLs for PDF export.
 * Guarantees that QR code images with `data-qr-text` are regenerated as high-res PNG data URLs,
 * and forces eager loading so Chromium's PDF renderer paints them reliably.
 */
export async function inlineImagesForPdf(
  html: string,
  options?: InlineImagesOptions
): Promise<string> {
  if (!html || !html.includes("<img")) return html;
  if (typeof DOMParser === "undefined") return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const images = Array.from(doc.querySelectorAll("img"));
    if (images.length === 0) return html;

    await Promise.all(
      images.map(async (img) => {
        // Force eager loading and sync decoding so Chromium does not defer off-screen rendering
        img.removeAttribute("loading");
        img.setAttribute("loading", "eager");
        img.setAttribute("decoding", "sync");

        // QR Code detection: check data-qr-code, data-qr-text, alt, or src
        const isQr =
          img.getAttribute("data-qr-code") === "true" ||
          img.getAttribute("alt") === "QR Code" ||
          Boolean(img.getAttribute("data-qr-text")) ||
          (img.getAttribute("src") || "").includes("qrcode");

        const qrText = img.getAttribute("data-qr-text");
        if (isQr && qrText) {
          const qrColor = img.getAttribute("data-qr-color") || "#000000";
          const qrBg = img.getAttribute("data-qr-bg") || "white";
          const qrLevel = (img.getAttribute("data-qr-level") as any) || "M";
          try {
            const qrDataUrl = await generateQrCodeDataUrl(qrText, {
              foregroundColor: qrColor,
              backgroundColor:
                qrBg === "transparent"
                  ? "transparent"
                  : qrBg === "dark"
                  ? "#09090b"
                  : "#ffffff",
              errorCorrectionLevel: qrLevel,
              size: 600,
              margin: 3,
            });
            img.setAttribute("src", qrDataUrl);
            return;
          } catch (qrErr) {
            console.warn("Failed to generate QR data URL for PDF:", qrErr);
          }
        }

        const src = img.getAttribute("src");
        if (!src || src.startsWith("data:")) return;

        // Blob URL conversion to data URL
        if (src.startsWith("blob:")) {
          try {
            const res = await fetch(src);
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            img.setAttribute("src", dataUrl);
            return;
          } catch (blobErr) {
            console.warn("inlineImagesForPdf blob fetch failed for:", src, blobErr);
          }
        }

        // Relative / local workspace file path via Electron API
        if (options?.readImageDataUrl) {
          try {
            let rel = decodeURIComponent(src);
            while (rel.startsWith("../") || rel.startsWith("./")) {
              rel = rel.replace(/^(\.\.\/|\.\/)/, "");
            }
            const fullPath = options.workspacePath ? `${options.workspacePath}/${rel}` : rel;
            const dataUrl = await options.readImageDataUrl(fullPath);
            if (dataUrl) {
              img.setAttribute("src", dataUrl);
              return;
            }
          } catch (diskErr) {
            console.warn("inlineImagesForPdf disk read failed for:", src, diskErr);
          }
        }

        // Fallback fetch
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.setAttribute("src", dataUrl);
        } catch {
          // Keep existing src if all conversions fail
        }
      })
    );

    return doc.body ? doc.body.innerHTML : html;
  } catch (err) {
    console.warn("inlineImagesForPdf parse error:", err);
    return html;
  }
}

/**
 * Escapes characters for HTML content.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Map theme IDs to their primary accent hex/hsl color for PDF rendering.
 */
const THEME_PRIMARY_COLORS: Record<string, string> = {
  emerald: "#0d9488",
  teal: "#0f766e",
  cyan: "#0891b2",
  sky: "#0284c7",
  blue: "#2563eb",
  indigo: "#4f46e5",
  violet: "#7c3aed",
  lavender: "#8b5cf6",
  fuchsia: "#c026d3",
  rose: "#e11d48",
  ruby: "#dc2626",
  amber: "#d97706",
  yellow: "#ca8a04",
  lime: "#65a30d",
  green: "#16a34a",
  slate: "#475569",
};

/**
 * Resolves the primary theme color.
 */
function getPrimaryColor(theme?: string, customAccentColor?: string): string {
  if (customAccentColor && customAccentColor.trim()) {
    return customAccentColor.trim();
  }
  if (theme && THEME_PRIMARY_COLORS[theme]) {
    return THEME_PRIMARY_COLORS[theme];
  }
  return "#0d9488"; // Default emerald
}

/**
 * Converts unwrapped inline hashtags (#tag) in HTML text nodes into styled `.inline-tag-badge` spans.
 * Preserves existing `.inline-tag-badge` elements and skips `<pre>`, `<code>`, `<a>`, `<script>`, `<style>`.
 */
export function formatInlineTagsInHtml(
  html: string,
  theme: AppTheme = "emerald",
  tagColorStyle: "multicolor" | "accent" = "multicolor",
  customAccentColor?: string
): string {
  if (!html || !html.includes("#")) return html;

  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
      const root = doc.body.firstElementChild || doc.body;

      const inlineTagRegex = /(?:^|[\s(\[{])#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n]|$)/g;

      const walk = (node: Node) => {
        const children = Array.from(node.childNodes);
        for (const child of children) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (
              tag === "pre" ||
              tag === "code" ||
              tag === "a" ||
              tag === "script" ||
              tag === "style" ||
              el.classList?.contains("inline-tag-badge") ||
              el.classList?.contains("note-tag-badge")
            ) {
              continue;
            }
            walk(child);
          } else if (child.nodeType === Node.TEXT_NODE) {
            const text = child.nodeValue || "";
            inlineTagRegex.lastIndex = 0;
            if (inlineTagRegex.test(text)) {
              const frag = doc.createDocumentFragment();
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
                  frag.appendChild(doc.createTextNode(text.slice(lastIndex, matchStart)));
                }

                const badge = doc.createElement("span");
                const colorClass = getTagColorClass(rawTag, theme, undefined, tagColorStyle, customAccentColor);
                badge.className = `inline-tag-badge border ${colorClass}`;
                badge.textContent = `#${rawTag}`;
                frag.appendChild(badge);

                lastIndex = matchEnd;
              }
              if (lastIndex < text.length) {
                frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
              }
              child.replaceWith(frag);
            }
          }
        }
      };

      walk(root);
      return root.innerHTML;
    } catch {
      // Fall through to regex
    }
  }

  return html.replace(
    /(<code[\s\S]*?<\/code>|<pre[\s\S]*?<\/pre>|<a[\s\S]*?<\/a>|<span class="[^"]*inline-tag-badge[\s\S]*?<\/span>)|(?:^|(?<=[\s(\[{]))#([a-zA-Z\u0E00-\u0E7F0-9_\-\/]+)(?=[\s)\]},.!?:;\r\n]|$)/g,
    (m, protectedBlock, tag) => {
      if (protectedBlock) return protectedBlock;
      if (!tag || /^\d+$/.test(tag)) return m;
      const colorClass = getTagColorClass(tag, theme, undefined, tagColorStyle, customAccentColor);
      return `<span class="inline-tag-badge border ${colorClass}">#${tag}</span>`;
    }
  );
}

/**
 * Generates an HTML document structured and styled to display 100% identical to the Editor.
 */
export function generatePdfHtml(options: GeneratePdfHtmlOptions): string {
  const {
    title,
    bodyHtml,
    tags,
    editorFontFamily = "inter",
    editorFontSize = 15,
    lineHeight = "1.6",
    theme = "emerald",
    accentHeadings = false,
    showCodeLineNumbers = false,
    tagColorStyle = "multicolor",
    customAccentColor,
    customFontsCss = "",
    lang = "th",
  } = options;

  const docTitle = title?.trim() || "Untitled";
  const primaryColor = getPrimaryColor(theme, customAccentColor);

  // Resolve CSS font-family string
  const resolvedFontFamily =
    FONT_FAMILY_CSS[editorFontFamily as FontFamilyOption] ||
    `'${editorFontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif`;

  const parsedFontSize = typeof editorFontSize === "number" ? editorFontSize : 15;
  const parsedLineHeight = typeof lineHeight === "number" ? lineHeight : parseFloat(String(lineHeight)) || 1.6;

  // Format any unwrapped inline hashtags into styled badges matching the Editor
  const formattedBodyHtml = formatInlineTagsInHtml(bodyHtml, theme, tagColorStyle, customAccentColor);

  // Determine if content already has an <h1> at the top
  const hasH1 = /^\s*(?:<div[^>]*>)?\s*<h1[^>]*>/i.test(formattedBodyHtml.trim());
  const titleHeader = !hasH1 && docTitle ? `<h1 class="doc-title">${escapeHtml(docTitle)}</h1>` : "";

  // Render tag badges at top if present
  let tagsHeader = "";
  if (tags && Array.isArray(tags) && tags.length > 0) {
    const badgesHtml = tags
      .map((tag, idx) => {
        const tagClass = getTagColorClass(tag, theme, idx, tagColorStyle, customAccentColor);
        return `<span class="note-tag-badge ${tagClass}">#${escapeHtml(tag)}</span>`;
      })
      .join("");
    tagsHeader = `<div class="note-tags-header">${badgesHtml}</div>`;
  }

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)}</title>
  <!-- Google Fonts for complete Thai and English typography parity -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Chonburi&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Itim&family=JetBrains+Mono:wght@400;500&family=Kanit:wght@400;500;600;700&family=Krona+One&family=Mali:wght@400;500;600;700&family=Mitr:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=Noto+Serif+Thai:wght@400;500;600;700&family=Prompt:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&family=Sriracha&display=swap" rel="stylesheet">

  <style>
    /* Custom Fonts registered by the user */
    ${customFontsCss}

    :root {
      --primary: ${primaryColor};
      --primary-foreground: #ffffff;
      --foreground: #0f172a;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --border: #e2e8f0;
      --card: #ffffff;
      --editor-font-family: ${resolvedFontFamily};
      --editor-font-size: ${parsedFontSize}px;
      --editor-line-height: ${parsedLineHeight};
    }

    @page {
      size: A4;
      margin: 12mm 15mm 15mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      content-visibility: visible !important;
    }

    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: var(--foreground);
      font-family: var(--editor-font-family);
      font-size: var(--editor-font-size);
      line-height: var(--editor-line-height);
      text-rendering: optimizeLegibility;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }

    .pdf-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    /* Note Tags Header */
    .note-tags-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-bottom: 16px;
    }

    .note-tag-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.4;
      border: 1px solid var(--border);
      background-color: var(--muted);
      color: var(--primary);
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--editor-font-family);
      font-weight: 600;
      line-height: 1.3;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1, .doc-title, h1:first-child {
      font-size: 1.85rem;
      margin-top: 1.2em;
      margin-bottom: 0.6em;
      color: ${accentHeadings ? "var(--primary)" : "var(--foreground)"};
    }

    .doc-title, h1:first-of-type {
      margin-top: 0;
      margin-bottom: 1.2rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid var(--border);
    }

    h2 {
      font-size: 1.45rem;
      margin-top: 1.2em;
      margin-bottom: 0.4em;
      color: ${accentHeadings ? "var(--primary)" : "var(--foreground)"};
    }

    h3 {
      font-size: 1.25rem;
      margin-top: 1em;
      margin-bottom: 0.35em;
      color: ${accentHeadings ? "var(--primary)" : "var(--foreground)"};
    }

    h4 {
      font-size: 1.1rem;
      margin-top: 0.85em;
      margin-bottom: 0.3em;
      color: ${accentHeadings ? "var(--primary)" : "var(--foreground)"};
    }

    h5 {
      font-size: 0.95rem;
      margin-top: 0.75em;
      margin-bottom: 0.25em;
      color: ${accentHeadings ? "var(--primary)" : "var(--foreground)"};
    }

    h6 {
      font-size: 0.85rem;
      margin-top: 0.7em;
      margin-bottom: 0.2em;
      color: var(--muted-foreground);
    }

    /* Paragraphs and Text Elements */
    p {
      margin-top: 0.35em;
      margin-bottom: 0.35em;
      line-height: inherit;
    }

    p:empty, p.is-empty {
      min-height: 1.2em;
    }

    /* Bold, Italic, Underline, Strikethrough */
    strong, b { font-weight: 600; }
    em, i { font-style: italic; }
    u { text-decoration: underline; text-underline-offset: 3px; }
    s, del { text-decoration: line-through; }
    sup { font-size: 0.75em; line-height: 0; vertical-align: super; }
    sub { font-size: 0.75em; line-height: 0; vertical-align: sub; }

    /* Links & Wikilinks */
    a {
      color: var(--primary);
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* Highlights & Marks */
    mark, .luno-highlight {
      background-color: rgba(250, 204, 21, 0.45) !important;
      color: inherit;
      padding: 0.1em 0.3em;
      border-radius: 4px;
    }

    /* Inline Code */
    code:not(pre code) {
      background-color: #f1f5f9 !important;
      border: 1px solid #e2e8f0;
      color: #0f172a;
      padding: 0.15rem 0.38rem;
      border-radius: 5px;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 0.88em;
    }

    /* Code Blocks */
    .code-block-wrapper, pre {
      background-color: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px;
      margin: 1.2em 0;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .code-block-wrapper {
      display: block;
    }

    /* Code Block Header (Language indicator) */
    .code-block-wrapper > div:first-child {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 14px 4px 14px;
      background-color: #f1f5f9 !important;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: capitalize;
    }

    /* Code Block Code Area */
    .code-block-wrapper pre,
    pre {
      margin: 0 !important;
      padding: 10px 14px !important;
      background: transparent !important;
      border: none !important;
      border-radius: 0 !important;
      overflow-x: auto;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace !important;
      font-size: 13px !important;
      line-height: 22px !important;
      color: #1e293b;
    }

    pre code,
    .code-block-wrapper code {
      background-color: transparent !important;
      border: none !important;
      padding: 0 !important;
      border-radius: 0 !important;
      color: inherit !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
    }

    /* Line Numbers in Code Block */
    .code-line-numbers {
      display: flex;
      flex-direction: column;
      user-select: none;
      padding-right: 10px;
      text-align: right;
      color: #94a3b8;
      border-right: 1px solid #e2e8f0;
      margin-right: 12px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 13px;
      line-height: 22px;
    }

    /* Syntax Highlighting Colors (Matching Editor Light Theme) */
    .hljs-keyword, .hljs-selector-tag, .hljs-subst {
      color: #9333ea !important; /* Purple */
      font-weight: 600;
    }
    .hljs-string, .hljs-title.class_, .hljs-section, .hljs-type, .hljs-addition {
      color: #059669 !important; /* Emerald */
    }
    .hljs-title, .hljs-title.function_, .hljs-name {
      color: #2563eb !important; /* Blue */
      font-weight: 600;
    }
    .hljs-built_in {
      color: #0284c7 !important; /* Sky Blue */
    }
    .hljs-variable, .hljs-attr, .hljs-attribute, .hljs-property {
      color: #475569 !important; /* Slate */
    }
    .hljs-comment, .hljs-quote, .hljs-meta {
      color: #94a3b8 !important; /* Muted gray italic */
      font-style: italic;
    }
    .hljs-number, .hljs-symbol, .hljs-bullet, .hljs-literal, .hljs-link {
      color: #d97706 !important; /* Amber */
    }
    .hljs-punctuation, .hljs-operator {
      color: #64748b !important;
    }

    /* Task Lists (Checklists) */
    ul[data-type="taskList"] {
      list-style: none !important;
      padding-left: 0 !important;
      margin: 0.4em 0 !important;
    }

    ul[data-type="taskList"] li,
    li[data-type="taskItem"] {
      display: flex !important;
      align-items: flex-start !important;
      gap: 8px !important;
      margin: 0.25em 0 !important;
      list-style-type: none !important;
    }

    ul[data-type="taskList"] li label,
    li[data-type="taskItem"] label {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: 3px !important;
      width: 16px !important;
      height: 16px !important;
      flex-shrink: 0 !important;
      cursor: default !important;
    }

    ul[data-type="taskList"] li label input[type="checkbox"],
    li[data-type="taskItem"] input[type="checkbox"] {
      -webkit-appearance: none !important;
      appearance: none !important;
      margin: 0 !important;
      width: 15px !important;
      height: 15px !important;
      border-radius: 4px !important;
      border: 1.5px solid #94a3b8 !important;
      background-color: transparent !important;
      outline: none !important;
    }

    ul[data-type="taskList"] li[data-checked="true"] label input[type="checkbox"],
    li[data-type="taskItem"][data-checked="true"] input[type="checkbox"],
    ul[data-type="taskList"] li label input[type="checkbox"]:checked,
    li[data-type="taskItem"] input[type="checkbox"]:checked {
      background-color: var(--primary) !important;
      border-color: var(--primary) !important;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3.5 8.5 6.5 11.5 12.5 4.5"/></svg>') !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
    }

    ul[data-type="taskList"] li[data-checked="true"] > div > p,
    li[data-type="taskItem"][data-checked="true"] > div > p {
      text-decoration: line-through !important;
      color: #94a3b8 !important;
    }

    ul[data-type="taskList"] li > div,
    li[data-type="taskItem"] > div {
      flex: 1 1 auto !important;
    }

    ul[data-type="taskList"] li > div p,
    li[data-type="taskItem"] > div p {
      margin: 0 !important;
    }

    /* Regular Lists */
    ul:not([data-type="taskList"]), ol {
      margin: 0.4em 0;
      padding-left: 1.6em;
    }

    li {
      margin: 0.15em 0;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid var(--primary) !important;
      background: #f8fafc !important;
      color: #475569;
      margin: 1em 0;
      padding: 0.6em 1em;
      border-radius: 0 8px 8px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote p {
      margin: 0.2em 0;
    }

    /* Tables */
    .tableWrapper, table {
      border-collapse: collapse !important;
      width: 100% !important;
      margin: 1.2em 0 !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1 !important;
      padding: 8px 12px !important;
      text-align: left;
      vertical-align: top;
      font-size: 0.95em;
    }

    th {
      background-color: #f1f5f9 !important;
      font-weight: 600;
      color: #0f172a;
    }

    td p, th p {
      margin: 0 !important;
    }

    /* NodeView & Image Containers: prevent Chromium from skipping off-screen render */
    [data-node-view-wrapper],
    .node-image,
    .react-renderer {
      content-visibility: visible !important;
      contain: none !important;
      transform: none !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Images & QR Codes */
    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin: 0.8em 0;
      object-fit: contain;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      break-inside: avoid;
      content-visibility: visible !important;
      display: inline-block;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 1.8em 0;
    }

    /* Hide any leftover UI action buttons, resize cursors, etc. */
    button,
    [role="button"],
    .column-resize-handle,
    .prosemirror-dropcursor,
    [data-resize-handle],
    .table-resize-handle,
    .table-column-handle,
    .table-row-handle,
    .cursor-se-resize,
    [title*="resize"],
    .node-image .absolute {
      display: none !important;
    }

    /* Tags and Inline Hashtag Badges */
    .border {
      border-width: 1px !important;
      border-style: solid !important;
    }

    .inline-tag-badge {
      display: inline-flex !important;
      align-items: center !important;
      border-radius: 0.375rem !important;
      padding: 0.05rem 0.4rem !important;
      font-size: 0.85em !important;
      font-weight: 500 !important;
      line-height: 1.25 !important;
      margin: 0 0.15rem !important;
      vertical-align: baseline !important;
      border-width: 1px !important;
      border-style: solid !important;
      box-decoration-break: clone !important;
      -webkit-box-decoration-break: clone !important;
    }

    .note-tags-header {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      margin-bottom: 14px !important;
    }

    .note-tag-badge {
      display: inline-flex !important;
      align-items: center !important;
      border-radius: 0.375rem !important;
      padding: 0.15rem 0.5rem !important;
      font-size: 0.8em !important;
      font-weight: 500 !important;
      border-width: 1px !important;
      border-style: solid !important;
    }

    /* Tag Color Palette Utility Classes */
    .bg-cyan-500\\/15 { background-color: rgba(6, 182, 212, 0.15) !important; }
    .text-cyan-700 { color: #0e7490 !important; }
    .border-cyan-500\\/30 { border-color: rgba(6, 182, 212, 0.30) !important; }

    .bg-lime-500\\/15 { background-color: rgba(132, 204, 22, 0.15) !important; }
    .text-lime-700 { color: #4d7c0f !important; }
    .border-lime-500\\/30 { border-color: rgba(132, 204, 22, 0.30) !important; }

    .bg-lime-600\\/15 { background-color: rgba(101, 163, 13, 0.15) !important; }
    .border-lime-600\\/30 { border-color: rgba(101, 163, 13, 0.30) !important; }

    .bg-green-500\\/15 { background-color: rgba(34, 197, 94, 0.15) !important; }
    .border-green-500\\/30 { border-color: rgba(34, 197, 94, 0.30) !important; }

    .bg-green-600\\/15 { background-color: rgba(22, 163, 74, 0.15) !important; }
    .text-green-700 { color: #15803d !important; }
    .border-green-600\\/30 { border-color: rgba(22, 163, 74, 0.30) !important; }

    .bg-emerald-500\\/15 { background-color: rgba(16, 185, 129, 0.15) !important; }
    .border-emerald-500\\/30 { border-color: rgba(16, 185, 129, 0.30) !important; }

    .bg-emerald-600\\/15 { background-color: rgba(5, 150, 105, 0.15) !important; }
    .text-emerald-700 { color: #047857 !important; }
    .border-emerald-600\\/30 { border-color: rgba(5, 150, 105, 0.30) !important; }

    .bg-teal-500\\/15 { background-color: rgba(20, 184, 166, 0.15) !important; }
    .border-teal-500\\/30 { border-color: rgba(20, 184, 166, 0.30) !important; }

    .bg-teal-600\\/15 { background-color: rgba(13, 148, 136, 0.15) !important; }
    .text-teal-700 { color: #0f766e !important; }
    .border-teal-600\\/30 { border-color: rgba(13, 148, 136, 0.30) !important; }

    .bg-sky-500\\/15 { background-color: rgba(14, 165, 233, 0.15) !important; }
    .border-sky-500\\/30 { border-color: rgba(14, 165, 233, 0.30) !important; }

    .bg-sky-600\\/15 { background-color: rgba(2, 132, 199, 0.15) !important; }
    .text-sky-700 { color: #0369a1 !important; }
    .border-sky-600\\/30 { border-color: rgba(2, 132, 199, 0.30) !important; }

    .bg-blue-500\\/15 { background-color: rgba(59, 130, 246, 0.15) !important; }
    .border-blue-500\\/30 { border-color: rgba(59, 130, 246, 0.30) !important; }

    .bg-blue-600\\/15 { background-color: rgba(37, 99, 235, 0.15) !important; }
    .text-blue-700 { color: #1d4ed8 !important; }
    .border-blue-600\\/30 { border-color: rgba(37, 99, 235, 0.30) !important; }

    .bg-indigo-500\\/15 { background-color: rgba(99, 102, 241, 0.15) !important; }
    .border-indigo-500\\/30 { border-color: rgba(99, 102, 241, 0.30) !important; }

    .bg-indigo-600\\/15 { background-color: rgba(79, 70, 229, 0.15) !important; }
    .text-indigo-700 { color: #4338ca !important; }
    .border-indigo-600\\/30 { border-color: rgba(79, 70, 229, 0.30) !important; }

    .bg-violet-500\\/15 { background-color: rgba(139, 92, 246, 0.15) !important; }
    .border-violet-500\\/30 { border-color: rgba(139, 92, 246, 0.30) !important; }

    .bg-violet-600\\/15 { background-color: rgba(124, 58, 237, 0.15) !important; }
    .text-violet-700 { color: #6d28d9 !important; }
    .border-violet-600\\/30 { border-color: rgba(124, 58, 237, 0.30) !important; }

    .bg-purple-500\\/15 { background-color: rgba(168, 85, 247, 0.15) !important; }
    .border-purple-500\\/30 { border-color: rgba(168, 85, 247, 0.30) !important; }

    .bg-purple-600\\/15 { background-color: rgba(147, 51, 234, 0.15) !important; }
    .text-purple-700 { color: #7e22ce !important; }
    .border-purple-600\\/30 { border-color: rgba(147, 51, 234, 0.30) !important; }

    .bg-fuchsia-500\\/15 { background-color: rgba(217, 70, 239, 0.15) !important; }
    .border-fuchsia-500\\/30 { border-color: rgba(217, 70, 239, 0.30) !important; }

    .bg-fuchsia-600\\/15 { background-color: rgba(192, 38, 211, 0.15) !important; }
    .text-fuchsia-700 { color: #a21caf !important; }
    .border-fuchsia-600\\/30 { border-color: rgba(192, 38, 211, 0.30) !important; }

    .bg-pink-500\\/15 { background-color: rgba(236, 72, 153, 0.15) !important; }
    .border-pink-500\\/30 { border-color: rgba(236, 72, 153, 0.30) !important; }

    .bg-pink-600\\/15 { background-color: rgba(219, 39, 119, 0.15) !important; }
    .text-pink-700 { color: #be185d !important; }
    .border-pink-600\\/30 { border-color: rgba(219, 39, 119, 0.30) !important; }

    .bg-rose-500\\/15 { background-color: rgba(244, 63, 94, 0.15) !important; }
    .border-rose-500\\/30 { border-color: rgba(244, 63, 94, 0.30) !important; }

    .bg-rose-600\\/15 { background-color: rgba(225, 29, 72, 0.15) !important; }
    .text-rose-700 { color: #be123c !important; }
    .border-rose-600\\/30 { border-color: rgba(225, 29, 72, 0.30) !important; }

    .bg-red-500\\/15 { background-color: rgba(239, 68, 68, 0.15) !important; }
    .border-red-500\\/30 { border-color: rgba(239, 68, 68, 0.30) !important; }

    .bg-red-600\\/15 { background-color: rgba(220, 38, 38, 0.15) !important; }
    .text-red-700 { color: #b91c1c !important; }
    .border-red-600\\/30 { border-color: rgba(220, 38, 38, 0.30) !important; }

    .bg-red-700\\/15 { background-color: rgba(185, 28, 28, 0.15) !important; }
    .text-red-800 { color: #991b1b !important; }
    .border-red-700\\/30 { border-color: rgba(185, 28, 28, 0.30) !important; }

    .bg-orange-500\\/15 { background-color: rgba(249, 115, 22, 0.15) !important; }
    .text-orange-700 { color: #c2410c !important; }
    .border-orange-500\\/30 { border-color: rgba(249, 115, 22, 0.30) !important; }

    .bg-amber-500\\/15 { background-color: rgba(245, 158, 11, 0.15) !important; }
    .border-amber-500\\/30 { border-color: rgba(245, 158, 11, 0.30) !important; }

    .bg-amber-600\\/15 { background-color: rgba(217, 119, 6, 0.15) !important; }
    .text-amber-700 { color: #b45309 !important; }
    .border-amber-600\\/30 { border-color: rgba(217, 119, 6, 0.30) !important; }

    .bg-yellow-500\\/15 { background-color: rgba(234, 179, 8, 0.15) !important; }
    .text-yellow-700 { color: #a16207 !important; }
    .border-yellow-500\\/30 { border-color: rgba(234, 179, 8, 0.30) !important; }

    .bg-zinc-500\\/15 { background-color: rgba(113, 113, 122, 0.15) !important; }
    .text-zinc-700 { color: #3f3f46 !important; }
    .border-zinc-500\\/30 { border-color: rgba(113, 113, 122, 0.30) !important; }

    .bg-neutral-500\\/15 { background-color: rgba(115, 115, 115, 0.15) !important; }
    .text-neutral-700 { color: #404040 !important; }
    .border-neutral-500\\/30 { border-color: rgba(115, 115, 115, 0.30) !important; }

    .bg-\\[hsl\\(var\\(--accent\\)\\)\\]\\/15 { background-color: ${primaryColor}26 !important; }
    .text-\\[hsl\\(var\\(--accent\\)\\)\\] { color: ${primaryColor} !important; }
    .border-\\[hsl\\(var\\(--accent\\)\\)\\]\\/25 { border-color: ${primaryColor}40 !important; }
  </style>
</head>
<body>
  <div class="pdf-container">
    ${tagsHeader}
    ${titleHeader}
    ${formattedBodyHtml}
  </div>
</body>
</html>`;
}
