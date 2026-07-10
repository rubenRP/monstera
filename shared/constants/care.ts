import type { HealthStatus, Luminosity, Placement, PotMaterial, PotSize, SubstrateType } from '../types/database'

export const MAX_WATERING_INTERVAL_DAYS = 90
export const MIN_WATERING_INTERVAL_DAYS = 1
export const WET_SKIP_LOOKBACK_DAYS = 60
export const DEFAULT_WATERING_REFERENCE_DAYS = 7

export const SEASON_FACTORS = {
  winter: 1.4,
  spring: 1,
  summer: 0.72,
  fall: 1
} as const

export const POT_SIZE_FACTORS: Record<PotSize, number> = {
  xs: 0.9,
  s: 1,
  m: 1,
  l: 1.1,
  xl: 1.15
}

export const SUBSTRATE_FACTORS: Record<SubstrateType, number> = {
  universal: 1,
  cactus_succulent: 1.2,
  orchid: 1.1,
  acid_loving: 1,
  coco_coir: 1.1,
  peat: 1.1,
  other: 1
}

export const LUMINOSITY_FACTORS: Record<Luminosity, number> = {
  low: 1.1,
  medium: 1,
  high: 0.9,
  direct_sun: 0.9
}

export const HEALTH_FACTORS: Record<HealthStatus, number> = {
  healthy: 1,
  fair: 0.95,
  sick: 0.85,
  critical: 0.85
}

export const PLACEMENT_FACTORS: Record<Placement, number> = {
  indoor: 1,
  semi_outdoor: 0.95,
  outdoor: 0.9
}

export const WINDOW_DISTANCE_NEAR_CM = 50
export const WINDOW_DISTANCE_FAR_CM = 200
export const WINDOW_DISTANCE_NEAR_FACTOR = 0.95
export const WINDOW_DISTANCE_FAR_FACTOR = 1.05

export const DRAINAGE_FACTOR_WITH = 1
export const DRAINAGE_FACTOR_WITHOUT = 0.9

export const POT_DIAMETER_SMALL_CM = 12
export const POT_DIAMETER_LARGE_CM = 25
export const POT_DIAMETER_SMALL_FACTOR = 0.95
export const POT_DIAMETER_LARGE_FACTOR = 1.08

export const POT_MATERIAL_FACTORS: Record<PotMaterial, number> = {
  terracotta: 0.88,
  plastic: 1.12,
  ceramic: 1.05,
  metal: 0.95,
  other: 1
}
