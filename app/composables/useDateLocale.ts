import { dateLocaleTag } from '#shared/utils/i18n/locale'

export function useDateLocale() {
  const { locale } = useI18n()

  const dateLocale = computed(() => dateLocaleTag(locale.value as 'es' | 'en'))

  return { dateLocale }
}
