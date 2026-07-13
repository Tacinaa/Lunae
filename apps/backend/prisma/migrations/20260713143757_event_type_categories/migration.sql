-- Recreate the EventType enum: replace generic "sport" with intensity-aware
-- categories used for phase-based recommendation scoring, and add
-- productivity/social categories.
CREATE TYPE "EventType_new" AS ENUM ('meeting', 'class', 'sport_intense', 'sport_leger', 'focus_administratif', 'creation_planification', 'social_enjeu', 'personal', 'other');

ALTER TABLE "Event" ALTER COLUMN "eventType" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "eventType" TYPE "EventType_new" USING (
  CASE "eventType"::text
    WHEN 'sport' THEN 'sport_intense'
    ELSE "eventType"::text
  END
)::"EventType_new";

ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";

ALTER TABLE "Event" ALTER COLUMN "eventType" SET DEFAULT 'other';
