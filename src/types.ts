export type DiffSide = 'old' | 'new';
export type DiffType = 'equal' | 'insert' | 'delete' | 'modify' | 'placeholder';
export type TextDiffGranularity = 'char' | 'word';

export interface HtmlVisualDiffSource {
  html: string;
  css?: string;
  baseUrl?: string;
}

export interface HtmlVisualDiffOptions {
  viewportWidth?: number;
  syncScroll?: boolean;
  align?: boolean;
  compareText?: boolean;
  compareStyle?: boolean;
  compareLayout?: boolean;
  layoutThreshold?: number;
}

export interface ResolvedViewerOptions {
  viewportWidth: number;
  syncScroll: boolean;
  align: boolean;
  compareText: boolean;
  compareStyle: boolean;
  compareLayout: boolean;
  layoutThreshold: number;
}

export interface CreateHtmlVisualDiffOptions {
  container: string | HTMLElement;
  old: HtmlVisualDiffSource;
  new: HtmlVisualDiffSource;
  options?: HtmlVisualDiffOptions;
}

export interface HtmlVisualDiffViewer {
  root: HTMLElement;
  destroy(): void;
  refresh(): Promise<void>;
}

// Legacy internal types kept for compatibility with older modules that still
// live in the repository but are no longer part of the primary public API.
export interface ChangeRecord {
  id: string;
  type: Exclude<DiffType, 'equal' | 'placeholder'>;
  label: string;
  oldPath?: string;
  newPath?: string;
  oldText?: string;
  newText?: string;
}

export interface HtmlVisualDiffTheme {
  classPrefix?: string;
  rootClassName?: string;
  showPlaceholders?: boolean;
}

export interface HtmlVisualDiffRenderOptions {
  oldHtml: string;
  newHtml: string;
  el: string | HTMLElement;
  mode?: 'rendered';
  matchThreshold?: number;
  textModifyThreshold?: number;
  inlineTextDiff?: boolean;
  textDiffGranularity?: TextDiffGranularity;
  ignoreAttributes?: string[];
  ignoreTags?: string[];
  compareAttributes?: boolean;
  syncScroll?: boolean;
  allowUnsafeHtml?: boolean;
  getChangeLabel?: (record: Omit<ChangeRecord, 'id'>) => string;
  onRender?: (api: HtmlVisualDiffViewerApi) => void;
  onChangeSelect?: (change: ChangeRecord) => void;
  theme?: HtmlVisualDiffTheme;
}

export interface HtmlVisualDiffViewerApi {
  root: HTMLElement;
  oldPane: HTMLElement;
  newPane: HTMLElement;
  changes: ChangeRecord[];
  scrollToChange: (idOrIndex: string | number) => void;
  destroy: () => void;
}

export interface NormalizedDiffOptions {
  matchThreshold: number;
  textModifyThreshold: number;
  inlineTextDiff: boolean;
  textDiffGranularity: TextDiffGranularity;
  compareAttributes: boolean;
  ignoreAttributes: Set<string>;
  ignoreTags: Set<string>;
  allowUnsafeHtml: boolean;
  showPlaceholders: boolean;
  getChangeLabel?: HtmlVisualDiffRenderOptions['getChangeLabel'];
}
