import { describe, expect, it } from 'vitest'
import { suggestWateringDaysFromProfile } from './speciesWateringHint'
import type { SpeciesProfile } from '../../types/species'

function profile(watering: string): SpeciesProfile {
  return {
    perenualId: 1,
    commonName: 'Test',
    scientificName: ['Test'],
    imageUrl: null,
    imageLicense: null,
    watering,
    light: '',
    humidity: '',
    fertilizing: '',
    soil: '',
    repotting: '',
    toxicity: '',
    characteristics: '',
    temperature: '',
    pestsAndProblems: '',
    fetchedAt: new Date().toISOString()
  }
}

describe('suggestWateringDaysFromProfile', () => {
  it('parses Spanish benchmark line', () => {
    const days = suggestWateringDaysFromProfile(profile(
      'Frecuencia: average\n\nReferencia: cada 5 días'
    ))
    expect(days).toBe(5)
  })

  it('parses every N days in English', () => {
    const days = suggestWateringDaysFromProfile(profile('Water every 4 days'))
    expect(days).toBe(4)
  })

  it('returns null when no pattern matches', () => {
    expect(suggestWateringDaysFromProfile(null)).toBeNull()
    expect(suggestWateringDaysFromProfile(profile(''))).toBeNull()
  })
})
