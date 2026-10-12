import { Marked } from "marked";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { highlightCode, getLanguageLabel, escapeHtml } from "@/lib/syntaxHighlighter";

export interface LunoAiMarkdownOptions {
  showCodeLineNumbers?: boolean;
  accentHeadings?: boolean;
  copyButtonText?: string;
}

const markdownRenderCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

function createLunoAiMarked(options?: LunoAiMarkdownOptions): Marked {
  const marked = new Marked({
    gfm: true,
    breaks: true,
  });

  // 1. Inline Highlight ==highlight==
  marked.use({
    extensions: [
      {
        name: "highlight",
        level: "inline",
        start(src: string) {
          return src.match(/==/)?.index;
        },
        tokenizer(src: string) {
          const match = src.match(/^==((?:\\=|[^\r\n=]|=(?!=))+?)==/);
          if (match) {
            return {
              type: "highlight",
              raw: match[0],
              text: match[1],
              tokens: (this as any).lexer.inlineTokens(match[1]),
            };
          }
        },
        renderer(token: any) {
          return `<mark class="luno-highlight">${(this as any).parser.parseInline(token.tokens || [])}</mark>`;
        },
      },
    ],
  });

  // 2. Custom CodeBlock Renderer matching Editor's CodeBlockNodeView
  marked.use({
    renderer: {
      code(token: { text: string; lang?: string; escaped?: boolean }) {
        const rawCode = token.text || "";
        const lang = (token.lang || "").trim();
        const displayLabel = getLanguageLabel(lang);
        const highlightedHtml = highlightCode(rawCode, lang);
        const encodedCode = encodeURIComponent(rawCode);
        const showLineNumbers = options?.showCodeLineNumbers ?? false;
        const linesCount = Math.max(1, rawCode.split("\n").length);
        const copyLabel = options?.copyButtonText || "Copy";

        const lineNumbersHtml = showLineNumbers
          ? `<div aria-hidden="true" class="code-line-numbers flex flex-col select-none pr-3 text-right text-muted-foreground/40 border-r border-border/30 mr-3.5 shrink-0" style="font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13.5px; line-height: 22px;">` +
            Array.from({ length: linesCount }, (_, i) =>
              `<span class="block select-none" style="height: 22px; line-height: 22px; margin: 0; padding: 0;">${i + 1}</span>`
            ).join("") +
            `</div>`
          : "";

        return (
          `<div class="code-block-wrapper my-5 md:my-6 rounded-xl border border-border/50 bg-muted/70 overflow-hidden shadow-2xs transition-all">` +
          `<div class="code-block-header flex items-center justify-between px-3.5 pt-2 pb-1 text-[11px] select-none border-b border-border/30">` +
          `<span class="font-semibold text-muted-foreground/90">${escapeHtml(displayLabel)}</span>` +
          `<button type="button" class="luno-code-copy-btn flex items-center justify-center p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-background/40 transition-all cursor-pointer outline-none" data-copy-code="true" data-code="${encodedCode}" data-tooltip="${escapeHtml(copyLabel)}" aria-label="${escapeHtml(copyLabel)}">` +
          `<svg class="h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>` +
          `</button>` +
          `</div>` +
          `<div class="flex px-3.5 py-2.5 overflow-x-auto text-[13.5px] text-foreground items-start">` +
          lineNumbersHtml +
          `<div class="flex-1 min-w-0" style="font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13.5px; line-height: 22px;">` +
          `<pre class="outline-none focus:outline-none bg-transparent p-0 m-0 border-0 block" style="font-family: inherit; font-size: inherit; line-height: 22px; white-space: pre; margin: 0; padding: 0;"><code class="language-${escapeHtml(lang || "plaintext")} block" style="font-family: inherit; font-size: inherit; line-height: inherit; background-color: transparent !important; padding: 0 !important; border: none !important;">${highlightedHtml}</code></pre>` +
          `</div>` +
          `</div>` +
          `</div>`
        );
      },
    },
  });

  return marked;
}

/**
 * Normalizes task lists and checklist items into TipTap/Editor structure.
 */
function postProcessTaskLists(root: HTMLElement) {
  root.querySelectorAll("li").forEach((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    const isChecked = (checkbox as HTMLInputElement).checked;
    checkbox.remove();

    li.setAttribute("data-type", "taskItem");
    li.setAttribute("data-checked", isChecked ? "true" : "false");
    li.classList.add("task-item");

    const innerHtml = li.innerHTML.trim();
    li.innerHTML =
      `<label contenteditable="false" class="task-checkbox-label"><input type="checkbox"${isChecked ? " checked" : ""} disabled><span></span></label>` +
      `<div class="task-item-content flex-1 min-w-0">${innerHtml}</div>`;
  });

  root.querySelectorAll("ul").forEach((ul) => {
    if (ul.querySelector('li[data-type="taskItem"]')) {
      ul.setAttribute("data-type", "taskList");
      ul.classList.add("task-list");
    }
  });
}

/**
 * Wraps tables in .tableWrapper to match TipTap Editor scroll layout.
 */
function postProcessTables(root: HTMLElement) {
  root.querySelectorAll("table").forEach((table) => {
    if (!table.parentElement?.classList.contains("tableWrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "tableWrapper";
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
}

/**
 * Converts native title attributes on markdown elements (links, images, buttons)
 * into data-tooltip attributes so they display with our custom tooltip system.
 */
function postProcessTooltips(root: HTMLElement) {
  root.querySelectorAll("[title]").forEach((el) => {
    const titleVal = el.getAttribute("title");
    if (titleVal && !el.hasAttribute("data-tooltip")) {
      el.setAttribute("data-tooltip", titleVal);
    }
    el.removeAttribute("title");
  });
}

/**
 * Converts raw markdown text to beautiful, syntax-highlighted, editor-consistent HTML for Luno AI.
 */
export function renderLunoAiMarkdown(
  markdownText: string,
  options?: LunoAiMarkdownOptions
): string {
  if (!markdownText) return "";

  const cacheKey = `${Boolean(options?.showCodeLineNumbers)}:${Boolean(options?.canInsertToNote)}:${markdownText.length}:${markdownText}`;
  const cached = markdownRenderCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Normalize standalone [ ] or [x] lines to - [ ] if needed
  const normalizedText = markdownText.replace(/^([ \t]*)\[([ xX])\]\s*(.*)$/gm, "$1- [$2] $3");

  const markedInstance = createLunoAiMarked(options);
  let rawHtml = "";
  try {
    const parsed = markedInstance.parse(normalizedText);
    rawHtml = typeof parsed === "string" ? parsed : normalizedText;
  } catch {
    rawHtml = normalizedText;
  }

  let finalHtml = "";
  if (typeof document !== "undefined") {
    try {
      const root = document.createElement("div");
      root.innerHTML = sanitizeHtml(rawHtml);

      postProcessTaskLists(root);
      postProcessTables(root);
      postProcessTooltips(root);

      finalHtml = sanitizeHtml(root.innerHTML);
    } catch {
      finalHtml = sanitizeHtml(rawHtml);
    }
  } else {
    finalHtml = sanitizeHtml(rawHtml);
  }

  if (markdownRenderCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = markdownRenderCache.keys().next().value;
    if (oldestKey) markdownRenderCache.delete(oldestKey);
  }
  markdownRenderCache.set(cacheKey, finalHtml);

  return finalHtml;
}
