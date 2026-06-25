# Security Review Sample

## BLOCKERS

- `apps/tenant-ksa/src/app/pages/example/index.tsx:42` token stored in localStorage
  Impact: token exposure via XSS
  Fix: rely on OIDC context + secured transport; do not persist manually

- `apps/tenant-ksa/src/app/components/example/index.tsx:61` dangerouslySetInnerHTML with unsanitized user content
  Impact: XSS execution
  Fix: sanitize with DOMPurify and strict allow-list

## WARNINGS

- `apps/tenant-ksa/src/app/api/example/mutations.ts:18` response errors are passed directly to user
  Impact: possible internal details disclosure
  Fix: map to generic translation key and log details server-side only

## PASSED

- Uses `apiClient` from `@fd-tenant/api`
- Uses Yup schema for input validation
- No hardcoded service URLs or credentials
