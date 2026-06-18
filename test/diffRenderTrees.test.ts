import { describe, expect, it } from 'vitest';
import { diffRenderTrees } from '../src/core/diff/diffRenderTrees';
import { pairChildren } from '../src/core/diff/matchRenderNodes';
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

function textNode(id: string, text: string): RenderNode {
  return {
    id,
    tagName: '#text',
    nodeType: 'text',
    text,
    textAnchorId: `${id}-text`,
    attributes: {},
    styles: {},
    rect: { x: 0, y: 0, width: 0, height: 0 },
    children: [],
    path: '/'
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
          rect: { x: 0, y: 0, width: 100, height: 20 },
          children: [textNode('a-text', 'old text')]
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
          rect: { x: 0, y: 0, width: 130, height: 20 },
          children: [textNode('b-text', 'new text')]
        }),
        node({
          id: 'c',
          tagName: 'div',
          text: 'added',
          rect: { x: 0, y: 30, width: 80, height: 20 },
          children: [textNode('c-text', 'added')]
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

  it('prefers the best local candidate when similar siblings are shifted by an insertion', () => {
    const oldChildren = [
      node({ id: 'old-1', tagName: 'section', text: 'Alpha card', attributes: { class: 'card primary' } }),
      node({ id: 'old-2', tagName: 'section', text: 'Beta card', attributes: { class: 'card secondary' } })
    ];

    const newChildren = [
      node({ id: 'new-x', tagName: 'section', text: 'Inserted card', attributes: { class: 'card tertiary' } }),
      node({ id: 'new-1', tagName: 'section', text: 'Alpha card updated', attributes: { class: 'card primary' } }),
      node({ id: 'new-2', tagName: 'section', text: 'Beta card', attributes: { class: 'card secondary' } })
    ];

    const pairs = pairChildren(oldChildren, newChildren);
    expect(pairs[0]?.newNode?.id).toBe('new-x');
    expect(pairs[1]?.oldNode?.id).toBe('old-1');
    expect(pairs[1]?.newNode?.id).toBe('new-1');
    expect(pairs[2]?.oldNode?.id).toBe('old-2');
    expect(pairs[2]?.newNode?.id).toBe('new-2');
  });

  it('prefers xml-diff-kit structural ids over sibling position when keyed nodes shift', () => {
    const oldChildren = [
      node({
        id: 'old-1',
        tagName: 'section',
        text: 'Card',
        attributes: {
          'data-diff-id': '/#document-fragment[0]/section[0]/article{data-testid=alpha}',
          'data-hvd-struct-key': 'data-testid=alpha'
        }
      }),
      node({
        id: 'old-2',
        tagName: 'section',
        text: 'Card',
        attributes: {
          'data-diff-id': '/#document-fragment[0]/section[0]/article{data-testid=beta}',
          'data-hvd-struct-key': 'data-testid=beta'
        }
      })
    ];

    const newChildren = [
      node({
        id: 'new-x',
        tagName: 'section',
        text: 'Card',
        attributes: {
          'data-diff-id': '/#document-fragment[0]/section[0]/article{data-testid=inserted}',
          'data-hvd-struct-key': 'data-testid=inserted'
        }
      }),
      node({
        id: 'new-1',
        tagName: 'section',
        text: 'Card updated',
        attributes: {
          'data-diff-id': '/#document-fragment[0]/section[0]/article{data-testid=alpha}',
          'data-hvd-struct-key': 'data-testid=alpha'
        }
      }),
      node({
        id: 'new-2',
        tagName: 'section',
        text: 'Card',
        attributes: {
          'data-diff-id': '/#document-fragment[0]/section[0]/article{data-testid=beta}',
          'data-hvd-struct-key': 'data-testid=beta'
        }
      })
    ];

    const pairs = pairChildren(oldChildren, newChildren);
    expect(pairs[0]?.newNode?.id).toBe('new-x');
    expect(pairs[1]?.oldNode?.id).toBe('old-1');
    expect(pairs[1]?.newNode?.id).toBe('new-1');
    expect(pairs[2]?.oldNode?.id).toBe('old-2');
    expect(pairs[2]?.newNode?.id).toBe('new-2');
  });

  it('prefers matching section blocks by shared id when a new sibling is inserted', () => {
    const oldChildren = [
      node({
        id: 'old-overview',
        tagName: 'section',
        text: 'Overview Shipment planning is on track',
        attributes: {
          id: 'overview',
          class: 'chunk',
          'data-hvd-struct-key': 'id=overview'
        }
      }),
      node({
        id: 'old-operations',
        tagName: 'section',
        text: 'Operations Warehouse intake labeling and lane balancing',
        attributes: {
          id: 'operations',
          class: 'chunk',
          'data-hvd-struct-key': 'id=operations'
        }
      }),
      node({
        id: 'old-risks',
        tagName: 'section',
        text: 'Risks Vendor approvals pending',
        attributes: {
          id: 'risks',
          class: 'chunk',
          'data-hvd-struct-key': 'id=risks'
        }
      })
    ];

    const newChildren = [
      node({
        id: 'new-overview',
        tagName: 'section',
        text: 'Overview Shipment planning is on track with coastal priority',
        attributes: {
          id: 'overview',
          class: 'chunk',
          'data-hvd-struct-key': 'id=overview'
        }
      }),
      node({
        id: 'new-escalation',
        tagName: 'section',
        text: 'New Escalation Temporary carrier capacity dip and manual checkpoint',
        attributes: {
          id: 'new-escalation',
          class: 'chunk notice',
          'data-hvd-struct-key': 'id=new-escalation'
        }
      }),
      node({
        id: 'new-operations',
        tagName: 'section',
        text: 'Operations Warehouse intake labeling lane balancing and late arrivals',
        attributes: {
          id: 'operations',
          class: 'chunk',
          'data-hvd-struct-key': 'id=operations'
        }
      }),
      node({
        id: 'new-risks',
        tagName: 'section',
        text: 'Risks Vendor approvals pending plus customs revalidation',
        attributes: {
          id: 'risks',
          class: 'chunk',
          'data-hvd-struct-key': 'id=risks'
        }
      })
    ];

    const pairs = pairChildren(oldChildren, newChildren);
    expect(pairs[0]?.oldNode?.id).toBe('old-overview');
    expect(pairs[0]?.newNode?.id).toBe('new-overview');
    expect(pairs[1]?.newNode?.id).toBe('new-escalation');
    expect(pairs[2]?.oldNode?.id).toBe('old-operations');
    expect(pairs[2]?.newNode?.id).toBe('new-operations');
    expect(pairs[3]?.oldNode?.id).toBe('old-risks');
    expect(pairs[3]?.newNode?.id).toBe('new-risks');
  });

  it('does not treat positional structural paths as hard identity when an unkeyed block is inserted', () => {
    const oldChildren = [
      node({
        id: 'old-overview',
        tagName: 'section',
        text: 'Overview Shipment planning is on track',
        attributes: {
          class: 'chunk',
          'data-diff-id': '/#document-fragment[0]/main[0]/section[0]'
        }
      }),
      node({
        id: 'old-operations',
        tagName: 'section',
        text: 'Operations Warehouse intake labeling and lane balancing',
        attributes: {
          class: 'chunk',
          'data-diff-id': '/#document-fragment[0]/main[0]/section[1]'
        }
      }),
      node({
        id: 'old-risks',
        tagName: 'section',
        text: 'Risks Vendor approvals pending',
        attributes: {
          class: 'chunk',
          'data-diff-id': '/#document-fragment[0]/main[0]/section[2]'
        }
      })
    ];

    const newChildren = [
      node({
        id: 'new-overview',
        tagName: 'section',
        text: 'Overview Shipment planning is on track with coastal priority',
        attributes: {
          class: 'chunk',
          'data-diff-id': '/#document-fragment[0]/main[0]/section[0]'
        }
      }),
      node({
        id: 'new-escalation',
        tagName: 'section',
        text: 'New Escalation Temporary carrier capacity dip and manual checkpoint',
        attributes: {
          class: 'chunk notice',
          'data-diff-id': '/#document-fragment[0]/main[0]/section[1]'
        }
      }),
      node({
        id: 'new-operations',
        tagName: 'section',
        text: 'Operations Warehouse intake labeling lane balancing and late arrivals',
        attributes: {
          class: 'chunk',
          'data-diff-id': '/#document-fragment[0]/main[0]/section[2]'
        }
      }),
      node({
        id: 'new-risks',
        tagName: 'section',
        text: 'Risks Vendor approvals pending plus customs revalidation',
        attributes: {
          class: 'chunk',
          'data-diff-id': '/#document-fragment[0]/main[0]/section[3]'
        }
      })
    ];

    const pairs = pairChildren(oldChildren, newChildren);
    expect(pairs[0]?.oldNode?.id).toBe('old-overview');
    expect(pairs[0]?.newNode?.id).toBe('new-overview');
    expect(pairs[1]?.newNode?.id).toBe('new-escalation');
    expect(pairs[2]?.oldNode?.id).toBe('old-operations');
    expect(pairs[2]?.newNode?.id).toBe('new-operations');
    expect(pairs[3]?.oldNode?.id).toBe('old-risks');
    expect(pairs[3]?.newNode?.id).toBe('new-risks');
  });

  it('captures narrowed text change segments instead of treating the whole string as changed', () => {
    const oldRoot = node({
      id: 'root-old',
      tagName: 'body',
      children: [
        node({
          id: 'text-old',
          tagName: 'p',
          text: 'Hello old world',
          children: [textNode('text-old-leaf', 'Hello old world')]
        })
      ]
    });

    const newRoot = node({
      id: 'root-new',
      tagName: 'body',
      children: [
        node({
          id: 'text-new',
          tagName: 'p',
          text: 'Hello new world',
          children: [textNode('text-new-leaf', 'Hello new world')]
        })
      ]
    });

    const result = diffRenderTrees(oldRoot, newRoot);
    const textChange = result.changes.find((change) => change.type === 'text-changed');
    expect(textChange?.oldTextSegments?.[0]).toEqual({ start: 6, end: 9 });
    expect(textChange?.newTextSegments?.[0]).toEqual({ start: 6, end: 9 });
  });

  it('captures multiple separated text change segments', () => {
    const oldRoot = node({
      id: 'root-old',
      tagName: 'body',
      children: [
        node({
          id: 'text-old',
          tagName: 'p',
          text: 'abcXdefYghi',
          children: [textNode('text-old-leaf', 'abcXdefYghi')]
        })
      ]
    });

    const newRoot = node({
      id: 'root-new',
      tagName: 'body',
      children: [
        node({
          id: 'text-new',
          tagName: 'p',
          text: 'abcMdefNghi',
          children: [textNode('text-new-leaf', 'abcMdefNghi')]
        })
      ]
    });

    const result = diffRenderTrees(oldRoot, newRoot);
    const textChange = result.changes.find((change) => change.type === 'text-changed');

    expect(textChange?.oldTextSegments).toEqual([
      { start: 3, end: 4 },
      { start: 7, end: 8 }
    ]);
    expect(textChange?.newTextSegments).toEqual([
      { start: 3, end: 4 },
      { start: 7, end: 8 }
    ]);
  });

  it('uses word-oriented segments for English phrase changes', () => {
    const oldRoot = node({
      id: 'root-old',
      tagName: 'body',
      children: [
        node({
          id: 'text-old',
          tagName: 'p',
          text: 'The quick brown fox',
          children: [textNode('text-old-leaf', 'The quick brown fox')]
        })
      ]
    });

    const newRoot = node({
      id: 'root-new',
      tagName: 'body',
      children: [
        node({
          id: 'text-new',
          tagName: 'p',
          text: 'The slow brown fox',
          children: [textNode('text-new-leaf', 'The slow brown fox')]
        })
      ]
    });

    const result = diffRenderTrees(oldRoot, newRoot);
    const textChange = result.changes.find((change) => change.type === 'text-changed');
    expect(textChange?.oldTextSegments).toEqual([{ start: 4, end: 9 }]);
    expect(textChange?.newTextSegments).toEqual([{ start: 4, end: 8 }]);
  });
});
