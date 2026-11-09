# Phase 4A — Event Management

## Design source and inspection

The connected Figma MCP successfully accessed file `hWTpQwbyreDsivI3tZ0yLa`.
Only Page 1 (`0:1`), the Redesign Guru canvas group, and Lugina Design System
(`244:845`) were inspected. The four target frames are direct Page 1 children
at x=83648–88448, y=2100, within the Guru group between the Form Survei Guru
and Redesign Siswa labels. No Pencil, original Role Guru, Guru & Siswa, or
Student-role frames were accessed.

| Frame | ID | Review route |
| --- | --- | --- |
| Create Event — Daftar Event | `291:17842` | `/guru/events` |
| Create Event — Draft | `291:18128` | `/guru/events?tab=draft` |
| Konfirmasi Hapus Draf | `291:18301` | Draft tab → Hapus Draf |
| Detail Event | `291:18474` | `/guru/events?event=kantin` |

High-fidelity design contexts and screenshots were retrieved for all four
frames before coding. Plugin API reads inspected frame locations, components
and descendant prototype reactions. The target frames contain no component
instances. Inter typography, surfaces, spacing, button and badge patterns were
checked against the Lugina Design System; exact target-frame styling takes
precedence where its badge colors/control radii differ from the library.

Observed prototype connections:

- Create Event and Lanjutkan Draf target wizard `293:29139` (out of scope).
- Hapus Draf targets `291:18301`; Batal returns to Draft; confirmation returns
  to the published list. These flows work locally.
- The Kantin period text links to its detail frame. Each implemented Lihat
  Detail button opens the corresponding event instead of relying on that
  incidental text hotspot.
- The detail breadcrumb returns to the list. Filters, sorting and page context
  are preserved; browser Back also works.
- Monitoring and Ubah deadline have no prototype reactions in the inspected
  detail frame. Monitoring opens a phase-boundary message; Ubah deadline uses
  an explicitly local WIB date/time editor with required-field validation.
- Sidebar destinations for implemented modules work. Remaining destinations
  remain informational boundaries. A Pengaturan item and resume pencil appear
  only behind the delete dialog, as in that confirmation reference.
- Text/heading hotspots to wizard or later edit frames do not expand this
  phase's scope.

## Implemented frontend behavior

- Four unique published mock events and one mock draft.
- Case-insensitive title search, status filter, reference/alphabetical/latest
  updated sort, page-size selection (2/4/6), pagination, result counts and
  empty-result recovery. Query parameters are shareable and invalid values
  safely fall back or clamp to available pages.
- Draft search, resume boundary, accessible delete confirmation, cancel,
  Escape, keyboard focus loop and focus restoration. Confirmation removes
  only the local draft and returns to the published tab.
- Canonical Kantin detail: four milestones, instructions, formats, survey
  state, locked mode/rubric, certificate text and 34/80 (43%) progress.
- Per-milestone deadline edits remain isolated by event + milestone identity.
  Values are WIB wall times, independent of the browser's time zone. No
  date-order or enrollment business rules were invented.
- Other event details show known fixture metadata; missing instructions,
  deadlines, rubric and certificate configuration are explicitly unavailable.
- Existing Teacher shell, account menu, auth button, sidebar icons and design
  tokens are reused. Dashboard Create Event opens the list; Lanjutkan Draf
  opens the Draft tab. Login/Register and Student Management source is unchanged.
- Responsive card columns, stacked detail panels, wrapped controls and the
  existing mobile navigation drawer. Card metadata uses two columns below
  380px to avoid cramped values.

## Mock data model and limitations

`ManagedEvent`, `EventMilestone`, `EventEnrollment` and `EventFilters` are typed
separately from fixtures, selectors and React UI. Participant counts come from
event enrollment records with `eventId` + `studentId`; a student can join more
than one event. No school-class grouping determines participation. Known IDs
are shared with Student Management's partial sample; supplemental fictional
identities provide the reference counts (20/12/6/3). This does not add rows to
the earlier Student Management fixture.

