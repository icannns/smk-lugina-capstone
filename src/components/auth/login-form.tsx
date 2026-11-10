"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { verifyDemoCredentials } from "@/lib/auth/session";
import {
  SharedAuthInput,
  SharedAuthButton,
  DemoNotice,
  GoogleMark,
} from "./shared-ui";
import { useMockNavigation } from "./use-mock-navigation";
export function LoginForm() {
  const [identifier, setIdentifier] = useState("siswa@example.com"),
    [password, setPassword] = useState(""),
    [remember, setRemember] = useState(true),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [message, setMessage] = useState("");
  const { busy, run, enter, google } = useMockNavigation();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const next: Record<string, string> = {};
    if (!identifier.trim())
      next.identifier = "Email atau username wajib diisi.";
    if (!password) next.password = "Kata sandi wajib diisi.";
    setErrors(next);
    if (Object.keys(next).length) {
      document
        .getElementById(next.identifier ? "login-email" : "login-password")
        ?.focus();
      return;
    }
    try {
      const account = await run(() =>
        verifyDemoCredentials(identifier, password),
      );
      if (account) enter(account, remember, () => setPassword(""));
      else if (account === null) {
        setErrors({
          credentials: "Email/username atau kata sandi demo tidak cocok.",
        });
        setPassword("");
      }
    } catch {
      setErrors({
        credentials: "Verifikasi lokal tidak dapat diselesaikan. Coba lagi.",
      });
    }
  }
  return (
    <section
      aria-label="Masuk bersama Guru dan Siswa"
      data-figma-node="370:1538"
    >
      <h1 className="text-[26px] font-bold leading-[31px]">Masuk ke Akun</h1>
      <p className="mt-[3px] text-sm leading-[17px] text-[#6b7280]">
        Selamat datang! Masuk untuk melanjutkan pengerjaan event dan milestone.
      </p>
      <form
        noValidate
        autoComplete="off"
        onSubmit={submit}
        aria-busy={busy}
        className="mt-[18px]"
      >
        <SharedAuthInput
          id="login-email"
          compact
          label="Email atau username"
          icon="email"
          value={identifier}
          disabled={busy}
          maxLength={120}
          required
          error={errors.identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setErrors({});
          }}
        />
        <div className="mt-[18px]">
          <SharedAuthInput
            id="login-password"
            compact
            label="Kata Sandi"
            icon="password"
            password
            value={password}
            disabled={busy}
            maxLength={128}
            required
            error={errors.password}
            labelAction={
              <button
                type="button"
                className="text-[13px] font-medium text-primary"
                onClick={() =>
                  setMessage(
                    "Pemulihan hanya simulasi; tidak ada email dikirim. Gunakan kredensial akun demo yang tercantum di bawah.",
                  )
                }
              >
                Lupa kata sandi?
              </button>
            }
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({});
            }}
          />
        </div>
        <label className="mt-[18px] flex min-h-[38px] items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mt-0.5 size-[18px] shrink-0 rounded accent-primary"
          />
          <span>
            Ingat saya
            <span className="block text-xs text-[#6b7280]">
              Simpan sesi login pada tab ini.
            </span>
          </span>
        </label>
        {errors.credentials && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {errors.credentials}
          </p>
        )}
        <div className="mt-[18px]">
          <SharedAuthButton type="submit" busy={busy}>
            Masuk
          </SharedAuthButton>
        </div>
      </form>
      <div className="mb-4 mt-[18px] flex h-5 items-center gap-4 text-[13px] text-[#9ca3af]">
        <span className="h-px flex-1 bg-line" />
        atau
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={google}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-300 text-sm font-semibold"
      >
        <GoogleMark />
        Masuk dengan Google
      </button>
      <p className="mt-[18px] text-center text-sm text-[#6b7280]">
        Belum memiliki akun?{" "}
        <Link href="/register" className="font-bold text-primary">
          Daftar Sekarang
        </Link>
      </p>
      {message && (
        <p
          role="status"
          className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-secondary"
        >
          {message}
        </p>
      )}
      <DemoNotice accounts />
    </section>
  );
}
