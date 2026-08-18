/*
  Warnings:

  - A unique constraint covering the columns `[publicAccessTokenHash]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "publicAccessTokenCreatedAt" TIMESTAMP(3),
ADD COLUMN     "publicAccessTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_publicAccessTokenHash_key" ON "Booking"("publicAccessTokenHash");
