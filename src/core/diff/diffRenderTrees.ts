import { pairChildren } from './matchRenderNodes';
import type { RenderDiffOptions, RenderDiffResult } from './types';
import type { RenderNode } from '../snapshot/types';

function stylesEqual(oldNode: RenderNode, newNode: RenderNode): boolean {
  const oldEntries = Object.entries(oldNode.styles);
  if (oldEntries.length !== Object.keys(newNode.styles).length) return false;
  return oldEntries.every(([key, value]) => newNode.styles[key] === value);
}

function exceedsThreshold(oldValue: number, newValue: number, threshold: number): boolean {
  return Math.abs(oldValue - newValue) > threshold;
}

function walkPairs(
  oldNode: RenderNode | undefined,
  newNode: RenderNode | undefined,
  options: Required<Pick<RenderDiffOptions, 'compareText' | 'compareStyle' | 'compareLayout' | 'layoutThreshold'>>,
  result: RenderDiffResult
): void {
  if (oldNode && !newNode) {
    result.changes.push({
      type: 'deleted',
      oldNodeId: oldNode.id,
      oldRect: oldNode.rect
    });
    result.pairs.push({ oldNode });
    return;
  }

  if (!oldNode && newNode) {
    result.changes.push({
      type: 'inserted',
      newNodeId: newNode.id,
      newRect: newNode.rect
    });
    result.pairs.push({ newNode });
    return;
  }

  if (!oldNode || !newNode) return;

  result.pairs.push({ oldNode, newNode });

  if (options.compareText && (oldNode.text || '') !== (newNode.text || '')) {
    result.changes.push({
      type: 'text-changed',
      oldNodeId: oldNode.id,
      newNodeId: newNode.id,
      oldRect: oldNode.rect,
      newRect: newNode.rect
    });
  }

  if (options.compareStyle && !stylesEqual(oldNode, newNode)) {
    result.changes.push({
      type: 'style-changed',
      oldNodeId: oldNode.id,
      newNodeId: newNode.id,
      oldRect: oldNode.rect,
      newRect: newNode.rect
    });
  }

  if (options.compareLayout) {
    const threshold = options.layoutThreshold;
    const sizeChanged = exceedsThreshold(oldNode.rect.width, newNode.rect.width, threshold)
      || exceedsThreshold(oldNode.rect.height, newNode.rect.height, threshold);
    const layoutChanged = exceedsThreshold(oldNode.rect.x, newNode.rect.x, threshold)
      || exceedsThreshold(oldNode.rect.y, newNode.rect.y, threshold);

    if (sizeChanged) {
      result.changes.push({
        type: 'size-changed',
        oldNodeId: oldNode.id,
        newNodeId: newNode.id,
        oldRect: oldNode.rect,
        newRect: newNode.rect
      });
    }

    if (layoutChanged) {
      result.changes.push({
        type: 'layout-changed',
        oldNodeId: oldNode.id,
        newNodeId: newNode.id,
        oldRect: oldNode.rect,
        newRect: newNode.rect
      });
    }
  }

  const childPairs = pairChildren(oldNode.children, newNode.children, options);
  for (const pair of childPairs) {
    walkPairs(pair.oldNode, pair.newNode, options, result);
  }
}

export function diffRenderTrees(
  oldRoot: RenderNode,
  newRoot: RenderNode,
  options: RenderDiffOptions = {}
): RenderDiffResult {
  const normalized = {
    compareText: options.compareText ?? true,
    compareStyle: options.compareStyle ?? true,
    compareLayout: options.compareLayout ?? true,
    layoutThreshold: options.layoutThreshold ?? 2
  };
  const result: RenderDiffResult = { changes: [], pairs: [] };
  walkPairs(oldRoot, newRoot, normalized, result);
  return result;
}
