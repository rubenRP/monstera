import {
  DRAINAGE_FACTOR_WITH,
  DRAINAGE_FACTOR_WITHOUT,
  HEALTH_FACTORS,
  LUMINOSITY_FACTORS,
  MAX_WATERING_INTERVAL_DAYS,
  MIN_WATERING_INTERVAL_DAYS,
  PLACEMENT_FACTORS,
  POT_DIAMETER_LARGE_CM,
  POT_DIAMETER_LARGE_FACTOR,
  POT_DIAMETER_SMALL_CM,
  POT_DIAMETER_SMALL_FACTOR,
  POT_SIZE_FACTORS,
  SEASON_FACTORS,
  SUBSTRATE_FACTORS,
  WINDOW_DISTANCE_FAR_CM,
  WINDOW_DISTANCE_FAR_FACTOR,
  WINDOW_DISTANCE_NEAR_CM,
  WINDOW_DISTANCE_NEAR_FACTOR
} from '../../constants/care'
import type {
  HealthStatus,
  Luminosity,
  Placement,
  Plant,
  PotSize,
  Site,
  SubstrateType
} from '../../types/database'
import {
  blendIntervalWithHistory,
  medianDaysBetweenWaterings
} from './wateringHistory'
import type { WateringReferenceSource } from './resolveWateringReference'
import { usesWindowDistance } from '../sites/placement'

export type { WateringReferenceSource }
export type Season = keyof typeof SEASON_FACTORS

export interface WateringFactors {
  season: Season
  seasonFactor: number
  potFactor: number
  substrateFactor: number
  lightFactor: number
  weatherFactor: number
  healthFactor: number
  placementFactor: number
  distanceFactor: number
  drainageFactor: number
  potVolumeFactor: number
  wetSkipCount: number
  wetDelayDays: number
}

export interface AdaptiveWateringInput {
  wateringBaseIntervalDays: number
  potSize: PotSize | null
  potDiameterCm: number | null
  substrateType: SubstrateType | null
  siteLuminosity: Luminosity | null
  sitePlacement: Placement | null
  healthStatus: HealthStatus
  windowDistanceCm: number | null
  hasDrainage: boolean
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
  referenceDays: number
  referenceSource: WateringReferenceSource
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

export function potDiameterFactor(potDiameterCm: number | null, potSize: PotSize | null): number {
  if (potDiameterCm != null) {
    if (potDiameterCm <= POT_DIAMETER_SMALL_CM) return POT_DIAMETER_SMALL_FACTOR
    if (potDiameterCm >= POT_DIAMETER_LARGE_CM) return POT_DIAMETER_LARGE_FACTOR
    return 1
  }
  return potSizeFactor(potSize)
}

export function substrateFactor(substrateType: SubstrateType | null): number {
  if (!substrateType) return 1
  return SUBSTRATE_FACTORS[substrateType]
}

export function lightFactor(luminosity: Luminosity | null): number {
  if (!luminosity) return 1
  return LUMINOSITY_FACTORS[luminosity]
}

export function healthFactor(status: HealthStatus): number {
  return HEALTH_FACTORS[status]
}

export function placementFactor(placement: Placement | null): number {
  if (!placement) return 1
  return PLACEMENT_FACTORS[placement] ?? 1
}

export function windowDistanceFactor(
  distanceCm: number | null,
  placement?: Placement | null
): number {
  if (!usesWindowDistance(placement)) return 1
  if (distanceCm == null) return 1
  if (distanceCm <= WINDOW_DISTANCE_NEAR_CM) return WINDOW_DISTANCE_NEAR_FACTOR
  if (distanceCm >= WINDOW_DISTANCE_FAR_CM) return WINDOW_DISTANCE_FAR_FACTOR
  return 1
}

export function drainageFactor(hasDrainage: boolean): number {
  return hasDrainage ? DRAINAGE_FACTOR_WITH : DRAINAGE_FACTOR_WITHOUT
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
  const potVolumeFactor = potDiameterFactor(input.potDiameterCm, input.potSize)

  return {
    season,
    seasonFactor: SEASON_FACTORS[season],
    potFactor: potVolumeFactor,
    substrateFactor: substrateFactor(input.substrateType),
    lightFactor: lightFactor(input.siteLuminosity),
    weatherFactor,
    healthFactor: healthFactor(input.healthStatus),
    placementFactor: placementFactor(input.sitePlacement),
    distanceFactor: windowDistanceFactor(input.windowDistanceCm, input.sitePlacement),
    drainageFactor: drainageFactor(input.hasDrainage),
    potVolumeFactor,
    wetSkipCount,
    wetDelayDays
  }
}

export function resolveEffectiveWateringInterval(
  baseDays: number,
  factors: Pick<
    WateringFactors,
    | 'seasonFactor'
    | 'potFactor'
    | 'substrateFactor'
    | 'lightFactor'
    | 'weatherFactor'
    | 'healthFactor'
    | 'placementFactor'
    | 'distanceFactor'
    | 'drainageFactor'
  >
): number {
  const raw = baseDays * factors.seasonFactor * factors.potFactor
    * factors.substrateFactor * factors.lightFactor * factors.weatherFactor
    * factors.healthFactor * factors.placementFactor * factors.distanceFactor
    * factors.drainageFactor
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
    return due.toISOString()
  }
  due.setDate(due.getDate() + effectiveIntervalDays + wetDelayDays)
  return due.toISOString()
}

