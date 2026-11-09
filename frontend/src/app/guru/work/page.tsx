import { Suspense } from "react";
import { StudentWork } from "@/components/guru/work/student-work";
export const metadata = { title: "Karya Siswa" };
export default function WorkPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8" aria-busy="true">
          Memuat karya…
        </main>
      }
    >
      <StudentWork />
    </Suspense>
  );
}
