/** Ideal check-in date from last revision + interval. */
export function idealCheckInDueAt(
  lastCheckInAt: Date | null,
  intervalDays: number,
  fromDate: Date = new Date()
): Date {
  const anchor = lastCheckInAt ? new Date(lastCheckInAt) : new Date(fromDate)
  const due = new Date(anchor)
  due.setDate(due.getDate() + intervalDays)
  return due
}
