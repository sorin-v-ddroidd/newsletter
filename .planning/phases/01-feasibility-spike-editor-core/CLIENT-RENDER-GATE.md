# Client-Render Gate (Criterion #4 / D-05)

**Outcome: PARTIAL PASS — client-render gate DEFERRED to Phase 2 with recorded follow-up.**

Decision date: 2026-06-25. Path chosen by user at the 01-05 blocking human checkpoint: **partial pass + defer**.

## Why partial (not full)

The D-05 full gate runs `QuickEmailTest.ps1` (Outlook preview) and `EmailTester.ps1`
(Gmail send), both of which call `New-Object -ComObject Outlook.Application`. The dev
machine runs the **new Outlook for Windows (Store app), which exposes no COM** — both
scripts fail immediately at COM object creation. No classic-Outlook machine (Office 365
MSI / 2019 / 2021) was available for this spike. Real Outlook + Gmail rendering was
therefore **not** verified.

## What WAS verified (structural / compile evidence)

`dist/spike-output.html` was regenerated from the real assembled canvas (DDROIDD Hero +
DDROIDD Projects blocks, BLOCK_DEFAULTS inlined) and compiled with `mjml@4.18.0`
(`validationLevel: 'soft'`):

| Check | Result |
|-------|--------|
| Compiles with 0 MJML errors | ✓ `errors: []` |
| Valid HTML email skeleton | ✓ starts `<!doctype html>` (14,285 bytes) |
| Background color inlined | ✓ `#0B1624` present |
| Text color inlined (white-default trap) | ✓ `#ffffff` present — no dark-on-dark |
| Font stack inlined | ✓ `Calibri, Roboto, Lato, …` present |
| `fluid-on-mobile` honored | ✓ `mj-full-width-mobile` CSS rule emitted |
| No raw `<mj-` tags leaked into output | ✓ fully compiled to table HTML |
| No `mj-head` injection required | ✓ defaults inlined per element (criterion-5, 01-04) |

This satisfies the partial-pass fallback (01-VALIDATION.md): the compiled artifact is
structurally email-client-safe (inline CSS for Gmail, table layout for Outlook, explicit
per-element colors/fonts). What remains unproven is **actual rendering** in the real
Outlook (Word engine) and Gmail clients — only a real client can confirm that.

> NOTE: the browser-eyeball step of the partial-pass path was not performed by an
> automated agent (agents cannot view a rendered browser). The evidence above is
> compile-level + structural. A human opening `dist/spike-output.html` in a browser is
> still recommended and is folded into the deferred follow-up below.

## Deferred follow-up (carry into Phase 2)

**FOLLOW-UP (D-05 client-render gate):** Before shipping any exported newsletter to real
recipients, run the full client-render verification on a **classic-Outlook** machine:

```powershell
.\QuickEmailTest.ps1 -HtmlFilePath dist\spike-output.html -PreviewOnly
.\EmailTester.ps1   -HtmlFilePath dist\spike-output.html -TestEmails sorin.vieriu@ddroidd.com
```

Acceptance: no broken fonts, no dark-on-dark text, no collapsed spacing in **Outlook AND
Gmail**. Also do a quick human browser-render check of `dist/spike-output.html`. Recorded
in STATE.md → Deferred Items.

## Also still PENDING-HUMAN from this phase (live-editor, not client-render)

These are NOT part of criterion 4 but were honestly deferred by 01-03/01-04 because an
autonomous agent cannot drive a live GrapesJS canvas. They need a human at
`http://localhost:5173` (`cd app/client && npm run dev`, with `cd app/server && npm run dev`):

- **EDIT-01..05** (01-03 Task 3): all 5 generic blocks + ddroidd-hero + ddroidd-projects
  drag/drop; reorder + delete; inline mj-text edit; Ctrl+Z / Ctrl+Y undo/redo.
- **`editor.getHtml()` shape** (open question #2): confirm whether output starts with
  `<mjml` or is a bare fragment (server conditional-wrap handles either; the Compile
  button logs the first 200 chars + the flag to console).
- **Round-trip survival** (01-04): confirm `fluid-on-mobile` and `background-url` survive
  `getProjectData()` → `loadProjectData()` (the localStorage round-trip + Assert button).
