import { describe, it, expect } from "vitest";
import { computeLineDiff, summarizeDiff } from "./diffUtils";

describe("diffUtils", () => {
  it("returns unchanged lines for identical texts", () => {
    const text = "line 1\nline 2\nline 3";
    const diff = computeLineDiff(text, text);
    expect(diff).toHaveLength(3);
    expect(diff.every((d) => d.type === "unchanged")).toBe(true);
  });

  it("handles additions at the end correctly with prefix trimming", () => {
    const v1 = "line 1\nline 2";
    const v2 = "line 1\nline 2\nline 3";
    const diff = computeLineDiff(v1, v2);
    expect(diff[0]).toMatchObject({ type: "unchanged", text: "line 1" });
    expect(diff[1]).toMatchObject({ type: "unchanged", text: "line 2" });
    expect(diff[2]).toMatchObject({ type: "added", text: "line 3" });
  });

  it("handles modifications in the middle with prefix and suffix trimming", () => {
    const v1 = "header\nold body\nfooter";
    const v2 = "header\nnew body\nfooter";
    const diff = computeLineDiff(v1, v2);
    expect(diff).toHaveLength(4);
    expect(diff[0]).toMatchObject({ type: "unchanged", text: "header" });
    expect(diff[1]).toMatchObject({ type: "removed", text: "old body" });
    expect(diff[2]).toMatchObject({ type: "added", text: "new body" });
    expect(diff[3]).toMatchObject({ type: "unchanged", text: "footer" });
  });

  it("correctly calculates summarizeDiff", () => {
    const v1 = "header\nold body\nfooter";
    const v2 = "header\nnew body\nextra\nfooter";
    const summary = summarizeDiff(v1, v2);
    expect(summary.addedLines).toBe(2);
    expect(summary.removedLines).toBe(1);
    expect(summary.unchangedLines).toBe(2);
  });

  it("handles large text without crashing or freezing", () => {
    const linesA = Array.from({ length: 1500 }, (_, i) => `line ${i}`);
    const linesB = Array.from({ length: 1500 }, (_, i) => (i === 500 ? "modified line 500" : `line ${i}`));
    const diff = computeLineDiff(linesA.join("\n"), linesB.join("\n"));
    expect(diff.length).toBeGreaterThan(1500);
    const modifiedAdded = diff.find((d) => d.text === "modified line 500");
    expect(modifiedAdded?.type).toBe("added");
  });
});
