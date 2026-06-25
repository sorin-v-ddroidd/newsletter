# Architecture

How the DDROIDD Digest newsletter is composed and compiled. There is no application runtime — this is a static MJML → HTML build pipeline plus PowerShell send scripts.

## Compile pipeline

```
src/pages/index.mjml ──(mjml CLI)──> dist/index.html ──(PowerShell)──> Outlook draft/send
```

1. **Author** MJML in `src/`.
2. **Compile** with the `mjml` CLI (`npm run build-pages`) into `dist/index.html` (~70 KB of table-based HTML).
3. **Send/preview** `dist/index.html` through a local Outlook install via `QuickEmailTest.ps1` / `EmailTester.ps1`.

## Composition model

Composition is done at compile time with MJML's `<mj-include>` directive — there is no templating engine, data binding, or loop construct. The page entry assembles the email by including, in order:

```
src/pages/index.mjml
├── <mj-include> components/head.mjml        # global <mj-head>
└── <mj-body>
    ├── <mj-include> sections/hero.mjml
    ├── <mj-include> sections/new-collegues.mjml
    ├── <mj-include> sections/projects.mjml
    ├── <mj-include> sections/initiatives.mjml
    ├── <mj-include> sections/hiring.mjml
    ├── <mj-include> sections/want-to-know-more.mjml
    └── <mj-include> sections/disclaimer.mjml
```

### Layers

| Layer | File(s) | Responsibility |
|-------|---------|----------------|
| Page entry | `src/pages/index.mjml` | Declares `<mjml>`, includes head, orders body sections |
| Global head | `src/components/head.mjml` | `<mj-title>`, web font, `mj-attributes` defaults, `<mj-style>` |
| Sections | `src/sections/*.mjml` | One self-contained `<mj-section>` block of content each |

### Section as the unit of reuse

Each `src/sections/*.mjml` is an independent `<mj-section>` (or a few). To change content or ordering, edit the include list in `index.mjml` and the section files — nothing else wires them together.

**Only sections listed in `index.mjml` render.** Several section files exist but are *not* included in the current page and therefore do not ship:

- Inactive: `benefits.mjml`, `company.mjml`, `grades.mjml`, `your-opinion-matters.mjml`
- Archived: `src/sections/obsolete/collegues-row-old.mjml`

Always check `src/pages/index.mjml` to see what actually ships in a given build.

## Global styling

`components/head.mjml` sets project-wide defaults via `<mj-attributes>`:

- Default text: `color="#ffffff"`, `line-height="24px"`, `font-size="16px"`
- Global font stack (`mj-all`): `Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif`
- Web font: Roboto, loaded from Google Fonts

Because the **default text color is white**, each section sets its own background color (e.g. hero uses `#0B1624`) — getting this wrong produces white-on-white invisible text. Override styling per-element in sections; only change `head.mjml` when the effect should be site-wide.

## Images

Images are **not** bundled from the local `assets/` folder. Sections reference publicly hosted CDN URLs:

- Storyblok — `https://a.storyblok.com/f/198446/...`
- Webflow — `https://cdn.prod.website-files.com/671741f56fde...`

Email clients cannot load images relative to the message, so every image must be hosted at a public URL. `assets/` contains local source/reference copies only and is not part of the rendered output. See [CONFIGURATION.md](CONFIGURATION.md).

## Open tracking

`hero.mjml` (and intended at end-of-body) embeds a 1×1 tracking pixel:

```
<mj-image src="https://tracking-newsletter.onrender.com/track?email=...&user=...&newsletter=..."
          css-class="tracking-pixel" width="1px" height="1px" />
```

The `.tracking-pixel` class (`display: none`) is defined in `head.mjml`. The tracking endpoint and recipient query params are external concerns — see [CONFIGURATION.md](CONFIGURATION.md).

## Build outputs & glob caveat

- `build-pages` (`mjml src/pages/**/**.mjml -o dist/`) — compiles all pages, including nested ones. **Use this.**
- `build` (`mjml src/pages/**.mjml -o dist/index.html`) — single-level glob; misses nested pages. Kept for the single-page case.

`dist/` is a build artifact; the source of truth is `src/`.
