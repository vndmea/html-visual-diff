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
      if (pair.type === 'pair' && pair.oldNode && pair.newNode) {
        const built = buildPair(pair.oldNode, pair.newNode, this.normalized, ctx);
        shell.oldContent.appendChild(built.oldEl);
        shell.newContent.appendChild(built.newEl);
      } else if (pair.type === 'delete' && pair.oldNode) {
        shell.oldContent.appendChild(buildInsertedOrDeleted(pair.oldNode, 'delete', this.normalized, ctx));
        shell.newContent.appendChild(createPlaceholder(this.prefix, this.normalized));
      } else if (pair.type === 'insert' && pair.newNode) {
        shell.oldContent.appendChild(createPlaceholder(this.prefix, this.normalized));
        shell.newContent.appendChild(buildInsertedOrDeleted(pair.newNode, 'insert', this.normalized, ctx));
      }
    }

    this.renderSummary(shell.summary);
    this.renderChangeList(shell.changeList);
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

  private createShell(): { summary: HTMLElement; changeList: HTMLElement; oldContent: HTMLElement; newContent: HTMLElement } {
    const showHeader = this.options.theme?.showHeader ?? true;
    const showSummary = this.options.theme?.showSummary ?? true;
    const showChangeList = this.options.theme?.showChangeList ?? true;

    if (showHeader) {
      const header = document.createElement('div');
      header.className = `${this.prefix}-header`;
      header.innerHTML = '<strong>HTML Visual Diff</strong>';
      this.root.appendChild(header);
    }

    const summary = document.createElement('div');
    summary.className = `${this.prefix}-summary`;
    if (!showSummary) summary.style.display = 'none';
    this.root.appendChild(summary);

    const changeList = document.createElement('div');
    changeList.className = `${this.prefix}-change-list`;
    if (!showChangeList) changeList.style.display = 'none';
    this.root.appendChild(changeList);

    const layout = document.createElement('div');
    layout.className = `${this.prefix}-layout`;
    this.root.appendChild(layout);

    const oldPane = document.createElement('section');
    oldPane.className = `${this.prefix}-pane ${this.prefix}-old-pane`;
    const newPane = document.createElement('section');
    newPane.className = `${this.prefix}-pane ${this.prefix}-new-pane`;
    this.oldPane = oldPane;
    this.newPane = newPane;

    const oldTitle = document.createElement('div');
    oldTitle.className = `${this.prefix}-pane-title`;
    oldTitle.textContent = this.options.theme?.oldPaneTitle || '旧版本';
    const newTitle = document.createElement('div');
    newTitle.className = `${this.prefix}-pane-title`;
    newTitle.textContent = this.options.theme?.newPaneTitle || '新版本';

    const oldContent = document.createElement('div');
    oldContent.className = `${this.prefix}-content`;
    const newContent = document.createElement('div');
    newContent.className = `${this.prefix}-content`;

    oldPane.append(oldTitle, oldContent);
    newPane.append(newTitle, newContent);
    layout.append(oldPane, newPane);
    return { summary, changeList, oldContent, newContent };
  }

  private renderSummary(summary: HTMLElement): void {
    const insertCount = this.changes.filter((item) => item.type === 'insert').length;
    const deleteCount = this.changes.filter((item) => item.type === 'delete').length;
    const modifyCount = this.changes.filter((item) => item.type === 'modify').length;
    summary.innerHTML = `
      <span class="${this.prefix}-badge ${this.prefix}-badge-insert">新增：${insertCount}</span>
      <span class="${this.prefix}-badge ${this.prefix}-badge-delete">删除：${deleteCount}</span>
      <span class="${this.prefix}-badge ${this.prefix}-badge-modify">修改：${modifyCount}</span>
    `;
  }

  private renderChangeList(changeList: HTMLElement): void {
    if (this.changes.length === 0) {
      changeList.innerHTML = `<span class="${this.prefix}-empty">暂无差异</span>`;
      return;
    }
    changeList.innerHTML = '';
    this.changes.forEach((change, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${this.prefix}-change-item ${this.prefix}-change-item-${change.type}`;
      button.innerHTML = `<span class="${this.prefix}-dot ${this.prefix}-dot-${change.type}"></span><span>${index + 1}. ${change.label}</span>`;
      button.addEventListener('click', () => this.scrollToChange(change.id));
      changeList.appendChild(button);
    });
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
    compareAttributes: options.compareAttributes ?? true,
    ignoreAttributes: new Set(options.ignoreAttributes ?? []),
    ignoreTags: new Set([...DEFAULT_IGNORE_TAGS, ...(options.ignoreTags ?? [])]),
    allowUnsafeHtml: options.allowUnsafeHtml ?? false,
    showPlaceholders: options.theme?.showPlaceholders ?? true,
    getChangeLabel: options.getChangeLabel
  };
}
