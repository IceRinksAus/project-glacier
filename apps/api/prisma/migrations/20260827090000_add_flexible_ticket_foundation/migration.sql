-- CreateEnum
CREATE TYPE "FlexibleTicketEventMode" AS ENUM ('DISABLED', 'INHERIT', 'OVERRIDE');

-- CreateEnum
CREATE TYPE "FlexibleTicketPolicyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "FlexibleTicketFeeType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "FlexibleTicketPriceIncreaseTreatment" AS ENUM ('CUSTOMER_PAYS_DIFFERENCE', 'CHANGE_NOT_PERMITTED');

-- CreateEnum
CREATE TYPE "FlexibleTicketPriceDecreaseTreatment" AS ENUM ('KEEP_ORIGINAL_PRICE', 'REFUND_DIFFERENCE');

-- CreateEnum
CREATE TYPE "FlexibleTicketFeeRefundability" AS ENUM ('NON_REFUNDABLE', 'REFUNDABLE_WITH_TICKET', 'EVENT_CANCELLATION_ONLY');

-- CreateEnum
CREATE TYPE "FlexibleTicketEntitlementStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- Existing Events remain disabled. No current Booking Boolean is converted into
-- policy or entitlement authority by this migration.
ALTER TABLE "Event"
ADD COLUMN "flexibleTicketMode" "FlexibleTicketEventMode" NOT NULL DEFAULT 'DISABLED';

