# Chasing Poppies Website

## Content updates

- Edit `src/data/events.json` to add or update shows. The build validates the data, renders homepage cards, and creates one page per show at `/shows/{slug}/`.
- The homepage includes nine curated video cards as a reliable fallback. Production builds with `YOUTUBE_API_KEY` replace them with the latest nine channel uploads longer than 60 seconds.
- Run `npm run build` before previewing or deploying. Generated metadata includes canonical URLs, `MusicGroup` and per-show `MusicEvent` JSON-LD, a `/shows/` index with upcoming/past dates, breadcrumbs, `sitemap.xml`, and `robots.txt`.

## Event metadata and search visibility

- Each show page emits `MusicEvent` JSON-LD with the recorded admission price in USD, including `0` for free shows. Prices should include any mandatory fees. Do not mark a Facebook information page as a ticket purchase URL; add optional `ticketUrl` only for a verified page selling admission to that specific show. The build also renders a visible Tickets link when supplied. Availability and on-sale dates are not assumed.
- Add `organizer: { "name": "Promoter name", "url": "https://..." }` when the actual organizer is known. The URL is optional. A performer or venue is not automatically the organizer. Organizer details also appear on the show page. The owner confirmed Chasing Poppies organized the November 21 Blooze show and Immortalized Productions organized the December 19 Pho Cao show; archived organizer names come from the flyers.
- Add `endDate` in the same timezone-aware format as `startDate`, for example `2026-12-19T23:00:00-07:00`. For an expected approximate finish, set `endTimeApproximate: true` so the page labels it “About.” Do not invent an end time to silence a warning. Overnight shows need the following date. The December 19 finish is the flyer’s approximate 11 PM, confirmed by the owner.
- Run `npm test` and `npm run build`. Deployment runs these tests before building. Invalid prices, dates, time ordering, or organizer/ticket URLs stop the build; missing recommended organizer/end-date details produce warnings.
- As of November 9, 2026, end times are still unknown for the April 18 and June 7, 2025 shows and the November 21, 2026 show. The June 7 organizer is also unknown. These recommendations remain intentionally incomplete pending factual confirmation.
- Show titles and search descriptions include the band, date, and venue/location. Show pages expose venue addresses as text. Homepage `WebSite` markup supplies the preferred site name alongside existing band markup.

After publishing through the existing FTP deployment workflow:

