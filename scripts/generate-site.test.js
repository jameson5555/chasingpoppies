const assert = require("node:assert/strict");
const { test } = require("node:test");
const { validate, isArchived, eventJsonLd, detailPage, showsPage } = require("./generate-site");
const events = require("../src/data/events.json");

const paidShow = events.find(event => event.slug === "return-of-chasing-poppies-2026");
const freeShow = events.find(event => event.price === 0);

test("all published shows have parsable markup and their recorded admission prices", () => {
  validate(events);
  for (const event of events) {
    const html = detailPage(event);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(data["@type"], "MusicEvent");
    assert.equal(data.offers.price, event.price);
    assert.equal(data.offers.priceCurrency, "USD");
    assert.equal(data.isAccessibleForFree, event.price === 0);
    assert.equal(data.startDate, event.startDate);
    assert.equal(data.endDate, event.endDate);
    assert.equal(data.organizer?.name, event.organizer?.name);
    assert.ok(html.includes(`<link rel="canonical" href="${data.url}">`));
    assert.ok(html.includes(event.streetAddress));
    assert.ok(html.includes(`<title>${event.name.replace(/&/g, "&amp;")}`));
    assert.ok(html.match(/<title>(.*?)<\/title>/)[1].includes("Chasing Poppies"));
    assert.ok(html.includes(event.dateLabel));
  }
  assert.equal(eventJsonLd(freeShow).offers.price, 0);
});

test("unknown details and unverified ticket availability are not invented", () => {
  const event = { ...paidShow };
  delete event.organizer;
  delete event.endDate;
  const data = eventJsonLd(event);
  assert.equal(data.organizer, undefined);
  assert.equal(data.endDate, undefined);
  assert.equal(data.offers.url, undefined);
  assert.equal(data.offers.availability, undefined);
  assert.equal(data.offers.validFrom, undefined);
  assert.ok(!detailPage(event).includes("<dt>Organizer</dt>"));
  assert.ok(!detailPage(event).includes("<dt>Ends</dt>"));
});

test("verified ticket URLs appear in both markup and a visible purchase link", () => {
  const event = { ...paidShow, ticketUrl: "https://example.com/tickets/show" };
  validate([event]);
  assert.equal(eventJsonLd(event).offers.url, event.ticketUrl);
  assert.ok(detailPage(event).includes(`href="${event.ticketUrl}" target="_blank" rel="noopener noreferrer">Tickets`));
});

test("December's published estimated finish stays labeled approximate", () => {
  const event = events.find(item => item.slug === "az-winter-bliss-local-showcase-2026");
  assert.equal(eventJsonLd(event).endDate, "2026-12-19T23:00:00-07:00");
  assert.ok(detailPage(event).includes('About <time datetime="2026-12-19T23:00:00-07:00">11:00 PM</time>'));
});

test("ongoing and overnight shows stay listed until their end", () => {
  const event = { ...paidShow, endDate: "2026-11-22T01:00:00-07:00" };
  validate([event]);
  assert.equal(isArchived(event, Date.parse("2026-11-21T21:00:00-07:00")), false);
  assert.equal(isArchived(event, Date.parse("2026-11-22T00:30:00-07:00")), false);
  assert.equal(isArchived(event, Date.parse("2026-11-22T01:01:00-07:00")), true);
  assert.ok(detailPage(event).includes("1:00 AM (next day)"));
  const noEnd = { ...paidShow };
  delete noEnd.endDate;
  assert.equal(isArchived(noEnd, Date.parse("2026-11-21T23:00:00-07:00")), false);
  assert.equal(isArchived(noEnd, Date.parse("2026-11-22T00:00:00-07:00")), true);
});

test("invalid times, prices, and organizer or ticket URLs fail before publication", () => {
  for (const startDate of ["2026-11-21T20:00:00", "2026-02-30T20:00:00-07:00", "2026-11-21T24:00:00-07:00"]) {
    assert.throws(() => validate([{ ...paidShow, startDate }]), /Invalid startDate/);
  }
  assert.throws(() => validate([{ ...paidShow, endDate: paidShow.startDate }]), /endDate must be after/);
  assert.throws(() => validate([{ ...paidShow, endDate: "unknown" }]), /Invalid endDate/);
  for (const price of [-1, "10", NaN, Infinity]) {
    assert.throws(() => validate([{ ...paidShow, price }]), /Invalid admission price/);
  }
  assert.throws(() => validate([{ ...paidShow, organizer: {} }]), /Organizer must have a name/);
  assert.throws(() => validate([{ ...paidShow, organizer: { name: "Promoter", url: "javascript:alert(1)" } }]), /Invalid organizer or ticket URL/);
  assert.throws(() => validate([{ ...paidShow, ticketUrl: "not a URL" }]), /Invalid organizer or ticket URL/);
  assert.throws(() => validate([{ ...paidShow, endDate: undefined, endTimeApproximate: true }]), /endTimeApproximate requires/);
});

test("organizer text is escaped in HTML and cannot break the JSON-LD script", () => {
  const event = { ...paidShow, organizer: { name: '</script><script>alert("x")</script>' } };
  const html = detailPage(event);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  assert.equal(scripts.length, 2);
  assert.equal(JSON.parse(scripts[0][1]).organizer.name, event.organizer.name);
  assert.ok(!html.includes(event.organizer.name));
  assert.ok(html.includes("&lt;/script&gt;&lt;script&gt;"));
});

test("shows index distinguishes upcoming dates from past shows and links to each event", () => {
  const html = showsPage(Date.parse("2026-11-09T12:00:00-07:00"));
  const data = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  assert.deepEqual(data.map(item => item["@type"]), ["CollectionPage", "BreadcrumbList"]);
  assert.equal(data[0].mainEntity.numberOfItems, 2);
  assert.deepEqual(data[0].mainEntity.itemListElement.map(item => item.url), [
    "https://chasingpoppies.com/shows/return-of-chasing-poppies-2026/",
    "https://chasingpoppies.com/shows/az-winter-bliss-local-showcase-2026/"
  ]);
  const past = html.slice(html.indexOf('<ul class="shows-archive">'));
  assert.equal((past.match(/<li>/g) || []).length, 3);
  assert.ok(!past.includes("return-of-chasing-poppies-2026"));
  assert.ok(past.indexOf("king-cherry-ep-release-2025") < past.indexOf("arizona-bike-week-2025"));
  for (const event of events) assert.ok(html.includes(`href="/shows/${event.slug}/"`));
});

test("shows index provides an honest empty state after the last event", () => {
  const html = showsPage(Date.parse("2027-01-01T00:00:00-07:00"));
  assert.ok(html.includes("No upcoming shows announced yet"));
  assert.ok(!html.includes('<span class="stamp">Upcoming</span>'));
  assert.equal((html.match(/<li>/g) || []).length, events.length);
});

test("event breadcrumbs match the visible hierarchy and preserve MusicEvent as the primary markup", () => {
  const html = detailPage(paidShow);
  const [event, breadcrumb] = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  assert.equal(event["@type"], "MusicEvent");
  assert.equal(breadcrumb["@type"], "BreadcrumbList");
  assert.deepEqual(breadcrumb.itemListElement.map(item => item.position), [1, 2, 3]);
  assert.equal(breadcrumb.itemListElement[2].item, event.url);
  assert.ok(html.includes('aria-label="Breadcrumb"><a href="/">Home</a>'));
  assert.ok(html.includes('href="/shows/">Shows</a>'));
});
