-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "reservedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BookingProduct" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(65,30);
