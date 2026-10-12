import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isSensitiveWebUrl, openExternalUrl } from "./urlUtils";

describe("urlUtils - isSensitiveWebUrl", () => {
  it("identifies Google AI Studio as sensitive", () => {
    expect(isSensitiveWebUrl("https://aistudio.google.com/app/apikey")).toBe(true);
    expect(isSensitiveWebUrl("https://aistudio.google.com/")).toBe(true);
  });

  it("identifies Google Cloud Console as sensitive", () => {
    expect(isSensitiveWebUrl("https://console.cloud.google.com/projectcreate")).toBe(true);
    expect(isSensitiveWebUrl("https://console.cloud.google.com/")).toBe(true);
  });

  it("identifies Google Accounts and myaccount as sensitive", () => {
    expect(isSensitiveWebUrl("https://accounts.google.com/signin")).toBe(true);
    expect(isSensitiveWebUrl("https://myaccount.google.com/security")).toBe(true);
  });

  it("identifies Google Drive as sensitive", () => {
    expect(isSensitiveWebUrl("https://drive.google.com/drive/folders/12345")).toBe(true);
  });

  it("identifies AI provider console and key portals as sensitive", () => {
    expect(isSensitiveWebUrl("https://platform.openai.com/api-keys")).toBe(true);
    expect(isSensitiveWebUrl("https://console.anthropic.com/settings/keys")).toBe(true);
    expect(isSensitiveWebUrl("https://console.groq.com/keys")).toBe(true);
    expect(isSensitiveWebUrl("https://openrouter.ai/keys")).toBe(true);
    expect(isSensitiveWebUrl("https://huggingface.co/settings/tokens")).toBe(true);
  });

  it("returns false for regular web URLs", () => {
    expect(isSensitiveWebUrl("https://www.google.com")).toBe(false);
    expect(isSensitiveWebUrl("https://www.google.com/search?q=test")).toBe(false);
    expect(isSensitiveWebUrl("https://github.com")).toBe(false);
    expect(isSensitiveWebUrl("https://wikipedia.org")).toBe(false);
    expect(isSensitiveWebUrl("https://developer.mozilla.org")).toBe(false);
  });

  it("returns false for invalid or empty URLs", () => {
    expect(isSensitiveWebUrl("")).toBe(false);
    expect(isSensitiveWebUrl("not a url")).toBe(false);
    expect(isSensitiveWebUrl("file:///C:/path/file.html")).toBe(false);
  });
});

describe("urlUtils - openExternalUrl", () => {
  const originalElectron = (window as any).electronAPI;
  const originalOpen = window.open;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    (window as any).electronAPI = originalElectron;
    window.open = originalOpen;
  });

  it("calls electronAPI.openExternal when available", () => {
    const mockOpenExternal = vi.fn().mockResolvedValue(true);
    (window as any).electronAPI = { openExternal: mockOpenExternal };

    openExternalUrl("https://aistudio.google.com/app/apikey");
    expect(mockOpenExternal).toHaveBeenCalledWith("https://aistudio.google.com/app/apikey");
  });

  it("falls back to window.open when electronAPI is absent", () => {
    delete (window as any).electronAPI;
    const mockWindowOpen = vi.fn();
    window.open = mockWindowOpen;

    openExternalUrl("https://aistudio.google.com/app/apikey");
    expect(mockWindowOpen).toHaveBeenCalledWith("https://aistudio.google.com/app/apikey", "_blank", "noopener,noreferrer");
  });
});