1. Use [Google’s Rich Results Test](https://search.google.com/test/rich-results) on both upcoming show URLs. Confirm the detected event fields against visible content. A local build cannot verify Google's live crawl or guarantee a rich result.
2. Run Search Console URL Inspection’s live test on the homepage, `/shows/`, and each show page; confirm the pages and referenced images are fetchable. The owner’s November 9 live tests successfully fetched the homepage and both upcoming show pages, with crawling and indexing allowed. The HTTP 406 responses received by this audit’s direct HTTP client were not reproduced by Google’s inspection tool; no host security changes are indicated by those tests. Check robots.txt availability in Crawl Stats and sitemap fetches in the Sitemaps report.
3. Submit or confirm `https://chasingpoppies.com/sitemap.xml` in Search Console. Request indexing for the updated show pages and use **Validate fix** on the relevant Events issues after confirming the live output. Warnings for unknown fields can remain.

## Search presentation

- **Large homepage/show-index preview:** the existing 2400 × 1600 band photo is preferred using `primaryImageOfPage` and `og:image`. Both pages visibly include the photo. `max-image-preview:large` permits larger previews; Google still chooses which image, if any, appears. Individual event pages keep their own flyer as the relevant event image.
- **Small site icon:** `/images/favicon-96.png` is a square 96 × 96 PNG using the existing skull-and-poppies artwork on the site’s dark background. The former 300 × 290 favicon did not meet Google’s square-aspect requirement. Keep the new URL stable.
- **Band identity/logo:** `MusicGroup` markup retains the official social profiles and band photo, and identifies the square 336 × 336 logo using an `ImageObject`. The photo remains the preferred page thumbnail; the logo identifies the band separately. No new business entity or physical business address is invented.
- **Shows and navigation:** `/shows/` provides upcoming shows in date order and links to past shows. Each event keeps its own URL and `MusicEvent` markup. The index uses `CollectionPage`/`ItemList` references, rather than claiming the schedule is a single event. Visible breadcrumbs and matching `BreadcrumbList` markup connect Home → Shows → individual event. This helps navigation and discovery; Google chooses sitelinks and event presentation automatically.
- **Fresh dates:** the existing FTP workflow now rebuilds/deploys daily at 10:17 UTC (3:17 AM Arizona), as well as on pushes, with a manual Run workflow option. Concurrent deployments are serialized. This starts after the workflow is on the default branch. Check GitHub Actions for failures; scheduled jobs may be delayed, and public repositories can have schedules disabled after 60 days without repository activity.
- The two PNG branding assets are deterministic exports of the existing artwork, not newly drawn logos. `scripts/brand-icon.html?size=96` or `?size=336` is the editable export template. Export with local headless Chrome at a matching `--window-size`, `--force-device-scale-factor=1`, and the relevant PNG `--screenshot` path. The committed PNGs require no browser in the production build.

After deploying, request a homepage and `/shows/` recrawl in Search Console, confirm the sitemap includes `/shows/`, and test the new breadcrumb markup with the Rich Results Test. Search presentation can change only after Google processes the published changes, and no exact layout or ranking increase is guaranteed.

Further improvements beyond this implementation:

- Verify permanent redirects from HTTP and `www` URLs to the existing canonical `https://chasingpoppies.com/`, retaining each page’s path. Canonical tags already exist; live redirect behavior could not be confirmed because of the HTTP 406 responses.
- Ask venues and promoters to link their public lineups directly to the relevant show page on this site. Keep the band name, photo, biography, and official website consistent across existing social and music profiles. These are useful identity and discovery signals, not a guarantee of a specific search feature.
- If Google displays a knowledge panel for Chasing Poppies, [claim it using the official verification process](https://support.google.com/knowledgepanel/answer/7534902). Panels are generated automatically; adding metadata cannot guarantee one appears. Google's [Search profile tools](https://support.google.com/websearch/answer/16904498) may also be available, subject to eligibility and platform verification.
- Check mobile PageSpeed Insights/Core Web Vitals before making performance changes. The homepage already uses responsive WebP images, lazy loading, and a deferred video player. For video search, consider individual watch pages with supported `VideoObject` metadata and verified upload dates rather than adding incomplete video markup to the homepage.

References: [Google event requirements](https://developers.google.com/search/docs/appearance/structured-data/event), [image preferences](https://developers.google.com/search/docs/appearance/google-images), [favicon requirements](https://developers.google.com/search/docs/appearance/favicon-in-search), [organization/logo metadata](https://developers.google.com/search/docs/appearance/structured-data/organization), [sitelinks](https://developers.google.com/search/docs/appearance/sitelinks), [breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), [site names](https://developers.google.com/search/docs/appearance/site-names), [video SEO](https://developers.google.com/search/docs/appearance/video).

## FTP Deploy
- git-ftp docs: https://github.com/git-ftp/git-ftp

### First-time setup (per computer)
1. Install git-ftp
```
brew install git-ftp
```
2. Configure deploy target
```
git config git-ftp.syncroot dist/
git config git-ftp.url ftp://chasingpoppies.com/public_html
git config git-ftp.user <username>
git config git-ftp.password <password>
```
3. Initialize remote deploy state (only once per remote)
```
git ftp init
```

### Routine deploy
1. Commit your changes
```
git add -A
git commit -m "your deploy message"
```
2. Build + preview upload list
```
npm run deploy:dry-run
```
3. Deploy
```
npm run deploy
```

### Notes
- Deploy always ships the built `dist/` files to `public_html/`.
- If `npm run deploy` says `syncroot` is wrong, re-run:
```
git config git-ftp.syncroot dist/
```
- `npm run deploy` and `npm run deploy:dry-run` now fail early if your repo has uncommitted changes.

### Fallback: manual ZIP deploy (if FTP writes 0-byte files)
1. Build and package:
```
npm run deploy:package
```
2. In hosting File Manager, go to `public_html/`, upload `deploy/chasingpoppies-dist.zip`, then Extract.
3. Verify `public_html/index.html`, `public_html/index.css`, and `public_html/bundle.js` are non-zero bytes.
4. Remove the uploaded zip from `public_html/`.

for new computers, need new key: https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/

# Updating youtube embed
- https://www.sociablekit.com/app/users/widgets/update_embed/120132

# Static Website Template

This is a template for creating simple static websites without JS frameworks.

A blog post explaining the process can be found on [wweb.dev](https://wweb.dev/blog/how-to-create-static-website-npm-scripts)

It uses:
- SCSS with linting and autoprefixer
- JavaScript with webpack using babel and linting
- minifying images
- html partials and minify with post-html
- browser-sync

The compiled files will go to the directory "/dist"

- from `src/scss` to `dist/index.css`
- from `src/js` to `dist/bundle.js`
- from `src/views` to `dist/`
- from `src/images` to `dist/images`

## Getting Started

```
nvm use 18.18.0 # if errors, run npm update and/or npm install
```

1. Install dependencies
```
npm install
```

2. Build resources
```
npm run build
```

3. Watch for changes
```
npm run watch
```

## Demo

Integrates smoothly with netlify:

[https://static-website-template.netlify.com/](https://static-website-template.netlify.com/)


## License
[MIT](https://choosealicense.com/licenses/mit/)


---

*created by [Vincent Will](https://wweb.dev/)*
