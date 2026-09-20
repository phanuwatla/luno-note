import React, { useState, useMemo, useEffect } from "react";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import CodeBlockNodeView from "@/components/CodeBlockNodeView";
import {
  lowlight,
  CustomParagraph,
  HashtagDecoration,
  Toggle,
  EDITOR_CLASSES,
  renderMarkdownToEditorHtml,
  collapseBlockWhitespace,
  escapeHtml,
  InlineCodeHighlight,
  navigateFootnoteOrAnchor,
} from "@/components/Editor";
import {
  Underline,
  Highlight,
  Superscript,
  Subscript,
  TextColor,
  FontFamily,
  FontSize,
  Kbd,
  TextAlign,
} from "@/lib/tiptapCustomMarks";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import ImageNodeView from "@/components/editor/ImageNodeView";
import AudioExtension from "@/components/editor/AudioExtension";
import { getTagColorClass } from "@/lib/tagColors";
import { parseFrontmatterAndTags } from "@/lib/frontmatter";
import { useAppSettings, FONT_FAMILY_CSS } from "@/hooks/useAppSettings";
import { rewriteHtmlForPreview } from "@/lib/htmlPreview";

export interface NoteEditorPreviewProps {
  content: string;
  title?: string;
  tags?: string[];
  format?: "markdown" | "html" | "plain" | "css";
  fontSize?: number;
  lineHeight?: string;
  fontFamily?: string;
  theme?: string;
  tagColorStyle?: string;
  accentHeadings?: boolean;
  editorWidth?: "compact" | "normal" | "full";
  showCodeLineNumbers?: boolean;
  assetBlobUrlMap?: Map<string, string>;
  className?: string;
  containerClassName?: string;
  scrollable?: boolean;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export default function NoteEditorPreview({
  content,
  title,
  tags,
  format = "markdown",
  fontSize,
  lineHeight,
  fontFamily,
  theme,
  tagColorStyle,
  accentHeadings,
  editorWidth,
  showCodeLineNumbers,
  assetBlobUrlMap,
  className,
  containerClassName,
  scrollable = true,
  onScroll,
  scrollRef,
}: NoteEditorPreviewProps) {
  const { settings } = useAppSettings();

  const resolvedFontSize = fontSize ?? settings.fontSize ?? 15;
  const resolvedLineHeight =
    lineHeight ??
    (settings.lineHeight === "1.4" ? 1.4 : settings.lineHeight === "1.8" ? 1.8 : 1.6);
  const resolvedFontFamily =
    fontFamily || (settings.editorFontFamily ? FONT_FAMILY_CSS[settings.editorFontFamily] : undefined) || (settings.fontFamily ? FONT_FAMILY_CSS[settings.fontFamily] : undefined) || "var(--editor-font-family, var(--app-font-family))";
  const resolvedTheme = theme || settings.theme;
  const resolvedTagColorStyle = tagColorStyle || settings.tagColorStyle;
  const resolvedAccentHeadings = accentHeadings ?? settings.accentHeadings;
  const resolvedEditorWidth = editorWidth || settings.editorWidth || "normal";
  const resolvedShowCodeLineNumbers = showCodeLineNumbers ?? settings.showCodeLineNumbers;

  // Extract frontmatter tags if available and none provided
  const displayTags = useMemo(() => {
    if (format !== "markdown") return [];
    if (tags && Array.isArray(tags) && tags.length > 0) return tags;
    if (content) {
      try {
        const parsedFm = parseFrontmatterAndTags(content);
        if (parsedFm?.hasFrontmatter && Array.isArray(parsedFm.allTags) && parsedFm.allTags.length > 0) {
          return parsedFm.allTags;
        }
      } catch {
        /* ignore */
      }
    }
    return [];
  }, [tags, content, format]);

  // Extract custom frontmatter properties (e.g. status, author, category, date)
  const frontmatterProperties = useMemo(() => {
    if (format !== "markdown" || !content) return [];
    try {
      const parsedFm = parseFrontmatterAndTags(content);
      if (!parsedFm?.hasFrontmatter || !parsedFm.frontmatterData) return [];
      const ignoredKeys = new Set(["tags", "icon", "iconcolor", "icon_color", "favorite", "isfavorite", "title"]);
      const entries: Array<{ key: string; value: string }> = [];
      for (const [k, v] of Object.entries(parsedFm.frontmatterData)) {
        if (ignoredKeys.has(k.toLowerCase())) continue;
        if (v === undefined || v === null || v === "") continue;
        const displayVal = Array.isArray(v) ? v.join(", ") : String(v);
        entries.push({ key: k, value: displayVal });
      }
      return entries;
    } catch {
      return [];
    }
  }, [content, format]);

  // Live HTML asset resolution and preview state
  const [htmlSrcDoc, setHtmlSrcDoc] = useState(content);

  useEffect(() => {
    if (format !== "html") return;
    let cancelled = false;
    if (assetBlobUrlMap && assetBlobUrlMap.size > 0) {
      rewriteHtmlForPreview(content, (path) => assetBlobUrlMap.get(path) || null)
        .then((res) => {
          if (!cancelled) setHtmlSrcDoc(res);
        })
        .catch(() => {
          if (!cancelled) setHtmlSrcDoc(content);
        });
    } else {
      setHtmlSrcDoc(content);
    }
    return () => {
      cancelled = true;
    };
  }, [content, format, assetBlobUrlMap]);

  // Compute HTML matching Editor.tsx parseEditorContent exactly
  const parsedHtml = useMemo(() => {
    if (!content) return "<p></p>";

    if (format === "html") {
      return "<p></p>";
    }

    if (format === "plain") {
      const lines = content.split("\n");
      return lines.map((l) => `<p>${l ? escapeHtml(l) : "<br>"}</p>`).join("");
    }

    if (format === "css") {
      return `<pre><code class="language-css">${escapeHtml(content)}</code></pre>`;
    }

    let cleanText = content;
    const parsedFm = parseFrontmatterAndTags(cleanText);
    if (parsedFm.hasFrontmatter) {
      cleanText = parsedFm.bodyContent;
    }

    let editorHtml = renderMarkdownToEditorHtml(cleanText, {
      isReadingMode: true,
      theme: resolvedTheme,
      tagColorStyle: resolvedTagColorStyle,
      assetBlobUrlMap,
      contentFormat: format,
    });

    if (title && format === "markdown") {
      const titleH1Html = `<h1>${escapeHtml(title)}</h1>`;
      const firstH1Match = /^\s*(?:<p>(?:<br\s*\/?>|\s*)*<\/p>\s*)*<h1[^>]*>[\s\S]*?<\/h1>/i.exec(editorHtml);
      if (firstH1Match && firstH1Match[0] && typeof firstH1Match[0].length === "number") {
        editorHtml = titleH1Html + editorHtml.slice(firstH1Match[0].length);
      } else if (!/^\s*<h1[^>]*>/i.test(editorHtml)) {
        editorHtml = titleH1Html + editorHtml;
      }
    }

    return collapseBlockWhitespace(editorHtml);
  }, [content, format, title, resolvedTheme, resolvedTagColorStyle, assetBlobUrlMap]);

  const editor = useEditor({
    editable: false,
    content: parsedHtml,
    parseOptions: {
      preserveWhitespace: "full",
    },
    editorProps: {
      attributes: {
        spellcheck: "false",
        style: `font-size:${resolvedFontSize}px;line-height:${resolvedLineHeight};font-family:${resolvedFontFamily};`,
        class: `${EDITOR_CLASSES} luno-reading-view ${
          resolvedAccentHeadings
            ? "[&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary [&>h1:first-child]:text-primary"
            : "[&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-muted-foreground [&>h1:first-child]:text-foreground"
        }`,
      },
      handleClick: (view, _pos, event) => {
        const target = (event.target as HTMLElement).closest("a, [data-footnote-ref], [data-footnote-backref], [data-footnote-target], sup, .footnote-ref, .footnote-backref");
        if (!target) return false;

        const containerEl = (view.dom.closest(".editor-scroll-container") || view.dom.parentElement || document) as HTMLElement;
        if (navigateFootnoteOrAnchor(target as HTMLElement, containerEl)) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }

        const href = target.getAttribute("href") || (target.querySelector("a")?.getAttribute("href") || "");
        if (href && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:"))) {
          event.preventDefault();
          event.stopPropagation();
          window.open(href, "_blank", "noopener,noreferrer");
          return true;
        }

        return false;
      },
    },
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        paragraph: false,
        dropcursor: false,
      }),
      CustomParagraph,
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockNodeView);
        },
      }).configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      HashtagDecoration.configure({
        theme: resolvedTheme,
        tagColorStyle: resolvedTagColorStyle,
      }),
      InlineCodeHighlight.configure({
        enabled: settings.highlightInlineCode === true,
      }),
      Underline,
      Highlight,
      Superscript,
      Subscript,
      TextColor,
      FontFamily,
      FontSize,
      TextAlign,
      Kbd,
      Toggle,
      TaskList,
      TaskItem,
      AudioExtension,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            align: {
              default: null,
              parseHTML: (element) => element.getAttribute("align") || element.style.textAlign || null,
              renderHTML: (attributes) => {
                if (!attributes.align) return {};
                return {
                  align: attributes.align,
                  style: `text-align: ${attributes.align};`,
                };
              },
            },
          };
        },
      }),
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            align: {
              default: null,
              parseHTML: (element) => element.getAttribute("align") || element.style.textAlign || null,
              renderHTML: (attributes) => {
                if (!attributes.align) return {};
                return {
                  align: attributes.align,
                  style: `text-align: ${attributes.align};`,
                };
              },
            },
          };
        },
      }),
      Link.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            class: {
              default: null,
              parseHTML: (element) => element.getAttribute("class"),
              renderHTML: (attributes) => {
                if (!attributes.class) return {};
                return {
                  class: attributes.class,
                };
              },
            },
            "data-wikilink": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-wikilink"),
              renderHTML: (attributes) => {
                if (!attributes["data-wikilink"]) return {};
                return {
                  "data-wikilink": attributes["data-wikilink"],
                };
              },
            },
            "data-footnote-ref": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-footnote-ref"),
              renderHTML: (attributes) => {
                if (!attributes["data-footnote-ref"]) return {};
                return {
                  "data-footnote-ref": attributes["data-footnote-ref"],
                };
              },
            },
            "data-footnote-backref": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-footnote-backref"),
              renderHTML: (attributes) => {
                if (!attributes["data-footnote-backref"]) return {};
                return {
                  "data-footnote-backref": attributes["data-footnote-backref"],
                };
              },
            },
            id: {
              default: null,
              parseHTML: (element) => element.getAttribute("id"),
              renderHTML: (attributes) => {
                if (!attributes.id) return {};
                return {
                  id: attributes.id,
                };
              },
            },
          };
        },
      }).configure({
        openOnClick: false,
        autolink: false,
        protocols: ["wikilink"],
        validate: () => true,
        isAllowedUri: (url, ctx) => {
          if (!url) return false;
          if (url.startsWith("wikilink:") || url.startsWith("#")) return true;
          return ctx.defaultValidate(url);
        },
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 cursor-pointer",
          rel: "noopener noreferrer nofollow",
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: (element) => {
                const w = element.getAttribute("width") || element.style.width;
                if (!w) return null;
                const parsed = parseInt(w, 10);
                return isNaN(parsed) ? null : parsed;
              },
              renderHTML: (attributes) => {
                if (!attributes.width) return {};
                return {
                  width: attributes.width,
                  style: `width: ${attributes.width}px; max-width: 100%;`,
                };
              },
            },
            "data-relative-src": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-relative-src") || element.getAttribute("src"),
              renderHTML: (attributes) => {
                if (!attributes["data-relative-src"]) return {};
                return {
                  "data-relative-src": attributes["data-relative-src"],
                };
              },
            },
            "data-qr-code": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-code"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-code"]) return {};
                return {
                  "data-qr-code": attributes["data-qr-code"],
                };
              },
            },
            "data-qr-text": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-text"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-text"]) return {};
                return {
                  "data-qr-text": attributes["data-qr-text"],
                };
              },
            },
            "data-qr-color": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-color"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-color"]) return {};
                return {
                  "data-qr-color": attributes["data-qr-color"],
                };
              },
            },
            "data-qr-bg": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-bg"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-bg"]) return {};
                return {
                  "data-qr-bg": attributes["data-qr-bg"],
                };
              },
            },
            "data-qr-level": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-qr-level"),
              renderHTML: (attributes) => {
                if (!attributes["data-qr-level"]) return {};
                return {
                  "data-qr-level": attributes["data-qr-level"],
                };
              },
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView);
        },
      }).configure({
        allowBase64: true,
      }),
    ],
  });

  // Keep content in sync when parsedHtml changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(parsedHtml, false);
    }
  }, [editor, parsedHtml]);

  // Keep options in sync when typography or styling settings change
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          spellcheck: "false",
          style: `font-size:${resolvedFontSize}px;line-height:${resolvedLineHeight};font-family:${resolvedFontFamily};`,
          class: `${EDITOR_CLASSES} luno-reading-view ${
            resolvedAccentHeadings
              ? "[&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary [&>h1:first-child]:text-primary"
              : "[&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-muted-foreground [&>h1:first-child]:text-foreground"
          }`,
        },
      },
    });
  }, [editor, resolvedFontSize, resolvedLineHeight, resolvedFontFamily, resolvedAccentHeadings]);

  const widthClass =
    resolvedEditorWidth === "compact"
      ? "max-w-2xl"
      : resolvedEditorWidth === "full"
      ? "max-w-none"
      : "max-w-4xl";

  if (format === "html") {
    return (
      <div
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        onScroll={onScroll}
        className={`w-full h-full flex flex-col bg-white overflow-hidden select-auto ${className || ""}`}
      >
        <iframe
          srcDoc={htmlSrcDoc || content}
          className="w-full h-full border-0 bg-white block"
          sandbox="allow-scripts allow-same-origin"
          title={title || "HTML Preview"}
        />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef as React.RefObject<HTMLDivElement>}
      onScroll={onScroll}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (navigateFootnoteOrAnchor(target, e.currentTarget)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className={`editor-scroll-container ${
        scrollable ? "overflow-y-auto overflow-x-hidden flex-1 h-full" : ""
      } w-full select-text bg-background ${className || ""}`}
    >
      <div
        className={`flex w-full min-w-0 flex-col ${widthClass} px-4 pt-6 pb-12 sm:px-6 sm:pt-8 md:px-8 md:pt-10 lg:px-12 lg:pt-12 mx-auto min-h-full ${
          resolvedShowCodeLineNumbers ? "show-code-line-numbers" : ""
        } ${containerClassName || ""}`}
      >
        {((Array.isArray(displayTags) && displayTags.length > 0) || frontmatterProperties.length > 0) && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {frontmatterProperties.map((prop) => (
              <span
                key={prop.key}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border border-border/70 bg-muted/40 text-muted-foreground"
              >
                <span className="font-semibold text-foreground/80">{prop.key}:</span>
                <span>{prop.value}</span>
              </span>
            ))}
            {Array.isArray(displayTags) && displayTags.map((tag, idx) => (
              <span
                key={tag}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${getTagColorClass(
                  tag,
                  resolvedTheme,
                  idx,
                  resolvedTagColorStyle
                )}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <EditorContent editor={editor} className="w-full min-w-0 max-w-full" />
      </div>
    </div>
  );
}
