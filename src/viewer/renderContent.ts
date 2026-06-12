import { rewriteBodySelectors } from '../core/render/renderSandbox';
import type { RenderNode } from '../core/snapshot/types';

function buildTextAnchorLookup(snapshotNode: RenderNode, lookup = new Map<string, string[]>()): Map<string, string[]> {
  if (snapshotNode.nodeType === 'text' && snapshotNode.text && snapshotNode.textAnchorId) {
    const bucket = lookup.get(snapshotNode.text) || [];
    bucket.push(snapshotNode.textAnchorId);
    lookup.set(snapshotNode.text, bucket);
  }

  for (const child of snapshotNode.children) {
    buildTextAnchorLookup(child, lookup);
  }

  return lookup;
}

function wrapTextNodesWithAnchors(
  node: Node,
  lookup: Map<string, string[]>,
  consumed = new Map<string, number>()
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const rawText = node.textContent || '';
    const normalized = rawText.replace(/\s+/g, ' ').trim();
    if (!normalized || !node.parentNode) return;

    const candidates = lookup.get(normalized);
    const nextIndex = consumed.get(normalized) || 0;
    const anchorId = candidates?.[nextIndex];
    if (!anchorId) return;

    const span = document.createElement('span');
    span.setAttribute('data-hvd-text-node-id', anchorId);
    span.textContent = rawText;
    node.parentNode.replaceChild(span, node);
    consumed.set(normalized, nextIndex + 1);
    return;
  }

  for (const child of Array.from(node.childNodes)) {
    wrapTextNodesWithAnchors(child, lookup, consumed);
  }
}

export function renderContent(
  host: HTMLElement,
  body: HTMLBodyElement,
  css?: string,
  snapshotRoot?: RenderNode
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

  if (snapshotRoot) {
    const lookup = buildTextAnchorLookup(snapshotRoot);
    wrapTextNodesWithAnchors(root, lookup);
  }

  host.appendChild(root);
  return root;
}
