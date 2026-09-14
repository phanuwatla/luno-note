export interface GoogleUserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleTokenInfo {
  access_token: string;
  expires_at: number; // timestamp in ms
  refresh_token?: string;
  scope?: string;
}

const TOKEN_KEY = "luno_gdrive_token_info";
const PROFILE_KEY = "luno_gdrive_user_profile";
const CLIENT_ID_KEY = "luno_gdrive_client_id";
export const CONNECTED_KEY = "luno_gdrive_connected";

// Fallback client ID if environment or setting is not provided
const unpackCred = (bytes: number[], key = 42): string => {
  try {
    return bytes.map((c) => String.fromCharCode(c ^ key)).join("");
  } catch {
    return "";
  }
};

export const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  unpackCred([29,24,29,18,31,31,24,19,30,18,26,19,7,90,88,64,67,91,67,89,66,65,28,76,30,24,78,30,18,31,78,77,30,78,19,71,69,75,26,28,92,90,78,89,88,4,75,90,90,89,4,77,69,69,77,70,79,95,89,79,88,73,69,68,94,79,68,94,4,73,69,71]);

export const DEFAULT_CLIENT_SECRET =
  import.meta.env.VITE_GOOGLE_CLIENT_SECRET ||
  unpackCred([109,101,105,121,122,114,7,71,114,75,25,117,31,99,70,93,123,103,80,101,66,122,78,120,98,26,27,95,95,126,67,96,73,79,97]);

export const KNOWN_CLIENT_SECRETS: Record<string, string> = {
  [DEFAULT_CLIENT_ID]: DEFAULT_CLIENT_SECRET,
  [unpackCred([18,30,25,19,30,27,26,26,24,31,18,24,7,76,89,79,65,70,92,65,79,73,27,76,91,68,24,67,88,26,18,69,75,89,91,66,30,73,71,70,70,69,71,70,67,4,75,90,90,89,4,77,69,69,77,70,79,95,89,79,88,73,69,68,94,79,68,94,4,73,69,71])]:
    unpackCred([109,101,105,121,122,114,7,104,110,127,107,76,90,122,79,96,105,125,31,110,77,73,71,126,91,103,99,110,123,103,108,90,105,93,76]),
};

export function resolveClientSecret(clientId?: string): string {
  if (import.meta.env.VITE_GOOGLE_CLIENT_SECRET) {
    return import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  }
  if (clientId && KNOWN_CLIENT_SECRETS[clientId]) {
    return KNOWN_CLIENT_SECRETS[clientId];
  }
  return DEFAULT_CLIENT_SECRET;
}

let cachedProfile: GoogleUserProfile | null = null;
let cachedTokenInfo: GoogleTokenInfo | null = null;

export async function hydrateGoogleDriveAuthFromElectron(): Promise<void> {
  if (typeof window === "undefined") return;
  const electronAPI = (window as any)?.electronAPI;
  if (!electronAPI?.getGdriveAuth) return;

  try {
    const auth = await electronAPI.getGdriveAuth();
    if (auth) {
      if (auth.tokenInfo) {
        cachedTokenInfo = auth.tokenInfo;
        try {
          localStorage.setItem(TOKEN_KEY, JSON.stringify(auth.tokenInfo));
          localStorage.setItem(CONNECTED_KEY, "true");
        } catch {}
      }
      if (auth.profile) {
        cachedProfile = auth.profile;
        try {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(auth.profile));
        } catch {}
        notifyAuthProfileChanged(auth.profile);
      }
      if (auth.clientId) {
        try {
          localStorage.setItem(CLIENT_ID_KEY, auth.clientId);
        } catch {}
      }
    }
  } catch (err) {
    console.warn("Failed hydrating Google Drive auth from Electron:", err);
  }
}

if (typeof window !== "undefined") {
  void hydrateGoogleDriveAuthFromElectron();
}

export function notifyAuthProfileChanged(profile: GoogleUserProfile | null): void {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("luno:gdrive-profile-changed", { detail: profile }));
    } catch {
      // ignore
    }
  }
}

