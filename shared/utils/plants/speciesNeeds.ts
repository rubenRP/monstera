import type { SpeciesProfile } from '../../types/species'
import type { SpeciesDisplayBlock } from '../../types/speciesDisplay'

export type LightNeed = 'shade' | 'medium' | 'bright' | 'direct'
export type HumidityNeed = 'low' | 'medium' | 'high'

export interface ParsedSpeciesNeeds {
  lightNeed: LightNeed | null
  humidityNeed: HumidityNeed | null
  prefersIndoor: boolean
  toleratesOutdoor: boolean
}

function appendBlockText(parts: string[], block: SpeciesDisplayBlock) {
  if (block.kind === 'row') {
    parts.push(block.label)
    if (block.sublabel) parts.push(block.sublabel)
  } else if (block.kind === 'info' || block.kind === 'paragraph') {
    parts.push(block.text)
  } else if (block.kind === 'tags') {
    for (const item of block.items) parts.push(item.label)
  }
}

function collectSpeciesText(profile: SpeciesProfile): string {
  const parts: string[] = []
  if (profile.light?.trim()) parts.push(profile.light)
  if (profile.humidity?.trim()) parts.push(profile.humidity)
  if (profile.characteristics?.trim()) parts.push(profile.characteristics)

  const lightBlocks = profile.display?.light?.blocks
  if (lightBlocks) {
    for (const block of lightBlocks) appendBlockText(parts, block)
  }
  const humidityBlocks = profile.display?.humidity?.blocks
  if (humidityBlocks) {
    for (const block of humidityBlocks) appendBlockText(parts, block)
  }

  return parts.join(' ').toLowerCase()
}

function parseLightNeed(text: string): LightNeed | null {
  if (/\b(direct\s+sun|full\s+sun|pleno\s+sol|sol\s+directo|full\s+sunlight)\b/i.test(text)) {
    return 'direct'
  }
  if (/\b(bright\s+indirect|bright\s+light|luz\s+brillante|indirect\s+bright|high\s+light|mucha\s+luz)\b/i.test(text)) {
    return 'bright'
  }
  if (/\b(full\s+shade|deep\s+shade|heavy\s+shade|sombra\s+plena|poca\s+luz|low\s+light|shade[- ]?loving)\b/i.test(text)) {
    return 'shade'
  }
  if (/\b(partial\s+shade|medium\s+light|luz\s+media|moderate\s+light|filtered\s+light)\b/i.test(text)) {
    return 'medium'
  }
  return null
}

function parseHumidityNeed(text: string): HumidityNeed | null {
  if (/\b(high\s+humidity|very\s+humid|alta\s+humedad|humedad\s+alta|tropical|humidifier|muy\s+húmed|muy\s+humed)\b/i.test(text)) {
    return 'high'
  }
  if (/\b(low\s+humidity|dry\s+air|dry\s+climate|baja\s+humedad|arid|árido|succulent|cactus|suculent)\b/i.test(text)) {
    return 'low'
  }
  if (/\b(moderate\s+humidity|average\s+humidity|humedad\s+media|humedad\s+moderada)\b/i.test(text)) {
    return 'medium'
  }
  return null
}

function parsePlacementPreference(text: string): Pick<ParsedSpeciesNeeds, 'prefersIndoor' | 'toleratesOutdoor'> {
  const hasIndoor = /\b(indoor|interior|inside|houseplant|planta\s+de\s+interior)\b/i.test(text)
  const hasOutdoor = /\b(outdoor|exterior|patio|garden|jardín|jardin)\b/i.test(text)
  return {
    prefersIndoor: hasIndoor && !hasOutdoor,
    toleratesOutdoor: hasOutdoor
  }
}

/** Heuristic parse of species profile text for growth-condition checks. */
export function parseSpeciesNeeds(
  profile: SpeciesProfile | null | undefined
): ParsedSpeciesNeeds | null {
  if (!profile) return null

  const text = collectSpeciesText(profile)
  if (!text.trim()) return null

  const placement = parsePlacementPreference(text)
  return {
    lightNeed: parseLightNeed(text),
    humidityNeed: parseHumidityNeed(text),
    ...placement
  }
}

export function hasReliableSpeciesNeeds(needs: ParsedSpeciesNeeds | null): boolean {
  if (!needs) return false
  return needs.lightNeed != null
    || needs.humidityNeed != null
    || needs.prefersIndoor
}
