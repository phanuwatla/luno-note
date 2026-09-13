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
    const superIdx = DEFAULT_TOOLBAR_ORDER.indexOf("superscript");
    const subIdx = DEFAULT_TOOLBAR_ORDER.indexOf("subscript");
    const bulletIdx = DEFAULT_TOOLBAR_ORDER.indexOf("bulletList");

    expect(superIdx).toBe(highlightIdx + 1);
    expect(subIdx).toBe(superIdx + 1);
    expect(bulletIdx).toBe(subIdx + 1);
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

  it("resolves superscript and subscript icons across all icon packs", () => {
    const packs = ["lucide", "tabler", "phosphor"] as const;
    for (const pack of packs) {
      const SuperIcon = getToolbarIcon("superscript", pack);
      const SubIcon = getToolbarIcon("subscript", pack);

      expect(SuperIcon).toBeDefined();
      expect(SubIcon).toBeDefined();
    }
  });
});
