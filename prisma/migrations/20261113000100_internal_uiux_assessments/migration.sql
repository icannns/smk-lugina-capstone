-- AlterEnum
ALTER TYPE "ReferenceSource" ADD VALUE 'INTERNAL';

-- AlterTable
ALTER TABLE "ExternalAssessmentReference" ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uiUxCreateHash" VARCHAR(64),
ADD COLUMN     "uiUxCreateKey" VARCHAR(64);

-- CreateTable
CREATE TABLE "UiUxAssessmentRevision" (
    "assessmentId" VARCHAR(191) NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedByTeacherId" VARCHAR(191) NOT NULL,

    CONSTRAINT "UiUxAssessmentRevision_pkey" PRIMARY KEY ("assessmentId","revision")
);

-- CreateIndex
CREATE INDEX "UiUxAssessmentRevision_changedByTeacherId_changedAt_idx" ON "UiUxAssessmentRevision"("changedByTeacherId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAssessmentReference_uiUxCreateKey_key" ON "ExternalAssessmentReference"("uiUxCreateKey");

-- AddForeignKey
ALTER TABLE "UiUxAssessmentRevision" ADD CONSTRAINT "UiUxAssessmentRevision_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ExternalAssessmentReference"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UiUxAssessmentRevision" ADD CONSTRAINT "UiUxAssessmentRevision_changedByTeacherId_fkey" FOREIGN KEY ("changedByTeacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;



ALTER TABLE "ExternalAssessmentReference" ADD CONSTRAINT "external_result_revision_nonnegative" CHECK (revision >= 0);
ALTER TABLE "ExternalAssessmentReference" ADD CONSTRAINT "internal_uiux_integrity" CHECK (
 source::text <> 'INTERNAL' OR type <> 'UI_UX' OR (
 provider='bojong-united' AND "eventId" IS NOT NULL AND revision>=1 AND "uiUxCreateKey" IS NOT NULL AND "uiUxCreateHash" IS NOT NULL
 AND ("scoreValue" IS NULL OR ("scoreValue">=0 AND "scoreValue"<="scoreMaximum"))
 AND ((status='COMPLETED' AND "completedAt" IS NOT NULL AND ("scoreValue" IS NOT NULL OR length(btrim(coalesce(summary,'')))>0))
 OR (status<>'COMPLETED' AND "completedAt" IS NULL AND "scoreValue" IS NULL))
 ));
ALTER TABLE "UiUxAssessmentRevision" ADD CONSTRAINT "uiux_history_snapshot" CHECK (revision>0 AND jsonb_typeof(snapshot)='object' AND snapshot->>'id'="assessmentId" AND (snapshot->>'revision')::integer=revision);
CREATE FUNCTION bojong_uiux_history_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'Assessment revision history is append-only' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS (SELECT 1 FROM "ExternalAssessmentReference" WHERE id=NEW."assessmentId" AND type='UI_UX' AND source::text='INTERNAL' AND revision=NEW.revision) THEN
  RAISE EXCEPTION 'History must match the current internal UI UX revision' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER uiux_history_guard BEFORE INSERT OR UPDATE OR DELETE ON "UiUxAssessmentRevision" FOR EACH ROW EXECUTE FUNCTION bojong_uiux_history_guard();
