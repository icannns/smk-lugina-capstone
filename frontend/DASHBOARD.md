# Phase 2 — Dashboard Guru

Source: Figma `hWTpQwbyreDsivI3tZ0yLa`, **Page 1 → Redesign Guru**.

- Populated dashboard: `291:16094` (1440 × 1876).
- Empty dashboard: `291:16304` (1440 × 1024).
- Lugina Design System: `244:845`.

Both dashboard frames are direct children of Page 1 beneath the Redesign Guru label, between Form Survei Guru and Redesign Siswa. No Guru & Siswa or original Role Guru frames were used. Exact screen styles take precedence where they differ from generic design-system defaults (solid blue progress, 12 px controls).

## Routes and mock interactions

`/guru/dashboard` shows the populated snapshot. `/guru/dashboard?state=empty` shows the empty reference. The account dropdown switches scenarios and links back to the existing `/login` route. Phase 1 Login and Register still navigate to the same dashboard route, without source changes.

- Status filters, case-insensitive title search, sorting by status/name/progress/date, result counts, no-results reset, and pagination work locally.
- Pagination accepts 2 or 4 events per page. The Figma footer says 12 events while the statistics and filters contain 4. This implementation consistently uses the four supplied events rather than inventing eight more. Page buttons and totals adapt to the actual result set.
- Deleting a mock draft requires confirmation, supports cancellation and undo, and affects browser component state only. Reloading restores the fixture.
- Account dropdown supports outside click and Escape. Mobile navigation uses a modal drawer with native focus containment and Escape handling.
- All links into future modules open a local phase-boundary dialog. No destination pages, assessment editors, survey flows, or backend functionality are implemented.

## Prototype interactions inspected before coding

The populated frame contains **25 nodes with prototype reactions**; the empty frame contains **14**. All inspected reactions are click-to-navigate with no transition.

| Visible action                                                       | Figma destination                              | Phase 2 behavior                                         |
| -------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Primary Create Event; resume draft; empty-state Create Event buttons | `293:29139`                                    | Informational dialog                                     |
| Delete draft                                                         | `291:18301`                                    | Local confirmation, deletion and undo                    |
| Event progress buttons; view all tasks; Monitoring Progres sidebar   | `291:21691`                                    | Informational dialog                                     |
| Six Periksa buttons                                                  | `291:23200`                                    | Informational dialog identifying the selected submission |
| Pengelolaan Data Siswa                                               | `291:16571`                                    | Informational dialog                                     |
| Create Event sidebar                                                 | `291:17842`                                    | Informational dialog                                     |
| Kelola Rubrik                                                        | `291:20520`                                    | Informational dialog                                     |
| Karya Siswa                                                          | `291:25994`                                    | Informational dialog                                     |
| Laporan Perkembangan                                                 | `291:26708`                                    | Informational dialog                                     |
| Dashboard Survei; Survei Saya; Template Survei; Hasil Survei         | `258:2316`; `260:4959`; `259:3854`; `262:6820` | Informational dialogs                                    |
| Profil                                                               | `291:28235`                                    | Informational dialog                                     |
| Empty-state Dashboard navigation                                     | `291:16094`                                    | Existing populated dashboard route                       |

The inspected frames do not wire reactions for filters, search, sort, pagination, account dropdown, privacy, support, or the 27-response summary. Their local feedback and interactions are frontend adaptations. No unsupplied destination design is presented as implemented.

## Components, assets and limitations

`src/lib/guru/dashboard-data.ts` contains the fixed Figma teacher, event, queue, timestamp and destination fixtures. UI lives in `src/components/guru/`. The existing `AuthButton` and shared typography/color tokens are reused; authentication forms are unchanged. The 32 SVG assets in `public/guru/dashboard/` were downloaded from the two exact frames, with populated/empty variants retained. No temporary asset URLs remain in runtime code.

The displayed date is the Figma sample snapshot, not the current date. Statistics contain 21 pending tasks, of which the six oldest are shown, plus the source summary of 27 survey responses. These are demonstration aggregates, not live records. There is no persistence, real session, account service, API request, grading, event creation or survey implementation. Direct dashboard access remains allowed by the Phase 1 mock setup.

Only desktop reference frames exist. Tablet/mobile stacking, wrapped cards and the navigation drawer are responsive adaptations. No changes to package versions, project configuration or authentication source files are required.

## Verification

Run `npm run lint` and `npm run build` in `frontend/`.

Browser verification covers authentication-to-dashboard navigation, populated/empty switching, all filters/sorts, search/reset, pagination, draft confirmation/cancel/delete/undo, phase-boundary dialogs, account menu, logout, responsive navigation and overflow. Compare populated at 1440 × 1876 and empty at 1440 × 1024, then inspect smaller widths. No backend or external navigation is expected.
