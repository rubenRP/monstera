import { z } from 'zod'

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
  pestsAndProblems: z.string().optional()
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
  pestsAndProblems: z.string().min(1)
})

export type SpeciesGenerateResponse = z.infer<typeof speciesGenerateResponseSchema>
