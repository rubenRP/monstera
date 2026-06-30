import { clampWateringInterval } from './adaptiveWatering'

export const WATERING_HISTORY_LOOKBACK_DAYS = 180
export const MIN_WATERING_HISTORY_INTERVALS = 3
export const MAX_HISTORY_BLEND_WEIGHT = 0.6

const MS_PER_DAY = 86400000

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }
  return sorted[mid]!
}

/** Days between consecutive completed_at timestamps (oldest first). */
export function daysBetweenWateringCompletions(completedAts: string[]): number[] {
  if (completedAts.length < 2) return []
  const sorted = [...completedAts].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )
  const intervals: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!).getTime()
    const curr = new Date(sorted[i]!).getTime()
    const days = Math.round((curr - prev) / MS_PER_DAY)
    if (days > 0) {
      intervals.push(days)
    }
  }
  return intervals
}

export function medianDaysBetweenWaterings(intervals: number[]): number | null {
  if (intervals.length < MIN_WATERING_HISTORY_INTERVALS) return null
  return clampWateringInterval(Math.round(median(intervals)))
}

export function historyBlendWeight(intervalCount: number): number {
  if (intervalCount < MIN_WATERING_HISTORY_INTERVALS) return 0
  return Math.min(MAX_HISTORY_BLEND_WEIGHT, (intervalCount - 2) * 0.15)
}

export function blendIntervalWithHistory(
  environmentalDays: number,
  historicalDays: number,
  intervalCount: number
): number {
  const weight = historyBlendWeight(intervalCount)
  if (weight === 0) return environmentalDays
  const blended = environmentalDays * (1 - weight) + historicalDays * weight
  return clampWateringInterval(Math.round(blended))
}
