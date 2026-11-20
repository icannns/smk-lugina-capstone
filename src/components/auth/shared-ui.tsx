"use client";
import Image from "next/image";
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
          <svg
            aria-hidden="true"
            data-auth-input-icon={icon}
            className="pointer-events-none absolute left-4 size-[18px] text-[#667085]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {icon === "email" ? (
              <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>
            ) : icon === "password" ? (
              <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2" /></>
            ) : (
              <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /></>
            )}
          </svg>
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
            className="absolute inset-y-0 right-1.5 grid w-10 place-items-center rounded-lg hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span
              aria-hidden
              className="relative grid size-5 place-items-center"
            >
              <Image src="/auth/eye-login.svg" alt="" width={16} height={16} unoptimized />
              {visible && <span className="pointer-events-none absolute h-px w-[17px] -rotate-45 bg-[#4b5563] shadow-[0_1px_white]" />}
            </span>
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
    <p className="font-semibold text-primary">Autentikasi dan data pembelajaran</p>
    <p>Email dan kata sandi diverifikasi di server. Data event, keikutsertaan, tugas, dan asesmen internal tersimpan di database. Sebagian hasil asesmen eksternal masih berupa data contoh. Masuk dengan Google belum tersedia.</p>
    {accounts && <p className="mt-1">Untuk akun demo, gunakan kredensial yang disiapkan untuk lingkungan pengujian.</p>}
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
