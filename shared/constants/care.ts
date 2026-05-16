import type { Luminosity, PotSize, SubstrateType } from '../types/database'

export const MAX_WATERING_INTERVAL_DAYS = 90
export const MIN_WATERING_INTERVAL_DAYS = 1
export const WET_SKIP_LOOKBACK_DAYS = 60

export const SEASON_FACTORS = {
  winter: 1.15,
  spring: 1,
  summer: 0.85,
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
