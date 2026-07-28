# UX Gap Analysis — DDROIDD Editor vs Mailchimp / Beefree / Stripo / Webflow

**Date:** 2026-07-14
**Method:** 4 parallel research agents — 1 codebase inventory of `app/client/src/editor/`, 3 web-research catalogs (Mailchimp New Builder; Beefree + Stripo; Webflow Designer chrome patterns). Synthesized into ranked enhancement list filtered by GrapesJS/MJML feasibility and existing project constraints (locked blocks, email-safe style allowlist, closed brand palette, project-JSON round-trip invariant).

---

## Current editor snapshot (as inventoried)

Single-screen app (`App.tsx` mounts `NewsletterEditor` directly — no routing/login/list yet). Three-panel shell: TopBar / LeftSidebar 280px (Blocks + Layers tabs) / Canvas / RightPanel 300px (curated collapsible sections: Content, Alignment, Layout, Appearance, Fill, Section, Stroke, Typography).

Works today: block search, DDROIDD category with "On-brand" badge, layers tree with multi-select (ctrl/shift) + hide/delete + duplicate context menu, device switcher (desktop/tablet/mobile), template seed, manual save/load to localStorage, preview & compile (new tab), export HTML with hidden-layer stripping, compile-warning banner, Ctrl+D duplicate, constrained pickers (3 brand colors, 1 font), width slider 320–900, locked branded blocks (7 DDROIDD sections).

Verified gaps (file:line evidence in inventory):
- No autosave; TopBar status "changes saved locally" is hardcoded/fake (`TopBar.tsx:57-59`, `storageManager: false` at `editorConfig.ts:570`)
- No undo/redo buttons (keyboard only)
- No empty-canvas onboarding (bare `<mjml><mj-body>` seed, `editorConfig.ts:320-323`)
- No layer drag-reorder (noted TODO `LeftSidebar.tsx:29-30`)
- No image upload / asset manager (URL-only trait, `editorConfig.ts:300`)
- Save/load silent (console.log only, `actions.ts:23,36`); no confirmations on layer delete or template seed (destructive)
- Dev tooling leaks: "Assert round-trip" menu item, `window.__ddroiddEditor`
- No test-send; export is download-only

---

## What we already match or beat

| Area | Status |
|------|--------|
| Three-panel layout (blocks / canvas / properties) | Same as all four competitors |
| Curated email-safe style panel, collapsible sections | Matches Mailchimp bounded-controls philosophy |
| Hard-locked brand palette + single font | Stronger than Mailchimp (soft brand-kit defaults only) |
| Locked branded blocks | On par with Beefree content locking; Mailchimp New Builder has none |
| Device switcher, layers multi-select, block search | Solid base |

---

## Ranked gaps

### Tier 1 — trust & safety of the flow (cheap, high impact, ~2–3 days total)

1. **Real autosave + honest status indicator.** Every competitor autosaves. Fake "saved" status is worse than none. Fix: debounced autosave (GrapesJS `update` event) to localStorage now, API later; live "Saving… / Saved ✓ / Unsaved changes" (Webflow ellipsis→green-check pattern). ~0.5 day.
2. **Visible undo/redo buttons in TopBar.** Mailchimp reviewers single undo out as a beloved marquee feature; Webflow re-added visible buttons "by popular demand" — users don't trust invisible Ctrl+Z. UndoManager already wired; add two buttons + disabled states. ~1 hour.
3. **Save/delete feedback + confirmations.** Toast (sonner) on save/load success; confirm dialog on layer delete and template seed (which replaces the whole canvas). ~0.5 day.
4. **Empty-canvas onboarding state.** Centered "Drag a block here or start from a template" placeholder + template button. No competitor shows a bare empty canvas. ~0.5 day.

### Tier 2 — canvas ergonomics (the "seamless" feel)

5. **On-canvas selection toolbar** — duplicate/delete/move icons directly on the selected section/block (Beefree row icons; Mailchimp floating toolbar). Today duplicate hides in Layers context menu + Ctrl+D. GrapesJS: per-component `toolbar` config. Must respect `canDuplicate`/removable locking. ~1–2 days.
6. **Selection breadcrumb / level picker.** Stripo's Block→Container→Structure→Stripe stepper and Webflow's ancestor breadcrumb solve "which thing did I click" — the top confusion in nested MJML (section vs column vs text). Thin bar showing ancestor chain, click to select ancestor. ~1 day.
7. **Better drop indicators.** Webflow two-color pattern: orange = prospective parent container, blue = insertion line. GrapesJS default indicator is weak; style via canvas CSS + drag events. ~1 day.
8. **Layer drag-reorder** — existing TODO; all competitors have it. Respect draggable locking.

