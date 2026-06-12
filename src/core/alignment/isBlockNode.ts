import type { RenderNode } from '../snapshot/types';

const BLOCK_TAGS = new Set([
  'div',
  'section',
  'article',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'tr',
  'figure',
  'blockquote',
  'pre'
]);

export function isBlockNode(node: RenderNode | undefined): boolean {
  return !!node && node.nodeType === 'element' && BLOCK_TAGS.has(node.tagName);
}
