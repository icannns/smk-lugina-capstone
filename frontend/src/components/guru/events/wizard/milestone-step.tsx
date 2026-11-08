import { newMilestone, submissionFormats } from "@/lib/guru/event-wizard-data";
import type { EventMilestone, ManagedEvent } from "@/lib/guru/event-types";
import { AttachmentPicker } from "./attachment-picker";
import { WizardField, WizardIcon, WizardInput, wizardInput } from "./wizard-ui";

export function MilestoneStep({
  event,
  selectedId,
  onSelect,
  onChange,
  errors,
  onBoundary,
}: {
  event: ManagedEvent;
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (milestones: EventMilestone[], selected?: string) => void;
  errors: Record<string, string>;
  onBoundary: (title: string) => void;
}) {
  const index = event.milestones.findIndex((m) => m.id === selectedId);
  const selected = event.milestones[index];
  const key = selected ? `milestone-${selected.id}` : "";
  function edit(patch: Partial<EventMilestone>) {
    onChange(
      event.milestones.map((m) =>
        m.id === selectedId ? { ...m, ...patch } : m,
      ),
    );
  }
  function move(i: number, direction: number) {
    const rows = [...event.milestones];
    [rows[i], rows[i + direction]] = [rows[i + direction], rows[i]];
    onChange(rows);
  }
  const formats =
    selected?.formats
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  return (
    <div className="rounded-2xl border border-line bg-white p-5 sm:p-8">
      <div className="grid min-w-0 gap-6 min-[1200px]:grid-cols-[260px_minmax(0,1fr)]">
        <aside aria-label="Daftar milestone" className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold leading-6">
              Milestone ({event.milestones.length})
            </h2>
            <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium leading-4 text-[#1447e6]">
              Mode Penyelesaian
            </span>
          </div>
          <ol className="mt-3 flex flex-col gap-1">
            {event.milestones.map((m, i) => (
              <li key={m.id} className="flex items-center gap-1">
                <button
                  type="button"
                  aria-current={m.id === selectedId ? "step" : undefined}
                  aria-label={`Pilih milestone ${i + 1}: ${m.title || "Tanpa judul"}`}
                  onClick={() => onSelect(m.id)}
                  className={`flex h-11 min-w-0 flex-1 items-center gap-2 rounded-control px-3 text-left text-sm ${m.id === selectedId ? "bg-primary-soft font-medium text-[#193cb8]" : "hover:bg-gray-50"}`}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs">
                    {i + 1}
                  </span>
                  <span className="truncate">{m.title || "Tanpa judul"}</span>
                </button>
                <span className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    aria-label={`Naikkan milestone ${i + 1}`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="grid size-5 place-items-center rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    <WizardIcon name="up" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Turunkan milestone ${i + 1}`}
                    disabled={i === event.milestones.length - 1}
                    onClick={() => move(i, 1)}
                    className="grid size-5 place-items-center rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    <WizardIcon name="down" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => {
              const m = newMilestone();
              onChange([...event.milestones, m], m.id);
            }}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-control border border-line text-sm font-medium hover:bg-gray-50"
          >
            <WizardIcon name="plus" />
            Tambah Milestone
          </button>
          <div className="mt-6 rounded-2xl border border-line bg-gray-50 p-4">
            <h3 className="flex items-center gap-1 text-xs font-semibold leading-4">
              <WizardIcon name="survey" />
              Form Survei Standar
            </h3>
            <p className="mt-2 text-xs leading-[15px] text-secondary">
              Setiap milestone, siswa mengisi Form Survei terkait pengalaman
              teknologi dan refleksi pengerjaan sebelum lanjut ke milestone
              berikutnya.
            </p>
          </div>
        </aside>
        {selected ? (
          <section
            aria-label={`Editor milestone ${index + 1}`}
            className="min-w-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold leading-6">
                Milestone {index + 1}
              </h2>
              <div className="flex gap-1 text-[13px] font-medium text-secondary">
                <button
                  type="button"
                  onClick={() => {
                    const copy = {
                      ...selected,
                      id: crypto.randomUUID(),
                      attachments: selected.attachments?.map((f) => ({ ...f })),
                    };
                    const rows = [...event.milestones];
                    rows.splice(index + 1, 0, copy);
                    onChange(rows, copy.id);
                  }}
                  className="flex h-8 items-center justify-center gap-2 rounded-control px-3 hover:bg-gray-50"
                >
                  <WizardIcon name="duplicate" />
                  Duplikat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rows = event.milestones.filter(
                      (m) => m.id !== selectedId,
                    );
                    onChange(
                      rows,
                      rows[Math.min(index, rows.length - 1)]?.id ?? "",
                    );
                  }}
                  className="flex h-8 items-center justify-center gap-2 rounded-control px-3 hover:bg-red-50"
                >
                  <WizardIcon name="delete" />
                  Hapus
                </button>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-5">
              <WizardField
                compact
                id={`${key}-title`}
                label="Judul milestone"
                required
                error={errors[`${key}-title`]}
              >
                <WizardInput
                  id={`${key}-title`}
                  value={selected.title}
                  required
                  error={errors[`${key}-title`]}
                  onChange={(e) => edit({ title: e.target.value })}
                />
              </WizardField>
              <WizardField
                compact
                id={`${key}-instructions`}
                label="Instruksi"
                optional
              >
                <textarea
                  id={`${key}-instructions`}
                  value={selected.instructions ?? ""}
                  onChange={(e) => edit({ instructions: e.target.value })}
                  className={`${wizardInput} h-24 resize-y py-2.5`}
                />
              </WizardField>
              <fieldset
                aria-describedby={
                  errors[`${key}-formats`]
                    ? `${key}-formats-error`
                    : `${key}-formats-help`
                }
              >
                <legend className="text-sm font-medium leading-[normal]">
                  Format pengumpulan diterima *
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {submissionFormats.map((format) => {
                    const checked = formats.includes(format);
                    return (
                      <label
                        key={format}
                        className={`relative flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${checked ? "border-blue-200 bg-primary-soft text-[#193cb8]" : "border-line bg-white"}`}
                      >
                        <input
                          id={format === "PDF" ? `${key}-formats` : undefined}
                          type="checkbox"
                          aria-label={format}
                          checked={checked}
                          onChange={() =>
                            edit({
                              formats: submissionFormats
                                .filter((f) =>
                                  f === format ? !checked : formats.includes(f),
                                )
                                .join(", "),
                            })
                          }
                          className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0"
                        />
                        <span
                          className={`grid size-[13px] place-items-center rounded-[2px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${checked ? "border-[#155dfc] bg-[#155dfc]" : "border-[#767676] bg-white"}`}
                        >
                          {checked && <WizardIcon name="checked" />}
                        </span>
                        {format}
                      </label>
                    );
                  })}
                </div>
                <p
                  id={`${key}-formats-help`}
                  className="mt-2 text-xs leading-[normal] text-secondary"
                >
                  PDF/gambar (JPG, PNG) maks. 10 MB per berkas, maks. 3 berkas.
                  Boleh digabung.
                </p>
                {errors[`${key}-formats`] && (
                  <p
                    id={`${key}-formats-error`}
                    className="mt-1.5 text-xs text-danger"
                  >
                    {errors[`${key}-formats`]}
                  </p>
                )}
              </fieldset>
              <div className="max-w-[374px]">
                <WizardField
                  compact
                  id={`${key}-deadline`}
                  label="Deadline (WIB)"
                  required
                  error={errors[`${key}-deadline`]}
                >
                  <WizardInput
                    id={`${key}-deadline`}
                    type="datetime-local"
                    required
                    value={selected.deadline ?? ""}
                    error={errors[`${key}-deadline`]}
                    onChange={(e) => edit({ deadline: e.target.value })}
                  />
                </WizardField>
              </div>
              <section aria-label="Lampiran milestone">
                <h3 className="mb-1.5 text-sm font-medium leading-[normal]">
                  Lampiran milestone (opsional)
                </h3>
                <AttachmentPicker
                  key={selected.id}
                  milestone
                  files={selected.attachments ?? []}
                  onChange={(attachments) => edit({ attachments })}
                />
              </section>
            </div>
            <section className="mt-6 flex flex-col gap-3">
              <h3 className="text-lg font-semibold leading-[normal] text-[#17243b]">
                Form Survei Milestone
              </h3>
              <p className="text-sm leading-[normal] text-[#4a5a75]">
                Isi survei setelah tugas dikumpulkan agar siswa dapat
                melanjutkan ke milestone berikutnya.
              </p>
              <div className="flex flex-col gap-2.5 rounded-control border border-[#e0e7f3] bg-[#f7f8fc] p-4">
                <p className="text-sm font-semibold leading-5 text-[#9a5b13]">
                  Belum disiapkan
                </p>
                <p className="text-sm leading-5 text-[#17243b]">
                  Setiap milestone memerlukan satu survei tersendiri.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onBoundary("Buat Survei")}
                    className="h-11 w-[150px] max-w-full rounded-[10px] border border-[#dce2ed] bg-white px-3 text-sm font-medium text-[#285be8] hover:bg-primary-soft"
                  >
                    Buat Survei
                  </button>
                  <button
                    type="button"
                    onClick={() => onBoundary("Pilih Template")}
                    className="h-11 w-40 max-w-full rounded-[10px] border border-[#dce2ed] bg-white px-3 text-sm font-medium text-[#17243b] hover:bg-gray-50"
                  >
                    Pilih Template
                  </button>
                </div>
              </div>
              <p className="text-xs leading-[normal] text-[#4a5a75]">
                Tugas berhasil dikumpulkan → isi survei → survei berhasil
                dikirim. Siswa dapat lanjut tanpa menunggu penilaian guru.
              </p>
            </section>
          </section>
        ) : (
          <div className="rounded-control border border-dashed border-line p-6 text-sm text-secondary">
            Belum ada milestone. Gunakan Tambah Milestone untuk mulai menyusun.
          </div>
        )}
      </div>
    </div>
  );
}
