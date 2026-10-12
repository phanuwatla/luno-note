import { createLowlight, common } from "lowlight";

/**
 * Shared lowlight instance loaded with common languages for syntax highlighting
 * across TipTap Editor, Note previews, and Luno AI content.
 */
export const lowlight = createLowlight(common);

export const CODE_LANGUAGES: Record<string, string> = {
  plaintext: "Plain Text",
  text: "Plain Text",
  txt: "Plain Text",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  tsx: "TypeScript (React)",
  jsx: "JavaScript (React)",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  python: "Python",
  py: "Python",
  json: "JSON",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Zsh",
  sql: "SQL",
  cpp: "C++",
  "c++": "C++",
  c: "C",
  csharp: "C#",
  "c#": "C#",
  cs: "C#",
  java: "Java",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  rs: "Rust",
  php: "PHP",
  ruby: "Ruby",
  rb: "Ruby",
  yaml: "YAML",
  yml: "YAML",
  markdown: "Markdown",
  md: "Markdown",
  xml: "XML",
  diff: "Diff",
  lua: "Lua",
  swift: "Swift",
  kotlin: "Kotlin",
  kt: "Kotlin",
  graphql: "GraphQL",
  r: "R",
  dart: "Dart",
};

export function getLanguageLabel(rawLang?: string): string {
  if (!rawLang) return "Plain Text";
  const lower = rawLang.trim().toLowerCase();
  if (CODE_LANGUAGES[lower]) return CODE_LANGUAGES[lower];
  return rawLang.charAt(0).toUpperCase() + rawLang.slice(1);
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  html: "xml",
  sh: "bash",
  zsh: "bash",
  shell: "bash",
  yml: "yaml",
  rb: "ruby",
  rs: "rust",
  cs: "csharp",
  "c#": "csharp",
  "c++": "cpp",
  golang: "go",
  md: "markdown",
  kt: "kotlin",
};

export function escapeHtml(s: string): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function hastNodeToHtml(node: any): string {
  if (!node) return "";
  if (node.type === "text") {
    return escapeHtml(node.value || "");
  }
  if (node.type === "element") {
    const tagName = node.tagName || "span";
    const classes = Array.isArray(node.properties?.className)
      ? node.properties.className.join(" ")
      : node.properties?.className || "";
    const classAttr = classes ? ` class="${classes}"` : "";
    const childrenHtml = (node.children || []).map(hastNodeToHtml).join("");
    return `<${tagName}${classAttr}>${childrenHtml}</${tagName}>`;
  }
  if (node.type === "root") {
    return (node.children || []).map(hastNodeToHtml).join("");
  }
  return "";
}

/**
 * Highlights a code snippet with lowlight (highlight.js) AST and converts to syntax-highlighted HTML spans.
 */
export function highlightCode(code: string, rawLang?: string): string {
  if (!code) return "";
  const cleanLang = (rawLang || "").trim().toLowerCase();
  const resolvedLang = LANGUAGE_ALIASES[cleanLang] || cleanLang;

  try {
    if (resolvedLang && lowlight.registered(resolvedLang)) {
      const tree = lowlight.highlight(resolvedLang, code);
      return hastNodeToHtml(tree);
    }
    if (code.trim().length > 0) {
      try {
        const tree = lowlight.highlightAuto(code);
        if (tree?.children?.length) {
          return hastNodeToHtml(tree);
        }
      } catch {
        // Fallback
      }
    }
  } catch {
    // Fallback
  }

  return escapeHtml(code);
}
