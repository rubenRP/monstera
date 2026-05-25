import type { Plant } from '../../types/database'
import { usesWindowDistance } from '../sites/placement'

export type PlantFormSection = 'plant' | 'pot' | 'light' | 'care'

export interface PlantCompletenessResult {
  plantMissingCount: number
  missingSite: boolean
  sections: Record<PlantFormSection, number>
}

function isEmpty(value: string | null | undefined): boolean {
  return value == null || String(value).trim() === ''
}

export function countPlantCompleteness(plant: Plant): PlantCompletenessResult {
  const sections: Record<PlantFormSection, number> = {
    plant: 0,
    pot: 0,
    light: 0,
    care: 0
  }

  if (plant.height_cm == null) sections.plant++
  if (plant.age_years == null) sections.plant++
  if (isEmpty(plant.species)) sections.plant++

  if (plant.pot_material == null) sections.pot++
  if (plant.pot_diameter_cm == null && plant.pot_size == null) sections.pot++
  if (plant.substrate_type == null) sections.pot++

  if (!plant.site_id) {
    sections.light++
  } else {
    const site = plant.site
    if (!site?.luminosity) sections.light++
    if (!site?.window_orientation && (site?.placement === 'indoor' || site?.placement === 'semi_outdoor')) {
      sections.light++
    }
    if (plant.window_distance_cm == null && usesWindowDistance(site?.placement)) {
      sections.light++
    }
  }

  const plantMissingCount = sections.plant + sections.pot + sections.light
  return {
    plantMissingCount,
    missingSite: !plant.site_id,
    sections
  }
}

export function editSectionHash(section: PlantFormSection): string {
  return section
}
