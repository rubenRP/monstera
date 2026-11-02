import { describe, expect, it } from 'vitest'
import {
  buildPerenualSearchQueries,
  pickBestPerenualMatch,
  type PerenualSpeciesListItem
} from './searchPerenual'

const item = (id: number, scientific: string, common: string): PerenualSpeciesListItem => ({
  id,
  common_name: common,
  scientific_name: [scientific],
  genus: scientific.split(' ')[0]
})

describe('buildPerenualSearchQueries', () => {
  it('includes kentia aliases for howea forsteriana', () => {
    const queries = buildPerenualSearchQueries('howea forsteriana')
    expect(queries).toContain('howea forsteriana')
    expect(queries).toContain('howea')
    expect(queries).toContain('kentia palm')
    expect(queries).toContain('kentia')
  })
})

describe('pickBestPerenualMatch', () => {
  const ficus = [
    item(1, 'Ficus carica', 'Common Fig'),
    item(2, 'Ficus lyrata', 'Fiddle-leaf Fig'),
    item(3, 'Ficus elastica', 'Rubber Plant')
  ]

  it('does not accept a different species of the same genus for a binomial query', () => {
    expect(pickBestPerenualMatch(ficus, 'ficus nitida')).toBeNull()
  })

  it('picks the exact species when it is in the results', () => {
    expect(pickBestPerenualMatch(ficus, 'ficus lyrata')?.id).toBe(2)
  })

  it('ignores cultivar words after the binomial', () => {
    expect(pickBestPerenualMatch(ficus, 'ficus lyrata bambino')?.id).toBe(2)
  })

  it('matches a two-word common name', () => {
    expect(pickBestPerenualMatch(ficus, 'rubber plant')?.id).toBe(3)
  })

  it('matches via an alias search whose results carry the scientific name', () => {
    const kentia = [item(9, 'Howea forsteriana', 'Kentia Palm')]
    expect(pickBestPerenualMatch(kentia, 'howea forsteriana')?.id).toBe(9)
  })

  it('keeps the first result as fallback for a single-word query', () => {
    expect(pickBestPerenualMatch(ficus, 'ficus')?.id).toBe(1)
  })

  it('returns null without results', () => {
    expect(pickBestPerenualMatch([], 'ficus nitida')).toBeNull()
  })
})
