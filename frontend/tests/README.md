# Round 2 regression checks

From `frontend/`, after installing the existing dependencies:

```powershell
node --test tests/audit-regressions.test.mjs
```

This uses Node's test runner and the project's installed TypeScript compiler to
exercise the actual selectors, PDF writer, serialization and session store. It
does not replace application modules with a second implementation.

For the browser cases, start the built application separately (`npm run build`,
then `npm run start`). Stop the running server before rebuilding `.next` to avoid
stale stylesheet URLs. Use an existing Playwright installation; no application
dependency was added for this audit:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:/path/to/node_modules/@playwright/test'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
node tests/audit-browser-regressions.mjs
```

If `@playwright/test` is already resolvable, omit `PLAYWRIGHT_MODULE`. The default
browser channel is Edge. `AUDIT_BASE_URL` defaults to `http://localhost:3000`;
`AUDIT_OUTPUT_DIR` defaults to the OS temporary directory under
`lugina-final-audit-round-2/regressions`.

The browser runner creates a fresh isolated context and a controlled **40-person
fictional enrollment fixture**, including a historical grade/current ungraded
revision. It checks B01–B10, notes/review/profile persistence, survey metadata,
Dashboard counts, readable labels, actual PDF/XLSX downloads and field-level
validation focus/ARIA associations. No real accounts, uploads or backend APIs
are involved. The fixture is separate from the full UI-created event integration
walkthrough described in `../INTEGRATION-HANDOVER.md`. Historical audit reports
are retained locally and are not required by either runner.

Evidence is written outside the repository. Existing user browser sessions are
not used. These checks do not certify server security, screen-reader behavior,
cross-device synchronization or exact pixel equivalence to Figma.