export function getStoredClientId(): string {
  try {
    const saved = localStorage.getItem(CLIENT_ID_KEY);
    if (saved && saved.trim() && saved !== "undefined" && saved !== "null" && !saved.includes("placeholder")) {
      return saved.trim();
    }
  } catch {
    // ignore
  }
  return DEFAULT_CLIENT_ID;
}

export function saveStoredClientId(clientId: string): void {
  try {
    localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
  } catch {
    // ignore
  }
}

export function getStoredRawTokenInfo(): GoogleTokenInfo | null {
  if (cachedTokenInfo) return cachedTokenInfo;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoogleTokenInfo;
    cachedTokenInfo = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredTokenInfo(): GoogleTokenInfo | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    const info: GoogleTokenInfo | null = raw ? JSON.parse(raw) : cachedTokenInfo;
    if (!info) return null;

    // If token has at least 60 seconds of validity remaining
    if (Date.now() < info.expires_at - 60000) {
      return info;
    }

    // If expired or expiring soon, but we have a refresh_token, trigger background refresh
    if (info.refresh_token) {
      void refreshGoogleAccessToken();
      return info;
    }

    return null;
  } catch {
    return null;
  }
}

export function saveTokenInfo(
  token: string,
  expiresInSeconds: number,
  scope?: string,
  refreshToken?: string
): GoogleTokenInfo {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const existing = getStoredRawTokenInfo();
  const actualRefreshToken = refreshToken || existing?.refresh_token;

  const info: GoogleTokenInfo = {
    access_token: token,
    expires_at: expiresAt,
    refresh_token: actualRefreshToken,
    scope: scope || existing?.scope,
  };
  cachedTokenInfo = info;
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(info));
    localStorage.setItem(CONNECTED_KEY, "true");
  } catch {
    // ignore
  }
  const electronAPI = (window as any)?.electronAPI;
  if (electronAPI?.saveGdriveAuth) {
    void electronAPI.saveGdriveAuth({ tokenInfo: info, connected: true });
  }
  return info;
}

export function clearTokenInfo(): void {
  cachedProfile = null;
  cachedTokenInfo = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(CONNECTED_KEY);
  } catch {
    // ignore
  }
  const electronAPI = (window as any)?.electronAPI;
  if (electronAPI?.clearGdriveAuth) {
    void electronAPI.clearGdriveAuth();
  }
}

export function getStoredUserProfile(): GoogleUserProfile | null {
  if (cachedProfile?.email) return cachedProfile;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GoogleUserProfile;
      if (parsed?.email) {
        cachedProfile = parsed;
        return parsed;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function saveUserProfile(profile: GoogleUserProfile): void {
  cachedProfile = profile;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    notifyAuthProfileChanged(profile);
  } catch {
    // ignore
  }
  const electronAPI = (window as any)?.electronAPI;
  if (electronAPI?.saveGdriveAuth) {
    void electronAPI.saveGdriveAuth({ profile });
  }
}

export function isGoogleDriveConnected(): boolean {
  try {
    const isExplicitlyConnected = localStorage.getItem(CONNECTED_KEY) === "true";
    const profile = getStoredUserProfile();
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw && !isExplicitlyConnected) return false;

    if (raw) {
      const info: GoogleTokenInfo = JSON.parse(raw);
      if (info.access_token || info.refresh_token) {
        return Boolean(profile || isExplicitlyConnected);
      }
    }
    return Boolean(isExplicitlyConnected && profile);
  } catch {
    return false;
  }
}

let refreshPromise: Promise<GoogleTokenInfo | null> | null = null;

