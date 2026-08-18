/*
  Warnings:

  - You are about to alter the column `total` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `unitPrice` on the `BookingItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `totalPrice` on the `BookingItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `unitPrice` on the `BookingProduct` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `priceOverride` on the `ProductVariant` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `priceOverride` on the `SessionProduct` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `TicketType` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "BookingItem" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "BookingProduct" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "priceOverride" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "SessionProduct" ALTER COLUMN "priceOverride" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "TicketType" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);
