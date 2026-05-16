const MAX_WATERING_INTERVAL_DAYS = 90

export function bumpWateringInterval(currentDays: number): number {
  return Math.min(currentDays + 1, MAX_WATERING_INTERVAL_DAYS)
}

export function scheduleWateringFromToday(intervalDays: number, fromDate: Date = new Date()): string {
  const due = new Date(fromDate)
  due.setDate(due.getDate() + intervalDays)
  return due.toISOString()
}
