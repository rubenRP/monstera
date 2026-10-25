import type { Plant } from '../../types/database'
import { HEALTH_STATUS_ORDER } from '../../constants/plants'

export type PlantSortMode = 'next_water' | 'name' | 'health'

export interface PlantGroup {
  /** site id, or null for plants without a site */
  siteId: string | null
  siteName: string | null
  plants: Plant[]
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/** Accent- and case-insensitive match on name, species and site. */
export function filterPlants(plants: Plant[], query: string): Plant[] {
  const q = normalize(query)
  if (!q) return plants
  return plants.filter(p =>
    [p.name, p.species ?? '', p.site?.name ?? ''].some(field => normalize(field).includes(q))
  )
}

export function sortPlants(
  plants: Plant[],
  mode: PlantSortMode,
  nextWaterByPlant: Map<string, string> = new Map()
): Plant[] {
  const byName = (a: Plant, b: Plant) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  const list = [...plants]
  if (mode === 'name') return list.sort(byName)
  if (mode === 'health') {
    return list.sort((a, b) =>
      HEALTH_STATUS_ORDER[a.health_status] - HEALTH_STATUS_ORDER[b.health_status] || byName(a, b)
    )
  }
  // Soonest watering first; plants without a pending watering go last
  return list.sort((a, b) => {
    const da = nextWaterByPlant.get(a.id)
    const db = nextWaterByPlant.get(b.id)
    if (da && db) return new Date(da).getTime() - new Date(db).getTime() || byName(a, b)
    if (da) return -1
    if (db) return 1
    return byName(a, b)
  })
}

/** Groups keep the incoming order inside each site; sites sorted by name, "no site" last. */
export function groupPlantsBySite(plants: Plant[]): PlantGroup[] {
  const groups = new Map<string, PlantGroup>()
  for (const plant of plants) {
    const key = plant.site_id ?? ''
    if (!groups.has(key)) {
      groups.set(key, { siteId: plant.site_id, siteName: plant.site?.name ?? null, plants: [] })
    }
    groups.get(key)!.plants.push(plant)
  }
  return [...groups.values()].sort((a, b) => {
    if (!a.siteId) return 1
    if (!b.siteId) return -1
    return (a.siteName ?? '').localeCompare(b.siteName ?? '', undefined, { sensitivity: 'base' })
  })
}
