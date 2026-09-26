import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCleanRelPath,
  downloadMediaFile,
  copyTextToClipboard,
  copyMediaPath,
} from "./mediaContextMenuUtils";

describe("mediaContextMenuUtils", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCleanRelPath", () => {
    it("should clean leading ../ and ./ and decode URI components", () => {
      expect(getCleanRelPath("./attachments/photo%201.png")).toBe("attachments/photo 1.png");
      expect(getCleanRelPath("../../assets/video.mp4")).toBe("assets/video.mp4");
      expect(getCleanRelPath("luno-asset:///C:/workspace/video.webm")).toBe("C:/workspace/video.webm");
    });

    it("should return empty string for empty input", () => {
      expect(getCleanRelPath("")).toBe("");
    });
  });

  describe("downloadMediaFile", () => {
    it("should create an anchor element, set download attribute and click", () => {
      const clickMock = vi.fn();
      const appendChildMock = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
      const removeChildMock = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
      const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        const el = document.createElementNS("http://www.w3.org/1999/xhtml", tagName) as any;
        el.click = clickMock;
        return el;
      });

      downloadMediaFile("blob:http://localhost/12345", "my_recording.webm");

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(appendChildMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(removeChildMock).toHaveBeenCalled();
    });
  });

  describe("copyTextToClipboard", () => {
    it("should use navigator.clipboard.writeText if available", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const res = await copyTextToClipboard("attachments/sample.png", "Copied");
      expect(res).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("attachments/sample.png");
    });
  });

  describe("copyMediaPath", () => {
    it("should copy relative path correctly", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const res = await copyMediaPath("attachments/image.png", undefined, "relative");
      expect(res).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("attachments/image.png");
    });

    it("should copy full path using electronAPI workspace if available", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      (window as any).electronAPI = {
        getSavedWorkspace: vi.fn().mockResolvedValue({ folderPath: "C:/MyVault" }),
      };

      const res = await copyMediaPath("attachments/image.png", "attachments/image.png", "full");
      expect(res).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("C:/MyVault/attachments/image.png");
    });
  });
});
