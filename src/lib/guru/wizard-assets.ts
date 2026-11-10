import { eventAssets } from "./event-assets";

export const wizardAssets = {
  ...eventAssets,
  "info-upload": {
    src: "/guru/wizard/upload-large.svg",
    width: 20,
    height: 20,
  },
  file: { src: "/guru/students/detail-response.svg", width: 16, height: 16 },
  remove: { src: "/guru/students/filtered-reset.svg", width: 16, height: 16 },
  "info-back": {
    src: "/guru/wizard/back-info.svg",
    width: 5.26667,
    height: 9.26667,
  },
  breadcrumb: { src: "/guru/wizard/breadcrumb.svg", width: 12, height: 12 },
  completed: { src: "/guru/wizard/completed.svg", width: 12, height: 12 },
  up: { src: "/guru/wizard/up.svg", width: 12, height: 12 },
  down: { src: "/guru/wizard/down.svg", width: 12, height: 12 },
  plus: { src: "/guru/wizard/plus.svg", width: 16, height: 16 },
  survey: { src: "/guru/wizard/survey.svg", width: 14, height: 14 },
  duplicate: { src: "/guru/wizard/duplicate.svg", width: 16, height: 16 },
  delete: { src: "/guru/wizard/delete.svg", width: 16, height: 16 },
  checked: { src: "/guru/wizard/checked.svg", width: 11, height: 11 },
  upload: { src: "/guru/wizard/upload.svg", width: 16, height: 16 },
  back: { src: "/guru/wizard/back.svg", width: 16, height: 16 },
  chevron: { src: "/guru/wizard/chevron.svg", width: 16, height: 16 },
  create: { src: "/guru/wizard/create.svg", width: 18, height: 18 },
} as const;
