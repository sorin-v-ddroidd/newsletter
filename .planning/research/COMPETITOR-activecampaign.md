# Competitor Analysis: ActiveCampaign Email Designer

**One-line summary:** ActiveCampaign's email designer uses a 4-level component hierarchy, a 10-block palette, cascading global defaults, an AI-driven Brand Kit for soft brand guidance, and reusable Saved Modules — compared here against our GrapesJS + grapesjs-mjml builder to surface gaps and steal-worthy ideas.

**Gathered:** 2026-07-04

> **Sourcing note:** This document transcribes the ActiveCampaign email-designer findings from the 2026-07-04 research session. The gap-analysis table's "Our equivalent" column is grounded in documented project facts (CLAUDE.md, `.claude/rules/grapesjs.md`, `.claude/rules/mjml-email-safety.md`) and was reviewed against the original session findings — it matches.

---

## 1. Editor model — 4-level hierarchy

ActiveCampaign's email designer models content as four nested levels:

**Section → Structure → Container → Block**

This maps 1:1 onto MJML's own nesting:

| AC level | MJML equivalent |
|----------|------------------|
| Section | `mj-wrapper` |
| Structure | `mj-section` |
| Container | `mj-column` |
| Block | individual content components (text, image, button, etc.) |

The hierarchy gives editors a consistent mental model: pick a layout structure, drop containers (columns) into it, then drop content blocks into containers.

## 2. Block palette — 10 blocks

The content-block palette offers:

1. Image
2. Text
3. Button
4. Spacer
5. Video
6. Social
7. HTML
8. Banner
9. Timer
10. Menu

Note: the **Spacer** block includes hide toggles (e.g. hide on mobile / hide on desktop) so spacing can be tuned per breakpoint without extra blocks.

## 3. Global Settings tab

A dedicated Global Settings tab lets an editor set document-wide defaults:

- Default font
- Heading styles
- Paragraph spacing
- Link underline behavior
- Button theme

These defaults **cascade** down the hierarchy: Global → Section → Structure → Container → Block. Any level can override the inherited default, but nothing needs to be set redundantly at the block level unless a deviation is wanted.

## 4. Brand Kit (AI Brand Kit)

ActiveCampaign offers an AI-assisted Brand Kit:

- Editor supplies a URL; the tool scrapes it to auto-extract: logo, brand colors, fonts, a short brand description, mission statement, and social links.
- Extracted brand colors are **pinned into the color pickers** used throughout the editor, so users naturally stay on-brand without being blocked from other choices.
- Plan-tier limits apply: 1 brand kit on lower tiers, up to 5 on higher tiers (for agencies/multi-brand accounts).
- Enforcement model is **soft guidance, not a hard lock** — pinned/suggested colors and fonts steer behavior, but a user can still pick outside the brand kit if they choose to.

## 5. Saved Modules

- Any composed block/section can be saved as a reusable "module" via a save-as-module action.
- Saved modules appear under **Content > Saved Modules** in the block panel, alongside the built-in block palette.
- Saved modules are categorizable and searchable, letting teams build up a library of reusable, pre-composed content pieces over time (e.g. a "product spotlight" module, a "team bio" module).

## 6. Other features

- Dynamic / conditional content blocks (show/hide content based on subscriber data or conditions)
- Merge tags for personalization
- An HTML escape hatch (custom-code block) for advanced users
- Responsive preview (desktop/mobile toggle)
- Split testing, up to 5 variants
- Generative-AI content assistance
- Output is **table-based responsive HTML**, matching the broader email-client-compatibility approach that MJML also takes

## 7. Gap analysis vs our GrapesJS + grapesjs-mjml builder

*Reconstructed from documented project facts — see sourcing note above.*

