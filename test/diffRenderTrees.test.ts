import { describe, expect, it } from 'vitest';
import { diffRenderTrees } from '../src/core/diff/diffRenderTrees';
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

describe('diffRenderTrees', () => {
  it('detects inserted, text, style, and size changes', () => {
    const oldRoot = node({
      id: 'root-old',
      tagName: 'body',
      children: [
        node({
          id: 'a',
          tagName: 'p',
          text: 'old text',
          styles: { color: 'rgb(0, 0, 0)' },
          rect: { x: 0, y: 0, width: 100, height: 20 }
        })
      ]
    });

    const newRoot = node({
      id: 'root-new',
      tagName: 'body',
      children: [
        node({
          id: 'b',
          tagName: 'p',
          text: 'new text',
          styles: { color: 'rgb(255, 0, 0)' },
          rect: { x: 0, y: 0, width: 130, height: 20 }
        }),
        node({
          id: 'c',
          tagName: 'div',
          text: 'added',
          rect: { x: 0, y: 30, width: 80, height: 20 }
        })
      ]
    });

    const result = diffRenderTrees(oldRoot, newRoot, { layoutThreshold: 2 });
    const types = result.changes.map((change) => change.type);

    expect(types).toContain('text-changed');
    expect(types).toContain('style-changed');
    expect(types).toContain('size-changed');
    expect(types).toContain('inserted');
  });
});
