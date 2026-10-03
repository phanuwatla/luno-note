/**
 * Favicon utilities for browser tabs, bookmarks, and history items
 * Provides multi-tier fallback resolution so website icons always display reliably
 */

export function resolveFaviconUrl(rawFavicon?: string, baseUrl?: string): string | undefined {
  if (!rawFavicon || !rawFavicon.trim()) return undefined;
  const trimmed = rawFavicon.trim();

  // Already an absolute URL or inline data URI / blob
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Protocol-relative URL: //example.com/favicon.ico
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // Relative URL: resolve against base URL origin
  if (baseUrl) {
    try {
      const base = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
      return new URL(trimmed, base).href;
    } catch {
      /* ignore */
    }
  }

  return trimmed;
}

export function isLocalOrPrivateHost(hostname: string): boolean {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  return (
    lower === "localhost" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".localhost") ||
    /^127\./.test(lower) ||
    /^192\.168\./.test(lower) ||
    /^10\./.test(lower) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(lower)
  );
}

export function isServiceFallbackUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes("google.com/s2/favicons") || url.includes("icons.duckduckgo.com");
}

/**
 * Builds a prioritized array of favicon URL candidates for a given website URL.
 * 1. Resolved genuine explicit favicon (from <webview> page-favicon-updated or meta tags)
 * 2. DuckDuckGo Favicon API (public hostnames; crawls actual HTML <link rel="icon"> and 404s if missing)
 * 3. Direct domain root /favicon.ico and /icon.ico (standard web baseline)
 * 4. Google S2 Favicon API (secondary public fallback)
 */
export function getFaviconCandidates(rawUrl?: string, explicitFavicon?: string): string[] {
  const candidates: string[] = [];
  const cleanUrl = (rawUrl || "").replace(/^web:/, "").trim();

  let origin = "";
  let hostname = "";

  if (cleanUrl) {
    try {
      const parsed = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);
      origin = parsed.origin;
      hostname = parsed.hostname;
    } catch {
      /* ignore invalid URL */
    }
  }

  // 1. Explicit favicon URL (if not an old automated service fallback)
  const resolvedExplicit = resolveFaviconUrl(explicitFavicon, origin || cleanUrl);
  if (resolvedExplicit && !isServiceFallbackUrl(resolvedExplicit)) {
    candidates.push(resolvedExplicit);
  }

  // 2. DuckDuckGo Favicon API (real crawler-discovered icons for public domains)
  if (hostname && !isLocalOrPrivateHost(hostname)) {
    const ddgIcon = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;
    if (!candidates.includes(ddgIcon)) {
      candidates.push(ddgIcon);
    }
  }

  // 3. Direct domain root standard icons
  if (origin && !origin.startsWith("data:") && !origin.startsWith("blob:") && !origin.startsWith("file:")) {
    const directIco = `${origin}/favicon.ico`;
    if (!candidates.includes(directIco)) {
      candidates.push(directIco);
    }
    const directIcon = `${origin}/icon.ico`;
    if (!candidates.includes(directIcon)) {
      candidates.push(directIcon);
    }
  }

  // 4. Google S2 Favicon API (secondary public fallback)
  if (hostname && !isLocalOrPrivateHost(hostname)) {
    const googleS2 = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
    if (!candidates.includes(googleS2)) {
      candidates.push(googleS2);
    }

    // Subdomain root domain fallback
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join(".");
      const ddgRoot = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(rootDomain)}.ico`;
      if (!candidates.includes(ddgRoot)) {
        candidates.push(ddgRoot);
      }
      const googleRoot = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(rootDomain)}&sz=32`;
      if (!candidates.includes(googleRoot)) {
        candidates.push(googleRoot);
      }
    }
  }

  return candidates;
}
