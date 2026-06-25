# Getting Started

Get from a fresh clone to a previewed email in a few minutes.

## Prerequisites

- **Node.js + npm** — to run the MJML CLI and dev tooling.
- **Windows + Outlook** *(for sending/previewing in a real client)* — the `*.ps1` scripts drive Outlook through its COM object. On macOS/Linux you can still build and preview in a browser, just not via the scripts.
- Basic familiarity with [MJML](https://documentation.mjml.io/) and HTML.

## 1. Install

```bash
npm install
```

Installs `mjml` plus dev tooling (`browser-sync`, `concurrently`, `nodemon`, `http-server`).

## 2. Build

```bash
npm run build-pages
```

Compiles `src/pages/**/**.mjml` → `dist/index.html`. (Use `build-pages`, not `build` — see [DEVELOPMENT.md](DEVELOPMENT.md) for the glob difference.)

## 3. Live preview while editing

```bash
npm run dev
```

Runs nodemon (recompiles on `.mjml` change) and browser-sync (auto-refreshing preview). Open <http://localhost:8080>. Edit any file in `src/`, save, and the browser updates.

> A browser preview is not a true client preview. Email clients render differently — always confirm in Outlook/Gmail before sending. See [TESTING.md](TESTING.md).

## 4. Preview in Outlook (Windows)

```powershell
.\QuickEmailTest.ps1 -HtmlFilePath dist\index.html -PreviewOnly
```

Opens a draft in Outlook with the compiled HTML. Drop `-PreviewOnly` to send (defaults to `test@test.com` in that script).

## Make your first edit

1. Open `src/sections/hero.mjml`.
2. Change the intro paragraph text.
3. Save — if `npm run dev` is running, the browser refreshes automatically; otherwise re-run `npm run build-pages`.
4. To add/remove/reorder a section, edit the `<mj-include>` list in `src/pages/index.mjml`.

## Where things live

| Want to change... | Edit... |
|-------------------|---------|
| Section content | `src/sections/<name>.mjml` |
| Which sections appear / order | `src/pages/index.mjml` |
| Fonts, global colors, title | `src/components/head.mjml` |
| An image | the `src` CDN URL in the relevant section (see [CONFIGURATION.md](CONFIGURATION.md)) |

Next: [DEVELOPMENT.md](DEVELOPMENT.md) for workflow and client gotchas, [ARCHITECTURE.md](ARCHITECTURE.md) for how it all composes.
