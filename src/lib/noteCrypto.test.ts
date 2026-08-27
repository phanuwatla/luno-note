import { describe, it, expect } from "vitest";
import {
  encryptNoteContent,
  decryptNoteContent,
  isEncryptedNote,
  parseEncryptedEnvelope,
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
    expect(envelope?.version).toBe(1);
    expect(typeof envelope?.salt).toBe("string");
    expect(typeof envelope?.iv).toBe("string");
    expect(typeof envelope?.ciphertext).toBe("string");
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
});
