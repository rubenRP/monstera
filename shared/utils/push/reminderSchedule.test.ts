import { describe, expect, it } from 'vitest'
import {
  getLocalDateTimeParts,
  reminderTimeFromInput,
  reminderTimeToInputValue,
  shouldSendPushReminder
} from './reminderSchedule'

describe('reminderTimeToInputValue', () => {
  it('strips seconds for time input', () => {
    expect(reminderTimeToInputValue('09:30:00')).toBe('09:30')
  })
})

describe('reminderTimeFromInput', () => {
  it('adds seconds for database storage', () => {
    expect(reminderTimeFromInput('08:15')).toBe('08:15:00')
  })
})

describe('shouldSendPushReminder', () => {
  const base = {
    push_reminder_time: '09:00:00',
    push_reminder_timezone: 'Europe/Madrid',
    push_reminder_last_sent_on: null
  }

  it('sends after reminder time in user timezone', () => {
    const now = new Date('2026-05-16T07:30:00.000Z')
    expect(shouldSendPushReminder(base, now)).toBe(true)
  })

  it('does not send before reminder time', () => {
    const now = new Date('2026-05-16T06:30:00.000Z')
    expect(shouldSendPushReminder(base, now)).toBe(false)
  })

  it('does not send twice the same local day', () => {
    const now = new Date('2026-05-16T07:30:00.000Z')
    expect(shouldSendPushReminder({
      ...base,
      push_reminder_last_sent_on: '2026-05-16'
    }, now)).toBe(false)
  })
})

describe('getLocalDateTimeParts', () => {
  it('returns calendar date in timezone', () => {
    const parts = getLocalDateTimeParts(
      new Date('2026-05-16T07:30:00.000Z'),
      'Europe/Madrid'
    )
    expect(parts.dateStr).toBe('2026-05-16')
    expect(parts.hour).toBe(9)
  })
})
