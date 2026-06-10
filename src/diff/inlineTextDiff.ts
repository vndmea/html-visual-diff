import type { TextDiffGranularity } from '../types';
import { escapeHtml } from '../utils/dom';

export interface InlineTextDiffResult {
  oldHtml: string;
  newHtml: string;
}

function tokenizeWords(text: string): string[] {
  if (!text) return [];
  
  const tokens: string[] = [];
  let current = '';
  
  for (const char of Array.from(text)) {
    const isWhitespace = /\s/.test(char);
    const currentIsWhitespace = current ? /\s/.test(current[0]) : undefined;
    
    if (currentIsWhitespace === undefined || currentIsWhitespace === isWhitespace) {
      current += char;
    } else {
      if (current) tokens.push(current);
      current = char;
    }
  }
  
  if (current) tokens.push(current);
  return tokens;
}

export function inlineTextDiff(oldText: string, newText: string, prefix: string, granularity: TextDiffGranularity = 'word'): InlineTextDiffResult {
  const oldTokens = granularity === 'word' ? tokenizeWords(oldText) : Array.from(oldText);
  const newTokens = granularity === 'word' ? tokenizeWords(newText) : Array.from(newText);
  const m = oldTokens.length;
  const n = newTokens.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = oldTokens[i] === newTokens[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  let oldHtml = '';
  let newHtml = '';

  while (i < m && j < n) {
    if (oldTokens[i] === newTokens[j]) {
      oldHtml += escapeHtml(oldTokens[i]);
      newHtml += escapeHtml(newTokens[j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      oldHtml += `<span class="${prefix}-inline-delete">${escapeHtml(oldTokens[i])}</span>`;
      i++;
    } else {
      newHtml += `<span class="${prefix}-inline-insert">${escapeHtml(newTokens[j])}</span>`;
      j++;
    }
  }

  while (i < m) oldHtml += `<span class="${prefix}-inline-delete">${escapeHtml(oldTokens[i++])}</span>`;
  while (j < n) newHtml += `<span class="${prefix}-inline-insert">${escapeHtml(newTokens[j++])}</span>`;

  return { oldHtml, newHtml };
}
