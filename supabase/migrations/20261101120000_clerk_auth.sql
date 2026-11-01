-- Auth moves from Supabase Auth to Clerk (Supabase third-party auth).
--
-- * `user_id` becomes TEXT: Clerk ids look like `user_2abc...`, not UUIDs.
-- * FKs to auth.users are dropped (Clerk users do not exist there).
-- * RLS reads the Clerk user id from the JWT `sub` claim. Do NOT use auth.uid() any more:
--   it casts `sub` to UUID and errors out for Clerk ids.
--
-- Existing rows keep their old UUID (as text) until scripts/migrate-user-to-clerk.mjs
-- reassigns them to the Clerk user id.

-- 1. Drop policies that depend on user_id / auth.uid()
DROP POLICY IF EXISTS user_settings_own ON user_settings;
DROP POLICY IF EXISTS plants_own ON plants;
DROP POLICY IF EXISTS care_tasks_own ON care_tasks;
DROP POLICY IF EXISTS diagnoses_own ON diagnoses;
DROP POLICY IF EXISTS push_subscriptions_own ON push_subscriptions;
DROP POLICY IF EXISTS sites_own ON sites;
DROP POLICY IF EXISTS plant_check_ins_own ON plant_check_ins;
DROP POLICY IF EXISTS watering_recalc_events_select ON watering_recalc_events;
DROP POLICY IF EXISTS watering_recalc_events_insert ON watering_recalc_events;
DROP POLICY IF EXISTS watering_recalc_events_update ON watering_recalc_events;
DROP POLICY IF EXISTS plant_photos_select ON storage.objects;
DROP POLICY IF EXISTS plant_photos_insert ON storage.objects;
DROP POLICY IF EXISTS plant_photos_update ON storage.objects;
DROP POLICY IF EXISTS plant_photos_delete ON storage.objects;

-- 2. Drop FKs to auth.users and change the column type
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_user_id_fkey;
ALTER TABLE care_tasks DROP CONSTRAINT IF EXISTS care_tasks_user_id_fkey;
ALTER TABLE diagnoses DROP CONSTRAINT IF EXISTS diagnoses_user_id_fkey;
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;
ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_user_id_fkey;
ALTER TABLE plant_check_ins DROP CONSTRAINT IF EXISTS plant_check_ins_user_id_fkey;
ALTER TABLE watering_recalc_events DROP CONSTRAINT IF EXISTS watering_recalc_events_user_id_fkey;

ALTER TABLE user_settings ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE plants ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE care_tasks ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE diagnoses ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE push_subscriptions ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE sites ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE plant_check_ins ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE watering_recalc_events ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 3. Recreate policies on the Clerk user id (the `(SELECT ...)` form lets Postgres evaluate it once per query)
CREATE POLICY user_settings_own ON user_settings
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY plants_own ON plants
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY care_tasks_own ON care_tasks
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY diagnoses_own ON diagnoses
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY push_subscriptions_own ON push_subscriptions
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY sites_own ON sites
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY plant_check_ins_own ON plant_check_ins
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY watering_recalc_events_select ON watering_recalc_events
  FOR SELECT TO authenticated USING ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY watering_recalc_events_insert ON watering_recalc_events
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.jwt() ->> 'sub') = user_id);

CREATE POLICY watering_recalc_events_update ON watering_recalc_events
  FOR UPDATE TO authenticated USING ((SELECT auth.jwt() ->> 'sub') = user_id);

-- 4. Storage: photos live under `<user id>/...`
CREATE POLICY plant_photos_select ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'plant-photos'
    AND (SELECT auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
  );

CREATE POLICY plant_photos_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'plant-photos'
    AND (SELECT auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
  );

CREATE POLICY plant_photos_update ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'plant-photos'
    AND (SELECT auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
  );

CREATE POLICY plant_photos_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'plant-photos'
    AND (SELECT auth.jwt() ->> 'sub') = (storage.foldername(name))[1]
  );
