BEGIN;
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "teacherNote" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "certificateConfig" JSONB,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wizardState" JSONB;

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "attachments" JSONB;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "contactEmail" VARCHAR(320),
ADD COLUMN     "displayRole" VARCHAR(80);

-- AlterTable
ALTER TABLE "SubmissionVersion" ADD COLUMN     "requestId" VARCHAR(191);

-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "contactEmail" VARCHAR(320),
ADD COLUMN     "displayRole" VARCHAR(80);

-- CreateTable
CREATE TABLE "SubmissionDraft" (
    "eventId" VARCHAR(191) NOT NULL,
    "studentId" VARCHAR(191) NOT NULL,
    "milestoneId" VARCHAR(191) NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "files" JSONB NOT NULL,
    "surveyDraft" JSONB,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SubmissionDraft_pkey" PRIMARY KEY ("eventId","studentId","milestoneId")
);

-- CreateTable
CREATE TABLE "MilestoneCriterion" (
    "eventId" VARCHAR(191) NOT NULL,
    "milestoneId" VARCHAR(191) NOT NULL,
    "rubricVersionId" VARCHAR(191) NOT NULL,
    "criterionId" VARCHAR(191) NOT NULL,

    CONSTRAINT "MilestoneCriterion_pkey" PRIMARY KEY ("eventId","milestoneId","criterionId")
);

-- CreateTable
CREATE TABLE "PrototypeCertificateClaim" (
    "id" VARCHAR(191) NOT NULL,
    "eventId" VARCHAR(191) NOT NULL,
    "studentId" VARCHAR(191) NOT NULL,
    "studentName" VARCHAR(120) NOT NULL,
    "score" INTEGER NOT NULL,
    "claimedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "downloadedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PrototypeCertificateClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MilestoneCriterion_rubricVersionId_criterionId_idx" ON "MilestoneCriterion"("rubricVersionId", "criterionId");

-- CreateIndex
CREATE INDEX "PrototypeCertificateClaim_studentId_idx" ON "PrototypeCertificateClaim"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PrototypeCertificateClaim_eventId_studentId_key" ON "PrototypeCertificateClaim"("eventId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVersion_requestId_key" ON "SubmissionVersion"("requestId");

-- AddForeignKey
ALTER TABLE "SubmissionDraft" ADD CONSTRAINT "SubmissionDraft_eventId_studentId_fkey" FOREIGN KEY ("eventId", "studentId") REFERENCES "Enrollment"("eventId", "studentId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubmissionDraft" ADD CONSTRAINT "SubmissionDraft_eventId_milestoneId_fkey" FOREIGN KEY ("eventId", "milestoneId") REFERENCES "Milestone"("eventId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MilestoneCriterion" ADD CONSTRAINT "MilestoneCriterion_eventId_rubricVersionId_fkey" FOREIGN KEY ("eventId", "rubricVersionId") REFERENCES "Event"("id", "rubricVersionId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MilestoneCriterion" ADD CONSTRAINT "MilestoneCriterion_eventId_milestoneId_fkey" FOREIGN KEY ("eventId", "milestoneId") REFERENCES "Milestone"("eventId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MilestoneCriterion" ADD CONSTRAINT "MilestoneCriterion_rubricVersionId_criterionId_fkey" FOREIGN KEY ("rubricVersionId", "criterionId") REFERENCES "RubricCriterion"("rubricVersionId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PrototypeCertificateClaim" ADD CONSTRAINT "PrototypeCertificateClaim_eventId_studentId_fkey" FOREIGN KEY ("eventId", "studentId") REFERENCES "Enrollment"("eventId", "studentId") ON DELETE RESTRICT ON UPDATE RESTRICT;


ALTER TABLE "Event" ADD CONSTRAINT "event_revision_nonnegative" CHECK ("revision" >= 0);
ALTER TABLE "Assessment" ADD CONSTRAINT "assessment_revision_nonnegative" CHECK ("revision" >= 0);
ALTER TABLE "PrototypeCertificateClaim" ADD CONSTRAINT "prototype_claim_score" CHECK ("score" BETWEEN 0 AND 100);
INSERT INTO "MilestoneCriterion" ("eventId","milestoneId","rubricVersionId","criterionId")
SELECT m."eventId",m.id,e."rubricVersionId",c.id FROM "Milestone" m JOIN "Event" e ON e.id=m."eventId" JOIN "RubricCriterion" c ON c."rubricVersionId"=e."rubricVersionId";
COMMIT;
