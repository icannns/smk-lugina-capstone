import type { ReactNode } from "react";
import type { ManagedEvent } from "@/lib/guru/event-types";
import type { GuruRubric, WizardStep } from "@/lib/guru/teacher-types";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { EventSurface } from "../event-ui";
import { DesignIcon } from "../../design-ui";
function ReviewCard({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: ReactNode;
  onEdit?: () => void;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-line p-4">
      <div className="mb-2 flex justify-between gap-3 text-xs leading-4">
        <h2 className="text-secondary">{title}</h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Ubah ${title}`}
            className="font-medium text-primary"
          >
            Ubah
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
export function ReviewStep({
  event,
  rubric,
  onEdit,
  onSurvey,
}: {
  event: ManagedEvent;
  rubric?: GuruRubric;
  onEdit: (step: WizardStep) => void;
  onSurvey: () => void;
}) {
  const plain = new DOMParser().parseFromString(
    event.caseStudyHtml ?? "",
    "text/html",
  ).body.textContent;
  const allReady = event.milestones.every((m) => m.surveyActive);
  return (
    <EventSurface className="p-5 sm:p-8">
      <p className="mb-6 flex items-center gap-2 text-sm text-secondary">
        <DesignIcon frame="291:20108" name="imgFrame2" />
        Tinjau pengaturan event dan kesiapan semua survei.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <ReviewCard title="Informasi" onEdit={() => onEdit("information")}>
          <h3 className="text-sm font-semibold">{event.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-[17px] text-secondary">
            {plain}
          </p>
          <p className="mt-2 text-xs leading-4 text-secondary">
            {formatEventDate(event.startAt!, true)} –{" "}
            {formatEventDate(event.endAt!, true)} · Mode {event.mode}
          </p>
        </ReviewCard>
        <ReviewCard title="Sistem Pendaftaran">
          <p className="text-sm leading-5">
            Terbuka (Self-Enroll Mandiri Siswa SMK Lugina)
          </p>
        </ReviewCard>
        <ReviewCard
          title={`Milestone (${event.milestones.length})`}
          onEdit={() => onEdit("milestones")}
        >
          <ol className="flex flex-col gap-3">
            {event.milestones.map((m, i) => (
              <li
                key={m.id}
                className="flex flex-wrap justify-between gap-2 text-sm"
              >
                <span>
                  {i + 1}. {m.title}
                </span>
                <span className="text-xs leading-5 text-secondary">
                  {m.deadline
                    ? formatEventDate(m.deadline, true)
                    : "Belum diatur"}
                </span>
              </li>
            ))}
          </ol>
        </ReviewCard>
        <ReviewCard title="Rumus nilai" onEdit={() => onEdit("rubric")}>
          <p className="text-sm leading-5">
            {rubric?.title} · nilai = total skor ÷ skor maksimal × 100
          </p>
        </ReviewCard>
        <ReviewCard
          title="Syarat sertifikat"
          onEdit={() => onEdit("certificate")}
        >
          <p className="text-sm leading-5">
            Nilai akhir ≥ {event.certificateConfig?.threshold} ·{" "}
            {event.certificateConfig?.mode === "template"
              ? "Template sertifikat"
              : "Rincian sertifikat"}
          </p>
        </ReviewCard>
        <ReviewCard title="Lampiran" onEdit={() => onEdit("information")}>
          <p className="break-words text-sm leading-5">
            {event.attachments?.map((f) => f.name).join(", ") ||
              "Tidak ada lampiran"}
          </p>
        </ReviewCard>
      </div>
      <section className="mt-6 border-t border-line pt-4">
        <h2 className="text-lg font-semibold leading-6 text-[#17243b]">
          Form Survei per Milestone
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {event.milestones.map((m, i) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <h3 className="text-sm font-medium text-[#17243b]">
                  Milestone {i + 1} — {m.title}
                </h3>
                <p className="mt-0.5 text-xs text-[#4a5a75]">
                  {m.surveyActive
                    ? `Survei Refleksi Teknologi M${i + 1}`
                    : "Survei belum dihubungkan"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs font-medium ${m.surveyActive ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {m.surveyActive ? "Siap digunakan" : "Belum disiapkan"}
                </span>
                <button
                  type="button"
                  onClick={onSurvey}
                  aria-label={`Ubah survei milestone ${i + 1}`}
                  className="h-11 rounded-[10px] border border-[#dce2ed] px-6 text-sm text-[#17243b] hover:bg-gray-50"
                >
                  Ubah
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 text-xs leading-4 text-[#4a5a75]">
          <p>
            {allReady
              ? "Semua survei siap diterbitkan bersama event. Siswa belum dapat mengakses survei sampai tugas milestone berhasil dikumpulkan."
              : "Prototipe ini hanya menerbitkan event contoh. Pengaitan dan penerbitan survei berada pada modul tim lain."}
          </p>
          <p>
            Skor survei terpisah dari nilai tugas. Hasil setiap milestone
            dihitung tersendiri.
          </p>
          <p>
            Tidak ada survei atau sertifikat resmi yang diterbitkan pada demo
            ini.
          </p>
        </div>
      </section>
    </EventSurface>
  );
}
