"use client";
import Link from "next/link";
import type { ManagedEvent } from "@/lib/guru/event-types";
import type { TeacherSubmission } from "@/lib/guru/teacher-types";
import { useEventDraftStore } from "@/lib/guru/event-draft-store";
import {
  assessmentFor,
  feedbackFor,
  rubricScore,
  submissionStatus,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { workHref } from "@/lib/siswa/selectors";
import { Surface } from "../../guru/design-ui";
import { SiswaIcon } from "../siswa-shell";
import { StudentEvidence } from "../workspace/student-evidence";

export function MilestoneWorkCard({
  event,
  index,
  submission,
}: {
  event: ManagedEvent;
  index: number;
  submission?: TeacherSubmission;
}) {
  const state = useEventDraftStore(),
    milestone = event.milestones[index],
    latest = submission?.versions.at(-1),
    feedback = submission ? feedbackFor(submission.id, state.learning) : [],
    status = submissionStatus(submission, state.learning),
    score =
      submission && status === "reviewed"
        ? rubricScore(
            assessmentFor(submission, state.learning),
            state.rubrics[event.rubricId ?? ""],
          )
        : null;
  return (
    <Surface className="milestone-work-card !p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs leading-4 text-secondary">
            Milestone {index + 1}
          </p>
          <h2 className="text-base font-semibold leading-6">
            {milestone.title}
          </h2>
          {milestone.instructions && (
            <p className="mt-1 text-sm leading-5 text-secondary">
              {milestone.instructions}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs leading-4 text-secondary">Nilai</p>
          <p
            className={`text-sm leading-5 ${score ? "font-semibold" : "text-secondary"}`}
          >
            {score?.percent ?? "Belum dinilai"}
          </p>
        </div>
      </header>
      {submission && latest ? (
        <>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <section
              className="min-w-0"
              aria-label={`Bukti karya milestone ${index + 1}`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                Bukti karya{" "}
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[#1447e6]">
                  <SiswaIcon frame="370:4068" name="imgIcon3" />
                  Versi {latest.version} · terbaru
                </span>
              </div>
              <StudentEvidence
                compact
                submission={submission}
                version={latest}
              />
              <p className="mt-2 text-xs leading-4 text-secondary">
                Dikirim {formatEventDate(latest.submittedAt, true)}
              </p>
            </section>
            <section
              className="min-w-0"
              aria-label={`Feedback Guru milestone ${index + 1}`}
            >
              <h3 className="mb-2 text-xs leading-4 text-secondary">
                Feedback Guru
              </h3>
              {feedback.length ? (
                <div className="space-y-2">
                  {feedback.map((f) => (
                    <div
                      key={f.id}
                      className={`rounded-xl p-4 ${f.revision ? "bg-red-50/60" : "bg-gray-50"}`}
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-medium">
                          {state.profile.name}
                        </span>
                        <span className="text-xs text-secondary">
                          {formatEventDate(f.createdAt, true)} · Versi{" "}
                          {f.version}
                        </span>
                        {f.revision && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                            <SiswaIcon frame="370:4068" name="imgIcon8" />
                            Revisi diminta
                          </span>
                        )}
                      </div>
                      {f.deadline && (
                        <p className="mt-2 text-xs text-red-700">
                          Batas revisi {formatEventDate(f.deadline, true)}
                        </p>
                      )}
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5">
                        {f.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-5 text-secondary">
                  Belum ada Feedback Guru untuk milestone ini.
                </p>
              )}
            </section>
          </div>
          <details className="mt-6 text-xs">
            <summary className="w-fit cursor-pointer text-primary">
              Riwayat revisi ({submission.versions.length} versi)
            </summary>
            <div className="mt-4 space-y-5 rounded-xl bg-gray-50 p-4">
              {submission.versions.map((version) => (
                <div key={version.version}>
                  <p className="mb-2 font-medium">
                    Versi {version.version} ·{" "}
                    {formatEventDate(version.submittedAt, true)}
                  </p>
                  <StudentEvidence
                    compact
                    submission={submission}
                    version={version}
                  />
                </div>
              ))}
            </div>
          </details>
        </>
      ) : (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-secondary">
          <SiswaIcon frame="370:4068" name="imgIcon11" />
          Belum dikumpulkan{" "}
          <Link
            className="text-primary"
            href={workHref(event.id, milestone.id)}
          >
            Buka ruang kerja
          </Link>
        </p>
      )}
    </Surface>
  );
}
