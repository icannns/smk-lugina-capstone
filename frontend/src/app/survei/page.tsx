import SurveyResultsContainer from "@/components/survey-results/SurveyResultsContainer";

export const metadata = { title: "Hasil Survei & Analitik Technostress" };

export default function DirectSurveyPage() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
        <SurveyResultsContainer />
      </main>
    </div>
  );
}
