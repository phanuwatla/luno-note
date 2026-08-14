export interface GoogleUserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleTokenInfo {
  access_token: string;
  expires_at: number; // timestamp in ms
  scope?: string;
}

const TOKEN_KEY = "luno_gdrive_token_info";
const PROFILE_KEY = "luno_gdrive_user_profile";
const CLIENT_ID_KEY = "luno_gdrive_client_id";

// Fallback public client ID if environment or setting is not provided
export const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "605556789123-lunonotesplaceholderclientid.apps.googleusercontent.com";

export function getStoredClientId(): string {
  try {
    const saved = localStorage.getItem(CLIENT_ID_KEY);
    if (saved && saved.trim()) return saved.trim();
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

export function getStoredTokenInfo(): GoogleTokenInfo | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const info: GoogleTokenInfo = JSON.parse(raw);
    if (Date.now() >= info.expires_at - 60000) {
      // Token expired or expiring in < 1 min
      return null;
    }
    return info;
  } catch {
    return null;
  }
}

export function saveTokenInfo(token: string, expiresInSeconds: number, scope?: string): GoogleTokenInfo {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const info: GoogleTokenInfo = {
    access_token: token,
    expires_at: expiresAt,
    scope,
  };
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(info));
  } catch {
    // ignore
  }
  return info;
}

export function clearTokenInfo(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // ignore
  }
}

export function getStoredUserProfile(): GoogleUserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as GoogleUserProfile) : null;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: GoogleUserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function isGoogleDriveConnected(): boolean {
  return Boolean(getStoredTokenInfo() && getStoredUserProfile());
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
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google user profile");
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
  await loadGsiScript();
  const clientId = customClientId || getStoredClientId();

  if (clientId.includes("placeholder")) {
    throw new Error("Invalid Client ID: Please set a valid Google OAuth Client ID in your .env file (VITE_GOOGLE_CLIENT_ID).");
  }

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
              resolve({ tokenInfo, profile });
            } catch {
              const fallbackProfile: GoogleUserProfile = { email: "user@drive.google.com" };
              saveUserProfile(fallbackProfile);
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

      client.requestAccessToken();
    } catch (err: any) {
      reject(new Error(err.message || "Failed to initialize Google authentication"));
    }
  });
}

// Disconnect Google Drive
export function disconnectGoogleDrive(): void {
  const tokenInfo = getStoredTokenInfo();
  if (tokenInfo && typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
    try {
      (window as any).google.accounts.oauth2.revoke(tokenInfo.access_token, () => {
        // revoked callback
      });
    } catch {
      // ignore
    }
  }
  clearTokenInfo();
}
