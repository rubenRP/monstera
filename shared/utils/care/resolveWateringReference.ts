import { DEFAULT_WATERING_REFERENCE_DAYS } from '../../constants/care'
import type { SpeciesProfile } from '../../types/species'
import { suggestWateringDaysFromProfile } from './speciesWateringHint'

export type WateringReferenceSource = 'species' | 'ai' | 'default' | 'override'

export interface WateringReferenceResult {
  referenceDays: number
  source: WateringReferenceSource
}

export function referenceDaysFromProfile(
  profile: SpeciesProfile | null | undefined
): number | null {
  return suggestWateringDaysFromProfile(profile)
}

export function defaultWateringReferenceDays(): number {
  return DEFAULT_WATERING_REFERENCE_DAYS
}

export function resolveWateringReferenceFromProfile(
  profile: SpeciesProfile | null | undefined
): WateringReferenceResult {
  const fromProfile = referenceDaysFromProfile(profile)
  if (fromProfile != null) {
    return { referenceDays: fromProfile, source: 'species' }
  }
  return { referenceDays: defaultWateringReferenceDays(), source: 'default' }
}

export function resolveWateringReferenceWithOverride(
  profile: SpeciesProfile | null | undefined,
  overrideDays: number | null | undefined
): WateringReferenceResult {
  if (overrideDays != null && overrideDays >= 1) {
    return { referenceDays: overrideDays, source: 'override' }
  }
  return resolveWateringReferenceFromProfile(profile)
}
