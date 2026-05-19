import { z } from 'zod'
import { SPECIES_CARE_FIELD_KEYS } from './profileCompleteness'

const monthSchema = z.number().int().min(1).max(12)

const iconToneSchema = z.enum(['primary', 'blue', 'amber', 'red', 'neutral', 'purple', 'brown'])

export const speciesSectionItemRowSchema = z.object({
  label: z.string().min(1),
  sublabel: z.string().optional(),
  icon: z.string().optional(),
  iconTone: iconToneSchema.optional()
})

export const speciesSectionItemsSchema = z.object({
  rows: z.array(speciesSectionItemRowSchema).min(1).max(6),
  info: z.string().optional()
})

const sectionItemsShape = Object.fromEntries(
  SPECIES_CARE_FIELD_KEYS.map(key => [key, speciesSectionItemsSchema.optional()])
) as Record<(typeof SPECIES_CARE_FIELD_KEYS)[number], typeof speciesSectionItemsSchema.optional>

export const speciesSectionItemsMapSchema = z.object(sectionItemsShape).partial()

export type SpeciesSectionItemsInput = z.infer<typeof speciesSectionItemsSchema>
export type SpeciesSectionItemsMapInput = z.infer<typeof speciesSectionItemsMapSchema>

export const speciesTemperatureTimelineSchema = z.object({
  kind: z.enum(['indoor', 'outdoorPot', 'outdoorGround']),
  startMonth: monthSchema,
  endMonth: monthSchema,
  label: z.string().min(1),
  description: z.string().optional()
})

export const speciesTemperatureExtrasSchema = z.object({
  idealCelsiusMin: z.number().optional(),
  idealCelsiusMax: z.number().optional(),
  timelines: z.array(speciesTemperatureTimelineSchema).min(1),
  locationLabel: z.string().optional()
})

export const speciesEnrichResponseSchema = z.object({
  commonName: z.string().optional(),
  scientificName: z.array(z.string()).optional(),
  watering: z.string().optional(),
  light: z.string().optional(),
  humidity: z.string().optional(),
  fertilizing: z.string().optional(),
  soil: z.string().optional(),
  repotting: z.string().optional(),
  toxicity: z.string().optional(),
  characteristics: z.string().optional(),
  temperature: z.string().optional(),
  pestsAndProblems: z.string().optional(),
  temperatureExtras: speciesTemperatureExtrasSchema.optional(),
  sectionItems: speciesSectionItemsMapSchema.optional()
})

export type SpeciesEnrichResponse = z.infer<typeof speciesEnrichResponseSchema>

export const speciesGenerateResponseSchema = z.object({
  commonName: z.string().min(1),
  scientificName: z.array(z.string()).min(1),
  watering: z.string().min(1),
  light: z.string().min(1),
  humidity: z.string().min(1),
  fertilizing: z.string().min(1),
  soil: z.string().min(1),
  repotting: z.string().min(1),
  toxicity: z.string().min(1),
  characteristics: z.string().min(1),
  temperature: z.string().min(1),
  pestsAndProblems: z.string().min(1),
  temperatureExtras: speciesTemperatureExtrasSchema.optional(),
  sectionItems: speciesSectionItemsMapSchema.optional()
})

export type SpeciesGenerateResponse = z.infer<typeof speciesGenerateResponseSchema>
