import { collectRenderNode } from './collectRenderNode';
import type { RenderSnapshot } from './types';

export function createRenderSnapshot(root: HTMLElement): RenderSnapshot {
  const snapshot = collectRenderNode(root, '/body', { seq: 0 });
  if (!snapshot) {
    throw new Error('[html-visual-diff] failed to collect render snapshot');
  }
  return { root: snapshot };
}
