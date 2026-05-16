function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function taskOverdueDays(dueAt: string | Date, referenceDate: Date = new Date()): number {
  const due = startOfDay(new Date(dueAt))
  const today = startOfDay(referenceDate)
  const diffMs = today.getTime() - due.getTime()
  return Math.max(0, Math.floor(diffMs / 86_400_000))
}

export function formatTaskOverdueLabel(days: number): string {
  if (days <= 0) return ''
  if (days === 1) return '1 día de retraso'
  return `${days} días de retraso`
}
