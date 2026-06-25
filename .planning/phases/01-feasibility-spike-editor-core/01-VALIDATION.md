---
phase: 01
slug: feasibility-spike-editor-core
status: draft
nyquist_compliant: false
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
| (assigned by planner) | — | — | EDIT-01..05 | T-01-01 (oversized body), T-01-02 (CORS) | Express body limit 1mb; CORS restricted to localhost:5173 | manual | console assertion / visual | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Planner fills concrete task IDs.*

---

## Wave 0 Requirements

- [ ] `app/client/` directory + `package.json` (React + Vite + grapesjs@0.22.16 + grapesjs-mjml@1.0.8 + @grapesjs/react@2.0.0)
- [ ] `app/server/` directory + `package.json` (Express + mjml@4.18.0)
- [ ] `tsconfig.json` in both client and server
- [ ] `vite.config.ts` with proxy `/api` → `http://localhost:3000`

*No automated test framework installed this phase — spike validates by observation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Editor mounts without console errors | EDIT-01 | Runtime compat is the spike's own question (no automatable oracle) | Open DevTools console, load app; PASS = no red errors, canvas + blocks panel render. FAIL = TypeError / blank canvas → fall back to grapesjs@0.21.2 + direct mount (STATE.md) |
| Drag/drop + reorder ≥2 branded + 5 generic blocks | EDIT-01, EDIT-02, EDIT-05 | Drag-drop is a UI gesture | Drop mj-text, mj-image, mj-button, columns, mj-divider, mj-spacer, ddroidd-hero, ddroidd-projects; reorder two blocks |
| Inline text edit + undo/redo | EDIT-03, EDIT-04 | UI gesture | Double-click mj-text, edit; Ctrl+Z reverts; Ctrl+Y re-applies |
| localStorage round-trip byte-identical | EDIT-01..04 | Persistence fidelity | Console: capture `JSON.stringify(getProjectData())`, save→localStorage→loadProjectData, re-capture; PASS = `before === after` true; undo/redo functional after reload |
| `editor.getHtml()` shape | — | LOW-confidence open question | `console.log(editor.getHtml())` is the literal first step of the compile task; document fragment-vs-full-`<mjml>` |
| Server compile → client render (Outlook + Gmail) | — (success criterion #4) | **BLOCKED: Outlook COM unavailable on dev machine** (new Outlook Store app); both PS scripts require COM | **Human checkpoint required before this task.** Needs a machine with classic Outlook (Office 365 MSI / 2019/2021). If unavailable: document partial pass (browser render of `dist/spike-output.html` verified) and defer client-render gate with a recorded follow-up. PASS = no broken fonts, dark-on-dark text, or spacing failures in Outlook AND Gmail |
| mj-attributes experiment (Part A drop / Part B inlined survive) | — (success criterion #5) | Empirical documentation, not assertable | Run negative (mj-attributes dropped) + positive (inlined BLOCK_DEFAULTS survive round-trip + compile without mj-head); written doc must exist; BLOCK_DEFAULTS mitigation validated |

---

## Validation Sign-Off

- [ ] Every code task has a manual checkpoint or Wave 0 dependency
- [ ] Human checkpoint inserted BEFORE the criterion-4 client-render task (Outlook COM gate)
- [ ] `console.log(editor.getHtml())` is the first step of the compile task
- [ ] mj-attributes experiment produces written documentation (criterion #5)
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter after planner maps task IDs

**Approval:** pending
