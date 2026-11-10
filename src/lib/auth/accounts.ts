export type AccountRole = "teacher" | "student";
export type DemoAccount = Readonly<{
  id: string;
  username: string;
  email: string;
  name: string;
  role: AccountRole;
  studentId?: string;
  provider: "password" | "google";
}>;
// Public, fictional testing credentials. These constants are not production secrets.
export const DEMO_CREDENTIALS = [
  {
    id: "teacher-rina",
    username: "rina.guru",
    email: "guru@example.com",
    name: "Rina Marlina, S.Kom.",
    role: "teacher",
    provider: "password",
    password: "DemoGuru123!",
  },
  {
    id: "student-dimas",
    username: "dimas",
    email: "siswa@example.com",
    name: "Dimas Saputra",
    role: "student",
    studentId: "dimas",
    provider: "password",
    password: "DemoSiswa123!",
  },
  {
    id: "student-aisyah",
    username: "aisyah",
    email: "aisyah@example.com",
    name: "Aisyah Putri",
    role: "student",
    studentId: "aisyah",
    provider: "password",
    password: "DemoSiswa123!",
  },
] as const;
export const GOOGLE_ACCOUNT: DemoAccount = {
  id: "google-dimas",
  username: "dimas.google",
  email: "dimas.google@example.com",
  name: "Dimas Saputra",
  role: "student",
  studentId: "dimas",
  provider: "google",
};
export const accountHome = (account: DemoAccount) =>
  account.role === "teacher" ? "/guru/dashboard" : "/siswa/dashboard";
export function publicAccount(account: DemoAccount): DemoAccount {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    name: account.name,
    role: account.role,
    studentId: account.studentId,
    provider: account.provider,
  };
}
