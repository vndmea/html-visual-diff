export { createHtmlVisualDiff } from './viewer/createHtmlVisualDiff';
export type {
  CreateHtmlVisualDiffOptions,
  HtmlVisualDiffOptions,
  HtmlVisualDiffSource,
  HtmlVisualDiffViewer
} from './types';

import { createHtmlVisualDiff } from './viewer/createHtmlVisualDiff';

declare global {
  interface Window {
    HtmlVisualDiff?: {
      createHtmlVisualDiff: typeof createHtmlVisualDiff;
    };
  }
}

if (typeof window !== 'undefined') {
  window.HtmlVisualDiff = { createHtmlVisualDiff };
}
