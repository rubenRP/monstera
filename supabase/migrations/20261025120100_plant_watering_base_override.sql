-- Persist a user-applied base watering interval (e.g. from AI recommendations)
-- so batch / client recalculations no longer overwrite it with the species reference.
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS watering_base_override_days INTEGER
  CHECK (watering_base_override_days IS NULL OR watering_base_override_days BETWEEN 1 AND 90);
