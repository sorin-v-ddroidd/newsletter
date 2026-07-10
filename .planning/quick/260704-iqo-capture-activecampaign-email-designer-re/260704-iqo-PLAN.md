---
phase: quick-260704-iqo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/research/COMPETITOR-activecampaign.md
  - .planning/research/SUMMARY.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "A competitor-analysis doc for ActiveCampaign's email designer exists under .planning/research/"
    - "The doc captures the editor model, block palette, global settings, brand kit, saved modules, gap analysis vs our GrapesJS builder, key insight, and ideas-to-steal"
    - "The existing research SUMMARY.md points to the new competitor doc"
  artifacts:
    - path: ".planning/research/COMPETITOR-activecampaign.md"
      provides: "ActiveCampaign email designer competitor analysis + gap analysis vs our build"
      contains: "Gap analysis"
  key_links:
    - from: ".planning/research/SUMMARY.md"
      to: ".planning/research/COMPETITOR-activecampaign.md"
      via: "reference/pointer line"
      pattern: "COMPETITOR-activecampaign"
---

<objective>
Capture the already-completed ActiveCampaign email-designer research (performed in the parent session) into a durable competitor-analysis document under `.planning/research/`, matching the existing ALL-CAPS research-doc naming convention.

Purpose: Preserve competitor findings and the gap analysis vs our GrapesJS + grapesjs-mjml builder so future planning (curated blocks, section categories, user-saved modules) can reference them instead of re-researching.
Output: `.planning/research/COMPETITOR-activecampaign.md` plus a one-line pointer added to `.planning/research/SUMMARY.md`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/research/SUMMARY.md

# Naming convention: research docs are ALL-CAPS (ARCHITECTURE.md, FEATURES.md,
# PITFALLS.md, STACK.md, SUMMARY.md). The new doc follows the same pattern.
# This is a DOCUMENTATION-ONLY task. No code changes. No new web research —
# the source material is supplied verbatim in the plan below.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write the ActiveCampaign competitor-analysis research doc</name>
  <files>.planning/research/COMPETITOR-activecampaign.md</files>
  <action>
Create `.planning/research/COMPETITOR-activecampaign.md` from the research findings supplied by the parent session (the DATA block in the quick-task context). Do NOT perform any new web research and do NOT alter the substance of the findings — transcribe them faithfully into a well-structured markdown doc.

Structure the document with these sections (using the supplied content):
1. Front-matter/title + a one-line summary and the gathered date (2026-07-04).
2. "Editor model — 4-level hierarchy" (Section → Structure → Container → Block, and the 1:1 MJML mapping mj-wrapper → mj-section → mj-column → blocks).
3. "Block palette — 10 blocks" (Image, Text, Button, Spacer, Video, Social, HTML, Banner, Timer, Menu; note the Spacer hide toggles).
4. "Global Settings tab" (default font, heading styles, paragraph spacing, link underline, button theme; the global→Section→Structure→Container→Block cascade).
5. "Brand Kit (AI Brand Kit)" (URL scrape → logo/colors/fonts/description/mission/socials; brand colors pinned in pickers; plan limits 1 vs up to 5; soft guidance not hard locks).
6. "Saved Modules" (save-as-module flow, appears under Content > Saved Modules, categorizable/searchable).
7. "Other features" (dynamic/conditional content, merge tags, HTML escape hatch, responsive preview, split testing up to 5, generative AI; table-based responsive HTML output).
8. "Gap analysis vs our GrapesJS + grapesjs-mjml builder" — reproduce the comparison table (AC ingredient | Our equivalent | Status) exactly, preserving each row.
9. "Key insight" (AC = soft guidance via defaults + brand-pinned pickers + saved modules; ours = hard locks; hard locks better for a single-brand internal tool).
10. "Ideas worth stealing beyond current plan" (1: Section categories in the block panel — Header/Content/Footer grouping; 2: user-saved modules in a later phase — persist component subtree JSON, register as dynamic block).
11. "Sources" — list all 8 URLs verbatim.

Use standard project markdown conventions. Keep the gap-analysis table intact as a markdown table. Do not inline code fences unless quoting; this is prose/tabular documentation.
  </action>
  <verify>
    <automated>test -f .planning/research/COMPETITOR-activecampaign.md && grep -q "Gap analysis" .planning/research/COMPETITOR-activecampaign.md && grep -q "activecampaign.com/platform/email-designer" .planning/research/COMPETITOR-activecampaign.md && grep -q "Saved Modules" .planning/research/COMPETITOR-activecampaign.md</automated>
  </verify>
  <done>COMPETITOR-activecampaign.md exists under .planning/research/, contains all 11 sections including the intact gap-analysis table, key insight, ideas-to-steal, and all 8 source URLs.</done>
</task>

<task type="auto">
  <name>Task 2: Add a pointer to the new doc from research SUMMARY.md</name>
  <files>.planning/research/SUMMARY.md</files>
  <action>
Read `.planning/research/SUMMARY.md` first to find an appropriate, existing location (e.g. a document index, a "related docs" list, or the top matter that references the sibling research files). Add ONE concise pointer line referencing `COMPETITOR-activecampaign.md` with a short description ("ActiveCampaign email-designer competitor + gap analysis vs our GrapesJS build").

Only add the pointer if SUMMARY.md has an obviously appropriate place for it (a doc list or references section). If no natural location exists, add a small "## Related Research" section at the end with the single pointer line rather than forcing it into unrelated prose. Do not restructure or rewrite existing content.
  </action>
  <verify>
    <automated>grep -q "COMPETITOR-activecampaign" .planning/research/SUMMARY.md</automated>
  </verify>
  <done>SUMMARY.md contains a single, well-placed pointer line to COMPETITOR-activecampaign.md; no existing content was altered beyond the added reference.</done>
</task>

</tasks>

<verification>
- `.planning/research/COMPETITOR-activecampaign.md` exists and is readable.
- The gap-analysis table, key insight, ideas-to-steal, and all 8 sources are present.
- `.planning/research/SUMMARY.md` links to the new doc.
- No source code files were touched (documentation-only).
</verification>

<success_criteria>
- Competitor doc captured verbatim from supplied findings, following ALL-CAPS research naming convention.
- SUMMARY.md points to it.
- Zero code changes, zero new web research.
</success_criteria>

<output>
Per project rule `no-commit.md`: do NOT commit. On completion, output the list of changed files and a suggested commit message for the developer.
Create `.planning/quick/260704-iqo-capture-activecampaign-email-designer-re/260704-iqo-SUMMARY.md` when done.
</output>
