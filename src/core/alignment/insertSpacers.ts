import type { AlignmentBlock } from './createAlignmentBlocks';

function createSpacer(height: number): HTMLDivElement {
  const spacer = document.createElement('div');
  spacer.className = 'hvd-spacer';
  spacer.style.height = `${Math.max(0, Math.ceil(height))}px`;
  spacer.setAttribute('aria-hidden', 'true');
  return spacer;
}

function resolveParent(root: HTMLElement, parentNodeId?: string): HTMLElement {
  if (!parentNodeId) return root;
  return root.querySelector<HTMLElement>(`[data-hvd-node-id="${parentNodeId}"]`) || root;
}

function resolveNode(root: HTMLElement, nodeId?: string): HTMLElement | null {
  if (!nodeId) return null;
  return root.querySelector<HTMLElement>(`[data-hvd-node-id="${nodeId}"]`);
}

function getSpacerKey(block: AlignmentBlock, side: 'old' | 'new'): string {
  return [
    side,
    block.oldParentNodeId || 'root',
    block.newParentNodeId || 'root',
    block.oldNodeId || 'none',
    block.newNodeId || 'none',
    block.beforeOldNodeId || block.beforeNewNodeId || 'none',
    block.afterOldNodeId || block.afterNewNodeId || 'none'
  ].join(':');
}

function resolveSpacer(root: HTMLElement, block: AlignmentBlock, side: 'old' | 'new'): HTMLElement | null {
  const key = getSpacerKey(block, side);
  return root.querySelector<HTMLElement>(`.hvd-spacer[data-hvd-spacer-key="${key}"]`);
}

function appendAfter(parent: HTMLElement, anchor: HTMLElement, node: HTMLElement): void {
  if (anchor.parentElement !== parent) {
    parent.appendChild(node);
    return;
  }

  if (anchor.nextSibling) {
    parent.insertBefore(node, anchor.nextSibling);
    return;
  }

  parent.appendChild(node);
}

function insertSpacer(
  root: HTMLElement,
  parentNodeId: string | undefined,
  beforeNodeId: string | undefined,
  afterNodeId: string | undefined,
  height: number,
  spacerKey: string
): void {
  const parent = resolveParent(root, parentNodeId);
  const spacer = createSpacer(height);
  spacer.setAttribute('data-hvd-spacer-key', spacerKey);
  const beforeNode = resolveNode(root, beforeNodeId);
  if (beforeNode && beforeNode.parentElement === parent) {
    parent.insertBefore(spacer, beforeNode);
    return;
  }

  const afterNode = resolveNode(root, afterNodeId);
  if (afterNode) {
    appendAfter(parent, afterNode, spacer);
    return;
  }

  parent.appendChild(spacer);
}

function measureHeight(el: HTMLElement | null, fallback = 0): number {
  if (!el) return fallback;
  const rectHeight = Math.ceil(el.getBoundingClientRect().height);
  return rectHeight || el.offsetHeight || fallback;
}

export function insertSpacers(
  oldRoot: HTMLElement,
  newRoot: HTMLElement,
  blocks: AlignmentBlock[]
): void {
  for (const block of blocks) {
    if (block.oldNodeId && block.newNodeId) {
      const oldNode = resolveNode(oldRoot, block.oldNodeId);
      const newNode = resolveNode(newRoot, block.newNodeId);
      const equalHeight = Math.ceil(Math.max(block.oldHeight || 0, block.newHeight || 0, 0));
      if (equalHeight > 0) {
        if (oldNode) oldNode.style.minHeight = `${equalHeight}px`;
        if (newNode) newNode.style.minHeight = `${equalHeight}px`;
      }
    }

    if (block.spacerSide === 'old' && block.spacerHeight) {
      insertSpacer(
        oldRoot,
        block.oldParentNodeId,
        block.beforeOldNodeId,
        block.afterOldNodeId,
        block.spacerHeight,
        getSpacerKey(block, 'old')
      );
    }

    if (block.spacerSide === 'new' && block.spacerHeight) {
      insertSpacer(
        newRoot,
        block.newParentNodeId,
        block.beforeNewNodeId,
        block.afterNewNodeId,
        block.spacerHeight,
        getSpacerKey(block, 'new')
      );
    }
  }
}

export function calibrateAlignment(
  oldRoot: HTMLElement,
  newRoot: HTMLElement,
  blocks: AlignmentBlock[]
): void {
  for (const block of blocks) {
    if (block.oldNodeId && block.newNodeId) {
      const oldNode = resolveNode(oldRoot, block.oldNodeId);
      const newNode = resolveNode(newRoot, block.newNodeId);
      const equalHeight = Math.max(
        measureHeight(oldNode, block.oldHeight || 0),
        measureHeight(newNode, block.newHeight || 0),
        block.oldHeight || 0,
        block.newHeight || 0
      );

      if (equalHeight > 0) {
        if (oldNode) oldNode.style.minHeight = `${equalHeight}px`;
        if (newNode) newNode.style.minHeight = `${equalHeight}px`;
      }
      continue;
    }

    if (block.spacerSide === 'old') {
      const spacer = resolveSpacer(oldRoot, block, 'old');
      const counterpart = resolveNode(newRoot, block.newNodeId);
      if (spacer) spacer.style.height = `${measureHeight(counterpart, block.spacerHeight || 0)}px`;
      continue;
    }

    if (block.spacerSide === 'new') {
      const spacer = resolveSpacer(newRoot, block, 'new');
      const counterpart = resolveNode(oldRoot, block.oldNodeId);
      if (spacer) spacer.style.height = `${measureHeight(counterpart, block.spacerHeight || 0)}px`;
    }
  }
}
