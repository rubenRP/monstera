import { describe, expect, it } from 'vitest'
import { PLANT_AVATAR_TINT_COUNT, plantAvatarTint, plantInitials } from './avatar'

describe('plantInitials', () => {
  it('uses first and last meaningful word', () => {
    expect(plantInitials('Ave del paraíso')).toBe('AP')
    expect(plantInitials('Trebol afortunado')).toBe('TA')
  })

  it('uses two letters for single words', () => {
    expect(plantInitials('Costilla')).toBe('CO')
    expect(plantInitials('  pothos ')).toBe('PO')
  })

  it('never returns an empty string', () => {
    expect(plantInitials('')).toBe('?')
    expect(plantInitials('de')).toBe('DE')
  })
})

describe('plantAvatarTint', () => {
  it('is stable and within range', () => {
    const tint = plantAvatarTint('Monstera')
    expect(tint).toBe(plantAvatarTint(' monstera '))
    expect(tint).toBeGreaterThanOrEqual(0)
    expect(tint).toBeLessThan(PLANT_AVATAR_TINT_COUNT)
  })
})
