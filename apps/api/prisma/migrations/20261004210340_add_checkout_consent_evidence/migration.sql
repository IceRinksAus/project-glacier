-- CreateEnum
CREATE TYPE "CheckoutDocumentType" AS ENUM ('TICKETING_TERMS', 'PRIVACY_NOTICE', 'MARKETING_DISCLOSURE');

-- CreateEnum
CREATE TYPE "CheckoutDocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "CheckoutAcceptanceChannel" AS ENUM ('ONLINE', 'POS');

-- CreateEnum
CREATE TYPE "MarketingConsentDecision" AS ENUM ('GRANTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MarketingConsentChannel" AS ENUM ('ONLINE', 'ADMIN_RECORDED');

-- CreateTable
CREATE TABLE "CheckoutDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "CheckoutDocumentType" NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "CheckoutDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "testOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCheckoutAcceptance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "termsDocumentId" TEXT NOT NULL,
    "termsVersion" INTEGER NOT NULL,
    "termsContentHash" TEXT NOT NULL,
    "privacyDocumentId" TEXT NOT NULL,
    "privacyVersion" INTEGER NOT NULL,
    "privacyContentHash" TEXT NOT NULL,
    "channel" "CheckoutAcceptanceChannel" NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingCheckoutAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingConsentEvidence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "disclosureDocumentId" TEXT,
    "disclosureVersion" INTEGER,
    "disclosureContentHash" TEXT,
    "senderName" TEXT,
    "decision" "MarketingConsentDecision" NOT NULL,
    "channel" "MarketingConsentChannel" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingConsentEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutDocument_organizationId_eventId_type_status_idx" ON "CheckoutDocument"("organizationId", "eventId", "type", "status");

-- CreateIndex
CREATE INDEX "CheckoutDocument_publishedByUserId_publishedAt_idx" ON "CheckoutDocument"("publishedByUserId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutDocument_eventId_type_version_key" ON "CheckoutDocument"("eventId", "type", "version");

-- An Event may expose only one current published document of each type.
CREATE UNIQUE INDEX "CheckoutDocument_eventId_type_published_key"
ON "CheckoutDocument"("eventId", "type")
WHERE "status" = 'PUBLISHED';

-- CreateIndex
CREATE UNIQUE INDEX "BookingCheckoutAcceptance_bookingId_key" ON "BookingCheckoutAcceptance"("bookingId");

-- CreateIndex
CREATE INDEX "BookingCheckoutAcceptance_organizationId_acceptedAt_idx" ON "BookingCheckoutAcceptance"("organizationId", "acceptedAt");

-- CreateIndex
CREATE INDEX "BookingCheckoutAcceptance_eventId_acceptedAt_idx" ON "BookingCheckoutAcceptance"("eventId", "acceptedAt");

-- CreateIndex
CREATE INDEX "BookingCheckoutAcceptance_customerId_acceptedAt_idx" ON "BookingCheckoutAcceptance"("customerId", "acceptedAt");

-- CreateIndex
CREATE INDEX "MarketingConsentEvidence_organizationId_customerId_occurred_idx" ON "MarketingConsentEvidence"("organizationId", "customerId", "occurredAt");

-- CreateIndex
CREATE INDEX "MarketingConsentEvidence_eventId_occurredAt_idx" ON "MarketingConsentEvidence"("eventId", "occurredAt");

-- CreateIndex
CREATE INDEX "MarketingConsentEvidence_bookingId_idx" ON "MarketingConsentEvidence"("bookingId");

-- AddForeignKey
ALTER TABLE "CheckoutDocument" ADD CONSTRAINT "CheckoutDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutDocument" ADD CONSTRAINT "CheckoutDocument_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutDocument" ADD CONSTRAINT "CheckoutDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutDocument" ADD CONSTRAINT "CheckoutDocument_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_termsDocumentId_fkey" FOREIGN KEY ("termsDocumentId") REFERENCES "CheckoutDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_privacyDocumentId_fkey" FOREIGN KEY ("privacyDocumentId") REFERENCES "CheckoutDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingConsentEvidence" ADD CONSTRAINT "MarketingConsentEvidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingConsentEvidence" ADD CONSTRAINT "MarketingConsentEvidence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingConsentEvidence" ADD CONSTRAINT "MarketingConsentEvidence_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingConsentEvidence" ADD CONSTRAINT "MarketingConsentEvidence_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingConsentEvidence" ADD CONSTRAINT "MarketingConsentEvidence_disclosureDocumentId_fkey" FOREIGN KEY ("disclosureDocumentId") REFERENCES "CheckoutDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingConsentEvidence" ADD CONSTRAINT "MarketingConsentEvidence_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Published and superseded documents must retain attributable publication
-- evidence. Drafts cannot masquerade as previously published documents.
ALTER TABLE "CheckoutDocument" ADD CONSTRAINT "CheckoutDocument_version_positive_check"
CHECK ("version" > 0);

ALTER TABLE "CheckoutDocument" ADD CONSTRAINT "CheckoutDocument_content_evidence_check"
CHECK (
  length(btrim("title")) > 0
  AND length(btrim("content")) > 0
  AND length(btrim("contentHash")) > 0
);

ALTER TABLE "CheckoutDocument" ADD CONSTRAINT "CheckoutDocument_publication_evidence_check"
CHECK (
  ("status" = 'DRAFT' AND "publishedAt" IS NULL AND "publishedByUserId" IS NULL)
  OR
  ("status" IN ('PUBLISHED', 'SUPERSEDED') AND "publishedAt" IS NOT NULL AND "publishedByUserId" IS NOT NULL)
);

-- Online acceptance is customer-originated. POS acceptance is an attributed
-- staff action. The two channels cannot be confused in retained evidence.
ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_document_evidence_check"
CHECK (
  "termsVersion" > 0
  AND "privacyVersion" > 0
  AND length(btrim("termsContentHash")) > 0
  AND length(btrim("privacyContentHash")) > 0
  AND "termsDocumentId" <> "privacyDocumentId"
);

ALTER TABLE "BookingCheckoutAcceptance" ADD CONSTRAINT "BookingCheckoutAcceptance_channel_actor_check"
CHECK (
  ("channel" = 'ONLINE' AND "recordedByUserId" IS NULL)
  OR
  ("channel" = 'POS' AND "recordedByUserId" IS NOT NULL)
);

-- Sprint 44 permits an optional online adult choice and an attributable
-- organiser withdrawal. POS marketing collection is intentionally excluded.
ALTER TABLE "MarketingConsentEvidence" ADD CONSTRAINT "MarketingConsentEvidence_decision_evidence_check"
CHECK (
  (
    "channel" = 'ONLINE'
    AND "decision" IN ('GRANTED', 'DECLINED')
    AND "eventId" IS NOT NULL
    AND "bookingId" IS NOT NULL
    AND "disclosureDocumentId" IS NOT NULL
    AND "disclosureVersion" > 0
    AND length(btrim("disclosureContentHash")) > 0
    AND length(btrim("senderName")) > 0
    AND "actorUserId" IS NULL
  )
  OR
  (
    "channel" = 'ADMIN_RECORDED'
    AND "decision" = 'WITHDRAWN'
    AND "actorUserId" IS NOT NULL
  )
);
