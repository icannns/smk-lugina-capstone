# Teacher Module — completion log

This is an incremental implementation history. Statements about absent Student
features, unchanged authentication and uncommitted work describe their original
phase. For the integrated release, start with [README.md](README.md) and
[INTEGRATION-HANDOVER.md](INTEGRATION-HANDOVER.md); the final shared-auth section
below supersedes the earlier Teacher-only scope. External Survey/privacy sidebar
menus are now visible disabled controls without placeholder modals.

Base: `34f738c`, branch `feature/guru-frontend`. Existing authentication,
Dashboard, Students, Events and Information/Milestone wizard are retained.

## Phase status

1. Rubrik & Sertifikat — complete; lint/build passed; 10 browser checkpoints,
   visual review and widths 320/390/768/1440 passed.
2. Review, publish & completion — complete; lint/build passed; 4 browser scenario
   checkpoints, responsive review/success screenshots and idempotent publishing.
3. Kelola Rubrik — complete; lint/build passed; 7 browser scenario checkpoints,
   all four screens responsive and visually reviewed; shared wizard selection.
4. Monitoring & assessment — complete; lint/TypeScript/build passed; eight browser
   scenario checkpoints covering all nine references and widths 320–1440.
5. Karya Siswa — complete; lint/TypeScript/build passed; four browser scenarios,
   gallery/list/detail, revision history, genuine prototype PDF download, responsive.
6. Laporan Perkembangan — complete; lint/TypeScript/build passed; four browser
   scenarios and three responsive screens. PDF and XLSX files generated; XLSX
   ZIP CRC and all five XML package documents validated.
7. Profil Guru — complete; lint/TypeScript/build passed; four browser scenarios,
   including local crop, validation, save/cancel, shared identity and responsive form.
8. Integration & end-to-end QA — complete. All 17 requested walkthrough steps,
   shared draft deletion/undo, deadline persistence and credential/network checks
   passed, including rubric renaming by ID (21 checkpoints). Seven module suites passed again (41 grouped
   scenarios), plus 106 legacy regression checks and two storage-fallback cases.

## Source and scope

Connected Figma file `hWTpQwbyreDsivI3tZ0yLa`, Page 1 (`0:1`), Redesign Guru,
between Form Survei Guru and Redesign Siswa. Exact target-frame contexts,
screenshots and prototype reactions are inspected per phase. Read-only Figma
access; no original Role Guru, Guru & Siswa, Student role or separate Survey
Module implementation. Design System `244:845` supports the exact frame styles.

## Shared data decisions

- Extend the existing `ManagedEvent` and session-backed `event-draft-store`.
- Rubric selection and rubric management share one criterion/score model.
- Certificate configuration is a learning-completion prototype, not official
  certification. Signer identity is fictional; no signature image is issued.
- Required Survey links remain informative external-module boundaries.
- Static SVGs are downloaded with curl, deduplicated by SHA-256 against existing
  assets and mapped in `design-assets.json` / `design-navigation.json`.
- No credentials, backend, database, external API, commit, push or merge.

## Confirmed / inferred / unspecified behavior

- Confirmed: Rubrik → Sertifikat → Tinjau; certificate tab switching.
- Confirmed rubric formula: total score divided by rubric maximum × 100;
  final value is an unweighted average of milestones.
- Inferred: editable template markers support pointer drag and keyboard arrows.
- Unspecified: file contents/signature authorization; uploads retain metadata
  only, with a visible prototype label. No institutional verification service.
- Review back-button prototype targets Milestone, not the adjacent certificate
  step. This confirmed destination is preserved; edit controls target each section.
- Survey statuses remain unprepared for new drafts, consistent with their
  milestone editor. Only the event is mock-published, without falsely claiming
  external surveys were created. No unsupported survey-readiness gate is added.
- Publishing preserves the draft event ID, removes its draft entry and upserts
  one published event. Repeated activation/refresh cannot duplicate it.
- Rubric-management visual rules override inconsistent prototype hotspots:
  assessed rubrics stay locked, and copying creates a new editable identity.
  Criterion deletion/reordering is supported; no global rubric delete control
  appears in the inspected list, so one is not invented.
- Scale is fixed 1–5 with five required score descriptions. All criteria are
  equally weighted. Rubric usage counts derive from actual shared event IDs;
  the database rubric therefore has zero known sample events rather than the
  unexplained “1 event” in the isolated reference.

## Implemented routes

| Route | Views |
| --- | --- |
| `/guru/events/create?draft=ID&step=…` | information, milestones, rubric, certificate, review, done |
| `/guru/rubrics` | list; `mode=create/view/edit/copy&rubric=ID`; optional `from=DRAFT_ID` returns to wizard |
| `/guru/monitoring?event=ID` | participant table; `student=ID&milestone=ID` opens assessment |
| `/guru/work` | event archive; `event=ID` participant list; `student=ID` read-only timeline |
| `/guru/reports` | initial filters; `event=ID` plus survey/student/work/assessment/milestone filters |
| `/guru/profile` | local demo profile and avatar crop |

