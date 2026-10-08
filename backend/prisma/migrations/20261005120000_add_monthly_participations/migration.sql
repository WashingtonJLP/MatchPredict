BEGIN;

-- CreateEnum
CREATE TYPE "ParticipationPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "participation_periods" (
    "id" UUID NOT NULL,
    "reference_year" INTEGER NOT NULL,
    "reference_month" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "participation_fee_cents" INTEGER NOT NULL,
    "status" "ParticipationPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participation_periods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "participation_periods_reference_month_check" CHECK ("reference_month" BETWEEN 1 AND 12),
    CONSTRAINT "participation_periods_fee_check" CHECK ("participation_fee_cents" > 0),
    CONSTRAINT "participation_periods_dates_check" CHECK ("ends_at" > "starts_at")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "method" "PaymentMethod" NOT NULL DEFAULT 'PIX',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "provider_payment_id" TEXT,
    "provider_reference" TEXT,
    "provider_event_id" TEXT,
    "provider_creation_started_at" TIMESTAMP(3),
    "pix_copy_paste" TEXT,
    "pix_qr_code" TEXT,
    "expires_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_amount_check" CHECK ("amount_cents" > 0)
);

-- CreateTable
CREATE TABLE "participations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "payment_id" UUID,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'ACTIVE',
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "participation_periods_reference_year_reference_month_key"
ON "participation_periods"("reference_year", "reference_month");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_event_id_key" ON "payments"("provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_reference_key"
ON "payments"("provider", "provider_reference");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_period_id_idx" ON "payments"("period_id");

-- A user may retry after an expired/cancelled/failed charge, but may have only
-- one open PIX charge per period. Prisma cannot currently declare partial indexes.
CREATE UNIQUE INDEX "payments_one_pending_per_user_period_key"
ON "payments"("user_id", "period_id")
WHERE "status" = 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "participations_payment_id_key" ON "participations"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "participations_user_id_period_id_key"
ON "participations"("user_id", "period_id");

-- CreateIndex
CREATE INDEX "participations_user_id_status_idx" ON "participations"("user_id", "status");

-- CreateIndex
CREATE INDEX "participations_period_id_idx" ON "participations"("period_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_period_id_fkey"
FOREIGN KEY ("period_id") REFERENCES "participation_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_period_id_fkey"
FOREIGN KEY ("period_id") REFERENCES "participation_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_payment_id_fkey"
FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
