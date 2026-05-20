import {
  MAX_WATERING_INTERVAL_DAYS,
  MIN_WATERING_INTERVAL_DAYS
} from '../../constants/care'
import type { SpeciesProfile } from '../../types/species'

function clampDays(days: number): number {
  return Math.min(
    MAX_WATERING_INTERVAL_DAYS,
    Math.max(MIN_WATERING_INTERVAL_DAYS, Math.round(days))
  )
}

/** Parse Perenual-style benchmark from profile.watering text or numeric patterns. */
export function suggestWateringDaysFromProfile(profile: SpeciesProfile | null | undefined): number | null {
  if (!profile?.watering?.trim()) return null

  const text = profile.watering

  const benchmarkMatch = text.match(
    /(?:referencia|reference|benchmark)[:\s]+(?:cada|every)?\s*(\d+(?:[.,]\d+)?)\s*(d[ií]as?|days?|day)/i
  )
  if (benchmarkMatch?.[1]) {
    return clampDays(Number(benchmarkMatch[1].replace(',', '.')))
  }

  const everyMatch = text.match(/(?:cada|every)\s*(\d+(?:[.,]\d+)?)\s*(d[ií]as?|days?|day)/i)
  if (everyMatch?.[1]) {
    return clampDays(Number(everyMatch[1].replace(',', '.')))
  }

  const lower = text.toLowerCase()
  if (/\b(frequent|frequentemente|minimum|mínimo|often|a menudo)\b/.test(lower)) {
    return 3
  }
  if (/\b(average|promedio|moderate|moderado)\b/.test(lower)) {
    return 7
  }
  if (/\b(minimum|mínimo|infrequent|raro|rarely)\b/.test(lower)) {
    return 14
  }

  return null
}
