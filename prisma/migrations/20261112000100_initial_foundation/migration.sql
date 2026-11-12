BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'UPCOMING', 'ONGOING', 'ENDED');

-- CreateEnum
CREATE TYPE "ExternalAssessmentType" AS ENUM ('COMPETENCY', 'TECHNOSTRESS', 'UI_UX');

-- CreateEnum
CREATE TYPE "ExternalAssessmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'AWAITING_RESULT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReferenceSource" AS ENUM ('DEMO', 'EXTERNAL');

-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(191) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320),
    "username" VARCHAR(80),
    "role" "Role" NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherProfile" (
    "id" VARCHAR(191) NOT NULL,
    "userId" VARCHAR(191) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "phone" VARCHAR(40),

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" VARCHAR(191) NOT NULL,
    "userId" VARCHAR(191) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "phone" VARCHAR(40),

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" VARCHAR(191) NOT NULL,
    "ownerTeacherId" VARCHAR(191) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "caseStudyHtml" TEXT,
    "directionsHtml" TEXT,
    "startsAt" TIMESTAMPTZ(3),
    "endsAt" TIMESTAMPTZ(3),
    "publishedAt" TIMESTAMPTZ(3),
    "rubricVersionId" VARCHAR(191),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" VARCHAR(191) NOT NULL,
    "eventId" VARCHAR(191) NOT NULL,
    "studentId" VARCHAR(191) NOT NULL,
    "enrolledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "eventId" VARCHAR(191) NOT NULL,
    "id" VARCHAR(191) NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "instructions" TEXT,
    "deadline" TIMESTAMPTZ(3),
    "acceptedFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("eventId","id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" VARCHAR(191) NOT NULL,
    "eventId" VARCHAR(191) NOT NULL,
    "studentId" VARCHAR(191) NOT NULL,
    "milestoneId" VARCHAR(191) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionVersion" (
    "id" VARCHAR(191) NOT NULL,
    "submissionId" VARCHAR(191) NOT NULL,
    "eventId" VARCHAR(191) NOT NULL,
    "version" INTEGER NOT NULL,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL,
    "note" TEXT,
    "link" TEXT,

    CONSTRAINT "SubmissionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionAttachment" (
    "versionId" VARCHAR(191) NOT NULL,
    "id" VARCHAR(191) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(150) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "storageKey" TEXT,

    CONSTRAINT "SubmissionAttachment_pkey" PRIMARY KEY ("versionId","id")
);

-- CreateTable
CREATE TABLE "Rubric" (
    "id" VARCHAR(191) NOT NULL,
    "ownerTeacherId" VARCHAR(191) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricVersion" (
    "id" VARCHAR(191) NOT NULL,
    "rubricId" VARCHAR(191) NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RubricVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterion" (
    "rubricVersionId" VARCHAR(191) NOT NULL,
    "id" VARCHAR(191) NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,

    CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("rubricVersionId","id")
);

