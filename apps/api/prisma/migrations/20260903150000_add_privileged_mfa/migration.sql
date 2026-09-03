ALTER TABLE "AuthenticationSession"
ADD COLUMN "mfaVerifiedAt" TIMESTAMP(3),
ADD COLUMN "mfaMethod" TEXT,
ADD COLUMN "mfaFactorGeneration" INTEGER;

CREATE TABLE "MfaFactor" (
  "id" TEXT NOT NULL,
  "userOrganizationId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'TOTP',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "generation" INTEGER NOT NULL DEFAULT 1,
  "encryptionKeyId" TEXT NOT NULL,
  "encryptedSecret" TEXT NOT NULL,
  "encryptionNonce" TEXT NOT NULL,
  "encryptionTag" TEXT NOT NULL,
  "lastUsedCounter" INTEGER,
  "activatedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaFactor_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaFactor_state_check" CHECK (
    ("status" = 'PENDING' AND "activatedAt" IS NULL AND "revokedAt" IS NULL) OR
    ("status" = 'ACTIVE' AND "activatedAt" IS NOT NULL AND "revokedAt" IS NULL) OR
    ("status" = 'REVOKED' AND "revokedAt" IS NOT NULL)
  ),
  CONSTRAINT "MfaFactor_type_check" CHECK ("type" = 'TOTP')
);

CREATE TABLE "MfaRecoveryCode" (
  "id" TEXT NOT NULL,
  "factorId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MfaChallenge" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "userOrganizationId" TEXT NOT NULL,
  "factorId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaChallenge_purpose_check" CHECK ("purpose" IN ('LOGIN', 'ENROLLMENT', 'ROTATION')),
  CONSTRAINT "MfaChallenge_attempts_check" CHECK ("attempts" BETWEEN 0 AND 5)
);

CREATE TABLE "MfaAudit" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MfaFactor_userOrganizationId_status_idx" ON "MfaFactor"("userOrganizationId", "status");
CREATE UNIQUE INDEX "MfaFactor_one_active_per_membership" ON "MfaFactor"("userOrganizationId") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "MfaFactor_one_pending_per_membership" ON "MfaFactor"("userOrganizationId") WHERE "status" = 'PENDING';
CREATE UNIQUE INDEX "MfaRecoveryCode_codeHash_key" ON "MfaRecoveryCode"("codeHash");
CREATE INDEX "MfaRecoveryCode_factorId_usedAt_idx" ON "MfaRecoveryCode"("factorId", "usedAt");
CREATE UNIQUE INDEX "MfaChallenge_tokenHash_key" ON "MfaChallenge"("tokenHash");
CREATE INDEX "MfaChallenge_userOrganizationId_expiresAt_idx" ON "MfaChallenge"("userOrganizationId", "expiresAt");
CREATE INDEX "MfaChallenge_factorId_expiresAt_idx" ON "MfaChallenge"("factorId", "expiresAt");
CREATE INDEX "MfaAudit_organizationId_createdAt_idx" ON "MfaAudit"("organizationId", "createdAt");
CREATE INDEX "MfaAudit_targetUserId_createdAt_idx" ON "MfaAudit"("targetUserId", "createdAt");

ALTER TABLE "MfaFactor" ADD CONSTRAINT "MfaFactor_userOrganizationId_fkey"
FOREIGN KEY ("userOrganizationId") REFERENCES "UserOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MfaRecoveryCode" ADD CONSTRAINT "MfaRecoveryCode_factorId_fkey"
FOREIGN KEY ("factorId") REFERENCES "MfaFactor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MfaChallenge" ADD CONSTRAINT "MfaChallenge_userOrganizationId_fkey"
FOREIGN KEY ("userOrganizationId") REFERENCES "UserOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MfaChallenge" ADD CONSTRAINT "MfaChallenge_factorId_fkey"
FOREIGN KEY ("factorId") REFERENCES "MfaFactor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MfaAudit" ADD CONSTRAINT "MfaAudit_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MfaAudit" ADD CONSTRAINT "MfaAudit_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MfaAudit" ADD CONSTRAINT "MfaAudit_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
