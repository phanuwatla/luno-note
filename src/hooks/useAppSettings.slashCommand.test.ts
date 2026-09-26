import { describe, it, expect } from "vitest";
import { normalizeSettings, DEFAULT_SETTINGS } from "./useAppSettings";

describe("useAppSettings - enableSlashCommand", () => {
  it("defaults enableSlashCommand to true in DEFAULT_SETTINGS", () => {
    expect(DEFAULT_SETTINGS.enableSlashCommand).toBe(true);
  });

  it("normalizes undefined or empty raw settings to enableSlashCommand: true", () => {
    const normalized = normalizeSettings({});
    expect(normalized.enableSlashCommand).toBe(true);

    const fromNull = normalizeSettings(null);
    expect(fromNull.enableSlashCommand).toBe(true);
  });

  it("preserves enableSlashCommand: false when explicitly configured", () => {
    const normalized = normalizeSettings({ enableSlashCommand: false });
    expect(normalized.enableSlashCommand).toBe(false);
  });

  it("preserves enableSlashCommand: true when explicitly configured", () => {
    const normalized = normalizeSettings({ enableSlashCommand: true });
    expect(normalized.enableSlashCommand).toBe(true);
  });
});
