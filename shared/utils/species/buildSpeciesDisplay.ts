import type { SpeciesProfile } from '../../types/species'
import type {
  SpeciesDisplayBlock,
  SpeciesDisplayIconTone,
  SpeciesProfileDisplay,
  SpeciesSectionDisplay,
  SpeciesTemperatureExtras,
  SpeciesTemperatureTimeline
} from '../../types/speciesDisplay'
import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'
import type { SpeciesCareFieldKey } from './profileCompleteness'
import { isUnavailableField, SPECIES_CARE_FIELD_KEYS } from './profileCompleteness'
import {
  SECTION_DISPLAY_DEFAULTS,
  type SpeciesSectionItems,
  type SpeciesSectionItemsMap
} from './sectionItems'

export interface PerenualDetailsForDisplay {
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
}

export interface CareGuideSectionForDisplay {
  type?: string
  description?: string
}

function careSectionText(sections: CareGuideSectionForDisplay[], type: string): string {
  const section = sections.find(s => s.type?.toLowerCase() === type.toLowerCase())
  return section?.description?.trim() ?? ''
}

function joinList(items: string[] | undefined | null): string {
  if (!items?.length) return ''
  return items.join(', ')
}

function parseUsdaZone(value: string | undefined): number | null {
  if (value == null || value === '') return null
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

export function isDisplayUsable(display?: SpeciesProfileDisplay): boolean {
  if (!display) return false
  return Object.values(display).some(section => (section.blocks?.length ?? 0) > 0)
}

export function buildDisplayFromSectionItems(
  key: SpeciesCareFieldKey,
  items: SpeciesSectionItems,
  locale: AppLocale
): SpeciesSectionDisplay {
  const defaults = SECTION_DISPLAY_DEFAULTS[key]
  const blocks: SpeciesDisplayBlock[] = []

  if (key === 'soil') {
    blocks.push({
      kind: 'tags',
      items: items.rows.map(row => ({
        label: row.label,
        tone: (row.iconTone ?? defaults.tone) as SpeciesDisplayIconTone
      }))
    })
  } else if (key === 'pestsAndProblems') {
    blocks.push({
      kind: 'list',
      items: items.rows.map(row => ({
        label: row.label,
        icon: row.icon ?? defaults.icon,
        iconTone: (row.iconTone ?? defaults.tone) as SpeciesDisplayIconTone
      }))
    })
  } else {
    items.rows.forEach((row, index) => {
      const sublabelKey = index === 0
        ? defaults.rowSublabelKey
        : (defaults.secondarySublabelKey ?? defaults.rowSublabelKey)
      blocks.push({
        kind: 'row',
        icon: row.icon ?? defaults.icon,
        iconTone: row.iconTone ?? defaults.tone,
        label: row.label,
        sublabel: row.sublabel ?? translate(locale, sublabelKey)
      })
    })
  }

  if (items.info?.trim()) {
    blocks.push({ kind: 'info', text: items.info.trim() })
  }

  return { blocks }
}

function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap(line => line.split(/(?<=[.!?])\s+/))
    .map(s => s.trim())
    .filter(Boolean)
}

