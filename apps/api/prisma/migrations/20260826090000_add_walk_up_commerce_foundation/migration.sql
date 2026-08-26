CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'WALK_UP');
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE_CARD', 'CASH', 'STANDALONE_EFTPOS');

ALTER TABLE "Booking"
ADD COLUMN "source" "BookingSource" NOT NULL DEFAULT 'ONLINE';

ALTER TABLE "Payment"
ADD COLUMN "method" "PaymentMethod" NOT NULL DEFAULT 'ONLINE_CARD',
ADD COLUMN "standaloneReference" TEXT,
ADD COLUMN "receivedAt" TIMESTAMP(3),
ADD COLUMN "receivedByUserId" TEXT;

CREATE INDEX "Booking_eventId_source_idx"
ON "Booking"("eventId", "source");

CREATE INDEX "Payment_method_status_idx"
ON "Payment"("method", "status");

CREATE INDEX "Payment_receivedByUserId_idx"
ON "Payment"("receivedByUserId");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_receivedByUserId_fkey"
FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
