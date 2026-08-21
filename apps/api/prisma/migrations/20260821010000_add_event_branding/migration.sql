-- CreateTable
CREATE TABLE "EventBranding" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#0F172A',
    "secondaryColor" TEXT NOT NULL DEFAULT '#334155',
    "accentColor" TEXT NOT NULL DEFAULT '#0EA5E9',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "surfaceColor" TEXT NOT NULL DEFAULT '#F8FAFC',
    "textColor" TEXT NOT NULL DEFAULT '#0F172A',
    "headingFont" TEXT NOT NULL DEFAULT 'INTER',
    "bodyFont" TEXT NOT NULL DEFAULT 'INTER',
    "heroHeadline" TEXT,
    "heroDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventBranding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventBranding_eventId_key" ON "EventBranding"("eventId");

-- AddForeignKey
ALTER TABLE "EventBranding" ADD CONSTRAINT "EventBranding_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
