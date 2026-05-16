import type { SpeciesProfile } from '../../types/species'

const UNAVAILABLE = 'No disponible en la fuente'

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

function joinList(items: string[] | undefined | null): string {
  if (!items?.length) return ''
  return items.join(', ')
}

function careSectionText(sections: CareGuideSection[] | undefined, type: string): string {
  const section = sections?.find(s => s.type?.toLowerCase() === type.toLowerCase())
  return section?.description?.trim() ?? ''
}

function formatWatering(details: PerenualDetails, careSections: CareGuideSection[]): string {
  const parts: string[] = []
  if (details.watering) parts.push(`Frecuencia: ${details.watering}`)
  const bench = details.watering_general_benchmark
  if (bench?.value && bench?.unit) {
    parts.push(`Referencia: cada ${bench.value} ${bench.unit}`)
  }
  const guide = careSectionText(careSections, 'watering')
  if (guide) parts.push(guide)
  return parts.join('\n\n') || UNAVAILABLE
}

function formatLight(details: PerenualDetails, careSections: CareGuideSection[]): string {
  const parts: string[] = []
  const sunlight = joinList(details.sunlight)
  if (sunlight) parts.push(`Requisitos: ${sunlight}`)
  const guide = careSectionText(careSections, 'sunlight')
  if (guide) parts.push(guide)
  return parts.join('\n\n') || UNAVAILABLE
}

function formatToxicity(details: PerenualDetails): string {
  const human = details.poisonous_to_humans
  const pets = details.poisonous_to_pets
  if (human == null && pets == null) return UNAVAILABLE
  const lines: string[] = []
  if (human != null) lines.push(`Humanos: ${human ? 'Tóxica' : 'No tóxica'}`)
  if (pets != null) lines.push(`Mascotas: ${pets ? 'Tóxica' : 'No tóxica'}`)
  return lines.join('. ')
}

function formatTemperature(details: PerenualDetails): string {
  const h = details.hardiness
  if (h?.min != null || h?.max != null) {
    const min = h.min ?? '?'
    const max = h.max ?? '?'
    return `Zona de rusticidad USDA: ${min}–${max}`
  }
  return UNAVAILABLE
}

function formatRepotting(details: PerenualDetails): string {
  const parts: string[] = []
  if (details.growth_rate) parts.push(`Crecimiento: ${details.growth_rate}`)
  if (details.maintenance) parts.push(`Mantenimiento: ${details.maintenance}`)
  const pruning = joinList(details.pruning_month)
  if (pruning) parts.push(`Poda / trasplante sugerido: ${pruning}`)
  return parts.join('. ') || UNAVAILABLE
}

function formatCharacteristics(details: PerenualDetails): string {
  const parts: string[] = []
  if (details.description) parts.push(details.description)
  const meta: string[] = []
  if (details.type) meta.push(`Tipo: ${details.type}`)
  if (details.cycle) meta.push(`Ciclo: ${details.cycle}`)
  if (meta.length) parts.push(meta.join(' · '))
  return parts.join('\n\n') || UNAVAILABLE
}

export function mapPerenualProfile(
  details: PerenualDetails,
  careGuides: CareGuideEntry[]
): SpeciesProfile {
  const careSections = careGuides.flatMap(g => g.section ?? [])
  const humidityGuide = careSectionText(careSections, 'humidity')
    || careSectionText(careSections, 'temperature')
  const fertilizingGuide = careSectionText(careSections, 'fertilizing')
    || careSectionText(careSections, 'fertilizer')

  return {
    perenualId: details.id,
    commonName: details.common_name ?? 'Desconocida',
    scientificName: details.scientific_name ?? [],
    imageUrl: details.default_image?.regular_url
      ?? details.default_image?.medium_url
      ?? null,
    imageLicense: details.default_image?.license_name ?? null,
    watering: formatWatering(details, careSections),
    light: formatLight(details, careSections),
    humidity: humidityGuide || UNAVAILABLE,
    fertilizing: fertilizingGuide || (details.maintenance ? `Mantenimiento: ${details.maintenance}` : UNAVAILABLE),
    soil: joinList(details.soil) || UNAVAILABLE,
    repotting: formatRepotting(details),
    toxicity: formatToxicity(details),
    characteristics: formatCharacteristics(details),
    temperature: formatTemperature(details),
    pestsAndProblems: joinList(details.pest_susceptibility) || UNAVAILABLE,
    fetchedAt: new Date().toISOString()
  }
}
