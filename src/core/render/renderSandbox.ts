import { sanitizeHtml } from './sanitizeHtml';
import { waitForRenderReady } from './waitForRenderReady';

export interface RenderInput {
  html: string;
  css?: string;
  baseUrl?: string;
}

export interface RenderOptions {
  viewportWidth?: number;
  waitForImages?: boolean;
  waitForFonts?: boolean;
}

export interface RenderSandboxResult {
  document: Document;
  iframe: HTMLIFrameElement | null;
  dispose: () => void;
}

function rewriteBodySelectors(css: string): string {
  return css
    .replace(/\bhtml\b/g, '.hvd-document-root')
    .replace(/\bbody\b/g, '.hvd-document-root');
}

function absolutizeResourceUrls(doc: Document): void {
  for (const el of Array.from(doc.querySelectorAll<HTMLElement>('[src], [href]'))) {
    if (el.hasAttribute('src')) {
      const img = el as HTMLImageElement;
      if (img.src) el.setAttribute('src', img.src);
    }
    if (el.hasAttribute('href')) {
      const link = el as HTMLAnchorElement;
      if (link.href) el.setAttribute('href', link.href);
    }
  }
}

function createFallbackDocument(input: RenderInput, viewportWidth: number): RenderSandboxResult {
  const doc = document.implementation.createHTMLDocument('');
  doc.open();
  doc.write(`<!doctype html><html><head>${input.baseUrl ? `<base href="${input.baseUrl}">` : ''}<style>html,body{margin:0;width:${viewportWidth}px;min-width:${viewportWidth}px;}</style><style>${input.css || ''}</style></head><body>${sanitizeHtml(input.html)}</body></html>`);
  doc.close();
  absolutizeResourceUrls(doc);
  return {
    document: doc,
    iframe: null,
    dispose: () => undefined
  };
}

export async function renderSandbox(input: RenderInput, options: RenderOptions = {}): Promise<RenderSandboxResult> {
  const viewportWidth = options.viewportWidth ?? 960;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-same-origin');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.style.position = 'absolute';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = `${viewportWidth}px`;
  iframe.style.height = '1px';
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return createFallbackDocument(input, viewportWidth);
  }

  doc.open();
  doc.write(`<!doctype html><html><head>${input.baseUrl ? `<base href="${input.baseUrl}">` : ''}<style>html,body{margin:0;width:${viewportWidth}px;min-width:${viewportWidth}px;overflow-wrap:anywhere;}img{max-width:100%;}</style><style>${input.css || ''}</style></head><body>${sanitizeHtml(input.html)}</body></html>`);
  doc.close();

  absolutizeResourceUrls(doc);
  await waitForRenderReady(doc, {
    waitForFonts: options.waitForFonts,
    waitForImages: options.waitForImages
  });

  return {
    document: doc,
    iframe,
    dispose: () => iframe.remove()
  };
}

export { rewriteBodySelectors };
