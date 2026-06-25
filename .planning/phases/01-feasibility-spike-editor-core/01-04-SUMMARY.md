---
phase: 01-feasibility-spike-editor-core
plan: 04
subsystem: experiments
tags: [grapesjs-mjml, mj-attributes, BLOCK_DEFAULTS, mjml, criterion-5, experiments]

# Dependency graph
requires: [01-01, 01-02]
provides:
  - "CRITERION-5-FINDINGS.md: documented mj-attributes experiment + BLOCK_DEFAULTS validation"
  - "app/client/src/experiments/mjAttributes.ts: Part A negative-test MJML + runner"
  - "Criterion #5 PASS — BLOCK_DEFAULTS mitigation validated as architectural foundation for Phase 3"
affects: [01-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BLOCK_DEFAULTS validation: inlined defaults compile with 0 errors, no mj-head — confirmed correct architectural choice"
    - "mj-attributes compiler vs editor distinction: compiler honors it; grapesjs-mjml editor drops it (issues #35/#17)"
    - "Evidence labeling discipline: DIRECTLY-OBSERVED vs INFERRED-FROM-SOURCE"

key-files:
  created:
    - "app/client/src/experiments/mjAttributes.ts"
    - ".planning/phases/01-feasibility-spike-editor-core/CRITERION-5-FINDINGS.md"
  modified: []

key-decisions:
  - "mj-attributes drop is editor-level (grapesjs-mjml issues #35/#17), not compiler-level — mjml@4.18.0 honors it; BLOCK_DEFAULTS inlining required"
  - "Criterion-5 PASS: all six checklist items answered; items 2/4/5 directly-observed; items 1/3/6 inferred/deferred to browser gate"
  - "Round-trip survival of fluid-on-mobile and background-url deferred to manual browser gate (01-01-SUMMARY.md D-04 Risk Probe section)"

# Metrics
duration: 8min
completed: 2026-06-25
---

# Phase 1 Plan 04: mj-attributes Experiment + BLOCK_DEFAULTS Validation

**Criterion #5 PASS. mj-attributes honored by mjml@4.18.0 compiler (directly observed); dropped by grapesjs-mjml editor layer (issues #35/#17, inferred from source). BLOCK_DEFAULTS mitigation validated: hero fragment with inlined defaults compiles with 0 errors, producing #ffffff text, Calibri stack, and #0B1624 background from inlined values alone with NO mj-head injection.**

See `.planning/phases/01-feasibility-spike-editor-core/CRITERION-5-FINDINGS.md` for full documented results.

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-25
- **Completed:** 2026-06-25
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created `app/client/src/experiments/mjAttributes.ts` with Part A negative-test MJML string (full `<mjml>` with `mj-attributes color="#ff0000"`), Part B hero fragment constant (BLOCK_DEFAULTS inlined), and `runMjAttributesExperiment()` runner that POSTs to `/api/compile` and logs per-attribute findings. Window global `__ddroiddMjAttributesExperiment` for manual browser console invocation.
- Ran one-shot `mjml@4.18.0` compile experiments inside `app/server` via `node --input-type=module`:
  - **Part A:** `color:#ff0000` IS present in compiled output (0 errors) — compiler honors `mj-attributes`; the drop is editor-level (grapesjs-mjml issues #35/#17)
  - **Part B:** hero fragment compiles with 0 errors, no mj-head: `#0B1624` bgcolor, `color:#ffffff`, `Calibri` font stack, `mj-full-width-mobile` CSS (fluid-on-mobile), and `img-hero.png` in background-url context — all from inlined BLOCK_DEFAULTS alone
- Authored `CRITERION-5-FINDINGS.md` answering all six criterion-5 checklist items with explicit DIRECTLY-OBSERVED vs INFERRED-FROM-SOURCE labels

## Criterion-5 Checklist Results

| Item | Finding | Confidence |
|------|---------|------------|
| 1. fluid-on-mobile survives round-trip (getProjectData/loadProjectData) | INFERRED — deferred to browser gate (01-01 D-04 probe) | INFERRED-FROM-SOURCE |
| 2. fluid-on-mobile appears in compiled HTML | PASS — mj-full-width-mobile CSS rule present | DIRECTLY-OBSERVED |
| 3. background-url survives round-trip | INFERRED — deferred to browser gate | INFERRED-FROM-SOURCE |
| 4. background-url appears in compiled HTML | PASS — img-hero.png in VML/CSS background context | DIRECTLY-OBSERVED |
| 5. MJML compile warnings/errors | 0 errors, 0 warnings (validationLevel: 'soft') | DIRECTLY-OBSERVED |
| 6. getHtml() shape (fragment vs full mjml doc) | INFERRED — bundle inspection (Pitfall 2); /api/compile conditional wrap handles both | INFERRED-FROM-SOURCE |

## Task Commits

1. **Task 1: mjAttributes.ts experiment helper** — `756599c` (feat)
2. **Task 2: CRITERION-5-FINDINGS.md** — `8f07cd0` (docs)

## Files Created

- `app/client/src/experiments/mjAttributes.ts` — Part A MJML + Part B hero fragment + runner + window global
- `.planning/phases/01-feasibility-spike-editor-core/CRITERION-5-FINDINGS.md` — full findings: Part A/B results + six checklist answers + BLOCK_DEFAULTS mitigation verdict

## Deviations from Plan

### Important Framing Correction (not a deviation from goal — a precision improvement)

The plan stated "mj-attributes defaults are confirmed silently dropped — text does NOT inherit the mj-attributes color in compiled output." This framing conflated two distinct behaviors:

- **Actual compiler behavior (DIRECTLY-OBSERVED):** `mjml@4.18.0` fully honors `mj-attributes`; the compiled HTML DOES contain `color:#ff0000` in Part A.
- **Actual editor behavior (INFERRED-FROM-SOURCE, issues #35/#17):** `grapesjs-mjml` drops `mj-attributes` during editor save/load, so it never reaches the compiler.

The `<verification_honesty>` block in the plan explicitly anticipated this trap and required honest labeling. CRITERION-5-FINDINGS.md correctly documents the compiler/editor distinction rather than asserting an incorrect "compiler drops mj-attributes" finding. The architectural conclusion is the same: BLOCK_DEFAULTS inlining is required. The evidence is now more precise.

## Known Stubs

None — this is a documentation/experiment plan; no data flow or UI stubs.

## Threat Flags

None — no new trust boundaries. Compile calls reuse the Plan 02 endpoint (T-01-01, T-01-02 inherited).

## Self-Check

Files created:
- [x] `app/client/src/experiments/mjAttributes.ts` exists (contains `mj-attributes` string, `color="#ff0000"`, references `/api/compile`)
- [x] `CRITERION-5-FINDINGS.md` exists (contains `BLOCK_DEFAULTS`, answers all 6 checklist items)

Commits verified: 756599c (feat — mjAttributes.ts), 8f07cd0 (docs — CRITERION-5-FINDINGS.md)

Grep checks:
- `mj-attributes` in mjAttributes.ts: PASS (PART_A_MJML contains it)
- `/api/compile` in mjAttributes.ts: PASS (runner uses fetch to /api/compile)
- `BLOCK_DEFAULTS` in CRITERION-5-FINDINGS.md: PASS (multiple references)
- Six checklist items answered: PASS (items 1-6 all documented with labels)
- Part B colors confirmed: #0B1624 PASS, #ffffff PASS, Calibri PASS (all directly observed)
- Criterion-5 outcome stated: PASS

## Self-Check: PASSED
