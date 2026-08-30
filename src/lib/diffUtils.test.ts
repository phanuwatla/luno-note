import { describe, it, expect } from "vitest";
import { computeLineDiff, summarizeDiff } from "./diffUtils";

describe("diffUtils", () => {
  it("should detect identical text with no changes", () => {
    const text = "Line 1\nLine 2\nLine 3";
    const diff = computeLineDiff(text, text);
    expect(diff.every((d) => d.type === "unchanged")).toBe(true);
    expect(diff.length).toBe(3);

    const summary = summarizeDiff(text, text);
    expect(summary.addedLines).toBe(0);
    expect(summary.removedLines).toBe(0);
    expect(summary.unchangedLines).toBe(3);
    expect(summary.wordCountDiff).toBe(0);
  });

  it("should detect added and removed lines", () => {
    const oldText = "Line 1\nLine 2\nLine 3";
    const newText = "Line 1\nLine 2 modified\nLine 3\nLine 4 added";
    const diff = computeLineDiff(oldText, newText);

    expect(diff.some((d) => d.type === "removed" && d.text === "Line 2")).toBe(true);
    expect(diff.some((d) => d.type === "added" && d.text === "Line 2 modified")).toBe(true);
    expect(diff.some((d) => d.type === "added" && d.text === "Line 4 added")).toBe(true);

    const summary = summarizeDiff(oldText, newText);
    expect(summary.addedLines).toBe(2);
    expect(summary.removedLines).toBe(1);
    expect(summary.unchangedLines).toBe(2);
  });
});
