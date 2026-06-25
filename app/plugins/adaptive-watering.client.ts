export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { syncAllIfSeasonChanged, syncFertilizeAlignmentOnce } = useAdaptiveWatering()
  const { fetchRecentEvents } = useWateringRecalcEvents()

  watch(
    user,
    (u) => {
      if (u) {
        void syncFertilizeAlignmentOnce()
          .then(() => fetchRecentEvents())
          .catch(() => {})
        void syncAllIfSeasonChanged()
          .then(() => fetchRecentEvents())
          .catch(() => {})
      }
    },
    { immediate: true }
  )
})
