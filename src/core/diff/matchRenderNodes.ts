import type { RenderDiffOptions } from './types';
import type { RenderNode } from '../snapshot/types';
import { similarity } from '../../utils/similarity';

function getAttr(node: RenderNode, name: string): string {
  return node.attributes[name] || '';
}

function getTextScore(oldNode: RenderNode, newNode: RenderNode): number {
  return similarity(oldNode.text || '', newNode.text || '');
}

export function nodesMatch(oldNode: RenderNode, newNode: RenderNode, options: RenderDiffOptions = {}): boolean {
  if (oldNode.nodeType !== newNode.nodeType) return false;
  if (oldNode.tagName !== newNode.tagName) return false;

  const oldDiffId = getAttr(oldNode, 'data-diff-id');
  const newDiffId = getAttr(newNode, 'data-diff-id');
  if (oldDiffId || newDiffId) return !!oldDiffId && oldDiffId === newDiffId;

  const oldId = getAttr(oldNode, 'id');
  const newId = getAttr(newNode, 'id');
  if (oldId || newId) return !!oldId && oldId === newId;

  const oldClass = getAttr(oldNode, 'class');
  const newClass = getAttr(newNode, 'class');
  if (oldClass || newClass) return oldClass === newClass;

  if (options.getNodeKey && oldNode.nodeType === 'element' && newNode.nodeType === 'element') {
    const oldKey = oldNode.attributes['data-hvd-node-id'] || null;
    const newKey = newNode.attributes['data-hvd-node-id'] || null;
    if (oldKey && newKey) return oldKey === newKey;
  }

  return getTextScore(oldNode, newNode) >= 0.55;
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

    if (nodesMatch(oldNode, newNode, options)) {
      pairs.push({ oldNode, newNode });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (newChildren[newIndex + 1] && nodesMatch(oldNode, newChildren[newIndex + 1], options)) {
      pairs.push({ newNode });
      newIndex += 1;
      continue;
    }

    if (oldChildren[oldIndex + 1] && nodesMatch(oldChildren[oldIndex + 1], newNode, options)) {
      pairs.push({ oldNode });
      oldIndex += 1;
      continue;
    }

    pairs.push({ oldNode, newNode });
    oldIndex += 1;
    newIndex += 1;
  }

  return pairs;
}
