import { z } from 'zod'
import { healthStatusSchema } from '../plants/schemas'

export const checkInFormSchema = z.object({
  health_status: healthStatusSchema,
  health_status_note: z.string().optional().nullable(),
  height_cm: z.coerce.number().positive().max(1000).optional().nullable(),
  new_leaves: z.boolean().default(false),
  dropped_leaves: z.boolean().default(false),
  flowering: z.boolean().default(false),
  size_changed: z.boolean().default(false),
  notes: z.string().optional().nullable()
})

export type CheckInFormInput = z.infer<typeof checkInFormSchema>
