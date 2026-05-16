import { computeNextWateringDue } from './adaptiveWatering'

/** Schedule next water from today (used after skip). */
export function scheduleWateringFromToday(
  intervalDays: number,
  wetDelayDays = 0,
  fromDate: Date = new Date()
): string {
  return computeNextWateringDue(intervalDays, wetDelayDays, null, fromDate, true)
}
