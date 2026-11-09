# Shared authentication prototype

For current setup/publication context, see [README.md](README.md) and
[INTEGRATION-HANDOVER.md](INTEGRATION-HANDOVER.md). The QA and no-publication
statements at the end record the original implementation phase.

The latest authentication correction supersedes the earlier Teacher-only visuals.
Figma is accessible through the connected MCP. The verified source is
`hWTpQwbyreDsivI3tZ0yLa` → **Guru & Siswa** (`348:10566`) → **Redesign Siswa**.

| Screen | Exact frame | Shared route |
| --- | --- | --- |
| S01 Login | `370:1538` | `/login` |
| S02 Register | `370:1651` | `/register` |
| S03 Google registration | `370:1724` | `/register/google` |
| S04 Loading | `370:1777` | `/loading` |

All four contexts, screenshots, assets and prototype reactions were inspected
before implementation. There is one interface for both roles. Login copy is
role-neutral while retaining the S01 split layout, form positions and mascot.
S02/S03 retain their blue illustration panel and floating cards. Native shapes
remain CSS; four exported SVG assets are local under `public/auth/shared/`.
Copy claiming official certification or actual Google authorization was replaced
with truthful prototype wording.

## Fictional accounts

| Role | Username | Email | Password |
| --- | --- | --- | --- |
| Teacher | `rina.guru` | `guru@example.com` | `DemoGuru123!` |
| Student Dimas | `dimas` | `siswa@example.com` | `DemoSiswa123!` |
| Student Aisyah | `aisyah` | `aisyah@example.com` | `DemoSiswa123!` |

These are public demo fixtures, not secrets or real accounts. The expandable
notice on Login exposes the testing credentials. Google sign-in selects the
fictional `google-dimas` Student record and S03, with no OAuth or external request.
It represents the same demo learner as Dimas, so their learning data is shared.

The account registry sets each role. Email domains, names, profile fields and
registration input never assign roles. Public registration creates only Student
records; there is no role selector. Registration uses fictional `@example.com`
addresses, password strength checks and confirmation. Profile contact email can
change without altering login identity or role. Teacher accounts are preconfigured.

Login verifies credentials before establishing a pending session. S04 renders
through two animation frames, then promotes the pending account and redirects
Teacher to `/guru/dashboard` or Student to `/siswa/dashboard`. There is no artificial
long loading delay. Invalid credentials remain on Login with an error. Both roles
have working logout actions. Unauthenticated role routes redirect to Login; the
wrong role redirects to its own dashboard. These checks cover direct navigation
as well as the sidebar.

Role layouts always render their child page. Each protected Guru/Siswa page wraps
its feature component in the existing `RoleGate`, inside its existing Suspense
boundary where present. Guarding in a layout used to omit the entire page segment
while client auth was initializing, causing Next.js Instant Navigation validation
to report `instant-unrendered-segment`. Page-level guards preserve the same
loading, wrong-role redirect and logout behavior without dropping the route
segment. New protected pages must include the matching guard and be added to
`tests/role-navigation-regressions.mjs`; do not remove guards or disable framework
validation to bypass this requirement. These remain client-side prototype guards.

## Storage and production boundary

`src/lib/auth/accounts.ts` owns fixed records; `session.ts` owns the reactive mock
session. `lugina.auth.demo.v1` in sessionStorage contains account IDs, fictional
registration records, salted SHA-256 comparison digests and mock Google profile
data. It never contains plaintext passwords. Fixed demo passwords exist only in
the public source fixture and the visible demo notice. This digest scheme is
strictly for the prototype, not production password storage.

Checked “Ingat saya” preserves login on refresh of the same tab. Unchecked keeps
login in memory only. Registered fictional records remain available in that tab.
Blocked/corrupt storage produces a warning and a memory fallback. Logout clears
the active/pending IDs, preserving domain data for a Teacher/Student demonstration.
No localStorage, cookies, backend authentication, database, OAuth or credential
transmission is used.

**Client-only route restrictions are demonstrative, not production security.**
The browser and its storage are editable. Production requires server-side account
verification, authorization on every protected request, secure sessions, proper
password hashing and genuine OAuth integration.

## Files and verification

New shared files: `src/lib/auth/{accounts,session,validation}.ts`,
`src/components/auth/{shared-ui,auth-graphic,auth-loading,role-gate}.tsx`,
`src/app/(auth)/loading/page.tsx`, and role layouts under `src/app/{guru,siswa}/`.
Updated: existing auth shell, login/register/Google forms, mock-navigation hook,
root metadata, and Teacher logout wiring. The old reusable `AuthButton` remains
unchanged because Dashboard components reuse it. There are no separate Guru or
Siswa login routes, and no project/dependency/global-CSS changes.

QA artifacts and scripts are outside the repository in `%TEMP%`:
`lugina-shared-auth-qa/`, `lugina-shared-auth-check.cjs`,
`lugina-teacher-shared-regression.cjs`, `lugina-shared-final-smoke.cjs`.
See `STUDENT-MODULE.md` for the connected Student data model and final QA results.

No reset, revert, commit, push or merge was performed. Existing uncommitted Teacher
work was preserved on `feature/guru-frontend` (base `34f738c`).
