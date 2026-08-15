/**
 * Utility for compressing and downscaling images before saving or inserting.
 * Reduces 5MB-10MB camera photos down to ~100KB-250KB WebP/JPEG data URLs.
 */

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<{ dataUrl: string; blob: Blob; fileName: string }> {
  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.82;
  const defaultMime = file.type === "image/png" ? "image/png" : (supportsWebp() ? "image/webp" : "image/jpeg");
  const mimeType = options.mimeType ?? defaultMime;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const rawResult = typeof reader.result === "string" ? reader.result : "";

      // Check canvas capability
      const testCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
      let hasCanvasSupport = false;
      try {
        hasCanvasSupport = !!(testCanvas && testCanvas.getContext && testCanvas.getContext("2d"));
      } catch {
        hasCanvasSupport = false;
      }

      if (!hasCanvasSupport) {
        resolve({
          dataUrl: rawResult,
          blob: file,
          fileName: file.name,
        });
        return;
      }

      const img = new Image();
      let resolved = false;

      const fallbackTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            dataUrl: rawResult,
            blob: file,
            fileName: file.name,
          });
        }
      }, 500);

      img.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(fallbackTimer);
          resolve({
            dataUrl: rawResult,
            blob: file,
            fileName: file.name,
          });
        }
      };

      img.onload = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(fallbackTimer);
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback if canvas context is unavailable
          const rawUrl = typeof reader.result === "string" ? reader.result : "";
          resolve({
            dataUrl: rawUrl,
            blob: file,
            fileName: file.name,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(mimeType, quality);
        canvas.toBlob(
          (blob) => {
            const finalBlob = blob || file;
            const ext = mimeType === "image/webp" ? ".webp" : mimeType === "image/png" ? ".png" : ".jpg";
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const fileName = `${baseName}${ext}`;

            resolve({
              dataUrl,
              blob: finalBlob,
              fileName,
            });
          },
          mimeType,
          quality
        );
      };
      img.src = typeof reader.result === "string" ? reader.result : "";
    };
    reader.readAsDataURL(file);
  });
}

function supportsWebp(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const elem = document.createElement("canvas");
    if (!elem || typeof elem.toDataURL !== "function") return false;
    const str = elem.toDataURL("image/webp");
    return typeof str === "string" && str.startsWith("data:image/webp");
  } catch {
    return false;
  }
}
