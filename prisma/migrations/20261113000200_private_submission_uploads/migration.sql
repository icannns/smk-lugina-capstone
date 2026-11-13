-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'DELETING', 'DELETED');

-- AlterTable
ALTER TABLE "SubmissionAttachment" ADD COLUMN     "uploadId" VARCHAR(191);

-- CreateTable
CREATE TABLE "SubmissionUpload" (
    "id" VARCHAR(191) NOT NULL,
    "eventId" VARCHAR(191) NOT NULL,
    "studentId" VARCHAR(191) NOT NULL,
    "milestoneId" VARCHAR(191) NOT NULL,
    "uploaderUserId" VARCHAR(191) NOT NULL,
    "expectedVersion" INTEGER NOT NULL,
    "originalName" VARCHAR(180) NOT NULL,
    "contentType" VARCHAR(150) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "storageKey" VARCHAR(64) NOT NULL,
    "storageBackend" VARCHAR(10) NOT NULL,
    "storageNamespace" VARCHAR(64) NOT NULL,
    "requestKey" VARCHAR(64) NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'UPLOADING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "cleanupNeeded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SubmissionUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionUpload_storageKey_key" ON "SubmissionUpload"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionUpload_requestKey_key" ON "SubmissionUpload"("requestKey");

-- CreateIndex
CREATE INDEX "SubmissionUpload_eventId_studentId_milestoneId_expectedVers_idx" ON "SubmissionUpload"("eventId", "studentId", "milestoneId", "expectedVersion", "status");

-- CreateIndex
CREATE INDEX "SubmissionUpload_uploaderUserId_createdAt_idx" ON "SubmissionUpload"("uploaderUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissionUpload_status_expiresAt_idx" ON "SubmissionUpload"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "SubmissionAttachment_uploadId_idx" ON "SubmissionAttachment"("uploadId");

-- AddForeignKey
ALTER TABLE "SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "SubmissionUpload"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubmissionUpload" ADD CONSTRAINT "SubmissionUpload_eventId_studentId_fkey" FOREIGN KEY ("eventId", "studentId") REFERENCES "Enrollment"("eventId", "studentId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubmissionUpload" ADD CONSTRAINT "SubmissionUpload_eventId_milestoneId_fkey" FOREIGN KEY ("eventId", "milestoneId") REFERENCES "Milestone"("eventId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubmissionUpload" ADD CONSTRAINT "SubmissionUpload_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Defense in depth: objects and immutable version references remain in the same enrollment.
ALTER TABLE "SubmissionUpload" ADD CONSTRAINT "private_upload_metadata" CHECK (
 "sizeBytes">0 AND "sizeBytes"<=10485760 AND "expectedVersion">=0
 AND "checksum" ~ '^[a-f0-9]{64}$' AND "storageKey" ~ '^[a-f0-9]{64}$'
 AND "storageNamespace" ~ '^[a-f0-9]{64}$' AND "requestKey" ~ '^[a-f0-9]{64}$'
 AND "storageBackend" IN ('local','s3')
 AND "contentType" IN ('application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
 AND length(btrim("originalName"))>0 AND "expiresAt">"createdAt"
);
CREATE FUNCTION bojong_private_upload_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF (to_jsonb(NEW)-'status'-'cleanupNeeded'-'expiresAt') IS DISTINCT FROM (to_jsonb(OLD)-'status'-'cleanupNeeded'-'expiresAt') THEN
   RAISE EXCEPTION 'Private object identity and metadata are immutable' USING ERRCODE='23514';
  END IF;
  IF EXISTS (SELECT 1 FROM "SubmissionAttachment" WHERE "uploadId"=OLD.id) AND NEW.status<>'READY' THEN
   RAISE EXCEPTION 'Historical files cannot be removed' USING ERRCODE='23514';
  END IF;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM "StudentProfile" WHERE id=NEW."studentId" AND "userId"=NEW."uploaderUserId") THEN
  RAISE EXCEPTION 'Uploader must own the enrolled student' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER private_upload_guard BEFORE INSERT OR UPDATE ON "SubmissionUpload" FOR EACH ROW EXECUTE FUNCTION bojong_private_upload_guard();
CREATE FUNCTION bojong_attachment_upload_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' AND OLD."uploadId" IS NOT NULL THEN
  RAISE EXCEPTION 'Uploaded version attachments are immutable' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW."uploadId" IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM "SubmissionUpload" u JOIN "SubmissionVersion" v ON v.id=NEW."versionId" JOIN "Submission" s ON s.id=v."submissionId"
  WHERE u.id=NEW."uploadId" AND u.status='READY' AND u.id=NEW.id
   AND u."eventId"=s."eventId" AND u."studentId"=s."studentId" AND u."milestoneId"=s."milestoneId"
   AND u."originalName"=NEW.name AND u."contentType"=NEW."contentType" AND u."sizeBytes"=NEW."sizeBytes" AND NEW."storageKey" IS NULL
 ) THEN RAISE EXCEPTION 'Attachment must reference its own ready canonical object' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attachment_upload_guard BEFORE INSERT OR UPDATE OR DELETE ON "SubmissionAttachment" FOR EACH ROW EXECUTE FUNCTION bojong_attachment_upload_guard();
