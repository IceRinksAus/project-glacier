CREATE TYPE "RetailSaleStatus" AS ENUM ('RESERVED', 'COMPLETED', 'EXPIRED');

CREATE TYPE "RetailSalePaymentStatus" AS ENUM ('UNPAID', 'PAID');

CREATE TABLE "RetailSale" (
    "id" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "status" "RetailSaleStatus" NOT NULL DEFAULT 'RESERVED',
    "paymentStatus" "RetailSalePaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "eventId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "completedByUserId" TEXT,
    "reservedUntil" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailSale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetailSaleItem" (
    "id" TEXT NOT NULL,
    "retailSaleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "variantNameSnapshot" TEXT,
    "skuSnapshot" TEXT,
    "barcodeSnapshot" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetailSaleItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Payment" ALTER COLUMN "bookingId" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN "retailSaleId" TEXT;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_exactly_one_commerce_parent_check"
CHECK (num_nonnulls("bookingId", "retailSaleId") = 1);

CREATE UNIQUE INDEX "RetailSale_saleNumber_key" ON "RetailSale"("saleNumber");
CREATE INDEX "RetailSale_eventId_createdAt_idx" ON "RetailSale"("eventId", "createdAt");
CREATE INDEX "RetailSale_eventId_status_createdAt_idx" ON "RetailSale"("eventId", "status", "createdAt");
CREATE INDEX "RetailSale_createdByUserId_createdAt_idx" ON "RetailSale"("createdByUserId", "createdAt");
CREATE INDEX "RetailSale_completedByUserId_completedAt_idx" ON "RetailSale"("completedByUserId", "completedAt");
CREATE INDEX "RetailSaleItem_retailSaleId_idx" ON "RetailSaleItem"("retailSaleId");
CREATE INDEX "RetailSaleItem_productId_idx" ON "RetailSaleItem"("productId");
CREATE INDEX "RetailSaleItem_productVariantId_idx" ON "RetailSaleItem"("productVariantId");
CREATE INDEX "Payment_retailSaleId_idx" ON "Payment"("retailSaleId");

ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailSale" ADD CONSTRAINT "RetailSale_completedByUserId_fkey"
FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailSaleItem" ADD CONSTRAINT "RetailSaleItem_retailSaleId_fkey"
FOREIGN KEY ("retailSaleId") REFERENCES "RetailSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetailSaleItem" ADD CONSTRAINT "RetailSaleItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailSaleItem" ADD CONSTRAINT "RetailSaleItem_productVariantId_fkey"
FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_retailSaleId_fkey"
FOREIGN KEY ("retailSaleId") REFERENCES "RetailSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
