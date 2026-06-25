# Pitfalls Research

**Domain:** GrapesJS + grapesjs-mjml visual email builder with server-side MJML compile, DB persistence, image upload, and HTML export
**Researched:** 2026-06-25
**Confidence:** HIGH for plugin-specific traps (verified against npm, GitHub issues, Mautic forum); MEDIUM for persistence/migration patterns (GrapesJS docs + community); HIGH for client-rendering constraints (verified against current head.mjml + MJML docs)

---

## Critical Pitfalls

### Pitfall 1: mj-attributes Silently Dropped — Global Defaults Not Preserved on Round-Trip

**What goes wrong:**
The current `head.mjml` encodes critical client-safety defaults via `mj-attributes`: `<mj-text color="#ffffff" line-height="24px" font-size="16px" />` and `<mj-all font-family="Calibri, Roboto, ...">`. These apply globally. When the editor exports MJML, these global attribute declarations are either silently dropped or not recognized by grapesjs-mjml. Verified on Mautic's grapesjs-mjml integration: a moderator confirmed "mj-attributes does _not_ work — that's an architectural limitation that cannot easily be solved." The plugin requires attributes to be set individually on each component instead. If the re-authored blocks don't inline the defaults onto every component, the exported MJML lacks them, the compiler uses MJML's own defaults (dark text on white background), and the entire email renders wrong — white text lost, font-family falls back to system serif.

**Why it happens:**
`mj-attributes` is an MJML head construct that the grapesjs-mjml plugin does not model as an editable canvas component. The plugin's architecture treats `mj-head` as a configuration concern, not a content node, so it has no mechanism to surface global attribute overrides in the GrapesJS component tree.

**How to avoid:**
During the Phase 1 spike, confirm `mj-attributes` support experimentally. Accept the architectural limitation and embed ALL of `head.mjml`'s defaults directly into every re-authored block definition as explicit MJML attributes (e.g., `color="#ffffff" font-family="Calibri, ..."` on every `<mj-text>`). Do NOT rely on global defaults surviving the editor. Additionally, inject a fixed `mj-head` snippet at compile time server-side — construct it programmatically and prepend it to editor-exported MJML before passing to `mjml()`, rather than depending on the editor to carry it through.

**Warning signs:**
- Exported email has dark text on white background when all sections should be light-on-dark
- Font family reverts to Times New Roman or Arial in clients
- Tracking-pixel CSS class stops hiding the pixel
- Editor preview looks fine (browser CSS fills in) but compiled HTML loses the defaults

**Phase to address:** Phase 1 (Spike) — must verify before any block authoring; Phase 2 (Block authoring) — embed defaults in every block definition

---

### Pitfall 2: Editor State vs. MJML Source Drift — Project JSON Is Not MJML

**What goes wrong:**
GrapesJS persists its internal model as `editor.getProjectData()` — a JSON object encoding component types, attributes, styles, and the component tree. This is NOT the same as MJML source. When you load a saved newsletter, you call `editor.loadProjectData(json)` — this reconstitutes the canvas from the JSON. If you instead try to reload from the MJML string (e.g., saved MJML output), the editor re-parses it through the plugin's MJML parser, and any attributes or constructs the parser doesn't fully support are silently dropped or default-valued. Over multiple save/load/edit cycles via MJML re-import, the document degrades. The two representations diverge: what the editor thinks it has vs. what the MJML actually encodes.

**Why it happens:**
Teams save "the MJML" as the canonical source, assume they can reload it, and skip persisting the GrapesJS project JSON. The GrapesJS docs explicitly warn against this: "Always rely on the JSON project data to properly load your project in the editor... important information about components are stripped away when you export the code." The MJML export is a one-way lossy projection, not a round-trippable format.

**How to avoid:**
Persist `editor.getProjectData()` JSON as the canonical editor state in the database. Save the compiled HTML separately (output artifact). Save the MJML string separately (debug artifact). On re-open, always load from the project JSON — never re-parse MJML. Schema: newsletters table has `project_json JSONB`, `mjml_source TEXT`, `html_output TEXT`. The MJML and HTML columns are output artifacts only.