-- CreateTable
CREATE TABLE "RubricCriterionLevel" (
    "rubricVersionId" VARCHAR(191) NOT NULL,
    "criterionId" VARCHAR(191) NOT NULL,
    "score" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RubricCriterionLevel_pkey" PRIMARY KEY ("rubricVersionId","criterionId","score")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" VARCHAR(191) NOT NULL,
    "submissionVersionId" VARCHAR(191) NOT NULL,
    "eventId" VARCHAR(191) NOT NULL,
    "rubricVersionId" VARCHAR(191) NOT NULL,
    "assessedByTeacherId" VARCHAR(191) NOT NULL,
    "assessedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScore" (
    "assessmentId" VARCHAR(191) NOT NULL,
    "rubricVersionId" VARCHAR(191) NOT NULL,
    "criterionId" VARCHAR(191) NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "AssessmentScore_pkey" PRIMARY KEY ("assessmentId","criterionId")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" VARCHAR(191) NOT NULL,
    "submissionVersionId" VARCHAR(191) NOT NULL,
    "teacherId" VARCHAR(191) NOT NULL,
    "message" TEXT NOT NULL,
    "revisionRequested" BOOLEAN NOT NULL DEFAULT false,
    "revisionDeadline" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyReference" (
    "id" VARCHAR(191) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "externalInstrumentId" VARCHAR(191) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "source" "ReferenceSource" NOT NULL,

    CONSTRAINT "SurveyReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneSurveyReference" (
    "eventId" VARCHAR(191) NOT NULL,
    "milestoneId" VARCHAR(191) NOT NULL,
    "surveyReferenceId" VARCHAR(191) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MilestoneSurveyReference_pkey" PRIMARY KEY ("eventId","milestoneId","surveyReferenceId")
);

-- CreateTable
CREATE TABLE "SurveyResponseReference" (
    "id" VARCHAR(191) NOT NULL,
    "eventId" VARCHAR(191) NOT NULL,
    "studentId" VARCHAR(191) NOT NULL,
    "milestoneId" VARCHAR(191) NOT NULL,
    "surveyReferenceId" VARCHAR(191) NOT NULL,
    "revision" INTEGER NOT NULL,
    "externalResponseId" VARCHAR(191),
    "instrumentVersion" VARCHAR(100),
    "completedAt" TIMESTAMPTZ(3),
    "recordedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" JSONB,

    CONSTRAINT "SurveyResponseReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyReview" (
    "id" VARCHAR(191) NOT NULL,
    "responseId" VARCHAR(191) NOT NULL,
    "reviewerTeacherId" VARCHAR(191) NOT NULL,
    "note" TEXT,
    "reviewedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalAssessmentReference" (
    "id" VARCHAR(191) NOT NULL,
    "type" "ExternalAssessmentType" NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "studentId" VARCHAR(191) NOT NULL,
    "eventId" VARCHAR(191),
    "provider" VARCHAR(100) NOT NULL,
    "externalAssessmentId" VARCHAR(191),
    "instrumentVersion" VARCHAR(100),
    "status" "ExternalAssessmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "source" "ReferenceSource" NOT NULL,
    "scoreValue" DECIMAL(12,4),
    "scoreMaximum" DECIMAL(12,4),
    "summary" TEXT,
    "feedback" TEXT,
    "completedAt" TIMESTAMPTZ(3),
    "recordedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalAssessmentReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentSeed" (
    "id" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevelopmentSeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_role_key" ON "User"("id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_userId_key" ON "TeacherProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_userId_role_key" ON "TeacherProfile"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_role_key" ON "StudentProfile"("userId", "role");

-- CreateIndex
CREATE INDEX "Event_ownerTeacherId_status_idx" ON "Event"("ownerTeacherId", "status");

-- CreateIndex
CREATE INDEX "Event_rubricVersionId_idx" ON "Event"("rubricVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_id_rubricVersionId_key" ON "Event"("id", "rubricVersionId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_eventId_studentId_key" ON "Enrollment"("eventId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_eventId_position_key" ON "Milestone"("eventId", "position");

-- CreateIndex
CREATE INDEX "Submission_eventId_milestoneId_idx" ON "Submission"("eventId", "milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_eventId_studentId_milestoneId_key" ON "Submission"("eventId", "studentId", "milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_id_eventId_key" ON "Submission"("id", "eventId");

-- CreateIndex
CREATE INDEX "SubmissionVersion_eventId_submittedAt_idx" ON "SubmissionVersion"("eventId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVersion_submissionId_version_key" ON "SubmissionVersion"("submissionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVersion_id_eventId_key" ON "SubmissionVersion"("id", "eventId");

-- CreateIndex
CREATE INDEX "Rubric_ownerTeacherId_idx" ON "Rubric"("ownerTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "RubricVersion_rubricId_version_key" ON "RubricVersion"("rubricId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RubricCriterion_rubricVersionId_position_key" ON "RubricCriterion"("rubricVersionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_submissionVersionId_key" ON "Assessment"("submissionVersionId");

-- CreateIndex
CREATE INDEX "Assessment_eventId_assessedAt_idx" ON "Assessment"("eventId", "assessedAt");

-- CreateIndex
CREATE INDEX "Assessment_assessedByTeacherId_idx" ON "Assessment"("assessedByTeacherId");

-- CreateIndex
CREATE INDEX "Assessment_rubricVersionId_idx" ON "Assessment"("rubricVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_id_rubricVersionId_key" ON "Assessment"("id", "rubricVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_submissionVersionId_eventId_key" ON "Assessment"("submissionVersionId", "eventId");

-- CreateIndex
CREATE INDEX "AssessmentScore_rubricVersionId_criterionId_idx" ON "AssessmentScore"("rubricVersionId", "criterionId");

-- CreateIndex
CREATE INDEX "Feedback_submissionVersionId_createdAt_idx" ON "Feedback"("submissionVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_teacherId_idx" ON "Feedback"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyReference_provider_externalInstrumentId_key" ON "SurveyReference"("provider", "externalInstrumentId");

-- CreateIndex
CREATE INDEX "MilestoneSurveyReference_surveyReferenceId_idx" ON "MilestoneSurveyReference"("surveyReferenceId");

-- CreateIndex
CREATE INDEX "SurveyResponseReference_eventId_milestoneId_completedAt_idx" ON "SurveyResponseReference"("eventId", "milestoneId", "completedAt");

-- CreateIndex
CREATE INDEX "SurveyResponseReference_surveyReferenceId_idx" ON "SurveyResponseReference"("surveyReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponseReference_eventId_studentId_milestoneId_surve_key" ON "SurveyResponseReference"("eventId", "studentId", "milestoneId", "surveyReferenceId", "revision");

-- CreateIndex
CREATE INDEX "SurveyReview_reviewerTeacherId_idx" ON "SurveyReview"("reviewerTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyReview_responseId_reviewerTeacherId_key" ON "SurveyReview"("responseId", "reviewerTeacherId");

-- CreateIndex
CREATE INDEX "ExternalAssessmentReference_studentId_type_completedAt_idx" ON "ExternalAssessmentReference"("studentId", "type", "completedAt");

-- CreateIndex
CREATE INDEX "ExternalAssessmentReference_eventId_type_status_idx" ON "ExternalAssessmentReference"("eventId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAssessmentReference_provider_externalAssessmentId_key" ON "ExternalAssessmentReference"("provider", "externalAssessmentId");

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_role_fkey" FOREIGN KEY ("userId", "role") REFERENCES "User"("id", "role") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_role_fkey" FOREIGN KEY ("userId", "role") REFERENCES "User"("id", "role") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_ownerTeacherId_fkey" FOREIGN KEY ("ownerTeacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_rubricVersionId_fkey" FOREIGN KEY ("rubricVersionId") REFERENCES "RubricVersion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_eventId_studentId_fkey" FOREIGN KEY ("eventId", "studentId") REFERENCES "Enrollment"("eventId", "studentId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_eventId_milestoneId_fkey" FOREIGN KEY ("eventId", "milestoneId") REFERENCES "Milestone"("eventId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubmissionVersion" ADD CONSTRAINT "SubmissionVersion_submissionId_eventId_fkey" FOREIGN KEY ("submissionId", "eventId") REFERENCES "Submission"("id", "eventId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SubmissionVersion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_ownerTeacherId_fkey" FOREIGN KEY ("ownerTeacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "RubricVersion" ADD CONSTRAINT "RubricVersion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricVersionId_fkey" FOREIGN KEY ("rubricVersionId") REFERENCES "RubricVersion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "RubricCriterionLevel" ADD CONSTRAINT "RubricCriterionLevel_rubricVersionId_criterionId_fkey" FOREIGN KEY ("rubricVersionId", "criterionId") REFERENCES "RubricCriterion"("rubricVersionId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_submissionVersionId_eventId_fkey" FOREIGN KEY ("submissionVersionId", "eventId") REFERENCES "SubmissionVersion"("id", "eventId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_eventId_rubricVersionId_fkey" FOREIGN KEY ("eventId", "rubricVersionId") REFERENCES "Event"("id", "rubricVersionId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_rubricVersionId_fkey" FOREIGN KEY ("rubricVersionId") REFERENCES "RubricVersion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_assessedByTeacherId_fkey" FOREIGN KEY ("assessedByTeacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_assessmentId_rubricVersionId_fkey" FOREIGN KEY ("assessmentId", "rubricVersionId") REFERENCES "Assessment"("id", "rubricVersionId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_rubricVersionId_criterionId_fkey" FOREIGN KEY ("rubricVersionId", "criterionId") REFERENCES "RubricCriterion"("rubricVersionId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_submissionVersionId_fkey" FOREIGN KEY ("submissionVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MilestoneSurveyReference" ADD CONSTRAINT "MilestoneSurveyReference_eventId_milestoneId_fkey" FOREIGN KEY ("eventId", "milestoneId") REFERENCES "Milestone"("eventId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "MilestoneSurveyReference" ADD CONSTRAINT "MilestoneSurveyReference_surveyReferenceId_fkey" FOREIGN KEY ("surveyReferenceId") REFERENCES "SurveyReference"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SurveyResponseReference" ADD CONSTRAINT "SurveyResponseReference_eventId_studentId_fkey" FOREIGN KEY ("eventId", "studentId") REFERENCES "Enrollment"("eventId", "studentId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SurveyResponseReference" ADD CONSTRAINT "SurveyResponseReference_eventId_milestoneId_surveyReferenc_fkey" FOREIGN KEY ("eventId", "milestoneId", "surveyReferenceId") REFERENCES "MilestoneSurveyReference"("eventId", "milestoneId", "surveyReferenceId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SurveyReview" ADD CONSTRAINT "SurveyReview_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SurveyResponseReference"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SurveyReview" ADD CONSTRAINT "SurveyReview_reviewerTeacherId_fkey" FOREIGN KEY ("reviewerTeacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ExternalAssessmentReference" ADD CONSTRAINT "ExternalAssessmentReference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ExternalAssessmentReference" ADD CONSTRAINT "ExternalAssessmentReference_eventId_studentId_fkey" FOREIGN KEY ("eventId", "studentId") REFERENCES "Enrollment"("eventId", "studentId") ON DELETE RESTRICT ON UPDATE RESTRICT;


COMMIT;
