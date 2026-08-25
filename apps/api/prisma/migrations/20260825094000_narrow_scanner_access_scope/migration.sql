UPDATE "UserOrganization"
SET "accessScope" = 'ASSIGNED_EVENTS'
WHERE "role" = 'SCANNER';

ALTER TABLE "UserOrganization"
ADD CONSTRAINT "UserOrganization_owner_scope_check"
CHECK ("role" <> 'OWNER' OR "accessScope" = 'ALL_EVENTS');

ALTER TABLE "UserOrganization"
ADD CONSTRAINT "UserOrganization_scanner_scope_check"
CHECK ("role" <> 'SCANNER' OR "accessScope" = 'ASSIGNED_EVENTS');
