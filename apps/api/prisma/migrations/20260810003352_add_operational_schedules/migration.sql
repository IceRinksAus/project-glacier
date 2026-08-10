-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "operationalScheduleId" TEXT,
ADD COLUMN     "scheduleEntryId" TEXT;

-- CreateTable
CREATE TABLE "OperationalSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timetable" JSONB NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OperationalSchedule" ADD CONSTRAINT "OperationalSchedule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_operationalScheduleId_fkey" FOREIGN KEY ("operationalScheduleId") REFERENCES "OperationalSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
