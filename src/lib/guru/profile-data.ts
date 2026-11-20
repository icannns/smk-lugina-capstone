import { teacher } from "./dashboard-data";
import type { TeacherProfile } from "./teacher-types";
export const initialTeacherProfile: TeacherProfile = {
  name: teacher.name,
  email: "guru@example.com",
  phone: "0800-0000-0000",
  role: teacher.role,
};
export function profileIdentity(profile: TeacherProfile) {
  return {
    ...profile,
    initials: profile.name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase(),
  };
}
