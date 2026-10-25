-- One pending task per (plant, type), enforced by the database.
-- Rescheduling goes through replace_pending_care_task(), which upserts atomically
-- instead of delete + insert from the client (race-prone across tabs / cron).

-- 1. Remove existing duplicates, keeping the earliest pending task per plant and type.
DELETE FROM care_tasks ct
USING (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY plant_id, type
      ORDER BY due_at ASC, created_at ASC
    ) AS rn
  FROM care_tasks
  WHERE status = 'pending'
) ranked
WHERE ct.id = ranked.id
  AND ranked.rn > 1;

-- 2. Enforce the invariant.
CREATE UNIQUE INDEX IF NOT EXISTS care_tasks_one_pending_per_type_idx
  ON care_tasks (plant_id, type)
  WHERE status = 'pending';

-- 3. Most queries filter by plant + type + status.
CREATE INDEX IF NOT EXISTS care_tasks_plant_type_status_idx
  ON care_tasks (plant_id, type, status);

-- 4. Atomic replace of the pending task. SECURITY INVOKER so RLS still applies
--    for authenticated clients; the service role bypasses RLS on the server.
CREATE OR REPLACE FUNCTION replace_pending_care_task(
  p_plant_id UUID,
  p_type care_task_type,
  p_due_at TIMESTAMPTZ
)
RETURNS care_tasks
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_task care_tasks;
BEGIN
  SELECT user_id INTO v_user_id FROM plants WHERE id = p_plant_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'PLANT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO care_tasks (plant_id, user_id, type, due_at, status)
  VALUES (p_plant_id, v_user_id, p_type, p_due_at, 'pending')
  ON CONFLICT (plant_id, type) WHERE status = 'pending'
  DO UPDATE SET due_at = EXCLUDED.due_at
  RETURNING * INTO v_task;

  RETURN v_task;
END;
$$;

REVOKE ALL ON FUNCTION replace_pending_care_task(UUID, care_task_type, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_pending_care_task(UUID, care_task_type, TIMESTAMPTZ) TO authenticated, service_role;
