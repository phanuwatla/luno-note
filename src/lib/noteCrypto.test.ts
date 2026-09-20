import { describe, it, expect } from "vitest";
import {
  encryptNoteContent,
  decryptNoteContent,
  isEncryptedNote,
  parseEncryptedEnvelope,
  isLockableTextFile,
} from "./noteCrypto";

describe("noteCrypto - 6-Digit PIN Encryption & Decryption", () => {
  const samplePlainText = "# Secret Note\n\nThis is highly confidential data.\n\n- Passwords\n- Finances";
  const pin = "123456";

  it("should detect whether content is an encrypted note", async () => {
    expect(isEncryptedNote(samplePlainText)).toBe(false);
    expect(isEncryptedNote("")).toBe(false);

    const encrypted = await encryptNoteContent(samplePlainText, pin);
    expect(isEncryptedNote(encrypted)).toBe(true);
  });

  it("should encrypt and decrypt content correctly with matching 6-digit PIN", async () => {
    const encrypted = await encryptNoteContent(samplePlainText, pin);

    // Verify it doesn't contain the raw plaintext
    expect(encrypted).not.toContain("Secret Note");
    expect(encrypted).not.toContain("confidential data");

    // Verify it contains frontmatter metadata
    expect(encrypted).toContain("luno_locked: true");
    expect(encrypted).toContain("luno_salt:");
    expect(encrypted).toContain("luno_iv:");

    // Decrypt with correct PIN
    const decrypted = await decryptNoteContent(encrypted, pin);
    expect(decrypted).toBe(samplePlainText);
  });

  it("should throw INCORRECT_PIN when attempting to decrypt with wrong PIN", async () => {
    const encrypted = await encryptNoteContent(samplePlainText, pin);

    await expect(decryptNoteContent(encrypted, "654321")).rejects.toThrow("INCORRECT_PIN");
    await expect(decryptNoteContent(encrypted, "000000")).rejects.toThrow("INCORRECT_PIN");
  });

  it("should parse encrypted envelope metadata correctly", async () => {
    const encrypted = await encryptNoteContent(samplePlainText, pin);
    const envelope = parseEncryptedEnvelope(encrypted);

    expect(envelope).not.toBeNull();
    expect(envelope?.luno_locked).toBe(true);
    expect(envelope?.version).toBe(2);
    expect(envelope?.iterations).toBe(600_000);
    expect(typeof envelope?.salt).toBe("string");
    expect(typeof envelope?.iv).toBe("string");
    expect(typeof envelope?.ciphertext).toBe("string");
  });

  it("should NOT false-positive detect normal notes that mention 'luno_locked: true' in body", () => {
    const normalNoteWithMention = "# How Luno Works\n\nInside the file, you might see `luno_locked: true` in config.\n\nEnd of note.";
    expect(isEncryptedNote(normalNoteWithMention)).toBe(false);
    expect(parseEncryptedEnvelope(normalNoteWithMention)).toBeNull();
  });

  it("should maintain backward compatibility with v1 100,000 iteration envelopes without luno_iterations tag", async () => {
    // Manually construct a valid legacy v1 envelope using 100,000 iterations
    const legacyEncrypted = await encryptNoteContent(samplePlainText, pin, 100_000);
    const legacyV1Envelope = legacyEncrypted
      .replace("luno_version: 2", "luno_version: 1")
      .replace(/luno_iterations: \d+\n/, "");

    expect(isEncryptedNote(legacyV1Envelope)).toBe(true);
    const envelope = parseEncryptedEnvelope(legacyV1Envelope);
    expect(envelope?.version).toBe(1);
    expect(envelope?.iterations).toBe(100_000);

    const decrypted = await decryptNoteContent(legacyV1Envelope, pin);
    expect(decrypted).toBe(samplePlainText);
  });

  it("should correctly identify lockable text files (.md, .txt, .html, .css) and reject binaries", () => {
    expect(isLockableTextFile("document.md")).toBe(true);
    expect(isLockableTextFile("guide.markdown")).toBe(true);
    expect(isLockableTextFile("plain.txt")).toBe(true);
    expect(isLockableTextFile("index.html")).toBe(true);
    expect(isLockableTextFile("styles.css")).toBe(true);
    expect(isLockableTextFile(undefined)).toBe(true); // untitled note

    // Non-lockable binaries/images/special
    expect(isLockableTextFile("photo.png")).toBe(false);
    expect(isLockableTextFile("photo.jpg")).toBe(false);
    expect(isLockableTextFile("photo.webp")).toBe(false);
    expect(isLockableTextFile("archive.zip")).toBe(false);
    expect(isLockableTextFile("doc.pdf")).toBe(false);
    expect(isLockableTextFile("sound.mp3")).toBe(false);
    expect(isLockableTextFile("note.md", "image")).toBe(false);
    expect(isLockableTextFile("note.md", "binary")).toBe(false);
    expect(isLockableTextFile("note.md", "luno-ai")).toBe(false);
  });

  it("should support cross-instance re-encryption with new PIN", async () => {
    const encryptedV1 = await encryptNoteContent(samplePlainText, "112233");
    const decrypted = await decryptNoteContent(encryptedV1, "112233");
    expect(decrypted).toBe(samplePlainText);

    const encryptedV2 = await encryptNoteContent(decrypted, "998877");
    const decryptedV2 = await decryptNoteContent(encryptedV2, "998877");
    expect(decryptedV2).toBe(samplePlainText);

    // Old pin fails on V2
    await expect(decryptNoteContent(encryptedV2, "112233")).rejects.toThrow("INCORRECT_PIN");
  });

  it("should independently encrypt and decrypt separate notes without data leakage", async () => {
    const note1Content = "---\ntags:\n  - lock1\n---\nThis is content from testing 1";
    const note2Content = "---\ntags:\n  - lock2\n---\nThis is content from testing 2";

    const encrypted1 = await encryptNoteContent(note1Content, "111111");
    const encrypted2 = await encryptNoteContent(note2Content, "222222");

    expect(isEncryptedNote(encrypted1)).toBe(true);
    expect(isEncryptedNote(encrypted2)).toBe(true);

    const decrypted1 = await decryptNoteContent(encrypted1, "111111");
    const decrypted2 = await decryptNoteContent(encrypted2, "222222");

    expect(decrypted1).toBe(note1Content);
    expect(decrypted2).toBe(note2Content);
    expect(decrypted1).not.toContain("testing 2");
    expect(decrypted2).not.toContain("testing 1");
  });
});

