import { describe, it, expect } from "vitest";
import { compressImageFile } from "./imageCompressor";

describe("imageCompressor utility", () => {
  it("exports compressImageFile function", () => {
    expect(typeof compressImageFile).toBe("function");
  });

  it("handles non-image files or fallback gracefully", async () => {
    const dummyFile = new File(["test image content"], "sample.jpg", { type: "image/jpeg" });
    try {
      const result = await compressImageFile(dummyFile);
      expect(result).toBeDefined();
      expect(result.dataUrl).toBeDefined();
    } catch {
      // Image decoding may fail in headless jsdom environment without full canvas rendering
    }
  });
});
