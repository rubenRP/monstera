import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import { throwApiError } from './apiError'
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

export class PerenualApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message)
    this.name = 'PerenualApiError'
  }
}

/** Details/care guides blocked by Perenual plan — caller should use Cursor generate */
export class PerenualPlanLimitError extends Error {
  constructor(readonly match: PerenualSpeciesListItem) {
    super(`Perenual plan limit for species id ${match.id}`)
    this.name = 'PerenualPlanLimitError'
  }
}

function perenualUrl(path: string, apiKey: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${BASE}${path}${separator}key=${encodeURIComponent(apiKey)}`
}

function isPerenualUpgradeRequired(status: number, body: string): boolean {
  return status === 429 || /upgrade plan/i.test(body)
}

async function perenualFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(perenualUrl(path, apiKey))
  const body = await res.text()
  if (!res.ok) {
    throw new PerenualApiError(
      `Perenual API error: ${res.status} ${res.statusText}`,
      res.status,
      body
    )
  }
  try {
    return JSON.parse(body) as T
  } catch {
    throw new PerenualApiError('Perenual API returned invalid JSON', res.status, body)
  }
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

  throwApiError(404, API_ERROR_CODES.PERENUAL_SPECIES_NOT_FOUND, { query: speciesQuery })
}

export async function fetchSpeciesProfileFromPerenual(
  speciesQuery: string,
  apiKey: string,
  locale: AppLocale = 'es'
): Promise<SpeciesProfile> {
  const match = await resolveSpeciesMatch(speciesQuery, apiKey)

  try {
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
    } catch (e) {
      if (!(e instanceof PerenualApiError && isPerenualUpgradeRequired(e.status, e.body))) {
        console.warn('Perenual care guides fetch failed:', e)
      }
    }

    return mapPerenualProfile(
      { ...details, id: match.id } as Parameters<typeof mapPerenualProfile>[0],
      careGuides ?? [],
      locale
    )
  } catch (e) {
    if (e instanceof PerenualApiError && isPerenualUpgradeRequired(e.status, e.body)) {
      console.warn(
        `Perenual details unavailable for id ${match.id} (plan limit); deferring to Cursor`
      )
      throw new PerenualPlanLimitError(match)
    }
    throw e
  }
}
