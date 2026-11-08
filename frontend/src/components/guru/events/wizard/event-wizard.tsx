"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  beginEventDraft,
  changeEventDraft,
  readEventDraft,
  saveEventDraft,
  useEventDraftStore,
  wizardHref,
} from "@/lib/guru/event-draft-store";
import {
  informationErrors,
  milestoneErrors,
} from "@/lib/guru/event-wizard-validation";
import { wizardSteps } from "@/lib/guru/event-wizard-data";
import { wizardAssets } from "@/lib/guru/wizard-assets";
import { eventAssets } from "@/lib/guru/event-assets";
import { studentAssets } from "@/lib/guru/student-assets";
import type { ManagedEvent } from "@/lib/guru/event-types";
import { DashboardShell } from "../../dashboard-shell";
import {
  DashboardDialog,
  type DashboardDialogState,
} from "../../dashboard-dialog";
import { DashboardIcon, DashboardPrimaryButton } from "../../dashboard-ui";
import { InformationStep } from "./information-step";
import { MilestoneStep } from "./milestone-step";
import { WizardIcon } from "./wizard-ui";

const subscribeReady = () => () => {};
export function EventWizard() {
  const params = useSearchParams();
  return <EventWizardSession key={params.get("draft") ?? "new"} />;
}

function EventWizardSession() {
  const router = useRouter();
  const params = useSearchParams();
  const state = useEventDraftStore();
  const ready = useSyncExternalStore(
    subscribeReady,
    () => true,
    () => false,
  );
  const id = params.get("draft");
  const bootstrapped = useRef(false);
  const raw = id ? readEventDraft(state, id) : undefined;
  const [attemptedInfo, setAttemptedInfo] = useState(false);
  const [attemptedMilestones, setAttemptedMilestones] = useState(false);
  const [action, setAction] = useState<DashboardDialogState | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (id) bootstrapped.current = false;
    else if (!bootstrapped.current) {
      bootstrapped.current = true;
      router.replace(wizardHref(beginEventDraft()));
    }
  }, [id, router]);
  if (!ready || !id)
    return (
      <main
        className="grid min-h-dvh place-items-center text-sm text-secondary"
        aria-busy="true"
      >
        Memuat draf contoh…
      </main>
    );
  if (!raw)
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-semibold">Draf tidak ditemukan</h1>
        <p className="mt-3 text-sm text-secondary">
          Draf ini telah dihapus atau tidak tersedia pada sesi tab ini.
        </p>
        <Link
          href="/guru/events?tab=draft"
          className="mt-4 inline-block text-sm font-medium text-primary"
        >
          Kembali ke daftar draf
        </Link>
      </main>
    );
  const event: ManagedEvent = {
    ...raw,
    wizard: raw.wizard ?? {
      step: "information",
      selectedMilestoneId: raw.milestones[0]?.id ?? "",
      modeChosen: false,
    },
  };
  const infoErrors = informationErrors(event);
  const requestedMilestones = params.get("step") === "milestones";
  const isMilestones = requestedMilestones && !Object.keys(infoErrors).length;
  const selected = event.milestones.some(
    (m) => m.id === event.wizard?.selectedMilestoneId,
  )
    ? event.wizard!.selectedMilestoneId
    : (event.milestones[0]?.id ?? "");
  const errors = isMilestones
    ? attemptedMilestones
      ? milestoneErrors(event)
      : {}
    : attemptedInfo || requestedMilestones
      ? infoErrors
      : {};
  function change(patch: Partial<ManagedEvent>) {
    changeEventDraft({ ...event, ...patch });
    setNotice("");
  }
  function go(step: "information" | "milestones") {
    change({ wizard: { ...event.wizard!, step } });
    window.history.pushState(null, "", wizardHref(id!, step));
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() =>
      document.getElementById("wizard-title")?.focus(),
    );
  }
  function next() {
    const found = isMilestones
      ? milestoneErrors(event)
      : informationErrors(event);
    if (isMilestones) setAttemptedMilestones(true);
    else setAttemptedInfo(true);
    const first = Object.keys(found)[0];
    if (first) {
      if (isMilestones) {
        const m = event.milestones.find((m) =>
          first.startsWith(`milestone-${m.id}-`),
        );
        if (m)
          change({ wizard: { ...event.wizard!, selectedMilestoneId: m.id } });
      }
      requestAnimationFrame(() => document.getElementById(first)?.focus());
      return;
    }
    if (isMilestones) boundary("Rubrik");
    else go("milestones");
  }
  function boundary(title: string) {
    setAction({
      title,
      description: `${title === "Rubrik" ? "Langkah Rubrik" : title} belum diimplementasikan pada Phase 4B-1. Data isian tetap tersimpan dalam sesi tab ini. Tidak ada survei, rubrik, sertifikat, atau event terbit yang dibuat.`,
    });
  }
  const overrides = isMilestones
    ? { ...wizardAssets, dashboard: studentAssets["initial-dashboard"] }
    : { ...eventAssets };
  return (
    <>
      <DashboardShell
        empty
        activePage="events"
        iconOverrides={overrides}
        onAction={setAction}
        mainId="wizard-main"
      >
        <main
          id="wizard-main"
          data-figma-node={isMilestones ? "291:19016" : "293:29139"}
          className="mx-auto min-w-0 max-w-[1176px] px-5 pb-2 pt-8 sm:px-8"
        >
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-[13px] leading-[19.5px]"
          >
            <Link
              href="/guru/events"
              className="text-secondary hover:underline"
            >
              Create Event
            </Link>
            {isMilestones ? (
              <WizardIcon name="breadcrumb" />
            ) : (
              <DashboardIcon name="breadcrumb" asset={eventAssets.breadcrumb} />
            )}
            <span className="font-medium">Buat Event</span>
          </nav>
          <div className="mt-3">
            <h1
              id="wizard-title"
              tabIndex={-1}
              className={`text-[30px] font-semibold leading-[37.5px] outline-none ${isMilestones ? "" : "tracking-[-0.75px]"}`}
            >
              Buat Event
            </h1>
            <p className="mt-1 text-sm leading-5 text-secondary">
              {isMilestones
                ? event.title
                : "Data tersimpan saat berpindah langkah."}
            </p>
          </div>
          <nav
            aria-label="Langkah wizard"
            tabIndex={0}
            className="mt-6 overflow-x-auto pb-1 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ol className="grid min-w-[760px] grid-cols-5 gap-2">
              {wizardSteps.map((label, index) => {
                const active = index === (isMilestones ? 1 : 0);
                const done = index === 0 && isMilestones;
                return (
                  <li key={label}>
                    <div
                      className={`h-1 rounded-full ${active || done ? "bg-primary" : "bg-line"}`}
                    />
                    <button
                      type="button"
                      disabled={index > 1}
                      aria-current={active ? "step" : undefined}
                      title={
                        index > 1 ? "Belum tersedia pada Phase 4B-1" : undefined
                      }
                      onClick={() => {
                        if (active) return;
                        if (index === 0) go("information");
                        else next();
                      }}
                      className="mt-2 flex h-6 items-center gap-2 whitespace-nowrap text-left text-sm"
                    >
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${done ? "bg-primary text-white" : active ? "bg-primary-soft font-semibold text-[#1447e6]" : "bg-gray-100 text-secondary"}`}
                      >
                        {done ? <WizardIcon name="completed" /> : index + 1}
                      </span>
                      <span
                        className={active ? "font-semibold" : "text-secondary"}
                      >
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          {state.storageError && (
            <p
              role="alert"
              className="mt-4 rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            >
              {state.storageError}
            </p>
          )}
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="mt-4 text-sm text-danger">
              Periksa kolom wajib yang ditandai sebelum melanjutkan.
            </p>
          )}
          <form
            id="event-wizard-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            className="mt-5"
          >
            {isMilestones ? (
              <MilestoneStep
                event={event}
                selectedId={selected}
                errors={errors}
                onSelect={(selectedMilestoneId) =>
                  change({ wizard: { ...event.wizard!, selectedMilestoneId } })
                }
                onChange={(milestones, selectedMilestoneId = selected) =>
                  change({
                    milestones,
                    wizard: { ...event.wizard!, selectedMilestoneId },
                  })
                }
                onBoundary={boundary}
              />
            ) : (
              <InformationStep
                key={id}
                event={event}
                errors={errors}
                onChange={change}
              />
            )}
          </form>
          <div
            className={`${isMilestones ? "mt-6" : "mt-4"} flex flex-wrap items-center justify-between gap-3 bg-[#f5f6f8]/90 py-3 backdrop-blur-sm`}
          >
            <button
              type="button"
              onClick={() =>
                isMilestones ? go("information") : router.push("/guru/events")
              }
              className={`flex h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium text-secondary ${isMilestones ? "" : "opacity-50"}`}
            >
              {isMilestones ? (
                <WizardIcon name="back" />
              ) : (
                <span className="grid size-4 place-items-center">
                  <WizardIcon name="info-back" />
                </span>
              )}
              Kembali
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const success = saveEventDraft(event);
                  setNotice(
                    success
                      ? "Draf contoh tersimpan di sesi tab ini."
                      : "Draf hanya tersimpan di memori. Penyimpanan sesi tidak tersedia.",
                  );
                }}
                className={`h-10 rounded-control bg-white px-4 text-sm font-medium ${isMilestones ? "border border-line" : ""}`}
              >
                Simpan Draf
              </button>
              <div>
                <DashboardPrimaryButton type="submit" form="event-wizard-form">
                  {isMilestones ? "Lanjut ke Rubrik" : "Lanjut"}
                </DashboardPrimaryButton>
              </div>
            </div>
          </div>
          {notice && (
            <div
              role="status"
              className="mt-3 flex flex-wrap items-center gap-3 text-sm text-secondary"
            >
              <p>{notice}</p>
              <Link
                href="/guru/events?tab=draft"
                className="font-medium text-primary hover:underline"
              >
                Lihat daftar draf
              </Link>
            </div>
          )}
          <p className="mt-3 text-xs leading-4 text-muted">
            Prototipe · Gunakan data fiktif. Lampiran hanya simulasi metadata,
            tidak diunggah.
          </p>
        </main>
      </DashboardShell>
      <DashboardDialog
        action={action}
        onClose={() => setAction(null)}
        onDelete={() => setAction(null)}
      />
    </>
  );
}
