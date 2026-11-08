"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  emailError,
  nameError,
  passwordError,
} from "@/lib/auth-demo";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthHeading,
  GoogleButton,
  PrototypeNotice,
} from "./auth-ui";
import { useMockNavigation } from "./use-mock-navigation";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { busy, navigate } = useMockNavigation();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      name: nameError(name),
      email: emailError(email),
      password: passwordError(password),
      consent: consent
        ? undefined
        : "Centang persetujuan untuk mencoba pendaftaran demo.",
    };
    setErrors(nextErrors);
    const first = Object.entries(nextErrors).find(([, value]) => value);
    if (first) {
      document.getElementById(`register-${first[0]}`)?.focus();
      return;
    }
    navigate("/guru/dashboard", "submit", () => {
      setPassword("");
      setEmail("");
      setName("");
    });
  }

  function clearError(key: string) {
    setErrors((old) => ({ ...old, [key]: undefined }));
  }

  return (
    <section
      className="relative w-full max-w-96 lg:min-h-[580px]"
      aria-label="Daftar Guru"
      data-figma-node="291:15974"
    >
      <div className="flex flex-col gap-4">
        <AuthHeading title="Daftar Akun">
          Daftar menggunakan akun Google atau data umum Anda.
        </AuthHeading>
        <GoogleButton
          register
          loading={busy === "google"}
          disabled={!!busy}
          onClick={() =>
            navigate("/register/google", "google", () => setPassword(""))
          }
        />
        <AuthDivider register />
        <form
          noValidate
          autoComplete="off"
          onSubmit={submit}
          aria-busy={!!busy}
          className="flex flex-col gap-4"
        >
          <AuthField
            id="register-name"
            label="Nama Lengkap"
            required
            value={name}
            maxLength={100}
            placeholder="Masukkan nama lengkap Anda"
            disabled={!!busy}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
          />
          <AuthField
            id="register-email"
            label="Email"
            type="email"
            inputMode="email"
            required
            value={email}
            maxLength={120}
            placeholder="nama@example.com"
            disabled={!!busy}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
          />
          <AuthField
            id="register-password"
            label="Kata Sandi"
            password
            required
            value={password}
            maxLength={64}
            placeholder="Minimal 8 karakter"
            disabled={!!busy}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
          />
          <div>
            <label className="flex items-start gap-2 text-xs leading-5 text-secondary">
              <input
                id="register-consent"
                type="checkbox"
                checked={consent}
                disabled={!!busy}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  clearError("consent");
                }}
                aria-invalid={!!errors.consent}
                aria-describedby={errors.consent ? "consent-error" : undefined}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span>
                Saya menyetujui Ketentuan Layanan &amp; Kebijakan Privasi
              </span>
            </label>
            {errors.consent && (
              <p
                id="consent-error"
                role="alert"
                className="mt-1.5 text-xs text-danger"
              >
                {errors.consent}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3.5">
            <AuthButton
              type="submit"
              loading={busy === "submit"}
              disabled={!!busy}
              loadingText="Menyelesaikan simulasi…"
            >
              Daftar Sekarang
            </AuthButton>
            <p className="text-center text-sm leading-5 text-secondary">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Masuk
              </Link>
            </p>
          </div>
        </form>
      </div>
      <PrototypeNotice credentials />
      <button
        type="button"
        disabled={!!busy}
        className="mt-2 text-xs font-medium text-primary hover:underline"
        onClick={() => {
          setName("Guru Demo");
          setEmail(DEMO_EMAIL);
          setPassword(DEMO_PASSWORD);
          setErrors({});
        }}
      >
        Isi data contoh
      </button>
    </section>
  );
}