**Warning signs:**
- After editing and reopening, some block attributes reset to defaults
- Custom styling on a block disappears after one edit cycle
- A block that was "custom branded" looks generic after reopening
- Team reports "the editor lost my changes"

**Phase to address:** Phase 1 (Spike) — verify round-trip behavior; Phase 2 (Persistence schema) — enforce JSON-primary storage from the start

---

### Pitfall 3: Custom Block Registration Breaking on grapesjs-mjml / GrapesJS Version Update

**What goes wrong:**
Custom MJML blocks are registered by extending plugin component types via GrapesJS's `Components.addType`. The API for this, and the internal shape of component definitions, changes between GrapesJS major releases. grapesjs-mjml 1.0.8 (latest as of 2026-03-13) declares a dependency on `mjml-browser ^4.18.0` but has no `peerDependencies` entry pinning a specific GrapesJS version — meaning it will install with whatever GrapesJS you have. When GrapesJS releases a breaking version (it is on 0.23.x, tracking toward a 1.0 milestone), custom block registrations may silently produce default-type components that render as empty divs, not as MJML nodes.

**Why it happens:**
The plugin has no declared peer dependency constraint. Teams upgrade GrapesJS for a security fix or new feature without checking plugin compatibility. Custom block registration code written for one GrapesJS internal API breaks when component model internals change.

**How to avoid:**
Pin both `grapesjs` and `grapesjs-mjml` to exact versions in `package.json` (not `^`). Treat any version bump as a migration requiring a full block-render regression test. Write a smoke test that instantiates the editor headlessly (or in a Playwright/Puppeteer session), loads each custom block, exports MJML, and asserts the exported MJML matches expected structure. Run this test in CI on every dependency update.

**Warning signs:**
- After a package update, block drag-in produces an empty section
- Editor console shows `Unknown component type` warnings
- Exported MJML has `<mj-raw>` wrapping content that should be typed components
- Plugin README or GitHub issues discuss a specific GrapesJS version incompatibility

**Phase to address:** Phase 1 (Spike) — establish version pins before writing a single block; Phase 3 (Block library) — add regression test per block

---

### Pitfall 4: Client-Rendering Regression Via Style Manager — Email-Hostile CSS

