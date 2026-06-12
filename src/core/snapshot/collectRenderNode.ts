import { collectComputedStyles } from './collectComputedStyles';
import type { Rect, RenderNode } from './types';
import { normalizeText } from '../../utils/dom';

interface CollectContext {
  seq: number;
}

function toRect(rect: DOMRect | { x: number; y: number; width: number; height: number }): Rect {
  return {
    x: Number(rect.x || 0),
    y: Number(rect.y || 0),
    width: Number(rect.width || 0),
    height: Number(rect.height || 0)
  };
}

function getTextRect(node: Text): Rect {
  try {
    const range = document.createRange();
    range.selectNodeContents(node);
    return toRect(range.getBoundingClientRect());
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

function shouldSkipElement(el: Element, rect: Rect, text: string): boolean {
  const computed = getComputedStyle(el);
  if (computed.display === 'none' || computed.visibility === 'hidden') return true;
  return rect.width === 0 && rect.height === 0 && !text;
}

export function collectRenderNode(node: Node, path: string, ctx: CollectContext): RenderNode | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeText(node.textContent);
    if (!text) return null;
    const id = `hvd-node-${++ctx.seq}`;
    return {
      id,
      tagName: '#text',
      nodeType: 'text',
      text,
      textAnchorId: `${id}-text`,
      attributes: {},
      styles: {},
      rect: getTextRect(node as Text),
      children: [],
      path
    };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tagName = el.tagName.toLowerCase();
  const text = normalizeText(el.textContent);
  const rect = toRect(el.getBoundingClientRect());

  if (shouldSkipElement(el, rect, text)) return null;

  const id = `hvd-node-${++ctx.seq}`;
  el.setAttribute('data-hvd-node-id', id);

  const children: RenderNode[] = [];
  let index = 0;
  for (const child of Array.from(el.childNodes)) {
    const childPath = `${path}/${tagName}[${index++}]`;
    const collected = collectRenderNode(child, childPath, ctx);
    if (collected) children.push(collected);
  }

  return {
    id,
    tagName,
    nodeType: 'element',
    text,
    attributes: Object.fromEntries(Array.from(el.attributes).map((attr) => [attr.name, attr.value])),
    styles: collectComputedStyles(el),
    rect,
    children,
    path
  };
}
