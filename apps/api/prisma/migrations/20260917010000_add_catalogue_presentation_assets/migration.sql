ALTER TYPE "FileAssetPurpose" ADD VALUE 'PRODUCT_IMAGE';
ALTER TYPE "FileAssetPurpose" ADD VALUE 'TICKET_TYPE_IMAGE';

ALTER TABLE "Product"
ADD COLUMN "imageAssetId" TEXT;

ALTER TABLE "TicketType"
ADD COLUMN "tileLabel" TEXT,
ADD COLUMN "tileColor" TEXT NOT NULL DEFAULT '#0B6CE3',
ADD COLUMN "imageAssetId" TEXT;

CREATE UNIQUE INDEX "Product_imageAssetId_key" ON "Product"("imageAssetId");
CREATE UNIQUE INDEX "TicketType_imageAssetId_key" ON "TicketType"("imageAssetId");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_imageAssetId_fkey"
FOREIGN KEY ("imageAssetId") REFERENCES "FileAsset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TicketType"
ADD CONSTRAINT "TicketType_imageAssetId_fkey"
FOREIGN KEY ("imageAssetId") REFERENCES "FileAsset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
