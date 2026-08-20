ALTER TABLE "BookingProduct"
ADD COLUMN "productVariantId" TEXT;

CREATE INDEX "BookingProduct_productVariantId_idx"
ON "BookingProduct"("productVariantId");

ALTER TABLE "BookingProduct"
ADD CONSTRAINT "BookingProduct_productVariantId_fkey"
FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
