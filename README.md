# DDROIDD Digest — MJML Newsletter

Source for the **DDROIDD Digest**, a monthly company newsletter built with [MJML](https://mjml.io/). MJML sections in `src/` compile to a single responsive HTML email (`dist/index.html`) that is then previewed and sent through Outlook using the included PowerShell scripts.

## Why MJML

HTML email rendering is inconsistent across clients (Outlook, Gmail, Yahoo). MJML compiles a clean, component-based syntax into battle-tested table-based HTML that survives those clients, and lets the newsletter be split into reusable sections instead of one giant HTML file.

## Quick start

```bash
npm install              # install mjml + dev tooling
npm run build-pages      # compile src/pages/**/**.mjml -> dist/
npm run dev              # watch + live-reload preview at http://localhost:8080
```

Then preview the output in a real client (Windows + Outlook):

```powershell
.\QuickEmailTest.ps1 -HtmlFilePath dist\index.html -PreviewOnly
```

See [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) for the full walkthrough.

## Structure

```
src/
  pages/index.mjml        # page entry — orders the section includes
  components/head.mjml     # global <mj-head>: title, fonts, defaults, styles
  sections/*.mjml          # one self-contained <mj-section> per file
assets/                    # local copies of images (see note below)
dist/index.html            # compiled output (build artifact)
*.ps1                      # Outlook preview/send scripts
```

> Images in the email are referenced by **remote CDN URLs** (Storyblok, Webflow), not from the local `assets/` folder — email clients require publicly hosted images. The `assets/` folder holds source/reference copies only.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) | Install, build, preview your first edit |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How sections compose and compile |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Editing sections, scripts, client gotchas |
| [docs/TESTING.md](docs/TESTING.md) | Previewing and sending test emails |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | Fonts, image hosting, tracking pixel |

## Email-client notes

- **Outlook** — ignores some padding/margins; use `mj-spacer`. Background images only on `mj-section` (`background-url`), never `div`.
- **Gmail** — strips `<style>` tags; inline critical CSS. Web fonts unreliable; keep `font-family` fallbacks.
- **Yahoo** — may ignore media queries; don't rely on them alone.

Test across clients with Litmus or Email on Acid before sending.

## License

ISC. Authored by the DDROIDD team.
