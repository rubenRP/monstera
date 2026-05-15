export function usePlantPhoto(photoPath: Ref<string | null | undefined> | string | null | undefined) {
  const { getSignedPhotoUrl } = usePlants()
  const url = ref<string | null>(null)

  async function load() {
    const path = unref(photoPath)
    if (!path) {
      url.value = null
      return
    }
    try {
      url.value = await getSignedPhotoUrl(path)
    } catch {
      url.value = null
    }
  }

  watch(() => unref(photoPath), load, { immediate: true })

  return { url, reload: load }
}
