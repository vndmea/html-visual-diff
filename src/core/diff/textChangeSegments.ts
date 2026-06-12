export interface TextChangeSegment {
  start: number;
  end: number;
}

interface DiffOp {
  type: 'equal' | 'delete' | 'insert';
  oldChar?: string;
  newChar?: string;
}

function buildLcsTable(oldChars: string[], newChars: string[]): number[][] {
  const m = oldChars.length;
  const n = newChars.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = oldChars[i] === newChars[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  return dp;
}

function buildDiffOps(oldText: string, newText: string): DiffOp[] {
  const oldChars = Array.from(oldText);
  const newChars = Array.from(newText);
  const dp = buildLcsTable(oldChars, newChars);
  const ops: DiffOp[] = [];

  let i = 0;
  let j = 0;

  while (i < oldChars.length && j < newChars.length) {
    if (oldChars[i] === newChars[j]) {
      ops.push({ type: 'equal', oldChar: oldChars[i], newChar: newChars[j] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'delete', oldChar: oldChars[i] });
      i += 1;
    } else {
      ops.push({ type: 'insert', newChar: newChars[j] });
      j += 1;
    }
  }

  while (i < oldChars.length) {
    ops.push({ type: 'delete', oldChar: oldChars[i] });
    i += 1;
  }

  while (j < newChars.length) {
    ops.push({ type: 'insert', newChar: newChars[j] });
    j += 1;
  }

  return ops;
}

function collectSegments(ops: DiffOp[], side: 'old' | 'new'): TextChangeSegment[] {
  const segments: TextChangeSegment[] = [];
  let cursor = 0;
  let currentStart: number | null = null;

  const closeSegment = () => {
    if (currentStart === null) return;
    if (currentStart !== cursor) {
      segments.push({ start: currentStart, end: cursor });
    }
    currentStart = null;
  };

  for (const op of ops) {
    if (op.type === 'equal') {
      closeSegment();
      cursor += 1;
      continue;
    }

    const touchesSide = side === 'old' ? op.type === 'delete' : op.type === 'insert';
    if (touchesSide && currentStart === null) {
      currentStart = cursor;
    }

    if (side === 'old' && op.type === 'delete') {
      cursor += 1;
    }

    if (side === 'new' && op.type === 'insert') {
      cursor += 1;
    }
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

  const ops = buildDiffOps(oldText, newText);
  return {
    oldSegments: collectSegments(ops, 'old'),
    newSegments: collectSegments(ops, 'new')
  };
}
