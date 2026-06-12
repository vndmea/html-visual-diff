import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHtmlVisualDiff } from '../src';

describe('createHtmlVisualDiff', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('renders two panes without toolbar-like chrome', async () => {
    const viewer = await createHtmlVisualDiff({
      container: '#app',
      old: { html: '<article><h1>Old</h1><p>Hello</p></article>' },
      new: { html: '<article><h1>New</h1><p>Hello</p><p>Added</p></article>' }
    });

    expect(viewer.root.querySelector('.hvd-viewer')).toBeNull();
    expect(document.querySelector('.hvd-pane-old')).toBeTruthy();
    expect(document.querySelector('.hvd-pane-new')).toBeTruthy();
    expect(document.querySelector('.hvd-overlay')).toBeTruthy();
    expect(document.querySelector('.hvd-header')).toBeNull();
    expect(document.querySelector('.hvd-summary')).toBeNull();
    expect(document.querySelector('.hvd-change-list')).toBeNull();
  });

  it('syncs pane scrolling and removes listeners on destroy', async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    const viewer = await createHtmlVisualDiff({
      container: '#app',
      old: { html: '<div style="height:600px"><p>Old</p></div>' },
      new: { html: '<div style="height:600px"><p>New</p></div>' },
      options: { syncScroll: true, align: true }
    });

    const oldPane = document.querySelector<HTMLElement>('.hvd-pane-old')!;
    const newPane = document.querySelector<HTMLElement>('.hvd-pane-new')!;

    oldPane.scrollTop = 48;
    oldPane.dispatchEvent(new Event('scroll'));
    expect(newPane.scrollTop).toBe(48);
    expect(document.querySelectorAll('.hvd-highlight-changed, .hvd-highlight-inserted, .hvd-highlight-deleted').length).toBeGreaterThan(0);

    viewer.destroy();
    newPane.scrollTop = 0;
    oldPane.scrollTop = 96;
    oldPane.dispatchEvent(new Event('scroll'));
    expect(newPane.scrollTop).toBe(0);
  });
});
