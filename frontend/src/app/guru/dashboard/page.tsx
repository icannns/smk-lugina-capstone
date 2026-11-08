import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard Guru — Placeholder" };

export default function DashboardPlaceholder() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8">
        <p className="mb-3 text-xs font-semibold text-primary">
          PROTOTIPE · AUTENTIKASI SIMULASI
        </p>
        <h1 className="text-2xl font-semibold leading-8">Dashboard Guru</h1>
        <p role="status" className="mt-3 text-sm leading-6 text-secondary">
          Anda berada di tujuan login demo. Halaman ini hanya placeholder;
          konten Dashboard Guru belum diimplementasikan.
        </p>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Tidak ada akun yang dibuat, sesi autentikasi aktif, atau data
          pendaftaran yang disimpan. Rute ini dapat dibuka langsung untuk
          demonstrasi.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-10 items-center rounded-control bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    </main>
  );
}
