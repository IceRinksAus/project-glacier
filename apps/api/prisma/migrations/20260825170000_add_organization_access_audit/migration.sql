CREATE TABLE "OrganizationAccessAudit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationAccessAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrganizationAccessAudit_organizationId_createdAt_idx"
ON "OrganizationAccessAudit"("organizationId", "createdAt");

CREATE INDEX "OrganizationAccessAudit_targetUserId_createdAt_idx"
ON "OrganizationAccessAudit"("targetUserId", "createdAt");

ALTER TABLE "OrganizationAccessAudit"
ADD CONSTRAINT "OrganizationAccessAudit_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationAccessAudit"
ADD CONSTRAINT "OrganizationAccessAudit_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationAccessAudit"
ADD CONSTRAINT "OrganizationAccessAudit_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
