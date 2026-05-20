import { describe, expect, it } from 'vitest'
import {
  computeWateringSchedule,
  drainageFactor,
  getSeason,
  healthFactor,
  placementFactor,
  potDiameterFactor,
  resolveEffectiveWateringInterval,
  seasonFactorFor,
  windowDistanceFactor
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
      weatherFactor: 1,
      healthFactor: 1,
      placementFactor: 1,
      distanceFactor: 1,
      drainageFactor: 1
    })
    expect(days).toBe(13)
  })

  it('clamps to max 90', () => {
    const days = resolveEffectiveWateringInterval(80, {
      seasonFactor: 1.15,
      potFactor: 1.15,
      substrateFactor: 1.2,
      lightFactor: 1,
      weatherFactor: 1,
      healthFactor: 1,
      placementFactor: 1,
      distanceFactor: 1,
      drainageFactor: 1
    })
    expect(days).toBe(90)
  })

  it('applies health and drainage factors', () => {
    const days = resolveEffectiveWateringInterval(10, {
      seasonFactor: 1,
      potFactor: 1,
      substrateFactor: 1,
      lightFactor: 1,
      weatherFactor: 1,
      healthFactor: 0.85,
      placementFactor: 1,
      distanceFactor: 1,
      drainageFactor: 0.9
    })
    expect(days).toBe(8)
  })
})

describe('computeWateringSchedule', () => {
  it('adds wet delay days when scheduling from today', () => {
    const result = computeWateringSchedule({
      wateringBaseIntervalDays: 7,
      potSize: null,
      potDiameterCm: null,
      substrateType: null,
      siteLuminosity: null,
      sitePlacement: null,
      healthStatus: 'healthy',
      windowDistanceCm: null,
      hasDrainage: true,
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
      potDiameterCm: null,
      substrateType: null,
      siteLuminosity: null,
      sitePlacement: 'indoor',
      healthStatus: 'healthy',
      windowDistanceCm: null,
      hasDrainage: true,
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

describe('plant environment factors', () => {
  it('shortens interval when sick', () => {
    expect(healthFactor('sick')).toBe(0.85)
  })

  it('shortens interval for outdoor placement', () => {
    expect(placementFactor('outdoor')).toBe(0.9)
  })

  it('adjusts for window distance', () => {
    expect(windowDistanceFactor(30)).toBe(0.95)
    expect(windowDistanceFactor(250)).toBe(1.05)
  })

  it('shortens interval without drainage', () => {
    expect(drainageFactor(false)).toBe(0.9)
  })

  it('uses pot diameter when available', () => {
    expect(potDiameterFactor(10, 'l')).toBe(0.95)
    expect(potDiameterFactor(30, null)).toBe(1.08)
  })
})
