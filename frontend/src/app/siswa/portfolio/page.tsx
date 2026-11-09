import { Suspense } from "react";
import { StudentPortfolio } from "@/components/siswa/portfolio/student-portfolio";
export default function Page() {
  return (
    <Suspense>
      <StudentPortfolio />
    </Suspense>
  );
}
