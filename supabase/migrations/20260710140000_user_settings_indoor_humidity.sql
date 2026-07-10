CREATE TYPE indoor_humidity_level AS ENUM ('auto', 'low', 'normal', 'high');

ALTER TABLE user_settings
  ADD COLUMN indoor_humidity indoor_humidity_level NOT NULL DEFAULT 'auto';

COMMENT ON COLUMN user_settings.indoor_humidity IS 'Indoor humidity preference for watering (auto uses weather estimate).';