The list reference has six cards, including three copies of the same UMKM
event, a Terbit (4) tab and a conflicting 1–4 of 8 footer. The implementation
uses four unique events already present on Dashboard, with truthful counts.
A compact sort control and page-size selector make those requested interactions
available; these controls are additions to the static reference. No extra
events were invented merely to fill its repeated cards.

All changes are in React memory and reset on full reload. Next.js may retain
module state during client navigation. Nothing is stored in browser storage,
sent to a server, or persisted in a database. Existing Dashboard has its own
local draft-deletion scenario; deletion is not synchronized between modules.
Dashboard's existing submission snapshot and the detail frame's 34/80 progress
remain separate Figma values. No real authentication, OAuth or APIs were added.

Create/resume wizard, event publication, full event editing, Monitoring, rubric
editing and other modules remain out of scope. The certificate condition is
display text from Figma; no grading/certificate logic is implemented. No mobile
Figma frames were supplied, so mobile behavior adapts the desktop references.

## Changed files

New route:

- `src/app/guru/events/page.tsx`

New modular UI:

- `src/components/guru/events/event-management.tsx`
- `src/components/guru/events/event-listing.tsx`
- `src/components/guru/events/event-card.tsx`
- `src/components/guru/events/event-detail.tsx`
- `src/components/guru/events/event-dialogs.tsx`
- `src/components/guru/events/event-ui.tsx`

New typed fixtures/selectors/asset map:

- `src/lib/guru/event-types.ts`
- `src/lib/guru/event-data.ts`
- `src/lib/guru/event-selectors.ts`
- `src/lib/guru/event-assets.ts`

Existing files changed only for integration:

- `src/components/guru/dashboard-shell.tsx` — Event link/active state,
  skip link, exact confirmation-frame sidebar variant.
- `src/components/guru/dashboard.tsx` — Create Event and draft-list navigation.

New exact Figma SVGs downloaded with curl:

- `public/guru/events/monitoring.svg`
- `public/guru/events/notice-lock.svg`
- `public/guru/events/summary-lock.svg`
- `public/guru/events/resume.svg`
- `public/guru/events/settings.svg`

Existing byte-identical SVGs are reused after SHA-256 comparison. Original root
dimensions, including the 20×20.13 privacy icon, are preserved. No temporary
Figma URLs are used at runtime. This document is the remaining new file.

## Verification

- `npm run lint` — passed without warnings.
- `npm run build` — passed; `/guru/events` included in production routes.
- Production browser interaction tests in Edge/Playwright: 94 assertions
  covering list controls, pagination boundaries, draft deletion/cancel/Escape,
  focus management, local deadline validation/save, detail navigation, wizard
  boundaries, query recovery, enrollment counts, Dashboard integration and CSS.
- Existing Phase 3 regression suite: 106 assertions passed, covering mock
  Login/Register, Dashboard, Student Management, notes/reviews, event membership,
  tables, responsive behavior and stylesheets.
- All four Event Management states checked at 1440, 1024, 768, 390 and 320px.
  No document overflow. All visible SVGs loaded from local files and retained
  their root dimensions. Desktop and mobile screenshots were visually reviewed
  against the four Figma references; duplicate/count inconsistencies and added
  utility controls are documented above.
- No runtime/hydration errors, failed HTTP responses, external browser requests,
  credential transmission, backend POSTs, cookies or browser storage writes.
- A single current production server runs at `http://localhost:3000`.
  Login/Register/Dashboard/Students/Events stylesheet requests all return CSS 200.

Temporary verification evidence (not project dependencies or committed files):

- `%TEMP%/lugina-phase4a-verification/results.json` and state screenshots.
- `%TEMP%/lugina-phase3-verification/results.json` and regression screenshots.

No package/configuration/global CSS changes. No commit, push or merge performed.
