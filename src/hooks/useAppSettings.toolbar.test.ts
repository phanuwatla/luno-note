import { describe, it, expect } from "vitest";
import {
  DEFAULT_TOOLBAR_ORDER,
  DEFAULT_HIDDEN_TOOLBAR_ITEMS,
  TOOLBAR_PRESETS,
  normalizeSettings,
  useAppSettings,
} from "./useAppSettings";
import { getToolbarIcon } from "@/lib/iconPacks";

describe("Toolbar Configuration - Superscript & Subscript", () => {
  it("includes superscript and subscript in DEFAULT_TOOLBAR_ORDER", () => {
    expect(DEFAULT_TOOLBAR_ORDER).toContain("superscript");
    expect(DEFAULT_TOOLBAR_ORDER).toContain("subscript");

    const highlightIdx = DEFAULT_TOOLBAR_ORDER.indexOf("highlight");
    const textColorIdx = DEFAULT_TOOLBAR_ORDER.indexOf("textColor");
    const alignIdx = DEFAULT_TOOLBAR_ORDER.indexOf("align");
    const superIdx = DEFAULT_TOOLBAR_ORDER.indexOf("superscript");
    const subIdx = DEFAULT_TOOLBAR_ORDER.indexOf("subscript");
    const listIdx = DEFAULT_TOOLBAR_ORDER.indexOf("list");

    expect(textColorIdx).toBe(highlightIdx + 1);
    expect(alignIdx).toBe(textColorIdx + 1);
    expect(superIdx).toBe(alignIdx + 1);
    expect(subIdx).toBe(superIdx + 1);
    expect(listIdx).toBe(subIdx + 1);
  });

  it("includes superscript and subscript in DEFAULT_HIDDEN_TOOLBAR_ITEMS by default", () => {
    expect(DEFAULT_HIDDEN_TOOLBAR_ITEMS).toContain("superscript");
    expect(DEFAULT_HIDDEN_TOOLBAR_ITEMS).toContain("subscript");
  });

  it("all presets contain all tools from DEFAULT_TOOLBAR_ORDER without duplicates", () => {
    for (const preset of TOOLBAR_PRESETS) {
      expect(preset.order.length).toBe(DEFAULT_TOOLBAR_ORDER.length);
      expect(new Set(preset.order).size).toBe(DEFAULT_TOOLBAR_ORDER.length);

      for (const item of DEFAULT_TOOLBAR_ORDER) {
        expect(preset.order, `Preset ${preset.id} missing ${item}`).toContain(item);
      }

      for (const hiddenItem of preset.hidden) {
        expect(DEFAULT_TOOLBAR_ORDER, `Preset ${preset.id} has invalid hidden item ${hiddenItem}`).toContain(hiddenItem);
      }
    }
  });

  it("configures superscript and subscript appropriately across presets", () => {
    const standard = TOOLBAR_PRESETS.find((p) => p.id === "standard")!;
    expect(standard.hidden).toContain("superscript");
    expect(standard.hidden).toContain("subscript");

    const minimal = TOOLBAR_PRESETS.find((p) => p.id === "minimal")!;
    expect(minimal.hidden).toContain("superscript");
    expect(minimal.hidden).toContain("subscript");

    const tasks = TOOLBAR_PRESETS.find((p) => p.id === "tasks")!;
    expect(tasks.hidden).toContain("superscript");
    expect(tasks.hidden).toContain("subscript");

    const academic = TOOLBAR_PRESETS.find((p) => p.id === "academic")!;
    expect(academic.hidden).not.toContain("superscript");
    expect(academic.hidden).not.toContain("subscript");

    const technical = TOOLBAR_PRESETS.find((p) => p.id === "technical")!;
    expect(technical.hidden).toContain("superscript");
    expect(technical.hidden).toContain("subscript");

    const all = TOOLBAR_PRESETS.find((p) => p.id === "all")!;
    expect(all.hidden).toEqual([]);
  });

  it("migrates existing user settings so newly added tools default to hidden", () => {
    // Simulate existing user saved state before superscript/subscript were added
    const oldSavedSettings = {
      toolbarItemsOrder: [
        "undo",
        "redo",
        "h1",
        "h2",
        "bold",
        "italic",
        "underline",
        "strike",
        "highlight",
        "bulletList",
      ],
      hiddenToolbarItems: ["h3", "h4", "h5", "h6"],
    };

    const loaded = normalizeSettings(oldSavedSettings as any);

    expect(loaded.toolbarItemsOrder).toContain("superscript");
    expect(loaded.toolbarItemsOrder).toContain("subscript");
    expect(loaded.hiddenToolbarItems).toContain("superscript");
    expect(loaded.hiddenToolbarItems).toContain("subscript");
  });

  it("includes qrCode in DEFAULT_TOOLBAR_ORDER and DEFAULT_HIDDEN_TOOLBAR_ITEMS", () => {
    expect(DEFAULT_TOOLBAR_ORDER).toContain("qrCode");
    expect(DEFAULT_HIDDEN_TOOLBAR_ITEMS).toContain("qrCode");
  });

  it("migrates existing user settings so qrCode defaults to hidden", () => {
    const oldSavedSettings = {
      toolbarItemsOrder: [
        "undo",
        "redo",
        "h1",
        "h2",
        "bold",
        "italic",
        "underline",
      ],
      hiddenToolbarItems: ["h3", "h4"],
    };

    const loaded = normalizeSettings(oldSavedSettings as any);

    expect(loaded.toolbarItemsOrder).toContain("qrCode");
    expect(loaded.hiddenToolbarItems).toContain("qrCode");
  });

  it("resolves qrCode icon across all icon packs", () => {
    const packs = ["lucide", "tabler", "phosphor"] as const;
    for (const pack of packs) {
      const QrIcon = getToolbarIcon("qrCode", pack);
      expect(QrIcon).toBeDefined();
    }
  });

  it("includes heading in DEFAULT_TOOLBAR_ORDER and resolves icons", () => {
    expect(DEFAULT_TOOLBAR_ORDER).toContain("heading");
    expect(DEFAULT_HIDDEN_TOOLBAR_ITEMS).not.toContain("heading");

    const packs = ["lucide", "tabler", "phosphor"] as const;
    for (const pack of packs) {
      const HeadingIcon = getToolbarIcon("heading", pack);
      expect(HeadingIcon).toBeDefined();
    }
  });

  it("migrates legacy h1-h6 items into single heading tool in user settings", () => {
    const legacySettings = {
      toolbarItemsOrder: [
        "undo",
        "redo",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "bold",
      ],
      hiddenToolbarItems: ["h3", "h4", "h5", "h6"],
    };

    const loaded = normalizeSettings(legacySettings as any);
    expect(loaded.toolbarItemsOrder).toContain("heading");
    expect(loaded.toolbarItemsOrder).not.toContain("h1");
    expect(loaded.toolbarItemsOrder).not.toContain("h2");
    expect(loaded.toolbarItemsOrder).not.toContain("h3");
    expect(loaded.hiddenToolbarItems).not.toContain("heading");
  });

  it("includes fontFamily, fontSize, textColor, and align in DEFAULT_TOOLBAR_ORDER and resolves icons", () => {
    expect(DEFAULT_TOOLBAR_ORDER).toContain("fontFamily");
    expect(DEFAULT_TOOLBAR_ORDER).toContain("fontSize");
    expect(DEFAULT_TOOLBAR_ORDER).toContain("textColor");
    expect(DEFAULT_TOOLBAR_ORDER).toContain("align");
    expect(DEFAULT_HIDDEN_TOOLBAR_ITEMS).not.toContain("fontFamily");
    expect(DEFAULT_HIDDEN_TOOLBAR_ITEMS).not.toContain("fontSize");
    expect(DEFAULT_HIDDEN_TOOLBAR_ITEMS).not.toContain("textColor");
    expect(DEFAULT_HIDDEN_TOOLBAR_ITEMS).not.toContain("align");

    const packs = ["lucide", "tabler", "phosphor"] as const;
    for (const pack of packs) {
      expect(getToolbarIcon("fontFamily", pack)).toBeDefined();
      expect(getToolbarIcon("fontSize", pack)).toBeDefined();
      expect(getToolbarIcon("textColor", pack)).toBeDefined();
      expect(getToolbarIcon("align", pack)).toBeDefined();
      expect(getToolbarIcon("alignLeft", pack)).toBeDefined();
      expect(getToolbarIcon("alignCenter", pack)).toBeDefined();
      expect(getToolbarIcon("alignRight", pack)).toBeDefined();
      expect(getToolbarIcon("alignJustify", pack)).toBeDefined();
    }
  });

  it("migrates legacy bulletList/orderedList/taskList into list and codeBlock into code", () => {
    const legacySettings = {
      toolbarItemsOrder: [
        "undo",
        "redo",
        "bulletList",
        "orderedList",
        "taskList",
        "code",
        "codeBlock",
      ],
      hiddenToolbarItems: [],
    };

    const loaded = normalizeSettings(legacySettings as any);
    expect(loaded.toolbarItemsOrder).toContain("list");
    expect(loaded.toolbarItemsOrder).toContain("code");
    expect(loaded.toolbarItemsOrder).not.toContain("bulletList");
    expect(loaded.toolbarItemsOrder).not.toContain("orderedList");
    expect(loaded.toolbarItemsOrder).not.toContain("taskList");
    expect(loaded.toolbarItemsOrder).not.toContain("codeBlock");

    const packs = ["lucide", "tabler", "phosphor"] as const;
    for (const pack of packs) {
      expect(getToolbarIcon("list", pack)).toBeDefined();
      expect(getToolbarIcon("bulletList", pack)).toBeDefined();
      expect(getToolbarIcon("orderedList", pack)).toBeDefined();
      expect(getToolbarIcon("taskList", pack)).toBeDefined();
      expect(getToolbarIcon("code", pack)).toBeDefined();
      expect(getToolbarIcon("codeBlock", pack)).toBeDefined();
    }
  });

  it("defaults showToolbar to true in normalized settings", () => {
    const loaded = normalizeSettings({});
    expect(loaded.showToolbar).toBe(true);
  });

  it("respects showToolbar when explicitly set to false", () => {
    const loaded = normalizeSettings({ showToolbar: false });
    expect(loaded.showToolbar).toBe(false);
  });

  it("respects showToolbar when set to true", () => {
    const loaded = normalizeSettings({ showToolbar: true });
    expect(loaded.showToolbar).toBe(true);
  });

  it("includes video in DEFAULT_TOOLBAR_ORDER right after image", () => {
    expect(DEFAULT_TOOLBAR_ORDER).toContain("video");
    const imageIdx = DEFAULT_TOOLBAR_ORDER.indexOf("image");
    const videoIdx = DEFAULT_TOOLBAR_ORDER.indexOf("video");
    expect(videoIdx).toBe(imageIdx + 1);
  });

  it("resolves video icon across all icon packs", () => {
    const packs = ["lucide", "tabler", "phosphor"] as const;
    for (const pack of packs) {
      const VideoIcon = getToolbarIcon("video", pack);
      expect(VideoIcon).toBeDefined();
    }
  });

  it("defaults showFileIcons to true in normalized settings", () => {
    const loaded = normalizeSettings({});
    expect(loaded.showFileIcons).toBe(true);
  });

  it("respects showFileIcons when explicitly set to false", () => {
    const loaded = normalizeSettings({ showFileIcons: false });
    expect(loaded.showFileIcons).toBe(false);
  });

  it("respects showFileIcons when set to true", () => {
    const loaded = normalizeSettings({ showFileIcons: true });
    expect(loaded.showFileIcons).toBe(true);
  });
});


