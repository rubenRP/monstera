-- Unifica sitios duplicados "Estudio" y "Despacho" (mismo espacio físico).
-- Conserva "Despacho" como nombre canónico.

-- 1. Usuarios con ambos sitios: mover plantas a Despacho y eliminar Estudio
WITH estudio_despacho AS (
  SELECT
    e.id AS estudio_id,
    d.id AS despacho_id
  FROM sites e
  INNER JOIN sites d
    ON d.user_id = e.user_id
    AND d.name = 'Despacho'
  WHERE e.name = 'Estudio'
)
UPDATE plants p
SET site_id = ed.despacho_id
FROM estudio_despacho ed
WHERE p.site_id = ed.estudio_id;

-- Combinar notas en Despacho cuando Estudio tenía información adicional
UPDATE sites despacho
SET
  notes = CASE
    WHEN trim(coalesce(despacho.notes, '')) = '' AND trim(coalesce(estudio.notes, '')) <> ''
      THEN estudio.notes
    WHEN trim(coalesce(estudio.notes, '')) <> ''
      AND trim(coalesce(despacho.notes, '')) <> ''
      AND despacho.notes NOT LIKE '%' || estudio.notes || '%'
      THEN despacho.notes || E'\n' || estudio.notes
    ELSE despacho.notes
  END,
  placement = coalesce(despacho.placement, estudio.placement),
  window_orientation = coalesce(despacho.window_orientation, estudio.window_orientation),
  luminosity = coalesce(despacho.luminosity, estudio.luminosity),
  has_ceiling_cover = despacho.has_ceiling_cover OR estudio.has_ceiling_cover,
  updated_at = now()
FROM sites estudio
WHERE estudio.name = 'Estudio'
  AND despacho.name = 'Despacho'
  AND despacho.user_id = estudio.user_id;

DELETE FROM sites e
USING sites d
WHERE e.name = 'Estudio'
  AND d.name = 'Despacho'
  AND d.user_id = e.user_id;

-- 2. Usuarios que solo tenían "Estudio": renombrar a Despacho
UPDATE sites
SET name = 'Despacho', updated_at = now()
WHERE name = 'Estudio'
  AND NOT EXISTS (
    SELECT 1
    FROM sites d
    WHERE d.user_id = sites.user_id
      AND d.name = 'Despacho'
  );
