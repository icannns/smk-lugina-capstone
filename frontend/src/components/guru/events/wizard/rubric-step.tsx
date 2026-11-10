import type { ManagedEvent } from "@/lib/guru/event-types";
import type { GuruRubric } from "@/lib/guru/teacher-types";
import { rubricMaximum } from "@/lib/guru/rubric-data";
import { EventSurface } from "../event-ui";
import { DesignIcon } from "../../design-ui";
export function RubricStep({
  event,
  rubrics,
  onChange,
  onCreate,
  error,
}: {
  event: ManagedEvent;
  rubrics: GuruRubric[];
  onChange: (patch: Partial<ManagedEvent>) => void;
  onCreate: () => void;
  error?: string;
}) {
  const selected = rubrics.find((r) => r.id === event.rubricId);
  return (
    <EventSurface className="p-5 sm:p-8">
      <div className="grid gap-6 min-[1200px]:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold leading-6">Pilih rubrik</h2>
            <button
              type="button"
              onClick={onCreate}
              className="text-sm font-medium text-[#1447e6] hover:underline"
            >
              + Buat Rubrik baru
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {rubrics.map((r) => (
              <label
                key={r.id}
                className={`relative flex cursor-pointer items-start gap-3 rounded-2xl p-4 ${selected?.id === r.id ? "bg-primary-soft/50" : "hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  aria-label={r.title}
                  name="rubric"
                  checked={selected?.id === r.id}
                  onChange={() => onChange({ rubricId: r.id, rubric: r.title })}
                  className="absolute inset-0 z-10 size-full cursor-pointer opacity-0 peer"
                />
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-gray-300 peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                  {selected?.id === r.id && (
                    <span className="grid size-2 place-items-center rounded-full bg-[#165dfc]">
                      <DesignIcon frame="291:19328" name="imgIcon2" />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-5">
                    {r.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-secondary">
                    {r.criteria.length} kriteria ·{" "}
                    {r.criteria.map((c) => c.title).join(", ")}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {error && (
            <p
              id="wizard-rubric-error"
              role="alert"
              className="mt-2 text-sm text-danger"
            >
              {error}
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-gray-50 p-6">
          <p className="text-xs font-medium uppercase leading-4 tracking-[0.3px] text-secondary">
            Pratinjau
          </p>
          {selected ? (
            <>
              <h3 className="mt-1 text-base font-semibold leading-6">
                {selected.title}
              </h3>
              <dl className="mt-4 flex flex-col gap-2">
                {selected.criteria.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between gap-4 text-sm leading-5"
                  >
                    <dt>{c.title}</dt>
                    <dd className="shrink-0 text-secondary">
                      skor {c.min}–{c.max}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 rounded-control border border-line bg-white p-4">
                <p className="text-xs leading-4 text-secondary">
                  Rumus nilai per milestone
                </p>
                <p className="mt-1 font-mono text-[13px] leading-5">
                  nilai = (total skor rubrik ÷ {rubricMaximum(selected)}) × 100
                </p>
                <p className="mt-2 text-xs leading-4 text-secondary">
                  Nilai akhir = rata-rata nilai seluruh milestone. Tanpa bobot.
                </p>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-secondary">
              Pilih rubrik untuk melihat kriteria.
            </p>
          )}
        </div>
      </div>
    </EventSurface>
  );
}
