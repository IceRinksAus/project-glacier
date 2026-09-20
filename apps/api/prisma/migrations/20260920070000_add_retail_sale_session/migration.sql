ALTER TABLE "RetailSale" ADD COLUMN "sessionId" TEXT;

CREATE INDEX "RetailSale_sessionId_status_idx"
ON "RetailSale"("sessionId", "status");

ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
