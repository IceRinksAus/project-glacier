-- Preserve platform template revision uniqueness when organizationId is NULL,
-- and ensure every association audit references a real Booking.

CREATE UNIQUE INDEX "WaiverTemplate_platform_activity_jurisdiction_revision_key"
  ON "WaiverTemplate"("activityType", "jurisdiction", "revision")
  WHERE "authority" = 'PLATFORM_CURATED';

ALTER TABLE "WaiverAssociationAudit"
  ADD CONSTRAINT "WaiverAssociationAudit_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
