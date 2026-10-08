export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { syncWateringOnLogin } = useWateringSync()
  const { fetchRecentEvents } = useWateringRecalcEvents()

  watch(
    user,
    (current) => {
      if (!current) return
      void syncWateringOnLogin()
        .then(() => fetchRecentEvents())
        .catch(() => {})
    },
    { immediate: true }
  )
})
