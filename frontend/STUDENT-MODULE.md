# Redesign Siswa frontend

Current integration/run instructions are in [README.md](README.md) and
[INTEGRATION-HANDOVER.md](INTEGRATION-HANDOVER.md). QA and Git statements below
record their original implementation phase.

This implements the complete visible Student flow requested in the shared-auth
correction. The authoritative source is the **Guru & Siswa** page (`348:10566`),
**Redesign Siswa**, in Figma file `hWTpQwbyreDsivI3tZ0yLa`. It is accessible through
the connected MCP. All listed design contexts, screenshots, exported assets and
available prototype reactions were inspected before coding. Unrelated designs,
Pencil/SIMLOGKES, FOMO, COMMIT and the separate Survey administration module were
not accessed or implemented.

## Source and routes

| Feature | Frames | Route |
| --- | --- | --- |
| Shared auth S01–S04 | `370:1538`, `370:1651`, `370:1724`, `370:1777` | `/login`, `/register`, `/register/google`, `/loading` |
| Explore/enroll S05–S08 | `370:1786`, `370:2001`, `370:2171`, `370:2352` | `/siswa/events?event=ID` |
| Dashboard S09 | `370:2522` | `/siswa/dashboard` |
| Workspace/revision/survey required S10–S12 | `370:2708`, `370:2885`, `370:3058` | `/siswa/workspace?event=ID&milestone=ID` |
| Survey S13–S16 | `370:3247`, `370:3382`, `370:3537`, `370:3705` | `/siswa/survey?event=ID&milestone=ID&mode=instructions\|form\|result\|history` |
| Portfolio list | `370:3829` | `/siswa/portfolio` |
| Work details/revision/assessed/pending | `370:4068`, `370:4426`, `370:5414` | `/siswa/portfolio?event=ID` |
| Project/claim/download/partly assessed | `370:4833`, `370:5120`, `370:5687` | `/siswa/portfolio?event=ID&view=project` |
| Certificate preview | `370:5945` | Dialog on project |
| Profile S21–S22 | `370:6265`, `370:6393` | `/siswa/profile` |

The sidebar/header use the Student frames, with a 256 px desktop sidebar, 64 px
header, local SVG icons, Inter, existing Lugina tokens, cards and responsive
navigation. Form grids, Likert rows, tables/cards and dialogs adapt for mobile.
No global CSS or additional dependency was introduced.

## Implemented interactions

- Explore: actual unique event counts, search, status filter, all/not-enrolled
  tabs, pagination, detail, enroll confirmation/cancel, idempotent enrollment,
  success state, Dashboard and workspace links.
- Dashboard: enrollment-derived statistics, actionable revision/survey/certificate
  rows, event tabs, current milestone and progress, connected navigation.
- Workspace: ordered milestones, locks, instructions, deadlines and accepted
  formats; drag/drop or picker; max five files of 10 MB each; optional answer and
  supported link; remove files; validation; save/restore draft; submit or revise;
  current and historical versions, teacher feedback and historical grades.
- Survey: instructions, actual 1–5 choices for two required questions, optional
  reflection, draft, accurate counter, confirmation/cancel, one locked response,
  read-only history, next milestone link. No Survey administration interface.
- Portfolio: search, period/status filters, unique event cards, submissions,
  feedback and version history; project summary; tasks/survey/assessment/certificate
  conditions; preview, idempotent prototype claim and a valid client-generated PDF.
- Profile: name/contact validation, immutable role/school fields, local JPG/PNG
  selection (2 MB, minimum 200×200), reusable canvas crop, preview, persistent
  save, dismissible feedback, updated header/roster and cancellation.
- Missing or unenrolled event/milestone routes have recovery links. Settings is
  visible but disabled, without a placeholder modal. Support retains its separate
  informational boundary. Functional milestone Survey forms are unaffected.

## Shared state and confirmed rules

`src/lib/guru/event-draft-store.ts` remains the single persistent domain store:
`lugina.teacher.event-drafts.v1` in sessionStorage. Existing versions load without
Student fields. It now includes `studentUI` for profile, work/survey drafts,
responses and certificate claims, and optional learning overrides for students,
event enrollments and submissions. Defensive parsers preserve Teacher data.

Identity, event ID, student ID, milestone ID and submission-version ID stay stable.
Shared selectors merge fixtures with overrides; there are no independent Student
copies of events, rubrics, assessments or grades. New enrollment and submissions
appear in Teacher Student Management, Monitoring, Karya, Reports and Dashboard.
Teacher assessments/feedback/revisions are reflected back to the Student.
Historical scores and evidence stay on their version; a new revision needs a new
assessment. Passwords and file contents are never stored in this domain store.

Confirmed Student design rules:

- In Mode Penyelesaian, a previous task **and its survey** must be completed to
  unlock the next milestone. A teacher grade is not an unlock prerequisite.
- Existing later submissions are not relocked when an earlier revision is requested
  (S11 and S12 explicitly show both states together).
- Early task completion/deadline expiry does not bypass certificate conditions.
  All tasks/forms and assessments must be complete, score must meet the event
  threshold, and no revision may remain open. Workshop threshold is 70; Kantin
  and Poster use 75. The threshold helper is shared with Teacher views.
- Claimed documents retain the name and score captured at claim time. Profile
  edits do not silently rewrite a prior claim. Claims use DEMO IDs and fictional
  signer wording. There is no actual institutional issuance, signature, official
  serial or verification service. Download generates a real prototype PDF.

## Inferred and unspecified behavior

