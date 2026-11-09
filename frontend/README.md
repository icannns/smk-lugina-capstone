# Bojong United frontend

Integrated Teacher and Student **fictional-data prototype**, built with Next.js
16 App Router, React, TypeScript and Tailwind CSS. It is suitable for a local
frontend demonstration, not production authentication or multi-user operation.

## Run locally

Use Node.js 20.9 or newer and npm. From this directory:

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production-mode local demonstration, stop the
running production server before rebuilding its `.next` output, then run:

```powershell
npm run build
npm run start
```

No backend, database, OAuth setup or `.env` credentials are required. Do not enter
real personal information or credentials. Figma assets are local. Next.js serves
Inter locally after building; the first build may download it through `next/font`.

## Demo accounts and routes

| Role | Username / email | Public demo password | Home |
| --- | --- | --- | --- |
| Teacher | `rina.guru` / `guru@example.com` | `DemoGuru123!` | `/guru/dashboard` |
| Student Dimas | `dimas` / `siswa@example.com` | `DemoSiswa123!` | `/siswa/dashboard` |
| Student Aisyah | `aisyah` / `aisyah@example.com` | `DemoSiswa123!` | `/siswa/dashboard` |

Both roles use `/login`, `/register`, `/register/google` and `/loading`.
Public registration creates fictional Student accounts only; Google is a mock.

- Teacher: Dashboard, Students, Events and complete event wizard, Rubrics,
  Monitoring/Assessment, Student Work, Reports and Profile under `/guru/*`.
- Student: event discovery/enrollment, Dashboard, Workspace, configured milestone
  Survey forms, Portfolio/example certificates and Profile under `/siswa/*`.
- Teacher Survey-administration/privacy sidebar entries and Student Settings are
  visible native disabled buttons. They neither navigate nor open placeholders.
  Functional Student milestone Survey forms remain available.

Use **one tab**, logging out and back in as the other role, to demonstrate
Teacher publication → Student enrollment/submission → Teacher feedback/revision
→ Student revision → Teacher reassessment. New versions retain history and need
a new assessment. Browser sessions/devices do not share mock changes.

## Verification

```powershell
npm run lint
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
node --test tests/audit-regressions.test.mjs
```

See [`tests/README.md`](tests/README.md) for the existing browser regression runner
and its optional external Playwright installation. No Playwright runtime
dependency is required by the application.

## Design, architecture and limits

Teacher screens follow **Page 1 → Redesign Guru**. Shared authentication and
Student screens follow **Guru & Siswa → Redesign Siswa**, including S01–S04, in
Figma file `hWTpQwbyreDsivI3tZ0yLa`. Original Role Guru is not authoritative.

The shared domain adapter is `src/lib/guru/event-draft-store.ts`; auth is in
`src/lib/auth/`. Domain changes persist in this tab's sessionStorage. Client
guards and password digests demonstrate behavior, not secure authentication.
Uploads retain metadata, not file bytes. PDF/XLSX and example certificate PDF
downloads are generated locally; certificates are unofficial prototypes.

New events do not provision external Survey instruments. Submission, grading,
feedback and Reports work, but later survey-gated stages/certificates require
Survey-team integration. The accepted B11 development-tooling advisory and minor
V04 visual differences remain documented limitations.

## Handover

- [Integration and COMMIT migration](INTEGRATION-HANDOVER.md): current entry point.
- [Shared authentication](SHARED-AUTHENTICATION.md): roles/session contract.
- [Teacher Module](TEACHER-MODULE.md) and [Student Module](STUDENT-MODULE.md):
  feature/source maps and implementation history.
- `DASHBOARD.md`, `STUDENT-MANAGEMENT.md`, `EVENT-MANAGEMENT.md`, `EVENT-WIZARD.md`
  are retained historical phase records; current integration behavior supersedes
  their earlier scope and persistence limitations.
