export { TwoPaneViewer } from './viewer/TwoPaneViewer';
export { createHtmlVisualDiff } from './viewer/createHtmlVisualDiff';
export type {
  CreateHtmlVisualDiffOptions,
  HtmlVisualDiffOptions,
  HtmlVisualDiffSource,
  HtmlVisualDiffViewer
} from './types';

import { TwoPaneViewer } from './viewer/TwoPaneViewer';
import { createHtmlVisualDiff } from './viewer/createHtmlVisualDiff';

declare global {
  interface Window {
    HtmlVisualDiff?: {
      TwoPaneViewer: typeof TwoPaneViewer;
      createHtmlVisualDiff: typeof createHtmlVisualDiff;
    };
  }
}

if (typeof window !== 'undefined') {
  window.HtmlVisualDiff = { TwoPaneViewer, createHtmlVisualDiff };
}
