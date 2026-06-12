import '../style.css';

import { resolveElement } from '../utils/dom';
import { renderSandbox } from '../core/render/renderSandbox';
import { createRenderSnapshot } from '../core/snapshot/createRenderSnapshot';
import { diffRenderTrees } from '../core/diff/diffRenderTrees';
import { createAlignmentBlocks } from '../core/alignment/createAlignmentBlocks';
import { insertSpacers } from '../core/alignment/insertSpacers';
import { renderContent } from './renderContent';
import { renderOverlay } from './renderOverlay';
import { syncScroll } from './syncScroll';
import type { CreateHtmlVisualDiffOptions, HtmlVisualDiffViewer, ResolvedViewerOptions } from '../types';

function normalizeOptions(options?: CreateHtmlVisualDiffOptions['options']): ResolvedViewerOptions {
  return {
    viewportWidth: options?.viewportWidth ?? 960,
    syncScroll: options?.syncScroll ?? true,
    align: options?.align ?? true,
    compareText: options?.compareText ?? true,
    compareStyle: options?.compareStyle ?? true,
    compareLayout: options?.compareLayout ?? true,
    layoutThreshold: options?.layoutThreshold ?? 2
  };
}

export class TwoPaneViewer implements HtmlVisualDiffViewer {
  public root: HTMLElement;

  private readonly mountEl: HTMLElement;
  private readonly config: CreateHtmlVisualDiffOptions;
  private readonly options: ResolvedViewerOptions;
  private disposers: Array<() => void> = [];

  constructor(config: CreateHtmlVisualDiffOptions) {
    this.config = config;
    this.options = normalizeOptions(config.options);
    this.mountEl = resolveElement(config.container);
    this.root = document.createElement('div');
  }

  public async refresh(): Promise<void> {
    this.destroy(false);

    const [oldSandbox, newSandbox] = await Promise.all([
      renderSandbox(this.config.old, { viewportWidth: this.options.viewportWidth }),
      renderSandbox(this.config.new, { viewportWidth: this.options.viewportWidth })
    ]);

    try {
      const oldSnapshot = createRenderSnapshot(oldSandbox.document.body as HTMLBodyElement);
      const newSnapshot = createRenderSnapshot(newSandbox.document.body as HTMLBodyElement);
      const diff = diffRenderTrees(oldSnapshot.root, newSnapshot.root, {
        compareText: this.options.compareText,
        compareStyle: this.options.compareStyle,
        compareLayout: this.options.compareLayout,
        layoutThreshold: this.options.layoutThreshold
      });

      this.root = document.createElement('div');
      this.root.className = 'hvd-viewer';

      const oldPane = document.createElement('div');
      oldPane.className = 'hvd-pane hvd-pane-old';
      const newPane = document.createElement('div');
      newPane.className = 'hvd-pane hvd-pane-new';

      const oldContent = document.createElement('div');
      oldContent.className = 'hvd-content';
      const newContent = document.createElement('div');
      newContent.className = 'hvd-content';

      const oldOverlay = document.createElement('div');
      oldOverlay.className = 'hvd-overlay';
      const newOverlay = document.createElement('div');
      newOverlay.className = 'hvd-overlay';

      oldPane.append(oldContent, oldOverlay);
      newPane.append(newContent, newOverlay);
      this.root.append(oldPane, newPane);

      const oldContentRoot = renderContent(oldContent, oldSandbox.document.body as HTMLBodyElement, this.config.old.css);
      const newContentRoot = renderContent(newContent, newSandbox.document.body as HTMLBodyElement, this.config.new.css);

      if (this.options.align) {
        const blocks = createAlignmentBlocks(oldSnapshot.root, newSnapshot.root);
        insertSpacers(oldContentRoot, newContentRoot, blocks);
      }

      renderOverlay(oldOverlay, oldContentRoot, diff.changes, 'old');
      renderOverlay(newOverlay, newContentRoot, diff.changes, 'new');

      if (this.options.syncScroll) {
        this.disposers.push(syncScroll(oldPane, newPane));
      }

      this.mountEl.innerHTML = '';
      this.mountEl.appendChild(this.root);
    } finally {
      oldSandbox.dispose();
      newSandbox.dispose();
    }
  }

  public destroy(clearMount = true): void {
    for (const dispose of this.disposers) dispose();
    this.disposers = [];
    if (clearMount) this.mountEl.innerHTML = '';
  }
}
