import type { SpeciesSuggestion } from '#shared/types/species'

const DEBOUNCE_MS = 350
const MIN_QUERY = 3

/** Debounced Perenual suggestions for the species field; silent when the service is unavailable. */
export function useSpeciesSearch(query: Ref<string | null | undefined>) {
  const supabase = useSupabaseClient()
  const suggestions = ref<SpeciesSuggestion[]>([])
  const searching = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let requestId = 0
  /** Value set programmatically (a picked suggestion) that should not trigger a new search */
  let suppressed: string | null = null

  async function run(q: string) {
    const id = ++requestId
    searching.value = true
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const res = await $fetch<{ items: SpeciesSuggestion[] }>('/api/species/search', {
        query: { q },
        headers: { Authorization: `Bearer ${token}` }
      })
      if (id === requestId) suggestions.value = res.items
    } catch {
      if (id === requestId) suggestions.value = []
    } finally {
      if (id === requestId) searching.value = false
    }
  }

  watch(query, (value) => {
    if (timer) clearTimeout(timer)
    const q = value?.trim() ?? ''
    if (suppressed != null && q === suppressed) {
      suppressed = null
      return
    }
    if (q.length < MIN_QUERY) {
      requestId++
      suggestions.value = []
      searching.value = false
      return
    }
    timer = setTimeout(() => void run(q), DEBOUNCE_MS)
  })

  /** Clears suggestions; pass the value about to be set so it is not searched again. */
  function clear(nextValue?: string | null) {
    requestId++
    suggestions.value = []
    searching.value = false
    suppressed = nextValue?.trim() ?? null
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { suggestions, searching, clear }
}
