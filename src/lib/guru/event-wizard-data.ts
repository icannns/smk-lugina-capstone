import type { ManagedEvent, EventMilestone } from "./event-types";

export const wizardSteps = [
  "Informasi Event",
  "Milestone",
  "Rubrik",
  "Sertifikat",
  "Tinjau",
] as const;
export const submissionFormats = [
  "PDF",
  "Gambar",
  "DOCX",
  "Teks",
  "Hyperlink",
] as const;

export function newMilestone(): EventMilestone {
  return {
    id: crypto.randomUUID(),
    title: "",
    instructions: "",
    formats: "",
    deadline: "",
    attachments: [],
  };
}

// Fictional editable example shown in both exact Figma frames. Dates are blank
// in the source. The attachment is metadata, never an uploaded/embedded file.
export function newWizardEvent(): ManagedEvent {
  const milestones: EventMilestone[] = [
    {
      ...newMilestone(),
      title: "Riset Kebutuhan",
      instructions: "Wawancarai petugas perpustakaan.",
      formats: "PDF, Teks",
    },
    { ...newMilestone(), title: "Wireframe" },
    { ...newMilestone(), title: "Desain Final" },
  ];
  return {
    id: `draft-${crypto.randomUUID()}`,
    title: "Aplikasi Perpustakaan Digital",
    status: "draft",
    mode: "Penyelesaian",
    updated: localDate(),
    period: "Belum diatur",
    milestones,
    caseStudyHtml:
      "Perpustakaan sekolah ingin siswa bisa mencari dan meminjam buku lewat aplikasi. Tujuan: siswa mampu merancang UI yang mudah digunakan.",
    directionsHtml:
      "Kerjakan individu. Gunakan Figma. Sertakan sumber referensi.",
    startAt: "",
    endAt: "",
    attachments: [
      {
        id: "reference-brief",
        name: "brief-perpustakaan.pdf",
        size: 1200000,
        type: "application/pdf",
      },
    ],
    wizard: {
      step: "information",
      selectedMilestoneId: milestones[0].id,
      modeChosen: false,
    },
  };
}

export function localDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
