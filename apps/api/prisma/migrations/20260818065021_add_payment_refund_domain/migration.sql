-- CreateEnum
CREATE TYPE "PaymentRefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PaymentRefund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "status" "PaymentRefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "succeededAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_providerReference_key" ON "PaymentRefund"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_idempotencyKey_key" ON "PaymentRefund"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentRefund_paymentId_idx" ON "PaymentRefund"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentRefund_status_idx" ON "PaymentRefund"("status");

-- CreateIndex
CREATE INDEX "PaymentRefund_provider_providerReference_idx" ON "PaymentRefund"("provider", "providerReference");

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
