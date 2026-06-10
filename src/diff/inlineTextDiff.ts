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

  type Part = { type: 'text' | 'delete'; value: string };
  type NewPart = { type: 'text' | 'insert'; value: string };

  const oldParts: Part[] = [];
  const newParts: NewPart[] = [];

  const pushOldText = (value: string) => {
    if (!value) return;
    const last = oldParts[oldParts.length - 1];
    if (last?.type === 'text') {
      last.value += value;
    } else {
      oldParts.push({ type: 'text', value });
    }
  };

  const pushOldDelete = (value: string) => {
    if (!value) return;
    const last = oldParts[oldParts.length - 1];
    if (last?.type === 'delete') {
      last.value += value;
    } else {
      oldParts.push({ type: 'delete', value });
    }
  };

  const pushNewText = (value: string) => {
    if (!value) return;
    const last = newParts[newParts.length - 1];
    if (last?.type === 'text') {
      last.value += value;
    } else {
      newParts.push({ type: 'text', value });
    }
  };

  const pushNewInsert = (value: string) => {
    if (!value) return;
    const last = newParts[newParts.length - 1];
    if (last?.type === 'insert') {
      last.value += value;
    } else {
      newParts.push({ type: 'insert', value });
    }
  };

  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (oldTokens[i] === newTokens[j]) {
      pushOldText(oldTokens[i]);
      pushNewText(newTokens[j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      pushOldDelete(oldTokens[i]);
      i++;
    } else {
      pushNewInsert(newTokens[j]);
      j++;
    }
  }

  while (i < m) pushOldDelete(oldTokens[i++]);
  while (j < n) pushNewInsert(newTokens[j++]);

  const oldHtml = oldParts.map((part) => part.type === 'text'
    ? escapeHtml(part.value)
    : `<span class="${prefix}-inline-delete">${escapeHtml(part.value)}</span>`
  ).join('');

  const newHtml = newParts.map((part) => part.type === 'text'
    ? escapeHtml(part.value)
    : `<span class="${prefix}-inline-insert">${escapeHtml(part.value)}</span>`
  ).join('');

  return { oldHtml, newHtml };
}
