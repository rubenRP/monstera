import { z } from 'zod'
import { VALIDATION_KEYS } from '../i18n/validationKeys'

export const healthStatusSchema = z.enum(['healthy', 'fair', 'sick', 'critical'])
export const plantAgeUnitSchema = z.enum(['months', 'years'])
export const placementSchema = z.enum(['indoor', 'outdoor', 'semi_outdoor'])
export const windowOrientationSchema = z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])
export const potSizeSchema = z.enum(['xs', 's', 'm', 'l', 'xl'])
export const potMaterialSchema = z.enum(['terracotta', 'plastic', 'ceramic', 'metal', 'other'])
export const substrateTypeSchema = z.enum([
  'universal', 'cactus_succulent', 'orchid', 'acid_loving', 'coco_coir', 'peat', 'other'
])

export const plantFormSchema = z.object({
  name: z.string().min(1, VALIDATION_KEYS.PLANT_NAME_REQUIRED),
  species: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
  health_status: healthStatusSchema.default('healthy'),
  health_status_note: z.string().optional().nullable(),
  watering_base_interval_days: z.coerce.number().int().min(1).max(90).default(7),
  fertilizing_interval_days: z.coerce.number().int().min(1).max(365).default(30),
  check_in_interval_days: z.coerce.number().int().min(7).max(180).default(30),
  site_id: z.string().uuid().optional().nullable(),
  window_distance_cm: z.coerce.number().int().min(0).max(500).optional().nullable(),
  pot_size: potSizeSchema.optional().nullable(),
  pot_diameter_cm: z.coerce.number().positive().max(200).optional().nullable(),
  pot_material: potMaterialSchema.optional().nullable(),
  has_drainage: z.boolean().optional().default(false),
  substrate_type: substrateTypeSchema.optional().nullable(),
  substrate_notes: z.string().optional().nullable(),
  height_cm: z.coerce.number().positive().max(1000).optional().nullable(),
  age_years: z.coerce.number().int().positive().optional().nullable(),
  age_unit: plantAgeUnitSchema.optional().nullable()
}).superRefine((data, ctx) => {
  if (data.age_years == null) return
  const unit = data.age_unit ?? 'years'
  const max = unit === 'months' ? 1200 : 200
  if (data.age_years > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_KEYS.PLANT_AGE_MAX,
      path: ['age_years']
    })
  }
})

export type PlantFormInput = z.infer<typeof plantFormSchema>

export const plantArchiveReasonSchema = z.enum(['died', 'gifted'])

export const archivePlantSchema = z.object({
  reason: plantArchiveReasonSchema
})

export type ArchivePlantInput = z.infer<typeof archivePlantSchema>

export const diagnoseRequestSchema = z.object({
  plantId: z.string().uuid(),
  symptoms: z.string().min(3, VALIDATION_KEYS.SYMPTOMS_MIN),
  imageBase64: z.string().optional(),
  mimeType: z.string().optional().default('image/jpeg')
})

export const recommendRequestSchema = z.object({
  plantId: z.string().uuid(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
})

export const diagnosisResponseSchema = z.object({
  probableCauses: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high']),
  immediateActions: z.array(z.string()),
  preventiveCare: z.array(z.string()),
  whenToWorry: z.string(),
  suggestedHealthStatus: healthStatusSchema,
  summary: z.string()
})

export const recommendResponseSchema = z.object({
  wateringAdvice: z.string(),
  fertilizingAdvice: z.string(),
  lightExposure: z.object({
    level: z.enum(['baja', 'media', 'alta']),
    summary: z.string()
  }),
  seasonalTips: z.array(z.string()),
  riskFlags: z.array(z.string()),
  environmentNotes: z.string(),
  suggestedWateringIntervalDays: z.number().int().min(1).max(90).optional(),
  suggestedWateringIntervalRationale: z.string().optional()
})

export type DiagnosisResponse = z.infer<typeof diagnosisResponseSchema>
export type RecommendResponse = z.infer<typeof recommendResponseSchema>
