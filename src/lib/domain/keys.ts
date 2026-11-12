/** Presentation keys only; database IDs and normalized foreign keys stay unchanged. */
export const enrollmentKey = (eventId: string, studentId: string) => [eventId, studentId].map(encodeURIComponent).join(":");
export const submissionKey = (eventId: string, studentId: string, milestoneId: string) => [eventId, studentId, milestoneId].map(encodeURIComponent).join(":");
