-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'BOOKING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "message" TEXT,
    "stopProcessing" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rule_eventId_idx" ON "Rule"("eventId");

-- CreateIndex
CREATE INDEX "Rule_eventId_status_priority_idx" ON "Rule"("eventId", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_eventId_slug_key" ON "Rule"("eventId", "slug");

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
