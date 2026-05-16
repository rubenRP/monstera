export type AppLocale = 'es' | 'en'

export const APP_LOCALES: AppLocale[] = ['es', 'en']

export function parseAppLocale(value: string | null | undefined): AppLocale {
  return value === 'en' ? 'en' : 'es'
}

export function dateLocaleTag(locale: AppLocale): string {
  return locale === 'en' ? 'en-US' : 'es-ES'
}