-- CreateTable
CREATE TABLE "FlexibleTicketPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT,
    "version" INTEGER NOT NULL,
    "status" "FlexibleTicketPolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "available" BOOLEAN NOT NULL DEFAULT false,
    "feeType" "FlexibleTicketFeeType" NOT NULL,
    "feeValue" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "allowsSessionChange" BOOLEAN NOT NULL,
    "allowsRefundRequest" BOOLEAN NOT NULL,
    "cutoffMinutesBeforeSession" INTEGER NOT NULL,
    "permittedUseLimit" INTEGER NOT NULL,
    "priceIncreaseTreatment" "FlexibleTicketPriceIncreaseTreatment" NOT NULL,
    "priceDecreaseTreatment" "FlexibleTicketPriceDecreaseTreatment" NOT NULL,
    "feeRefundability" "FlexibleTicketFeeRefundability" NOT NULL,
    "customerSummary" TEXT NOT NULL,
    "materialTerms" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "publishedByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlexibleTicketPolicy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FlexibleTicketPolicy_version_check" CHECK ("version" > 0),
    CONSTRAINT "FlexibleTicketPolicy_fee_check" CHECK (
        "feeValue" > 0
        AND ("feeType" <> 'PERCENTAGE' OR "feeValue" <= 100)
    ),
    CONSTRAINT "FlexibleTicketPolicy_cutoff_check" CHECK ("cutoffMinutesBeforeSession" >= 0),
    CONSTRAINT "FlexibleTicketPolicy_use_limit_check" CHECK ("permittedUseLimit" > 0),
    CONSTRAINT "FlexibleTicketPolicy_currency_check" CHECK (char_length("currency") = 3),
    CONSTRAINT "FlexibleTicketPolicy_publish_state_check" CHECK (
        ("status" = 'DRAFT' AND "publishedAt" IS NULL AND "publishedByUserId" IS NULL AND "supersededAt" IS NULL)
        OR ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL AND "publishedByUserId" IS NOT NULL AND "supersededAt" IS NULL)
        OR ("status" = 'SUPERSEDED' AND "publishedAt" IS NOT NULL AND "publishedByUserId" IS NOT NULL AND "supersededAt" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "FlexibleTicketEntitlement" (
    "id" TEXT NOT NULL,
    "entitlementNumber" TEXT NOT NULL,
    "status" "FlexibleTicketEntitlementStatus" NOT NULL DEFAULT 'PENDING',
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "initialTicketId" TEXT,
    "ticketTypeId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "activatedByPaymentId" TEXT,
    "policySourceMode" "FlexibleTicketEventMode" NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "ticketTypeNameSnapshot" TEXT NOT NULL,
    "ticketFaceValueSnapshot" DECIMAL(10,2) NOT NULL,
    "feeTypeSnapshot" "FlexibleTicketFeeType" NOT NULL,
    "feeValueSnapshot" DECIMAL(10,2) NOT NULL,
    "feeAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "allowsSessionChangeSnapshot" BOOLEAN NOT NULL,
    "allowsRefundRequestSnapshot" BOOLEAN NOT NULL,
    "cutoffMinutesBeforeSessionSnapshot" INTEGER NOT NULL,
    "permittedUseLimitSnapshot" INTEGER NOT NULL,
    "remainingUses" INTEGER NOT NULL,
    "priceIncreaseTreatmentSnapshot" "FlexibleTicketPriceIncreaseTreatment" NOT NULL,
    "priceDecreaseTreatmentSnapshot" "FlexibleTicketPriceDecreaseTreatment" NOT NULL,
    "feeRefundabilitySnapshot" "FlexibleTicketFeeRefundability" NOT NULL,
    "customerSummarySnapshot" TEXT NOT NULL,
    "materialTermsSnapshot" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlexibleTicketEntitlement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FlexibleTicketEntitlement_policy_source_check" CHECK ("policySourceMode" <> 'DISABLED'),
    CONSTRAINT "FlexibleTicketEntitlement_policy_version_check" CHECK ("policyVersion" > 0),
    CONSTRAINT "FlexibleTicketEntitlement_value_check" CHECK (
        "ticketFaceValueSnapshot" >= 0
        AND "feeValueSnapshot" > 0
        AND "feeAmount" >= 0
        AND ("feeTypeSnapshot" <> 'PERCENTAGE' OR "feeValueSnapshot" <= 100)
    ),
    CONSTRAINT "FlexibleTicketEntitlement_cutoff_check" CHECK ("cutoffMinutesBeforeSessionSnapshot" >= 0),
    CONSTRAINT "FlexibleTicketEntitlement_use_check" CHECK (
        "permittedUseLimitSnapshot" > 0
        AND "remainingUses" >= 0
        AND "remainingUses" <= "permittedUseLimitSnapshot"
    ),
    CONSTRAINT "FlexibleTicketEntitlement_currency_check" CHECK (char_length("currency") = 3),
    CONSTRAINT "FlexibleTicketEntitlement_activation_check" CHECK (
        "status" <> 'ACTIVE'
        OR (
            "initialTicketId" IS NOT NULL
            AND "activatedByPaymentId" IS NOT NULL
            AND "activatedAt" IS NOT NULL
        )
    )
);

-- Scope/version and lifecycle uniqueness. PostgreSQL treats NULL values as
-- distinct, so Organisation defaults use explicit partial indexes.
CREATE UNIQUE INDEX "FlexibleTicketPolicy_eventId_version_key"
ON "FlexibleTicketPolicy"("eventId", "version");

CREATE UNIQUE INDEX "FlexibleTicketPolicy_org_default_version_key"
ON "FlexibleTicketPolicy"("organizationId", "version")
WHERE "eventId" IS NULL;

CREATE UNIQUE INDEX "FlexibleTicketPolicy_one_published_org_default_key"
ON "FlexibleTicketPolicy"("organizationId")
WHERE "eventId" IS NULL AND "status" = 'PUBLISHED';

CREATE UNIQUE INDEX "FlexibleTicketPolicy_one_draft_org_default_key"
ON "FlexibleTicketPolicy"("organizationId")
WHERE "eventId" IS NULL AND "status" = 'DRAFT';

CREATE UNIQUE INDEX "FlexibleTicketPolicy_one_published_event_key"
ON "FlexibleTicketPolicy"("eventId")
WHERE "eventId" IS NOT NULL AND "status" = 'PUBLISHED';

CREATE UNIQUE INDEX "FlexibleTicketPolicy_one_draft_event_key"
ON "FlexibleTicketPolicy"("eventId")
WHERE "eventId" IS NOT NULL AND "status" = 'DRAFT';

CREATE INDEX "FlexibleTicketPolicy_organizationId_status_createdAt_idx"
ON "FlexibleTicketPolicy"("organizationId", "status", "createdAt");
CREATE INDEX "FlexibleTicketPolicy_eventId_status_createdAt_idx"
ON "FlexibleTicketPolicy"("eventId", "status", "createdAt");
CREATE INDEX "FlexibleTicketPolicy_createdByUserId_createdAt_idx"
ON "FlexibleTicketPolicy"("createdByUserId", "createdAt");
CREATE INDEX "FlexibleTicketPolicy_publishedByUserId_publishedAt_idx"
ON "FlexibleTicketPolicy"("publishedByUserId", "publishedAt");

CREATE UNIQUE INDEX "FlexibleTicketEntitlement_entitlementNumber_key"
ON "FlexibleTicketEntitlement"("entitlementNumber");
CREATE UNIQUE INDEX "FlexibleTicketEntitlement_participantId_key"
ON "FlexibleTicketEntitlement"("participantId");
CREATE UNIQUE INDEX "FlexibleTicketEntitlement_initialTicketId_key"
ON "FlexibleTicketEntitlement"("initialTicketId");
CREATE INDEX "FlexibleTicketEntitlement_organizationId_createdAt_idx"
ON "FlexibleTicketEntitlement"("organizationId", "createdAt");
CREATE INDEX "FlexibleTicketEntitlement_eventId_createdAt_idx"
ON "FlexibleTicketEntitlement"("eventId", "createdAt");
CREATE INDEX "FlexibleTicketEntitlement_bookingId_createdAt_idx"
ON "FlexibleTicketEntitlement"("bookingId", "createdAt");
CREATE INDEX "FlexibleTicketEntitlement_policyId_createdAt_idx"
ON "FlexibleTicketEntitlement"("policyId", "createdAt");
CREATE INDEX "FlexibleTicketEntitlement_status_createdAt_idx"
ON "FlexibleTicketEntitlement"("status", "createdAt");
CREATE INDEX "FlexibleTicketEntitlement_ticketTypeId_idx"
ON "FlexibleTicketEntitlement"("ticketTypeId");
CREATE INDEX "FlexibleTicketEntitlement_activatedByPaymentId_idx"
ON "FlexibleTicketEntitlement"("activatedByPaymentId");

-- AddForeignKey
ALTER TABLE "FlexibleTicketPolicy" ADD CONSTRAINT "FlexibleTicketPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketPolicy" ADD CONSTRAINT "FlexibleTicketPolicy_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketPolicy" ADD CONSTRAINT "FlexibleTicketPolicy_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketPolicy" ADD CONSTRAINT "FlexibleTicketPolicy_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FlexibleTicketEntitlement" ADD CONSTRAINT "FlexibleTicketEntitlement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketEntitlement" ADD CONSTRAINT "FlexibleTicketEntitlement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketEntitlement" ADD CONSTRAINT "FlexibleTicketEntitlement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketEntitlement" ADD CONSTRAINT "FlexibleTicketEntitlement_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BookingParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketEntitlement" ADD CONSTRAINT "FlexibleTicketEntitlement_initialTicketId_fkey" FOREIGN KEY ("initialTicketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketEntitlement" ADD CONSTRAINT "FlexibleTicketEntitlement_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketEntitlement" ADD CONSTRAINT "FlexibleTicketEntitlement_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "FlexibleTicketPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FlexibleTicketEntitlement" ADD CONSTRAINT "FlexibleTicketEntitlement_activatedByPaymentId_fkey" FOREIGN KEY ("activatedByPaymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
