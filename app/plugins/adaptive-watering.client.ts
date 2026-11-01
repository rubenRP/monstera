export default defineNuxtPlugin(() => {
  const user = useAuthUser()
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
