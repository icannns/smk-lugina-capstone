# Phase 4B-1 — Informasi Event & Milestone

## Source and resumed work

The uncommitted implementation was inspected before resuming. Existing wizard
components, assets, typed drafts and navigation were retained. Completion work
focused on browser verification, formatting/link interactions, reliable checkbox
hit areas, storage recovery, date validation, per-draft UI state, mobile step
labels and untitled-draft display.

Connected Figma MCP access succeeded. Both exact design contexts and screenshots
were retrieved and the available prototype reactions inspected:

| Screen | Page 1 / Redesign Guru frame | Route |
| --- | --- | --- |
| Buat Event — Informasi | `293:29139` | `/guru/events/create` |
| Buat Event — Milestone | `291:19016` | Same draft URL with `&step=milestones` |

The frames are direct Page 1 (`0:1`) children at x=83648 and x=85248, y=4300,
under the Redesign Guru label, between Form Survei Guru and Redesign Siswa.
Both contain zero component instances. Supporting Lugina Design System
(`244:845`) typography/control tokens were inspected; exact frame styling
takes precedence. No original Role Guru, Guru & Siswa, Student-role, Pencil,
FOMO or COMMIT design was accessed for this implementation.

## Completed interactions

- Dashboard and Event Management Create Event buttons start a new editable
  fictional example matching the Figma content. Each new draft receives a
  stable unique ID. Direct access to `/guru/events/create` also initializes one.
- Informasi: editable title, two formatting editors (bold, italic, unordered/
  ordered lists and HTTP/HTTPS links), supporting attachment selection/drop/
  removal, event start/deadline in WIB, and the sole visible milestone mode.
- Required information fields validate before advancing. Empty/invalid dates
  and an event deadline before its start are rejected. Partial drafts can still
  be saved. No class, participant-selection or additional mode fields were added.
- Milestone: selection, add, edit, duplicate, remove, move up/down, instructions,
  multi-select submission formats, required deadline and optional attachments.
  Stable milestone identities preserve fields/attachments through duplication
  and ordering. First/last move buttons are disabled at their boundaries.
- Required milestone title, format selection and deadline validate across all
  milestones; the first invalid milestone is selected and its field focused.
  The final milestone can be removed and a new one added; no unsupported count
  limit was introduced.
- Previous/next, step controls and browser Back/Forward retain field values,
  formatting, ordering and selection. Validation/modal state is isolated by draft
  identity. Incomplete information cannot be bypassed through a milestone URL.
- Save Draft upserts the same `ManagedEvent` into the existing Draf tab, including
  title, milestone count, updated date and period. Untitled partial records show
  “Draf tanpa judul” without modifying their underlying blank title.
- Existing draft cards resume the wizard; saved and working state survive
  reload in the same tab. Delete confirmation removes a saved/working draft from
  the session, updates the list and prevents reopening the deleted URL.
- Sidebar/header/account menu and auth-derived primary button are reused.
  The primary button now accepts submit type while retaining button as default.
- Mobile layouts stack content and wrap controls. The stepper scrolls internally
  with keyboard focus support and non-overlapping labels; desktop proportions
  remain as in the source.

## Model and persistence

The existing `ManagedEvent` and `EventMilestone` types were extended with optional
information, WIB timestamps, attachment metadata and wizard position. No separate
incompatible event entity was introduced. The enrollment model remains event ID
plus student ID; school classes do not determine participation. Drafts create no
enrollments or future module associations before those flows are implemented.

`event-draft-store.ts` provides a shared `useSyncExternalStore` snapshot backed
by the namespaced sessionStorage key `lugina.teacher.event-drafts.v1`:

- Working changes persist within the tab, including after refresh.
- Explicit Save Draft controls which records appear in the event list.
- Repeated saves update an existing ID rather than creating duplicate cards.
- Storage is parsed defensively. Invalid saved dates are normalized to empty;
  stored editor HTML is restored through a small formatting allowlist.
- Corrupt/unavailable storage produces a visible warning and falls back to
  memory. Save feedback distinguishes persistent session state from memory only.
- No localStorage, cookies, credential storage, database, backend or API.

Attachments retain only name, size, type and ID. File bytes are never read,
uploaded or persisted. The Figma `brief-perpustakaan.pdf` is a clearly simulated
metadata example. Supporting attachments enforce the shown PDF/image/DOCX,
20 MB per file and five-file limits. The size check uses 20 MiB. The milestone
teacher-attachment field has no specified limits, so none were invented.

## Prototype ambiguities and remaining scope

- Informasi Lanjut targets Milestone (`291:19016`), and its back-arrow hotspot
  targets the event list (`291:17842`). Implemented with data retention.
- On Milestone, both its breadcrumb and Informasi Event step point to Informasi
  (`293:29139`) in the prototype. The implemented breadcrumb returns to Event
  Management consistently with the existing module; Kembali and the step control
  return to Informasi. This is the one navigation interpretation.
- Save Draft has no wired prototype destination. It stays in the wizard,
  reports success and offers a link to the Draf tab. Working autosave is separate
  from explicit list publication as a draft.
- Only Mode Penyelesaian is shown, initially with an unchecked radio. That
  visual state is retained; the existing event model still uses its sole mode.
  There is no alternate mode/dropdown or enrollment/class selector in these frames.
