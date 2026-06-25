---
phase: 01
slug: feasibility-spike-editor-core
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-25
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 1 is a feasibility spike: validation is manual observation + browser-console assertions, not an automated suite. The "tests" are the 5 exit criteria themselves.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual observation + browser-console assertions (spike) |
| **Config file** | none |
| **Quick run command** | Visual inspection + browser DevTools console assertions |
| **Full suite command** | All 5 exit criteria verified in sequence (see procedure below) |
| **Estimated runtime** | ~minutes (manual) |

**Nyquist exception:** No automated test runner is installed this phase (per RESEARCH.md Validation Architecture, framework=None). This is the documented exception — `<acceptance_criteria>` use console-assertion / observable-canvas signals and curl checks, not a unit-test suite. Do not invent a test framework.

---

## Sampling Rate

- **After every task commit:** Re-mount editor in browser; confirm no new console errors.
- **After every plan wave:** Re-run the exit-criteria checkpoints touched by that wave.
- **Before `/gsd:verify-work`:** All 5 exit criteria green (criterion 4 may be a documented partial — see Manual-Only).
- **Max feedback latency:** seconds (live browser reload via Vite HMR).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01 T1 (scaffold client) | 01-01 | 1 | EDIT-01, EDIT-05 | — | — | install/grep | grep installed package.json versions | ❌ W0 | ⬜ pending |
| 01-01 T2 (mount + hero) | 01-01 | 1 | EDIT-01, EDIT-05 | — | — | manual | visual: mount, panel, hero droppable | ❌ W0 | ⬜ pending |
| 01-01 T3 (round-trip) | 01-01 | 1 | EDIT-01..05 | — | — | manual/console | `before === after` console assertion | ❌ W0 | ⬜ pending |
| 01-02 T1 (scaffold server) | 01-02 | 1 | EDIT-01 | T-01-SC | npm audit | grep mjml@4.18.0 exact | ❌ W0 | ⬜ pending |
| 01-02 T2 (/api/compile) | 01-02 | 1 | EDIT-01 | T-01-01, T-01-02 | body limit 1mb; CORS localhost:5173 | curl | curl POST returns `<!doctype html`; 413 on >1mb | ❌ W0 | ⬜ pending |
| 01-03 T1 (getHtml + projects) | 01-03 | 2 | EDIT-01, EDIT-05 | — | — | console/manual | `console.log(editor.getHtml())` first; projects droppable | ❌ W0 | ⬜ pending |
| 01-03 T2 (wire compile) | 01-03 | 2 | EDIT-01 | T-01-01, T-01-02 (inherited) | — | manual | dist/spike-output.html starts `<!doctype html` | ❌ W0 | ⬜ pending |
| 01-03 T3 (full EDIT verify) | 01-03 | 2 | EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05 | — | — | manual | drop 5 generic + 2 branded; reorder; inline; undo/redo | ❌ W0 | ⬜ pending |
| 01-04 T1 (Part A) | 01-04 | 2 | EDIT-05 | T-01-01, T-01-02 (inherited) | — | manual/console | mj-attributes color NOT applied in compiled HTML | ❌ W0 | ⬜ pending |
| 01-04 T2 (Part B + findings) | 01-04 | 2 | EDIT-05 | — | — | doc | CRITERION-5-FINDINGS.md answers 6-item checklist | ❌ W0 | ⬜ pending |
| 01-05 T1 (Outlook checkpoint) | 01-05 | 3 | EDIT-01 | — | — | human-verify | user confirms classic Outlook availability | ❌ W0 | ⬜ pending |
| 01-05 T2 (client render) | 01-05 | 3 | EDIT-01 | — | — | manual/doc | CLIENT-RENDER-GATE.md: full pass OR partial+deferred | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Task IDs assigned to the 5 plans (01-01..01-05).*

---

## Wave 0 Requirements

- [ ] `app/client/` directory + `package.json` (React + Vite + grapesjs@0.22.16 + grapesjs-mjml@1.0.8 + @grapesjs/react@2.0.0) — Plan 01-01 Task 1
- [ ] `app/server/` directory + `package.json` (Express + mjml@4.18.0) — Plan 01-02 Task 1
- [ ] `tsconfig.json` in both client and server — Plans 01-01 / 01-02 Task 1
- [ ] `vite.config.ts` with proxy `/api` → `http://localhost:3000` — Plan 01-01 Task 1

*No automated test framework installed this phase — spike validates by observation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Plan | Why Manual | Test Instructions |
|----------|-------------|------|------------|-------------------|
| Editor mounts without console errors | EDIT-01 | 01-01 | Runtime compat is the spike's own question (no automatable oracle) | Open DevTools console, load app; PASS = no red errors, canvas + blocks panel render. FAIL = TypeError / blank canvas → fall back to grapesjs@0.21.2 + direct mount (STATE.md) |
| Drag/drop + reorder ≥2 branded + 5 generic blocks | EDIT-01, EDIT-02, EDIT-05 | 01-03 | Drag-drop is a UI gesture | Drop mj-text, mj-image, mj-button, columns, mj-divider, mj-spacer, ddroidd-hero, ddroidd-projects; reorder two blocks |
| Inline text edit + undo/redo | EDIT-03, EDIT-04 | 01-03 | UI gesture | Double-click mj-text, edit; Ctrl+Z reverts; Ctrl+Y re-applies |
| localStorage round-trip byte-identical | EDIT-01..04 | 01-01 | Persistence fidelity | Console: capture `JSON.stringify(getProjectData())`, save→localStorage→loadProjectData, re-capture; PASS = `before === after` true; undo/redo functional after reload |
| `editor.getHtml()` shape | — | 01-03 | LOW-confidence open question | `console.log(editor.getHtml())` is the literal first step of the compile plan; document fragment-vs-full-`<mjml>` |
| Server compile → client render (Outlook + Gmail) | — (success criterion #4) | 01-05 | **BLOCKED: Outlook COM unavailable on dev machine** (new Outlook Store app); both PS scripts require COM | **Human checkpoint required before this task (Plan 01-05 Task 1).** Needs a machine with classic Outlook (Office 365 MSI / 2019/2021). If unavailable: document partial pass (browser render of `dist/spike-output.html` verified) and defer client-render gate with a recorded follow-up. PASS = no broken fonts, dark-on-dark text, or spacing failures in Outlook AND Gmail |
| mj-attributes experiment (Part A drop / Part B inlined survive) | — (success criterion #5) | 01-04 | Empirical documentation, not assertable | Run negative (mj-attributes dropped) + positive (inlined BLOCK_DEFAULTS survive round-trip + compile without mj-head); written doc must exist; BLOCK_DEFAULTS mitigation validated |

---

## Validation Sign-Off

- [x] Every code task has a manual checkpoint or Wave 0 dependency
- [x] Human checkpoint inserted BEFORE the criterion-4 client-render task (Outlook COM gate) — Plan 01-05 Task 1
- [x] `console.log(editor.getHtml())` is the first step of the compile path — Plan 01-03 Task 1
- [x] mj-attributes experiment produces written documentation (criterion #5) — Plan 01-04
- [x] No watch-mode flags
- [x] `nyquist_compliant: true` set in frontmatter after planner mapped task IDs

**Approval:** pending
