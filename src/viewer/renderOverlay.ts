import type { RenderChange } from '../core/diff/types';

interface OverlayEntry {
  nodeId: string;
  className: string;
}

function getOverlayClass(type: RenderChange['type']): string {
  if (type === 'inserted') return 'hvd-highlight-inserted';
  if (type === 'deleted') return 'hvd-highlight-deleted';
  return 'hvd-highlight-changed';
}

function getOverlayPriority(type: RenderChange['type']): number {
  if (type === 'inserted' || type === 'deleted') return 3;
  if (type === 'size-changed' || type === 'layout-changed') return 2;
  return 1;
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

function collectOverlayEntries(changes: RenderChange[], side: 'old' | 'new'): OverlayEntry[] {
  const ranked = new Map<string, { priority: number; className: string }>();

  for (const change of changes) {
    const nodeId = side === 'old' ? change.oldNodeId : change.newNodeId;
    if (!nodeId) continue;

    const priority = getOverlayPriority(change.type);
    const existing = ranked.get(nodeId);
    if (!existing || priority >= existing.priority) {
      ranked.set(nodeId, {
        priority,
        className: getOverlayClass(change.type)
      });
    }
  }

  return Array.from(ranked.entries()).map(([nodeId, value]) => ({
    nodeId,
    className: value.className
  }));
}

export function drawOverlay(
  overlay: HTMLElement,
  contentRoot: HTMLElement,
  changes: RenderChange[],
  side: 'old' | 'new'
): void {
  overlay.innerHTML = '';
  for (const entry of collectOverlayEntries(changes, side)) {
    placeHighlight(overlay, contentRoot, entry.nodeId, entry.className);
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
