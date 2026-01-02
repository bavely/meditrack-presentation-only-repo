-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bedTime" TIMESTAMP(3),
ADD COLUMN     "breakfastTime" TIMESTAMP(3),
ADD COLUMN     "dinnerTime" TIMESTAMP(3),
ADD COLUMN     "lunchTime" TIMESTAMP(3);
