import type { AlignmentBlock } from './createAlignmentBlocks';

function createSpacer(height: number): HTMLDivElement {
  const spacer = document.createElement('div');
  spacer.className = 'hvd-spacer';
  spacer.style.height = `${Math.max(0, Math.ceil(height))}px`;
  spacer.setAttribute('aria-hidden', 'true');
  return spacer;
}

export function insertSpacers(
  oldRoot: HTMLElement,
  newRoot: HTMLElement,
  blocks: AlignmentBlock[]
): void {
  const oldMap = new Map(Array.from(oldRoot.children).map((child) => [child.getAttribute('data-hvd-node-id') || '', child as HTMLElement]));
  const newMap = new Map(Array.from(newRoot.children).map((child) => [child.getAttribute('data-hvd-node-id') || '', child as HTMLElement]));

  const oldFragment = document.createDocumentFragment();
  const newFragment = document.createDocumentFragment();

  for (const block of blocks) {
    if (block.oldNodeId) {
      const oldNode = oldMap.get(block.oldNodeId);
      if (oldNode) oldFragment.appendChild(oldNode);
    }
    if (block.newNodeId) {
      const newNode = newMap.get(block.newNodeId);
      if (newNode) newFragment.appendChild(newNode);
    }
    if (block.spacerSide === 'old' && block.spacerHeight) {
      oldFragment.appendChild(createSpacer(block.spacerHeight));
    }
    if (block.spacerSide === 'new' && block.spacerHeight) {
      newFragment.appendChild(createSpacer(block.spacerHeight));
    }
  }

  oldRoot.replaceChildren(oldFragment);
  newRoot.replaceChildren(newFragment);
}
