import { test } from "node:test";
import assert from "node:assert/strict";
import { demoEvents } from "../src/lib/guru/demo-events";
import { legacyDemoTitle } from "../prisma/demo-event-content";
import { eventHref, readEventFilters, selectEvents } from "../src/lib/guru/event-selectors";

test("six distinct school projects have real milestone content and usable rubric references", () => {
  assert.equal(demoEvents.length, 6);
  assert.equal(new Set(demoEvents.map((event) => event.id)).size, 6);
  assert.equal(new Set(demoEvents.map((event) => event.title)).size, 6);
  for (const event of demoEvents) {
    assert(!/\b(QA|PREUAT|Fix|published)\b|[a-f0-9]{12}/i.test(event.title));
    assert(event.status !== "draft" && event.startAt && event.endAt && event.startAt < event.endAt);
    assert(event.rubricId && event.caseStudyHtml && event.milestones.length > 0);
    for (const milestone of event.milestones) assert(milestone.title && milestone.deadline && milestone.formats);
  }
});

test("six-card default preserves explicit page sizes, filters, detail links and pagination", () => {
  const defaults = readEventFilters(new URLSearchParams());
  assert.equal(defaults.pageSize, 6);
  assert.equal(selectEvents(demoEvents, defaults, []).records.length, 6);
  const four = readEventFilters(new URLSearchParams("size=4"));
  assert.equal(selectEvents(demoEvents, four, []).records.length, 4);
  assert.equal(selectEvents(demoEvents, { ...four, page: 2 }, []).records.length, 2);
  assert.equal(readEventFilters(new URL(eventHref(four), "http://local").searchParams).pageSize, 4);
  assert.equal(selectEvents(demoEvents, { ...defaults, search: "Kantin" }, []).records[0].id, "kantin");
  assert.equal(selectEvents(demoEvents, { ...defaults, status: "upcoming" }, []).records[0].id, "umkm");
});

test("cleanup only renames known fixture IDs still containing test titles", () => {
  assert.equal(legacyDemoTitle({ id: "preuat-123abc", title: "PREUAT Dua Siswa 123abc" }), "Website Pameran Karya Siswa");
  assert.equal(legacyDemoTitle({ id: "real-school-event", title: "Workshop QA Perangkat Lunak" }), undefined);
  assert.equal(legacyDemoTitle({ id: "fix-123abc", title: "Project buatan guru" }), undefined);
  assert.equal(legacyDemoTitle({ id: "fix-123abc", title: "Aplikasi Peminjaman Buku" }), undefined);
});
