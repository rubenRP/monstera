/** New due date when postponing a task `days` days: counted from today if overdue, else from its due date. */
export function postponedDueAt(dueAt: string, days: number, now: Date = new Date()): string {
  const due = new Date(dueAt)
  const today = new Date(now)
  today.setHours(due.getHours(), due.getMinutes(), due.getSeconds(), due.getMilliseconds())
  const base = due.getTime() < today.getTime() ? today : due
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next.toISOString()
}
