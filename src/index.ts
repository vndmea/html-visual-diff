export { HtmlVisualDiffViewer } from './HtmlVisualDiffViewer';
export type { ChangeRecord, DiffSide, DiffType, HtmlVisualDiffRenderOptions, HtmlVisualDiffTheme, HtmlVisualDiffViewerApi } from './types';

import { HtmlVisualDiffViewer } from './HtmlVisualDiffViewer';
import type { HtmlVisualDiffRenderOptions, HtmlVisualDiffViewerApi } from './types';

export function createHtmlVisualDiffViewer(options: HtmlVisualDiffRenderOptions): HtmlVisualDiffViewerApi {
  return new HtmlVisualDiffViewer(options);
}

declare global {
  interface Window {
    HtmlVisualDiff?: {
      HtmlVisualDiffViewer: typeof HtmlVisualDiffViewer;
      createHtmlVisualDiffViewer: typeof createHtmlVisualDiffViewer;
    };
  }
}

if (typeof window !== 'undefined') {
  window.HtmlVisualDiff = { HtmlVisualDiffViewer, createHtmlVisualDiffViewer };
}
