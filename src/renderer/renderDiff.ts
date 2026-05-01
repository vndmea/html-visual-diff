import type { ChangeRecord, NormalizedDiffOptions } from '../types';
import { diffChildren } from '../diff/domDiff';
import { inlineTextDiff } from '../diff/inlineTextDiff';
import { attrsEqual, getComparableChildren, nodePath, nodeText, normalizeText, safeCloneElementShell } from '../utils/dom';

export interface RenderContext {
  prefix: string;
  changes: ChangeRecord[];
  nextId: () => string;
}

export interface RenderedPair {
  oldEl: Node;
  newEl: Node;
}

export function buildPair(oldNode: Node, newNode: Node, options: NormalizedDiffOptions, ctx: RenderContext): RenderedPair {
  if (oldNode.nodeType === Node.TEXT_NODE && newNode.nodeType === Node.TEXT_NODE) return buildTextPair(oldNode, newNode, options, ctx);

  if (oldNode.nodeType === Node.ELEMENT_NODE && newNode.nodeType === Node.ELEMENT_NODE && (oldNode as Element).tagName.toLowerCase() === (newNode as Element).tagName.toLowerCase()) {
    return buildElementPair(oldNode as Element, newNode as Element, options, ctx);
  }

  return {
    oldEl: buildInsertedOrDeleted(oldNode, 'delete', options, ctx),
    newEl: buildInsertedOrDeleted(newNode, 'insert', options, ctx)
  };
}

function buildTextPair(oldNode: Node, newNode: Node, options: NormalizedDiffOptions, ctx: RenderContext): RenderedPair {
  const oldText = normalizeText(oldNode.textContent);
  const newText = normalizeText(newNode.textContent);
  const oldSpan = document.createElement('span');
  const newSpan = document.createElement('span');

  if (oldText === newText) {
    oldSpan.textContent = oldText;
    newSpan.textContent = newText;
    return { oldEl: oldSpan, newEl: newSpan };
  }

  if (options.inlineTextDiff) {
    const diff = inlineTextDiff(oldText, newText, ctx.prefix);
    oldSpan.innerHTML = diff.oldHtml;
    newSpan.innerHTML = diff.newHtml;
  } else {
    oldSpan.textContent = oldText;
    newSpan.textContent = newText;
  }

  addChange(oldSpan, 'modify', { label: '修改文本', oldPath: nodePath(oldNode), newPath: nodePath(newNode), oldText, newText }, options, ctx);
  addChange(newSpan, 'modify', { label: '修改文本', oldPath: nodePath(oldNode), newPath: nodePath(newNode), oldText, newText }, options, ctx);
  return { oldEl: oldSpan, newEl: newSpan };
}

