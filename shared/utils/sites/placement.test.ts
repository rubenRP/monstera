import { describe, expect, it } from 'vitest'
import { usesWindowDistance } from './placement'

describe('usesWindowDistance', () => {
  it('is true for indoor and unset placement', () => {
    expect(usesWindowDistance('indoor')).toBe(true)
    expect(usesWindowDistance(null)).toBe(true)
    expect(usesWindowDistance(undefined)).toBe(true)
  })

  it('is false for outdoor and terrace', () => {
    expect(usesWindowDistance('outdoor')).toBe(false)
    expect(usesWindowDistance('semi_outdoor')).toBe(false)
  })
})
