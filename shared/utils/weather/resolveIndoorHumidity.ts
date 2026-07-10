import type { IndoorHumidityLevel } from '../../types/database'
import { estimateIndoorComfortHumidityPercent } from './indoorComfort'

const MANUAL_HUMIDITY_PERCENT: Record<Exclude<IndoorHumidityLevel, 'auto'>, number> = {
  low: 35,
  normal: 50,
  high: 65
}

const NEUTRAL_HUMIDITY_PERCENT = 50
const MIN_HUMIDITY_PERCENT = 35
const MAX_HUMIDITY_PERCENT = 65
const LOW_HUMIDITY_FACTOR = 0.88
const HIGH_HUMIDITY_FACTOR = 1.12

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function resolveIndoorHumidityPercent(
  preference: IndoorHumidityLevel,
  outdoorHumidityPercent: number | null
): number {
  if (preference === 'auto') {
    if (outdoorHumidityPercent != null) {
      return estimateIndoorComfortHumidityPercent(outdoorHumidityPercent)
    }
    return NEUTRAL_HUMIDITY_PERCENT
  }
  return MANUAL_HUMIDITY_PERCENT[preference]
}

/** Lower humidity → shorter interval (factor &lt; 1). */
export function humidityFactorFromPercent(percent: number): number {
  const t = (percent - MIN_HUMIDITY_PERCENT) / (MAX_HUMIDITY_PERCENT - MIN_HUMIDITY_PERCENT)
  const raw = LOW_HUMIDITY_FACTOR + t * (HIGH_HUMIDITY_FACTOR - LOW_HUMIDITY_FACTOR)
  return clamp(raw, LOW_HUMIDITY_FACTOR, HIGH_HUMIDITY_FACTOR)
}

export function indoorHumidityFactor(
  preference: IndoorHumidityLevel,
  outdoorHumidityPercent: number | null
): number {
  const percent = resolveIndoorHumidityPercent(preference, outdoorHumidityPercent)
  return humidityFactorFromPercent(percent)
}
