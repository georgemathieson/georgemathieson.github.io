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

Every image breaks out wider than the text column (up to 64rem), renders greyscale to match the palette, and — for raster images in the bundle — is automatically resized into a responsive `srcset` with lazy loading and explicit dimensions. Captioned images render as `<figure>`/`<figcaption>`. Always write meaningful alt text.

## Structure

- `content/` — posts and pages (Markdown)
- `layouts/` — HTML templates
- `assets/scss/` — styles, one partial per BEM block, compiled by Hugo Pipes
- `static/` — files copied verbatim into the site root (CNAME lives here)

## Deployment

Pushes to `main` trigger `.github/workflows/hugo.yml`, which builds the site and deploys it to GitHub Pages at [george.science](https://george.science). GitHub Pages must be set to deploy from **GitHub Actions** (repo Settings → Pages → Source).
