"use client";
import { useState, type FormEvent } from "react";
import { emailError, nameError } from "@/lib/auth-demo";
import {
  passwordRules,
  registrationPasswordError,
} from "@/lib/auth/validation";
import { registerStudent } from "@/lib/auth/session";
import {
  SharedAuthInput,
  SharedAuthButton,
  DemoNotice,
  GoogleMark,
} from "./shared-ui";
import { useMockNavigation } from "./use-mock-navigation";
export function RegisterForm() {
  const [name, setName] = useState("Dimas Saputra"),
    [email, setEmail] = useState("dimas.baru@example.com"),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { busy, run, enter, google } = useMockNavigation(),
    rules = passwordRules(password);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = {
      name: nameError(name),
      email: emailError(email),
      password: registrationPasswordError(password),
      confirm:
        confirm && confirm === password
          ? undefined
          : "Konfirmasi kata sandi harus sama.",
    };
    setErrors(next);
    const first = Object.entries(next).find(([, v]) => v);
    if (first) {
      document.getElementById("register-" + first[0])?.focus();
      return;
    }
    try {
      const result = await run(() =>
        registerStudent({ name, email, password }),
      );
      if (!result) return;
      if (result.error) {
        setErrors({ email: result.error });
        return;
      }
      if (result.account)
        enter(result.account, true, () => {
          setPassword("");
          setConfirm("");
        });
    } catch {
      setErrors({
        save: "Pendaftaran lokal tidak dapat diselesaikan. Coba lagi.",
      });
    }
  }
  return (
    <section aria-label="Pendaftaran akun bersama" data-figma-node="370:1651">
      <h1 className="text-[32px] font-bold leading-[38px]">
        Daftar Akun Siswa
      </h1>
      <p className="mt-1 text-sm leading-[17px] text-[#6b7280]">
        Mulai perjalanan belajar berbasis project dan bangun portofoliomu di SMK
        Lugina.
      </p>
      <form
        noValidate
        autoComplete="off"
        onSubmit={submit}
        aria-busy={busy}
        className="mt-[22px]"
      >
        <SharedAuthInput
          id="register-name"
          label="Nama Lengkap"
          icon="name"
          required
          value={name}
          valid={Boolean(name.trim()) && !nameError(name)}
          error={errors.name}
          placeholder="Nama lengkap contoh"
          maxLength={100}
          disabled={busy}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((v) => ({ ...v, name: undefined }));
          }}
        />
        <div className="mt-3">
          <SharedAuthInput
            id="register-email"
            label="Email"
            icon="email"
            type="email"
            required
            value={email}
            valid={Boolean(email) && !emailError(email)}
            error={errors.email}
            placeholder="nama@example.com"
            maxLength={120}
            disabled={busy}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((v) => ({ ...v, email: undefined }));
            }}
          />
        </div>
        <div className="mt-3">
          <SharedAuthInput
            id="register-password"
            label="Kata Sandi"
            icon="password"
            password
            required
            value={password}
            error={errors.password}
            placeholder="Kata sandi demo"
            maxLength={128}
            disabled={busy}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((v) => ({ ...v, password: undefined }));
            }}
          />
        </div>
        <ul
          aria-label="Persyaratan kata sandi"
          className="ml-2 mt-2 space-y-1.5 text-xs leading-[18px]"
        >
          {[
            "Minimal 8 karakter",
            "Mengandung minimal 1 angka (0-9) atau simbol",
            "Mengandung huruf kecil (a-z) dan huruf besar (A-Z)",
          ].map((label, i) => (
            <li
              key={label}
              className={rules[i] ? "text-[#10b981]" : "text-[#808794]"}
            >
              <span aria-hidden className="mr-2">
                {rules[i] ? "✓" : "○"}
              </span>
              {label}
            </li>
          ))}
        </ul>
        <div className="mt-[22px]">
          <SharedAuthInput
            id="register-confirm"
            label="Konfirmasi Kata Sandi"
            icon="password"
            password
            required
            value={confirm}
            error={errors.confirm}
            placeholder="Ulangi kata sandi demo"
            maxLength={128}
            disabled={busy}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((v) => ({ ...v, confirm: undefined }));
            }}
          />
        </div>
        {errors.save && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {errors.save}
          </p>
        )}
        <div className="mt-7 flex h-[52px] items-center gap-4">
          <div className="min-w-0 flex-1 sm:max-w-[260px]">
            <SharedAuthButton type="submit" busy={busy} pill>
              Daftar Sekarang <span aria-hidden>→</span>
            </SharedAuthButton>
          </div>
          <span className="text-[13px] text-[#9ca3af]">atau</span>
          <button
            type="button"
            aria-label="Daftar dengan Google"
            disabled={busy}
            onClick={google}
            className="grid size-12 shrink-0 place-items-center rounded-full border border-gray-300"
          >
            <GoogleMark />
          </button>
        </div>
      </form>
      <DemoNotice />
      <p className="mt-2 text-xs text-secondary">
        Pendaftaran publik selalu membuat akun Siswa contoh. Akun Guru
        disediakan khusus dalam daftar demo.
      </p>
    </section>
  );
}
