-- Vincula plantas sembradas al sitio "Despacho" y crea el sitio si no existe
DO $$
DECLARE
  v_user_id UUID;
  v_site_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_user_id IS NULL THEN RETURN; END IF;

  INSERT INTO sites (user_id, name, placement, window_orientation, luminosity, has_ceiling_cover, notes)
  VALUES (v_user_id, 'Despacho', 'indoor', 'W', 'medium', false, 'Ventana oeste')
  ON CONFLICT (user_id, name) DO UPDATE SET
    placement = EXCLUDED.placement,
    window_orientation = EXCLUDED.window_orientation,
    updated_at = now()
  RETURNING id INTO v_site_id;

  IF v_site_id IS NULL THEN
    SELECT id INTO v_site_id FROM sites WHERE user_id = v_user_id AND name = 'Despacho';
  END IF;

  UPDATE plants
  SET site_id = v_site_id
  WHERE user_id = v_user_id
    AND name IN ('Zamioluca', 'Marantita')
    AND site_id IS NULL;
END;
$$;
