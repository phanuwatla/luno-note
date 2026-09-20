/**
 * PIN Lockout Manager for Luno Note
 * Protects against brute-force attacks on 6-digit PIN protected notes.
 * Enforces persistent exponential backoff and prevents state-reset bypasses
 * (e.g. switching tabs, navigating to other notes, or refreshing the page).
 */

export interface PinLockoutRecord {
  failedAttempts: number;
  lockoutUntil: number; // timestamp in ms when lockout expires (0 if not locked out)
  lastAttemptAt: number; // timestamp in ms of last failed attempt
}

const STORAGE_PREFIX = "luno_pin_lockout_";
export const INACTIVITY_RESET_MS = 15 * 60 * 1000; // 15 minutes of inactivity resets failed attempt counter

// In-memory fallback map for environments where localStorage is restricted/unavailable
const memoryStore = new Map<string, PinLockoutRecord>();

/**
 * Calculates the lockout duration in seconds according to the number of failed attempts:
 * - 1-2 attempts: 0s (no wait)
 * - 3-4 attempts: 3s
 * - 5-7 attempts: 30s
 * - 8+ attempts: 120s
 */
export function calculateLockoutSeconds(attempts: number): number {
  if (attempts >= 8) return 120;
  if (attempts >= 5) return 30;
  if (attempts >= 3) return 3;
  return 0;
}

/**
 * Retrieves the lockout record for a given note ID.
 */
export function getPinLockoutRecord(noteId: string): PinLockoutRecord | null {
  if (!noteId) return null;
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${noteId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.failedAttempts === "number" && typeof parsed?.lockoutUntil === "number") {
          return parsed as PinLockoutRecord;
        }
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return memoryStore.get(noteId) || null;
}

/**
 * Saves the lockout record for a given note ID.
 */
export function savePinLockoutRecord(noteId: string, record: PinLockoutRecord): void {
  if (!noteId) return;
  memoryStore.set(noteId, record);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`${STORAGE_PREFIX}${noteId}`, JSON.stringify(record));
    }
  } catch {
    // Ignore localStorage quota errors
  }
}

/**
 * Clears any lockout or failed attempt records for a note (called upon successful unlock or PIN removal).
 */
export function clearPinLockout(noteId: string): void {
  if (!noteId) return;
  memoryStore.delete(noteId);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(`${STORAGE_PREFIX}${noteId}`);
    }
  } catch {
    // Ignore
  }
}

/**
 * Returns the remaining lockout seconds for a note.
 * Returns 0 if not currently locked out.
 */
export function getRemainingLockoutSeconds(noteId: string): number {
  const record = getPinLockoutRecord(noteId);
  if (!record || !record.lockoutUntil) return 0;
  const now = Date.now();
  if (record.lockoutUntil > now) {
    return Math.ceil((record.lockoutUntil - now) / 1000);
  }
  return 0;
}

/**
 * Checks whether a note is currently locked out from entering PIN.
 */
export function isPinLockedOut(noteId: string): boolean {
  return getRemainingLockoutSeconds(noteId) > 0;
}

/**
 * Gets the current count of failed attempts for a note (with inactivity window reset).
 */
export function getFailedAttempts(noteId: string): number {
  const record = getPinLockoutRecord(noteId);
  if (!record) return 0;
  const now = Date.now();
  if (now - record.lastAttemptAt > INACTIVITY_RESET_MS) {
    return 0;
  }
  return record.failedAttempts;
}

/**
 * Records a failed PIN attempt and returns the updated attempt count and lockout details.
 */
export function recordFailedPinAttempt(noteId: string): {
  failedAttempts: number;
  lockoutSeconds: number;
  lockoutUntil: number;
} {
  const now = Date.now();
  const currentRecord = getPinLockoutRecord(noteId);
  let attempts = 1;

  if (currentRecord) {
    // If it's been more than 15 minutes since the last attempt, reset attempt counter
    if (now - currentRecord.lastAttemptAt > INACTIVITY_RESET_MS) {
      attempts = 1;
    } else {
      attempts = currentRecord.failedAttempts + 1;
    }
  }

  const lockoutSeconds = calculateLockoutSeconds(attempts);
  const lockoutUntil = lockoutSeconds > 0 ? now + lockoutSeconds * 1000 : 0;

  const newRecord: PinLockoutRecord = {
    failedAttempts: attempts,
    lockoutUntil,
    lastAttemptAt: now,
  };

  savePinLockoutRecord(noteId, newRecord);

  return {
    failedAttempts: attempts,
    lockoutSeconds,
    lockoutUntil,
  };
}
