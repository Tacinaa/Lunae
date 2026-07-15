-- AlterTable
ALTER TABLE "Calendar" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_userId_source_externalId_key" ON "Calendar"("userId", "source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_calendarId_externalId_key" ON "Event"("calendarId", "externalId");

