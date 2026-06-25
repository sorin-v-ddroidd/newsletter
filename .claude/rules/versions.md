# Locked Versions

The stack versions are **LOCKED** and verified compatible. Do not bump a pinned package without re-running the Phase 1 feasibility spike — the grapesjs / grapesjs-mjml / @grapesjs/react / mjml relationship is a fragile compatibility triangle, not a free upgrade.

**Canonical tables live in `CLAUDE.md`** (the version triple, the compatibility triangle, the "What NOT to Use" list, and rationale). This file is the rule; CLAUDE.md is the data. Don't duplicate the tables here — they will drift.

## The load-bearing pins (memorize these)

- `grapesjs@0.22.16` — satisfies `@grapesjs/react@2.0.0` peerDep `^0.22.5`. **Not** 0.23.x (outside peer range, untested).
- `grapesjs-mjml@1.0.8` — tested against 0.21.x; 0.22.16 is install-clean but runtime-verified only by the Phase 1 spike.
- `@grapesjs/react@2.0.0` — official wrapper.
- `mjml@4.18.0` (server) **must** match the bundled `mjml-browser@4.18.0`. **Never** mjml v5 — breaks preview/export parity (see `mjml-email-safety.md`).

## What NOT to use (the traps)

- `grapesjs@0.23.x`, `mjml@5.x`, `grapesjs-react` (old unscoped package), `localStorage` for the JWT, SQLite. Full reasoning in CLAUDE.md.

## If a bump is genuinely needed

1. State why (security CVE, blocking bug).
2. Re-verify the triangle: editor mounts, blocks drop, project-JSON round-trip lossless, server compile === browser preview, renders in Outlook + Gmail.
3. Update the CLAUDE.md tables and this rule together.
