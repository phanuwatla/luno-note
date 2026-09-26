import { type AppTheme } from "@/hooks/useAppSettings";
import { getTagColorClass } from "@/lib/tagColors";
import { escapeHtml, formatInlineTagsInHtml } from "./pdfExportGenerator";

export interface GenerateDocHtmlOptions {
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
  lang?: string;
}

/**
 * Word-optimized font family fallbacks ensuring crystal clear Thai and Latin rendering.
 */
const WORD_FONT_FAMILY_MAP: Record<string, { css: string; msoAscii: string; msoBidi: string }> = {
  inter: {
    css: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Leelawadee UI', 'Tahoma', sans-serif",
    msoAscii: "Inter",
    msoBidi: "Leelawadee UI",
  },
  sarabun: {
    css: "'Sarabun', 'TH Sarabun New', 'Cordia New', 'Angsana New', 'Leelawadee UI', 'Tahoma', sans-serif",
    msoAscii: "Sarabun",
    msoBidi: "TH Sarabun New",
  },
  prompt: {
    css: "'Prompt', 'Leelawadee UI', 'Segoe UI', 'Tahoma', sans-serif",
    msoAscii: "Prompt",
    msoBidi: "Leelawadee UI",
  },
  "ibm-plex-thai": {
    css: "'IBM Plex Sans Thai', 'Leelawadee UI', 'Tahoma', 'Segoe UI', sans-serif",
    msoAscii: "IBM Plex Sans Thai",
    msoBidi: "Leelawadee UI",
  },
  "noto-sans-thai": {
    css: "'Noto Sans Thai', 'Leelawadee UI', 'Tahoma', sans-serif",
    msoAscii: "Noto Sans Thai",
    msoBidi: "Noto Sans Thai",
  },
  "jetbrains-mono": {
    css: "'JetBrains Mono', 'Consolas', 'Courier New', monospace",
    msoAscii: "Consolas",
    msoBidi: "Consolas",
  },
  kanit: {
    css: "'Kanit', 'Leelawadee UI', 'Tahoma', sans-serif",
    msoAscii: "Kanit",
    msoBidi: "Leelawadee UI",
  },
  mitr: {
    css: "'Mitr', 'Leelawadee UI', 'Tahoma', sans-serif",
    msoAscii: "Mitr",
    msoBidi: "Leelawadee UI",
  },
  mali: {
    css: "'Mali', 'Leelawadee UI', 'Tahoma', sans-serif",
    msoAscii: "Mali",
    msoBidi: "Leelawadee UI",
  },
  itim: {
    css: "'Itim', 'Leelawadee UI', 'Tahoma', sans-serif",
    msoAscii: "Itim",
    msoBidi: "Leelawadee UI",
  },
  chonburi: {
    css: "'Chonburi', 'TH Sarabun New', 'Tahoma', serif",
    msoAscii: "Chonburi",
    msoBidi: "TH Sarabun New",
  },
  "noto-serif-thai": {
    css: "'Noto Serif Thai', 'TH Sarabun New', 'Cordia New', serif",
    msoAscii: "Noto Serif Thai",
    msoBidi: "TH Sarabun New",
  },
  "krona-one": {
    css: "'Krona One', 'Segoe UI', 'Tahoma', sans-serif",
    msoAscii: "Segoe UI",
    msoBidi: "Leelawadee UI",
  },
  "chakra-petch": {
    css: "'Chakra Petch', 'Segoe UI', 'Tahoma', sans-serif",
    msoAscii: "Chakra Petch",
    msoBidi: "Leelawadee UI",
  },
  sriracha: {
    css: "'Sriracha', 'Leelawadee UI', 'Tahoma', cursive",
    msoAscii: "Sriracha",
    msoBidi: "Leelawadee UI",
  },
};

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

function getPrimaryColor(theme?: string, customAccentColor?: string): string {
  if (customAccentColor && customAccentColor.trim()) {
    return customAccentColor.trim();
  }
  if (theme && THEME_PRIMARY_COLORS[theme]) {
    return THEME_PRIMARY_COLORS[theme];
  }
  return "#0d9488";
}

