import { WET_SKIP_LOOKBACK_DAYS } from '../../constants/care'

/** Earliest timestamp to count soil-wet skips (after last watering, within lookback). */
export function wetSkipCountSince(
  lastWateredAt: string | null,
  now = new Date()
): Date {
  const since = new Date(now)
  since.setDate(since.getDate() - WET_SKIP_LOOKBACK_DAYS)
  if (lastWateredAt) {
    const lastWatered = new Date(lastWateredAt)
    if (lastWatered > since) {
      return lastWatered
    }
  }
  return since
}

export function countWetSkipsAfter(
  completedAts: string[],
  lastWateredAt: string | null,
  now = new Date()
): number {
  const since = wetSkipCountSince(lastWateredAt, now)
  return completedAts.filter(at => new Date(at) >= since).length
}
