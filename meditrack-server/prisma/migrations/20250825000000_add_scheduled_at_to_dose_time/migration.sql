-- Add scheduledAt column to DoseTime
ALTER TABLE "DoseTime" ADD COLUMN "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
