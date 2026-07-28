---
phase: 03-full-branded-block-library-editor-configuration
plan: 04
subsystem: editor
tags: [grapesjs, mjml, mj-body, global-settings, width, compile-gate]

requires:
  - phase: 03-03
    provides: shared editorConfig/panelControls/RightPanel guardrail surface
provides:
  - Global Settings message-width control (320–900, default 600) in the TopBar
  - mj-body style.width as the single width source of truth, reaching compiled mj-body width
  - Automated compile assertion that a non-default width survives to HTML
affects: [export, global-settings]

tech-stack:
  added: []
  patterns:
    - "One clamped WidthRangeField primitive + one connected MessageWidthControl reused by TopBar and RightPanel — single width behavior"
    - "Self-contained gear popover in TopBar (local state + fixed backdrop) — no new popover dependency"

key-files:
  created: []
  modified:
    - app/client/src/editor/editorConfig.ts
    - app/client/src/editor/actions.ts
    - app/client/src/editor/panelControls.tsx
    - app/client/src/editor/RightPanel.tsx
    - app/client/src/editor/TopBar.tsx
    - app/server/scripts/verify-compile.ts

key-decisions:
  - "mj-body style.width is the ONE source of truth (no parallel global-settings JSON blob). Clamp lives in the control + setMessageWidth."
  - "findMjBody walks by tagName (depth-agnostic) — not a hardcoded index (RESEARCH Open Question 2)."
  - "Pitfall 5 resolved: RightPanel renders the clamped MessageWidthControl for mj-body instead of the generic unclamped PairedField."
  - "TopBar Global Settings uses a self-contained gear popover (no shadcn popover primitive existed; avoided adding a dependency mid-phase)."

patterns-established:
  - "Editor-connected controls read window.__ddroiddEditor (same access as the TopBar action handlers)."

requirements-completed: [WIDTH-01]

duration: ~30min
completed: 2026-07-13
---

# Phase 3 / Plan 04: Global message-width control (WIDTH-01)

**A clamped 320–900 message-width control in a TopBar Global Settings popover, backed by mj-body style.width (single source of truth), consistent in the RightPanel, and proven to reach compiled `max-width:750px`. tsc + verify:compile green; in-editor human-verify PENDING.**

## Performance
- **Duration:** ~30 min
- **Completed:** 2026-07-13T09:20Z
- **Tasks:** 3/3 auto (Task 4 human-verify deferred to consolidated session)
- **Files modified:** 6

## Accomplishments
- **Task 1:** `STYLABLE_BY_TYPE['mj-body'] = ['width']` (background-color omitted — WIDTH ONLY). `actions.ts` gains depth-agnostic `findMjBody` + exported `getMessageWidth` (parse mj-body style.width, fallback 600) and `setMessageWidth` (clamp [320,900] → `mjBody.addStyle({ width })`), plus exported `MESSAGE_WIDTH_MIN/MAX/DEFAULT`. actions.ts stays React-free.
- **Task 2:** shared controlled `WidthRangeField` (range + number, clamps in onChange) and a connected `MessageWidthControl` (wires get/setMessageWidth via `window.__ddroiddEditor`) in panelControls.tsx. TopBar gains a Global Settings gear popover (self-contained, local state + fixed backdrop) rendering `MessageWidthControl`. RightPanel `renderLayout` renders `MessageWidthControl` for mj-body (Pitfall 5) instead of the generic unclamped width field.
- **Task 3:** verify-compile.ts Fixture 4 feeds `<mj-body width="750px">` through the real `compileNewsletter` (buildFullMjml + pinned compiler) and asserts `max-width:750px` in the HTML — probed live to confirm MJML emits that marker.

## Files Created/Modified
- `editorConfig.ts` — `'mj-body': ['width']` in STYLABLE_BY_TYPE.
- `actions.ts` — width constants + `findMjBody`/`getMessageWidth`/`setMessageWidth`.
- `panelControls.tsx` — `WidthRangeField` + `MessageWidthControl`; imports width helpers.
- `RightPanel.tsx` — `isMjBody` branch → `MessageWidthControl` in Layout.
- `TopBar.tsx` — Global Settings gear popover.
- `verify-compile.ts` — non-default-width compile assertion (Fixture 4).

## Decisions Made
- One `MessageWidthControl` shared by both surfaces guarantees a single behavior (no divergent controls).
- Self-contained popover over adding `@radix-ui/react-popover` — avoided a dependency install mid-phase; internal-tool-appropriate.

## Deviations from Plan
None material. The plan allowed "gear item OR small popover" for the entry point — chose a self-contained gear popover (no popover primitive existed). A temporary `_width-probe.ts` was written to confirm the compiled width marker, then deleted.

## Issues Encountered
- Needed to know how MJML renders mj-body width; probed the compile path (`max-width:750px`, `width:750px`, `width="750"` all present) and asserted on the stable `max-width:750px`.

## Verification
- `cd app/client && npx tsc --noEmit` → clean.
- `cd app/server && npm run verify:compile` → all 12 assertions PASS (incl. width fixture).
- `npm run verify:blocks` → 8/8 PASS (no regression from editorConfig change).
- grep acceptance: mj-body in editorConfig, setMessageWidth in actions, WidthRangeField in panelControls, MessageWidthControl in TopBar + RightPanel — all present.
- **PENDING (human-verify, blocking):** at localhost:5173 — Global Settings shows current width (600); set 720 changes canvas; clamps <320/>900; Save→Load persists; Export reflects width on mj-body; RightPanel mj-body uses the same clamped control; no console errors. Consolidated into the phase-end checkpoint.

## Commits
None — `.claude/rules/no-commit.md` (GSD-without-commits). Uncommitted; suggested message at phase end.

## Next Phase Readiness
- All Phase 3 code complete; only the consolidated live-editor human-verify remains before phase verification.

---
*Phase: 03-full-branded-block-library-editor-configuration*
*Completed: 2026-07-13*
