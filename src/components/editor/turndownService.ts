import TurndownService from "turndown";
import { escapeHtml } from "@/lib/htmlUtils";

export function createTurndownService(assetBlobUrlMap?: Map<string, string>): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
  });

  // Preserve raw Markdown content without escaping dots after numbers (e.g. ## 8. Ordered Lists) or brackets
  td.escape = (str: string) => str;

  // Serialize empty paragraphs using a placeholder token so Turndown cannot collapse consecutive blank lines
  td.addRule("emptyParagraph", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "P" &&
        !el.textContent?.trim() &&
        !el.querySelector("img, audio, video, input, label") &&
        !el.closest("table, li, blockquote, [data-type='taskItem']")
      );
    },
    replacement: () => "\n<!--luno:blank-->\n",
  });

  // Serialize headings matching Obsidian line structure
  td.addRule("heading", {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: (content, node) => {
      const h = node as HTMLElement;
      const level = Number(h.nodeName.charAt(1)) || 1;
      const align = h.style?.textAlign || h.getAttribute("align");
      const prev = h.previousElementSibling;
      const next = h.nextElementSibling;
      const isPrevNonEmptyBlock = prev && (
        /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(prev.nodeName) ||
        (prev.nodeName === "P" && Boolean(prev.textContent?.trim() || prev.querySelector("img, audio, video, input, label")))
      );
      const isNextNonEmptyBlock = next && (
        /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(next.nodeName) ||
        (next.nodeName === "P" && Boolean(next.textContent?.trim() || next.querySelector("img, audio, video, input, label")))
      );
      const leadingNl = isPrevNonEmptyBlock ? "" : "\n\n";
      const trailingNl = isNextNonEmptyBlock ? "\n" : "\n\n";
      if (align && align !== "left") {
        return `${leadingNl}<h${level} style="text-align: ${align}">\n${content}\n</h${level}>${trailingNl}`;
      }
      const prefix = "#".repeat(level);
      return `${leadingNl}${prefix} ${content}\n`;
    },
  });

  // Serialize normal non-empty paragraphs matching Obsidian line structure
  td.addRule("paragraph", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "P" &&
        Boolean(el.textContent?.trim() || el.querySelector("img, audio, video, input, label")) &&
        !el.closest("table, li, blockquote, [data-type='taskItem']")
      );
    },
    replacement: (content, node) => {
      const el = node as HTMLElement;
      const prev = el.previousElementSibling;
      const next = el.nextElementSibling;
      const isPrevNonEmptyBlock = prev && (
        /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(prev.nodeName) ||
        (prev.nodeName === "P" && Boolean(prev.textContent?.trim() || prev.querySelector("img, audio, video, input, label")))
      );
      const isNextNonEmptyBlock = next && (
        /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(next.nodeName) ||
        (next.nodeName === "P" && Boolean(next.textContent?.trim() || next.querySelector("img, audio, video, input, label")))
      );
      const leadingNl = isPrevNonEmptyBlock ? "" : "\n\n";
      const trailingNl = isNextNonEmptyBlock ? "\n" : "\n\n";
      const rawTag = el.getAttribute("data-raw-tag");
      if (rawTag === "div") {
        return `${leadingNl}<div>\n    ${el.innerHTML}\n</div>${trailingNl}`;
      }
      const style = el.getAttribute("style");
      if (style) {
        return `${leadingNl}<p style="${style}">\n${content}\n</p>${trailingNl}`;
      }
      return `${leadingNl}${content}${trailingNl}`;
    },
  });

  // Serialize lists matching CommonMark block boundaries
  td.addRule("list", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        (el.nodeName === "UL" || el.nodeName === "OL") &&
        !el.classList?.contains("footnotes-list") &&
        !el.closest("section.footnotes, [data-footnotes]")
      );
    },
    replacement: (content, node) => {
      const parent = node.parentNode;
      if (parent && parent.nodeName === "LI") {
        return "\n" + content;
      }
      return `\n${content}\n`;
    },
  });

  // Serialize blockquotes matching Obsidian line structure
  td.addRule("blockquote", {
    filter: "blockquote",
    replacement: (content) => {
      const clean = content.trim().replace(/^/gm, "> ");
      return `\n${clean}\n`;
    },
  });

  // Serialize horizontal rules matching Obsidian line structure
  td.addRule("horizontalRule", {
    filter: "hr",
    replacement: () => `\n---\n`,
  });

  // Register custom inline code rule via td.addRule

  td.addRule("code", {
    filter: (node) => {
      const hasSiblings = node.previousSibling || node.nextSibling;
      const isCodeBlock = node.parentNode && node.parentNode.nodeName === "PRE" && !hasSiblings;
      return node.nodeName === "CODE" && !isCodeBlock;
    },
    replacement: (content) => {
      if (!content.trim()) return "";
      let delimiter = "`";
      const matches = content.match(/`+/gm) || [];
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
      return delimiter + content + delimiter;
    },
  });

  const defaultBlankReplacement = td.rules.blankRule.replacement;
  td.rules.blankRule.replacement = (content, node, options) => {
    const el = node as HTMLElement;
    if (
      el.nodeName === "P" &&
      !el.textContent?.trim() &&
      !el.closest("table, li, blockquote, [data-type='taskItem']")
    ) {
      return "\n<!--luno:blank-->\n";
    }
    return defaultBlankReplacement ? defaultBlankReplacement.call(td.rules.blankRule, content, node, options) : "\n<!--luno:blank-->\n";
  };

  // Convert <u> to <u>text</u> in markdown
  td.addRule("underline", {
    filter: "u",
    replacement: (content) => `<u>${content}</u>`,
  });

  // Convert <mark> or .luno-highlight to ==text== in markdown
  td.addRule("highlight", {
    filter: (node) =>
      node.nodeName.toUpperCase() === "MARK" ||
      (node.nodeName.toUpperCase() === "SPAN" && (node as HTMLElement).classList?.contains("luno-highlight")),
    replacement: (content) => {
      if (!content || !content.trim()) return content;
      const leadingSpace = content.match(/^(\s*)/)?.[1] || "";
      const trailingSpace = content.match(/(\s*)$/)?.[1] || "";
      const trimmed = content.slice(leadingSpace.length, content.length - trailingSpace.length);
      if (!trimmed) return content;
      return `${leadingSpace}==${trimmed}==${trailingSpace}`;
    },
  });

  // Preserve <kbd> in markdown
  td.addRule("kbd", {
    filter: "kbd",
    replacement: (content) => `<kbd>${content}</kbd>`,
  });

  // Convert footnote reference HTML <sup><a href="#fn-1" data-footnote-ref="1">[1]</a></sup> back into [^1]
  td.addRule("footnoteRef", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.getAttribute("data-footnote-ref") !== null ||
        (el.nodeName === "SUP" && Boolean(el.querySelector("[data-footnote-ref]") || /\[\^?[^\]]+\]/.test(el.textContent || ""))) ||
        (el.nodeName === "A" && (el.getAttribute("href") || "").startsWith("#fn-"))
      );
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const ref =
        el.getAttribute("data-footnote-ref") ||
        el.querySelector("[data-footnote-ref]")?.getAttribute("data-footnote-ref") ||
        (el.getAttribute("href") || "").replace(/^#fn-/, "") ||
        el.textContent ||
        "";
      const cleanRef = ref.replace(/[\[\]\^]/g, "").trim();
      return cleanRef ? `[^${cleanRef}]` : "";
    },
  });

  // Convert in-place footnote definition HTML <p id="fn-1" data-footnote-def="1">... back into [^1]: ...
  td.addRule("footnoteDef", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "P" &&
        (el.getAttribute("data-footnote-def") !== null || el.classList?.contains("footnote-def") || /^\s*\[\^[^\]]+\]:/.test(el.textContent || ""))
      );
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const fnId =
        el.getAttribute("data-footnote-def") ||
        (el.getAttribute("id") || "").replace(/^fn-/, "") ||
        "1";
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".footnote-backref, [data-footnote-backref]").forEach((a) => a.remove());
      const rawContent = td.turndown(clone.innerHTML).trim();
      const cleanContent = rawContent.replace(/^\[\^[^\]]+\]:\s*/, "").trim();

      const prev = el.previousElementSibling;
      const isPrevFootnoteDef =
        prev &&
        prev.nodeName === "P" &&
        (prev.getAttribute("data-footnote-def") !== null ||
          prev.classList?.contains("footnote-def") ||
          /^\s*\[\^[^\]]+\]:/.test(prev.textContent || ""));

      return isPrevFootnoteDef ? `[^${fnId}]: ${cleanContent}\n` : `\n\n[^${fnId}]: ${cleanContent}\n`;
    },
  });

  // Ignore reading mode bottom footnotes list items and section so they never write to disk
  td.addRule("readingModeFootnoteItem", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "LI" &&
        (el.classList?.contains("footnote-item") ||
          el.getAttribute("data-footnote-id") !== null ||
          Boolean(el.querySelector("[data-footnote-backref], [data-footnote-target], a[href*='#fnref-']")))
      );
    },
    replacement: () => "",
  });

  td.addRule("footnotesSection", {
    filter: (node) => {
      const el = node as HTMLElement;
      if (
        (el.nodeName === "SECTION" && (el.classList?.contains("footnotes") || el.getAttribute("data-footnotes") !== null)) ||
        (el.nodeName === "DIV" && (el.classList?.contains("footnotes") || el.getAttribute("data-footnotes") !== null))
      ) {
        return true;
      }
      if (el.nodeName === "OL") {
        if (el.classList?.contains("footnotes-list")) return true;
        const allItemsAreFootnotes =
          el.children.length > 0 &&
          Array.from(el.children).every(
            (li) =>
              (li as HTMLElement).classList?.contains("footnote-item") ||
              (li as HTMLElement).getAttribute("data-footnote-id") !== null ||
              Boolean((li as HTMLElement).querySelector("[data-footnote-backref], [data-footnote-target], a[href*='#fnref-']"))
          );
        if (allItemsAreFootnotes) return true;
      }
      return false;
    },
    replacement: () => "",
  });

  td.addRule("footnotesSep", {
    filter: (node) => {
      const el = node as HTMLElement;
      if (el.nodeName !== "HR") return false;
      if (el.classList?.contains("footnotes-sep")) return true;
      let next = el.nextElementSibling;
      while (next && !next.textContent?.trim() && (next.tagName === "P" || next.tagName === "BR")) {
        next = next.nextElementSibling;
      }
      if (
        next &&
        (next.matches?.("section.footnotes, [data-footnotes], ol.footnotes-list") ||
          Boolean(next.querySelector?.("[data-footnote-backref], [data-footnote-target], a[href*='#fnref-']")))
      ) {
        return true;
      }
      return false;
    },
    replacement: () => "",
  });

  // Suppress duplicate standalone footnote backrefs
  td.addRule("footnoteBackref", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.getAttribute("data-footnote-backref") !== null ||
        el.classList?.contains("footnote-backref") ||
        (el.nodeName === "A" && (el.getAttribute("href") || "").startsWith("#fnref-"))
      );
    },
    replacement: () => "",
  });

  // Convert <sup> to <sup>text</sup> in markdown (if not a footnote ref)
  td.addRule("superscript", {
    filter: (node) => node.nodeName === "SUP" && !node.querySelector("[data-footnote-ref]"),
    replacement: (content) => `<sup>${content}</sup>`,
  });

  // Convert <sub> to <sub>text</sub> in markdown
  td.addRule("subscript", {
    filter: "sub",
    replacement: (content) => `<sub>${content}</sub>`,
  });

  // Preserve styled spans (font-family, font-size, color) in markdown
  td.addRule("styledSpan", {
    filter: (node) => {
      if (node.nodeName !== "SPAN") return false;
      const el = node as HTMLElement;
      if (el.classList?.contains("luno-highlight")) return false;
      const style = el.getAttribute("style");
      const color = el.getAttribute("data-color");
      const fontFamily = el.getAttribute("data-font-family");
      const fontSize = el.getAttribute("data-font-size");
      return Boolean(style || color || fontFamily || fontSize);
    },
    replacement: (content, node) => {
      if (!content || !content.trim()) return content;
      const el = node as HTMLElement;
      const style = el.getAttribute("style");
      const color = el.getAttribute("data-color");
      const fontFamily = el.getAttribute("data-font-family");
      const fontSize = el.getAttribute("data-font-size");
      let styleAttr = "";
      if (style) {
        styleAttr = ` style="${style.replace(/"/g, "'").trim()}"`;
      } else {
        const parts: string[] = [];
        if (color) parts.push(`color: ${color.replace(/"/g, "'")}`);
        if (fontFamily) parts.push(`font-family: ${fontFamily.replace(/"/g, "'")}`);
        if (fontSize) parts.push(`font-size: ${fontSize.replace(/"/g, "'")}`);
        if (parts.length) styleAttr = ` style="${parts.join("; ")}"`;
      }
      return `<span${styleAttr}>${content}</span>`;
    },
  });

  // Convert HTML images back to Markdown, preserving relative asset paths and width
  td.addRule("relativeImage", {
    filter: "img",
    replacement: (_content, node) => {
      const img = node as HTMLImageElement;
      const alt = img.getAttribute("alt") || "";
      const title = img.getAttribute("title");
      const rawWidth = img.getAttribute("width") || img.style.width || "";
      const widthMatch = rawWidth ? String(rawWidth).match(/\d+/) : null;
      const width = widthMatch ? widthMatch[0] : "";
      let relSrc = img.getAttribute("data-relative-src") || assetBlobUrlMap?.get(img.src) || img.getAttribute("src") || "";
      if (relSrc && !/^(https?:\/\/|data:|blob:)/i.test(relSrc)) {
        try {
          relSrc = encodeURI(decodeURI(relSrc));
        } catch {
          relSrc = relSrc.replace(/ /g, "%20");
        }
      }
      const titleAttr = title ? ` "${title}"` : "";
      const qrCode = img.getAttribute("data-qr-code");
      const qrText = img.getAttribute("data-qr-text");
      const qrColor = img.getAttribute("data-qr-color");
      const qrBg = img.getAttribute("data-qr-bg");
      const qrLevel = img.getAttribute("data-qr-level");
      const isQr =
        qrCode === "true" ||
        Boolean(qrText) ||
        alt === "QR Code" ||
        alt?.toLowerCase().startsWith("qr code") ||
        (typeof relSrc === "string" && relSrc.toLowerCase().includes("qrcode"));

      let md: string;
      if (isQr) {
        const qrAttrs = [
          `src="${relSrc}"`,
          alt && alt !== "QR Code" ? `alt="${escapeHtml(alt)}"` : `alt="QR Code"`,
          width ? `width="${width}"` : "",
          `data-qr-code="true"`,
          qrText ? `data-qr-text="${escapeHtml(qrText)}"` : "",
          qrColor ? `data-qr-color="${escapeHtml(qrColor)}"` : "",
          qrBg ? `data-qr-bg="${escapeHtml(qrBg)}"` : "",
          qrLevel ? `data-qr-level="${escapeHtml(qrLevel)}"` : "",
        ]
          .filter(Boolean)
          .join(" ");
        md = `<img ${qrAttrs} />`;
      } else if (img.getAttribute("data-wikilink-embed") === "true") {
        // Explicitly entered or loaded as Obsidian Wikilink embed ![[relSrc|width]]
        let decodedRel = relSrc;
        try {
          decodedRel = decodeURIComponent(relSrc);
        } catch { /* ignore */ }
        md = width ? `![[${decodedRel}|${width}]]` : `![[${decodedRel}]]`;
      } else {
        md = width ? `![${alt}|${width}](${relSrc}${titleAttr})` : `![${alt}](${relSrc}${titleAttr})`;
      }
      const parent = img.parentElement;
      const parentTag = parent?.nodeName?.toUpperCase() || "";
      const isStandaloneBlock =
        !parent ||
        parentTag === "X-TURNDOWN" ||
        parentTag === "DIV" ||
        parentTag === "BODY" ||
        parent.classList?.contains("ProseMirror") ||
        (parentTag === "P" && parent.children.length === 1 && !parent.textContent?.trim());

      if (isStandaloneBlock && parentTag !== "P") {
        const prev = img.previousElementSibling;
        const next = img.nextElementSibling;
        const isPrevNonEmptyBlock = prev && (
          /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(prev.nodeName) ||
          (prev.nodeName.toUpperCase() === "P" && Boolean(prev.textContent?.trim() || prev.querySelector("img, audio, video, input, label")))
        );
        const leadingNl = isPrevNonEmptyBlock ? "" : "\n\n";

        const isNextNonEmptyBlock = next && (
          /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(next.nodeName) ||
          (next.nodeName.toUpperCase() === "P" && Boolean(next.textContent?.trim() || next.querySelector("img, audio, video, input, label")))
        );
        const trailingNl = isNextNonEmptyBlock ? "\n" : "\n\n";

        return `${leadingNl}${md}${trailingNl}`;
      }
      return md;
    },
  });

  // Convert HTML audio back to Markdown audio (Obsidian Wikilink embed for local files)
  td.addRule("audio", {
    filter: "audio",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      let src =
        el.getAttribute("data-relative-src") ||
        assetBlobUrlMap?.get(el.getAttribute("src") || "") ||
        el.getAttribute("src") ||
        "";
      if (!src) return "";

      const title = el.getAttribute("data-title") || el.getAttribute("title") || "";

      // If src is a blob: URL and title exists, convert to attachments/title
      if (src.startsWith("blob:") && title && !title.startsWith("blob:")) {
        const ext = title.includes(".") ? "" : ".webm";
        src = `attachments/${title}${ext}`;
      }

      // If src is a data:audio URL and title exists (e.g. from previously recorded/pasted audio),
      // convert to attachments/title
      if (src.startsWith("data:audio/") && title) {
        const ext = title.includes(".") ? "" : ".webm";
        src = `attachments/${title}${ext}`;
      }

      let md = "";
      if (!/^(https?:\/\/|data:|blob:)/i.test(src)) {
        let decodedRel = src;
        try {
          decodedRel = decodeURIComponent(src);
        } catch { /* ignore */ }
        md = `![[${decodedRel}]]`;
      } else {
        const titleAttr = title ? ` data-title="${title.replace(/"/g, "&quot;")}"` : "";
        md = `<audio controls src="${src}"${titleAttr}></audio>`;
      }

      const parent = el.parentElement;
      const parentTag = parent?.nodeName?.toUpperCase() || "";
      const isStandaloneBlock =
        !parent ||
        parentTag === "X-TURNDOWN" ||
        parentTag === "DIV" ||
        parentTag === "BODY" ||
        parent.classList?.contains("ProseMirror") ||
        (parentTag === "P" && parent.children.length === 1 && !parent.textContent?.trim());

      if (isStandaloneBlock && parentTag !== "P") {
        const prev = el.previousElementSibling;
        const next = el.nextElementSibling;
        const isPrevNonEmptyBlock = prev && (
          /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(prev.nodeName) ||
          (prev.nodeName.toUpperCase() === "P" && Boolean(prev.textContent?.trim() || prev.querySelector("img, audio, video, input, label")))
        );
        const leadingNl = isPrevNonEmptyBlock ? "" : "\n\n";

        const isNextNonEmptyBlock = next && (
          /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(next.nodeName) ||
          (next.nodeName.toUpperCase() === "P" && Boolean(next.textContent?.trim() || next.querySelector("img, audio, video, input, label")))
        );
        const trailingNl = isNextNonEmptyBlock ? "\n" : "\n\n";

        return `${leadingNl}${md}${trailingNl}`;
      }
      return md;
    },
  });

  // Convert HTML video back to Markdown video (Obsidian Wikilink embed for local files)
  td.addRule("video", {
    filter: "video",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      let relSrc =
        el.getAttribute("data-relative-src") ||
        assetBlobUrlMap?.get(el.getAttribute("src") || "") ||
        el.getAttribute("src") ||
        "";

      if (!relSrc) return "";

      if (relSrc.startsWith("luno-asset://")) {
        relSrc = decodeURIComponent(relSrc.replace(/^luno-asset:\/\//, ""));
        if (/^\/[a-zA-Z]:[\\/]/.test(relSrc)) relSrc = relSrc.slice(1);
      }

      const rawWidth = el.getAttribute("width") || el.style?.width || "";
      const widthMatch = rawWidth ? String(rawWidth).match(/\d+/) : null;
      const width = widthMatch ? widthMatch[0] : "";

      const title = el.getAttribute("data-title") || el.getAttribute("title") || "";

      if (relSrc.startsWith("blob:") && title && !title.startsWith("blob:")) {
        relSrc = `attachments/${title}`;
      }

      let md = "";
      // Local / relative video attachment: serialize as Obsidian Wikilink embed ![[relSrc|width]]
      if (!/^(https?:\/\/|data:|blob:)/i.test(relSrc)) {
        let decodedRel = relSrc;
        try {
          decodedRel = decodeURIComponent(relSrc);
        } catch { /* ignore */ }
        md = width ? `![[${decodedRel}|${width}]]` : `![[${decodedRel}]]`;
      } else {
        // External web URL: serialize as Markdown link with width or standard video
        md = width ? `![${title || "video"}|${width}](${relSrc})` : `![${title || "video"}](${relSrc})`;
      }

      const parent = el.parentElement;
      const parentTag = parent?.nodeName?.toUpperCase() || "";
      const isStandaloneBlock =
        !parent ||
        parentTag === "X-TURNDOWN" ||
        parentTag === "DIV" ||
        parentTag === "BODY" ||
        parent.classList?.contains("ProseMirror") ||
        (parentTag === "P" && parent.children.length === 1 && !parent.textContent?.trim());

      if (isStandaloneBlock && parentTag !== "P") {
        const prev = el.previousElementSibling;
        const next = el.nextElementSibling;
        const isPrevNonEmptyBlock = prev && (
          /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(prev.nodeName) ||
          (prev.nodeName.toUpperCase() === "P" && Boolean(prev.textContent?.trim() || prev.querySelector("img, audio, video, input, label")))
        );
        const leadingNl = isPrevNonEmptyBlock ? "" : "\n\n";

        const isNextNonEmptyBlock = next && (
          /^H[1-6]|IMG|AUDIO|VIDEO|HR|UL|OL|TABLE|BLOCKQUOTE$/i.test(next.nodeName) ||
          (next.nodeName.toUpperCase() === "P" && Boolean(next.textContent?.trim() || next.querySelector("img, audio, video, input, label")))
        );
        const trailingNl = isNextNonEmptyBlock ? "\n" : "\n\n";

        return `${leadingNl}${md}${trailingNl}`;
      }
      return md;
    },
  });

  // Convert Wikilinks (<a href="wikilink:..." data-wikilink="...">) back into standard [[Target]] or [[Target|Alias]]
  td.addRule("wikilink", {
    filter: (node) => {
      if (node.nodeName !== "A") return false;
      const href = (node.getAttribute("href") || "").trim();
      const dataWiki = node.getAttribute("data-wikilink");
      return Boolean(dataWiki) || href.startsWith("wikilink:");
    },
    replacement: (content, node) => {
      const rawTarget =
        node.getAttribute("data-wikilink") ||
        decodeURIComponent((node.getAttribute("href") || "").replace(/^wikilink:/, ""));
      const target = rawTarget.trim();
      const text = (content || node.textContent || "").trim();
      if (!target) return text;
      if (!text || text === target) {
        return `[[${target}]]`;
      }
      return `[[${target}|${text}]]`;
    },
  });

  // Clean list item formatting to prevent loose lists with blank lines and broken indentation
  td.addRule("cleanListItem", {
    filter: (node) => {
      const el = node as HTMLElement;
      return (
        el.nodeName === "LI" &&
        el.getAttribute("data-type") !== "taskItem" &&
        !el.classList?.contains("footnote-item") &&
        el.getAttribute("data-footnote-id") === null
      );
    },
    replacement: (content, node, options) => {
      const cleanContent = content
        .replace(/^\n+/, "")
        .replace(/\n+$/, "")
        .replace(/\n/gm, "\n    ");

      const parent = node.parentNode;
      const isOrdered = parent && parent.nodeName === "OL";
      let prefix = options.bulletListMarker + " ";
      if (isOrdered) {
        const start = (parent as HTMLElement).getAttribute("start");
        const index = Array.from((parent as HTMLElement).children).filter((c) => (c as HTMLElement).nodeName === "LI").indexOf(node as HTMLElement) + 1;
        prefix = (start ? Number(start) + index - 1 : index) + ". ";
      }
      return (
        prefix + cleanContent + (node.nextSibling && !/\n$/.test(cleanContent) ? "\n" : "")
      );
    },
  });

  // Prevent Turndown built-in inline `code`, `span`, and other element rules from processing children inside <pre> and splitting code blocks
  td.addRule("insidePreCode", {
    filter: (node) => {
      let curr: Node | null = node.parentNode;
      while (curr) {
        if (curr.nodeName === "PRE" || (curr.nodeName === "DIV" && (curr as HTMLElement).classList.contains("code-block-wrapper"))) return true;
        curr = curr.parentNode;
      }
      return false;
    },
    replacement: (_content, node) => node.textContent || "",
  });

  // Preserve fenced code blocks when converting HTML to Markdown for disk, intercepting .code-block-wrapper cleanly
  td.addRule("fencedCodeBlock", {
    filter: (node) => {
      if (node.nodeName === "PRE") {
        // If pre is inside a code-block-wrapper, let the parent wrapper handle it
        let parent: Node | null = node.parentNode;
        while (parent) {
          if (parent.nodeName === "DIV" && (parent as HTMLElement).classList?.contains("code-block-wrapper")) {
            return false;
          }
          parent = parent.parentNode;
        }
        return true;
      }
      return node.nodeName === "DIV" && (node as HTMLElement).classList?.contains("code-block-wrapper");
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const codeEl = el.querySelector("code") || el.querySelector("pre") || el;
      const className = codeEl.getAttribute("class") || el.getAttribute("class") || "";
      const langMatch = className.match(/language-([a-zA-Z0-9_-]+)/);
      const lang = langMatch ? langMatch[1] : "";
      const rawText = codeEl.textContent || "";
      const codeText = rawText.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
      const prev = el.previousElementSibling;
      const isAfterHeading = prev && /^H[1-6]$/.test(prev.nodeName);
      const leadingNl = isAfterHeading ? "\n" : "\n\n";
      return `${leadingNl}\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
    },
  });

  // Convert HTML tables back into clean GFM Markdown tables unless originally HTML or using merged cells
  td.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const table = node as HTMLElement;

      const hasSpans = Boolean(table.querySelector('[colspan]:not([colspan="1"]), [rowspan]:not([rowspan="1"])'));
      const isOriginalHtmlTable = table.getAttribute("data-original-html-table") === "true";

      if (isOriginalHtmlTable || hasSpans) {
        const clone = table.cloneNode(true) as HTMLElement;
        clone.removeAttribute("data-original-html-table");
        return `\n${clone.outerHTML}\n`;
      }

      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) return "";

      const matrix: string[][] = [];
      let maxCols = 0;

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        if (cells.length === 0) return;
        const rowData = cells.map((cell) => {
          let text = td.turndown(cell.innerHTML).replace(/\n+/g, " ").trim();
          text = text.replace(/\\\|/g, "___PIPE_TEMP___").replace(/\|/g, "\\|").replace(/___PIPE_TEMP___/g, "\\|");
          return text;
        });
        if (rowData.length > maxCols) maxCols = rowData.length;
        matrix.push(rowData);
      });

      while (matrix.length > 1 && matrix[matrix.length - 1].every((cell) => !cell.trim())) {
        matrix.pop();
      }

      if (matrix.length === 0 || maxCols === 0) return "";

      const header = matrix[0];
      while (header.length < maxCols) header.push("");
      const headerLine = `| ${header.join(" | ")} |`;

      // Determine column alignments from table header and cells
      const colAlignments: string[] = [];
      for (let c = 0; c < maxCols; c++) {
        let align = "";
        for (const row of rows) {
          const cell = row.querySelectorAll("th, td")[c];
          if (cell) {
            const a = cell.getAttribute("align") || (cell as HTMLElement).style?.textAlign;
            if (a) {
              align = a.toLowerCase();
              break;
            }
          }
        }
        if (align === "center") {
          colAlignments.push(":---:");
        } else if (align === "right") {
          colAlignments.push("---:");
        } else if (align === "left") {
          colAlignments.push(":---");
        } else {
          colAlignments.push("---");
        }
      }
      const separatorLine = `| ${colAlignments.join(" | ")} |`;

      const bodyLines = matrix.slice(1).map((row) => {
        while (row.length < maxCols) row.push("");
        return `| ${row.join(" | ")} |`;
      });

      const lines = [headerLine, separatorLine, ...bodyLines];
      return `\n\n${lines.join("\n")}\n\n`;
    },
  });

  const serializeTaskItemNode = (li: HTMLElement): string => {
    const checked = li.getAttribute("data-checked") === "true" ? "x" : " ";
    const contentDiv = (li.querySelector(":scope > div") || li.querySelector("div")) as HTMLElement | null;
    let itemMarkdown = "";
    if (contentDiv) {
      itemMarkdown = td
        .turndown(contentDiv.innerHTML)
        .replace(/^[\r\n]+|[\r\n]+$/g, "")
        .replace(/\r?\n/g, "\n  ");
    }
    if (!itemMarkdown) {
      itemMarkdown = (contentDiv ? contentDiv.textContent?.trim() : li.textContent?.trim()) ?? "";
    }
    return `- [${checked}] ${itemMarkdown}`;
  };

  // Serialize individual taskItem if standalone (or suppress if handled by taskList parent)
  td.addRule("taskItem", {
    filter: (node: HTMLElement) =>
      node.nodeName === "LI" && node.getAttribute("data-type") === "taskItem",
    replacement: (_content: string, node: TurndownService.Node) => {
      const li = node as HTMLElement;
      if (li.closest('ul[data-type="taskList"]')) {
        return "";
      }
      return `${serializeTaskItemNode(li)}\n`;
    },
  });

  // Convert Tiptap's <ul data-type="taskList"> to markdown checkboxes
  td.addRule("taskList", {
    filter: (node: HTMLElement) =>
      node.nodeName === "UL" && node.getAttribute("data-type") === "taskList",
    replacement: (_content: string, node: TurndownService.Node) => {
      const ul = node as HTMLElement;
      const directItems = Array.from(ul.children).filter(
        (el) => el.nodeName === "LI" && el.getAttribute("data-type") === "taskItem"
      ) as HTMLElement[];
      const itemsToUse = directItems.length > 0 ? directItems : (Array.from(ul.querySelectorAll('li[data-type="taskItem"]')) as HTMLElement[]);
      const items = itemsToUse.map((li) => serializeTaskItemNode(li));
      return "\n" + items.join("\n") + "\n";
    },
  });

  // Preserve Tiptap <details><summary>title</summary>...<details> in markdown
  td.addRule("toggle", {
    filter: (node: HTMLElement) => node.nodeName === "DETAILS",
    replacement: (_content: string, node: TurndownService.Node) => {
      const el = node as HTMLElement;
      const summary = el.querySelector(":scope > summary") || el.querySelector("summary");
      const rawTitle = summary?.textContent?.trim() || "";
      const title = rawTitle
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const isOpen = el.hasAttribute("open");

      const div = el.querySelector(":scope > div") || el.querySelector("div");
      let innerHtml = "";
      if (div) {
        innerHtml = div.innerHTML;
      } else {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelector("summary")?.remove();
        innerHtml = clone.innerHTML;
      }

      const innerMarkdown = td.turndown(innerHtml).replace(/^[\r\n]+|[\r\n]+$/g, "");
      const bodyContent = innerMarkdown || "<p></p>";

      return `\n\n<details${isOpen ? " open" : ""}>\n<summary>${title}</summary>\n\n${bodyContent}\n\n</details>\n\n`;
    },
  });

  return td;
}
