import type { RenderChange } from '../core/diff/types';

function getOverlayClass(type: RenderChange['type']): string {
  if (type === 'inserted') return 'hvd-highlight-inserted';
  if (type === 'deleted') return 'hvd-highlight-deleted';
  return 'hvd-highlight-changed';
}

function placeHighlight(overlay: HTMLElement, contentRoot: HTMLElement, nodeId: string, className: string): void {
  const target = contentRoot.querySelector<HTMLElement>(`[data-hvd-node-id="${nodeId}"]`);
  if (!target) return;
  const overlayRect = overlay.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const box = document.createElement('div');
  box.className = className;
  box.style.left = `${rect.left - overlayRect.left}px`;
  box.style.top = `${rect.top - overlayRect.top}px`;
  box.style.width = `${Math.max(rect.width, 1)}px`;
  box.style.height = `${Math.max(rect.height, 1)}px`;
  overlay.appendChild(box);
}

export function drawOverlay(
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

export function bindOverlayUpdates(
  pane: HTMLElement,
  overlay: HTMLElement,
  contentRoot: HTMLElement,
  changes: RenderChange[],
  side: 'old' | 'new'
): () => void {
  const redraw = () => drawOverlay(overlay, contentRoot, changes, side);
  const onScroll = () => redraw();
  pane.addEventListener('scroll', onScroll);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(redraw);
    observer.observe(contentRoot);
    redraw();
    return () => {
      pane.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }

  redraw();
  return () => pane.removeEventListener('scroll', onScroll);
}
