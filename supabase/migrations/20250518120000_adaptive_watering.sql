-- Adaptive watering: base interval + skip reason; consolidate pending water tasks

ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS watering_base_interval_days INTEGER;

UPDATE plants
SET watering_base_interval_days = watering_interval_days
WHERE watering_base_interval_days IS NULL;

ALTER TABLE plants
  ALTER COLUMN watering_base_interval_days SET NOT NULL,
  ALTER COLUMN watering_base_interval_days SET DEFAULT 7;

ALTER TABLE plants
  DROP CONSTRAINT IF EXISTS plants_watering_base_interval_days_check;

ALTER TABLE plants
  ADD CONSTRAINT plants_watering_base_interval_days_check
  CHECK (watering_base_interval_days >= 1 AND watering_base_interval_days <= 90);

ALTER TABLE care_tasks
  ADD COLUMN IF NOT EXISTS skip_reason TEXT;

ALTER TABLE care_tasks
  DROP CONSTRAINT IF EXISTS care_tasks_skip_reason_check;

ALTER TABLE care_tasks
  ADD CONSTRAINT care_tasks_skip_reason_check
  CHECK (skip_reason IS NULL OR skip_reason = 'soil_wet');

-- One pending water task per plant: keep earliest due_at
DELETE FROM care_tasks ct
WHERE ct.type = 'water'
  AND ct.status = 'pending'
  AND ct.id NOT IN (
    SELECT DISTINCT ON (plant_id) id
    FROM care_tasks
    WHERE type = 'water' AND status = 'pending'
    ORDER BY plant_id, due_at ASC
  );