export function buildDisplayFromStructuredText(
  key: SpeciesCareFieldKey,
  text: string,
  locale: AppLocale
): SpeciesSectionDisplay | null {
  if (isUnavailableField(text, locale)) return null
  const trimmed = text.trim()
  if (!trimmed) return null

  const defaults = SECTION_DISPLAY_DEFAULTS[key]
  const sentences = splitSentences(trimmed)

  if (key === 'pestsAndProblems') {
    const items = sentences.flatMap(s => s.split(/[,;]/).map(p => p.trim()).filter(Boolean))
    if (items.length >= 2) {
      return {
        blocks: [
          {
            kind: 'list',
            items: items.map(label => ({
              label,
              icon: defaults.icon,
              iconTone: defaults.tone
            }))
          }
        ]
      }
    }
  }

  if (key === 'soil') {
    const tags = trimmed.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    if (tags.length >= 2) {
      return {
        blocks: [{ kind: 'tags', items: tags.map(label => ({ label, tone: defaults.tone })) }]
      }
    }
  }

  if (sentences.length >= 2) {
    const maxRows = key === 'humidity' || key === 'watering' || key === 'fertilizing' ? 3 : 2
    const rowSentences = sentences.slice(0, maxRows)
    const rest = sentences.slice(maxRows).join(' ')
    const blocks: SpeciesDisplayBlock[] = rowSentences.map((sentence, index) => {
      const sublabelKey = index === 0
        ? defaults.rowSublabelKey
        : (defaults.secondarySublabelKey ?? defaults.rowSublabelKey)
      return {
        kind: 'row',
        icon: defaults.icon,
        iconTone: defaults.tone,
        label: sentence,
        sublabel: translate(locale, sublabelKey)
      }
    })
    if (rest) blocks.push({ kind: 'info', text: rest })
    return { blocks }
  }

  return {
    blocks: [{
      kind: 'row',
      icon: defaults.icon,
      iconTone: defaults.tone,
      label: trimmed,
      sublabel: translate(locale, defaults.rowSublabelKey)
    }]
  }
}

export function buildDisplayFromText(
  text: string,
  locale: AppLocale,
  key?: SpeciesCareFieldKey
): SpeciesSectionDisplay | null {
  if (key) {
    const structured = buildDisplayFromStructuredText(key, text, locale)
    if (structured) return structured
  }
  if (isUnavailableField(text, locale)) return null
  const trimmed = text.trim()
  if (!trimmed) return null
  const parts = trimmed.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  if (parts.length <= 1) {
    return { blocks: [{ kind: 'paragraph', text: trimmed }] }
  }
  return {
    blocks: parts.map(p => ({ kind: 'paragraph', text: p }))
  }
}

function buildSectionDisplayForKey(
  key: SpeciesCareFieldKey,
  profile: SpeciesProfile,
  locale: AppLocale,
  sectionItems?: SpeciesSectionItemsMap
): SpeciesSectionDisplay | null {
  const items = sectionItems?.[key]
  if (items?.rows?.length) {
    return buildDisplayFromSectionItems(key, items, locale)
  }
  if (key === 'temperature' && profile.temperatureExtras) {
    const temp = buildTemperatureDisplay({}, profile.temperatureExtras, locale)
    const text = buildDisplayFromStructuredText(key, profile.temperature, locale)
      ?? buildDisplayFromText(profile.temperature, locale, key)
    const blocks = [...(temp?.blocks ?? []), ...(text?.blocks ?? [])]
    return blocks.length ? { blocks } : null
  }
  return buildDisplayFromStructuredText(key, profile[key], locale)
    ?? buildDisplayFromText(profile[key], locale, key)
}

export function buildProfileDisplayFromContent(
  profile: SpeciesProfile,
  locale: AppLocale,
  sectionItems?: SpeciesSectionItemsMap
): SpeciesProfileDisplay {
  const display: SpeciesProfileDisplay = {}
  for (const key of SPECIES_CARE_FIELD_KEYS) {
    const section = buildSectionDisplayForKey(key, profile, locale, sectionItems)
    if (section?.blocks.length) display[key] = section
  }
  return display
}

function timelineTitle(locale: AppLocale, kind: SpeciesTemperatureTimeline['kind']): string {
  const key = {
    indoor: 'species.timelineIndoor',
    outdoorPot: 'species.timelineOutdoorPot',
    outdoorGround: 'species.timelineOutdoorGround'
  }[kind] as 'species.timelineIndoor' | 'species.timelineOutdoorPot' | 'species.timelineOutdoorGround'
  return translate(locale, key)
}

