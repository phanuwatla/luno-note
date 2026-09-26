/**
 * Utilities for classifying WebM files as either Audio or Video.
 * WebM is a container format that can contain either audio-only streams
 * (e.g. voice memos, microphone recordings) or video streams (e.g. screen recordings, camera).
 */

export const webmMediaKindCache = new Map<string, "audio" | "video">();

/**
 * Standardize path/URL/name for consistent cache lookups.
 */
export function normalizeMediaKey(key: string): string {
  if (!key) return "";
  let clean = key.trim().split("|")[0].split("?")[0].split("#")[0];
  try {
    clean = decodeURIComponent(clean);
  } catch {}
  return clean.toLowerCase().replace(/\\/g, "/").split("/").pop() || clean.toLowerCase();
}

/**
 * Check if the filename / title contains common keywords strongly indicating video.
 */
export function isKnownWebmVideoName(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();

  // If explicitly designated audio/voice/speech/podcast without video/screen, it is audio not video
  const hasStrongAudio = [
    "voice",
    "audio",
    "sound",
    "speech",
    "podcast",
    "music",
    "mic",
    "memo",
    "song",
    "dictation",
  ].some((k) => lower.includes(k));

  const hasStrongVideo = [
    "video",
    "screen",
    "screencast",
    "cam",
    "camera",
    "movie",
    "film",
    "vlog",
    "gameplay",
    "stream",
    "trailer",
    "preview",
  ].some((k) => lower.includes(k));

  if (hasStrongAudio && !hasStrongVideo) {
    return false;
  }

  const videoKeywords = [
    "video",
    "movie",
    "clip",
    "screen",
    "screencast",
    "capture",
    "film",
    "cam",
    "camera",
    "stream",
    "vlog",
    "short",
    "reel",
    "trailer",
    "preview",
    "gameplay",
    "recording_screen",
    "screen_recording",
  ];

  return videoKeywords.some((kw) => lower.includes(kw));
}

/**
 * Check if the filename / title contains common keywords strongly indicating audio.
 */
export function isKnownWebmAudioName(name: string): boolean {
  if (!name) return false;
  // If it has strong video signals (e.g. screen_recording), it is NOT audio
  if (isKnownWebmVideoName(name)) return false;

  const lower = name.toLowerCase();

  // If extension is specifically .weba (WebA is WebM audio-only)
  if (lower.endsWith(".weba")) return true;

  // Check audio / voice keywords
  const audioKeywords = [
    "voice note",
    "voice_note",
    "voicenote",
    "voice",
    "audio",
    "sound",
    "speech",
    "podcast",
    "music",
    "mic",
    "memo",
    "dictation",
    "recording",
    "rec_",
    "rec-",
    "soundtrack",
    "song",
    "track",
  ];

  return audioKeywords.some((kw) => lower.includes(kw));
}

export interface MediaMetadata {
  fileType?: string;
  content?: string;
  mimeType?: string;
  type?: string;
  fileName?: string;
  title?: string;
}

/**
 * Determines whether a file, URL, or note is an Audio file.
 */
export function isAudioMedia(
  nameOrUrl: string,
  meta?: MediaMetadata | null
): boolean {
  if (meta?.fileType === "audio") return true;
  if (meta?.fileType === "video") return false;

  const mime = (meta?.mimeType || meta?.type || "").toLowerCase();
  if (mime.startsWith("audio/")) return true;
  if (mime.startsWith("video/")) return false;

  const content = meta?.content || "";
  if (content.startsWith("data:audio/")) return true;
  if (content.startsWith("data:video/")) return false;

  const raw = nameOrUrl || meta?.fileName || meta?.title || "";
  if (!raw) return false;
  const noPipe = raw.split("|")[0].trim();
  const clean = noPipe.split("?")[0].split("#")[0].toLowerCase();

  // Standard audio extensions
  if (/\.(mp3|wav|ogg|m4a|flac|aac|opus|wma|aiff|mid|midi|weba)$/i.test(clean)) {
    return true;
  }

  // If it's a webm file
  if (/\.webm$/i.test(clean)) {
    // If width parameter is present (e.g. ![[file.webm|640]]), it is likely video
    if (/\|\d+/.test(nameOrUrl)) return false;

    const key = normalizeMediaKey(raw);
    if (webmMediaKindCache.has(key)) {
      return webmMediaKindCache.get(key) === "audio";
    }

    if (isKnownWebmVideoName(raw)) return false;
    if (isKnownWebmAudioName(raw)) return true;

    // Default to true for webm if not explicitly video, because voice notes are primary webm in this app
    return true;
  }

  return false;
}

