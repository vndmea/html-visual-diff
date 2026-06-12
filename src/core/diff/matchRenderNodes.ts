import type { RenderDiffOptions } from './types';
import type { RenderNode } from '../snapshot/types';
import { similarity } from '../../utils/similarity';

const MIN_MATCH_SCORE = 0.55;
const LOOKAHEAD_WINDOW = 3;
const BEST_CANDIDATE_MARGIN = 0.12;

function getAttr(node: RenderNode, name: string): string {
  return node.attributes[name] || '';
}

function getTextScore(oldNode: RenderNode, newNode: RenderNode): number {
  return similarity(oldNode.text || '', newNode.text || '');
}

function getClassScore(oldNode: RenderNode, newNode: RenderNode): number {
  const oldClass = getAttr(oldNode, 'class').trim();
  const newClass = getAttr(newNode, 'class').trim();

  if (!oldClass && !newClass) return 0.5;
  if (!oldClass || !newClass) return 0;
  if (oldClass === newClass) return 1;
  return similarity(oldClass, newClass);
}

function getStructuralScore(oldNode: RenderNode, newNode: RenderNode): number {
  const oldCount = oldNode.children.length;
  const newCount = newNode.children.length;
  if (!oldCount && !newCount) return 1;
  const maxCount = Math.max(oldCount, newCount);
  return maxCount === 0 ? 1 : 1 - (Math.abs(oldCount - newCount) / maxCount);
}

export function getNodeMatchScore(oldNode: RenderNode, newNode: RenderNode, options: RenderDiffOptions = {}): number {
  if (oldNode.nodeType !== newNode.nodeType) return 0;
  if (oldNode.tagName !== newNode.tagName) return 0;

  const oldDiffId = getAttr(oldNode, 'data-diff-id');
  const newDiffId = getAttr(newNode, 'data-diff-id');
  if (oldDiffId || newDiffId) return !!oldDiffId && oldDiffId === newDiffId ? 1 : 0;

  const oldId = getAttr(oldNode, 'id');
  const newId = getAttr(newNode, 'id');
  if (oldId || newId) return !!oldId && oldId === newId ? 0.98 : 0;

  if (options.getNodeKey && oldNode.nodeType === 'element' && newNode.nodeType === 'element') {
    const oldKey = oldNode.attributes['data-hvd-node-id'] || null;
    const newKey = newNode.attributes['data-hvd-node-id'] || null;
    if (oldKey && newKey) return oldKey === newKey ? 0.97 : 0;
  }

  const textScore = getTextScore(oldNode, newNode);
  const classScore = getClassScore(oldNode, newNode);
  const structureScore = getStructuralScore(oldNode, newNode);

  return (textScore * 0.5) + (classScore * 0.3) + (structureScore * 0.2);
}

export function nodesMatch(oldNode: RenderNode, newNode: RenderNode, options: RenderDiffOptions = {}): boolean {
  return getNodeMatchScore(oldNode, newNode, options) >= MIN_MATCH_SCORE;
}

function findBestCandidateIndex(
  currentNode: RenderNode,
  candidates: RenderNode[],
  startIndex: number,
  options: RenderDiffOptions
): number {
  let bestIndex = -1;
  let bestScore = 0;

  for (let offset = 0; offset <= LOOKAHEAD_WINDOW; offset += 1) {
    const index = startIndex + offset;
    const candidate = candidates[index];
    if (!candidate) continue;

    const score = getNodeMatchScore(currentNode, candidate, options);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestScore >= MIN_MATCH_SCORE ? bestIndex : -1;
}

function shouldUseDirectMatch(
  directScore: number,
  bestLookaheadScore: number
): boolean {
  if (directScore < MIN_MATCH_SCORE) return false;
  if (bestLookaheadScore < MIN_MATCH_SCORE) return true;
  return directScore >= (bestLookaheadScore - BEST_CANDIDATE_MARGIN);
}

export function pairChildren(
  oldChildren: RenderNode[],
  newChildren: RenderNode[],
  options: RenderDiffOptions = {}
): Array<{ oldNode?: RenderNode; newNode?: RenderNode }> {
  const pairs: Array<{ oldNode?: RenderNode; newNode?: RenderNode }> = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldChildren.length || newIndex < newChildren.length) {
    const oldNode = oldChildren[oldIndex];
    const newNode = newChildren[newIndex];

    if (!oldNode) {
      pairs.push({ newNode });
      newIndex += 1;
      continue;
    }

    if (!newNode) {
      pairs.push({ oldNode });
      oldIndex += 1;
      continue;
    }

    const directScore = getNodeMatchScore(oldNode, newNode, options);
    const bestNewIndex = findBestCandidateIndex(oldNode, newChildren, newIndex, options);
    const bestNewScore = bestNewIndex >= 0 ? getNodeMatchScore(oldNode, newChildren[bestNewIndex], options) : 0;

    if (shouldUseDirectMatch(directScore, bestNewScore) && directScore >= MIN_MATCH_SCORE) {
      pairs.push({ oldNode, newNode });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (bestNewIndex > newIndex) {
      while (newIndex < bestNewIndex) {
        pairs.push({ newNode: newChildren[newIndex] });
        newIndex += 1;
      }
      pairs.push({ oldNode, newNode: newChildren[newIndex] });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    const bestOldIndex = findBestCandidateIndex(newNode, oldChildren, oldIndex, options);
    if (bestOldIndex > oldIndex) {
      while (oldIndex < bestOldIndex) {
        pairs.push({ oldNode: oldChildren[oldIndex] });
        oldIndex += 1;
      }
      pairs.push({ oldNode: oldChildren[oldIndex], newNode });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    pairs.push({ oldNode, newNode });
    oldIndex += 1;
    newIndex += 1;
  }

  return pairs;
}
