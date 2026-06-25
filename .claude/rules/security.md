# Security

Internal team tool, but exported HTML is public and image URLs are unauthenticated. Treat auth, the cookie model, and uploads as the hard surfaces.

## Auth & sessions

- **JWT in an httpOnly cookie** (AUTH-02). Never store the token in `localStorage`/`sessionStorage` — XSS-readable.
- Cookie flags: `httpOnly`, `Secure` (prod), `SameSite=Lax` (or `Strict`), scoped path, sensible `maxAge`.
- Passwords hashed with **bcrypt** (cost ≥ 12). Never log or return hashes.
- v1 has **no public signup** — users are pre-seeded. Do not build a registration flow.
- Express auth middleware verifies the JWT on every protected route; unauthenticated requests get `401`, never a redirect-with-data leak (AUTH-04).

## CSRF — required because the JWT is a cookie

An httpOnly cookie is sent automatically by the browser on every request, including cross-site form posts → **every state-changing route is CSRF-exposed**. (This is *new* vs an `Authorization: Bearer` model, which is not auto-sent.)

- Set `SameSite=Lax` minimum on the auth cookie (blocks most cross-site POSTs).
- Add a **CSRF token** for all mutating routes (POST/PUT/PATCH/DELETE): double-submit cookie or per-session token validated server-side. The SPA reads it and sends it in a header.
- `GET` routes must be side-effect free so they need no CSRF token.

## CORS (the :5173 ↔ :3000 split)

- Dev: Vite client at `:5173`, Express API at `:3000` → cross-origin.
- `cors` middleware with an **explicit origin allowlist** (not `*`) and `credentials: true`.
- Client fetch wrapper must send `credentials: 'include'` so the cookie rides along (see `api-client.md`).
- `helmet` on every response.

## Image upload hardening (IMG-01)

Uploads land at a **public, unauthenticated** HTTPS URL, so a poisoned upload is internet-reachable. The upload POST itself is **authenticated**; the asset GET is public.

- **Verify type by magic bytes**, not the file extension or client `Content-Type`.
- **Cap file size** (multer `limits.fileSize`) and reject oversized before processing.
- **Sanitize / never trust the filename** — generate the storage key yourself; block path traversal (`../`). Never write under a client-supplied path.
- **Re-encode through `sharp`** to a known format — strips embedded payloads/EXIF and normalizes output.
- Serve assets from a dedicated static path with no execution and correct `Content-Type`.

## Input validation

- Validate **every** API request body/params/query with **zod** at the route boundary (see `backend-express.md`). Reject with `400` + a safe message on failure.
- Newsletter `project_data` is stored as JSONB — validate it's well-formed JSON of expected shape before persisting; never `eval`/execute stored content.

## Secrets

- All secrets (JWT signing key, DB URL) come from env via `dotenv` — never hardcoded, never shipped to the client bundle. Only `VITE_`-prefixed vars reach the browser; keep secrets unprefixed.

## Cross-references
- `api-client.md` — `credentials: 'include'` and CSRF header on the client side.
- `backend-express.md` — where validation and auth middleware sit in the request pipeline.
