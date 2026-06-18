import { normalizeHtml, parseHtml, type XmlElementNode, type XmlNode } from 'xml-diff-kit';

const STRUCTURAL_KEY_ATTRS = [
  'id',
  'data-testid',
  'data-test-id',
  'name'
] as const;

function isTrackableDomNode(node: Node): boolean {
  return node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE;
}

function getTrackableDomChildren(parent: ParentNode): Node[] {
  return Array.from(parent.childNodes).filter(isTrackableDomNode);
}

function getStructuralKey(node: XmlElementNode): { attr: string; value: string } | null {
  for (const attr of STRUCTURAL_KEY_ATTRS) {
    const value = node.attrs[attr];
    if (value) return { attr, value };
  }
  return null;
}

function buildNodeSegment(node: XmlNode, index: number): string {
  if (node.type === 'text') return `text()[${index}]`;
  if (node.type === 'comment') return `comment()[${index}]`;

  const key = getStructuralKey(node);
  if (!key) return `${node.name}[${index}]`;
  return `${node.name}{${key.attr}=${encodeURIComponent(key.value)}}`;
}

function annotateNode(node: XmlNode, domNode: Node, parentPath: string, index: number): void {
  const path = `${parentPath}/${buildNodeSegment(node, index)}`;

  if (node.type === 'element' && domNode.nodeType === Node.ELEMENT_NODE) {
    const el = domNode as Element;
    el.setAttribute('data-diff-id', path);
    el.setAttribute('data-hvd-struct-path', path);

    const key = getStructuralKey(node);
    if (key) {
      el.setAttribute('data-hvd-struct-key', `${key.attr}=${key.value}`);
    } else {
      el.removeAttribute('data-hvd-struct-key');
    }

    const astChildren = node.children;
    const domChildren = getTrackableDomChildren(el);
    const childCount = Math.min(astChildren.length, domChildren.length);

    for (let childIndex = 0; childIndex < childCount; childIndex += 1) {
      annotateNode(astChildren[childIndex], domChildren[childIndex], path, childIndex);
    }
  }
}

export function annotateStructuralDiffIds(root: HTMLElement, html: string): void {
  const ast = normalizeHtml(parseHtml(html), {
    sortAttributes: true,
    normalizeBooleanAttributes: true
  });

  if (ast.type !== 'element') return;

  const domChildren = getTrackableDomChildren(root);
  const astChildren = ast.children;
  const childCount = Math.min(astChildren.length, domChildren.length);

  for (let index = 0; index < childCount; index += 1) {
    annotateNode(astChildren[index], domChildren[index], `/${ast.name}[0]`, index);
  }
}
