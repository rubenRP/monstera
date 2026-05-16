export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { syncAllIfSeasonChanged, syncFertilizeAlignmentOnce } = useAdaptiveWatering()

  watch(
    user,
    (u) => {
      if (u) {
        void syncFertilizeAlignmentOnce().catch(() => {})
        void syncAllIfSeasonChanged().catch(() => {})
      }
    },
    { immediate: true }
  )
})
