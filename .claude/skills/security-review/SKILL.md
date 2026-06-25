---
name: security-review
description: Use this skill when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing payment/sensitive features. Provides comprehensive security checklist and patterns.
disable-tool-invocation: true
---

# Security Review — Quick Checklist

## Supporting Files

- `template.md` — standardized BLOCKERS/WARNINGS/PASSED security report format
- `examples/sample.md` — sample findings with concrete fix guidance
- `scripts/validate.mjs` — quick checks for XSS/token/secret/fetch anti-patterns

Run:
```bash
node .claude/skills/security-review/scripts/validate.mjs
```

For detailed checks, code examples, and patterns: read `references/full-guide.md`

---

## When to Apply This Skill

- Implementing authentication or authorization
- Handling user input or file uploads
- Creating or modifying API endpoints
- Working with secrets, tokens, or credentials
- Storing or transmitting sensitive data

---

## Core Security Checklist

### Secrets & Environment Variables
- [ ] No hardcoded API keys, tokens, or passwords in source
- [ ] All secrets in environment variables (`NX_PUBLIC_*` or server-only)
- [ ] `.env` files in `.gitignore`
- [ ] No secrets in git history

### Input Validation (YG: use Yup, not Zod)
- [ ] All user input validated with a Yup schema in `validation.ts`
- [ ] File uploads validated: size limit, allowed MIME types, allowed extensions
- [ ] Whitelist validation (allow known-good) not blacklist
- [ ] Error messages do not expose internal details

### XSS Prevention
- [ ] No `dangerouslySetInnerHTML` without `DOMPurify` sanitization
- [ ] User-provided HTML stripped to allowed tags only
- [ ] React's built-in escaping relied on for interpolated values

### CSRF Protection
- [ ] State-changing requests include CSRF token or use `SameSite=Strict` cookies
- [ ] Session cookies set with `HttpOnly; Secure; SameSite=Strict`

### Token & Auth Handling (YG: react-oidc-context + Keycloak)
- [ ] Tokens never stored in `localStorage` — use httpOnly cookies or oidc context
- [ ] `apiClient` from `@fd-tenant/api` used for REST calls (injects Bearer token automatically)
- [ ] Apollo Client used for GraphQL (token injected via link)
- [ ] Authorization checks happen server-side, not just in the UI

### Sensitive Data
- [ ] Passwords, tokens, card numbers never logged
- [ ] Generic error messages shown to users; details only in server logs
- [ ] Stack traces never exposed to the client

### Dependencies
- [ ] `npm audit` passes with no high/critical vulnerabilities
- [ ] Lock file committed (`package-lock.json`)

---

## YellowGrid-Specific Notes

| Concern | YG approach |
|---|---|
| REST auth | `apiClient` from `@fd-tenant/api` — Bearer token auto-injected |
| Input validation | Yup schemas in `validation.ts` (not Zod) |
| Token management | `react-oidc-context` — never access tokens manually |
| Env vars (browser) | `NX_PUBLIC_` prefix in `environment.ts` |
| No raw fetch | Use `apiClient` (REST) or Apollo (GraphQL) only |
