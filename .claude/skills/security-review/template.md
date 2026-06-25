# Security Review Template

Use this report template for security-sensitive changes.

## Scope

- Files reviewed:
- Feature:
- Threat surface:

## BLOCKERS

- [file:line] Issue:
  Impact:
  Fix:

## WARNINGS

- [file:line] Issue:
  Impact:
  Fix:

## PASSED

- Input validation checked
- Token handling checked
- Sensitive logging checked

## Security Checklist

- No hardcoded secrets/tokens/credentials
- No `dangerouslySetInnerHTML` without sanitization
- No tokens persisted in `localStorage`
- Input validation present (Yup for forms)
- No raw `fetch` for authenticated REST calls (use `apiClient`)
- Generic user-facing errors; no internal stack leakage
