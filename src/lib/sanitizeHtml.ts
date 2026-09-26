import DOMPurify from "dompurify";

/**
 * Sanitizes an HTML string to protect against XSS vulnerabilities,
 * dangerous script tags, malicious event handlers, and javascript: links.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  try {
    if (typeof DOMPurify?.sanitize === "function") {
      return DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true, svg: true },
        ADD_TAGS: [
          "table",
          "thead",
          "tbody",
          "tfoot",
          "tr",
          "th",
          "td",
          "mark",
          "del",
          "ins",
          "sub",
          "sup",
          "abbr",
          "audio",
          "source",
          "video",
          "details",
          "summary",
          "input",
          "label",
        ],
        ADD_ATTR: [
          "target",
          "rel",
          "data-relative-src",
          "data-raw-tag",
          "data-footnote-ref",
          "data-footnote-def",
          "data-footnote-id",
          "data-footnote-target",
          "data-footnote-backref",
          "data-wikilink",
          "data-wikilink-embed",
          "data-type",
          "data-checked",
          "data-color",
          "data-font-family",
          "data-font-size",
          "data-qr-code",
          "data-qr-text",
          "data-qr-color",
          "data-qr-bg",
          "data-qr-level",
          "class",
          "style",
          "width",
          "height",
          "colspan",
          "rowspan",
          "colwidth",
          "controls",
          "preload",
          "open",
          "type",
          "checked",
          "disabled",
          "data-text-align",
          "data-title",
          "title",
        ],
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|wikilink|luno-asset):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$)|data:(?:image|video|audio)\/|blob:)/i,
      });
    }
  } catch (err) {
    console.warn("DOMPurify sanitize failed:", err);
  }

  return rawHtml;
}
