-- Colección adicional de plantas (Estudio, Salón, Terraza)
-- Requiere migraciones sites (002) y función seed_care_tasks (001).

DO $$
DECLARE
  v_user_id UUID;
  v_estudio_id UUID;
  v_salon_id UUID;
  v_terrace_id UUID;
  v_plant_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'seed_collection_plants: sin usuarios, omitido.';
    RETURN;
  END IF;

  -- Sitios
  INSERT INTO sites (user_id, name, placement, window_orientation, luminosity, has_ceiling_cover, notes)
  VALUES (v_user_id, 'Estudio', 'indoor', 'W', 'medium', false, 'Ventana oeste')
  ON CONFLICT (user_id, name) DO UPDATE SET
    placement = EXCLUDED.placement,
    window_orientation = EXCLUDED.window_orientation,
    updated_at = now()
  RETURNING id INTO v_estudio_id;
  IF v_estudio_id IS NULL THEN
    SELECT id INTO v_estudio_id FROM sites WHERE user_id = v_user_id AND name = 'Estudio';
  END IF;

  INSERT INTO sites (user_id, name, placement, window_orientation, luminosity, has_ceiling_cover, notes)
  VALUES (v_user_id, 'Salón', 'indoor', 'E', 'medium', false, 'Ventana este')
  ON CONFLICT (user_id, name) DO UPDATE SET
    placement = EXCLUDED.placement,
    window_orientation = EXCLUDED.window_orientation,
    updated_at = now()
  RETURNING id INTO v_salon_id;
  IF v_salon_id IS NULL THEN
    SELECT id INTO v_salon_id FROM sites WHERE user_id = v_user_id AND name = 'Salón';
  END IF;

  INSERT INTO sites (user_id, name, placement, window_orientation, luminosity, has_ceiling_cover, notes)
  VALUES (v_user_id, 'Terraza', 'semi_outdoor', 'E', 'high', true, 'Orientación este con techo/cubierta')
  ON CONFLICT (user_id, name) DO UPDATE SET
    placement = EXCLUDED.placement,
    window_orientation = EXCLUDED.window_orientation,
    has_ceiling_cover = EXCLUDED.has_ceiling_cover,
    updated_at = now()
  RETURNING id INTO v_terrace_id;
  IF v_terrace_id IS NULL THEN
    SELECT id INTO v_terrace_id FROM sites WHERE user_id = v_user_id AND name = 'Terraza';
  END IF;

  -- 1. Ave del paraíso
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Ave del paraíso') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Ave del paraíso', 'Strelitzia nicolai', '', 'healthy',
      7, 30, now() - INTERVAL '1 day',
      v_estudio_id, 50,
      'm', 25, 'terracotta', true, 'universal',
      50, now(), 3
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '1 day');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);
  END IF;

  -- 2. Oreja Polly
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Oreja Polly') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Oreja Polly', 'Alocasia amazonica Polly', '1 mes de vida', 'healthy',
      7, 30, now() - INTERVAL '3 days',
      v_estudio_id, 50,
      's', 15, 'terracotta', true, 'universal',
      10, now(), NULL
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '3 days');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);
  END IF;

  -- 3. Mini costilla
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Mini costilla') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Mini costilla', 'Monstera deliciosa', '8 meses de vida', 'healthy',
      7, 30, now() - INTERVAL '1 day',
      v_estudio_id, 50,
      'xs', 12, 'terracotta', true, 'universal',
      25, now(), NULL
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '1 day');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);
  END IF;

  -- 4. Kentia
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Kentia') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Kentia', 'Howea forsteriana', '8 meses de vida', 'healthy',
      10, 45, now() - INTERVAL '5 days',
      v_salon_id, 350,
      'm', 25, 'plastic', true, 'universal',
      150, now(), NULL
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 10, now() - INTERVAL '5 days');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 45, NULL);
  END IF;

  -- 5. Costilla
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Costilla') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Costilla', 'Monstera deliciosa', '', 'healthy',
      7, 30, now() - INTERVAL '18 days',
      v_salon_id, 200,
      'm', 25, 'terracotta', true, 'universal',
      150, now(), 3
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '18 days');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);
  END IF;

  -- 6. Goeppertia (salud mala)
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Goeppertia') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status, health_status_note,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Goeppertia', 'Goeppertia warscewiczii', '3 meses de vida. Maceta nunca replantada.', 'sick', 'Salud regular/mala',
      7, 30, now() - INTERVAL '1 day',
      v_salon_id, 150,
      's', 15, 'plastic', true, 'universal',
      40, now(), NULL
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '1 day');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);
  END IF;

  -- 7. Pata de elefante
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Pata de elefante') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Pata de elefante', 'Beaucarnea recurvata', 'Maceta nunca replantada.', 'healthy',
      21, 60, now() - INTERVAL '25 days',
      v_salon_id, 100,
      'xs', 12.5, 'plastic', true, 'universal',
      35, now(), 3
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 21, now() - INTERVAL '25 days');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 60, NULL);
  END IF;

  -- 8. Sanseviera
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Sanseviera') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Sanseviera', 'Dracaena trifasciata', '3 meses de vida. Maceta nunca replantada.', 'healthy',
      14, 45, now() - INTERVAL '1 day',
      v_salon_id, 350,
      's', 17.5, 'plastic', true, 'cactus_succulent',
      30, now(), NULL
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 14, now() - INTERVAL '1 day');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 45, NULL);
  END IF;

  -- 9. Trebol afortunado
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Trebol afortunado') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Trebol afortunado', 'Oxalis triangularis', '', 'healthy',
      7, 30, now() - INTERVAL '1 day',
      v_terrace_id, NULL,
      's', 15, 'terracotta', true, 'universal',
      20, now(), 1
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '1 day');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);
  END IF;

  -- 10. Trebolito (salud mala)
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Trebolito') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status, health_status_note,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Trebolito', 'Oxalis triangularis', '', 'sick', 'Salud mala',
      7, 30, now() - INTERVAL '8 days',
      v_salon_id, 200,
      'xs', 12, 'plastic', true, 'universal',
      5, now(), 2
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '8 days');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);
  END IF;

  -- 11. Tillandsia (sin maceta)
  IF NOT EXISTS (SELECT 1 FROM plants WHERE user_id = v_user_id AND name = 'Tillandsia') THEN
    INSERT INTO plants (
      user_id, name, species, notes, health_status,
      watering_interval_days, fertilizing_interval_days, last_watered_at,
      site_id, window_distance_cm,
      pot_size, pot_diameter_cm, pot_material, has_drainage, substrate_type,
      height_cm, height_updated_at, age_years
    ) VALUES (
      v_user_id, 'Tillandsia', 'Tillandsia aeranthos', 'Epífita sin maceta', 'healthy',
      7, 30, now() - INTERVAL '5 days',
      v_terrace_id, NULL,
      NULL, NULL, NULL, false, NULL,
      NULL, NULL, 2
    ) RETURNING id INTO v_plant_id;
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'water', 7, now() - INTERVAL '5 days');
    PERFORM seed_care_tasks(v_plant_id, v_user_id, 'fertilize', 30, NULL);
  END IF;

  RAISE NOTICE 'seed_collection_plants: colección insertada para user %', v_user_id;
END;
$$;
