import { createHtmlVisualDiff } from '../src';
import '../src/style.css';

interface DemoScenario {
  id: string;
  label: string;
  description: string;
  oldHtml: string;
  newHtml: string;
  oldCss: string;
  newCss: string;
}

const scenarios: DemoScenario[] = [
  {
    id: 'css-only',
    label: 'Same HTML, Different CSS',
    description:
      '同一份 HTML，只调整配色、字号、边框和布局密度，用来观察 style-changed / size-changed / layout-changed 的渲染高亮。',
    oldHtml: `<article class="card-stack">
  <section class="card hero">
    <p class="eyebrow">Status</p>
    <h1>Release Readiness</h1>
    <p>The launch checklist is stable and all integration tests passed overnight.</p>
  </section>
  <section class="card metrics">
    <div><strong>42</strong><span>scenarios</span></div>
    <div><strong>7</strong><span>regions</span></div>
    <div><strong>99.2%</strong><span>uptime</span></div>
  </section>
</article>`,
    newHtml: `<article class="card-stack">
  <section class="card hero">
    <p class="eyebrow">Status</p>
    <h1>Release Readiness</h1>
    <p>The launch checklist is stable and all integration tests passed overnight.</p>
  </section>
  <section class="card metrics">
    <div><strong>42</strong><span>scenarios</span></div>
    <div><strong>7</strong><span>regions</span></div>
    <div><strong>99.2%</strong><span>uptime</span></div>
  </section>
</article>`,
    oldCss: `.card-stack {
  display: grid;
  gap: 14px;
  padding: 24px;
  background: #f8fafc;
  color: #0f172a;
}

.card {
  padding: 18px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  background: #ffffff;
}

.hero h1 {
  margin: 8px 0 10px;
  font-size: 32px;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 12px;
  color: #64748b;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metrics div {
  display: grid;
  gap: 4px;
}

.metrics strong {
  font-size: 28px;
}`,
    newCss: `.card-stack {
  display: grid;
  gap: 20px;
  padding: 30px;
  background: linear-gradient(180deg, #ecfeff 0%, #eef2ff 100%);
  color: #111827;
}

.card {
  padding: 22px 24px;
  border: 1px solid #7dd3fc;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.12);
}

.hero h1 {
  margin: 10px 0 14px;
  font-size: 38px;
  color: #0f766e;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 11px;
  color: #0f766e;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metrics div {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(191, 219, 254, 0.35);
}

.metrics strong {
  font-size: 34px;
}`
  },
  {
    id: 'html-only',
    label: 'Same CSS, Different HTML',
    description:
      '保持 CSS 不变，只修改标题、文本和列表项，适合观察 text-changed、inserted、deleted 以及细粒度文本高亮。',
    oldHtml: `<article class="brief">
  <h1>Gardenia</h1>
  <p>Gardenia is a fragrant flower with glossy leaves.</p>
  <ul>
    <li>Water regularly</li>
    <li>Keep in partial shade</li>
  </ul>
</article>`,
    newHtml: `<article class="brief">
  <h1>Gardenia Flower</h1>
  <p>Gardenia is a highly fragrant white flower with glossy leaves.</p>
  <ul>
    <li>Water regularly</li>
    <li>Keep in bright indirect light</li>
    <li>Use acidic soil</li>
  </ul>
</article>`,
    oldCss: `.brief {
  max-width: 720px;
  padding: 24px;
  border: 1px solid #dbe2ea;
  border-radius: 18px;
  background: #ffffff;
  color: #102a43;
}

.brief h1 {
  margin: 0 0 12px;
  font-size: 30px;
}

.brief p {
  margin: 0 0 14px;
  line-height: 1.7;
}

.brief ul {
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
}`,
    newCss: `.brief {
  max-width: 720px;
  padding: 24px;
  border: 1px solid #dbe2ea;
  border-radius: 18px;
  background: #ffffff;
  color: #102a43;
}

.brief h1 {
  margin: 0 0 12px;
  font-size: 30px;
}

.brief p {
  margin: 0 0 14px;
  line-height: 1.7;
}

.brief ul {
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
}`
  },
  {
    id: 'alignment-scroll',
    label: 'Block Insertions And Scroll Sync',
    description:
      '左右都包含多段 block，其中一侧新增整块说明和更长的内容。这个场景主要看 spacer 对齐和同屏滚动时位置是否稳定。',
    oldHtml: `<main class="report">
  <section class="chunk"><h2>Overview</h2><p>Shipment planning is on track for the June batch.</p></section>
  <section class="chunk"><h2>Operations</h2><p>The warehouse team completed intake, labeling, and lane balancing by noon.</p></section>
  <section class="chunk"><h2>Risks</h2><p>Two vendors still need approval for their updated packaging measurements.</p></section>
  <section class="chunk"><h2>Follow-up</h2><p>Procurement will confirm the remaining SKUs after tomorrow's review.</p></section>
</main>`,
    newHtml: `<main class="report">
  <section class="chunk"><h2>Overview</h2><p>Shipment planning is on track for the June batch, with the coastal route prioritized first.</p></section>
  <section class="chunk notice"><h2>New Escalation</h2><p>A temporary carrier capacity dip introduced a routing review for oversized cartons.</p><p>The team added a manual checkpoint to validate pallet heights before dispatch.</p></section>
  <section class="chunk"><h2>Operations</h2><p>The warehouse team completed intake, labeling, lane balancing, and additional late-arrival sorting by noon.</p></section>
  <section class="chunk"><h2>Risks</h2><p>Two vendors still need approval for their updated packaging measurements, and one customs code needs revalidation.</p></section>
  <section class="chunk"><h2>Follow-up</h2><p>Procurement will confirm the remaining SKUs after tomorrow's review, then publish the revised ship window.</p></section>
</main>`,
    oldCss: `.report {
  display: grid;
  gap: 18px;
  padding: 26px;
  background: #f8fafc;
}

.chunk {
  padding: 18px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #dbe2ea;
  color: #0f172a;
}

.chunk h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.chunk p {
  margin: 0;
  line-height: 1.75;
}`,
    newCss: `.report {
  display: grid;
  gap: 18px;
  padding: 26px;
  background: #f8fafc;
}

.chunk {
  padding: 18px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #dbe2ea;
  color: #0f172a;
}

.chunk.notice {
  border-color: #f59e0b;
  background: #fff7ed;
}

.chunk h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.chunk p {
  margin: 0;
  line-height: 1.75;
}

.chunk p + p {
  margin-top: 10px;
}`
  }
];