Existing `/login`, `/register`, `/register/google`, `/guru/dashboard`,
`/guru/students` and `/guru/events` remain available.

## Canonical mock state and integration

`event-draft-store.ts` remains the only persistent Teacher domain store. Its
existing `lugina.teacher.event-drafts.v1` session key is extended compatibly with
`rubrics`, `published`, versioned `learning.assessments`, `learning.feedback`
and `profile`. Old sessions receive defaults. Invalid/unavailable storage shows
an explicit warning and supports in-memory use. Closing the browser session
may discard changes; this is intentionally not a database.

`learning-data.ts` shares the existing student identities and event enrollments,
then supplements the partial sample with fictional identities. There are 20
Kantin, 12 Workshop, 6 Poster and 3 UMKM enrollments. No class membership is used
as enrollment. Submission IDs combine event/student/milestone IDs; assessment
keys include the submission version. `learning-selectors.ts` computes progress,
assessment status, scores and totals for Dashboard, Monitoring, Karya and reports.
`student-integration.ts` also adapts that enrollment graph to the existing Student
Management components, retaining the original survey summaries as reference data.

Publication upserts one event with the original draft ID. New events have zero
enrollments until a future Student/enrollment service supplies participants. The
walkthrough assesses an existing enrolled fictional student; it does not fabricate
participants in a new event. Dashboard, event list, directory and reporting can
all consume the new event. Rubric names resolve from rubric IDs, including edits.

Dashboard draft deletion/undo shares the event store. Event detail deadline edits
persist in that store and appear in Monitoring after navigation and refresh.
Profile display identity is shared by the header, Dashboard and teacher feedback.
Round 2 persists private survey-review notes and enrollment review markers in the
same `lugina.teacher.event-drafts.v1` session store. Navigation and refresh retain
them. Review snapshots cover the responses visible when marked; a new response
requires review again. Storage failure shows a warning and does not claim a
successful persistent note save. These are distinct from rubric assessment.

## Additional confirmed and inferred rules

- Confirmed: 1–5 criterion choices; normalized 0–100 result; prior revision versions
  retain historical scores. Displayed percentages use integer rounding consistently.
- Confirmed: missing submissions cannot be assessed. The graded, ungraded, filled,
  missing, revision-requested, survey-incomplete and revised states are available
  through their actual student/event/milestone context.
- Confirmed D02 hint: requesting revision after the deadline requires a revision
  deadline. A supplied revision deadline must be a valid future WIB date/time.
- Inferred: “Siswa berikutnya” advances within the same event/milestone; some
  prototype hotspots return to the overview or another student's example. Saving
  an assessment preserves the selected identity rather than jumping to Rizky.
- A new revision is not automatically assessed. Old scores remain visible in
  history and do not count as the latest final score. Work completion and teacher
  assessment remain distinct; early submission does not produce a final grade or
  certificate preview before all required assessments are complete.
- Inferred: report filters apply when Tampilkan is pressed, and Reset clears the
  report. The “Detail Lengkap” frame is the expanded Kantin report context; its
  mismatched Poster selector label is corrected to the actual selected event.
- No milestone unlocking, institutional approval, weighted scoring or additional
  enrollment policies are invented. Separate survey interactions remain informative.

## Figma fidelity and deliberate differences

Read-only MCP inspection covered every requested frame, including prototype
reactions. Sparse Monitoring and detailed Report contexts were drilled into child
panels before implementation. Page 1 parent IDs and Redesign Guru coordinates were
verified. All source screenshots were reviewed against browser captures. Existing
Lugina branding, sidebar/header, Inter typography, tokens, card spacing, form
controls and semantic colors are reused. Fifty-three additional byte-distinct
SVGs are served locally; asset maps also reuse existing icons.

Source snapshots conflict on some surnames, submission dates, assessment counts
and Poster assessment readiness. Existing student IDs/names are preserved, exact
detail dates take priority, and statistics derive from one current dataset. Thus
initial Poster reports show five graded students and average 87; after grading
Dimas's second milestone 100, six students are graded and the average becomes 88.
Kantin has 39 submitted tasks, 34 with survey completion, and 43% learning progress.
These are documented data differences, not hardcoded contradictory statistics.

The profile uses `@example.com` and a fictional phone value. Its Google text
explicitly describes simulation. Certificate previews use fictional signer text,
no institutional signature/serial/verification, and a visible prototype notice.
Responsive layouts adapt at 320/390/768/1440 px; no automated pixel-diff score is
claimed. Native date/select widgets can differ by browser.

## Export and asset limitations

- Uploaded wizard attachments/templates/signature images retain metadata only.
  The template canvas demonstrates marker placement, not rendering an uploaded
  PDF or issuing a signed certificate.
- Submission Buka is an explicit fictional preview. Unduh generates a real
  `.demo.txt` sample, not an invented student PDF.
- Certificate PDF is a valid watermarked prototype learning-completion document.
  It is not recognized professional certification and is never officially issued.
- Report PDF contains a compact summary; XLSX includes the full filtered table.
  Both are generated locally. PDF was parsed using pypdf; XLSX ZIP CRC and all XML
  package documents were validated. No fake export success messages are used.
