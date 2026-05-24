CREATE TYPE plant_archive_reason AS ENUM ('died', 'gifted');

ALTER TABLE plants
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD COLUMN archive_reason plant_archive_reason;

ALTER TABLE plants ADD CONSTRAINT plants_archive_consistency CHECK (
  (archived_at IS NULL AND archive_reason IS NULL)
  OR (archived_at IS NOT NULL AND archive_reason IS NOT NULL)
);

CREATE INDEX plants_user_archived_idx ON plants (user_id, archived_at);
