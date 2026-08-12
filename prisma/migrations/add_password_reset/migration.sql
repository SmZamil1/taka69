-- Migration: Add PasswordReset table and phone unique index
-- Run this on your PostgreSQL database

-- Add unique constraint on phone (if not already there)
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS "User_phone_key" UNIQUE ("phone");

-- Create PasswordReset table
CREATE TABLE IF NOT EXISTS "PasswordReset" (
    "id"        TEXT        NOT NULL,
    "email"     TEXT,
    "phone"     TEXT,
    "token"     TEXT        NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used"      BOOLEAN     NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PasswordReset_token_idx" ON "PasswordReset"("token");
CREATE INDEX IF NOT EXISTS "PasswordReset_email_idx" ON "PasswordReset"("email");
CREATE INDEX IF NOT EXISTS "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

-- Cleanup expired tokens (optional cron job query)
-- DELETE FROM "PasswordReset" WHERE "expiresAt" < NOW() OR "used" = TRUE;
