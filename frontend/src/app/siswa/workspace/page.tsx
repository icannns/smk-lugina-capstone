import { Suspense } from "react";
import { StudentWorkspace } from "@/components/siswa/workspace/student-workspace";
export default function Page() {
  return (
    <Suspense>
      <StudentWorkspace />
    </Suspense>
  );
}
