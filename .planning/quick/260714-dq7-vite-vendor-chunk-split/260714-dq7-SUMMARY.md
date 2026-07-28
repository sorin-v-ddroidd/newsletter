---
quick_id: 260714-dq7
slug: vite-vendor-chunk-split
status: complete
date: 2026-07-14
---

# Summary 260714-dq7: Vite vendor chunk splitting

## What changed

`app/client/vite.config.ts` — added a `build` block:
- `chunkSizeWarningLimit: 1500` (silences the misleading >500kB warning)
- `rollupOptions.output.manualChunks` (function form) splitting `grapesjs`,
  `mjml-browser`, `grapesjs-mjml` each into its own vendor chunk

## Gotcha

Vite 8 uses **rolldown**, which rejects the object form of `manualChunks`
(`TypeError: manualChunks is not a function`). Must use the **function form**
`manualChunks(id) { ... }`. Order matters: match `grapesjs-mjml` before `grapesjs`
or the more specific package is swallowed by the substring rule.

## Before → after (production build)

| Chunk | Before | After |
|-------|--------|-------|
| `NewsletterEditor-*.js` | **3,662 kB** (1,033 kB gz) | 183 kB (53 kB gz) — our editor code only |
| `grapesjs-*.js` | — | 1,071 kB (287 kB gz) |
| `mjml-browser-*.js` | — | 1,178 kB (342 kB gz) |
| `grapesjs-mjml-*.js` | — | 1,228 kB (353 kB gz) |
| `index-*.js` (entry) | 232 kB | 232 kB (unchanged) |

Total editor payload **unchanged** — this is a caching/parallelism change, not a
size reduction. Repeat editor opens after a deploy now re-download only the 183kB
editor chunk; the three ~1MB vendor libs stay cached. First open downloads them in
parallel. Size-warning noise gone.

## Verification

- `npm run build` (includes `tsc --noEmit`) — passes, no warnings
- Four separate chunks emitted as expected; no single 3MB+ chunk
- No source/runtime change; editor behavior untouched

## Not done (out of scope / rule)

- Not committed — project `no-commit.md` rule. Files + suggested message surfaced to dev.
