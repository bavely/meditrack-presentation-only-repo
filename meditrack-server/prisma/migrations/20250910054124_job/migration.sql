-- AlterTable
ALTER TABLE "public"."NotificationLog" ADD COLUMN     "doseTimeId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_doseTimeId_fkey" FOREIGN KEY ("doseTimeId") REFERENCES "public"."DoseTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
