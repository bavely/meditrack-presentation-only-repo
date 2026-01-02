ALTER TABLE "Medication"
  ADD COLUMN IF NOT EXISTS "dosage_value" NUMERIC,
  ADD COLUMN IF NOT EXISTS "dosage_unit" TEXT;

  DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Medication' AND column_name = 'dosageQty'
  ) THEN
    EXECUTE 'UPDATE "Medication" SET "dosage_value" = "dosageQty" WHERE "dosage_value" IS NULL';
  END IF;
END $$;

ALTER TABLE "Medication" DROP COLUMN IF EXISTS "dosageQty";

