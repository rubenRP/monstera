/** Ideal fertilization date from last application + interval. */
export function idealFertilizeDueAt(
  lastFertilizedAt: Date | null,
  fertilizingIntervalDays: number,
  fromDate: Date = new Date()
): Date {
  const due = lastFertilizedAt ? new Date(lastFertilizedAt) : new Date(fromDate)
  due.setDate(due.getDate() + fertilizingIntervalDays)
  return due
}

/**
 * Snaps fertilization to the next watering on or after the ideal date.
 * Liquid fertilizer is typically applied with irrigation water.
 */
export function alignFertilizeDueAt(
  idealDueAt: Date,
  nextWaterDueAt: Date | null,
  wateringIntervalDays: number
): Date {
  if (!nextWaterDueAt || wateringIntervalDays < 1) {
    return new Date(idealDueAt)
  }

  const aligned = new Date(nextWaterDueAt)
  while (aligned.getTime() < idealDueAt.getTime()) {
    aligned.setDate(aligned.getDate() + wateringIntervalDays)
  }
  return aligned
}

export function isSameCalendarDay(a: Date | string, b: Date | string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate()
}
