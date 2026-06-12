import { describe, expect, it } from 'vitest';
import { createAlignmentBlocks } from '../src/core/alignment/createAlignmentBlocks';
import type { RenderNode } from '../src/core/snapshot/types';

function node(partial: Partial<RenderNode> & Pick<RenderNode, 'id' | 'tagName'>): RenderNode {
  return {
    nodeType: 'element',
    text: '',
    attributes: {},
    styles: {},
    rect: { x: 0, y: 0, width: 0, height: 0 },
    children: [],
    path: '/',
    ...partial
  };
}

describe('createAlignmentBlocks', () => {
  it('adds spacer on the opposite side for inserted and deleted blocks', () => {
    const oldRoot = node({
      id: 'old-root',
      tagName: 'body',
      children: [
        node({ id: 'old-a', tagName: 'section', rect: { x: 0, y: 0, width: 100, height: 30 } })
      ]
    });

    const newRoot = node({
      id: 'new-root',
      tagName: 'body',
      children: [
        node({ id: 'new-a', tagName: 'section', rect: { x: 0, y: 0, width: 100, height: 30 } }),
        node({ id: 'new-b', tagName: 'div', rect: { x: 0, y: 40, width: 100, height: 60 } })
      ]
    });

    const blocks = createAlignmentBlocks(oldRoot, newRoot);
    expect(blocks.some((block) => block.spacerSide === 'old' && block.newNodeId === 'new-b')).toBe(true);
  });

  it('adds spacer to the shorter side when heights differ', () => {
    const oldRoot = node({
      id: 'old-root',
      tagName: 'body',
      children: [
        node({ id: 'old-a', tagName: 'section', rect: { x: 0, y: 0, width: 100, height: 30 } })
      ]
    });

    const newRoot = node({
      id: 'new-root',
      tagName: 'body',
      children: [
        node({ id: 'new-a', tagName: 'section', rect: { x: 0, y: 0, width: 100, height: 80 } })
      ]
    });

    const blocks = createAlignmentBlocks(oldRoot, newRoot);
    expect(blocks[0]?.spacerSide).toBe('old');
    expect(blocks[0]?.spacerHeight).toBe(50);
  });
});
