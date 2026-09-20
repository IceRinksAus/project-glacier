-- Sprint 41: explicit Waiver template authority, Booking/participant coverage,
-- separated optional consent evidence and attributable staff association.

CREATE TYPE "WaiverTemplateAuthority" AS ENUM ('PLATFORM_CURATED', 'ORGANIZATION');
CREATE TYPE "WaiverAssociationAction" AS ENUM ('BOOKING_LINKED_SUBMISSION', 'STAFF_PARTICIPANT_MATCH', 'STAFF_PARTICIPANT_UNMATCH');

ALTER TABLE "WaiverTemplate"
  ADD COLUMN "authority" "WaiverTemplateAuthority" NOT NULL DEFAULT 'PLATFORM_CURATED',
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "approvalReference" TEXT,
  ADD COLUMN "approvedByUserId" TEXT;

ALTER TABLE "WaiverSubmission"
  ADD COLUMN "signatoryParticipating" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "bookingId" TEXT,
  ADD COLUMN "signatoryParticipantId" TEXT,
  ADD COLUMN "mediaConsent" BOOLEAN,
  ADD COLUMN "marketingConsent" BOOLEAN;

ALTER TABLE "WaiverMinor" ADD COLUMN "bookingParticipantId" TEXT;

CREATE TABLE "WaiverAssociationAudit" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "waiverSubmissionId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" "WaiverAssociationAction" NOT NULL,
  "participantIds" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WaiverAssociationAudit_pkey" PRIMARY KEY ("id")
);

DROP INDEX "WaiverTemplate_activityType_jurisdiction_revision_key";
DROP INDEX "WaiverTemplate_activityType_jurisdiction_status_idx";
CREATE UNIQUE INDEX "WaiverTemplate_organizationId_activityType_jurisdiction_revision_key" ON "WaiverTemplate"("organizationId", "activityType", "jurisdiction", "revision");
CREATE INDEX "WaiverTemplate_authority_activityType_jurisdiction_status_idx" ON "WaiverTemplate"("authority", "activityType", "jurisdiction", "status");
CREATE INDEX "WaiverTemplate_organizationId_status_idx" ON "WaiverTemplate"("organizationId", "status");
CREATE INDEX "WaiverSubmission_bookingId_idx" ON "WaiverSubmission"("bookingId");
CREATE INDEX "WaiverSubmission_signatoryParticipantId_idx" ON "WaiverSubmission"("signatoryParticipantId");
CREATE INDEX "WaiverMinor_bookingParticipantId_idx" ON "WaiverMinor"("bookingParticipantId");
CREATE INDEX "WaiverAssociationAudit_organizationId_createdAt_idx" ON "WaiverAssociationAudit"("organizationId", "createdAt");
CREATE INDEX "WaiverAssociationAudit_eventId_createdAt_idx" ON "WaiverAssociationAudit"("eventId", "createdAt");
CREATE INDEX "WaiverAssociationAudit_waiverSubmissionId_createdAt_idx" ON "WaiverAssociationAudit"("waiverSubmissionId", "createdAt");
CREATE INDEX "WaiverAssociationAudit_bookingId_createdAt_idx" ON "WaiverAssociationAudit"("bookingId", "createdAt");

ALTER TABLE "WaiverTemplate" ADD CONSTRAINT "WaiverTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaiverTemplate" ADD CONSTRAINT "WaiverTemplate_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WaiverTemplate" ADD CONSTRAINT "WaiverTemplate_authority_organization_check" CHECK (("authority" = 'PLATFORM_CURATED' AND "organizationId" IS NULL) OR ("authority" = 'ORGANIZATION' AND "organizationId" IS NOT NULL));
ALTER TABLE "WaiverSubmission" ADD CONSTRAINT "WaiverSubmission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WaiverSubmission" ADD CONSTRAINT "WaiverSubmission_signatoryParticipantId_fkey" FOREIGN KEY ("signatoryParticipantId") REFERENCES "BookingParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WaiverMinor" ADD CONSTRAINT "WaiverMinor_bookingParticipantId_fkey" FOREIGN KEY ("bookingParticipantId") REFERENCES "BookingParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WaiverAssociationAudit" ADD CONSTRAINT "WaiverAssociationAudit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaiverAssociationAudit" ADD CONSTRAINT "WaiverAssociationAudit_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaiverAssociationAudit" ADD CONSTRAINT "WaiverAssociationAudit_waiverSubmissionId_fkey" FOREIGN KEY ("waiverSubmissionId") REFERENCES "WaiverSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaiverAssociationAudit" ADD CONSTRAINT "WaiverAssociationAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
