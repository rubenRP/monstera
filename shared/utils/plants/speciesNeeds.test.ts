import { describe, expect, it } from 'vitest'
import { hasReliableSpeciesNeeds, parseSpeciesNeeds } from './speciesNeeds'
import type { SpeciesProfile } from '../../types/species'

function profile(overrides: Partial<SpeciesProfile> = {}): SpeciesProfile {
  return {
    perenualId: 1,
    commonName: 'Test',
    scientificName: ['Test'],
    imageUrl: null,
    imageLicense: null,
    watering: '',
    light: '',
    humidity: '',
    fertilizing: '',
    soil: '',
    repotting: '',
    toxicity: '',
    characteristics: '',
    temperature: '',
    pestsAndProblems: '',
    fetchedAt: new Date().toISOString(),
    ...overrides
  }
}

describe('parseSpeciesNeeds', () => {
  it('parses bright indirect light in English', () => {
    const needs = parseSpeciesNeeds(profile({ light: 'Bright indirect light near a window' }))
    expect(needs?.lightNeed).toBe('bright')
  })

  it('parses sombra in Spanish', () => {
    const needs = parseSpeciesNeeds(profile({ light: 'Planta de sombra, poca luz' }))
    expect(needs?.lightNeed).toBe('shade')
  })

  it('parses high humidity', () => {
    const needs = parseSpeciesNeeds(profile({ humidity: 'High humidity, tropical conditions' }))
    expect(needs?.humidityNeed).toBe('high')
  })

  it('detects prefersIndoor', () => {
    const needs = parseSpeciesNeeds(profile({ light: 'Indoor houseplant, bright indirect' }))
    expect(needs?.prefersIndoor).toBe(true)
    expect(needs?.toleratesOutdoor).toBe(false)
  })

  it('returns null for empty profile', () => {
    expect(parseSpeciesNeeds(null)).toBeNull()
    expect(parseSpeciesNeeds(profile())).toBeNull()
  })
})

describe('hasReliableSpeciesNeeds', () => {
  it('is true when light need is parsed', () => {
    const needs = parseSpeciesNeeds(profile({ light: 'Direct sun' }))
    expect(hasReliableSpeciesNeeds(needs)).toBe(true)
  })
})
