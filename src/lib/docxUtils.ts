import { sanitizeHtml } from "./sanitizeHtml";

type MammothBrowserApi = {
  convertToHtml: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

let mammothLoadPromise: Promise<MammothBrowserApi> | null = null;

export function ensureMammothLoaded(): Promise<MammothBrowserApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Mammoth.js requires a browser environment"));
  }
  const win = window as unknown as { mammoth?: MammothBrowserApi };
  if (win.mammoth && typeof win.mammoth.convertToHtml === "function") {
    return Promise.resolve(win.mammoth);
  }
  if (mammothLoadPromise) {
    return mammothLoadPromise;
  }

  mammothLoadPromise = new Promise<MammothBrowserApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "mammoth.browser.min.js";
    script.async = true;
    script.onload = () => {
      if (win.mammoth && typeof win.mammoth.convertToHtml === "function") {
        resolve(win.mammoth);
      } else {
        mammothLoadPromise = null;
        reject(new Error("Mammoth.js (browser) failed to initialize"));
      }
    };
    script.onerror = () => {
      mammothLoadPromise = null;
      reject(new Error("Mammoth.js (browser) script failed to load"));
    };
    document.head.appendChild(script);
  });

  return mammothLoadPromise;
}

export async function docxToHtml(file: File): Promise<string> {
  const mammoth = await ensureMammothLoaded();
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  return sanitizeHtml(html || "");
}

