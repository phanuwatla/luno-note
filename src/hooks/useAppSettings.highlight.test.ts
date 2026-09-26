import { describe, it, expect } from "vitest";
import { getCustomCodeHighlightVars } from "./useAppSettings";

describe("getCustomCodeHighlightVars", () => {
  it("generates vibrant, crisp syntax highlighting for cool accent (teal)", () => {
    const tealHex = "#0d9488"; // h ~ 175
    const lightVars = getCustomCodeHighlightVars(tealHex, false);
    const darkVars = getCustomCodeHighlightVars(tealHex, true);

    expect(lightVars.hlKeyword).toMatch(/^hsl\(\d+\s+\d+%\s+\d+%\)$/);
    expect(lightVars.hlTag).toBe(lightVars.hlKeyword);
    expect(lightVars.hlAttr).toMatch(/^hsl\(218\s+/);
    expect(lightVars.hlString).toMatch(/^hsl\(32\s+/);
    expect(lightVars.hlNumber).toMatch(/^hsl\(20\s+/);
    expect(lightVars.hlPunct).toMatch(/^hsl\(215\s+/);

    // Dark mode: vibrant saturation (>= 68%), lightness ~64% (not washed out, not glaring)
    expect(darkVars.hlKeyword).toMatch(/^hsl\(175\s+(6\d|7\d|8\d)%\s+64%\)$/);
    expect(darkVars.hlTag).toBe(darkVars.hlKeyword);
    expect(darkVars.hlAttr).toMatch(/^hsl\(208\s+82%\s+70%\)$/);
    expect(darkVars.hlString).toMatch(/^hsl\(38\s+88%\s+67%\)$/);
    expect(darkVars.hlNumber).toMatch(/^hsl\(22\s+85%\s+68%\)$/);
    expect(darkVars.hlPunct).toMatch(/^hsl\(215\s+25%\s+68%\)$/);
  });

  it("generates vibrant, crisp syntax highlighting for warm accent (amber/orange)", () => {
    const orangeHex = "#f97316"; // h ~ 25
    const lightVars = getCustomCodeHighlightVars(orangeHex, false);
    const darkVars = getCustomCodeHighlightVars(orangeHex, true);

    // Light:
    expect(lightVars.hlKeyword).toMatch(/^hsl\(25\s+/);
    expect(lightVars.hlAttr).toMatch(/^hsl\(222\s+/);
    expect(lightVars.hlString).toMatch(/^hsl\(152\s+/);
    expect(lightVars.hlNumber).toMatch(/^hsl\(210\s+/);

    // Dark:
    expect(darkVars.hlKeyword).toMatch(/^hsl\(25\s+(6\d|7\d|8\d)%\s+64%\)$/);
    expect(darkVars.hlAttr).toMatch(/^hsl\(214\s+82%\s+70%\)$/);
    expect(darkVars.hlString).toMatch(/^hsl\(156\s+72%\s+67%\)$/);
    expect(darkVars.hlNumber).toMatch(/^hsl\(198\s+85%\s+68%\)$/);
  });

  it("generates vibrant, crisp syntax highlighting for violet/purple accent", () => {
    const violetHex = "#8b5cf6"; // h ~ 258
    const lightVars = getCustomCodeHighlightVars(violetHex, false);
    const darkVars = getCustomCodeHighlightVars(violetHex, true);

    // Light:
    expect(lightVars.hlKeyword).toMatch(/^hsl\(258\s+/);
    expect(lightVars.hlAttr).toMatch(/^hsl\(210\s+/);
    expect(lightVars.hlString).toMatch(/^hsl\(152\s+/);
    expect(lightVars.hlNumber).toMatch(/^hsl\(28\s+/);

    // Dark:
    expect(darkVars.hlKeyword).toMatch(/^hsl\(258\s+(6\d|7\d|8\d)%\s+64%\)$/);
    expect(darkVars.hlAttr).toMatch(/^hsl\(195\s+82%\s+70%\)$/);
    expect(darkVars.hlString).toMatch(/^hsl\(156\s+72%\s+67%\)$/);
    expect(darkVars.hlNumber).toMatch(/^hsl\(38\s+85%\s+68%\)$/);
  });

  it("generates vibrant, crisp syntax highlighting for blue accent", () => {
    const blueHex = "#3b82f6"; // h ~ 217
    const darkVars = getCustomCodeHighlightVars(blueHex, true);

    // Dark:
    expect(darkVars.hlKeyword).toMatch(/^hsl\(217\s+(6\d|7\d|8\d)%\s+64%\)$/);
    expect(darkVars.hlAttr).toMatch(/^hsl\(268\s+82%\s+70%\)$/);
    expect(darkVars.hlString).toMatch(/^hsl\(156\s+72%\s+67%\)$/);
    expect(darkVars.hlNumber).toMatch(/^hsl\(36\s+85%\s+68%\)$/);
  });
});
