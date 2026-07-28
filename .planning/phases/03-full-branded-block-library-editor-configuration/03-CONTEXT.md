# Phase 3: Full Branded Block Library + Editor Configuration - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning
**Source:** Authored from build inventory + user design decisions (2026-07-13). Scoped to OPEN work only — several Phase 3 requirements shipped early via quick tasks.

<domain>
## Phase Boundary

Phase 3 finishes the editor guardrails and branded block library. **Critical:** roughly half of this phase already shipped through quick tasks layered on top of the Phase 1 spike. The `.planning/REQUIREMENTS.md` tracker is STALE — BLOCK-01, BLOCK-02, and EDIT-06 are marked "Pending" but are in fact implemented. This phase must plan **only the genuinely open work** and reconcile the tracker; it must NOT re-plan shipped requirements.

### Already shipped (treat as DONE — verify-only, do not re-implement)
- **BLOCK-01** — 7 branded blocks registered in `app/client/src/editor/blocks/registerBlocks.ts` (category "DDROIDD"): `ddroidd-hero`, `ddroidd-projects`, `ddroidd-new-collegues`, `ddroidd-initiatives`, `ddroidd-hiring`, `ddroidd-want-to-know-more`, `ddroidd-disclaimer`. Delivered via quick tasks.
- **BLOCK-02** — every branded block inlines styling per element via the shared `BLOCK_DEFAULTS` constant (`app/client/src/editor/blocks/BLOCK_DEFAULTS.ts`). No `mj-attributes` reliance in block content. Verified by `verify:blocks` script.
- **EDIT-06** — email-safe Style Manager allowlist is live and multi-layer enforced: 6 curated sectors in `editorConfig.ts:23-119`, `STYLABLE_BY_TYPE` per-type scoping, `EMAIL_SAFE_STYLE_PROPS` filter re-applied in the custom `RightPanel.tsx`. No flexbox/position/box-shadow/grid exposed.

### Open work (THIS phase plans these)
- **BLOCK-03** — structural locking. Currently NO `draggable`/`droppable`/`removable`/`editable`/`copyable`/`selectable` flags on any branded block (only `droppable:false` on `mj-carousel-image`). Genuinely unbuilt.
- **EDIT-07** — remove raw-HTML escape hatch. A ready, unexecuted plan exists at `.planning/quick/260709-iw7-remove-the-mj-raw-block-from-the-editor-/260709-iw7-PLAN.md` covering the `mj-raw` block removal. No code/export-code panel or MJML-import UI exists in the custom shell (confirmed — `editorConfig.ts` has no `panels.add`/`commands.add` for code; the app uses a custom `TopBar`/`LeftSidebar`/`RightPanel`). EDIT-07 = execute the mj-raw removal + assert no other raw surface is reachable.
- **EDIT-08** — constrained color/font pickers (brand palette only, not free-form).
- **NEW: Global-settings panel (width only)** — net-new, NOT an existing requirement. AC-style message-width control. Included by explicit user decision.
</domain>

<decisions>
## Implementation Decisions (LOCKED by user 2026-07-13)

### BLOCK-03 — Locking granularity
- **Lock structure; content regions editable.** Branded block section/column/layout is locked: not draggable out of place, not removable, no arbitrary drops. Only the intended **text and image** regions remain `editable` + `movable` + `removable` inside the block.
- Enforce via GrapesJS component definitions with `draggable`/`droppable`/`removable`/`editable`/`selectable` flags per component type (see `.claude/rules/grapesjs.md` "Component locking / editor guardrails").
- Layers UI already hides controls for root/mjml/mj-body and gates delete on `removable !== false` (`LeftSidebar.tsx`) — locking flags must be consistent with that gate.

