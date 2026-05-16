import { z } from 'zod'
import { VALIDATION_KEYS } from '../i18n/validationKeys'
import { placementSchema, windowOrientationSchema } from '../plants/schemas'

export const luminositySchema = z.enum(['low', 'medium', 'high', 'direct_sun'])

export const siteFormSchema = z.object({
  name: z.string().min(1, VALIDATION_KEYS.SITE_NAME_REQUIRED),
  placement: placementSchema.default('indoor'),
  window_orientation: windowOrientationSchema.optional().nullable(),
  luminosity: luminositySchema.optional().nullable(),
  has_ceiling_cover: z.boolean().default(false),
  notes: z.string().optional().default('')
})

export type SiteFormInput = z.infer<typeof siteFormSchema>
