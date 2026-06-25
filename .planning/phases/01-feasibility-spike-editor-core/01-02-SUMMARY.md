---
phase: 01-feasibility-spike-editor-core
plan: "02"
subsystem: server
tags: [express, mjml, compile, api, server]
dependency_graph:
  requires: []
  provides: [compile-endpoint, dist-spike-output]
  affects: [01-03-client-compile-integration, 01-05-render-gate]
tech_stack:
  added:
    - express@5.2.1
    - cors@2.8.6
    - dotenv@17.4.2
    - mjml@4.18.0 (exact pin, matches mjml-browser@4.18.0)
    - tsx@4.22.4 (dev)
    - typescript@^5.7.0 (dev)
  patterns:
    - Express 5 thin route + service-less compile
    - ESM __dirname via fileURLToPath
    - Conditional MJML wrap regex /<mjml/i
key_files:
  created:
    - app/server/package.json
    - app/server/tsconfig.json
    - app/server/package-lock.json
    - app/server/src/index.ts
    - app/server/src/routes/compile.ts
  modified: []
decisions:
  - "Use fileURLToPath(import.meta.url) for ESM __dirname instead of process.cwd() to ensure dist/spike-output.html resolves to the repo root regardless of launch directory"
  - "dist/spike-output.html write is non-fatal: compile still returns HTML even if file write fails, so curl verification always gets a usable response"
metrics:
  duration_minutes: 12
  completed_date: "2026-06-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 0
---

# Phase 01 Plan 02: Express Server + /api/compile Summary

**One-liner:** Express 5 compile server with conditional MJML wrap, mjml@4.18.0, CORS restricted to :5173, 1MB body limit, and server-side `dist/spike-output.html` write.

## What Was Built

Scaffolded `app/server` with an Express 5 + TypeScript backend exposing `POST /api/compile`. The endpoint accepts a `{ mjml: string }` body, conditionally wraps bare MJML fragments (using `/<mjml/i` to detect full documents), compiles via `mjml2html@4.18.0`, writes the result to `dist/spike-output.html` at the repo root, and returns `{ html, errors }`.

Security mitigations T-01-01 (1MB body limit) and T-01-02 (CORS restricted to `http://localhost:5173`) are applied in `index.ts`.

## Curl Verification Evidence

### Test 1 — Bare fragment (conditional wrap path)

```bash
curl -s -X POST http://localhost:3000/api/compile \
  -H "Content-Type: application/json" \
  -d '{"mjml":"<mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section>"}'
```

**Response (first 150 chars of `html`):**
```
<!doctype html>
<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsof
```

Result: Valid client-safe HTML. Fragment was wrapped to `<mjml><mj-body>...<mj-body></mjml>` before compile.

### Test 2 — Full `<mjml>` document (passthrough path)

```bash
curl -s -X POST http://localhost:3000/api/compile \
  -H "Content-Type: application/json" \
  -d '{"mjml":"<mjml><mj-body><mj-section><mj-column><mj-text>Hello</mj-text></mj-column></mj-section></mj-body></mjml>"}'
```

**Response (first 150 chars of `html`):**
```
<!doctype html>
<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsof
```

Result: Valid HTML, no double-wrapping. The `/<mjml/i` test correctly detected the root and passed through unchanged.

### Test 3 — Body limit (>1MB)

```bash
# 1.1MB JSON payload
curl -X POST http://localhost:3000/api/compile -H "Content-Type: application/json" --data-binary @big_payload.json
```

**HTTP Status: 413** — Express `express.json({ limit: '1mb' })` rejected the oversized body before route handler.

### dist/spike-output.html — confirmed written

```
dist/spike-output.html path: <worktree-root>/dist/spike-output.html
File size: 3907 bytes
First lines:
  <!doctype html>
  <html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" ...
```

The server uses `fileURLToPath(import.meta.url)` + `path.resolve(__dirname, '../../../../')` to anchor the path to the repo root regardless of server launch directory (avoiding the `process.cwd()` → `app/server/dist/` trap).

### CORS — present and configured

`cors({ origin: 'http://localhost:5173' })` is applied in `index.ts`. Note: curl bypasses CORS (no `Origin` header enforcement by Express/cors middleware); CORS is browser-enforced. The criterion is that the middleware is present and correctly configured — confirmed by grep.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new trust boundaries introduced beyond those in the plan's threat model.

## Self-Check

- [x] `app/server/package.json` — exists, contains express/cors/dotenv/mjml
- [x] `app/server/tsconfig.json` — exists, `"strict": true`
- [x] `app/server/src/index.ts` — exists, cors + express.json + mount on /api
- [x] `app/server/src/routes/compile.ts` — exists, /<mjml/i regex + mjml2html + spike-output write
- [x] `app/server/node_modules/mjml/package.json` version: `4.18.0` (exact)
- [x] curl fragment test — returns `<!doctype html` ✓
- [x] curl full-doc test — returns `<!doctype html`, no double-wrapping ✓
- [x] curl >1MB test — HTTP 413 ✓
- [x] `dist/spike-output.html` — written, starts with `<!doctype html` ✓
- [x] Commits: 38beadc (scaffold), b81bd32 (compile endpoint)

## Self-Check: PASSED
