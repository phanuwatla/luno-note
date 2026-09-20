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
 * Computes line-by-line diff between originalText (e.g. historical version) and newText (current version).
 * Includes common prefix/suffix trimming and boundary safeguards for fast execution and low memory.
 */
export function computeLineDiff(originalText: string, newText: string): DiffLine[] {
  const origLines = (originalText || "").split("\n");
  const newLines = (newText || "").split("\n");

  const origLen = origLines.length;
  const newLen = newLines.length;

  // 1. Fast path: identical texts
  if (originalText === newText) {
    return origLines.map((line, idx) => ({
      type: "unchanged",
      text: line,
      oldLineNumber: idx + 1,
      newLineNumber: idx + 1,
    }));
  }

  // 2. Common Prefix Trim
  let prefixCount = 0;
  while (
    prefixCount < origLen &&
    prefixCount < newLen &&
    origLines[prefixCount] === newLines[prefixCount]
  ) {
    prefixCount++;
  }

  // 3. Common Suffix Trim
  let suffixCount = 0;
  while (
    suffixCount < (origLen - prefixCount) &&
    suffixCount < (newLen - prefixCount) &&
    origLines[origLen - 1 - suffixCount] === newLines[newLen - 1 - suffixCount]
  ) {
    suffixCount++;
  }

  const prefixDiffs: DiffLine[] = [];
  for (let k = 0; k < prefixCount; k++) {
    prefixDiffs.push({
      type: "unchanged",
      text: origLines[k],
      oldLineNumber: k + 1,
      newLineNumber: k + 1,
    });
  }

  const suffixDiffs: DiffLine[] = [];
  for (let k = 0; k < suffixCount; k++) {
    const origIdx = origLen - suffixCount + k;
    const newIdx = newLen - suffixCount + k;
    suffixDiffs.push({
      type: "unchanged",
      text: origLines[origIdx],
      oldLineNumber: origIdx + 1,
      newLineNumber: newIdx + 1,
    });
  }

  // Middle segments
  const midOrig = origLines.slice(prefixCount, origLen - suffixCount);
  const midNew = newLines.slice(prefixCount, newLen - suffixCount);

  const middleDiffs: DiffLine[] = [];
  if (midOrig.length === 0) {
    for (let k = 0; k < midNew.length; k++) {
      middleDiffs.push({
        type: "added",
        text: midNew[k],
        newLineNumber: prefixCount + k + 1,
      });
    }
  } else if (midNew.length === 0) {
    for (let k = 0; k < midOrig.length; k++) {
      middleDiffs.push({
        type: "removed",
        text: midOrig[k],
        oldLineNumber: prefixCount + k + 1,
      });
    }
  } else {
    // If middle segment exceeds safe LCS matrix size, fallback to linear block diff
    const MAX_LCS_LINES = 1200;
    if (midOrig.length > MAX_LCS_LINES || midNew.length > MAX_LCS_LINES) {
      for (let k = 0; k < midOrig.length; k++) {
        middleDiffs.push({
          type: "removed",
          text: midOrig[k],
          oldLineNumber: prefixCount + k + 1,
        });
      }
      for (let k = 0; k < midNew.length; k++) {
        middleDiffs.push({
          type: "added",
          text: midNew[k],
          newLineNumber: prefixCount + k + 1,
        });
      }
    } else {
      const dp = lcs(midOrig, midNew);
      let i = midOrig.length;
      let j = midNew.length;
      const stack: DiffLine[] = [];

      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && midOrig[i - 1] === midNew[j - 1]) {
          stack.push({
            type: "unchanged",
            text: midOrig[i - 1],
            oldLineNumber: prefixCount + i,
            newLineNumber: prefixCount + j,
          });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          stack.push({
            type: "added",
            text: midNew[j - 1],
            newLineNumber: prefixCount + j,
          });
          j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
          stack.push({
            type: "removed",
            text: midOrig[i - 1],
            oldLineNumber: prefixCount + i,
          });
          i--;
        }
      }

      while (stack.length > 0) {
        middleDiffs.push(stack.pop()!);
      }
    }
  }

  return [...prefixDiffs, ...middleDiffs, ...suffixDiffs];
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
