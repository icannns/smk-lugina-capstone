import type { InputHTMLAttributes, ReactNode } from "react";
import { wizardAssets } from "@/lib/guru/wizard-assets";
import { DashboardIcon } from "../../dashboard-ui";

export function WizardIcon({ name }: { name: keyof typeof wizardAssets }) {
  return <DashboardIcon name={name} asset={wizardAssets[name]} />;
}
export const wizardInput =
  "h-10 w-full min-w-0 rounded-control border border-line bg-white px-3 text-sm leading-5 focus:outline-2 focus:outline-primary aria-invalid:border-danger";
export function WizardField({
  label,
  required,
  optional,
  children,
  error,
  id,
  compact = false,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  error?: string;
  id: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className={`mb-1.5 block text-sm font-medium ${compact ? "leading-[normal]" : "leading-5"}`}
      >
        {label}
        {required && <span className="text-danger"> *</span>}
        {optional && (
          <span className="font-normal text-secondary"> (opsional)</span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs leading-4 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
export function WizardInput({
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.id}-error` : props["aria-describedby"]}
      className={wizardInput}
    />
  );
}
