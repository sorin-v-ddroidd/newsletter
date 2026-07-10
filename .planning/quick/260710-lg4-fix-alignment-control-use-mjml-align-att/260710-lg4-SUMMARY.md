---
phase: quick
plan: 260710-lg4
subsystem: editor
tags: [grapesjs, mjml, style-manager, alignment, EDIT-06]
requirements: [EDIT-06]
key-files:
  modified:
    - app/client/src/editor/editorConfig.ts
    - app/client/src/editor/panelControls.tsx
    - app/client/src/editor/RightPanel.tsx
decisions:
  - "Added a new `align` Style Manager property (left/center/right, no justify) alongside the existing `text-align`, scoped via STYLABLE_BY_TYPE instead of replacing text-align globally — mj-section keeps text-align (its only legal alignment attribute), all other alignable components (mj-text, mj-button, mj-image, mj-divider, mj-social-element) now use `align`."
metrics:
  duration: "~25 min"
  completed: "2026-07-10"
---

# Phase quick Plan 260710-lg4: Fix Alignment Control (MJML `align` attribute) Summary

Alignment control now writes the legal MJML `align` attribute on mj-text/mj-button/mj-image/mj-divider/mj-social-element (previously wrote illegal `text-align`, which MJML silently ignores) — canvas re-renders centered and export contains `align="center"` with no stray `text-align`; mj-section retains `text-align`.

## What Changed

1. **`app/client/src/editor/editorConfig.ts`**
   - Added a new `align` property to the `typography` StyleManager sector (`type: 'select'`, options `left`/`center`/`right`, `justify` deliberately excluded — not valid on image/button/divider). Placed immediately before the existing `text-align` entry; both remain in the sector.
   - `STYLABLE_BY_TYPE`: replaced `'text-align'` with `'align'` for `mj-text` and `mj-button`; added `'align'` to `mj-image`, `mj-divider`, and `mj-social-element`. `mj-section` unchanged (`text-align` only — no `align`).
   - `EMAIL_SAFE_STYLE_PROPS` untouched — it derives from `styleManagerSectors` via `flatMap`, so `align` is included automatically.

2. **`app/client/src/editor/panelControls.tsx`**
   - `resolveAlignIcon`: first branch condition changed from `propId === 'text-align'` to `propId === 'align' || propId === 'text-align'`, so the segmented icon group renders the same left/center/right icons for the new `align` property. Vertical-align branch untouched.

3. **`app/client/src/editor/RightPanel.tsx`**
   - Added `const align = getProp('align');`.
   - `renderAlignment` null-guard extended to `if (!align && !textAlign && !verticalAlign)`.
   - Renders `{align && <SegmentedIconGroup prop={align} />}` before the existing `textAlign` line. For any given selection only one of `align`/`textAlign` is ever populated (mj-section shows `text-align`; everything else in STYLABLE_BY_TYPE's alignable set shows `align`), so both coexisting in the render tree is safe.

## Verification

### Type-check
```
cd app/client && npx tsc --noEmit
```
Clean — no errors.

### Runtime (Playwright, playwright@1.61.1 from the session scratchpad)

Killed 3 stale dev servers (ports 3000/5173/5174 held pre-existing sessions), started a fresh `npm run dev` (client on **5173** this run, server on 3000), then ran two Playwright scripts against the live editor at `http://localhost:5173`:

**1. Editor-API-level check (`lg4-verify.mjs`)** — built an `mj-section > mj-column > mj-text/mj-button/mj-image/mj-divider`, selected each, and asserted:
- `alignPropFound: true` — the `align` StyleManager property resolves.
- `mjTextCanvasHasAlignCenter: true` — after `alignProp.upValue('center')`, canvas `<td align="center">` present (the MJML-rendered alignment cell).
- `mjTextExportTag: '<mj-text align="center">'` — `mjTextExportHasAlignCenter: true`, `mjTextExportHasTextAlign: false`. **No illegal `text-align` attribute emitted.**
- `sectionTextAlignProp: true`, `sectionHasTextAlignInStylable: true`, `sectionHasAlignInStylable: false` — mj-section still exposes `text-align` only, never `align`.
- `buttonHasAlignInStylable: true`, `imageHasAlignInStylable: true`, `dividerHasAlignInStylable: true` — mj-button/mj-image/mj-divider all expose `align` in their per-instance `stylable` list.
- One benign console error (`ERR_CONNECTION_CLOSED` for a `via.placeholder.com` test image — sandboxed network, unrelated to the fix).

**2. Real UI click-path check (`lg4-ui-verify.mjs`)** — selected an mj-text via the editor API, then drove the actual RightPanel DOM (not the API) exactly as a user would:
- `HAS_ALIGNMENT_HEADING: true` — the right panel (`aside.overflow-y-auto`, distinct from the left blocks/layers `aside`) renders an "Alignment" section for the selected mj-text.
- `ARIA_LABELS: ["left","center","right"]` — `SegmentedIconGroup` rendered exactly 3 icon buttons for the `align` prop (via `resolveAlignIcon`), confirming Task 1's icon-mapping change renders correctly for `propId: 'align'`.
- Clicked the real `button[aria-label="center"]` in the DOM.
- `EXPORT_TAG_AFTER_UI_CLICK: '<mj-text align="center">'` — confirms the full user-facing path (click → `prop.upValue` → `editor.getHtml()`) produces the correct, legal MJML attribute.

All three checkpoint assertions from the plan are satisfied with runtime evidence; none deferred to human-verify.

Dev servers (client 5173, server 3000) were stopped after verification to avoid leaving a stale server for the next session (per MEMORY: stale-dev-servers note).

## Deviations from Plan

None — plan executed exactly as written. The checkpoint task (Task 2, `checkpoint:human-verify`) was satisfied via automated Playwright runtime proof per the constraint allowing self-verification, rather than pausing for a human.

## Self-Check

- `app/client/src/editor/editorConfig.ts` — FOUND, contains `align` property + updated STYLABLE_BY_TYPE.
- `app/client/src/editor/panelControls.tsx` — FOUND, `resolveAlignIcon` updated.
- `app/client/src/editor/RightPanel.tsx` — FOUND, `align` wired into `renderAlignment`.
- `npx tsc --noEmit` — PASSED (no output, clean exit).
- Playwright runtime checks — PASSED (see Verification section above; raw JSON output captured during execution).

## Self-Check: PASSED

## Changed Files (for manual commit — no-commit rule in effect)

- `app/client/src/editor/editorConfig.ts` (modified)
- `app/client/src/editor/panelControls.tsx` (modified)
- `app/client/src/editor/RightPanel.tsx` (modified)

**Suggested commit message:**

```
fix(editor): use MJML `align` attribute instead of illegal `text-align` for alignable components

Alignment control previously wrote CSS text-align on mj-text/mj-button/mj-image/
mj-divider/mj-social-element, which MJML silently ignores (illegal attribute on
those tags) — alignment did nothing on canvas or in exported HTML. Added a
scoped `align` StyleManager property (left/center/right) and rewired
STYLABLE_BY_TYPE so those five component types use `align` while mj-section
keeps `text-align` (its only legal alignment attribute). Updated
resolveAlignIcon + RightPanel to render/wire the new property.

Verified via Playwright against the live editor (localhost:5173): canvas
td[align=center], exported <mj-text align="center"> with no text-align, and
mj-section still exposes text-align only.
```
