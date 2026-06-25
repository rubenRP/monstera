CREATE TABLE watering_recalc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  plant_name TEXT NOT NULL,
  source TEXT NOT NULL,
  previous_due_at TIMESTAMPTZ,
  new_due_at TIMESTAMPTZ NOT NULL,
  previous_interval_days INTEGER,
  new_interval_days INTEGER NOT NULL,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX watering_recalc_events_user_created_idx
  ON watering_recalc_events(user_id, created_at DESC);

ALTER TABLE watering_recalc_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY watering_recalc_events_select ON watering_recalc_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY watering_recalc_events_insert ON watering_recalc_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY watering_recalc_events_update ON watering_recalc_events
  FOR UPDATE USING (auth.uid() = user_id);
