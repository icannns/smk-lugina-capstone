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
  publishEvent,
} from "@/lib/guru/event-draft-store";
import {
  informationErrors,
  milestoneErrors,
  rubricErrors,
  certificateErrors,
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
import { RubricStep } from "./rubric-step";
import { CertificateStep } from "./certificate-step";
import { defaultCertificate } from "@/lib/guru/rubric-data";
import type { WizardStep } from "@/lib/guru/teacher-types";
import { designNavigation } from "../../design-ui";
import { DesignIcon } from "../../design-ui";
import { ReviewStep } from "./review-step";
import { EventComplete } from "./event-complete";

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
  const [attemptedAdvanced, setAttemptedAdvanced] = useState(false);
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
  if (raw.status !== "draft")
    return <EventComplete event={raw} storageError={state.storageError} />;
  const event: ManagedEvent = {
    ...raw,
    rubricId: raw.rubricId ?? "uiux",
    rubric: raw.rubric ?? state.rubrics[raw.rubricId ?? "uiux"]?.title,
    certificateConfig: raw.certificateConfig ?? defaultCertificate(),
    wizard: raw.wizard ?? {
      step: "information",
      selectedMilestoneId: raw.milestones[0]?.id ?? "",
      modeChosen: false,
    },
  };
  const infoErrors = informationErrors(event);
  const order: WizardStep[] = [
    "information",
    "milestones",
    "rubric",
    "certificate",
    "review",
  ];
  const requested = order.includes(params.get("step") as WizardStep)
    ? (params.get("step") as WizardStep)
    : "information";
  let step: WizardStep = requested;
  const rubrics = Object.values(state.rubrics);
  if (order.indexOf(requested) > 0 && Object.keys(infoErrors).length)
    step = "information";
  else if (
    order.indexOf(requested) > 1 &&
    Object.keys(milestoneErrors(event)).length
  )
    step = "milestones";
  else if (
    order.indexOf(requested) > 2 &&
    Object.keys(rubricErrors(event, rubrics)).length
  )
    step = "rubric";
  else if (
    order.indexOf(requested) > 3 &&
    Object.keys(certificateErrors(event)).length
  )
    step = "certificate";
  const activeIndex = order.indexOf(step);
  const isMilestones = step === "milestones";
  const frame =
    step === "review"
      ? "291:20108"
      : step === "rubric"
        ? "291:19328"
        : step === "certificate"
          ? event.certificateConfig?.mode === "template"
            ? "291:19865"
            : "291:19593"
          : isMilestones
            ? "291:19016"
            : "293:29139";
  const selected = event.milestones.some(
    (m) => m.id === event.wizard?.selectedMilestoneId,
  )
    ? event.wizard!.selectedMilestoneId
    : (event.milestones[0]?.id ?? "");
  const errors: Record<string, string> =
    step === "rubric"
      ? attemptedAdvanced || requested !== step
        ? rubricErrors(event, rubrics)
        : {}
      : step === "certificate"
        ? attemptedAdvanced
          ? certificateErrors(event)
          : {}
        : isMilestones
          ? attemptedMilestones
            ? milestoneErrors(event)
            : {}
          : attemptedInfo || requested !== step
            ? infoErrors
            : {};
  function change(patch: Partial<ManagedEvent>) {
    changeEventDraft({ ...event, ...patch });
    setNotice("");
  }
  function go(step: WizardStep) {
    setAttemptedAdvanced(false);
    change({ wizard: { ...event.wizard!, step } });
    window.history.pushState(null, "", wizardHref(id!, step));
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() =>
      document.getElementById("wizard-title")?.focus(),
    );
  }
  function next() {
    const found =
      step === "review"
        ? {
            ...informationErrors(event),
            ...milestoneErrors(event),
            ...rubricErrors(event, rubrics),
            ...certificateErrors(event),
          }
        : step === "rubric"
          ? rubricErrors(event, rubrics)
          : step === "certificate"
            ? certificateErrors(event)
            : isMilestones
              ? milestoneErrors(event)
              : informationErrors(event);
    if (isMilestones) setAttemptedMilestones(true);
    else if (step === "information") setAttemptedInfo(true);
    else setAttemptedAdvanced(true);
    const first = Object.keys(found)[0];
    if (first) {
      if (step === "review")
        go(
          first.startsWith("event-")
            ? "information"
            : first.startsWith("milestone-")
              ? "milestones"
              : first === "wizard-rubric"
                ? "rubric"
                : "certificate",
        );
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
    if (step === "review") {
      publishEvent(event);
      window.history.replaceState(null, "", wizardHref(event.id, "done"));
      window.scrollTo({ top: 0 });
    } else go(order[activeIndex + 1]);
  }
  function boundary(title: string) {
    setAction({
      title,
      description: `${title} merupakan bagian modul Survei yang dikerjakan terpisah. Wizard ini hanya menyimpan pengaturan event contoh; tidak membuat formulir atau respons survei. Data isian event tetap tersimpan pada sesi tab ini.`,
    });
  }
  const overrides =
    activeIndex > 1
      ? designNavigation(frame)
      : isMilestones
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
          data-figma-node={frame}
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
                const active = index === activeIndex;
                const done = index < activeIndex;
                return (
                  <li key={label}>
                    <div
                      className={`h-1 rounded-full ${active || done ? "bg-primary" : "bg-line"}`}
                    />
                    <button
                      type="button"
                      disabled={index > 4}
                      aria-current={active ? "step" : undefined}
                      title={
                        index > 4
                          ? "Langkah berikutnya belum tersedia"
                          : undefined
                      }
                      onClick={() => {
                        if (active) return;
                        if (index < activeIndex) go(order[index]);
                        else if (index === activeIndex + 1) next();
                        else go(order[index]);
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
            {step === "review" ? (
              <ReviewStep
                event={event}
                rubric={state.rubrics[event.rubricId!]}
                onEdit={go}
                onSurvey={() => boundary("Pengaitan Survei")}
              />
            ) : step === "rubric" ? (
              <RubricStep
                event={event}
                rubrics={rubrics}
                error={errors["wizard-rubric"]}
                onChange={change}
                onCreate={() =>
                  router.push(
                    `/guru/rubrics?mode=create&from=${encodeURIComponent(event.id)}`,
                  )
                }
              />
            ) : step === "certificate" ? (
              <CertificateStep
                event={event}
                errors={errors}
                onChange={change}
              />
            ) : isMilestones ? (
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
            className={`${activeIndex > 0 ? "mt-6" : "mt-4"} flex flex-wrap items-center justify-between gap-3 bg-[#f5f6f8]/90 py-3 backdrop-blur-sm`}
          >
            <button
              type="button"
              onClick={() =>
                step === "review"
                  ? go("milestones")
                  : activeIndex > 0
                    ? go(order[activeIndex - 1])
                    : router.push("/guru/events")
              }
              className={`flex h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium text-secondary ${activeIndex > 0 ? "" : "opacity-50"}`}
            >
              {activeIndex > 1 ? (
                <DesignIcon
                  frame={frame}
                  name={
                    step === "review"
                      ? "imgFrame3"
                      : step === "rubric"
                        ? "imgIcon3"
                        : "imgIcon5"
                  }
                />
              ) : isMilestones ? (
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
                  {step === "review" && (
                    <DesignIcon frame={frame} name="imgFrame4" />
                  )}
                  {step === "review"
                    ? "Terbitkan Event"
                    : isMilestones
                      ? "Lanjut ke Rubrik"
                      : "Lanjut"}
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