/**
 * Transforms task lists for Microsoft Word so checkboxes render reliably as Unicode checkboxes.
 */
function formatTaskListsForWord(html: string, primaryColor: string): string {
  if (!html || !html.includes("taskList") && !html.includes("taskItem")) return html;

  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
      const root = doc.body.firstElementChild || doc.body;

      const taskItems = root.querySelectorAll('li[data-type="taskItem"], li[data-checked]');
      taskItems.forEach((li) => {
        const isChecked =
          li.getAttribute("data-checked") === "true" ||
          li.querySelector('input[type="checkbox"]:checked') !== null;

        const labelOrCb = li.querySelector("label, input[type='checkbox']");
        if (labelOrCb) {
          const checkSymbol = doc.createElement("span");
          checkSymbol.style.fontFamily = "'Segoe UI Symbol', 'Arial Unicode MS', sans-serif";
          checkSymbol.style.fontSize = "1.15em";
          checkSymbol.style.marginRight = "8px";
          checkSymbol.style.display = "inline-block";
          checkSymbol.style.verticalAlign = "middle";

          if (isChecked) {
            checkSymbol.style.color = primaryColor;
            checkSymbol.textContent = "☑";
          } else {
            checkSymbol.style.color = "#94a3b8";
            checkSymbol.textContent = "☐";
          }
          labelOrCb.replaceWith(checkSymbol);
        }

        if (isChecked) {
          const p = li.querySelector("p");
          if (p) {
            p.style.textDecoration = "line-through";
            p.style.color = "#94a3b8";
          }
        }
      });

      return root.innerHTML;
    } catch {
      // Fall through to regex
    }
  }

  return html;
}

/**
 * Generates an MSO-compliant Word Document (.doc) structured and styled with 100% editor parity.
 */
