-- CreateEnum
CREATE TYPE "FlexibleTicketRequestType" AS ENUM ('REFUND', 'SESSION_CHANGE');

-- CreateEnum
CREATE TYPE "FlexibleTicketRequestStatus" AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'COMPLETED',
    'DECLINED',
    'WITHDRAWN',
    'FAILED',
    'EXPIRED'
);

-- CreateEnum
CREATE TYPE "FlexibleTicketRequestReason" AS ENUM (
    'CHANGE_OF_PLANS',
    'ILLNESS_OR_INJURY',
    'BOOKING_ERROR',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "FlexibleTicketDecisionReason" AS ENUM (
    'APPROVED_UNDER_ENTITLEMENT',
    'OUTSIDE_ENTITLEMENT',
    'INELIGIBLE_TICKET',
    'CUTOFF_PASSED',
    'CAPACITY_UNAVAILABLE',
    'PAYMENT_ACTION_REQUIRED',
    'OTHER'
);

-- A customer request is durable case evidence. It is deliberately separate from
-- the existing adjustment and reschedule mutation ledgers.
CREATE TABLE "FlexibleTicketRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "type" "FlexibleTicketRequestType" NOT NULL,
    "status" "FlexibleTicketRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "destinationSessionId" TEXT,
    "customerReason" "FlexibleTicketRequestReason" NOT NULL,
    "customerNote" TEXT,
    "reviewedByUserId" TEXT,
    "decisionReason" "FlexibleTicketDecisionReason",
    "decisionNote" TEXT,
    "ticketAdjustmentId" TEXT,
    "bookingRescheduleId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlexibleTicketRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FlexibleTicketRequest_type_target_check" CHECK (
        ("type" = 'REFUND' AND "destinationSessionId" IS NULL AND "bookingRescheduleId" IS NULL)
        OR ("type" = 'SESSION_CHANGE' AND "destinationSessionId" IS NOT NULL AND "ticketAdjustmentId" IS NULL)
    ),
    CONSTRAINT "FlexibleTicketRequest_review_check" CHECK (
        ("status" = 'SUBMITTED' AND "reviewedByUserId" IS NULL AND "reviewedAt" IS NULL)
        OR "status" <> 'SUBMITTED'
    ),
    CONSTRAINT "FlexibleTicketRequest_decision_check" CHECK (
        ("status" IN ('APPROVED', 'COMPLETED', 'DECLINED', 'FAILED')
            AND "reviewedByUserId" IS NOT NULL
            AND "reviewedAt" IS NOT NULL
            AND "decisionReason" IS NOT NULL
            AND "decisionNote" IS NOT NULL
            AND "decidedAt" IS NOT NULL)
        OR "status" NOT IN ('APPROVED', 'COMPLETED', 'DECLINED', 'FAILED')
    ),
    CONSTRAINT "FlexibleTicketRequest_terminal_time_check" CHECK (
        ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL)
        OR ("status" = 'WITHDRAWN' AND "withdrawnAt" IS NOT NULL)
        OR ("status" = 'FAILED' AND "failedAt" IS NOT NULL)
        OR ("status" = 'EXPIRED' AND "expiredAt" IS NOT NULL)
        OR "status" IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DECLINED')
    ),
    CONSTRAINT "FlexibleTicketRequest_completion_link_check" CHECK (
        "status" <> 'COMPLETED'
        OR (
            ("type" = 'REFUND' AND "ticketAdjustmentId" IS NOT NULL)
            OR ("type" = 'SESSION_CHANGE' AND "bookingRescheduleId" IS NOT NULL)
        )
    ),
    CONSTRAINT "FlexibleTicketRequest_note_length_check" CHECK (
        ("customerNote" IS NULL OR char_length("customerNote") <= 500)
        AND ("decisionNote" IS NULL OR (char_length("decisionNote") BETWEEN 3 AND 1000))
    )
);

CREATE TABLE "FlexibleTicketRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "activeRequestKey" TEXT,
    "participantNameSnapshot" TEXT NOT NULL,
    "ticketNumberSnapshot" TEXT NOT NULL,
    "ticketTypeNameSnapshot" TEXT NOT NULL,
    "ticketValueSnapshot" DECIMAL(10,2) NOT NULL,
    "flexibleFeeSnapshot" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "remainingUsesSnapshot" INTEGER NOT NULL,
    "cutoffAtSnapshot" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlexibleTicketRequestItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FlexibleTicketRequestItem_value_check" CHECK (
        "ticketValueSnapshot" >= 0
        AND "flexibleFeeSnapshot" >= 0
        AND "remainingUsesSnapshot" > 0
        AND char_length("currency") = 3
    )
);

