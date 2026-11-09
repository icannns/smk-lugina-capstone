import type { ReactNode } from "react";
import { RoleGate } from "@/components/auth/role-gate";
export default function StudentLayout({ children }: { children: ReactNode }) {
  return <RoleGate role="student">{children}</RoleGate>;
}