const scenarioSelect = document.querySelector<HTMLSelectElement>('#scenario')!;
const scenarioDescription = document.querySelector<HTMLElement>('#scenarioDescription')!;
const oldHtml = document.querySelector<HTMLTextAreaElement>('#oldHtml')!;
const newHtml = document.querySelector<HTMLTextAreaElement>('#newHtml')!;
const oldCss = document.querySelector<HTMLTextAreaElement>('#oldCss')!;
const newCss = document.querySelector<HTMLTextAreaElement>('#newCss')!;
const compare = document.querySelector<HTMLButtonElement>('#compare')!;

let currentViewer: Awaited<ReturnType<typeof createHtmlVisualDiff>> | null = null;

for (const scenario of scenarios) {
  const option = document.createElement('option');
  option.value = scenario.id;
  option.textContent = scenario.label;
  scenarioSelect.appendChild(option);
}

function findScenario(id: string): DemoScenario {
  return scenarios.find((scenario) => scenario.id === id) || scenarios[0];
}

function applyScenario(scenario: DemoScenario): void {
  scenarioSelect.value = scenario.id;
  scenarioDescription.textContent = scenario.description;
  oldHtml.value = scenario.oldHtml;
  newHtml.value = scenario.newHtml;
  oldCss.value = scenario.oldCss;
  newCss.value = scenario.newCss;
}

async function render(): Promise<void> {
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

scenarioSelect.addEventListener('change', () => {
  applyScenario(findScenario(scenarioSelect.value));
  void render();
});

compare.addEventListener('click', () => {
  void render();
});

applyScenario(scenarios[0]);
void render();
