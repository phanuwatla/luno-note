/**
 * Utility functions for URL classification and external browser delegation.
 * Sensitive URLs (like Google AI Studio, Google Cloud, OAuth logins, Google Drive,
 * or AI provider API key dashboards) should be opened in the system default browser
 * rather than an embedded webview to prevent security flags, bot detection,
 * or Google's disallowed_useragent blocks.
 */

export function isSensitiveWebUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return false;
    }
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // 1. Google AI Studio, Cloud Console, Google Account / Auth & Security, Google Drive
    if (
      host === "aistudio.google.com" ||
      host === "console.cloud.google.com" ||
      host === "accounts.google.com" ||
      host === "myaccount.google.com" ||
      host === "drive.google.com" ||
      (host.endsWith(".google.com") && (pathname.includes("/app/apikey") || pathname.includes("/o/oauth2/") || pathname.includes("/gsi/")))
    ) {
      return true;
    }

    // 2. AI Provider Console & API Key Portals
    if (
      host === "platform.openai.com" ||
      host === "console.anthropic.com" ||
      host === "console.groq.com" ||
      host === "openrouter.ai" ||
      (host === "huggingface.co" && pathname.includes("/settings/tokens"))
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Opens a URL in the user's default system browser (via Electron shell.openExternal
 * or standard window.open in browser environments).
 */
export function openExternalUrl(url: string): void {
  if (!url) return;
  const target = url.trim();
  if (typeof window !== "undefined" && window.electronAPI?.openExternal) {
    try {
      window.electronAPI.openExternal(target);
      return;
    } catch {
      /* fallback below */
    }
  }

  if (typeof window !== "undefined") {
    window.open(target, "_blank", "noopener,noreferrer");
  }
}
