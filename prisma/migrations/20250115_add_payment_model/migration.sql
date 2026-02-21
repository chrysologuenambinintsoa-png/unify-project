-- CreateTable for payments
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripeStatus" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey for payments to users
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex for unique charges and payment intents
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");
CREATE UNIQUE INDEX "payments_stripeChargeId_key" ON "payments"("stripeChargeId");

-- CreateIndex for faster queries
CREATE INDEX "payments_userId_idx" ON "payments"("userId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_stripePaymentIntentId_idx" ON "payments"("stripePaymentIntentId");
CREATE INDEX "payments_stripeChargeId_idx" ON "payments"("stripeChargeId");
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");