| AC ingredient | Our equivalent | Status |
|---|---|---|
| 4-level hierarchy (Section/Structure/Container/Block) | GrapesJS component tree mapped 1:1 to MJML (`mj-wrapper`→`mj-section`→`mj-column`→blocks) — same conceptual nesting, exposed through the canvas/Layer Manager rather than a named 4-level UI | Equivalent, different presentation |
| 10-block generic palette | Generic blocks (text, image, button, columns, divider, spacer) plus DDROIDD branded blocks; no native Video/Social/Timer/Menu/Banner blocks defined yet | Partial — palette narrower, branded blocks are our differentiator |
| Global Settings cascade (Global→Section→Structure→Container→Block) | **Not supported** — `mj-attributes` (the MJML mechanism for global cascading defaults) is confirmed broken by grapesjs-mjml (corrupts `mj-head` placement); every element must carry defaults inline via the shared `BLOCK_DEFAULTS` constant, with a server-side `mj-head` injected at compile time as a safety net | Gap — architectural limitation, mitigated not solved |
| AI Brand Kit (soft-pinned colors/fonts from URL scrape) | Restricted Style Manager exposes only an approved DDROIDD brand-palette allowlist (color, font-size, font-family, line-height, align, spacer-based spacing, background-color) — a **hard lock**, not a soft-pinned suggestion; no URL-scrape brand extraction | Different philosophy — hard lock vs. soft guidance (see Key Insight) |
| Saved Modules (user-composed, reusable, categorizable) | **Not implemented.** Branded sections are developer-authored, locked block definitions (BLOCK-03: `draggable`/`droppable`/`removable`/`editable`/`selectable` flags lock structure); no user-facing "save this as a reusable module" flow exists | Gap — candidate for a later phase (see Ideas to Steal) |
| HTML escape hatch / custom-code block | **Deliberately excluded** — `mj-raw` block, the code/export-code panel, and any MJML import UI are removed per editor guardrails (EDIT-07); a non-dev must never reach raw markup | Intentional divergence, not a gap |
| Dynamic/conditional content, merge tags, split testing, generative AI | Out of scope for v1 (export-only tool, no ESP integration, no send-time personalization) | Explicitly deferred |
| Responsive preview (desktop/mobile) | Standard GrapesJS device manager toggle; MJML's own table-based responsive output underneath | Equivalent |
| Table-based responsive HTML output | Same MJML-based table output (`mjml@4.18.0` compile) | Equivalent — both tools target the same email-client-safety approach |

## 8. Key insight

ActiveCampaign achieves brand consistency through **soft guidance**: sensible defaults cascading from Global Settings, brand colors pinned (but not locked) into pickers via the AI Brand Kit, and reusable Saved Modules that make it easy to reuse an on-brand composition without technically preventing deviation.

Our builder instead enforces brand consistency through **hard locks**: a restricted Style Manager allowlist, locked/non-removable structural elements on branded blocks, and no raw-HTML escape hatch.

For a **single-brand internal tool** with non-developer users, hard locks are the better fit than soft guidance — there is no multi-brand/agency use case to accommodate, and the priority is guaranteeing every exported email survives Outlook/Gmail/Yahoo rendering rather than offering creative flexibility. ActiveCampaign's soft-guidance model exists to serve many different brands across many accounts; we only ever need to serve one.

## 9. Ideas worth stealing beyond current plan

1. **Section categories in the block panel** — Group blocks into labeled categories such as Header / Content / Footer (mirroring AC's Section/Structure grouping), rather than presenting a single flat block list. This is a low-cost UX improvement to the existing BlockManager configuration and would make the branded block library easier to navigate as it grows in Phase 3.

2. **User-saved modules (later phase)** — Borrow AC's Saved Modules concept: let a user save a composed subtree of blocks (e.g. a customized hero + text combo) as a named, reusable module. Implementation sketch: persist the selected component's subtree JSON (a slice of `getProjectData()`), store it per-workspace, and register it as a dynamic block definition that can be re-dropped onto the canvas. This would need its own locking/editability rules (an open question: does a saved user module inherit hard-lock behavior, or become freely editable once saved?) and is explicitly **out of scope for the current phase** — flagged here for a future planning cycle.

## 10. Sources

1. https://www.activecampaign.com/platform/email-designer
2. https://help.activecampaign.com/hc/en-us/articles/4404950771612-Email-Designer-overview
3. https://help.activecampaign.com/hc/en-us/articles/4404950913308-Email-Designer-Blocks-explained
4. https://help.activecampaign.com/hc/en-us/articles/4493975649052-Email-Designer-How-to-use-Sections
5. https://help.activecampaign.com/hc/en-us/articles/4636102907676-Email-Designer-Global-Settings-tab-overview
6. https://help.activecampaign.com/hc/en-us/articles/220342748-How-to-save-and-reuse-email-content-with-Saved-Modules
7. https://help.activecampaign.com/hc/en-us/articles/15020035948444-Brand-Kit-overview
8. https://www.activecampaign.com/platform/ai-brand-kit

Note: help-center pages (2–7) block automated fetching (HTTP 403); findings for those were gathered via web-search excerpts on 2026-07-04, not full-page reads.
