ALTER TABLE "Ticket"
ADD COLUMN "credentialSelector" TEXT,
ADD COLUMN "credentialKeyId" TEXT,
ADD COLUMN "legacyCredentialHash" TEXT;

UPDATE "Ticket"
SET
  "credentialSelector" = SUBSTRING(
    ENCODE(
      SHA256(CONVERT_TO("id" || ':' || "secureToken", 'UTF8')),
      'hex'
    )
    FROM 1 FOR 32
  ),
  "credentialKeyId" = 'local-v1',
  "legacyCredentialHash" = ENCODE(
    SHA256(CONVERT_TO("secureToken", 'UTF8')),
    'hex'
  )
WHERE "secureToken" IS NOT NULL;

CREATE UNIQUE INDEX "Ticket_credentialSelector_key"
ON "Ticket"("credentialSelector");

CREATE UNIQUE INDEX "Ticket_legacyCredentialHash_key"
ON "Ticket"("legacyCredentialHash");

CREATE INDEX "Ticket_credentialKeyId_idx"
ON "Ticket"("credentialKeyId");

ALTER TABLE "Ticket"
ADD CONSTRAINT "Ticket_credentialSelector_format_check"
CHECK (
  "credentialSelector" IS NULL
  OR "credentialSelector" ~ '^[a-f0-9]{32}$'
),
ADD CONSTRAINT "Ticket_credentialKeyId_format_check"
CHECK (
  "credentialKeyId" IS NULL
  OR "credentialKeyId" ~ '^[A-Za-z0-9-]{1,32}$'
),
ADD CONSTRAINT "Ticket_legacyCredentialHash_format_check"
CHECK (
  "legacyCredentialHash" IS NULL
  OR "legacyCredentialHash" ~ '^[a-f0-9]{64}$'
);

ALTER TABLE "Ticket"
ALTER COLUMN "secureToken" DROP NOT NULL;
