// Exact downloaded Figma SVGs, deduplicated against existing assets by SHA-256.
export const eventAssets = {
  plus: { src: "/guru/dashboard/empty-plus.svg", width: 16, height: 16 },
  search: { src: "/guru/dashboard/full-search.svg", width: 16, height: 16 },
  chevron: { src: "/guru/dashboard/full-chevron.svg", width: 16, height: 16 },
  dashboard: {
    src: "/guru/dashboard/empty-dashboard.svg",
    width: 18,
    height: 18,
  },
  students: { src: "/guru/dashboard/full-students.svg", width: 18, height: 18 },
  create: { src: "/guru/dashboard/full-create.svg", width: 18, height: 18 },
  breadcrumb: {
    src: "/guru/students/detail-breadcrumb.svg",
    width: 12,
    height: 12,
  },
  monitoring: { src: "/guru/events/monitoring.svg", width: 16, height: 16 },
  "notice-lock": { src: "/guru/events/notice-lock.svg", width: 18, height: 18 },
  "summary-lock": {
    src: "/guru/events/summary-lock.svg",
    width: 12,
    height: 12,
  },
  edit: { src: "/guru/dashboard/full-draft.svg", width: 16, height: 16 },
  resume: { src: "/guru/events/resume.svg", width: 16, height: 16 },
  settings: { src: "/guru/events/settings.svg", width: 20, height: 20 },
} as const;
