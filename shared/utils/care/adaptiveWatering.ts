import {
    LUMINOSITY_FACTORS,
    MAX_WATERING_INTERVAL_DAYS,
    MIN_WATERING_INTERVAL_DAYS,
    POT_SIZE_FACTORS,
    SEASON_FACTORS,
    SUBSTRATE_FACTORS
} from '../../constants/care'
import type { Luminosity, Plant, PotSize, Site, SubstrateType } from '../../types/database'

export type Season = keyof typeof SEASON_FACTORS

export interface WateringFactors {
  season: Season
  seasonFactor: number
  potFactor: number
  substrateFactor: number
  lightFactor: number
  weatherFactor: number
  wetSkipCount: number
  wetDelayDays: number
}

export interface AdaptiveWateringInput {
  wateringBaseIntervalDays: number
  potSize: PotSize | null
  substrateType: SubstrateType | null
  siteLuminosity: Luminosity | null
  homeLat: number | null
  weatherFactor?: number
  now?: Date
  recentWetSkipCount?: number
  extraWetDelayDays?: number
}

export interface WateringScheduleResult {
  effectiveIntervalDays: number
  factors: WateringFactors
  nextDueAt: string
}

export function getSeason(month: number, homeLat: number | null): Season {
  const northern = homeLat == null || homeLat >= 0
  let m = month
  if (!northern) {
    m = (m + 6) % 12
  }
  if (m === 11 || m === 0 || m === 1) return 'winter'
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  return 'fall'
}

export function seasonFactorFor(month: number, homeLat: number | null): number {
  return SEASON_FACTORS[getSeason(month, homeLat)]
}

export function potSizeFactor(potSize: PotSize | null): number {
  if (!potSize) return 1
  return POT_SIZE_FACTORS[potSize]
}

export function substrateFactor(substrateType: SubstrateType | null): number {
  if (!substrateType) return 1
  return SUBSTRATE_FACTORS[substrateType]
}

export function lightFactor(luminosity: Luminosity | null): number {
  if (!luminosity) return 1
  return LUMINOSITY_FACTORS[luminosity]
}

export function clampWateringInterval(days: number): number {
  return Math.min(MAX_WATERING_INTERVAL_DAYS, Math.max(MIN_WATERING_INTERVAL_DAYS, days))
}

export function computeWateringFactors(input: AdaptiveWateringInput): WateringFactors {
  const now = input.now ?? new Date()
  const season = getSeason(now.getMonth(), input.homeLat)
  const wetSkipCount = input.recentWetSkipCount ?? 0
  const wetDelayDays = wetSkipCount + (input.extraWetDelayDays ?? 0)
  const weatherFactor = input.weatherFactor ?? 1

  return {
    season,
    seasonFactor: SEASON_FACTORS[season],
    potFactor: potSizeFactor(input.potSize),
    substrateFactor: substrateFactor(input.substrateType),
    lightFactor: lightFactor(input.siteLuminosity),
    weatherFactor,
    wetSkipCount,
    wetDelayDays
  }
}

export function resolveEffectiveWateringInterval(
  baseDays: number,
  factors: Pick<WateringFactors, 'seasonFactor' | 'potFactor' | 'substrateFactor' | 'lightFactor' | 'weatherFactor'>
): number {
  const raw = baseDays * factors.seasonFactor * factors.potFactor
    * factors.substrateFactor * factors.lightFactor * factors.weatherFactor
  return clampWateringInterval(Math.round(raw))
}

export function computeNextWateringDue(
  effectiveIntervalDays: number,
  wetDelayDays: number,
  lastWateredAt: string | null,
  fromDate: Date = new Date(),
  scheduleFromToday = false
): string {
  const due = new Date(fromDate)
  if (!scheduleFromToday && lastWateredAt) {
    const anchor = new Date(lastWateredAt)
    anchor.setDate(anchor.getDate() + effectiveIntervalDays + wetDelayDays)
    if (anchor.getTime() > due.getTime()) {
      return anchor.toISOString()
    }
  }
  due.setDate(due.getDate() + effectiveIntervalDays + wetDelayDays)
  return due.toISOString()
}

export function computeWateringSchedule(
  input: AdaptiveWateringInput & {
    lastWateredAt: string | null
    scheduleFromToday?: boolean
  }
): WateringScheduleResult {
  const factors = computeWateringFactors(input)
  const effectiveIntervalDays = resolveEffectiveWateringInterval(
    input.wateringBaseIntervalDays,
    factors
  )
  const nextDueAt = computeNextWateringDue(
    effectiveIntervalDays,
    factors.wetDelayDays,
    input.lastWateredAt,
    input.now,
    input.scheduleFromToday
  )
  return { effectiveIntervalDays, factors, nextDueAt }
}

export function plantToAdaptiveInput(
  plant: Plant & { site?: Site | null },
  homeLat: number | null,
  options?: {
    now?: Date
    recentWetSkipCount?: number
    extraWetDelayDays?: number
    scheduleFromToday?: boolean
    weatherFactor?: number
  }
): AdaptiveWateringInput & { lastWateredAt: string | null, scheduleFromToday?: boolean } {
  const base = plant.watering_base_interval_days ?? plant.watering_interval_days
  return {
    wateringBaseIntervalDays: base,
    potSize: plant.pot_size,
    substrateType: plant.substrate_type,
    siteLuminosity: plant.site?.luminosity ?? null,
    homeLat,
    weatherFactor: options?.weatherFactor,
    now: options?.now,
    recentWetSkipCount: options?.recentWetSkipCount,
    extraWetDelayDays: options?.extraWetDelayDays,
    lastWateredAt: plant.last_watered_at,
    scheduleFromToday: options?.scheduleFromToday
  }
}
