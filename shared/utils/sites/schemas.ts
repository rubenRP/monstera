import { z } from 'zod'
import { placementSchema, windowOrientationSchema } from '../plants/schemas'

export const luminositySchema = z.enum(['low', 'medium', 'high', 'direct_sun'])

export const siteFormSchema = z.object({
  name: z.string().min(1, 'El nombre del sitio es obligatorio'),
  placement: placementSchema.default('indoor'),
  window_orientation: windowOrientationSchema.optional().nullable(),
  luminosity: luminositySchema.optional().nullable(),
  has_ceiling_cover: z.boolean().default(false),
  notes: z.string().optional().default('')
})

export type SiteFormInput = z.infer<typeof siteFormSchema>
