# george.science

Personal dev blog, built with [Hugo](https://gohugo.io/) and hand-written SCSS ([BEM](https://getbem.com/) naming). Black and white with a single teal accent; the content is the focus.

## Local development

Requires [Hugo **extended**](https://gohugo.io/installation/) (the extended build compiles the SCSS; v0.148.2 is what CI uses).

```sh
hugo server -D        # serve at http://localhost:1313, including drafts
hugo                  # production build into public/
```

## Writing a post

```sh
hugo new posts/my-post-title.md
```

Posts start as drafts (`draft: true`). Fill in `tags` and a one-line `summary` (shown on the homepage and posts list), write, then flip `draft` to `false` to publish.

## Adding images

Give the post a folder (a page bundle) and put images next to it:

```
content/posts/my-post/
├── index.md
└── photo.jpg
```

Then reference them with plain Markdown; a title becomes the caption:

```markdown
![Alt text describing the image](photo.jpg "An optional caption.")
```

Every image breaks out wider than the text column (up to 64rem), keeps its own colour against the monochrome interface, and — for raster images in the bundle — is automatically resized into a responsive `srcset` with lazy loading and explicit dimensions. Captioned images render as `<figure>`/`<figcaption>`. Always write meaningful alt text.

Images are dimmed slightly in dark mode so a bright photo does not glare. Never rely on colour alone to carry meaning in charts or screenshots (use labels, patterns, or annotations), which is the accessible thing to do regardless. The site targets WCAG AA: keep alt text meaningful, heading levels sequential, and link text descriptive.

## Structure

- `content/` — posts and pages (Markdown)
- `layouts/` — HTML templates
- `assets/scss/` — styles, one partial per BEM block, compiled by Hugo Pipes
  - `_colours.scss` is the colour system: raw primitives feed per-theme maps of semantic tokens, emitted as `--colour-*` custom properties by a mixin. Components only ever use `var(--colour-*)`. Dark mode follows `prefers-color-scheme` — no JavaScript, no toggle. When changing a primitive, re-check the contrast ratios documented in that file (both themes must hold WCAG AA).
- `assets/images/og-base.png` — base artwork for share cards; `assets/fonts/` holds the font Hugo draws titles with (build-time only, never served)
- `assets/js/` — the only JavaScript on the site, for the Lobster Pots page
- `static/` — files copied verbatim into the site root (CNAME lives here)

## Lobster Pots

`/lobster-pots/` is a canvas game and the one page that ships JavaScript.
It is wired up by `content/lobster-pots.md` (which sets
`layout: lobster-pots` in its front matter),
`layouts/_default/lobster-pots.html`, `assets/js/lobster-pots.js` and
`assets/scss/_lobster-pots.scss`.

The scene is low-poly 3D drawn by a small renderer written for the job
(perspective projection, back-face culling, depth sort, flat shading) rather
than a 3D library, so the site still carries no third-party JavaScript. It
shows a Cornish harbour town from the water, with the pots as orange buoys.
Money is in pounds.

The canvas is decoration. Every value it draws is also written into the
markup around it, so the game is playable by keyboard and by screen reader
with the picture ignored entirely, and it degrades to an explanation of the
rules when JavaScript is off. The rendering honours `prefers-reduced-motion`
(one static frame, no loop), caps itself at about 32 frames a second, and
stops animating when the canvas scrolls out of view or the tab is hidden.

## Deployment

Pushes to `main` trigger `.github/workflows/hugo.yml`, which builds the site and deploys it to GitHub Pages at [george.science](https://george.science). GitHub Pages must be set to deploy from **GitHub Actions** (repo Settings → Pages → Source).
