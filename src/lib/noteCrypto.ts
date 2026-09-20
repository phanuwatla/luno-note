/**
 * Cryptographic engine for Luno Notes 6-digit PIN encryption & decryption.
 * Uses standard Web Crypto API (AES-GCM 256-bit + PBKDF2 with SHA-256 and 100,000 iterations).
 * 
 * The file container on disk uses a self-contained YAML frontmatter and payload format
 * to guarantee 100% cross-device, cross-platform portability.
 */

const DEFAULT_PBKDF2_ITERATIONS = 600_000;
const LEGACY_PBKDF2_ITERATIONS = 100_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

export interface EncryptedPayload {
  luno_locked: true;
  version: number;
  iterations?: number;
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
}

/**
 * Checks if a given file name / note can be locked with PIN encryption.
 * Supported text types: Markdown (.md, .markdown), Text (.txt), HTML (.html, .htm), and CSS (.css).
 */
export function isLockableTextFile(fileName?: string, fileType?: string): boolean {
  if (fileType === "image" || fileType === "binary" || fileType === "settings" || fileType === "luno-ai" || fileType === "web-viewer") {
    return false;
  }
  if (!fileName) return true; // untitled notes are markdown by default
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm") ||
    lower.endsWith(".css")
  );
}

/** Converts an ArrayBuffer to a Base64 string */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Converts a Base64 string to Uint8Array */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Derives an AES-GCM 256-bit CryptoKey from a 6-digit PIN and a salt using PBKDF2 */
async function deriveKeyFromPin(
  pin: string,
  salt: Uint8Array,
  usage: KeyUsage[],
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const pinBuffer = enc.encode(pin.trim());

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    pinBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    usage
  );
}

/**
 * Checks whether a given string is a genuine Luno-locked encrypted note.
 * Uses strict structural matching to prevent false positives when normal notes
 * happen to mention "luno_locked: true" in their body.
 */
export function isEncryptedNote(content?: string | null): boolean {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (trimmed.length < 50) return false;

  // 1. JSON envelope format
  if (trimmed.startsWith("{") && trimmed.includes('"luno_locked"') && trimmed.includes('"ciphertext"')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Boolean(parsed.luno_locked && parsed.salt && parsed.iv && parsed.ciphertext);
    } catch {
      return false;
    }
  }

  // 2. Frontmatter envelope format (starts with --- and has all required envelope headers)
  if (trimmed.startsWith("---")) {
    const hasLockedTag = /luno_locked:\s*true/i.test(trimmed);
    const hasSalt = /luno_salt:\s*[A-Za-z0-9+/=]+/i.test(trimmed);
    const hasIv = /luno_iv:\s*[A-Za-z0-9+/=]+/i.test(trimmed);
    const hasPayload =
      trimmed.includes("<!-- LUNO_ENCRYPTED_PAYLOAD_START -->") ||
      trimmed.split(/---[\r\n]+/).length >= 3;

    if (hasLockedTag && hasSalt && hasIv && hasPayload) {
      return true;
    }
  }

  // 3. Fallback comment wrapper envelopes (for HTML/CSS files)
  if (trimmed.startsWith("<!-- LUNO_ENCRYPTED_NOTE") || trimmed.startsWith("/* LUNO_ENCRYPTED_NOTE") || trimmed.startsWith("---luno_locked---")) {
    return true;
  }

  return false;
}

/**
 * Parses the encrypted envelope from raw file content.
 */
