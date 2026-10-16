DROP INDEX "ProductCollectionPass_bookingProductId_key";

ALTER TABLE "ProductCollectionPass"
ADD COLUMN "unitNumber" INTEGER,
ADD COLUMN "unitCountSnapshot" INTEGER;

ALTER TABLE "ProductCollectionPass"
ADD CONSTRAINT "ProductCollectionPass_unitNumber_check"
CHECK ("unitNumber" IS NULL OR "unitNumber" > 0),
ADD CONSTRAINT "ProductCollectionPass_unitCountSnapshot_check"
CHECK ("unitCountSnapshot" IS NULL OR "unitCountSnapshot" > 0),
ADD CONSTRAINT "ProductCollectionPass_unitRange_check"
CHECK (
  "unitNumber" IS NULL
  OR "unitCountSnapshot" IS NULL
  OR "unitNumber" <= "unitCountSnapshot"
);

CREATE UNIQUE INDEX "ProductCollectionPass_bookingProductId_unitNumber_key"
ON "ProductCollectionPass"("bookingProductId", "unitNumber");