export function computeWateringSchedule(
  input: AdaptiveWateringInput & {
    lastWateredAt: string | null
    scheduleFromToday?: boolean
    referenceSource?: WateringReferenceSource
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
  return {
    effectiveIntervalDays,
    factors,
    nextDueAt,
    referenceDays: input.wateringBaseIntervalDays,
    referenceSource: input.referenceSource ?? 'default'
  }
}

export function computeOptimalWateringSchedule(
  input: AdaptiveWateringInput & {
    lastWateredAt: string | null
    scheduleFromToday?: boolean
    completedWaterIntervals?: number[]
    referenceSource?: WateringReferenceSource
  }
): WateringScheduleResult {
  const factors = computeWateringFactors(input)
  const environmentalDays = resolveEffectiveWateringInterval(
    input.wateringBaseIntervalDays,
    factors
  )
  const intervals = input.completedWaterIntervals ?? []
  const historicalDays = medianDaysBetweenWaterings(intervals)
  const effectiveIntervalDays = historicalDays != null
    ? blendIntervalWithHistory(environmentalDays, historicalDays, intervals.length)
    : environmentalDays
  const nextDueAt = computeNextWateringDue(
    effectiveIntervalDays,
    factors.wetDelayDays,
    input.lastWateredAt,
    input.now,
    input.scheduleFromToday
  )
  return {
    effectiveIntervalDays,
    factors,
    nextDueAt,
    referenceDays: input.wateringBaseIntervalDays,
    referenceSource: input.referenceSource ?? 'default'
  }
}

export function plantToAdaptiveInput(
  plant: Plant & { site?: Site | null },
  homeLat: number | null,
  options?: {
    speciesReferenceDays?: number
    now?: Date
    recentWetSkipCount?: number
    extraWetDelayDays?: number
    scheduleFromToday?: boolean
    weatherFactor?: number
    completedWaterIntervals?: number[]
    referenceSource?: WateringReferenceSource
  }
): AdaptiveWateringInput & {
  lastWateredAt: string | null
  scheduleFromToday?: boolean
  completedWaterIntervals?: number[]
  referenceSource?: WateringReferenceSource
} {
  const base = options?.speciesReferenceDays
    ?? plant.watering_base_interval_days
    ?? plant.watering_interval_days
  return {
    wateringBaseIntervalDays: base,
    potSize: plant.pot_size,
    potDiameterCm: plant.pot_diameter_cm != null ? Number(plant.pot_diameter_cm) : null,
    substrateType: plant.substrate_type,
    siteLuminosity: plant.site?.luminosity ?? null,
    sitePlacement: plant.site?.placement ?? null,
    healthStatus: plant.health_status,
    windowDistanceCm: plant.window_distance_cm,
    hasDrainage: plant.has_drainage,
    homeLat,
    weatherFactor: options?.weatherFactor,
    now: options?.now,
    recentWetSkipCount: options?.recentWetSkipCount,
    extraWetDelayDays: options?.extraWetDelayDays,
    lastWateredAt: plant.last_watered_at,
    scheduleFromToday: options?.scheduleFromToday,
    completedWaterIntervals: options?.completedWaterIntervals,
    referenceSource: options?.referenceSource
  }
}
