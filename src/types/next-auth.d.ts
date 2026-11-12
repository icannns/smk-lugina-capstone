import "next-auth";
import "next-auth/jwt";
type AuthIdentity = {
  id: string; name: string; email: string; username: string | null;
  role: "TEACHER" | "STUDENT"; studentId?: string; teacherId?: string;
};
declare module "next-auth" {
  interface User { authSessionId?: string }
  interface Session { user: AuthIdentity }
}
declare module "next-auth/jwt" {
  interface JWT { authSessionId?: string; principal?: AuthIdentity; absoluteExpiresAt?: string }
}