export function temperatureExtrasToBlocks(
  extras: SpeciesTemperatureExtras,
  locale: AppLocale
): SpeciesDisplayBlock[] {
  const blocks: SpeciesDisplayBlock[] = []
  if (extras.idealCelsiusMin != null && extras.idealCelsiusMax != null) {
    blocks.push({
      kind: 'range',
      label: translate(locale, 'species.idealTemperature'),
      min: extras.idealCelsiusMin,
      max: extras.idealCelsiusMax,
      unit: '°C',
      scaleMin: 0,
      scaleMax: 35
    })
  }
  for (const tl of extras.timelines) {
    blocks.push({
      kind: 'monthTimeline',
      title: timelineTitle(locale, tl.kind),
      description: tl.description,
      startMonth: tl.startMonth,
      endMonth: tl.endMonth,
      label: tl.label
    })
  }
  if (extras.locationLabel) {
    blocks.push({
      kind: 'info',
      text: translate(locale, 'species.timelineLocationNote', { place: extras.locationLabel })
    })
  }
  return blocks
}

function buildWateringDisplay(
  details: PerenualDetailsForDisplay,
  careSections: CareGuideSectionForDisplay[],
  locale: AppLocale
): SpeciesSectionDisplay | null {
  const blocks: SpeciesDisplayBlock[] = []
  if (details.watering) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-calendar',
      iconTone: 'blue',
      label: translate(locale, 'species.frequency', { value: details.watering }),
      sublabel: translate(locale, 'species.wateringFrequency')
    })
  }
  const bench = details.watering_general_benchmark
  if (bench?.value && bench?.unit) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-droplets',
      iconTone: 'blue',
      label: translate(locale, 'species.benchmark', { value: bench.value, unit: bench.unit }),
      sublabel: translate(locale, 'species.wateringBenchmark')
    })
  }
  const guide = careSectionText(careSections, 'watering')
  if (guide) blocks.push({ kind: 'info', text: guide })
  return blocks.length ? { blocks } : null
}

function buildLightDisplay(
  details: PerenualDetailsForDisplay,
  careSections: CareGuideSectionForDisplay[],
  locale: AppLocale
): SpeciesSectionDisplay | null {
  const blocks: SpeciesDisplayBlock[] = []
  const sunlight = joinList(details.sunlight)
  if (sunlight) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-sun',
      iconTone: 'amber',
      label: sunlight,
      sublabel: translate(locale, 'species.lightPreferred')
    })
  }
  const guide = careSectionText(careSections, 'sunlight')
  if (guide) blocks.push({ kind: 'info', text: guide })
  return blocks.length ? { blocks } : null
}

function buildHumidityDisplay(
  careSections: CareGuideSectionForDisplay[],
  locale: AppLocale
): SpeciesSectionDisplay | null {
  const guide = careSectionText(careSections, 'humidity')
    || careSectionText(careSections, 'temperature')
  if (!guide) return null
  return {
    blocks: [
      {
        kind: 'row',
        icon: 'i-lucide-cloud-rain',
        iconTone: 'blue',
        label: guide.split(/[.!]/)[0]?.trim() || guide,
        sublabel: translate(locale, 'species.humidityNeeds')
      },
      { kind: 'info', text: guide }
    ]
  }
}

function buildFertilizingDisplay(
  details: PerenualDetailsForDisplay,
  careSections: CareGuideSectionForDisplay[],
  locale: AppLocale
): SpeciesSectionDisplay | null {
  const blocks: SpeciesDisplayBlock[] = []
  const guide = careSectionText(careSections, 'fertilizing')
    || careSectionText(careSections, 'fertilizer')
  if (guide) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-flask-conical',
      iconTone: 'brown',
      label: guide.split(/[.!]/)[0]?.trim() || guide,
      sublabel: translate(locale, 'species.fertilizingSchedule')
    })
    blocks.push({ kind: 'info', text: guide })
  } else if (details.maintenance) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-flask-conical',
      iconTone: 'brown',
      label: details.maintenance,
      sublabel: translate(locale, 'species.fertilizingSchedule')
    })
  }
  return blocks.length ? { blocks } : null
}

