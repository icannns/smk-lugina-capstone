# Phase 3 — Pengelolaan Data Siswa

## Source and scope

Figma file `hWTpQwbyreDsivI3tZ0yLa`, **Page 1 → Redesign Guru**, between the Form Survei Guru and Redesign Siswa canvas labels. Only these four target frames were inspected for this phase:

| State                  | Frame       | Local URL                                     |
| ---------------------- | ----------- | --------------------------------------------- |
| Choose an event        | `291:16571` | `/guru/students`                              |
| Workshop records       | `291:16703` | `/guru/students?event=wireframe`              |
| Workshop M1            | `291:17019` | `/guru/students?event=wireframe&milestone=M1` |
| Aisyah's Kantin detail | `291:17339` | `/guru/students?event=kantin&student=aisyah`  |

The existing Figma branding and shell are preserved. No Student-role, FOMO, COMMIT, backend, database, OAuth or API functionality is added. Survey labels and score summaries are read-only fixture text from the Teacher detail reference. No scores, categories, eligibility, or clinical interpretation are calculated.

## Prototype inspection

The exact frames contain respectively **13, 15, 13 and 13 nodes with click reactions**. Counts include nested Select/Dropdown reactions and sidebar links.

- Initial event selector navigates to Workshop (`291:16703`).
- Workshop milestone selector navigates to Filter M1 (`291:17019`). A student-name cell navigates to Detail (`291:17339`).
- The M1 frame also wires its milestone selector directly to the detail frame. The implementation keeps the selector as a filter and exposes details through the name and Lihat Detail links.
- Detail breadcrumb navigates to the initial student page (`291:16571`). Browser Back retains the filtered table URL.
- Dashboard and student-management sidebar links navigate to implemented routes. Other sidebar destinations retain the existing local information dialogs.
- Search, pagination, Reset Filter, note saving, review marking and Detail Respons do not have wired prototype reactions in the supplied frames. Their frontend behavior follows the visible controls; no additional destination module is implemented.

The Workshop prototype links to a detail specimen labeled as the Kantin event. To avoid displaying the wrong enrollment, each table link carries its selected event and student. The Kantin specimen remains directly accessible at its URL above for design comparison. Workshop details reuse the same visual component with Workshop fixture values.

## Mock data and interactions

- `student-types.ts`: typed students, events, enrollments, milestone summaries, table records, filters and session state.
- `student-data.ts`: 12 fictional Workshop participants with 35 submitted milestone records (one last milestone is unfilled), reproducing the first eight table rows and the M1 first page. The extra names needed for later pages are fictional fixtures. The Kantin fixture contains Aisyah with two submitted and two unfilled summaries, matching the detail reference. All email addresses use `example.com`.
- `student-selectors.ts`: pure filtering and URL helpers. Event membership is explicit; records from another event are never mixed in. Progress is an independent fixture value, not inferred from survey scores or form submission.
- Eight records are displayed per page. Counts, first/last-page controls, combined name/milestone/review filters, case-insensitive search, reset and empty results operate on the actual fixture records.
- The reference's unlabeled “Semua” selector is implemented as a review-status filter, using the visible “Sudah ditinjau” / “Belum ditinjau” states. These option labels are a frontend adaptation, not a claim about unspecified backend rules.
- Filters use the Next.js-supported native History API. URLs support refresh/deep links; student links preserve current filters and page for Browser Back.
- Teacher notes and review flags are held in memory per student/event while this module remains mounted. Notes require an explicit save. Already-reviewed entries disable the review button as in the reference. No permission, score, note-required, or progression gates are introduced. Reloading or leaving the module clears local changes.
- Lihat Detail Respons displays an informational dialog; it does not implement a survey-response page.

## Reuse, assets and responsive behavior

The existing DashboardShell and DashboardIcon accept optional active-page/icon overrides; Dashboard defaults remain unchanged. The sidebar's student item now links to `/guru/students`. The existing header, account menu, mobile drawer, shared buttons and information dialog are reused. Login/Register, Dashboard content, global CSS, package versions and project configuration are untouched.

SVG assets were downloaded from the exact four frames, with existing assets reused only after SHA-256 equality checks. The initial Dashboard icon was retrieved again from its exact descendant node `336:7168` because the frame-level export was blank. New local assets live in `public/guru/students/`; there are no temporary asset URLs in runtime code.

Desktop references are 1440×1024 for the three list states and 1440×1385 for detail. At smaller widths, filters wrap and the table scrolls horizontally within its own keyboard-focusable region; detail columns stack. The original frames do not specify mobile layouts.

## Verification

Run `npm run lint` and `npm run build` from `frontend/`. Browser checks cover event membership, all filter combinations, pagination boundaries, row/detail identity, browser history, direct URLs, note saving/isolation, review state, invalid parameters, mobile scrolling/navigation, local asset/CSS loading, and Login/Dashboard regressions.

Use a single current server on `http://localhost:3000`. Stop the running server before rebuilding its output, then restart it; an old `next start` process must not continue serving stale build asset names. For local editing use `npm run dev`.
