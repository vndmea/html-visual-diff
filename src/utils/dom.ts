import { DEFAULT_IGNORE_TAGS, UNSAFE_TAGS } from '../constants';

export function resolveElement(el: string | HTMLElement): HTMLElement {
  const resolved = typeof el === 'string' ? document.querySelector<HTMLElement>(el) : el;
  if (!resolved) throw new Error(`[html-visual-diff] mount element not found: ${String(el)}`);
  return resolved;
}

export function parseHtmlToBody(html: string): HTMLBodyElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || '', 'text/html');
  return doc.body;
}

export function normalizeText(text: string | null | undefined): string {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function isIgnoredElement(node: Node, ignoreTags: Set<string> = DEFAULT_IGNORE_TAGS, allowUnsafeHtml = false): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const tag = (node as Element).tagName.toLowerCase();
  return ignoreTags.has(tag) || (!allowUnsafeHtml && UNSAFE_TAGS.has(tag));
}

export function getComparableChildren(node: Node, ignoreTags: Set<string>, allowUnsafeHtml: boolean): Node[] {
  return Array.from(node.childNodes).filter((child) => {
    if (child.nodeType === Node.TEXT_NODE) return normalizeText(child.textContent).length > 0;
    if (child.nodeType === Node.ELEMENT_NODE) return !isIgnoredElement(child, ignoreTags, allowUnsafeHtml);
    return false;
  });
}

export function safeCloneElementShell(sourceEl: Element, allowUnsafeHtml: boolean): HTMLElement {
  const el = document.createElement(sourceEl.tagName.toLowerCase());
  for (const attr of Array.from(sourceEl.attributes)) {
    const name = attr.name.toLowerCase();
    if (!allowUnsafeHtml) {
      if (name.startsWith('on')) continue;
      if (name === 'srcdoc') continue;
      if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(attr.value)) continue;
    }
    el.setAttribute(attr.name, attr.value);
  }
  return el;
}

export function nodeKind(node: Node | null | undefined): string {
  if (!node) return '';
  if (node.nodeType === Node.TEXT_NODE) return '#text';
  if (node.nodeType === Node.ELEMENT_NODE) return (node as Element).tagName.toLowerCase();
  return '';
}

export function nodeText(node: Node | null | undefined): string {
  return node ? normalizeText(node.textContent) : '';
}

export function nodeSignature(node: Node | null | undefined): string {
  if (!node) return '';
  if (node.nodeType === Node.TEXT_NODE) return `#text:${normalizeText(node.textContent).slice(0, 80)}`;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const id = el.getAttribute('id') || '';
    const cls = el.getAttribute('class') || '';
    const text = normalizeText(el.textContent).slice(0, 80);
    return `${tag}#${id}.${cls}:${text}`;
  }
  return '';
}

export function nodePath(node: Node | null | undefined): string | undefined {
  if (!node) return undefined;
  const parts: string[] = [];
  let current: Node | null = node;
  while (current && current.nodeType !== Node.DOCUMENT_NODE && current.nodeName.toLowerCase() !== 'body') {
    if (current.nodeType === Node.TEXT_NODE) parts.unshift('#text');
    else if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element;
      const parent = el.parentElement;
      const siblings = parent ? Array.from(parent.children).filter((child) => child.tagName === el.tagName) : [];
      const index = siblings.indexOf(el) + 1;
      parts.unshift(`${el.tagName.toLowerCase()}${siblings.length > 1 ? `:nth-of-type(${index})` : ''}`);
    }
    current = current.parentNode;
  }
  return parts.join(' > ');
}

export function attrsEqual(oldEl: Element, newEl: Element, ignoredAttributes: Set<string>): boolean {
  const serialize = (el: Element) => Array.from(el.attributes)
    .filter((attr) => !ignoredAttributes.has(attr.name))
    .map((attr) => `${attr.name}=${attr.value}`)
    .sort()
    .join('|');
  return serialize(oldEl) === serialize(newEl);
}
