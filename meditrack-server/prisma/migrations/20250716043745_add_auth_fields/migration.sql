/*
  Warnings:

  - You are about to drop the column `takenAt` on the `DoseAction` table. All the data in the column will be lost.
  - You are about to drop the column `durationDays` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleTime` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `NotificationLog` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `NotificationLog` table. All the data in the column will be lost.
  - You are about to drop the column `openedAt` on the `NotificationLog` table. All the data in the column will be lost.
  - You are about to drop the column `pushToken` on the `User` table. All the data in the column will be lost.
  - Added the required column `actionTime` to the `DoseAction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actionType` to the `DoseAction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledTime` to the `NotificationLog` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `channel` on the `NotificationLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `aud` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RepeatPattern" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DoseActionType" AS ENUM ('TAKEN', 'SKIPPED', 'MISSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS');

-- AlterTable
ALTER TABLE "DoseAction" DROP COLUMN "takenAt",
ADD COLUMN     "actionTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "actionType" "DoseActionType" NOT NULL;

-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "durationDays",
DROP COLUMN "scheduleTime",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "NotificationLog" DROP COLUMN "deliveredAt",
DROP COLUMN "message",
DROP COLUMN "openedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "scheduledTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sentTime" TIMESTAMP(3),
ADD COLUMN     "successful" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "medicationId" DROP NOT NULL,
DROP COLUMN "channel",
ADD COLUMN     "channel" "NotificationChannel" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "pushToken",
ADD COLUMN     "appMetadata" JSONB,
ADD COLUMN     "aud" TEXT NOT NULL,
ADD COLUMN     "confirmationSentAt" TIMESTAMP(3),
ADD COLUMN     "emailConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSignInAt" TIMESTAMP(3),
ADD COLUMN     "password" TEXT,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "repeatPattern" "RepeatPattern" NOT NULL DEFAULT 'DAILY',
    "times" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_medicationId_key" ON "Schedule"("medicationId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseAction" ADD CONSTRAINT "DoseAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseAction" ADD CONSTRAINT "DoseAction_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
