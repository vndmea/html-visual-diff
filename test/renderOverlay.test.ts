import { describe, expect, it } from 'vitest';
import { drawOverlay } from '../src/viewer/renderOverlay';
import type { RenderChange } from '../src/core/diff/types';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({})
  } as DOMRect;
}

describe('drawOverlay', () => {
  it('deduplicates repeated changes on the same node using the strongest change type', () => {
    document.body.innerHTML = `
      <div id="content">
        <div data-hvd-node-id="node-1">A</div>
      </div>
      <div id="overlay"></div>
    `;

    const content = document.querySelector<HTMLElement>('#content')!;
    const overlay = document.querySelector<HTMLElement>('#overlay')!;
    const target = content.querySelector<HTMLElement>('[data-hvd-node-id="node-1"]')!;

    overlay.getBoundingClientRect = () => rect(0, 0, 200, 200);
    target.getBoundingClientRect = () => rect(10, 20, 100, 30);

    const changes: RenderChange[] = [
      { type: 'text-changed', newNodeId: 'node-1' },
      { type: 'style-changed', newNodeId: 'node-1' },
      { type: 'inserted', newNodeId: 'node-1' }
    ];

    drawOverlay(overlay, content, changes, 'new');

    const boxes = overlay.querySelectorAll('div');
    expect(boxes).toHaveLength(1);
    expect(boxes[0]?.className).toBe('hvd-highlight-inserted');
  });

  it('uses text anchors for changed text highlights when available', () => {
    document.body.innerHTML = `
      <div id="content">
        <div data-hvd-node-id="node-2">
          <span data-hvd-text-node-id="node-2-text">Hello world</span>
        </div>
      </div>
      <div id="overlay"></div>
    `;

    const content = document.querySelector<HTMLElement>('#content')!;
    const overlay = document.querySelector<HTMLElement>('#overlay')!;
    const textTarget = content.querySelector<HTMLElement>('[data-hvd-text-node-id="node-2-text"]')!;

    overlay.getBoundingClientRect = () => rect(0, 0, 200, 200);
    textTarget.getBoundingClientRect = () => rect(30, 40, 60, 18);

    const changes: RenderChange[] = [
      {
        type: 'text-changed',
        newNodeId: 'node-2',
        newTextSegments: [{ start: 0, end: 5 }]
      }
    ];

    drawOverlay(overlay, content, changes, 'new');

    const box = overlay.querySelector('div') as HTMLDivElement;
    expect(box).toBeTruthy();
    expect(box.className).toBe('hvd-highlight-inserted');
    expect(box.style.left).toBe('30px');
    expect(box.style.width).toBe('60px');
    expect(box.style.height).toBe('18px');
  });

  it('renders multiple highlight boxes for multiline text anchors', () => {
    document.body.innerHTML = `
      <div id="content">
        <div data-hvd-node-id="node-3">
          <span data-hvd-text-node-id="node-3-text">Wrapped text</span>
        </div>
      </div>
      <div id="overlay"></div>
    `;

    const content = document.querySelector<HTMLElement>('#content')!;
    const overlay = document.querySelector<HTMLElement>('#overlay')!;
    const textTarget = content.querySelector<HTMLElement>('[data-hvd-text-node-id="node-3-text"]')!;

    overlay.getBoundingClientRect = () => rect(0, 0, 200, 200);
    const originalCreateRange = document.createRange.bind(document);
    document.createRange = () => ({
      ...originalCreateRange(),
      selectNodeContents: () => undefined,
      getClientRects: () => [
        rect(10, 20, 80, 16),
        rect(10, 40, 44, 16)
      ] as unknown as DOMRectList
    }) as Range;

    const changes: RenderChange[] = [
      {
        type: 'text-changed',
        newNodeId: 'node-3',
        newTextSegments: [{ start: 0, end: 12 }]
      }
    ];

    drawOverlay(overlay, content, changes, 'new');

    const boxes = overlay.querySelectorAll('div');
    expect(boxes).toHaveLength(2);
    expect((boxes[0] as HTMLDivElement).style.top).toBe('20px');
    expect((boxes[1] as HTMLDivElement).style.top).toBe('40px');

    document.createRange = originalCreateRange;
    void textTarget;
  });

  it('highlights only the changed text subrange when segment data is provided', () => {
    document.body.innerHTML = `
      <div id="content">
        <div data-hvd-node-id="node-4">
          <span data-hvd-text-node-id="node-4-text">Hello brave world</span>
        </div>
      </div>
      <div id="overlay"></div>
    `;

    const content = document.querySelector<HTMLElement>('#content')!;
    const overlay = document.querySelector<HTMLElement>('#overlay')!;
    const originalCreateRange = document.createRange.bind(document);
    overlay.getBoundingClientRect = () => rect(0, 0, 200, 200);

    let recordedStart = -1;
    let recordedEnd = -1;
    document.createRange = () => ({
      ...originalCreateRange(),
      setStart: (_node: Node, offset: number) => {
        recordedStart = offset;
      },
      setEnd: (_node: Node, offset: number) => {
        recordedEnd = offset;
      },
      getClientRects: () => [rect(48, 12, 40, 16)] as unknown as DOMRectList
    }) as Range;

    const changes: RenderChange[] = [
      {
        type: 'text-changed',
        newNodeId: 'node-4',
        newTextSegments: [{ start: 6, end: 11 }]
      }
    ];

    drawOverlay(overlay, content, changes, 'new');

    const box = overlay.querySelector('div') as HTMLDivElement;
    expect(box.style.left).toBe('48px');
    expect(box.className).toBe('hvd-highlight-inserted');
    expect(recordedStart).toBe(6);
    expect(recordedEnd).toBe(11);

    document.createRange = originalCreateRange;
  });

  it('does not draw whole-block overlays for style-only changes', () => {
    document.body.innerHTML = `
      <div id="content">
        <div data-hvd-node-id="node-5">A</div>
      </div>
      <div id="overlay"></div>
    `;

    const content = document.querySelector<HTMLElement>('#content')!;
    const overlay = document.querySelector<HTMLElement>('#overlay')!;
    overlay.getBoundingClientRect = () => rect(0, 0, 200, 200);

    const changes: RenderChange[] = [
      { type: 'style-changed', newNodeId: 'node-5' },
      { type: 'layout-changed', newNodeId: 'node-5' }
    ];

    drawOverlay(overlay, content, changes, 'new');
    expect(overlay.querySelectorAll('div')).toHaveLength(0);
  });

  it('uses descendant text anchors instead of the whole container for inserted blocks', () => {
    document.body.innerHTML = `
      <div id="content">
        <section data-hvd-node-id="node-6">
          <h2><span data-hvd-text-node-id="title-6-text">New Escalation</span></h2>
          <p><span data-hvd-text-node-id="body-6-text">Added paragraph</span></p>
        </section>
      </div>
      <div id="overlay"></div>
    `;

    const content = document.querySelector<HTMLElement>('#content')!;
    const overlay = document.querySelector<HTMLElement>('#overlay')!;
    const textAnchors = content.querySelectorAll<HTMLElement>('[data-hvd-text-node-id]');

    overlay.getBoundingClientRect = () => rect(0, 0, 400, 300);
    (textAnchors[0] as HTMLElement).getBoundingClientRect = () => rect(20, 16, 120, 18);
    (textAnchors[1] as HTMLElement).getBoundingClientRect = () => rect(20, 46, 140, 18);

    const changes: RenderChange[] = [
      { type: 'inserted', newNodeId: 'node-6' }
    ];

    drawOverlay(overlay, content, changes, 'new');

    const boxes = overlay.querySelectorAll('div');
    expect(boxes).toHaveLength(2);
    expect((boxes[0] as HTMLDivElement).style.left).toBe('20px');
    expect((boxes[1] as HTMLDivElement).style.top).toBe('46px');
  });
});
