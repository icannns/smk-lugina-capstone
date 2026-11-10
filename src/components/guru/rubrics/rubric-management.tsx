"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  listedEvents,
  saveRubric,
  useEventDraftStore,
  wizardHref,
} from "@/lib/guru/event-draft-store";
import { localDate } from "@/lib/guru/event-wizard-data";
import type { GuruRubric, RubricCriterion } from "@/lib/guru/teacher-types";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { rubricMaximum } from "@/lib/guru/rubric-data";
import { TeacherPage } from "../teacher-page";
import { DesignIcon, Surface, controlClass } from "../design-ui";
import { DashboardPrimaryButton } from "../dashboard-ui";

function emptyCriterion(title = ""): RubricCriterion {
  return {
    id: crypto.randomUUID(),
    title,
    description: "",
    min: 1,
    max: 5,
    levels: Array(5).fill(""),
  };
}
function rubricHref(mode?: string, id?: string, from?: string) {
  const p = new URLSearchParams();
  if (mode) p.set("mode", mode);
  if (id) p.set("rubric", id);
  if (from) p.set("from", from);
  return `/guru/rubrics${p.size ? `?${p}` : ""}`;
}
function RubricSimulation({ rubric }: { rubric: GuruRubric }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const selected = rubric.criteria.map(
    (c, i) => scores[c.id] ?? [5, 4, 3, 4][i % 4],
  );
  const total = selected.reduce((sum, n) => sum + n, 0),
    max = rubricMaximum(rubric);
  return (
    <Surface>
      <h2 className="text-base font-semibold leading-6">Simulasi konversi</h2>
      <p className="mt-1 text-xs text-secondary">Contoh skor per kriteria</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {rubric.criteria.map((c, i) => (
          <select
            key={c.id}
            aria-label={`Simulasi skor ${c.title || i + 1}`}
            value={selected[i]}
            onChange={(e) =>
              setScores({ ...scores, [c.id]: Number(e.target.value) })
            }
            className="h-8 w-9 appearance-none rounded-lg bg-primary-soft text-center text-sm font-semibold text-primary"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        ))}
      </div>
      <dl className="mt-5 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-secondary">Skor rubrik</dt>
          <dd>
            {total}/{max}
          </dd>
        </div>
        <div className="flex justify-between gap-2 text-xs">
          <dt className="text-secondary">Rumus</dt>
          <dd className="font-mono">
            {total}/{max} × 100
          </dd>
        </div>
        <div className="mt-1 flex justify-between gap-2 border-t border-line pt-2">
          <dt>Nilai 0–100</dt>
          <dd className="text-2xl font-semibold">
            {max ? Math.round((total / max) * 100) : "—"}
          </dd>
        </div>
      </dl>
    </Surface>
  );
}
export function RubricManagement() {
  const params = useSearchParams(),
    state = useEventDraftStore();
  const mode = params.get("mode"),
    id = params.get("rubric") ?? "",
    from = params.get("from") ?? undefined;
  const rubric = Object.hasOwn(state.rubrics, id)
    ? state.rubrics[id]
    : undefined;
  const [search, setSearch] = useState("");
  const router = useRouter();
  if (mode === "create" || mode === "copy" || mode === "edit") {
    if (mode === "edit" && rubric?.inUse)
      return <RubricView rubric={rubric} from={from} />;
    if (mode === "edit" && !rubric)
      return (
        <TeacherPage frame="291:21370" activePage="rubrics">
          <h1 className="text-2xl font-semibold">Rubrik tidak ditemukan</h1>
          <Link href="/guru/rubrics" className="mt-4 inline-block text-primary">
            Kembali
          </Link>
        </TeacherPage>
      );
    return (
      <RubricEditor
        key={`${mode}-${id}`}
        source={rubric}
        edit={mode === "edit"}
        copy={mode === "copy"}
        from={from}
      />
    );
  }
  if (mode === "view" && rubric)
    return <RubricView rubric={rubric} from={from} />;
  const frame = "291:20520",
    rubrics = Object.values(state.rubrics).filter((r) =>
      r.title
        .toLocaleLowerCase("id")
        .includes(search.trim().toLocaleLowerCase("id")),
    ),
    events = listedEvents(state).filter((e) => e.status !== "draft");
  return (
    <TeacherPage frame={frame} activePage="rubrics">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-[37.5px] tracking-[-.75px]">
            Kelola Rubrik
          </h1>
          <p className="mt-1 text-sm leading-5 text-secondary">
            Rubrik berisi kriteria dengan skala skor 1–5. Nilai dikonversi ke
            0–100.
          </p>
        </div>
        <div>
          <DashboardPrimaryButton
            onClick={() => router.push(rubricHref("create", undefined, from))}
          >
            <DesignIcon frame={frame} name="imgIcon" />
            Buat Rubrik
          </DashboardPrimaryButton>
        </div>
      </div>
      <Surface padded={false} className="mt-6 overflow-hidden">
        <div className="p-4">
          <label className="relative block max-w-80">
            <span className="pointer-events-none absolute left-3 top-3">
              <DesignIcon frame={frame} name="imgIcon1" />
            </span>
            <input
              aria-label="Cari rubrik"
              placeholder="Cari rubrik"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${controlClass} pl-9`}
            />
          </label>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y border-line bg-gray-50/60 text-xs font-normal text-secondary">
              <tr>
                {[
                  "Nama rubrik",
                  "Kriteria",
                  "Dipakai di event",
                  "Diperbarui",
                  "",
                ].map((text, i) => (
                  <th className="px-4 py-3 font-normal" key={i}>
                    {text || <span className="sr-only">Aksi</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rubrics.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-4">
                    <span className="font-medium">{r.title}</span>
                    {r.inUse && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-secondary">
                        Terkunci
                      </span>
                    )}
                  </td>
                  <td className="px-4">{r.criteria.length} kriteria</td>
                  <td className="px-4">
                    {events.filter((e) => e.rubricId === r.id).length} event
                  </td>
                  <td className="px-4 text-secondary">
                    {formatEventDate(r.updated)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start justify-end gap-4">
                      <Link
                        href={rubricHref("view", r.id, from)}
                        aria-label={`Lihat ${r.title}`}
                        className="py-2 text-[13px] font-medium text-secondary hover:text-primary"
                      >
                        Lihat
                      </Link>
                      <div className="text-center">
                        <button
                          type="button"
                          disabled={r.inUse}
                          onClick={() =>
                            router.push(rubricHref("edit", r.id, from))
                          }
                          aria-label={`Edit ${r.title}`}
                          className="h-8 rounded-control bg-primary-soft px-4 text-[13px] font-medium text-primary disabled:opacity-40"
                        >
                          Edit
                        </button>
                        {r.inUse && (
                          <p className="mt-1 text-xs text-secondary">
                            Sudah dipakai menilai
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rubrics.length && (
          <p role="status" className="p-8 text-center text-sm text-secondary">
            Tidak ada rubrik yang sesuai.
          </p>
        )}
      </Surface>
      {from && (
        <Link
          href={wizardHref(from, "rubric")}
          className="mt-4 inline-block text-sm text-primary"
        >
          Kembali ke wizard event
        </Link>
      )}
    </TeacherPage>
  );
}
function RubricView({ rubric, from }: { rubric: GuruRubric; from?: string }) {
  const router = useRouter(),
    state = useEventDraftStore(),
    events = listedEvents(state).filter(
      (e) => e.status !== "draft" && e.rubricId === rubric.id,
    );
  const frame = "291:21058";
  return (
    <TeacherPage frame={frame} activePage="rubrics">
      <nav className="flex items-center gap-1 text-[13px] text-secondary">
        <Link href={rubricHref(undefined, undefined, from)}>Kelola Rubrik</Link>
        <DesignIcon frame={frame} name="imgIcon" />
        <span className="text-foreground">{rubric.title}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-[37.5px] tracking-[-.75px]">
            {rubric.title}
          </h1>
          <p className="mt-1 text-sm leading-5 text-secondary">
            {rubric.description}
          </p>
        </div>
        <div>
          <DashboardPrimaryButton
            onClick={() => router.push(rubricHref("copy", rubric.id, from))}
          >
            <DesignIcon frame={frame} name="imgIcon1" />
            Buat Salinan Baru
          </DashboardPrimaryButton>
        </div>
      </div>
      {rubric.inUse && (
        <p className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <DesignIcon frame={frame} name="imgIcon2" />
          Rubrik ini sudah dipakai menilai sehingga terkunci dan tidak dapat
          dihapus. Buat salinan baru untuk melakukan perubahan.
        </p>
      )}
      <div className="mt-6 grid items-start gap-6 min-[1200px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          {rubric.criteria.map((c, i) => (
            <Surface key={c.id}>
              <h2 className="text-base font-semibold">
                {i + 1}. {c.title}
              </h2>
              <p className="mt-1 text-sm leading-5 text-secondary">
                {c.description}
              </p>
              <div className="mt-4 grid gap-2 min-[450px]:grid-cols-2 min-[1200px]:grid-cols-5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="rounded-2xl bg-gray-50 p-3">
                    <h3 className="text-sm font-medium text-primary">
                      Skor {n}
                    </h3>
                    <p className="mt-1 text-xs leading-4">
                      {c.levels?.[n - 1] ||
                        "Deskripsi belum tersedia pada acuan."}
                    </p>
                  </div>
                ))}
              </div>
            </Surface>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <RubricSimulation rubric={rubric} />
          <Surface>
            <h2 className="text-base font-semibold">Dipakai di event</h2>
            <div className="mt-3 flex flex-col gap-2">
              {events.map((e) => (
                <Link
                  key={e.id}
                  href={`/guru/events?event=${encodeURIComponent(e.id)}`}
                  className="text-sm text-primary hover:underline"
                >
                  {e.title}
                </Link>
              ))}
              {!events.length && (
                <p className="text-sm text-secondary">
                  Belum dipakai pada event contoh.
                </p>
              )}
            </div>
          </Surface>
        </div>
      </div>
    </TeacherPage>
  );
}
function RubricEditor({
  source,
  edit,
  copy,
  from,
}: {
  source?: GuruRubric;
  edit: boolean;
  copy: boolean;
  from?: string;
}) {
  const router = useRouter();
  const [rubric, setRubric] = useState<GuruRubric>(() =>
    source
      ? {
          ...structuredClone(source),
          id: edit ? source.id : crypto.randomUUID(),
          title: copy ? `${source.title} (Salinan)` : source.title,
          inUse: false,
        }
      : {
          id: crypto.randomUUID(),
          title: "",
          description: "",
          updated: localDate(),
          inUse: false,
          criteria: [
            {
              ...emptyCriterion("Konsistensi"),
              description: "Keseragaman elemen antar layar.",
              levels: [
                "Tidak konsisten",
                "Kurang konsisten",
                "Cukup konsisten",
                "Konsisten",
                "Sangat konsisten",
              ],
            },
            emptyCriterion("Navigasi"),
          ],
        },
  );
  const [attempted, setAttempted] = useState(false),
    [notice, setNotice] = useState("");
  const frame = edit ? "291:21370" : "291:20745";
  const errors: Record<string, string> = {};
  if (!rubric.title.trim()) errors.name = "Nama rubrik wajib diisi.";
  if (!rubric.criteria.length)
    errors.criteria = "Tambahkan kriteria penilaian.";
  rubric.criteria.forEach((c) => {
    if (!c.title.trim())
      errors[`rubric-${c.id}-name`] = "Nama kriteria wajib diisi.";
    for (let n = 1; n <= 5; n++)
      if (!c.levels?.[n - 1]?.trim())
        errors[`rubric-${c.id}-score-${n}`] =
          `Deskripsi skor ${n} wajib diisi.`;
  });
  function criterion(id: string, patch: Partial<RubricCriterion>) {
    setRubric({
      ...rubric,
      criteria: rubric.criteria.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });
  }
  function move(i: number, delta: number) {
    const rows = [...rubric.criteria];
    [rows[i], rows[i + delta]] = [rows[i + delta], rows[i]];
    setRubric({ ...rubric, criteria: rows });
  }
  function save() {
    setAttempted(true);
    if (Object.keys(errors).length) {
      document
        .getElementById(
          !rubric.title.trim()
            ? "rubric-name"
            : errors.criteria
              ? "rubric-add-criterion"
              : Object.keys(errors)[0],
        )
        ?.focus();
      return;
    }
    if (!saveRubric({ ...rubric, updated: localDate() })) {
      setNotice(
        "Rubrik terkunci atau penyimpanan sesi tidak tersedia. Periksa status penyimpanan.",
      );
      return;
    }
    router.push(from ? wizardHref(from, "rubric") : rubricHref());
  }
  return (
    <TeacherPage frame={frame} activePage="rubrics">
      <nav className="flex items-center gap-1 text-[13px] text-secondary">
        <Link href={rubricHref(undefined, undefined, from)}>Kelola Rubrik</Link>
        <DesignIcon frame={frame} name="imgIcon" />
        <span className="text-foreground">
          {edit ? "Edit Rubrik" : "Buat Rubrik"}
        </span>
      </nav>
      <h1 className="mt-3 text-[30px] font-semibold leading-[37.5px] tracking-[-.75px]">
        {edit ? "Edit Rubrik" : "Buat Rubrik"}
      </h1>
      <p className="mt-1 text-sm text-secondary">
        Tanpa bobot — semua kriteria bernilai sama.
      </p>
      {attempted && Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-3 text-sm text-danger">
          Periksa kolom wajib dan deskripsi skor.
        </p>
      )}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="mt-6 grid items-start gap-6 min-[1200px]:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <Surface>
            <label className="block text-sm font-medium" htmlFor="rubric-name">
              Nama rubrik <span className="text-danger">*</span>
            </label>
            <input
              id="rubric-name"
              className={`${controlClass} mt-1.5`}
              value={rubric.title}
              onChange={(e) => setRubric({ ...rubric, title: e.target.value })}
              aria-invalid={attempted && !!errors.name}
              aria-describedby={
                attempted && errors.name ? "rubric-name-error" : undefined
              }
            />
            {attempted && errors.name && (
              <p id="rubric-name-error" className="mt-1 text-xs text-danger">
                {errors.name}
              </p>
            )}
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="rubric-description"
            >
              Deskripsi penggunaan{" "}
              <span className="font-normal text-secondary">(opsional)</span>
            </label>
            <textarea
              id="rubric-description"
              className={`${controlClass} mt-1.5 h-24 py-2.5`}
              value={rubric.description}
              onChange={(e) =>
                setRubric({ ...rubric, description: e.target.value })
              }
            />
          </Surface>
          <div
            id="rubric-criteria"
            tabIndex={-1}
            className="flex flex-col gap-6"
          >
            {rubric.criteria.map((c, i) => (
              <Surface key={c.id}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Kriteria {i + 1}</h2>
                  <div className="flex gap-2">
                    {[
                      [-1, "Naikkan", "imgIcon1"],
                      [1, "Turunkan", "imgIcon2"],
                    ].map(([d, label, icon]) => (
                      <button
                        type="button"
                        key={label}
                        aria-label={`${label} kriteria ${i + 1}`}
                        disabled={
                          Number(d) < 0
                            ? i === 0
                            : i === rubric.criteria.length - 1
                        }
                        onClick={() => move(i, Number(d))}
                        className="grid size-7 place-items-center disabled:opacity-30"
                      >
                        <DesignIcon frame={frame} name={String(icon)} />
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label={`Hapus kriteria ${i + 1}`}
                      onClick={() =>
                        setRubric({
                          ...rubric,
                          criteria: rubric.criteria.filter(
                            (x) => x.id !== c.id,
                          ),
                        })
                      }
                      className="grid size-7 place-items-center"
                    >
                      <DesignIcon frame={frame} name="imgIcon3" />
                    </button>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    Nama kriteria <span className="text-danger">*</span>
                    <input
                      aria-label={`Nama kriteria ${i + 1}`}
                      id={`rubric-${c.id}-name`}
                      aria-invalid={
                        attempted && !!errors[`rubric-${c.id}-name`]
                      }
                      aria-describedby={
                        attempted && errors[`rubric-${c.id}-name`]
                          ? `rubric-${c.id}-name-error`
                          : undefined
                      }
                      className={`${controlClass} mt-1.5`}
                      value={c.title}
                      onChange={(e) =>
                        criterion(c.id, { title: e.target.value })
                      }
                    />
                    {attempted && errors[`rubric-${c.id}-name`] && (
                      <span
                        id={`rubric-${c.id}-name-error`}
                        className="mt-1 block text-xs text-danger"
                      >
                        {errors[`rubric-${c.id}-name`]}
                      </span>
                    )}
                  </label>
                  <label className="text-sm">
                    Penjelasan kriteria{" "}
                    <span className="text-secondary">(opsional)</span>
                    <input
                      aria-label={`Penjelasan kriteria ${i + 1}`}
                      className={`${controlClass} mt-1.5`}
                      value={c.description}
                      onChange={(e) =>
                        criterion(c.id, { description: e.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-2 min-[450px]:grid-cols-2 min-[1200px]:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className="text-xs text-secondary">
                      Skor {n} <span className="text-danger">*</span>
                      <textarea
                        aria-label={`Kriteria ${i + 1} skor ${n}`}
                        id={`rubric-${c.id}-score-${n}`}
                        aria-invalid={
                          attempted && !!errors[`rubric-${c.id}-score-${n}`]
                        }
                        aria-describedby={
                          attempted && errors[`rubric-${c.id}-score-${n}`]
                            ? `rubric-${c.id}-score-${n}-error`
                            : undefined
                        }
                        className={`${controlClass} mt-1 h-20 resize-y px-2 py-2 text-xs leading-4`}
                        value={c.levels?.[n - 1] ?? ""}
                        onChange={(e) => {
                          const levels = [...(c.levels ?? Array(5).fill(""))];
                          levels[n - 1] = e.target.value;
                          criterion(c.id, { levels });
                        }}
                      />
                      {attempted && errors[`rubric-${c.id}-score-${n}`] && (
                        <span
                          id={`rubric-${c.id}-score-${n}-error`}
                          className="mt-1 block text-xs text-danger"
                        >
                          {errors[`rubric-${c.id}-score-${n}`]}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </Surface>
            ))}
          </div>
          {attempted && errors.criteria && (
            <p className="text-xs text-danger">{errors.criteria}</p>
          )}
          <button
            type="button"
            id="rubric-add-criterion"
            onClick={() =>
              setRubric({
                ...rubric,
                criteria: [...rubric.criteria, emptyCriterion()],
              })
            }
            className="flex h-10 items-center justify-center gap-2 rounded-control bg-white text-sm font-medium"
          >
            <DesignIcon frame={frame} name="imgIcon4" />
            Tambah Kriteria
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Surface>
            <h2 className="text-base font-semibold">
              Pratinjau lembar penilaian
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {rubric.criteria.map((c, i) => (
                <div key={c.id}>
                  <h3 className="text-sm">{c.title || `Kriteria ${i + 1}`}</h3>
                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className="flex h-7 flex-1 items-center justify-center rounded-md border border-line text-xs text-secondary"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-4 text-secondary">
              Label <strong>skor rubrik</strong> = jumlah skor (maks.{" "}
              {rubricMaximum(rubric)}). <strong>Nilai 0–100</strong> = hasil
              konversi.
            </p>
          </Surface>
          <RubricSimulation rubric={rubric} />
          <div className="flex gap-2">
            <Link
              href={from ? wizardHref(from, "rubric") : rubricHref()}
              className="flex h-10 flex-1 items-center justify-center rounded-control bg-white text-sm font-medium"
            >
              Batal
            </Link>
            <div className="flex-1">
              <DashboardPrimaryButton type="submit">
                Simpan Rubrik
              </DashboardPrimaryButton>
            </div>
          </div>
          {notice && (
            <p role="status" className="text-sm text-danger">
              {notice}
            </p>
          )}
        </div>
      </form>
    </TeacherPage>
  );
}
