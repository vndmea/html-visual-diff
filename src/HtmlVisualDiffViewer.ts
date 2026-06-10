import './style.css';

import type { ChangeRecord, HtmlVisualDiffRenderOptions, HtmlVisualDiffViewerApi, NormalizedDiffOptions } from './types';
import { DEFAULT_CLASS_PREFIX, DEFAULT_IGNORE_TAGS } from './constants';
import { diffChildren } from './diff/domDiff';
import { buildInsertedOrDeleted, buildPair, createPlaceholder } from './renderer/renderDiff';
import { parseHtmlToBody, resolveElement } from './utils/dom';

export class HtmlVisualDiffViewer implements HtmlVisualDiffViewerApi {
  public root: HTMLElement;
  public oldPane!: HTMLElement;
  public newPane!: HTMLElement;
  public changes: ChangeRecord[] = [];

  private readonly mountEl: HTMLElement;
  private options!: HtmlVisualDiffRenderOptions & { syncScroll: boolean };
  private normalized!: NormalizedDiffOptions;
  private prefix = DEFAULT_CLASS_PREFIX;
  private seq = 0;
  private disposers: Array<() => void> = [];

  constructor(options: HtmlVisualDiffRenderOptions) {
    this.mountEl = resolveElement(options.el);
    this.root = document.createElement('div');
    this.render(options);
  }

  public render(options: HtmlVisualDiffRenderOptions): HtmlVisualDiffViewerApi {
    this.destroy(false);
    this.options = { syncScroll: true, ...options };
    this.prefix = this.options.theme?.classPrefix || DEFAULT_CLASS_PREFIX;
    this.normalized = normalizeOptions(this.options);
    this.changes = [];
    this.seq = 0;

    this.root = document.createElement('div');
    this.root.className = [`${this.prefix}-root`, this.options.theme?.rootClassName || ''].filter(Boolean).join(' ');

    const shell = this.createShell();
    const oldBody = parseHtmlToBody(this.options.oldHtml);
    const newBody = parseHtmlToBody(this.options.newHtml);
    const pairs = diffChildren(oldBody, newBody, this.normalized);
    const ctx = { prefix: this.prefix, changes: this.changes, nextId: () => `${this.prefix}-change-${++this.seq}` };

    for (const pair of pairs) {
      const oldRow = document.createElement('div');
      oldRow.className = `${this.prefix}-row`;
      const newRow = document.createElement('div');
      newRow.className = `${this.prefix}-row`;

      if (pair.type === 'pair' && pair.oldNode && pair.newNode) {
        const built = buildPair(pair.oldNode, pair.newNode, this.normalized, ctx);
        oldRow.appendChild(built.oldEl);
        newRow.appendChild(built.newEl);
      } else if (pair.type === 'delete' && pair.oldNode) {
        oldRow.appendChild(buildInsertedOrDeleted(pair.oldNode, 'delete', this.normalized, ctx));
        newRow.appendChild(createPlaceholder(this.prefix, this.normalized));
      } else if (pair.type === 'insert' && pair.newNode) {
        oldRow.appendChild(createPlaceholder(this.prefix, this.normalized));
        newRow.appendChild(buildInsertedOrDeleted(pair.newNode, 'insert', this.normalized, ctx));
      }

      shell.oldContent.appendChild(oldRow);
      shell.newContent.appendChild(newRow);
      this.syncRowHeights(oldRow, newRow);
    }

    this.mountEl.innerHTML = '';
    this.mountEl.appendChild(this.root);

    if (this.options.syncScroll) {
      this.bindSyncScroll(this.oldPane, this.newPane);
      this.bindSyncScroll(this.newPane, this.oldPane);
    }

    this.options.onRender?.(this);
    return this;
  }

  public scrollToChange(idOrIndex: string | number): void {
    const record = typeof idOrIndex === 'number' ? this.changes[idOrIndex] : this.changes.find((item) => item.id === idOrIndex);
    if (!record) return;
    const target = this.root.querySelector<HTMLElement>(`[data-hvd-change-id="${record.id}"]`);
    if (!target) return;
    target.classList.remove(`${this.prefix}-selected`);
    void target.offsetWidth;
    target.classList.add(`${this.prefix}-selected`);
    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    this.options.onChangeSelect?.(record);
  }

  public destroy(clearMount = true): void {
    for (const dispose of this.disposers) dispose();
    this.disposers = [];
    if (clearMount && this.mountEl) this.mountEl.innerHTML = '';
  }

  private createShell(): { oldContent: HTMLElement; newContent: HTMLElement } {
    const layout = document.createElement('div');
    layout.className = `${this.prefix}-layout`;
    this.root.appendChild(layout);

    const oldPane = document.createElement('section');
    oldPane.className = `${this.prefix}-pane ${this.prefix}-old-pane`;
    const newPane = document.createElement('section');
    newPane.className = `${this.prefix}-pane ${this.prefix}-new-pane`;
    this.oldPane = oldPane;
    this.newPane = newPane;

    const oldContent = document.createElement('div');
    oldContent.className = `${this.prefix}-content`;
    const newContent = document.createElement('div');
    newContent.className = `${this.prefix}-content`;

    oldPane.append(oldContent);
    newPane.append(newContent);
    layout.append(oldPane, newPane);
    return { oldContent, newContent };
  }

