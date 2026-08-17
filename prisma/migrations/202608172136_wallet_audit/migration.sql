-- Additive wallet/payment audit fields. Safe to run after the existing database was created with db push.
DO $$ BEGIN
  CREATE TYPE "WalletCardStatus" AS ENUM ('ACTIVE', 'PENDING', 'VERIFIED', 'REJECTED', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "transactionPasswordHash" TEXT;

CREATE TABLE IF NOT EXISTS "WalletCard" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "accountNo" TEXT NOT NULL,
  "accountName" TEXT,
  "status" "WalletCardStatus" NOT NULL DEFAULT 'ACTIVE',
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "verifiedAt" TIMESTAMP(3),
  "verifiedBy" TEXT,
  "rejectionReason" TEXT,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletCard_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "WalletCard" ADD CONSTRAINT "WalletCard_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "WalletCard_userId_method_accountNo_key"
  ON "WalletCard"("userId", "method", "accountNo");
CREATE INDEX IF NOT EXISTS "WalletCard_userId_createdAt_idx"
  ON "WalletCard"("userId", "createdAt");

ALTER TABLE "WalletCard"
  ADD COLUMN IF NOT EXISTS "status" "WalletCardStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);

ALTER TABLE "WalletRequest"
  ADD COLUMN IF NOT EXISTS "channel" TEXT,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "netAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "walletCardId" TEXT,
  ADD COLUMN IF NOT EXISTS "providerRef" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "settledAt" TIMESTAMP(3);

ALTER TABLE "Transaction"
  ADD COLUMN IF NOT EXISTS "walletRequestId" TEXT,
  ADD COLUMN IF NOT EXISTS "method" TEXT,
  ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "netAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "adminId" TEXT,
  ADD COLUMN IF NOT EXISTS "reference" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT;

DO $$ BEGIN
  ALTER TABLE "WalletRequest" ADD CONSTRAINT "WalletRequest_walletCardId_fkey"
    FOREIGN KEY ("walletCardId") REFERENCES "WalletCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletRequestId_fkey"
    FOREIGN KEY ("walletRequestId") REFERENCES "WalletRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "WalletRequest_idempotencyKey_key"
  ON "WalletRequest"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "WalletCard_status_createdAt_idx"
  ON "WalletCard"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "WalletRequest_method_status_createdAt_idx"
  ON "WalletRequest"("method", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "WalletRequest_providerRef_idx"
  ON "WalletRequest"("providerRef");
CREATE INDEX IF NOT EXISTS "WalletRequest_processedAt_idx"
  ON "WalletRequest"("processedAt");
CREATE INDEX IF NOT EXISTS "Transaction_walletRequestId_createdAt_idx"
  ON "Transaction"("walletRequestId", "createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_method_createdAt_idx"
  ON "Transaction"("method", "createdAt");
