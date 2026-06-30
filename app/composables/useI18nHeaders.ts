export function useI18nHeaders() {
  function localeHeaders(): Record<string, string> {
    try {
      const nuxtApp = useNuxtApp()
      const i18n = nuxtApp.$i18n as { locale?: { value: string } | string } | undefined
      const locale = i18n?.locale
      const value = typeof locale === 'object' && locale != null && 'value' in locale
        ? locale.value
        : typeof locale === 'string'
          ? locale
          : 'es'
      return { 'x-locale': value }
    } catch {
      return { 'x-locale': 'es' }
    }
  }

  return { localeHeaders }
}
