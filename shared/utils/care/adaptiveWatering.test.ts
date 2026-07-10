import { describe, expect, it } from 'vitest'
import {
  computeNextWateringDue,
  computeOptimalWateringSchedule,
  computeWateringSchedule,
  drainageFactor,
  getSeason,
  healthFactor,
  placementFactor,
  plantToAdaptiveInput,
  potDiameterFactor,
  potMaterialFactor,
  resolveEffectiveWateringInterval,
  seasonFactorFor,
  windowDistanceFactor
} from './adaptiveWatering'
import { SEASON_FACTORS } from '../../constants/care'
import type { Plant } from '../../types/database'

const neutralFactors = {
  seasonFactor: 1,
  potFactor: 1,
  substrateFactor: 1,
  lightFactor: 1,
  humidityFactor: 1,
  weatherFactor: 1,
  healthFactor: 1,
  placementFactor: 1,
  distanceFactor: 1,
  drainageFactor: 1
}

function plantFixture(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'p1',
    user_id: 'u1',
    name: 'Test',
    species: null,
    photo_path: null,
    notes: '',
    health_status: 'healthy',
    health_status_note: null,
    health_status_updated_at: null,
    watering_base_interval_days: 7,
    watering_interval_days: 7,
    fertilizing_interval_days: 30,
    last_watered_at: null,
    last_fertilized_at: null,
    check_in_interval_days: 30,
    last_check_in_at: null,
    site_id: null,
    window_distance_cm: null,
    pot_size: null,
    pot_diameter_cm: null,
    pot_material: null,
    has_drainage: true,
    substrate_type: null,
    substrate_notes: null,
    height_cm: null,
    height_updated_at: null,
    age_years: null,
    age_unit: null,
    archived_at: null,
    archive_reason: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

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
      ...neutralFactors,
      seasonFactor: 1.4,
      potFactor: 1.1
    })
    expect(days).toBe(15)
  })

  it('clamps to max 90', () => {
    const days = resolveEffectiveWateringInterval(80, {
      ...neutralFactors,
      seasonFactor: 1.4,
      potFactor: 1.15,
      substrateFactor: 1.2
    })
    expect(days).toBe(90)
  })

  it('applies health and drainage factors', () => {
    const days = resolveEffectiveWateringInterval(10, {
      ...neutralFactors,
      healthFactor: 0.85,
      drainageFactor: 0.9
    })
    expect(days).toBe(8)
  })

  it('applies humidity factor for dry indoor air', () => {
    const days = resolveEffectiveWateringInterval(10, {
      ...neutralFactors,
      humidityFactor: 0.88
    })
    expect(days).toBe(9)
  })
})

describe('computeNextWateringDue', () => {
  it('returns today when last watered date makes the plant overdue', () => {
    const now = new Date('2026-06-25T12:00:00Z')
    const lastWateredAt = '2026-06-01T12:00:00Z'
    const due = computeNextWateringDue(7, 0, lastWateredAt, now, false)
    expect(due).toBe(now.toISOString())
  })

  it('returns anchor when next watering is still in the future', () => {
    const now = new Date('2026-06-25T12:00:00Z')
    const lastWateredAt = '2026-06-20T12:00:00Z'
    const due = computeNextWateringDue(7, 0, lastWateredAt, now, false)
    expect(due).toBe('2026-06-27T12:00:00.000Z')
  })

  it('schedules from today plus interval when explicitly requested after skip', () => {
    const now = new Date('2026-06-25T12:00:00Z')
    const lastWateredAt = '2026-06-01T12:00:00Z'
    const due = computeNextWateringDue(7, 2, lastWateredAt, now, true)
    expect(due).toBe('2026-07-04T12:00:00.000Z')
  })
})

