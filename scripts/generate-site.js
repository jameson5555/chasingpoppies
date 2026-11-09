const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const eventsPath = path.join(root, "src/data/events.json");
const events = JSON.parse(fs.readFileSync(eventsPath, "utf8"));
const required = [
  "slug", "name", "dateLabel", "month", "day", "year", "timeLabel",
  "startDate", "venue", "city", "state", "streetAddress", "postalCode",
  "description", "admission", "price", "age", "flyer", "flyerWidth",
  "flyerHeight", "flyerAlt", "thumbnail", "thumbnailWidth", "thumbnailHeight",
  "mapUrl", "eventUrl"
];

function validate(eventList = events) {
  const slugs = new Set();

  eventList.forEach((event, index) => {
    required.forEach(key => {
      if (event[key] === undefined || event[key] === null || event[key] === "") {
        throw new Error(`Event ${index + 1} is missing ${key}`);
      }
    });

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug)) {
      throw new Error(`Invalid event slug: ${event.slug}`);
    }
    if (slugs.has(event.slug)) {
      throw new Error(`Duplicate event slug: ${event.slug}`);
    }
    validateDate(event.startDate, "startDate", event.slug);
    if (event.endDate !== undefined) {
      validateDate(event.endDate, "endDate", event.slug);
      if (Date.parse(event.endDate) <= Date.parse(event.startDate)) {
        throw new Error(`endDate must be after startDate for ${event.slug}`);
      }
    }
    if (event.endTimeApproximate !== undefined &&
        (typeof event.endTimeApproximate !== "boolean" || !event.endDate)) {
      throw new Error(`endTimeApproximate requires an endDate and a boolean for ${event.slug}`);
    }
    if (typeof event.price !== "number" || !Number.isFinite(event.price) || event.price < 0) {
      throw new Error(`Invalid admission price for ${event.slug}`);
    }
    if (event.organizer !== undefined) {
      if (!event.organizer || typeof event.organizer.name !== "string" || !event.organizer.name.trim()) {
        throw new Error(`Organizer must have a name for ${event.slug}`);
      }
      if (event.organizer.url !== undefined) validateUrl(event.organizer.url, event.slug);
    }
    if (event.ticketUrl !== undefined) validateUrl(event.ticketUrl, event.slug);
    if (!event.flyer.startsWith("/images/")) {
      throw new Error(`Flyer must be in /images for ${event.slug}`);
    }
    slugs.add(event.slug);
  });
}

function validateDate(value, field, slug) {
  // A known show time must include its local UTC offset; never guess midnight.
  const match = typeof value === "string" && value.match(/^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d)(Z|[+-]\d{2}:\d{2})$/);
  if (!match || Number.isNaN(Date.parse(value)) ||
      new Date(`${match[1]}T00:00:00Z`).toISOString().slice(0, 10) !== match[1]) {
    throw new Error(`Invalid ${field} (use ISO 8601 with a timezone) for ${slug}`);
  }
}

function validateUrl(value, slug) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid protocol");
  } catch (error) {
    throw new Error(`Invalid organizer or ticket URL for ${slug}`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isArchived(event, now = Date.now()) {
  // Keep an ongoing show listed until its confirmed end, or the end of its local day.
  const end = event.endDate || `${event.startDate.slice(0, 10)}T23:59:59${event.startDate.slice(19)}`;
  return Date.parse(end) < now;
}

function localTime(value) {
  // Read the supplied local time, independent of the build server's timezone.
  const hour = Number(value.slice(11, 13));
  return `${hour % 12 || 12}:${value.slice(14, 16)} ${hour < 12 ? "AM" : "PM"}`;
}

function eventJsonLd(event) {
  const data = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    "@id": `https://chasingpoppies.com/shows/${event.slug}/#event`,
    name: event.name,
    description: event.description,
    image: [`https://chasingpoppies.com${event.flyer}`],
    startDate: event.startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.streetAddress,
        addressLocality: event.city,
        addressRegion: event.state,
        postalCode: event.postalCode,
        addressCountry: "US"
      }
    },
    performer: {
      "@type": "MusicGroup",
      "@id": "https://chasingpoppies.com/#band",
      name: "Chasing Poppies"
    },
    isAccessibleForFree: event.price === 0,
    offers: {
      "@type": "Offer",
      name: event.admission,
      price: event.price,
      priceCurrency: "USD"
    },
    url: `https://chasingpoppies.com/shows/${event.slug}/`
  };

  if (event.endDate) data.endDate = event.endDate;
  if (event.organizer) {
    data.organizer = { "@type": "Organization", name: event.organizer.name };
    if (event.organizer.url) data.organizer.url = event.organizer.url;
  }
  // Event-info links aren't necessarily ticket purchase pages.
  if (event.ticketUrl) data.offers.url = event.ticketUrl;
  return data;
}

