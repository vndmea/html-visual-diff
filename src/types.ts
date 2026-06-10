export type DiffSide = 'old' | 'new';
export type DiffType = 'equal' | 'insert' | 'delete' | 'modify' | 'placeholder';
export type TextDiffGranularity = 'char' | 'word';

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
