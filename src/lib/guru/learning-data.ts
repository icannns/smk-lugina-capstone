import { students, studentEnrollments } from "./student-data";
import { eventEnrollments, managedEvents } from "./event-data";
import { initialRubrics } from "./rubric-data";
import type { TeacherSubmission, TeacherFeedback } from "./teacher-types";

// One fictional roster and enrollment graph, shared by monitoring, work and reports.
// Preserve existing student identities where older Figma snapshots use other surnames.
export const teacherStudents = [
  ...students,
  ...[
    "Hafiz Maulana",
    "Arif Hidayat",
    "Siti Nurhaliza",
    "Galih Prasetyo",
    "Melati Kusuma",
    "Reza Mahendra",
    "Yoga Aditya",
    "Tiara Andini",
  ].map((name, i) => ({
    id: `demo-${i + 1}`,
    name,
    email: `siswa.demo.${i + 1}@example.com`,
  })),
];
export const submissionId = (
  eventId: string,
  studentId: string,
  milestoneId: string,
) => `${eventId}:${studentId}:${milestoneId}`;
const uiux = initialRubrics.find((r) => r.id === "uiux")!;
const scores = (values: number[], rubric = uiux) =>
  Object.fromEntries(rubric.criteria.map((c, i) => [c.id, values[i] ?? 4]));
