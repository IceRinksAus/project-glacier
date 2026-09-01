CREATE TABLE "AuthenticationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthenticationSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthenticationSession_userId_revokedAt_expiresAt_idx"
ON "AuthenticationSession"("userId", "revokedAt", "expiresAt");

CREATE INDEX "AuthenticationSession_organizationId_expiresAt_idx"
ON "AuthenticationSession"("organizationId", "expiresAt");

ALTER TABLE "AuthenticationSession"
ADD CONSTRAINT "AuthenticationSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthenticationSession"
ADD CONSTRAINT "AuthenticationSession_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
