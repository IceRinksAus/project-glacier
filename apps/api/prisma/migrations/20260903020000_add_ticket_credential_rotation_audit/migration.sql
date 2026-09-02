CREATE TABLE "TicketCredentialRotationAudit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "previousKeyId" TEXT NOT NULL,
    "newKeyId" TEXT NOT NULL,
    "legacyCredentialRevoked" BOOLEAN NOT NULL,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketCredentialRotationAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketCredentialRotationAudit_organizationId_rotatedAt_idx"
ON "TicketCredentialRotationAudit"("organizationId", "rotatedAt");

CREATE INDEX "TicketCredentialRotationAudit_eventId_rotatedAt_idx"
ON "TicketCredentialRotationAudit"("eventId", "rotatedAt");

CREATE INDEX "TicketCredentialRotationAudit_ticketId_rotatedAt_idx"
ON "TicketCredentialRotationAudit"("ticketId", "rotatedAt");

CREATE INDEX "TicketCredentialRotationAudit_actorUserId_rotatedAt_idx"
ON "TicketCredentialRotationAudit"("actorUserId", "rotatedAt");

ALTER TABLE "TicketCredentialRotationAudit"
ADD CONSTRAINT "TicketCredentialRotationAudit_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TicketCredentialRotationAudit"
ADD CONSTRAINT "TicketCredentialRotationAudit_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TicketCredentialRotationAudit"
ADD CONSTRAINT "TicketCredentialRotationAudit_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TicketCredentialRotationAudit"
ADD CONSTRAINT "TicketCredentialRotationAudit_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
