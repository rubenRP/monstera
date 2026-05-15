-- Campos adicionales de maceta, sustrato y antigüedad
CREATE TYPE pot_material AS ENUM ('terracotta', 'plastic', 'ceramic', 'metal', 'other');

ALTER TABLE plants
  ADD COLUMN pot_material pot_material,
  ADD COLUMN has_drainage BOOLEAN DEFAULT false,
  ADD COLUMN age_years INTEGER;

COMMENT ON COLUMN plants.pot_material IS 'Material de la maceta (terracota, plástico, etc.)';
COMMENT ON COLUMN plants.has_drainage IS 'Si la maceta tiene agujeros de drenaje';
COMMENT ON COLUMN plants.age_years IS 'Antigüedad aproximada de la planta en años';

ALTER TABLE plants
  ADD CONSTRAINT plants_age_years_positive
  CHECK (age_years IS NULL OR age_years > 0);
