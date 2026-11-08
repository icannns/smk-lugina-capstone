import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentManagement } from "@/components/guru/students/student-management";

export const metadata: Metadata = { title: "Pengelolaan Data Siswa" };

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <main
          aria-busy="true"
          className="grid min-h-dvh place-items-center bg-gray-50 text-sm text-secondary"
        >
          Memuat Pengelolaan Data Siswa…
        </main>
      }
    >
      <StudentManagement />
    </Suspense>
  );
}
