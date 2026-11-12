"use client";
import { useEffect } from "react";
import { useAppAuth } from "@/lib/auth/session";
import { useEventDraftStore } from "@/lib/guru/event-draft-store";
import { ensureStudentProfile } from "@/lib/siswa/student-actions";
import { studentProfileFor } from "@/lib/siswa/selectors";
export function useStudentIdentity() {
  const { account } = useAppAuth(),
    state = useEventDraftStore(),
    hasProfile = Boolean(state.studentUI.profiles[account?.studentId ?? ""]);
  useEffect(() => {
    if (account?.role === "student" && !hasProfile)
      ensureStudentProfile(account);
  }, [account?.id, account, hasProfile]);
  return account
    ? {
        ...studentProfileFor(account, state.learning, state.studentUI),
        studentId: account.studentId,
        role: account.role,
      }
    : {
        name: "Siswa Demo",
        email: "",
        phone: "",
        studentId: undefined,
        avatar: undefined,
        role: "student" as const,
      };
}
