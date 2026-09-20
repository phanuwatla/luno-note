import { describe, it, expect } from "vitest";
import { APP_VERSION, APP_AUTHOR, APP_AUTHOR_URL, APP_COPYRIGHT, APP_ABOUT_CREDIT, APP_LATEST_RELEASE_URL } from "./appVersion";
import packageJson from "../../package.json";

describe("appVersion", () => {
  it("should match package.json version", () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("should have correct author metadata", () => {
    expect(APP_AUTHOR).toBe("phanuwatla");
    expect(APP_AUTHOR_URL).toBe("https://github.com/phanuwatla");
    expect(APP_COPYRIGHT).toBe("Copyright © 2026 phanuwatla");
    expect(APP_ABOUT_CREDIT).toBe("Made by phanuwatla © 2026 Luno Note");
    expect(APP_LATEST_RELEASE_URL).toBe("https://github.com/phanuwatla/luno-note/releases/latest");
  });
});
