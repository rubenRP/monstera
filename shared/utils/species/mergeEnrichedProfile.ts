import type { SpeciesProfile } from '../../types/species'
import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'
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

  return merged
}
