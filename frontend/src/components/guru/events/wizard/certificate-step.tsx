"use client";
import { useRef, useState } from "react";
import type { ManagedEvent } from "@/lib/guru/event-types";
import type {
  CertificateConfig,
  CertificateMarker,
} from "@/lib/guru/teacher-types";
import { defaultCertificate } from "@/lib/guru/rubric-data";
import { EventSurface } from "../event-ui";
import { WizardField, WizardInput, wizardInput } from "./wizard-ui";
import { DesignIcon } from "../../design-ui";

function CertificateFile({
  value,
  label,
  max,
  accept,
  frame,
  icon,
  onChange,
}: {
  value?: CertificateConfig["template"];
  label: string;
  max: number;
  accept: string;
  frame: string;
  icon: string;
  onChange: (file: CertificateConfig["template"]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  return (
    <div>
      <input
        ref={ref}
        type="file"
        className="hidden"
        aria-label={label}
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (
            f.size > max * 1024 * 1024 ||
            !accept.split(",").some((a) => f.name.toLowerCase().endsWith(a))
          ) {
            setError(`Gunakan ${accept}, maksimal ${max} MB.`);
            return;
          }
          setError("");
          onChange({ name: f.name, size: f.size, type: f.type });
          e.target.value = "";
        }}
      />
      <div className="flex h-10 items-center gap-2 rounded-control border border-line px-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex min-w-0 flex-1 items-center gap-2 text-sm"
        >
          <DesignIcon frame={frame} name={icon} />
          <span className="truncate">{value?.name ?? "Pilih berkas"}</span>
        </button>
        {value && (
          <button
            type="button"
            aria-label={`Hapus ${label}`}
            onClick={() => onChange(undefined)}
          >
            <DesignIcon
              frame={frame}
              name={frame === "291:19865" ? "imgIcon3" : "imgIcon3"}
            />
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
export function CertificatePreview({
  config,
  title,
  onMove,
}: {
  config: CertificateConfig;
  title: string;
  onMove?: (marker: CertificateMarker, x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const values = {
    student: "Aisyah Putri",
    event: title,
    date: config.issuedAt
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
          new Date(`${config.issuedAt}T12:00:00`),
        )
      : "10 Juni 2025",
    score: "85",
  };
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase leading-4 tracking-[0.3px] text-secondary">
        Pratinjau (data contoh)
      </p>
      <div
        ref={ref}
        className={`relative aspect-[400/284] w-full overflow-hidden rounded-2xl border border-line p-3 shadow-lg ${config.mode === "template" ? "bg-[linear-gradient(135deg,#fffbeb,white)]" : "bg-white"}`}
      >
        {config.mode === "details" ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-200 px-4 text-center">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,#155dfc,#009689)] text-sm font-bold text-white">
              L
            </span>
            <p className="text-[9px] uppercase tracking-[2px] text-secondary">
              {config.organizer}
            </p>
            <h3 className="text-sm font-semibold">{config.name}</h3>
            <p className="mt-1 text-[10px] text-secondary">diberikan kepada</p>
            <p className="text-lg font-semibold text-[#1447e6]">Aisyah Putri</p>
            <p className="text-[10px] text-secondary">
              {config.description} — {title}
            </p>
            <p className="mt-2 text-[9px] font-semibold">{config.signer}</p>
            <p className="text-[9px]">{config.signerRole}</p>
          </div>
        ) : (
          (Object.keys(config.positions) as CertificateMarker[]).map(
            (marker) => (
              <button
                key={marker}
                type="button"
                aria-label={`Posisi ${marker}`}
                className={`absolute max-w-[85%] -translate-x-1/2 -translate-y-1/2 touch-none rounded border border-blue-300 bg-blue-50/70 px-2 text-center focus:outline-2 focus:outline-primary ${marker === "student" ? "text-lg font-semibold" : "text-[10px]"}`}
                style={{
                  left: `${config.positions[marker].x}%`,
                  top: `${config.positions[marker].y}%`,
                }}
                onPointerDown={(e) => {
                  if (onMove) e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (
                    !e.currentTarget.hasPointerCapture(e.pointerId) ||
                    !ref.current ||
                    !onMove
                  )
                    return;
                  const r = ref.current.getBoundingClientRect();
                  onMove(
                    marker,
                    Math.max(
                      5,
                      Math.min(95, ((e.clientX - r.x) / r.width) * 100),
                    ),
                    Math.max(
                      5,
                      Math.min(95, ((e.clientY - r.y) / r.height) * 100),
                    ),
                  );
                }}
                onKeyDown={(e) => {
                  const v = {
                    ArrowLeft: [-1, 0],
                    ArrowRight: [1, 0],
                    ArrowUp: [0, -1],
                    ArrowDown: [0, 1],
                  }[e.key];
                  if (v && onMove) {
                    e.preventDefault();
                    onMove(
                      marker,
                      Math.max(
                        5,
                        Math.min(95, config.positions[marker].x + v[0]),
                      ),
                      Math.max(
                        5,
                        Math.min(95, config.positions[marker].y + v[1]),
                      ),
                    );
                  }
                }}
              >
                {values[marker]}
              </button>
            ),
          )
        )}
        <p className="absolute bottom-1 left-0 w-full text-center text-[8px] font-medium text-muted">
          PROTOTIPE · BUKAN SERTIFIKAT RESMI
        </p>
      </div>
    </div>
  );
}
export function CertificateStep({
  event,
  onChange,
  errors,
}: {
  event: ManagedEvent;
  onChange: (patch: Partial<ManagedEvent>) => void;
  errors: Record<string, string>;
}) {
  const c = event.certificateConfig ?? defaultCertificate();
  const template = c.mode === "template";
  const frame = template ? "291:19865" : "291:19593";
  const edit = (patch: Partial<CertificateConfig>) =>
    onChange({ certificateConfig: { ...c, ...patch } });
  const fields: [keyof CertificateConfig, string][] = [
    ["name", "Nama sertifikat"],
    ["organizer", "Penyelenggara"],
    ["issuedAt", "Tanggal terbit"],
    ["signer", "Nama penandatangan"],
    ["signerRole", "Jabatan penandatangan"],
  ];
  return (
    <EventSurface className="p-5 sm:p-8">
      <div className="grid items-start gap-8 min-[1320px]:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <div className="mb-6 inline-flex max-w-full flex-wrap gap-1 rounded-control bg-gray-100 p-1">
            {(
              [
                ["details", "Isi Rincian Sertifikat"],
                ["template", "Unggah Template"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => edit({ mode })}
                aria-pressed={mode === c.mode}
                className={`h-8 rounded-lg px-3 text-[13px] font-medium ${mode === c.mode ? "bg-white shadow-sm" : "text-secondary"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <WizardField
            id="cert-threshold"
            label="Ambang nilai kelulusan (0–100)"
            required
            error={errors["cert-threshold"]}
          >
            <div className="max-w-32">
              <WizardInput
                id="cert-threshold"
                type="number"
                min={0}
                max={100}
                step="any"
                value={c.threshold}
                onChange={(e) => edit({ threshold: e.target.value })}
                error={errors["cert-threshold"]}
              />
            </div>
          </WizardField>
          <p className="mt-1.5 text-xs leading-4 text-secondary">
            Siswa dengan nilai akhir ≥ ambang ini berhak mengklaim sertifikat
            event.
          </p>
          {template ? (
            <div className="mt-6">
              <h2 className="mb-1.5 text-sm font-medium">
                Template sertifikat <span className="text-danger">*</span>
              </h2>
              <CertificateFile
                value={c.template}
                label="Template sertifikat"
                max={5}
                accept=".pdf,.jpg,.jpeg,.png"
                frame={frame}
                icon="imgIcon2"
                onChange={(file) => edit({ template: file })}
              />
              <p className="mt-1.5 text-xs text-secondary">
                PDF atau gambar (JPG/PNG), maks. 5 MB, ukuran A4 lanskap
              </p>
              {errors["cert-template"] && (
                <p role="alert" className="mt-2 text-xs text-danger">
                  {errors["cert-template"]}
                </p>
              )}
              <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                <h3 className="text-sm font-medium">Pemetaan posisi</h3>
                <p className="mt-2 text-xs text-secondary">
                  Seret penanda pada pratinjau untuk menempatkan data.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["student", "Nama siswa"],
                      ["event", "Judul event"],
                      ["date", "Tanggal terbit"],
                      ["score", "Nilai akhir"],
                    ] as const
                  ).map(([marker, label]) => (
                    <div
                      key={marker}
                      className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs"
                    >
                      <DesignIcon frame={frame} name="imgIcon4" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                {fields.slice(0, 2).map(([key, label]) => (
                  <WizardField
                    key={key}
                    id={`cert-${key}`}
                    label={label}
                    required
                    error={errors[`cert-${key}`]}
                  >
                    <WizardInput
                      id={`cert-${key}`}
                      value={String(c[key])}
                      onChange={(e) => edit({ [key]: e.target.value })}
                      error={errors[`cert-${key}`]}
                    />
                  </WizardField>
                ))}
                <WizardField
                  id="cert-event"
                  label="Judul event (otomatis)"
                  required
                >
                  <WizardInput id="cert-event" readOnly value={event.title} />
                </WizardField>
                {fields.slice(2).map(([key, label]) => (
                  <WizardField
                    key={key}
                    id={`cert-${key}`}
                    label={label}
                    required
                    error={errors[`cert-${key}`]}
                  >
                    <WizardInput
                      id={`cert-${key}`}
                      type={key === "issuedAt" ? "date" : "text"}
                      value={String(c[key])}
                      onChange={(e) => edit({ [key]: e.target.value })}
                      error={errors[`cert-${key}`]}
                    />
                  </WizardField>
                ))}
              </div>
              <div className="mt-5">
                <WizardField
                  id="cert-description"
                  label="Teks keterangan"
                  optional
                >
                  <textarea
                    id="cert-description"
                    className={`${wizardInput} h-24 py-2.5`}
                    value={c.description}
                    onChange={(e) => edit({ description: e.target.value })}
                  />
                </WizardField>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-1.5 text-sm font-medium">
                    Logo <span className="text-secondary">(opsional)</span>
                  </h3>
                  <CertificateFile
                    value={c.logo}
                    label="Logo"
                    max={2}
                    accept=".png,.svg"
                    frame={frame}
                    icon="imgIcon2"
                    onChange={(logo) => edit({ logo })}
                  />
                  <p className="mt-1.5 text-xs text-secondary">
                    PNG/SVG, maks. 2 MB
                  </p>
                </div>
                <div>
                  <h3 className="mb-1.5 text-sm font-medium">
                    Tanda tangan{" "}
                    <span className="text-secondary">(opsional)</span>
                  </h3>
                  <CertificateFile
                    value={c.signature}
                    label="Tanda tangan"
                    max={1}
                    accept=".png"
                    frame={frame}
                    icon="imgIcon4"
                    onChange={(signature) => edit({ signature })}
                  />
                  <p className="mt-1.5 text-xs text-secondary">
                    PNG transparan, maks. 1 MB · metadata simulasi
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        <CertificatePreview
          title={event.title}
          config={c}
          onMove={(marker, x, y) =>
            edit({ positions: { ...c.positions, [marker]: { x, y } } })
          }
        />
      </div>
    </EventSurface>
  );
}
