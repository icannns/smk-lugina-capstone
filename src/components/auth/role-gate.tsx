"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppAuth } from "@/lib/auth/session";
import { accountHome, type AccountRole } from "@/lib/auth/accounts";
import { WorkspaceBoundary } from "./workspace-boundary";
import { SharedLoadingScreen } from "./auth-loading";
export function RoleGate({
  role,
  children,
}: {
  role: AccountRole;
  children: ReactNode;
}) {
  const { account, ready, warning } = useAppAuth(),
    router = useRouter(),
    pathname = usePathname(),
    prefix = role === "teacher" ? "/guru" : "/siswa",
    active = pathname.startsWith(prefix);
  useEffect(() => {
    if (!ready || !active) return;
    if (!account) router.replace("/login");
    else if (account.role !== role) router.replace(accountHome(account));
  }, [ready, active, account?.id, account?.role, account, role, router]);
  if (!active) return null;
  if (!ready || !account || account.role !== role)
    return <SharedLoadingScreen />;
  return (
    <>
      {warning && (
        <p
          role="alert"
          className="bg-amber-50 px-5 py-3 text-sm text-amber-800"
        >
          {warning}
        </p>
      )}
      <WorkspaceBoundary key={account.id} accountId={account.id}>{children}</WorkspaceBoundary>
    </>
  );
}
