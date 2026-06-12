import { createHtmlVisualDiff } from '../src';
import '../src/style.css';

const oldHtml = document.querySelector<HTMLTextAreaElement>('#oldHtml')!;
const newHtml = document.querySelector<HTMLTextAreaElement>('#newHtml')!;
const oldCss = document.querySelector<HTMLTextAreaElement>('#oldCss')!;
const newCss = document.querySelector<HTMLTextAreaElement>('#newCss')!;
const compare = document.querySelector<HTMLButtonElement>('#compare')!;
let currentViewer: Awaited<ReturnType<typeof createHtmlVisualDiff>> | null = null;

oldHtml.value = `<article class="topic">
  <h1>Gardenia</h1>
  <p>Gardenia is a fragrant flower.</p>
  <section><h2>Care</h2><p>Water the plant regularly and keep it in partial shade.</p><ul><li>Water regularly</li><li>Keep in partial shade</li></ul></section>
</article>`;

newHtml.value = `<article class="topic updated">
  <h1>Gardenia Flower</h1>
  <p>Gardenia is a highly fragrant white flower.</p>
  <section><h2>Care Guide</h2><p>Water the plant regularly and keep it in bright indirect light.</p><ul><li>Water regularly</li><li>Keep in bright indirect light</li><li>Use acidic soil</li></ul></section>
  <aside><strong>Tip:</strong> Avoid cold drafts.</aside>
</article>`;

oldCss.value = `.topic {
  padding: 20px;
  background: #ffffff;
  color: #102a43;
}

.topic h1 {
  margin: 0 0 12px;
  font-size: 28px;
}

.topic section {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #dbe2ea;
}`;

newCss.value = `.topic {
  padding: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  color: #1f2937;
}

.topic h1 {
  margin: 0 0 12px;
  font-size: 32px;
  color: #0f766e;
}

.topic section {
  margin-top: 12px;
  padding: 16px;
  border: 1px solid #99f6e4;
  background: rgba(204, 251, 241, 0.35);
}

.topic aside {
  margin-top: 14px;
  padding: 10px 12px;
  background: #fef3c7;
}`;

async function render() {
  currentViewer?.destroy();
  currentViewer = await createHtmlVisualDiff({
    container: '#viewer',
    old: {
      html: oldHtml.value,
      css: oldCss.value
    },
    new: {
      html: newHtml.value,
      css: newCss.value
    },
    options: {
      viewportWidth: 960,
      syncScroll: true,
      align: true,
      compareText: true,
      compareStyle: true,
      compareLayout: true
    }
  });
}
compare.addEventListener('click', () => {
  void render();
});
void render();
