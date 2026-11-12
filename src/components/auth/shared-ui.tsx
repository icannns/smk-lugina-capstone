"use client";
import {
  useState,
  type InputHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
export function SharedAuthInput({
  id,
  label,
  error,
  password = false,
  icon,
  valid = false,
  labelAction,
  helper,
  compact = false,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  password?: boolean;
  icon?: "name" | "email" | "password";
  valid?: boolean;
  labelAction?: ReactNode;
  helper?: ReactNode;
  compact?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div
        className={`flex items-center justify-between gap-3 ${icon && id.startsWith("register") ? "sr-only" : "mb-1.5"}`}
      >
        <label
          htmlFor={id}
          className={`text-sm font-medium ${compact?"leading-[17px]":"leading-5"} text-[#374151]`}
        >
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative flex items-center">
        <input
          {...props}
          id={id}
          type={
            password ? (visible ? "text" : "password") : (props.type ?? "text")
          }
          autoComplete={props.autoComplete ?? "off"}
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : helper ? `${id}-hint` : undefined
          }
          className={`${compact ? "h-12" : "h-[50px]"} w-full min-w-0 rounded-lg border bg-[#fbfcfe] pr-12 text-sm text-[#111827] focus:border-primary focus:outline-2 focus:outline-primary/20 disabled:opacity-60 ${icon ? "pl-[46px]" : "pl-4"} ${error ? "border-danger" : "border-line"}`}
        />
        {icon && (
          <span
            aria-hidden
            className={`pointer-events-none absolute left-4 shrink-0 border-[1.5px] border-[#9ca3af] ${icon === "name" ? "size-[18px] rounded-full" : icon === "email" ? "h-3.5 w-[18px] rounded-[2px]" : "size-4 rounded-[4px]"}`}
          />
        )}
        {password ? (
          <button
            type="button"
            disabled={props.disabled}
            aria-label={
              visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-1.5 grid w-10 place-items-center rounded-lg"
          >
            <span
              aria-hidden
              className={`h-3.5 w-5 rounded-full border-[1.5px] ${visible ? "border-primary bg-primary-soft" : "border-[#9ca3af]"}`}
            />
          </button>
        ) : (
          valid && (
            <span
              aria-hidden
              className="absolute right-4 grid size-5 place-items-center rounded-full bg-[#10b981] text-xs font-bold text-white"
            >
              ✓
            </span>
          )
        )}
      </div>
      {helper && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-4 text-[#808794]">
          {helper}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs leading-[18px] text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
export function SharedAuthButton({
  children,
  busy = false,
  pill = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  busy?: boolean;
  pill?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      aria-busy={busy}
      className={`flex h-[50px] w-full items-center justify-center gap-2 bg-primary px-5 text-[15px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60 ${pill ? "rounded-full" : "rounded-lg"}`}
    >
      {busy ? (
        <>
          <span
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden
          />
          Memeriksa…
        </>
      ) : (
        children
      )}
    </button>
  );
}
export function DemoNotice({ accounts = false }: { accounts?: boolean }) {
  return <aside aria-label="Informasi autentikasi" className="mt-6 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-[11px] leading-[17px] text-secondary">
    <p className="font-semibold text-primary">Autentikasi server · Data pembelajaran contoh</p>
    <p>Email/kata sandi diverifikasi di server. Data event dan asesmen pada halaman pembelajaran masih mock. Google OAuth belum tersedia.</p>
    {accounts && <p className="mt-1">Akun pengujian dan kata sandi diberikan administrator secara terpisah.</p>}
  </aside>;
}
export function GoogleMark() {
  return (
    <span
      aria-hidden
      className="grid size-[22px] place-items-center rounded-full bg-[#f2f5fa] text-sm font-bold text-[#4285f5]"
    >
      G
    </span>
  );
}
