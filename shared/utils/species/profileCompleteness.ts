import type { SpeciesProfile } from '../../types/species'
import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'

export const SPECIES_CARE_FIELD_KEYS = [
  'watering',
  'light',
  'humidity',
  'fertilizing',
  'soil',
  'repotting',
  'toxicity',
  'characteristics',
  'temperature',
  'pestsAndProblems'
] as const satisfies readonly (keyof SpeciesProfile)[]

export type SpeciesCareFieldKey = typeof SPECIES_CARE_FIELD_KEYS[number]

const MIN_INCOMPLETE_FIELDS = 2

export function isUnavailableField(value: string, locale: AppLocale): boolean {
  const marker = translate(locale, 'species.unavailable')
  return !value.trim() || value.trim() === marker
}

export function getIncompleteSpeciesFields(
  profile: SpeciesProfile,
  locale: AppLocale
): SpeciesCareFieldKey[] {
  return SPECIES_CARE_FIELD_KEYS.filter(key => isUnavailableField(profile[key], locale))
}

export function isSpeciesProfileLimited(profile: SpeciesProfile, locale: AppLocale): boolean {
  return getIncompleteSpeciesFields(profile, locale).length >= MIN_INCOMPLETE_FIELDS
}

export function needsTemperatureExtras(profile: SpeciesProfile): boolean {
  return !profile.temperatureExtras?.timelines?.length
}

export function shouldEnrichSpeciesProfile(profile: SpeciesProfile, locale: AppLocale): boolean {
  return isSpeciesProfileLimited(profile, locale) || needsTemperatureExtras(profile)
}