export function parseEncryptedEnvelope(rawContent: string): EncryptedPayload | null {
  if (!isEncryptedNote(rawContent)) return null;

  try {
    const trimmed = rawContent.trim();

    // Check JSON envelope format
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.luno_locked && parsed.salt && parsed.iv && parsed.ciphertext) {
        return {
          luno_locked: true,
          version: parsed.version || 1,
          iterations: parsed.iterations || (parsed.version >= 2 ? DEFAULT_PBKDF2_ITERATIONS : LEGACY_PBKDF2_ITERATIONS),
          salt: parsed.salt,
          iv: parsed.iv,
          ciphertext: parsed.ciphertext,
        };
      }
    }

    // Check Markdown / Frontmatter formatted envelope
    // Format:
    // ---
    // luno_locked: true
    // luno_version: 2
    // luno_iterations: 600000
    // luno_salt: <base64>
    // luno_iv: <base64>
    // ---
    // <!-- LUNO_ENCRYPTED_PAYLOAD_START -->
    // <base64 ciphertext>
    // <!-- LUNO_ENCRYPTED_PAYLOAD_END -->
    const saltMatch = rawContent.match(/luno_salt:\s*([A-Za-z0-9+/=]+)/);
    const ivMatch = rawContent.match(/luno_iv:\s*([A-Za-z0-9+/=]+)/);
    const versionMatch = rawContent.match(/luno_version:\s*(\d+)/);
    const iterationsMatch = rawContent.match(/luno_iterations:\s*(\d+)/);

    let ciphertext = "";
    const payloadBlockMatch = rawContent.match(/<!-- LUNO_ENCRYPTED_PAYLOAD_START -->\s*([\s\S]*?)\s*<!-- LUNO_ENCRYPTED_PAYLOAD_END -->/);
    if (payloadBlockMatch && payloadBlockMatch[1]) {
      ciphertext = payloadBlockMatch[1].trim();
    } else {
      // Fallback: lines after second '---'
      const parts = rawContent.split(/---[\r\n]+/);
      if (parts.length >= 3) {
        ciphertext = parts.slice(2).join("---").trim();
      }
    }

    if (saltMatch && ivMatch && ciphertext) {
      const parsedVersion = versionMatch ? parseInt(versionMatch[1], 10) : 1;
      const parsedIterations = iterationsMatch
        ? parseInt(iterationsMatch[1], 10)
        : (parsedVersion >= 2 ? DEFAULT_PBKDF2_ITERATIONS : LEGACY_PBKDF2_ITERATIONS);

      return {
        luno_locked: true,
        version: parsedVersion,
        iterations: parsedIterations,
        salt: saltMatch[1],
        iv: ivMatch[1],
        ciphertext,
      };
    }
  } catch (err) {
    console.error("Failed to parse encrypted envelope:", err);
  }

  return null;
}

/**
 * Encrypts plain text note content with a 6-digit PIN.
 * Returns the fully self-contained portable Markdown/Text file string.
 */
export async function encryptNoteContent(
  plainText: string,
  pin: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<string> {
  if (!pin || pin.length < 4) {
    throw new Error("PIN must be at least 4-6 digits");
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  const key = await deriveKeyFromPin(pin, salt, ["encrypt"], iterations);
  const enc = new TextEncoder();
  const plaintextBuffer = enc.encode(plainText || "");

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    plaintextBuffer
  );

  const base64Salt = bufferToBase64(salt);
  const base64Iv = bufferToBase64(iv);
  const base64Ciphertext = bufferToBase64(encryptedBuffer);

  // Portable envelope that works cleanly across .md, .txt, .html, and .css
  return [
    "---",
    "luno_locked: true",
    "luno_version: 2",
    `luno_iterations: ${iterations}`,
    `luno_salt: ${base64Salt}`,
    `luno_iv: ${base64Iv}`,
    "---",
    "<!-- LUNO_ENCRYPTED_PAYLOAD_START -->",
    base64Ciphertext,
    "<!-- LUNO_ENCRYPTED_PAYLOAD_END -->",
    "",
  ].join("\n");
}

/**
 * Decrypts an encrypted note string using the provided 6-digit PIN.
 * Throws an Error if the PIN is incorrect or decryption fails.
 */
export async function decryptNoteContent(encryptedContent: string, pin: string): Promise<string> {
  const envelope = parseEncryptedEnvelope(encryptedContent);
  if (!envelope) {
    throw new Error("Invalid or corrupted encrypted note format");
  }

  const salt = base64ToBuffer(envelope.salt);
  const iv = base64ToBuffer(envelope.iv);
  const ciphertext = base64ToBuffer(envelope.ciphertext);

  const iterations = envelope.iterations || (envelope.version >= 2 ? DEFAULT_PBKDF2_ITERATIONS : LEGACY_PBKDF2_ITERATIONS);
  const key = await deriveKeyFromPin(pin, salt, ["decrypt"], iterations);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error("INCORRECT_PIN");
  }
}

export * from "./pinLockout";