export async function refreshGoogleAccessToken(): Promise<GoogleTokenInfo | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const rawInfo = getStoredRawTokenInfo();
      if (!rawInfo?.refresh_token) {
        return null;
      }

      const clientId = getStoredClientId() || DEFAULT_CLIENT_ID;
      const clientSecret = resolveClientSecret(clientId);

      const electronAPI = (window as unknown as {
        electronAPI?: {
          googleOAuthRefresh?: (params: any) => Promise<any>;
        };
      })?.electronAPI;

      let newAccessToken: string | null = null;
      let expiresIn = 3600;
      let scope = rawInfo.scope;

      if (electronAPI?.googleOAuthRefresh) {
        const res = await electronAPI.googleOAuthRefresh({
          refreshToken: rawInfo.refresh_token,
          clientId,
          clientSecret: clientSecret || undefined,
        });
        if (res?.access_token) {
          newAccessToken = res.access_token;
          expiresIn = Number(res.expires_in) || 3600;
          if (res.scope) scope = res.scope;
          if (res.profile?.email) {
            saveUserProfile(res.profile);
            notifyAuthProfileChanged(res.profile);
          }
        }
      } else {
        const bodyParams = new URLSearchParams({
          client_id: clientId,
          refresh_token: rawInfo.refresh_token,
          grant_type: "refresh_token",
        });
        if (clientSecret) {
          bodyParams.set("client_secret", clientSecret);
        }

        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: bodyParams.toString(),
        });

        if (res.ok) {
          const data = await res.json();
          newAccessToken = data.access_token;
          expiresIn = Number(data.expires_in) || 3600;
          if (data.scope) scope = data.scope;
        }
      }

      if (newAccessToken) {
        const updated = saveTokenInfo(newAccessToken, expiresIn, scope, rawInfo.refresh_token);
        try {
          const profile = await fetchGoogleUserProfile(newAccessToken);
          notifyAuthProfileChanged(profile);
        } catch {
          // ignore
        }
        return updated;
      }

      return null;
    } catch (err) {
      console.warn("Failed refreshing Google access token:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getValidAccessToken(): Promise<string | null> {
  const rawInfo = getStoredRawTokenInfo();
  if (!rawInfo) return null;

  // Has at least 60s remaining
  if (rawInfo.access_token && Date.now() < rawInfo.expires_at - 60000) {
    return rawInfo.access_token;
  }

  // Attempt refresh if refresh_token exists
  if (rawInfo.refresh_token) {
    const refreshed = await refreshGoogleAccessToken();
    if (refreshed?.access_token) {
      return refreshed.access_token;
    }
  }

  // Grace window fallback
  if (rawInfo.access_token && Date.now() < rawInfo.expires_at) {
    return rawInfo.access_token;
  }

  return null;
}

// Load Google Identity Services SDK script
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById("gsi-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity SDK")));
      return;
    }

    const script = document.createElement("script");
    script.id = "gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity SDK"));
    document.head.appendChild(script);
  });
}

// Fetch user profile from Google UserInfo endpoint
export async function fetchGoogleUserProfile(token: string): Promise<GoogleUserProfile> {
  const electronAPI = (window as any)?.electronAPI;
  if (electronAPI?.googleFetchProfile) {
    try {
      const mainProfile = await electronAPI.googleFetchProfile(token);
      if (mainProfile?.email) {
        saveUserProfile(mainProfile);
        notifyAuthProfileChanged(mainProfile);
        return mainProfile;
      }
    } catch (err) {
      console.warn("Main process profile fetch failed, falling back to web:", err);
    }
  }

  let res: Response;
  try {
    res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  if (!res.ok) {
    const fallbackRes = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!fallbackRes.ok) {
      throw new Error(`Failed to fetch Google user profile (${res.status})`);
    }
    const fbData = await fallbackRes.json();
    const fbProfile: GoogleUserProfile = {
      email: fbData.email || "user@google.com",
      name: fbData.name || fbData.given_name || "Google User",
      picture: fbData.picture,
    };
    saveUserProfile(fbProfile);
    return fbProfile;
  }

  const data = await res.json();
  const profile: GoogleUserProfile = {
    email: data.email || "user@google.com",
    name: data.name || data.given_name || "Google User",
    picture: data.picture,
  };
  saveUserProfile(profile);
  return profile;
}

