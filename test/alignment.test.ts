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
    expect(blocks.find((block) => block.newNodeId === 'new-b')?.beforeOldNodeId).toBeUndefined();
    expect(blocks.find((block) => block.newNodeId === 'new-b')?.afterOldNodeId).toBe('old-a');
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
    expect(blocks[0]?.spacerSide).toBeUndefined();
    expect(blocks[0]?.spacerHeight).toBeUndefined();
    expect(blocks[0]?.oldHeight).toBe(30);
    expect(blocks[0]?.newHeight).toBe(80);
    expect(blocks[0]?.oldParentNodeId).toBeUndefined();
  });

  it('keeps block pairing scoped by parent path when nested groups differ', () => {
    const oldRoot = node({
      id: 'old-root',
      tagName: 'body',
      children: [
        node({
          id: 'wrapper-old',
          tagName: 'div',
          path: '/body/wrapper-old',
          children: [
            node({ id: 'old-a', tagName: 'section', path: '/body/wrapper-old/section[0]', rect: { x: 0, y: 0, width: 100, height: 40 } })
          ]
        }),
        node({
          id: 'footer-old',
          tagName: 'div',
          path: '/body/footer-old',
          children: [
            node({ id: 'old-b', tagName: 'section', path: '/body/footer-old/section[0]', rect: { x: 0, y: 50, width: 100, height: 20 } })
          ]
        })
      ]
    });

    const newRoot = node({
      id: 'new-root',
      tagName: 'body',
      children: [
        node({
          id: 'wrapper-new',
          tagName: 'div',
          path: '/body/wrapper-old',
          children: [
            node({ id: 'new-a', tagName: 'section', path: '/body/wrapper-old/section[0]', rect: { x: 0, y: 0, width: 100, height: 60 } })
          ]
        }),
        node({
          id: 'footer-new',
          tagName: 'div',
          path: '/body/footer-old',
          children: [
            node({ id: 'new-b', tagName: 'section', path: '/body/footer-old/section[0]', rect: { x: 0, y: 70, width: 100, height: 20 } })
          ]
        })
      ]
    });

    const blocks = createAlignmentBlocks(oldRoot, newRoot);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.oldNodeId).toBe('old-a');
    expect(blocks[0]?.newNodeId).toBe('new-a');
    expect(blocks[1]?.oldNodeId).toBe('old-b');
    expect(blocks[1]?.newNodeId).toBe('new-b');
    expect(blocks[0]?.oldParentNodeId).toBe('wrapper-old');
    expect(blocks[1]?.oldParentNodeId).toBe('footer-old');
  });

  it('treats section cards with heading and paragraph children as a single alignment block', () => {
    const oldRoot = node({
      id: 'old-root',
      tagName: 'body',
      children: [
        node({
          id: 'old-card',
          tagName: 'section',
          rect: { x: 0, y: 0, width: 100, height: 80 },
          children: [
            node({ id: 'old-title', tagName: 'h2', rect: { x: 0, y: 0, width: 100, height: 20 } }),
            node({ id: 'old-text', tagName: 'p', rect: { x: 0, y: 28, width: 100, height: 36 } })
          ]
        })
      ]
    });

    const newRoot = node({
      id: 'new-root',
      tagName: 'body',
      children: [
        node({
          id: 'new-card',
          tagName: 'section',
          rect: { x: 0, y: 0, width: 100, height: 140 },
          children: [
            node({ id: 'new-title', tagName: 'h2', rect: { x: 0, y: 0, width: 100, height: 20 } }),
            node({ id: 'new-text-a', tagName: 'p', rect: { x: 0, y: 28, width: 100, height: 36 } }),
            node({ id: 'new-text-b', tagName: 'p', rect: { x: 0, y: 72, width: 100, height: 52 } })
          ]
        })
      ]
    });

    const blocks = createAlignmentBlocks(oldRoot, newRoot);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.oldNodeId).toBe('old-card');
    expect(blocks[0]?.newNodeId).toBe('new-card');
    expect(blocks[0]?.spacerSide).toBeUndefined();
    expect(blocks[0]?.oldHeight).toBe(80);
    expect(blocks[0]?.newHeight).toBe(140);
  });
});
