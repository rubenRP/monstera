import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'

export function taskOverdueDays(dueAt: string, now = new Date()): number {
  const due = new Date(dueAt)
  due.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const diff = today.getTime() - due.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function formatTaskOverdueLabel(days: number, locale: AppLocale = 'es'): string {
  if (days <= 0) return ''
  if (days === 1) return translate(locale, 'care.overdueOne')
  return translate(locale, 'care.overdueMany', { days })
}
