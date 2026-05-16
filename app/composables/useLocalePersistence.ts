import type { AppLocale } from '#shared/types/database'

function isValidUserId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id !== 'undefined'
}

export function useLocalePersistence() {
  if (!import.meta.client) return

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { locale, setLocale } = useI18n()
  const syncing = ref(false)
  const applyingRemoteLocale = ref(false)

  function getUserId(): string | undefined {
    const id = user.value?.id
    return isValidUserId(id) ? id : undefined
  }

  async function loadUserLocale() {
    const userId = getUserId()
    if (!userId) return

    const { data } = await supabase
      .from('user_settings')
      .select('locale')
      .eq('user_id', userId)
      .maybeSingle()

    if (data?.locale === 'en' || data?.locale === 'es') {
      applyingRemoteLocale.value = true
      try {
        await setLocale(data.locale)
      } finally {
        applyingRemoteLocale.value = false
      }
    }
  }

  async function saveUserLocale(value: AppLocale) {
    const userId = getUserId()
    if (!userId || syncing.value) return

    syncing.value = true
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        locale: value,
        updated_at: new Date().toISOString()
      })
    } finally {
      syncing.value = false
    }
  }

  watch(
    () => user.value?.id,
    (id) => {
      if (isValidUserId(id)) void loadUserLocale()
    },
    { immediate: true }
  )

  watch(locale, (value) => {
    if (applyingRemoteLocale.value) return
    void saveUserLocale(value as AppLocale)
  })
}
