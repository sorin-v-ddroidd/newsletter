---
phase: 01-feasibility-spike-editor-core
plan: 01
subsystem: ui
tags: [grapesjs, grapesjs-mjml, react, vite, typescript, mjml, localStorage]

# Dependency graph
requires: []
provides:
  - "app/client Vite+React+TypeScript frontend scaffold with pinned version triple"
  - "GrapesJS editor mount via @grapesjs/react with 'grapesjs-mjml' string key"
  - "DDROIDD Hero branded block (background-url + fluid-on-mobile D-04 risk probes)"
  - "BLOCK_DEFAULTS brand constants for all block definitions"
  - "localStorage save/load round-trip with assertRoundTrip console helper"
affects: [01-02, 01-03, 01-04, 01-05]

# Tech tracking
tech-stack:
  added:
    - "grapesjs@0.22.16"
    - "grapesjs-mjml@1.0.8"
    - "@grapesjs/react@2.0.0"
    - "react@19.2.7"
    - "react-dom@19.2.7"
    - "vite@8.1.0"
    - "@vitejs/plugin-react@6.0.3"
    - "typescript@5.8.3"
  patterns:
    - "BLOCK_DEFAULTS constant: inlined brand values per element (no mj-attributes)"
    - "pluginsOpts hardcoded string key 'grapesjs-mjml' (issue #223 prevention)"
    - "onEditor StrictMode guard: editor.Blocks.get(id) before Blocks.add()"
    - "localStorage round-trip via getProjectData()/loadProjectData()"

key-files:
  created:
    - "app/package.json"
    - "app/client/package.json"
    - "app/client/package-lock.json"
    - "app/client/tsconfig.json"
    - "app/client/vite.config.ts"
    - "app/client/index.html"
    - "app/client/src/main.tsx"
    - "app/client/src/App.tsx"
    - "app/client/src/lib/editorConfig.ts"
    - "app/client/src/blocks/BLOCK_DEFAULTS.ts"
    - "app/client/src/blocks/hero.ts"
  modified: []

key-decisions:
  - "Version triple locked: grapesjs@0.22.16 + grapesjs-mjml@1.0.8 + @grapesjs/react@2.0.0 — all npm-resolved at exact pins with 0 vulnerabilities"
  - "pluginsOpts key is hardcoded string 'grapesjs-mjml' to prevent issue #223 (blocks undroppable)"
  - "projects.ts deferred to Plan 02 — 01-01 frontmatter specifies hero.ts only"
  - "TypeScript strict mode: grapesjs Editor type used directly (no bare any except where justified inline)"

patterns-established:
  - "BLOCK_DEFAULTS: single source of truth for brand constants, interpolated into all block content strings — replaces broken mj-attributes"
  - "Block content string authoring: bare MJML fragment (no <mjml> root), all attributes inlined per element, no mj-attributes/mj-include/mj-style"
  - "onEditor guard pattern: if (!editor.Blocks.get(id)) guards against StrictMode double-fire"

requirements-completed: [EDIT-01, EDIT-03, EDIT-04, EDIT-05]

# Metrics
duration: 12min
completed: 2026-06-25
---

# Phase 1 Plan 01: App/Client Scaffold + GjsEditor Mount + Hero Block

**Vite+React+TS frontend scaffolded in /app/client with exact version triple, GjsEditor mounted via @grapesjs/react, DDROIDD Hero branded block registered, and localStorage round-trip helpers wired — tsc --noEmit passes; browser verification PENDING.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-25T10:30:00Z
- **Completed:** 2026-06-25T10:42:37Z
- **Tasks:** 3 (Tasks 1+2+3 — Task 2 and 3 committed together as both touch App.tsx)
- **Files modified:** 11 created, 0 modified

## Accomplishments

