"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  beginEventDraft,
  useEventDraftStore,
  wizardHref,
  listedEvents,
  useTeacherProfile,
  deleteEventDraft,
  restoreDeletedEventDraft,
} from "@/lib/guru/event-draft-store";
import { snapshotDate } from "@/lib/guru/dashboard-data";
import type { ManagedEvent } from "@/lib/guru/event-types";
import {
  eventLearning,
  monitoringHref,
  submissionStatus,
  allSubmissions,
  allStudents,
  milestoneLabel,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { DashboardShell } from "./dashboard-shell";
import {
  DashboardButton,
  DashboardIcon,
  DashboardPrimaryButton,
} from "./dashboard-ui";
import { DashboardDialog, type DashboardDialogState } from "./dashboard-dialog";
import { EventList } from "./event-list";
import { ReviewQueue } from "./review-queue";
import { studentDirectory } from "@/lib/guru/student-integration";
import { DashboardAssessments } from "@/components/assessments/dashboard-assessments";

function Dashboard({ empty }: { empty: boolean }) {
  const router = useRouter();
  const draftState = useEventDraftStore();
  const teacher = useTeacherProfile();
  const teacherSubmissions = allSubmissions(draftState.learning),
    teacherStudents = allStudents(draftState.learning);
  const params = useSearchParams();
  const events = listedEvents(draftState).filter((e) => e.status !== "draft");
  const surveyResponseCount = studentDirectory(
    events,
    draftState.learning,
    draftState.studentUI,
    draftState.studentReviews,
  )
    .enrollments.filter((e) => !e.reviewed)
    .reduce((sum, e) => sum + e.completedMilestones, 0);
  const guruEvents = events.map((event) => {
    const data = eventLearning(
      event,
      draftState.learning,
      draftState.rubrics[event.rubricId ?? ""],
    );
    return {
      id: event.id,
      title: event.title,
      status: event.status as "ongoing" | "upcoming" | "ended",
      period: event.period,
      start: event.startAt ?? "2025-01-01",
      students: data.rows.length,
      submitted: data.submitted,
      total: data.total,
      completed: data.completed,
      pending: data.pending,
      finishedStudents: data.finished,
    };
  });
  const reviewQueue = teacherSubmissions
    .filter((s) =>
      ["pending", "survey", "revision"].includes(
        submissionStatus(s, draftState.learning),
      ),
    )
    .sort((a, b) =>
      a.versions
        .at(-1)!
        .submittedAt.localeCompare(b.versions.at(-1)!.submittedAt),
    )
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      student: teacherStudents.find((x) => x.id === s.studentId)!.name,
      event: events.find((e) => e.id === s.eventId)!.title,
      milestone: `${milestoneLabel(
        events.find((e) => e.id === s.eventId)!,
        s.milestoneId,
      )} · ${events.find((e) => e.id === s.eventId)!.milestones.find((m) => m.id === s.milestoneId)!.title}`,
      submitted: formatEventDate(s.versions.at(-1)!.submittedAt, true),
      waitingDays: Math.max(
        0,
        Math.floor(
          (Date.parse("2025-04-02T08:15+07:00") -
            Date.parse(`${s.versions.at(-1)!.submittedAt}+07:00`)) /
            86400000,
        ),
      ),
      href: monitoringHref(s.eventId, s.studentId, s.milestoneId),
    }));
  const [action, setAction] = useState<DashboardDialogState | null>(null);
  const [undoDraft, setUndoDraft] = useState<ManagedEvent | null>(null);
  const drafts = listedEvents(draftState).filter((e) => e.status === "draft"),
    firstDraft = drafts[0];
  const [deleted, setDeleted] = useState(false);
  const pending = guruEvents.reduce((total, event) => total + event.pending, 0);
  const ongoing = guruEvents.filter((event) => event.status === "ongoing");
  const upcomingCount = guruEvents.filter(
    (event) => event.status === "upcoming",
  ).length;
  const statistics = [
    {
      title: "Event terbit",
      value: guruEvents.length,
      helper: `${upcomingCount} event belum dimulai`,
    },
    {
      title: "Sedang berlangsung",
      value: ongoing.length,
      helper: `${ongoing.reduce((total, event) => total + event.students, 0)} siswa mengikuti`,
    },
    {
      title: "Event berakhir",
      value: guruEvents.filter((event) => event.status === "ended").length,
      helper: "Arsip tetap dapat dibuka",
    },
    {
      title: "Menunggu penilaian",
      value: pending,
      helper: "Tugas masuk antrean pemeriksaan",
    },
  ];
  const createButton = (
    <div className={empty ? "w-[137.25px]" : "w-[148px] shrink-0"}>
      <DashboardPrimaryButton
        onClick={() => router.push(wizardHref(beginEventDraft()))}
      >
        {empty && <DashboardIcon name="plus" empty />}Create Event
      </DashboardPrimaryButton>
    </div>
  );

  return (
    <>
      <DashboardShell empty={empty} onAction={setAction}>
        <main
          id="dashboard-main"
          data-figma-node={empty ? "291:16304" : "291:16094"}
          className="mx-auto flex max-w-[1600px] flex-col gap-6 px-5 pb-9 pt-8 sm:px-8 lg:px-9"
        >
          <div
            className={`flex flex-wrap justify-between gap-6 ${empty ? "items-end" : "items-center"}`}
          >
            <div className="min-w-0 flex-1 basis-72">
              <h1
                className={`text-[30px] font-semibold ${empty ? "leading-[37.5px] tracking-[-0.75px]" : "leading-10"}`}
              >
                {teacher.greeting}
              </h1>
              <p className="mt-1 text-sm leading-5 text-secondary">
                {snapshotDate}
                {!empty &&
                  " — Pantau aktivitas event dan perkembangan belajar siswa."}
              </p>
            </div>
            {createButton}
          </div>
          {params.get("profile") === "saved" && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-3 text-sm text-green-800"
            >
              Profil contoh berhasil disimpan pada sesi tab ini.
            </p>
          )}
          {empty ? (
            <section
              aria-labelledby="empty-title"
              className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a]"
            >
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary-soft">
                <DashboardIcon name="layers" empty />
              </div>
              <h2
                id="empty-title"
                className="text-base font-semibold leading-6"
              >
                Belum ada event
              </h2>
              <p className="mt-1 max-w-96 text-sm leading-5 text-secondary">
                Mulai dengan membuat event pembelajaran pertama Anda.
              </p>
              <div className="mt-4">{createButton}</div>
            </section>
          ) : (
            <>
              <section
                aria-label="Ringkasan event"
                className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4"
              >
                {statistics.map((stat, index) => (
                  <article
                    key={stat.title}
                    className={`flex h-37 flex-col gap-2 rounded-2xl border p-6 ${index === 3 ? "border-[#fff5dc] bg-[#fff5dc]" : "border-line bg-white"}`}
                  >
                    <h2 className="min-h-5 text-xs font-normal leading-[18px] text-secondary">
                      {stat.title}
                    </h2>
                    <p
                      className={`text-[30px] font-semibold leading-10 ${index === 3 ? "text-[#94630f]" : ""}`}
                    >
                      {stat.value}
                    </p>
                    <p className="min-h-5 text-xs leading-[18px] text-secondary">
                      {stat.helper}
                    </p>
                  </article>
                ))}
              </section>
              <DashboardAssessments audience="teacher" />
              {firstDraft && (
                <section
                  aria-label="Draf event"
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4"
                >
                  <DashboardIcon name="draft" />
                  <p className="min-w-0 flex-1 basis-48 text-sm leading-5">
                    {drafts.length} draf belum diterbitkan ·{" "}
                    {firstDraft.title || "Draf tanpa judul"}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <DashboardButton
                      variant="danger"
                      className="w-28 rounded-lg px-3.5 text-[13px] font-semibold"
                      onClick={() =>
                        setAction({
                          title: "Hapus draf event?",
                          description: `Hapus draf contoh “${firstDraft.title || "Draf tanpa judul"}” dari sesi demo? Perubahan juga berlaku di Event Management; tidak ada data server yang dihapus.`,
                          figmaNode: "291:18301",
                          deleteDraft: true,
                        })
                      }
                    >
                      Hapus Draf
                    </DashboardButton>
                    <DashboardButton
                      className="w-36"
                      onClick={() =>
                        router.push(
                          wizardHref(firstDraft.id, firstDraft.wizard?.step),
                        )
                      }
                    >
                      Lanjutkan Draf
                    </DashboardButton>
                  </div>
                </section>
              )}
              <div className="grid min-w-0 items-start gap-6 min-[1360px]:grid-cols-[minmax(0,1fr)_360px]">
                <EventList events={guruEvents} onAction={setAction} />
                <ReviewQueue
                  items={reviewQueue}
                  total={pending}
                  surveyResponseCount={surveyResponseCount}
                  onAction={setAction}
                />
              </div>
              <p className="min-h-5 text-xs leading-[18px] text-secondary">
                Milestone selesai dihitung dari tugas terkirim dan form yang
                sudah selesai. Penilaian guru dicatat terpisah.
              </p>
            </>
          )}
          {empty && <DashboardAssessments audience="teacher" />}
        </main>
      </DashboardShell>
      <DashboardDialog
        action={action}
        onClose={() => setAction(null)}
        onDelete={() => {
          if (!firstDraft) return;
          setUndoDraft(firstDraft);
          deleteEventDraft(firstDraft.id);
          setDeleted(true);
          setAction(null);
        }}
      />
      {deleted && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-30 max-w-[calc(100%-40px)] rounded-2xl border border-line bg-white p-4 shadow-lg"
        >
          <p className="text-sm">Draf contoh dihapus dari sesi demo.</p>
          <div className="mt-2 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => {
                if (undoDraft) restoreDeletedEventDraft(undoDraft);
                setDeleted(false);
              }}
              className="text-sm font-medium text-primary hover:underline"
            >
              Urungkan
            </button>
            <button
              type="button"
              onClick={() => setDeleted(false)}
              className="text-sm text-secondary hover:underline"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function DashboardEntry() {
  const params = useSearchParams();
  const empty = params.get("state") === "empty";
  return <Dashboard key={empty ? "empty" : "full"} empty={empty} />;
}
