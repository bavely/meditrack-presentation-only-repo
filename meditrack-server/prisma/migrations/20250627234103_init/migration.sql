/*
  Warnings:

  - Added the required column `quantity` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "quantity" INTEGER NOT NULL;
