import { escapeHtml } from '../utils/dom';

export interface InlineTextDiffResult {
  oldHtml: string;
  newHtml: string;
}

export function inlineTextDiff(oldText: string, newText: string, prefix: string): InlineTextDiffResult {
  const oldChars = Array.from(oldText);
  const newChars = Array.from(newText);
  const m = oldChars.length;
  const n = newChars.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = oldChars[i] === newChars[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  let oldHtml = '';
  let newHtml = '';

  while (i < m && j < n) {
    if (oldChars[i] === newChars[j]) {
      oldHtml += escapeHtml(oldChars[i]);
      newHtml += escapeHtml(newChars[j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      oldHtml += `<span class="${prefix}-inline-delete">${escapeHtml(oldChars[i])}</span>`;
      i++;
    } else {
      newHtml += `<span class="${prefix}-inline-insert">${escapeHtml(newChars[j])}</span>`;
      j++;
    }
  }

  while (i < m) oldHtml += `<span class="${prefix}-inline-delete">${escapeHtml(oldChars[i++])}</span>`;
  while (j < n) newHtml += `<span class="${prefix}-inline-insert">${escapeHtml(newChars[j++])}</span>`;

  return { oldHtml, newHtml };
}
