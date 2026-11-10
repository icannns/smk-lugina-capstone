import { Suspense } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { TeacherPage } from "@/components/guru/teacher-page";
import SurveyResultsContainer from "@/components/survey-results/SurveyResultsContainer";

export const metadata = { title: "Hasil Survei & Analitik Technostress" };

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8 text-sm" aria-busy="true">
          Memuat hasil survei & analitik…
        </main>
      }
    >
      <RoleGate role="teacher">
        <TeacherPage frame="291:20395" activePage="results">
          <SurveyResultsContainer />
        </TeacherPage>
      </RoleGate>
    </Suspense>
  );
}
