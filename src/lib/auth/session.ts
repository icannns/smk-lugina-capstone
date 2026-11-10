"use client";
import { useSyncExternalStore } from "react";
import {
  DEMO_CREDENTIALS,
  GOOGLE_ACCOUNT,
  publicAccount,
  type DemoAccount,
} from "./accounts";
export const AUTH_STORAGE_KEY = "lugina.auth.demo.v1";
type RegisteredStudent = {
  id: string;
  username: string;
  email: string;
  name: string;
  studentId: string;
  salt: string;
  passwordDigest: string;
};
type AuthState = {
  activeId: string | null;
  pendingId: string | null;
  remember: boolean;
  registered: Record<string, RegisteredStudent>;
  googleProfile: { name: string; phone: string };
  warning: string;
};
const initial: AuthState = {
  activeId: null,
  pendingId: null,
  remember: true,
  registered: {},
  googleProfile: { name: GOOGLE_ACCOUNT.name, phone: "" },
  warning: "",
};
let snapshot = initial,
  initialized = false;
const listeners = new Set<() => void>(),
  isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
function getSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const value: unknown = JSON.parse(raw);
        if (!isRecord(value) || value.version !== 1)
          throw Error("Invalid demo session");
        const registered: Record<string, RegisteredStudent> = {};
        if (isRecord(value.registered))
          for (const [id, item] of Object.entries(value.registered)) {
            if (
              !isRecord(item) ||
              !id.startsWith("registered-") ||
              item.id !== id ||
              typeof item.name !== "string" ||
              typeof item.email !== "string" ||
              !/^[^\s@]+@example\.com$/i.test(item.email) ||
              typeof item.username !== "string" ||
              typeof item.studentId !== "string" ||
              typeof item.salt !== "string" ||
              typeof item.passwordDigest !== "string" ||
              !/^[a-f0-9]{64}$/.test(item.passwordDigest)
            )
              continue;
            registered[id] = {
              id,
              name: item.name.slice(0, 100),
              email: item.email,
              username: item.username,
              studentId: item.studentId,
              salt: item.salt,
              passwordDigest: item.passwordDigest,
            };
          }
        const google = isRecord(value.googleProfile) ? value.googleProfile : {};
        snapshot = {
          activeId: typeof value.activeId === "string" ? value.activeId : null,
          pendingId:
            typeof value.pendingId === "string" ? value.pendingId : null,
          remember: value.remember !== false,
          registered,
          googleProfile: {
            name:
              typeof google.name === "string"
                ? google.name.slice(0, 100)
                : GOOGLE_ACCOUNT.name,
            phone:
              typeof google.phone === "string" ? google.phone.slice(0, 30) : "",
          },
          warning: "",
        };
      }
    } catch {
      snapshot = {
        ...initial,
        warning:
          "Sesi demo tidak dapat dibaca. Silakan masuk kembali; data modul Guru tetap dipertahankan.",
      };
    }
  }
  return snapshot;
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function update(next: AuthState) {
  snapshot = { ...next, warning: "" };
  try {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        activeId: next.remember ? next.activeId : null,
        pendingId: next.remember ? next.pendingId : null,
        remember: next.remember,
        registered: next.registered,
        googleProfile: next.googleProfile,
      }),
    );
  } catch {
    snapshot = {
      ...next,
      warning:
        "Penyimpanan sesi tidak tersedia. Akun dan login contoh hanya aktif di memori halaman ini.",
    };
  }
  listeners.forEach((fn) => fn());
}
const subscribeReady = () => () => {};
export function useDemoAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => initial),
    ready = useSyncExternalStore(
      subscribeReady,
      () => true,
      () => false,
    );
  return {
    ...state,
    ready,
    account: accountById(state.activeId, state),
    pending: accountById(state.pendingId, state),
  };
}
function accountById(id: string | null, state: AuthState): DemoAccount | null {
  if (!id) return null;
  const fixed = DEMO_CREDENTIALS.find((a) => a.id === id);
  if (fixed) return publicAccount(fixed);
  if (id === GOOGLE_ACCOUNT.id)
    return { ...GOOGLE_ACCOUNT, name: state.googleProfile.name };
  const student = Object.hasOwn(state.registered, id)
    ? state.registered[id]
    : undefined;
  return student
    ? {
        id: student.id,
        username: student.username,
        email: student.email,
        name: student.name,
        studentId: student.studentId,
        role: "student",
        provider: "password",
      }
    : null;
}
async function digest(password: string, salt: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${password}`),
  );
  return Array.from(new Uint8Array(bytes), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
export async function verifyDemoCredentials(
  identifier: string,
  password: string,
): Promise<DemoAccount | null> {
  const state = getSnapshot(),
    key = identifier.trim().toLowerCase(),
    fixed = DEMO_CREDENTIALS.find(
      (a) => a.email.toLowerCase() === key || a.username === key,
    );
  if (fixed) return fixed.password === password ? publicAccount(fixed) : null;
  const student = Object.values(state.registered).find(
    (a) => a.email.toLowerCase() === key || a.username.toLowerCase() === key,
  );
  if (!student) return null;
  return (await digest(password, student.salt)) === student.passwordDigest
    ? accountById(student.id, state)
    : null;
}
export function beginDemoSession(account: DemoAccount, remember = true) {
  const state = getSnapshot();
  if (!accountById(account.id, state)) return false;
  update({ ...state, activeId: null, pendingId: account.id, remember });
  return true;
}
export function completeDemoSession() {
  const state = getSnapshot(),
    account = accountById(state.pendingId, state);
  if (!account) return null;
  update({ ...state, activeId: account.id, pendingId: null });
  return account;
}
export function logoutDemo() {
  const state = getSnapshot();
  update({ ...state, activeId: null, pendingId: null });
}
export function currentDemoAccount() {
  const state = getSnapshot();
  return accountById(state.activeId, state);
}
export async function registerStudent({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<{ account?: DemoAccount; error?: string }> {
  const state = getSnapshot(),
    key = email.trim().toLowerCase();
  if (!/^[^\s@]+@example\.com$/i.test(key) || !name.trim())
    return { error: "Gunakan nama dan email fiktif @example.com." };
  if (
    DEMO_CREDENTIALS.some((a) => a.email === key) ||
    key === GOOGLE_ACCOUNT.email ||
    Object.values(state.registered).some((a) => a.email.toLowerCase() === key)
  )
    return {
      error:
        "Email sudah digunakan oleh akun demo. Gunakan email contoh lainnya.",
    };
  const id = `registered-${crypto.randomUUID()}`,
    salt = crypto.randomUUID(),
    passwordDigest = await digest(password, salt);
  const latest = getSnapshot();
  if (
    Object.values(latest.registered).some((a) => a.email.toLowerCase() === key)
  )
    return { error: "Email sudah digunakan oleh akun demo." };
  const student: RegisteredStudent = {
    id,
    username: key,
    email: key,
    name: name.trim(),
    studentId: id,
    salt,
    passwordDigest,
  };
  update({ ...latest, registered: { ...latest.registered, [id]: student } });
  return { account: accountById(id, getSnapshot())! };
}
export function prepareGoogleStudent(name: string, phone: string) {
  const state = getSnapshot();
  update({
    ...state,
    googleProfile: { name: name.trim(), phone: phone.trim() },
  });
  return accountById(GOOGLE_ACCOUNT.id, getSnapshot())!;
}
