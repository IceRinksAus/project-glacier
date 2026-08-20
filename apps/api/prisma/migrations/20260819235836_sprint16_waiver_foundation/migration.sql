-- CreateEnum
CREATE TYPE "AustralianJurisdiction" AS ENUM ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA');

-- CreateEnum
CREATE TYPE "EventActivityType" AS ENUM ('ICE_SKATING', 'OTHER');

-- CreateEnum
CREATE TYPE "WaiverTemplateStatus" AS ENUM ('DRAFT', 'APPROVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "WaiverVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "activityType" "EventActivityType",
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'AU',
ADD COLUMN     "jurisdiction" "AustralianJurisdiction",
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "suburb" TEXT,
ADD COLUMN     "venueName" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "abn" TEXT,
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'AU',
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "suburb" TEXT,
ADD COLUMN     "tradingName" TEXT;

-- CreateTable
CREATE TABLE "EventWaiver" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventWaiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activityType" "EventActivityType" NOT NULL,
    "jurisdiction" "AustralianJurisdiction" NOT NULL,
    "revision" INTEGER NOT NULL,
    "contentTemplate" TEXT NOT NULL,
    "acceptanceStatement" TEXT NOT NULL,
    "legislationReferences" JSONB,
    "status" "WaiverTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaiverTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverVersion" (
    "id" TEXT NOT NULL,
    "eventWaiverId" TEXT NOT NULL,
    "sourceTemplateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "acceptanceStatement" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "status" "WaiverVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaiverVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverSubmission" (
    "id" TEXT NOT NULL,
    "eventWaiverId" TEXT NOT NULL,
    "waiverVersionId" TEXT NOT NULL,
    "signatoryFullName" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waiverContentHash" TEXT NOT NULL,
    "acceptanceStatementHash" TEXT NOT NULL,
    "verificationTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaiverSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverMinor" (
    "id" TEXT NOT NULL,
    "waiverSubmissionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaiverMinor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventWaiver_eventId_key" ON "EventWaiver"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventWaiver_publicSlug_key" ON "EventWaiver"("publicSlug");

-- CreateIndex
CREATE INDEX "WaiverTemplate_activityType_jurisdiction_status_idx" ON "WaiverTemplate"("activityType", "jurisdiction", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WaiverTemplate_activityType_jurisdiction_revision_key" ON "WaiverTemplate"("activityType", "jurisdiction", "revision");

-- CreateIndex
CREATE INDEX "WaiverVersion_eventWaiverId_status_idx" ON "WaiverVersion"("eventWaiverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WaiverVersion_eventWaiverId_version_key" ON "WaiverVersion"("eventWaiverId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WaiverSubmission_verificationTokenHash_key" ON "WaiverSubmission"("verificationTokenHash");

-- CreateIndex
CREATE INDEX "WaiverSubmission_eventWaiverId_acceptedAt_idx" ON "WaiverSubmission"("eventWaiverId", "acceptedAt");

-- CreateIndex
CREATE INDEX "WaiverSubmission_waiverVersionId_idx" ON "WaiverSubmission"("waiverVersionId");

-- CreateIndex
CREATE INDEX "WaiverSubmission_signatoryFullName_idx" ON "WaiverSubmission"("signatoryFullName");

-- CreateIndex
CREATE INDEX "WaiverMinor_waiverSubmissionId_idx" ON "WaiverMinor"("waiverSubmissionId");

-- AddForeignKey
ALTER TABLE "EventWaiver" ADD CONSTRAINT "EventWaiver_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverVersion" ADD CONSTRAINT "WaiverVersion_eventWaiverId_fkey" FOREIGN KEY ("eventWaiverId") REFERENCES "EventWaiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverVersion" ADD CONSTRAINT "WaiverVersion_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "WaiverTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverVersion" ADD CONSTRAINT "WaiverVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverSubmission" ADD CONSTRAINT "WaiverSubmission_eventWaiverId_fkey" FOREIGN KEY ("eventWaiverId") REFERENCES "EventWaiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverSubmission" ADD CONSTRAINT "WaiverSubmission_waiverVersionId_fkey" FOREIGN KEY ("waiverVersionId") REFERENCES "WaiverVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverMinor" ADD CONSTRAINT "WaiverMinor_waiverSubmissionId_fkey" FOREIGN KEY ("waiverSubmissionId") REFERENCES "WaiverSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