export function generateDocHtml(options: GenerateDocHtmlOptions): string {
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
    lang = "th",
  } = options;

  const docTitle = title?.trim() || "Untitled";
  const primaryColor = getPrimaryColor(theme, customAccentColor);

  const fontConfig =
    WORD_FONT_FAMILY_MAP[editorFontFamily] || {
      css: `'${editorFontFamily}', 'Leelawadee UI', 'Tahoma', sans-serif`,
      msoAscii: editorFontFamily,
      msoBidi: "Leelawadee UI",
    };

  const parsedFontSize = typeof editorFontSize === "number" ? editorFontSize : 15;
  const parsedLineHeight = typeof lineHeight === "number" ? lineHeight : parseFloat(String(lineHeight)) || 1.6;

  // Format any unwrapped inline hashtags into styled badges
  let processedHtml = formatInlineTagsInHtml(bodyHtml, theme, tagColorStyle, customAccentColor);

  // Format task list checkboxes for Word
  processedHtml = formatTaskListsForWord(processedHtml, primaryColor);

  // Determine if content already has an <h1> at the top
  const hasH1 = /^\s*(?:<div[^>]*>)?\s*<h1[^>]*>/i.test(processedHtml.trim());
  const titleHeader = !hasH1 && docTitle ? `<h1 class="doc-title">${escapeHtml(docTitle)}</h1>` : "";

  // Render tag badges at top if present
  let tagsHeader = "";
  if (tags && Array.isArray(tags) && tags.length > 0) {
    const badgesHtml = tags
      .map((tag, idx) => {
        const tagClass = getTagColorClass(tag, theme, idx, tagColorStyle, customAccentColor);
        return `<span class="note-tag-badge ${tagClass}">#${escapeHtml(tag)}</span>`;
      })
      .join(" ");
    tagsHeader = `<div class="note-tags-header">${badgesHtml}</div>`;
  }

  return `<html xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Luno Note">
  <meta name="Originator" content="Luno Note">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
      <w:AllowPNG/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <title>${escapeHtml(docTitle)}</title>
  <!-- Google Fonts for typography support -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Chonburi&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Itim&family=JetBrains+Mono:wght@400;500&family=Kanit:wght@400;500;600;700&family=Krona+One&family=Mali:wght@400;500;600;700&family=Mitr:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=Noto+Serif+Thai:wght@400;500;600;700&family=Prompt:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&family=Sriracha&display=swap" rel="stylesheet">

  <style>
    /* Page Setup */
    @page Section1 {
      size: 21.0cm 29.7cm; /* A4 */
      margin: 2.54cm 2.54cm 2.54cm 2.54cm; /* Standard 1 inch */
      mso-header-margin: 36.0pt;
      mso-footer-margin: 36.0pt;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }

    body {
      font-family: ${fontConfig.css};
      font-size: ${parsedFontSize}px;
      line-height: ${parsedLineHeight};
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      mso-ascii-font-family: "${fontConfig.msoAscii}";
      mso-hansi-font-family: "${fontConfig.msoAscii}";
      mso-bidi-font-family: "${fontConfig.msoBidi}";
    }

    .doc-container {
      max-width: 100%;
      margin: 0 auto;
    }

    /* Headings */
    h1.doc-title {
      font-size: 22pt;
      font-weight: 700;
      line-height: 1.25;
      margin-top: 0;
      margin-bottom: 12pt;
      padding-bottom: 6pt;
      border-bottom: 1.5pt solid ${primaryColor};
      color: ${primaryColor};
      page-break-after: avoid;
    }

    h1 {
      font-size: 18pt;
      font-weight: 700;
      line-height: 1.3;
      margin-top: 18pt;
      margin-bottom: 6pt;
      color: ${accentHeadings ? primaryColor : "#0f172a"};
      page-break-after: avoid;
    }

    h2 {
      font-size: 15pt;
      font-weight: 600;
      line-height: 1.35;
      margin-top: 15pt;
      margin-bottom: 5pt;
      color: ${accentHeadings ? primaryColor : "#0f172a"};
      page-break-after: avoid;
    }

    h3 {
      font-size: 13pt;
      font-weight: 600;
      line-height: 1.4;
      margin-top: 12pt;
      margin-bottom: 4pt;
      color: ${accentHeadings ? primaryColor : "#0f172a"};
      page-break-after: avoid;
    }

    h4 {
      font-size: 11pt;
      font-weight: 600;
      margin-top: 10pt;
      margin-bottom: 3pt;
      color: ${accentHeadings ? primaryColor : "#0f172a"};
      page-break-after: avoid;
    }

    h5 {
      font-size: 10pt;
      font-weight: 600;
      margin-top: 8pt;
      margin-bottom: 2pt;
      color: ${accentHeadings ? primaryColor : "#0f172a"};
      page-break-after: avoid;
    }

    h6 {
      font-size: 9pt;
      font-weight: 600;
      margin-top: 6pt;
      margin-bottom: 2pt;
      color: #64748b;
      page-break-after: avoid;
    }

    /* Paragraphs */
    p {
      margin-top: 4pt;
      margin-bottom: 4pt;
      line-height: inherit;
    }

    /* Inline Styling */
    strong, b { font-weight: 600; }
    em, i { font-style: italic; }
    u { text-decoration: underline; }
    s, del { text-decoration: line-through; }
    sup { font-size: 0.75em; vertical-align: super; }
    sub { font-size: 0.75em; vertical-align: sub; }

    /* Links */
    a {
      color: ${primaryColor};
      text-decoration: underline;
    }

    /* Highlights */
    mark, .luno-highlight {
      background-color: #fef08a !important;
      color: #0f172a;
      padding: 1pt 3pt;
      border-radius: 3pt;
    }

    /* Inline Code */
    code:not(pre code) {
      background-color: #f1f5f9;
      border: 1pt solid #e2e8f0;
      color: #0f172a;
      padding: 1pt 3pt;
      border-radius: 3pt;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9.5pt;
    }

    /* Code Blocks */
    .code-block-wrapper, pre {
      background-color: #f8fafc;
      border: 1pt solid #e2e8f0;
      border-radius: 6pt;
      margin: 10pt 0;
      padding: 8pt 12pt;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 10pt;
      line-height: 1.45;
      color: #1e293b;
      page-break-inside: avoid;
    }

    .code-block-wrapper > div:first-child {
      font-size: 8.5pt;
      font-weight: bold;
      color: #64748b;
      border-bottom: 1pt solid #e2e8f0;
      padding-bottom: 4pt;
      margin-bottom: 6pt;
      text-transform: capitalize;
    }

    /* Syntax Highlighting */
    .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #9333ea !important; font-weight: bold; }
    .hljs-string, .hljs-title.class_, .hljs-section, .hljs-type, .hljs-addition { color: #059669 !important; }
    .hljs-title, .hljs-title.function_, .hljs-name { color: #2563eb !important; font-weight: bold; }
    .hljs-built_in { color: #0284c7 !important; }
    .hljs-variable, .hljs-attr, .hljs-attribute, .hljs-property { color: #475569 !important; }
    .hljs-comment, .hljs-quote, .hljs-meta { color: #94a3b8 !important; font-style: italic; }
    .hljs-number, .hljs-symbol, .hljs-bullet, .hljs-literal, .hljs-link { color: #d97706 !important; }
    .hljs-punctuation, .hljs-operator { color: #64748b !important; }

    /* Task Lists */
    ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
      margin: 6pt 0;
    }

    ul[data-type="taskList"] li,
    li[data-type="taskItem"] {
      list-style: none;
      margin: 3pt 0;
      padding-left: 0;
    }

    /* Regular Lists */
    ul:not([data-type="taskList"]), ol {
      margin: 6pt 0;
      padding-left: 20pt;
    }

    li {
      margin: 2pt 0;
    }

    /* Blockquotes */
    blockquote {
      border-left: 3.5pt solid ${primaryColor};
      background-color: #f8fafc;
      color: #475569;
      margin: 8pt 0;
      padding: 6pt 12pt;
      border-radius: 0 4pt 4pt 0;
      page-break-inside: avoid;
    }

    /* Tables */
    .tableWrapper, table {
      border-collapse: collapse;
      width: 100%;
      margin: 10pt 0;
      page-break-inside: avoid;
      border: 1pt solid #cbd5e1;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    th, td {
      border: 1pt solid #cbd5e1;
      padding: 6pt 10pt;
      text-align: left;
      vertical-align: top;
      font-size: 10pt;
    }

    th {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #0f172a;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6pt;
      border: 1pt solid #e2e8f0;
      margin: 6pt 0;
      page-break-inside: avoid;
    }

    /* Horizontal Rules */
    hr {
      border: 0;
      border-top: 1pt solid #e2e8f0;
      margin: 14pt 0;
    }

    /* Tags and Inline Hashtag Badges */
    .border {
      border: 1pt solid #cbd5e1;
    }

    .inline-tag-badge {
      display: inline-block;
      border-radius: 3.5pt;
      padding: 1pt 4.5pt;
      font-size: 9pt;
      font-weight: 500;
      line-height: 1.25;
      margin: 0 1.5pt;
      vertical-align: baseline;
      border: 1pt solid #cbd5e1;
    }

    .note-tags-header {
      margin-bottom: 10pt;
    }

    .note-tag-badge {
      display: inline-block;
      border-radius: 3.5pt;
      padding: 1.5pt 5pt;
      font-size: 9pt;
      font-weight: 500;
      margin-right: 4pt;
      margin-bottom: 4pt;
      border: 1pt solid #cbd5e1;
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
    .text-\\[hsl\\(var\\(--accent\\)\\] { color: ${primaryColor} !important; }
    .border-\\[hsl\\(var\\(--accent\\)\\)\\]\\/25 { border-color: ${primaryColor}40 !important; }

    /* Hide leftover control handles */
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
  </style>
</head>
<body>
  <div class="Section1">
    <div class="doc-container">
      ${tagsHeader}
      ${titleHeader}
      ${processedHtml}
    </div>
  </div>
</body>
</html>`;
}
