export interface TextChangeSegment {
  start: number;
  end: number;
}

function commonPrefixLength(oldText: string, newText: string): number {
  const max = Math.min(oldText.length, newText.length);
  let index = 0;
  while (index < max && oldText[index] === newText[index]) index += 1;
  return index;
}

function commonSuffixLength(oldText: string, newText: string, prefixLength: number): number {
  const oldMax = oldText.length - prefixLength;
  const newMax = newText.length - prefixLength;
  const max = Math.min(oldMax, newMax);
  let index = 0;
  while (
    index < max &&
    oldText[oldText.length - 1 - index] === newText[newText.length - 1 - index]
  ) {
    index += 1;
  }
  return index;
}

export function getTextChangeSegments(oldText: string, newText: string): {
  oldSegments: TextChangeSegment[];
  newSegments: TextChangeSegment[];
} {
  if (oldText === newText) {
    return { oldSegments: [], newSegments: [] };
  }

  const prefix = commonPrefixLength(oldText, newText);
  const suffix = commonSuffixLength(oldText, newText, prefix);

  const oldEnd = Math.max(prefix, oldText.length - suffix);
  const newEnd = Math.max(prefix, newText.length - suffix);

  return {
    oldSegments: [{ start: prefix, end: oldEnd }],
    newSegments: [{ start: prefix, end: newEnd }]
  };
}
