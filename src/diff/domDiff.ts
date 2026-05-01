import type { NormalizedDiffOptions } from '../types';
import { getComparableChildren, nodeKind, nodeSignature, nodeText } from '../utils/dom';
import { similarity } from '../utils/similarity';

export interface NodePair {
  type: 'pair' | 'insert' | 'delete';
  oldNode: Node | null;
  newNode: Node | null;
}

export function compareNodeScore(oldNode: Node, newNode: Node): number {
  const oldKind = nodeKind(oldNode);
  const newKind = nodeKind(newNode);
  if (oldKind !== newKind) return similarity(nodeText(oldNode), nodeText(newNode)) * 0.35;
  const textScore = similarity(nodeText(oldNode), nodeText(newNode));
  const sigScore = similarity(nodeSignature(oldNode), nodeSignature(newNode));
  return 0.55 + textScore * 0.32 + sigScore * 0.13;
}

export function diffChildren(oldParent: Node, newParent: Node, options: NormalizedDiffOptions): NodePair[] {
  const oldChildren = getComparableChildren(oldParent, options.ignoreTags, options.allowUnsafeHtml);
  const newChildren = getComparableChildren(newParent, options.ignoreTags, options.allowUnsafeHtml);
  return diffNodeList(oldChildren, newChildren, options);
}

export function diffNodeList(oldChildren: Node[], newChildren: Node[], options: NormalizedDiffOptions): NodePair[] {
  const m = oldChildren.length;
  const n = newChildren.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const score = compareNodeScore(oldChildren[i], newChildren[j]);
      if (score >= options.matchThreshold) {
        dp[i][j] = Math.max(dp[i + 1][j + 1] + score, dp[i + 1][j], dp[i][j + 1]);
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const pairs: NodePair[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    const score = compareNodeScore(oldChildren[i], newChildren[j]);
    if (score >= options.matchThreshold && dp[i][j] === dp[i + 1][j + 1] + score) {
      pairs.push({ type: 'pair', oldNode: oldChildren[i], newNode: newChildren[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      pairs.push({ type: 'delete', oldNode: oldChildren[i], newNode: null });
      i++;
    } else {
      pairs.push({ type: 'insert', oldNode: null, newNode: newChildren[j] });
      j++;
    }
  }

  while (i < m) pairs.push({ type: 'delete', oldNode: oldChildren[i++], newNode: null });
  while (j < n) pairs.push({ type: 'insert', oldNode: null, newNode: newChildren[j++] });
  return pairs;
}