const prefix = [
  "Riset_Pengguna",
  "User_Flow_Wireframe",
  "Desain_UI_High_Fidelity",
  "Prototipe_Presentasi",
];
export const teacherSubmissions: TeacherSubmission[] = eventEnrollments.flatMap(
  (enrollment) => {
    const event = managedEvents.find((e) => e.id === enrollment.eventId)!;
    if (event.status === "upcoming") return [];
    const roster = eventEnrollments.filter((e) => e.eventId === event.id);
    const index = roster.findIndex((e) => e.id === enrollment.id);
    const count =
      event.id === "kantin"
        ? index === 19
          ? 0
          : [2, 3, 2, 1][index % 4]
        : event.id === "wireframe" && index === 11
          ? 2
          : event.milestones.length;
    const rubric = initialRubrics.find((r) => r.id === event.rubricId) ?? uiux;
    return event.milestones.slice(0, count).map((milestone, m) => {
      const survey = studentEnrollments
        .find(
          (e) => e.eventId === event.id && e.studentId === enrollment.studentId,
        )
        ?.milestones.find((x) => x.id === milestone.id);
      const first = teacherStudents
        .find((s) => s.id === enrollment.studentId)!
        .name.split(" ")[0];
      const revised =
        event.id === "kantin" && enrollment.studentId === "rizky" && m === 2;
      const reviewed =
        event.id === "kantin"
          ? (m === 0 && index % 4 !== 3 && enrollment.studentId !== "dimas") ||
            (m === 1 && index % 4 === 1)
          : !(event.id === "wireframe" && index === 10 && m === 2);
      const submittedAt =
        event.id === "kantin"
          ? revised
            ? "2025-04-01T20:05"
            : m === 0
              ? `2025-03-${String(10 + (index % 4)).padStart(2, "0")}T${String(15 + (index % 5)).padStart(2, "0")}:07`
              : `2025-03-${String(23 + (index % 5)).padStart(2, "0")}T${String(16 + (index % 5)).padStart(2, "0")}:15`
          : `2025-02-15T${["09", "11", "14"][m] ?? "14"}:${String(index * 2).padStart(2, "0")}`;
      const file = `${event.id === "kantin" ? prefix[m] : milestone.title.replaceAll(" ", "_") || `Milestone_${m + 1}`}_${first}${revised ? "_v2" : ""}.pdf`;
      const version = {
        version: revised ? 2 : 1,
        submittedAt,
        file,
        ...(reviewed
          ? {
              scores: scores(
                enrollment.studentId === "rizky" && m === 0
                  ? [5, 4, 4, 5]
                  : [4, 4, 4, 4],
                rubric,
              ),
            }
          : {}),
      };
      return {
        id: submissionId(event.id, enrollment.studentId, milestone.id),
        eventId: event.id,
        studentId: enrollment.studentId,
        milestoneId: milestone.id,
        versions: revised
          ? [
              {
                version: 1,
                submittedAt: "2025-03-30T19:20",
                file: "Desain_UI_High_Fidelity_Rizky.pdf",
                scores: scores([4, 3, 3, 4]),
              },
              version,
            ]
          : [version],
        surveyComplete: !(event.id === "kantin" && m === 1 && index % 4 === 2),
        surveyScore: Number(
          survey?.summary?.match(/\d\.\d/)?.[0] ??
            (enrollment.studentId === "dimas" ? "3.2" : "1.6"),
        ),
        surveySummary: survey?.summary,
        instrument: survey?.instrument,
        completion: survey?.completion,
        integration: survey?.integration,
        reflection:
          survey?.reflection ??
          (enrollment.studentId === "dimas"
            ? "Perlu mengatur file lebih rapi."
            : "Lancar, wawancara sangat membantu."),
        ...(m === 1
          ? { link: `https://www.figma.com/file/pa-${enrollment.studentId}-2` }
          : {}),
        ...(m === 0
          ? {
              note: "Mengumpulkan 4 dari 5 responden yang ditargetkan. Catatan temuan utama sudah disertakan.",
            }
          : {}),
      };
    });
  },
);
// Exact submission dates represented by the detail frames override table snapshot dates.
for (const [id, at] of [
  [submissionId("kantin", "aisyah", "M1"), "2025-03-12T19:40"],
  [submissionId("kantin", "aisyah", "M2"), "2025-03-26T20:15"],
  [submissionId("kantin", "rizky", "M1"), "2025-03-11T15:07"],
  [submissionId("kantin", "dimas", "M1"), "2025-03-12T16:14"],
  [submissionId("kantin", "dimas", "M2"), "2025-03-27T16:30"],
]) {
  const submission = teacherSubmissions.find((s) => s.id === id);
  if (submission) submission.versions.at(-1)!.submittedAt = at;
}
export const initialFeedback: Record<string, TeacherFeedback[]> = {
  [submissionId("kantin", "rizky", "M1")]: [
    {
      id: "feedback-rizky-1",
      message:
        "Bagus, temuan dan alasan desainnya jelas. Pertahankan dokumentasinya.",
      createdAt: "2025-03-11T16:00",
      revision: false,
      version: 1,
    },
  ],
  [submissionId("kantin", "dimas", "M1")]: [
    {
      id: "feedback-dimas-1",
      message:
        "Tambahkan kutipan langsung dari narasumber dan daftar pertanyaan.",
      createdAt: "2025-03-16T10:00",
      revision: true,
      deadline: "2025-04-05T23:59",
      version: 1,
    },
  ],
  [submissionId("kantin", "rizky", "M3")]: [
    {
      id: "feedback-rizky-3",
      message:
        "Ukuran tombol pemesanan terlalu kecil, perbesar minimal 44 px lalu unggah revisi.",
      createdAt: "2025-03-31T09:10",
      revision: true,
      version: 1,
    },
  ],
};

// Poster archive is the same event shown in the work and reporting references.
const posterRubric = initialRubrics.find((r) => r.id === "poster")!;
for (const submission of teacherSubmissions.filter(
  (s) => s.eventId === "poster",
)) {
  const latest = submission.versions.at(-1)!,
    first = submission.milestoneId === "M1";
  latest.submittedAt = `2025-01-${first ? "15" : "29"}T19:10`;
  latest.file = `${first ? "Konsep_Moodboard" : "Poster_Final"}_${teacherStudents.find((s) => s.id === submission.studentId)!.name.split(" ")[0]}.pdf`;
  if (submission.studentId === "dimas" && !first) delete latest.scores;
  else
    latest.scores = scores(
      submission.studentId === "rizky"
        ? first
          ? [2, 3]
          : [3, 3]
        : first
          ? [4, 5]
          : [5, 5],
      posterRubric,
    );
  initialFeedback[submission.id] = [
    {
      id: `feedback-${submission.id}`,
      message:
        "Bagus, temuan dan alasan desainnya jelas. Pertahankan dokumentasinya.",
      createdAt: latest.submittedAt,
      revision: false,
      version: 1,
    },
  ];
}
