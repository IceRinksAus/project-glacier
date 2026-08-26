-- CreateEnum
CREATE TYPE "BookingRescheduleStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BookingRescheduleReason" AS ENUM ('CUSTOMER_REQUEST', 'EVENT_SESSION_ISSUE', 'ORGANISER_CORRECTION', 'OTHER');

-- Allow an immutable original Ticket and a replacement Ticket to belong to the
-- same participant. Issuance and rescheduling services remain responsible for
-- ensuring only one current ACTIVE Ticket exists per participant.
DROP INDEX "Ticket_participantId_key";
CREATE INDEX "Ticket_participantId_idx" ON "Ticket"("participantId");

-- CreateTable
CREATE TABLE "BookingReschedule" (
    "id" TEXT NOT NULL,
    "rescheduleNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "BookingRescheduleStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "BookingRescheduleReason" NOT NULL,
    "note" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "originalSessionId" TEXT NOT NULL,
    "destinationSessionId" TEXT NOT NULL,
    "originalSessionNameSnapshot" TEXT NOT NULL,
    "originalSessionStartSnapshot" TIMESTAMP(3) NOT NULL,
    "destinationSessionNameSnapshot" TEXT NOT NULL,
    "destinationSessionStartSnapshot" TIMESTAMP(3) NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "ticketCount" INTEGER NOT NULL,
    "admissionPlacesTransferred" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingReschedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRescheduleTicket" (
    "id" TEXT NOT NULL,
    "rescheduleId" TEXT NOT NULL,
    "originalTicketId" TEXT NOT NULL,
    "replacementTicketId" TEXT,
    "participantId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "participantNameSnapshot" TEXT NOT NULL,
    "ticketTypeNameSnapshot" TEXT NOT NULL,
    "originalTicketNumberSnapshot" TEXT NOT NULL,
    "replacementTicketNumberSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRescheduleTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRescheduleProductAllocation" (
    "id" TEXT NOT NULL,
    "rescheduleId" TEXT NOT NULL,
    "bookingProductId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "variantNameSnapshot" TEXT,
    "quantity" INTEGER NOT NULL,
    "capacityTransferred" INTEGER NOT NULL,
    "originalSessionProductId" TEXT,
    "destinationSessionProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRescheduleProductAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingReschedule_rescheduleNumber_key" ON "BookingReschedule"("rescheduleNumber");
CREATE UNIQUE INDEX "BookingReschedule_idempotencyKey_key" ON "BookingReschedule"("idempotencyKey");
CREATE INDEX "BookingReschedule_organizationId_createdAt_idx" ON "BookingReschedule"("organizationId", "createdAt");
CREATE INDEX "BookingReschedule_eventId_createdAt_idx" ON "BookingReschedule"("eventId", "createdAt");
CREATE INDEX "BookingReschedule_bookingId_createdAt_idx" ON "BookingReschedule"("bookingId", "createdAt");
CREATE INDEX "BookingReschedule_requestedByUserId_createdAt_idx" ON "BookingReschedule"("requestedByUserId", "createdAt");
CREATE INDEX "BookingReschedule_status_createdAt_idx" ON "BookingReschedule"("status", "createdAt");
CREATE INDEX "BookingReschedule_originalSessionId_createdAt_idx" ON "BookingReschedule"("originalSessionId", "createdAt");
CREATE INDEX "BookingReschedule_destinationSessionId_createdAt_idx" ON "BookingReschedule"("destinationSessionId", "createdAt");

-- Only one incomplete reschedule may own a Booking at a time. Completed and
-- failed history remains append-only and permits later legitimate moves.
CREATE UNIQUE INDEX "BookingReschedule_one_pending_per_booking_key"
ON "BookingReschedule"("bookingId") WHERE "status" = 'PENDING';

CREATE UNIQUE INDEX "BookingRescheduleTicket_originalTicketId_key" ON "BookingRescheduleTicket"("originalTicketId");
CREATE UNIQUE INDEX "BookingRescheduleTicket_replacementTicketId_key" ON "BookingRescheduleTicket"("replacementTicketId");
CREATE INDEX "BookingRescheduleTicket_rescheduleId_idx" ON "BookingRescheduleTicket"("rescheduleId");
CREATE INDEX "BookingRescheduleTicket_participantId_idx" ON "BookingRescheduleTicket"("participantId");
CREATE INDEX "BookingRescheduleTicket_ticketTypeId_idx" ON "BookingRescheduleTicket"("ticketTypeId");

CREATE UNIQUE INDEX "BookingRescheduleProductAllocation_rescheduleId_bookingProductId_key" ON "BookingRescheduleProductAllocation"("rescheduleId", "bookingProductId");
CREATE INDEX "BookingRescheduleProductAllocation_bookingProductId_idx" ON "BookingRescheduleProductAllocation"("bookingProductId");
CREATE INDEX "BookingRescheduleProductAllocation_productId_idx" ON "BookingRescheduleProductAllocation"("productId");

-- AddForeignKey
ALTER TABLE "BookingReschedule" ADD CONSTRAINT "BookingReschedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingReschedule" ADD CONSTRAINT "BookingReschedule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingReschedule" ADD CONSTRAINT "BookingReschedule_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingReschedule" ADD CONSTRAINT "BookingReschedule_originalSessionId_fkey" FOREIGN KEY ("originalSessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingReschedule" ADD CONSTRAINT "BookingReschedule_destinationSessionId_fkey" FOREIGN KEY ("destinationSessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingReschedule" ADD CONSTRAINT "BookingReschedule_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookingRescheduleTicket" ADD CONSTRAINT "BookingRescheduleTicket_rescheduleId_fkey" FOREIGN KEY ("rescheduleId") REFERENCES "BookingReschedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRescheduleTicket" ADD CONSTRAINT "BookingRescheduleTicket_originalTicketId_fkey" FOREIGN KEY ("originalTicketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRescheduleTicket" ADD CONSTRAINT "BookingRescheduleTicket_replacementTicketId_fkey" FOREIGN KEY ("replacementTicketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRescheduleTicket" ADD CONSTRAINT "BookingRescheduleTicket_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BookingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRescheduleTicket" ADD CONSTRAINT "BookingRescheduleTicket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookingRescheduleProductAllocation" ADD CONSTRAINT "BookingRescheduleProductAllocation_rescheduleId_fkey" FOREIGN KEY ("rescheduleId") REFERENCES "BookingReschedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRescheduleProductAllocation" ADD CONSTRAINT "BookingRescheduleProductAllocation_bookingProductId_fkey" FOREIGN KEY ("bookingProductId") REFERENCES "BookingProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRescheduleProductAllocation" ADD CONSTRAINT "BookingRescheduleProductAllocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
