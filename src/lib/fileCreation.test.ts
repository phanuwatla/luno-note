import { describe, it, expect } from "vitest";
import { getDefaultTemplateForExtension, getNoteTemplateContent } from "./templates";
import { getDefaultFileIconKey, getFileFormatLabel } from "./fileIconUtils";
import { isMarkdownFileName } from "./frontmatter";

// Helper simulating normalizeNewFileOptions from Index.tsx
function normalizeNewFileOptions(
  options?: { fileName?: string; contentFormat?: "plain" | "markdown" | "html" | "css" | "javascript" | "js" },
  settings: { defaultExtension: string; dateFormat: string; newFilePattern: string } = {
    defaultExtension: "md",
    dateFormat: "YYYY-MM-DD",
    newFilePattern: "default",
  }
) {
  const raw = (options?.fileName ?? "").trim();
  const safe = raw.replace(/[\\/:*?"<>|]/g, "_");

  const defaultExt = settings.defaultExtension || "md";
  const defaultFormat = defaultExt === "html" ? ("html" as const) : defaultExt === "css" ? ("css" as const) : (defaultExt === "js" || defaultExt === "javascript") ? ("javascript" as const) : defaultExt === "txt" ? ("plain" as const) : ("markdown" as const);

  if (!safe) {
    const baseName = "Untitled";
    const desiredExt = (options?.contentFormat === "javascript" || options?.contentFormat === "js") ? "js" : options?.contentFormat === "html" ? "html" : options?.contentFormat === "css" ? "css" : options?.contentFormat === "plain" ? "txt" : options?.contentFormat === "markdown" ? "md" : defaultExt;
    const desiredFmt = (options?.contentFormat === "javascript" || options?.contentFormat === "js") ? ("javascript" as const) : options?.contentFormat === "html" ? ("html" as const) : options?.contentFormat === "css" ? ("css" as const) : options?.contentFormat === "plain" ? ("plain" as const) : options?.contentFormat === "markdown" ? ("markdown" as const) : defaultFormat;
    return { fileName: `${baseName}.${desiredExt}`, contentFormat: desiredFmt };
  }

  const dotIndex = safe.lastIndexOf(".");
  const base = dotIndex > 0 ? safe.slice(0, dotIndex) : safe;
  const extFromName = dotIndex > 0 ? safe.slice(dotIndex + 1).toLowerCase() : "";
  const desiredFormat = options?.contentFormat ?? defaultFormat;

  if (extFromName === "md" || extFromName === "markdown") {
    return { fileName: `${base}.md`, contentFormat: "markdown" as const };
  }
  if (extFromName === "txt") {
    return { fileName: `${base}.txt`, contentFormat: "plain" as const };
  }
  if (extFromName === "html" || extFromName === "htm") {
    return { fileName: `${base}.${extFromName}`, contentFormat: "html" as const };
  }
  if (extFromName === "css") {
    return { fileName: `${base}.css`, contentFormat: "css" as const };
  }
  if (extFromName === "js" || extFromName === "javascript" || extFromName === "mjs" || extFromName === "cjs") {
    return { fileName: `${base}.${extFromName === "javascript" ? "js" : extFromName}`, contentFormat: "javascript" as const };
  }

  if (desiredFormat === "markdown") {
    return { fileName: `${base}.md`, contentFormat: "markdown" as const };
  }
  if (desiredFormat === "html") {
    return { fileName: `${base}.html`, contentFormat: "html" as const };
  }
  if (desiredFormat === "css") {
    return { fileName: `${base}.css`, contentFormat: "css" as const };
  }
  if (desiredFormat === "javascript" || desiredFormat === "js") {
    return { fileName: `${base}.js`, contentFormat: "javascript" as const };
  }
  return { fileName: `${base}.${defaultExt}`, contentFormat: defaultFormat };
}

describe("JavaScript and Code File Creation", () => {
  it("normalizes fileName when given a .js extension directly", () => {
    const res = normalizeNewFileOptions({ fileName: "app.js" });
    expect(res.fileName).toBe("app.js");
    expect(res.contentFormat).toBe("javascript");
  });

  it("normalizes fileName when given a .mjs or .cjs extension", () => {
    const resMjs = normalizeNewFileOptions({ fileName: "module.mjs" });
    expect(resMjs.fileName).toBe("module.mjs");
    expect(resMjs.contentFormat).toBe("javascript");

    const resCjs = normalizeNewFileOptions({ fileName: "script.cjs" });
    expect(resCjs.fileName).toBe("script.cjs");
    expect(resCjs.contentFormat).toBe("javascript");
  });

  it("normalizes fileName without extension when contentFormat is javascript", () => {
    const res = normalizeNewFileOptions({ fileName: "main", contentFormat: "javascript" });
    expect(res.fileName).toBe("main.js");
    expect(res.contentFormat).toBe("javascript");
  });

  it("normalizes empty fileName with javascript contentFormat to Untitled.js", () => {
    const res = normalizeNewFileOptions({ fileName: "", contentFormat: "javascript" });
    expect(res.fileName).toBe("Untitled.js");
    expect(res.contentFormat).toBe("javascript");
  });

  it("never converts a .js file to .md", () => {
    const res = normalizeNewFileOptions({ fileName: "index.js", contentFormat: "javascript" });
    expect(res.fileName).not.toContain(".md");
    expect(res.contentFormat).not.toBe("markdown");
    expect(res.fileName).toBe("index.js");
    expect(res.contentFormat).toBe("javascript");
  });

  it("returns blank template content for javascript", () => {
    const tpl = getDefaultTemplateForExtension(
      { defaultTemplateMd: "meeting" as any },
      "script.js"
    );
    expect(tpl).toBe("blank");

    const content = getNoteTemplateContent(tpl, "en", "javascript");
    expect(content).toBe("");
    expect(content).not.toContain("<h1>");
    expect(content).not.toContain("# ");
  });

  it("identifies .js file as non-markdown", () => {
    expect(isMarkdownFileName("test.js", "javascript")).toBe(false);
    expect(isMarkdownFileName("app.mjs", "javascript")).toBe(false);
  });

  it("provides correct icon and badge label for javascript files", () => {
    const icon = getDefaultFileIconKey("main.js", undefined, "javascript");
    expect(icon).toBe("fileCode");

    const badge = getFileFormatLabel(
      { fileName: "main.js", contentFormat: "javascript" },
      "en"
    );
    expect(badge).toBe("JavaScript");
  });
});
