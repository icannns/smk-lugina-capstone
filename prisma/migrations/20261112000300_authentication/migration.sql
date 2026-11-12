BEGIN;
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "disabledAt" TIMESTAMPTZ(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMPTZ(3),
ADD COLUMN     "passwordHash" TEXT;

-- CreateTable
CREATE TABLE "LoginSession" (
    "id" VARCHAR(191) NOT NULL,
    "userId" VARCHAR(191) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "LoginSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "key" VARCHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL,
    "windowEndsAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "LoginSession_userId_expiresAt_idx" ON "LoginSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "LoginSession_expiresAt_idx" ON "LoginSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthRateLimit_windowEndsAt_idx" ON "AuthRateLimit"("windowEndsAt");

-- AddForeignKey
ALTER TABLE "LoginSession" ADD CONSTRAINT "LoginSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


ALTER TABLE "LoginSession" ADD CONSTRAINT "login_session_expiry" CHECK ("expiresAt" > "createdAt");
ALTER TABLE "AuthRateLimit" ADD CONSTRAINT "auth_rate_attempts_positive" CHECK ("attempts" > 0);
ALTER TABLE "User" ADD CONSTRAINT "password_hash_argon2id" CHECK ("passwordHash" IS NULL OR "passwordHash" LIKE '$argon2id$%');
COMMIT;
