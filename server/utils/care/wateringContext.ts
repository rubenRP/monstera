import type { SupabaseClient } from '@supabase/supabase-js'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'
import type { AppLocale } from '#shared/utils/i18n/locale'
import type { Plant } from '#shared/types/database'
import type { SpeciesProfile } from '#shared/types/species'
import { normalizeSpeciesQuery } from '#shared/utils/species/normalize'
import {
  referenceDaysFromProfile,
  resolveWateringReferenceFromProfile,
  type WateringReferenceResult
} from '#shared/utils/care/resolveWateringReference'
import { fetchSpeciesProfileFromPerenual, PerenualPlanLimitError } from '../perenual'
import { mapPerenualListItem } from '#shared/utils/species/mapPerenualProfile'
import {
  generateSpeciesProfileWithCursor,
  type SpeciesEnrichLocation
} from '../speciesCursor'
import { fetchWateringReferenceFromCursor } from './wateringReferenceCursor'

async function loadCachedSpeciesProfile(
  supabase: SupabaseClient,
  speciesQuery: string
): Promise<SpeciesProfile | null> {
  const { data } = await supabase
    .from('species_profiles')
    .select('profile')
    .eq('species_query', speciesQuery)
    .maybeSingle()
  return (data?.profile as SpeciesProfile | undefined) ?? null
}

async function upsertSpeciesProfile(
  supabase: SupabaseClient,
  speciesQuery: string,
  profile: SpeciesProfile
): Promise<void> {
  const { error } = await supabase
    .from('species_profiles')
    .upsert(
      {
        species_query: speciesQuery,
        perenual_id: profile.perenualId,
        profile,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'species_query' }
    )
  if (error) {
    console.error('species_profiles upsert:', error)
  }
}

async function fetchOrGenerateSpeciesProfile(
  supabase: SupabaseClient,
  speciesQuery: string,
  locale: AppLocale,
  perenualApiKey: string | undefined,
  cursorApiKey: string | undefined,
  homeLocation: SpeciesEnrichLocation | null,
  allowCursor: boolean
): Promise<SpeciesProfile | null> {
  const cached = await loadCachedSpeciesProfile(supabase, speciesQuery)
  if (cached && referenceDaysFromProfile(cached) != null) {
    return cached
  }

  let profile: SpeciesProfile | null = cached

  if (perenualApiKey) {
    try {
      profile = await fetchSpeciesProfileFromPerenual(speciesQuery, perenualApiKey, locale)
    } catch (e) {
      if (e instanceof PerenualPlanLimitError && allowCursor && cursorApiKey) {
        try {
          const seed = mapPerenualListItem(e.match, locale)
          profile = await generateSpeciesProfileWithCursor(
            speciesQuery,
            locale,
            cursorApiKey,
            homeLocation,
            seed
          )
        } catch {
          profile = mapPerenualListItem(e.match, locale)
        }
      } else if (e instanceof PerenualPlanLimitError) {
        profile = mapPerenualListItem(e.match, locale)
      } else {
        const notFound = isError(e)
          && e.statusCode === 404
          && (e.data as { code?: string })?.code === API_ERROR_CODES.PERENUAL_SPECIES_NOT_FOUND
        if (notFound && allowCursor && cursorApiKey) {
          try {
            profile = await generateSpeciesProfileWithCursor(
              speciesQuery,
              locale,
              cursorApiKey,
              homeLocation
            )
          } catch {
            profile = cached
          }
        }
      }
    }
  } else if (allowCursor && cursorApiKey && !profile) {
    try {
      profile = await generateSpeciesProfileWithCursor(
        speciesQuery,
        locale,
        cursorApiKey,
        homeLocation
      )
    } catch {
      profile = null
    }
  }

  if (profile) {
    await upsertSpeciesProfile(supabase, speciesQuery, profile)
  }

  return profile
}

export interface ResolveWateringReferenceOptions {
  locale?: AppLocale
  perenualApiKey?: string
  cursorApiKey?: string
  homeLocation?: SpeciesEnrichLocation | null
  allowCursor?: boolean
  overrideDays?: number | null
}

export async function resolveWateringReferenceForPlant(
  supabase: SupabaseClient,
  plant: Plant,
  options: ResolveWateringReferenceOptions = {}
): Promise<WateringReferenceResult> {
  const locale = options.locale ?? 'es'
  const allowCursor = options.allowCursor ?? false

  if (options.overrideDays != null && options.overrideDays >= 1) {
    return { referenceDays: options.overrideDays, source: 'override' }
  }

  const species = plant.species?.trim()
  if (!species) {
    return resolveWateringReferenceFromProfile(null)
  }

  const speciesQuery = normalizeSpeciesQuery(species)
  let profile = await loadCachedSpeciesProfile(supabase, speciesQuery)
  let fromProfile = referenceDaysFromProfile(profile)
  if (fromProfile != null) {
    return { referenceDays: fromProfile, source: 'species' }
  }

  if (options.perenualApiKey || (allowCursor && options.cursorApiKey)) {
    profile = await fetchOrGenerateSpeciesProfile(
      supabase,
      speciesQuery,
      locale,
      options.perenualApiKey,
      options.cursorApiKey,
      options.homeLocation ?? null,
      allowCursor
    )
    fromProfile = referenceDaysFromProfile(profile)
    if (fromProfile != null) {
      return { referenceDays: fromProfile, source: profile?.perenualId ? 'species' : 'ai' }
    }
  }

  if (allowCursor && options.cursorApiKey) {
    const cursorDays = await fetchWateringReferenceFromCursor(plant, options.cursorApiKey)
    if (cursorDays != null) {
      if (profile) {
        const updated: SpeciesProfile = {
          ...profile,
          watering: `Referencia: cada ${cursorDays} días`
        }
        await upsertSpeciesProfile(supabase, speciesQuery, updated)
      }
      return { referenceDays: cursorDays, source: 'ai' }
    }
  }

  if (plant.watering_base_interval_days >= 1) {
    return { referenceDays: plant.watering_base_interval_days, source: 'default' }
  }

  return resolveWateringReferenceFromProfile(null)
}
