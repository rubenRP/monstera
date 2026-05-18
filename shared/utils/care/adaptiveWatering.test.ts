import { describe, expect, it } from 'vitest'
import {
  computeWateringSchedule,
  getSeason,
  resolveEffectiveWateringInterval,
  seasonFactorFor
} from './adaptiveWatering'

describe('getSeason', () => {
  it('returns winter for January in northern hemisphere', () => {
    expect(getSeason(0, 40)).toBe('winter')
  })

  it('inverts seasons for southern hemisphere', () => {
    expect(getSeason(0, -34)).toBe('summer')
  })
})

describe('resolveEffectiveWateringInterval', () => {
  it('applies season and pot factors', () => {
    const days = resolveEffectiveWateringInterval(10, {
      seasonFactor: 1.15,
      potFactor: 1.1,
      substrateFactor: 1,
      lightFactor: 1,
      weatherFactor: 1
    })
    expect(days).toBe(13)
  })

  it('clamps to max 90', () => {
    const days = resolveEffectiveWateringInterval(80, {
      seasonFactor: 1.15,
      potFactor: 1.15,
      substrateFactor: 1.2,
      lightFactor: 1,
      weatherFactor: 1
    })
    expect(days).toBe(90)
  })
})

describe('computeWateringSchedule', () => {
  it('adds wet delay days when scheduling from today', () => {
    const result = computeWateringSchedule({
      wateringBaseIntervalDays: 7,
      potSize: null,
      substrateType: null,
      siteLuminosity: null,
      homeLat: 40,
      lastWateredAt: null,
      recentWetSkipCount: 2,
      scheduleFromToday: true,
      now: new Date('2026-01-15T12:00:00Z')
    })
    expect(result.factors.wetDelayDays).toBe(2)
    const due = new Date(result.nextDueAt)
    const from = new Date('2026-01-15T12:00:00Z')
    const diffDays = Math.round((due.getTime() - from.getTime()) / 86400000)
    expect(diffDays).toBeGreaterThanOrEqual(7 + 2 - 1)
  })
})

describe('weather factor', () => {
  it('shortens interval with dry weather factor', () => {
    const result = computeWateringSchedule({
      wateringBaseIntervalDays: 10,
      potSize: null,
      substrateType: null,
      siteLuminosity: null,
      homeLat: 40,
      weatherFactor: 0.8,
      lastWateredAt: null,
      now: new Date('2026-03-15T12:00:00Z')
    })
    expect(result.effectiveIntervalDays).toBe(8)
  })
})

describe('seasonFactorFor', () => {
  it('shortens interval in summer', () => {
    expect(seasonFactorFor(6, 40)).toBe(0.85)
  })
})
