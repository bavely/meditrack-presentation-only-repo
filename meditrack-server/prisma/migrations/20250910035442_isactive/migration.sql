-- AlterTable
ALTER TABLE "public"."Medication" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReminderOn" BOOLEAN NOT NULL DEFAULT true;
