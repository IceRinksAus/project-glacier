-- CreateTable
CREATE TABLE "PaymentReconciliationAttempt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentId" TEXT,
    "userId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT 'MANUAL',
    "outcome" TEXT NOT NULL,
    "providerStatus" "PaymentStatus",
    "succeeded" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentReconciliationAttempt_organizationId_attemptedAt_idx" ON "PaymentReconciliationAttempt"("organizationId", "attemptedAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliationAttempt_eventId_attemptedAt_idx" ON "PaymentReconciliationAttempt"("eventId", "attemptedAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliationAttempt_bookingId_attemptedAt_idx" ON "PaymentReconciliationAttempt"("bookingId", "attemptedAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliationAttempt_paymentId_attemptedAt_idx" ON "PaymentReconciliationAttempt"("paymentId", "attemptedAt");

-- CreateIndex
CREATE INDEX "PaymentReconciliationAttempt_userId_attemptedAt_idx" ON "PaymentReconciliationAttempt"("userId", "attemptedAt");

-- AddForeignKey
ALTER TABLE "PaymentReconciliationAttempt" ADD CONSTRAINT "PaymentReconciliationAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliationAttempt" ADD CONSTRAINT "PaymentReconciliationAttempt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliationAttempt" ADD CONSTRAINT "PaymentReconciliationAttempt_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliationAttempt" ADD CONSTRAINT "PaymentReconciliationAttempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliationAttempt" ADD CONSTRAINT "PaymentReconciliationAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
