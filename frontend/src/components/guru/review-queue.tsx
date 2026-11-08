import {
  dashboardActions,
  surveyResponseCount,
  type DashboardAction,
  type ReviewItem,
} from "@/lib/guru/dashboard-data";
import { DashboardButton } from "./dashboard-ui";

export function ReviewQueue({
  items,
  total,
  onAction,
}: {
  items: ReviewItem[];
  total: number;
  onAction: (action: DashboardAction) => void;
}) {
  return (
    <aside
      aria-label="Antrean dan survei"
      className="flex min-w-0 flex-col gap-6"
    >
      <section
        aria-labelledby="review-title"
        className="overflow-hidden rounded-2xl border border-line bg-white"
      >
        <header className="flex h-[102px] flex-col gap-2 p-6">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="review-title"
              className="text-lg font-semibold leading-[26px]"
            >
              Perlu Diperiksa
            </h2>
            <span className="flex h-[26px] min-w-10 items-center justify-center rounded-control bg-[#fff5dc] px-2 text-xs leading-[18px] text-[#94630f]">
              {total}
            </span>
          </div>
          <p className="text-xs leading-[18px] text-secondary">
            Pengiriman paling lama di atas.
          </p>
        </header>
        <ol aria-label="Enam pengiriman terlama">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex min-h-39 flex-col gap-2 bg-white p-4 min-[1360px]:h-39 min-[1360px]:[&>*]:shrink-0"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium leading-5">
                  {item.student}
                </h3>
                <button
                  type="button"
                  aria-label={`Periksa ${item.student}`}
                  onClick={() =>
                    onAction({
                      ...dashboardActions.assessment,
                      description: `${item.student} · ${item.milestone}. ${dashboardActions.assessment.description}`,
                    })
                  }
                  className="inline-flex h-8 w-21 shrink-0 items-center justify-center rounded-control border border-primary bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
                >
                  Periksa
                </button>
              </div>
              <p className="min-h-5 text-xs leading-[18px] text-secondary">
                {item.event}
              </p>
              <p className="min-h-5 text-xs leading-[18px]">{item.milestone}</p>
              <div className="flex min-h-5 flex-wrap items-center justify-between gap-1 text-xs leading-[18px]">
                <time className="text-secondary">{item.submitted}</time>
                <span className="text-[#94630f]">{item.waitingDays} hari</span>
              </div>
              <div className="h-px bg-line" />
            </li>
          ))}
        </ol>
        <div className="p-6">
          <DashboardButton
            className="w-full"
            onClick={() =>
              onAction({
                ...dashboardActions.monitoring,
                description: `Terdapat ${total} tugas dalam ringkasan contoh; enam pengiriman terlama ditampilkan di Dashboard. ${dashboardActions.monitoring.description}`,
              })
            }
          >
            Lihat semua {total} tugas
          </DashboardButton>
        </div>
      </section>
      <section
        aria-labelledby="survey-title"
        className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6"
      >
        <h2
          id="survey-title"
          className="h-5 text-lg font-semibold leading-[26px]"
        >
          Form Survei
        </h2>
        <div className="flex items-center gap-4">
          <span className="w-[58px] shrink-0 text-center text-[30px] font-semibold leading-10">
            {surveyResponseCount}
          </span>
          <p className="text-sm leading-5 text-secondary">
            {surveyResponseCount} respons menunggu ditinjau. Tinjau jawaban
            siswa untuk menentukan tindak lanjut.
          </p>
        </div>
        <DashboardButton
          className="w-full px-2"
          onClick={() => onAction(dashboardActions.survey)}
        >
          Lihat semua {surveyResponseCount} respons
        </DashboardButton>
      </section>
    </aside>
  );
}
