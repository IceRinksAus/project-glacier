CREATE TYPE "EventSiteContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "EventSiteContentVersion" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "EventSiteContentStatus" NOT NULL DEFAULT 'DRAFT',
    "aboutTitle" TEXT,
    "aboutBody" TEXT,
    "arrivalInfo" TEXT,
    "transportParkingInfo" TEXT,
    "accessibilityInfo" TEXT,
    "foodDrinkInfo" TEXT,
    "whatToBringInfo" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSiteContentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventSiteHighlight" (
    "id" TEXT NOT NULL,
    "contentVersionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "EventSiteHighlight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventSiteFaq" (
    "id" TEXT NOT NULL,
    "contentVersionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "EventSiteFaq_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventSiteContentVersion_eventId_version_key"
ON "EventSiteContentVersion"("eventId", "version");

CREATE INDEX "EventSiteContentVersion_eventId_status_idx"
ON "EventSiteContentVersion"("eventId", "status");

CREATE UNIQUE INDEX "EventSiteContentVersion_one_draft_per_event"
ON "EventSiteContentVersion"("eventId") WHERE "status" = 'DRAFT';

CREATE UNIQUE INDEX "EventSiteContentVersion_one_published_per_event"
ON "EventSiteContentVersion"("eventId") WHERE "status" = 'PUBLISHED';

CREATE UNIQUE INDEX "EventSiteHighlight_contentVersionId_sortOrder_key"
ON "EventSiteHighlight"("contentVersionId", "sortOrder");

CREATE UNIQUE INDEX "EventSiteFaq_contentVersionId_sortOrder_key"
ON "EventSiteFaq"("contentVersionId", "sortOrder");

ALTER TABLE "EventSiteContentVersion"
ADD CONSTRAINT "EventSiteContentVersion_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventSiteHighlight"
ADD CONSTRAINT "EventSiteHighlight_contentVersionId_fkey"
FOREIGN KEY ("contentVersionId") REFERENCES "EventSiteContentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventSiteFaq"
ADD CONSTRAINT "EventSiteFaq_contentVersionId_fkey"
FOREIGN KEY ("contentVersionId") REFERENCES "EventSiteContentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
