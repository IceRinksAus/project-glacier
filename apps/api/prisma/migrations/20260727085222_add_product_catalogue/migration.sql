/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `EventUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,organizationId]` on the table `UserOrganization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "productType" TEXT NOT NULL DEFAULT 'ADMISSION',
    "price" DOUBLE PRECISION NOT NULL,
    "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "sku" TEXT,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "inventoryTracked" BOOLEAN NOT NULL DEFAULT false,
    "inventoryQuantity" INTEGER,
    "capacityControlled" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "requiresSession" BOOLEAN NOT NULL DEFAULT false,
    "availableOnline" BOOLEAN NOT NULL DEFAULT true,
    "availablePos" BOOLEAN NOT NULL DEFAULT true,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "maxQuantity" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "salesStart" TIMESTAMP(3),
    "salesEnd" TIMESTAMP(3),
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionProduct" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priceOverride" DOUBLE PRECISION,
    "capacityOverride" INTEGER,
    "salesStart" TIMESTAMP(3),
    "salesEnd" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_eventId_idx" ON "Category"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_eventId_slug_key" ON "Category"("eventId", "slug");

-- CreateIndex
CREATE INDEX "Product_eventId_idx" ON "Product"("eventId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_eventId_slug_key" ON "Product"("eventId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_eventId_sku_key" ON "Product"("eventId", "sku");

-- CreateIndex
CREATE INDEX "SessionProduct_sessionId_idx" ON "SessionProduct"("sessionId");

-- CreateIndex
CREATE INDEX "SessionProduct_productId_idx" ON "SessionProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionProduct_sessionId_productId_key" ON "SessionProduct"("sessionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "EventUser_eventId_userId_key" ON "EventUser"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON "UserOrganization"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProduct" ADD CONSTRAINT "SessionProduct_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProduct" ADD CONSTRAINT "SessionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
