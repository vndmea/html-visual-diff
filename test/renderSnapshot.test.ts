import { describe, expect, it } from 'vitest';
import { createRenderSnapshot } from '../src/core/snapshot/createRenderSnapshot';

describe('createRenderSnapshot', () => {
  it('collects rects and computed styles while filtering hidden nodes', () => {
    document.body.innerHTML = `
      <style>
        .hidden { display: none; }
        .visible { color: rgb(255, 0, 0); }
      </style>
      <div class="hidden">Hidden</div>
      <div class="visible">Visible</div>
    `;

    const visible = document.querySelector('.visible') as HTMLElement;
    const hidden = document.querySelector('.hidden') as HTMLElement;

    visible.getBoundingClientRect = () => ({
      x: 10,
      y: 20,
      width: 120,
      height: 40,
      top: 20,
      right: 130,
      bottom: 60,
      left: 10,
      toJSON: () => ({})
    } as DOMRect);

    hidden.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({})
    } as DOMRect);

    const snapshot = createRenderSnapshot(document.body);
    const ids = snapshot.root.children.map((node) => node.tagName);
    expect(ids).not.toContain('style');
    expect(snapshot.root.children.some((node) => node.text === 'Visible')).toBe(true);

    const visibleNode = snapshot.root.children.find((node) => node.text === 'Visible');
    expect(visibleNode?.rect.width).toBe(120);
    expect(visibleNode?.styles.color).toBe('rgb(255, 0, 0)');
  });
});