### EDIT-08 — Picker value source
- **Reuse `BLOCK_DEFAULTS` for colors + the existing brand font stack.** Colors: `#0B1624` (background), `#F45E43` (accent), `#ffffff` (text); extend with a small set of approved brand shades only if the researcher finds a clear need. Fonts: the Calibri/Roboto brand stack already in `BLOCK_DEFAULTS.fontFamily`. One source of truth — do NOT author a separate parallel palette constant.
- Pickers must be **constrained** (swatch/dropdown of approved values), never free-form hex/font input.

### Global-settings panel
- **WIDTH ONLY this round.** AC-style message-width control (range ~320–900px, default 600). Pure layout — no global font/color control (that collides with EDIT-08 constraint + brand-lock and would require rewriting every block's inlined font).
- Persistence: width is user-editable global state and needs a home in the **project JSON** (`getProjectData`) and a compile path that applies it. This does not exist yet — the planner/researcher must solve where width lives and how it reaches the compiled MJML (`mj-body width`), keeping project JSON canonical (never re-parse MJML).

### Scope discipline
- Plan ONLY the open work above. Do NOT emit tasks that re-create BLOCK-01/BLOCK-02/EDIT-06.
- Reconcile `.planning/REQUIREMENTS.md`: mark BLOCK-01, BLOCK-02, EDIT-06 done with their quick-task refs so end-of-phase verification does not treat shipped work as open.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Editor guardrails & locking
- `.claude/rules/grapesjs.md` — BLOCK_DEFAULTS rules, component locking flags, restricted Style Manager, constrained pickers (EDIT-06/07/08), never-self-close-mj-tags, `usePlugin` options.
- `app/client/src/editor/editorConfig.ts` — plugin init, style sectors, custom component types, `onEditor` lifecycle window (where mj-raw removal + locking go).
- `app/client/src/editor/blocks/registerBlocks.ts` — how blocks are registered (locking flags attach here or via component types).
- `app/client/src/editor/blocks/BLOCK_DEFAULTS.ts` — the single brand-defaults source (palette + fonts for EDIT-08).

### Custom inspector / pickers
- `app/client/src/editor/RightPanel.tsx` + `app/client/src/editor/panelControls.tsx` — custom inspector primitives; constrained pickers plug in here.
- `app/client/src/editor/LeftSidebar.tsx` — layers tree; delete gated on `removable !== false` (locking must stay consistent).

### Email safety / compile / persistence
- `.claude/rules/mjml-email-safety.md` — why the allowlist + white-default rules exist.
- `app/shared/mjml-head.ts` — `CANONICAL_HEAD` + `buildFullMjml()` (mj-attributes live here at compile; relevant to the global-width propagation question).
- `app/client/src/editor/actions.ts` — `getProjectData`/`loadProjectData`, compile/export path (where global width must be persisted + applied).

### Ready sub-plan (fold in, don't duplicate)
- `.planning/quick/260709-iw7-remove-the-mj-raw-block-from-the-editor-/260709-iw7-PLAN.md` — executable mj-raw removal plan for EDIT-07.
</canonical_refs>

<specifics>
## Specific Ideas
- Locking pattern: attach `draggable`/`droppable`/`removable`/`editable` in the branded blocks' component definitions (or via `editor.Components.addType` in `editorConfig.ts`), verified in-editor (not just headless compile — the DOM-parse gotcha in `grapesjs.md` means headless verify does not catch canvas-parse issues).
- EDIT-08 pickers should reuse the existing `RightPanel`/`panelControls` primitives rather than GrapesJS default style-manager color widgets, since the custom panel already filters props.
- Global width: `mj-body width` is the natural compile target; `600px` is the current implicit default. AC uses 320–900 range.
</specifics>

<deferred>
## Deferred Ideas
- Global font/base-color control (typography in the global panel) — deferred; collides with EDIT-08 + brand-lock and needs a block-font-rewrite propagation path.
- Additional branded blocks beyond the 7 already shipped — out of scope.
</deferred>

---

*Phase: 03-full-branded-block-library-editor-configuration*
*Context authored: 2026-07-13 from build inventory + user decisions (scoped to open work)*
