import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateLockoutSeconds,
  getRemainingLockoutSeconds,
  isPinLockedOut,
  recordFailedPinAttempt,
  clearPinLockout,
  getFailedAttempts,
  getPinLockoutRecord,
  savePinLockoutRecord,
  INACTIVITY_RESET_MS,
} from "./pinLockout";

describe("pinLockout - Persistent Anti-Brute-Force Rate Limiting", () => {
  const testNoteId = "test-note-uuid-1234";

  beforeEach(() => {
    clearPinLockout(testNoteId);
  });

  it("should calculate correct lockout duration thresholds", () => {
    expect(calculateLockoutSeconds(0)).toBe(0);
    expect(calculateLockoutSeconds(1)).toBe(0);
    expect(calculateLockoutSeconds(2)).toBe(0);
    expect(calculateLockoutSeconds(3)).toBe(3);
    expect(calculateLockoutSeconds(4)).toBe(3);
    expect(calculateLockoutSeconds(5)).toBe(30);
    expect(calculateLockoutSeconds(6)).toBe(30);
    expect(calculateLockoutSeconds(7)).toBe(30);
    expect(calculateLockoutSeconds(8)).toBe(120);
    expect(calculateLockoutSeconds(15)).toBe(120);
  });

  it("should record failed attempts and enforce lockout thresholds", () => {
    expect(isPinLockedOut(testNoteId)).toBe(false);
    expect(getRemainingLockoutSeconds(testNoteId)).toBe(0);

    // Attempt 1
    let result = recordFailedPinAttempt(testNoteId);
    expect(result.failedAttempts).toBe(1);
    expect(result.lockoutSeconds).toBe(0);
    expect(isPinLockedOut(testNoteId)).toBe(false);

    // Attempt 2
    result = recordFailedPinAttempt(testNoteId);
    expect(result.failedAttempts).toBe(2);
    expect(result.lockoutSeconds).toBe(0);
    expect(isPinLockedOut(testNoteId)).toBe(false);

    // Attempt 3 -> triggers 3s lockout
    result = recordFailedPinAttempt(testNoteId);
    expect(result.failedAttempts).toBe(3);
    expect(result.lockoutSeconds).toBe(3);
    expect(isPinLockedOut(testNoteId)).toBe(true);
    expect(getRemainingLockoutSeconds(testNoteId)).toBeGreaterThan(0);
    expect(getRemainingLockoutSeconds(testNoteId)).toBeLessThanOrEqual(3);
  });

  it("should persist lockout state across simulated note switching / component unmounts", () => {
    // Record 5 failed attempts on note A
    for (let i = 0; i < 5; i++) {
      recordFailedPinAttempt(testNoteId);
    }

    // Lockout should be 30 seconds
    const remaining = getRemainingLockoutSeconds(testNoteId);
    expect(remaining).toBeGreaterThan(25);
    expect(remaining).toBeLessThanOrEqual(30);
    expect(isPinLockedOut(testNoteId)).toBe(true);

    // Simulate switching away: another note check
    const otherNoteId = "other-note-999";
    expect(isPinLockedOut(otherNoteId)).toBe(false);
    expect(getRemainingLockoutSeconds(otherNoteId)).toBe(0);

    // Simulate switching BACK to note A
    // Lockout MUST NOT be reset!
    expect(isPinLockedOut(testNoteId)).toBe(true);
    expect(getRemainingLockoutSeconds(testNoteId)).toBeGreaterThan(0);
    expect(getFailedAttempts(testNoteId)).toBe(5);
  });

  it("should naturally expire lockout after duration without resetting attempt count", () => {
    const pastTime = Date.now() - 4000; // 4 seconds ago
    savePinLockoutRecord(testNoteId, {
      failedAttempts: 3,
      lockoutUntil: pastTime, // expired
      lastAttemptAt: pastTime,
    });

    // Lockout has passed
    expect(getRemainingLockoutSeconds(testNoteId)).toBe(0);
    expect(isPinLockedOut(testNoteId)).toBe(false);

    // But attempt count is preserved (3 attempts)
    expect(getFailedAttempts(testNoteId)).toBe(3);

    // Next failure increments from 3 to 4
    const next = recordFailedPinAttempt(testNoteId);
    expect(next.failedAttempts).toBe(4);
    expect(next.lockoutSeconds).toBe(3);
  });

  it("should completely clear lockout and attempt records on clearPinLockout", () => {
    for (let i = 0; i < 6; i++) {
      recordFailedPinAttempt(testNoteId);
    }
    expect(isPinLockedOut(testNoteId)).toBe(true);

    clearPinLockout(testNoteId);

    expect(isPinLockedOut(testNoteId)).toBe(false);
    expect(getRemainingLockoutSeconds(testNoteId)).toBe(0);
    expect(getFailedAttempts(testNoteId)).toBe(0);
    expect(getPinLockoutRecord(testNoteId)).toBeNull();
  });

  it("should reset attempt counter if inactivity window (15 mins) has elapsed", () => {
    const wayPastTime = Date.now() - (INACTIVITY_RESET_MS + 1000);
    savePinLockoutRecord(testNoteId, {
      failedAttempts: 7,
      lockoutUntil: 0,
      lastAttemptAt: wayPastTime,
    });

    expect(getFailedAttempts(testNoteId)).toBe(0);

    // Recording new attempt resets to 1
    const res = recordFailedPinAttempt(testNoteId);
    expect(res.failedAttempts).toBe(1);
    expect(res.lockoutSeconds).toBe(0);
  });
});
