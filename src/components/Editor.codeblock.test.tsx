import { describe, expect, it } from "vitest";
import TurndownService from "turndown";
import { marked } from "marked";
import { preprocessMarkdownForEditor } from "@/components/Editor";

describe("Code block preservation with empty lines", () => {
  it("should preserve fenced code blocks with empty lines through marked and turndown roundtrip", () => {
    const originalMarkdown = [
      "```typescript",
      "interface User {",
      "  id: number;",
      "  name: string;",
      "  email: string;",
      "}",
      "",
      'const user: User = { id: 1, name: "Luno", email: "luno@example.com"};',
      "```",
    ].join("\n");

    // 1. Preprocess
    const preprocessed = preprocessMarkdownForEditor(originalMarkdown);

    // 2. Marked HTML
    const html = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;

    // 3. Turndown setup (same rules as Editor.tsx)
    const td = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      fence: "```",
    });

    td.addRule("insidePreCode", {
      filter: (node) => {
        let curr: Node | null = node.parentNode;
        while (curr) {
          if (curr.nodeName === "PRE") return true;
          curr = curr.parentNode;
        }
        return false;
      },
      replacement: (_content, node) => node.textContent || "",
    });

    td.addRule("fencedCodeBlock", {
      filter: (node) => node.nodeName === "PRE",
      replacement: (_content, node) => {
        const pre = node as HTMLElement;
        const code = pre.querySelector("code") || pre;
        const className = code.getAttribute("class") || pre.getAttribute("class") || "";
        const langMatch = className.match(/language-([a-zA-Z0-9_-]+)/);
        const lang = langMatch ? langMatch[1] : "";
        const rawText = code.textContent || "";
        const codeText = rawText.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
        return `\n\n\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
      },
    });

    const serialized = td.turndown(html).trim();

    expect(serialized).toContain('const user: User = { id: 1, name: "Luno", email: "luno@example.com"};');
    expect(serialized.startsWith("```typescript")).toBe(true);
    expect(serialized.endsWith("```")).toBe(true);
  });

  it("should unescape legacy double-escaped HTML entities inside fenced code blocks", () => {
    const legacyMarkdown = [
      "```jsx",
      "import { useState } from \"react\";",
      "",
      "function Counter() {",
      "  return (",
      "    &lt;button onClick={() =&gt; setCount(count + 1)}&gt;",
      "      Count: {count}",
      "    &lt;/button&gt;",
      "  );",
      "}",
      "```",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(legacyMarkdown);
    expect(preprocessed).toContain("<button onClick={() => setCount(count + 1)}>");
    expect(preprocessed).toContain("</button>");
    expect(preprocessed).not.toContain("&lt;");
    expect(preprocessed).not.toContain("&gt;");
  });

  it("should preserve CSS code blocks with class selectors and blank lines in long documents", () => {
    const cssMarkdown = [
      "# Heading 1",
      "Prose text paragraph.",
      "",
      "```css",
      "body {",
      '  font-family: "Prompt", sans-serif;',
      "  margin: 0;",
      "  padding: 20px;",
      "}",
      "",
      ".container { max-width: 1200px; margin: auto;}",
      "```",
      "",
      "## Heading 2",
      "More text.",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(cssMarkdown);
    const html = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;

    expect(html).toContain(".container { max-width: 1200px; margin: auto;}");
  });

  it("should not swallow subsequent text, headings, or lists into plain text code block", () => {
    const markdown = [
      "## Connect Your Thoughts",
      "",
      "Notes don't have to exist separately.",
      "Use links to connect related ideas:",
      "",
      "```plaintext",
      "[[Programming]]",
      "[[My Project]]",
      "[[University Notes]]",
      "```",
      "",
      "Build a network of notes that reflects the way your thoughts are connected.",
      "",
      "* * *",
      "",
      "## Tags",
      "",
      "Tags help you categorize and find related notes.",
      "",
      "```plaintext",
      "#Programming",
      "#JavaScript",
      "#University",
      "#Ideas",
      "```",
      "",
      "Use tags consistently to make your notes easier to navigate.",
    ].join("\n");

    const preprocessed = preprocessMarkdownForEditor(markdown);
    const html = marked.parse(preprocessed, { async: false, gfm: true, breaks: true }) as string;
    const div = document.createElement("div");
    div.innerHTML = html;

    const preElements = div.querySelectorAll("pre");
    expect(preElements.length).toBe(2);

    const firstPreText = preElements[0].textContent || "";
    expect(firstPreText).toContain("[[Programming]]");
    expect(firstPreText).not.toContain("Build a network of notes");
    expect(firstPreText).not.toContain("## Tags");

    const secondPreText = preElements[1].textContent || "";
    expect(secondPreText).toContain("#Programming");
    expect(secondPreText).not.toContain("Use tags consistently");

    // Headings and paragraphs must remain outside code blocks
    const headings = div.querySelectorAll("h2");
    expect(headings.length).toBe(2);
    expect(headings[0].textContent).toBe("Connect Your Thoughts");
    expect(headings[1].textContent).toBe("Tags");
  });
});
