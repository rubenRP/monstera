ALTER TABLE user_settings
  ADD COLUMN locale TEXT NOT NULL DEFAULT 'es'
  CHECK (locale IN ('es', 'en'));
