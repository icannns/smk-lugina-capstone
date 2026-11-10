"use client";

import Image from "next/image";
import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/auth-demo";

export function AuthHeading({
  title,
  children,
  login = false,
}: {
  title: string;
  children: ReactNode;
  login?: boolean;
}) {
  return (
    <header>
      <h1
        className={`text-[30px] font-semibold ${login ? "leading-[45px] tracking-[-0.75px]" : "leading-10"}`}
      >
        {title}
      </h1>
      <p
        className={`text-sm leading-5 text-secondary ${login ? "mt-1" : "mt-1.5"}`}
      >
        {children}
      </p>
    </header>
  );
}

export function PrototypeNotice({
  credentials = false,
}: {
  credentials?: boolean;
}) {
  return (
    <aside
      aria-label="Informasi prototipe"
      className="auth-prototype mt-6 rounded-control border border-blue-100 bg-primary-soft px-3 py-2.5 text-xs leading-[18px] text-secondary"
    >
      <p className="font-semibold text-primary">
        Prototipe · Simulasi autentikasi
      </p>
      <p>
        Login dan Google hanya simulasi. Gunakan data fiktif; jangan masukkan
        kredensial asli. Data tidak dikirim atau disimpan.
      </p>
      {credentials && (
        <p className="mt-1 break-words">
          Demo: <span className="font-medium">{DEMO_EMAIL}</span>
          <br />
          Kata sandi: <span className="font-medium">{DEMO_PASSWORD}</span>
        </p>
      )}
    </aside>
  );
}

export function AuthButton({
  children,
  loading = false,
  loadingText = "Memproses…",
  compact = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  compact?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      aria-busy={loading}
      className={`flex ${compact ? "h-10" : "h-11"} w-full items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-medium leading-5 text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {loading ? loadingText : children}
    </button>
  );
}

export function GoogleButton({
  register = false,
  loading,
  disabled,
  onClick,
}: {
  register?: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={loading}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-control border border-line bg-white px-4 text-sm font-medium leading-5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Image
        src={`/auth/google-${register ? "register" : "login"}.svg`}
        alt=""
        width={18}
        height={18}
      />
      {loading
        ? "Menyiapkan simulasi…"
        : `${register ? "Daftar" : "Masuk"} dengan Google`}
    </button>
  );
}

export function AuthDivider({ register = false }: { register?: boolean }) {
  return (
    <div className="flex h-[18px] items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-line" />
      <span>atau {register ? "daftar" : "masuk"} dengan email</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string;
  password?: boolean;
  compact?: boolean;
};

export function AuthField({
  id,
  label,
  error,
  password = false,
  compact = false,
  ...props
}: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium leading-5">
        {label}
        {props.required && (
          <span className={compact ? "text-danger" : ""}> *</span>
        )}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={
            password ? (visible ? "text" : "password") : (props.type ?? "text")
          }
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-control border bg-white px-[13px] text-sm leading-5 placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 ${compact ? "h-10" : "h-11"} ${password ? "pr-11" : ""} ${error ? "border-danger" : "border-line"}`}
        />
        {password && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            disabled={props.disabled}
            aria-label={
              visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={visible}
            className="absolute inset-y-0 right-1 flex w-9 items-center justify-center rounded-lg hover:bg-gray-50"
          >
            <Image
              src={`/auth/eye-${compact ? "login" : "register"}.svg`}
              alt=""
              width={compact ? 16 : 20}
              height={compact ? 16 : 20}
            />
          </button>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs leading-[18px] text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-control border border-blue-100 bg-primary-soft p-3 text-xs leading-[18px] text-secondary"
    >
      {children}
    </p>
  );
}
