export type AccountRole = "teacher" | "student";
export type AppAccount = Readonly<{
  id: string;
  username: string;
  email: string;
  name: string;
  role: AccountRole;
  studentId?: string;
  teacherId?: string;
  provider: "password";
}>;
export const accountHome = (account: Pick<AppAccount, "role">) =>
  account.role === "teacher" ? "/guru/dashboard" : "/siswa/dashboard";
