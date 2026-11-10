import type { Metadata } from "next";
import { GoogleRegisterForm } from "@/components/auth/google-register-form";
export const metadata: Metadata = { title: "Lengkapi Data Akun" };
export default function GoogleRegisterPage() {
  return <GoogleRegisterForm />;
}
