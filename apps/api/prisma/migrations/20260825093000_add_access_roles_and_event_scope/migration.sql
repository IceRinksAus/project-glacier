CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF', 'SCANNER');
CREATE TYPE "OrganizationAccessScope" AS ENUM ('ALL_EVENTS', 'ASSIGNED_EVENTS');

ALTER TABLE "UserOrganization"
ADD COLUMN "accessScope" "OrganizationAccessScope" NOT NULL DEFAULT 'ALL_EVENTS';

ALTER TABLE "UserOrganization"
ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "UserOrganization"
ALTER COLUMN "role" TYPE "OrganizationRole"
USING (
  CASE
    WHEN "role" = 'OWNER' THEN 'OWNER'
    WHEN "role" = 'SCANNER' THEN 'SCANNER'
    ELSE 'STAFF'
  END
)::"OrganizationRole";

ALTER TABLE "UserOrganization"
ALTER COLUMN "role" SET DEFAULT 'STAFF';

CREATE TABLE "UserEventAccess" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEventAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserEventAccess_eventId_userId_key"
ON "UserEventAccess"("eventId", "userId");

CREATE INDEX "UserEventAccess_userId_idx"
ON "UserEventAccess"("userId");

ALTER TABLE "UserEventAccess"
ADD CONSTRAINT "UserEventAccess_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserEventAccess"
ADD CONSTRAINT "UserEventAccess_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
