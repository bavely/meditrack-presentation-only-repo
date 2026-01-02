/*
  Warnings:

  - You are about to drop the column `dosage_unit` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `dosage_value` on the `Medication` table. All the data in the column will be lost.
  - Added the required column `doseTimeId` to the `DoseAction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dosageQty` to the `DoseTime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dosageUnit` to the `DoseTime` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."RepeatPattern" ADD VALUE 'HOURLY';

-- AlterTable
ALTER TABLE "public"."DoseAction" ADD COLUMN     "doseTimeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."DoseTime" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dosageQty" INTEGER NOT NULL,
ADD COLUMN     "dosageUnit" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Medication" DROP COLUMN "dosage_unit",
DROP COLUMN "dosage_value";

-- AlterTable
ALTER TABLE "public"."Schedule" ADD COLUMN     "interval" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "DoseTime_scheduledAt_idx" ON "public"."DoseTime"("scheduledAt");

-- AddForeignKey
ALTER TABLE "public"."DoseAction" ADD CONSTRAINT "DoseAction_doseTimeId_fkey" FOREIGN KEY ("doseTimeId") REFERENCES "public"."DoseTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