function card(event) {
  const venueLabel = event.venueLabel || event.venue;
  return `
<article class="show-card">
  <div class="show-card__date" aria-label="${escapeHtml(event.dateLabel)}">
    <span>${escapeHtml(event.month)}</span>
    <strong>${escapeHtml(event.day)}</strong>
    <span>${escapeHtml(event.year)}</span>
  </div>
  <div class="show-card__body">
    <div class="show-card__meta">
      <span class="stamp">Upcoming</span>
      <span>${escapeHtml(event.timeLabel)}</span>
    </div>
    <h3><a href="/shows/${event.slug}/">${escapeHtml(event.name)}</a></h3>
    <p class="show-card__venue">${escapeHtml(venueLabel)} · ${escapeHtml(event.city)}, ${escapeHtml(event.state)}</p>
    <p>${escapeHtml(event.description)}</p>
    <div class="show-card__details">
      <span>${escapeHtml(event.admission)}</span>
      <span>${escapeHtml(event.age)}</span>
    </div>
    <div class="show-card__actions">
      <a href="/shows/${event.slug}/">Show details</a>
      <a href="${escapeHtml(event.eventUrl)}" target="_blank" rel="noopener noreferrer">Event page <span aria-hidden="true">↗</span></a>
      <a href="${escapeHtml(event.mapUrl)}" target="_blank" rel="noopener noreferrer">Venue map <span aria-hidden="true">↗</span></a>
    </div>
  </div>
  <a class="show-card__flyer" href="/shows/${event.slug}/" aria-label="View details for ${escapeHtml(event.name)}">
    <img src="${escapeHtml(event.thumbnail)}" width="${event.thumbnailWidth}" height="${event.thumbnailHeight}" loading="lazy" alt="${escapeHtml(event.flyerAlt)}">
  </a>
</article>`;
}

