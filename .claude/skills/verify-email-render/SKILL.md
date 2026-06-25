---
name: verify-email-render
description: Compile MJML to client-safe HTML and verify it renders correctly in real email clients (Outlook + Gmail) using the repo's PowerShell + Outlook COM scripts. Use whenever an email block, the mj-head injection, the compile path, or a Style Manager control changes — a browser preview is NOT proof an email renders. Windows + Outlook required (dev-time gate).
---

# Verify Email Render

The product's only real promise is that exported HTML renders in real clients. A passing MJML compile and a browser preview are **not** proof. This skill is the render gate: compile → land it in Outlook + Gmail → inspect against a fixed checklist.

See `.claude/rules/mjml-email-safety.md` for the constraints being verified.

## Preconditions

- Windows machine with **Outlook installed** (the scripts drive `Outlook.Application` COM). Windows-only is acceptable — this is a dev-time gate, not CI.
- The MJML to test, compiled to a standalone HTML file via `mjml@4.18.0` (the same server compile path the product uses, with the fixed `mj-head` injected — never a different compiler or version, or the gate tests the wrong output).

## Steps

1. **Produce the HTML the recipient would get.** Compile through the real path:
   - If testing the live app: POST the editor's MJML (`editor.getHtml()`) to `/api/compile` and save the returned HTML to a file.
   - If testing a block/section in isolation or pre-app: compile via the repo pipeline (`npm run build-pages`, output in `dist/`) or a direct `mjml <file> -o <out.html>` call. Confirm `mjml --version` is 4.x — **not** v5 (v5 diverges from the browser preview).
   - Save to a known path, e.g. `dist/index.html` or a scratch file.

2. **Preview in Outlook (no send):**
   ```powershell
   .\QuickEmailTest.ps1 -HtmlFilePath dist\index.html -PreviewOnly
   ```
   Opens an Outlook draft rendered by the Word engine — the harshest client.

3. **Land it in Gmail (real cross-client check):**
   ```powershell
   .\EmailTester.ps1 -HtmlFilePath dist\index.html -TestEmails you@gmail.com -Subject "Render check" -Debug
   ```
   Open the message in the Gmail web client (and mobile if reachable).

4. **Inspect against the checklist** (below). Report each item PASS/FAIL with what you saw — do not declare "renders fine" without going through it.

## Inspection checklist

- **Fonts** — body text uses the intended font or a sane fallback; no system-default fallback that looks broken (Gmail strips web fonts → the `font-family` fallback chain must hold).
- **No dark-on-dark / white-on-white** — every text block is legible against its section background (default text color is white → backgrounds matter). This is the #1 silent failure.
- **Spacing** — vertical gaps survive in Outlook (padding gets dropped → spacing must come from `mj-spacer`). No collapsed or doubled gaps.
- **Images** — load, correct width, not stretched; `fluid-on-mobile` behaves on narrow widths.
- **Background images** — render in Outlook (must be `background-url` on `mj-section`, never a div).
- **Layout** — columns stack correctly on mobile width; no horizontal overflow; no flexbox/position/box-shadow artifacts (those break in Outlook and shouldn't be present at all).
- **Links** — present and correct `href`.

## Output

State the compiled file path, that Outlook + Gmail were checked, and the checklist results. Any FAIL → fix the block/head/compile and re-run; do not pass the gate on a partial render.

## Notes
- If Outlook COM isn't available (non-Windows, no Outlook), say so explicitly and treat the render as **unverified** — never substitute a browser-only preview and call it verified.
- `test.eml` in the repo is a captured reference email; `history/` holds prior sends.
