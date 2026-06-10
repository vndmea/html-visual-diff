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

  describe('Word-level text diff', () => {
    it('uses word-level granularity by default', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const api = createHtmlVisualDiffViewer({
        el: '#app',
        oldHtml: '<p>The quick brown fox</p>',
        newHtml: '<p>The slow brown fox</p>',
        inlineTextDiff: true
      });
      const oldPane = api.oldPane.textContent;
      const newPane = api.newPane.textContent;
      expect(oldPane).toContain('quick');
      expect(newPane).toContain('slow');
    });

    it('preserves whitespace in word-level diff', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const api = createHtmlVisualDiffViewer({
        el: '#app',
        oldHtml: '<p>Hello world</p>',
        newHtml: '<p>Hello beautiful world</p>',
        inlineTextDiff: true,
        textDiffGranularity: 'word'
      });
      const changeSpans = api.newPane.querySelectorAll('.hvd-inline-insert');
      expect(changeSpans.length).toBeGreaterThan(0);
    });

    it('merges adjacent inline diff spans into one span', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const api = createHtmlVisualDiffViewer({
        el: '#app',
        oldHtml: '<p>Hello world</p>',
        newHtml: '<p>Hello wonderful beautiful world</p>',
        inlineTextDiff: true,
        textDiffGranularity: 'word'
      });
      const changeSpans = api.newPane.querySelectorAll('.hvd-inline-insert');
      expect(changeSpans.length).toBe(1);
      expect(changeSpans[0]?.textContent).toContain('wonderful beautiful');
    });

    it('can switch to char-level granularity', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const api = createHtmlVisualDiffViewer({
        el: '#app',
        oldHtml: '<p>Hello</p>',
        newHtml: '<p>Hallo</p>',
        inlineTextDiff: true,
        textDiffGranularity: 'char'
      });
      const changeSpans = api.newPane.querySelectorAll('.hvd-inline-insert, .hvd-inline-delete');
      expect(changeSpans.length).toBeGreaterThan(0);
    });

    it('handles Chinese text with word-level diff', () => {
      document.body.innerHTML = '<div id="app"></div>';
      const api = createHtmlVisualDiffViewer({
        el: '#app',
        oldHtml: '<p>这是一个测试</p>',
        newHtml: '<p>这是一个新的测试</p>',
        inlineTextDiff: true,
        textDiffGranularity: 'word'
      });
      const changes = api.changes.filter(c => c.type === 'modify');
      expect(changes.length).toBeGreaterThan(0);
    });
  });
});
