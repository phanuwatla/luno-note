/**
 * Cross-platform clipboard text copying utility for Electron and Browser environments.
 * Ensures clipboard write succeeds reliably even when document is not focused or inside context menus.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (text === undefined || text === null) return false;

  // 1. Try Electron native clipboard API first (immune to window/document focus requirements in Electron)
  try {
    const electronAPI = (window as unknown as { electronAPI?: { writeClipboardText?: (t: string) => Promise<boolean> } })?.electronAPI;
    if (electronAPI?.writeClipboardText) {
      const res = await electronAPI.writeClipboardText(text);
      if (res !== false) {
        return true;
      }
    }
  } catch (err) {
    console.warn("Electron native writeClipboardText failed, falling back to web clipboard:", err);
  }

  // 2. Try standard Async Clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, falling back to execCommand:", err);
    }
  }

  // 3. Fallback using invisible textarea + document.execCommand('copy')
  if (typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      textArea.style.opacity = "0";
      textArea.setAttribute("readonly", "");
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (success) {
        return true;
      }
    } catch (fallbackErr) {
      console.warn("document.execCommand('copy') failed:", fallbackErr);
    }
  }

  return false;
}
