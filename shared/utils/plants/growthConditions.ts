import { WINDOW_DISTANCE_FAR_CM } from '../../constants/care'
import type { Luminosity, Placement, Site } from '../../types/database'
import type { SpeciesProfile } from '../../types/species'
import { hasReliableSpeciesNeeds, parseSpeciesNeeds, type LightNeed } from './speciesNeeds'
import { usesWindowDistance } from '../sites/placement'

export type GrowthWarningCode
  = | 'light_too_low'
    | 'light_too_high'
    | 'window_too_far'
    | 'humidity_too_low'
    | 'humidity_too_high'
    | 'placement_outdoor_risk'
    | 'placement_exposure'
    | 'generic_low_light_far'
    | 'generic_direct_sun'

export type GrowthWarningLevel = 'ok' | 'warn'

export interface GrowthConditionsResult {
  level: GrowthWarningLevel
  reasons: GrowthWarningCode[]
}

export interface GrowthConditionsInput {
  siteId: string | null
  site: Site | null | undefined
  windowDistanceCm: number | null
  homeHumidityPercent: number | null
  speciesProfile: SpeciesProfile | null
}

const LOW_LUMINOSITY: Luminosity[] = ['low', 'medium']
const HIGH_LUMINOSITY: Luminosity[] = ['high', 'direct_sun']
const BRIGHT_LIGHT_NEEDS: LightNeed[] = ['bright', 'direct']

function isIndoorPlacement(placement: Placement | null | undefined): boolean {
  return placement === 'indoor' || placement == null
}

function pushUnique(reasons: GrowthWarningCode[], code: GrowthWarningCode) {
  if (!reasons.includes(code)) reasons.push(code)
}

function evaluateSpeciesRules(
  reasons: GrowthWarningCode[],
  site: Site,
  windowDistanceCm: number | null,
  homeHumidityPercent: number | null,
  profile: SpeciesProfile
) {
  const needs = parseSpeciesNeeds(profile)
  if (!needs || !hasReliableSpeciesNeeds(needs)) return false

  const { luminosity, placement, has_ceiling_cover: hasCeiling } = site

  if (needs.lightNeed && luminosity) {
    if (
      BRIGHT_LIGHT_NEEDS.includes(needs.lightNeed)
      && LOW_LUMINOSITY.includes(luminosity)
    ) {
      pushUnique(reasons, 'light_too_low')
    }
    if (
      (needs.lightNeed === 'shade' || needs.lightNeed === 'medium')
      && HIGH_LUMINOSITY.includes(luminosity)
    ) {
      pushUnique(reasons, 'light_too_high')
    }
  }

  if (
    needs.lightNeed
    && BRIGHT_LIGHT_NEEDS.includes(needs.lightNeed)
    && usesWindowDistance(placement)
    && windowDistanceCm != null
    && windowDistanceCm >= WINDOW_DISTANCE_FAR_CM
  ) {
    pushUnique(reasons, 'window_too_far')
  }

  if (needs.humidityNeed && homeHumidityPercent != null) {
    if (needs.humidityNeed === 'high' && homeHumidityPercent < 45) {
      pushUnique(reasons, 'humidity_too_low')
    }
    if (needs.humidityNeed === 'low' && homeHumidityPercent > 65) {
      pushUnique(reasons, 'humidity_too_high')
    }
  }

  if (needs.prefersIndoor && placement === 'outdoor') {
    pushUnique(reasons, 'placement_outdoor_risk')
  }

  if (
    needs.lightNeed === 'shade'
    && placement === 'outdoor'
    && !hasCeiling
  ) {
    pushUnique(reasons, 'placement_exposure')
  }

  return true
}

function evaluateGenericRules(
  reasons: GrowthWarningCode[],
  site: Site,
  windowDistanceCm: number | null
) {
  const { luminosity, placement } = site
  if (!luminosity) return

  if (
    isIndoorPlacement(placement)
    && luminosity === 'low'
    && usesWindowDistance(placement)
    && windowDistanceCm != null
    && windowDistanceCm >= WINDOW_DISTANCE_FAR_CM
  ) {
    pushUnique(reasons, 'generic_low_light_far')
  }

  if (isIndoorPlacement(placement) && luminosity === 'direct_sun') {
    pushUnique(reasons, 'generic_direct_sun')
  }
}

/**
 * Compare site/plant environment with species needs (heuristic text parse).
 * Skips when location data is incomplete — completeness banners cover that.
 * Home humidity is a climate estimate, not measured per room.
 */
export function evaluateGrowthConditions(input: GrowthConditionsInput): GrowthConditionsResult {
  const reasons: GrowthWarningCode[] = []

  if (!input.siteId || !input.site?.luminosity) {
    return { level: 'ok', reasons: [] }
  }

  const site = input.site
  const usedSpecies = input.speciesProfile
    && evaluateSpeciesRules(
      reasons,
      site,
      input.windowDistanceCm,
      input.homeHumidityPercent,
      input.speciesProfile
    )

  if (!usedSpecies) {
    evaluateGenericRules(reasons, site, input.windowDistanceCm)
  }

  return {
    level: reasons.length > 0 ? 'warn' : 'ok',
    reasons
  }
}

/** Prefer site edit for site-driven warnings; plant edit for window distance. */
export function growthConditionsEditTarget(
  codes: GrowthWarningCode[],
  siteId: string | null,
  plantEditBase: string
): string {
  const plantCodes: GrowthWarningCode[] = ['window_too_far', 'generic_low_light_far']
  const first = codes[0]
  if (first && plantCodes.includes(first)) {
    return `${plantEditBase}#section-light`
  }
  if (siteId) return `/sites/${siteId}/edit`
  return `${plantEditBase}#section-light`
}
