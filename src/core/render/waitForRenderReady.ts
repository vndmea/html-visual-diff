interface WaitForRenderReadyOptions {
  waitForFonts?: boolean;
  waitForImages?: boolean;
  timeoutMs?: number;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | undefined> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(undefined), timeoutMs);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }).catch(() => {
      clearTimeout(timer);
      resolve(undefined);
    });
  });
}

function waitForImages(doc: Document, timeoutMs: number): Promise<void> {
  const images = Array.from(doc.images || []);
  return Promise.all(images.map((img) => withTimeout(new Promise<void>((resolve) => {
    if (img.complete) {
      resolve();
      return;
    }
    const done = () => resolve();
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  }), timeoutMs))).then(() => undefined);
}

function waitForStylesheets(doc: Document, timeoutMs: number): Promise<void> {
  const stylesheets = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  return Promise.all(stylesheets.map((link) => withTimeout(new Promise<void>((resolve) => {
    const sheet = link.sheet;
    if (sheet) {
      resolve();
      return;
    }

    const done = () => resolve();
    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });
  }), timeoutMs))).then(() => undefined);
}

export async function waitForRenderReady(
  doc: Document,
  options: WaitForRenderReadyOptions = {}
): Promise<void> {
  const {
    waitForFonts = true,
    waitForImages: shouldWaitForImages = true,
    timeoutMs = 1500
  } = options;

  if (doc.readyState === 'loading') {
    await withTimeout(new Promise<void>((resolve) => {
      doc.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    }), timeoutMs);
  }

  await waitForStylesheets(doc, timeoutMs);

  const fontAwareDoc = doc as Document & { fonts?: { ready?: Promise<unknown> } };
  if (waitForFonts && fontAwareDoc.fonts?.ready) {
    await withTimeout(fontAwareDoc.fonts.ready, timeoutMs);
  }

  if (shouldWaitForImages) {
    await waitForImages(doc, timeoutMs);
  }

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
