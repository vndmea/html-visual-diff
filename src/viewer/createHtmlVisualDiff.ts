import { TwoPaneViewer } from './TwoPaneViewer';
import type { CreateHtmlVisualDiffOptions, HtmlVisualDiffViewer } from '../types';

export async function createHtmlVisualDiff(options: CreateHtmlVisualDiffOptions): Promise<HtmlVisualDiffViewer> {
  const viewer = new TwoPaneViewer(options);
  await viewer.refresh();
  return viewer;
}
