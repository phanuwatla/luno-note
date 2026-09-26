import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  ImageItemThumbnail,
  IMAGE_EXTENSIONS,
  type ScannedImageItem,
} from "./WorkspaceImagePickerDialog";
import {
  VideoItemThumbnail,
  captureVideoFrame,
  videoThumbnailCache,
  isVideoNote,
  type ScannedVideoItem,
} from "./WorkspaceVideoPickerDialog";
import { imageLocalCache } from "./ImageNodeView";
import { videoLocalCache } from "./VideoNodeView";

describe("WorkspaceMediaPickers - Image & Video Thumbnail Previews", () => {
  beforeEach(() => {
    imageLocalCache.clear();
    videoLocalCache.clear();
    videoThumbnailCache.clear();
    vi.restoreAllMocks();
  });

  describe("IMAGE_EXTENSIONS", () => {
    it("recognizes standard image extensions", () => {
      expect(IMAGE_EXTENSIONS.has(".png")).toBe(true);
      expect(IMAGE_EXTENSIONS.has(".jpg")).toBe(true);
      expect(IMAGE_EXTENSIONS.has(".jpeg")).toBe(true);
      expect(IMAGE_EXTENSIONS.has(".webp")).toBe(true);
      expect(IMAGE_EXTENSIONS.has(".gif")).toBe(true);
      expect(IMAGE_EXTENSIONS.has(".svg")).toBe(true);
      expect(IMAGE_EXTENSIONS.has(".mp4")).toBe(false);
    });
  });

  describe("ImageItemThumbnail", () => {
    it("renders image immediately if previewUrl is provided", () => {
      const item: ScannedImageItem = {
        id: "img-1",
        fileName: "photo.png",
        folderPath: "attachments",
        relativePath: "attachments/photo.png",
        isAttachment: true,
      };

      const { container } = render(
        <ImageItemThumbnail item={item} previewUrl="blob:http://localhost/test-image" />
      );

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("blob:http://localhost/test-image");
      expect(img?.getAttribute("alt")).toBe("photo.png");
    });

    it("uses imageLocalCache if cached preview exists", () => {
      imageLocalCache.set("attachments/cached.png", "blob:http://localhost/cached-blob");

      const item: ScannedImageItem = {
        id: "img-2",
        fileName: "cached.png",
        folderPath: "attachments",
        relativePath: "attachments/cached.png",
        isAttachment: true,
      };

      const { container } = render(<ImageItemThumbnail item={item} />);

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("blob:http://localhost/cached-blob");
    });

    it("resolves via electronAPI.readImageDataUrl when in Electron environment", async () => {
      const mockDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const readImageDataUrlMock = vi.fn().mockResolvedValue(mockDataUrl);

      (window as any).electronAPI = {
        readImageDataUrl: readImageDataUrlMock,
      };

      const item: ScannedImageItem = {
        id: "img-3",
        fileName: "desktop-image.png",
        folderPath: "attachments",
        relativePath: "attachments/desktop-image.png",
        fullPath: "C:/workspace/attachments/desktop-image.png",
        isAttachment: true,
      };

      const onResolved = vi.fn();
      const { container } = render(
        <ImageItemThumbnail item={item} onResolved={onResolved} />
      );

      await waitFor(() => {
        expect(readImageDataUrlMock).toHaveBeenCalledWith("C:/workspace/attachments/desktop-image.png");
      });

      await waitFor(() => {
        const img = container.querySelector("img");
        expect(img).not.toBeNull();
        expect(img?.getAttribute("src")).toBeTruthy();
        expect(onResolved).toHaveBeenCalled();
      });

      delete (window as any).electronAPI;
    });

    it("falls back to FileImage icon if resolution fails", async () => {
      const item: ScannedImageItem = {
        id: "img-4",
        fileName: "missing.png",
        folderPath: "attachments",
        relativePath: "attachments/missing.png",
        isAttachment: true,
      };

      const { container } = render(<ImageItemThumbnail item={item} />);

      await waitFor(() => {
        const img = container.querySelector("img");
        expect(img).toBeNull();
      });
    });
  });

  describe("VideoItemThumbnail", () => {
    it("renders companion image poster immediately when posterSrc is provided", () => {
      const item: ScannedVideoItem = {
        id: "vid-1",
        fileName: "nature.mp4",
        folderPath: "attachments",
        relativePath: "attachments/nature.mp4",
        isAttachment: true,
        posterSrc: "blob:http://localhost/nature-poster.jpg",
      };

      const { container } = render(<VideoItemThumbnail item={item} />);

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("blob:http://localhost/nature-poster.jpg");
    });

    it("uses videoThumbnailCache if extracted frame thumbnail is cached", () => {
      videoThumbnailCache.set("attachments/demo.mp4", "data:image/jpeg;base64,frameThumbnail");

      const item: ScannedVideoItem = {
        id: "vid-2",
        fileName: "demo.mp4",
        folderPath: "attachments",
        relativePath: "attachments/demo.mp4",
        isAttachment: true,
      };

      const { container } = render(<VideoItemThumbnail item={item} />);

      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("data:image/jpeg;base64,frameThumbnail");
    });

    it("resolves companion image via Electron fullPath", async () => {
      const mockPosterDataUrl = "data:image/jpeg;base64,mockPosterContent";
      const readImageDataUrlMock = vi.fn().mockResolvedValue(mockPosterDataUrl);

      (window as any).electronAPI = {
        readImageDataUrl: readImageDataUrlMock,
      };

      const item: ScannedVideoItem = {
        id: "vid-3",
        fileName: "clip.mp4",
        folderPath: "attachments",
        relativePath: "attachments/clip.mp4",
        fullPath: "C:/notes/attachments/clip.mp4",
        companionImageFullPath: "C:/notes/attachments/clip.png",
        isAttachment: true,
      };

      const { container } = render(<VideoItemThumbnail item={item} />);

      await waitFor(() => {
        expect(readImageDataUrlMock).toHaveBeenCalledWith("C:/notes/attachments/clip.png");
      });

      await waitFor(() => {
        const img = container.querySelector("img");
        expect(img).not.toBeNull();
        expect(img?.getAttribute("src")).toBeTruthy();
      });

      delete (window as any).electronAPI;
    });

    it("falls back to Film icon if video has no source or poster", async () => {
      const item: ScannedVideoItem = {
        id: "vid-4",
        fileName: "corrupt.mp4",
        folderPath: "attachments",
        relativePath: "attachments/corrupt.mp4",
        isAttachment: true,
      };

      const { container } = render(<VideoItemThumbnail item={item} />);

      await waitFor(() => {
        const img = container.querySelector("img");
        expect(img).toBeNull();
      });
    });
  });

  describe("captureVideoFrame", () => {
    it("returns null safely if videoUrl is empty", async () => {
      const result = await captureVideoFrame("");
      expect(result).toBeNull();
    });

    it("returns cached frame if available in videoThumbnailCache", async () => {
      videoThumbnailCache.set("http://test.com/sample.mp4", "data:image/jpeg;base64,cachedSample");
      const result = await captureVideoFrame("http://test.com/sample.mp4");
      expect(result).toBe("data:image/jpeg;base64,cachedSample");
    });
  });

  describe("isVideoNote - Audio WebM Filtering", () => {
    it("excludes voice recordings and audio WebM from video picker", () => {
      expect(isVideoNote({ id: "1", title: "Voice Note - 2026-09-11 20_49.webm", content: "" } as any)).toBe(false);
      expect(isVideoNote({ id: "2", title: "audio_memo.webm", content: "" } as any)).toBe(false);
      expect(isVideoNote({ id: "3", title: "interview_recording.webm", content: "" } as any)).toBe(false);
      expect(isVideoNote({ id: "4", title: "podcast_clip.weba", content: "" } as any)).toBe(false);
    });

    it("includes screen recordings, mp4, and explicit video WebM", () => {
      expect(isVideoNote({ id: "5", title: "screen_recording.webm", content: "" } as any)).toBe(true);
      expect(isVideoNote({ id: "6", title: "screencast_demo.webm", content: "" } as any)).toBe(true);
      expect(isVideoNote({ id: "7", title: "tutorial.mp4", content: "" } as any)).toBe(true);
      expect(isVideoNote({ id: "8", title: "clip.mov", content: "" } as any)).toBe(true);
    });
  });
});
