# MJML & Email-Client Safety

**This is the core domain.** The product's entire value is exported HTML that renders correctly in Outlook, Gmail, and Yahoo. These constraints do not change and override convenience. Every block, every Style Manager control, every compile path must respect them.

## The hard constraints (non-negotiable)

| Client | Constraint | Consequence for our code |
|--------|-----------|--------------------------|
| **Outlook** (Word engine) | Ignores most `padding`/`margin`; no `background-image` on `<div>`; no flexbox/`position`/`box-shadow`/CSS grid | Use `mj-spacer` for vertical spacing, not padding. Put `background-url` on `mj-section`, never a div. Never expose fl/pos/shadow in the Style Manager (EDIT-06). |
| **Gmail** | Strips `<style>` tags; web fonts unreliable | Critical CSS must be **inline** (MJML does this at compile). Always carry `font-family` with fallbacks per element — never rely on a single web font. |
| **Yahoo** | May ignore media queries | Don't rely on media queries alone for responsiveness — lean on MJML's table-based responsive output. |

Lean on MJML's built-in responsiveness; treat the above as the fallbacks MJML can't guarantee.

## White-default-text trap

The legacy templates default text color to **white** (`#ffffff`). A block with no/incorrect background renders white-on-white and is invisible. **Every branded block must carry its own `background-color` and explicit text `color`** — never assume an inherited default. See `grapesjs.md` BLOCK_DEFAULTS.

## Preview / export parity (do not break this)

- Server compile uses **`mjml@4.18.0`**. The browser preview inside grapesjs-mjml uses **`mjml-browser@4.18.0`** (bundled). Same major+minor = identical HTML.
- **Never** bump server `mjml` to v5. v5 changes the skeleton, minification, and include handling → preview and exported HTML diverge. (Version is LOCKED — see `versions.md`.)
- Both preview and the final download must flow through the **same** compile path with the **same fixed `mj-head` injected server-side** (EXPORT-04). What the user previews is what ships.

## Compile path

```
editor.getHtml()  →  MJML string (flat, no mj-include)
  →  inject fixed server mj-head (fonts, defaults, .tracking-pixel rule)
  →  mjml@4.18.0 compile  →  client-safe HTML
```

- `mj-head` (global fonts/defaults/`mj-style`) is **injected server-side at compile time**, not authored in blocks and not stored in project JSON. One source of truth for head; blocks stay body-only.
- Treat any MJML compile warning/error as a failure surfaced to the user — never silently ship partial HTML.

## Verifying changes

A browser preview is **not** proof. The only proof an email renders is rendering it in a real client. For dev-time gates reuse the existing Windows tooling:

```powershell
.\QuickEmailTest.ps1 -HtmlFilePath <compiled.html> -PreviewOnly        # Outlook draft
.\EmailTester.ps1   -HtmlFilePath <compiled.html> -TestEmails <gmail>  # land in Gmail
```

When you change a block, a Style Manager option, or the head injection: recompile and verify in Outlook + Gmail before calling it done. No broken fonts, no dark-on-dark, no collapsed spacing.

## Cross-references
- `grapesjs.md` — how these constraints are enforced in the editor (BLOCK_DEFAULTS, restricted Style Manager, no raw HTML).
- `versions.md` — why `mjml@4.18.0` is locked.