-- A successful use consumes exactly one purchased use. Failed, declined,
-- withdrawn and expired requests create no allocation.
CREATE TABLE "FlexibleTicketUseAllocation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "remainingUsesBefore" INTEGER NOT NULL,
    "remainingUsesAfter" INTEGER NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlexibleTicketUseAllocation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FlexibleTicketUseAllocation_count_check" CHECK (
        "remainingUsesBefore" > 0
        AND "remainingUsesAfter" >= 0
        AND "remainingUsesAfter" = "remainingUsesBefore" - 1
    )
);

CREATE UNIQUE INDEX "FlexibleTicketRequest_requestNumber_key" ON "FlexibleTicketRequest"("requestNumber");
CREATE UNIQUE INDEX "FlexibleTicketRequest_idempotencyKey_key" ON "FlexibleTicketRequest"("idempotencyKey");
CREATE UNIQUE INDEX "FlexibleTicketRequest_ticketAdjustmentId_key" ON "FlexibleTicketRequest"("ticketAdjustmentId");
CREATE UNIQUE INDEX "FlexibleTicketRequest_bookingRescheduleId_key" ON "FlexibleTicketRequest"("bookingRescheduleId");
CREATE INDEX "FlexibleTicketRequest_organizationId_status_createdAt_idx" ON "FlexibleTicketRequest"("organizationId", "status", "createdAt");
CREATE INDEX "FlexibleTicketRequest_eventId_status_createdAt_idx" ON "FlexibleTicketRequest"("eventId", "status", "createdAt");
CREATE INDEX "FlexibleTicketRequest_bookingId_createdAt_idx" ON "FlexibleTicketRequest"("bookingId", "createdAt");
CREATE INDEX "FlexibleTicketRequest_reviewedByUserId_reviewedAt_idx" ON "FlexibleTicketRequest"("reviewedByUserId", "reviewedAt");
CREATE INDEX "FlexibleTicketRequest_destinationSessionId_idx" ON "FlexibleTicketRequest"("destinationSessionId");

CREATE UNIQUE INDEX "FlexibleTicketRequestItem_activeRequestKey_key" ON "FlexibleTicketRequestItem"("activeRequestKey");
CREATE UNIQUE INDEX "FlexibleTicketRequestItem_requestId_entitlementId_key" ON "FlexibleTicketRequestItem"("requestId", "entitlementId");
CREATE UNIQUE INDEX "FlexibleTicketRequestItem_requestId_ticketId_key" ON "FlexibleTicketRequestItem"("requestId", "ticketId");
CREATE INDEX "FlexibleTicketRequestItem_entitlementId_createdAt_idx" ON "FlexibleTicketRequestItem"("entitlementId", "createdAt");
CREATE INDEX "FlexibleTicketRequestItem_participantId_idx" ON "FlexibleTicketRequestItem"("participantId");
CREATE INDEX "FlexibleTicketRequestItem_ticketId_idx" ON "FlexibleTicketRequestItem"("ticketId");

CREATE UNIQUE INDEX "FlexibleTicketUseAllocation_requestId_entitlementId_key" ON "FlexibleTicketUseAllocation"("requestId", "entitlementId");
CREATE INDEX "FlexibleTicketUseAllocation_entitlementId_consumedAt_idx" ON "FlexibleTicketUseAllocation"("entitlementId", "consumedAt");

ALTER TABLE "FlexibleTicketRequest" ADD CONSTRAINT "FlexibleTicketRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequest" ADD CONSTRAINT "FlexibleTicketRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequest" ADD CONSTRAINT "FlexibleTicketRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequest" ADD CONSTRAINT "FlexibleTicketRequest_destinationSessionId_fkey" FOREIGN KEY ("destinationSessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequest" ADD CONSTRAINT "FlexibleTicketRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequest" ADD CONSTRAINT "FlexibleTicketRequest_ticketAdjustmentId_fkey" FOREIGN KEY ("ticketAdjustmentId") REFERENCES "TicketAdjustment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequest" ADD CONSTRAINT "FlexibleTicketRequest_bookingRescheduleId_fkey" FOREIGN KEY ("bookingRescheduleId") REFERENCES "BookingReschedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FlexibleTicketRequestItem" ADD CONSTRAINT "FlexibleTicketRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "FlexibleTicketRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequestItem" ADD CONSTRAINT "FlexibleTicketRequestItem_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "FlexibleTicketEntitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequestItem" ADD CONSTRAINT "FlexibleTicketRequestItem_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BookingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketRequestItem" ADD CONSTRAINT "FlexibleTicketRequestItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FlexibleTicketUseAllocation" ADD CONSTRAINT "FlexibleTicketUseAllocation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "FlexibleTicketRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketUseAllocation" ADD CONSTRAINT "FlexibleTicketUseAllocation_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "FlexibleTicketEntitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
