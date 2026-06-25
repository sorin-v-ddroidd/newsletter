# Plan Before Implement

This project plans through **GSD** (see CLAUDE.md → "GSD Workflow Enforcement"). GSD is the source of truth for what to build and in what order; do not freelance implementation outside it.

## The flow

1. **Route through a GSD command** before changing repo code:
   - `/gsd-quick` — small fixes, doc updates, ad-hoc tasks
   - `/gsd-debug` — investigation / bug fixing
   - `/gsd-execute-phase` — planned phase work
   - `/gsd-plan-phase` / `/gsd-discuss-phase` — when the phase isn't planned yet
2. **Reach shared understanding before code.** Whether via the GSD discuss step or the `grill-with-docs` skill, resolve the unknowns first by exploring the codebase and the `.planning/` artifacts — don't ask the user what the repo can answer.
3. **Only then write code.**

## What planning must resolve (minimum)

- Exact scope; what's explicitly out of scope (check `.planning/REQUIREMENTS.md` "Out of Scope").
- Happy-path inputs/outputs.
- Failure modes: network errors, missing data, invalid input, race conditions.
- Empty / loading / error UI states.
- Shared state or cross-boundary effects.
- Existing patterns/components to reuse (check the rules in this folder + `.planning/`).
- What "done" looks like — and for email work, that includes a real-client render check (`mjml-email-safety.md`), not just a passing compile.

## Phase 1 is a hard gate
Per `.planning/ROADMAP.md`, the GrapesJS/grapesjs-mjml feasibility spike must pass **all** its exit criteria before any auth/DB/storage work. Do not build Phase 2+ infrastructure ahead of that gate.

## Exceptions
Skip the planning ceremony only when the user explicitly says "skip planning" / "no grilling" / "just implement it" — or uses `/gsd-fast` for a trivial task.
