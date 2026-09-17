ALTER TABLE "TicketType"
ADD COLUMN "minimumAge" INTEGER,
ADD COLUMN "maximumAge" INTEGER;

ALTER TABLE "TicketType"
ADD CONSTRAINT "TicketType_minimumAge_check"
CHECK ("minimumAge" IS NULL OR ("minimumAge" >= 0 AND "minimumAge" <= 130)),
ADD CONSTRAINT "TicketType_maximumAge_check"
CHECK ("maximumAge" IS NULL OR ("maximumAge" >= 0 AND "maximumAge" <= 130)),
ADD CONSTRAINT "TicketType_age_range_check"
CHECK ("minimumAge" IS NULL OR "maximumAge" IS NULL OR "minimumAge" <= "maximumAge");
