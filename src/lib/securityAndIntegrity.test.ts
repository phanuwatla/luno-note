import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { savePdfAnnotationSidecar, loadPdfAnnotationSidecar } from "@/lib/inkoPdfBridge";
import { generateQrCodeSvg } from "@/lib/qrCode";
import { parseEncryptedEnvelope } from "@/lib/noteCrypto";
import { sanitizeWorkspaceSettingsPayload } from "@/hooks/useAppSettings";
import { generatePdfHtml } from "@/lib/pdfExportGenerator";
import { generateDocHtml } from "@/lib/docExportGenerator";
import { docxToHtml } from "@/lib/docxUtils";

describe("Security & Data Integrity Regression Guards", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("C-04: PDF bookmark saves never overwrite PDF annotations in localStorage", async () => {
    const params = {
      noteId: "note-pdf-1",
      fileName: "report.pdf",
      folderPath: "docs",
      filePath: "/workspace/docs/report.pdf",
    };

    const canvasData = JSON.stringify({ pages: { "1": { strokes: [{ id: "s1" }] } } });
    const bookmarks = [{ id: "bm-1", page: 1, title: "Intro", createdAt: new Date().toISOString() }];

    await savePdfAnnotationSidecar({
      ...params,
      canvasData,
      bookmarks,
      addHistoryVersion: false,
    });

    const allKeys = Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) || "");
    const annotationKeys = allKeys.filter((k) => k.startsWith("luno-pdf-annotations:"));
    const bookmarkKeys = allKeys.filter((k) => k.startsWith("luno-pdf-bookmarks:"));

    expect(annotationKeys.length).toBeGreaterThan(0);
    expect(bookmarkKeys.length).toBeGreaterThan(0);

    const loaded = await loadPdfAnnotationSidecar(params);
    expect(loaded).not.toBeNull();
    expect(loaded!.canvasData).toBe(canvasData);
    expect(loaded!.bookmarks).toEqual(bookmarks);
  });

  it("C-01: QR SVG generator rejects XSS payloads in color and numeric parameters", () => {
    const svg = generateQrCodeSvg("https://example.com", {
      foregroundColor: '" onload="alert(1)" fill="',
      backgroundColor: 'white"><script>alert(1)</script><rect fill="',
      size: ('300" onload="alert(1)' as unknown) as number,
      margin: (-999 as unknown) as number,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain('width="300"');
    expect(svg).not.toContain("onload");
    expect(svg).not.toContain("<script");
  });

  it("H-09: parseEncryptedEnvelope clamps PBKDF2 iterations within safe bounds", () => {
    const hugeEnvelope = JSON.stringify({
      luno_locked: true,
      version: 2,
      alg: "AES-GCM",
      kdf: "PBKDF2-SHA256",
      iterations: 999_999_999,
      salt: "AAAAAAAAAAAAAAAAAAAAAA==",
      iv: "AAAAAAAAAAAAAAAA",
      ciphertext: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    });
    const parsedHuge = parseEncryptedEnvelope(hugeEnvelope);
    expect(parsedHuge).not.toBeNull();
    expect(parsedHuge!.iterations).toBeLessThanOrEqual(2_000_000);

    const tinyEnvelope = JSON.stringify({
      luno_locked: true,
      version: 2,
      alg: "AES-GCM",
      kdf: "PBKDF2-SHA256",
      iterations: 1,
      salt: "AAAAAAAAAAAAAAAAAAAAAA==",
      iv: "AAAAAAAAAAAAAAAA",
      ciphertext: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    });
    const parsedTiny = parseEncryptedEnvelope(tinyEnvelope);
    expect(parsedTiny).not.toBeNull();
    expect(parsedTiny!.iterations).toBeGreaterThanOrEqual(100_000);
  });

  it("C-03: sanitizeWorkspaceSettingsPayload strips local secrets and personal credentials", () => {
    const payload = sanitizeWorkspaceSettingsPayload({
      theme: "emerald",
      userName: "Alice",
      geminiApiKey: "AIza-secret-key",
      googleDriveClientId: "client-id-secret",
      ollamaBaseUrl: "http://192.168.1.50:11434",
    } as any);

    expect((payload as any).userName).toBeUndefined();
    expect((payload as any).geminiApiKey).toBeUndefined();
    expect((payload as any).googleDriveClientId).toBeUndefined();
    expect((payload as any).ollamaBaseUrl).toBeUndefined();
    expect(payload.theme).toBe("emerald");
  });

  it("LN-SEC-02: PDF and DOC export generators sanitize bodyHtml and reject CSS injection in theme/font options", () => {
    const maliciousBody =
      '<p>Safe paragraph</p><script>window.__pwned = true;</script><img src="x" onerror="alert(1)" /><iframe src="file:///etc/passwd"></iframe>';
    const pdfHtml = generatePdfHtml({
      title: "Test Note",
      bodyHtml: maliciousBody,
      customAccentColor: "#0d9488; } body { background: url(javascript:alert(1))",
      editorFontFamily: "inter'; } </style><script>alert(1)</script>",
    });
    expect(pdfHtml).toContain("Safe paragraph");
    expect(pdfHtml).not.toContain("<script");
    expect(pdfHtml).not.toContain("<iframe");
    expect(pdfHtml).not.toContain("onerror");
    expect(pdfHtml).not.toContain("javascript:alert");

    const docHtml = generateDocHtml({
      title: "Test Note",
      bodyHtml: maliciousBody,
      customAccentColor: "red; }</style><script>alert(1)</script>",
      editorFontFamily: "sarabun';}</style><script>alert(1)</script>",
    });
    expect(docHtml).toContain("Safe paragraph");
    expect(docHtml).not.toContain("<script");
    expect(docHtml).not.toContain("<iframe");
    expect(docHtml).not.toContain("onerror");
  });

  it("LN-SEC-02: docxToHtml sanitizes HTML returned from Mammoth before storing in notes", async () => {
    const win = window as unknown as {
      mammoth?: { convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
    };
    const prevMammoth = win.mammoth;
    win.mammoth = {
      convertToHtml: async () => ({
        value: '<p>Imported DOCX</p><script>alert("xss")</script><a href="javascript:alert(1)" onclick="evil()">Link</a>',
      }),
    };
    try {
      const dummyFile = {
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as File;
      const sanitized = await docxToHtml(dummyFile);
      expect(sanitized).toContain("<p>Imported DOCX</p>");
      expect(sanitized).not.toContain("<script");
      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).not.toContain("onclick");
    } finally {
      win.mammoth = prevMammoth;
    }
  });

  it("LN-SEC-01 & LN-PERF-02: Electron main process enforces symlink-aware confinement, OAuth state CSRF, and lazy mammoth loading", () => {
    const mainJsPath = path.resolve(process.cwd(), "electron/main.js");
    const mainJs = fs.readFileSync(mainJsPath, "utf8");

    expect(mainJs).toContain("resolveExistingRealPath");
    expect(mainJs).toContain("isAllowedWorkspaceRoot");
    expect(mainJs).toContain("oauthState");
    expect(mainJs).toContain("queryState !== oauthState");

    const mainTsxPath = path.resolve(process.cwd(), "src/main.tsx");
    const mainTsx = fs.readFileSync(mainTsxPath, "utf8");
    expect(mainTsx).not.toContain("mammoth.browser.min.js");
  });

  it("LN-TEST-01: package.json retains required development, test, and Electron build scripts", () => {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.dev).toBe("vite");
    expect(pkg.scripts.build).toBe("vite build");
    expect(pkg.scripts.test).toBe("vitest run");
    expect(pkg.scripts["helper:build"]).toContain("scripts/build-fix-language-helper.mjs");
    expect(pkg.scripts["electron:dev"]).toContain("concurrently");
    expect(pkg.scripts["electron:dev"]).toContain("electron .");
    expect(pkg.scripts["electron:build"]).toContain("electron-builder");
    expect(pkg.build?.appId).toBe("com.luno.note");
    expect(pkg.devDependencies?.electron).toBeDefined();
    expect(pkg.devDependencies?.vite).toBeDefined();
    expect(pkg.devDependencies?.vitest).toBeDefined();
  });
});
