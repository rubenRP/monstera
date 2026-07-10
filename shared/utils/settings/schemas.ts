import { z } from 'zod'

export const indoorHumidityLevelSchema = z.enum(['auto', 'low', 'normal', 'high'])

export const userSettingsFormSchema = z.object({
  home_lat: z.number().min(-90).max(90).nullable(),
  home_lon: z.number().min(-180).max(180).nullable(),
  indoor_humidity: indoorHumidityLevelSchema.default('auto')
})

export type UserSettingsFormInput = z.infer<typeof userSettingsFormSchema>
