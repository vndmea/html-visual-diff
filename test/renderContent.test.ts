import { describe, expect, it } from 'vitest';
import { renderContent } from '../src/viewer/renderContent';
import type { RenderNode } from '../src/core/snapshot/types';

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

describe('renderContent', () => {
  it('wraps snapshot text nodes with text anchor spans', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.querySelector<HTMLElement>('#host')!;
    const doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = '<p>Hello world</p>';

    const snapshot: RenderNode = {
      id: 'root',
      tagName: 'body',
      nodeType: 'element',
      text: 'Hello world',
      attributes: {},
      styles: {},
      rect: { x: 0, y: 0, width: 0, height: 0 },
      path: '/body',
      children: [
        {
          id: 'p-1',
          tagName: 'p',
          nodeType: 'element',
          text: 'Hello world',
          attributes: {},
          styles: {},
          rect: { x: 0, y: 0, width: 0, height: 0 },
          path: '/body/p[0]',
          children: [textNode('text-1', 'Hello world')]
        }
      ]
    };

    const root = renderContent(host, doc.body as HTMLBodyElement, undefined, snapshot);
    const anchor = root.querySelector('[data-hvd-text-node-id="text-1-text"]');
    expect(anchor).toBeTruthy();
    expect(anchor?.textContent).toBe('Hello world');
  });
});