**What goes wrong:**
GrapesJS ships with a Style Manager that exposes arbitrary CSS properties to users. Without curation, non-dev users can apply `display: flex`, `position: absolute`, `box-shadow`, `border-radius`, CSS variables, `background-image` on div elements, and other properties that are email-client-hostile. These work in the browser preview and even in the GrapesJS MJML preview (which uses `mjml-browser` and a real Chromium renderer). They silently break Outlook (which uses Word's rendering engine, ignoring most modern CSS) and cause Gmail to strip `<style>` blocks containing them. The regression is invisible until the email goes out.

**Why it happens:**
The default Style Manager configuration is designed for web pages. The grapesjs-mjml plugin restricts the component model to MJML tags but doesn't automatically restrict the style properties those components expose in the UI. Teams ship the default configuration without audit.

**How to avoid:**
Replace the default Style Manager sectors with a curated email-safe set: only MJML-mapped properties (padding, color, font-size, font-weight, line-height, text-align, border, background-color). Explicitly exclude: `display`, `position`, `float`, `flex-*`, `grid-*`, `box-shadow`, `transform`, `transition`, `animation`, `background-image` (as CSS — use MJML's `background-url` attribute instead). Implement a server-side MJML compile step that rejects or warns on non-MJML CSS in the output before saving. Add a `background-color` fallback field requirement whenever `background-url` is used.

**Warning signs:**
- Browser preview looks good but Outlook client shows collapsed layout
- Gmail shows unstyled content (CSS stripped)
- Style Manager shows flex/position/grid options available to users
- Exported compiled HTML contains `style="display: flex"` on table cells

**Phase to address:** Phase 1 (Spike) — verify Style Manager defaults and plan curation; Phase 3 (Block library + editor config) — implement restricted style panel

---

### Pitfall 5: Image URLs Breaking in Email Clients — Auth-Gated or Relative Paths

**What goes wrong:**
When a user uploads an image through the builder, if the serving endpoint requires authentication (e.g., Express middleware checking `req.session` or an `Authorization` header), every recipient's email client will get a 403 when trying to load that image. Email clients request images directly — they don't carry browser sessions. Additionally, if images are referenced as relative paths (`/uploads/image.png` instead of `https://your-domain.com/uploads/image.png`), they load in the browser preview but break in every email client.

**Why it happens:**
Developers reuse the app's authenticated asset endpoint for simplicity. The image "works" in the editor preview (authenticated browser session), so the issue is missed during development. Relative paths look valid in HTML but email clients have no base URL to resolve against.

**How to avoid:**
Upload endpoint stores files to object storage (S3-compatible: Cloudflare R2, AWS S3, MinIO). The stored URL returned to the editor is always a fully-qualified public HTTPS URL (`https://assets.yourdomain.com/uploads/...`). The upload endpoint itself can be authenticated (user must be logged in to POST), but the resulting file URL must be publicly readable with no auth. Never serve uploaded email assets through the authenticated app server. Configure GrapesJS's Asset Manager with `uploadTo` pointing to the upload API and store the returned absolute URLs.

**Warning signs:**
- Images load in the editor but appear broken when forwarding the exported HTML to an email client
- Image `src` attributes in exported HTML contain relative paths (`/uploads/...` instead of `https://...`)
- `curl https://your-domain.com/uploads/image.png` returns 401 or 302 to login

**Phase to address:** Phase 2 (Image upload) — establish public asset endpoint pattern before any image upload feature ships

---

### Pitfall 6: Persistence Fidelity Loss When Block Definitions Change

**What goes wrong:**
A newsletter saved as GrapesJS project JSON in week 1 references component types by name (e.g., `type: "mj-branded-hero"`). In week 6, the block definition is refactored — the component type is renamed, attributes are restructured, or a child component is added. When a user opens the old newsletter, GrapesJS cannot resolve the unknown or changed component type. Depending on GrapesJS version, this either silently falls back to `type: "default"` (rendering the block as raw HTML with no MJML semantics) or throws a load error. The user's newsletter is now partially or fully broken with no warning.

**Why it happens:**
Teams treat block definitions as implementation details that can change freely without considering that the project JSON is persistent data, not just configuration. No versioning or migration strategy is established before the first newsletter is saved.

**How to avoid:**
Stamp every saved project JSON with a `schema_version` field. Never rename or destructively change a registered component type — only extend it additively. If a type must be renamed, write a migration script that reads all saved newsletters, applies the transformation, and re-saves. Maintain a `component-versions.md` log. Before any block definition change ships to production, run the migration on a staging DB copy and verify that all saved newsletters load cleanly in the editor.

**Warning signs:**
- Editor console shows `Unknown component type: mj-branded-hero` on load
- Old newsletters open with some blocks showing as empty/unstyled
- Block styling resets when a previously saved newsletter is edited
- No `schema_version` field exists on saved project JSON

**Phase to address:** Phase 2 (Persistence schema design) — add `schema_version` from first save; Phase 3 (Block library) — document type names as a contract; any phase with block changes — migration first

---

### Pitfall 7: mj-head Defaults Drifting When Blocks Redeclare Them Inconsistently

**What goes wrong:**
Since `mj-attributes` is not reliable (see Pitfall 1), defaults must be embedded per-block. If different block authors embed them differently — one uses `color="#ffffff"`, another forgets it, a third uses `color="#FFF"`, a fourth adds `color="#fffffe"` — the compiled email has inconsistent text colors across sections, and any global change to brand defaults requires manually updating every block definition. The current `head.mjml` centralizes this; re-authoring destroys the single source of truth.

**Why it happens:**
Per-block embedding is copy-paste work. Without a documented and enforced block authoring standard, defaults drift. Multiple developers or phases produce inconsistent blocks.

**How to avoid:**
Define a `BLOCK_DEFAULTS` constant (a JavaScript object) that holds all required MJML attribute values extracted from `head.mjml`: color, font-family, line-height, font-size. Every block definition references this constant when constructing its `content` MJML string, rather than hardcoding values. Additionally, inject the `mj-head` block server-side at compile time as a fixed template string — this provides a safety net even if individual blocks drift.

**Warning signs:**
- Color values inconsistent across blocks in version control
- Brand color change requires editing 12+ block definition files
- Compiled email has one section with dark text when everything else is white

**Phase to address:** Phase 3 (Block authoring) — establish `BLOCK_DEFAULTS` constant and block authoring guide before writing first block

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Save MJML string as canonical editor state instead of project JSON | Simpler mental model — "MJML is the source" | Lossy on reload; blocks degrade over edit cycles; round-trip fidelity lost permanently | Never |
| Use app's authenticated file endpoint for uploaded images | Fewer moving parts initially | 100% image failure in email clients; discovered only when email goes out | Never |
| Skip versioning project JSON schema | Saves a field in the DB | Impossible to migrate old newsletters safely; first breaking block change corrupts all saved content | Never |
| Use GrapesJS default Style Manager sectors without curation | Faster initial editor setup | Non-devs can apply email-hostile CSS that passes browser preview but breaks Outlook/Gmail | Never for production; acceptable in Phase 1 spike to understand what the defaults are |
| Embed `mj-attributes` in head and rely on plugin to carry them | DRY global defaults | Attributes silently dropped; entire email renders with wrong font/color | Never — confirmed architectural limitation |
| Leave block type names as implementation details that can change freely | Easier early refactoring | Block renames corrupt saved newsletters with no recovery path without migrations | Never after first newsletter is saved to production DB |
| Reuse existing src/sections/*.mjml as import source for blocks | Instant branded block library | Import is lossy for mj-include/mj-style/mj-attributes constructs; exactly the known architectural limitation | Never — re-authoring is the decided approach |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| grapesjs-mjml + server-side compile | Pass editor's `getHtml()` output to `mjml()` on the server | Use `editor.runCommand('mjml-code-viewer')` or the plugin's MJML export method to get raw MJML, then compile server-side. `getHtml()` returns compiled HTML, not MJML. |
| GrapesJS + React | Instantiate GrapesJS inside a React component without lifecycle management | Init GrapesJS in a `useEffect` with a cleanup that calls `editor.destroy()`. Use a ref for the container DOM node. Mounting twice in StrictMode causes double-init errors. |
| Image upload + GrapesJS Asset Manager | Use the built-in `uploadTo` with a relative path | Set `uploadTo` to the full absolute API URL. Return an absolute public asset URL from the API response. GrapesJS Asset Manager expects the response body to contain `data: [{ src: "https://..." }]`. |
| mjml-browser (in-editor preview) vs mjml (server-side compile) | Assume both produce identical output | They diverge on edge cases. Server-side compile is authoritative; the in-editor preview is an approximation. Always test against server-side compiled HTML. |
| mj-font (Google Fonts) | Declare via mj-font component in editor, assume it persists | Verify font link tag appears in compiled HTML output. Cross-check issue #207 workaround — the plugin has historically dropped custom fonts from the export. Inject fonts server-side as a fallback. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Client-side MJML compile on every keystroke | Editor lags on text edits; browser tab CPU spikes | grapesjs-mjml already debounces preview — don't add additional sync compile calls; use debounced server compile only on explicit "Preview" action | Any newsletter with 5+ sections on mid-range hardware |
| Storing full compiled HTML in every save | DB grows quickly; response payloads bloated | Store only project JSON + MJML; compile HTML on demand or on export. Cache last-compiled HTML but do not make it the primary artifact | Not a breaking threshold but accumulates cost |
| Blocking Express route on synchronous `mjml()` compile | Server becomes unresponsive during export | `mjml()` compile is CPU-bound; offload to a worker thread (`worker_threads`) or compile in a child process for large newsletters | Single concurrent user won't notice; two simultaneous exports hang each other |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Serving uploaded images through authenticated Express routes | All email recipients see broken images (403). Additionally, if the endpoint is unauthenticated by mistake, it becomes an open file server. | Upload to object storage; serve from public CDN/S3 URL. Auth only the upload POST endpoint, never the asset GET. |
| Unsanitized MJML/HTML in compile input (CVE pattern: GrapesJS has documented XSS via component attributes, issues #391, #4076) | User-authored content containing `<script>` or event handlers injected into exported HTML | Sanitize the project JSON before saving; sanitize MJML before compiling. Use `mjml()`'s `minify` option and validate the component tree against allowlist of MJML tags. |
| No auth on the compile API endpoint | Anyone who discovers the endpoint can submit arbitrary MJML and receive compiled HTML — potential for server-side resource exhaustion or SSRF via external image URLs in MJML | Apply the same session/JWT middleware to all API routes including `/api/compile`. Rate-limit compile endpoint. |
| Storing JWT secret or DB credentials in committed `.env` | Credential exposure | Use `.env` that is git-ignored; inject secrets via environment in production. For an internal tool, a long-lived session secret in an env var is sufficient — no need for a secrets manager. |
| Over-building auth for an internal-only tool | Development time wasted on OIDC/OAuth flows not needed | For a team of ~10 internal users, email+password with bcrypt + express-session + `connect-pg-simple` (session in Postgres) is sufficient. No need for OAuth, SAML, or external identity providers unless the company mandates them. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Exposing all GrapesJS style properties | Non-dev applies flexbox or absolute positioning; email breaks in Outlook silently; no feedback until client testing | Restrict Style Manager to a curated email-safe property list. For brand colors, use a color picker pre-loaded with the brand palette — not a free-form hex input. |
| No mobile preview toggle | Users author only for desktop viewport; email breaks on mobile | Require a mobile preview toggle in the UI before export is enabled. grapesjs-mjml supports viewport switching — wire it to a visible button. |
| Export = raw MJML (not compiled HTML) | Non-devs receive an MJML file; they don't know what to do with it | Export always gives compiled HTML. Offer MJML only as a developer debug download (behind an "Advanced" toggle). |
| Unlimited block customization (colors, fonts, spacing freely editable) | Brand drift — every newsletter looks different; on-brand guarantee lost | Lock brand colors to a fixed palette dropdown. Lock font-family (not user-editable). Allow spacing adjustments within defined ranges. Allow text content editing freely. |
| No undo history persistence | User makes wrong edit, closes tab, reopens — undo history gone | GrapesJS undo/redo is in-memory only. Warn users before navigating away if there are unsaved changes. Auto-save project JSON every 30 seconds to the server. |
| Identical "Save" and "Export" concepts | Users save-to-DB thinking that's the HTML export; or export thinking the file is their editable version | Use distinct UI language: "Save" = store editor state to DB (editable later); "Export HTML" = compile and download the final email. Separate buttons, separate visual weight. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Editor preview vs. compiled output match:** Verify server-side compiled HTML matches browser preview for every block — not just visually but inspect table structure. The browser preview uses mjml-browser; the server uses mjml. Divergences are client-rendering bugs.
- [ ] **Image URLs in exported HTML are absolute:** After export, `grep -o 'src="[^"]*"'` every image src — none should be relative paths.
- [ ] **Fonts in compiled HTML:** Check that the Roboto Google Fonts `<link>` tag and Calibri/fallback `font-family` appear in the `<head>` of the compiled HTML output, not just in the editor preview.
- [ ] **mj-spacer preserved in export:** Outlook uses spacer elements for spacing — verify `<mj-spacer>` in re-authored blocks compiles to the `<div style="height:Xpx">` table-spacer structure in the output HTML, not to margin/padding on a container.
- [ ] **White text default not lost:** Open a freshly saved newsletter, export HTML, send to an Outlook client or use Litmus/Email on Acid — verify text is white where the brand requires it, not black-on-white default.
- [ ] **Re-open fidelity:** Save a complex newsletter (multiple blocks, edited text, uploaded image). Close. Reopen. Every block should look exactly as left — no color resets, no missing images, no font changes.
- [ ] **Block type unknown after refactor:** After any block definition rename/change, load all pre-existing saved newsletters in a test environment — none should show empty blocks or console errors.
- [ ] **Simultaneous compile doesn't hang:** Open two browser tabs, trigger Export on both simultaneously — verify both complete without the server becoming unresponsive.
- [ ] **Unauthenticated image URL is public:** Construct the URL of an uploaded image; request it with `curl` without any auth headers — it must return 200.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| mj-attributes discovered non-functional after blocks authored without inline defaults | HIGH | Rewrite all block definitions to embed defaults; test every block against each email client; re-save any newsletters that were saved with corrupt defaults |
| Project JSON saved as MJML source (round-trip used as storage) | HIGH | No clean recovery — degraded newsletters cannot be fully restored. Assess if any content is recoverable from MJML text; likely requires re-authoring from scratch |
| Block type renamed without migration before users have saved newsletters | HIGH | Write a DB migration that reads all `project_json` blobs, runs a find/replace on the old type name, re-saves. Test migration on staging before production. |
| Auth-gated image URLs in sent emails | MEDIUM | Re-upload images to public storage; find all newsletters containing the old private URL; update asset references; re-export and resend |
| GrapesJS or plugin version bump breaks custom blocks | MEDIUM | Revert package versions immediately (pinned versions prevent this from reaching production). Then systematically test and fix block registrations against the new version. |
| Non-dev applies email-hostile CSS (flexbox etc.) and sends broken email | LOW–MEDIUM | Fix by opening the newsletter, removing the offending style properties, recompiling. Prevent recurrence by locking the Style Manager as designed. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| mj-attributes silently dropped | Phase 1 (spike): confirm experimentally; Phase 2 (blocks): embed defaults per-block | Compile a block with no inline defaults; verify output has correct color/font |
| Editor state vs. MJML source drift | Phase 1 (spike): verify round-trip; Phase 2 (persistence): JSON-primary schema | Save + reload + compare project JSON; assert no attribute changes |
| Custom block breaks on version update | Phase 1 (spike): pin versions; Phase 3 (block library): add CI regression test | Automated test: instantiate editor, drag each block, assert MJML output structure |
| Email-hostile CSS via Style Manager | Phase 1 (spike): audit defaults; Phase 3 (editor config): restrict sectors | Inspect Style Manager UI — flexbox/position must not appear |
| Image URLs breaking in email clients | Phase 2 (image upload): public URL pattern from day one | `curl` each image URL without auth — must return 200 |
| Persistence fidelity loss on block change | Phase 2 (schema): add `schema_version`; Phase 3 (blocks): document type names as contract | Load oldest saved newsletter after each block change in staging |
| mj-head defaults drifting across blocks | Phase 3 (block authoring): establish `BLOCK_DEFAULTS` constant | Diff MJML attribute values across all block definitions — must match |
| Auth-gated asset endpoint | Phase 2 (image upload) | Integration test: upload image, take URL, request without session cookie |
| XSS via unsanitized component attributes | Phase 2 (compile API): sanitize on save and on compile | Send crafted project JSON with `<script>` tag; verify it does not appear in compiled HTML |
| Non-dev breaks brand via free-form style | Phase 3 (editor config): restricted style panel + brand palette | User acceptance test: hand editor to a non-dev without guidance; verify they cannot apply flexbox |

---

## Sources

- grapesjs-mjml npm package: https://www.npmjs.com/package/grapesjs-mjml (version 1.0.8, last modified 2026-03-13, no peerDependencies — HIGH confidence)
- Mautic forum — mj-attributes limitation confirmed as architectural: https://forum.mautic.org/t/are-mj-attributes-functional-on-grapesjs-mjml/21875 (HIGH confidence: moderator confirmation)
- GrapesJS/mjml GitHub issues — open issue list: https://github.com/GrapesJS/mjml/issues (XSS issue #391, background image #397, redo image loss #389)
- GrapesJS/mjml issue #207 — custom fonts not preserved in export: https://github.com/GrapesJS/mjml/issues/207 (MEDIUM confidence: issue shows the gap and a contributor workaround)
- GrapesJS Storage Manager docs — "Always rely on JSON project data": https://grapesjs.com/docs/modules/Storage.html (HIGH confidence: official docs)
- GrapesJS XSS vulnerability history: https://github.com/GrapesJS/grapesjs/issues/4076 and https://security.snyk.io/vuln/SNYK-JS-GRAPESJS-2935960 (MEDIUM confidence: multiple documented CVEs)
- MJML image hosting guidance: https://github.com/mjmlio/mjml/discussions/2583 (HIGH confidence: official MJML repo)
- Existing project context: `src/components/head.mjml` and `PROJECT.md` (HIGH confidence: primary source)

---
*Pitfalls research for: GrapesJS + grapesjs-mjml newsletter builder*
*Researched: 2026-06-25*
