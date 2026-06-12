import { describe, expect, it } from 'vitest';
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
});
