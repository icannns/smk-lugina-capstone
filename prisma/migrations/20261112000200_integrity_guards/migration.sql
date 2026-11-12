BEGIN;

-- Prisma cannot express these CHECK constraints and triggers in schema.prisma.
-- Keep this migration when regenerating/replaying the database.
ALTER TABLE "User" ADD CONSTRAINT "user_name_nonblank" CHECK (length(btrim("name")) > 0);
ALTER TABLE "User" ADD CONSTRAINT "user_normalized_email" CHECK ("email" IS NULL OR ("email" = lower(btrim("email")) AND length("email") > 0));
ALTER TABLE "User" ADD CONSTRAINT "user_normalized_username" CHECK ("username" IS NULL OR ("username" = lower(btrim("username")) AND length("username") > 0));
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "teacher_profile_role" CHECK ("role" = 'TEACHER');
ALTER TABLE "StudentProfile" ADD CONSTRAINT "student_profile_role" CHECK ("role" = 'STUDENT');
ALTER TABLE "Event" ADD CONSTRAINT "event_time_order" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" >= "startsAt");
ALTER TABLE "Event" ADD CONSTRAINT "published_event_title" CHECK ("status" = 'DRAFT' OR length(btrim("title")) > 0);
ALTER TABLE "Milestone" ADD CONSTRAINT "milestone_positive_position" CHECK ("position" > 0);
ALTER TABLE "SubmissionVersion" ADD CONSTRAINT "submission_positive_version" CHECK ("version" > 0);
ALTER TABLE "SubmissionAttachment" ADD CONSTRAINT "attachment_nonnegative_size" CHECK ("sizeBytes" >= 0);
ALTER TABLE "RubricVersion" ADD CONSTRAINT "rubric_positive_version" CHECK ("version" > 0);
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "criterion_positive_position" CHECK ("position" > 0);
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "criterion_score_bounds" CHECK ("maxScore" >= "minScore");
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "assessment_score_finite" CHECK ("value" <> 'NaN'::numeric);
ALTER TABLE "Feedback" ADD CONSTRAINT "feedback_nonblank" CHECK (length(btrim("message")) > 0);
ALTER TABLE "Feedback" ADD CONSTRAINT "feedback_revision_deadline" CHECK ("revisionDeadline" IS NULL OR "revisionRequested");
ALTER TABLE "SurveyReference" ADD CONSTRAINT "survey_reference_nonblank" CHECK (length(btrim("provider")) > 0 AND length(btrim("externalInstrumentId")) > 0);
ALTER TABLE "SurveyResponseReference" ADD CONSTRAINT "survey_positive_revision" CHECK ("revision" > 0);
ALTER TABLE "ExternalAssessmentReference" ADD CONSTRAINT "external_assessment_provider" CHECK (length(btrim("provider")) > 0);
ALTER TABLE "ExternalAssessmentReference" ADD CONSTRAINT "external_assessment_score_pair" CHECK (
  ("scoreValue" IS NULL AND "scoreMaximum" IS NULL) OR
  ("scoreValue" IS NOT NULL AND "scoreMaximum" IS NOT NULL AND "scoreMaximum" > 0 AND "scoreValue" <> 'NaN'::numeric AND "scoreMaximum" <> 'NaN'::numeric)
);

-- No fixed 0..5 range: each score is checked against its actual rubric criterion.
CREATE FUNCTION bojong_validate_rubric_score() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE minimum integer; maximum integer; submitted numeric;
BEGIN
  SELECT "minScore", "maxScore" INTO minimum, maximum FROM "RubricCriterion"
    WHERE "rubricVersionId" = NEW."rubricVersionId" AND "id" = NEW."criterionId" FOR KEY SHARE;
  IF FOUND THEN
    IF TG_TABLE_NAME = 'AssessmentScore' THEN submitted := NEW."value";
    ELSE submitted := NEW."score"; END IF;
    IF submitted < minimum OR submitted > maximum OR submitted = 'NaN'::numeric THEN
      RAISE EXCEPTION 'Score is outside the criterion range' USING ERRCODE = '23514', CONSTRAINT = 'rubric_score_in_range';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assessment_score_range BEFORE INSERT OR UPDATE ON "AssessmentScore"
  FOR EACH ROW EXECUTE FUNCTION bojong_validate_rubric_score();
CREATE TRIGGER criterion_level_range BEFORE INSERT OR UPDATE ON "RubricCriterionLevel"
  FOR EACH ROW EXECUTE FUNCTION bojong_validate_rubric_score();

-- An assigned version is a snapshot. Edit by creating a new RubricVersion.
-- Lock the parent row so FK assignment and definition edits cannot race.
CREATE FUNCTION bojong_protect_rubric_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous_id text; next_id text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'RubricVersion' THEN
    IF TG_OP <> 'INSERT' THEN previous_id := OLD."id"; END IF;
    IF TG_OP <> 'DELETE' THEN next_id := NEW."id"; END IF;
  ELSE
    IF TG_OP <> 'INSERT' THEN previous_id := OLD."rubricVersionId"; END IF;
    IF TG_OP <> 'DELETE' THEN next_id := NEW."rubricVersionId"; END IF;
    -- Allow harmless ON CONFLICT no-op creation of an existing criterion/level.
    IF TG_OP = 'INSERT' THEN
      IF TG_TABLE_NAME = 'RubricCriterion' THEN
        IF EXISTS (SELECT 1 FROM "RubricCriterion" WHERE "rubricVersionId" = NEW."rubricVersionId" AND "id" = NEW."id") THEN RETURN NEW; END IF;
      ELSE
        IF EXISTS (SELECT 1 FROM "RubricCriterionLevel" WHERE "rubricVersionId" = NEW."rubricVersionId" AND "criterionId" = NEW."criterionId" AND "score" = NEW."score") THEN RETURN NEW; END IF;
      END IF;
    END IF;
    PERFORM 1 FROM "RubricVersion" WHERE "id" IN (previous_id, next_id) ORDER BY "id" FOR UPDATE;
  END IF;
  IF EXISTS (SELECT 1 FROM "Event" WHERE "rubricVersionId" IN (previous_id, next_id)) OR
     EXISTS (SELECT 1 FROM "Assessment" WHERE "rubricVersionId" IN (previous_id, next_id)) THEN
    RAISE EXCEPTION 'Assigned rubric versions are immutable; create a new version' USING ERRCODE = '23514', CONSTRAINT = 'rubric_snapshot_immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_rubric_version BEFORE UPDATE OR DELETE ON "RubricVersion"
  FOR EACH ROW EXECUTE FUNCTION bojong_protect_rubric_snapshot();
CREATE TRIGGER protect_rubric_criterion BEFORE INSERT OR UPDATE OR DELETE ON "RubricCriterion"
  FOR EACH ROW EXECUTE FUNCTION bojong_protect_rubric_snapshot();
CREATE TRIGGER protect_rubric_level BEFORE INSERT OR UPDATE OR DELETE ON "RubricCriterionLevel"
  FOR EACH ROW EXECUTE FUNCTION bojong_protect_rubric_snapshot();

COMMIT;
