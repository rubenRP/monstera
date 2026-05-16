-- Keep a single pending fertilize task per plant before client-side water alignment runs.
DELETE FROM care_tasks ct
WHERE ct.type = 'fertilize'
  AND ct.status = 'pending'
  AND ct.id NOT IN (
    SELECT DISTINCT ON (plant_id) id
    FROM care_tasks
    WHERE type = 'fertilize' AND status = 'pending'
    ORDER BY plant_id, due_at ASC
  );