function buildElementPair(oldNode: Element, newNode: Element, options: NormalizedDiffOptions, ctx: RenderContext): RenderedPair {
  const oldEl = safeCloneElementShell(oldNode, options.allowUnsafeHtml);
  const newEl = safeCloneElementShell(newNode, options.allowUnsafeHtml);
  const tag = oldNode.tagName.toLowerCase();

  if (options.compareAttributes && !attrsEqual(oldNode, newNode, options.ignoreAttributes)) {
    oldEl.classList.add(`${ctx.prefix}-attr-modify`);
    newEl.classList.add(`${ctx.prefix}-attr-modify`);
    addChange(oldEl, 'modify', { label: `修改属性 <${tag}>`, oldPath: nodePath(oldNode), newPath: nodePath(newNode), oldText: serializeAttributes(oldNode), newText: serializeAttributes(newNode) }, options, ctx);
    addChange(newEl, 'modify', { label: `修改属性 <${tag}>`, oldPath: nodePath(oldNode), newPath: nodePath(newNode), oldText: serializeAttributes(oldNode), newText: serializeAttributes(newNode) }, options, ctx);
  }

  const oldChildren = getComparableChildren(oldNode, options.ignoreTags, options.allowUnsafeHtml);
  const newChildren = getComparableChildren(newNode, options.ignoreTags, options.allowUnsafeHtml);

  if (oldChildren.length === 0 && newChildren.length === 0 && nodeText(oldNode) !== nodeText(newNode)) {
    const oldText = nodeText(oldNode);
    const newText = nodeText(newNode);
    if (options.inlineTextDiff) {
      const diff = inlineTextDiff(oldText, newText, ctx.prefix);
      oldEl.innerHTML = diff.oldHtml;
      newEl.innerHTML = diff.newHtml;
    } else {
      oldEl.textContent = oldText;
      newEl.textContent = newText;
    }
    addChange(oldEl, 'modify', { label: `修改 <${tag}>`, oldPath: nodePath(oldNode), newPath: nodePath(newNode), oldText, newText }, options, ctx);
    addChange(newEl, 'modify', { label: `修改 <${tag}>`, oldPath: nodePath(oldNode), newPath: nodePath(newNode), oldText, newText }, options, ctx);
    return { oldEl, newEl };
  }

  const pairs = diffChildren(oldNode, newNode, options);
  for (const pair of pairs) {
    if (pair.type === 'pair' && pair.oldNode && pair.newNode) {
      const built = buildPair(pair.oldNode, pair.newNode, options, ctx);
      oldEl.appendChild(built.oldEl);
      newEl.appendChild(built.newEl);
    } else if (pair.type === 'delete' && pair.oldNode) {
      oldEl.appendChild(buildInsertedOrDeleted(pair.oldNode, 'delete', options, ctx));
      newEl.appendChild(createPlaceholder(ctx.prefix, options));
    } else if (pair.type === 'insert' && pair.newNode) {
      oldEl.appendChild(createPlaceholder(ctx.prefix, options));
      newEl.appendChild(buildInsertedOrDeleted(pair.newNode, 'insert', options, ctx));
    }
  }
  return { oldEl, newEl };
}

export function buildInsertedOrDeleted(node: Node, type: 'insert' | 'delete', options: NormalizedDiffOptions, ctx: RenderContext): HTMLElement {
  if (node.nodeType === Node.TEXT_NODE) {
    const span = document.createElement('span');
    span.textContent = normalizeText(node.textContent);
    addChange(span, type, { label: type === 'insert' ? '新增文本' : '删除文本', [type === 'insert' ? 'newPath' : 'oldPath']: nodePath(node), [type === 'insert' ? 'newText' : 'oldText']: normalizeText(node.textContent) }, options, ctx);
    return span;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const source = node as Element;
    const el = safeCloneElementShell(source, options.allowUnsafeHtml);
    const tag = source.tagName.toLowerCase();
    addChange(el, type, { label: `${type === 'insert' ? '新增' : '删除'} <${tag}>`, [type === 'insert' ? 'newPath' : 'oldPath']: nodePath(node), [type === 'insert' ? 'newText' : 'oldText']: nodeText(node) }, options, ctx);
    const children = getComparableChildren(source, options.ignoreTags, options.allowUnsafeHtml);
    if (children.length > 0) children.forEach((child) => el.appendChild(buildInsertedOrDeleted(child, type, options, ctx)));
    else if (source.textContent) el.textContent = source.textContent;
    return el;
  }

  const fallback = document.createElement('span');
  fallback.textContent = node.textContent || '';
  return fallback;
}

export function createPlaceholder(prefix: string, options: NormalizedDiffOptions): HTMLElement {
  const el = document.createElement('div');
  el.className = `${prefix}-placeholder`;
  el.textContent = options.showPlaceholders ? '无对应内容' : '';
  if (!options.showPlaceholders) el.style.display = 'none';
  return el;
}

function addChange(el: HTMLElement, type: 'insert' | 'delete' | 'modify', record: Omit<ChangeRecord, 'id' | 'type'>, options: NormalizedDiffOptions, ctx: RenderContext): ChangeRecord {
  const baseRecord: Omit<ChangeRecord, 'id'> = { type, ...record };
  const id = ctx.nextId();
  const fullRecord: ChangeRecord = { id, type, ...record, label: options.getChangeLabel?.(baseRecord) || record.label };
  el.dataset.hvdChangeId = id;
  el.classList.add(`${ctx.prefix}-change`, `${ctx.prefix}-${type}`);
  ctx.changes.push(fullRecord);
  return fullRecord;
}

function serializeAttributes(el: Element): string {
  return Array.from(el.attributes).map((attr) => `${attr.name}="${attr.value}"`).join(' ');
}
