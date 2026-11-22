/**
 * QR Code Generator Utility
 * Uses standard ISO/IEC 18004 compliant QRCode generator
 * Supports Error Correction levels (L, M, Q, H), UTF-8 text/URLs, custom colors,
 * high-resolution SVG, PNG Data URLs, and file downloading.
 */

import QRCode from "qrcode";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QrCodeOptions {
  errorCorrectionLevel?: QrErrorCorrectionLevel;
  margin?: number; // Quiet zone modules (default: 3)
  size?: number; // Target pixel width/height (default: 300)
  foregroundColor?: string; // CSS hex color string (e.g. #000000)
  backgroundColor?: string; // CSS hex color string (e.g. #ffffff or #00000000 for transparent)
}

const SAFE_CSS_COLOR_RE =
  /^(?:#[0-9a-fA-F]{3,8}|transparent|[a-zA-Z]{1,20}|(?:rgb|rgba|hsl|hsla)\([0-9.,%\s/+-]+\))$/;

/**
 * Validates and sanitizes a CSS color string to prevent SVG/HTML attribute injection.
 */
function sanitizeCssColor(color?: string, defaultColor = "#000000"): string {
  if (!color || typeof color !== "string") return defaultColor;
  const trimmed = color.trim();
  if (!SAFE_CSS_COLOR_RE.test(trimmed)) {
    return defaultColor;
  }
  return trimmed;
}

/**
 * Standardize color string for QRCode library
 * Converts transparent/transparent hex to rgba or #00000000
 */
function normalizeColor(color?: string, defaultColor = "#000000"): string {
  const safe = sanitizeCssColor(color, defaultColor);
  if (safe.toLowerCase() === "transparent") {
    return "#00000000";
  }
  return safe;
}

function clampNumericOption(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

/**
 * Generates an SVG string representation of the QR Code
 */
export async function generateQrCodeSvgAsync(
  text: string,
  options: QrCodeOptions = {}
): Promise<string> {
  const {
    errorCorrectionLevel = "M",
    margin = 3,
    size = 300,
    foregroundColor = "#000000",
    backgroundColor = "#ffffff",
  } = options;

  const safeMargin = clampNumericOption(margin, 0, 20, 3);
  const safeSize = clampNumericOption(size, 32, 4096, 300);
  const dark = normalizeColor(foregroundColor, "#000000");
  const light = normalizeColor(backgroundColor, "#ffffff");

  return QRCode.toString(text || " ", {
    type: "svg",
    errorCorrectionLevel,
    margin: safeMargin,
    width: safeSize,
    color: {
      dark,
      light,
    },
  });
}

/**
 * Generates a sync SVG string using QR code matrix data
 */
export function generateQrCodeSvg(text: string, options: QrCodeOptions = {}): string {
  const {
    errorCorrectionLevel = "M",
    margin = 3,
    size = 300,
    foregroundColor = "#000000",
    backgroundColor = "#ffffff",
  } = options;

  const safeMargin = clampNumericOption(margin, 0, 20, 3);
  const safeSize = clampNumericOption(size, 32, 4096, 300);

  const qr = QRCode.create(text || " ", {
    errorCorrectionLevel,
  });

  const moduleCount = qr.modules.size;
  const totalCount = moduleCount + safeMargin * 2;
  const moduleSize = safeSize / totalCount;

  let pathData = "";
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.modules.get(r, c)) {
        const x = (c + safeMargin) * moduleSize;
        const y = (r + safeMargin) * moduleSize;
        pathData += `M${x.toFixed(2)},${y.toFixed(2)}h${moduleSize.toFixed(2)}v${moduleSize.toFixed(2)}h-${moduleSize.toFixed(2)}z `;
      }
    }
  }

  const safeForeground = sanitizeCssColor(foregroundColor, "#000000");
  const safeBackground = sanitizeCssColor(backgroundColor, "#ffffff");

  const isTransparent =
    !safeBackground ||
    safeBackground.toLowerCase() === "transparent" ||
    safeBackground.toLowerCase() === "#00000000";

  const bgRect = isTransparent
    ? ""
    : `<rect width="${safeSize}" height="${safeSize}" fill="${safeBackground}" rx="8"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${safeSize} ${safeSize}" width="${safeSize}" height="${safeSize}">
  ${bgRect}
  <path d="${pathData.trim()}" fill="${safeForeground}"/>
</svg>`;
}

/**
 * Generates a PNG Data URL using QRCode library (Canvas / DataURL)
 */
export async function generateQrCodeDataUrl(
  text: string,
  options: QrCodeOptions = {}
): Promise<string> {
  const {
    errorCorrectionLevel = "M",
    margin = 3,
    size = 512,
    foregroundColor = "#000000",
    backgroundColor = "#ffffff",
  } = options;

  const safeMargin = clampNumericOption(margin, 0, 20, 3);
  const safeSize = clampNumericOption(size, 32, 4096, 512);
  const dark = normalizeColor(foregroundColor, "#000000");
  const light = normalizeColor(backgroundColor, "#ffffff");

  return QRCode.toDataURL(text || " ", {
    errorCorrectionLevel,
    margin: safeMargin,
    width: safeSize,
    color: {
      dark,
      light,
    },
  });
}

/**
 * Generates the raw boolean matrix for custom rendering or tests
 */
export function generateQrCodeMatrix(
  text: string,
  ecLevel: QrErrorCorrectionLevel = "M"
): boolean[][] {
  const qr = QRCode.create(text || " ", {
    errorCorrectionLevel: ecLevel,
  });

  const size = qr.modules.size;
  const matrix: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(qr.modules.get(r, c)));
    }
    matrix.push(row);
  }

  return matrix;
}

export { generateQrCodeMatrix as generateQrMatrix };

/**
 * Helper to download QR code image file (supports data URL or direct text)
 */
export async function downloadQrCodeImage(
  contentOrDataUrl: string,
  optionsOrFileName?: (QrCodeOptions & { filename?: string }) | string
): Promise<void> {
  if (typeof document === "undefined") return;
  let dataUrl: string;

  if (contentOrDataUrl.startsWith("data:image/")) {
    dataUrl = contentOrDataUrl;
  } else {
    const opts = typeof optionsOrFileName === "object" ? optionsOrFileName : {};
    dataUrl = await generateQrCodeDataUrl(contentOrDataUrl, opts);
  }

  const filename =
    (typeof optionsOrFileName === "string"
      ? optionsOrFileName
      : optionsOrFileName?.filename) || `qrcode-${Date.now()}.png`;

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Detects / decodes text from a QR code image element or source URL
 * Uses the browser's native BarcodeDetector API if supported
 */
export async function detectQrCodeText(
  imgOrSrc: HTMLImageElement | string
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      let source: HTMLImageElement;
      if (typeof imgOrSrc === "string") {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgOrSrc;
        await new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve(true);
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        source = img;
      } else {
        source = imgOrSrc;
      }
      const barcodes = await detector.detect(source);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    }
  } catch (err) {
    console.warn("detectQrCodeText error:", err);
  }
  return null;
}
