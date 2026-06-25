# Feature Research

**Domain:** Visual drag-and-drop email/newsletter builder (authoring surface only)
**Researched:** 2026-06-25
**Confidence:** HIGH (core editor features verified via Context7/GrapesJS docs); MEDIUM (competitor analysis via multiple web sources)

---

## Capability Ownership Map

Before the feature tables, every feature is tagged by who provides it. This distinction is the most
important input for roadmap phase ordering and effort estimation.

| Tag | Meaning |
|-----|---------|
| `[BUILT-IN]` | grapesjs-mjml or GrapesJS core ships this — nearly zero effort to enable |
| `[GJS-UI + BACKEND]` | GrapesJS ships the UI/hook; you must build the backend endpoint + storage |
| `[APP]` | No editor support — you build entirely at the application layer |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features non-developers assume exist. Missing any one = tool is unusable or "broken."

| Feature | Why Expected | Complexity | Ownership | Notes |
|---------|--------------|------------|-----------|-------|
| Drag-and-drop canvas | Core interaction model of every visual builder | LOW | `[BUILT-IN]` | GrapesJS core; grapesjs-mjml adds MJML-specific drop rules (column → section → body hierarchy) |
| Content blocks panel | Users expect a palette of insertable elements | LOW | `[BUILT-IN]` | 15 block types registered by default: `mj-1-column`, `mj-2-columns`, `mj-3-columns`, `mj-text`, `mj-button`, `mj-image`, `mj-divider`, `mj-social-group`, `mj-spacer`, `mj-navbar`, `mj-hero`, `mj-wrapper`, `mj-raw`, and others |
| Inline text editing | Click-to-edit on canvas; WYSIWYG feel | LOW | `[BUILT-IN]` | GrapesJS RTE; users click text, edit in-place |
| Image insertion and swap | Non-devs need to add/change images without code | LOW (UI) | `[GJS-UI + BACKEND]` | Asset Manager UI ships with GrapesJS; upload endpoint + object storage (S3 / local disk) is app-level |
| Undo / redo | Mistakes must be reversible — without this non-devs will fear the tool | LOW | `[BUILT-IN]` | `core:undo` / `core:redo` built into GrapesJS command system |
| Desktop + mobile preview | Email must look correct at both widths before export | LOW | `[BUILT-IN]` | grapesjs-mjml ships device-preview buttons (Desktop / Tablet / Mobile); MJML fluid layout stacks automatically |
| Save and reopen a newsletter | Work must persist across sessions | LOW (UI hook) | `[GJS-UI + BACKEND]` | Storage Manager ships with remote-endpoint support (`storageManager: { type: 'remote', urlStore, urlLoad }`); DB + API endpoint is app-level |
| Newsletter list (open / duplicate) | Users manage multiple newsletters over time | MEDIUM | `[APP]` | Listing, naming, duplicating, deleting newsletters is entirely app-level (DB + UI) |
| Export as HTML | The final deliverable — download a standalone file | LOW | `[BUILT-IN]` | grapesjs-mjml ships MJML→HTML export; wrapping that in a download button is LOW app work |
| Live compile preview | Server-side MJML→HTML compile shows real render, not just MJML | MEDIUM | `[APP]` | grapesjs-mjml renders client-side for preview; the *server-side* compile (matching `npm run build-pages` quality) is a separate API call to the Express backend |
| Basic brand styling (colors, font) | Non-devs expect palette pickers, not hex fields — and the colors must be on-brand | MEDIUM | `[BUILT-IN]` | Style Manager sectors are configurable; scoping pickers to approved brand colors requires configuring the `properties` list — not a free checkbox |
| Authentication / login | Internal team tool must be gated | MEDIUM | `[APP]` | No editor component; standard session/JWT auth |

---

### Differentiators (Competitive Advantage)

Features that set this tool apart for the DDROIDD use case. Not expected by generic users, but high-value for this team.

