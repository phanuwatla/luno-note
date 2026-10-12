import { describe, it, expect } from "vitest";
import { renderLunoAiMarkdown } from "./lunoAiMarkdown";
import { highlightCode, getLanguageLabel } from "./syntaxHighlighter";

describe("syntaxHighlighter", () => {
  it("resolves language display names correctly", () => {
    expect(getLanguageLabel("js")).toBe("JavaScript");
    expect(getLanguageLabel("javascript")).toBe("JavaScript");
    expect(getLanguageLabel("ts")).toBe("TypeScript");
    expect(getLanguageLabel("python")).toBe("Python");
    expect(getLanguageLabel("py")).toBe("Python");
    expect(getLanguageLabel("bash")).toBe("Bash");
    expect(getLanguageLabel("")).toBe("Plain Text");
    expect(getLanguageLabel(undefined)).toBe("Plain Text");
  });

  it("highlights code using lowlight classes", () => {
    const code = "const x = 42;";
    const highlighted = highlightCode(code, "javascript");
    expect(highlighted).toContain("hljs-keyword");
    expect(highlighted).toContain("const");
    expect(highlighted).toContain("hljs-number");
    expect(highlighted).toContain("42");
  });

  it("handles unknown languages gracefully", () => {
    const code = "unknown syntax text";
    const highlighted = highlightCode(code, "unknownlang123");
    expect(highlighted).toContain("unknown syntax text");
  });
});

describe("renderLunoAiMarkdown", () => {
  it("renders code blocks with code-block-wrapper, header, language, and copy button", () => {
    const md = "```js\nconst greeting = 'hello';\n```";
    const html = renderLunoAiMarkdown(md);

    expect(html).toContain("code-block-wrapper");
    expect(html).toContain("code-block-header");
    expect(html).toContain("JavaScript");
    expect(html).toContain("data-copy-code=\"true\"");
    expect(html).toContain("data-code=");
    expect(html).toContain("hljs-keyword");
    expect(html).toContain("hljs-string");
  });

  it("includes line numbers gutter when showCodeLineNumbers is true", () => {
    const md = "```python\ndef add(a, b):\n    return a + b\n```";
    const htmlWithNumbers = renderLunoAiMarkdown(md, { showCodeLineNumbers: true });
    expect(htmlWithNumbers).toContain("code-line-numbers");
    expect(htmlWithNumbers).toContain(">1<");
    expect(htmlWithNumbers).toContain(">2<");

    const htmlWithoutNumbers = renderLunoAiMarkdown(md, { showCodeLineNumbers: false });
    expect(htmlWithoutNumbers).not.toContain("code-line-numbers");
  });

  it("only includes copy button and no insert button matching editor code block", () => {
    const md = "```html\n<div>Test</div>\n```";
    const html = renderLunoAiMarkdown(md);
    expect(html).toContain("data-copy-code=\"true\"");
    expect(html).not.toContain("data-insert-code");
    expect(html).not.toContain("luno-code-insert-btn");
  });

  it("renders inline highlight ==text== into <mark class=\"luno-highlight\">", () => {
    const md = "This is ==highlighted text== here.";
    const html = renderLunoAiMarkdown(md);
    expect(html).toContain("<mark class=\"luno-highlight\">highlighted text</mark>");
  });

  it("wraps tables in tableWrapper matching Editor structure", () => {
    const md = "| Name | Value |\n| --- | --- |\n| Test | 100 |";
    const html = renderLunoAiMarkdown(md);
    expect(html).toContain("tableWrapper");
    expect(html).toContain("<table");
    expect(html).toContain("Test");
    expect(html).toContain("100");
  });

  it("converts task lists into data-type=\"taskList\" and data-type=\"taskItem\"", () => {
    const md = "- [ ] Pending task\n- [x] Completed task";
    const html = renderLunoAiMarkdown(md);
    expect(html).toContain("data-type=\"taskList\"");
    expect(html).toContain("data-type=\"taskItem\"");
    expect(html).toContain("data-checked=\"true\"");
    expect(html).toContain("data-checked=\"false\"");
    expect(html).toContain("Pending task");
    expect(html).toContain("Completed task");
  });

  it("renders blockquotes and inline code cleanly", () => {
    const md = "> This is an important note\n\nUse the `console.log()` function.";
    const html = renderLunoAiMarkdown(md);
    expect(html).toContain("<blockquote");
    expect(html).toContain("<code");
    expect(html).toContain("console.log()");
  });
});
