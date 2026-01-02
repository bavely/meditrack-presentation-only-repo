-- CreateTable
CREATE TABLE "public"."JobState" (
    "jobName" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobState_pkey" PRIMARY KEY ("jobName")
);
