# kushal-chat.github.io

The source of my personal website: **https://kushal-chat.github.io**

I'm Kushal Chattopadhyay, a software engineer working on AI infrastructure in Tokyo. The site is my home on the web: who I am, what I've worked on, and a few places that matter to me.

## What's on the site

| Page | File | What it shows |
|---|---|---|
| Home | `index.html` | Bio, profile, news, experience, projects, research, skills, credentials, and a small animation of gradient descent on a sphere |
| Projects | `projects.html` | Things I've built (generated from `data/projects.json`) |
| Papers | `papers.html` | Research projects and reports (generated from `data/papers.json`) |
| Places | `history.html` | A world map of places I've lived, worked and studied, with a short note on each (from `data/places.json`) |
| Blog | `blog/` | Short updates, written in Markdown (from `posts/`) |

## How it works

It is a static site: plain HTML, CSS and JavaScript, with no framework, no bundler and no runtime dependencies. GitHub Pages serves the repository root from `main`.

A small Node script, `build.mjs` (Node 18+, no packages to install), generates the parts that come from content files:

- the blog pages and index, from Markdown in `posts/`
- the News list on the home page, from the latest posts
- the Projects and Papers pages, from JSON in `data/`
- canonical links, Open Graph tags, `sitemap.xml`, `feed.xml` (RSS) and `robots.txt`
- the "Site last updated" date in each footer

A GitHub Action (`.github/workflows/build.yml`) runs the script whenever `posts/`, `data/`, `templates/` or `build.mjs` change, and commits the result. The generated files are committed, so the site works without any build step on the server.

## Repository layout

```
index.html, projects.html, papers.html, history.html, 404.html   pages
blog/                    generated blog pages (do not edit by hand)
posts/                   blog posts as Markdown, one file per post
data/                    site.json, projects.json, papers.json, places.json, world.json
templates/               HTML templates for blog pages
map/places.js            the Places map (Leaflet)
viz/                     small interactive visualizations (viz.js is the framework)
styles.css, theme.js     all styling; nav, theme toggle and fonts
build.mjs                the build script
photos/, *.svg, *.png    images, logo and favicons
```

## Editing content

| To change | Edit | Then |
|---|---|---|
| Add a blog post | add `posts/<anything>.md` | push, and the Action rebuilds |
| Map pins and notes | `data/places.json` | push |
| Projects | `data/projects.json` | push |
| Papers | `data/papers.json` | push |
| Site address and default descriptions | `data/site.json` | push |
| Nav links | the `NAV` list at the top of `theme.js` | push |
| Bio, experience, skills, credentials | `index.html` | push |
| Colors and fonts | the variables at the top of `styles.css` | push |

To preview locally, run `node build.mjs` and serve the folder with any static server, for example `python3 -m http.server`.

**Blog posts** are Markdown files with a short header:

```
---
title: My post
date: 2026-11-23        # or 2026-11 for month precision
summary: One line shown in lists.
draft: true             # optional: leaves the post out of the build
---
```

Posts support headings, lists, tables, code, images, raw HTML and `$math$` (KaTeX). `node build.mjs new "My post"` creates a starter file, and `node build.mjs --watch` rebuilds on every save. Posts marked `draft: true` are kept in `posts/` but not published; some current ones are drafts.

**Map pins**: `node build.mjs add-place "Kyoto, Japan" 35.01 135.77 "A short description."` or edit `data/places.json` (`name`, `lat`, `lng`, `note`, optional `label` and `link`).

**Projects and papers**: add an object such as `{ "title": "...", "meta": "2026 · Python", "description": "...", "links": [{ "label": "Code", "url": "https://..." }] }`. Only `title` is required.

**Visualizations**: `viz/` holds interactive visualizations that pages and posts embed with `<div data-viz="name"></div>`. The home page uses `stiefel-mini`. To add one, create `viz/my-idea.js` that calls `Viz.register('my-idea', function (el) { ... })`; see `viz/viz.js` and `viz/stiefel.js` for examples.

## Deploying

The repository is named `kushal-chat.github.io`, so GitHub Pages serves it at that address (Settings → Pages → Deploy from a branch → `main` / root). Under Settings → Actions → General → Workflow permissions, the Action needs "Read and write permissions" so it can commit rebuilt pages.

`404.html` uses root-relative paths, so it expects the site at the domain root rather than under a `/repo-name/` path. `.nojekyll` tells GitHub Pages to serve files as they are. If the site moves, update `url` in `data/site.json` and rebuild.

## Credits

- Map: [Leaflet](https://leafletjs.com) over country outlines from [Natural Earth](https://www.naturalearthdata.com) (public domain), self-hosted in `data/world.json`
- Math: [KaTeX](https://katex.org)
- Fonts via Google Fonts: Inter Tight (text and headings), Manrope, Noto Sans JP (Japanese text)