### Tier 3 — workflow features (phase-sized)

9. **Saved/reusable sections library.** Beefree "Saved Rows" / Stripo "Modules" — reviews call it "game changer"; Mailchimp lacks it and gets complaints. Save configured section as named library entry with thumbnail → appears in Blocks tab under "My sections" → reuse across newsletters. Optional later: synced variant (edit propagates to all usages, visual badge). Serialize component subtree as JSON; fits project-JSON invariant. Phase-sized; highest-value big bet.
10. **Image upload + asset manager.** URL-only today. Wire GrapesJS AssetManager to planned multer/sharp upload path (IMG-01). Beefree pattern: drag-file-onto-block + gallery + "Change image" replace-in-place. Phase-sized.
11. **Version history / restore.** Stripo autosaves every change into restorable history; Beefree keeps 15-step session timeline widget (bottom-left: undo/redo/history). For us: snapshot project JSON per save, list + restore. Natural once DB persistence lands.
12. **Test send from editor.** Both email builders have navbar "send a test" → addresses dialog. Fits later send phase (currently out of scope — export only).

### Tier 4 — mobile polish

13. **Hide-on-mobile / reverse-stack per section.** Standard toggles in Beefree/Stripo (hide-on-mobile, don't-stack, reverse-stack, per-device padding). MJML route: `css-class` + media query in server-injected mj-head. Caveats: Yahoo may ignore media queries (rule: don't rely on them alone); `css-class` is not panel-editable in grapesjs-mjml — needs custom trait.
14. **Side-by-side desktop+mobile preview** (Stripo shows both at once) — current preview opens single tab.

---

## Anti-patterns — do NOT copy

- **Webflow's exposed CSS model** (classes, cascade, free-form units, flexbox) — overwhelms non-devs; illegal for email anyway. Our closed palette/allowlist is the right call. Borrow Webflow's *chrome* (autosave check, breadcrumb, two-color drop indicators, collapsed-section "value set" dots), invert its content philosophy.
- **Stripo's 4-level hierarchy** (Stripe→Structure→Container→Block) — reviews confirm learning-curve cost. MJML section/column/block is enough.
- **Mailchimp's soft guardrails** (brand kit as defaults, not locks) — internal tool wants hard locks; we already have them.
- **Mailchimp's missing content-recovery** — if autosave fails silently, work is lost; our autosave should surface failure, not just success.

---

## Recommended order

1. Tier 1 as one quick batch (`/gsd-quick` scale, ~2–3 days) — transforms perceived reliability.
2. Items 5+6 (canvas toolbar + breadcrumb) — the biggest "seamless feel" win.
3. Tier 3 as proper roadmap phases; saved-sections library first.

---

## Source notes

- Codebase inventory: `src/editor/{NewsletterEditor,LeftSidebar,RightPanel,TopBar,actions,panelControls,editorConfig}`, `src/editor/hooks/*`, `src/editor/blocks/*`, `src/App.tsx` (2026-07-14).
- Mailchimp: help.mailchimp.com New Builder docs (design-an-email, layouts, image blocks, preview-and-test, brand kit, content studio), chimpessentials.com, emailmavlers.com, uplers.com, G2 reviews.
- Beefree: docs.beefree.io end-user guide + SDK docs (saved/synced rows, advanced permissions, undo/history, mobile design mode), support.beefree.io, G2/Capterra, badsender.com.
- Stripo: support.stripo.email (new editor layout, structures/containers, modules, version history, mobile), stripo.email blog (synchronized modules, module management, roles), G2/Capterra, mailmodo.com.
- Webflow: help.webflow.com + university.webflow.com (left toolbar, navigator, breadcrumbs, style panel indicators, canvas bar), usethekeyboard.com, webflow.com/updates, reviewer posts (thedesignerreview, karpi.studio, satoristudio).

Web research reflects docs/reviews, not hands-on sessions — drop-indicator visuals and some indicator UI details are inferred; verify hands-on if pixel-level fidelity needed.
