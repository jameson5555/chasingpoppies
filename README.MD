# Chasing Poppies Website

## Content updates

- Edit `src/data/events.json` to add or update shows. The build validates the data, renders homepage cards, and creates one page per show at `/shows/{slug}/`.
- The homepage includes nine curated video cards as a reliable fallback. Production builds with `YOUTUBE_API_KEY` replace them with the latest nine channel uploads longer than 60 seconds.
- Run `npm run build` before previewing or deploying. Generated metadata includes canonical URLs, `MusicGroup` and per-show `Event` JSON-LD, `sitemap.xml`, and `robots.txt`.

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
