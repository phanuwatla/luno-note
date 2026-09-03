import { APP_VERSION } from "./appVersion";

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  downloadUrl?: string;
  releaseName?: string;
  releaseNotes?: string;
  publishedAt?: string;
}

/**
 * Compare two semver version strings (e.g. "1.1.1" and "1.1.0" or "v1.2.0")
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = (v1 || "").trim().replace(/^v/i, "");
  const clean2 = (v2 || "").trim().replace(/^v/i, "");

  const parts1 = clean1.split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);
  const parts2 = clean2.split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Open external URL using Electron shell or browser window.open
 */
export function openExternalUrl(url: string): void {
  if (!url) return;
  const electronAPI = (window as unknown as { electronAPI?: { openExternal?: (u: string) => Promise<boolean> } })?.electronAPI;
  if (electronAPI?.openExternal) {
    electronAPI.openExternal(url).catch(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Check GitHub repository for the latest release or tag
 */
export async function checkForAppUpdate(
  currentVersion: string = APP_VERSION,
  repo: string = "phanuwatla/luno-note"
): Promise<UpdateCheckResult> {
  const defaultUrl = `https://github.com/${repo}/releases`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const tagName = data.tag_name || data.name || "";
      const latestVer = tagName.replace(/^v/i, "").trim();
      const releaseUrl = data.html_url || defaultUrl;

      // Search for .exe installer in assets
      let downloadUrl: string | undefined;
      if (Array.isArray(data.assets)) {
        const exeAsset = data.assets.find(
          (a: any) =>
            typeof a.name === "string" &&
            a.name.toLowerCase().endsWith(".exe") &&
            typeof a.browser_download_url === "string"
        );
        if (exeAsset) {
          downloadUrl = exeAsset.browser_download_url;
        }
      }

      const hasUpdate = latestVer ? compareVersions(latestVer, currentVersion) > 0 : false;

      return {
        hasUpdate,
        currentVersion,
        latestVersion: latestVer || currentVersion,
        releaseUrl,
        downloadUrl: downloadUrl || releaseUrl,
        releaseName: data.name || tagName,
        releaseNotes: data.body || "",
        publishedAt: data.published_at,
      };
    }

    // Fallback: Check tags if releases/latest is not published yet
    const tagsResponse = await fetch(`https://api.github.com/repos/${repo}/tags`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      if (Array.isArray(tags) && tags.length > 0) {
        const latestTag = tags[0]?.name || "";
        const latestVer = latestTag.replace(/^v/i, "").trim();
        const hasUpdate = latestVer ? compareVersions(latestVer, currentVersion) > 0 : false;
        return {
          hasUpdate,
          currentVersion,
          latestVersion: latestVer || currentVersion,
          releaseUrl: `https://github.com/${repo}/releases/tag/${latestTag}`,
          downloadUrl: `https://github.com/${repo}/releases/tag/${latestTag}`,
          releaseName: latestTag,
        };
      }
    }

    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseUrl: defaultUrl,
      downloadUrl: defaultUrl,
    };
  } catch (err) {
    console.warn("Update check failed:", err);
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseUrl: defaultUrl,
      downloadUrl: defaultUrl,
    };
  }
}
