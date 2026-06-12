import type { RenderChange } from '../core/diff/types';

function getOverlayClass(type: RenderChange['type']): string {
  if (type === 'inserted') return 'hvd-highlight-inserted';
  if (type === 'deleted') return 'hvd-highlight-deleted';
  return 'hvd-highlight-changed';
}

function placeHighlight(overlay: HTMLElement, contentRoot: HTMLElement, nodeId: string, className: string): void {
  const target = contentRoot.querySelector<HTMLElement>(`[data-hvd-node-id="${nodeId}"]`);
  if (!target) return;
  const contentRect = contentRoot.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const box = document.createElement('div');
  box.className = className;
  box.style.left = `${rect.left - contentRect.left + contentRoot.scrollLeft}px`;
  box.style.top = `${rect.top - contentRect.top + contentRoot.scrollTop}px`;
  box.style.width = `${Math.max(rect.width, 1)}px`;
  box.style.height = `${Math.max(rect.height, 1)}px`;
  overlay.appendChild(box);
}

export function renderOverlay(
  overlay: HTMLElement,
  contentRoot: HTMLElement,
  changes: RenderChange[],
  side: 'old' | 'new'
): void {
  overlay.innerHTML = '';
  for (const change of changes) {
    const className = getOverlayClass(change.type);
    if (side === 'old' && change.oldNodeId) placeHighlight(overlay, contentRoot, change.oldNodeId, className);
    if (side === 'new' && change.newNodeId) placeHighlight(overlay, contentRoot, change.newNodeId, className);
  }
}
