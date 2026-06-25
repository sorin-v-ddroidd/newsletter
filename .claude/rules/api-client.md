# API Client

The React SPA calls the **Express** API over HTTP. Auth rides in an **httpOnly cookie**, so the client never handles tokens. All calls go through one typed `lib/api` wrapper — never scatter raw `fetch` with hand-built URLs and headers across components.

## The wrapper

`lib/api.ts` centralizes: base URL, `credentials: 'include'` (so the auth cookie is sent), JSON headers, the CSRF header on mutations, and error→typed-result handling.

```ts
// lib/api.ts
const BASE = import.meta.env.VITE_API_URL; // e.g. http://localhost:3000

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',                 // REQUIRED — sends the httpOnly auth cookie
    headers: {
      'Content-Type': 'application/json',
      ...(init.method && init.method !== 'GET' ? { 'X-CSRF-Token': getCsrfToken() } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw await toApiError(res);  // typed error, never a raw cast
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  get:  <T>(p: string) => request<T>(p),
  post: <T>(p: string, body: unknown) => request<T>(p, { method: 'POST', body: JSON.stringify(body) }),
  put:  <T>(p: string, body: unknown) => request<T>(p, { method: 'PUT',  body: JSON.stringify(body) }),
  del:  <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};
```

## Rules

- **Always** `credentials: 'include'` — omitting it drops the auth cookie and every protected call 401s.
- **Never** read or store the JWT in JS (it's httpOnly and invisible by design). No `Authorization: Bearer` header — auth is the cookie.
- Mutations (POST/PUT/PATCH/DELETE) **must** carry the CSRF header (see `security.md`). GETs must not need it.
- Type every response (`api.get<Newsletter[]>('/api/newsletters')`). No `(await res.json()) as T` casts in feature code — typing lives in the wrapper call site.
- Share request/response **types** between client and server from one place (a `shared/` module or a hand-maintained `types.ts`) so the contract can't silently drift.

## Don't do this

```ts
// wrong — raw fetch, no credentials, untyped, manual everywhere
const res = await fetch(`http://localhost:3000/api/newsletters`, {
  headers: { 'Content-Type': 'application/json' },
});
const data = (await res.json()) as Newsletter[];
```

## File uploads

Image upload is `multipart/form-data`, not JSON. Use a dedicated wrapper variant that sets the body to `FormData` and **omits** the JSON `Content-Type` (the browser sets the multipart boundary), but still sends `credentials: 'include'` + CSRF header.

## Cross-references
- `security.md` — cookie model, CSRF, CORS-with-credentials.
- `backend-express.md` — the routes this client calls.
