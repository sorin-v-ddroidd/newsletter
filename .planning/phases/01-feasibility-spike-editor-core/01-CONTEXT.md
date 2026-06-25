# Phase 1: Feasibility Spike (Editor Core) - Context

**Gathered:** 2026-06-25
**Status:** Ready for planning

<domain>
## Phase Boundary

HARD GATE. Prove the locked stack is viable before any auth/DB/storage work:
- `grapesjs@0.22.16` + `grapesjs-mjml@1.0.8` + `@grapesjs/react@2.0.0` mounts in React with no console errors
- ≥2 DDROIDD branded blocks + all 5 generic block types drag/drop and reorder on the canvas
- `getProjectData()` → localStorage → `loadProjectData()` round-trip is byte-identical (inline edit + undo/redo survive reload)
- MJML extracted from editor → POST to server compile endpoint → renders correctly in Outlook AND Gmail
- `mj-attributes` behavior documented experimentally; BLOCK_DEFAULTS mitigation validated

Resolves the #1 project risk and STATE.md blocker. Do NOT advance to Phase 2 until all exit criteria pass.

**Out of scope (deferred to later phases):** auth, PostgreSQL/DB, server-side persistence API, image upload, asset library, full 6-block library, Style Manager restriction, raw-HTML removal, preview UI, export download, mj-head injection. Persistence in this phase is localStorage only.

</domain>

<decisions>
## Implementation Decisions

### Spike Fate
- **D-01:** Build the spike as **foundation code** — Phase 2 builds directly on it. The stack/versions are locked and won't change, so the working mount, block definitions, and compile endpoint are kept, not thrown away. Invest reasonable structure/quality now (not throwaway, not gold-plated).

### Repo Layout
- **D-02:** New React + Express app lives in an **`/app` subfolder of this repo** (monorepo). Existing `src/` MJML sources stay in place as reference for block re-authoring. One repo to clone; branded section sources sit next to the blocks derived from them.
- **D-03:** `/app` holds both the client (React + Vite) and the server (Express) — exact internal layout inside `/app` (e.g. `app/client`, `app/server`) is planner's discretion.

### Branded Blocks for the Spike
- **D-04:** Re-author **hero + projects** as the 2 branded blocks. Rationale: maximize risk coverage. `hero` exercises the flagged-risky features (`background-url` on `mj-section`, `fluid-on-mobile` on `mj-image`); `projects` is layout/content-heavy (columns + images + text). If both survive round-trip and compile, the remaining sections are lower-risk.
- Blocks are **re-authored as grapesjs-mjml block definitions**, NOT imported from the hand-authored MJML (import round-trip is confirmed lossy — see canonical refs). All defaults inlined per element; no `mj-attributes`, no `mj-include`, no `mj-style` inside block content strings.

### Client-Render Verification
- **D-05:** Verify compiled HTML by **reusing the existing PowerShell + Outlook COM scripts**. Save server-compiled HTML to a file, then: `QuickEmailTest.ps1 -HtmlFilePath <file> -PreviewOnly` for Outlook; `EmailTester.ps1 -HtmlFilePath <file> -TestEmails <gmail>` to land it in a Gmail inbox. Windows-only is acceptable for a dev-time gate. No new test harness, no paid SaaS.

### Claude's Discretion
- Internal folder structure within `/app`.
- Exact `mj-attributes` experiment design (criteria #5) — how to construct the test that confirms whether defaults survive or are silently dropped.
- Mount approach details; fallback to `grapesjs@0.21.2` + direct mount only if the `0.22.16` + `@grapesjs/react` triple fails at runtime (documented fallback in STATE.md/CLAUDE.md).
- localStorage key/shape for the round-trip test.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack, versions & known-broken features (authoritative)
- `CLAUDE.md` (project root) — pinned version triple and rationale, the grapesjs-mjml **Supported MJML Components matrix** (what's supported / PARTIAL / NO), the **Import vs Re-author Verdict**, the **Custom Block Authoring Pattern** (inline defaults, no `mj-attributes`/`mj-include`/`mj-style` in blocks), the `pluginsOpts` hardcoded-string-key requirement (issue #223), and the "What NOT to Use" table. This is the single most important reference for Phase 1.

### Project intent & constraints
- `.planning/PROJECT.md` — Key Decisions table (re-author not import; canonical persisted state = project JSON, never reload from MJML; mj-head injected server-side; BLOCK_DEFAULTS shared constant)
- `.planning/REQUIREMENTS.md` — EDIT-01..05 (this phase); "Out of Scope" (no arbitrary MJML import, no raw HTML editing)
- `.planning/ROADMAP.md` §"Phase 1" — goal + 5 success criteria (the exit gate)
- `.planning/STATE.md` — Accumulated Decisions + the Phase 1 blocker (runtime compat unverified; fallback = `grapesjs@0.21.2` + direct mount)

### Existing MJML sources to re-author from
- `src/sections/hero.mjml` — source for the hero block (note `background-url`, `fluid-on-mobile` usage)
- `src/sections/projects.mjml` — source for the projects block (multi-column layout)
- `src/components/head.mjml` — current global `mj-attributes`/`mj-style`/fonts; reference for what BLOCK_DEFAULTS must inline per element (default text color is white — block backgrounds matter for legibility)

### Existing client-test tooling
- `QuickEmailTest.ps1` — Outlook draft preview (`-PreviewOnly`); Windows + Outlook COM
- `EmailTester.ps1` — send test to a real inbox (Gmail) for cross-client check

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mjml` npm compile pipeline (`npm run build-pages`, `src/` → `dist/`): reuse the **compiler** server-side (pin `mjml@4.18.0` to match bundled `mjml-browser@4`), not the `mj-include` composition model.
- `src/sections/hero.mjml`, `src/sections/projects.mjml`: design + feature reference for the 2 spike blocks.
- `src/components/head.mjml`: source of brand fonts, default colors, spacing knowledge that must be inlined into BLOCK_DEFAULTS (since `mj-attributes` is not supported in the editor).
- `QuickEmailTest.ps1` / `EmailTester.ps1`: the spike's client-render verification harness (D-05).

### Established Patterns
- Email-client constraints are the core domain: Outlook ignores some padding → use `mj-spacer`; Gmail strips `<style>` → inline critical CSS; `background-url` belongs on `mj-section`, not a div. Re-authored blocks must preserve these.
- Composition today is `mj-include` (compile-time) — the editor operates on flat MJML; includes have no runtime representation. "Reuse pipeline" = reuse compiler only.

### Integration Points
- Editor (`editor.getHtml()` → MJML string) → POST `/api/compile` (Express + `mjml@4.18.0`) → returns client-safe HTML → written to file → fed to PS scripts.
- Persistence in this phase: `editor.getProjectData()` → localStorage → `editor.loadProjectData()` (no server/DB yet).

</code_context>

<specifics>
## Specific Ideas

- Pick the spike's branded blocks for **risk coverage, not ease** — prove the features most likely to break (`background-url`, `fluid-on-mobile`, multi-column) survive round-trip + compile.
- Keep the spike clean enough to grow into Phase 2; the locked stack means working integration code is worth preserving.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Auth, DB, image upload, full block library, preview/export UI are already scoped to Phases 2–4.)

</deferred>

---

*Phase: 1-Feasibility Spike (Editor Core)*
*Context gathered: 2026-06-25*
