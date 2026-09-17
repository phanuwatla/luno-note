import { describe, it, expect } from "vitest";
import {
  generateQrMatrix,
  generateQrCodeSvg,
  generateQrCodeDataUrl,
} from "./qrCode";

describe("QR Code Generator Library", () => {
  it("generates QR matrix for simple ASCII text", () => {
    const matrix = generateQrMatrix("https://luno-note.app", "M");
    expect(matrix).toBeDefined();
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBeGreaterThanOrEqual(21); // Version 1 is 21x21
    expect(matrix[0].length).toBe(matrix.length); // Must be square

    // Finder patterns should have dark corners
    expect(matrix[0][0]).toBe(true);
    expect(matrix[0][6]).toBe(true);
    expect(matrix[6][0]).toBe(true);
  });

  it("handles Thai text, unicode, and emojis correctly", () => {
    const thaiText = "สวัสดีชาวโลก สวัสดี Luno Note 🚀";
    const matrix = generateQrMatrix(thaiText, "Q");
    expect(matrix).toBeDefined();
    expect(matrix.length).toBeGreaterThan(21); // Thai utf-8 bytes require higher version
  });

  it("generates valid SVG output with custom colors and size", () => {
    const svg = generateQrCodeSvg("https://example.com", {
      foregroundColor: "#26a295",
      backgroundColor: "#ffffff",
      size: 320,
      margin: 4,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('fill="#26a295"');
    expect(svg).toContain('fill="#ffffff"');
  });

  it("generates transparent background SVG when requested", () => {
    const svg = generateQrCodeSvg("test transparent", {
      backgroundColor: "transparent",
    });

    expect(svg).toContain("<svg");
    expect(svg).not.toContain('<rect width="100%" height="100%" fill="transparent"');
  });

  it("supports all 4 ECC levels (L, M, Q, H)", () => {
    const text = "Testing Error Correction Levels";
    const matrixL = generateQrMatrix(text, "L");
    const matrixM = generateQrMatrix(text, "M");
    const matrixQ = generateQrMatrix(text, "Q");
    const matrixH = generateQrMatrix(text, "H");

    expect(matrixL).toBeDefined();
    expect(matrixM).toBeDefined();
    expect(matrixQ).toBeDefined();
    expect(matrixH).toBeDefined();

    // Higher ECC levels result in larger or equal matrix size
    expect(matrixH.length).toBeGreaterThanOrEqual(matrixL.length);
  });

  it("throws descriptive error when data exceeds supported QR capacity", () => {
    const hugeText = "A".repeat(15000);
    expect(() => generateQrMatrix(hugeText, "H")).toThrow();
  });
});