/**
 * Determines whether a file, URL, or note is a Video file.
 */
export function isVideoMedia(
  nameOrUrl: string,
  meta?: MediaMetadata | null
): boolean {
  if (meta?.fileType === "video") return true;
  if (meta?.fileType === "audio") return false;

  const mime = (meta?.mimeType || meta?.type || "").toLowerCase();
  if (mime.startsWith("video/")) return true;
  if (mime.startsWith("audio/")) return false;

  const content = meta?.content || "";
  if (content.startsWith("data:video/")) return true;
  if (content.startsWith("data:audio/")) return false;

  const raw = nameOrUrl || meta?.fileName || meta?.title || "";
  if (!raw) return false;
  const noPipe = raw.split("|")[0].trim();
  const clean = noPipe.split("?")[0].split("#")[0].toLowerCase();

  // Standard video extensions
  if (/\.(mp4|mov|mkv|avi|wmv|flv|m4v|3gp|ogv|mpg|mpeg)$/i.test(clean)) {
    return true;
  }

  // If it's a webm file
  if (/\.webm$/i.test(clean)) {
    // If explicit width parameter is present in wikilink, e.g. ![[file.webm|600]]
    if (/\|\d+/.test(nameOrUrl)) return true;

    const key = normalizeMediaKey(raw);
    if (webmMediaKindCache.has(key)) {
      return webmMediaKindCache.get(key) === "video";
    }

    if (isKnownWebmVideoName(raw)) return true;
    if (isKnownWebmAudioName(raw)) return false;

    return false;
  }

  return false;
}

/**
 * Asynchronously probes a WebM media URL (Blob URL, data URL, or http URL)
 * using an HTML5 video element to definitively determine whether it has video tracks.
 * If videoWidth === 0 && videoHeight === 0 -> "audio"
 * If videoWidth > 0 && videoHeight > 0 -> "video"
 */
export async function probeWebmMediaKind(
  url: string,
  identifier?: string
): Promise<"audio" | "video"> {
  if (!url) return "audio";

  const key = normalizeMediaKey(identifier || url);
  if (key && webmMediaKindCache.has(key)) {
    return webmMediaKindCache.get(key)!;
  }

  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    // In non-DOM environment, fallback to heuristic
    const kind = isKnownWebmVideoName(identifier || url) ? "video" : "audio";
    if (key) webmMediaKindCache.set(key, kind);
    return kind;
  }

  return new Promise((resolve) => {
    let settled = false;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    const finish = (kind: "audio" | "video") => {
      if (!settled) {
        settled = true;
        cleanup();
        if (key) {
          webmMediaKindCache.set(key, kind);
        }
        resolve(kind);
      }
    };

    // Timeout after 2.5s if metadata doesn't load
    const timer = setTimeout(() => {
      finish(isKnownWebmVideoName(identifier || url) ? "video" : "audio");
    }, 2500);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const hasVisual = video.videoWidth > 0 && video.videoHeight > 0;
      finish(hasVisual ? "video" : "audio");
    };

    video.onerror = () => {
      clearTimeout(timer);
      // If video element fails to load track metadata, fallback to heuristic
      finish(isKnownWebmVideoName(identifier || url) ? "video" : "audio");
    };

    video.src = url;
  });
}
