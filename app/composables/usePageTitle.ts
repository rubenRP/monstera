/** Sets the document title as "<page> · Monstera"; falls back to the app title while `title` is empty. */
export function usePageTitle(title: MaybeRefOrGetter<string | null | undefined>) {
  const { t } = useI18n()
  useHead({
    title: () => {
      const value = toValue(title)
      return value ? `${value} · Monstera` : t('app.title')
    }
  })
}
