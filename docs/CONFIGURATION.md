# Configuration

This project has no `.env` file or config module — "configuration" means the handful of values hard-coded in the MJML source and PowerShell scripts. This doc lists what to change and where.

## Global head (`src/components/head.mjml`)

| Setting | Where | Current value |
|---------|-------|---------------|
| Email title | `<mj-title>` | `DDROIDD Digest` |
| Web font | `<mj-font>` | Roboto (Google Fonts) |
| Default text color | `<mj-text>` in `mj-attributes` | `#ffffff` (white) |
| Default line-height / size | `<mj-text>` in `mj-attributes` | `24px` / `16px` |
| Global font stack | `<mj-all font-family>` | `Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif` |
| Hidden-pixel CSS | `<mj-style>` | `.tracking-pixel { display: none; }` |

Because default text is white, set a `background-color` on every `mj-section` (e.g. the hero uses `#0B1624`).

## Image hosting

Images are referenced by absolute CDN URLs inside the section files, **not** from the local `assets/` folder. To change an image, upload it to the host and replace the `src` URL in the relevant `src/sections/*.mjml`.

Hosts currently in use:

- **Storyblok** — `https://a.storyblok.com/f/198446/...`
- **Webflow** — `https://cdn.prod.website-files.com/671741f56fde401410e14e91/...`

<!-- VERIFY: The Storyblok space (198446) and Webflow site IDs are external accounts owned by DDROIDD; access credentials are not in this repo. Confirm asset ownership/permanence before relying on these URLs. -->

The `assets/` folder holds local source copies (hero, placeholders, team photos, signature). Keep them in sync with what is uploaded, but they are not used at render time.

## Open-tracking pixel

Configured inline in `src/sections/hero.mjml` (and intended at end-of-body):

```
src="https://tracking-newsletter.onrender.com/track?email=user@ddroidd.com&user=John%20Doe&newsletter=oct-2025"
```

Per-send you replace the query params:

| Param | Meaning |
|-------|---------|
| `email` | recipient address |
| `user` | recipient display name (URL-encoded) |
| `newsletter` | campaign id (e.g. `oct-2025`) |

The pixel is hidden by the `.tracking-pixel` class from `head.mjml`.

<!-- VERIFY: tracking-newsletter.onrender.com is an external tracking server not contained in this repo. Confirm it is live, owned by the team, and that the static per-recipient URL is being templated per send (the committed value is a placeholder). -->

## Send scripts (`*.ps1`)

`QuickEmailTest.ps1` and `EmailTester.ps1` accept parameters rather than hard-coded config:

| Param | Script(s) | Default |
|-------|-----------|---------|
| `-HtmlFilePath` (required) | both | — |
| `-TestEmails` | both | `@()` (empty) |
| `-Subject` | both | `Newsletter Test` |
| `-PreviewOnly` | both | off (sending) |
| `-Debug` | `EmailTester.ps1` | off |

Note: `QuickEmailTest.ps1` hard-codes the draft recipient to `test@test.com`; edit the script or use `EmailTester.ps1 -TestEmails ...` to target real addresses.

<!-- VERIFY: Both scripts drive Outlook via the Outlook.Application COM object and require a configured Outlook install with a sending account. Mailbox/SMTP identity comes from the local Outlook profile, not this repo. -->

## Build scripts (`package.json`)

| Script | Command |
|--------|---------|
| `build-pages` | `mjml src/pages/**/**.mjml -o dist/` (use this) |
| `build` | `mjml src/pages/**.mjml -o dist/index.html` (single-level glob) |
| `watch-pages` | `mjml -w src/pages/**/**.mjml -o dist` |
| `dev` | nodemon watch + browser-sync preview on port `8080` |

To change the dev preview port, edit the `--port 8080` flag in the `dev` script.
