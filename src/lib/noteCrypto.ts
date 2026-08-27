/**
 * Cryptographic engine for Luno Notes 6-digit PIN encryption & decryption.
 * Uses standard Web Crypto API (AES-GCM 256-bit + PBKDF2 with SHA-256 and 100,000 iterations).
 * 
 * The file container on disk uses a self-contained YAML frontmatter and payload format
 * to guarantee 100% cross-device, cross-platform portability.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

export interface EncryptedPayload {
  luno_locked: true;
  version: number;
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
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
async function deriveKeyFromPin(pin: string, salt: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
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
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    usage
  );
}

/**
 * Checks whether a given string is a Luno-locked encrypted note.
 */
export function isEncryptedNote(content?: string | null): boolean {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (trimmed.startsWith("<!-- LUNO_ENCRYPTED_NOTE_V1") || trimmed.startsWith("---luno_locked---")) {
    return true;
  }
  if (trimmed.includes("luno_locked: true") || trimmed.includes('"luno_locked":true') || trimmed.includes('"luno_locked": true')) {
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
    // luno_version: 1
    // luno_salt: <base64>
    // luno_iv: <base64>
    // ---
    // <base64 ciphertext>
    const saltMatch = rawContent.match(/luno_salt:\s*([A-Za-z0-9+/=]+)/);
    const ivMatch = rawContent.match(/luno_iv:\s*([A-Za-z0-9+/=]+)/);
    const versionMatch = rawContent.match(/luno_version:\s*(\d+)/);

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
      return {
        luno_locked: true,
        version: versionMatch ? parseInt(versionMatch[1], 10) : 1,
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
 * Returns the fully self-contained portable Markdown file string.
 */
export async function encryptNoteContent(plainText: string, pin: string): Promise<string> {
  if (!pin || pin.length < 4) {
    throw new Error("PIN must be at least 4-6 digits");
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  const key = await deriveKeyFromPin(pin, salt, ["encrypt"]);
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

  // Portable Markdown envelope that Obsidian and all standard editors will recognize cleanly
  return [
    "---",
    "luno_locked: true",
    "luno_version: 1",
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

  const key = await deriveKeyFromPin(pin, salt, ["decrypt"]);

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
