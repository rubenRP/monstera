import { describe, expect, it } from 'vitest'
import { evaluateGrowthConditions } from './growthConditions'
import type { Site } from '../../types/database'
import type { SpeciesProfile } from '../../types/species'

function site(overrides: Partial<Site> = {}): Site {
  return {
    id: 'site-1',
    user_id: 'u1',
    name: 'Salón',
    placement: 'indoor',
    window_orientation: 'S',
    luminosity: 'medium',
    has_ceiling_cover: false,
    notes: '',
    created_at: '',
    updated_at: '',
    ...overrides
  }
}

function speciesProfile(light: string, humidity = ''): SpeciesProfile {
  return {
    perenualId: 1,
    commonName: 'Monstera',
    scientificName: ['Monstera deliciosa'],
    imageUrl: null,
    imageLicense: null,
    watering: '',
    light,
    humidity,
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

describe('evaluateGrowthConditions', () => {
  it('returns ok when site or luminosity is missing', () => {
    expect(evaluateGrowthConditions({
      siteId: null,
      site: null,
      windowDistanceCm: null,
      homeHumidityPercent: null,
      speciesProfile: null
    })).toEqual({ level: 'ok', reasons: [] })

    expect(evaluateGrowthConditions({
      siteId: 'site-1',
      site: site({ luminosity: null }),
      windowDistanceCm: null,
      homeHumidityPercent: null,
      speciesProfile: null
    })).toEqual({ level: 'ok', reasons: [] })
  })

  it('warns light_too_low when species needs bright light but site is dim', () => {
    const result = evaluateGrowthConditions({
      siteId: 'site-1',
      site: site({ luminosity: 'low' }),
      windowDistanceCm: 50,
      homeHumidityPercent: 50,
      speciesProfile: speciesProfile('Bright indirect light')
    })
    expect(result.level).toBe('warn')
    expect(result.reasons).toContain('light_too_low')
  })

  it('warns window_too_far for bright species far from window indoors', () => {
    const result = evaluateGrowthConditions({
      siteId: 'site-1',
      site: site({ luminosity: 'high' }),
      windowDistanceCm: 250,
      homeHumidityPercent: 50,
      speciesProfile: speciesProfile('Bright indirect light')
    })
    expect(result.reasons).toContain('window_too_far')
  })

  it('does not use window distance for outdoor placement', () => {
    const result = evaluateGrowthConditions({
      siteId: 'site-1',
      site: site({ placement: 'outdoor', luminosity: 'high' }),
      windowDistanceCm: 300,
      homeHumidityPercent: 50,
      speciesProfile: speciesProfile('Bright indirect light')
    })
    expect(result.reasons).not.toContain('window_too_far')
  })

  it('warns humidity_too_low for tropical species in dry home', () => {
    const result = evaluateGrowthConditions({
      siteId: 'site-1',
      site: site(),
      windowDistanceCm: 80,
      homeHumidityPercent: 35,
      speciesProfile: speciesProfile('Medium light', 'High humidity tropical plant')
    })
    expect(result.reasons).toContain('humidity_too_low')
  })

  it('uses generic_low_light_far without species profile', () => {
    const result = evaluateGrowthConditions({
      siteId: 'site-1',
      site: site({ luminosity: 'low' }),
      windowDistanceCm: 220,
      homeHumidityPercent: null,
      speciesProfile: null
    })
    expect(result.reasons).toContain('generic_low_light_far')
  })

  it('uses generic_direct_sun indoors without profile', () => {
    const result = evaluateGrowthConditions({
      siteId: 'site-1',
      site: site({ luminosity: 'direct_sun' }),
      windowDistanceCm: null,
      homeHumidityPercent: null,
      speciesProfile: null
    })
    expect(result.reasons).toContain('generic_direct_sun')
  })

  it('warns placement_outdoor_risk for indoor species outdoors', () => {
    const result = evaluateGrowthConditions({
      siteId: 'site-1',
      site: site({ placement: 'outdoor', luminosity: 'medium' }),
      windowDistanceCm: null,
      homeHumidityPercent: 50,
      speciesProfile: speciesProfile('Indoor houseplant, bright indirect')
    })
    expect(result.reasons).toContain('placement_outdoor_risk')
  })
})
