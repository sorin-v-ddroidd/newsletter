# Phase 1: Feasibility Spike (Editor Core) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-25
**Phase:** 1-Feasibility Spike (Editor Core)
**Areas discussed:** Spike fate, Repo layout, Which 2 blocks, Client test path

---

## Spike Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Foundation (keep) | Build with clean structure; Phase 2 builds directly on it. Locked stack won't change. | ✓ |
| Throwaway | Quick-and-dirty proof; delete and rebuild in Phase 2. | |
| Hybrid | Keep proven glue; treat scaffolding/UI as disposable. | |

**User's choice:** Foundation (keep)
**Notes:** Versions are locked, so working integration code is worth preserving rather than re-throwing.

---

## Repo Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Subfolder /app | New app in `/app` inside this repo; existing `src/` stays as reference. | ✓ |
| client/ + server/ split | Two top-level folders at repo root. | |
| Separate repo | Brand-new repo, existing repo stays MJML-only. | |

**User's choice:** Subfolder /app
**Notes:** Keeps branded section sources next to re-authored blocks; one repo to clone. Internal `/app` layout (client+server split) left to planner.

---

## Which 2 Blocks

| Option | Description | Selected |
|--------|-------------|----------|
| hero + projects | hero = background-url + fluid-on-mobile risk; projects = multi-column/content-heavy. Max risk coverage. | ✓ |
| hero + disclaimer | hero risk + disclaimer tracking-pixel/css-class edge case; skips multi-column proof. | |
| You decide later | Defer pick to planner/researcher after inspecting feature usage. | |

**User's choice:** hero + projects
**Notes:** Chosen to prove the riskiest MJML features survive round-trip + compile.

---

## Client Test Path

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse PS scripts | Compiled HTML → QuickEmailTest.ps1 (Outlook) + EmailTester.ps1 (Gmail send). | ✓ |
| Manual send | Manually email HTML to Gmail + open in Outlook. | |
| Litmus/Email-on-Acid | Paid SaaS for cross-client screenshots. | |

**User's choice:** Reuse PS scripts
**Notes:** Tooling already works; Windows-only acceptable for a dev gate; no new harness or paid dependency.

---

## Claude's Discretion

- Internal folder structure within `/app`.
- `mj-attributes` experiment design (exit criteria #5).
- Mount approach + fallback to `grapesjs@0.21.2` + direct mount if the locked triple fails at runtime.
- localStorage key/shape for the round-trip test.

## Deferred Ideas

None — discussion stayed within phase scope.
