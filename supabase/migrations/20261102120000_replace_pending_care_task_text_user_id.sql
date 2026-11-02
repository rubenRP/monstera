-- Fix replace_pending_care_task() after the Clerk migration (20261101120000).
--
-- `user_id` columns are TEXT now (Clerk ids like `user_2abc...`), but the function
-- still declared `v_user_id UUID`. `SELECT user_id INTO v_user_id` then tries to cast
-- the Clerk id to uuid and fails ("invalid input syntax for type uuid"), so every
-- reschedule (e.g. right after creating a plant) returned HTTP 400.

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
  v_user_id TEXT;
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
