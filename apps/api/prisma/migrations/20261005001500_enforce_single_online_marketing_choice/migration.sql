-- A payment retry may reuse the first retained choice, but it cannot append a
-- contradictory second online choice for the same Booking.
CREATE UNIQUE INDEX "MarketingConsentEvidence_bookingId_online_key"
ON "MarketingConsentEvidence"("bookingId")
WHERE "bookingId" IS NOT NULL AND "channel" = 'ONLINE';
