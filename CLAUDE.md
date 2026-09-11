# House rules for george.science

Personal dev blog. Hugo (extended, 0.148.2 — the version CI pins) with a
custom theme, hand-written SCSS, deployed to GitHub Pages via Actions on
pushes to `main`. See README.md for build and authoring mechanics.

## Workflow

- One branch per PR, branched from freshly pulled `origin/main`. Never
  push new commits to a branch whose PR has merged — start a new branch
  and a new PR.
- Verify before pushing: build with Hugo locally, and screenshot pages
  you changed (light and dark) rather than assuming.
- When adding or changing CI, read the first run's logs even when it
  passes — a green check that tested nothing has happened here before.
- Merging to `main` deploys to production. GitHub Pages is set to
  deploy from GitHub Actions; the custom domain lives in Pages settings
  (not the CNAME file, which is kept as documentation in `static/`).

## Design rules

- Black and white with one teal accent. No other colours, ever.
- Colours live in `assets/scss/_colours.scss` only: primitives feed
  per-theme semantic token maps, emitted as `--colour-*` custom
  properties. Components reference `var(--colour-*)` exclusively —
  never a primitive, never a raw hex.
- Both themes must hold WCAG 2.2 AA contrast. When touching a primitive,
  recalculate the ratios documented in `_colours.scss`.
- Dark mode follows `prefers-color-scheme`. There is no toggle and the
  site ships zero JavaScript; keep it that way unless George says
  otherwise.
- SCSS uses BEM class naming, one partial per block. Hugo compiles it
  with libsass, so use `@import` (not `@use`) and wrap CSS functions
  with mixed units in `unquote(...)`.
- Typography: 40rem measure, no uppercase transforms, no letter-spacing
  on lowercase text, `text-wrap` balance/pretty stay on.
- Spacing snaps to the 4/8/16/32/64px scale, held in rems
  (`$space-4` … `$space-64` in `_variables.scss`) — no off-scale
  values. Prefer `gap` for spacing flex/grid siblings; prose flow
  (paragraphs, headings, lists) keeps margins so collapsing works.
- Images: greyscale, breaking out to 64rem, captions via markdown title
  syntax, page bundles with responsive resizes. Meaningful alt text
  always; never let colour carry meaning in an image.
- The favicon is the flask (`static/favicon.svg`): outline in the ink
  primitives (#111111, #e6e6e6 in dark via its embedded media query),
  liquid in the teal accent (#008080). When it changes, regenerate the
  raster variants from the same artwork (`favicon.ico` 32px on a white
  tile, `apple-touch-icon.png` 180px on a white tile) so all three stay
  identical. `theme-color` matches the page surface (white / #111111),
  never the accent — the browser chrome should dissolve into the page.

## Accessibility

- The target is WCAG 2.2 AA and it is CI-enforced: axe scans five pages
  in both colour schemes on every PR (`.github/workflows/accessibility.yml`).
- Preserve the structural furniture: one `h1` per page (visually hidden
  on the homepage), sequential heading levels, skip link, landmarks,
  `aria-current` on active nav, `time[datetime]`, visible focus styles,
  touch targets ≥ 24px.

## Writing for the blog

- British English throughout.
- No em dashes or en dashes in post content — George finds them
  distracting. Use commas, colons, parentheses, or full stops.
- Voice: first person, conversational, quirky. Posts open with a
  concrete, slightly absurd personal anecdote that snaps into the
  point (the Monzo money-book style). Content themes lean on delivery,
  flow, and outcomes-over-outputs (Nick Brown school).
- Front matter needs `tags` and a one-line `summary` (it shows on the
  homepage and posts list).
- Hugo silently hides future-dated posts: when publishing same-day, use
  a timestamp already in the past.
- Drafts of unwritten posts open with an italic line saying the post is
  still being written, followed by outline bullets.

## Working with George

- Discuss significant design or architecture choices before building
  ("amigo" them); small fixes and clear requests just get done.
- When George asks a question, answer it before (or instead of) doing
  work — a question is not a request to change things.
