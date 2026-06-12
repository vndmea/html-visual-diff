import { createHtmlVisualDiffViewer } from '../src';
import '../src/style.css';

const oldHtml = document.querySelector<HTMLTextAreaElement>('#oldHtml')!;
const newHtml = document.querySelector<HTMLTextAreaElement>('#newHtml')!;
const compare = document.querySelector<HTMLButtonElement>('#compare')!;
const granularitySelect = document.querySelector<HTMLSelectElement>('#textDiffGranularity')!;

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

function render(){
  createHtmlVisualDiffViewer({
    el:'#viewer',
    oldHtml:oldHtml.value,
    newHtml:newHtml.value,
    matchThreshold:0.58,
    inlineTextDiff:true,
    textDiffGranularity: (granularitySelect.value as 'word' | 'char') || 'word',
    compareAttributes:true,
    syncScroll:true,
    ignoreAttributes:['data-v-app'],
    theme:{showPlaceholders:true}
  });
}
compare.addEventListener('click',render);
granularitySelect?.addEventListener('change',render);
render();
