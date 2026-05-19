import type { SpeciesProfile } from '../../types/species'
import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'
import { buildPerenualSpeciesDisplay } from './buildSpeciesDisplay'
import type { PerenualSpeciesListItem } from './searchPerenual'

export function isPerenualPlaceholderImage(url?: string | null): boolean {
  return !url || url.includes('upgrade_access')
}

interface PerenualImage {
  regular_url?: string
  medium_url?: string
  license_name?: string
}

interface PerenualDetails {
  id: number
  common_name?: string
  scientific_name?: string[]
  watering?: string
  watering_general_benchmark?: { value?: string, unit?: string }
  sunlight?: string[]
  soil?: string[]
  poisonous_to_humans?: boolean
  poisonous_to_pets?: boolean
  description?: string
  type?: string
  cycle?: string
  growth_rate?: string
  maintenance?: string
  pruning_month?: string[]
  hardiness?: { min?: string, max?: string }
  pest_susceptibility?: string[]
  default_image?: PerenualImage
}

interface CareGuideSection {
  type?: string
  description?: string
}

interface CareGuideEntry {
  section?: CareGuideSection[]
}

function unavailable(locale: AppLocale): string {
  return translate(locale, 'species.unavailable')
}

function joinList(items: string[] | undefined | null): string {
  if (!items?.length) return ''
  return items.join(', ')
}

function careSectionText(sections: CareGuideSection[] | undefined, type: string): string {
  const section = sections?.find(s => s.type?.toLowerCase() === type.toLowerCase())
  return section?.description?.trim() ?? ''
}

function formatWatering(
  locale: AppLocale,
  details: PerenualDetails,
  careSections: CareGuideSection[]
): string {
  const parts: string[] = []
  if (details.watering) {
    parts.push(translate(locale, 'species.frequency', { value: details.watering }))
  }
  const bench = details.watering_general_benchmark
  if (bench?.value && bench?.unit) {
    parts.push(translate(locale, 'species.benchmark', { value: bench.value, unit: bench.unit }))
  }
  const guide = careSectionText(careSections, 'watering')
  if (guide) parts.push(guide)
  return parts.join('\n\n') || unavailable(locale)
}

function formatLight(
  locale: AppLocale,
  details: PerenualDetails,
  careSections: CareGuideSection[]
): string {
  const parts: string[] = []
  const sunlight = joinList(details.sunlight)
  if (sunlight) parts.push(translate(locale, 'species.lightRequirements', { value: sunlight }))
  const guide = careSectionText(careSections, 'sunlight')
  if (guide) parts.push(guide)
  return parts.join('\n\n') || unavailable(locale)
}

function formatToxicity(locale: AppLocale, details: PerenualDetails): string {
  const human = details.poisonous_to_humans
  const pets = details.poisonous_to_pets
  if (human == null && pets == null) return unavailable(locale)
  const lines: string[] = []
  if (human != null) {
    lines.push(translate(locale, 'species.humans', {
      value: human ? translate(locale, 'species.toxic') : translate(locale, 'species.nonToxic')
    }))
  }
  if (pets != null) {
    lines.push(translate(locale, 'species.pets', {
      value: pets ? translate(locale, 'species.toxic') : translate(locale, 'species.nonToxic')
    }))
  }
  return lines.join('. ')
}

function formatTemperature(locale: AppLocale, details: PerenualDetails): string {
  const h = details.hardiness
  if (h?.min != null || h?.max != null) {
    return translate(locale, 'species.hardiness', {
      min: h.min ?? '?',
      max: h.max ?? '?'
    })
  }
  return unavailable(locale)
}

function formatRepotting(locale: AppLocale, details: PerenualDetails): string {
  const parts: string[] = []
  if (details.growth_rate) {
    parts.push(translate(locale, 'species.growth', { value: details.growth_rate }))
  }
  if (details.maintenance) {
    parts.push(translate(locale, 'species.maintenance', { value: details.maintenance }))
  }
  const pruning = joinList(details.pruning_month)
  if (pruning) parts.push(translate(locale, 'species.pruning', { value: pruning }))
  return parts.join('. ') || unavailable(locale)
}

function formatCharacteristics(locale: AppLocale, details: PerenualDetails): string {
  const parts: string[] = []
  if (details.description) parts.push(details.description)
  const meta: string[] = []
  if (details.type) meta.push(translate(locale, 'species.type', { value: details.type }))
  if (details.cycle) meta.push(translate(locale, 'species.cycle', { value: details.cycle }))
  if (meta.length) parts.push(meta.join(' · '))
  return parts.join('\n\n') || unavailable(locale)
}

export function mapPerenualProfile(
  details: PerenualDetails,
  careGuides: CareGuideEntry[],
  locale: AppLocale = 'es'
): SpeciesProfile {
  const careSections = careGuides.flatMap(g => g.section ?? [])
  const humidityGuide = careSectionText(careSections, 'humidity')
    || careSectionText(careSections, 'temperature')
  const fertilizingGuide = careSectionText(careSections, 'fertilizing')
    || careSectionText(careSections, 'fertilizer')

  const imageUrl = details.default_image?.regular_url
    ?? details.default_image?.medium_url
    ?? null

  const profile: SpeciesProfile = {
    perenualId: details.id,
    commonName: details.common_name ?? translate(locale, 'species.unknown'),
    scientificName: details.scientific_name ?? [],
    imageUrl: isPerenualPlaceholderImage(imageUrl) ? null : imageUrl,
    imageLicense: isPerenualPlaceholderImage(imageUrl)
      ? null
      : (details.default_image?.license_name ?? null),
    watering: formatWatering(locale, details, careSections),
    light: formatLight(locale, details, careSections),
    humidity: humidityGuide || unavailable(locale),
    fertilizing: fertilizingGuide || (details.maintenance
      ? translate(locale, 'species.maintenance', { value: details.maintenance })
      : unavailable(locale)),
    soil: joinList(details.soil) || unavailable(locale),
    repotting: formatRepotting(locale, details),
    toxicity: formatToxicity(locale, details),
    characteristics: formatCharacteristics(locale, details),
    temperature: formatTemperature(locale, details),
    pestsAndProblems: joinList(details.pest_susceptibility) || unavailable(locale),
    fetchedAt: new Date().toISOString()
  }

  profile.display = buildPerenualSpeciesDisplay(details, careSections, profile, locale)
  return profile
}

/** Minimal profile from species-list when details/care guides require a paid Perenual plan */
export function mapPerenualListItem(
  item: PerenualSpeciesListItem,
  locale: AppLocale = 'es'
): SpeciesProfile {
  return mapPerenualProfile(
    {
      id: item.id,
      common_name: item.common_name,
      scientific_name: item.scientific_name
    },
    [],
    locale
  )
}
