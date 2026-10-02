# reachdevel.com

Source for **[reachdevel.com](https://reachdevel.com)** — a personal software lab and
engineering index by Levent Kurt.

No framework, no build step. Plain HTML, CSS and one JavaScript file that renders a
project index from a single JSON file.

## Layout

```
site/       the deployable site — this is what Cloudflare Pages publishes
brand/      canonical brand assets (source of truth for the icons)
AGENTS.md   development guidelines for AI agents working in this repo
```

`site/icon.svg`, `site/icon-256.png` and `site/icon-1024.png` are deploy copies of the
matching `brand/reachdevel-icon.*` files.

Only `site/` is published. Everything else in this repo is deliberately kept out of the
web root — that is why the site is a subdirectory rather than the repository root.

## Editing content

Almost everything on the site comes from **`site/projects.json`**. You should not need to
touch HTML or CSS to add, reorder, or retire a project.

```jsonc
{
  "site": { "name": …, "email": …, "github": …, "categories": [ … ] },
  "projects": [
    {
      "id":      "muninn",              // used by the modal + deep links
      "title":   "Muninn",
      "slug":    "muninn",
      "tagline": "one line, shown on the card",
      "description": "long copy, shown in the detail modal",
      "category": "AI / Automation",    // must appear in site.categories
      "status":   "Active",             // Active | WIP | Beta | Archived
      "techStack": ["Python", "FastAPI"],
      "stars":    0,
      "githubUrl": "https://github.com/reachdevel/Muninn", // "" renders a disabled chip
      "demoUrl":   "",                  // "" renders "No demo yet"
      "featured":  true,                // wide card spanning both grid columns
      "createdAt": "2026-09-26",
      "metrics":  "4 engines · 17 test modules",
      "command":  "the $ command shown on the card, copyable",
      "setup":    ["shell lines, rendered as a man-page synopsis"]
    }
  ]
}
```

Two things to know about ordering:

- The grid renders **`featured` projects first**, then everything else, preserving array
  order within each group.
- The `PKG-nn` badge is the raw array index, so it tracks array order, not visual order.

Keep the two aligned: put featured projects at the top of the array.

## Deploying

The Cloudflare Pages project is `reachdevel`, published to the custom domain
`reachdevel.com`.

```sh
wrangler pages deploy site --project-name=reachdevel
```

Requires an authenticated Wrangler (`wrangler login`).

## Continuous deployment

Pushing to `main` deploys automatically via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
It expects two repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token with **Account → Cloudflare Pages → Edit** (plus **Account → Account Settings → Read** and **User → User Details → Read**, which Wrangler needs to read account details) |
| `CLOUDFLARE_ACCOUNT_ID` | `68f296214242475f2af0ea7e55a4393d` |

Create the token at *Cloudflare → My Profile → API Tokens → Create Token → Custom token*.

If you deploy from your machine instead, the workflow is harmless — it only runs on push.

## Routing and headers

Two files are consumed by Cloudflare Pages rather than served to the browser:

- **`site/_headers`** — security headers and cache policy. Note that Pages *merges*
  same-named headers across matching rules, so `Cache-Control` is deliberately absent
  from the `/*` block to keep per-path values from being mangled.
- **`site/404.html`** — served with a `404` status for any unmatched path.

## License

MIT — see [LICENSE](LICENSE).