- Dates are blank in the references. Native datetime controls provide actual
  editing; their locale/chrome may differ from the empty Figma rectangles.
  Basic event start/deadline chronology is validated; no milestone-within-event,
  submission, review, grading or progression rules are enforced in this phase.
- The “10 MB / 3 berkas” note describes student submission formats. It is shown
  as reference text and is not applied as an invented teacher-attachment limit.
- Buat Survei → `260:5244`, Pilih Template → `259:3854`, and Lanjut ke Rubrik →
  `291:19328` remain out of scope. They open informative boundaries; survey state
  stays “Belum disiapkan”. Required survey associations are not fabricated.
- Rubrik, Sertifikat and Tinjau remain visibly disabled. No Selesai step is
  present in these two references; none was added. Nothing can be published or
  falsely completed. No rubric/certificate/survey implementation was added.
- Other milestone instructions/deadlines are not supplied by the reference.
  They remain blank for user input. Existing Absensi draft resumes only its
  known fixture data, without copying the library example into missing fields.
- Dashboard retains its existing example-draft banner and local delete/undo
  demonstration; it does not summarize newly created wizard drafts. A session
  deletion of its Absensi fixture through Event Management hides that banner.
- The formatting editor uses native browser editing commands. Verification
  covers Edge; no full third-party editor package or cross-browser editor
  compatibility guarantee is introduced.

## Verification

- `npm run lint`: passed without errors or warnings.
- `npm run build`: passed; `/guru/events/create` is in production output.
- Main production browser suite: 64 assertions passed, covering validation,
  navigation, milestone CRUD/order, formats, deadlines, attachments, saved draft
  upsert/resume/delete, boundary flows, query recovery and existing event controls.
- Additional browser suite: 23 assertions passed, covering formatting/link
  insertion, keyboard use, file size/count/drop, last-milestone recovery, corrupt
  and blocked storage, safe HTML restore, invalid stored dates, new-draft UI state,
  mobile step labels, untitled draft resume and published-event search/reset.
- Existing regression suite: 106 assertions passed, covering Login/Register,
  Dashboard, Student Management, notes/reviews, event membership and responsive
  table/navigation behavior. Event listing/detail controls also pass in the
  wizard suites. Login/Register/Students source files are unchanged.
- Both steps checked at 1440, 1024, 768, 390 and 320px. No document overflow.
  All visible SVGs load locally at their exact root dimensions. Desktop/mobile
  screenshots were visually reviewed against both exact Figma references.
  Information card: 1112×993px, matching source. Milestone card: 1112×847px
  versus source 1112×846px; content begins within a few pixels of source.
- No runtime/hydration errors, failed routes/assets, external browser requests,
  backend POSTs or credential transmission in the main suite. All existing
  route stylesheets return CSS HTTP 200, including Login.
- One current production server is available at `http://localhost:3000`.

Temporary verification evidence is outside the repository:

- `%TEMP%/lugina-phase4b1-verification/results.json`
- `%TEMP%/lugina-phase4b1-verification/edge-results.json`
- `%TEMP%/lugina-phase4b1-verification/*-1440.png`, `*-390.png`, `*-320.png`
- `%TEMP%/lugina-phase3-verification/results.json`

## File manifest

Existing files modified:

- `src/components/guru/dashboard-shell.tsx` — wizard skip-link target.
- `src/components/guru/dashboard-ui.tsx` — reusable submit button support.
- `src/components/guru/dashboard.tsx` — create/resume wizard navigation and
  awareness of session-deleted example draft.
- `src/components/guru/events/event-management.tsx` — shared session drafts,
  wizard entry/resume and integrated deletion.
- `src/components/guru/events/event-listing.tsx` — session-aware empty copy.
- `src/components/guru/events/event-card.tsx` — untitled partial-draft display.
- `src/components/guru/events/event-dialogs.tsx` — untitled confirmation display.
- `src/lib/guru/event-types.ts` — compatible optional wizard/attachment data.

New implementation files:

- `src/app/guru/events/create/page.tsx`
- `src/components/guru/events/wizard/event-wizard.tsx`
- `src/components/guru/events/wizard/information-step.tsx`
- `src/components/guru/events/wizard/milestone-step.tsx`
- `src/components/guru/events/wizard/attachment-picker.tsx`
- `src/components/guru/events/wizard/rich-text-editor.tsx`
- `src/components/guru/events/wizard/wizard-ui.tsx`
- `src/lib/guru/event-draft-store.ts`
- `src/lib/guru/event-wizard-data.ts`
- `src/lib/guru/event-wizard-validation.ts`
- `src/lib/guru/wizard-assets.ts`

New exact downloaded Figma SVGs in `public/guru/wizard/`:

- `back-info.svg`, `back.svg`, `breadcrumb.svg`, `checked.svg`, `chevron.svg`
- `completed.svg`, `create.svg`, `delete.svg`, `down.svg`, `duplicate.svg`
- `plus.svg`, `survey.svg`, `up.svg`, `upload-large.svg`, `upload.svg`

Byte-identical existing SVGs are reused by asset mapping. Static assets were
downloaded with curl; there are no temporary Figma URLs at runtime. This document
is the remaining new file. No dependency, configuration or global CSS changes.
No reset, revert, commit, push or merge was performed.
