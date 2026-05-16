export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { syncAllIfSeasonChanged } = useAdaptiveWatering()

  watch(
    user,
    (u) => {
      if (u) {
        void syncAllIfSeasonChanged().catch(() => {})
      }
    },
    { immediate: true }
  )
})
