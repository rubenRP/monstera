import type { Plant, Site } from '#shared/types/database'

const EXTERIOR_PLACEMENTS = new Set(['outdoor', 'semi_outdoor'])

export function isExteriorPlant(plant: Pick<Plant, 'site_id'> & { site?: Site | null }): boolean {
  const placement = plant.site?.placement
  return placement != null && EXTERIOR_PLACEMENTS.has(placement)
}

export function isIndoorPlant(plant: Pick<Plant, 'site_id'> & { site?: Site | null }): boolean {
  if (plant.site_id == null) return true
  return plant.site?.placement === 'indoor'
}

export { EXTERIOR_PLACEMENTS }
