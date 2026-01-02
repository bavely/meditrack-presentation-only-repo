/*
  Warnings:

  - You are about to drop the column `dosage` on the `Medication` table. All the data in the column will be lost.
  - Added the required column `strength` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Medication" DROP COLUMN "dosage",
ADD COLUMN     "strength" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "exerciseTime" TIMESTAMP(3);
