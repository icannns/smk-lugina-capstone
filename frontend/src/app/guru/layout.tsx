import type { ReactNode } from "react";
import { RoleGate } from "@/components/auth/role-gate";
export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <RoleGate role="teacher">{children}</RoleGate>;
}
