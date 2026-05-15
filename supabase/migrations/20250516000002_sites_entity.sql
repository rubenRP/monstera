-- Sitios: ubicación compartida por varias plantas
CREATE TYPE luminosity_level AS ENUM ('low', 'medium', 'high', 'direct_sun');

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  placement placement_type NOT NULL DEFAULT 'indoor',
  window_orientation window_orientation,
  luminosity luminosity_level,
  has_ceiling_cover BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX sites_user_id_idx ON sites(user_id);

ALTER TABLE plants ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

-- Migrar datos existentes: un sitio por combinación estancia + ubicación + orientación
INSERT INTO sites (user_id, name, placement, window_orientation, luminosity, has_ceiling_cover)
SELECT DISTINCT
  p.user_id,
  COALESCE(NULLIF(trim(p.room_label), ''), 'Sin asignar'),
  COALESCE(p.placement, 'indoor'::placement_type),
  p.window_orientation,
  NULL::luminosity_level,
  false
FROM plants p
WHERE p.room_label IS NOT NULL OR p.placement IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

UPDATE plants p
SET site_id = s.id
FROM sites s
WHERE p.user_id = s.user_id
  AND COALESCE(NULLIF(trim(p.room_label), ''), 'Sin asignar') = s.name
  AND COALESCE(p.placement, 'indoor'::placement_type) = s.placement
  AND (p.window_orientation IS NOT DISTINCT FROM s.window_orientation);

-- Quitar campos de ubicación duplicados en plantas (quedan en sitio + distancia a ventana por planta)
ALTER TABLE plants
  DROP COLUMN IF EXISTS placement,
  DROP COLUMN IF EXISTS room_label,
  DROP COLUMN IF EXISTS window_orientation;

CREATE INDEX plants_site_id_idx ON plants(site_id);

-- RLS sitios
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY sites_own ON sites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
