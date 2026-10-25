const SIGNED_URL_TTL_S = 3600
/** Re-sign a bit before expiry so images never 403 mid-session. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000

interface CachedUrl {
  url: string
  expiresAt: number
}

/**
 * Signed URLs for many plant photos in one Storage request, cached across screens
 * (home task list, plant grid, calendar) instead of one request per photo.
 */
export function usePlantPhotoUrls() {
  const supabase = useSupabaseClient()
  const cache = useState<Record<string, CachedUrl>>('plant-photo-url-cache', () => ({}))

  function urlFor(path: string | null | undefined): string | null {
    if (!path) return null
    return cache.value[path]?.url ?? null
  }

  async function ensure(paths: Array<string | null | undefined>) {
    const now = Date.now()
    const missing = [...new Set(paths.filter((p): p is string => !!p))]
      .filter(p => !cache.value[p] || cache.value[p]!.expiresAt - REFRESH_MARGIN_MS < now)
    if (!missing.length) return

    const { data, error } = await supabase.storage
      .from('plant-photos')
      .createSignedUrls(missing, SIGNED_URL_TTL_S)
    // Photos are decorative: fall back to the avatar instead of failing the screen
    if (error || !data) {
      console.warn('[usePlantPhotoUrls] could not sign photo URLs', error)
      return
    }

    const expiresAt = now + SIGNED_URL_TTL_S * 1000
    const next = { ...cache.value }
    for (const item of data) {
      if (item.path && item.signedUrl) {
        next[item.path] = { url: item.signedUrl, expiresAt }
      }
    }
    cache.value = next
  }

  return { urlFor, ensure }
}
