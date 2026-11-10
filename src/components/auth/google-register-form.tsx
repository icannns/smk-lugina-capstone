"use client";
import { useState, type FormEvent } from "react";
import { GOOGLE_ACCOUNT } from "@/lib/auth/accounts";
import { prepareGoogleStudent } from "@/lib/auth/session";
import { nameError, phoneError } from "@/lib/auth-demo";
import { SharedAuthInput, SharedAuthButton, DemoNotice } from "./shared-ui";
import { useMockNavigation } from "./use-mock-navigation";
export function GoogleRegisterForm() {
  const [name, setName] = useState(GOOGLE_ACCOUNT.name),
    [phone, setPhone] = useState(""),
    [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { busy, enter } = useMockNavigation();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = { name: nameError(name), phone: phoneError(phone) };
    setErrors(next);
    if (next.name || next.phone) {
      document
        .getElementById(next.name ? "google-name" : "google-phone")
        ?.focus();
      return;
    }
    enter(prepareGoogleStudent(name, phone));
  }
  return (
    <section
      aria-label="Pendaftaran Google simulasi"
      data-figma-node="370:1724"
      className="lg:pt-2.5"
    >
      <h1 className="text-[32px] font-bold leading-[38px]">
        Lengkapi Data Akun
      </h1>
      <p className="mt-1 text-sm leading-[17px] text-[#6b7280]">
        Simulasi akun Google. Lengkapi nama contoh untuk profil dan dokumen
        penyelesaian belajar.
      </p>
      <div className="mt-3.5 flex h-20 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[#cce0fa] bg-[#f6faff] pl-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-base font-bold text-white">
            DS
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold">
              {GOOGLE_ACCOUNT.name}
            </p>
            <p className="break-all text-[13px] text-[#6b7280]">
              {GOOGLE_ACCOUNT.email}
            </p>
          </div>
        </div>
        <span className="flex h-full shrink-0 items-center bg-[#e0faed] px-2.5 text-xs font-bold text-[#10b981]">
          Simulasi ✓
        </span>
      </div>
      <form
        noValidate
        autoComplete="off"
        onSubmit={submit}
        className="mt-[25px]"
      >
        <SharedAuthInput
          id="google-name"
          label="Nama Lengkap Siswa *"
          value={name}
          required
          valid={Boolean(name) && !nameError(name)}
          maxLength={100}
          disabled={busy}
          error={errors.name}
          helper="Nama ini akan tercantum di profil portofolio dan sertifikat belajar contoh."
          onChange={(e) => {
            setName(e.target.value);
            setErrors((v) => ({ ...v, name: undefined }));
          }}
        />
        <div className="mt-3.5">
          <SharedAuthInput
            id="google-phone"
            label="Nomor WhatsApp (Opsional)"
            type="tel"
            inputMode="tel"
            value={phone}
            maxLength={18}
            disabled={busy}
            placeholder="0800-0000-0000"
            error={errors.phone}
            helper="Notifikasi hanya ilustrasi; prototipe tidak mengirim pesan WhatsApp."
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((v) => ({ ...v, phone: undefined }));
            }}
          />
        </div>
        <div className="mt-7">
          <SharedAuthButton type="submit" busy={busy} pill>
            Selesaikan Pendaftaran <span aria-hidden>→</span>
          </SharedAuthButton>
        </div>
      </form>
      <DemoNotice />
    </section>
  );
}
