import { describe, expect, it, vi } from 'vitest';
import { renderSandbox } from '../src/core/render/renderSandbox';

describe('renderSandbox', () => {
  it('injects html and css into an offscreen document', async () => {
    const sandbox = await renderSandbox({
      html: '<div class="box">Hello</div>',
      css: '.box { color: rgb(255, 0, 0); }'
    });

    try {
      const el = sandbox.document.querySelector('.box');
      expect(el?.textContent).toBe('Hello');
      expect(sandbox.document.querySelector('style')?.textContent).toContain('margin:0');
    } finally {
      sandbox.dispose();
    }
  });

  it('does not execute input scripts', async () => {
    (window as typeof window & { __hvdExecuted?: number }).__hvdExecuted = 0;
    const sandbox = await renderSandbox({
      html: '<script>window.__hvdExecuted = 1</script><div>Safe</div>'
    });

    try {
      expect((window as typeof window & { __hvdExecuted?: number }).__hvdExecuted).toBe(0);
      expect(sandbox.document.querySelector('script')).toBeNull();
      expect(sandbox.document.body.textContent).toContain('Safe');
    } finally {
      sandbox.dispose();
    }
  });

  it('resolves relative resources with baseUrl and removes unsafe attributes', async () => {
    const sandbox = await renderSandbox({
      baseUrl: 'https://example.com/docs/',
      html: `
        <a class="link" href="./guide/start.html" onclick="alert('x')">Guide</a>
        <img class="image" src="./images/card.png" onerror="alert('x')" />
        <iframe srcdoc="<script>alert('x')</script>"></iframe>
      `
    });

    try {
      const link = sandbox.document.querySelector<HTMLAnchorElement>('.link');
      const image = sandbox.document.querySelector<HTMLImageElement>('.image');
      const iframe = sandbox.document.querySelector('iframe');

      expect(link?.getAttribute('href')).toBe('https://example.com/docs/guide/start.html');
      expect(link?.hasAttribute('onclick')).toBe(false);
      expect(image?.getAttribute('src')).toBe('https://example.com/docs/images/card.png');
      expect(image?.hasAttribute('onerror')).toBe(false);
      expect(iframe?.hasAttribute('srcdoc')).toBe(false);
    } finally {
      sandbox.dispose();
    }
  });

  it('removes javascript urls from href and src', async () => {
    const sandbox = await renderSandbox({
      html: `
        <a class="bad-link" href="javascript:alert('x')">Bad link</a>
        <img class="bad-image" src="javascript:alert('x')" />
      `
    });

    try {
      const link = sandbox.document.querySelector('.bad-link');
      const image = sandbox.document.querySelector('.bad-image');

      expect(link?.hasAttribute('href')).toBe(false);
      expect(image?.hasAttribute('src')).toBe(false);
    } finally {
      sandbox.dispose();
    }
  });

  it('waits for linked stylesheets to finish loading', async () => {
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      const appended = originalAppendChild(node);
      if (node instanceof HTMLIFrameElement && node.contentDocument) {
        const originalWrite = node.contentDocument.write.bind(node.contentDocument);
        node.contentDocument.write = ((markup: string) => {
          originalWrite(markup);
          const link = node.contentDocument?.querySelector('link[rel="stylesheet"]');
          if (link) {
            setTimeout(() => {
              link.dispatchEvent(new Event('load'));
            }, 20);
          }
        }) as typeof node.contentDocument.write;
      }
      return appended;
    });

    const startedAt = Date.now();
    const sandbox = await renderSandbox({
      html: '<link rel="stylesheet" href="https://example.com/theme.css"><div class="box">Ready</div>'
    });

    try {
      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);
      expect(sandbox.document.querySelector('.box')?.textContent).toBe('Ready');
    } finally {
      appendChildSpy.mockRestore();
      sandbox.dispose();
    }
  });

  it('annotates equivalent keyed elements with stable structural diff ids', async () => {
    const oldSandbox = await renderSandbox({
      html: `
        <ul>
          <li data-testid="alpha"><span>Card</span></li>
          <li data-testid="beta"><span>Card</span></li>
        </ul>
      `
    });

    const newSandbox = await renderSandbox({
      html: `
        <ul>
          <li data-testid="inserted"><span>New</span></li>
          <li data-testid="alpha"><span>Card updated</span></li>
          <li data-testid="beta"><span>Card</span></li>
        </ul>
      `
    });

    try {
      const oldAlpha = oldSandbox.document.querySelector('[data-testid="alpha"]');
      const newAlpha = newSandbox.document.querySelector('[data-testid="alpha"]');
      const oldBeta = oldSandbox.document.querySelector('[data-testid="beta"]');
      const newBeta = newSandbox.document.querySelector('[data-testid="beta"]');
      const inserted = newSandbox.document.querySelector('[data-testid="inserted"]');

      expect(oldAlpha?.getAttribute('data-diff-id')).toBeTruthy();
      expect(oldAlpha?.getAttribute('data-diff-id')).toBe(newAlpha?.getAttribute('data-diff-id'));
      expect(oldBeta?.getAttribute('data-diff-id')).toBe(newBeta?.getAttribute('data-diff-id'));
      expect(inserted?.getAttribute('data-diff-id')).not.toBe(newAlpha?.getAttribute('data-diff-id'));
      expect(newAlpha?.getAttribute('data-hvd-struct-key')).toBe('data-testid=alpha');
    } finally {
      oldSandbox.dispose();
      newSandbox.dispose();
    }
  });
});
