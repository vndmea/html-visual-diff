import type { RenderNode } from '../snapshot/types';

const BLOCK_TAGS = new Set([
  'div',
  'section',
  'article',
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
