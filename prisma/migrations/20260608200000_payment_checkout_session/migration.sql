-- AlterTable: add stripeCheckoutSessionId, make stripePaymentIntentId nullable
ALTER TABLE "payments" ADD COLUMN "stripeCheckoutSessionId" TEXT;

-- Populate stripeCheckoutSessionId from existing stripePaymentIntentId (for any existing rows)
UPDATE "payments" SET "stripeCheckoutSessionId" = "stripePaymentIntentId" WHERE "stripeCheckoutSessionId" IS NULL;

-- Make stripePaymentIntentId nullable
ALTER TABLE "payments" ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL;

-- Make stripeCheckoutSessionId NOT NULL (after backfill)
ALTER TABLE "payments" ALTER COLUMN "stripeCheckoutSessionId" SET NOT NULL;

-- Add unique constraint on stripeCheckoutSessionId
CREATE UNIQUE INDEX "payments_stripeCheckoutSessionId_key" ON "payments"("stripeCheckoutSessionId");
