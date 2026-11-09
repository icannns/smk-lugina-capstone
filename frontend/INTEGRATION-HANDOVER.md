# Integrated frontend handover

The Next.js application lives in `frontend/`. Follow [README.md](README.md) for
installation, demo accounts and commands. This is an accepted local fictional-data
prototype with explicit boundaries, not a production service.

## Existing route and component contracts

| Area | Entry points |
| --- | --- |
| Shared auth | `/login`, `/register`, `/register/google`, `/loading`; `src/lib/auth/{accounts,session,validation}.ts`, `src/components/auth/role-gate.tsx` |
| Teacher | `/guru/dashboard`, `/guru/students`, `/guru/events`, `/guru/events/create`, `/guru/rubrics`, `/guru/monitoring`, `/guru/work`, `/guru/reports`, `/guru/profile` |
| Student | `/siswa/events`, `/siswa/dashboard`, `/siswa/workspace`, `/siswa/survey`, `/siswa/portfolio`, `/siswa/profile` |
| Shared domain | `src/lib/guru/event-draft-store.ts`, `event-types.ts`, `teacher-types.ts`, `learning-selectors.ts`, `report-selectors.ts`, `student-integration.ts` |
| Student adapters | `src/lib/siswa/{student-types,student-actions,selectors,serialization,survey-questions}.ts` |
| Shared presentation | `src/components/guru/`, `src/components/siswa/`, `src/app/globals.css`; local asset maps under `src/lib/{guru,siswa}/` |

Monitoring deep links use `?event=ID&student=ID&milestone=ID`. The reviewed
`/guru/monitoring?event=kantin&student=nabila&milestone=M4` is an actual assessment
context, not a separate route file. Query parameters select the event enrollment
and milestone; unavailable data must remain a truthful missing state.

## One domain store, stable identities

- `lugina.teacher.event-drafts.v1` in sessionStorage holds compatible drafts,
  published events, rubrics, learning, profiles, Student drafts/responses/claims
  and Teacher notes/reviews. Extend its adapter/types rather than creating a
  competing event or assessment database.
- Event enrollment is **event ID + student ID**, not class membership. Submission
  context includes event/student/milestone; assessments refer to a submission
  version. Display labels such as M1 are separate from internal UUIDs.
- Revision preserves older evidence/grades. A later version needs a new grade;
  old assessments do not silently count as current. Task submission, task-and-survey
  completion, current grading and certificate eligibility are distinct.
- Survey response timestamps are distinct from work submission timestamps.
  Dashboard, Monitoring, Work and Reports consume common selectors.
- Auth uses the separate `lugina.auth.demo.v1` key. Fixed account roles are
  `teacher | student`; public registration and mock Google create/select Students.
  Editable profile labels must never become authorization rules.

## Reproducible prototype demonstration

Use one browser tab and fictional data. Log in as Teacher; create a one-milestone
event with rubric/certificate settings and publish once. Log out, sign in as Dimas,
discover the new event and enroll. Save/refresh a work draft and submit it. Switch
back to Teacher, inspect that exact submission, grade and send feedback; check
Reports. Switch to Dimas and inspect the same grade/feedback in Portfolio. Request
revision as Teacher, submit a new version as Dimas and reassess as Teacher.

New events have no Survey instrument until the owning team configures one. Their
tasks may be assessed while completion remains pending. Use existing configured
fixtures for the full survey/unlock/example-certificate demonstration. Do not
fabricate survey completion merely to unlock later stages.

## COMMIT team's Streamlit migration

1. Add agreed App Router routes within this project; reuse existing identity,
   tokens and shells where appropriate. Do not add another React router or reset
   global CSS. Coordinate edits to layouts, role gates, auth and shared store/types.
2. Replace Streamlit rerun mechanics with React event handlers/local state for
   transient UI; use shared typed adapters for cross-page records. Browser APIs
   belong in Client Components. Preserve App Router server/client boundaries.
3. Agree record ownership and versioned API contracts before integration: users,
   events, enrollments, milestones, rubrics, submissions/versions, assessments and
   Survey instruments/responses/reviews. Keep stable IDs and explicit WIB/time
   conversion. Do not infer enrollment from school classes.
4. Reuse the Teacher role if applicable. A new role requires explicit changes to
   the typed account/home/guard contract, which currently supports only two roles.
5. Replace mock persistence/auth through adapters when backend services exist.
   Add real server authorization, durable uploads, shared state/concurrency and
   approved certificate policy. sessionStorage is not a database or security layer.
