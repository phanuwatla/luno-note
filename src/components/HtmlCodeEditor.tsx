import { useEffect, useRef, useCallback } from "react";

interface HtmlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  fontSize?: number;
}

const INDENT = "  "; // 2 spaces

// Auto-close pairs
const PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
};

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function highlightAttrs(raw: string): string {
  const ATTR_RE = /([\w:-]+)(\s*=\s*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s"'=<>`]+)|([\w:-]+)/g;
  let result = "";
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(raw)) !== null) {
    result += escHtml(raw.slice(lastIndex, m.index));
    lastIndex = m.index + m[0].length;
    if (m[4] !== undefined) {
      result += `<span style="color:var(--hl-attr)">${escHtml(m[4])}</span>`;
    } else {
      result += `<span style="color:var(--hl-attr)">${escHtml(m[1])}</span>`;
      result += `<span style="color:var(--hl-punct)">${escHtml(m[2])}</span>`;
      result += `<span style="color:var(--hl-string)">${escHtml(m[3])}</span>`;
    }
  }
  result += escHtml(raw.slice(lastIndex));
  return result;
}

function highlightHtml(code: string): string {
  const TOKEN_RE = /<!--[\s\S]*?-->|<!\w[^>]*>|<\/[\w-]+\s*>|<[\w-][^>]*\/?>|[^<]+/g;
  let result = "";
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(code)) !== null) {
    const token = m[0];
    if (token.startsWith("<!--")) {
      result += `<span style="color:var(--hl-comment)">${escHtml(token)}</span>`;
    } else if (token.startsWith("<!")) {
      result += `<span style="color:var(--hl-keyword)">${escHtml(token)}</span>`;
    } else if (token.startsWith("</")) {
      const nm = token.match(/^<\/([\w-]+)(\s*)>$/);
      if (nm) {
        result += `<span style="color:var(--hl-punct)">&lt;/</span>`;
        result += `<span style="color:var(--hl-tag)">${escHtml(nm[1])}</span>`;
        if (nm[2]) result += escHtml(nm[2]);
        result += `<span style="color:var(--hl-punct)">&gt;</span>`;
      } else {
        result += escHtml(token);
      }
    } else if (token.startsWith("<")) {
      const selfClose = token.endsWith("/>");
      const inner = token.slice(1, selfClose ? -2 : -1);
      const nameEnd = inner.search(/[\s/]/);
      const name = nameEnd === -1 ? inner : inner.slice(0, nameEnd);
      const attrs = nameEnd === -1 ? "" : inner.slice(nameEnd);
      result += `<span style="color:var(--hl-punct)">&lt;</span>`;
      result += `<span style="color:var(--hl-tag)">${escHtml(name)}</span>`;
      result += highlightAttrs(attrs);
      result += `<span style="color:var(--hl-punct)">${selfClose ? "/&gt;" : "&gt;"}</span>`;
    } else {
      result += escHtml(token);
    }
  }
  return result;
}

