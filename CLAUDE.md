# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An MJML-based responsive HTML email template ("DDROIDD Digest" newsletter). MJML sources in `src/` compile to a single HTML file in `dist/index.html`, which is then sent/previewed through Outlook via PowerShell scripts for client-rendering tests.

## Commands

```bash
npm install              # install mjml + dev tooling

npm run build-pages      # compile src/pages/**/**.mjml -> dist/  (use this one)
npm run build            # compile only src/pages/*.mjml -> dist/index.html (single-level glob; misses nested pages)
npm run watch-pages      # recompile pages on change
npm run dev              # nodemon watch + browser-sync live preview on http://localhost:8080
```

`npm test` is a placeholder (no test suite). "Testing" here means rendering the email in real clients.

### Email client testing (Windows + Outlook COM)

```powershell
# Preview compiled HTML in an Outlook draft (does not send):
.\QuickEmailTest.ps1 -HtmlFilePath dist\index.html -PreviewOnly

# Send a test:
.\EmailTester.ps1 -HtmlFilePath dist\index.html -TestEmails you@example.com -Subject "Digest" -Debug
```

Both scripts drive a local Outlook install through the `Outlook.Application` COM object, so they only work on a Windows machine with Outlook installed. `test.eml` is a captured raw email for reference; `history/` holds prior sends.

## Architecture

Composition is via MJML `<mj-include>`, not a build-time templating system. The render pipeline is:

`src/pages/index.mjml` (the page entry) → includes `src/components/head.mjml` (global `<mj-head>`: title, fonts, `mj-attributes` defaults, `<mj-style>`) → then includes ordered section files from `src/sections/` inside `<mj-body>`.

To change the newsletter's content/order, edit `src/pages/index.mjml`'s include list and the individual section files. Each `src/sections/*.mjml` is a self-contained `<mj-section>` block and is the unit of reuse/customization.

Important: not every file in `src/sections/` is wired into `index.mjml` — only the ones listed in its include block render. Files like `benefits.mjml`, `grades.mjml`, `company.mjml`, `your-opinion-matters.mjml`, and `sections/obsolete/` exist but are inactive unless added to a page. Check `index.mjml` to see what actually ships.

Global text color/line-height/font defaults live in `head.mjml` (`mj-attributes`); override per-element in sections rather than there unless the change is intended site-wide. Default text color is white (`#ffffff`), so section background colors matter for legibility.

Images are referenced from `assets/` (hero, placeholders, team photos, signature).

## Email-client rendering constraints

This is the core domain knowledge — emails must survive inconsistent client renderers (see README for the full list):
- **Outlook**: ignores some padding/margin; use `mj-spacer` for spacing. No background images on `div` — put `background-url` on `mj-section`.
- **Gmail**: strips `<style>` tags → inline CSS for anything critical. Web fonts unreliable → always set `font-family` fallbacks (already done in `head.mjml`).
- **Yahoo**: may ignore media queries → don't rely on them alone.

Lean on MJML's built-in responsiveness; treat the above as fallbacks. Verify changes by recompiling and previewing in an actual client, not just a browser.