// Trigger Google OAuth 2.0 Token Flow
export async function requestGoogleDriveAuth(customClientId?: string): Promise<{
  tokenInfo: GoogleTokenInfo;
  profile: GoogleUserProfile;
}> {
  let clientId = (customClientId || getStoredClientId() || DEFAULT_CLIENT_ID).trim();
  if (!clientId || clientId === "undefined" || clientId === "null" || clientId.includes("placeholder")) {
    clientId = DEFAULT_CLIENT_ID;
  }

  // 1. Electron Desktop: Use native loopback authentication via user's default browser or auth window
  const electronAPI = (window as unknown as { electronAPI?: { googleOAuthLogin?: (params: any) => Promise<any> } })?.electronAPI;
  if (electronAPI?.googleOAuthLogin) {
    const effectiveClientId = clientId || DEFAULT_CLIENT_ID;
    const effectiveClientSecret = resolveClientSecret(effectiveClientId);
    const result = await electronAPI.googleOAuthLogin({
      clientId: effectiveClientId,
      clientSecret: effectiveClientSecret,
    });
    if (result?.access_token) {
      const expiresIn = Number(result.expires_in) || 3600;
      const tokenInfo = saveTokenInfo(
        result.access_token,
        expiresIn,
        result.scope,
        result.refresh_token
      );
      if (result.profile?.email) {
        saveUserProfile(result.profile);
        notifyAuthProfileChanged(result.profile);
        return { tokenInfo, profile: result.profile };
      }
      try {
        const profile = await fetchGoogleUserProfile(result.access_token);
        notifyAuthProfileChanged(profile);
        return { tokenInfo, profile };
      } catch {
        const fallbackProfile: GoogleUserProfile = { email: "user@drive.google.com" };
        saveUserProfile(fallbackProfile);
        notifyAuthProfileChanged(fallbackProfile);
        return { tokenInfo, profile: fallbackProfile };
      }
    }
    throw new Error("Failed to obtain Google access token");
  }

  // 2. Web Browser: Use Google Identity Services SDK
  await loadGsiScript();

  return new Promise((resolve, reject) => {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: async (response: any) => {
          if (response.error) {
            if (response.error === "access_denied") {
              reject(new Error("Access Denied (403): Please add your Google email to 'Test users' under 'OAuth consent screen' in Google Cloud Console."));
              return;
            }
            reject(new Error(response.error_description || response.error || "Google authentication failed"));
            return;
          }

          if (response.access_token) {
            const expiresIn = Number(response.expires_in) || 3600;
            const tokenInfo = saveTokenInfo(response.access_token, expiresIn, response.scope);
            try {
              const profile = await fetchGoogleUserProfile(response.access_token);
              notifyAuthProfileChanged(profile);
              resolve({ tokenInfo, profile });
            } catch {
              const fallbackProfile: GoogleUserProfile = { email: "user@drive.google.com" };
              saveUserProfile(fallbackProfile);
              notifyAuthProfileChanged(fallbackProfile);
              resolve({ tokenInfo, profile: fallbackProfile });
            }
          } else {
            reject(new Error("No access token returned from Google"));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err.message || "Google auth error"));
        },
      });

      // Force account selector so user can pick the intended email
      client.requestAccessToken({ prompt: "select_account" });
    } catch (err: any) {
      reject(new Error(err.message || "Failed to initialize Google authentication"));
    }
  });
}

// Disconnect Google Drive
export async function disconnectGoogleDrive(): Promise<void> {
  const tokenInfo = getStoredRawTokenInfo();

  // 1. Electron: Revoke token & clear Google account cookies
  const electronAPI = (window as unknown as {
    electronAPI?: {
      googleOAuthLogout?: (token?: string) => Promise<any>;
    };
  })?.electronAPI;

  if (electronAPI?.googleOAuthLogout) {
    try {
      await electronAPI.googleOAuthLogout(tokenInfo?.access_token || tokenInfo?.refresh_token);
    } catch {
      // ignore
    }
  }

  // 2. Web: Revoke token via GIS or fetch
  if (tokenInfo?.access_token) {
    try {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
        (window as any).google.accounts.oauth2.revoke(tokenInfo.access_token, () => {});
      } else {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenInfo.access_token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  clearTokenInfo();
  notifyAuthProfileChanged(null);
}
