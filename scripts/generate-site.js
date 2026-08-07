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

function validate() {
  const slugs = new Set();

  events.forEach((event, index) => {
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
    if (Number.isNaN(Date.parse(event.startDate))) {
      throw new Error(`Invalid startDate for ${event.slug}`);
    }
    if (!event.flyer.startsWith("/images/")) {
      throw new Error(`Flyer must be in /images for ${event.slug}`);
    }
    slugs.add(event.slug);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function eventJsonLd(event) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
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
    url: `https://chasingpoppies.com/shows/${event.slug}/`
  };

  if (event.endDate) data.endDate = event.endDate;
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
      <span class="stamp">Archive</span>
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
      <a href="${escapeHtml(event.mapUrl)}" target="_blank" rel="noopener noreferrer">Venue map <span aria-hidden="true">↗</span></a>
    </div>
  </div>
  <a class="show-card__flyer" href="/shows/${event.slug}/" aria-label="View details for ${escapeHtml(event.name)}">
    <img src="${escapeHtml(event.thumbnail)}" width="${event.thumbnailWidth}" height="${event.thumbnailHeight}" loading="lazy" alt="${escapeHtml(event.flyerAlt)}">
  </a>
</article>`;
}

function generateSource() {
  const output = `${events.map(card).join("\n")}\n`;
  const target = path.join(root, "src/views/components/generated/events.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, output);
}

function detailPage(event) {
  const canonical = `https://chasingpoppies.com/shows/${event.slug}/`;
  const venueLabel = event.venueLabel || event.venue;
  const structuredData = JSON.stringify(eventJsonLd(event)).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#080808">
  <title>${escapeHtml(event.name)} — Chasing Poppies</title>
  <meta name="description" content="${escapeHtml(event.description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/images/skull-poppies.png">
  <link rel="stylesheet" href="/index.css">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Chasing Poppies">
  <meta property="og:title" content="${escapeHtml(event.name)} — Chasing Poppies">
  <meta property="og:description" content="${escapeHtml(event.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://chasingpoppies.com${escapeHtml(event.flyer)}">
  <meta property="og:image:alt" content="${escapeHtml(event.flyerAlt)}">
  <meta name="twitter:card" content="summary_large_image">
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
        <p class="eyebrow">Archive · ${escapeHtml(event.dateLabel)}</p>
        <h1>${escapeHtml(event.name)}</h1>
        <p class="show-detail__venue">${escapeHtml(venueLabel)} · ${escapeHtml(event.city)}, ${escapeHtml(event.state)}</p>
        <p class="show-detail__description">${escapeHtml(event.description)}</p>
        <dl class="show-detail__facts">
          <div><dt>Date</dt><dd>${escapeHtml(event.dateLabel)}</dd></div>
          <div><dt>Time</dt><dd>${escapeHtml(event.timeLabel.replace(/^.*? · /, ""))}</dd></div>
          <div><dt>Admission</dt><dd>${escapeHtml(event.admission)}</dd></div>
          <div><dt>Details</dt><dd>${escapeHtml(event.age)}</dd></div>
        </dl>
        <div class="show-detail__actions">
          <a class="button button--primary" href="${escapeHtml(event.mapUrl)}" target="_blank" rel="noopener noreferrer">Venue map ↗</a>
          <a class="button button--ghost" href="${escapeHtml(event.flyer)}" target="_blank">Open flyer ↗</a>
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

validate();
const mode = process.argv[2];
if (mode === "source") generateSource();
else if (mode === "dist") generateDist();
else throw new Error("Usage: node scripts/generate-site.js <source|dist>");
