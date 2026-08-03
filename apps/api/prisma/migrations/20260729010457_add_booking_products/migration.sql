-- CreateTable
CREATE TABLE "BookingProduct" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingProduct_bookingId_idx" ON "BookingProduct"("bookingId");

-- CreateIndex
CREATE INDEX "BookingProduct_productId_idx" ON "BookingProduct"("productId");

-- AddForeignKey
ALTER TABLE "BookingProduct" ADD CONSTRAINT "BookingProduct_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingProduct" ADD CONSTRAINT "BookingProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
