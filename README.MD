# Chasing Poppies Website

## FTP Deploy
- ftp deploy: https://github.com/git-ftp/git-ftp < go here for first deploy steps
- brew install git-ftp
- while developing, just do git-ftp push
- syncing from /dist: git config git-ftp.syncroot dist/
- git ftp push --user [username] --passwd [password] ftp://chasingpoppies.com/public_html/

for new computers, need new key: https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/


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
