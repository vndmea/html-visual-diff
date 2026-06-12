import { pairChildren } from '../diff/matchRenderNodes';
import { isBlockNode } from './isBlockNode';
import type { RenderNode } from '../snapshot/types';

export interface AlignmentBlock {
  oldNodeId?: string;
  newNodeId?: string;
  oldHeight?: number;
  newHeight?: number;
  spacerSide?: 'old' | 'new';
  spacerHeight?: number;
}

function flattenBlockNodes(node: RenderNode): RenderNode[] {
  const blocks: RenderNode[] = [];
  for (const child of node.children) {
    if (isBlockNode(child)) {
      blocks.push(child);
      continue;
    }
    blocks.push(...flattenBlockNodes(child));
  }
  return blocks;
}

export function createAlignmentBlocks(oldRoot: RenderNode, newRoot: RenderNode): AlignmentBlock[] {
  const blocks: AlignmentBlock[] = [];
  const pairs = pairChildren(flattenBlockNodes(oldRoot), flattenBlockNodes(newRoot));

  for (const pair of pairs) {
    const oldNode = isBlockNode(pair.oldNode) ? pair.oldNode : undefined;
    const newNode = isBlockNode(pair.newNode) ? pair.newNode : undefined;

    if (!oldNode && !newNode) continue;

    if (!oldNode && newNode) {
      blocks.push({
        newNodeId: newNode.id,
        newHeight: newNode.rect.height,
        spacerSide: 'old',
        spacerHeight: newNode.rect.height
      });
      continue;
    }

    if (oldNode && !newNode) {
      blocks.push({
        oldNodeId: oldNode.id,
        oldHeight: oldNode.rect.height,
        spacerSide: 'new',
        spacerHeight: oldNode.rect.height
      });
      continue;
    }

    const oldHeight = oldNode?.rect.height || 0;
    const newHeight = newNode?.rect.height || 0;
    const diff = Math.abs(oldHeight - newHeight);

    blocks.push({
      oldNodeId: oldNode?.id,
      newNodeId: newNode?.id,
      oldHeight,
      newHeight,
      spacerSide: diff > 0 ? (oldHeight < newHeight ? 'old' : 'new') : undefined,
      spacerHeight: diff > 0 ? diff : undefined
    });
  }

  return blocks;
}
