import type { StudentSession } from "./student-types";

export const initialStudentReviews: StudentSession = {
  notes: {},
  reviews: {},
  reviewedAt: {},
};
export function parseStudentReviews(value: unknown): StudentSession {
  const object = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  if (!object(value)) return initialStudentReviews;
  const strings = (v: unknown): Record<string, string> =>
    Object.fromEntries(
      object(v)
        ? Object.entries(v).flatMap(([key, text]) =>
            typeof text === "string" ? [[key, text]] : [],
          )
        : [],
    );
  return {
    notes: strings(value.notes),
    reviews: Object.fromEntries(
      object(value.reviews)
        ? Object.entries(value.reviews).flatMap(([key, reviewed]) =>
            typeof reviewed === "boolean" ? [[key, reviewed]] : [],
          )
        : [],
    ),
    reviewedAt: strings(value.reviewedAt),
    reviewedResponses: Object.fromEntries(
      object(value.reviewedResponses)
        ? Object.entries(value.reviewedResponses).flatMap(([key, ids]) =>
            Array.isArray(ids) && ids.every((id) => typeof id === "string")
              ? [[key, ids]]
              : [],
          )
        : [],
    ),
  };
}
