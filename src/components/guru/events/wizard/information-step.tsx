import type { ManagedEvent } from "@/lib/guru/event-types";
import { EventSurface } from "../event-ui";
import { AttachmentPicker } from "./attachment-picker";
import { RichTextEditor } from "./rich-text-editor";
import { WizardField, WizardInput } from "./wizard-ui";

export function InformationStep({
  event,
  onChange,
  errors,
}: {
  event: ManagedEvent;
  onChange: (patch: Partial<ManagedEvent>) => void;
  errors: Record<string, string>;
}) {
  return (
    <EventSurface className="p-6">
      <div className="flex max-w-[768px] flex-col gap-6">
        <WizardField
          id="event-title"
          label="Judul"
          required
          error={errors["event-title"]}
        >
          <WizardInput
            id="event-title"
            value={event.title}
            onChange={(e) => onChange({ title: e.target.value })}
            error={errors["event-title"]}
            required
          />
        </WizardField>
        <WizardField
          id="event-case-study"
          label="Studi Kasus & Tujuan"
          required
          error={errors["event-case-study"]}
        >
          <RichTextEditor
            id="event-case-study"
            label="Studi Kasus & Tujuan"
            value={event.caseStudyHtml ?? ""}
            onChange={(caseStudyHtml) => onChange({ caseStudyHtml })}
            error={errors["event-case-study"]}
          />
        </WizardField>
        <WizardField id="event-directions" label="Ketentuan & Arahan" optional>
          <RichTextEditor
            id="event-directions"
            label="Ketentuan & Arahan"
            value={event.directionsHtml ?? ""}
            onChange={(directionsHtml) => onChange({ directionsHtml })}
          />
        </WizardField>
        <section aria-label="Lampiran pendukung">
          <h2 className="mb-1.5 text-sm font-medium leading-5">
            Lampiran pendukung{" "}
            <span className="font-normal text-secondary">(opsional)</span>
          </h2>
          <AttachmentPicker
            files={event.attachments ?? []}
            onChange={(attachments) => onChange({ attachments })}
          />
        </section>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <WizardField
            id="event-start"
            label="Tanggal mulai event (WIB)"
            required
            error={errors["event-start"]}
          >
            <WizardInput
              id="event-start"
              type="datetime-local"
              required
              value={event.startAt ?? ""}
              error={errors["event-start"]}
              onChange={(e) => onChange({ startAt: e.target.value })}
            />
          </WizardField>
          <WizardField
            id="event-end"
            label="Deadline event (WIB)"
            required
            error={errors["event-end"]}
          >
            <WizardInput
              id="event-end"
              type="datetime-local"
              required
              value={event.endAt ?? ""}
              error={errors["event-end"]}
              onChange={(e) => onChange({ endAt: e.target.value })}
            />
          </WizardField>
        </div>
      </div>
    </EventSurface>
  );
}