  private syncRowHeights(oldRow: HTMLElement, newRow: HTMLElement): void {
    const sync = () => {
      // Measure natural heights first, with placeholders zeroed
      const natOld = this.measureHeightWithoutPlaceholders(oldRow) || oldRow.offsetHeight || 0;
      const natNew = this.measureHeightWithoutPlaceholders(newRow) || newRow.offsetHeight || 0;
      const maxNat = Math.max(natOld, natNew, 0);

      // Set minimum height for both rows based on natural max.
      // Avoid redundant style writes to prevent reflow loops.
      const newMin = `${maxNat}px`;
      if (oldRow.style.minHeight !== newMin) oldRow.style.minHeight = newMin;
      if (newRow.style.minHeight !== newMin) newRow.style.minHeight = newMin;

      // Ensure placeholders do NOT carry inline min-height (avoid feedback loops).
      const clearPlaceholders = (row: HTMLElement) => {
        const phs = row.querySelectorAll<HTMLElement>(`.${this.prefix}-placeholder`);
        phs.forEach((ph) => {
          if (ph.style && ph.style.minHeight) ph.style.minHeight = '';
        });
      };
      clearPlaceholders(oldRow);
      clearPlaceholders(newRow);
    };

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(sync);
      observer.observe(oldRow);
      observer.observe(newRow);
      this.disposers.push(() => observer.disconnect());
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(sync);
    } else {
      setTimeout(sync, 0);
    }
  }

  private measureNaturalHeight(el: HTMLElement, width?: number): number {
    try {
      const clone = el.cloneNode(true) as HTMLElement;
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.visibility = 'hidden';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.boxSizing = 'border-box';
      if (width) container.style.width = `${width}px`;
      // Remove placeholder nodes and any inline height/min-height/max-height
      // styles from the clone to avoid measuring propagated min-heights
      // which can cause a feedback loop of increasing heights.
      const placeholders = Array.from(clone.querySelectorAll(`.${this.prefix}-placeholder`));
      for (const ph of placeholders) ph.remove();

      const all = [clone, ...Array.from(clone.querySelectorAll('*'))] as HTMLElement[];
      for (const node of all) {
        if (node.style) {
          node.style.minHeight = '';
          node.style.height = '';
          node.style.maxHeight = '';
        }
      }
      container.appendChild(clone);
      document.body.appendChild(container);
      const h = container.offsetHeight;
      document.body.removeChild(container);
      return h;
    } catch (e) {
      return 0;
    }
  }

  private measureHeightWithoutPlaceholders(row: HTMLElement): number {
    const placeholders = Array.from(row.querySelectorAll<HTMLElement>(`.${this.prefix}-placeholder`));
    const prevs: string[] = [];
    try {
      for (const ph of placeholders) {
        prevs.push(ph.style.minHeight || '');
        ph.style.minHeight = '0px';
      }
      // Force layout
      const h = Math.ceil(row.getBoundingClientRect().height);
      return h;
    } finally {
      placeholders.forEach((ph, i) => {
        ph.style.minHeight = prevs[i] || '';
      });
    }
  }

  private bindSyncScroll(source: HTMLElement, target: HTMLElement): void {
    let locked = false;
    const onScroll = () => {
      if (locked) return;
      locked = true;
      const yRatio = source.scrollTop / Math.max(1, source.scrollHeight - source.clientHeight);
      const xRatio = source.scrollLeft / Math.max(1, source.scrollWidth - source.clientWidth);
      target.scrollTop = yRatio * Math.max(1, target.scrollHeight - target.clientHeight);
      target.scrollLeft = xRatio * Math.max(1, target.scrollWidth - target.clientWidth);
      requestAnimationFrame(() => { locked = false; });
    };
    source.addEventListener('scroll', onScroll);
    this.disposers.push(() => source.removeEventListener('scroll', onScroll));
  }
}

function normalizeOptions(options: HtmlVisualDiffRenderOptions): NormalizedDiffOptions {
  return {
    matchThreshold: options.matchThreshold ?? 0.58,
    textModifyThreshold: options.textModifyThreshold ?? 0.35,
    inlineTextDiff: options.inlineTextDiff ?? true,
    textDiffGranularity: options.textDiffGranularity ?? 'word',
    compareAttributes: options.compareAttributes ?? true,
    ignoreAttributes: new Set(options.ignoreAttributes ?? []),
    ignoreTags: new Set([...DEFAULT_IGNORE_TAGS, ...(options.ignoreTags ?? [])]),
    allowUnsafeHtml: options.allowUnsafeHtml ?? false,
    showPlaceholders: options.theme?.showPlaceholders ?? true,
    getChangeLabel: options.getChangeLabel
  };
}
