-- Siembra inicial: Zamioluca y Marantita
-- Se asignan al primer usuario registrado (magic link). Si no hay usuarios, no inserta nada.

CREATE OR REPLACE FUNCTION seed_care_tasks(
  p_plant_id UUID,
  p_user_id UUID,
  p_type care_task_type,
  p_interval_days INTEGER,
  p_last_done TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_due TIMESTAMPTZ;
  v_count INTEGER := 0;
  v_max INTEGER := 60;
BEGIN
  IF p_last_done IS NOT NULL THEN
    v_due := p_last_done + (p_interval_days || ' days')::INTERVAL;
  ELSE
    v_due := now() + (p_interval_days || ' days')::INTERVAL;
  END IF;

  WHILE v_due <= now() + (v_max || ' days')::INTERVAL AND v_count < 30 LOOP
    INSERT INTO care_tasks (plant_id, user_id, type, due_at, status)
    VALUES (p_plant_id, p_user_id, p_type, v_due, 'pending');
    v_due := v_due + (p_interval_days || ' days')::INTERVAL;
    v_count := v_count + 1;
  END LOOP;
END;
$$;

DO $$
DECLARE
  v_user_id UUID;
  v_plant_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'seed_initial_plants: no hay usuarios en auth.users. Inicia sesión primero y vuelve a ejecutar la migración o inserta manualmente.';
    RETURN;
  END IF;

  -- Evitar duplicados si se re-ejecuta
  IF EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Zamioluca') THEN
    RAISE NOTICE 'seed_initial_plants: plantas ya existen, omitiendo.';
    RETURN;
  END IF;

  -- Zamioluca (Zamioculcas zamiifolia)
  INSERT INTO plants (
    user_id, name, species, notes,
    health_status,
    watering_interval_days, fertilizing_interval_days,
    last_watered_at,
    placement, room_label, window_orientation, window_distance_cm,
    pot_size, pot_diameter_cm, pot_material, has_drainage,
    substrate_type,
    height_cm, height_updated_at, age_years
  ) VALUES (
    v_user_id,
    'Zamioluca',
    'Zamioculcas zamiifolia',
    'Suculenta de despacho. Maceta terracota con drenaje.',
    'healthy',
    21, 60,
    now() - INTERVAL '28 days',
    'indoor', 'Despacho', 'W', 150,
    's', 15, 'terracotta', true,
    'cactus_succulent',
    45, now(), 3
  ) RETURNING id INTO v_plant_id;

  PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 21, now() - INTERVAL '28 days');
  PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 60, NULL);

  -- Marantita (Maranta leuconeura)
  INSERT INTO plants (
    user_id, name, species, notes,
    health_status,
    watering_interval_days, fertilizing_interval_days,
    last_watered_at,
    placement, room_label, window_orientation, window_distance_cm,
    pot_size, pot_diameter_cm, pot_material, has_drainage,
    substrate_type,
    height_cm, height_updated_at, age_years
  ) VALUES (
    v_user_id,
    'Marantita',
    'Maranta leuconeura',
    'Calathea/Maranta de despacho. Tierra universal.',
    'healthy',
    7, 30,
    now() - INTERVAL '5 days',
    'indoor', 'Despacho', 'W', 50,
    'xs', 10, 'terracotta', true,
    'universal',
    10, now(), 3
  ) RETURNING id INTO v_plant_id;

  PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '5 days');
  PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);

  RAISE NOTICE 'seed_initial_plants: insertadas Zamioluca y Marantita para user %', v_user_id;
END;
$$;

-- La función auxiliar puede quedarse para futuras seeds; opcional eliminarla:
-- DROP FUNCTION seed_care_tasks;
