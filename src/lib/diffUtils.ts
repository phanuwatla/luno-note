/**
 * Text and Line Diff Utility
 * Computes line-by-line differences between two texts for visual comparison.
 */

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffSummary {
  addedLines: number;
  removedLines: number;
  unchangedLines: number;
  wordCountDiff: number;
  charCountDiff: number;
}

/**
 * Computes longest common subsequence between two arrays of lines
 */
function lcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Computes line-by-line diff between originalText (e.g. historical version) and newText (current version)
 */
export function computeLineDiff(originalText: string, newText: string): DiffLine[] {
  const origLines = (originalText || "").split("\n");
  const newLines = (newText || "").split("\n");

  const dp = lcs(origLines, newLines);
  const result: DiffLine[] = [];

  let i = origLines.length;
  let j = newLines.length;

  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === newLines[j - 1]) {
      stack.push({
        type: "unchanged",
        text: origLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: "added",
        text: newLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      stack.push({
        type: "removed",
        text: origLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  while (stack.length > 0) {
    result.push(stack.pop()!);
  }

  return result;
}

/**
 * Summarizes diff stats (added lines, removed lines, word diff)
 */
export function summarizeDiff(originalText: string, newText: string): DiffSummary {
  const diffs = computeLineDiff(originalText, newText);
  let addedLines = 0;
  let removedLines = 0;
  let unchangedLines = 0;

  for (const d of diffs) {
    if (d.type === "added") addedLines++;
    else if (d.type === "removed") removedLines++;
    else unchangedLines++;
  }

  const origWords = (originalText || "").trim().split(/\s+/).filter(Boolean).length;
  const newWords = (newText || "").trim().split(/\s+/).filter(Boolean).length;
  const origChars = (originalText || "").length;
  const newChars = (newText || "").length;

  return {
    addedLines,
    removedLines,
    unchangedLines,
    wordCountDiff: newWords - origWords,
    charCountDiff: newChars - origChars,
  };
}
