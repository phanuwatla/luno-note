import { describe, it, expect } from "vitest";
import { getFaviconCandidates, resolveFaviconUrl, isLocalOrPrivateHost } from "./faviconUtils";

describe("faviconUtils", () => {
  describe("isLocalOrPrivateHost", () => {
    it("identifies local and private hosts", () => {
      expect(isLocalOrPrivateHost("localhost")).toBe(true);
      expect(isLocalOrPrivateHost("127.0.0.1")).toBe(true);
      expect(isLocalOrPrivateHost("192.168.1.100")).toBe(true);
      expect(isLocalOrPrivateHost("10.0.0.1")).toBe(true);
      expect(isLocalOrPrivateHost("myserver.local")).toBe(true);
    });

    it("identifies public hosts", () => {
      expect(isLocalOrPrivateHost("google.com")).toBe(false);
      expect(isLocalOrPrivateHost("github.com")).toBe(false);
      expect(isLocalOrPrivateHost("subdomain.example.org")).toBe(false);
    });
  });

  describe("resolveFaviconUrl", () => {
    it("returns absolute URLs untouched", () => {
      expect(resolveFaviconUrl("https://example.com/icon.png", "https://example.com")).toBe(
        "https://example.com/icon.png"
      );
      expect(resolveFaviconUrl("data:image/png;base64,123", "https://example.com")).toBe(
        "data:image/png;base64,123"
      );
    });

    it("resolves protocol-relative URLs", () => {
      expect(resolveFaviconUrl("//cdn.example.com/icon.png", "https://example.com")).toBe(
        "https://cdn.example.com/icon.png"
      );
    });

    it("resolves relative path URLs against base URL", () => {
      expect(resolveFaviconUrl("/assets/favicon.ico", "https://news.ycombinator.com/item?id=123")).toBe(
        "https://news.ycombinator.com/assets/favicon.ico"
      );
      expect(resolveFaviconUrl("favicon.ico", "https://example.com/dir/")).toBe(
        "https://example.com/dir/favicon.ico"
      );
    });
  });

  describe("getFaviconCandidates", () => {
    it("returns multi-tier candidates for standard public website", () => {
      const candidates = getFaviconCandidates("https://github.com/trending");
      expect(candidates).toContain("https://github.com/favicon.ico");
      expect(candidates).toContain("https://www.google.com/s2/favicons?domain=github.com&sz=32");
      expect(candidates).toContain("https://icons.duckduckgo.com/ip3/github.com.ico");
    });

    it("puts explicit favicon first and resolves it if relative", () => {
      const candidates = getFaviconCandidates("https://example.com/page", "/custom-icon.png");
      expect(candidates[0]).toBe("https://example.com/custom-icon.png");
      expect(candidates).toContain("https://icons.duckduckgo.com/ip3/example.com.ico");
      expect(candidates).toContain("https://example.com/favicon.ico");
      expect(candidates).toContain("https://example.com/icon.ico");
    });

    it("prioritizes DuckDuckGo before Google S2 for public hosts", () => {
      const candidates = getFaviconCandidates("https://luno-note.github.io");
      const ddgIndex = candidates.indexOf("https://icons.duckduckgo.com/ip3/luno-note.github.io.ico");
      const googleIndex = candidates.indexOf("https://www.google.com/s2/favicons?domain=luno-note.github.io&sz=32");
      expect(ddgIndex).toBeGreaterThanOrEqual(0);
      expect(googleIndex).toBeGreaterThanOrEqual(0);
      expect(ddgIndex).toBeLessThan(googleIndex);
    });

    it("does not treat old Google S2 fallback URL as explicit favicon", () => {
      const oldFallback = "https://www.google.com/s2/favicons?domain=luno-note.github.io&sz=32";
      const candidates = getFaviconCandidates("https://luno-note.github.io", oldFallback);
      // DuckDuckGo should still come before Google S2
      expect(candidates[0]).toBe("https://icons.duckduckgo.com/ip3/luno-note.github.io.ico");
    });

    it("avoids Google and DuckDuckGo resolvers for localhost", () => {
      const candidates = getFaviconCandidates("http://localhost:3000/app", "/logo.svg");
      expect(candidates).toContain("http://localhost:3000/logo.svg");
      expect(candidates).toContain("http://localhost:3000/favicon.ico");
      expect(candidates.some((c) => c.includes("google.com") || c.includes("duckduckgo.com"))).toBe(false);
    });

    it("handles note ID format with web: prefix", () => {
      const candidates = getFaviconCandidates("web:https://reddit.com");
      expect(candidates).toContain("https://reddit.com/favicon.ico");
      expect(candidates).toContain("https://icons.duckduckgo.com/ip3/reddit.com.ico");
      expect(candidates).toContain("https://www.google.com/s2/favicons?domain=reddit.com&sz=32");
    });
  });
});
