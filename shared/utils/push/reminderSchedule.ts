export const DEFAULT_PUSH_REMINDER_TIME = '09:00:00'

export interface PushReminderSettings {
  push_reminder_time?: string | null
  push_reminder_timezone?: string | null
  push_reminder_last_sent_on?: string | null
}

export function parseReminderTime(time: string): { hour: number, minute: number } {
  const [hourPart, minutePart] = time.split(':')
  return {
    hour: Number(hourPart) || 0,
    minute: Number(minutePart) || 0
  }
}

export function reminderTimeToInputValue(time: string | null | undefined): string {
  if (!time) return '09:00'
  return time.slice(0, 5)
}

export function reminderTimeFromInput(value: string): string {
  if (!value) return DEFAULT_PUSH_REMINDER_TIME
  return value.length === 5 ? `${value}:00` : value
}

export function getLocalDateTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const parts = formatter.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? '00'

  let hour = Number(get('hour'))
  if (hour === 24) hour = 0

  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour,
    minute: Number(get('minute'))
  }
}

/** True when local time has reached today's reminder and we have not sent yet today. */
export function shouldSendPushReminder(
  settings: PushReminderSettings,
  now: Date = new Date()
): boolean {
  const timeZone = settings.push_reminder_timezone || 'UTC'
  const { hour: targetHour, minute: targetMinute } = parseReminderTime(
    settings.push_reminder_time || DEFAULT_PUSH_REMINDER_TIME
  )
  const local = getLocalDateTimeParts(now, timeZone)
  const reached = local.hour > targetHour
    || (local.hour === targetHour && local.minute >= targetMinute)

  if (!reached) return false
  if (settings.push_reminder_last_sent_on === local.dateStr) return false
  return true
}

export function getBrowserTimezone(): string {
  if (typeof Intl === 'undefined') return 'UTC'
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}
