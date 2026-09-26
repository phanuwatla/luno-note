import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard } from "./clipboardUtils";

describe("copyToClipboard", () => {
  const originalNavigator = global.navigator;
  const originalElectronAPI = (global.window as any)?.electronAPI;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalElectronAPI !== undefined) {
      (global.window as any).electronAPI = originalElectronAPI;
    } else {
      delete (global.window as any).electronAPI;
    }
  });

  it("returns false for null or undefined", async () => {
    expect(await copyToClipboard(null as unknown as string)).toBe(false);
    expect(await copyToClipboard(undefined as unknown as string)).toBe(false);
  });

  it("uses electronAPI.writeClipboardText when available", async () => {
    const writeClipboardText = vi.fn().mockResolvedValue(true);
    (global.window as any).electronAPI = { writeClipboardText };

    const result = await copyToClipboard("hello/path/note.md");
    expect(result).toBe(true);
    expect(writeClipboardText).toHaveBeenCalledWith("hello/path/note.md");
  });

  it("falls back to navigator.clipboard.writeText if electronAPI is not present", async () => {
    delete (global.window as any).electronAPI;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const result = await copyToClipboard("sub/test.txt");
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("sub/test.txt");
  });

  it("falls back to document.execCommand if navigator.clipboard throws", async () => {
    delete (global.window as any).electronAPI;
    const writeText = vi.fn().mockRejectedValue(new Error("Document not focused"));
    Object.assign(navigator, {
      clipboard: { writeText },
    });
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    const result = await copyToClipboard("folder/path");
    expect(result).toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });
});