export default function HtmlCodeEditor({ value, onChange, fontSize = 14 }: HtmlCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const lines = value.split("\n");

  const syncScroll = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = ta.scrollTop;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    // Tab = indent
    if (e.key === "Tab") {
      e.preventDefault();
      if (start !== end) {
        // Multi-line indent/unindent
        const lineStart = val.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = val.indexOf("\n", end - 1);
        const selectedLines = val.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).split("\n");

        let newText: string;
        let delta = 0;

        if (e.shiftKey) {
          newText = selectedLines.map((l) => l.startsWith(INDENT) ? l.slice(INDENT.length) : l.startsWith("\t") ? l.slice(1) : l).join("\n");
          delta = newText.length - selectedLines.join("\n").length;
        } else {
          newText = selectedLines.map((l) => INDENT + l).join("\n");
          delta = selectedLines.length * INDENT.length;
        }

        const next = val.slice(0, lineStart) + newText + (lineEnd === -1 ? "" : val.slice(lineEnd));
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = start + (e.shiftKey ? 0 : INDENT.length);
          ta.selectionEnd = end + delta;
        });
      } else {
        // Single cursor indent
        if (e.shiftKey) {
          const lineStart = val.lastIndexOf("\n", start - 1) + 1;
          const line = val.slice(lineStart);
          if (line.startsWith(INDENT)) {
            const next = val.slice(0, lineStart) + val.slice(lineStart + INDENT.length);
            onChange(next);
            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start - INDENT.length; });
          }
        } else {
          const next = val.slice(0, start) + INDENT + val.slice(end);
          onChange(next);
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + INDENT.length; });
        }
      }
      return;
    }

    // Enter - auto-indent
    if (e.key === "Enter" && !e.shiftKey) {
      const lineStart = val.lastIndexOf("\n", start - 1) + 1;
      const currentLine = val.slice(lineStart, start);
      const indent = currentLine.match(/^(\s*)/)?.[1] ?? "";
      const charBefore = val[start - 1];
      const charAfter = val[start];

      // Extra indent inside { [ ( tags
      const extraIndent = (charBefore === "{" && charAfter === "}") ||
                          (charBefore === "[" && charAfter === "]") ||
                          (charBefore === "(" && charAfter === ")")
        ? INDENT : "";

      if (extraIndent) {
        e.preventDefault();
        const insertText = "\n" + indent + extraIndent + "\n" + indent;
        const next = val.slice(0, start) + insertText + val.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          const pos = start + 1 + indent.length + extraIndent.length;
          ta.selectionStart = ta.selectionEnd = pos;
        });
        return;
      }

      if (indent) {
        e.preventDefault();
        const insertText = "\n" + indent;
        const next = val.slice(0, start) + insertText + val.slice(end);
        onChange(next);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + insertText.length; });
      }
      return;
    }

    // Auto-close pairs
    if (PAIRS[e.key] && !e.ctrlKey && !e.metaKey) {
      const close = PAIRS[e.key];
      if (e.key === close) {
        // Quote: skip if next char is same quote
        if (val[start] === close) {
          e.preventDefault();
          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 1; });
          return;
        }
        // Only auto-close quotes if selection or followed by whitespace/end
        const nextChar = val[start];
        if (nextChar && !/[\s,;)}\]]/.test(nextChar) && nextChar !== close) return;
      }
      // Skip closing if already typed
      if (e.key !== close && val[start] === close && start === end) {
        // skip for non-quote pairs - handled above
      }

      e.preventDefault();
      const insert = start !== end
        ? e.key + val.slice(start, end) + close
        : e.key + close;
      const next = val.slice(0, start) + insert + val.slice(end);
      onChange(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 1; });
      return;
    }

    // Skip over closing char
    if (Object.values(PAIRS).includes(e.key) && val[start] === e.key && start === end) {
      e.preventDefault();
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 1; });
    }
  }, [onChange]);

  // Keep textarea synced to external value changes
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || ta.value === value) return;
    const ss = ta.selectionStart;
    const se = ta.selectionEnd;
    ta.value = value;
    ta.selectionStart = ss;
    ta.selectionEnd = se;
  }, [value]);

  return (
    <div className="relative flex h-full w-full overflow-hidden font-mono" style={{ fontSize }}>
      {/* Line numbers */}
      <div
        ref={lineNumbersRef}
        aria-hidden
        className="no-scrollbar select-none overflow-hidden bg-transparent py-4 text-right text-muted-foreground/30 shrink-0"
        style={{ fontSize: `${Math.max(10, Math.round(fontSize * 0.72))}px`, lineHeight: "1.625rem", width: `${Math.max(24, String(lines.length).length * Math.round(fontSize * 0.48) + 12)}px`, paddingLeft: "4px", paddingRight: "6px" }}
      >
        {lines.map((_, i) => (
          <div key={i} style={{ lineHeight: "1.625rem" }}>{i + 1}</div>
        ))}
      </div>

      {/* Code area: highlighted pre + transparent textarea overlay */}
      <div className="relative flex-1 min-w-0 h-full">
        <pre
          ref={preRef}
          aria-hidden
          className="no-scrollbar pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-all px-4 py-4"
          style={{ fontSize, lineHeight: "1.625rem", tabSize: 2 }}
          dangerouslySetInnerHTML={{ __html: highlightHtml(value) + "\n" }}
        />
        <textarea
          ref={textareaRef}
          className="absolute inset-0 h-full w-full resize-none bg-transparent px-4 py-4 outline-none overflow-auto caret-foreground"
          style={{ fontSize, lineHeight: "1.625rem", tabSize: 2, color: "transparent", caretColor: "hsl(var(--foreground))" }}
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}

