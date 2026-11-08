"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { GOOGLE_DEMO, nameError, phoneError } from "@/lib/auth-demo";
import {
  AuthButton,
  AuthField,
  AuthHeading,
  FormMessage,
  PrototypeNotice,
} from "./auth-ui";
import { useMockNavigation } from "./use-mock-navigation";

export function GoogleRegisterForm() {
  const [name, setName] = useState(GOOGLE_DEMO.name);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [message, setMessage] = useState("");
  const { busy, navigate } = useMockNavigation();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = { name: nameError(name), phone: phoneError(phone) };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.phone) {
      document
        .getElementById(nextErrors.name ? "google-name" : "google-phone")
        ?.focus();
      return;
    }
    navigate("/guru/dashboard", "submit", () => {
      setName(GOOGLE_DEMO.name);
      setPhone("");
    });
  }
  return (
    <section
      className="relative w-full max-w-96 lg:min-h-[520px]"
      aria-label="Pendaftaran Google simulasi"
      data-figma-node="291:16035"
    >
      <div className="flex flex-col gap-4">
        <AuthHeading title="Lengkapi Data Akun">
          Akun Google berhasil terhubung. Konfirmasi data umum Anda.
        </AuthHeading>
        <div className="flex min-h-15 items-center gap-3 overflow-hidden rounded-control border border-blue-200 bg-[#f2f8ff] px-3.5 py-2.5 lg:h-15">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            AR
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{GOOGLE_DEMO.name}</p>
            <p className="break-all text-xs text-secondary">
              {GOOGLE_DEMO.email}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-[5px] rounded-md bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700 lg:h-[100px]">
            <span className="size-1.5 rounded-full bg-green-600" />
            Terhubung
          </span>
        </div>
        <form
          noValidate
          autoComplete="off"
          onSubmit={submit}
          aria-busy={!!busy}
          className="flex flex-col gap-4"
        >
          <AuthField
            id="google-name"
            label="Nama Lengkap"
            required
            value={name}
            maxLength={100}
            disabled={!!busy}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((old) => ({ ...old, name: undefined }));
            }}
          />
          <AuthField
            id="google-phone"
            label="Nomor WhatsApp (Opsional)"
            type="tel"
            inputMode="tel"
            value={phone}
            maxLength={18}
            placeholder="08xxxxxxxxxx"
            disabled={!!busy}
            error={errors.phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((old) => ({ ...old, phone: undefined }));
            }}
          />
          <div className="flex flex-col gap-3.5">
            <AuthButton
              type="submit"
              disabled={!!busy}
              loading={busy === "submit"}
              loadingText="Menyelesaikan simulasi…"
            >
              Selesaikan Pendaftaran
            </AuthButton>
            <button
              type="button"
              disabled={!!busy}
              className="min-h-5 text-[13px] font-medium text-primary hover:underline"
              onClick={() => {
                setMessage(
                  "Simulasi Google memakai satu akun contoh. Tidak ada koneksi ke Google; tidak ada akun lain yang diakses.",
                );
                setName(GOOGLE_DEMO.name);
                setPhone("");
                setErrors({});
              }}
            >
              Gunakan akun Google lain
            </button>
            <Link
              href="/login"
              className="text-center text-xs leading-[18px] text-secondary hover:underline"
            >
              Batal &amp; kembali ke Halaman Masuk
            </Link>
          </div>
        </form>
        {message && <FormMessage>{message}</FormMessage>}
      </div>
      <PrototypeNotice />
    </section>
  );
}