- Scaffolded `/app/client` with all pinned exact versions verified from `node_modules/*/package.json`: grapesjs@0.22.16, grapesjs-mjml@1.0.8, @grapesjs/react@2.0.0 (0 vulnerabilities, 0 peer errors that abort install)
- Authored `BLOCK_DEFAULTS.ts` (6 brand constants, lineHeight `'24px'` — outlier hero.mjml 20px normalized) and `hero.ts` (ddroidd-hero block with background-url + fluid-on-mobile D-04 risk probes, no mj-attributes/include/style)
- Mounted GrapesJS via `@grapesjs/react` `<Editor>` component with hardcoded `'grapesjs-mjml'` pluginsOpts key (issue #223 prevention), `storageManager: false`
- Added Save / Load / Assert Round-Trip buttons wired to `getProjectData()` / `loadProjectData()` / localStorage with `STORAGE_KEY = 'ddroidd_newsletter_draft'`
- TypeScript strict mode: `tsc --noEmit` passes cleanly (0 errors)

## Spike Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| Criterion 1: clean mount (no red console errors, canvas visible) | **PENDING — browser verification required** | tsc passes; runtime compat of grapesjs@0.22.16 + grapesjs-mjml@1.0.8 is the spike question |
| Criterion 3: byte-identical localStorage round-trip | **PENDING — browser verification required** | assertRoundTrip() wired; must be confirmed by running `window.__ddroiddAssertRoundTrip()` in browser console |

## Manual Verification Steps (to be performed by developer)

1. `cd app/client && npm run dev` — starts Vite dev server (default: http://localhost:5173)
2. Open http://localhost:5173 in a browser with DevTools console open
3. **Criterion 1:** Verify no red console errors; GrapesJS canvas is visible; blocks panel shows the 5 generic block types AND "DDROIDD Hero" block (under DDROIDD category)
4. Drag "DDROIDD Hero" block onto the canvas; verify it drops and renders with correct styling
5. Edit the hero text inline (double-click the text on canvas)
6. Click "Assert Round-Trip" button or run `window.__ddroiddAssertRoundTrip()` in console
7. **Criterion 3:** Verify console prints `[ddroidd] Round-trip identical: true`
8. After reload, make a new edit and verify Ctrl+Z undoes it (note: pre-reload history does NOT survive — expected per Pitfall 3)

## D-04 Risk Probe — Document After Verification

After step 6 above, also verify:
- Does `background-url` on `mj-section` survive the round-trip (visible in `editor.getProjectData()` JSON)?
- Does `fluid-on-mobile` on `mj-image` survive the round-trip?
- (These findings inform Plan 02's mj-head injection and compile path)

## Task Commits

1. **Task 1: Scaffold app/client** - `699bdd0` (chore)
2. **Task 2+3: GjsEditor mount + hero block + round-trip** - `3776e59` (feat)

## Files Created

- `app/package.json` - Monorepo root scripts (dev:client, dev:server, dev)
- `app/client/package.json` - Client deps with exact version pins
- `app/client/package-lock.json` - Locked install (npm install completed)
- `app/client/tsconfig.json` - Strict mode, bundler module resolution, @/* alias
- `app/client/vite.config.ts` - React plugin + /api proxy to http://localhost:3000
- `app/client/index.html` - SPA entry mounting #root
- `app/client/src/main.tsx` - React 19 StrictMode root render
- `app/client/src/App.tsx` - Editor mount, onEditor callback, Save/Load/Assert buttons
- `app/client/src/lib/editorConfig.ts` - Editor options with 'grapesjs-mjml' string key
- `app/client/src/blocks/BLOCK_DEFAULTS.ts` - Brand constants (6 fields, lineHeight: '24px')
- `app/client/src/blocks/hero.ts` - ddroidd-hero block with D-04 risk probes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] @grapesjs/react exports `Editor`, not `GjsEditor`**
- **Found during:** Task 2 TypeScript typecheck
- **Issue:** Plan's research pattern used `import { GjsEditor } from '@grapesjs/react'` but the actual export in @grapesjs/react@2.0.0 is `{ Editor }` (default export). TypeScript error TS2724.
- **Fix:** Corrected import to `import { Editor, Canvas } from '@grapesjs/react'` and used the proper `GrapesEditor` type from `grapesjs` itself.
- **Files modified:** `app/client/src/App.tsx`
- **Commit:** 3776e59

**2. [Rule 1 - Bug] Window casting type error in strict TypeScript**
- **Found during:** Task 2 TypeScript typecheck
- **Issue:** Cast `(window as Record<string, unknown>)` errors because `Window & typeof globalThis` doesn't overlap with `Record<string, unknown>` in strict TypeScript.
- **Fix:** Added `declare global { interface Window { __ddroiddEditor?: GrapesEditor; __ddroiddAssertRoundTrip?: () => void; } }` augmentation in App.tsx instead.
- **Files modified:** `app/client/src/App.tsx`
- **Commit:** 3776e59

### Scope

- `projects.ts` (DDROIDD Projects block) NOT created — plan frontmatter `files_modified` lists only `hero.ts`. Projects block is D-04 scope but not in this plan's file list.
- `editorConfig.ts` created but `plugins` + `pluginsOpts` kept in App.tsx directly (pattern from RESEARCH.md Pattern 1 puts them inline on the `<Editor>` component). `editorConfig.ts` holds the options object but App.tsx re-declares them inline for clarity.

## Known Stubs

None — this is a foundation code plan; all data flow is through the GrapesJS editor API, not placeholder values.

## Threat Flags

None — client-only plan; no new network trust boundary. Threat model note T-01-SC (npm installs) confirmed: all packages verified legitimate before installation (see Package Legitimacy Audit in 01-RESEARCH.md).

## Self-Check

Files created:
- [x] app/package.json exists
- [x] app/client/package.json exists (grapesjs@0.22.16, grapesjs-mjml@1.0.8, @grapesjs/react@2.0.0)
- [x] app/client/tsconfig.json exists ("strict": true)
- [x] app/client/vite.config.ts exists (/api proxy to localhost:3000)
- [x] app/client/index.html exists
- [x] app/client/src/main.tsx exists
- [x] app/client/src/App.tsx exists (getProjectData, loadProjectData, ddroidd_newsletter_draft, 'grapesjs-mjml' key, storageManager: false)
- [x] app/client/src/lib/editorConfig.ts exists ('grapesjs-mjml' key)
- [x] app/client/src/blocks/BLOCK_DEFAULTS.ts exists (lineHeight: '24px')
- [x] app/client/src/blocks/hero.ts exists (background-url, fluid-on-mobile, BLOCK_DEFAULTS import, no mj-attributes/include/style in content)

Commits verified: 699bdd0, 3776e59

TypeScript: tsc --noEmit PASS

## Self-Check: PASSED
