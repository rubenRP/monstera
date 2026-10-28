import { z } from 'zod'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import type { SpeciesSuggestion } from '#shared/types/species'
import { searchSpeciesSuggestions } from '../../utils/perenual'

const querySchema = z.object({ q: z.string().trim().min(3).max(60) })

/** Perenual's free plan allows ~100 requests/day: cache suggestions per query for a day. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const cache = new Map<string, { at: number, items: SpeciesSuggestion[] }>()

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throwApiError(401, API_ERROR_CODES.AUTH_UNAUTHORIZED)
  }
  const supabase = getServiceSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7))
  if (authError || !user) {
    throwApiError(401, API_ERROR_CODES.AUTH_INVALID_SESSION)
  }

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throwApiError(400, API_ERROR_CODES.VALIDATION_FAILED)
  }

  const config = useRuntimeConfig()
  // Autocomplete is optional: without a key (or over quota) the form just works as free text
  if (!config.perenualApiKey) return { items: [], available: false }

  const key = parsed.data.q.toLowerCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { items: hit.items, available: true }

  try {
    const items = await searchSpeciesSuggestions(parsed.data.q, config.perenualApiKey)
    cache.set(key, { at: Date.now(), items })
    return { items, available: true }
  } catch (e) {
    console.warn('[species/search] Perenual search failed:', e instanceof Error ? e.message : e)
    return { items: [], available: false }
  }
})
