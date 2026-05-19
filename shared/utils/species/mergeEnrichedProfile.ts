import type { SpeciesProfile } from '../../types/species'
import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'
import { buildSpeciesProfileDisplay } from './buildSpeciesDisplay'
import type { SpeciesSectionItemsMap } from './sectionItems'
import { isUnavailableField, SPECIES_CARE_FIELD_KEYS } from './profileCompleteness'
import type { SpeciesEnrichResponse } from './schemas'

export function mergeEnrichedSpeciesProfile(
  base: SpeciesProfile,
  enrichment: SpeciesEnrichResponse,
  locale: AppLocale
): SpeciesProfile {
  const merged: SpeciesProfile = {
    ...base,
    enrichedByAi: true,
    fetchedAt: new Date().toISOString()
  }

  for (const key of SPECIES_CARE_FIELD_KEYS) {
    const value = enrichment[key]?.trim()
    if (value && isUnavailableField(base[key], locale)) {
      merged[key] = value
    }
  }

  const commonName = enrichment.commonName?.trim()
  const unknownName = translate(locale, 'species.unknown')
  if (commonName && (!base.commonName.trim() || base.commonName === unknownName)) {
    merged.commonName = commonName
  }

  if (enrichment.scientificName?.length && !base.scientificName.length) {
    merged.scientificName = enrichment.scientificName
  }

  if (enrichment.temperatureExtras?.timelines?.length) {
    merged.temperatureExtras = enrichment.temperatureExtras
  }

  merged.display = buildSpeciesProfileDisplay(
    { ...merged, display: undefined },
    locale,
    enrichment.sectionItems as SpeciesSectionItemsMap | undefined
  )
  return merged
}

export function mergeGeneratedSpeciesProfile(
  base: SpeciesProfile,
  generated: SpeciesEnrichResponse,
  locale: AppLocale = 'es'
): SpeciesProfile {
  const merged: SpeciesProfile = {
    ...base,
    enrichedByAi: true,
    fetchedAt: new Date().toISOString()
  }

  for (const key of SPECIES_CARE_FIELD_KEYS) {
    const value = generated[key]?.trim()
    if (value) merged[key] = value
  }

  if (generated.commonName?.trim()) merged.commonName = generated.commonName.trim()
  if (generated.scientificName?.length) merged.scientificName = generated.scientificName
  if (generated.temperatureExtras?.timelines?.length) {
    merged.temperatureExtras = generated.temperatureExtras
  }

  merged.display = buildSpeciesProfileDisplay(
    { ...merged, display: undefined },
    locale,
    generated.sectionItems as SpeciesSectionItemsMap | undefined
  )
  return merged
}
