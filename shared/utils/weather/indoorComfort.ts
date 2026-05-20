import { getSeason, type Season } from '../care/adaptiveWatering'

const INDOOR_HUMIDITY_MID = 50
const INDOOR_HUMIDITY_OUTDOOR_BLEND = 0.65

/** Typical heated/cooled indoor comfort by season (°C). */
export const INDOOR_TEMP_BY_SEASON: Record<Season, number> = {
  winter: 22,
  spring: 23,
  summer: 25,
  fall: 23
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Typical indoor temperature for a comfortable home at the user's location,
 * by season (winter ~22 °C, summer ~25 °C in the northern hemisphere calendar).
 */
export function estimateIndoorComfortTempC(
  month: number,
  homeLat: number | null
): number {
  const season = getSeason(month, homeLat)
  return INDOOR_TEMP_BY_SEASON[season]
}

/**
 * Typical indoor relative humidity for a comfortable home at this location
 * (slightly moderated vs outdoor air).
 */
export function estimateIndoorComfortHumidityPercent(outdoorHumidity: number): number {
  const eased = INDOOR_HUMIDITY_MID
    + (outdoorHumidity - INDOOR_HUMIDITY_MID) * INDOOR_HUMIDITY_OUTDOOR_BLEND
  return Math.round(clamp(eased, 30, 70))
}
