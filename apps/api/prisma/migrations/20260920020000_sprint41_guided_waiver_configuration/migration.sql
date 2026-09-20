-- Persist only the permitted Event-specific values used to render a controlled
-- approved Waiver template. Legal clauses remain in versioned templates.
ALTER TABLE "EventWaiver" ADD COLUMN "configuration" JSONB;
