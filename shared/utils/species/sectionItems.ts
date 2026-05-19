import type { SpeciesDisplayIconTone } from '../../types/speciesDisplay'
import type { SpeciesCareFieldKey } from './profileCompleteness'

export interface SpeciesSectionItemRow {
  label: string
  sublabel?: string
  icon?: string
  iconTone?: SpeciesDisplayIconTone
}

export interface SpeciesSectionItems {
  rows: SpeciesSectionItemRow[]
  info?: string
}

export type SpeciesSectionItemsMap = Partial<Record<SpeciesCareFieldKey, SpeciesSectionItems>>

export const SECTION_DISPLAY_DEFAULTS: Record<
  SpeciesCareFieldKey,
  { icon: string, tone: SpeciesDisplayIconTone, rowSublabelKey: string, secondarySublabelKey?: string }
> = {
  watering: {
    icon: 'i-lucide-droplets',
    tone: 'blue',
    rowSublabelKey: 'species.wateringFrequency',
    secondarySublabelKey: 'species.wateringMethod'
  },
  light: {
    icon: 'i-lucide-sun',
    tone: 'amber',
    rowSublabelKey: 'species.lightPreferred'
  },
  humidity: {
    icon: 'i-lucide-cloud-rain',
    tone: 'blue',
    rowSublabelKey: 'species.humidityLevel',
    secondarySublabelKey: 'species.humidityMisting'
  },
  fertilizing: {
    icon: 'i-lucide-flask-conical',
    tone: 'brown',
    rowSublabelKey: 'species.fertilizingSchedule',
    secondarySublabelKey: 'species.fertilizingProduct'
  },
  soil: {
    icon: 'i-lucide-mountain',
    tone: 'brown',
    rowSublabelKey: 'species.soilType'
  },
  repotting: {
    icon: 'i-lucide-shovel',
    tone: 'brown',
    rowSublabelKey: 'species.repottingFrequency',
    secondarySublabelKey: 'species.repottingSeason'
  },
  toxicity: {
    icon: 'i-lucide-skull',
    tone: 'red',
    rowSublabelKey: 'species.toxicityLevel'
  },
  characteristics: {
    icon: 'i-lucide-sparkles',
    tone: 'primary',
    rowSublabelKey: 'species.characteristicTrait',
    secondarySublabelKey: 'species.cycleLabel'
  },
  temperature: {
    icon: 'i-lucide-thermometer',
    tone: 'amber',
    rowSublabelKey: 'species.idealTemperature'
  },
  pestsAndProblems: {
    icon: 'i-lucide-bug',
    tone: 'red',
    rowSublabelKey: 'species.commonIssue'
  }
}
