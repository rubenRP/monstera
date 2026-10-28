import { describe, expect, it } from 'vitest'
import { petToxicity } from './toxicity'

describe('petToxicity', () => {
  it('prefers the structured flag', () => {
    expect(petToxicity({ toxicity: '', toxicToPets: true })).toBe(true)
    expect(petToxicity({ toxicity: 'Mascotas: Tóxica', toxicToPets: false })).toBe(false)
  })

  it('parses older cached text in both languages', () => {
    expect(petToxicity({ toxicity: 'Humanos: No tóxica. Mascotas: Tóxica' })).toBe(true)
    expect(petToxicity({ toxicity: 'Humans: Toxic. Pets: Non-toxic' })).toBe(false)
  })

  it('reads free text from AI-enriched profiles, honouring negations', () => {
    expect(petToxicity({ toxicity: 'Mildly toxic if ingested; keep away from children and pets.' })).toBe(true)
    expect(petToxicity({ toxicity: 'Tóxica si se ingiere: puede irritar boca y digestión' })).toBe(true)
    expect(petToxicity({ toxicity: 'Generalmente considerada no tóxica para personas y mascotas' })).toBe(false)
    expect(petToxicity({ toxicity: 'Se considera no tóxico en niveles prácticos' })).toBe(false)
    expect(petToxicity({ toxicity: 'Non-toxic to cats and dogs' })).toBe(false)
  })

  it('returns null when unknown', () => {
    expect(petToxicity({ toxicity: 'Sin datos' })).toBeNull()
    expect(petToxicity(null)).toBeNull()
  })
})
