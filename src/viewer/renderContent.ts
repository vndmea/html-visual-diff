import { rewriteBodySelectors } from '../core/render/renderSandbox';

export function renderContent(
  host: HTMLElement,
  body: HTMLBodyElement,
  css?: string
): HTMLElement {
  host.innerHTML = '';

  const root = document.createElement('div');
  root.className = 'hvd-document-root';

  if (css) {
    const style = document.createElement('style');
    style.textContent = rewriteBodySelectors(css);
    root.appendChild(style);
  }

  for (const child of Array.from(body.childNodes)) {
    root.appendChild(child.cloneNode(true));
  }

  host.appendChild(root);
  return root;
}
