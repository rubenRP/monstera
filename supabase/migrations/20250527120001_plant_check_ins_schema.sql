-- Periodic plant check-in: schema, RLS, and task backfill (requires check_in enum from prior migration).

ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS check_in_interval_days INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS last_check_in_at TIMESTAMPTZ;

DO $$
BEGIN
  ALTER TABLE plants
    ADD CONSTRAINT plants_check_in_interval_days_range
    CHECK (check_in_interval_days >= 7 AND check_in_interval_days <= 180);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS plant_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  care_task_id UUID REFERENCES care_tasks(id) ON DELETE SET NULL,
  health_status health_status NOT NULL,
  health_status_note TEXT,
  height_cm NUMERIC,
  new_leaves BOOLEAN NOT NULL DEFAULT false,
  dropped_leaves BOOLEAN NOT NULL DEFAULT false,
  flowering BOOLEAN NOT NULL DEFAULT false,
  size_changed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  photo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plant_check_ins_plant_id_idx ON plant_check_ins(plant_id);
CREATE INDEX IF NOT EXISTS plant_check_ins_user_id_idx ON plant_check_ins(user_id);
CREATE INDEX IF NOT EXISTS plant_check_ins_created_at_idx ON plant_check_ins(created_at DESC);

ALTER TABLE plant_check_ins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY plant_check_ins_own ON plant_check_ins
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Remove duplicate pending check_in tasks (keep earliest due_at)
DELETE FROM care_tasks ct
WHERE ct.type = 'check_in'
  AND ct.status = 'pending'
  AND ct.id NOT IN (
    SELECT DISTINCT ON (plant_id) id
    FROM care_tasks
    WHERE type = 'check_in' AND status = 'pending'
    ORDER BY plant_id, due_at ASC
  );

-- Backfill one pending check_in per active plant
INSERT INTO care_tasks (plant_id, user_id, type, due_at, status)
SELECT
  p.id,
  p.user_id,
  'check_in'::care_task_type,
  GREATEST(
    COALESCE(p.last_check_in_at, p.created_at)
      + (p.check_in_interval_days || ' days')::INTERVAL,
    now()
  ),
  'pending'::care_task_status
FROM plants p
WHERE p.archived_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM care_tasks ct
    WHERE ct.plant_id = p.id
      AND ct.type = 'check_in'
      AND ct.status = 'pending'
  );
