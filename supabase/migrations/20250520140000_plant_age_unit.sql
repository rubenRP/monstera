CREATE TYPE plant_age_unit AS ENUM ('months', 'years');

ALTER TABLE plants
  ADD COLUMN age_unit plant_age_unit DEFAULT 'years';

COMMENT ON COLUMN plants.age_years IS 'Cantidad de edad; la unidad (meses o años) está en age_unit';
COMMENT ON COLUMN plants.age_unit IS 'Unidad de plants.age_years: meses o años';

UPDATE plants
SET age_unit = 'years'
WHERE age_years IS NOT NULL;
