CREATE TYPE "ProductCollectionPassStatus" AS ENUM ('ACTIVE', 'COLLECTED', 'CANCELLED');

CREATE TABLE "ProductCollectionPass" (
    "id" TEXT NOT NULL,
    "passNumber" TEXT NOT NULL,
    "credentialSelector" TEXT NOT NULL,
    "credentialKeyId" TEXT NOT NULL,
    "status" "ProductCollectionPassStatus" NOT NULL DEFAULT 'ACTIVE',
    "bookingId" TEXT NOT NULL,
    "bookingProductId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "variantNameSnapshot" TEXT,
    "quantity" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedAt" TIMESTAMP(3),
    "collectedByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCollectionPass_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductCollectionPass_quantity_check" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX "ProductCollectionPass_passNumber_key" ON "ProductCollectionPass"("passNumber");
CREATE UNIQUE INDEX "ProductCollectionPass_credentialSelector_key" ON "ProductCollectionPass"("credentialSelector");
CREATE UNIQUE INDEX "ProductCollectionPass_bookingProductId_key" ON "ProductCollectionPass"("bookingProductId");
CREATE INDEX "ProductCollectionPass_bookingId_idx" ON "ProductCollectionPass"("bookingId");
CREATE INDEX "ProductCollectionPass_productId_idx" ON "ProductCollectionPass"("productId");
CREATE INDEX "ProductCollectionPass_status_idx" ON "ProductCollectionPass"("status");
CREATE INDEX "ProductCollectionPass_collectedByUserId_idx" ON "ProductCollectionPass"("collectedByUserId");

ALTER TABLE "ProductCollectionPass" ADD CONSTRAINT "ProductCollectionPass_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCollectionPass" ADD CONSTRAINT "ProductCollectionPass_bookingProductId_fkey" FOREIGN KEY ("bookingProductId") REFERENCES "BookingProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCollectionPass" ADD CONSTRAINT "ProductCollectionPass_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductCollectionPass" ADD CONSTRAINT "ProductCollectionPass_collectedByUserId_fkey" FOREIGN KEY ("collectedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
