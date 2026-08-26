-- CreateEnum
CREATE TYPE "TicketAdjustmentAction" AS ENUM ('CANCEL_ONLY', 'CANCEL_AND_REFUND');

-- CreateEnum
CREATE TYPE "TicketAdjustmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TicketAdjustmentReason" AS ENUM ('MEDICAL_COMPASSIONATE', 'EVENT_SESSION_ISSUE', 'DUPLICATE_PURCHASE', 'ORGANISER_CORRECTION', 'OTHER');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TicketAdjustment" (
    "id" TEXT NOT NULL,
    "adjustmentNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "action" "TicketAdjustmentAction" NOT NULL,
    "status" "TicketAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "TicketAdjustmentReason" NOT NULL,
    "note" TEXT NOT NULL,
    "requestedAmount" DECIMAL(10,2) NOT NULL,
    "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentId" TEXT,
    "paymentRefundId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "capacityReleasedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAdjustmentAllocation" (
    "id" TEXT NOT NULL,
    "adjustmentId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "participantNameSnapshot" TEXT NOT NULL,
    "ticketNumberSnapshot" TEXT NOT NULL,
    "ticketTypeNameSnapshot" TEXT NOT NULL,
    "unitValue" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAdjustmentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketAdjustment_adjustmentNumber_key" ON "TicketAdjustment"("adjustmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TicketAdjustment_idempotencyKey_key" ON "TicketAdjustment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "TicketAdjustment_paymentRefundId_key" ON "TicketAdjustment"("paymentRefundId");

-- CreateIndex
CREATE INDEX "TicketAdjustment_organizationId_createdAt_idx" ON "TicketAdjustment"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketAdjustment_eventId_createdAt_idx" ON "TicketAdjustment"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketAdjustment_bookingId_createdAt_idx" ON "TicketAdjustment"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketAdjustment_requestedByUserId_createdAt_idx" ON "TicketAdjustment"("requestedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketAdjustment_status_createdAt_idx" ON "TicketAdjustment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TicketAdjustment_paymentId_idx" ON "TicketAdjustment"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketAdjustmentAllocation_ticketId_key" ON "TicketAdjustmentAllocation"("ticketId");

-- CreateIndex
CREATE INDEX "TicketAdjustmentAllocation_adjustmentId_idx" ON "TicketAdjustmentAllocation"("adjustmentId");

-- CreateIndex
CREATE INDEX "TicketAdjustmentAllocation_participantId_idx" ON "TicketAdjustmentAllocation"("participantId");

-- CreateIndex
CREATE INDEX "TicketAdjustmentAllocation_ticketTypeId_idx" ON "TicketAdjustmentAllocation"("ticketTypeId");

-- AddForeignKey
ALTER TABLE "TicketAdjustment" ADD CONSTRAINT "TicketAdjustment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustment" ADD CONSTRAINT "TicketAdjustment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustment" ADD CONSTRAINT "TicketAdjustment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustment" ADD CONSTRAINT "TicketAdjustment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustment" ADD CONSTRAINT "TicketAdjustment_paymentRefundId_fkey" FOREIGN KEY ("paymentRefundId") REFERENCES "PaymentRefund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustment" ADD CONSTRAINT "TicketAdjustment_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustmentAllocation" ADD CONSTRAINT "TicketAdjustmentAllocation_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "TicketAdjustment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustmentAllocation" ADD CONSTRAINT "TicketAdjustmentAllocation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustmentAllocation" ADD CONSTRAINT "TicketAdjustmentAllocation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BookingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAdjustmentAllocation" ADD CONSTRAINT "TicketAdjustmentAllocation_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
