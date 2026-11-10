import type { ReactNode } from "react";
// Each page applies RoleGate; layouts must keep route segments in the render tree.
export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
