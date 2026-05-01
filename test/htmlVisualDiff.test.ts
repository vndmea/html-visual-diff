import { describe, expect, it } from 'vitest';
import { HtmlVisualDiffViewer, createHtmlVisualDiffViewer } from '../src';

describe('HtmlVisualDiffViewer', () => {
  it('renders side-by-side diff view', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const viewer = new HtmlVisualDiffViewer({el:'#app',oldHtml:'<article><h1>Old</h1><p>Hello</p></article>',newHtml:'<article><h1>New</h1><p>Hello</p><p>Added</p></article>'});
    expect(viewer.root.querySelector('.hvd-old-pane')).toBeTruthy();
    expect(viewer.root.querySelector('.hvd-new-pane')).toBeTruthy();
    expect(viewer.changes.length).toBeGreaterThan(0);
  });

  it('factory returns an api', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const api = createHtmlVisualDiffViewer({el:'#app',oldHtml:'<p>A</p>',newHtml:'<p>B</p>'});
    expect(api.root).toBeInstanceOf(HTMLElement);
    expect(api.changes.some((item) => item.type === 'modify')).toBe(true);
  });

  it('can hide placeholders', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const api = createHtmlVisualDiffViewer({el:'#app',oldHtml:'<p>A</p>',newHtml:'<p>A</p><p>B</p>',theme:{showPlaceholders:false}});
    const placeholder = api.root.querySelector<HTMLElement>('.hvd-placeholder');
    expect(placeholder?.style.display).toBe('none');
  });

  it('ignores configured attributes', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const api = createHtmlVisualDiffViewer({el:'#app',oldHtml:'<p data-temp="1">A</p>',newHtml:'<p data-temp="2">A</p>',ignoreAttributes:['data-temp']});
    expect(api.changes.some((item) => item.label.includes('属性'))).toBe(false);
  });
});
