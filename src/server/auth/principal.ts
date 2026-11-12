import type { Prisma } from "../../generated/prisma/client";
export const principalSelect = {
  id: true, name: true, email: true, username: true, role: true,
  student: { select: { id: true } }, teacher: { select: { id: true } },
} satisfies Prisma.UserSelect;
export type Principal = Prisma.UserGetPayload<{ select: typeof principalSelect }>;
export function validProfile(user: Principal) {
  return user.role === "TEACHER" ? Boolean(user.teacher && !user.student) : Boolean(user.student && !user.teacher);
}
