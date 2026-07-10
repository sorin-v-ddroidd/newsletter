---
task: 260704-iqo
title: Capture ActiveCampaign email-designer research
type: quick
autonomous: true
completed: 2026-07-04
---

# Quick Task 260704-iqo: Capture ActiveCampaign Email Designer Research — Summary

**One-liner:** Wrote `.planning/research/COMPETITOR-activecampaign.md` capturing ActiveCampaign's editor model, block palette, brand kit, and saved-modules concepts with a gap analysis against our GrapesJS + grapesjs-mjml builder, plus a pointer from `SUMMARY.md`.

## What was done

### Task 1: Write the ActiveCampaign competitor-analysis research doc
Created `.planning/research/COMPETITOR-activecampaign.md` with all 11 required sections:
1. Title + one-line summary + gathered date
2. Editor model — 4-level hierarchy (Section→Structure→Container→Block, mapped to `mj-wrapper`→`mj-section`→`mj-column`→blocks)
3. Block palette — 10 blocks (Image, Text, Button, Spacer, Video, Social, HTML, Banner, Timer, Menu)
4. Global Settings tab (defaults + cascade)
5. Brand Kit (AI-driven URL scrape, pinned pickers, plan-tier limits, soft guidance)
6. Saved Modules (save-as-module, Content > Saved Modules, categorizable)
7. Other features (dynamic content, merge tags, HTML escape hatch, preview, split testing, generative AI)
8. Gap analysis table vs our builder
9. Key insight (soft guidance vs. our hard locks — hard locks are the right fit for a single-brand internal tool)
10. Ideas worth stealing (section categories in block panel; user-saved modules in a later phase)
11. Sources

### Task 2: Add a pointer from research SUMMARY.md
Added a "## Related Research" section at the end of `.planning/research/SUMMARY.md` (no existing doc-index section existed to extend) with a single pointer line to the new competitor doc.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — blocking issue, documented rather than silently fixed] Plan referenced a "DATA block" of supplied research findings that was not actually present in the plan file**

- **Found during:** Task 1
- **Issue:** The plan's `<context>` and Task 1 `<action>` both state the source material ("the DATA block in the quick-task context" / "supplied verbatim in the plan below") would contain the full ActiveCampaign research, including a complete gap-analysis table and 8 source URLs. Reading the actual plan file, no such DATA block exists — only the narrative summaries embedded in the numbered section-outline (§2–§7, §9, §10) were present. A repo-wide search for distinctive terms ("ActiveCampaign", "Brand Kit", "Saved Modules", "activecampaign") found no other file containing the missing raw findings (only unrelated design-inspiration mentions in `PROJECT.md` and `02-CONTEXT.md`).
- **Fix:** Per Rule 3 (auto-fix blocking issues, no package-install exclusion applies here) and advisor guidance: wrote all sections that WERE recoverable faithfully from the plan's section outline (§2–§7, §9, §10 — these are complete, not fabricated). For the gap-analysis table (§8 / must-have artifact requirement "contains: Gap analysis"), reconstructed the "Our equivalent" column from documented project facts already in CLAUDE.md and `.claude/rules/grapesjs.md` / `mjml-email-safety.md` (BLOCK_DEFAULTS, mj-head injection, hard-locked Style Manager, no mj-raw, project-JSON canonical) rather than copying a verbatim source table that doesn't exist in-repo. For sources, included the one URL that was actually present in the plan text (`activecampaign.com/platform/email-designer`, used in the plan's own verify command) and explicitly flagged the other 7 as **not recoverable** without fabricating plausible-looking fake URLs.
- **Files modified:** `.planning/research/COMPETITOR-activecampaign.md`
- **No commit made** (see below).

## Known Gaps — Flagged for Developer

**Unmet must-have:** "all 8 source URLs" — only 1 of 8 URLs could be recovered from the plan input. The document's "Sources" section explicitly calls this out and requests the remaining 7 URLs be supplied (either by the developer or by re-consulting the parent session that performed the original ActiveCampaign research). The gap-analysis table content is real synthesis from documented project facts, not fabrication, but is explicitly marked in the doc as "reconstructed" rather than "copied from a verbatim source table" — worth a developer sanity-check against the original research if the source table becomes available later.

No other stubs. No threat-surface changes (documentation-only task, no code touched).

## Self-Check

```
FOUND: .planning/research/COMPETITOR-activecampaign.md
FOUND: .planning/research/SUMMARY.md (pointer line present)
```

Verification commands run and passed:
- `test -f .planning/research/COMPETITOR-activecampaign.md && grep -q "Gap analysis" ... && grep -q "activecampaign.com/platform/email-designer" ... && grep -q "Saved Modules" ...` → PASS
- `grep -q "COMPETITOR-activecampaign" .planning/research/SUMMARY.md` → PASS

## Self-Check: PASSED

## Files Changed (no commit made — per `.claude/rules/no-commit.md`)

- `.planning/research/COMPETITOR-activecampaign.md` (new file)
- `.planning/research/SUMMARY.md` (added "Related Research" section with pointer)

**Suggested commit message:**

```
docs(research): capture ActiveCampaign email-designer competitor analysis

Add COMPETITOR-activecampaign.md covering AC's 4-level editor hierarchy,
10-block palette, Global Settings cascade, AI Brand Kit, and Saved Modules,
with a gap analysis vs our GrapesJS + grapesjs-mjml builder and ideas worth
stealing (block-panel section categories, user-saved modules). Link it from
research SUMMARY.md.

Note: 7 of 8 source URLs are missing from the parent session's research
and need to be supplied before this doc is fully sourced.
```
