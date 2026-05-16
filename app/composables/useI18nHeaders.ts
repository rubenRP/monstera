export function useI18nHeaders() {
  const { locale } = useI18n()

  function localeHeaders(): Record<string, string> {
    return { 'x-locale': locale.value }
  }

  return { localeHeaders }
}
