# Development

Day-to-day workflow for editing the newsletter, plus the email-client gotchas that make HTML email different from web development.

## Workflow

```bash
npm run dev          # watch src/ + live-reload preview at localhost:8080
```

Leave this running. Edit `src/**/*.mjml`, save, watch the browser refresh. When ready, build a clean artifact and test in a real client:

```bash
npm run build-pages
# then: .\QuickEmailTest.ps1 -HtmlFilePath dist\index.html -PreviewOnly
```

## npm scripts

| Script | What it does | Notes |
|--------|--------------|-------|
| `build-pages` | `mjml src/pages/**/**.mjml -o dist/` | **Preferred build.** Matches nested pages. |
| `build` | `mjml src/pages/**.mjml -o dist/index.html` | Single-level glob — misses nested pages. |
| `watch-pages` | recompile pages on change | build without the browser-sync server |
| `watch` | `mjml -w src/**/*.mjml -o dist` | watches all mjml, not just pages |
| `dev` | nodemon + browser-sync | the one you usually want |
| `test` | placeholder — `exit 1` | no automated test suite (see [TESTING.md](TESTING.md)) |

## Editing sections

- Each `src/sections/*.mjml` is a self-contained `<mj-section>`. Keep one concern per file.
- Add a section: create the file, then add `<mj-include path="../sections/<name>.mjml" />` to `src/pages/index.mjml` in the right position.
- Remove a section: delete its `<mj-include>` line from `index.mjml` (the file can stay in `src/sections/` as inactive).
- **A section only ships if it is included in `index.mjml`.** Inactive files (`benefits`, `company`, `grades`, `your-opinion-matters`, `obsolete/`) exist but do not render.
- Default text is white (`head.mjml`). New sections must set their own `background-color`, or the text will be invisible.

## Images

Reference publicly hosted URLs (Storyblok / Webflow), not the local `assets/` folder — clients can't load message-relative images. To swap an image: upload to the host, paste the new URL into the section's `src`, optionally update the local copy in `assets/`. Details in [CONFIGURATION.md](CONFIGURATION.md).

## Email-client gotchas

HTML email ≠ web pages. Clients strip and rewrite markup. MJML handles most of it, but keep these in mind:

### Outlook
- May ignore `padding`/`margin` — use `<mj-spacer>` for reliable vertical spacing.
- No background images on `div`. Put `background-url` on `<mj-section>`.

### Gmail
- Strips `<style>` blocks — inline CSS for anything critical (MJML inlines automatically; custom `<mj-style>` may not survive).
- Web fonts unreliable — always keep the `font-family` fallback stack (defined in `head.mjml`).

### Yahoo
- May ignore media queries — don't depend on them alone for responsiveness.

### General
- Lean on MJML's built-in responsiveness (`fluid-on-mobile`, columns) rather than hand-rolled media queries.
- Always provide font and color fallbacks.

## Conventions

- Indentation in section files uses tabs (match the existing file you're editing).
- The compiled `dist/index.html` is a build artifact — edit `src/`, never `dist/` directly.
- No git repository is initialized here; coordinate versioning with the team's actual workflow.
