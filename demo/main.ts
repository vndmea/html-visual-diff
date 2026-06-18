import { createHtmlVisualDiff } from '../src';
import '../src/style.css';

const oldHtml = `<main class="report">
  <section id="overview" class="chunk">
    <h2>Overview</h2>
    <p>Shipment planning is on track for the June batch.</p>
  </section>
  <section id="operations" class="chunk">
    <h2>Operations</h2>
    <p>The warehouse team completed intake, labeling, and lane balancing by noon.</p>
  </section>
  <section id="risks" class="chunk">
    <h2>Risks</h2>
    <p>Two vendors still need approval for their updated packaging measurements.</p>
  </section>
  <section id="follow-up" class="chunk">
    <h2>Follow-up</h2>
    <p>Procurement will confirm the remaining SKUs after tomorrow's review.</p>
  </section>
  <section id="carrier-notes" class="chunk">
    <h2>Carrier Notes</h2>
    <p>The inland handoff remains stable and trailer assignments were locked before the afternoon cut-off.</p>
  </section>
  <section id="inventory" class="chunk">
    <h2>Inventory</h2>
    <p>Cycle counts for the priority aisles matched the planning baseline with no variance exceptions.</p>
  </section>
  <section id="escalations" class="chunk">
    <h2>Escalations</h2>
    <p>No additional escalations were opened after the morning operations review.</p>
  </section>
  <section id="dispatch-window" class="chunk">
    <h2>Dispatch Window</h2>
    <p>The dispatch window remains unchanged and the final release signal is expected tomorrow afternoon.</p>
  </section>
</main>`;

const newHtml = `<main class="report">
  <section id="overview" class="chunk">
    <h2>Overview</h2>
    <p>Shipment planning is on track for the June batch, with the coastal route prioritized first.</p>
  </section>
  <section id="new-escalation" class="chunk notice">
    <h2>New Escalation</h2>
    <p>A temporary carrier capacity dip introduced a routing review for oversized cartons.</p>
    <p>The team added a manual checkpoint to validate pallet heights before dispatch.</p>
  </section>
  <section id="operations" class="chunk">
    <h2>Operations</h2>
    <p>The warehouse team completed intake, labeling, lane balancing, and additional late-arrival sorting by noon.</p>
  </section>
  <section id="risks" class="chunk">
    <h2>Risks</h2>
    <p>Two vendors still need approval for their updated packaging measurements, and one customs code needs revalidation.</p>
  </section>
  <section id="follow-up" class="chunk">
    <h2>Follow-up</h2>
    <p>Procurement will confirm the remaining SKUs after tomorrow's review, then publish the revised ship window.</p>
  </section>
  <section id="carrier-notes" class="chunk">
    <h2>Carrier Notes</h2>
    <p>The inland handoff remains stable, but two oversized loads were reassigned to a later departure sequence.</p>
    <p>Dispatch supervisors added a manual checkpoint for pallet height photos before sealing each truck.</p>
  </section>
  <section id="inventory" class="chunk">
    <h2>Inventory</h2>
    <p>Cycle counts for the priority aisles matched the planning baseline, though one reserve lane needs a recount after relabeling.</p>
  </section>
  <section id="escalations" class="chunk notice">
    <h2>Escalations</h2>
    <p>A packaging variance triggered an additional review with the compliance team and the destination warehouse.</p>
    <p>Updated carton dimensions will be published once the vendor confirms the final sample batch.</p>
  </section>
  <section id="dispatch-window" class="chunk">
    <h2>Dispatch Window</h2>
    <p>The dispatch window remains unchanged for standard loads, while the oversized group moved to the next release wave.</p>
  </section>
</main>`;

const oldCss = `.report {
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
}`;

const newCss = `.report {
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
}`;

void createHtmlVisualDiff({
  container: '#viewer',
  old: {
    html: oldHtml,
    css: oldCss
  },
  new: {
    html: newHtml,
    css: newCss
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
