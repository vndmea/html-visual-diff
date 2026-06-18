import { describe, expect, it } from 'vitest';
import { calibrateAlignment, insertSpacers } from '../src/core/alignment/insertSpacers';
import type { AlignmentBlock } from '../src/core/alignment/createAlignmentBlocks';

function mount(content: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = content;
  return host;
}

describe('insertSpacers', () => {
  it('equalizes paired block heights without replacing original content', () => {
    const oldRoot = mount('<main data-hvd-node-id="main-old"><section data-hvd-node-id="old-a">Old</section></main>');
    const newRoot = mount('<main data-hvd-node-id="main-new"><section data-hvd-node-id="new-a">New</section></main>');
    const oldSection = oldRoot.querySelector<HTMLElement>('[data-hvd-node-id="old-a"]');
    const newSection = newRoot.querySelector<HTMLElement>('[data-hvd-node-id="new-a"]');

    const blocks: AlignmentBlock[] = [{
      oldNodeId: 'old-a',
      newNodeId: 'new-a',
      oldHeight: 40,
      newHeight: 96
    }];

    insertSpacers(oldRoot, newRoot, blocks);
    if (oldSection) oldSection.getBoundingClientRect = () => ({ height: 44 } as DOMRect);
    if (newSection) newSection.getBoundingClientRect = () => ({ height: 96 } as DOMRect);
    calibrateAlignment(oldRoot, newRoot, blocks);

    expect(oldSection?.style.minHeight).toBe('96px');
    expect(newSection?.style.minHeight).toBe('96px');
    expect(oldSection?.textContent).toBe('Old');
    expect(newSection?.textContent).toBe('New');
  });

  it('inserts a spacer before the next sibling inside the matched parent', () => {
    const oldRoot = mount(`
      <main data-hvd-node-id="main-old">
        <section data-hvd-node-id="old-a">A</section>
        <section data-hvd-node-id="old-b">B</section>
      </main>
    `);

    const newRoot = mount(`
      <main data-hvd-node-id="main-new">
        <section data-hvd-node-id="new-x">X</section>
        <section data-hvd-node-id="new-a">A</section>
        <section data-hvd-node-id="new-b">B</section>
      </main>
    `);

    const blocks: AlignmentBlock[] = [{
      oldParentNodeId: 'main-old',
      newParentNodeId: 'main-new',
      newNodeId: 'new-x',
      spacerSide: 'old',
      spacerHeight: 48,
      beforeOldNodeId: 'old-a'
    }];

    insertSpacers(oldRoot, newRoot, blocks);
    const newInserted = newRoot.querySelector<HTMLElement>('[data-hvd-node-id="new-x"]');
    if (newInserted) newInserted.getBoundingClientRect = () => ({ height: 72 } as DOMRect);
    calibrateAlignment(oldRoot, newRoot, blocks);

    const oldParent = oldRoot.querySelector<HTMLElement>('[data-hvd-node-id="main-old"]')!;
    expect(oldParent.children[0]?.className).toBe('hvd-spacer');
    expect((oldParent.children[0] as HTMLElement).style.height).toBe('72px');
    expect(oldParent.children[1]?.getAttribute('data-hvd-node-id')).toBe('old-a');
  });
});
