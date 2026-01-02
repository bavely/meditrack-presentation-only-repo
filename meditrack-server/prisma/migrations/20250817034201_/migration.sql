/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quantityLeft` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Medication" ADD COLUMN     "estimatedEndDate" TIMESTAMP(3),
ADD COLUMN     "medicationStartDate" TIMESTAMP(3),
ADD COLUMN     "quantityLeft" INTEGER NOT NULL,
ADD COLUMN     "therapy" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "phoneConfirmationSentAt" TIMESTAMP(3),
ADD COLUMN     "phoneConfirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_userId_key" ON "public"."RefreshToken"("userId");
