CREATE TABLE "EventGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventGroupEvent" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "eventGroupId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGroupEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventGroup_organizationId_name_key" ON "EventGroup"("organizationId", "name");
CREATE UNIQUE INDEX "EventGroup_organizationId_name_ci_key" ON "EventGroup"("organizationId", lower("name"));
CREATE INDEX "EventGroup_organizationId_status_idx" ON "EventGroup"("organizationId", "status");
CREATE UNIQUE INDEX "EventGroupEvent_eventGroupId_eventId_key" ON "EventGroupEvent"("eventGroupId", "eventId");
CREATE INDEX "EventGroupEvent_eventId_idx" ON "EventGroupEvent"("eventId");
CREATE INDEX "EventGroupEvent_eventGroupId_sortOrder_idx" ON "EventGroupEvent"("eventGroupId", "sortOrder");

ALTER TABLE "EventGroup" ADD CONSTRAINT "EventGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventGroupEvent" ADD CONSTRAINT "EventGroupEvent_eventGroupId_fkey" FOREIGN KEY ("eventGroupId") REFERENCES "EventGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventGroupEvent" ADD CONSTRAINT "EventGroupEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