6. Run lint, TypeScript, build, regression suites and the same-tab cross-role smoke
   test after integration. Also test genuinely separate users once APIs exist.

## Navigation and accepted limits

Teacher Dashboard Survei, Survei Saya, Template Survei, Hasil Survei and Kebijakan
Privasi, plus Student Pengaturan, remain visible native disabled buttons. Pointer
and keyboard cannot activate them; they do not open placeholder modals. Student
milestone Survey instructions/forms/confirmation remain functional. Support and
other unrelated informational actions retain their original behavior.

Mock changes are tab-local; a new tab may initially copy session state but does not
receive later updates. Separate browsers/devices do not synchronize. Attachments
store metadata only; previews/sample downloads are labelled simulations. Reports
generate real PDF/XLSX files; example certificate PDFs are unofficial learning
documents without institutional signature, recognition or external verification.

B01–B10 and structural visual findings V01–V03 were fixed and independently
verified. B11 remains a moderate development-only minimatch advisory chain; do not
force a major dependency override. V04 includes minor spacing/native-control visual
differences. Full screen-reader, cross-browser and pixel-perfect certification
remain outside the verified scope. No Critical/High application issue was confirmed
in the accepted prototype scenarios.

## Publication verification — 9 November 2026

Fresh release checks passed: ESLint, standalone TypeScript, production build,
9 logic regressions, 8 browser defect groups, 8 shared-auth groups, 21 Teacher
walkthrough checks, 7 Teacher control groups, 13 Student groups, 8 Student edge
groups, 9 cross-role checkpoints, 7 independent defect probes and 2 storage cases.
The 42-state route matrix at 320/768/1440 px and 27 wizard/dialog layouts had no
document overflow, broken visible assets or runtime errors. Sidebar checks covered
18 disabled-item cases and 36 functional navigations, plus actual Student Survey
validation/draft/confirmation/submission. A 40-participant PDF rendered across two
pages within page bounds; XLSX CRC/XML and all 43 rows validated. A dependency-
complete export from the proposed Git index also built independently using a
temporary physical copy of the already installed dependencies, without installing
or upgrading packages. Local QA evidence remains outside the repository.

Monitoring Nabila M4 passed direct and client navigation in both production and
development. Development still emits `instant-unrendered-segment`: the validator
cannot validate the segment; authenticated UI nevertheless renders correctly.
The client-only RoleGate renders a loading screen before browser auth is ready,
which is consistent with the diagnostic's omitted validation segment; this is an
explanation from source inspection, not a proven framework root-cause fix. No
`instant = false`, warning suppression or configuration change was introduced.
An existing development-only privacy-icon sizing warning also remains; production
route/CSS checks pass. Neither diagnostic blocked the exercised flow. Instant-
navigation performance certification remains incomplete.

The fresh full npm audit reports 8 moderate affected development packages in the
accepted B11 chain; the production-only audit reports zero. Registry checks do not
replace a production security review. The temporary legacy Student edge runner's
old Settings-modal expectation was updated to assert disabled Settings, matching
the final publication instructions. No application defect was hidden by that test
adaptation.

## Documentation retained for the shared repository

| Class | Files | Decision |
| --- | --- | --- |
| A — essential | Root `README.md`; frontend `README.md`, `AGENTS.md`, `TEACHER-MODULE.md`, `STUDENT-MODULE.md`, `SHARED-AUTHENTICATION.md`, this handover | Retain; README now describes integrated behavior; phase history is labelled |
| B — useful QA | `tests/README.md` and its two regression runners | Include reproducible tests without local browser dependencies/evidence |
| B — historical phase reference | `DASHBOARD.md`, `STUDENT-MANAGEMENT.md`, `EVENT-MANAGEMENT.md`, `EVENT-WIZARD.md` | Already tracked; preserve unchanged; their earlier scope is historical |
| C — local historical audit evidence | `FINAL-AUDIT-ROUND-1.md`, `FINAL-AUDIT-ROUND-2.md`, `FINAL-VERIFICATION.md` | Preserve on disk, intentionally exclude from new commits: long overlapping machine-specific reports; current handover summarizes actionable limits |

Generated directories, environment files, machine-specific browser paths, QA
screenshots/logs/downloads and temporary indexes are not repository deliverables.
No Markdown was deleted. The intentionally untracked local reports can remain
visible in Git status after publication.
