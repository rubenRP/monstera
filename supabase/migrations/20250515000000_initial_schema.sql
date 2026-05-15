-- Enums
CREATE TYPE placement_type AS ENUM ('indoor', 'outdoor', 'semi_outdoor');
CREATE TYPE window_orientation AS ENUM ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW');
CREATE TYPE pot_size AS ENUM ('xs', 's', 'm', 'l', 'xl');
CREATE TYPE substrate_type AS ENUM (
  'universal', 'cactus_succulent', 'orchid', 'acid_loving', 'coco_coir', 'peat', 'other'
);
CREATE TYPE health_status AS ENUM ('healthy', 'fair', 'sick', 'critical');
CREATE TYPE care_task_type AS ENUM ('water', 'fertilize');
CREATE TYPE care_task_status AS ENUM ('pending', 'done', 'skipped');

-- User settings (home location for weather)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  home_lat NUMERIC,
  home_lon NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plants
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT,
  photo_path TEXT,
  notes TEXT DEFAULT '',
  health_status health_status NOT NULL DEFAULT 'healthy',
  health_status_note TEXT,
  health_status_updated_at TIMESTAMPTZ DEFAULT now(),
  watering_interval_days INTEGER NOT NULL DEFAULT 7,
  fertilizing_interval_days INTEGER NOT NULL DEFAULT 30,
  last_watered_at TIMESTAMPTZ,
  last_fertilized_at TIMESTAMPTZ,
  placement placement_type,
  room_label TEXT,
  window_orientation window_orientation,
  window_distance_cm INTEGER,
  pot_size pot_size,
  pot_diameter_cm NUMERIC,
  substrate_type substrate_type,
  substrate_notes TEXT,
  height_cm NUMERIC,
  height_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX plants_user_id_idx ON plants(user_id);
CREATE INDEX plants_health_status_idx ON plants(health_status);
CREATE INDEX plants_placement_room_idx ON plants(placement, room_label);

-- Care tasks
CREATE TABLE care_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type care_task_type NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status care_task_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX care_tasks_due_status_idx ON care_tasks(due_at, status);
CREATE INDEX care_tasks_plant_id_idx ON care_tasks(plant_id);
CREATE INDEX care_tasks_user_id_idx ON care_tasks(user_id);

-- Diagnoses
CREATE TABLE diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  image_path TEXT,
  ai_summary TEXT,
  ai_raw JSONB,
  suggested_health_status health_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX diagnoses_plant_id_idx ON diagnoses(plant_id);

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_own ON user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY plants_own ON plants
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY care_tasks_own ON care_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY diagnoses_own ON diagnoses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_subscriptions_own ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-photos', 'plant-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY plant_photos_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY plant_photos_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY plant_photos_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY plant_photos_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
