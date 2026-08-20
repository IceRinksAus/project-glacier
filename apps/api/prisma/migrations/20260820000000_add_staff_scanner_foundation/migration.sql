-- CreateEnum
CREATE TYPE "TicketScanMode" AS ENUM ('GATE_ENTRY', 'TICKET_LOOKUP');

-- CreateEnum
CREATE TYPE "TicketScanAttemptResult" AS ENUM ('ENTRY_GRANTED', 'ALREADY_SCANNED', 'CANCELLED', 'NOT_YET_VALID', 'ENTRY_WINDOW_CLOSED', 'WRONG_EVENT', 'NOT_FOUND', 'INVALID');

-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "entryOpensMinutesBeforeStart" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "entryClosesMinutesAfterEnd" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Event" ADD CONSTRAINT "Event_entryOpensMinutesBeforeStart_check" CHECK ("entryOpensMinutesBeforeStart" BETWEEN 0 AND 240);
ALTER TABLE "Event" ADD CONSTRAINT "Event_entryClosesMinutesAfterEnd_check" CHECK ("entryClosesMinutesAfterEnd" BETWEEN 0 AND 240);

-- CreateTable
CREATE TABLE "TicketScanAttempt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketId" TEXT,
    "userId" TEXT NOT NULL,
    "result" "TicketScanAttemptResult" NOT NULL,
    "mode" "TicketScanMode" NOT NULL,
    "priorCheckedInAt" TIMESTAMP(3),
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketScanAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketScanAttempt_organizationId_attemptedAt_idx" ON "TicketScanAttempt"("organizationId", "attemptedAt");
CREATE INDEX "TicketScanAttempt_eventId_attemptedAt_idx" ON "TicketScanAttempt"("eventId", "attemptedAt");
CREATE INDEX "TicketScanAttempt_ticketId_attemptedAt_idx" ON "TicketScanAttempt"("ticketId", "attemptedAt");
CREATE INDEX "TicketScanAttempt_userId_attemptedAt_idx" ON "TicketScanAttempt"("userId", "attemptedAt");

ALTER TABLE "TicketScanAttempt" ADD CONSTRAINT "TicketScanAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketScanAttempt" ADD CONSTRAINT "TicketScanAttempt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketScanAttempt" ADD CONSTRAINT "TicketScanAttempt_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketScanAttempt" ADD CONSTRAINT "TicketScanAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
