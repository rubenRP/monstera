import { describe, expect, it } from 'vitest'
import type { Plant } from '../../types/database'
import { filterPlants, groupPlantsBySite, sortPlants } from './listView'

function plant(id: string, name: string, extra: Partial<Plant> = {}): Plant {
  return {
    id,
    name,
    species: null,
    health_status: 'healthy',
    site_id: null,
    site: null,
    ...extra
  } as Plant
}

const salon = { id: 's1', name: 'Salón' } as Plant['site']
const terraza = { id: 's2', name: 'Terraza' } as Plant['site']

const plants = [
  plant('1', 'Monstera', { species: 'Monstera deliciosa', site_id: 's1', site: salon, health_status: 'fair' }),
  plant('2', 'Ave del paraíso', { site_id: 's2', site: terraza }),
  plant('3', 'Pothos', { health_status: 'critical' })
]

describe('filterPlants', () => {
  it('matches name, species and site ignoring accents and case', () => {
    expect(filterPlants(plants, 'PARAISO').map(p => p.id)).toEqual(['2'])
    expect(filterPlants(plants, 'deliciosa').map(p => p.id)).toEqual(['1'])
    expect(filterPlants(plants, 'salon').map(p => p.id)).toEqual(['1'])
    expect(filterPlants(plants, '  ')).toHaveLength(3)
  })
})

describe('sortPlants', () => {
  it('sorts by name', () => {
    expect(sortPlants(plants, 'name').map(p => p.name)).toEqual(['Ave del paraíso', 'Monstera', 'Pothos'])
  })

  it('sorts by health, worst first', () => {
    expect(sortPlants(plants, 'health').map(p => p.id)).toEqual(['3', '1', '2'])
  })

  it('sorts by next watering, unscheduled last', () => {
    const next = new Map([['1', '2026-11-05T09:00:00Z'], ['3', '2026-10-30T09:00:00Z']])
    expect(sortPlants(plants, 'next_water', next).map(p => p.id)).toEqual(['3', '1', '2'])
  })
})

describe('groupPlantsBySite', () => {
  it('groups by site name with "no site" last', () => {
    const groups = groupPlantsBySite(plants)
    expect(groups.map(g => g.siteName)).toEqual(['Salón', 'Terraza', null])
    expect(groups[2]!.plants.map(p => p.id)).toEqual(['3'])
  })
})