- No backend/API, real OAuth, password change, external account management,
  separate Survey Module, Student role, FOMO or COMMIT is implemented.

## QA evidence and review

Each implementation phase ran `npm run lint` and `npm run build`; production
build includes TypeScript checking. Headless Microsoft Edge/Playwright exercised
navigation, validation, persistence, dialogs, scoring, filters, downloads and
responsive layouts. The legacy regression suite was updated only where the now
canonical Kantin roster replaces its earlier one-student partial sample.

Browser requests remained local GETs: no external calls, backend POSTs, cookies,
password transmission, password persistence or localStorage. Final smoke testing
covered 24 route/view combinations with HTTP 200 CSS and valid visible images,
plus Survey boundary and mobile sidebar navigation (26 checks). It recorded zero
page/console errors and failed requests. All phase suites also recorded zero
failed assets/routes and runtime errors. Corrupt and blocked storage cases
also recorded zero page/console errors. Shared-state walkthrough changed Dashboard
pending assessment count from 22 to 21 and updated Karya and reports immediately.
The final lint and production build, including TypeScript checking, passed again
after the integration fixes. No project setup, dependency or global CSS changed.

Local screenshots/results and reproducible browser scripts are retained outside
source under `%TEMP%/lugina-teacher-qa` and `%TEMP%/lugina-teacher-*.cjs`.
Existing-page regression artifacts are `%TEMP%/lugina-phase3-verification`.
These scripts use the machine's cached Playwright and Edge; no project dependency
or test configuration was added. Inspect these reports alongside the Figma frames.

Future API integration should replace the store's fixture/persistence adapters,
retain stable event/enrollment/submission-version IDs, enforce server-side
authorization and validation, and supply actual upload, survey, enrollment,
assessment-history, certificate authorization and durable report export services.
Keep the shared selectors and modular UI, rather than introducing parallel stores.

## Changed-file manifest

New route files:
`src/app/guru/{rubrics,monitoring,work,reports,profile}/page.tsx`.

New UI files:
- `src/components/guru/design-ui.tsx`, `learning-ui.tsx`, `teacher-page.tsx`.
- `src/components/guru/events/wizard/{rubric-step,certificate-step,review-step,event-complete}.tsx`.
- `src/components/guru/rubrics/rubric-management.tsx`.
- `src/components/guru/monitoring/{monitoring,submission-assessment}.tsx`.
- `src/components/guru/work/student-work.tsx`.
- `src/components/guru/reports/progress-reports.tsx`.
- `src/components/guru/profile/teacher-profile.tsx`.

New shared files under `src/lib/guru/`:
`teacher-types.ts`, `rubric-data.ts`, `learning-data.ts`, `learning-selectors.ts`,
`report-selectors.ts`, `profile-data.ts`, `student-integration.ts`, `guru-routes.ts`,
`client-export.ts`, `design-assets.json`, `design-navigation.json`.

Modified existing UI:
- `src/components/guru/{dashboard-shell,dashboard,event-list,review-queue}.tsx`.
- `src/components/guru/events/{event-management,event-detail,event-dialogs}.tsx`.
- `src/components/guru/events/wizard/{event-wizard,milestone-step}.tsx`.
- `src/components/guru/students/{student-management,student-table}.tsx`.

Modified existing shared files under `src/lib/guru/`:
`dashboard-data.ts`, `event-data.ts`, `event-types.ts`, `event-draft-store.ts`,
`event-wizard-validation.ts`, `student-selectors.ts`.

Assets: 53 files in `public/guru/design/`; mappings list exact local paths.
Documentation: this new `TEACHER-MODULE.md`. Existing phase docs are preserved.
Login/Register sources, global CSS, dependencies and project configuration are
unchanged. Work stays uncommitted on `feature/guru-frontend`, base `34f738c`.

## Running and review

From `frontend`, use the existing npm scripts. Stop any server before rebuilding
`.next`, then restart it with `npm run start` to avoid stale stylesheet URLs.
Demo sign-in: `guru@example.com` / `DemoGuru123!`. No credentials are transmitted.

Implementation is complete and ready for review. No commit, push or merge was run.

## Safe continuation

Read this log and Git status before continuing. Do not reset or overwrite the
existing components. Stop the production server before rebuilding `.next` and
restart the current build afterward to avoid stale stylesheet URLs.

## Shared authentication correction and Student integration

The later shared-auth request supersedes the historical statements above that
Login/Register were unchanged. Both roles now use the Guru & Siswa → Redesign
Siswa S01–S04 authentication flow, with fixed account roles and client-only route
guards. See `SHARED-AUTHENTICATION.md` for demo accounts and limitations.

Teacher functionality is preserved. The same domain store now accepts Student
profiles, enrollments, versioned work, survey completion and prototype claims.
Teacher views merge those overrides through shared selectors, keeping Monitoring,
Dashboard, Student Management, Work and Reports consistent. Workshop certificate
threshold 70 follows its Student project frame and is shared with Teacher views.
The reusable Teacher avatar crop is exported without changing its behavior.
See `STUDENT-MODULE.md` for the precise source map, integration files and final QA.
