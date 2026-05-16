import type { AppLocale } from './locale'
import es from '../../../i18n/locales/es.json'
import en from '../../../i18n/locales/en.json'

const catalogs = { es, en } as const

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  let text = getNested(catalogs[locale] as Record<string, unknown>, key)
    ?? getNested(catalogs.es as Record<string, unknown>, key)
    ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}
