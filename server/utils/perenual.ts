import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import type { AppLocale } from '#shared/utils/i18n/locale'
import { mapPerenualProfile } from '#shared/utils/species/mapPerenualProfile'
import {
  buildPerenualSearchQueries,
  pickBestPerenualMatch,
  type PerenualSpeciesListItem
} from '#shared/utils/species/searchPerenual'
import type { SpeciesProfile } from '#shared/types/species'

const BASE = 'https://perenual.com/api'

interface SpeciesListResponse {
  data?: PerenualSpeciesListItem[]
}

interface CareGuideListResponse {
  data?: { section?: { type?: string, description?: string }[] }[]
}

function perenualUrl(path: string, apiKey: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${BASE}${path}${separator}key=${encodeURIComponent(apiKey)}`
}

async function perenualFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(perenualUrl(path, apiKey))
  if (!res.ok) {
    throw new Error(`Perenual API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

async function searchSpeciesList(
  query: string,
  apiKey: string
): Promise<PerenualSpeciesListItem[]> {
  const search = await perenualFetch<SpeciesListResponse>(
    `/v2/species-list?q=${encodeURIComponent(query)}`,
    apiKey
  )
  return search.data ?? []
}

async function resolveSpeciesMatch(
  speciesQuery: string,
  apiKey: string
): Promise<PerenualSpeciesListItem> {
  const queries = buildPerenualSearchQueries(speciesQuery)
  const seenIds = new Set<number>()
  const allCandidates: PerenualSpeciesListItem[] = []

  for (const query of queries) {
    const results = await searchSpeciesList(query, apiKey)
    for (const item of results) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        allCandidates.push(item)
      }
    }
    const best = pickBestPerenualMatch(allCandidates, speciesQuery)
    if (best) return best
  }

  throw createError({
    statusCode: 404,
    data: { code: API_ERROR_CODES.PERENUAL_SPECIES_NOT_FOUND, query: speciesQuery }
  })
}

export async function fetchSpeciesProfileFromPerenual(
  speciesQuery: string,
  apiKey: string,
  locale: AppLocale = 'es'
): Promise<SpeciesProfile> {
  const match = await resolveSpeciesMatch(speciesQuery, apiKey)

  const details = await perenualFetch<Record<string, unknown>>(
    `/v2/species/details/${match.id}`,
    apiKey
  )

  let careGuides: CareGuideListResponse['data'] = []
  try {
    const guides = await perenualFetch<CareGuideListResponse>(
      `/species-care-guide-list?species_id=${match.id}`,
      apiKey
    )
    careGuides = guides.data ?? []
  } catch {
    careGuides = []
  }

  return mapPerenualProfile(
    { ...details, id: match.id } as Parameters<typeof mapPerenualProfile>[0],
    careGuides ?? [],
    locale
  )
}
