import type { H3Event } from 'h3'
import { parseAppLocale, type AppLocale } from '#shared/utils/i18n/locale'

export function getRequestLocale(event: H3Event): AppLocale {
  const header = getHeader(event, 'x-locale')
  if (header) return parseAppLocale(header)
  const accept = getHeader(event, 'accept-language')
  if (accept?.toLowerCase().startsWith('en')) return 'en'
  return 'es'
}
