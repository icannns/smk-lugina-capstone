# Frontend regression checks

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

## Role guards and Instant Navigation

`role-navigation-regressions.mjs` exercises every Guru and Siswa page without
login, with its correct role and with the wrong role, plus logout. It verifies
Aisyah M1 and Nabila M4 through direct and client navigation and fails on Next.js
Instant Navigation diagnostics, console errors, page errors or failed responses.
Its route inventory also fails when a new protected page has no test scenario.

Run it against both the production server and a development server, using the
same optional `PLAYWRIGHT_MODULE` / `PLAYWRIGHT_CHANNEL` settings above:

```powershell
$env:AUDIT_BASE_URL = 'http://localhost:3000'
node tests/role-navigation-regressions.mjs

# With npm run dev serving on port 3001:
$env:AUDIT_BASE_URL = 'http://localhost:3001'
node tests/role-navigation-regressions.mjs
```

Without `AUDIT_OUTPUT_DIR`, this runner writes results to the OS temporary
directory under `lugina-role-navigation-regressions`. Use separate output
directories when retaining results from both server modes. Each successful run
currently exercises 51 checks; development image-sizing warnings are recorded
separately and do not stand in for Instant Navigation errors.
