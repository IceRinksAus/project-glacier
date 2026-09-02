DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Ticket"
    WHERE
      "credentialSelector" IS NULL
      OR "credentialKeyId" IS NULL
      OR "legacyCredentialHash" IS NULL
  ) THEN
    RAISE EXCEPTION 'Ticket credential migration is incomplete';
  END IF;
END
$$;

UPDATE "Ticket"
SET "secureToken" = NULL
WHERE "secureToken" IS NOT NULL;

ALTER TABLE "Ticket"
ALTER COLUMN "credentialSelector" SET NOT NULL,
ALTER COLUMN "credentialKeyId" SET NOT NULL;

ALTER TABLE "Ticket"
ADD CONSTRAINT "Ticket_raw_credential_must_be_null_check"
CHECK ("secureToken" IS NULL);
