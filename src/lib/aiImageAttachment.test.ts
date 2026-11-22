import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { saveAiImageToWorkspaceAttachment } from "@/lib/aiImageAttachment";
import { imageLocalCache } from "@/components/editor/ImageNodeView";

const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

describe("aiImageAttachment", () => {
  const originalElectronApi = window.electronAPI;

  beforeEach(() => {
    imageLocalCache.clear();
  });

  afterEach(() => {
    window.electronAPI = originalElectronApi;
    vi.restoreAllMocks();
  });

  it("saves generated image to Electron workspace attachments/ and computes nested relative path", async () => {
    const writeFileBase64 = vi.fn().mockResolvedValue(true);
    const readDirectoryFiles = vi.fn().mockResolvedValue([]);
    window.electronAPI = {
      getSavedWorkspace: vi.fn().mockResolvedValue({
        folderPath: "/vault/my-notes",
        folderName: "my-notes",
      }),
      readDirectoryFiles,
      writeFileBase64,
    };

    const result = await saveAiImageToWorkspaceAttachment({
      dataUrl: TINY_PNG_DATA_URL,
      prompt: "Cute cat on moon",
      mimeType: "image/png",
      targetFolderPath: "projects/design",
    });

    expect(writeFileBase64).toHaveBeenCalledTimes(1);
    const callArg = writeFileBase64.mock.calls[0][0];
    expect(callArg.fullPath).toMatch(/^\/vault\/my-notes\/attachments\/luno_ai_cute_cat_on_moon_\d+\.png$/);
    expect(result.relativeSrc).toMatch(/^\.\.\/\.\.\/attachments\/luno_ai_cute_cat_on_moon_\d+\.png$/);
    expect(result.markdown).toBe(`![Cute cat on moon](${result.relativeSrc})`);
    expect(result.htmlTag).toContain(`<img src="${result.relativeSrc}" alt="Cute cat on moon" />`);
  });

  it("falls back to embedding data URL when no disk workspace is connected", async () => {
    window.electronAPI = undefined;

    const result = await saveAiImageToWorkspaceAttachment({
      dataUrl: TINY_PNG_DATA_URL,
      prompt: "Abstract nebula",
      mimeType: "image/png",
    });

    expect(result.relativeSrc).toBeUndefined();
    expect(result.src).toBe(TINY_PNG_DATA_URL);
    expect(result.markdown).toBe(`![Abstract nebula](${TINY_PNG_DATA_URL})`);
  });
});