| Feature | Value Proposition | Complexity | Ownership | Notes |
|---------|-------------------|------------|-----------|-------|
| DDROIDD branded block library | One-click drop of on-brand hero, project card, hiring strip, disclaimer, etc. — the whole reason the tool exists | HIGH | `[BUILT-IN]` (API) + `[APP]` (authoring) | GrapesJS `Components.addType()` + custom block registration is the API; the *work* is re-authoring all existing `src/sections/*.mjml` as custom component definitions. This is the #1 project risk (see PROJECT.md). Each block must encode MJML-safe attributes, brand styles as defaults, and locking rules (below). |
| Content locking / guardrails | Branded blocks that non-devs cannot break: locked font, locked colors, locked structure — they can only swap text and images | MEDIUM-HIGH | `[BUILT-IN]` (API) + `[APP]` (authoring) | GrapesJS `removable`, `draggable`, `copyable`, `stylable` (allowlist), `unstylable` (blocklist) per component. Locking is per-component-definition — every branded block must declare its constraints. Not a global toggle. The `droppable` property also controls what can be nested inside a block. |
| No raw HTML surface for non-devs | Removes escape hatches that break email rendering | LOW | `[BUILT-IN]` (config) | Exclude `mj-raw` from `blocks: [...]` array; disable `core:open-code` command and the MJML import panel. Both are single-line config changes — but must be deliberate. |
| Curated asset library | Team images (logos, headshots, hero art) always available — no hunting for file paths | MEDIUM | `[GJS-UI + BACKEND]` | Asset Manager UI is built-in; the library is populated by server-side uploads + a persistent asset catalog in DB |
| Constrained Style Manager | Non-devs see only brand-permitted style options (e.g. three approved button colors, not a free color wheel) | MEDIUM | `[BUILT-IN]` (API) | Style Manager `properties` configured per component with `options` arrays for selects, constrained integer ranges; requires authoring effort per component |
| Autosave | Protects against work loss; reduces anxiety for non-devs | LOW | `[GJS-UI + BACKEND]` | `storageManager.autosave: true` + `stepsBeforeSave: N`; still needs the remote endpoint live |
| Version history (last N saves) | "I want to go back to how it looked yesterday" | HIGH | `[APP]` | GrapesJS stores project data as JSON blobs; storing timestamped snapshots and a restore UI is entirely app-level |
| Duplicate newsletter | Common workflow: base a new issue on last month's | LOW-MEDIUM | `[APP]` | Copy the saved JSON blob in DB; app-level only |

---

### Anti-Features (Deliberately NOT Building)

Features to explicitly exclude. Documenting *why* prevents scope creep from well-meaning contributors.

| Anti-Feature | Why Requested | Why We Exclude It | What We Do Instead |
|--------------|---------------|-------------------|-------------------|
| ESP / direct sending (SendGrid, Mailgun, Outlook COM) | "One-click send would save steps" | Export-only is the explicit scope boundary; adding ESP coupling introduces credential management, deliverability concerns, unsubscribe compliance, and bounce handling — all disproportionate to authoring-tool scope | Export standalone HTML; sending stays manual/external |
| Subscriber / contact list management | Looks like natural extension | Campaigns, segments, suppression lists are a full product; even a simple list introduces GDPR surface area | Out of scope; use the existing external send mechanism |
| A/B testing | Common ask from marketers | Requires send + analytics integration to be useful; meaningless at export-only scope | Defer to a future milestone that adds sending |
| Scheduling / campaigns | "Schedule this for next Thursday" | Requires ESP integration | Out of scope |
| Analytics / open rates / click tracking | "Did people read it?" | Requires send + tracking pixel infrastructure | Out of scope |
| Arbitrary legacy MJML import | "Can I import my hand-authored files?" | grapesjs-mjml does NOT reliably round-trip hand-authored MJML (uses `mj-include`, `mj-attributes`, `background-url`, `mj-spacer`, `css-class` — verified in PROJECT.md risk analysis). Importing would produce corrupted or stripped blocks. | Branded sections re-authored as native editor blocks; import disabled |
| Free-form raw HTML / CSS editor | Some power users want code access | Exposes non-devs to broken rendering paths; defeats the "no developer in the loop" goal; `mj-raw` blocks bypass MJML compilation safety | Disable code panel and `mj-raw` block for non-dev users |
| AI content generation | "Write my newsletter for me" | Out of scope for this milestone; adds significant complexity and prompt-engineering surface | Deferred to future milestone |
| Real-time multi-user co-editing | "Google Docs style" | Requires WebSocket / CRDT infrastructure; internal team has small editorial team, conflict rate is low | One editor at a time; save/load is sufficient |
| Public multi-tenant signup | "Can contractors log in?" | Internal tool; no public onboarding, no org isolation needed | Simple internal auth (invite-only or SSO) |

---

## Feature Dependencies

