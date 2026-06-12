export interface TextChangeSegment {
  start: number;
  end: number;
}

interface Token {
  value: string;
  start: number;
  end: number;
}

function tokenizeWords(text: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const isWhitespace = /\s/.test(char);
    const currentIsWhitespace = current ? /\s/.test(current[0]) : null;

    if (!current) {
      current = char;
      start = index;
      continue;
    }

    if (currentIsWhitespace === isWhitespace) {
      current += char;
      continue;
    }

    tokens.push({ value: current, start, end: index });
    current = char;
    start = index;
  }

  if (current) {
    tokens.push({ value: current, start, end: text.length });
  }

  return tokens;
}

function shouldUseWordGranularity(oldText: string, newText: string): boolean {
  const sample = `${oldText} ${newText}`;
  const letters = (sample.match(/[A-Za-z]/g) || []).length;
  const cjk = (sample.match(/[\u3400-\u9fff]/g) || []).length;
  return (/\s/.test(oldText) || /\s/.test(newText)) && letters >= cjk;
}

function tokenizeCharacters(text: string): Token[] {
  const tokens: Token[] = [];
  let offset = 0;

  for (const value of text) {
    tokens.push({
      value,
      start: offset,
      end: offset + value.length
    });
    offset += value.length;
  }

  return tokens;
}

function collectMatchedTokenIndexes(oldValues: string[], newValues: string[]): {
  oldMatched: Set<number>;
  newMatched: Set<number>;
} {
  const oldMatched = new Set<number>();
  const newMatched = new Set<number>();

  const markCommonBlocks = (
    oldStart: number,
    oldEnd: number,
    newStart: number,
    newEnd: number
  ) => {
    let bestOldStart = -1;
    let bestNewStart = -1;
    let bestLength = 0;
    const oldLength = oldEnd - oldStart;
    const newLength = newEnd - newStart;
    const dp = Array.from({ length: oldLength + 1 }, () =>
      Array.from({ length: newLength + 1 }, () => 0)
    );

    for (let oldOffset = 1; oldOffset <= oldLength; oldOffset += 1) {
      for (let newOffset = 1; newOffset <= newLength; newOffset += 1) {
        const oldIndex = oldStart + oldOffset - 1;
        const newIndex = newStart + newOffset - 1;

        if (oldValues[oldIndex] !== newValues[newIndex]) {
          continue;
        }

        dp[oldOffset][newOffset] = dp[oldOffset - 1][newOffset - 1] + 1;
        if (dp[oldOffset][newOffset] > bestLength) {
          bestLength = dp[oldOffset][newOffset];
          bestOldStart = oldIndex - bestLength + 1;
          bestNewStart = newIndex - bestLength + 1;
        }
      }
    }

    if (bestLength === 0 || bestOldStart < 0 || bestNewStart < 0) {
      return;
    }

    markCommonBlocks(oldStart, bestOldStart, newStart, bestNewStart);

    for (let index = 0; index < bestLength; index += 1) {
      oldMatched.add(bestOldStart + index);
      newMatched.add(bestNewStart + index);
    }

    markCommonBlocks(
      bestOldStart + bestLength,
      oldEnd,
      bestNewStart + bestLength,
      newEnd
    );
  };

  markCommonBlocks(0, oldValues.length, 0, newValues.length);

  if (oldMatched.size === 0 && newMatched.size === 0) {
    return { oldMatched, newMatched };
  }

  return { oldMatched, newMatched };
}

function collectSegments(tokens: Token[], matchedIndexes: Set<number>): TextChangeSegment[] {
  const segments: TextChangeSegment[] = [];
  let currentStart: number | null = null;
  let currentEnd = 0;

  const closeSegment = () => {
    if (currentStart === null) return;
    segments.push({ start: currentStart, end: currentEnd });
    currentStart = null;
  };

  for (const [index, token] of tokens.entries()) {
    if (matchedIndexes.has(index)) {
      closeSegment();
      continue;
    }

    if (currentStart === null) {
      currentStart = token.start;
    }

    currentEnd = token.end;
  }

  closeSegment();
  return segments;
}

export function getTextChangeSegments(oldText: string, newText: string): {
  oldSegments: TextChangeSegment[];
  newSegments: TextChangeSegment[];
} {
  if (oldText === newText) {
    return { oldSegments: [], newSegments: [] };
  }

  if (shouldUseWordGranularity(oldText, newText)) {
    const oldTokens = tokenizeWords(oldText);
    const newTokens = tokenizeWords(newText);
    const { oldMatched, newMatched } = collectMatchedTokenIndexes(
      oldTokens.map((token) => token.value),
      newTokens.map((token) => token.value)
    );

    return {
      oldSegments: collectSegments(oldTokens, oldMatched),
      newSegments: collectSegments(newTokens, newMatched)
    };
  }

  const oldChars = tokenizeCharacters(oldText);
  const newChars = tokenizeCharacters(newText);
  const { oldMatched, newMatched } = collectMatchedTokenIndexes(
    oldChars.map((token) => token.value),
    newChars.map((token) => token.value)
  );

  return {
    oldSegments: collectSegments(oldChars, oldMatched),
    newSegments: collectSegments(newChars, newMatched)
  };
}
