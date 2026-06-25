# Testing

There is no automated test suite — `npm test` is a placeholder that exits with an error. "Testing" a newsletter means rendering the compiled HTML and confirming it looks right across email clients before a real send.

## What to test

1. **It compiles** — `npm run build-pages` produces `dist/index.html` with no MJML errors.
2. **It renders in a browser** — quick visual check via `npm run dev` at <http://localhost:8080>.
3. **It survives real clients** — the only test that matters for email. Browser ≠ client.

## Browser preview (fast loop)

```bash
npm run dev
```

browser-sync serves `dist/` at <http://localhost:8080> and reloads on rebuild. Good for layout/content iteration, **not** a substitute for client testing.

## Outlook preview (Windows)

```powershell
# Open a draft without sending:
.\QuickEmailTest.ps1 -HtmlFilePath dist\index.html -PreviewOnly
```

`QuickEmailTest.ps1` loads the HTML, connects to Outlook via the `Outlook.Application` COM object, and opens (or sends) a mail item. Requires Outlook installed and running on Windows.

## Sending a test email

```powershell
# QuickEmailTest: drops -PreviewOnly to actually send (recipient hard-coded to test@test.com):
.\QuickEmailTest.ps1 -HtmlFilePath dist\index.html

# EmailTester: richer script with explicit recipients, subject, and debug output:
.\EmailTester.ps1 -HtmlFilePath dist\index.html -TestEmails you@example.com -Subject "Digest" -Debug
```

`EmailTester.ps1 -Debug` checks that the Outlook process is running and prints connection diagnostics — use it when a send fails.

### Script parameters

| Param | `QuickEmailTest` | `EmailTester` |
|-------|:---:|:---:|
| `-HtmlFilePath` (required) | ✓ | ✓ |
| `-TestEmails` | ✓ | ✓ |
| `-Subject` | ✓ | ✓ |
| `-PreviewOnly` | ✓ | ✓ |
| `-Debug` | — | ✓ |

If Outlook can't be reached, the scripts print an error and suggest a manual copy-paste of the HTML.

## Cross-client testing

Local Outlook covers one client. For full coverage use a dedicated service:

- [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/) — render `dist/index.html` across Outlook variants, Gmail, Yahoo, Apple Mail, mobile, etc.
- Send live tests to accounts on each major provider and inspect on desktop + mobile.

Focus on the known trouble spots from [DEVELOPMENT.md](DEVELOPMENT.md): Outlook spacing, Gmail style-stripping/fonts, Yahoo media queries, and that remote images actually load (and aren't blocked by default).

## Reference fixtures

- `test.eml` — a captured raw email for reference/comparison.
- `history/` — previously sent digests (e.g. `2024/`).

## Pre-send checklist

- [ ] `npm run build-pages` succeeds with no errors
- [ ] All remote images load (no broken `src` URLs)
- [ ] Tracking-pixel URL params updated for this send (see [CONFIGURATION.md](CONFIGURATION.md))
- [ ] Rendered in at least Outlook + one Gmail/Yahoo account
- [ ] Mobile layout checked
- [ ] Subject line set (scripts default to a generic test subject)