```
[Auth / Login]
    └──required-by──> [Newsletter list (open/duplicate)]
    └──required-by──> [Save/Load (remote storage)]
    └──required-by──> [Image upload + asset library]

[Object storage backend (S3 / local)]
    └──required-by──> [Image upload + asset library]
                           └──required-by──> [Asset Manager UI (built-in UI wired)]

[Remote storage endpoint (Express API)]
    └──required-by──> [Autosave]
    └──required-by──> [Save/Load]
    └──required-by──> [Version history (app-level snapshots)]

[Branded block re-authoring (custom component definitions)]
    └──required-by──> [DDROIDD branded block library]
    └──required-by──> [Content locking / guardrails]
                           └──required-by──> [Constrained Style Manager per block]

[GrapesJS + grapesjs-mjml initialized]
    └──required-by──> all editor features

[Server-side MJML compile API]
    └──required-by──> [Export HTML download]
    └──required-by──> [Live server-side preview (beyond client-side MJML preview)]
```

### Dependency Notes

- **Branded blocks → content locking:** These are the same authoring effort. A block definition sets both the visual output *and* its locking constraints (`removable`, `draggable`, `stylable`, `droppable`). They cannot be split into separate phases without doing branded blocks wrong the first time.
- **Auth → almost everything:** Without login, there is no user identity, no per-user newsletter list, no save, no upload. Auth must be in Phase 1.
- **Asset library UI is free; storage is not:** The GrapesJS Asset Manager panel exists out of the box. The value is only realized when images actually upload and persist — that requires the storage backend.
- **Client-side vs server-side preview:** grapesjs-mjml renders MJML in the browser (client-side MJML compiler). This is fast but may differ from the server-side `mjml` npm compile (especially for custom attributes, `mj-font`, `mj-style`). A server-side preview API call is the safer path for the "what you see is what you export" guarantee.

---

## Non-Technical User Usability Factors

These are not features — they are design principles that make each feature usable for the DDROIDD editorial team (non-developers).

| Factor | Mechanism | Ownership |
|--------|-----------|-----------|
| No escape to raw code | Disable `core:open-code`, MJML import panel, and `mj-raw` block | `[BUILT-IN]` config |
| Cannot accidentally delete branded structure | `removable: false` on branded block wrappers; `draggable: false` on locked elements | Per-component definition |
| Cannot move blocks into wrong positions | `droppable` function restricts nesting; MJML hierarchy enforced at component level | Per-component definition |
| Cannot apply off-brand colors | Style Manager `properties` constrained to approved palette via `options` arrays | Style Manager config |
| Cannot edit layout CSS freely | `unstylable` blocklist hides layout properties non-devs should not touch | Per-component definition |
| Can only swap images, not reposition | Image component `stylable: ['border-radius']`, layout props locked | Per-component definition |
| Predictable text editing | Only `mj-text` components expose RTE; structural containers are not clickable-to-edit | `highlightable: false` on structural components |
| Autosave prevents work loss | Work saved without explicit action required | Storage Manager config |
| Undo is always available | Non-devs make mistakes; undo lowers anxiety | Built-in, always on |

**The central insight:** making this usable for non-devs is not a UX polish task — it is a data/configuration task applied during branded block authoring. Every block definition must encode both its visual design *and* its constraint model. If block authoring ships without constraints, non-devs can and will break brand consistency.

---

## MVP Definition

### Launch With (v1)

Minimum to replace the developer-in-the-loop workflow.

- [ ] Auth (login, session) — identity required for everything else
- [ ] GrapesJS + grapesjs-mjml editor initialized in React app — the canvas
- [ ] Generic content blocks: text, image, button, columns (1/2/3), divider, spacer — non-branded building blocks
- [ ] DDROIDD branded blocks for active sections (hero, projects, hiring, initiatives, new colleagues, disclaimer) — re-authored as locked custom components
- [ ] Inline text editing on canvas
- [ ] Image upload + asset library (storage backend required)
- [ ] Save / load newsletter (remote Storage Manager + DB)
- [ ] Newsletter list (open, create new, duplicate)
- [ ] Desktop + mobile preview (built-in)
- [ ] Export HTML (server-side compile + download)
- [ ] `mj-raw` block excluded; code panel disabled — non-dev surface only

### Add After Validation (v1.x)

- [ ] Autosave — add once remote storage endpoint is stable
- [ ] Constrained Style Manager per branded block — add once initial block authoring validates the constraint model
- [ ] Version history (last 10 saves per newsletter) — add when users report "I wish I could go back"
- [ ] Duplicate newsletter from list — low effort, add when workflow is validated

