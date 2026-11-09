import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lugina Survei - Adopsi Teknologi & Technostress",
  description: "Platform analitik survei dan visualisasi Word Cloud Technostress siswa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
