CREATE TABLE species_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_query TEXT NOT NULL UNIQUE,
  perenual_id INTEGER NOT NULL UNIQUE,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX species_profiles_species_query_idx ON species_profiles(species_query);

ALTER TABLE species_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY species_profiles_select ON species_profiles
  FOR SELECT TO authenticated USING (true);