### Future Consideration (v2+)

- [ ] Merge tags / personalization placeholders — only meaningful if ESP integration is added; raw `{{token}}` in export has limited value
- [ ] AI content assistance — after core editing workflow is stable
- [ ] Role-based access (admin can edit branded blocks; editors cannot) — when team grows

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| GrapesJS + grapesjs-mjml canvas | HIGH | LOW | P1 |
| Auth | HIGH | MEDIUM | P1 |
| Branded block library (re-authored) | HIGH | HIGH | P1 |
| Content locking / guardrails | HIGH | MEDIUM-HIGH | P1 |
| Save / load (remote storage) | HIGH | MEDIUM | P1 |
| Newsletter list | HIGH | MEDIUM | P1 |
| Image upload + asset library | HIGH | MEDIUM | P1 |
| Export HTML | HIGH | LOW | P1 |
| Desktop / mobile preview | HIGH | LOW | P1 |
| Exclude raw HTML / code panel | HIGH (safety) | LOW | P1 |
| Autosave | MEDIUM | LOW | P2 |
| Constrained Style Manager | MEDIUM | MEDIUM | P2 |
| Duplicate newsletter | MEDIUM | LOW | P2 |
| Version history | MEDIUM | HIGH | P2 |
| Merge tags / personalization | LOW (export-only scope) | LOW | P3 |
| Real-time collaboration | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — without it the tool cannot replace the current workflow
- P2: Should have — add once core is stable and validated
- P3: Nice to have — defer until P1/P2 are proven

---

## Competitor Feature Analysis

| Feature | Mailchimp New Builder | Beefree / RGE Studio | Stripo | Our Approach |
|---------|----------------------|---------------------|--------|--------------|
| Drag-drop canvas | Yes, inline editing | Yes | Yes | GrapesJS canvas (built-in) |
| Content blocks | Rich palette | Rich palette | Rich palette | grapesjs-mjml 15 blocks + custom branded blocks |
| Undo/redo | Yes | Yes | Yes | Built-in (`core:undo`/`core:redo`) |
| Desktop/mobile preview | Yes | Yes | Yes | Built-in device preview |
| Save/load | Cloud (Mailchimp account) | Cloud | Cloud | Remote Storage Manager → own DB |
| Image upload + library | Yes | Yes | Yes | Asset Manager UI → own object storage |
| Export HTML | Yes | Yes | Yes | Server-side MJML compile → download |
| Branded block library | No (generic) | Brand kit (colors/fonts) | Module library | Custom component definitions (re-authored sections) |
| Content locking | No | Partial (roles) | Smart Modules (locking) | GrapesJS component properties per block |
| Version history | No (Mailchimp) | Yes (Beefree paid) | No by default | App-level snapshots (v1.x) |
| Code editor | Hidden by default | Custom HTML block | Full code editor | Disabled entirely for non-devs |
| ESP / sending | Yes (Mailchimp) | Integrations | Integrations | Out of scope — export only |
| Collaboration | No | Real-time (paid) | No | Out of scope for v1 |
| Merge tags | Yes | Yes | Yes | Low priority; export-only |
| AI assistance | Yes | Yes | Yes | Out of scope for v1 |

---

## Sources

- GrapesJS Core docs (Context7, HIGH confidence): component properties `removable`, `draggable`, `copyable`, `stylable`, `unstylable`, `droppable`; Storage Manager; Asset Manager; default commands (`core:undo`, `core:redo`, `core:open-code`)
- grapesjs-mjml docs (Context7, HIGH confidence): 15 block types, `customComponents` API, device preview, MJML import/export commands
- Mailchimp email builder feature docs (MEDIUM confidence): inline editing model, block palette, undo/redo
- Beefree feature page and help center (MEDIUM confidence): version history, real-time collaboration, autosave (Business/Enterprise)
- Stripo blog and help center (MEDIUM confidence): module/reusable block model, Smart Modules locking, design system tokens
- Knak blog "Brand Guardrails in Email Marketing" (MEDIUM confidence): constrained editing patterns for non-technical users
- PROJECT.md (HIGH confidence): scope boundaries, grapesjs-mjml round-trip risk, key decisions

---

*Feature research for: DDROIDD Newsletter Builder — visual authoring surface*
*Researched: 2026-06-25*
