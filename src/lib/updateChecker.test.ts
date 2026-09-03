import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compareVersions, checkForAppUpdate } from "./updateChecker";

describe("updateChecker", () => {
  describe("compareVersions", () => {
    it("correctly identifies newer, older, and equal versions", () => {
      expect(compareVersions("1.1.2", "1.1.1")).toBe(1);
      expect(compareVersions("v1.2.0", "1.1.9")).toBe(1);
      expect(compareVersions("2.0.0", "1.99.99")).toBe(1);
      expect(compareVersions("1.1.0", "1.1.1")).toBe(-1);
      expect(compareVersions("1.1.1", "1.1.1")).toBe(0);
      expect(compareVersions("v1.1.1", "1.1.1")).toBe(0);
      expect(compareVersions("1.1.1-beta", "1.1.1")).toBe(0);
      expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
    });
  });

  describe("checkForAppUpdate", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("returns hasUpdate = true when GitHub has a newer release", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: "v1.2.0",
          name: "Luno Note v1.2.0",
          html_url: "https://github.com/phanuwatla/luno-note/releases/tag/v1.2.0",
          body: "New features added",
          assets: [
            {
              name: "luno-note-setup-1.2.0.exe",
              browser_download_url: "https://github.com/phanuwatla/luno-note/releases/download/v1.2.0/luno-note-setup-1.2.0.exe",
            },
          ],
        }),
      });

      const result = await checkForAppUpdate("1.1.1");
      expect(result.hasUpdate).toBe(true);
      expect(result.latestVersion).toBe("1.2.0");
      expect(result.downloadUrl).toBe("https://github.com/phanuwatla/luno-note/releases/download/v1.2.0/luno-note-setup-1.2.0.exe");
    });

    it("returns hasUpdate = false when current version is equal or newer", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: "v1.1.1",
          name: "Luno Note v1.1.1",
          html_url: "https://github.com/phanuwatla/luno-note/releases/tag/v1.1.1",
          assets: [],
        }),
      });

      const result = await checkForAppUpdate("1.1.1");
      expect(result.hasUpdate).toBe(false);
      expect(result.latestVersion).toBe("1.1.1");
    });

    it("handles network failure gracefully without throwing", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

      const result = await checkForAppUpdate("1.1.1");
      expect(result.hasUpdate).toBe(false);
      expect(result.currentVersion).toBe("1.1.1");
    });
  });
});
