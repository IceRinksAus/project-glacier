CREATE TYPE "FileAssetPurpose" AS ENUM ('EVENT_LOGO', 'EVENT_HERO');
CREATE TYPE "FileAssetStatus" AS ENUM ('READY', 'REPLACED', 'FAILED');

ALTER TABLE "EventBranding" ADD COLUMN "heroAssetId" TEXT,
ADD COLUMN "logoAssetId" TEXT;

CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "purpose" "FileAssetPurpose" NOT NULL,
    "status" "FileAssetStatus" NOT NULL DEFAULT 'READY',
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventBranding_heroAssetId_key" ON "EventBranding"("heroAssetId");
CREATE UNIQUE INDEX "EventBranding_logoAssetId_key" ON "EventBranding"("logoAssetId");
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "FileAsset"("storageKey");
CREATE INDEX "FileAsset_organizationId_eventId_idx" ON "FileAsset"("organizationId", "eventId");

ALTER TABLE "EventBranding" ADD CONSTRAINT "EventBranding_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventBranding" ADD CONSTRAINT "EventBranding_heroAssetId_fkey" FOREIGN KEY ("heroAssetId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
