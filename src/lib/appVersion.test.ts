import { describe, it, expect } from "vitest";
import { APP_VERSION } from "./appVersion";
import packageJson from "../../package.json";

describe("appVersion", () => {
  it("should match package.json version", () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION).toBe("1.1.2");
  });
});
