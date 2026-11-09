import { Suspense } from "react";
import { RubricManagement } from "@/components/guru/rubrics/rubric-management";
export const metadata = { title: "Kelola Rubrik" };
export default function RubricsPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8 text-sm text-secondary" aria-busy="true">
          Memuat rubrik…
        </main>
      }
    >
      <RubricManagement />
    </Suspense>
  );
}
