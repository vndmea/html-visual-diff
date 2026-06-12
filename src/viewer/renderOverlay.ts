import type { RenderChange } from '../core/diff/types';
import type { TextChangeSegment } from '../core/diff/textChangeSegments';

interface OverlayEntry {
  nodeId: string;
  className: string;
}

interface OverlayRect {
  left: number;
  top: number;
  width: number;
  height: number;
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

function resolveTarget(contentRoot: HTMLElement, nodeId: string, className: string): HTMLElement | null {
  if (className === 'hvd-highlight-changed') {
    const textTarget = contentRoot.querySelector<HTMLElement>(`[data-hvd-text-node-id="${nodeId}-text"]`);
    if (textTarget) return textTarget;
  }

  return contentRoot.querySelector<HTMLElement>(`[data-hvd-node-id="${nodeId}"]`);
}

function collectHighlightRects(target: HTMLElement): OverlayRect[] {
  if (target.hasAttribute('data-hvd-text-node-id') && target.firstChild?.nodeType === Node.TEXT_NODE) {
    try {
      const range = document.createRange();
      range.selectNodeContents(target.firstChild);
      const rects = Array.from(range.getClientRects())
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => ({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        }));

      if (rects.length > 0) return rects;
    } catch {
      // Fall back to a single bounding box below.
    }
  }

  const rect = target.getBoundingClientRect();
  return [{
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  }];
}

function collectSegmentRects(target: HTMLElement, segments: TextChangeSegment[]): OverlayRect[] {
  const textNode = target.firstChild;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return [];

  const textContent = textNode.textContent || '';
  const rects: OverlayRect[] = [];

  for (const segment of segments) {
    const start = Math.max(0, Math.min(segment.start, textContent.length));
    const end = Math.max(start, Math.min(segment.end, textContent.length));
    if (start === end) continue;

    try {
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      rects.push(...Array.from(range.getClientRects())
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => ({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        })));
    } catch {
      return [];
    }
  }

  return rects;
}

function placeHighlight(
  overlay: HTMLElement,
  contentRoot: HTMLElement,
  nodeId: string,
  className: string,
  segments?: TextChangeSegment[]
): void {
  const target = resolveTarget(contentRoot, nodeId, className);
  if (!target) return;
  const overlayRect = overlay.getBoundingClientRect();
  const rects = className === 'hvd-highlight-changed' && segments?.length
    ? collectSegmentRects(target, segments)
    : collectHighlightRects(target);
  const finalRects = rects.length > 0 ? rects : collectHighlightRects(target);

  for (const rect of finalRects) {
    const box = document.createElement('div');
    box.className = className;
    box.style.left = `${rect.left - overlayRect.left}px`;
    box.style.top = `${rect.top - overlayRect.top}px`;
    box.style.width = `${Math.max(rect.width, 1)}px`;
    box.style.height = `${Math.max(rect.height, 1)}px`;
    overlay.appendChild(box);
  }
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
    const change = changes.find((item) => (side === 'old' ? item.oldNodeId : item.newNodeId) === entry.nodeId);
    const segments = side === 'old' ? change?.oldTextSegments : change?.newTextSegments;
    placeHighlight(overlay, contentRoot, entry.nodeId, entry.className, segments);
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
