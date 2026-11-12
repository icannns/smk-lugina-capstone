"use client";
import { useEffect, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { setClientIdentity, useAppAuth } from "@/lib/auth/session";
function IdentityBridge({ children }: { children: ReactNode }) {
  const { account } = useAppAuth();
  useEffect(() => { setClientIdentity(account); return () => setClientIdentity(null); }, [account]);
  useEffect(() => {
    // Discard legacy mock credentials/identity, preserving event and portfolio data.
    try { sessionStorage.removeItem("lugina.auth.demo.v1"); localStorage.removeItem("lugina.auth.demo.v1"); } catch { /* Storage may be disabled. */ }
  }, []);
  return children;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider refetchInterval={60} refetchOnWindowFocus>
    <IdentityBridge>{children}</IdentityBridge>
  </SessionProvider>;
}