function buildSoilDisplay(
  details: PerenualDetailsForDisplay
): SpeciesSectionDisplay | null {
  if (!details.soil?.length) return null
  return {
    blocks: [{
      kind: 'tags',
      items: details.soil.map(label => ({ label, tone: 'brown' as const }))
    }]
  }
}

function buildRepottingDisplay(
  details: PerenualDetailsForDisplay,
  locale: AppLocale
): SpeciesSectionDisplay | null {
  const blocks: SpeciesDisplayBlock[] = []
  if (details.growth_rate) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-trending-up',
      iconTone: 'primary',
      label: details.growth_rate,
      sublabel: translate(locale, 'species.growthLabel')
    })
  }
  if (details.maintenance) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-shovel',
      iconTone: 'brown',
      label: details.maintenance,
      sublabel: translate(locale, 'species.repottingFrequency')
    })
  }
  const pruning = joinList(details.pruning_month)
  if (pruning) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-scissors',
      iconTone: 'neutral',
      label: pruning,
      sublabel: translate(locale, 'species.pruningLabel')
    })
  }
  return blocks.length ? { blocks } : null
}

function buildToxicityDisplay(
  details: PerenualDetailsForDisplay,
  locale: AppLocale
): SpeciesSectionDisplay | null {
  const blocks: SpeciesDisplayBlock[] = []
  if (details.poisonous_to_humans != null) {
    const toxic = details.poisonous_to_humans
    blocks.push({
      kind: 'row',
      icon: toxic ? 'i-lucide-skull' : 'i-lucide-check',
      iconTone: toxic ? 'red' : 'primary',
      label: toxic ? translate(locale, 'species.toxic') : translate(locale, 'species.nonToxic'),
      sublabel: translate(locale, 'species.humansShort')
    })
  }
  if (details.poisonous_to_pets != null) {
    const toxic = details.poisonous_to_pets
    blocks.push({
      kind: 'row',
      icon: toxic ? 'i-lucide-skull' : 'i-lucide-check',
      iconTone: toxic ? 'red' : 'primary',
      label: toxic ? translate(locale, 'species.toxic') : translate(locale, 'species.nonToxic'),
      sublabel: translate(locale, 'species.petsShort')
    })
  }
  return blocks.length ? { blocks } : null
}

function buildCharacteristicsDisplay(
  details: PerenualDetailsForDisplay,
  locale: AppLocale
): SpeciesSectionDisplay | null {
  const blocks: SpeciesDisplayBlock[] = []
  if (details.description) {
    blocks.push({ kind: 'paragraph', text: details.description })
  }
  if (details.type) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-leaf',
      iconTone: 'primary',
      label: details.type,
      sublabel: translate(locale, 'species.typeLabel')
    })
  }
  if (details.cycle) {
    blocks.push({
      kind: 'row',
      icon: 'i-lucide-refresh-cw',
      iconTone: 'primary',
      label: details.cycle,
      sublabel: translate(locale, 'species.cycleLabel')
    })
  }
  return blocks.length ? { blocks } : null
}

function buildTemperatureDisplay(
  details: PerenualDetailsForDisplay,
  extras: SpeciesTemperatureExtras | undefined,
  locale: AppLocale
): SpeciesSectionDisplay | null {
  const blocks: SpeciesDisplayBlock[] = []
  const minZone = parseUsdaZone(details.hardiness?.min)
  const maxZone = parseUsdaZone(details.hardiness?.max)
  if (minZone != null || maxZone != null) {
    blocks.push({
      kind: 'range',
      label: translate(locale, 'species.hardinessShort'),
      min: minZone ?? 1,
      max: maxZone ?? 13,
      unit: 'USDA',
      scaleMin: 1,
      scaleMax: 13
    })
  }
  if (extras) {
    blocks.push(...temperatureExtrasToBlocks(extras, locale))
  }
  return blocks.length ? { blocks } : null
}

