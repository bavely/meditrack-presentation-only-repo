-- Drop the old times column and introduce DoseTime table
ALTER TABLE "Schedule" DROP COLUMN IF EXISTS "times";

CREATE TABLE "DoseTime" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "time" TIME NOT NULL,
  CONSTRAINT "DoseTime_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DoseTime_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
