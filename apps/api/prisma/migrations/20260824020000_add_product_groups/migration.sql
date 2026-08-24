CREATE TABLE "ProductGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGroup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product"
ADD COLUMN "productGroupId" TEXT;

CREATE UNIQUE INDEX "ProductGroup_eventId_name_key"
ON "ProductGroup"("eventId", "name");

CREATE INDEX "ProductGroup_eventId_sortOrder_idx"
ON "ProductGroup"("eventId", "sortOrder");

CREATE INDEX "Product_productGroupId_idx"
ON "Product"("productGroupId");

ALTER TABLE "ProductGroup"
ADD CONSTRAINT "ProductGroup_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_productGroupId_fkey"
FOREIGN KEY ("productGroupId") REFERENCES "ProductGroup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