function buildPestsDisplay(
  details: PerenualDetailsForDisplay
): SpeciesSectionDisplay | null {
  if (!details.pest_susceptibility?.length) return null
  return {
    blocks: [{
      kind: 'list',
      title: undefined,
      items: details.pest_susceptibility.map(label => ({
        label,
        icon: 'i-lucide-bug',
        iconTone: 'red' as const
      }))
    }]
  }
}

export function buildPerenualSpeciesDisplay(
  details: PerenualDetailsForDisplay,
  careSections: CareGuideSectionForDisplay[],
  profile: SpeciesProfile,
  locale: AppLocale
): SpeciesProfileDisplay {
  const display: SpeciesProfileDisplay = {}
  const assign = (
    key: SpeciesCareFieldKey,
    built: SpeciesSectionDisplay | null,
    fallbackText: string
  ) => {
    const section = built
      ?? buildDisplayFromStructuredText(key, fallbackText, locale)
      ?? buildDisplayFromText(fallbackText, locale, key)
    if (section?.blocks.length) {
      display[key] = section
    }
  }

  assign('watering', buildWateringDisplay(details, careSections, locale), profile.watering)
  assign('light', buildLightDisplay(details, careSections, locale), profile.light)
  assign('humidity', buildHumidityDisplay(careSections, locale), profile.humidity)
  assign('fertilizing', buildFertilizingDisplay(details, careSections, locale), profile.fertilizing)
  assign('soil', buildSoilDisplay(details), profile.soil)
  assign('repotting', buildRepottingDisplay(details, locale), profile.repotting)
  assign('toxicity', buildToxicityDisplay(details, locale), profile.toxicity)
  assign('characteristics', buildCharacteristicsDisplay(details, locale), profile.characteristics)
  assign(
    'temperature',
    buildTemperatureDisplay(details, profile.temperatureExtras, locale),
    profile.temperature
  )
  assign('pestsAndProblems', buildPestsDisplay(details), profile.pestsAndProblems)

  return display
}

function mergeTemperatureExtrasIntoDisplay(
  display: SpeciesProfileDisplay,
  profile: SpeciesProfile,
  locale: AppLocale
): void {
  if (!profile.temperatureExtras) return
  const tempBlocks = buildTemperatureDisplay({}, profile.temperatureExtras, locale)
  if (!tempBlocks) return
  const existing = display.temperature?.blocks ?? []
  const hasTimeline = existing.some(b => b.kind === 'monthTimeline')
  if (!hasTimeline) {
    display.temperature = {
      blocks: [
        ...existing.filter(b => b.kind !== 'monthTimeline' && b.kind !== 'range'),
        ...tempBlocks.blocks
      ]
    }
  }
}

export function buildSpeciesProfileDisplay(
  profile: SpeciesProfile,
  locale: AppLocale,
  sectionItems?: SpeciesSectionItemsMap
): SpeciesProfileDisplay {
  const hasOnlyParagraphs = profile.display
    && Object.values(profile.display).every(
      s => !s.blocks.length || s.blocks.every(b => b.kind === 'paragraph')
    )

  if (isDisplayUsable(profile.display) && !sectionItems && !hasOnlyParagraphs) {
    const merged = { ...profile.display! }
    mergeTemperatureExtrasIntoDisplay(merged, profile, locale)
    return merged
  }

  const display = buildProfileDisplayFromContent(profile, locale, sectionItems)
  mergeTemperatureExtrasIntoDisplay(display, profile, locale)
  return display
}

export function resolveSectionDisplay(
  profile: SpeciesProfile,
  key: SpeciesCareFieldKey,
  locale: AppLocale
): SpeciesSectionDisplay {
  const display = buildSpeciesProfileDisplay(profile, locale)
  const section = display[key]
  if (section?.blocks.length) return section
  return buildSectionDisplayForKey(key, profile, locale) ?? { blocks: [] }
}
