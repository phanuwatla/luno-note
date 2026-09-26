import { toast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboardUtils";

export function getCleanRelPath(rawCandidate: string): string {
  if (!rawCandidate) return "";
  let cleanRel = decodeURIComponent(rawCandidate.trim());
  if (cleanRel.startsWith("luno-asset://")) {
    cleanRel = decodeURIComponent(cleanRel.replace(/^luno-asset:\/\//, ""));
    if (/^\/[a-zA-Z]:[\\/]/.test(cleanRel)) cleanRel = cleanRel.slice(1);
  }
  while (cleanRel.startsWith("../") || cleanRel.startsWith("./")) {
    cleanRel = cleanRel.replace(/^(\.\.\/|\.\/)/, "");
  }
  return cleanRel;
}

export async function getMediaFullPath(src: string, dataRelativeSrc?: string): Promise<string | null> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
  if (!electronAPI?.getSavedWorkspace) return null;

  try {
    const saved = await electronAPI.getSavedWorkspace();
    const workspacePath = saved?.folderPath || saved?.path;
    if (!workspacePath) return null;

    const rawCandidate = dataRelativeSrc || (!src.startsWith("http") && !src.startsWith("blob:") && !src.startsWith("data:") ? src : null);
    if (!rawCandidate) return null;

    const cleanRel = getCleanRelPath(rawCandidate);
    if (!cleanRel) return null;

    return /^[a-zA-Z]:[\\/]/.test(cleanRel) ? cleanRel : `${workspacePath}/${cleanRel}`;
  } catch (err) {
    console.warn("Failed to getMediaFullPath:", err);
    return null;
  }
}

export async function copyImageToClipboard(src: string, dataRelativeSrc?: string): Promise<boolean> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;

  // 1. Electron Native Clipboard Image
  if (electronAPI?.writeClipboardImage) {
    try {
      let dataUrl: string | null = null;
      if (src.startsWith("data:image/")) {
        dataUrl = src;
      } else {
        const fullPath = await getMediaFullPath(src, dataRelativeSrc);
        if (fullPath && electronAPI.readImageDataUrl) {
          dataUrl = await electronAPI.readImageDataUrl(fullPath);
        }
      }

      if (!dataUrl && src && !src.startsWith("file://")) {
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {}
      }

      if (dataUrl) {
        const success = await electronAPI.writeClipboardImage(dataUrl);
        if (success !== false) {
          toast({
            title: "คัดลอกรูปภาพแล้ว",
            description: "รูปภาพพร้อมสำหรับวางในแอปอื่นแล้ว",
          });
          return true;
        }
      }
    } catch (e) {
      console.warn("electronAPI.writeClipboardImage failed:", e);
    }
  }

  // 2. Web Clipboard API (Blob -> ClipboardItem)
  if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      let pngBlob = blob;

      if (blob.type !== "image/png" && typeof document !== "undefined") {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || blob), "image/png"));
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": pngBlob,
        }),
      ]);

      toast({
        title: "คัดลอกรูปภาพแล้ว",
        description: "รูปภาพพร้อมสำหรับวางแล้ว",
      });
      return true;
    } catch (webErr) {
      console.warn("navigator.clipboard.write image failed:", webErr);
    }
  }

  return false;
}

export async function copyTextToClipboard(text: string, title = "คัดลอกแล้ว", description?: string): Promise<boolean> {
  try {
    const success = await copyToClipboard(text);
    if (success) {
      toast({
        title,
        description: description || text,
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn("copyTextToClipboard failed:", err);
    return false;
  }
}

export async function copyMediaPath(
  src: string,
  dataRelativeSrc?: string,
  type: "relative" | "full" = "relative",
  labels?: { title?: string; description?: string }
): Promise<boolean> {
  let target = "";
  if (type === "relative") {
    const rawCandidate = dataRelativeSrc || (!src.startsWith("http") && !src.startsWith("blob:") && !src.startsWith("data:") ? src : null);
    if (rawCandidate) {
      target = getCleanRelPath(rawCandidate);
    } else {
      target = src;
    }
  } else {
    const full = await getMediaFullPath(src, dataRelativeSrc);
    target = full || (dataRelativeSrc ? getCleanRelPath(dataRelativeSrc) : src);
  }

  if (!target) return false;

  return copyTextToClipboard(
    target,
    labels?.title || (type === "full" ? "คัดลอกพาธแบบเต็มแล้ว" : "คัดลอกพาธสัมพัทธ์แล้ว"),
    labels?.description || target
  );
}

export async function openMediaFileInSystemApp(src: string, dataRelativeSrc?: string): Promise<boolean> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
  if (electronAPI?.openPath || electronAPI?.openExternal) {
    try {
      const fullPath = await getMediaFullPath(src, dataRelativeSrc);
      if (fullPath) {
        if (electronAPI.openPath) {
          await electronAPI.openPath(fullPath);
          return true;
        }
        if (electronAPI.openExternal) {
          await electronAPI.openExternal(`file://${fullPath}`);
          return true;
        }
      }
    } catch (err) {
      console.warn("openMediaFileInSystemApp failed:", err);
    }
  }

  if (src && !src.startsWith("data:")) {
    window.open(src, "_blank");
    return true;
  }
  return false;
}

export async function revealMediaFileInFolder(src: string, dataRelativeSrc?: string): Promise<boolean> {
  const electronAPI = (window as unknown as { electronAPI?: Record<string, any> }).electronAPI;
  if (electronAPI?.showItemInFolder) {
    try {
      const fullPath = await getMediaFullPath(src, dataRelativeSrc);
      if (fullPath) {
        await electronAPI.showItemInFolder(fullPath);
        return true;
      }
    } catch (err) {
      console.warn("revealMediaFileInFolder failed:", err);
    }
  }
  return false;
}

export function downloadMediaFile(src: string, suggestedName?: string): void {
  if (!src) return;
  const link = document.createElement("a");
  link.href = src;
  if (suggestedName) {
    link.download = suggestedName.replace(/[\\/:*?"<>|]/g, "_");
  } else {
    const fn = src.split("/").pop()?.split("\\").pop();
    if (fn && !fn.startsWith("blob:") && !fn.startsWith("data:")) {
      link.download = decodeURIComponent(fn);
    } else {
      link.download = "download";
    }
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
