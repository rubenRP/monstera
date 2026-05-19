import type { SpeciesCareFieldKey } from '../utils/species/profileCompleteness'

export type SpeciesDisplayIconTone
  = 'primary'
    | 'blue'
    | 'amber'
    | 'red'
    | 'neutral'
    | 'purple'
    | 'brown'

export type SpeciesDisplayBlock
  = {
    kind: 'row'
    icon: string
    iconTone?: SpeciesDisplayIconTone
    label: string
    sublabel?: string
    badge?: string
  }
  | { kind: 'info', text: string }
  | { kind: 'tags', items: { label: string, tone?: SpeciesDisplayIconTone }[] }
  | {
    kind: 'range'
    label?: string
    min: number
    max: number
    unit: string
    scaleMin: number
    scaleMax: number
  }
  | {
    kind: 'monthTimeline'
    title: string
    description?: string
    startMonth: number
    endMonth: number
    label: string
  }
  | {
    kind: 'list'
    title?: string
    items: { label: string, icon?: string, iconTone?: SpeciesDisplayIconTone }[]
  }
  | { kind: 'paragraph', text: string }

export interface SpeciesSectionDisplay {
  title?: string
  blocks: SpeciesDisplayBlock[]
}

export type SpeciesProfileDisplay = Partial<Record<SpeciesCareFieldKey, SpeciesSectionDisplay>>

export type SpeciesTemperatureTimelineKind = 'indoor' | 'outdoorPot' | 'outdoorGround'

export interface SpeciesTemperatureTimeline {
  kind: SpeciesTemperatureTimelineKind
  startMonth: number
  endMonth: number
  label: string
  description?: string
}

export interface SpeciesTemperatureExtras {
  idealCelsiusMin?: number
  idealCelsiusMax?: number
  timelines: SpeciesTemperatureTimeline[]
  locationLabel?: string
}
