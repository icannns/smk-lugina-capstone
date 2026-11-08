"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  emailError,
  passwordError,
} from "@/lib/auth-demo";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthHeading,
  FormMessage,
  GoogleButton,
  PrototypeNotice,
} from "./auth-ui";
import { useMockNavigation } from "./use-mock-navigation";

export function LoginForm() {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [message, setMessage] = useState("");
  const { busy, navigate } = useMockNavigation();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      email: emailError(email),
      password: passwordError(password),
    };
    if (!nextErrors.email && email.trim().toLowerCase() !== DEMO_EMAIL)
      nextErrors.email = `Akun demo tidak ditemukan. Gunakan ${DEMO_EMAIL}.`;
    setErrors(nextErrors);
    setMessage("");
    if (Object.values(nextErrors).some(Boolean)) {
      const field = nextErrors.email ? "login-email" : "login-password";
      document.getElementById(field)?.focus();
      return;
    }
    navigate("/guru/dashboard", "submit", () => setPassword(""));
  }

  return (
    <section
      className="relative w-full max-w-96 lg:min-h-[500px]"
      aria-label="Masuk Guru"
      data-figma-node="291:15929"
    >
      <AuthHeading title="Masuk" login>
        Masuk dengan akun Google atau email Anda.
      </AuthHeading>
      <div className="mt-0">
        <GoogleButton
          loading={busy === "google"}
          disabled={!!busy}
          onClick={() =>
            navigate("/register/google", "google", () => setPassword(""))
          }
        />
        <AuthDivider />
      </div>
      <form noValidate autoComplete="off" onSubmit={submit} aria-busy={!!busy}>
        <div className="mt-6">
          <AuthField
            id="login-email"
            label="Email"
            type="email"
            inputMode="email"
            compact
            required
            value={email}
            maxLength={120}
            disabled={!!busy}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((old) => ({ ...old, email: undefined }));
            }}
          />
        </div>
        <div className="mt-6">
          <AuthField
            id="login-password"
            label="Kata Sandi"
            password
            compact
            required
            value={password}
            maxLength={64}
            disabled={!!busy}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((old) => ({ ...old, password: undefined }));
            }}
          />
        </div>
        <div className="py-4">
          <AuthButton
            type="submit"
            compact
            loading={busy === "submit"}
            disabled={!!busy}
            loadingText="Masuk ke demo…"
            className="shadow-[0_1px_3px_#155dfc33]"
          >
            Masuk
          </AuthButton>
        </div>
      </form>
      <div className="flex flex-col items-center text-sm leading-5">
        <button
          type="button"
          disabled={!!busy}
          className="font-medium text-[#1447e6] hover:underline"
          onClick={() =>
            setMessage(
              `Simulasi pemulihan: tidak ada email yang dikirim. Gunakan kata sandi demo ${DEMO_PASSWORD}.`,
            )
          }
        >
          Lupa Kata Sandi?
        </button>
        <p className="text-center text-secondary">
          Belum memiliki akun?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Daftar Sekarang
          </Link>
        </p>
      </div>
      {message && (
        <div className="mt-4">
          <FormMessage>{message}</FormMessage>
        </div>
      )}
      <PrototypeNotice credentials />
    </section>
  );
}
