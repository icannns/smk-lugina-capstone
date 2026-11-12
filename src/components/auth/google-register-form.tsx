"use client";
import { useState, type FormEvent } from "react";
import { nameError, phoneError } from "@/lib/auth-demo";
import { SharedAuthInput, SharedAuthButton, DemoNotice } from "./shared-ui";
import { useAuthNavigation } from "./use-auth-navigation";
export function GoogleRegisterForm() {
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { busy } = useAuthNavigation();
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
    setErrors({ unavailable: "Google OAuth belum tersedia. Gunakan pendaftaran email atau hubungi administrator." });
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
        Pratinjau desain pendaftaran Google. OAuth belum tersedia; form ini
        tidak membuat akun atau sesi login.
      </p>
      <div className="mt-3.5 flex h-20 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[#cce0fa] bg-[#f6faff] pl-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-base font-bold text-white">
            G
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold">
              Akun Google belum terhubung
            </p>
            <p className="break-all text-[13px] text-[#6b7280]">
              Belum ada identitas terverifikasi
            </p>
          </div>
        </div>
        <span className="flex h-full shrink-0 items-center bg-[#e0faed] px-2.5 text-xs font-bold text-[#10b981]">
          Belum tersedia
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
      {errors.unavailable && <p role="status" className="mt-3 text-sm text-secondary">{errors.unavailable}</p>}
      <DemoNotice />
    </section>
  );
}
