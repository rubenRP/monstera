-- Restaura tareas de fertilización pendientes si faltan (p. ej. tras omitir sin reprogramar
-- o si el intervalo superaba el horizonte de generación de 60 días).

INSERT INTO care_tasks (plant_id, user_id, type, due_at, status)
SELECT
  p.id,
  p.user_id,
  'fertilize'::care_task_type,
  CASE
    WHEN p.last_fertilized_at IS NOT NULL THEN
      p.last_fertilized_at + (p.fertilizing_interval_days || ' days')::INTERVAL
    ELSE
      now() + (p.fertilizing_interval_days || ' days')::INTERVAL
  END,
  'pending'::care_task_status
FROM plants p
WHERE NOT EXISTS (
  SELECT 1
  FROM care_tasks ct
  WHERE ct.plant_id = p.id
    AND ct.type = 'fertilize'
    AND ct.status = 'pending'
);