describe('computeWateringSchedule', () => {
  it('adds wet delay days when scheduling from today', () => {
    const result = computeWateringSchedule({
      wateringBaseIntervalDays: 7,
      potSize: null,
      potDiameterCm: null,
      potMaterial: null,
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

describe('computeOptimalWateringSchedule', () => {
  const baseInput = {
    wateringBaseIntervalDays: 10,
    potSize: null,
    potDiameterCm: null,
    potMaterial: null,
    substrateType: null,
    siteLuminosity: null,
    sitePlacement: null,
    healthStatus: 'healthy' as const,
    windowDistanceCm: null,
    hasDrainage: true,
    homeLat: 40,
    lastWateredAt: null,
    now: new Date('2026-03-15T12:00:00Z')
  }

  it('uses environmental interval without history', () => {
    const result = computeOptimalWateringSchedule({
      ...baseInput,
      completedWaterIntervals: [5, 6]
    })
    expect(result.effectiveIntervalDays).toBe(10)
  })

  it('blends with historical median when enough intervals', () => {
    const result = computeOptimalWateringSchedule({
      ...baseInput,
      completedWaterIntervals: [5, 6, 7]
    })
    expect(result.effectiveIntervalDays).toBe(9)
  })
})

describe('weather factor', () => {
  it('shortens interval with dry weather factor', () => {
    const result = computeWateringSchedule({
      wateringBaseIntervalDays: 10,
      potSize: null,
      potDiameterCm: null,
      potMaterial: null,
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
    expect(seasonFactorFor(6, 40)).toBe(0.72)
  })

  it('lengthens interval in winter', () => {
    expect(seasonFactorFor(0, 40)).toBe(1.4)
  })

  it('roughly doubles interval from summer to winter at same factors', () => {
    const summer = resolveEffectiveWateringInterval(7, {
      ...neutralFactors,
      seasonFactor: SEASON_FACTORS.summer
    })
    const winter = resolveEffectiveWateringInterval(7, {
      ...neutralFactors,
      seasonFactor: SEASON_FACTORS.winter
    })
    expect(winter / summer).toBeGreaterThanOrEqual(1.9)
  })
})

describe('plant environment factors', () => {
  it('shortens interval when sick', () => {
    expect(healthFactor('sick')).toBe(0.85)
  })

  it('shortens interval for outdoor placement', () => {
    expect(placementFactor('outdoor')).toBe(0.9)
  })

  it('adjusts for window distance indoors', () => {
    expect(windowDistanceFactor(30, 'indoor')).toBe(0.95)
    expect(windowDistanceFactor(250, 'indoor')).toBe(1.05)
  })

  it('ignores window distance for outdoor and terrace', () => {
    expect(windowDistanceFactor(30, 'outdoor')).toBe(1)
    expect(windowDistanceFactor(30, 'semi_outdoor')).toBe(1)
  })

  it('shortens interval without drainage', () => {
    expect(drainageFactor(false)).toBe(0.9)
  })

  it('uses pot diameter when available', () => {
    expect(potDiameterFactor(10, 'l')).toBe(0.95)
    expect(potDiameterFactor(30, null)).toBe(1.08)
  })

  it('shortens interval for terracotta pots', () => {
    expect(potMaterialFactor('terracotta')).toBe(0.88)
  })

  it('lengthens interval for plastic pots', () => {
    expect(potMaterialFactor('plastic')).toBe(1.12)
  })
})

describe('reference plants seasonal regression', () => {
  const summer = new Date('2026-07-10T12:00:00+02:00')
  const winter = new Date('2026-01-10T12:00:00+01:00')

  function envInterval(plant: Plant, now: Date, humidityFactor = 1) {
    const input = plantToAdaptiveInput(plant, 40, { now, humidityFactor })
    const result = computeOptimalWateringSchedule({
      ...input,
      completedWaterIntervals: []
    })
    return result.effectiveIntervalDays
  }

  it('Marantita: summer ~5d, winter ~10d', () => {
    const plant = plantFixture({
      name: 'Marantita',
      species: 'Maranta leuconeura',
      pot_size: 'xs',
      pot_diameter_cm: 10,
      window_distance_cm: 50,
      site: {
        id: 's1',
        user_id: 'u1',
        name: 'Despacho',
        placement: 'indoor',
        window_orientation: 'W',
        luminosity: 'medium',
        has_ceiling_cover: false,
        notes: '',
        created_at: '',
        updated_at: ''
      }
    })
    const summerDays = envInterval(plant, summer)
    const winterDays = envInterval(plant, winter)
    expect(summerDays).toBeGreaterThanOrEqual(4)
    expect(summerDays).toBeLessThanOrEqual(7)
    expect(winterDays).toBeGreaterThanOrEqual(9)
    expect(winterDays).toBeLessThanOrEqual(13)
  })

  it('Costilla: summer ~7-9d, winter ~14d', () => {
    const plant = plantFixture({
      name: 'Costilla',
      species: 'Monstera deliciosa',
      pot_size: 'm',
      pot_diameter_cm: 25,
      window_distance_cm: 200,
      site: {
        id: 's2',
        user_id: 'u1',
        name: 'Salón',
        placement: 'indoor',
        window_orientation: 'E',
        luminosity: 'medium',
        has_ceiling_cover: false,
        notes: '',
        created_at: '',
        updated_at: ''
      }
    })
    const summerDays = envInterval(plant, summer)
    const winterDays = envInterval(plant, winter)
    expect(summerDays).toBeGreaterThanOrEqual(6)
    expect(summerDays).toBeLessThanOrEqual(10)
    expect(winterDays).toBeGreaterThanOrEqual(10)
    expect(winterDays).toBeLessThanOrEqual(14)
  })

  it('Ave del paraíso: summer ~6-8d, winter ~12d', () => {
    const plant = plantFixture({
      name: 'Ave del paraíso',
      species: 'Strelitzia nicolai',
      pot_size: 'm',
      pot_diameter_cm: 25,
      window_distance_cm: 50,
      site: {
        id: 's3',
        user_id: 'u1',
        name: 'Despacho',
        placement: 'indoor',
        window_orientation: 'W',
        luminosity: 'medium',
        has_ceiling_cover: false,
        notes: '',
        created_at: '',
        updated_at: ''
      }
    })
    const summerDays = envInterval(plant, summer)
    const winterDays = envInterval(plant, winter)
    expect(summerDays).toBeGreaterThanOrEqual(5)
    expect(summerDays).toBeLessThanOrEqual(9)
    expect(winterDays).toBeGreaterThanOrEqual(10)
    expect(winterDays).toBeLessThanOrEqual(15)
  })
})
