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
