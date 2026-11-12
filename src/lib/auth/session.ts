"use client";
import { useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import type { AppAccount } from "./accounts";
let activeAccount: AppAccount | null = null;
export function sessionAccount(session: Session | null): AppAccount | null {
  const user = session?.user;
  if (!user?.id || !["TEACHER", "STUDENT"].includes(user.role)) return null;
  return { id: user.id, name: user.name, email: user.email ?? "", username: user.username ?? user.email ?? "",
    role: user.role === "TEACHER" ? "teacher" : "student", studentId: user.studentId, teacherId: user.teacherId, provider: "password" };
}
// In-memory identity supports existing synchronous mock business actions only.
// It never authorizes server requests and contains no password, JWT or cookie.
export function setClientIdentity(account: AppAccount | null) { activeAccount = account; }
export function currentAccount() { return activeAccount; }
export function useAppAuth() {
  const { data, status } = useSession();
  const account = useMemo(() => sessionAccount(data), [data]);
  return { account, ready: status !== "loading", warning: "" };
}
export async function logout() {
  activeAccount = null;
  // Full navigation clears cached protected UI; Auth.js performs CSRF-protected sign-out.
  await signOut({ callbackUrl: "/login" });
}