- Figma connects enroll → confirmation → enrolled, task submission → Dashboard,
  survey instructions → form → confirmation → result, and profile save → feedback.
  These are implemented. S04's design click target is Explore; the explicit shared
  authentication requirement overrides it with automatic role-dashboard routing.
- The certificate preview frame exists but has no confirmed incoming reaction.
  Opening it before claim confirmation is an inferred, reversible interaction.
- Query routes, search mechanics, persistence, modal Escape/focus restoration,
  error recovery and mobile stacking implement the visible UI without inventing
  backend policy. Treating ended events as closed to new enrollment is inferred.
- Figma repeats identical Poster cards and contains inconsistent snapshot counts.
  Four canonical Teacher events/enrollment data are retained. Dimas already has
  four enrollments; a newly registered Student demonstrates S06–S08 enrollment.
  Duplicate presentation cards were not turned into duplicate events.
- Existing fixtures retain their statuses/dates as a fictional snapshot rather
  than recalculating them against today's date. Teacher and Student details use
  the same current event instructions, rubrics, deadlines and grades even when
  different Figma snapshots contain conflicting copy or scores.
- Survey reflection is optional despite a contradictory “all required” header in
  S14. Counter and validation are truthful. No unconfirmed instrument/composite
  Technostress score or diagnostic interpretation is calculated.
- New Teacher-wizard events have no configured survey unless one is supplied by
  the owning module. After the first task, Student sees “Form belum disiapkan
  Guru.” The separate Survey Module is not faked or implemented here.
- Attachments store metadata only. Buka displays an explicit simulation; Unduh
  creates an actual `.demo.txt` sample, not a fabricated PDF upload. Historical
  fixture survey answers are not invented. Only new demo responses have a viewable
  response history. Storage is local to this tab, not encrypted server storage.
- Certificate revocation, enrollment caps, role provisioning and durable uploads
  remain unspecified/backend concerns. Client-only auth is demonstrative.

## File map

New routes: `src/app/siswa/{dashboard,events,workspace,survey,portfolio,profile}/page.tsx`
and `layout.tsx`. Shared auth changes are listed in `SHARED-AUTHENTICATION.md`.

New Student UI under `src/components/siswa/`:
`siswa-shell.tsx`, `siswa-ui.tsx`, `use-student-identity.ts`,
`student-dashboard.tsx`, `events/student-events.tsx`,
`workspace/{student-workspace,student-evidence}.tsx`, `survey/student-survey.tsx`,
`portfolio/student-portfolio.tsx`, `profile/student-profile.tsx`.

New domain files under `src/lib/siswa/`: `student-types.ts`, `student-actions.ts`,
`selectors.ts`, `serialization.ts`, `survey-questions.ts`, `design-assets.json`,
`design-navigation.json`. Local assets are under `public/siswa/design/`.

Necessary Teacher integration edits: `teacher-types.ts`, `event-draft-store.ts`,
`learning-selectors.ts`, `student-integration.ts`, `report-selectors.ts`,
`event-data.ts`; Dashboard, Event detail/counts, Student Management, Monitoring,
Reports and Work consume shared selectors. Teacher AvatarCrop is exported for
reuse with its existing behavior preserved. Login/logout changes do not clear
domain data. Prior Teacher work remains uncommitted and intact.

## QA and handover

ESLint, standalone `tsc --noEmit`, and production build (including TypeScript) passed. Edge/Playwright tests
use the existing cached browser tooling, without a dependency/configuration change.
Suites and screenshots are retained outside source under `%TEMP%`:

- `lugina-shared-auth-check.cjs`: 8 auth groups; both fixed roles, invalid password,
  S04, public Student-only registration, mock Google, refresh, logout, role guard,
  no plaintext password storage, responsive 1440/768/390/320.
- `lugina-siswa-check.cjs`: 13 integration/responsive groups; public enrollment,
  work draft/files/validation/submission, survey draft/confirmation/unlock/history,
  Teacher grading/feedback, revision, portfolio, certificate PDF, profile, frozen
  claim name, and 36 route/width CSS/overflow combinations.
- `lugina-siswa-edge.cjs`: 8 groups; visibility/remember, avatar crop, pending-grade
  certificate block, file type/size errors, Teacher-requested revision and new-version
  grading, immutable roles after profile edits, Google profile and mobile recovery.
- `lugina-teacher-shared-regression.cjs`: 21 existing Teacher end-to-end checks;
  wizard publish, shared rubric, assessment, feedback, reports, profile, delete/undo
  and deadline integration. Pending Dashboard assessments update 22 → 21.
- `lugina-shared-final-smoke.cjs`: 26 Teacher/auth route/CSS/asset/navigation checks.
- `lugina-shared-storage.cjs`: 2 corrupt/blocked session-storage cases; login
  remains usable, warnings are visible and refresh behavior reflects persistence.

Successful suites recorded no runtime errors or failed routes/assets; network
checks recorded only local GET requests, with no backend or credential transmission.
Rendered desktop/mobile screenshots were compared with the corresponding Figma
screens. Small intentional copy/data differences are documented above. This is a
responsive implementation, not a claim of pixel-identical output at every width.

Future backend integration should replace the session store adapter and mock
auth, preserve IDs/version history, enforce server authorization and validation,
and integrate real enrollment/upload/survey/assessment/certificate services.
Keep the shared selectors to avoid diverging Teacher/Student state.

Stop any running server before `npm run build`, then restart `npm run start` so
the browser cannot request stale CSS chunks. No git reset/revert/commit/push/merge
was run. Review the working tree on `feature/guru-frontend` before committing.
