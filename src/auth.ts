import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
import { getDatabase } from "@/server/db";
import { verifyPassword } from "@/server/auth/password";
import { loginInput } from "@/server/auth/validation";
import { consumeAuthLimit, clearSuccessfulLoginLimit } from "@/server/auth/rate-limit";
import { principalSelect, validProfile } from "@/server/auth/principal";

class RateLimited extends CredentialsSignin { code = "rate_limited"; }
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32 || /REPLACE|CHANGEME/i.test(process.env.AUTH_SECRET))
    throw new Error("AUTH_SECRET must be configured securely (at least 32 characters).");
  return {
    session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
    pages: { signIn: "/login", error: "/login" },
    providers: [Credentials({
      credentials: { identifier: {}, password: {}, remember: {} },
      async authorize(credentials, request) {
        const input = loginInput(credentials);
        if (!input) return null;
        if (!await consumeAuthLimit("login", input.identifier, request)) throw new RateLimited();
        const database = getDatabase();
        const user = await database.user.findFirst({
          where: input.identifier.includes("@") ? { email: input.identifier } : { username: input.identifier },
          select: { ...principalSelect, passwordHash: true, disabledAt: true },
        });
        const verified = await verifyPassword(input.password, user?.passwordHash ?? null);
        if (!user || !verified || user.disabledAt || !validProfile(user)) return null;
        await clearSuccessfulLoginLimit(input.identifier);
        const grant = await database.loginSession.create({ data: {
          userId: user.id, expiresAt: new Date(Date.now() + (input.remember ? 8 : 1) * 60 * 60 * 1000),
        } });
        return { id: user.id, authSessionId: grant.id };
      },
    })],
    callbacks: {
      authorized({ auth: session, request }) {
        const user = session?.user;
        if (!user) return NextResponse.redirect(new URL("/login", request.url));
        const teacherRoute = request.nextUrl.pathname.startsWith("/guru");
        if ((teacherRoute && user.role !== "TEACHER") || (!teacherRoute && user.role !== "STUDENT"))
          return NextResponse.redirect(new URL(user.role === "TEACHER" ? "/guru/dashboard" : "/siswa/dashboard", request.url));
        return true;
      },
      async jwt({ token, user }) {
        if (user) token.authSessionId = user.authSessionId;
        if (!token.authSessionId) return null;
        const grant = await getDatabase().loginSession.findUnique({
          where: { id: token.authSessionId },
          include: { user: { select: { ...principalSelect, disabledAt: true, passwordChangedAt: true } } },
        });
        if (grant && !grant.revokedAt && (grant.user.disabledAt ||
            (grant.user.passwordChangedAt && grant.createdAt < grant.user.passwordChangedAt)))
          await getDatabase().loginSession.updateMany({ where: { id: grant.id, revokedAt: null }, data: { revokedAt: new Date() } });
        if (!grant || grant.revokedAt || grant.expiresAt.getTime() <= Date.now() ||
            grant.user.disabledAt || !validProfile(grant.user) ||
            (grant.user.passwordChangedAt && grant.createdAt < grant.user.passwordChangedAt)) return null;
        // Never trust client session.update payloads or role claims supplied by the browser.
        token.sub = grant.user.id;
        token.principal = { id: grant.user.id, name: grant.user.name, email: grant.user.email ?? "",
          username: grant.user.username, role: grant.user.role,
          studentId: grant.user.student?.id, teacherId: grant.user.teacher?.id };
        token.absoluteExpiresAt = grant.expiresAt.toISOString();
        return token;
      },
      async session({ session, token }) {
        session.user = { ...session.user, ...token.principal };
        session.expires = token.absoluteExpiresAt! as typeof session.expires;
        return session;
      },
    },
    events: {
      async signOut(message) {
        if ("token" in message && message.token?.authSessionId)
          await getDatabase().loginSession.updateMany({ where: { id: message.token.authSessionId, revokedAt: null }, data: { revokedAt: new Date() } });
      },
    },
    logger: { error() { console.error("Authentication request failed; sensitive details suppressed."); } },
  };
});