function generateSource() {
  const upcomingEvents = events
    .filter(event => !isArchived(event))
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
  const output = `${upcomingEvents.map(card).join("\n")}\n`;
  const target = path.join(root, "src/views/components/generated/events.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, output);
}

function detailPage(event) {
  const canonical = `https://chasingpoppies.com/shows/${event.slug}/`;
  const venueLabel = event.venueLabel || event.venue;
  const eventTitle = event.name.includes("Chasing Poppies") ? event.name : `${event.name} — Chasing Poppies`;
  const title = `${eventTitle} | ${venueLabel} | ${event.dateLabel}`;
  const description = `Chasing Poppies at ${event.venue} in ${event.city}, ${event.state}, ${event.dateLabel}. ${event.timeLabel.replace(/^.*? · /, "")}. ${event.admission}. ${event.age}.`;
  const structuredData = JSON.stringify(eventJsonLd(event)).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#080808">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/images/skull-poppies.png">
  <link rel="stylesheet" href="/index.css">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Chasing Poppies">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://chasingpoppies.com${escapeHtml(event.flyer)}">
  <meta property="og:image:alt" content="${escapeHtml(event.flyerAlt)}">
  <meta property="og:image:width" content="${event.flyerWidth}">
  <meta property="og:image:height" content="${event.flyerHeight}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://chasingpoppies.com${escapeHtml(event.flyer)}">
  <meta name="twitter:image:alt" content="${escapeHtml(event.flyerAlt)}">
  <script type="application/ld+json">${structuredData}</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <a class="brand" href="/" aria-label="Chasing Poppies home">
      <img src="/images/skull-poppies-96.webp" width="96" height="93" alt="">
      <span>Chasing Poppies</span>
    </a>
    <nav class="site-nav site-nav--detail" aria-label="Primary navigation">
      <a href="/#shows">Shows</a><a href="/#videos">Videos</a><a href="/#about">About</a><a class="nav-booking" href="/#booking">Booking</a>
    </nav>
  </header>
  <main class="show-detail" id="main">
    <article class="show-detail__layout">
      <div class="show-detail__copy">
        <a class="text-link" href="/#shows">← Back to shows</a>
        <p class="eyebrow">${isArchived(event) ? "Archive" : "Upcoming"} · ${escapeHtml(event.dateLabel)}</p>
        <h1>${escapeHtml(event.name)}</h1>
        <p class="show-detail__venue">${escapeHtml(venueLabel)} · ${escapeHtml(event.city)}, ${escapeHtml(event.state)}</p>
        <p class="show-detail__description">${escapeHtml(event.description)}</p>
        <dl class="show-detail__facts">
          <div><dt>Date</dt><dd>${escapeHtml(event.dateLabel)}</dd></div>
          <div><dt>Time</dt><dd>${escapeHtml(event.timeLabel.replace(/^.*? · /, ""))}</dd></div>
          ${event.endDate ? `<div><dt>Ends</dt><dd>${event.endTimeApproximate ? "About " : ""}<time datetime="${escapeHtml(event.endDate)}">${escapeHtml(localTime(event.endDate))}${event.endDate.slice(0, 10) !== event.startDate.slice(0, 10) ? " (next day)" : ""}</time></dd></div>` : ""}
          <div><dt>Venue</dt><dd>${escapeHtml(event.venue)}</dd></div>
          <div><dt>Address</dt><dd>${escapeHtml(event.streetAddress)}, ${escapeHtml(event.city)}, ${escapeHtml(event.state)} ${escapeHtml(event.postalCode)}</dd></div>
          <div><dt>Admission</dt><dd>${escapeHtml(event.admission)}</dd></div>
          <div><dt>Details</dt><dd>${escapeHtml(event.age)}</dd></div>
          ${event.organizer ? `<div><dt>Organizer</dt><dd>${event.organizer.url ? `<a href="${escapeHtml(event.organizer.url)}">${escapeHtml(event.organizer.name)}</a>` : escapeHtml(event.organizer.name)}</dd></div>` : ""}
        </dl>
        <div class="show-detail__actions">
          <a class="button button--primary" href="${escapeHtml(event.eventUrl)}" target="_blank" rel="noopener noreferrer">Event page ↗</a>
          ${event.ticketUrl ? `<a class="button button--ghost" href="${escapeHtml(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">Tickets ↗</a>` : ""}
          <a class="button button--ghost" href="${escapeHtml(event.mapUrl)}" target="_blank" rel="noopener noreferrer">Venue map ↗</a>
          <a class="button button--ghost" href="${escapeHtml(event.flyer)}" target="_blank" rel="noopener noreferrer">Open flyer ↗</a>
        </div>
      </div>
      <figure class="show-detail__flyer"><img src="${escapeHtml(event.flyer)}" width="${event.flyerWidth}" height="${event.flyerHeight}" alt="${escapeHtml(event.flyerAlt)}"></figure>
    </article>
  </main>
  <footer class="site-footer site-footer--detail">
    <a class="brand brand--footer" href="/"><img src="/images/skull-poppies-96.webp" width="96" height="93" alt=""><span>Chasing Poppies</span></a>
    <div class="social-links" aria-label="Social media"><a href="https://www.instagram.com/chasingpoppiesband/">Instagram</a><a href="https://www.facebook.com/chasingpoppiesband">Facebook</a><a href="https://www.youtube.com/channel/UCwXXkWcM7_O1M5U2is5q18g">YouTube</a><a href="https://www.tiktok.com/@chasing.poppies">TikTok</a></div>
    <p>© ${new Date().getFullYear()} Chasing Poppies · Phoenix, Arizona</p>
  </footer>
</body>
</html>`;
}

function generateDist() {
  const dist = path.join(root, "dist");
  events.forEach(event => {
    const directory = path.join(dist, "shows", event.slug);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "index.html"), detailPage(event));
  });

  const urls = ["https://chasingpoppies.com/", ...events.map(event => `https://chasingpoppies.com/shows/${event.slug}/`)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(dist, "robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: https://chasingpoppies.com/sitemap.xml\n");
  fs.writeFileSync(path.join(dist, ".htaccess"), `<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json application/ld+json application/xml image/svg+xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
`);
}

if (require.main === module) {
  validate();
  const mode = process.argv[2];
  if (mode === "source") generateSource();
  else if (mode === "dist") {
    generateDist();
    events.forEach(event => {
      const missing = ["organizer", "endDate"].filter(field => !event[field]);
      if (missing.length) console.warn(`SEO: ${event.slug} is missing recommended ${missing.join(", ")}; confirm these details before adding them.`);
    });
  } else throw new Error("Usage: node scripts/generate-site.js <source|dist>");
}

module.exports = { validate, isArchived, eventJsonLd, detailPage };
