# Personal site

Static site, no dependencies. Node 18+ is only needed to build the blog and data-driven pages.
All content lives in plain files, so you can add things without touching HTML.

## Where things live

| To change | Edit | Then |
|---|---|---|
| Blog posts | add `posts/<anything>.md` | push (a GitHub Action rebuilds), or `node build.mjs` |
| Map pins and descriptions | `data/places.json` | reload (no build needed) |
| Projects page | `data/projects.json` | rebuild |
| Papers page | `data/papers.json` | rebuild |
| Site URL, default descriptions | `data/site.json` | rebuild |
| Nav links | `NAV` array at the top of `theme.js` | reload |
| Home page, bio, experience | `index.html` | reload |
| Colors and fonts | `styles.css` (variables at the top) | reload |

## Blog posts

```bash
node build.mjs new "My post title"              # scaffolds posts/<date>-my-post-title.md
node build.mjs                                   # build once
node build.mjs --watch                           # rebuild on every save
```

Front matter: `title`, `date` (`YYYY-MM-DD`, or `YYYY-MM` for month precision), `summary`, optional `draft: true`.
Markdown supports headings, lists, tables, quotes, code fences, images, raw HTML, and `$math$` / `$$math$$` (KaTeX).
The build writes `blog/*.html`, the blog index, and the News list on the home page.

## Map

`history.html` (the Places page) shows a Leaflet map over a self-hosted world outline (`data/world.json`, Natural Earth; no tile server or API key), with a plain list of places beneath it.

```bash
node build.mjs add-place "Kyoto, Japan" 35.01 135.77 "A short description." [optional-link]
```

or edit `data/places.json` (`name`, `lat`, `lng`, `note`, optional `label` for the short map label, optional `link`).

## Projects and papers

Add an object to `data/projects.json`, or to a section's `items` in `data/papers.json`:

```json
{ "title": "My project", "url": "https://...", "meta": "2026 · Python", "description": "One or two sentences.", "links": [{ "label": "Code", "url": "https://..." }] }
```

Every field except `title` is optional.

## Visualizations in posts

`viz/` holds small interactive visualizations that posts can embed with `<div data-viz="stiefel"></div>` (or `infotheory`).
To add one, create `viz/my-idea.js` that calls `Viz.register('my-idea', function (el) { ... })` (see the header of `viz/viz.js` and `viz/stiefel.js`).

## Deploying

Push to a GitHub repo named `<username>.github.io` and enable Pages (Settings → Pages → Deploy from branch → `main` / root).
Under Settings → Actions → General → Workflow permissions, choose "Read and write" so `.github/workflows/build.yml` can commit the rebuilt pages when you add a post.

## Deployment checklist

- Set `url` in `data/site.json` to your real address (for example `https://<username>.github.io`). The build uses it for canonical links, Open Graph tags, `sitemap.xml`, `feed.xml` and `robots.txt`.
- Run `node build.mjs` before pushing (or let the GitHub Action do it). It also stamps "Site last updated" on every page.
- `404.html` uses root-relative paths, so it expects the site at the domain root (`<username>.github.io` or a custom domain), not a `/repo-name/` subpath.
- `.nojekyll` tells GitHub Pages to serve files as they are.
- Optional: put a `cv.pdf` in the root and add a link to it in `index.html`.
