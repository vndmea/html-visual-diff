import { pairChildren } from '../diff/matchRenderNodes';
import { isBlockNode } from './isBlockNode';
import type { RenderNode } from '../snapshot/types';

export interface AlignmentBlock {
  oldNodeId?: string;
  newNodeId?: string;
  oldParentNodeId?: string;
  newParentNodeId?: string;
  oldHeight?: number;
  newHeight?: number;
  spacerSide?: 'old' | 'new';
  spacerHeight?: number;
  beforeOldNodeId?: string;
  afterOldNodeId?: string;
  beforeNewNodeId?: string;
  afterNewNodeId?: string;
}

function isRootNode(node: RenderNode | undefined): boolean {
  return !!node && node.tagName === 'body';
}

function getRenderableElementChildren(node: RenderNode | undefined): RenderNode[] {
  return (node?.children || []).filter((child) => child.nodeType === 'element');
}

function getBlockChildren(node: RenderNode | undefined): RenderNode[] {
  return getRenderableElementChildren(node).filter((child) => isBlockNode(child));
}

function getParentNodeId(node: RenderNode | undefined): string | undefined {
  if (!node || isRootNode(node)) return undefined;
  return node.id;
}

function hasNestedBlockChildren(node: RenderNode | undefined): boolean {
  return getBlockChildren(node).length > 0;
}

function findNextNodeId<T extends { oldNode?: RenderNode; newNode?: RenderNode }>(
  pairs: T[],
  startIndex: number,
  side: 'oldNode' | 'newNode'
): string | undefined {
  for (let index = startIndex + 1; index < pairs.length; index += 1) {
    const candidate = pairs[index]?.[side];
    if (candidate) return candidate.id;
  }
  return undefined;
}

function appendAlignedBlockChildren(
  blocks: AlignmentBlock[],
  oldParent: RenderNode | undefined,
  newParent: RenderNode | undefined
): void {
  const oldChildren = getBlockChildren(oldParent);
  const newChildren = getBlockChildren(newParent);

  if (oldChildren.length === 0 && newChildren.length === 0) return;

  const pairs = pairChildren(oldChildren, newChildren);
  let previousOldNodeId: string | undefined;
  let previousNewNodeId: string | undefined;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const oldNode = isBlockNode(pair.oldNode) ? pair.oldNode : undefined;
    const newNode = isBlockNode(pair.newNode) ? pair.newNode : undefined;

    if (oldNode && newNode) {
      if (!hasNestedBlockChildren(oldNode) && !hasNestedBlockChildren(newNode)) {
        const oldHeight = oldNode.rect.height;
        const newHeight = newNode.rect.height;

        blocks.push({
          oldNodeId: oldNode.id,
          newNodeId: newNode.id,
          oldParentNodeId: getParentNodeId(oldParent),
          newParentNodeId: getParentNodeId(newParent),
          oldHeight,
          newHeight
        });
      }

      appendAlignmentBlocks(blocks, oldNode, newNode);
      previousOldNodeId = oldNode.id;
      previousNewNodeId = newNode.id;
      continue;
    }

    if (newNode) {
      blocks.push({
        oldParentNodeId: getParentNodeId(oldParent),
        newParentNodeId: getParentNodeId(newParent),
        newNodeId: newNode.id,
        newHeight: newNode.rect.height,
        spacerSide: 'old',
        spacerHeight: newNode.rect.height,
        beforeOldNodeId: findNextNodeId(pairs, index, 'oldNode'),
        afterOldNodeId: previousOldNodeId
      });
      previousNewNodeId = newNode.id;
      continue;
    }

    if (oldNode) {
      blocks.push({
        oldParentNodeId: getParentNodeId(oldParent),
        newParentNodeId: getParentNodeId(newParent),
        oldNodeId: oldNode.id,
        oldHeight: oldNode.rect.height,
        spacerSide: 'new',
        spacerHeight: oldNode.rect.height,
        beforeNewNodeId: findNextNodeId(pairs, index, 'newNode'),
        afterNewNodeId: previousNewNodeId
      });
      previousOldNodeId = oldNode.id;
    }
  }
}

function appendAlignmentBlocks(
  blocks: AlignmentBlock[],
  oldNode: RenderNode | undefined,
  newNode: RenderNode | undefined
): void {
  appendAlignedBlockChildren(blocks, oldNode, newNode);

  const oldElements = getRenderableElementChildren(oldNode);
  const newElements = getRenderableElementChildren(newNode);
  const hasBlockChildren = oldElements.some((child) => isBlockNode(child)) || newElements.some((child) => isBlockNode(child));
  if (hasBlockChildren) return;

  const pairs = pairChildren(oldElements, newElements);
  for (const pair of pairs) {
    const oldChild = pair.oldNode?.nodeType === 'element' ? pair.oldNode : undefined;
    const newChild = pair.newNode?.nodeType === 'element' ? pair.newNode : undefined;
    if (!oldChild && !newChild) continue;
    appendAlignmentBlocks(blocks, oldChild, newChild);
  }
}

export function createAlignmentBlocks(oldRoot: RenderNode, newRoot: RenderNode): AlignmentBlock[] {
  const blocks: AlignmentBlock[] = [];
  appendAlignmentBlocks(blocks, oldRoot, newRoot);
  return blocks;
}
